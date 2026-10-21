// =============================================================================
// One teaching is one lesson (DR-1185)
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
import { parseLessonLink, lessonQuery, RETIRED_LESSONS } from '../lib/lesson-links.js';

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

describe('nothing is recorded, because the one pair was FOLDED', () => {
  it('records no pair at all - the duplicate was fixed, not filed', () => {
    expect(KNOWN_PAIRS).toEqual([]);
  });

  it('an unrecorded pair is therefore never excused', () => {
    expect(isKnown({ course: 'living-lessons', a: 'a', b: 'b' })).toBe(false);
  });

  it('PROVEN TO CATCH: the pair that was folded would fail the build if it came back', () => {
    const ref = 'Psalms 90:12; Psalms 39:4-5; Luke 12:20-21; 1 Timothy 6:17-19; Job 1:21; Mark 8:36';
    const courses = [{
      meta: { key: 'living-lessons' },
      schedule: [
        lesson('ll235-ten-christmases-left-and-every-knee-shall-bow', 'Ten Christmases Left, and Every Knee Shall Bow', ref),
        lesson('ll257-ten-christmases-left-counting-our-days', 'Ten Christmases Left, Counting Our Days', ref),
      ],
    }];
    expect(duplicatePairs(courses)).toHaveLength(1);
    expect(newDuplicatePairs(courses)).toHaveLength(1);
  });

  it('PROVEN TO CATCH: a recorded pair would still not excuse a different one', () => {
    const ref = 'Psalms 90:12; Psalms 39:4-5; Luke 12:20-21; 1 Timothy 6:17-19; Job 1:21; Mark 8:36';
    const known = [{ course: 'living-lessons', a: 'x', b: 'y' }];
    const courses = [{
      meta: { key: 'living-lessons' },
      schedule: [lesson('x', 'Same Name Here', ref), lesson('y', 'Same Name Here Too', ref), lesson('z', 'Same Name Here Again', ref)],
    }];
    expect(duplicatePairs(courses)).toHaveLength(3);
    const fresh = newDuplicatePairs(courses, { known });
    expect(fresh).toHaveLength(2);
    for (const q of fresh) expect([q.a, q.b]).toContain('z');
  });
});

describe('the live catalog, measured', () => {
  const courses = buildCatalogCourseDescriptors();

  it('finds NO duplicate anywhere - the one that existed is folded', () => {
    const lessons = courses.reduce((t, c) => t + ((c.schedule || []).length), 0);
    expect(courses.length).toBeGreaterThan(40);
    expect(lessons).toBeGreaterThan(600);
    expect(duplicatePairs(courses)).toEqual([]);
  });

  it('and the lesson that was folded away is gone, with its work carried across', () => {
    const ll = courses.find((c) => (c.meta && c.meta.key) === 'living-lessons');
    const ids = (ll.schedule || []).map((m) => m.id);
    expect(ids.some((i) => i.startsWith('ll235-ten-christmases-left'))).toBe(false);
    const kept = (ll.schedule || []).find((m) => m.id.startsWith('ll257-ten-christmases-left'));
    expect(kept, 'the lesson that survived').toBeTruthy();
    // Its four verses, now taught here.
    for (const r of ['Genesis 32:10', '1 Chronicles 29:14', 'Hebrews 9:27', 'Job 1:21']) {
      expect(kept.anchor.ref, r).toContain(r);
      expect(kept.lesson, r).toContain('(' + r + ')');
    }
    // Its two parables, now told here.
    expect(kept.stories.map((x) => x.title)).toContain('The Calendar on the Inside of the Cabinet Door');
    expect(kept.stories.map((x) => x.title)).toContain('The Man Who Would Not Sell His Hard Years');
  });

  it('ZERO FALSE POSITIVES at every threshold from 6 to 12, which is why it may fail a build', () => {
    for (const minShared of [6, 7, 8, 9, 10, 11, 12]) {
      expect(duplicatePairs(courses, { minShared }), `threshold ${minShared}`).toEqual([]);
    }
    expect(MIN_SHARED_VERSES).toBe(10);
  });

  it('and the catalog carries NO duplicate the record does not already name', () => {
    // This is the assertion the guard runs. It is green because the catalog has
    // no duplicate at all now; a new one turns it red.
    expect(newDuplicatePairs(courses)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// A link shared to the folded lesson still lands on the teaching
// ---------------------------------------------------------------------------
describe('a retired lesson still answers its own link', () => {
  const OLD = 'll235-ten-christmases-left-and-every-knee-shall-bow';
  const NEW = 'll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them';

  it('maps the folded id to the lesson that absorbed it, and only that id', () => {
    expect(Object.keys(RETIRED_LESSONS)).toEqual([OLD]);
    expect(RETIRED_LESSONS[OLD].lessonId).toBe(NEW);
    expect(RETIRED_LESSONS[OLD].courseKey).toBe('living-lessons');
  });

  it('a link shared BEFORE the fold opens the teaching, not the course', () => {
    const got = parseLessonLink(lessonQuery({ courseKey: 'living-lessons', lessonId: OLD }));
    expect(got.lessonId).toBe(NEW);
    expect(got.courseKey).toBe('living-lessons');
  });

  it('SAYS SO rather than quietly handing over a different lesson', () => {
    // Being given a lesson you did not tap is something to be told (DR-0076 §8).
    const got = parseLessonLink(lessonQuery({ courseKey: 'living-lessons', lessonId: OLD }));
    expect(got.redirectedFrom).toMatchObject({ lessonId: OLD, courseKey: 'living-lessons' });
    expect(got.redirectedFrom.why).toMatch(/built twice/i);
    expect(got.redirectedFrom.why).toMatch(/carries everything both of them had/i);
  });

  it('every ORDINARY link is untouched — no redirectedFrom key at all', () => {
    const plain = parseLessonLink(lessonQuery({ courseKey: 'living-lessons', lessonId: 'll100-whatever' }));
    expect(plain).toEqual({ courseKey: 'living-lessons', lessonId: 'll100-whatever' });
    expect('redirectedFrom' in plain).toBe(false);
    const courseOnly = parseLessonLink(lessonQuery({ courseKey: 'healthy-living' }));
    expect(courseOnly).toEqual({ courseKey: 'healthy-living', lessonId: null });
  });

  it('EXACT ids only — a prefix of the retired id is not redirected', () => {
    const near = parseLessonLink(lessonQuery({ courseKey: 'living-lessons', lessonId: 'll235' }));
    expect(near.lessonId).toBe('ll235');
    expect('redirectedFrom' in near).toBe(false);
  });

  it('and the id it redirects TO is really in the catalog', () => {
    const ll = buildCatalogCourseDescriptors().find((c) => (c.meta && c.meta.key) === 'living-lessons');
    expect((ll.schedule || []).some((m) => m.id === NEW)).toBe(true);
    expect((ll.schedule || []).some((m) => m.id === OLD)).toBe(false);
  });
});
