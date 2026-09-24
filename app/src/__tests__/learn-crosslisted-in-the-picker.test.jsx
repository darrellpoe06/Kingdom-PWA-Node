// =============================================================================
// Courses that SERVE a department are options in the picker, not a wall of text
// =============================================================================
// Darrell 2026-09-19, sent a screenshot of the stacked "COURSES THAT SERVE
// BUSINESS · 14" shelf and said: "Garbage..." — and, of where they belong:
// "Not this list!!!!! Inside the dop down as options under the original or
// course/s that exist..."
//
// So they moved into the course <select>, in their own labelled <optgroup>
// beneath the department's own courses. This file is the surface proof
// (DR-0076 §6): on the REAL component tree, standing in Business, the courses
// that serve it are SELECTABLE OPTIONS naming the department they live in, the
// old shelf is gone, and the counts did not inflate — because a cross-listing
// is a pointer, so Business is one course that fourteen others serve, never
// fifteen courses (DR-0516 / DR-0448).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { courseCrossListingsFor } from '../lib/learn-crosslist.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const extraCourses = buildCatalogCourseDescriptors();
const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {}, ...props,
  })));
const deptTabs = () => [...container.querySelectorAll('#learn-dept-panel-all, [id^="learn-dept-tab-"]')].filter((el) => el.getAttribute('role') === 'tab');
const clickTab = (label) => {
  const tab = deptTabs().find((b) => (b.textContent || '').trim() === label);
  if (!tab) throw new Error(`department tab not found: ${label}`);
  act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};
const picker = () => container.querySelector('#learn-course-pick');
const groups = () => [...(picker() ? picker().querySelectorAll('optgroup') : [])];
const servesGroup = () => groups().find((g) => /Also serves/.test(g.getAttribute('label') || ''));

describe('the shelf Darrell rejected is gone', () => {
  it('renders no stacked "courses that serve" block anywhere in Business', () => {
    mount();
    clickTab('Business');
    expect(container.querySelector('[data-testid="learn-crosslisted-courses"]')).toBe(null);
    expect(container.textContent || '').not.toContain('Courses that serve Business');
  });
});

describe('they are options in the picker instead', () => {
  it('gives Business a labelled group of the courses that serve it', () => {
    mount();
    clickTab('Business');
    const g = servesGroup();
    expect(g, 'no "Also serves" optgroup in the Business picker').toBeTruthy();
    const declared = courseCrossListingsFor('Business');
    expect(declared.length, 'Business should declare cross-listed courses').toBeGreaterThan(0);
    expect(g.querySelectorAll('option').length).toBe(declared.length);
  });

  it('names the department each one actually lives in, so the reader knows before tapping', () => {
    mount();
    clickTab('Business');
    const text = servesGroup().textContent || '';
    // Every option carries its home department. Real Estate serves Business
    // heavily, so it must be visible on the options themselves.
    expect(text).toContain('Real Estate');
  });

  it('is a SEPARATE group, never mixed into the department\'s own courses', () => {
    mount();
    clickTab('Business');
    const own = groups().find((g) => !/Also serves/.test(g.getAttribute('label') || ''));
    expect(own, 'the department\'s own group should still exist').toBeTruthy();
    const ownKeys = [...own.querySelectorAll('option')].map((o) => o.value);
    const servesKeys = [...servesGroup().querySelectorAll('option')].map((o) => o.value);
    for (const k of servesKeys) expect(ownKeys).not.toContain(k);
  });

  // NOT CHECKED HERE: that every declaration names a real course. That is
  // course-crosslist.test.js's job and it owns the authoritative catalog for
  // it. A first draft of this file re-checked it against
  // buildCatalogCourseDescriptors(), which is a NARROWER list than the
  // component actually renders from — so it failed on `property-principle`, a
  // course that plainly exists. A duplicated check against a weaker source of
  // truth is worse than no check: it reports a fault in correct content.
});

describe('a pointer never inflates a count (DR-0516 / DR-0448)', () => {
  // 2026-09-23: the Business department's OWN count moved 1 → 2 with the
  // Business Research course (DR-0594); the pointer rule is unchanged — the
  // heading still counts own courses, never own + cross-listed.
  it('still counts Business by its own courses (two), not fifteen', () => {
    mount();
    clickTab('Business');
    const label = container.querySelector('label[for="learn-course-pick"]');
    const own = courseCrossListingsFor('Business').length;
    expect(own).toBeGreaterThan(1);
    // The heading counts the department's OWN courses. If this ever starts
    // reporting own+crosslisted, the pointer rule has been broken in the
    // surface even though the data is still correct.
    expect(label.textContent).toMatch(/select one of 2$/);
  });

  it('the prompt offers the extras honestly, as courses that SERVE it', () => {
    mount();
    clickTab('Business');
    const prompt = picker().querySelector('option[value=""]');
    expect(prompt.textContent).toMatch(/Choose another course · 2 \+ \d+ that serve it/);
  });
});
