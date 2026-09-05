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
//   node scripts/fix-quote-case.mjs           # dry run: report what would change
//   node scripts/fix-quote-case.mjs --write   # apply
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCANNED, canonicalBook } from './scripture-provenance-audit.mjs';

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

const QUOTE_RE = /"([^"]{15,})"\s*\(((?:[123]\s)?[A-Za-z][A-Za-z ]*?\.?)\s(\d+):(\d+)(?:[-–](\d+))?\)/g;
const norm = (s) => String(s).replace(/[‘’']/g, "'");

export function planFixes(src) {
  const fixes = [];
  for (const m of src.matchAll(QUOTE_RE)) {
    const quoted = m[1];
    if (!quoted.length) continue;
    const v1 = Number(m[4]);
    const v2 = m[5] ? Number(m[5]) : null;
    const text = verses(m[2], Number(m[3]), v1, (v2 || v1) + 2);
    if (!text) continue;
    const hay = norm(text);
    const q = norm(quoted).replace(/\\'/g, "'");
    if (hay.includes(q)) continue;                     // already verbatim
    const first = quoted[0];
    const flipped = (first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase()) + quoted.slice(1);
    if (!hay.includes(norm(flipped).replace(/\\'/g, "'"))) continue; // not a case-only difference
    fixes.push({
      index: m.index,
      length: m[0].length,
      ref: `${m[2]} ${m[3]}:${m[4]}${m[5] ? `-${m[5]}` : ''}`,
      from: quoted.slice(0, 60),
      to: flipped.slice(0, 60),
      replacement: m[0].replace(`"${quoted}"`, `"${flipped}"`),
    });
  }
  return fixes;
}

const write = process.argv[2] === '--write';
let total = 0;
for (const rel of SCANNED) {
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
console.log(`\n${write ? 'Applied' : 'Would apply'} ${total} case restoration(s).`);
