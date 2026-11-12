// @vitest-environment node
// =============================================================================
// course-book-fitness — how many books the courses make, measured on the live
// registry (DR-1444)
// =============================================================================
// Darrell 2026-11-12: "how many books can we make out of my courses ... that
// would be considered appropriate for a book each?" These cases pin the
// measurement itself (what is counted, the thresholds, every course placed
// once) and the live answer's shape, so a registry change that silently
// drops a course or a builder that returns no words fails here, not in a
// conversation.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import {
  lessonBookWords, bookWords, fitness, volumes, measureCourse, measureCatalog,
  departmentCompilations, bookCount, FULL_BOOK_WORDS, SHORT_BOOK_WORDS, BOOKLET_WORDS, VOLUME_WORDS,
} from '../lib/course-book-fitness.js';

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');

describe('what is counted', () => {
  it('counts the lesson body, big idea, benefits and the try-it note, never the facilitator notes, quiz or age rewrites', () => {
    const m = {
      lesson: words(10), bigIdea: words(3), benefits: [words(2), words(2)], inApp: words(1),
      facilitator: { say: words(100) }, quiz: [{ q: words(50) }], levels: { teen: words(200), senior: words(200) }, stories: [words(40)],
    };
    expect(lessonBookWords(m)).toBe(18);
    expect(bookWords([m, m])).toBe(36);
    expect(lessonBookWords(null)).toBe(0);
    expect(bookWords(undefined)).toBe(0);
  });

  it('classifies by the stated thresholds and splits a long book into volumes', () => {
    expect(fitness(FULL_BOOK_WORDS)).toBe('full');
    expect(fitness(FULL_BOOK_WORDS - 1)).toBe('short');
    expect(fitness(SHORT_BOOK_WORDS)).toBe('short');
    expect(fitness(SHORT_BOOK_WORDS - 1)).toBe('booklet');
    expect(fitness(BOOKLET_WORDS)).toBe('booklet');
    expect(fitness(BOOKLET_WORDS - 1)).toBe('chapter');
    expect(fitness(NaN)).toBe('chapter');
    expect(volumes(0)).toBe(0);
    expect(volumes(5000)).toBe(1);
    expect(volumes(VOLUME_WORDS)).toBe(1);
    expect(volumes(VOLUME_WORDS + 1)).toBe(2);
    expect(volumes(VOLUME_WORDS * 14 + 1)).toBe(15);
  });

  it('measureCourse reads the rows it is given and never throws on a broken builder', () => {
    const rows = [{ lesson: words(9000), title: 'a' }, { lesson: words(9000) }];
    const m = measureCourse({ key: 'k', meta: { title: 'T', category: 'D' } }, rows);
    expect(m).toMatchObject({ key: 'k', title: 'T', department: 'D', lessons: 2, words: 18000, fitness: 'booklet', volumes: 1 });
    const broken = measureCourse({ key: 'b', meta: {}, buildScheduleRows: () => { throw new Error('x'); } });
    expect(broken).toMatchObject({ key: 'b', lessons: 0, words: 0, fitness: 'chapter', volumes: 0 });
  });
});

describe('compilations and the count', () => {
  const measured = [
    { key: 'big', department: 'Real Estate', words: 50000, fitness: 'full', volumes: 1, lessons: 9, title: 'Big' },
    { key: 'mid', department: 'Real Estate', words: 25000, fitness: 'short', volumes: 1, lessons: 9, title: 'Mid' },
    { key: 'a', department: 'Real Estate', words: 12000, fitness: 'booklet', volumes: 1, lessons: 8, title: 'A' },
    { key: 'b', department: 'Real Estate', words: 9000, fitness: 'booklet', volumes: 1, lessons: 8, title: 'B' },
    { key: 'c', department: 'History', words: 3000, fitness: 'chapter', volumes: 1, lessons: 5, title: 'C' },
    { key: 'd', department: 'History', words: 4000, fitness: 'chapter', volumes: 1, lessons: 5, title: 'D' },
  ];
  it('a department gathers its non-book courses; a full or short book is never folded in (no words counted twice)', () => {
    const comps = departmentCompilations(measured);
    const re = comps.find((c) => c.department === 'Real Estate');
    expect(re.courses).toEqual(['a', 'b']);
    expect(re.words).toBe(21000);
    expect(re.isBook).toBe(true);
    const hist = comps.find((c) => c.department === 'History');
    expect(hist.words).toBe(7000);
    expect(hist.isBook).toBe(false);
  });
  it('bookCount places every course exactly once and sums titles and volumes', () => {
    const c = bookCount(measured);
    expect(c.courses).toBe(6);
    expect(c.standalone.map((s) => s.key)).toEqual(['big', 'mid']);
    expect(c.compilations.map((x) => x.department)).toEqual(['Real Estate']);
    expect(c.remainder.map((r) => r.key).sort()).toEqual(['c', 'd']);
    expect(c.titles).toBe(3);
    expect(c.volumes).toBe(3);
    const placed = c.standalone.length + c.compilations.reduce((a, x) => a + x.courses.length, 0) + c.remainder.length;
    expect(placed).toBe(6);
  });
});

describe('the live registry, measured', () => {
  const measured = measureCatalog(LEARN_CATALOG);
  it('every registered course is measured, has words, and is placed exactly once', () => {
    expect(measured.length).toBe(LEARN_CATALOG.length);
    for (const m of measured) expect(m.words, `${m.key} measured no words: its builder or lesson field is broken`).toBeGreaterThan(0);
    const c = bookCount(measured);
    const placed = c.standalone.length + c.compilations.reduce((a, x) => a + x.courses.length, 0) + c.remainder.length;
    expect(placed).toBe(LEARN_CATALOG.length);
  });
  it('the answer: Living Lessons, Sovereign A.I. and World Issues are full books; Made in Time and Healthy Living are short books', () => {
    const by = Object.fromEntries(measured.map((m) => [m.key, m]));
    expect(by['living-lessons'].fitness).toBe('full');
    expect(by['living-lessons'].volumes).toBeGreaterThanOrEqual(10);
    expect(by['sovereign-ai'].fitness).toBe('full');
    expect(by['sovereign-ai'].volumes).toBeGreaterThanOrEqual(3);
    expect(by['world-issues'].fitness).toBe('full');
    expect(by['made-in-time'].fitness).toBe('short');
    expect(by['healthy-living'].fitness).toBe('short');
    const c = bookCount(measured);
    expect(c.titles).toBeGreaterThanOrEqual(5);
    expect(c.compilations.some((x) => x.department === 'Real Estate' && x.fitness === 'full')).toBe(true);
  });
});
