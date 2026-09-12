// =============================================================================
// The Sort control moves the ROWS ON SCREEN — pinned in the real DOM
// =============================================================================
// Darrell, 2026-09-12: "the sort does nothing either... fix it... and give all
// options available."
//
// THE DEFECT WAS INVISIBLE TO UNIT TESTS, which is why this file renders the real
// component instead. learn-organize.test.js had always passed: sortCourses was
// correct and well covered. It simply sorted the COURSE PICKER — a collapsed
// <select> — while the 141-row lesson list underneath rendered straight from
// `schedule` in authored order. Every test of the sorting FUNCTION was green while
// the sorting CONTROL did nothing a reader could see.
//
// So this asserts the only thing that would have caught it: change the control,
// and the rendered list is in a different order.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import React from 'react';
import ChurchLearn from '../components/ChurchLearn.jsx';

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (props = {}) => act(() => root.render(React.createElement(ChurchLearn, {
  progress: {}, recordProgress: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'child', setAgeBand: () => {},
  ...props,
})));

const sortSelect = () => container.querySelector('#learn-lesson-sort');
const index = () => container.querySelector('[data-testid="course-lessons-first"]');
const rows = () => Array.from(index().querySelectorAll('ol li')).map((li) => li.textContent.trim());
const choose = (value) => act(() => {
  const el = sortSelect();
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
});

describe('the lesson list has its own sort, on the list itself', () => {
  it('renders a Sort control INSIDE the lesson index, not only beside the course picker', () => {
    mount();
    expect(sortSelect(), 'the visible lesson list has no sort control').toBeTruthy();
    expect(index().contains(sortSelect()), 'the sort must live on the list it orders').toBe(true);
  });

  it('offers every option, including the ones that need real backing data', () => {
    mount();
    const labels = Array.from(sortSelect().options).map((o) => o.textContent);
    expect(labels).toEqual([
      'Course order', 'Newest first', 'Title A to Z', 'Title Z to A', 'Scripture order',
      'Shortest read first', 'Longest read first', 'Recently opened first', 'Not opened yet first',
    ]);
  });
});

describe('changing the sort actually re-orders the rendered rows', () => {
  it('A to Z moves the rows', () => {
    mount();
    const before = rows();
    // The index only renders for a course with more than four lessons, and with
    // no course chosen the wrapper falls back to the A.I. course (8). Eight
    // distinct rows is enough to prove movement; the 141-lesson case is covered
    // by lesson-sorts.test.js against the real Living Lessons series.
    expect(before.length).toBeGreaterThan(4);
    choose('title');
    const after = rows();
    expect(after, 'the rendered list did not move — the control is still dead').not.toEqual(before);
    expect(after).toHaveLength(before.length);
    expect(new Set(after).size).toBe(new Set(before).size);
  });

  it('Newest first is the reverse of course order, on screen', () => {
    mount();
    const asc = rows();
    choose('authored-desc');
    expect(rows()).toEqual([...asc].reverse());
  });

  it('Shortest read first re-orders AND shows the minutes it sorted on', () => {
    mount();
    const before = rows();
    expect(before.join(' ')).not.toMatch(/~\d+ min/);
    choose('time-asc');
    const after = rows();
    expect(after).not.toEqual(before);
    // The number the order is built on is visible beside each row, so the reader
    // can check the claim instead of trusting it.
    expect(after[0]).toMatch(/~\d+ min/);
    const mins = after.map((t) => Number(t.match(/~(\d+) min/)[1]));
    for (let i = 1; i < mins.length; i += 1) expect(mins[i]).toBeGreaterThanOrEqual(mins[i - 1]);
  });

  it('Scripture order re-orders, and going back to Course order restores it exactly', () => {
    mount();
    const original = rows();
    choose('scripture');
    expect(rows()).not.toEqual(original);
    choose('authored');
    expect(rows()).toEqual(original);
  });

  it('no lesson is lost or duplicated by any option', () => {
    mount();
    const n = rows().length;
    for (const key of ['title', 'title-desc', 'scripture', 'time-asc', 'time-desc', 'recent', 'unopened', 'authored-desc']) {
      choose(key);
      const got = rows();
      expect(got, key).toHaveLength(n);
      expect(new Set(got).size, `${key} duplicated a row`).toBe(n);
    }
  });
});
