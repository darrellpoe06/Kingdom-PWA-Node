// course-standing-on-the-list — the course picker says where the reader
// stands in each course, the whole list in numbers, and the two nearest wins.
// DR-1420.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { courseStandingLabel, libraryStanding, lowHangingFruit } from '../lib/learn-organize.js';
import CourseFruit from '../components/CourseFruit.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const course = (key, n, code = key.toUpperCase()) => ({
  key,
  code,
  meta: { title: `Course ${key}` },
  schedule: Array.from({ length: n }, (_, i) => ({ id: `${key}-${i + 1}` })),
});
const COURSES = [course('a', 8), course('b', 6), course('c', 296), course('d', 9), course('e', 3)];
// a: 3 of 8 read. b: nothing. c: 1 of 296. d: 8 of 9. e: all 3.
const progress = {
  'a-1': 't',
  'a-2': 't',
  'a-3': 't',
  'c-1': 't',
  'e-1': 't',
  'e-2': 't',
  'e-3': 't',
  ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`d-${i + 1}`, 't'])),
};
const ctx = { places: [], progress };

describe('where the reader stands, in words', () => {
  it('names each standing from the real record', () => {
    expect(COURSES.map((c) => courseStandingLabel(c, ctx))).toEqual([
      '3 of 8 read · 37%',
      'not started',
      '1 of 296 read · 0%',
      '8 of 9 read · 88%',
      'all 3 read',
    ]);
  });
  it('PROVEN TO CATCH: one lesson short is never 100%, and a course only opened says begun, none finished', () => {
    expect(
      courseStandingLabel(course('z', 200), { places: [], progress: Object.fromEntries(Array.from({ length: 199 }, (_, i) => [`z-${i + 1}`, 't'])) })
    ).toBe('199 of 200 read · 99%');
    expect(courseStandingLabel(COURSES[1], { places: [{ courseKey: 'b', lessonId: 'b-1', started: true, done: false }], progress: {} })).toBe(
      'begun, none finished'
    );
    expect(courseStandingLabel({ key: 'empty', schedule: [] }, ctx)).toBe('');
  });
  it('a lesson finished on this device counts with the record, once', () => {
    const c = {
      places: [
        { courseKey: 'b', lessonId: 'b-1', done: true },
        { courseKey: 'a', lessonId: 'a-1', done: true },
      ],
      progress,
    };
    expect(courseStandingLabel(COURSES[1], c)).toBe('1 of 6 read · 16%');
    expect(courseStandingLabel(COURSES[0], c)).toBe('3 of 8 read · 37%');
  });
  it('the whole list in numbers', () => {
    expect(libraryStanding(COURSES, ctx)).toEqual({ courses: 5, notStarted: 1, inProgress: 3, completed: 1, lessons: 322, lessonsRead: 15, pct: 4 });
    expect(libraryStanding([], ctx).courses).toBe(0);
  });
  it('the two nearest wins: fewest lessons left among the begun, shortest among the not started', () => {
    const f = lowHangingFruit([...COURSES, course('f', 4)], ctx);
    expect([f.nearest.course.key, f.nearest.left, f.nearest.total]).toEqual(['d', 1, 9]);
    expect([f.quickStart.course.key, f.quickStart.total]).toEqual(['f', 4]);
    const none = lowHangingFruit([COURSES[4]], ctx);
    expect(none).toEqual({ nearest: null, quickStart: null });
  });
});

describe('under the course picker', () => {
  let root;
  let host;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
  });
  const mount = (props) => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => root.render(createElement(CourseFruit, props)));
  };
  const q = (id) => host.querySelector(`[data-testid="${id}"]`);

  it('says the list in numbers, and each win is one tap into its course', () => {
    const opened = [];
    mount({ courses: COURSES, ctx, onOpen: (k) => opened.push(k) });
    expect(q('course-fruit-line').textContent).toBe('1 not started · 3 begun · 1 finished, of 5 courses. 15 of 322 lessons read (4%).');
    expect(host.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('4');
    expect(q('course-fruit-nearest').textContent).toMatch(/Closest to finishedD · Course d1 lesson left of 9/);
    expect(q('course-fruit-quick-start').textContent).toMatch(/Not started, and shortB · Course b6 lessons, nothing on your record yet/);
    act(() => q('course-fruit-nearest').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    act(() => q('course-fruit-quick-start').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(opened).toEqual(['d', 'b']);
  });
  it('a reader with nothing on the record sees every course as not started and one short course to begin', () => {
    mount({ courses: COURSES, ctx: { places: [], progress: {} } });
    expect(q('course-fruit-line').textContent).toMatch(/^5 not started · 0 begun · 0 finished/);
    expect(q('course-fruit-nearest')).toBeNull();
    expect(q('course-fruit-quick-start').textContent).toMatch(/E · Course e3 lessons/);
  });
  it('no courses, nothing drawn', () => {
    mount({ courses: [], ctx });
    expect(q('course-fruit')).toBeNull();
  });
});
