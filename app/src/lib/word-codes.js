// =============================================================================
// word-codes — the Word's own purpose clauses, found in a lesson's quoted verses
// =============================================================================
// Darrell, 2026-10-01, on Numbers 27:20 ("And thou shalt put some of thine
// honour upon him, that all the congregation of the children of Israel may be
// obedient"): "Yahweh wanted it public, before the priest and the whole
// congregation, so that everyone would know Joshua was the next leader. More
// importantly... so the children of Israel may be obedient... it's a code...
// find all these types of codes in all lessons including this one." And:
// "Leaders need to follow the code of conduct inside the Word."
//
// A CODE, as he means it, is the clause where the Word says what a command or
// an act is FOR: "that ... may", "so that", "to the end that", "to the intent
// that", and the warning form "lest". The command tells the hand what to do;
// the code tells the heart why, and a leader reads for that clause and keeps
// it. This module finds those clauses deterministically, inside the quoted
// spans a lesson already carries (the same "quote" (Book c:v) shape the verse
// gate checks), so every code shown is a verse the lesson quotes verbatim.
//
// Measured on the whole catalog on 2026-10-01 (593 lessons, 44,256 quoted
// spans): 1,026 distinct codes in 271 lessons (a verse quoted in the full
// lesson and again in its four bands counts once).
// Pure over strings: no DOM, no fetch, no corpus read, so the reader can show
// them and a test can pin them.

export const SPAN_WITH_REFERENCE =
  /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;

// One clause per match, cut at the end of its sentence or clause.
const PURPOSE =
  /\b(that (?:ye|thou|he|she|they|it|we|I|all|the|his|her|your|their|my|our|no|none|every|whosoever|which|[a-z]+) [^".;:?]*?\b(?:may|might|mayest|mightest|should|shouldest)\b[^".;:?]*|so that\b[^".;:?]*|to the (?:end|intent) that\b[^".;:?]*|lest\b[^".;:?]*)/g;

const KINDS = [
  [/^that\b/, 'that-may'],
  [/^so that\b/, 'so-that'],
  [/^to the (?:end|intent) that\b/, 'to-the-end'],
  [/^lest\b/, 'lest'],
];

export function kindOf(clause) {
  const c = String(clause || '').trim();
  for (const [re, kind] of KINDS) if (re.test(c)) return kind;
  return 'purpose';
}

/** Every code inside ONE quoted verse text. */
export function codesInQuote(quoted) {
  const out = [];
  for (const m of String(quoted || '').matchAll(PURPOSE)) {
    const clause = m[1].replace(/\s+/g, ' ').trim().replace(/[,\s]+$/, '');
    if (clause.split(' ').length < 3) continue; // "lest" alone is not a clause
    out.push({ clause, kind: kindOf(clause) });
  }
  return out;
}

/** Every code in a text that carries quoted spans with references. */
export function findCodes(text) {
  const out = [];
  for (const m of String(text || '').matchAll(SPAN_WITH_REFERENCE)) {
    const [, quoted, book, chapter, verses] = m;
    const ref = `${book.trim()} ${chapter}:${verses.trim()}`;
    for (const c of codesInQuote(quoted)) out.push({ ref, book: book.trim(), chapter: Number(chapter), verses: verses.trim(), ...c });
  }
  return out;
}

const FIELDS = ['lesson', 'bigIdea', 'inApp'];
const BANDS = ['child', 'youth', 'teen', 'senior'];

/** The codes of a lesson module: its full text and every band, de-duplicated. */
export function codesForLesson(module) {
  if (!module) return [];
  const texts = [];
  for (const f of FIELDS) if (typeof module[f] === 'string') texts.push(module[f]);
  const levels = module.levels || {};
  for (const b of BANDS) if (typeof levels[b] === 'string') texts.push(levels[b]);
  const seen = new Set();
  const out = [];
  for (const t of texts) {
    for (const c of findCodes(t)) {
      const key = `${c.ref}|${c.clause.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
  }
  return out;
}

/** Count across a catalog: lessons scanned, lessons with a code, codes. */
export function codesAcross(modules = []) {
  let withCodes = 0;
  let codes = 0;
  for (const m of modules) {
    const n = codesForLesson(m).length;
    if (n) withCodes += 1;
    codes += n;
  }
  return { lessons: modules.length, withCodes, codes };
}

/** The one-line frame the reader shows above the list, in Darrell's words. */
export const CODE_FRAME = 'Leaders follow the code of conduct inside the Word: where a verse says what a command is for.';

export function codesSummary(codes) {
  const n = Array.isArray(codes) ? codes.length : 0;
  if (n === 0) return 'None of the verses this lesson quotes carries a purpose clause.';
  return n === 1 ? 'One verse this lesson quotes says what it is for.' : `${n} verses this lesson quotes say what they are for.`;
}
