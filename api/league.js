// Player profiles, friends and rankings for online duels (same Upstash Redis as the duels).
// Keys (no expiry):
//   pl:<id>      JSON {name, tok (hashed), w, d, l, streak, best, pts, games, at}
//   fr:<id>      set of friend ids
//   lb:wins      sorted set: wins per player (global top list)
import crypto from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const hashTok = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const okId = c => /^[a-z0-9]{8}$/.test(String(c || ''));
const newId = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (const x of crypto.randomBytes(8)) s += a[x % a.length]; return s; };
const pub = (id, p) => p && { id, name: p.name, w: p.w || 0, d: p.d || 0, l: p.l || 0, streak: p.streak || 0, best: p.best || 0, pts: p.pts || 0, games: p.games || 0 };

const regs = new Map();
function limited(ip) { const now = Date.now(); let v = regs.get(ip); if (!v || now - v.start > 3600e3) { v = { start: now, count: 0 }; regs.set(ip, v); } v.count++; if (regs.size > 5000) regs.clear(); return v.count > 20; }

async function getMany(ids) {
  if (!ids.length) return [];
  const [vals] = await redis([['MGET', ...ids.map(i => 'pl:' + i)]]);
  return ids.map((id, n) => vals[n] ? pub(id, JSON.parse(vals[n])) : null).filter(Boolean);
}
async function auth(id, token) {
  if (!okId(id) || !token) return null;
  const [v] = await redis([['GET', 'pl:' + id]]);
  if (!v) return null; const p = JSON.parse(v);
  return (p.tok === hashTok(token) || (p.toks || []).includes(hashTok(token))) ? p : null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return res.status(403).json({ error: 'Not allowed.' });
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Online play is not set up yet.' });
  try {
    if (req.method === 'GET') {
      const me = await auth(String(req.query.id || ''), req.query.token);
      if (!me) return res.status(403).json({ error: 'Profile not found.' });
      const id = String(req.query.id);
      const [fr, top] = await redis([['SMEMBERS', 'fr:' + id], ['ZREVRANGE', 'lb:wins', '0', '19']]);
      const friends = await getMany([id, ...(fr || []).slice(0, 100)]);
      const topList = await getMany(top || []);
      return res.status(200).json({ me: pub(id, me), friends, top: topList, email: me.email || '', google: !!me.google, data: me.data || null });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (b.action === 'register') {
      if (limited(ip)) return res.status(429).json({ error: 'Too many new profiles. Try again later.' });
      const id = newId(), token = crypto.randomBytes(18).toString('hex');
      const p = { name: clean(b.name, 14) || 'Player', tok: hashTok(token), w: 0, d: 0, l: 0, streak: 0, best: 0, pts: 0, games: 0, at: Date.now() };
      await redis([['SET', 'pl:' + id, JSON.stringify(p), 'NX']]);
      return res.status(200).json({ id, token, me: pub(id, p) });
    }
    const me = await auth(b.id, b.token);
    if (!me) return res.status(403).json({ error: 'Profile not found.' });
    if (b.action === 'rename') {
      me.name = clean(b.name, 14) || me.name;
      if (me.data) me.data.name = me.name;
      await redis([['SET', 'pl:' + b.id, JSON.stringify(me)]]);
      return res.status(200).json({ me: pub(b.id, me) });
    }
    if (b.action === 'addfriend') {
      const code = String(b.code || '').toLowerCase().trim();
      if (!okId(code) || code === b.id) return res.status(400).json({ error: 'That friend code is not valid.' });
      const [exists] = await redis([['EXISTS', 'pl:' + code]]);
      if (!exists) return res.status(404).json({ error: 'No player has that friend code.' });
      await redis([['SADD', 'fr:' + b.id, code], ['SADD', 'fr:' + code, b.id]]);
      return res.status(200).json({ ok: true });
    }
    if (b.action === 'unfriend') {
      const code = String(b.code || '');
      if (okId(code)) await redis([['SREM', 'fr:' + b.id, code], ['SREM', 'fr:' + code, b.id]]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    return res.status(502).json({ error: 'The server had a problem. Try again in a moment.' });
  }
}
