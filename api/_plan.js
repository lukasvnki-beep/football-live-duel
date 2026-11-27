// Free plan limits for online duels, counted on the server (shared by api/duel.js and api/plan.js).
// Free accounts: 1 online duel a day and 3 a week (Paris time, weeks start on Monday).
// Premium accounts (pl:<id>.premium = true) have no limit. Practice and same-phone games are not counted.
// Keys: gc:d:<who>:<YYYY-MM-DD> and gc:w:<who>:<monday YYYY-MM-DD>, where who = profile id (or ip:<hash> without a profile).
import crypto from 'node:crypto';

export const LIMITS = { day: 1, week: 3 };

function parisDate(t = Date.now()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t));
  return p; // YYYY-MM-DD
}
function weekStart(day) {
  const d = new Date(day + 'T12:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
export function keys(who) {
  const day = parisDate();
  return { d: 'gc:d:' + who + ':' + day, w: 'gc:w:' + who + ':' + weekStart(day) };
}
export const ipWho = ip => 'ip:' + crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 16);

// How many games are used, and whether this profile is premium
export async function usage(redis, who, profile) {
  const k = keys(who);
  const [d, w] = (await redis([['MGET', k.d, k.w]]))[0];
  return { premium: !!(profile && profile.premium), day: Number(d) || 0, week: Number(w) || 0, limits: LIMITS };
}

// Returns null if one more game is allowed, or the message to show if the free limit is reached.
export async function checkGame(redis, who, profile) {
  if (profile && profile.premium) return null;
  const u = await usage(redis, who, profile);
  if (u.day >= LIMITS.day) return 'You have played your free online duel for today. Go premium to play as many as you want, or come back tomorrow.';
  if (u.week >= LIMITS.week) return 'You have played your 3 free online duels this week. Go premium to play as many as you want, or wait until Monday.';
  return null;
}
// Count one game (premium games are not counted)
export async function addGame(redis, who, profile) {
  if (profile && profile.premium) return;
  const k = keys(who);
  await redis([['INCR', k.d], ['EXPIRE', k.d, String(2 * 86400)], ['INCR', k.w], ['EXPIRE', k.w, String(8 * 86400)]]);
}
