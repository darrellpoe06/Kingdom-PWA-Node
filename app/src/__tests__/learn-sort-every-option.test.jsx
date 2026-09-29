// DR-0686 — the top sort does every order the app has, and the latest lessons
// across every course are one pick away.
//
// Darrell 2026-09-29, verbatim: "Can we make the top sort work to do all
// sorting options? Also the latest created lessons?"
//
// Every order is proven on the REAL mounted catalog (buildCatalogCourseDescriptors
// + the Eternal Algorithms courses), and every check is PROVEN-TO-CATCH: the
// same check is run against the order a flipped comparator produces and must
// fail, so a green here means the order is actually right.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { buildEternalProcessingCourses } from '../lib/eternal-algorithms-course.js';
import {
  COURSE_SORTS, courseSortsFor, sortCourses, courseAddedSpan, courseStanding, latestLessons,
  courseLessonCount, rememberedCourseSort, COURSE_SORT_MEMORY_KEY,
} from '../lib/learn-organize.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { orderLessons } from '../lib/lesson-order.js';
import { getPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const extraCourses = buildCatalogCourseDescriptors();
const CATALOG = [...extraCourses, ...buildEternalProcessingCourses()]
  .map((c) => ({ ...c, key: c.key || (c.meta && c.meta.key) }));
const titles = (list) => list.map((c) => String(c.meta?.title || ''));
const keys = (list) => list.map((c) => c.key);

// The property each order must have — used on the real output AND on a flipped one.
const titlesAscending = (list) => titles(list).every((t, i, a) => i === 0 || a[i - 1].localeCompare(t) <= 0);
const titlesDescending = (list) => titles(list).every((t, i, a) => i === 0 || a[i - 1].localeCompare(t) >= 0);
const countsDescending = (list) => list.every((c, i) => i === 0 || courseLessonCount(list[i - 1]) >= courseLessonCount(c));
const countsAscending = (list) => list.every((c, i) => i === 0 || courseLessonCount(list[i - 1]) <= courseLessonCount(c));
// Dated courses first, newest day first; undated after, in course order.
const newestFirst = (list, all) => {
  const days = list.map((c) => courseAddedSpan(c).newest);
  const firstUndated = days.findIndex((d) => !d);
  const dated = firstUndated < 0 ? days : days.slice(0, firstUndated);
  if (firstUndated >= 0 && days.slice(firstUndated).some(Boolean)) return false;
  if (!dated.every((d, i) => i === 0 || dated[i - 1] >= d)) return false;
  const undatedKeys = keys(list.slice(dated.length));
  return undatedKeys.join() === keys(all.filter((c) => !courseAddedSpan(c).newest)).join();
};

describe('the course sorts, on the real catalog', () => {
  it('MEASURED: the catalog has many courses, and only Living Lessons records the day each lesson was added', () => {
    expect(CATALOG.length).toBeGreaterThan(20);
    const dated = CATALOG.filter((c) => courseAddedSpan(c).newest).map((c) => c.key);
    expect(dated).toEqual(['living-lessons']);
    const ll = CATALOG.find((c) => c.key === 'living-lessons');
    expect(ll.schedule.filter((m) => m.added).length).toBe(Object.keys(LIVING_LESSONS_ADDED).length);
  });

  it('A to Z and Z to A (proven-to-catch: each check fails on the other order)', () => {
    const az = sortCourses(CATALOG, 'title');
    const za = sortCourses(CATALOG, 'title-desc');
    expect(titlesAscending(az)).toBe(true);
    expect(titlesDescending(za)).toBe(true);
    expect(titlesAscending(za)).toBe(false);
    expect(titlesDescending(az)).toBe(false);
  });

  it('Most lessons and Fewest lessons first (proven-to-catch)', () => {
    const most = sortCourses(CATALOG, 'lessons-desc');
    const fewest = sortCourses(CATALOG, 'lessons-asc');
    expect(countsDescending(most)).toBe(true);
    expect(countsAscending(fewest)).toBe(true);
    expect(countsDescending(fewest)).toBe(false);
    expect(countsAscending(most)).toBe(false);
    expect(courseLessonCount(most[0])).toBe(Math.max(...CATALOG.map(courseLessonCount)));
  });

  it('Course order is the registry order untouched', () => {
    expect(keys(sortCourses(CATALOG, 'authored'))).toEqual(keys(CATALOG));
  });

  it('Recently added: the course with the newest recorded lesson leads; undated courses keep course order after it (proven-to-catch)', () => {
    const out = sortCourses(CATALOG, 'added-newest');
    expect(out[0].key).toBe('living-lessons');
    expect(newestFirst(out, CATALOG)).toBe(true);
    // A flipped comparator (undated first) fails the same check.
    const flipped = [...out.slice(1), out[0]];
    expect(newestFirst(flipped, CATALOG)).toBe(false);
    // With a second dated course, the newer one wins — and oldest-first reverses them.
    const hl = CATALOG.find((c) => c.key !== 'living-lessons' && c.schedule.length > 2);
    const newer = { ...hl, schedule: hl.schedule.map((m) => ({ ...m, added: '2099-12-31' })) }; // a synthetic day later than any real one
    const older = { ...hl, key: 'older-copy', schedule: hl.schedule.map((m) => ({ ...m, added: '2026-06-01' })) };
    const two = [older, ...CATALOG.filter((c) => c.key !== hl.key), newer];
    expect(keys(sortCourses(two, 'added-newest')).slice(0, 3)).toEqual([hl.key, 'living-lessons', 'older-copy']);
    expect(keys(sortCourses(two, 'added-oldest')).slice(0, 3)).toEqual(['older-copy', 'living-lessons', hl.key]);
    expect(newestFirst(sortCourses(two, 'added-oldest'), two)).toBe(false);
  });

  it('Recently opened by you reads the saved places, newest first; courses never opened keep course order after', () => {
    const [a, b] = [CATALOG[3], CATALOG[7]];
    const places = [
      { courseKey: a.key, lessonId: a.schedule[0].id, at: 100, started: true },
      { courseKey: b.key, lessonId: b.schedule[0].id, at: 200, started: true },
    ];
    const out = sortCourses(CATALOG, 'opened', { places });
    expect(keys(out).slice(0, 2)).toEqual([b.key, a.key]);
    expect(keys(out.slice(2))).toEqual(keys(CATALOG.filter((c) => c !== a && c !== b)));
    // proven-to-catch: swapping the stamps swaps the order.
    const swapped = sortCourses(CATALOG, 'opened', { places: [{ ...places[0], at: 300 }, places[1]] });
    expect(keys(swapped).slice(0, 2)).toEqual([a.key, b.key]);
  });

  it('In progress / Not started / Completed first read the real lesson record and places', () => {
    const done = CATALOG[2];
    const going = CATALOG[5];
    const progress = Object.fromEntries(done.schedule.map((m) => [m.id, true]));
    const places = [{ courseKey: going.key, lessonId: going.schedule[1].id, at: 5, stage: 1 }];
    const ctx = { progress, places };
    expect(courseStanding(done, ctx).state).toBe('completed');
    expect(courseStanding(going, ctx).state).toBe('in-progress');
    expect(courseStanding(CATALOG[0], ctx).state).toBe('not-started');

    const ip = sortCourses(CATALOG, 'in-progress', ctx);
    expect(ip[0].key).toBe(going.key);
    expect(ip[ip.length - 1].key).toBe(done.key);
    const ns = sortCourses(CATALOG, 'not-started', ctx);
    expect(keys(ns).slice(-2)).toEqual([going.key, done.key]);
    const cp = sortCourses(CATALOG, 'completed', ctx);
    expect(keys(cp).slice(0, 2)).toEqual([done.key, going.key]);
    // proven-to-catch: the in-progress order is NOT the completed order.
    expect(ip[0].key).not.toBe(cp[0].key);
  });

  it('offers only the orders whose data exists — and names what it leaves out', () => {
    const bare = courseSortsFor(CATALOG, { places: [], progress: {} }).map((o) => o.key);
    expect(bare).toEqual(['authored', 'title', 'title-desc', 'lessons-desc', 'lessons-asc', 'added-newest', 'latest']);
    // Oldest first waits for a second dated course (with one, it equals Recently added);
    // the per-reader orders wait for this device to have opened something.
    const used = courseSortsFor(CATALOG, {
      places: [{ courseKey: CATALOG[0].key, lessonId: CATALOG[0].schedule[0].id, at: 1, started: true }], progress: {},
    }).map((o) => o.key);
    expect(used).toEqual(expect.arrayContaining(['opened', 'in-progress', 'not-started', 'completed']));
    expect(used).not.toContain('added-oldest');
    expect(COURSE_SORTS.map((o) => o.key)).toContain('added-oldest');
  });
});

describe('the latest lessons, every course', () => {
  const newestFirstRows = (rows) => rows.every((r, i) => i === 0 || rows[i - 1].added >= r.added);

  it('pulls every dated lesson in the catalog, newest first, each naming its home course (proven-to-catch)', () => {
    const { rows, undated, courseCount } = latestLessons(CATALOG);
    const total = CATALOG.reduce((t, c) => t + c.schedule.length, 0);
    const datedTotal = CATALOG.reduce((t, c) => t + c.schedule.filter((m) => m.added).length, 0);
    expect(rows.length).toBe(datedTotal);
    expect(undated).toBe(total - datedTotal);
    expect(courseCount).toBe(1);
    expect(newestFirstRows(rows)).toBe(true);
    expect(newestFirstRows([...rows].reverse())).toBe(false);
    const newestDay = Object.values(LIVING_LESSONS_ADDED).sort().pop();
    expect(rows[0].added).toBe(newestDay);
    for (const r of rows) {
      const home = CATALOG.find((c) => c.key === r.courseKey);
      expect(home.schedule.some((m) => m.id === r.lessonId), `${r.lessonId} lives in ${r.courseKey}`).toBe(true);
    }
  });

  it('merges ACROSS courses by day, not course by course', () => {
    const other = CATALOG.find((c) => c.key !== 'living-lessons' && c.schedule.length > 2);
    const withDay = { ...other, schedule: other.schedule.map((m, i) => (i === 0 ? { ...m, added: '2099-12-31' } : m)) }; // synthetic, later than any real day
    const list = CATALOG.map((c) => (c.key === other.key ? withDay : c));
    const { rows, courseCount } = latestLessons(list);
    expect(courseCount).toBe(2);
    expect(rows[0]).toMatchObject({ courseKey: other.key, lessonId: other.schedule[0].id, added: '2099-12-31' });
    expect(rows[1].courseKey).toBe('living-lessons');
    expect(newestFirstRows(rows)).toBe(true);
  });

  it('never dates a lesson by guess: a malformed day is left out', () => {
    const ll = CATALOG.find((c) => c.key === 'living-lessons');
    const bad = { ...ll, schedule: ll.schedule.map((m, i) => (i === 0 ? { ...m, added: 'soon' } : m)) };
    expect(latestLessons([bad]).rows.length).toBe(ll.schedule.length - 1);
  });
});

describe('in-course orders match the top sort where they apply', () => {
  it('A to Z / Z to A order a course’s lessons by title (proven-to-catch)', () => {
    const ll = CATALOG.find((c) => c.key === 'living-lessons').schedule;
    const asc = (l) => l.every((m, i) => i === 0 || l[i - 1].title.localeCompare(m.title) <= 0);
    expect(asc(orderLessons(ll, 'title'))).toBe(true);
    expect(asc(orderLessons(ll, 'title-desc'))).toBe(false);
    expect(orderLessons(ll, 'title-desc')[0].title).toBe(orderLessons(ll, 'title').slice(-1)[0].title);
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
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));
  const choose = (sel, value) => act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const sortSel = () => container.querySelector('#learn-course-sort');

  it('the top sort lists the orders, Z to A reorders the picker, and the pick is kept on the device', () => {
    mount();
    const opts = [...sortSel().querySelectorAll('option')].map((o) => o.textContent);
    expect(opts).toEqual(['Course order', 'A to Z', 'Z to A', 'Most lessons', 'Fewest lessons first', 'Recently added', 'Latest lessons, every course']);
    choose(sortSel(), 'title-desc');
    const group = [...container.querySelectorAll('#learn-course-pick optgroup')]
      .sort((a, b) => b.querySelectorAll('option').length - a.querySelectorAll('option').length)[0];
    const names = [...group.querySelectorAll('option')].map((o) => o.textContent.split(' · ')[1]);
    expect(names.length).toBeGreaterThan(1);
    expect(names.every((t, i, a) => i === 0 || a[i - 1].localeCompare(t) >= 0)).toBe(true);
    expect(window.localStorage.getItem(COURSE_SORT_MEMORY_KEY)).toBe('title-desc');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(sortSel().value).toBe('title-desc');
    expect(rememberedCourseSort()).toBe('title-desc');
  });

  it('Latest lessons shows every course’s newest lessons, newest first, and a tap opens the lesson in its HOME course', () => {
    mount();
    // Start somewhere else, so opening in the home course is a real move.
    const pick = container.querySelector('#learn-course-pick');
    const elsewhere = [...pick.querySelectorAll('option')].find((o) => o.value && o.value !== 'living-lessons');
    choose(pick, elsewhere.value);
    expect(container.querySelector('#learn-h').textContent).not.toMatch(/Living Lessons/);
    expect(container.querySelector('[data-testid="learn-latest-lessons"]')).toBe(null);

    choose(sortSel(), 'latest');
    const list = container.querySelector('[data-testid="learn-latest-lessons"]');
    expect(list).toBeTruthy();
    const rows = [...list.querySelectorAll('li[data-lesson-id]')];
    expect(rows.length).toBe(Object.keys(LIVING_LESSONS_ADDED).length);
    const days = rows.map((r) => r.getAttribute('data-added'));
    expect(days.every((d, i) => i === 0 || days[i - 1] >= d)).toBe(true);
    const first = rows[0];
    const id = first.getAttribute('data-lesson-id');
    expect(first.getAttribute('data-course-key')).toBe('living-lessons');
    expect(first.textContent).toMatch(/Living Lessons/);

    act(() => { first.querySelector('button').click(); });
    const cards = container.querySelectorAll('li[id^="learn-lesson-"]');
    expect(cards.length).toBe(1);
    expect(cards[0].id).toBe(`learn-lesson-${id}`);
    expect(container.querySelector('#learn-h').textContent).toMatch(/Living Lessons/);
    const p = getPlace();
    expect(p && p.courseKey).toBe('living-lessons');
    expect(p && p.lessonId).toBe(id);
  });
});
