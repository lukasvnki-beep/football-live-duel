// Small private proxy between the app and API-Football.
// The API key lives only in Vercel's environment variables (API_FOOTBALL_KEY),
// so it is never sent to phones or visible in the page.

const BASE = 'https://v3.football.api-sports.io/';

// Only these API paths and query params can be requested through the proxy.
const ALLOWED = {
  'fixtures':         { params: ['date', 'id', 'live', 'league', 'season', 'timezone'] },
  'fixtures/lineups': { params: ['fixture'] },
  'players/squads':   { params: ['team'] },
};

function cacheSeconds(path, q) {
  if (path === 'players/squads') return 86400;           // squads barely change
  if (path === 'fixtures/lineups') return 300;
  if (path === 'fixtures' && q.id) return 55;            // live match: shared by everyone for ~1 min
  if (path === 'fixtures' && q.live) return 55;
  if (path === 'fixtures') return 600;                    // a day's fixture list
  return 30;
}

export default async function handler(req, res) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.status(500).json({ errors: { setup: 'The API key is missing. Add API_FOOTBALL_KEY in Vercel > Settings > Environment Variables, then redeploy.' } });
  }
  const path = String(req.query.path || '');
  const rule = ALLOWED[path];
  if (!rule) return res.status(400).json({ errors: { path: 'This request is not allowed.' } });

  const qs = new URLSearchParams();
  const picked = {};
  for (const p of rule.params) {
    const v = req.query[p];
    if (v != null && v !== '') {
      const s = String(v).slice(0, 60);
      if (!/^[\w\-\/:+.]+$/.test(s)) return res.status(400).json({ errors: { [p]: 'Invalid value.' } });
      qs.set(p, s); picked[p] = s;
    }
  }

  try {
    const r = await fetch(BASE + path + (qs.toString() ? '?' + qs : ''), {
      headers: { 'x-apisports-key': key },
    });
    const body = await r.json();
    const left = r.headers.get('x-ratelimit-requests-remaining');
    if (left != null) body.requestsLeftToday = Number(left);
    const ttl = cacheSeconds(path, picked);
    res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`);
    return res.status(r.ok ? 200 : r.status).json(body);
  } catch (e) {
    return res.status(502).json({ errors: { network: 'Could not reach API-Football. Try again in a minute.' } });
  }
}
