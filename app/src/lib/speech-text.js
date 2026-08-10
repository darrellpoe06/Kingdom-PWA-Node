// =============================================================================
// speech-text — how a written line should SOUND when the reader says it
// =============================================================================
// Darrell 2026-08-10: "the reader should say 2nd Timothy not two Timothy... etc."
//
// A device voice reads "2 Timothy 1:7" as *"two Timothy"* — because to the
// engine that leading character is a quantity, not an ordinal. Nobody in the
// Body says "two Timothy"; they say "Second Timothy". On a platform whose whole
// point is hearing the Word, a reference read wrong every single time is not a
// small blemish: it is the Word mispronounced, out loud, to a listener who may
// not be able to read along and check.
//
// The rule: this converts SPOKEN FORM ONLY. The written text on screen is never
// touched — "2 Timothy 1:7" stays exactly that on the page (and inside every
// quotation, per the Typographic Theology bright line); only the string handed
// to the voice gets the ordinal, so the ear hears what a reader would say.
//
// Numbered books get their ordinal ("1 John" → "1st John", which every engine
// says as "First John"), and the Roman forms the older printings use (I, II,
// III) get the same treatment. Pure, injection-free, unit-tested.
// =============================================================================

// Every numbered book of the canon, plus the abbreviations that show up in
// citations. Longest-first is not needed — the boundary anchors handle it.
const NUMBERED_BOOKS = [
  'Samuel', 'Sam', 'Kings', 'Kgs', 'Chronicles', 'Chron', 'Chr',
  'Corinthians', 'Corinth', 'Cor', 'Thessalonians', 'Thess', 'Thes',
  'Timothy', 'Tim', 'Peter', 'Pet', 'John', 'Jn', 'Maccabees', 'Macc', 'Esdras',
];

const ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd' };
const ROMAN = { I: 1, II: 2, III: 3 };

const BOOKS = NUMBERED_BOOKS.join('|');
// "2 Timothy", "2. Timothy", "2Timothy" — the digit forms.
const DIGIT_RE = new RegExp(`\\b([123])\\.?\\s*(${BOOKS})\\b`, 'g');
// "II Timothy" — the Roman forms. Case-sensitive on purpose: lowercase "i" and
// "ii" are not citations, and "I John" must not swallow the pronoun "I" before
// a name that is not a numbered book (the book list is the guard).
const ROMAN_RE = new RegExp(`\\b(I{1,3})\\.?\\s+(${BOOKS})\\b`, 'g');

/**
 * The text as it should be SAID. Written text is unchanged; this is only ever
 * applied to the string handed to a voice.
 */
export function toSpokenForm(text) {
  if (text == null) return '';
  const s = String(text);
  if (!s) return '';
  return s
    .replace(DIGIT_RE, (m, n, book) => `${ORDINAL[n] || n} ${book}`)
    .replace(ROMAN_RE, (m, roman, book) => `${ORDINAL[ROMAN[roman]] || roman} ${book}`);
}

export default toSpokenForm;
