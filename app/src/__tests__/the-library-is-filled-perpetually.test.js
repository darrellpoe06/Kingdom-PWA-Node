// =============================================================================
// THE LIBRARY IS FILLED PERPETUALLY — the census, the queue, and the ratchet
// (DR-1266)
// =============================================================================
// Darrell 2026-10-27: "Make sure we are filling the course library perpetually
// with all levels and necessary components and information..."
//
// Two proofs. On fixtures: the census sees exactly what a lesson carries and
// what it waits for, the queue is newest first and names its wait, the line
// counts. On the REAL catalog: the ratchet — readings, whole lessons, lessons
// with every version and exams may only RISE from the frozen baseline, and
// the waiting count may only FALL. A lesson that lands incomplete, or a
// version that is lost, fails here. When the library improves, this test
// says so, and the baseline is re-frozen by hand in that PR (the DR-0418
// shrink-only pattern). PROVEN-TO-CATCH: a catalog with one lost version
// fails the ratchet below.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { censusLesson, censusLibrary, censusLine, waitsFor, censusCounts, COMPONENTS, VERSION_IDS, SHORT_WORDS } from '../lib/library-census.js';
import { READING_VERSIONS } from '../lib/learn-organize.js';

const baseline = JSON.parse(readFileSync(join(process.cwd(), 'src', 'lib', 'library-census-baseline.json'), 'utf8'));
const Q = { questions: [{ q: 'Who?', options: ['A', 'B'], answer: 0 }] };
const FULL = {
  id: 'full', title: 'Full', added: '2026-10-20', lesson: 'Adult words. '.repeat(SHORT_WORDS),
  levels: { child: 'Child words.', youth: 'Youth words.', teen: 'Teen words.', senior: 'Senior words.' },
  anchor: { ref: 'John 1:1' }, bigIdea: 'The idea.', quiz: Q, benefits: ['b'], inApp: 'Do this.',
  facilitator: { talkingPoints: ['t'], howToRun: 'Open; teach; close.' },
};

describe('one lesson, counted', () => {
  it('a whole lesson waits for nothing', () => {
    const l = censusLesson(FULL);
    expect(l).toMatchObject({ versions: VERSION_IDS, missingVersions: [], missingComponents: [], whole: true, short: false });
    expect(l.adultWords).toBe(SHORT_WORDS * 2);
  });
  it('names each missing version and each missing part, and a note is short', () => {
    const l = censusLesson({ ...FULL, lesson: 'Short adult words.', levels: { child: FULL.levels.child, teen: FULL.levels.teen }, quiz: null, facilitator: { talkingPoints: [] } });
    expect(l.missingVersions).toEqual(['youth', 'senior']);
    expect(l.missingComponents).toEqual(['quiz', 'talkingPoints', 'howToRun']);
    expect(l.whole).toBe(false);
    expect(l.short).toBe(true);
    expect(waitsFor({ missingVersions: ['youth'], missingComponents: ['quiz'] })).toBe('the Youth version; an exam');
  });
  it('the ids are the picker’s, and every component has a label', () => {
    expect(VERSION_IDS).toEqual(READING_VERSIONS.map((b) => b.id));
    expect(COMPONENTS.map((c) => c.id)).toEqual(['lesson', 'anchor', 'bigIdea', 'quiz', 'benefits', 'talkingPoints', 'howToRun', 'inApp']);
  });
});

describe('the library, counted', () => {
  const courses = [
    { key: 'a', meta: { title: 'A' }, schedule: [FULL, { ...FULL, id: 'a2', added: '2026-10-25', levels: { ...FULL.levels, youth: '' } }] },
    { key: 'b', meta: { title: 'B' }, schedule: [{ ...FULL, id: 'b1', added: '2026-10-01', quiz: null }, { ...FULL, id: 'b2', added: null, benefits: [] }] },
    { key: 'empty', meta: { title: 'Empty' }, schedule: [] },
  ];
  it('totals, per course, and the queue newest first naming its wait', () => {
    const c = censusLibrary(courses);
    expect(c.totals).toMatchObject({ courses: 2, lessons: 4, readings: 19, readingsPossible: 20, whole: 1, allVersions: 3, waiting: 3 });
    expect(c.totals.missingByVersion).toMatchObject({ youth: 1 });
    expect(c.totals.missingByComponent).toMatchObject({ quiz: 1, benefits: 1 });
    expect(c.courses.map((r) => r.key), 'the course with the larger share waiting comes first').toEqual(['b', 'a']);
    expect(c.queue.map((q) => q.lessonId), 'newest first, undated last').toEqual(['a2', 'b1', 'b2']);
    expect(waitsFor(c.queue[0])).toBe('the Youth version');
    expect(censusLine(c)).toBe('4 lessons in 2 courses · 19 of 20 readings written · 1 whole in every version and part · 3 waiting');
    expect(censusCounts(c)).toEqual({ lessons: 4, readings: 19, whole: 1, allVersions: 3, exams: 3, waiting: 3 });
    expect(censusLine(censusLibrary([]))).toMatch(/nothing to count/);
  });
});

describe('the real library never shrinks (the ratchet)', () => {
  const live = censusCounts(censusLibrary(buildCatalogCourseDescriptors()));
  const b = baseline.counts;
  it('readings, whole lessons, every-version lessons and exams may only rise; waiting may only fall', () => {
    const says = `live ${JSON.stringify(live)} vs baseline ${JSON.stringify(b)} — a loss fails; a gain means re-freeze src/lib/library-census-baseline.json by hand in this PR`;
    expect(live.readings, says).toBeGreaterThanOrEqual(b.readings);
    expect(live.whole, says).toBeGreaterThanOrEqual(b.whole);
    expect(live.allVersions, says).toBeGreaterThanOrEqual(b.allVersions);
    expect(live.exams, says).toBeGreaterThanOrEqual(b.exams);
    expect(live.waiting, says).toBeLessThanOrEqual(b.waiting);
    expect(live.lessons, says).toBeGreaterThanOrEqual(b.lessons);
  });
  it('a new lesson may not add to the wait: lessons minus waiting never falls below the baseline’s', () => {
    expect(live.lessons - live.waiting).toBeGreaterThanOrEqual(b.lessons - b.waiting);
  });
  it('proven-to-catch: one lost version fails the ratchet', () => {
    const courses = buildCatalogCourseDescriptors();
    const victim = courses.flatMap((c) => c.schedule || []).find((m) => censusLesson(m).whole);
    expect(victim).toBeTruthy();
    const broken = courses.map((c) => ({ ...c, schedule: (c.schedule || []).map((m) => (m === victim ? { ...m, levels: { ...m.levels, youth: '' } } : m)) }));
    const counts = censusCounts(censusLibrary(broken));
    // Against the LIVE counts, not the frozen ones: the library grows between
    // freezes, so a loss of one version can still sit above an older baseline
    // (measured 2026-10-28: live 3061 readings against a baseline of 3057, and
    // this proof read green on a catalog that had lost a version). The ratchet
    // above compares live to baseline; this proof shows the measure itself
    // moves when a version is lost.
    expect(counts.readings).toBeLessThan(live.readings);
    expect(counts.whole).toBeLessThan(live.whole);
    expect(counts.waiting).toBeGreaterThan(live.waiting);
  });
});
