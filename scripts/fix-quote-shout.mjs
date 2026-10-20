#!/usr/bin/env node
// =============================================================================
// fix-quote-shout — His words stop shouting; the emphasis moves to ours
// =============================================================================
// THE CORPUS SETTLES THIS ONE TOO, which is the only reason it may be
// mechanical. The KJV text does not shout. Its own small-caps -- LORD, GOD --
// are the verse's and are compared, never assumed (shoutedWords() in
// quoted-verse-is-the-verse.mjs counts a word as shouted ONLY when the verse
// carries that same word in another case). So an ALL-CAPS word inside a span
// quoted as Scripture, where His text has it in lower case, is never the text:
// Numbers 1:3 says "twenty", not "TWENTY". There is no judgement to make about
// His casing -- the verse already made it.
//
// WHAT THIS DOES NOT CLAIM TO DO. The gate's own message is "put the emphasis in
// our sentence, not in His words." This script does the half a machine may do:
// it takes the shout OUT of His words. It cannot write the emphasis back into
// our sentence, because that is authoring. A span repaired here reads plainly;
// whether it wants a bold phrase in the surrounding prose is the writer's call
// and is left to the writer.
//
// THE RULE, as narrow as the apostrophe fixer's (DR-0210 forbids blind sweeps):
//   A quotation is rewritten ONLY when restoring the verse's own casing of each
//   shouted word -- and changing nothing else, not a word, not a mark, not any
//   other capital -- turns the span into text the cited verse CARRIES. Our own
//   prose is never touched; only text inside quotation marks that carry a
//   reference is considered. A span that still differs from the verse after the
//   shout is removed is LEFT ALONE, because then more than the shout is wrong
//   and the remainder is a judgement this script is not entitled to make.
//
//   This is deliberately stricter than "un-shout everything". Un-shouting a span
//   that is also mis-ordered would swap one fault class for another and report
//   progress that is not progress; the gate counts faults, not classes.
//
//   Opening-capital questions are NOT touched. DR-1031 declined to decide
//   whether our opening capital on a word sitting mid-verse should be lowered;
//   that stays declined. A word is only re-cased here when the verse has it in
//   another case AND the whole span then matches, so an opening capital that is
//   ours is never quietly folded into His.
//
//   node scripts/fix-quote-shout.mjs           # dry run: report
//   node scripts/fix-quote-shout.mjs --write   # apply
// =============================================================================
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SPAN_WITH_REFERENCE, verseText, shoutedWords } from './quoted-verse-is-the-verse.mjs';
import { QUOTED_SOURCES } from './quoted-sources.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ELLIPSIS = /\.\.\.|…/;

/**
 * Is `span` carried by `verse`? An elided span is judged PIECE BY PIECE, for the
 * same reason the apostrophe fixer learned to: a whole-span substring test can
 * never match across an ellipsis, so the sites that need it most are the ones a
 * naive test skips.
 */
function carries(verse, span) {
  if (!ELLIPSIS.test(span)) return verse.includes(span);
  const pieces = span.split(ELLIPSIS).map((p) => p.trim()).filter(Boolean);
  return pieces.length > 0 && pieces.every((p) => verse.includes(p));
}

/** The forms the VERSE uses for a word we shouted, in the verse's own casing. */
function verseForms(verse, shouted) {
  const forms = new Set();
  for (const w of String(verse).match(/[A-Za-z]+/g) || []) {
    if (w.toUpperCase() === shouted && w !== shouted) forms.add(w);
  }
  return [...forms];
}

/** Replace whole-word occurrences of `word` in `text` with `form`. */
function recase(text, word, form) {
  return text.replace(new RegExp(`\\b${word}\\b`, 'g'), form);
}

/**
 * Every repair this file needs, as {index, length, replacement} against the
 * source text. Pure: takes the source, returns a plan, writes nothing — so the
 * test can prove the rule without touching disk.
 */
export function planShoutFixes(src) {
  const fixes = [];
  for (const m of String(src).matchAll(SPAN_WITH_REFERENCE)) {
    const raw = m[1];
    const ours = raw.replace(/\\'/g, "'");
    const verse = verseText(m[2], m[3], m[4]);
    if (verse === null) continue;                 // unresolvable is not this script's business
    const shouted = shoutedWords(ours, verse);
    if (!shouted.length) continue;

    // Each shouted word may appear in the verse in more than one casing. Try the
    // combinations and accept only one that leaves the span carried by the verse.
    let candidates = [ours];
    for (const w of shouted) {
      const forms = verseForms(verse, w);
      if (!forms.length) { candidates = []; break; }   // the verse shouts it too; nothing to restore
      const next = [];
      for (const c of candidates) for (const f of forms) next.push(recase(c, w, f));
      candidates = next.slice(0, 64);                   // bounded; no span needs more
    }
    const repaired = candidates.find((c) => carries(verse, c));
    if (!repaired) continue;                            // more than the shout differs -- leave it

    let replacedRaw = raw;
    for (const w of shouted) {
      const form = verseForms(verse, w).find((f) => repaired.includes(f));
      if (form) replacedRaw = recase(replacedRaw, w, form);
    }
    fixes.push({
      index: m.index,
      length: m[0].length,
      ref: `${m[2]} ${m[3]}:${m[4]}`,
      words: shouted,
      from: ours.slice(0, 70),
      to: repaired.slice(0, 70),
      replacement: m[0].replace(`"${raw}"`, `"${replacedRaw}"`),
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
    const fixes = planShoutFixes(src);
    if (!fixes.length) continue;
    total += fixes.length;
    console.log(`${rel}: ${fixes.length} quotation(s) shout a word the cited verse does not`);
    for (const f of fixes) console.log(`   ${f.ref.padEnd(22)} ${f.words.join(',').padEnd(22)} "${f.from}"`);
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
  console.log(`\n${write ? 'Applied' : 'Would apply'} ${total} shout removal(s) across ${QUOTED_SOURCES.length} source file(s).`);
}
