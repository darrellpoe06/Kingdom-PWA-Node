// =============================================================================
// The lessons in the order of their own numbers, with the day each was added
// (DR-0626)
// =============================================================================
// Darrell 2026-09-24, on Church → Learn → Living Lessons: "There's no way to see
// the list in chronological order?!!! Fix that!!!", "MD too", "They are
// numbered!!!!!!!", and "There are dates in the lessons maybe we should
// capitalize on that somehow...".
// Pinned here: the number is read from the lesson's own id (never its place);
// "By number, first to last" is the default and puts L1 first; "Newest first"
// puts the newest (L194) first; the pick is kept per course on the device; every lesson
// carries a recorded day and a new lesson cannot join without one; the .md
// export runs in number order under each lesson's own number. PROVEN-TO-CATCH:
// the division order (the old default) fails the by-number check.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES, buildLivingLessonsSchedule, exportLivingLessonsCurriculumMarkdown } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
// Healthy Living's ids carry no lesson number ("hl-w3-…"), measured 2026-09-24.
const HEALTHY_LIVING_MODULES = [{ id: 'hl-w3-setback-neuroscience', week: 1 }, { id: 'hl-w3-tre-circadian', week: 2 }];
import { sectionLessons, SECTION_MIN_LESSONS } from '../lib/lesson-sections.js';
import {
  lessonNumber, isNumberedCourse, orderLessons, ordersFor, numberLabel, formatAdded, monthOf,
  withMonthHeadings, rememberLessonOrder, rememberedLessonOrder, inNumberOrder, ownNumber,
} from '../lib/lesson-order.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ascending = (list) => list.every((m, i) => i === 0 || lessonNumber(m) > lessonNumber(list[i - 1]));
// The highest lesson number in the course today, read from the course so a new
// lesson does not have to edit the pins below (L193 on 2026-09-24, DR-0642).
const TOP = Math.max(...LIVING_LESSONS_MODULES.map((m) => lessonNumber(m)));

describe('the number is the lesson’s own, read from its id', () => {
  it('reads the digits after the course prefix, never the position', () => {
    expect(lessonNumber({ id: 'll192-two-hours-became-six' })).toBe(192);
    expect(lessonNumber({ id: 'sov3-anything', week: 1 })).toBe(3);
    expect(lessonNumber({ id: 'hl-w3-setback' })).toBe(null);
    expect(lessonNumber(null)).toBe(null);
  });

  it('MEASURED: the authored array is not in number order and still has holes, so a position would mislabel', () => {
    // 79 was the hole this test used as its evidence until 2026-10-14, when the
    // lesson was mined out of #1255 and the number was claimed. The CLAIM is
    // unchanged and is what matters: a lesson's number is its own, never its
    // position in the array. The evidence moves to the holes that are still
    // open (211 and 212, recorded in living-lessons-numbers-are-unique), plus
    // the renumberings that leave the array itself out of order.
    const nums = LIVING_LESSONS_MODULES.map(lessonNumber);
    expect(nums).toContain(79);
    expect(nums).not.toContain(211);
    expect(nums.length, 'a position cannot be the number while a hole is open').toBeLessThan(Math.max(...nums));
    expect(ascending(LIVING_LESSONS_MODULES)).toBe(false);
    // L192 was the worked example here until 2026-10-14. Filling the 79 hole
    // moved every lesson after it up one, and L192's POSITION became 192 — so
    // at L192 the defect this test exists to catch is now invisible. That is
    // the whole reason the example is found rather than pinned: a hole closing
    // must not quietly disarm the check.
    const sched = buildLivingLessonsSchedule();
    const drifted = sched.filter((m) => m.week !== lessonNumber(m));
    expect(drifted.length, 'no lesson left where position differs from number').toBeGreaterThan(0);
    for (const m of drifted) expect(ownNumber(m, sched), `${m.id} position ${m.week}`).toBe(lessonNumber(m));
  });

  it('a course is numbered only when every lesson has its own, unshared number', () => {
    expect(isNumberedCourse(LIVING_LESSONS_MODULES)).toBe(true);
    expect(isNumberedCourse(HEALTHY_LIVING_MODULES)).toBe(false);
    expect(isNumberedCourse([{ id: 'hr1-a' }, { id: 'hr1-b' }])).toBe(false);
    expect(isNumberedCourse([])).toBe(false);
  });

  it('labels a lesson series "L192" and a weekly course "Week 3"', () => {
    expect(numberLabel({ id: 'll192-x' }, true, 'Lesson')).toBe('L192');
    expect(numberLabel({ id: 'wk3-x' }, true, 'Week')).toBe('Week 3');
    expect(numberLabel({ id: 'hl-x', week: 4 }, false, 'Lesson')).toBe('L4');
  });
});

describe('the orders', () => {
  it('by number puts the lowest first; newest first puts the highest-numbered lesson first', () => {
    const sched = buildLivingLessonsSchedule();
    const byNum = orderLessons(sched, 'number');
    expect(byNum[0].id.startsWith('ll1-')).toBe(true);
    expect(ascending(byNum)).toBe(true);
    const newest = orderLessons(sched, 'newest');
    // The newest is whichever lesson carries the highest number today (L193 on
    // 2026-09-24, DR-0642) — read from the course, so a new lesson does not
    // have to edit this line.
    expect(lessonNumber(newest[0])).toBe(Math.max(...sched.map((m) => lessonNumber(m))));
    expect(lessonNumber(newest[0])).toBeGreaterThanOrEqual(193);
    expect(newest[newest.length - 1].id.startsWith('ll1-')).toBe(true);
    expect(sched.map((m) => m.id), 'the input is never reordered in place').toEqual(buildLivingLessonsSchedule().map((m) => m.id));
  });

  it('PROVEN-TO-CATCH: the Word’s-divisions order (the old default) fails the by-number check', () => {
    const divisionOrder = sectionLessons(LIVING_LESSONS_MODULES).flatMap((s) => s.lessons);
    expect(divisionOrder.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(ascending(divisionOrder)).toBe(false);
    expect(ascending(orderLessons(divisionOrder, 'number'))).toBe(true);
  });

  it('offers divisions only on a shelved course, and says "Last to first" when no day is recorded', () => {
    // DR-0686: A to Z / Z to A join every course; a dated course names its
    // by-number order "oldest first" (the same list — one option, not two).
    expect(ordersFor({ numbered: true, hasSections: true, dated: true }).map((o) => o.key)).toEqual(['number', 'newest', 'title', 'title-desc', 'divisions']);
    expect(ordersFor({ numbered: true, hasSections: true, dated: true })[0].label).toBe('By number, oldest first');
    expect(ordersFor({ numbered: true, hasSections: false, dated: false }).map((o) => o.label)).toEqual(['By number, first to last', 'Last to first', 'A to Z', 'Z to A']);
    expect(ordersFor({ numbered: false, hasSections: false, dated: false }).map((o) => o.key)).toEqual(['course', 'title', 'title-desc']);
  });
});

describe('the day each lesson was added — a recorded day, and a new lesson joins with one', () => {
  it('every lesson has a real ISO day, and the table names no lesson that does not exist', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    const missing = ids.filter((id) => !/^\d{4}-\d{2}-\d{2}$/.test(LIVING_LESSONS_ADDED[id] || ''));
    expect(missing, 'add the lesson’s day to living-lessons-dates.js').toEqual([]);
    expect(Object.keys(LIVING_LESSONS_ADDED).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('in number order the days never go backwards, so number order IS date order', () => {
    const byNum = orderLessons(buildLivingLessonsSchedule(), 'number');
    const back = byNum.filter((m, i) => i > 0 && m.added < byNum[i - 1].added).map((m) => m.id);
    expect(back).toEqual([]);
    expect(byNum[0].added).toBe('2026-06-24');
    // The newest lesson's day, kept current as lessons land. Main's own
    // history behind it: L245-L247 (DR-1034-1036) hold 2026-10-15, L248
    // (DR-1074, "His ways are higher, so He gives us the bread") 2026-10-16,
    // L251 (DR-1096, "That Rock was Christ") 2026-10-17, and L252 (DR-1100,
    // "This Life Is the Curriculum") and L253 (DR-1102, "Benefiters or
    // Underminers of the Eternal Kingdom") both 2026-10-18.
    //
    // The highest number is now L255 (all things work together), and it also
    // carries 2026-10-18 - the day its id landed, not the day Darrell spoke it
    // (2026-10-17). It and L254 were built as 251 and 252 and renumbered three
    // more times as main took each number from under them while this branch
    // was held. Dating them by the day their ids landed is what keeps THIS
    // check true, so "By number, oldest first" stays one order and not two.
    //
    // The highest number is now L256 (DR-1150, "The LORD's Release Is for a
    // Neighbor"), spoken and built on 2026-10-21.
    //
    // The highest number is now L259 (DR-1221, "His Name Kept in Stone and
    // Silver"), the first of nine lessons built the same day from nine
    // teachings that had waited ~87 hours in the inbox while the lesson lane
    // was dark. All nine carry 2026-10-27 - the day their ids landed - for the
    // reason already recorded above for L254/L255: the teachings were spoken
    // across several days, the exact send day is not knowable from the rows,
    // and dating by the landing day is what keeps THIS check true rather than
    // leaving nine dates to go backwards against nine ascending numbers.
    // The highest is now L272 (Study to Know His Thoughts), the follow-up word
    // Darrell spoke minutes after the teaching behind L271 (Let Yahweh Defend
    // Me); both were spoken and built 2026-10-29 (DR-1291), so the date moves
    // on by one day here and this comment moves with it, so it never names a
    // lesson that is no longer the highest.
    expect(byNum[byNum.length - 1].added).toBe('2026-10-29'); // L272
  });

  it('formats a calendar day without a time-zone shift, and months are labels', () => {
    expect(formatAdded('2026-09-24')).toBe('Sep 24, 2026');
    expect(formatAdded('2026-06-01')).toBe('Jun 1, 2026');
    expect(formatAdded('')).toBe('');
    expect(formatAdded('2026-13-01')).toBe('');
    expect(monthOf('2026-09-24')).toEqual({ key: '2026-09', label: 'September 2026' });
    const rows = withMonthHeadings(orderLessons(buildLivingLessonsSchedule(), 'number'));
    const heads = rows.filter((r) => r.heading);
    expect(heads[0].heading.label).toBe('June 2026');
    expect(heads.reduce((n, h) => n + h.heading.count, 0)).toBe(LIVING_LESSONS_MODULES.length);
    expect(withMonthHeadings([{ id: 'a' }])).toEqual([{ id: 'a' }]);
  });
});

describe('the pick is kept per course on this device', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('round-trips per course, and ignores a value that is not an order', () => {
    expect(rememberedLessonOrder('living-lessons')).toBe(null);
    rememberLessonOrder('living-lessons', 'newest');
    rememberLessonOrder('sovereign-ai', 'number');
    expect(rememberedLessonOrder('living-lessons')).toBe('newest');
    expect(rememberedLessonOrder('sovereign-ai')).toBe('number');
    window.localStorage.setItem('poetech.learn.lessonOrder.v1', '{"living-lessons":"sideways"}');
    expect(rememberedLessonOrder('living-lessons')).toBe(null);
  });

  it('storage that throws never breaks the list', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked'); } });
    try {
      expect(() => rememberLessonOrder('living-lessons', 'newest')).not.toThrow();
      expect(rememberedLessonOrder('living-lessons')).toBe(null);
    } finally {
      Object.defineProperty(window, 'localStorage', real);
    }
  });
});

describe('the .md export (Darrell: "MD too") runs in number order under each lesson’s own number', () => {
  it('prints Lesson 1 first, the highest-numbered lesson last, each with its day', () => {
    const md = exportLivingLessonsCurriculumMarkdown();
    const nums = [...md.matchAll(/^## Lesson (\d+) — /gm)].map((m) => Number(m[1]));
    expect(nums.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(nums[0]).toBe(1);
    expect(nums[nums.length - 1]).toBe(TOP);
    expect(TOP).toBeGreaterThanOrEqual(193);
    expect(nums.every((n, i) => i === 0 || n > nums[i - 1])).toBe(true);
    const l192 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll192-'));
    expect(md).toContain(`## Lesson 192 — ${l192.title}\n*Added Sep 24, 2026*`);
  });

  it('the print view order matches: inNumberOrder is ascending on a numbered course and untouched on one that is not', () => {
    expect(ascending(inNumberOrder(buildLivingLessonsSchedule()))).toBe(true);
    expect(inNumberOrder(HEALTHY_LIVING_MODULES).map((m) => m.id)).toEqual(HEALTHY_LIVING_MODULES.map((m) => m.id));
  });
});

describe('on the real Learn tree', () => {
  let container, root;
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });
  const extraCourses = buildCatalogCourseDescriptors();
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const choose = (sel, value) => act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const pick = (titleRe) => {
    const sel = container.querySelector('#learn-course-pick');
    const opt = [...sel.querySelectorAll('option')].find((o) => titleRe.test(o.textContent || ''));
    if (!opt) throw new Error(`no option for ${titleRe}`);
    choose(sel, opt.value);
  };
  const nav = () => container.querySelector('[data-testid="course-lessons-first"]');
  const rowNums = () => [...nav().querySelectorAll('[data-testid="course-lesson-list"] > li[data-lesson-id] [data-lesson-number]')].map((s) => Number(s.getAttribute('data-lesson-number')));
  const firstRow = () => nav().querySelector('[data-testid="course-lesson-list"] > li[data-lesson-id]');

  it('opens by number, first to last: L1 first, every row shows its own number and day, no division headings', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const sel = container.querySelector('#learn-lesson-order');
    expect(sel, 'the Order select must render beside Show').toBeTruthy();
    expect(sel.value).toBe('number');
    expect([...sel.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['By number, oldest first', 'Newest first', 'A to Z', 'Z to A', 'By the Word’s divisions']);
    const nums = rowNums();
    expect(nums.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(nums[0]).toBe(1);
    expect(nums.every((n, i) => i === 0 || n > nums[i - 1])).toBe(true);
    expect(firstRow().textContent).toMatch(/^L1 · Jun 24, 2026 · /);
    expect(nav().textContent).toContain('L192 · Sep 24, 2026');
    expect(nav().querySelectorAll('li[data-shelf-heading]').length).toBe(0);
    expect(nav().querySelector('li[data-month-heading="month-2026-06"]').textContent).toMatch(/June 2026/);
    expect(nav().querySelector('details')).toBe(null);
  });

  // THE MONTHS FOLD AND STAY AT THE TOP (DR-0732; Darrell 2026-10-01).
  it('a month heading folds its lessons on a tap, keeps its count, and stays sticky at the top of the scroll', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const list = () => nav().querySelector('[data-testid="course-lesson-list"]');
    const july = () => list().querySelector('li[data-month-heading="month-2026-07"]');
    expect(july().className).toMatch(/\bsticky\b/);
    expect(july().className).toMatch(/\btop-0\b/);
    const before = rowNums().length;
    const julyBtn = july().querySelector('[data-testid="month-fold"]');
    expect(julyBtn.getAttribute('aria-expanded')).toBe('true');
    const julyCount = Number(july().getAttribute('data-count'));
    act(() => julyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(july().getAttribute('data-folded')).toBe('true');
    expect(july().querySelector('[data-testid="month-fold"]').getAttribute('aria-expanded')).toBe('false');
    expect(july().textContent).toMatch(/July 2026/);
    expect(rowNums().length).toBe(before - julyCount);
    // Other months are untouched: June's L1 still shows.
    expect(firstRow().textContent).toMatch(/^L1 · Jun 24, 2026 · /);
    // Open it again: every row is back.
    act(() => july().querySelector('[data-testid="month-fold"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(rowNums().length).toBe(before);
  });

  it('fold all months leaves a table of contents with counts; open all restores; the folds are kept on the device', () => {
    mount();
    pick(/Living Lessons from the Word/);
    const all = () => nav().querySelector('[data-testid="months-fold-all"]');
    expect(all().textContent).toMatch(/^Fold all \d+ months$/);
    act(() => all().dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(rowNums().length).toBe(0);
    const headings = [...nav().querySelectorAll('li[data-month-heading]')];
    expect(headings.length).toBeGreaterThan(1);
    expect(headings.every((h) => h.getAttribute('data-folded') === 'true')).toBe(true);
    expect(headings.reduce((a, h) => a + Number(h.getAttribute('data-count')), 0)).toBe(LIVING_LESSONS_MODULES.length);
    // THE OTHER NUMBER (Darrell 2026-10-01): how many of each month's lessons
    // are written for every age — summed, it is the catalog's own count.
    const forEveryAge = LIVING_LESSONS_MODULES.filter((m) => m.levels && ['child', 'youth', 'teen', 'senior'].every((b) => typeof m.levels[b] === 'string' && m.levels[b].trim())).length;
    expect(forEveryAge).toBeGreaterThan(0);
    expect(headings.reduce((a, h) => a + Number(h.getAttribute('data-aged')), 0)).toBe(forEveryAge);
    expect(headings.find((h) => Number(h.getAttribute('data-aged')) > 0).textContent).toMatch(/\d+ for every age/);
    expect(all().textContent).toMatch(/^Open all \d+ months$/);
    // Leave and come back: still folded on this device.
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    pick(/Living Lessons from the Word/);
    expect(rowNums().length).toBe(0);
    act(() => all().dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(rowNums().length).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('Newest first puts the highest-numbered lesson on top, and the pick survives leaving and coming back (kept on the device)', () => {
    mount();
    pick(/Living Lessons from the Word/);
    choose(container.querySelector('#learn-lesson-order'), 'newest');
    expect(firstRow().getAttribute('data-lesson-id').startsWith(`ll${TOP}-`)).toBe(true);
    expect(rowNums()[0]).toBe(TOP);
    expect(rememberedLessonOrder('living-lessons')).toBe('newest');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    pick(/Living Lessons from the Word/);
    expect(container.querySelector('#learn-lesson-order').value).toBe('newest');
    expect(rowNums()[0]).toBe(TOP);
  });

  it('a short numbered course gets the same Order control, without the divisions view', () => {
    // Sovereign A.I. outgrew this example at 30 weeks (SECTION_MIN_LESSONS); the
    // example is now a course pinned UNDER the line, so it cannot outgrow its premise.
    const short = extraCourses.find((c) => /^Made in Time/.test(c.meta?.title || ''));
    expect(short, 'made-in-time is registered').toBeTruthy();
    expect(short.schedule.length).toBeLessThan(SECTION_MIN_LESSONS);
    mount();
    pick(/Made in Time/);
    const sel = container.querySelector('#learn-lesson-order');
    expect(sel).toBeTruthy();
    expect([...sel.querySelectorAll('option')].map((o) => o.value)).toEqual(['number', 'newest', 'title', 'title-desc']);
    expect(container.querySelector('#learn-lesson-shelf')).toBe(null);
    expect(rowNums()[0]).toBe(1);
  });
});
