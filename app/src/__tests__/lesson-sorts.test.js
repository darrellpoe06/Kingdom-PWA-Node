// @vitest-environment node
// =============================================================================
// The lesson sort ORDERS THE ROWS ON SCREEN — the defect was that it did not
// =============================================================================
// Darrell, 2026-09-12: "the sort does nothing either... fix it... and give all
// options available."
//
// He was right, and the reason is worth keeping. There WAS a Sort control, and
// its code was correct — it sorted the course picker, a collapsed <select>. The
// list filling the screen underneath (141 Living Lessons) rendered straight from
// `schedule` with no sort at all. A control that re-orders something invisible is
// a dead control from the only seat that matters.
//
// So these tests assert the thing the old ones could not: that ORDER CHANGES, on
// the real 141-lesson series, for every option offered — and that no option is
// ever offered which would silently no-op.
import { describe, it, expect } from 'vitest';
import {
  LESSON_SORTS, availableLessonSorts, sortLessons, sortNote, canonKey, CANON_ORDER,
} from '../lib/lesson-sorts.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { lessonPlanForAge } from '../lib/learn-framework.js';

const ids = (list) => list.map((m) => m.id);
const minutesOf = (m) => lessonPlanForAge(m, 'child').estimatedMinutes;
const CTX = {
  minutesOf,
  openedIds: [LIVING_LESSONS_MODULES[90].id, LIVING_LESSONS_MODULES[12].id],
  bandLabel: 'Child',
};

describe('an option is only offered when it can actually be honoured', () => {
  it('hides the measured and device-history sorts when nothing backs them', () => {
    const keys = availableLessonSorts().map((s) => s.key);
    expect(keys).not.toContain('time-asc');
    expect(keys).not.toContain('recent');
    expect(keys).toContain('authored');
    expect(keys).toContain('scripture');
  });

  it('offers all nine when the caller supplies both', () => {
    expect(availableLessonSorts(CTX).map((s) => s.key)).toEqual(LESSON_SORTS.map((s) => s.key));
    expect(LESSON_SORTS).toHaveLength(9);
  });

  it('a sort with no backing data is a no-op, never a scramble', () => {
    const base = ids(sortLessons(LIVING_LESSONS_MODULES, 'authored'));
    expect(ids(sortLessons(LIVING_LESSONS_MODULES, 'time-asc', {}))).toEqual(ids(LIVING_LESSONS_MODULES));
    expect(ids(sortLessons(LIVING_LESSONS_MODULES, 'recent', {}))).toEqual(ids(LIVING_LESSONS_MODULES));
    expect(base).toHaveLength(LIVING_LESSONS_MODULES.length);
  });
});

describe('every offered sort actually changes the order of the real series', () => {
  const authored = ids(sortLessons(LIVING_LESSONS_MODULES, 'authored', CTX));

  for (const opt of LESSON_SORTS.filter((s) => s.key !== 'authored')) {
    it(`"${opt.label}" produces a different order`, () => {
      const got = ids(sortLessons(LIVING_LESSONS_MODULES, opt.key, CTX));
      expect(got, `${opt.key} left the list untouched — that is the dead-control defect`).not.toEqual(authored);
    });
  }

  it('a sort is an ORDERING, never a filter — every lesson survives every option', () => {
    for (const opt of LESSON_SORTS) {
      const got = sortLessons(LIVING_LESSONS_MODULES, opt.key, CTX);
      expect(got, opt.key).toHaveLength(LIVING_LESSONS_MODULES.length);
      expect(new Set(ids(got)).size, opt.key).toBe(LIVING_LESSONS_MODULES.length);
    }
  });

  it('never mutates the caller\'s array', () => {
    const before = ids(LIVING_LESSONS_MODULES);
    sortLessons(LIVING_LESSONS_MODULES, 'title-desc', CTX);
    sortLessons(LIVING_LESSONS_MODULES, 'time-desc', CTX);
    expect(ids(LIVING_LESSONS_MODULES)).toEqual(before);
  });
});

describe('each order is the order it claims to be', () => {
  it('course order and newest-first are exact reverses by week', () => {
    const up = sortLessons(LIVING_LESSONS_MODULES, 'authored', CTX).map((m) => m.week);
    const down = sortLessons(LIVING_LESSONS_MODULES, 'authored-desc', CTX).map((m) => m.week);
    expect(up).toEqual([...up].sort((a, b) => a - b));
    expect(down).toEqual([...up].reverse());
  });

  it('A to Z really is alphabetical, and Z to A is its reverse', () => {
    const az = sortLessons(LIVING_LESSONS_MODULES, 'title', CTX).map((m) => m.title);
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b)));
    expect(sortLessons(LIVING_LESSONS_MODULES, 'title-desc', CTX).map((m) => m.title)).toEqual([...az].reverse());
  });

  it('shortest-first is non-decreasing in the SAME minutes the row displays', () => {
    const mins = sortLessons(LIVING_LESSONS_MODULES, 'time-asc', CTX).map(minutesOf);
    for (let i = 1; i < mins.length; i += 1) expect(mins[i]).toBeGreaterThanOrEqual(mins[i - 1]);
    const desc = sortLessons(LIVING_LESSONS_MODULES, 'time-desc', CTX).map(minutesOf);
    for (let i = 1; i < desc.length; i += 1) expect(desc[i]).toBeLessThanOrEqual(desc[i - 1]);
  });

  it('recently-opened puts this device\'s lessons first, in the order they were opened', () => {
    const got = ids(sortLessons(LIVING_LESSONS_MODULES, 'recent', CTX));
    expect(got.slice(0, 2)).toEqual(CTX.openedIds);
  });

  it('not-opened-yet puts the opened ones LAST, keeping course order among the rest', () => {
    const got = ids(sortLessons(LIVING_LESSONS_MODULES, 'unopened', CTX));
    expect(got.slice(-2).sort()).toEqual([...CTX.openedIds].sort());
    const fresh = got.slice(0, -2);
    expect(fresh).toEqual(ids(LIVING_LESSONS_MODULES).filter((id) => !CTX.openedIds.includes(id)));
  });
});

describe('Scripture order is the canon, not the alphabet', () => {
  it('1 Corinthians comes AFTER Genesis — the thing alphabetical sorting gets wrong', () => {
    expect(canonKey('1 Corinthians 12:12')[0]).toBeGreaterThan(canonKey('Genesis 1:1')[0]);
    expect(canonKey('Revelation 1:1')[0]).toBeGreaterThan(canonKey('Malachi 3:10')[0]);
  });

  it('orders within a book by chapter then verse', () => {
    expect(canonKey('John 3:16')).toEqual([canonKey('John 1:1')[0], 3, 16]);
    const a = canonKey('John 1:1'); const b = canonKey('John 1:12'); const c = canonKey('John 3:1');
    expect(a[1]).toBe(b[1]); expect(a[2]).toBeLessThan(b[2]); expect(c[1]).toBeGreaterThan(a[1]);
  });

  it('an unknown or missing reference sorts LAST, never first', () => {
    expect(canonKey('')[0]).toBe(Number.MAX_SAFE_INTEGER);
    expect(canonKey('Book of Nothing 1:1')[0]).toBe(Number.MAX_SAFE_INTEGER);
    const ordered = sortLessons(LIVING_LESSONS_MODULES, 'scripture', CTX);
    expect(canonKey(ordered[0].anchor && ordered[0].anchor.ref)[0]).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('the canon list is the real 66 books, Genesis first and Revelation last', () => {
    expect(CANON_ORDER[0]).toBe('Genesis');
    expect(CANON_ORDER[CANON_ORDER.length - 1]).toBe('Revelation');
    // 66 books; Psalm/Psalms is carried as both spellings, so the list is 67 long.
    expect(new Set(CANON_ORDER).size).toBe(67);
  });

  it('the real series sorts into non-decreasing canon order', () => {
    const keys = sortLessons(LIVING_LESSONS_MODULES, 'scripture', CTX)
      .map((m) => canonKey(m.anchor && m.anchor.ref)[0]);
    for (let i = 1; i < keys.length; i += 1) expect(keys[i]).toBeGreaterThanOrEqual(keys[i - 1]);
  });
});

describe('the note under the control tells the truth about the order', () => {
  it('names the band the reading time was measured at', () => {
    expect(sortNote('time-asc', { bandLabel: 'Child' })).toContain('Child');
  });

  it('says the opened-history never leaves the device', () => {
    expect(sortNote('recent')).toMatch(/device/i);
  });

  it('says nothing where there is nothing to explain', () => {
    expect(sortNote('authored')).toBeNull();
    expect(sortNote('title')).toBeNull();
  });
});
