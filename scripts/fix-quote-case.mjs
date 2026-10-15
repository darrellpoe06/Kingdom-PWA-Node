#!/usr/bin/env node
// =============================================================================
// fix-quote-case — restore the verse's own capitalisation inside quotations
// =============================================================================
// The provenance audit separated out a class worth 684 quotations: prose that
// quotes the cited verse EXACTLY except for the case of its opening letter,
// because the writer lowercased the verse's first word to fit it mid-sentence.
// It reads naturally and it is still an alteration of the text — the same family
// the L126 whole-span sweep treats as a real defect, and the house standard
// (visible in L126, which has none) is to keep the verse's own case.
//
// THE RULE, and it is deliberately narrow (DR-0210 forbids blind sweeps):
//   A quotation is rewritten ONLY when changing the case of its FIRST character
//   alone turns it into an exact substring of the cited verse. Nothing else is
//   touched — not a word, not a mark, not a later capital. Anything ambiguous is
//   left for a person.
//
// IT ONLY EVER RAISES, which is what the paragraph above actually describes
// ("the writer lowercased the verse's first word") and is NOT what the first cut
// did (DR-1031). The implementation flipped the first character in WHICHEVER
// direction made the span match, so pointed at the whole tree it proposed 219
// edits of which 33 went the other way: our opening capital LOWERED to match a
// word sitting mid-verse — "Ye shall know the truth" (John 8:32) rewritten to
// "ye shall know the truth" inside our own sentence. That is a house-style call
// about how His words are presented where one of our sentences begins, not a
// verbatim correction, and `quoted-verse-is-the-verse.mjs` says in its own header
// that the raised form is allowed ("capitalising a span that opens one, changes
// no word of His") even though its code reports it. Until that conflict is
// settled by the Governor, this tool restores capitals and never removes them.
//
// AND EVERY FIX IS VALIDATED AGAINST THE EXACTLY-CITED VERSE before it is
// offered. The resolver below reads v1..(v2||v1)+2 — two verses PAST the
// citation — so on its own it could make a span verbatim against the verse NEXT
// DOOR, which is the defect quoted-verse-is-the-verse was built to catch. 218 of
// the 219 first-cut proposals did match their exact citation; the window is left
// as it is because its purpose is not documented, and the exact check is what
// makes that safe.
//
//   node scripts/fix-quote-case.mjs           # dry run: report what would change
//   node scripts/fix-quote-case.mjs --write   # apply
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalBook } from './scripture-provenance-audit.mjs';
import { QUOTED_SOURCES as SCANNED } from './quoted-sources.mjs';
import { verseText } from './quoted-verse-is-the-verse.mjs';

/**
 * The text of EXACTLY what a span cites, through the strict scanner's own
 * resolver — so a fix is never validated against the verse next door. Returns
 * null when the citation does not resolve, and a fix is then not offered.
 */
function exactVerse(book, chapter, v1, v2) {
  return verseText(book, Number(chapter), v2 ? `${v1}-${v2}` : String(v1));
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV = join(ROOT, 'app/public/bible/kjv');

const cache = new Map();
function verses(book, ch, v1, v2) {
  const f = canonicalBook(book);
  const path = join(KJV, `${f}.json`);
  if (!existsSync(path)) return null;
  if (!cache.has(f)) cache.set(f, JSON.parse(readFileSync(path, 'utf8')).chapters);
  const chapter = cache.get(f)[ch - 1];
  if (!chapter) return null;
  const out = [];
  for (let v = v1; v <= (v2 || v1); v += 1) {
    if (typeof chapter[v - 1] !== 'string') return null;
    out.push(chapter[v - 1]);
  }
  return out.join(' ');
}

// Straight AND typographic quote marks — see the note in the audit script: a
// quotation the tool cannot see is a quotation with no gate on it.
const QUOTE_RE = /(["“])([^"”]{15,})(["”])\s*\(((?:[123]\s)?[A-Za-z][A-Za-z ]*?\.?)\s(\d+):(\d+)(?:[-–](\d+))?\)/g;
const norm = (s) => String(s).replace(/[‘’']/g, "'");

export function planFixes(src) {
  const fixes = [];
  for (const m of src.matchAll(QUOTE_RE)) {
    const quoted = m[2];
    if (!quoted.length) continue;
    const v1 = Number(m[6]);
    const v2 = m[7] ? Number(m[7]) : null;
    const text = verses(m[4], Number(m[5]), v1, (v2 || v1) + 2);
    if (!text) continue;
    const hay = norm(text);
    const q = norm(quoted).replace(/\\'/g, "'");
    if (hay.includes(q)) continue;                     // already verbatim
    const first = quoted[0];
    // RAISE ONLY. A character that is already a capital is left exactly as the
    // author wrote it; see the header. `toUpperCase() !== first` also skips a
    // first character with no case at all (a digit, a bracket).
    if (first !== first.toLowerCase() || first.toUpperCase() === first) continue;
    const flipped = first.toUpperCase() + quoted.slice(1);
    if (!hay.includes(norm(flipped).replace(/\\'/g, "'"))) continue; // not a case-only difference
    // And it must be verbatim in the verse this span actually NAMES, not in one
    // of the two that follow it (see the header).
    const exact = exactVerse(m[4], m[5], m[6], m[7]);
    if (exact === null || !exact.includes(flipped.replace(/\\'/g, "'"))) continue;
    fixes.push({
      index: m.index,
      length: m[0].length,
      ref: `${m[4]} ${m[5]}:${m[6]}${m[7] ? `-${m[7]}` : ''}`,
      from: quoted.slice(0, 60),
      to: flipped.slice(0, 60),
      replacement: m[0].replace(`${m[1]}${quoted}${m[3]}`, `${m[1]}${flipped}${m[3]}`),
    });
  }
  return fixes;
}

// Only when RUN, never when imported. Without this guard a test or another
// script that imports planFixes also walks every file in QUOTED_SOURCES and
// prints a line for each -- which is how the first cut of DR-1031's own
// validation buried its result under 1,132 lines of someone else's output.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
const write = process.argv.includes('--write');
let total = 0;
for (const rel of isMain ? SCANNED : []) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) continue;
  const src = readFileSync(path, 'utf8');
  const fixes = planFixes(src);
  total += fixes.length;
  console.log(`${rel}: ${fixes.length} quotation(s) differ from the cited verse by opening case alone`);
  for (const f of fixes.slice(0, 5)) console.log(`   ${f.ref.padEnd(22)} "${f.from}…" -> "${f.to}…"`);
  if (write && fixes.length) {
    let out = src;
    // Apply from the end so earlier offsets stay valid.
    for (const f of [...fixes].sort((a, b) => b.index - a.index)) {
      out = out.slice(0, f.index) + f.replacement + out.slice(f.index + f.length);
    }
    writeFileSync(path, out);
    console.log(`   -> written`);
  }
}
if (isMain) console.log(`\n${write ? 'Applied' : 'Would apply'} ${total} case restoration(s) across ${SCANNED.length} source file(s).`);
