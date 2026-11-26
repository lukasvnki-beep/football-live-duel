// Real accounts: sign in with a 6-digit code sent by email (or with Google), on any phone.
// An account is the same player profile as api/league.js (pl:<id>), with an email attached.
// Keys:
//   pl:<id>        profile JSON; adds email, google, toks (hashed tokens, one per signed-in phone), data {name, history}
//   acct:em:<h>    profile id for an email (h = sha256 of the lowercase email)
//   acct:g:<sub>   profile id for a Google account
//   code:<h>       pending sign-in code (hashed), expires after 10 minutes
//   rl:em:<h>      codes sent to that email in the last hour
//
// Email is sent from a Gmail account with an app password (Vercel env vars GMAIL_USER and GMAIL_APP_PASSWORD).
// Google sign-in needs GOOGLE_CLIENT_ID. Until email is set up, preview deployments show the code on screen.
import crypto from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const GMAIL_USER = process.env.GMAIL_USER, GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID || '';
const PREVIEW = process.env.VERCEL_ENV !== 'production';
const MAIL_ON = !!(GMAIL_USER && GMAIL_PASS);

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const okId = c => /^[a-z0-9]{8}$/.test(String(c || ''));
const newId = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (const x of crypto.randomBytes(8)) s += a[x % a.length]; return s; };
const normEmail = e => String(e || '').trim().toLowerCase();
const okEmail = e => e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const pub = (id, p) => ({ id, name: p.name, w: p.w || 0, d: p.d || 0, l: p.l || 0, streak: p.streak || 0, best: p.best || 0, pts: p.pts || 0, games: p.games || 0 });
const tokOk = (p, t) => !!t && (p.tok === sha(t) || (p.toks || []).includes(sha(t)));

const hits = new Map();
function limited(key, max) { const now = Date.now(); let v = hits.get(key); if (!v || now - v.start > 3600e3) { v = { start: now, count: 0 }; hits.set(key, v); } v.count++; if (hits.size > 5000) hits.clear(); return v.count > max; }

async function getProfile(id) { if (!okId(id)) return null; const [v] = await redis([['GET', 'pl:' + id]]); return v ? JSON.parse(v) : null; }
async function auth(id, token) { const p = await getProfile(id); return p && tokOk(p, token) ? p : null; }

// Merge duel history lists from two phones: keep each duel once (by its time), newest first
function mergeHistory(a, b) {
  const seen = new Set(), out = [];
  [...(a || []), ...(b || [])].sort((x, y) => (y.at || 0) - (x.at || 0)).forEach(x => { if (x && x.at && !seen.has(x.at)) { seen.add(x.at); out.push(x); } });
  return out.slice(0, 30);
}
const cleanData = d => {
  d = d && typeof d === 'object' ? d : {};
  const history = (Array.isArray(d.history) ? d.history : []).slice(0, 30).filter(x => x && typeof x === 'object');
  const s = JSON.stringify(history);
  return { name: clean(d.name, 14), history: s.length < 40000 ? history : [] };
};

async function sendMail(to, code) {
  const { default: nodemailer } = await import('nodemailer');
  const t = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
  await t.sendMail({
    from: `"Football Live Duel" <${GMAIL_USER}>`, to,
    subject: `${code} is your Football Live Duel code`,
    text: `Your sign-in code is ${code}\n\nIt works for 10 minutes. If you did not ask for it, you can ignore this email.\n\nFootball Live Duel`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px;margin:auto;padding:24px"><h2 style="margin:0 0 8px">Football Live Duel</h2><p>Your sign-in code is</p><p style="font-size:34px;font-weight:800;letter-spacing:6px;margin:8px 0">${code}</p><p style="color:#666">It works for 10 minutes. If you did not ask for it, you can ignore this email.</p></div>`,
  });
}

// Check a Google sign-in credential (an ID token from Google's button) with Google
async function googleUser(credential) {
  if (!GOOGLE_ID || !credential) return null;
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(credential).slice(0, 4096)));
  if (!r.ok) return null;
  const t = await r.json();
  if (t.aud !== GOOGLE_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(t.iss) || Number(t.exp) * 1000 < Date.now()) return null;
  return { sub: String(t.sub), email: t.email_verified === 'true' || t.email_verified === true ? normEmail(t.email) : '' };
}

// Fold a guest profile from this phone into an existing account, then delete the guest profile
async function mergeInto(aid, a, gid, g) {
  for (const k of ['w', 'd', 'l', 'pts', 'games']) a[k] = (a[k] || 0) + (g[k] || 0);
  a.best = Math.max(a.best || 0, g.best || 0);
  a.data = { name: (a.data && a.data.name) || '', history: mergeHistory(a.data && a.data.history, g.data && g.data.history) };
  const [fr] = await redis([['SMEMBERS', 'fr:' + gid]]);
  const cmds = [];
  (fr || []).filter(f => f !== aid && okId(f)).forEach(f => cmds.push(['SADD', 'fr:' + aid, f], ['SREM', 'fr:' + f, gid], ['SADD', 'fr:' + f, aid]));
  cmds.push(['DEL', 'pl:' + gid, 'fr:' + gid], ['ZREM', 'lb:wins', gid], ['SREM', 'fr:' + aid, gid]);
  if (a.w) cmds.push(['ZADD', 'lb:wins', String(a.w), aid]);
  await redis(cmds);
}

// Finish a sign-in: find the account for this email/Google id, or turn this phone's profile into one
async function signIn({ email, gsub }, b) {
  const keys = [email && 'acct:em:' + sha(email), gsub && 'acct:g:' + gsub].filter(Boolean);
  const found = (await redis([['MGET', ...keys]]))[0].find(Boolean);
  const gid = okId(b.id) ? String(b.id) : null, guest = gid ? await auth(gid, b.token) : null;
  const local = cleanData(b.data);
  let id, p, token = crypto.randomBytes(18).toString('hex'), merged = false;
  if (found && (p = await getProfile(found))) {
    id = found;
    if (guest && gid !== id && !guest.email && !guest.google) { await mergeInto(id, p, gid, guest); merged = true; }
  } else if (guest && !guest.email && !guest.google) {
    id = gid; p = guest; // first sign-in on this phone: the local profile becomes the account
  } else {
    id = newId(); p = { name: local.name || 'Player', w: 0, d: 0, l: 0, streak: 0, best: 0, pts: 0, games: 0, at: Date.now() };
  }
  if (email && !p.email) p.email = email;
  if (gsub) p.google = gsub;
  if (!p.data) p.data = { name: '', history: [] };
  p.data.history = mergeHistory(p.data.history, local.history);
  if (!p.data.name) p.data.name = local.name || p.name;
  p.toks = [...(p.toks || []), sha(token)].slice(-10);
  const cmds = [['SET', 'pl:' + id, JSON.stringify(p)]];
  if (p.email) cmds.push(['SET', 'acct:em:' + sha(p.email), id]);
  if (p.google) cmds.push(['SET', 'acct:g:' + p.google, id]);
  await redis(cmds);
  return { id, token, email: p.email || '', google: !!p.google, merged, me: pub(id, p), data: p.data };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return res.status(403).json({ error: 'Not allowed.' });
  if (req.method === 'GET') return res.status(200).json({ google: GOOGLE_ID || null, email: MAIL_ON || PREVIEW });
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Accounts are not set up yet.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    if (b.action === 'sendcode') {
      const email = normEmail(b.email);
      if (!okEmail(email)) return res.status(400).json({ error: 'That email address does not look right.' });
      if (!MAIL_ON && !PREVIEW) return res.status(503).json({ error: 'Email sign-in is not set up yet.' });
      if (limited('ip:' + ip, 15)) return res.status(429).json({ error: 'Too many codes asked. Try again in an hour.' });
      const h = sha(email);
      const [n] = await redis([['INCR', 'rl:em:' + h], ['EXPIRE', 'rl:em:' + h, '3600', 'NX']]);
      if (n > 5) return res.status(429).json({ error: 'Too many codes for this email. Try again in an hour.' });
      const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
      await redis([['SET', 'code:' + h, JSON.stringify({ c: sha(code + h), n: 0 }), 'EX', '600']]);
      if (MAIL_ON) { await sendMail(email, code); return res.status(200).json({ ok: true }); }
      return res.status(200).json({ ok: true, devCode: code }); // preview without email set up: show the code
    }

    if (b.action === 'verify') {
      const email = normEmail(b.email), h = sha(email), code = String(b.code || '').replace(/\D/g, '');
      if (!okEmail(email) || code.length !== 6) return res.status(400).json({ error: 'Enter the 6-digit code from the email.' });
      const [v] = await redis([['GET', 'code:' + h]]);
      if (!v) return res.status(400).json({ error: 'This code has expired. Ask for a new one.' });
      const c = JSON.parse(v);
      if (c.c !== sha(code + h)) {
        c.n++;
        await redis(c.n >= 5 ? [['DEL', 'code:' + h]] : [['SET', 'code:' + h, JSON.stringify(c), 'KEEPTTL']]);
        return res.status(400).json({ error: c.n >= 5 ? 'Too many wrong codes. Ask for a new one.' : 'Wrong code. Check the email and try again.' });
      }
      await redis([['DEL', 'code:' + h]]);
      return res.status(200).json(await signIn({ email }, b));
    }

    if (b.action === 'google') {
      if (limited('g:' + ip, 30)) return res.status(429).json({ error: 'Too many tries. Try again later.' });
      const g = await googleUser(b.credential);
      if (!g) return res.status(400).json({ error: 'Google sign-in did not work. Try again.' });
      return res.status(200).json(await signIn({ email: g.email, gsub: g.sub }, b));
    }

    const me = await auth(b.id, b.token);
    if (!me) return res.status(403).json({ error: 'Please sign in again.' });
    const id = String(b.id);

    if (b.action === 'sync') { // save this phone's name and duel history to the account
      const local = cleanData(b.data);
      me.data = { name: local.name || (me.data && me.data.name) || me.name, history: b.data && b.data.clear ? [] : mergeHistory(me.data && me.data.history, local.history) };
      await redis([['SET', 'pl:' + id, JSON.stringify(me)]]);
      return res.status(200).json({ data: me.data, email: me.email || '', google: !!me.google });
    }

    if (b.action === 'signout') {
      me.toks = (me.toks || []).filter(t => t !== sha(b.token));
      if (me.tok === sha(b.token)) delete me.tok;
      await redis([['SET', 'pl:' + id, JSON.stringify(me)]]);
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'delete') { // really delete: profile, friends links, ranking, email and Google links
      const [fr] = await redis([['SMEMBERS', 'fr:' + id]]);
      const cmds = (fr || []).filter(okId).map(f => ['SREM', 'fr:' + f, id]);
      cmds.push(['DEL', 'pl:' + id, 'fr:' + id], ['ZREM', 'lb:wins', id]);
      if (me.email) cmds.push(['DEL', 'acct:em:' + sha(me.email), 'code:' + sha(me.email), 'rl:em:' + sha(me.email)]);
      if (me.google) cmds.push(['DEL', 'acct:g:' + me.google]);
      await redis(cmds);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    return res.status(502).json({ error: 'The server had a problem. Try again in a moment.' });
  }
}
