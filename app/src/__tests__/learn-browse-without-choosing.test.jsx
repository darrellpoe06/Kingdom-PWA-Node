// @vitest-environment jsdom
// =============================================================================
// You can reach every lesson without choosing a course or knowing a word
// =============================================================================
// Christina, 2026-08-31, on the live Learn tab: "How do I get to the rest of the
// lessons?" — she was looking at eight weeks of one course with 401 lessons
// mounted. Darrell, agreeing and naming the shape: "you must choose a course
// first to get to the lists lessons unless you type a name etc.. how can this be
// better?" And: "the locations for everything are not obvious... make them
// obvious or even a location on the screen that is the place to look... we need
// the subconscious to also think it's easy."
//
// The catalog was COURSE-FIRST. Two doors existed and both asked the reader to
// already know something:
//   • the finder — which returned nothing until you typed a word you had to
//     guess (learn-organize.js: an empty query returns []), and
//   • a 22-option course dropdown — which asks which course holds the lesson.
// A reader who knew neither had no way in, which is the reader this platform is
// for. And both doors sat ABOVE the schedule, so they scrolled away entirely.
//
// Two changes, pinned here:
//   1. THE SHELF — the finder's blank state now lists every lesson in the app,
//      grouped under its course. Typing narrows what is already visible instead
//      of summoning it out of nothing. Search itself is unchanged.
//   2. THE LANDMARK — a sticky bar that names where you are and carries one
//      control back to the shelf, deliberately reusing the shape and position of
//      the in-lesson bar so the app teaches ONE place to look.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { browseLessons, browseCount, buildLessonIndex, searchLessons } from '../lib/learn-organize.js';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const course = (key, title, n, unit) => ({
  key,
  meta: { title, unit, audience: 'everyone', tagline: '', format: '' },
  schedule: Array.from({ length: n }, (_, i) => ({
    id: `${key}-l${i + 1}`,
    week: i + 1,
    title: `${title} lesson ${i + 1}`,
    anchor: { ref: `John ${i + 1}:1`, theme: 'a theme' },
    bigIdea: 'the idea',
  })),
  sessionFlow: [],
});

describe('browseLessons — the shelf, derived and pure', () => {
  const courses = [course('a', 'Learning A.I. The Way', 8), course('b', 'Living Lessons from the Word', 112)];
  const index = buildLessonIndex(courses);

  it('returns EVERY lesson with no query and no course chosen', () => {
    const groups = browseLessons(index);
    expect(browseCount(groups)).toBe(120);
    expect(groups.map((g) => g.courseKey)).toEqual(['a', 'b']);
    expect(groups[1].lessons.length).toBe(112);
  });

  it('keeps catalog order — course order by first appearance, lessons in schedule order', () => {
    const groups = browseLessons(index);
    expect(groups[0].courseTitle).toBe('Learning A.I. The Way');
    expect(groups[1].lessons[0].title).toBe('Living Lessons from the Word lesson 1');
    expect(groups[1].lessons[111].title).toBe('Living Lessons from the Word lesson 112');
  });

  it('carries what a row needs to be openable and labelled', () => {
    const row = browseLessons(index)[0].lessons[0];
    expect(row.courseKey).toBe('a');
    expect(row.lessonId).toBe('a-l1');
    expect(row.unitLabel).toMatch(/1$/);
    expect(row.ref).toBe('John 1:1');
  });

  it('never throws on junk, and drops rows that could not be opened (unbreakable)', () => {
    for (const bad of [null, undefined, 'x', 42, {}]) {
      expect(() => browseLessons(bad)).not.toThrow();
      expect(browseCount(browseLessons(bad))).toBe(0);
    }
    expect(browseCount(browseLessons([null, { lessonId: '' }, { lessonId: 'ok', courseKey: 'k', courseTitle: 'T' }]))).toBe(1);
  });

  it('PROVEN-TO-CATCH — search alone genuinely cannot do this', () => {
    // the exact line that made the catalog course-first
    expect(searchLessons(index, '')).toEqual([]);
    expect(searchLessons(index, '   ')).toEqual([]);
    // and the shelf is what fills that state
    expect(browseCount(browseLessons(index))).toBeGreaterThan(0);
  });
});

describe('the Learn surface itself — no course, no word, still every lesson', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
  });

  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    course: course('a', 'Learning A.I. The Way', 8),
    extraCourses: [course('b', 'Living Lessons from the Word', 12)],
  })));

  // The host assembles its own built-in courses alongside the props, so these
  // assert INVARIANTS rather than fixed numbers — which also proves the counts
  // are derived from the mounted catalog and never typed (DR-0121).
  const shelfOf = () => container.querySelector('[data-testid="lesson-browse-all"]');

  it('THE REPORTED CASE: the shelf is on screen with no course chosen and no word typed', () => {
    mount();
    const shelf = shelfOf();
    expect(shelf, 'the blank finder must show the shelf, not nothing').toBeTruthy();
    const rows = shelf.querySelectorAll('li button');
    expect(rows.length, 'the shelf must actually carry lessons').toBeGreaterThan(20);
  });

  it('reaches courses OTHER than the active one — the whole point', () => {
    mount();
    const shelf = shelfOf();
    const active = container.querySelector('[data-testid="lessons-bar"]')
      .querySelector('span').textContent.trim();
    const heads = [...shelf.querySelectorAll('h4')].map((h) => h.textContent.split(' · ')[0].trim());
    expect(heads.length, 'the shelf must span more than one course').toBeGreaterThan(1);
    expect(heads.some((h) => h !== active), 'every heading was the course already open').toBe(true);
  });

  it('the stated total equals the rows actually rendered — derived, not typed', () => {
    mount();
    const shelf = shelfOf();
    const stated = Number((shelf.textContent.match(/all (\d+) lessons, every course/i) || [])[1]);
    expect(Number.isFinite(stated)).toBe(true);
    expect(shelf.querySelectorAll('li button').length).toBe(stated);
  });

  it('the per-course headings sum to that same total', () => {
    mount();
    const shelf = shelfOf();
    const stated = Number((shelf.textContent.match(/all (\d+) lessons, every course/i) || [])[1]);
    const summed = [...shelf.querySelectorAll('h4')]
      .reduce((t, h) => t + Number((h.textContent.match(/· (\d+)\s*$/) || [])[1] || 0), 0);
    expect(summed).toBe(stated);
  });

  it('every shelf row is a real 44px control a finger can hit', () => {
    mount();
    for (const b of shelfOf().querySelectorAll('li button')) {
      expect(b.className).toMatch(/min-h-\[44px\]/);
    }
  });

  it('THE LANDMARK: a sticky bar names where you are and offers the way back', () => {
    mount();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(bar, 'the course view needs a fixed place to look').toBeTruthy();
    expect(bar.className).toMatch(/sticky/);
    expect(bar.querySelector('button').textContent).toMatch(/All /);
    // it tells the reader there IS more, with the same derived total as the shelf
    const stated = Number((shelfOf().textContent.match(/all (\d+) lessons, every course/i) || [])[1]);
    expect(bar.textContent).toContain(`${stated} lessons`);
    expect(bar.textContent).toMatch(/\d+ courses/);
  });

  it('the landmark reuses the in-lesson bar\'s shape, so it is learned once', () => {
    mount();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    // same sticky/z/border/background contract as data-testid="lesson-space-bar"
    for (const cls of ['sticky', 'top-0', 'z-30', 'border-[#1A1815]', 'bg-[#FAF8F4]']) {
      expect(bar.className, `landmark must match the learned bar on ${cls}`).toContain(cls);
    }
  });
});
