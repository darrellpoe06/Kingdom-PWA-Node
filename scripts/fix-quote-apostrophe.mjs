#!/usr/bin/env node
// =============================================================================
// fix-quote-apostrophe — restore the corpus apostrophe inside quotations
// =============================================================================
// THE CORPUS SETTLES THIS ONE, which is why it can be mechanical. Measured over
// app/public/bible/kjv: 1,997 apostrophes, every one of them U+2019, and ZERO
// ASCII "'". So inside a span quoted as Scripture a straight apostrophe is never
// the text -- "the LORD's" is not what Psalm 24:1 says, "the LORD’s" is. There is
// no verse to weigh it against and no judgement to make.
//
// WHY THE CASE FIXER COULD NOT SEE THIS. scripts/fix-quote-case.mjs normalises
// with `replace(/[‘’']/g, "'")` before comparing, so it folds the two forms
// together and the difference disappears from its view by construction. The same
// blindness is in scripture-provenance-audit.mjs. This script normalises
// everything those do EXCEPT the apostrophe, which is the only reason it sees
// the class at all.
//
// THE RULE, as narrow as the case fixer's (DR-0210 forbids blind sweeps):
//   A quotation is rewritten ONLY when replacing its straight apostrophes with
//   U+2019 -- and changing nothing else, not a word, not a mark, not a capital --
//   turns it into an exact substring of the verse it NAMES. Our own prose is
//   never touched: a contraction in our voice may be written either way, and
//   only text inside quotation marks that carry a reference is considered.
//
//   An ELIDED span is judged piece by piece, which the first cut of this script
//   got wrong. It declined "And Joseph bought all the land of Egypt for
//   Pharaoh... so the land became Pharaoh's" (Genesis 47:20) because the ellipsis
//   means no whole-span substring test can ever match -- so the one site in the
//   repository that needed the elided form was the one site it skipped, and the
//   zero rule in every-catalog-quotes-the-verse.test.js is what caught it.
//
//   node scripts/fix-quote-apostrophe.mjs           # dry run: report
//   node scripts/fix-quote-apostrophe.mjs --write   # apply
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SPAN_WITH_REFERENCE, verseText } from './quoted-verse-is-the-verse.mjs';
import { QUOTED_SOURCES } from './quoted-sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CURLY = '’';

/**
 * Every repair this file needs, as {index, length, replacement} against the
 * source text. Pure: it takes the source and returns a plan, so the test can
 * prove the rule without writing anything to disk.
 */
const ELLIPSIS = /\.\.\.|…/;

/**
 * Is `span` carried by `verse`? A span with an ellipsis is judged PIECE BY
 * PIECE, because an elided quotation is still quoting -- "for Pharaoh... so the
 * land became Pharaoh's" alters His text by exactly the same one character as an
 * unelided span, and a whole-span substring test can never see it. The elision
 * itself belongs to quotation-integrity and DR-0459; this only asks whether each
 * side is His words.
 */
function carries(verse, span) {
  if (!ELLIPSIS.test(span)) return verse.includes(span);
  const pieces = span.split(ELLIPSIS).map((p) => p.trim()).filter(Boolean);
  return pieces.length > 0 && pieces.every((p) => verse.includes(p));
}

export function planApostropheFixes(src) {
  const fixes = [];
  for (const m of String(src).matchAll(SPAN_WITH_REFERENCE)) {
    const raw = m[1];
    // A straight apostrophe inside a single-quoted JS string is written \'.
    const ours = raw.replace(/\\'/g, "'");
    if (!ours.includes("'")) continue;
    const verse = verseText(m[2], m[3], m[4]);
    if (verse === null) continue;              // unresolvable is not this script's business
    if (carries(verse, ours)) continue;        // already the verse, straight mark and all
    const swapped = ours.replace(/'/g, CURLY);
    if (!carries(verse, swapped)) continue;    // more than the apostrophe differs -- leave it
    fixes.push({
      index: m.index,
      length: m[0].length,
      ref: `${m[2]} ${m[3]}:${m[4]}`,
      from: ours.slice(0, 70),
      to: swapped.slice(0, 70),
      replacement: m[0].replace(`"${raw}"`, `"${raw.replace(/\\'/g, CURLY).replace(/'/g, CURLY)}"`),
    });
  }
  return fixes;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  let total = 0;
  for (const rel of QUOTED_SOURCES) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const src = readFileSync(path, 'utf8');
    const fixes = planApostropheFixes(src);
    if (!fixes.length) continue;
    total += fixes.length;
    console.log(`${rel}: ${fixes.length} quotation(s) differ from the cited verse by the apostrophe alone`);
    for (const f of fixes) console.log(`   ${f.ref.padEnd(22)} "${f.from}"`);
    if (write) {
      let out = src;
      // Apply from the end so earlier offsets stay valid.
      for (const f of [...fixes].sort((a, b) => b.index - a.index)) {
        out = out.slice(0, f.index) + f.replacement + out.slice(f.index + f.length);
      }
      writeFileSync(path, out);
      console.log('   -> written');
    }
  }
  console.log(`\n${write ? 'Applied' : 'Would apply'} ${total} apostrophe restoration(s) across ${QUOTED_SOURCES.length} source file(s).`);
}
