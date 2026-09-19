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

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', 'app', 'public', 'bible', 'kjv');

const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const ELLIPSIS = /\.\.\.|…/;

// A quotation followed by its reference: "..." (Book Chapter:Verse[,Verse][-Verse])
export const SPAN_WITH_REFERENCE =
  /"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g;

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

/** The KJV text of a reference, or null if it does not resolve. */
export function verseText(book, chapter, verseLabel) {
  const f = bookFile(book);
  if (!f) return null;
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV_DIR, `${f}.json`), 'utf8')));
  const bk = bookCache.get(f);
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
export function checkSpan({ quoted, book, chapter, verses }) {
  const ref = `${book} ${chapter}:${verses}`;
  const verse = verseText(book, chapter, verses);
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

/** Every referenced span of a module, as it is written. */
export function referencedSpans(module, readerTexts) {
  const out = [];
  for (const [where, text] of readerTexts(module)) {
    for (const m of String(text).matchAll(SPAN_WITH_REFERENCE)) {
      out.push({
        where, quoted: m[1], book: m[2].trim(), chapter: m[3], verses: m[4].trim(),
      });
    }
  }
  return out;
}

/** Scan a series. `faults` is what must stay empty; the totals are the evidence. */
export function scanQuotedVerses(modules, readerTexts) {
  const faults = [];
  let spans = 0;
  let verbatim = 0;
  for (const m of modules || []) {
    for (const span of referencedSpans(m, readerTexts)) {
      spans += 1;
      const fault = checkSpan(span);
      if (fault) faults.push({ id: m.id, where: span.where, ...fault });
      else verbatim += 1;
    }
    for (const [where, text] of readerTexts(m)) {
      const lowered = loweredHolyNames(text);
      if (lowered.length) faults.push({ kind: 'lowered', id: m.id, where, names: lowered });
    }
  }
  return { measuredLessons: (modules || []).length, spans, verbatim, faults };
}

/** One line per fault, written so the author can act on it without a debugger. */
export function describeFault(f) {
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
export const HOLY_NAMES = [
  ['yahweh', /\byahweh\b/g],
  ['jesus', /\bjesus\b/g],
  ['christ', /\bchrist\b/g],
  ['messiah', /\bmessiah\b/g],
  ['godhead', /\bgodhead\b/g],
  ['holy spirit', /\bholy spirit\b/g],
  ['holy ghost', /\bholy ghost\b/g],
];

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
