// =============================================================================
// One teaching is one lesson (DR-1184)
// =============================================================================
// Darrell, 2026-10-21, with two screenshots of Living Lessons side by side:
// "Same lesson from before?!!!!!!!!!!!!!!!!!!!!!!! Really?!!!!!!"
//
// He was right, and nothing in 28,000 tests could see it. Two earlier designs
// for this check were measured and thrown away (title phrases whole-catalog
// flagged 12+ legitimate pairs; narrowed to one course it still failed on
// Living Lessons reusing "Father, Son, Holy Spirit"). This one is narrow on
// purpose and its licence to fail a build is a measurement, not an argument:
// on the live catalog it flags EXACTLY the one real pair.
import { describe, it, expect } from 'vitest';
import {
  normalizeTitle, titleOpening, expandVerses, sharedGround,
  duplicatePairsIn, duplicatePairs, newDuplicatePairs, isKnown,
  KNOWN_PAIRS, MIN_SHARED_VERSES, TITLE_WORDS,
} from '../lib/one-teaching-one-lesson.js';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

const lesson = (id, title, ref) => ({ id, title, anchor: { ref } });

describe('a range and the same verses listed one by one are the same ground', () => {
  it('expands a range, so the two ways of writing it count alike', () => {
    expect([...expandVerses('1 Timothy 6:17-19')].sort())
      .toEqual(['1 timothy 6:17', '1 timothy 6:18', '1 timothy 6:19']);
    expect([...expandVerses('1 Timothy 6:17; 1 Timothy 6:18; 1 Timothy 6:19')].sort())
      .toEqual(['1 timothy 6:17', '1 timothy 6:18', '1 timothy 6:19']);
  });

  it('THIS IS WHY THE DUPLICATE WAS INVISIBLE: the written refs barely overlap', () => {
    // ll235 lists Psalms 39:4 and 39:5 separately; ll257 writes 39:4-5. Compare
    // the strings and you see ONE shared ref where the ground is two verses.
    const a = lesson('a', 'T', 'Psalms 39:4; Psalms 39:5; Psalms 90:12');
    const b = lesson('b', 'T', 'Psalms 39:4-5; Psalms 90:12');
    const written = new Set('Psalms 39:4-5; Psalms 90:12'.split(';').map((x) => x.trim()));
    const naive = ['Psalms 39:4', 'Psalms 39:5', 'Psalms 90:12'].filter((r) => written.has(r)).length;
    expect(naive).toBe(1);
    expect(sharedGround(a, b).shared).toBe(3);
  });

  it('an em-dash or en-dash range reads the same as a hyphen', () => {
    for (const r of ['Luke 12:20-21', 'Luke 12:20–21', 'Luke 12:20 — 21']) {
      expect([...expandVerses(r)].sort()).toEqual(['luke 12:20', 'luke 12:21']);
    }
  });

  it('a reference it cannot parse is KEPT, never dropped', () => {
    // Unknown is not nothing (DR-0076 §8): dropping it would silently reduce
    // the overlap it should have contributed.
    const s = expandVerses('Psalms 90:12; the whole of Jonah');
    expect(s.has('psalms 90:12')).toBe(true);
    expect(s.has('the whole of jonah')).toBe(true);
    expect(s.size).toBe(2);
  });

  it('a backwards range is a typo, not a reason to count nothing', () => {
    expect([...expandVerses('Job 1:21-19')]).toEqual(['job 1:21']);
  });

  it('says the share of the SMALLER lesson, so a long anchor cannot hide an overlap', () => {
    const small = lesson('s', 'T', 'Psalms 90:12; Psalms 39:4');
    const big = lesson('b', 'T', 'Psalms 90:12; Psalms 39:4; John 1:1; John 1:2; John 1:3');
    const g = sharedGround(small, big);
    expect(g.shared).toBe(2);
    expect(g.verses).toEqual([2, 5]);
    expect(g.pctOfSmaller).toBe(100);
  });

  it('two lessons with no anchor at all share nothing and claim nothing', () => {
    expect(sharedGround({}, {})).toEqual({ shared: 0, verses: [0, 0], pctOfSmaller: 0 });
  });
});

describe('a title is read for its words, not its punctuation', () => {
  it('a comma, an em-dash and a colon are all just a break', () => {
    expect(titleOpening('Ten Christmases Left, and Every Knee Shall Bow')).toBe('ten christmases left');
    expect(titleOpening('Ten Christmases Left — Counting Our Days the Way Yahweh Counts Them')).toBe('ten christmases left');
    expect(titleOpening('Ten Christmases Left: counting our days')).toBe('ten christmases left');
  });

  it('a title with no words has NO opening, so it can never match another', () => {
    expect(titleOpening('')).toBe('');
    expect(titleOpening('—')).toBe('');
    expect(normalizeTitle(null)).toBe('');
    const pairs = duplicatePairsIn([lesson('a', '', 'Psalms 90:12'), lesson('b', '—', 'Psalms 90:12')], { minShared: 1 });
    expect(pairs).toEqual([]);
  });

  it('three words, because a subtitle must not break the match', () => {
    expect(TITLE_WORDS).toBe(3);
  });
});

describe('the rule: the same name over the same ground, in one course', () => {
  const A = lesson('a', 'Ten Christmases Left, and Every Knee Shall Bow', 'Psalms 90:12; Psalms 39:4; Psalms 39:5; Luke 12:20; Luke 12:21; 1 Timothy 6:17; 1 Timothy 6:18; 1 Timothy 6:19; Job 1:21; Mark 8:36');
  const B = lesson('b', 'Ten Christmases Left — Counting Our Days', 'Psalms 90:12; Psalms 39:4-5; Luke 12:20-21; 1 Timothy 6:17-19; Job 1:21; Mark 8:36');

  it('finds one teaching told twice', () => {
    const p = duplicatePairsIn([A, B]);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ a: 'a', b: 'b', opening: 'ten christmases left', shared: 10 });
    expect(p[0].pctOfSmaller).toBe(100);
  });

  it('A SHARED NAME IS NOT ENOUGH — the ground has to be the same too', () => {
    // This is the failure that killed the two earlier designs: Living Lessons
    // legitimately reuses an opening across different lessons.
    const sameName = lesson('c', 'Ten Christmases Left and the Rich Fool', 'Genesis 1:1; Genesis 1:2; Exodus 20:3');
    expect(duplicatePairsIn([A, sameName])).toEqual([]);
  });

  it('SHARED GROUND IS NOT ENOUGH EITHER — a theme taught twice keeps its own name', () => {
    const sameGround = lesson('d', 'Numbering Our Days With Wisdom', A.anchor.ref);
    expect(duplicatePairsIn([A, sameGround])).toEqual([]);
  });

  it('and the same teaching in TWO courses is the curriculum working, not a duplicate', () => {
    const pairs = duplicatePairs([
      { meta: { key: 'one' }, schedule: [A] },
      { meta: { key: 'two' }, schedule: [B] },
    ]);
    expect(pairs).toEqual([]);
  });

  it('reads a course that keeps its lessons in `modules` as well as `schedule`', () => {
    expect(duplicatePairs([{ key: 'k', modules: [A, B] }])).toHaveLength(1);
  });
});

describe('the one known pair is named with its measurement, and a SECOND one fails', () => {
  it('records exactly one pair, and says whose decision is pending and when', () => {
    expect(KNOWN_PAIRS).toHaveLength(1);
    const k = KNOWN_PAIRS[0];
    expect(k.course).toBe('living-lessons');
    expect(k.a).toMatch(/^ll235-ten-christmases-left/);
    expect(k.b).toMatch(/^ll257-ten-christmases-left/);
    expect(k.why).toMatch(/editorial call/i);
    expect(k.why).toMatch(/re-review: 2026-10-28/);
  });

  it('matches the pair whichever way round it is found', () => {
    const k = KNOWN_PAIRS[0];
    expect(isKnown({ course: k.course, a: k.a, b: k.b })).toBe(true);
    expect(isKnown({ course: k.course, a: k.b, b: k.a })).toBe(true);
    // The SAME ids in another course are not it.
    expect(isKnown({ course: 'somewhere-else', a: k.a, b: k.b })).toBe(false);
  });

  it('PROVEN TO CATCH: a second duplicate is NOT excused by the first', () => {
    const k = KNOWN_PAIRS[0];
    const ref = 'Psalms 90:12; Psalms 39:4-5; Luke 12:20-21; 1 Timothy 6:17-19; Job 1:21; Mark 8:36';
    const courses = [{
      meta: { key: 'living-lessons' },
      schedule: [
        lesson(k.a, 'Ten Christmases Left, and Every Knee Shall Bow', ref),
        lesson(k.b, 'Ten Christmases Left — Counting Our Days', ref),
        lesson('ll999-ten-christmases-left-again', 'Ten Christmases Left, Once More', ref),
      ],
    }];
    expect(duplicatePairs(courses)).toHaveLength(3);
    const fresh = newDuplicatePairs(courses);
    expect(fresh).toHaveLength(2);
    for (const p of fresh) expect([p.a, p.b]).toContain('ll999-ten-christmases-left-again');
  });
});

describe('the live catalog, measured', () => {
  const courses = buildCatalogCourseDescriptors();

  it('flags exactly the one real pair across every mounted lesson', () => {
    const lessons = courses.reduce((t, c) => t + ((c.schedule || []).length), 0);
    expect(courses.length).toBeGreaterThan(40);
    expect(lessons).toBeGreaterThan(600);
    const pairs = duplicatePairs(courses);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].course).toBe('living-lessons');
    expect(pairs[0].a).toMatch(/^ll235-ten-christmases-left/);
    expect(pairs[0].b).toMatch(/^ll257-ten-christmases-left/);
    // 23 verses, 85% of the smaller lesson's ground -- the figure the record cites.
    expect(pairs[0].shared).toBe(23);
    expect(pairs[0].pctOfSmaller).toBe(85);
  });

  it('ZERO FALSE POSITIVES at every threshold from 6 to 12, which is why it may fail a build', () => {
    for (const minShared of [6, 7, 8, 9, 10, 11, 12]) {
      expect(duplicatePairs(courses, { minShared }), `threshold ${minShared}`).toHaveLength(1);
    }
    expect(MIN_SHARED_VERSES).toBe(10);
  });

  it('and the catalog carries NO duplicate the record does not already name', () => {
    // This is the assertion the guard runs. It is green today because the one
    // pair is recorded; a new one turns it red.
    expect(newDuplicatePairs(courses)).toEqual([]);
  });
});
