// Fake football data for preview deployments, so testing never spends real API-Football requests.
// Two fictional matches loop every 40 minutes (offset by 20): 3 min before kickoff, then
// 1 match minute every 20 seconds, a short half time, full time, and a new match starts.

const CYCLE = 40 * 60e3, PRE = 3 * 60e3, STEP = 20e3;
const MATCHES = [
  { id: 900001, offset: 0, home: { id: 9001, name: 'Northport FC' }, away: { id: 9002, name: 'Valecrest United' } },
  { id: 900002, offset: 20 * 60e3, home: { id: 9003, name: 'Riverside Athletic' }, away: { id: 9004, name: 'Kingsmoor City' } },
];
const FIRST = ['Leo', 'Mateo', 'Jonas', 'Rafa', 'Kai', 'Theo', 'Nico', 'Luca', 'Sami', 'Elias', 'Noah', 'Ivo', 'Milan', 'Ben', 'Oscar', 'Yann', 'Tomas', 'Hugo'];
const LAST = ['Moreau', 'Okafor', 'Lindqvist', 'Barros', 'Hale', 'Navarro', 'Kovac', 'Duarte', 'Brandt', 'Silva', 'Mensah', 'Rossi', 'Varga', 'Keller', 'Novak', 'Ortiz', 'Berg', 'Laurent'];
const POS = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'F', 'F', 'F', 'G', 'D', 'D', 'M', 'M', 'F', 'F'];

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function squad(team) {
  const r = rng(team.id);
  return POS.map((pos, i) => ({ id: team.id * 100 + i + 1, name: FIRST[Math.floor(r() * FIRST.length)][0] + '. ' + LAST[Math.floor(r() * LAST.length)], number: i === 11 ? 12 : i + 1 + (i > 11 ? 8 : 0), pos }));
}

// Where a match is right now
function clock(m, now) {
  const cycle = Math.floor((now - m.offset) / CYCLE), start = cycle * CYCLE + m.offset;
  const kickoff = start + PRE, t = now - kickoff;
  if (t < 0) return { cycle, kickoff, status: 'NS', elapsed: null, min: 0 };
  const k = Math.floor(t / STEP);
  if (k < 45) return { cycle, kickoff, status: '1H', elapsed: k + 1, min: k + 1 };
  if (k < 50) return { cycle, kickoff, status: 'HT', elapsed: 45, min: 45 };
  if (k < 95) return { cycle, kickoff, status: '2H', elapsed: k - 4, min: k - 4 };
  return { cycle, kickoff, status: 'FT', elapsed: 90, min: 90 };
}

// The full script of one match (same for everyone, changes every cycle)
function script(m, cycle) {
  const r = rng(m.id * 1000 + cycle);
  const teams = [m.home, m.away].map(t => ({ team: t, players: squad(t) }));
  const events = [], on = teams.map(t => t.players.slice(0, 11).map(p => ({ p, from: 0, to: 90 })));
  // Substitutions: 3 per team between 55' and 85'
  teams.forEach((t, ti) => {
    const bench = t.players.slice(11).filter(p => p.pos !== 'G');
    for (let s = 0; s < 3; s++) {
      const min = 55 + Math.floor(r() * 30);
      const outers = on[ti].filter(x => x.to === 90 && x.from === 0 && x.p.pos !== 'G');
      const out = outers[Math.floor(r() * outers.length)], inn = bench[s];
      out.to = min; on[ti].push({ p: inn, from: min, to: 90 });
      events.push({ time: { elapsed: min, extra: null }, team: t.team, player: { id: out.p.id, name: out.p.name }, assist: { id: inn.id, name: inn.name }, type: 'subst', detail: 'Substitution ' + (s + 1) });
    }
  });
  const playing = (ti, min) => on[ti].filter(x => x.from < min && x.to >= min);
  const pick = (list, w) => { const tot = list.reduce((s, x) => s + w(x), 0); let v = r() * tot; for (const x of list) { v -= w(x); if (v <= 0) return x; } return list[list.length - 1]; };
  const gw = x => ({ F: 6, M: 3, D: 1, G: 0 })[x.p.pos];
  // Goals
  const goals = 1 + Math.floor(r() * 5);
  for (let g = 0; g < goals; g++) {
    const min = 3 + Math.floor(r() * 87), ti = r() < 0.5 ? 0 : 1, pl = playing(ti, min);
    const sc = pick(pl, gw), as = r() < 0.75 ? pick(pl.filter(x => x !== sc), x => ({ F: 3, M: 5, D: 2, G: 0.2 })[x.p.pos]) : null;
    events.push({ time: { elapsed: min, extra: null }, team: teams[ti].team, player: { id: sc.p.id, name: sc.p.name }, assist: as ? { id: as.p.id, name: as.p.name } : { id: null, name: null }, type: 'Goal', detail: r() < 0.15 ? 'Penalty' : 'Normal Goal' });
  }
  // Cards
  const cards = 2 + Math.floor(r() * 4);
  for (let c = 0; c < cards; c++) {
    const min = 10 + Math.floor(r() * 80), ti = r() < 0.5 ? 0 : 1, pl = playing(ti, min).filter(x => x.p.pos !== 'G');
    const x = pick(pl, x => ({ D: 3, M: 2, F: 1 })[x.p.pos]);
    events.push({ time: { elapsed: min, extra: null }, team: teams[ti].team, player: { id: x.p.id, name: x.p.name }, assist: { id: null, name: null }, type: 'Card', detail: 'Yellow Card' });
  }
  events.sort((a, b) => a.time.elapsed - b.time.elapsed);
  // Per-minute rates for each player's stats
  const rates = {};
  teams.forEach(t => t.players.forEach(p => {
    const q = rng(p.id * 7 + cycle), base = { G: [0.3, 0.1], D: [0.6, 0.1], M: [0.75, 0.12], F: [0.35, 0.15] }[p.pos];
    rates[p.id] = { pass: base[0] * (0.7 + q() * 0.6), fail: base[1] * (0.6 + q() * 0.8), key: p.pos === 'M' || p.pos === 'F' ? 0.02 + q() * 0.02 : 0.004,
      shotOn: p.pos === 'F' ? 0.02 + q() * 0.02 : p.pos === 'M' ? 0.01 : 0.002, shotOff: p.pos === 'F' ? 0.025 : 0.01, drib: p.pos === 'F' ? 0.03 : p.pos === 'M' ? 0.02 : 0.004,
      tack: p.pos === 'D' ? 0.03 : p.pos === 'M' ? 0.025 : 0.008, inter: p.pos === 'D' ? 0.02 : 0.008, duel: 0.06 + q() * 0.04, fd: 0.015, fc: 0.012, save: p.pos === 'G' ? 0.04 : 0 };
  }));
  return { teams, events, on, rates };
}

function minutesPlayed(sc, ti, id, min) {
  const x = sc.on[ti].find(o => o.p.id === id); if (!x || x.from >= min) return 0;
  return Math.min(min, x.to) - x.from;
}

function fixtureObj(m, c, evs) {
  let gh = null, ga = null;
  if (c.status !== 'NS') { gh = 0; ga = 0; evs.forEach(e => { if (e.type === 'Goal') e.team.id === m.home.id ? gh++ : ga++; }); }
  return { fixture: { id: m.id, date: new Date(c.kickoff).toISOString(), status: { short: c.status, elapsed: c.elapsed } },
    league: { id: 2, name: 'Preview Cup (fake match)', country: 'World' }, teams: { home: m.home, away: m.away }, goals: { home: gh, away: ga } };
}

export function mock(path, q) {
  const now = Date.now();
  if (path === 'fixtures' && (q.date || q.live)) {
    return MATCHES.map(m => { const c = clock(m, now), sc = script(m, c.cycle); return fixtureObj(m, c, sc.events.filter(e => c.status !== 'NS' && e.time.elapsed <= c.min)); })
      .sort((a, b) => a.fixture.date.localeCompare(b.fixture.date));
  }
  const m = MATCHES.find(x => String(x.id) === String(q.id || q.fixture));
  if (path === 'players/squads') {
    const t = [...MATCHES.map(x => x.home), ...MATCHES.map(x => x.away)].find(x => String(x.id) === String(q.team));
    return t ? [{ team: t, players: squad(t).map(p => ({ id: p.id, name: p.name, number: p.number, position: { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', F: 'Attacker' }[p.pos] })) }] : [];
  }
  if (!m) return [];
  const c = clock(m, now), sc = script(m, c.cycle);
  if (path === 'fixtures/lineups') {
    return sc.teams.map(t => ({ team: t.team, startXI: t.players.slice(0, 11).map(p => ({ player: { id: p.id, name: p.name, number: p.number, pos: p.pos } })), substitutes: t.players.slice(11).map(p => ({ player: { id: p.id, name: p.name, number: p.number, pos: p.pos } })) }));
  }
  // fixtures?id= : events, lineups and player stats so far
  const evs = c.status === 'NS' ? [] : sc.events.filter(e => e.time.elapsed <= c.min);
  const players = sc.teams.map((t, ti) => ({ team: t.team, players: t.players.map(p => {
    const mins = c.status === 'NS' ? 0 : minutesPlayed(sc, ti, p.id, c.min), rt = sc.rates[p.id], f = v => Math.floor(v * mins);
    const goals = evs.filter(e => e.type === 'Goal' && e.player.id === p.id).length, assists = evs.filter(e => e.type === 'Goal' && e.assist.id === p.id).length;
    const yellow = evs.filter(e => e.type === 'Card' && e.player.id === p.id).length;
    const passes = f(rt.pass), fail = f(rt.fail);
    return { player: { id: p.id, name: p.name }, statistics: [{ games: { minutes: mins, number: p.number, position: p.pos }, goals: { total: goals, assists, saves: f(rt.save) },
      cards: { yellow: Math.min(1, yellow), red: yellow > 1 ? 1 : 0 }, tackles: { total: f(rt.tack), interceptions: f(rt.inter), blocks: f(rt.inter / 2) }, offsides: p.pos === 'F' ? f(0.008) : 0, shots: { on: f(rt.shotOn) + goals, total: f(rt.shotOn) + goals + f(rt.shotOff) },
      passes: { total: passes + fail, accuracy: String(passes), key: f(rt.key) + assists }, dribbles: { success: f(rt.drib), attempts: f(rt.drib) + f(rt.drib * 0.8), past: f(rt.tack / 3) }, duels: { won: f(rt.duel) }, fouls: { drawn: f(rt.fd), committed: f(rt.fc) }, penalty: {} }] };
  }) }));
  return [{ ...fixtureObj(m, c, evs), events: evs, players, lineups: [] }];
}
