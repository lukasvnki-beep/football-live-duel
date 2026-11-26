// Tiny relay that runs on Lukas's own Hetzner server, so API-Football always sees ONE dedicated IP.
// Vercel (api/football.js) calls this relay instead of API-Football directly.
// - Only the same 3 read-only API paths the app uses are allowed.
// - The caller must send the same API key that is stored on this server (Vercel already has it),
//   so strangers cannot use this server to talk to API-Football.
// - A global cap of 30 calls per minute protects the IP even if something goes wrong.
import http from 'node:http';
import crypto from 'node:crypto';

const KEY = process.env.API_FOOTBALL_KEY || '';
const ALLOWED = new Set(['fixtures', 'fixtures/lineups', 'players/squads']);
const PER_MIN = 30;
let win = 0, count = 0;

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const send = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://relay');
    if (u.pathname === '/health') return send(res, 200, { ok: true, keySet: KEY.length > 10 });
    if (req.method !== 'GET') return send(res, 405, { errors: { relay: 'Only GET is allowed.' } });
    const path = u.pathname.replace(/^\/+/, '');
    if (!ALLOWED.has(path)) return send(res, 404, { errors: { relay: 'Not allowed.' } });
    if (!KEY || !same(req.headers['x-apisports-key'] || '', KEY)) return send(res, 403, { errors: { relay: 'Forbidden.' } });
    const now = Date.now(); if (now - win > 60e3) { win = now; count = 0 }
    if (++count > PER_MIN) return send(res, 429, { errors: { relay: 'Too many requests, wait a minute.' } });
    const r = await fetch('https://v3.football.api-sports.io/' + path + u.search, { headers: { 'x-apisports-key': KEY } });
    const body = Buffer.from(await r.arrayBuffer());
    const h = { 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': 'no-store' };
    for (const n of ['x-ratelimit-requests-remaining', 'x-ratelimit-requests-limit']) { const v = r.headers.get(n); if (v) h[n] = v; }
    res.writeHead(r.status, h); res.end(body);
  } catch (e) {
    send(res, 502, { errors: { relay: 'Could not reach API-Football.' } });
  }
}).listen(8080, '127.0.0.1', () => console.log('relay listening on 127.0.0.1:8080'));
