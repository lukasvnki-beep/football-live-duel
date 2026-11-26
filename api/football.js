// Small private proxy between the app and API-Football.
// The API key lives only in Vercel's environment variables (API_FOOTBALL_KEY),
// so it is never sent to phones or visible in the page.
//
// Abuse protection (so nobody can burn through the daily API quota):
// 1. Only a few API paths and params are allowed, and their values are checked.
// 2. Answers are cached by the CDN and inside the function, keyed on the cleaned
//    params only, so adding junk params to the URL does not force a new API call.
// 3. Each visitor (IP address) gets a limited number of fresh API calls per 10 minutes.
// 4. Requests from other websites are refused.
// 5. A safety reserve stops non-essential calls when the daily quota is nearly used up.

import { mock } from './_mock.js';

const BASE = 'https://v3.football.api-sports.io/';
// Only the production site talks to API-Football. Preview links get fake matches (no requests spent).
const USE_MOCK = process.env.VERCEL_ENV !== 'production';

const ALLOWED = {
  'fixtures':         { params: ['date', 'id', 'live', 'timezone'] },
  'fixtures/lineups': { params: ['fixture'] },
  'players/squads':   { params: ['team'] },
};
const CHECK = {
  date: v => /^\d{4}-\d{2}-\d{2}$/.test(v),
  id: v => /^\d{1,9}$/.test(v),
  fixture: v => /^\d{1,9}$/.test(v),
  team: v => /^\d{1,9}$/.test(v),
  live: v => v === 'all',
  timezone: v => /^[A-Za-z_]+(\/[A-Za-z_\-+0-9]+){0,2}$/.test(v) && v.length <= 40,
};

const PER_IP_LIMIT = 40;            // fresh API calls per visitor...
const PER_IP_WINDOW = 10 * 60e3;    // ...per 10 minutes
const RESERVE = 15;                 // keep the last requests of the day for live match updates

const memo = new Map();             // in-function cache: key -> {until, body}
const visitors = new Map();         // ip -> {start, count}
let quotaLeft = null;

function cacheSeconds(path, q) {
  if (path === 'players/squads') return 86400;
  if (path === 'fixtures/lineups') return 300;
  // Live match: when the daily quota runs low, keep answers longer so all phones share fewer API calls
  if (path === 'fixtures' && (q.id || q.live)) return quotaLeft != null && quotaLeft < 120 ? 150 : 55;
  if (path === 'fixtures' && q.date) {
    const today = new Date().toISOString().slice(0, 10);
    return q.date < today ? 86400 : 600;   // past days never change
  }
  return 60;
}

function fail(res, status, msg) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json({ errors: { request: msg } });
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key && !USE_MOCK) return fail(res, 500, 'The API key is missing. Add API_FOOTBALL_KEY in Vercel > Settings > Environment Variables, then redeploy.');

  // Refuse calls made by other websites (browsers send this header automatically)
  const site = req.headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return fail(res, 403, 'Not allowed.');

  const path = String(req.query.path || '');
  const rule = ALLOWED[path];
  if (!rule) return fail(res, 400, 'This request is not allowed.');

  const qs = new URLSearchParams();
  const picked = {};
  for (const p of rule.params) {
    const v = req.query[p];
    if (v == null || v === '') continue;
    const s = String(v);
    if (!CHECK[p](s)) return fail(res, 400, `Invalid ${p}.`);
    qs.set(p, s); picked[p] = s;
  }
  if (path === 'fixtures' && !picked.date && !picked.id && !picked.live) return fail(res, 400, 'Missing date or id.');

  if (USE_MOCK) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).json({ errors: [], response: mock(path, picked), requestsLeftToday: 100, preview: true }); }

  const ttl = cacheSeconds(path, picked);
  const cacheKey = path + '?' + qs.toString();
  res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);

  const hit = memo.get(cacheKey);
  if (hit && hit.until > Date.now()) return res.status(200).json(hit.body);

  // Per-visitor limit on fresh API calls
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  let v = visitors.get(ip);
  if (!v || now - v.start > PER_IP_WINDOW) { v = { start: now, count: 0 }; visitors.set(ip, v); }
  if (v.count >= PER_IP_LIMIT) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(429).json({ errors: { request: 'Too many requests. Wait a few minutes and try again.' } });
  }

  // Keep the last part of the daily quota for live match updates
  const isLiveUpdate = path === 'fixtures' && picked.id;
  if (quotaLeft != null && quotaLeft <= RESERVE && !isLiveUpdate) {
    return fail(res, 429, 'The daily data limit is almost used up. Live matches you already follow keep updating.');
  }

  v.count++;
  if (visitors.size > 5000) visitors.clear();
  if (memo.size > 500) memo.clear();

  try {
    const r = await fetch(BASE + path + (qs.toString() ? '?' + qs : ''), { headers: { 'x-apisports-key': key } });
    const body = await r.json();
    const left = r.headers.get('x-ratelimit-requests-remaining');
    if (left != null) { body.requestsLeftToday = Number(left); quotaLeft = Number(left); }
    const ttl2 = cacheSeconds(path, picked);
    res.setHeader('Cache-Control', `public, s-maxage=${ttl2}, stale-while-revalidate=${ttl2}`);
    const errs = body && body.errors && (Array.isArray(body.errors) ? body.errors.length : Object.keys(body.errors).length);
    if (r.ok && !errs) memo.set(cacheKey, { until: Date.now() + ttl2 * 1000, body });
    else res.setHeader('Cache-Control', 'no-store');
    return res.status(r.ok ? 200 : r.status).json(body);
  } catch (e) {
    return fail(res, 502, 'Could not reach API-Football. Try again in a minute.');
  }
}
