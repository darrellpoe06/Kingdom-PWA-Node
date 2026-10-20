#!/usr/bin/env node
// =============================================================================
// fix-quote-abbreviation — write the book's name out, so the verse can be read
// =============================================================================
// AN ABBREVIATED REFERENCE IS NOT A SMALL UNTIDINESS. bookFile() knows one alias
// (Psalm -> Psalms) and nothing else, so "(1 Cor 2:16)" does not resolve -- and a
// span whose reference does not resolve is a span NEVER COMPARED TO THE VERSE AT
// ALL. The scanner reports it as 'unresolvable' and moves on. So every
// abbreviation is a hole in the checking, not a style preference, and it hides
// whatever else is wrong with the quotation underneath it.
//
// THE WAY WAS ALREADY DECIDED, AND NOT THE WAY I FIRST REACHED FOR. DR-0545
// (2026-09-19) wrote 86 references out by hand rather than teach the resolver
// abbreviations, and said why: *"Teaching bookFile that 'Phil' means
// Philippians is a place a wrong book can hide -- and 'Phil' is genuinely
// ambiguous with Philemon. Writing the name out removes the guess, reads
// properly to a facilitator saying it aloud, and leaves the gate refusing any
// future abbreviation."* This script is that decision made repeatable. I had
// begun building the prefix-resolver DR-0545 refused, and reading the record
// stopped it.
//
// THE RULE:
//   A reference is rewritten ONLY when its book name, case-insensitively, is the
//   prefix of EXACTLY ONE book the corpus holds. One match is a determination.
//   Two is a guess, and this script refuses to make it -- "Phil" (Philemon,
//   Philippians) is reported for a human to settle by reading the quotation, and
//   is left exactly as written. Nothing but the book name changes: not the
//   chapter, not the verse, not one character inside the quotation marks.
//
//   Scope is referencesBesideQuotations() -- the same scope the gate uses, on purpose. A
//   citation in a working comment is a previous session's note to the next
//   author and is not this script's to rewrite.
//
// EXPECT NEW FAULTS, AND WANT THEM. Writing a name out hands the scanner a verse
// it can finally fetch, so a quotation that was merely 'unresolvable' may turn
// out to be 'not-the-verse' as well. DR-0545 met this exactly: *"A twenty-eighth
// fault surfaced only once the abbreviations were written out, which is itself
// the argument for writing them out."*
//
//   node scripts/fix-quote-abbreviation.mjs           # dry run: report
//   node scripts/fix-quote-abbreviation.mjs --write   # apply
// =============================================================================
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { referencesBesideQuotations, bookFile } from './quoted-verse-is-the-verse.mjs';
import { QUOTED_SOURCES } from './quoted-sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app', 'public', 'bible', 'kjv');

let books = null;
/** Every book the corpus actually holds, by filename. */
function corpusBooks() {
  if (books === null) {
    books = readdirSync(KJV_DIR)
      .filter((f) => f.endsWith('.json') && f !== 'index.json')
      .map((f) => f.slice(0, -5));
  }
  return books;
}

/**
 * The book name as PROSE writes it, from the filename the corpus uses.
 * "1Corinthians" -> "1 Corinthians"; "SongofSolomon" -> "Song of Solomon";
 * and "Psalms" -> "Psalm", because a reference names one psalm and that is how
 * every written-out reference in this repository already reads.
 */
export function proseName(file) {
  if (file === 'Psalms') return 'Psalm';
  return file
    .replace(/^([1-3])(?=[A-Z])/, '$1 ')
    .replace(/of(?=[A-Z])/g, ' of ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The one book an abbreviation can mean, or null when it is not one book.
 * Returns {file} on a determination, or {candidates} when it is a guess.
 */
export function resolveAbbreviation(book) {
  const k = String(book).replace(/\s+/g, '').toLowerCase();
  const candidates = corpusBooks().filter((b) => b.toLowerCase().startsWith(k));
  if (candidates.length === 1) return { file: candidates[0] };
  return { candidates };
}

/**
 * Every repair this file needs, plus every abbreviation it REFUSES to repair.
 * Pure: takes the source, returns a plan, writes nothing.
 */
export function planAbbreviationFixes(src) {
  const fixes = [];
  const refused = [];
  for (const span of referencesBesideQuotations(src)) {
    if (bookFile(span.book) !== null) continue;        // already names a book the corpus has
    const r = resolveAbbreviation(span.book);
    if (!r.file) {
      refused.push({ book: span.book, ref: `${span.book} ${span.chapter}:${span.verses}`, candidates: r.candidates });
      continue;
    }
    const full = proseName(r.file);
    fixes.push({
      index: span.index,
      length: span.length,
      from: `${span.book} ${span.chapter}:${span.verses}`,
      to: `${full} ${span.chapter}:${span.verses}`,
      // Only the book name, and only in the reference -- never inside the quotation.
      replacement: span.match.replace(`(${span.book} `, `(${full} `),
    });
  }
  return { fixes, refused };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  let total = 0;
  let stuck = 0;
  for (const rel of QUOTED_SOURCES) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const { fixes, refused } = planAbbreviationFixes(src);
    if (!fixes.length && !refused.length) continue;
    total += fixes.length;
    stuck += refused.length;
    console.log(`${rel}: ${fixes.length} reference(s) to write out${refused.length ? `, ${refused.length} REFUSED` : ''}`);
    for (const f of fixes) console.log(`   ${f.from.padEnd(18)} -> ${f.to}`);
    for (const r of refused) {
      console.log(`   ${r.ref.padEnd(18)} -- ${r.candidates.length ? `AMBIGUOUS: ${r.candidates.join(', ')}` : 'matches no book the corpus holds'}; settle it by reading the quotation`);
    }
    if (write && fixes.length) {
      let out = src;
      // Apply from the end so earlier offsets stay valid.
      for (const f of [...fixes].sort((a, b) => b.index - a.index)) {
        out = out.slice(0, f.index) + f.replacement + out.slice(f.index + f.length);
      }
      writeFileSync(path, out);
      console.log('   -> written');
    }
  }
  console.log(`\n${write ? 'Wrote out' : 'Would write out'} ${total} reference(s); ${stuck} left for a human to settle.`);
}
