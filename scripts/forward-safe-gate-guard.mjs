#!/usr/bin/env node
// =============================================================================
// forward-safe-gate-guard — a forward-safety case may not NAME the number it
// is pretending does not exist yet (DR-1363)
// =============================================================================
// DR-1316 said a lesson gate may not claim to be the last lesson. The repair
// pattern that followed is a "forward-safe" case: append the next lesson's
// number to the course's own list and assert contiguity still holds. The case
// is right. The way it keeps being written is not.
//
// MEASURED — THREE TIMES, THE LAST TWO INSIDE FIXES FOR THE FIRST:
//   1. pm13's forward-safety case appended the LITERAL 14. True while the
//      course ended at 13; false the instant pm14 landed.
//   2. pm14's repair derived it correctly in pm13's gate (length + 1) and then
//      hardcoded 15 in its OWN forward-safety case.
//   3. pm15 landed on 2026-11-06 and #2567 went red on that literal: the list
//      became [1..15, 15] and contiguity failed. A lesson was blocked by the
//      gate of the lesson before it, after the defect had already been named
//      and recorded twice.
//
// THE FAULT IS STRUCTURAL, NOT CARELESS. A literal is true on the day it is
// written and false on exactly the day the case exists to cover. That is the
// definition of a check that cannot catch what it is for, so it becomes a
// machine check rather than a thing the next session is trusted to remember
// (DR-0076 sec. 2 — where a property can be machine-checked, a gate checks it).
//
// WHAT IT LOOKS FOR, narrowly: a line that spreads a course's own module list
// through `.map(` and then appends a bare integer literal before the closing
// bracket. The derived forms (`MODULES.length + 1`, `nums.length + 1`, a
// variable) all pass, because none of them names a number.
//
// IT READS CODE, NOT PROSE. Whole-line comments are blanked first, keeping the
// line count so a report still points at the real line. This is not caution in
// the abstract: twice in one session a scanner of mine matched a forbidden word
// inside a comment promising not to do the thing. A scanner that reads prose as
// code will always find what the prose promises not to do.
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TESTS = join(ROOT, 'app', 'src', '__tests__');

/**
 * Pure. Blank whole-line comments AND the contents of quoted strings, keeping
 * the line count so a report still points at the real line.
 *
 * THE STRING BLANKING IS NOT TIDINESS. This guard's own case file has to hold
 * the defective line verbatim — that is how it proves it catches — and the
 * first run of this guard dutifully flagged four of its own fixtures. A
 * scanner that cannot tell code from a quotation of code reports the test that
 * proves it works as the thing it forbids. The real defective form carries no
 * quotes (`[...PROJECT_MANAGEMENT_MODULES.map((m) => Number(...)), 15]`), so
 * it survives the blanking intact.
 */
export function codeOnly(src = '') {
  return String(src)
    .split('\n')
    .map((l) => {
      if (/^\s*(\/\/|\/\*|\*)/.test(l)) return '';
      // Quoted spans become empty quotes: a quotation of code is data.
      return l
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/`(?:[^`\\]|\\.)*`/g, '``');
    })
    .join('\n');
}

/**
 * Pure. Lines where a module list is extended by a NAMED number.
 * Returns [{ line, text }] with 1-based line numbers.
 */
export function literalNextNumbers(src = '') {
  const out = [];
  const lines = codeOnly(src).split('\n');
  lines.forEach((text, i) => {
    // The list must be the course's own, spread and mapped — not any array.
    if (!/\.\.\.\s*\w*MODULES\b/.test(text)) return;
    if (!/\.map\(/.test(text)) return;
    // ...and then a bare integer appended before the close.
    const m = /,\s*(\d+)\s*\]/.exec(text);
    if (m) out.push({ line: i + 1, text: text.trim(), number: Number(m[1]) });
  });
  return out;
}

/**
 * Pure. A PER-LESSON gate pinning the whole course's length to a literal.
 *
 * THE FOURTH SHAPE OF ONE CLASS IN ONE DAY (DR-1363 amended). A per-lesson gate has no
 * business claiming the course's size: `expect(SOFTWARE_PM_MODULES.length)
 * .toBe(11)` inside spm11's own gate is the claim that nothing will ever follow
 * spm11, which only a twelfth lesson can falsify — and spm12 did, today.
 *
 * MEASURED before this was written, which is the only reason it exists: eight
 * gates in the suite pin a MODULES length, and exactly ONE of them sits in a
 * per-lesson `*-verses.test.js` file — the one that broke. The other seven are
 * course-level gates (`*-course.test.js`, `*-class.test.js`, sections), where
 * "this finished course has exactly 8 lessons" is a true and useful claim. So
 * the rule is scoped to per-lesson gates and has zero false positives, unlike a
 * blanket ban, which would have refused all seven.
 */
export function courseLengthInLessonGate(src = '', fileName = '') {
  if (!/-verses\.test\.jsx?$/.test(fileName)) return [];
  const out = [];
  codeOnly(src)
    .split('\n')
    .forEach((text, i) => {
      const m = /([A-Z][A-Z0-9_]*MODULES)\.length\s*\)?[^)]*\)\s*\.toBe\(\s*(\d+)\s*\)/.exec(text);
      if (m) out.push({ line: i + 1, text: text.trim(), list: m[1], number: Number(m[2]) });
    });
  return out;
}

export function scan(dir = TESTS) {
  const findings = [];
  let files = 0;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.test.js')) continue;
    files += 1;
    const src = readFileSync(join(dir, name), 'utf8');
    for (const hit of literalNextNumbers(src)) {
      findings.push({ file: `app/src/__tests__/${name}`, kind: 'literal-next-number', ...hit });
    }
    for (const hit of courseLengthInLessonGate(src, name)) {
      findings.push({ file: `app/src/__tests__/${name}`, kind: 'course-length-in-lesson-gate', ...hit });
    }
  }
  return { files, findings };
}

export function main() {
  const { files, findings } = scan();
  if (!findings.length) {
    console.log(`forward-safe-gate-guard: OK — ${files} test file(s); no forward-safety case names the number it is simulating.`);
    return 0;
  }
  console.error(`forward-safe-gate-guard: ${findings.length} finding(s):`);
  for (const f of findings) {
    const what =
      f.kind === 'course-length-in-lesson-gate' ? `a per-lesson gate pins ${f.list}.length to ${f.number}` : `appends the literal ${f.number} to a module list`;
    console.error(`  ${f.file}:${f.line} ${what}`);
    console.error(`    ${f.text}`);
  }
  console.error('\nBoth shapes are one claim: that nothing will ever follow this lesson.');
  console.error('A forward-safety case that names the next number is true until that number');
  console.error('exists, which is the one moment it is meant to cover. Derive it instead:');
  console.error('    const next = COURSE_MODULES.length + 1;');
  console.error("And a PER-LESSON gate must not pin the course's length at all — assert its");
  console.error('own index and that the length never shrinks, and leave the total to the');
  console.error('course-level gate, where it is a true claim about a finished course.');
  console.error('This bit three times before it became a gate (DR-1316, DR-1363).');
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main());
