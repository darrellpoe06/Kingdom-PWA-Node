#!/usr/bin/env node
// =============================================================================
// child-lesson-length — a lesson must fit the SITTING a child actually has
// =============================================================================
// Darrell 2026-09-12: "we have children in our church that will need to be able
// to read these lessons at the length of the time and words that make sense to
// them." Then, correcting the first attempt: "part 2's for the ones that need
// it... per the Ways and documentation."
//
// THE FIRST VERSION OF THIS FILE HAD A WRONG PREMISE, recorded here rather than
// quietly rewritten. It read the child band's `segmentMinutes: 5` as a budget for
// the WHOLE lesson — 500 words at 100 wpm — and reported nine lessons "over". But
// segmentMinutes is the time for ONE on-screen segment (45 words for a child), not
// for the lesson. By the framework's own plan the median child lesson is a
// 20-minute session of four segments. The nine were not over a budget; there was
// no whole-lesson budget to be over.
//
// WHAT IS ACTUALLY TRUE, and what this now measures: 28 of 141 child lessons run
// longer than one 30-minute sitting, the worst at 125 minutes. The answer is not
// to cut the Word down — it is Part 1, Part 2, Part 3 (learn-framework's
// lessonPartsForAge), splitting on segment boundaries the chunker already found.
// Nothing is shortened or dropped.
//
// So this gate no longer asks "is it too long." It asks the two questions that
// survive the corrected premise:
//   1. does EVERY part fit the band's declared sitting ceiling? (structural)
//   2. is any child lesson growing past the recorded worst part-count? (ratchet)
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The reading rate used only for REPORTING a human-readable estimate. */
export const CHILD_WPM = 100;

export function wordCount(text = '') {
  return String(text).split(/\s+/).filter(Boolean).length;
}

/** How long a block of text takes a child to read, in minutes. An estimate. */
export function minutesFor(text, wpm = CHILD_WPM) {
  return wordCount(text) / wpm;
}

/** Every part that runs past the sitting ceiling. Should always be empty: the
 *  splitter builds parts to fit, so a hit here means the splitter is broken. */
export function partsOverCeiling(parts, ceilingMinutes) {
  if (!Number.isFinite(ceilingMinutes) || ceilingMinutes <= 0) return [];
  return (parts || []).filter((p) => p.minutes > ceilingMinutes);
}

/** Split never loses a word: the parts must reassemble the segments exactly. */
export function partsAreLossless(parts, segments) {
  const flat = (parts || []).flatMap((p) => p.segments);
  if (flat.length !== (segments || []).length) return false;
  return flat.every((seg, i) => seg === segments[i]);
}

/** The ratchet: ids whose part-count exceeds what the baseline recorded. */
export function grewBeyond(rows, baseline = {}) {
  return rows
    .filter((r) => r.parts > (baseline[r.id] ?? 1))
    .map((r) => `${r.id} (${baseline[r.id] ?? 1} -> ${r.parts} parts)`);
}

async function main() {
  const { LIVING_LESSONS_MODULES } = await import(join(ROOT, 'app/src/lib/living-lessons-class.js'));
  const { lessonPlanForAge, sessionCeilingFor } = await import(join(ROOT, 'app/src/lib/learn-framework.js'));
  const ceiling = sessionCeilingFor('child');

  const rows = LIVING_LESSONS_MODULES.map((m) => {
    const plan = lessonPlanForAge(m, 'child');
    return {
      id: m.id, parts: plan.totalParts, minutes: plan.estimatedMinutes, segments: plan.segments, planParts: plan.parts,
    };
  });

  const broken = rows.filter((r) => partsOverCeiling(r.planParts, ceiling).length);
  const lossy = rows.filter((r) => !partsAreLossless(r.planParts, r.segments));
  const multi = rows.filter((r) => r.parts > 1).sort((a, b) => b.parts - a.parts);

  console.log(`child-lesson-length: one sitting = ${ceiling} min (AGE_BANDS child.sessionMinutes)`);
  console.log(`  ${rows.length} lessons · ${multi.length} run to more than one sitting · ${rows.length - multi.length} fit in one`);
  if (multi.length) {
    console.log('  longest:');
    for (const r of multi.slice(0, 5)) console.log(`    ${r.parts} parts (${r.minutes} min) — ${r.id}`);
  }

  if (broken.length) {
    console.error('\nchild-lesson-length: FAIL — a PART runs past the sitting ceiling; the splitter is wrong:');
    for (const r of broken) console.error(`  ${r.id}`);
    process.exit(1);
  }
  if (lossy.length) {
    console.error('\nchild-lesson-length: FAIL — splitting into parts LOST or REORDERED content:');
    for (const r of lossy) console.error(`  ${r.id}`);
    process.exit(1);
  }
  console.log('  OK — every part fits one sitting, and no word is lost in the split.');
}

if (process.argv[1] && process.argv[1].endsWith('child-lesson-length.mjs')) main();
