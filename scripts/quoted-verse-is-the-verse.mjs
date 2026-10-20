// =============================================================================
// quoted-verse-is-the-verse — is the quotation the verse it NAMES?
// =============================================================================
// Built 2026-09-19, after measuring what the existing quotation gate could not
// see. scripts/quotation-integrity.mjs asks two good questions -- is there an
// ellipsis inside these quotation marks, and are the words on either side of it
// real Scripture -- but it answers the second by searching ONE concatenated
// blob of the whole KJV. Two consequences, both found by measurement rather
// than by reading:
//
//   1. It never parses the reference. "(Haggai 1:5)" beside a span that is
//      actually Haggai 1:7 passes, because the words exist SOMEWHERE.
//   2. It never looks at a span without an ellipsis at all -- elidedQuotations()
//      opens with `if (!ELLIPSIS.test(m[1])) continue;`. A lesson could stitch
//      John 1:1 to John 1:14 with ", and" under one "(John 1:1,14)" and the
//      gate would be silent, because there is no ellipsis to find.
//
// So this module resolves the reference and compares the quotation to THAT
// verse. Measured across the 178 Living Lessons the day it was written:
// 25,192 referenced spans, 24,592 verbatim against their own named verse,
// 0 references that would not resolve, and after the eight defects that first
// run exposed were repaired, 2 spans differing from their verse only by the
// capital letter at the front.
//
// WHY THIS IS A GATE AND NOT A RATCHET. quotation-integrity is a ratchet
// because its 745 entries each need a human judgement -- the right contiguous
// span chosen by reading the verse. This is not that. The corpus is ALREADY
// clean on this question: every defect found was repaired the same session, so
// there is no debt to freeze, and a baseline would only be a place for a future
// defect to hide. Zero is the committed number.
//
// WHAT IS MEASURED, NAMED HONESTLY:
//   - 'unresolvable'     the named book/chapter/verse does not exist
//   - 'not-the-verse'    the quotation is not in the verse it names
//   - 'shouted'          a word is ALL CAPS inside the quotation marks where
//                        the verse does not shout it (the KJV's own "LORD"
//                        passes; our emphasis added to His words does not)
// Case at the FRONT of a span is deliberately allowed: quoting "consider your
// ways" inside our own sentence, or capitalising a span that opens one, changes
// no word of His. Adding capitals in the MIDDLE is what 'shouted' catches.
//
// An elided span is checked for its reference and for each side being in THAT
// verse; the elision itself belongs to quotation-integrity and DR-0459.
//
// Pure + deterministic: the corpus is read from disk once, everything else
// takes its data as an argument.
// =============================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOLY_NAME_WORDS } from '../app/src/lib/typographic-theology.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', 'app', 'public', 'bible', 'kjv');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const ELLIPSIS = /\.\.\.|…/;

// A quotation followed by its reference:
//   "..." (Book Chapter:Verse[,Verse][-Verse][, TRANSLATION])
//
// THE TAG WAS A THIRD HOLE IN THE CHECKING, and the pattern itself was the lock.
// It required ")" immediately after the verse numbers, so "(Philippians 3:12,
// ESV)" matched nothing at all -- 64 quotations stated their translation and
// were, for that reason alone, never compared to anything. Of those, 26 claim
// KJV, which is a corpus this repository HOLDS: a span claiming KJV that is not
// the KJV text is a plain defect, and six were found the moment the pattern
// could see them. The verse label is lazy so the tag's comma survives for the
// tag group instead of being eaten as part of the numbers.
export const SPAN_WITH_REFERENCE =
  /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+?)(?:,\s*([A-Z]{3,5}))?\)/g;

/**
 * The corpora this repository actually holds, by the tag a reference uses.
 *
 * THIS IS THE HONEST LIMIT OF THE WHOLE INSTRUMENT. SCRIPTURE-REFERENCE-STANDARD
 * puts ESV first and KJV second, and 38 quotations in the data are tagged ESV --
 * faithfully, as far as anyone here can tell, and NOT verifiable, because no ESV
 * text is on disk. Measuring those against the KJV and calling the difference a
 * fault would manufacture 38 corruptions out of sound work; passing them in
 * silence would claim a verification that never happened. They are counted as
 * `uncheckable` instead: named, pinned so the number cannot quietly grow, and
 * never folded into the fault count either way.
 */
export const CORPORA = Object.freeze({ KJV: 'kjv', WEB: 'web' });

let bookFiles = null;
const bookCache = new Map();

function files() {
  if (bookFiles === null) {
    bookFiles = new Set(
      readdirSync(KJV_DIR).filter((f) => f.endsWith('.json') && f !== 'index.json').map((f) => f.slice(0, -5)),
    );
  }
  return bookFiles;
}

/**
 * The filename holding a book, given the name as PROSE writes it. The catalog
 * says "Psalm 103:13" the way a reader says it; the file is Psalms.json. That
 * one plural is the whole reason this alias exists, and without it every Psalm
 * in the series would read as an unresolvable reference.
 */
export function bookFile(book) {
  const k = String(book).replace(/\s+/g, '');
  if (files().has(k)) return k;
  if (files().has(`${k}s`)) return `${k}s`;
  return null;
}

/**
 * The text of a reference in a corpus this repository holds, or null if it does
 * not resolve. `translation` defaults to KJV, which is what every untagged span
 * in the catalogs quotes -- an assumption, and one the 42-catalog gate's own
 * near-zero fault count is the evidence for.
 */
export function verseText(book, chapter, verseLabel, translation = 'KJV') {
  const dir = CORPORA[translation];
  if (!dir) return null;
  const f = bookFile(book);
  if (!f) return null;
  const key = `${dir}/${f}`;
  if (!bookCache.has(key)) {
    bookCache.set(key, JSON.parse(readFileSync(join(HERE, '..', 'app', 'public', 'bible', dir, `${f}.json`), 'utf8')));
  }
  const bk = bookCache.get(key);
  const chap = Array.isArray(bk.chapters) ? bk.chapters[Number(chapter) - 1] : null;
  if (!chap) return null;
  const nums = [];
  for (const part of String(verseLabel).split(',')) {
    const p = part.trim();
    if (!p) continue;
    const range = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const [a, b] = [Number(range[1]), Number(range[2])];
      if (b < a) return null;
      for (let i = a; i <= b; i += 1) nums.push(i);
    } else nums.push(Number(p));
  }
  if (!nums.length) return null;
  const parts = nums.map((n) => chap[n - 1]);
  return parts.some((x) => x == null) ? null : norm(parts.join(' '));
}

/**
 * Words our quotation shouts that the verse does not. The KJV's own small-caps
 * "LORD" and "GOD" are the verse's, not ours, so they are compared rather than
 * assumed -- a word only counts as shouted if the verse has it in another case.
 */
export function shoutedWords(quoted, verse) {
  const theirs = new Set(String(verse).match(/\b[A-Z]{2,}\b/g) || []);
  return [...new Set(String(quoted).match(/\b[A-Z]{2,}\b/g) || [])].filter((w) => !theirs.has(w));
}

/**
 * Check one span against the verse it names.
 * Returns null when the span is sound, or a fault naming what is wrong.
 */
export function checkSpan({ quoted, book, chapter, verses, translation }) {
  const ref = translation ? `${book} ${chapter}:${verses}, ${translation}` : `${book} ${chapter}:${verses}`;

  // A span that names a translation we do not hold is not a fault and is not
  // verified either. It is reported as its own thing so neither lie is told.
  if (translation && !CORPORA[translation]) {
    return { kind: 'no-corpus', ref, quoted, translation };
  }

  const verse = verseText(book, chapter, verses, translation || 'KJV');
  if (verse === null) return { kind: 'unresolvable', ref, quoted };

  const shouted = shoutedWords(quoted, verse);
  if (shouted.length) return { kind: 'shouted', ref, quoted, words: shouted };

  // Case-SENSITIVE, deliberately. The capital in "Consider your ways" is His,
  // and it is the imperative -- lowering it to fit our sentence softens a
  // command Yahweh gave twice in one chapter. The same comparison is what keeps
  // "the LORD" from ever being written "the lord" inside quotation marks.
  const sides = String(quoted)
    .split(/\s*(?:\.\.\.|…)\s*/)
    .map((p) => norm(p).replace(/^[,;:]+|[,;:]+$/g, ''))
    .filter(Boolean);
  const missing = sides.filter((p) => !verse.includes(p));
  if (missing.length) {
    return {
      kind: 'not-the-verse', ref, quoted, missing, elided: ELLIPSIS.test(quoted), verse,
    };
  }
  return null;
}

/**
 * Every REFERENCE that sits beside a quotation in a file's source text, outside
 * comments. For rewriting a reference in place -- nothing else.
 *
 * WHAT THIS IS NOT GOOD FOR, measured the hard way. A regex over raw source
 * cannot tell a quotation mark INSIDE a JS string from the string's own
 * delimiter, so `lesson: "he said \"Consider your ways\" (Haggai 1:5)"` yields a
 * span ending in a stray backslash. Pointed at living-lessons-class.js this
 * reported 11,865 faults where the catalog's own value-scanning gate reports
 * ZERO. The span COUNT was right (46,556 both ways); every judgement about the
 * words was wrong. So the words are judged by scanning VALUES after import
 * (scanValueSpans below), never from source text.
 *
 * The reference tail -- "(Book Chapter:Verse)" -- is unaffected by that defect:
 * it is matched by its own parentheses and carries no quotation marks. A
 * mis-bounded span still names its book correctly, which is all a tool
 * rewriting "1 Cor" to "1 Corinthians" needs.
 *
 * WHY COMMENTS ARE EXCLUDED. 22 of the repository's referenced spans sit in `//`
 * and block comments: a note to the next author beside a half-remembered
 * phrase. No reader meets those, and rewriting a previous session's working note
 * is not this tool's business.
 */
export function referencesBesideQuotations(src) {
  const text = String(src);
  const skip = commentRanges(text);
  let at = 0;
  const out = [];
  for (const m of text.matchAll(SPAN_WITH_REFERENCE)) {
    // The ranges and the spans both run forward, so one shared cursor walks
    // each file once. Deciding per span by scanning backwards for "/*" made
    // this quadratic -- measured at minutes on the large catalogs.
    while (at < skip.length && skip[at][1] <= m.index) at += 1;
    if (at < skip.length && skip[at][0] <= m.index) continue;
    out.push({
      index: m.index,
      length: m[0].length,
      match: m[0],
      raw: m[1],
      quoted: m[1].replace(/\\'/g, "'"),
      book: m[2].trim(),
      chapter: m[3],
      verses: m[4].trim(),
    });
  }
  return out;
}

/**
 * Every [start, end) the source spends in a comment, in order. One pass.
 *
 * Deliberately simple and deliberately CONSERVATIVE: it walks the text once,
 * tracking whether it is inside a double-quoted string (where a `//` or `/*` is
 * just characters) and otherwise opening a line or block comment. It does not
 * model template literals or regex literals, because a `"..." (Book C:V)` span
 * does not occur inside either in this repository -- and the failure direction
 * is the safe one: a span wrongly judged reader-facing is CHECKED, which at
 * worst reports a fault in a note. A span wrongly judged a comment would be
 * skipped silently, which is the failure this whole family of defects is.
 */
export function commentRanges(src) {
  const text = String(src);
  const out = [];
  let i = 0;
  let inStr = false;
  while (i < text.length) {
    const c = text[i];
    if (inStr) {
      if (c === '\\') i += 1;
      else if (c === '"') inStr = false;
      i += 1;
      continue;
    }
    if (c === '"') { inStr = true; i += 1; continue; }
    if (c === '/' && text[i + 1] === '/') {
      const end = text.indexOf('\n', i);
      out.push([i, end === -1 ? text.length : end]);
      i = end === -1 ? text.length : end;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      out.push([i, end === -1 ? text.length : end + 2]);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    i += 1;
  }
  return out;
}

/**
 * Every string anywhere inside an imported value -- a module namespace, a
 * catalog array, a nested record. Cycles are guarded, functions are skipped.
 *
 * This is how the WIDER surface is reached without a hand-kept field list. The
 * catalogs' own gate asks each module for a NAMED set of fields (lesson,
 * bigIdea, inApp, benefits, the quiz, the talking points), which is the right
 * scope for a record-id check and is how DR-0545's miss happened: a scope
 * borrowed for a question it was never drawn for. A value walk has no scope to
 * get wrong. Measured on living-lessons-class.js it reaches 46,556 spans where
 * the field list reaches 43,054 -- and 8 faults live in the difference.
 */
export function* deepStrings(value, seen = new Set()) {
  if (typeof value === 'string') { yield value; return; }
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const x of Array.isArray(value) ? value : Object.values(value)) yield* deepStrings(x, seen);
}

/**
 * Scan every referenced span held anywhere in an imported value.
 * `faults` is the number that must not grow; `spans` is the evidence that it
 * looked at anything at all.
 */
export function scanValueSpans(value) {
  const faults = [];
  const uncheckable = [];
  let spans = 0;
  for (const text of deepStrings(value)) {
    for (const m of String(text).matchAll(SPAN_WITH_REFERENCE)) {
      spans += 1;
      const fault = checkSpan({
        quoted: m[1], book: m[2].trim(), chapter: m[3], verses: m[4].trim(), translation: m[5],
      });
      if (!fault) continue;
      (fault.kind === 'no-corpus' ? uncheckable : faults).push(fault);
    }
  }
  return {
    spans, verbatim: spans - faults.length - uncheckable.length, faults, uncheckable,
  };
}

/** Every referenced span of a module, as it is written. */
export function referencedSpans(module, readerTexts) {
  const out = [];
  for (const [where, text] of readerTexts(module)) {
    for (const m of String(text).matchAll(SPAN_WITH_REFERENCE)) {
      out.push({
        where, quoted: m[1], book: m[2].trim(), chapter: m[3], verses: m[4].trim(), translation: m[5],
      });
    }
  }
  return out;
}

/** Scan a series. `faults` is what must stay empty; the totals are the evidence. */
export function scanQuotedVerses(modules, readerTexts) {
  const faults = [];
  const uncheckable = [];
  let spans = 0;
  let verbatim = 0;
  for (const m of modules || []) {
    for (const span of referencedSpans(m, readerTexts)) {
      spans += 1;
      const fault = checkSpan(span);
      if (!fault) { verbatim += 1; continue; }
      // A span naming a translation we do not hold is neither verified nor at
      // fault; it is kept apart so an existing pin never counts it as debt.
      (fault.kind === 'no-corpus' ? uncheckable : faults).push({ id: m.id, where: span.where, ...fault });
    }
    for (const [where, text] of readerTexts(m)) {
      const lowered = loweredHolyNames(text);
      if (lowered.length) faults.push({ kind: 'lowered', id: m.id, where, names: lowered });
    }
  }
  return {
    measuredLessons: (modules || []).length, spans, verbatim, faults, uncheckable,
  };
}

/** One line per fault, written so the author can act on it without a debugger. */
export function describeFault(f) {
  if (f.kind === 'no-corpus') return `${f.id} :: ${f.where} :: (${f.ref}) quotes a translation this repository does not hold, so nothing here can verify it`;
  if (f.kind === 'unresolvable') return `${f.id} :: ${f.where} :: (${f.ref}) is not a verse that exists`;
  if (f.kind === 'lowered') return `${f.id} :: ${f.where} :: writes ${f.names.join(', ')} in lower case in our own voice -- His names are never lowered`;
  if (f.kind === 'shouted') return `${f.id} :: ${f.where} :: (${f.ref}) shouts ${f.words.join(', ')} inside the quotation marks; the verse does not -- put the emphasis in our sentence, not in His words`;
  return [
    `${f.id} :: ${f.where} :: (${f.ref}) does not contain what we quote`,
    `      ours  "${f.quoted}"`,
    `      verse "${f.verse}"`,
    `      not in it: ${f.missing.map((s) => `"${s}"`).join(' | ')}`,
  ].join('\n');
}

// -----------------------------------------------------------------------------
// The other half of the same rule: His names are never lowered.
// -----------------------------------------------------------------------------
// Layer 0 binds BOTH directions -- the adversary's names are never capitalised,
// and Yahweh's are never lowercased. The first direction has had a machine check
// since 2026-09-14 (adversary-is-never-capitalized.test.js, our-voice-only,
// every source file). The second had none, so it was measured on 2026-09-19:
// across app/src there are 79 lowercase occurrences of these names and EVERY ONE
// is a filename, an import path, a JS object key or a css slug -- not one is in
// prose a reader meets. That is why this check scans the RENDERED lesson fields
// rather than raw source: scanning source would have to special-case 79 harmless
// identifiers, and a check full of exemptions is a check waiting to be wrong.
//
// The set is deliberately short. Only names with NO other sense in English are
// here. 'god' is not: Layer 0 itself lowercases the false gods, and the KJV says
// "the god of this world" (2 Corinthians 4:4). 'lord' is not: a parable's master
// is a lord. 'father' and 'son' are not. Including them would force wrong edits
// or need exemptions, and either one would make this gate a liar. Quotations are
// stripped first -- the Word is never touched to fit house style (DR-0076).
// DERIVED, never a second copy. The canonical list is app/src/lib/
// typographic-theology.js -- the same module the READER's explanation renders
// from. One source means the gate, the rule and the page a reader sees cannot
// disagree: adding a name updates all three in the same commit.
export const HOLY_NAMES = HOLY_NAME_WORDS.map((name) => [name, new RegExp(`\\b${name}\\b`, 'g')]);

/** Our own voice: whatever is left once every quoted span is removed. */
export const ourVoice = (text) => String(text).replace(/"[^"]*"/g, ' ');

/** Names of the Godhead written in lower case in our own voice. */
export function loweredHolyNames(text) {
  const ours = ourVoice(text);
  const out = [];
  for (const [name, re] of HOLY_NAMES) {
    re.lastIndex = 0;
    if (re.test(ours)) out.push(name);
  }
  return out;
}
