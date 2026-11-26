// =============================================================================
// learn-discover-text — the one tokenizer the discovery index and the discovery
// search both use, so a word is reduced the same way at build time and at query
// time. Pure; no React, no storage, no network.
// =============================================================================

const STOP = new Set(
  (
    'a an and are as at be been being but by can could did do does doing done for from had has have having how i if in into is it its ' +
    'me my of on or our out so than that the their them then there these they this those to up us was we were what when where which who whom ' +
    'why will with would you your yours about after again all also any because before between both each few more most other over same ' +
    'some such only own too very just should now get got make made want need needs way ways let lets one two much many ' +
    'wont dont cant isnt arent wasnt werent didnt doesnt couldnt wouldnt shouldnt havent hasnt hadnt ill ive youre theyre thats whats'
  ).split(' ')
);

// Words that ask a question without naming a subject. "How do I buy my first
// home" is about a home, not about "how" or "do".
const QUESTION = new Set(
  (
    'what whats how why when where who which does do did can could should would will is are am ' +
    'tell show teach learn lesson lessons bible say says said mean means find finding help helps better become becoming always'
  ).split(' ')
);

const IRREGULAR = {
  forgiven: 'forgiv',
  children: 'child',
  women: 'woman',
  wives: 'wife',
  lives: 'life',
  mothers: 'mother',
  fathers: 'father',
  teens: 'teen',
  kids: 'kid',
};

// Irregular verb forms, read as their plain verb ("forgave" is "forgive", "taught" is "teach"). The curriculum is
// full of Scripture and narrative in the past tense; without this "He forgave him the debt" never meets "forgiveness".
const IRREGULAR_VERB = {
  forgave: 'forgive',
  gave: 'give',
  taught: 'teach',
  built: 'build',
  brought: 'bring',
  thought: 'think',
  sold: 'sell',
  bought: 'buy',
  paid: 'pay',
  lent: 'lend',
  heard: 'hear',
  knew: 'know',
  known: 'know',
  wrote: 'write',
  written: 'write',
  led: 'lead',
  fed: 'feed',
  ate: 'eat',
  eaten: 'eat',
  spoke: 'speak',
  spoken: 'speak',
  broke: 'break',
  broken: 'break',
  chose: 'choose',
  chosen: 'choose',
  rose: 'rise',
  risen: 'rise',
  fell: 'fall',
  fallen: 'fall',
  kept: 'keep',
  left: 'leave',
  met: 'meet',
  sent: 'send',
  said: 'say',
  told: 'tell',
  found: 'find',
  stood: 'stand',
  saw: 'see',
  seen: 'see',
  sat: 'sit',
  born: 'bear',
  bore: 'bear',
  held: 'hold',
  began: 'begin',
  begun: 'begin',
  grew: 'grow',
  grown: 'grow',
  drew: 'draw',
  slept: 'sleep',
  wept: 'weep',
};

/** A light, deterministic stem. Deliberately simple: it must give the same answer in a browser and in a build script. */
export function stem(word) {
  let w = String(word || '').toLowerCase();
  if (w.length <= 3) return w;
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (IRREGULAR_VERB[w]) return stem(IRREGULAR_VERB[w]);
  const dedouble = (x) => (/(.)\1$/.test(x) && !/(ss|ll|ee|oo)$/.test(x) ? x.slice(0, -1) : x);
  if (w.endsWith('ies') && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('sses')) w = w.slice(0, -2);
  else if (w.endsWith('ing') && w.length > 5) w = dedouble(w.slice(0, -3));
  else if (w.endsWith('ied') && w.length > 4) w = `${w.slice(0, -3)}y`;
  else if (w.endsWith('ed') && w.length > 4) w = dedouble(w.slice(0, -2));
  else if (w.endsWith('ness') && w.length > 7) w = w.slice(0, -4);
  else if (w.endsWith('ly') && w.length > 5) w = w.slice(0, -2);
  else if (w.endsWith('es') && w.length > 4 && /(ch|sh|x|z|ss)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && w.length > 3) w = w.slice(0, -1);
  // "raise / raised / raising" and "house / houses" must meet at one stem.
  if (w.length > 4 && w.endsWith('e') && !w.endsWith('ee')) w = w.slice(0, -1);
  return w;
}

// "A.I.", "A. I." and "AI" are one word, and the only two-letter word that carries a subject.
const normAI = (text) => String(text || '').replace(/\bA\.\s?I\.?/g, 'ai');
const keep = (t) => t.length >= 3 || t === 'ai';

/** Lowercase word tokens, 3+ letters (and "ai"), stopwords removed, stemmed. */
export function stems(text) {
  const out = [];
  const raw = normAI(text)
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .split(/[^a-z]+/);
  for (const t of raw) {
    if (!keep(t) || STOP.has(t)) continue;
    out.push(stem(t));
  }
  return out;
}

/** The subject words of a typed question: question words and stopwords dropped. */
export function queryStems(text) {
  const out = [];
  const raw = normAI(text)
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .split(/[^a-z]+/);
  for (const t of raw) {
    if (!keep(t) || STOP.has(t) || QUESTION.has(t)) continue;
    out.push(stem(t));
  }
  return out;
}

/** The subject words of a typed question, NOT stemmed, in the order typed (what the existing finder expects). */
export function subjectWords(text) {
  const out = [];
  const raw = normAI(text)
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .split(/[^a-z0-9:]+/);
  for (const t of raw) {
    if (!t || STOP.has(t) || QUESTION.has(t)) continue;
    if (!keep(t) && !/\d/.test(t)) continue;
    out.push(t);
  }
  return out;
}

// Scripture references: "Matthew 6:33", "1 Corinthians 13", "Psalm 23:1-4".
const BOOKS =
  'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|' +
  'Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|' +
  'Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|' +
  '1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation';
const REF_RE = new RegExp(`\\b(${BOOKS})\\s+(\\d{1,3})(?::(\\d{1,3}))?`, 'gi');

/** Every "Book chapter[:verse]" in a text, normalised to "book chapter" (lowercase, Psalm → psalms). */
export function scriptureRefs(text) {
  const seen = new Set();
  const s = String(text || '');
  let m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(s))) {
    let book = m[1].toLowerCase();
    if (book === 'psalm') book = 'psalms';
    if (book === 'song of songs') book = 'song of solomon';
    seen.add(`${book} ${Number(m[2])}`);
  }
  return [...seen];
}
