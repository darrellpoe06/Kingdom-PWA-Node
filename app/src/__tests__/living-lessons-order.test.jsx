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
// puts L195 first; the pick is kept per course on the device; every lesson
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
import { sectionLessons } from '../lib/lesson-sections.js';
import {
  lessonNumber, isNumberedCourse, orderLessons, ordersFor, numberLabel, formatAdded, monthOf,
  withMonthHeadings, rememberLessonOrder, rememberedLessonOrder, inNumberOrder, ownNumber,
} from '../lib/lesson-order.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ascending = (list) => list.every((m, i) => i === 0 || lessonNumber(m) > lessonNumber(list[i - 1]));

describe('the number is the lesson’s own, read from its id', () => {
  it('reads the digits after the course prefix, never the position', () => {
    expect(lessonNumber({ id: 'll192-two-hours-became-six' })).toBe(192);
    expect(lessonNumber({ id: 'sov3-anything', week: 1 })).toBe(3);
    expect(lessonNumber({ id: 'hl-w3-setback' })).toBe(null);
    expect(lessonNumber(null)).toBe(null);
  });

  it('MEASURED: the authored array is not in number order and has no L79, so a position would mislabel', () => {
    const nums = LIVING_LESSONS_MODULES.map(lessonNumber);
    expect(nums).not.toContain(79);
    expect(ascending(LIVING_LESSONS_MODULES)).toBe(false);
    const sched = buildLivingLessonsSchedule();
    const l192 = sched.find((m) => m.id.startsWith('ll192-'));
    expect(l192.week, 'the position the old rows printed').not.toBe(192);
    expect(ownNumber(l192, sched)).toBe(192);
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
  it('by number puts the lowest first; newest first puts L195 first', () => {
    const sched = buildLivingLessonsSchedule();
    const byNum = orderLessons(sched, 'number');
    expect(byNum[0].id.startsWith('ll1-')).toBe(true);
    expect(ascending(byNum)).toBe(true);
    const newest = orderLessons(sched, 'newest');
    expect(newest[0].id.startsWith('ll195-')).toBe(true);
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
    expect(ordersFor({ numbered: true, hasSections: true, dated: true }).map((o) => o.key)).toEqual(['number', 'newest', 'divisions']);
    expect(ordersFor({ numbered: true, hasSections: false, dated: false }).map((o) => o.label)).toEqual(['By number, first to last', 'Last to first']);
    expect(ordersFor({ numbered: false, hasSections: false, dated: false })).toEqual([]);
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
    expect(byNum[byNum.length - 1].added).toBe('2026-09-24');
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
  it('prints Lesson 1 first, Lesson 195 last, each with its day', () => {
    const md = exportLivingLessonsCurriculumMarkdown();
    const nums = [...md.matchAll(/^## Lesson (\d+) — /gm)].map((m) => Number(m[1]));
    expect(nums.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(nums[0]).toBe(1);
    expect(nums[nums.length - 1]).toBe(195);
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
    expect([...sel.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['By number, first to last', 'Newest first', 'By the Word’s divisions']);
    const nums = rowNums();
    expect(nums.length).toBe(LIVING_LESSONS_MODULES.length);
    expect(nums[0]).toBe(1);
    expect(nums.every((n, i) => i === 0 || n > nums[i - 1])).toBe(true);
    expect(firstRow().textContent).toMatch(/^L1 · Jun 24, 2026 · /);
    expect(nav().textContent).toContain('L192 · Sep 24, 2026');
    expect(nav().querySelectorAll('li[data-shelf-heading]').length).toBe(0);
    expect(nav().querySelector('li[data-month-heading="month-2026-06"]').textContent).toMatch(/^June 2026/);
    expect(nav().querySelector('details')).toBe(null);
  });

  it('Newest first puts L195 on top, and the pick survives leaving and coming back (kept on the device)', () => {
    mount();
    pick(/Living Lessons from the Word/);
    choose(container.querySelector('#learn-lesson-order'), 'newest');
    expect(firstRow().getAttribute('data-lesson-id').startsWith('ll195-')).toBe(true);
    expect(rowNums()[0]).toBe(195);
    expect(rememberedLessonOrder('living-lessons')).toBe('newest');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    pick(/Living Lessons from the Word/);
    expect(container.querySelector('#learn-lesson-order').value).toBe('newest');
    expect(rowNums()[0]).toBe(195);
  });

  it('a short numbered course gets the same Order control, without the divisions view', () => {
    mount();
    pick(/Sovereign A\.I\./);
    const sel = container.querySelector('#learn-lesson-order');
    expect(sel).toBeTruthy();
    expect([...sel.querySelectorAll('option')].map((o) => o.value)).toEqual(['number', 'newest']);
    expect(container.querySelector('#learn-lesson-shelf')).toBe(null);
    expect(rowNums()[0]).toBe(1);
  });
});
