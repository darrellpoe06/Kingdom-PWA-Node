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
import { softenShouting, plainTypography, unshoutBookNames, collapseReferenceRuns } from './speech-shape.js';

const NUMBERED_BOOKS = [
  'Samuel', 'Sam', 'Kings', 'Kgs', 'Chronicles', 'Chron', 'Chr',
  'Corinthians', 'Corinth', 'Cor', 'Thessalonians', 'Thess', 'Thes',
  'Timothy', 'Tim', 'Peter', 'Pet', 'John', 'Jn', 'Maccabees', 'Macc', 'Esdras',
];

const ORDINAL = { 1: '1st', 2: '2nd', 3: '3rd' };
const ROMAN = { I: 1, II: 2, III: 3 };

// EVERY book of the canon (Darrell 2026-08-10: "not only 2 Timothy all
// scriptures?"), plus the abbreviations citations actually use. This is the
// guard that keeps the chapter:verse rule from firing on things that are NOT
// references — a video timestamp ("1:12-2:04"), a clock time, a score. A
// reference is only a reference when a BOOK NAME sits in front of it.
const ALL_BOOKS = [
  'Genesis', 'Gen', 'Exodus', 'Exod', 'Ex', 'Leviticus', 'Lev', 'Numbers', 'Num',
  'Deuteronomy', 'Deut', 'Joshua', 'Josh', 'Judges', 'Judg', 'Ruth',
  'Samuel', 'Sam', 'Kings', 'Kgs', 'Chronicles', 'Chron', 'Chr',
  'Ezra', 'Nehemiah', 'Neh', 'Esther', 'Esth', 'Job',
  'Psalms', 'Psalm', 'Psa', 'Ps', 'Proverbs', 'Prov', 'Ecclesiastes', 'Eccles', 'Eccl',
  'Song of Solomon', 'Song of Songs', 'Song', 'Isaiah', 'Isa', 'Jeremiah', 'Jer',
  'Lamentations', 'Lam', 'Ezekiel', 'Ezek', 'Daniel', 'Dan',
  'Hosea', 'Hos', 'Joel', 'Amos', 'Obadiah', 'Obad', 'Jonah', 'Micah', 'Mic',
  'Nahum', 'Nah', 'Habakkuk', 'Hab', 'Zephaniah', 'Zeph', 'Haggai', 'Hag',
  'Zechariah', 'Zech', 'Malachi', 'Mal',
  'Matthew', 'Matt', 'Mark', 'Luke', 'John', 'Jn', 'Acts',
  'Romans', 'Rom', 'Corinthians', 'Corinth', 'Cor', 'Galatians', 'Gal',
  'Ephesians', 'Eph', 'Philippians', 'Phil', 'Colossians', 'Col',
  'Thessalonians', 'Thess', 'Thes', 'Timothy', 'Tim', 'Titus', 'Philemon', 'Philem',
  'Hebrews', 'Heb', 'James', 'Jas', 'Peter', 'Pet', 'Jude', 'Revelation', 'Rev',
];

const BOOKS = NUMBERED_BOOKS.join('|');
// "2 Timothy", "2. Timothy", "2Timothy" — the digit forms.
const DIGIT_RE = new RegExp(`\\b([123])\\.?\\s*(${BOOKS})\\b`, 'g');
// "II Timothy" — the Roman forms. Case-sensitive on purpose: lowercase "i" and
// "ii" are not citations, and "I John" must not swallow the pronoun "I" before
// a name that is not a numbered book (the book list is the guard).
const ROMAN_RE = new RegExp(`\\b(I{1,3})\\.?\\s+(${BOOKS})\\b`, 'g');

// Longest names first so "Song of Solomon" wins over "Song", and so a full name
// is never half-matched by its own abbreviation.
const ANY_BOOK = [...ALL_BOOKS].sort((a, b) => b.length - a.length).join('|');
// "<Book> 4:16", "<Book> 1:16-17", "<Book> 5:21–22" (en dash too). The book
// name is REQUIRED — that is what makes this safe on a page full of timestamps.
const REF_RE = new RegExp(`\\b(${ANY_BOOK})\\.?\\s+(\\d{1,3}):(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?`, 'g');

/**
 * The text as it should be SAID. Written text is unchanged; this is only ever
 * applied to the string handed to a voice.
 *
 * Two rules, in order:
 *   1. a numbered book is an ORDINAL — "2 Timothy" is said "2nd Timothy";
 *   2. a chapter:verse is SPOKEN, not punctuated — "John 3:16" becomes
 *      "John chapter 3 verse 16", because a colon between two numbers is read
 *      by every engine as a clock time or a ratio ("three sixteen"), which is
 *      not how anyone in the Body says a reference out loud.
 */
// THE BOOK OF JOB IS SAID LIKE THE NAME, NEVER LIKE WORK (Darrell 2026-09-16:
// "Reader keeps saying Job like working not Job like the name... can we fix
// that?!!! Perpetually?"; DR-0441). Every device engine reads the four letters
// as employment. The spoken form says "Jobe" — the spelling engines read as
// the name — wherever the capitalised word is the patriarch or his book: a
// reference ("Job 1:6"), the name in prose, the possessive. The written text
// on screen is never touched. The capitalised EMPLOYMENT senses that can open
// a sentence ("Job interviews...", "Job losses...") are the only exclusions,
// by the word that follows; lowercase "job" is never a name and is left alone.
const JOB_AS_WORK_NEXT = /^(?:interview|market|description|title|offer|search|seeker|hunt|hunting|posting|application|training|fair|creation|loss|losses|growth|cut|cuts|numbers|openings|opening|security|site|board|listing|listings|ad|ads|done|well|satisfaction|report|reports)s?$/i;
export function sayTheBookOfJob(s) {
  return String(s).replace(/\bJob\b/g, (m, off, str) => {
    const next = str.slice(off + 3).match(/^(?:'s)?\s+([A-Za-z]+)/);
    return next && JOB_AS_WORK_NEXT.test(next[1]) ? m : 'Jobe';
  });
}

export function toSpokenForm(text) {
  if (text == null) return '';
  const s = String(text);
  if (!s) return '';
  // A shouted book name is un-shouted FIRST, or the matchers below never see
  // it (measured: 6 in the corpus, e.g. "HEBREWS 2:14").
  // A LONG RUN OF BARE REFERENCES IS COLLAPSED BEFORE ANY OF THEM IS EXPANDED
  // (Darrell 2026-09-13: "don't read long list of references together... just
  // when the word or a point is needed"). Order matters twice over: the book
  // names are un-shouted first so the scanner can see them, and the runs are
  // collapsed BEFORE REF_RE turns each survivor into "chapter X verse Y" —
  // collapsing afterwards would mean expanding eighty references only to throw
  // the expansion away.
  const withRefs = collapseReferenceRuns(unshoutBookNames(s))
    .replace(DIGIT_RE, (m, n, book) => `${ORDINAL[n] || n} ${book}`)
    .replace(ROMAN_RE, (m, roman, book) => `${ORDINAL[ROMAN[roman]] || roman} ${book}`)
    .replace(REF_RE, (m, book, chapter, verse, verseEnd) => {
      // A psalm is numbered, not chaptered — "Psalm 119, verse 105" is how it
      // is said aloud, and "Psalm chapter 119" is how nobody says it.
      const head = /^Ps/i.test(book) ? `${book} ${chapter}` : `${book} chapter ${chapter}`;
      return verseEnd ? `${head} verses ${verse} through ${verseEnd}` : `${head} verse ${verse}`;
    });

  // SHOUTING AND TYPOGRAPHY, run AFTER the references (DR-0381).
  //
  // Order is load-bearing: the reference patterns above look for a capitalised
  // book name, so lowering the shouting first would turn "1 JOHN 1:8" into
  // "1 john 1:8" and it would never be recognised as a reference at all.
  //
  // Why this is here: the house style writes lead clauses in capitals — 313 of
  // them across the corpus, measured, not guessed. Engines treat an ALL-CAPS
  // run inconsistently and several spell it letter by letter, so "THE
  // DIRECTIVE." is read "T-H-E D-I-R-E-C-T-I-V-E". That is a TEXT fault, and no
  // amount of better synthesis fixes it. The SCREEN keeps its capitals; only
  // the utterance is lowered. Em-dashes, curly quotes and ellipses are
  // flattened for the same reason — the engine either names them or lets them
  // flatten the prosody.
  return plainTypography(softenShouting(sayTheBookOfJob(withRefs)));
}

export default toSpokenForm;
