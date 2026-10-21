#!/usr/bin/env node
// =============================================================================
// one-teaching-one-lesson-guard — two lessons built from one teaching (DR-1185)
// =============================================================================
// Darrell, 2026-10-21: "Same lesson from before?!!!!!!!!!!!!!!!!!!!!!!!
// Really?!!!!!!" -- and he was right; nothing in the suite could see it.
//
// The rule lives in app/src/lib/one-teaching-one-lesson.js and is proven there
// against the live catalog. This guard runs it so the measurement PRINTS on
// every gate run, which is what turns the one recorded pair into a decision
// Darrell can make in a line instead of an investigation.
//
// It fails on a duplicate the ledger does not already name. It does NOT fail on
// the recorded one: folding two lessons built from his own spoken teaching is
// an editorial call about Yahweh's Word on a COLG-facing surface, and that is
// his, not a gate's.
//
// RUN WITH `npx vite-node`, NOT `node` (see app/package.json's verify:gates):
// the live catalog imports JSON, and plain node refuses it with
// ERR_IMPORT_ATTRIBUTE_MISSING. Every other guard in that chain is plain node;
// this one is the exception and this line is why.
import { duplicatePairs, newDuplicatePairs, KNOWN_PAIRS, MIN_SHARED_VERSES } from '../app/src/lib/one-teaching-one-lesson.js';
import { buildCatalogCourseDescriptors } from '../app/src/lib/learn-catalog.js';

const courses = buildCatalogCourseDescriptors();
const lessons = courses.reduce((t, c) => t + ((c.schedule || []).length), 0);
const all = duplicatePairs(courses);
const fresh = newDuplicatePairs(courses);

const line = (p) => `${p.course} · ${p.shared} verses shared (${p.pctOfSmaller}% of the smaller) · "${p.titles[0]}" || "${p.titles[1]}"`;

if (fresh.length) {
  console.error(`✗ one-teaching-one-lesson-guard: ${fresh.length} lesson pair(s) are one teaching told twice and are not in the ledger:\n`);
  for (const p of fresh) console.error(`  - ${line(p)}\n      ${p.a}\n      ${p.b}`);
  console.error(`\nSame course, same opening three words of the title, and >= ${MIN_SHARED_VERSES} of the same verses (ranges expanded).`);
  console.error('Fold them into one lesson, or record the pair in KNOWN_PAIRS with why and a re-review date.');
  process.exit(1);
}

console.log(`one-teaching-one-lesson-guard: OK — ${courses.length} courses, ${lessons} lessons, ${all.length} pair(s) found, ${KNOWN_PAIRS.length} recorded, 0 new.`);
for (const p of all) console.log(`  ~ recorded: ${line(p)}`);
for (const k of KNOWN_PAIRS) console.log(`    ${k.why}`);
