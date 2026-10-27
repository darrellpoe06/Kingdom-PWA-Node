// =============================================================================
// THE COURSES ARE QUICK LINKS TOO — tappable chips beside the select (DR-1222)
// =============================================================================
// Darrell, 2026-10-27, from his phone on Church → Learn: "Need the courses
// options to be quick links too... fix it". The department row was already a
// row of tappable chips; the courses were reachable only through the native
// <select>, which on a phone is a tap, a picker wheel, and a second tap. So a
// chip row of the courses sits under the departments and above the select,
// built on the same SectionTabs primitive, driven by the SAME handler the
// select runs.
//
// Pinned on the real component tree, the way the sister suites do
// (react-dom/client + act, no testing-library):
//   1. every course the view offers is a tab in the quick-link row;
//   2. tapping one opens that course — the <h2> names it, the chip is selected;
//   3. on a department, the courses that SERVE it are a second labelled group,
//      and tapping one clears the department filter (DR-0516: a pointer opens
//      the course in its home, never a second copy);
//   4. the select is still there, still the prompt, and still FIRST before the
//      heading — the chips sit above it, nothing moved below it;
//   5. every chip declares a touch target of at least 36px;
//   6. PROVEN TO CATCH: the row is what makes (1) pass — without it the
//      selector finds nothing.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.setConfig({ testTimeout: 20000 });
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { courseCrossListingsFor } from '../lib/learn-crosslist.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const CATALOG = buildCatalogCourseDescriptors();
const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
  extraCourses: CATALOG,
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  ...props,
})));

const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const picker = () => container.querySelector('#learn-course-pick');
const heading = () => container.querySelector('#learn-h').textContent;
const quickRow = () => container.querySelector('[data-testid="learn-course-quick-links"]');
const quickTabs = () => [...container.querySelectorAll('[id^="learn-course-quick-tab-"]')]
  .filter((el) => el.getAttribute('role') === 'tab' && !el.id.startsWith('learn-course-quick-serves-tab-'));
const servesTabs = () => [...container.querySelectorAll('[id^="learn-course-quick-serves-tab-"]')]
  .filter((el) => el.getAttribute('role') === 'tab');
const deptTabs = () => [...container.querySelectorAll('[id^="learn-dept-tab-"]')].filter((el) => el.getAttribute('role') === 'tab');
const deptTab = (label) => deptTabs().find((b) => (b.textContent || '').trim() === label);
const ownOptionKeys = () => {
  const groups = [...picker().querySelectorAll('optgroup')].filter((g) => !/Also serves/.test(g.getAttribute('label') || ''));
  return groups.flatMap((g) => [...g.querySelectorAll('option')].map((o) => o.value));
};
const isBefore = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('every course the view offers is a quick link', () => {
  it('the row renders, labelled, with one tab per course the select offers, in the same order', () => {
    mount();
    expect(quickRow(), 'the quick-link row must render').toBeTruthy();
    const list = container.querySelector('[aria-label="Course quick links"]');
    expect(list, 'the row is a labelled tablist').toBeTruthy();
    const keys = quickTabs().map((t) => t.id.replace('learn-course-quick-tab-', ''));
    expect(keys.length).toBeGreaterThan(1);
    expect(keys, 'chips follow the select, course for course').toEqual(ownOptionKeys());
  });

  it('each chip reads code · title — the name a reader scans for', () => {
    mount();
    for (const t of quickTabs()) expect(t.textContent).toMatch(/^.+ · .+$/);
  });

  it('nothing is highlighted until a course is chosen (DR-1183), then the open one is', () => {
    mount();
    expect(quickTabs().filter((t) => t.getAttribute('aria-selected') === 'true').length, 'nothing is open on arrival').toBe(0);
    expect(heading()).toBe('Choose a course');
    const target = quickTabs().find((t) => /Living Lessons/.test(t.textContent)) || quickTabs()[1];
    click(target);
    expect(heading(), 'the heading names the course the chip opened').not.toBe('Choose a course');
    expect(target.textContent, 'the chip names the same course').toContain(heading());
    const on = quickTabs().filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(on.length).toBe(1);
    expect(on[0]).toBe(target);
  });

  it('tapping a different chip moves the course — active.key changes and the <h2> follows', () => {
    mount();
    const [a, b] = quickTabs();
    click(a);
    const first = heading();
    click(b);
    expect(heading()).not.toBe(first);
    expect(b.textContent).toContain(heading());
    expect(a.getAttribute('aria-selected')).toBe('false');
    expect(b.getAttribute('aria-selected')).toBe('true');
  });
});

describe('on a department, the courses that SERVE it are a second group of quick links', () => {
  it('Business carries its gathered courses as chips, labelled, separate from its own', () => {
    mount();
    click(deptTab('Business'));
    const serves = container.querySelector('[data-testid="learn-course-quick-serves"]');
    expect(serves, 'the second group renders').toBeTruthy();
    expect(serves.textContent).toMatch(/Also serves Business/);
    const declared = courseCrossListingsFor('Business').length;
    expect(declared).toBeGreaterThan(0);
    expect(servesTabs().length, 'one chip per declared cross-listing').toBe(declared);
    const ownKeys = quickTabs().map((t) => t.id.replace('learn-course-quick-tab-', ''));
    for (const t of servesTabs()) expect(ownKeys).not.toContain(t.id.replace('learn-course-quick-serves-tab-', ''));
    // A pointer never inflates a count: the own row still says Business's own number.
    expect(quickRow().textContent).toMatch(/Quick links · 2 courses/);
    expect(servesTabs().filter((t) => t.getAttribute('aria-selected') === 'true').length, 'none of them is the open course here').toBe(0);
  });

  it('tapping a gathered course clears the department filter and opens it in its home (DR-0516)', () => {
    mount();
    click(deptTab('Business'));
    expect(deptTab('Business').getAttribute('aria-selected')).toBe('true');
    const target = servesTabs()[0];
    const key = target.id.replace('learn-course-quick-serves-tab-', '');
    const title = target.textContent.split(' · ')[0];
    click(target);
    const all = container.querySelector('#learn-dept-tab-all');
    expect(all.getAttribute('aria-selected'), 'the filter dropped to every course').toBe('true');
    expect(deptTab('Business').getAttribute('aria-selected')).toBe('false');
    expect(heading(), 'the course opened in its home').toBe(title);
    const on = quickTabs().find((t) => t.getAttribute('aria-selected') === 'true');
    expect(on && on.id).toBe(`learn-course-quick-tab-${key}`);
  });
});

describe('the select stays, and the order the tests pin is kept', () => {
  it('the select still renders, still the prompt, and the chips sit ABOVE it', () => {
    mount();
    expect(picker()).toBeTruthy();
    expect(picker().value).toBe('');
    expect(isBefore(quickRow(), picker()), 'chips above the select').toBe(true);
    expect(isBefore(picker(), container.querySelector('#learn-h')), 'the select still precedes the heading').toBe(true);
    click(quickTabs()[0]);
    expect(picker().value, 'after a chip the select is still the way OUT, never the open course').toBe('');
  });

  it('every chip declares a touch target of at least 36px', () => {
    mount();
    for (const t of [...quickTabs()]) {
      const minH = Number((t.className.match(/min-h-\[(\d+)px\]/) || [])[1]);
      expect(minH, `${t.textContent} must declare a chip height`).toBeGreaterThanOrEqual(36);
    }
  });

  it('PROVEN TO CATCH — without the row, the quick-link selector finds nothing', () => {
    mount();
    const row = quickRow();
    row.remove();
    expect(quickTabs().length).toBe(0);
    expect(container.querySelector('[aria-label="Course quick links"]')).toBe(null);
  });
});
