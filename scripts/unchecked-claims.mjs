#!/usr/bin/env node
// =============================================================================
// unchecked-claims — the third pile is a worklist, and it is counted
// =============================================================================
// Darrell, 2026-10-20, reading sov42 on his phone at step 6 of 31, where the
// page says in its own words: "THIRD PILE, WHAT WE DID NOT CHECK... WE DID NOT
// READ A SINGLE FULL ARTICLE" and "we did not telephone La Roche University,
// Berea College, Hampshire College, Harvard, any legislature or any
// department, and we reproduced none of the numbers."
//
//   "Why aren't we using the research space to do that whenever a lesson
//    needs to?"
//
// THE INSTRUMENT ALREADY EXISTS AND IS POINTED AT ONE LESSON. A GitHub runner
// reads every researched figure back off its publisher's own page
// (scripts/lesson-sources-witness.mjs, DR-0750): red means "the figure no
// longer stands on its source and the LESSON is corrected, never the check."
// It has NO hardcoded lesson -- it is keyed by lesson id, so widening it is
// DATA, not code. app/src/lib/lesson-sources.json holds one lesson of 828.
//
// WHAT THIS MODULE ADDS. Not the checking -- that is the witness's job, and it
// needs a runner with web access, which this sandbox and the NAS writer both
// lack. What is missing is the LIST: nothing counted how many lessons admit
// unchecked material, so the third pile read as a confession rather than a
// worklist. This derives both sides and lets a gate pin the gap:
//
//   admits()  -- lessons whose own text says what they did not check
//   checked() -- lessons whose figures a publisher's page is read back for
//   gap()     -- the first minus the second, which is the work
//
// WHY IT READS BOTH RECORD SHAPES, and why that is the whole reason a gate is
// worth having here. The catalogs hold lessons in TWO forms: the JS literal
// (`id: 'sov32-...'`) and the JSON row (`"id": "sov42-..."`). My first count of
// this used a single-quote pattern only, so every JSON-shaped record was
// silently attributed to the nearest OLDER literal above it -- it reported 4
// lessons when the answer is 9, and it named sov32 for a disclosure that
// belongs to sov42, the lesson actually on his screen. A pattern that matches
// one shape of a two-shaped file does not fail; it answers confidently about
// the wrong record (DR-0076 section 4).
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIB = join(ROOT, 'app', 'src', 'lib');
const SOURCES = join(LIB, 'lesson-sources.json');

/**
 * The house's own words for "we did not check this". Deliberately the phrases
 * the lessons actually use, not a guess at phrasing: each one is in the text of
 * a shipped lesson today.
 */
export const DISCLOSURE = new RegExp([
  'WHAT WE DID NOT CHECK',
  'DID NOT READ A SINGLE FULL ARTICLE',
  'we did not (?:read|telephone|reproduce)',
  'reproduced none of the numbers',
].join('|'), 'gi');

/** A lesson id in EITHER record shape: `id: 'x'` or `"id": "x"`. */
export const LESSON_ID = /(?:\bid:\s*'([^']{5,})'|"id"\s*:\s*"([^"]{5,})")/g;

/** Every lesson-data file, derived rather than listed. */
export function catalogFiles() {
  if (!existsSync(LIB)) return [];
  return readdirSync(LIB).filter((f) => f.endsWith('.js')).sort();
}

/** The id of the record a character offset sits inside, in either shape. */
export function recordIdAt(src, offset) {
  LESSON_ID.lastIndex = 0;
  let id = null;
  for (let m = LESSON_ID.exec(src); m; m = LESSON_ID.exec(src)) {
    if (m.index >= offset) break;
    id = m[1] || m[2];
  }
  return id;
}

/**
 * Lessons whose own text admits unchecked material, as
 * [{ file, lesson, disclosures }] -- the worklist, derived from the lessons
 * themselves so a new one joins it the day it lands.
 */
export function admits() {
  const byLesson = new Map();
  for (const file of catalogFiles()) {
    const src = readFileSync(join(LIB, file), 'utf8');
    DISCLOSURE.lastIndex = 0;
    for (let m = DISCLOSURE.exec(src); m; m = DISCLOSURE.exec(src)) {
      const lesson = recordIdAt(src, m.index);
      if (!lesson) continue;
      const key = `${file}::${lesson}`;
      const row = byLesson.get(key) || { file, lesson, disclosures: 0 };
      row.disclosures += 1;
      byLesson.set(key, row);
    }
  }
  return [...byLesson.values()].sort((a, b) => b.disclosures - a.disclosures);
}

/**
 * Lessons a publisher's own page is read back for, as
 * [{ lesson, rows, figures }] -- straight from the file the witness reads, so
 * this side can never drift from what is actually checked.
 */
export function checked() {
  if (!existsSync(SOURCES)) return [];
  const data = JSON.parse(readFileSync(SOURCES, 'utf8'));
  return Object.entries(data).map(([lesson, rows]) => ({
    lesson,
    rows: (rows || []).length,
    figures: (rows || []).reduce((n, r) => n + ((r && r.says) || []).length, 0),
  })).sort((a, b) => b.figures - a.figures);
}

/** The lessons that admit unchecked material and have no figure read back. */
export function gap() {
  const have = new Set(checked().map((c) => c.lesson));
  return admits().filter((a) => !have.has(a.lesson));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = admits();
  const c = checked();
  const g = gap();
  console.log(`lessons admitting unchecked material: ${a.length} (${a.reduce((n, x) => n + x.disclosures, 0)} disclosures)`);
  for (const x of a) console.log(`   ${String(x.disclosures).padStart(3)}  ${x.lesson}`);
  console.log(`\nlessons with a figure read back from its publisher: ${c.length}`);
  for (const x of c) console.log(`   ${String(x.figures).padStart(3)} figure(s) in ${x.rows} row(s)  ${x.lesson}`);
  console.log(`\nTHE WORK: ${g.length} lesson(s) admit unchecked material with no source row yet.`);
  for (const x of g) console.log(`   ${x.lesson}`);
}
