// @vitest-environment node
// =============================================================================
// A declared word keeps its seat inside the window the product uses (DR-1129)
// =============================================================================
// FOUND BY A GATE, ON A REAL PR. #2166 (the L79 lesson, released by Darrell on
// 2026-10-20 with "Don't hold it finish it!!!!!!") went red on exactly one test
// of 6,310: course-plain-words.test.js, "the ranking debt is COUNTED, not
// hidden", reporting `kingdom-economics: work: expected 1 to be less than or
// equal to 0`. Every other leg of that CI run was green -- guards, probes,
// layout, curriculum, and eleven tenancy suites.
//
// IT WAS NOT THAT PR'S DEFECT. The same file on a tree at main 36943d755
// passes 23 of 23. What the PR did was add lessons, and lessons are what pushed
// a promise over a threshold that had been there all along.
//
// WHAT DR-1049 CLAIMED, AND WHERE IT IS WRONG. It deals the plain-word tier
// round-robin by course and records: "every course that declared the word is
// reachable within the first N rows, N being the number of such courses,
// whatever the catalog grows to." N counts from the TIER'S start. The tier sits
// below title (4) and anchor-reference (3), and those rows grow with the
// catalog like any others, so a course that declared the word is pushed out of
// the window by courses that never declared it.
//
// MEASURED 2026-10-20 with `npx vite-node` (bare `node` dies on
// ERR_IMPORT_ATTRIBUTE_MISSING for lesson-dates.json), on the branch that was
// red:
//
//     word   | declared by | kingdom-economics first at | rows before it
//     work   |      7      |            41              | 40, from 17 courses
//     money  |     18      |            27              | 26, from 17 courses
//
// SEVENTEEN distinct courses precede it for BOTH, though only 7 declare `work`.
// The window is 40. `money` keeps its promise by luck; `work` misses by ONE
// ROW. Growth decides which -- the very thing the round-robin existed to stop.
//
// THE FIXTURE HERE IS STRUCTURAL, NOT THAT BRANCH'S CONTENT. A test that needed
// #2166's lessons to fail would stop meaning anything the moment they merged.
// So these cases build the CONDITION -- one declaring course buried under title
// matches from courses that never declared the word -- which is reproducible at
// any catalog size and cannot expire. (A check whose evidence can expire stops
// meaning something while still printing green: the lesson DR-1025 recorded
// when filling L79 disarmed three checks keyed on an open gap.)
import { describe, it, expect } from 'vitest';
import { buildLessonIndex, searchLessons } from '../lib/learn-organize.js';

// THE CLAIM COURSES MUST BE REAL KEYS, and that cost me two false passes.
// learn-organize.js resolves a declared word with `plainWordsFor(c.key)` — the
// registry in learn-plain-words.js, keyed by COURSE KEY — not from anything on
// the course object. My first fixture invented keys c1..c7 and set
// `meta.plainWords`, which the ranker never reads: those courses declared
// NOTHING, the plain tier was empty, and the seat logic never ran. Two cases
// still went green, because the keys I happened to use elsewhere
// (kingdom-economics, project-management, living-lessons) ARE in the registry
// and do declare `work`. A fixture that declares nothing proves nothing, and it
// looks exactly like one that works.
//
// These are the seven real declarers of `work`, measured from the registry.
const WORK_DECLARERS = Object.freeze([
  'kingdom-economics', 'car-research-who-invented-the-car', 'management-stewardship',
  'rent-to-own-business', 'project-management', 'living-lessons', 'eternal-wisdom',
]);

/**
 * A catalog where `flood` courses have the word in every lesson TITLE and never
 * declare it, and `claim` courses are real registry keys that declare it while
 * mentioning it only in the body. Titles outrank the plain tier, so without a
 * reserved seat the declaring courses fall off the end of the window.
 */
function catalog({ word, flood, floodLessons, claim }) {
  const courses = [];
  for (let f = 0; f < flood; f += 1) {
    courses.push({
      key: `flood-${f}`,
      meta: { title: `Flood ${f}`, plainWords: [] },
      schedule: Array.from({ length: floodLessons }, (_, i) => ({
        id: `flood-${f}-${i}`, title: `The ${word} of it, part ${i}`, summary: 'x',
      })),
    });
  }
  for (const key of claim) {
    courses.push({
      key,
      meta: { title: key, plainWords: [word] },
      schedule: [{ id: `${key}-1`, title: 'Something else entirely', summary: `about ${word}` }],
    });
  }
  return courses;
}

const WORD = 'work';
const LIMIT = 40;

describe('PROVEN-TO-CATCH: the defect that actually happened', () => {
  it('a declaring course buried under title matches still reaches the window', () => {
    // 10 flooding courses x 5 lessons = 50 title rows, more than the window, so
    // every declaring course would be off the end without a seat.
    const courses = catalog({
      word: WORD, flood: 10, floodLessons: 5,
      claim: ['kingdom-economics', 'project-management', 'living-lessons'],
    });
    const index = buildLessonIndex(courses);
    const keys = (searchLessons(index, WORD, LIMIT) || []).map((r) => r.courseKey);
    for (const k of ['kingdom-economics', 'project-management', 'living-lessons']) {
      expect(keys, `${k} declared "${WORD}" and must be reachable in ${LIMIT} rows`).toContain(k);
    }
  });

  it('the flood really does fill the window, so the case is not vacuous', () => {
    // Anti-theater: if the title rows did NOT exceed the window, the first case
    // would pass with or without the fix and prove nothing.
    const courses = catalog({ word: WORD, flood: 10, floodLessons: 5, claim: [] });
    const rows = searchLessons(buildLessonIndex(courses), WORD, LIMIT) || [];
    expect(rows.length).toBe(LIMIT);
    expect(new Set(rows.map((r) => r.courseKey)).size).toBeGreaterThan(1);
  });

  it('the window is still full, and still the size asked for', () => {
    const courses = catalog({
      word: WORD, flood: 10, floodLessons: 5, claim: ['kingdom-economics'],
    });
    const rows = searchLessons(buildLessonIndex(courses), WORD, LIMIT) || [];
    expect(rows.length).toBe(LIMIT);
  });
});

describe('a seat is taken from the lowest rank, and nothing a reader sees is reordered', () => {
  it('title matches still lead the window', () => {
    const courses = catalog({
      word: WORD, flood: 3, floodLessons: 3, claim: ['kingdom-economics'],
    });
    const rows = searchLessons(buildLessonIndex(courses), WORD, LIMIT) || [];
    expect(rows[0].courseKey.startsWith('flood-')).toBe(true);
  });

  it('a seat never displaces another declaring course\'s only row', () => {
    // Trading one broken promise for another is not a fix. All seven real
    // declarers of `work`, with the window already full of title rows.
    const claim = [...WORK_DECLARERS];
    const courses = catalog({ word: WORD, flood: 8, floodLessons: 5, claim });
    const keys = (searchLessons(buildLessonIndex(courses), WORD, LIMIT) || [])
      .map((r) => r.courseKey);
    const missing = claim.filter((k) => !keys.includes(k));
    expect(missing).toEqual([]);
  });

  it('when everything already fits, the result is untouched', () => {
    // The seat logic must be a no-op below the window, or it would reorder
    // results nobody asked it to touch.
    const courses = catalog({
      word: WORD, flood: 2, floodLessons: 2, claim: ['kingdom-economics'],
    });
    const index = buildLessonIndex(courses);
    const wide = (searchLessons(index, WORD, 500) || []).map((r) => r.id);
    const narrow = (searchLessons(index, WORD, wide.length) || []).map((r) => r.id);
    expect(narrow).toEqual(wide);
  });

  it('a word nobody declared is unaffected, so the seat is not matching everything', () => {
    const courses = catalog({ word: WORD, flood: 4, floodLessons: 3, claim: ['kingdom-economics'] });
    const rows = searchLessons(buildLessonIndex(courses), 'undeclaredzzz', LIMIT) || [];
    expect(rows).toEqual([]);
  });
});

describe('the real registry, on the real catalog', () => {
  it('every declared word reaches its own course at the product window', async () => {
    // The same walk course-plain-words.test.js makes, kept here so this file
    // fails too if the seat regresses -- one defect, two independent readers.
    const { COURSE_PLAIN_WORDS } = await import('../lib/learn-plain-words.js');
    const { LEARN_CATALOG } = await import('../lib/learn-catalog.js');
    const { buildEternalProcessingCourses } = await import('../lib/eternal-algorithms-course.js');
    const courses = [
      ...LEARN_CATALOG.map((e) => ({ key: e.key, meta: e.meta, schedule: e.buildScheduleRows() })),
      ...buildEternalProcessingCourses(),
    ];
    const index = buildLessonIndex(courses);
    const dead = [];
    let declared = 0;
    for (const [key, words] of Object.entries(COURSE_PLAIN_WORDS)) {
      if (!courses.some((c) => c.key === key)) continue;
      for (const w of words) {
        declared += 1;
        const hit = (searchLessons(index, w, LIMIT) || []).some((r) => r.courseKey === key);
        if (!hit) dead.push(`${key}: ${w}`);
      }
    }
    expect(declared, 'the walk covers the real registry').toBeGreaterThan(200);
    expect(dead, 'a declared connection is out of reach at the product window').toEqual([]);
    // 60s, not the 5s default: this walks ~278 words against the whole live
    // catalog. The first run of this file timed out here, which is a slow test
    // and not a finding — said plainly so the number is not mistaken for one.
  }, 60_000);
});
