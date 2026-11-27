// Light insult filter for chat, names and forfeits (French + English).
// Bad words are replaced by their first letter + stars, e.g. "c*******".
// It checks whole words only (so "concert" or "Scunthorpe" stay as they are),
// ignores accents, case and simple tricks like "f4ck" or "fuuuuck".

// Whole words (a plural s/x/es is also caught, except for "con" because of "pros and cons")
const WORDS = `
fuck fucker fucking fuk fck fking motherfucker stfu shit shitty bullshit bitch bitches cunt dick dickhead prick cock cocksucker
asshole arsehole bastard whore slut retard retarded faggot fag nigger nigga wanker twat pussy douche douchebag kys
con conne connard connasse salope salaud salopard pute putain encule enculer batard merde merdeux nique niquer ntm fdp pd pede tapette
gouine negre bougnoule youpin couille chier abruti abrutie debile enfoire ordure raclure trouduc grognasse pouffiasse attarde attardee
ptn batarde conasse sale`.trim().split(/\s+/);

// Word starts that are always rude (fucking, enculés, salopes, niquez...)
const STEMS = ['fuck', 'motherfuck', 'shit', 'bitch', 'cunt', 'nigg', 'fagg', 'wank', 'asshol', 'encul', 'salop', 'connar', 'conass', 'batard', 'niqu', 'enfoir', 'putain', 'pouffias'];

// Phrases that are threats, checked across words
const PHRASES = ['kill yourself', 'kill urself', 'go die', 'va te pendre', 'va mourir', 'suicide toi', 'fils de pute', 'nique ta mere', 'ta mere la', 'sale noir', 'sale arabe', 'sale juif'];

// "sale" alone is a normal word: only rude inside a phrase above
const SKIP_ALONE = new Set(['sale']);

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '@': 'a', '$': 's', '5': 's', '7': 't' };
const norm = w => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[0-9@$]/g, c => LEET[c] || c).replace(/[^a-z]/g, '');
const squeeze = w => w.replace(/(.)\1+/g, '$1');
const SET = new Set(WORDS.filter(w => !SKIP_ALONE.has(w)));
const SQ = new Set([...SET].map(squeeze));

function bad(word) {
  const n = norm(word);
  if (n.length < 2) return false;
  const strip = f => f === 'cons' ? f : f.replace(/(es|s|x)$/, '');
  const forms = [n, strip(n)];
  // Only undo stretched letters ("fuuuck") when the word really has 3 of the same letter in a row,
  // so normal words like "bitte" or "passe" are left alone.
  if (/(.)\1\1/.test(n)) forms.push(squeeze(n), strip(squeeze(n)));
  return forms.some(f => SET.has(f) || SQ.has(f) && f !== n) || STEMS.some(s => n.startsWith(s) || squeeze(n).startsWith(s));
}

const mask = w => w[0] + '*'.repeat(Math.max(2, w.length - 1));

export function filterText(text) {
  let out = String(text || '');
  // Phrases first (on a version without accents/punctuation, then mask the matching words)
  const words = out.split(/(\s+)/);
  const plain = words.map(w => /\s/.test(w) ? ' ' : norm(w));
  for (const p of PHRASES) {
    const pw = p.split(' ');
    for (let i = 0; i < plain.length; i += 2) {
      let ok = true;
      for (let j = 0; j < pw.length; j++) if (plain[i + j * 2] !== pw[j]) { ok = false; break; }
      if (ok) for (let j = 0; j < pw.length; j++) words[i + j * 2] = mask(words[i + j * 2]);
    }
  }
  out = words.join('');
  // Then single words (keep punctuation and emojis around them)
  return out.replace(/[\p{L}\p{N}@$]+/gu, w => (w.includes('*') || !bad(w)) ? w : mask(w));
}

export function hasBad(text) { return filterText(text) !== String(text || ''); }
