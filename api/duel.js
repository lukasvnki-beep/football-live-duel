// Online duels: two phones share one duel through a small Redis database (Upstash, connected in Vercel).
// Each player gets a secret token when they create or join; only they can change their own picks.
// Keys (all expire after 3 days):
//   duel:<code>:meta     fixture + teams + names
//   duel:<code>:p0 / p1  that player's picks, proposed forfeit, accepted flag (+ hashed token)
//   duel:<code>:powers   list of power-ups used, in order
//   duel:<code>:chat     last chat messages and emoji reactions between the two players
//   duel:<code>:coin     who picks first ({first: 0|1}), flipped when the friend joins
//   duel:<code>:dp:<n>   the nth draft pick (0-3), order first, other, first, other; no duplicates
//   reports              chat reports (newest first, last 500 kept, no expiry); each one is also emailed to GMAIL_USER
//   duel:<code>:start    when the duel started on a match already in progress (so earlier points don't count)

import crypto from 'node:crypto';
import { filterText } from './_filter.js';
import { checkGame, addGame, ipWho } from './_plan.js';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const TTL = 3 * 24 * 3600;

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('db ' + r.status);
  const out = await r.json();
  return out.map(x => { if (x.error) throw new Error(x.error); return x.result; });
}

const hashTok = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const newCode = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = ''; const b = crypto.randomBytes(8); for (const x of b) s += a[x % a.length]; return s; };
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const okCode = c => /^[a-z0-9]{8}$/.test(String(c || ''));

const creates = new Map();
const lastSay = new Map();
function limited(ip) {
  const now = Date.now(); let v = creates.get(ip);
  if (!v || now - v.start > 3600e3) { v = { start: now, count: 0 }; creates.set(ip, v); }
  v.count++; if (creates.size > 5000) creates.clear();
  return v.count > 30;
}

const GMAIL_USER = (process.env.GMAIL_USER || '').trim(), GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
async function mailReport(r) {
  if (!GMAIL_USER || !GMAIL_PASS) return;
  const { default: nodemailer } = await import('nodemailer');
  const t = nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
  const lines = r.chat.map(m => `[${new Date(m.at).toISOString().slice(11, 16)}] ${m.who}: ${m.t}`).join('\n');
  await t.sendMail({ from: `"Football Live Duel" <${GMAIL_USER}>`, to: GMAIL_USER, subject: `Chat report: ${r.by} reported ${r.about}`,
    text: `${r.by} reported ${r.about} in duel ${r.code}.\nReason: ${r.reason || '(none)'}\nReporter profile: ${r.byPid || 'guest'}\nReported profile: ${r.aboutPid || 'guest'}\n\nLast messages:\n${lines || '(no messages)'}\n` });
}

async function load(code) {
  const k = 'duel:' + code;
  const [meta, p0, p1, start, coin, d0, d1, d2, d3, pen0, pen1, powers, chat] = await redis([['MGET', k + ':meta', k + ':p0', k + ':p1', k + ':start', k + ':coin', k + ':dp:0', k + ':dp:1', k + ':dp:2', k + ':dp:3', k + ':pen:0', k + ':pen:1'], ['LRANGE', k + ':powers', '0', '-1'], ['LRANGE', k + ':chat', '-60', '-1']]).then(([m, pw, ch]) => [...m, pw, ch]);
  if (!meta) return null;
  return { meta: JSON.parse(meta), p: [p0 ? JSON.parse(p0) : null, p1 ? JSON.parse(p1) : null], powers: (powers || []).map(x => JSON.parse(x)), start: start ? JSON.parse(start) : null, coin: coin ? JSON.parse(coin) : null, dp: [d0, d1, d2, d3].filter(Boolean).map(x => JSON.parse(x)), pen: [pen0, pen1].map(x => x ? JSON.parse(x) : null), chat: (chat || []).map(x => JSON.parse(x)) };
}

// Half-time penalty shootout: each phone takes 5 kicks against the computer keeper; more goals wins ×2 for 5 min.
// If one player has played and the other hasn't 2 minutes later, the one who played wins.
const PEN_MS = 120000;
function penView(d, slot) {
  const p = d.pen || [null, null];
  if (!p[0] && !p[1]) return null;
  let done = false, winner = null;
  if (p[0] && p[1]) { done = true; winner = p[0].g > p[1].g ? 0 : p[1].g > p[0].g ? 1 : null; }
  else { const one = p[0] ? 0 : 1; if (Date.now() - p[one].at > PEN_MS) { done = true; winner = one; } }
  const first = p[0] && p[1] ? Math.min(p[0].at, p[1].at) : (p[0] || p[1]).at;
  return { played: [!!p[0], !!p[1]], goals: p.map((x, i) => x && (done || i === slot) ? x.g : null), done, winner, left: done ? 0 : Math.max(0, PEN_MS - (Date.now() - first)) };
}

// What a given player is allowed to see
function view(d, slot) {
  const both = !!(d.p[0] && d.p[0].ready && d.p[1] && d.p[1].ready);
  const players = d.p.map((p, i) => p && {
    name: p.name, ready: !!p.ready,
    picks: (both || i === slot) ? p.picks || [] : [],
    players: (both || i === slot) ? p.players || [] : [],
    dare: (both || i === slot) ? p.dare || '' : '',
    dareOk: !!p.dareOk,
    capt: (both || i === slot) ? (p.capt === 1 ? 1 : 0) : 0,
  });
  return { code: d.meta.code, fx: d.meta.fx, teams: d.meta.teams, slot, both, players, powers: d.powers, start: both ? d.start : null, draft: d.coin ? { first: d.coin.first, picks: d.dp } : null, chat: slot >= 0 ? d.chat : [], pen: both ? penView(d, slot) : null };
}

// Link a duel player to their profile (api/league.js) so the result counts in the rankings
async function profileId(pid, ptok) {
  if (!/^[a-z0-9]{8}$/.test(String(pid || '')) || !ptok) return null;
  const [v] = await redis([['GET', 'pl:' + pid]]);
  if (!v) return null; const p = JSON.parse(v);
  return (p.tok === hashTok(ptok) || (p.toks || []).includes(hashTok(ptok))) ? pid : null;
}

// Who is playing, for the free plan limit: the profile (with premium flag), or the network address without one
async function player(pid, ptok, ip) {
  const id = await profileId(pid, ptok);
  if (!id) return { id: null, who: ipWho(ip), p: null };
  const [v] = await redis([['GET', 'pl:' + id]]);
  return { id, who: id, p: v ? JSON.parse(v) : null };
}
const LIMIT = 402; // free plan limit reached: the app shows the Go premium screen

function slotOf(d, token) {
  const h = hashTok(token);
  return d.p.findIndex(p => p && p.tok === h);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return res.status(403).json({ error: 'Not allowed.' });
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Online play is not set up yet: connect an Upstash Redis database to this project in Vercel > Storage.' });

  try {
    if (req.method === 'GET') {
      const code = String(req.query.code || '');
      if (!okCode(code)) return res.status(400).json({ error: 'Invalid duel link.' });
      const d = await load(code);
      if (!d) return res.status(404).json({ error: 'This duel does not exist or has expired.' });
      const slot = req.query.token ? slotOf(d, req.query.token) : -1;
      return res.status(200).json(view(d, slot));
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';

    if (b.action === 'create') {
      if (limited(ip)) return res.status(429).json({ error: 'Too many new duels. Try again later.' });
      const fx = b.fx || {};
      if (!/^\d{1,9}$/.test(String(fx.apiId || ''))) return res.status(400).json({ error: 'Invalid match.' });
      const teams = {};
      for (const [k, t] of Object.entries(b.teams || {}).slice(0, 2)) teams[clean(k, 12)] = { name: clean(t.name, 60), short: clean(t.short, 4), color: clean(t.color, 30) };
      const pl = await player(b.pid, b.ptok, ip);
      const stop = await checkGame(redis, pl.who, pl.p);
      if (stop) return res.status(LIMIT).json({ error: stop, limit: true });
      const meta = { code: newCode(), created: Date.now(), teams,
        fx: { id: 'r' + fx.apiId, apiId: Number(fx.apiId), kind: 'real', home: clean(fx.home, 12), away: clean(fx.away, 12), comp: clean(fx.comp, 80), leagueId: Number(fx.leagueId) || 0, kickoff: clean(fx.kickoff, 40), status: clean(fx.status, 6), elapsed: Number(fx.elapsed) || null, goals: { home: null, away: null }, homeTeam: { id: Number(fx.homeTeam && fx.homeTeam.id) || 0, name: clean(fx.homeTeam && fx.homeTeam.name, 60) }, awayTeam: { id: Number(fx.awayTeam && fx.awayTeam.id) || 0, name: clean(fx.awayTeam && fx.awayTeam.name, 60) } } };
      const token = crypto.randomBytes(18).toString('hex');
      const k = 'duel:' + meta.code;
      await redis([
        ['SET', k + ':meta', JSON.stringify(meta), 'EX', String(TTL)],
        ['SET', k + ':p0', JSON.stringify({ name: filterText(clean(b.name, 14)) || 'Player 1', tok: hashTok(token), pid: pl.id }), 'EX', String(TTL)],
      ]);
      await addGame(redis, pl.who, pl.p);
      const d = await load(meta.code);
      return res.status(200).json({ token, state: view(d, 0) });
    }

    const code = String(b.code || '');
    if (!okCode(code)) return res.status(400).json({ error: 'Invalid duel link.' });
    const k = 'duel:' + code;
    const d = await load(code);
    if (!d) return res.status(404).json({ error: 'This duel does not exist or has expired.' });

    if (b.action === 'join') {
      if (d.p[1]) {
        const s = b.token ? slotOf(d, b.token) : -1;
        if (s >= 0) return res.status(200).json({ token: b.token, state: view(d, s) });
        return res.status(409).json({ error: 'Two players are already in this duel.' });
      }
      const token = crypto.randomBytes(18).toString('hex');
      const pl = await player(b.pid, b.ptok, ip), pid = pl.id;
      const stop = await checkGame(redis, pl.who, pl.p);
      if (stop) return res.status(LIMIT).json({ error: stop, limit: true });
      const ok = await redis([['SET', k + ':p1', JSON.stringify({ name: filterText(clean(b.name, 14)) || 'Player 2', tok: hashTok(token), pid }), 'EX', String(TTL), 'NX']]);
      if (!ok[0]) return res.status(409).json({ error: 'Two players are already in this duel.' });
      await addGame(redis, pl.who, pl.p);
      // Coin flip: decides who picks first
      if (b.draft) await redis([['SET', k + ':coin', JSON.stringify({ first: crypto.randomInt(2), at: Date.now() }), 'EX', String(TTL), 'NX']]);
      const d2 = await load(code);
      return res.status(200).json({ token, state: view(d2, 1) });
    }

    const slot = slotOf(d, b.token);
    if (slot < 0) return res.status(403).json({ error: 'You are not a player in this duel.' });
    const me = d.p[slot];

    if (b.action === 'picks') {
      if (me.ready) return res.status(409).json({ error: 'Your picks are already locked.' });
      const picks = (Array.isArray(b.picks) ? b.picks : []).map(x => clean(x, 24)).filter(Boolean).slice(0, 2);
      if (picks.length !== 2) return res.status(400).json({ error: 'Pick exactly 2 players.' });
      const players = (Array.isArray(b.players) ? b.players : []).slice(0, 2).map(p => ({ id: clean(p.id, 24), team: clean(p.team, 12), name: clean(p.name, 60), pos: clean(p.pos, 4), num: clean(p.num, 3) }));
      const upd = { ...me, picks, players, dare: filterText(clean(b.dare, 120)), capt: b.capt === 1 ? 1 : 0, ready: true };
      await redis([['SET', k + ':p' + slot, JSON.stringify(upd), 'KEEPTTL']]);
    } else if (b.action === 'pick') {
      // Turn-by-turn draft after the coin flip: first, other, first, other. A player can only be picked once.
      if (!d.coin) return res.status(409).json({ error: 'Waiting for your friend to join.' });
      const n = d.dp.length;
      if (n >= 4) return res.status(409).json({ error: 'All players are picked.' });
      const turn = n % 2 === 0 ? d.coin.first : 1 - d.coin.first;
      if (turn !== slot) return res.status(409).json({ error: "It's not your turn." });
      const id = String(b.id || '');
      if (!/^[a-z0-9]{1,24}$/.test(id)) return res.status(400).json({ error: 'Invalid player.' });
      if (d.dp.some(x => x.id === id)) return res.status(409).json({ error: 'That player is already taken.' });
      const pl = b.pl || {};
      const entry = { s: slot, id, pl: { id, team: clean(pl.team, 12), name: clean(pl.name, 60), pos: clean(pl.pos, 4), num: clean(pl.num, 3) }, at: Date.now() };
      const [got] = await redis([['SET', k + ':dp:' + n, JSON.stringify(entry), 'EX', String(TTL), 'NX']]);
      if (!got) return res.status(409).json({ error: 'Too slow, try again.' });
      if (n === 3) {
        const all = [...d.dp, entry];
        const cmds = [0, 1].map(s2 => { const mine = all.filter(x => x.s === s2); const p = d.p[s2];
          return ['SET', k + ':p' + s2, JSON.stringify({ ...p, picks: mine.map(x => x.id), players: mine.map(x => x.pl), ready: true }), 'KEEPTTL']; });
        await redis(cmds);
      }
    } else if (b.action === 'dare') {
      if (d.start) return res.status(409).json({ error: 'The duel has already started.' });
      await redis([['SET', k + ':p' + slot, JSON.stringify({ ...me, dare: filterText(clean(b.dare, 120)), dareOk: false }), 'KEEPTTL']]);
    } else if (b.action === 'consent') {
      // Accept or refuse the forfeit the OTHER player proposed for me
      const o = 1 - slot, other = d.p[o];
      if (!other || !other.dare) return res.status(400).json({ error: 'There is no forfeit to answer.' });
      const upd = b.accept ? { ...other, dareOk: true } : { ...other, dare: '', dareOk: false };
      await redis([['SET', k + ':p' + o, JSON.stringify(upd), 'KEEPTTL']]);
    } else if (b.action === 'say') {
      // Chat message or quick emoji reaction, only between the two players of this duel
      const text = filterText(clean(b.text, 200));
      if (!text) return res.status(400).json({ error: 'Empty message.' });
      const lk = code + ':' + slot, now = Date.now();
      if (now - (lastSay.get(lk) || 0) < 300) return res.status(429).json({ error: 'Slow down a little.' });
      lastSay.set(lk, now); if (lastSay.size > 5000) lastSay.clear();
      const m = { s: slot, t: text, e: b.emoji ? 1 : 0, at: now, id: crypto.randomBytes(4).toString('hex') };
      await redis([['RPUSH', k + ':chat', JSON.stringify(m)], ['LTRIM', k + ':chat', '-200', '-1'], ['EXPIRE', k + ':chat', String(TTL)]]);
    } else if (b.action === 'report') {
      // Report the other player: saves the duel's recent chat for review (once per player per duel)
      const [first] = await redis([['SET', k + ':rep:' + slot, '1', 'EX', String(TTL), 'NX']]);
      if (first) {
        const o = 1 - slot, rep = { at: Date.now(), code, by: d.p[slot] && d.p[slot].name, byPid: d.p[slot] && d.p[slot].pid || null,
          about: d.p[o] && d.p[o].name, aboutPid: d.p[o] && d.p[o].pid || null, reason: clean(b.reason, 200),
          chat: d.chat.slice(-30).map(m => ({ who: d.p[m.s] && d.p[m.s].name, t: m.t, at: m.at })) };
        await redis([['LPUSH', 'reports', JSON.stringify(rep)], ['LTRIM', 'reports', '0', '499']]);
        await mailReport(rep).catch(() => {});
      }
    } else if (b.action === 'final') {
      // First phone to reach full time records the result; it counts once for both profiles
      const other = d.p[1 - slot];
      if (!me.ready || !other || !other.ready) return res.status(409).json({ error: 'The duel has not started.' });
      const tot = (Array.isArray(b.tot) ? b.tot : []).slice(0, 2).map(v => Math.max(-9999, Math.min(9999, Math.round(Number(v) || 0))));
      if (tot.length !== 2) return res.status(400).json({ error: 'Invalid result.' });
      const [first] = await redis([['SET', k + ':final', JSON.stringify({ tot, by: slot, at: Date.now() }), 'EX', String(TTL), 'NX']]);
      const pids = [d.p[0].pid, d.p[1].pid];
      if (first && pids[0] && pids[1] && pids[0] !== pids[1]) {
        const [a, c] = await redis([['MGET', 'pl:' + pids[0], 'pl:' + pids[1]]]).then(([v]) => v);
        const profs = [a, c].map(x => x && JSON.parse(x));
        const cmds = [];
        profs.forEach((pr, i) => {
          if (!pr) return;
          const res2 = tot[i] > tot[1 - i] ? 'w' : tot[i] < tot[1 - i] ? 'l' : 'd';
          pr[res2] = (pr[res2] || 0) + 1; pr.games = (pr.games || 0) + 1; pr.pts = (pr.pts || 0) + tot[i];
          pr.streak = res2 === 'w' ? (pr.streak || 0) + 1 : 0; pr.best = Math.max(pr.best || 0, pr.streak);
          cmds.push(['SET', 'pl:' + pids[i], JSON.stringify(pr)], ['ZADD', 'lb:wins', String(pr.w || 0), pids[i]]);
        });
        cmds.push(['SADD', 'fr:' + pids[0], pids[1]], ['SADD', 'fr:' + pids[1], pids[0]]);
        await redis(cmds);
      }
    } else if (b.action === 'start') {
      // First phone to open the live match records the starting point; the other phone reuses it.
      const other = d.p[1 - slot];
      if (!me.ready || !other || !other.ready) return res.status(409).json({ error: 'Both players must lock their picks first.' });
      const s = b.start || {};
      const ids = new Set([...(me.picks || []), ...(other.picks || [])]);
      const num = v => Math.max(0, Math.min(999, Math.floor(Number(v) || 0)));
      const base = {};
      for (const [id, st] of Object.entries(s.base || {})) {
        if (!ids.has(id) || !st || typeof st !== 'object') continue;
        const o = {}; for (const key of ['goals', 'assists', 'yellow', 'red', 'tackles', 'interceptions', 'shotsOn', 'shotsOff', 'keyPasses', 'dribbles', 'duelsWon', 'foulsDrawn', 'penWon', 'penMissed', 'penSaved', 'saves', 'fouls', 'passes', 'passFail', 'minutes']) o[key] = num(st[key]);
        base[id] = o;
      }
      const start = { el: Math.max(0, Math.min(130, Number(s.el) || 0)), keys: (Array.isArray(s.keys) ? s.keys : []).slice(0, 200).map(x => clean(x, 60)), base };
      await redis([['SET', k + ':start', JSON.stringify(start), 'EX', String(TTL), 'NX']]);
    } else if (b.action === 'power') {
      // Power-ups (double, neg, shield) and the one player swap per game share this list
      const type = ['double', 'neg', 'shield', 'swap'].includes(b.type) ? b.type : null;
      if (!type) return res.status(400).json({ error: 'Unknown power-up.' });
      if (d.powers.some(p => p.owner === slot && p.type === type)) return res.status(409).json({ error: 'Already used.' });
      // Final 10': no new power-ups from the 80th minute (the swap stays allowed)
      if (type !== 'swap' && Number(b.from) >= 80) return res.status(409).json({ error: 'Power-ups are locked in the final 10 minutes.' });
      const okId = v => /^[a-z0-9]{1,24}$/.test(String(v || ''));
      const num = v => Math.max(0, Math.min(999, Math.floor(Number(v) || 0)));
      const snap = o => { const r = {}; if (o && typeof o === 'object') for (const [k2, v] of Object.entries(o).slice(0, 30)) if (/^[a-zA-Z]{1,16}$/.test(k2)) r[k2] = num(v); return r; };
      const p = { owner: slot, type, from: Math.max(0, Math.min(130, Number(b.from) || 0)), lbl: clean(b.lbl, 8), ord: Number(b.ord) || 0,
        seen: (Array.isArray(b.seen) ? b.seen : []).slice(0, 300).map(Number), at: Date.now() };
      if (type === 'double' || type === 'neg') { if (!okId(b.target)) return res.status(400).json({ error: 'Invalid player.' }); p.target = b.target; }
      if (type === 'swap') {
        if (!okId(b.out) || !okId(b.in) || b.out === b.in) return res.status(400).json({ error: 'Invalid player.' });
        Object.assign(p, { k: b.k === 1 ? 1 : 0, out: b.out, in: b.in, keys: (Array.isArray(b.keys) ? b.keys : []).slice(0, 300).map(x => clean(x, 60)), snapOut: snap(b.snapOut), snapIn: snap(b.snapIn),
          pl: b.pl && typeof b.pl === 'object' ? { id: b.in, team: clean(b.pl.team, 12), name: clean(b.pl.name, 60), pos: clean(b.pl.pos, 4), num: clean(b.pl.num, 3) } : null });
      }
      await redis([['RPUSH', k + ':powers', JSON.stringify(p)], ['EXPIRE', k + ':powers', String(TTL)]]);
    } else if (b.action === 'pen') {
      const other = d.p[1 - slot];
      if (!me.ready || !other || !other.ready) return res.status(409).json({ error: 'The duel has not started.' });
      if (d.pen[slot]) return res.status(409).json({ error: 'You already took your penalties.' });
      const o = d.pen[1 - slot];
      if (o && Date.now() - o.at > PEN_MS) return res.status(409).json({ error: 'Too late: the 2 minutes are over.' });
      const g = Math.max(0, Math.min(5, Math.floor(Number(b.goals) || 0)));
      await redis([['SET', k + ':pen:' + slot, JSON.stringify({ g, at: Date.now() }), 'EX', String(TTL), 'NX']]);
    } else {
      return res.status(400).json({ error: 'Unknown action.' });
    }
    const d3 = await load(code);
    return res.status(200).json({ state: view(d3, slot) });
  } catch (e) {
    return res.status(502).json({ error: 'The duel server had a problem. Try again in a moment.' });
  }
}
