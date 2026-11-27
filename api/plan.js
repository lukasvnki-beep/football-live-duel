// Free vs premium. POST {action:'get', id, token} -> { premium, day, week, limits, canTest }
//                  POST {action:'test', id, token, on} -> turns premium on/off for testing (no payment yet).
// Testing is allowed on preview deployments, for the app's own account (liveduelfootball@gmail.com),
// and for any email listed in the Vercel env var PREMIUM_TESTERS (comma separated).
// Rules and counting live in api/_plan.js.
import crypto from 'node:crypto';
import { usage, ipWho } from './_plan.js';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const PREVIEW = process.env.VERCEL_ENV !== 'production';
const TESTERS = ['liveduelfootball@gmail.com', ...String(process.env.PREMIUM_TESTERS || '').split(',')].map(e => e.trim().toLowerCase()).filter(Boolean);

async function redis(cmds) {
  const r = await fetch(URL_ + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const okId = c => /^[a-z0-9]{8}$/.test(String(c || ''));
const canTest = p => PREVIEW || !!(p && p.email && TESTERS.includes(String(p.email).toLowerCase()));

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return res.status(403).json({ error: 'Not allowed.' });
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Not set up yet.' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    let id = null, p = null;
    if (okId(b.id) && b.token) {
      const [v] = await redis([['GET', 'pl:' + b.id]]);
      const q = v ? JSON.parse(v) : null;
      if (q && (q.tok === sha(b.token) || (q.toks || []).includes(sha(b.token)))) { id = String(b.id); p = q; }
    }
    if (b.action === 'test') {
      if (!p) return res.status(403).json({ error: 'Please sign in again.' });
      if (!canTest(p)) return res.status(403).json({ error: 'Premium can only be switched on with a payment (coming soon).' });
      p.premium = !!b.on;
      await redis([['SET', 'pl:' + id, JSON.stringify(p)]]);
    }
    const u = await usage(redis, id || ipWho(ip), p);
    return res.status(200).json({ ...u, canTest: canTest(p) });
  } catch (e) {
    console.error('plan error', e && e.message);
    return res.status(502).json({ error: 'The server had a problem. Try again in a moment.' });
  }
}
