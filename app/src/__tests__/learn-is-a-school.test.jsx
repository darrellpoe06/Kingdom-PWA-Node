// =============================================================================
// LEARN IS A SCHOOL (DR-0432) — the rendered contract.
// Darrell 2026-09-15: "Add the Courses as a tab with lessons depending on the
// courses as usual... making it look like a college and/or elementary school
// educational program"; "put the Eternal Algorithms inside learn and add
// Mathematics as a Tab"; "Moving current tabs around for functionality and
// flow". Pinned here on the REAL component tree:
//   • a row of department tabs derived from the catalog's own categories, the
//     Courses tab (everything) first and open by default;
//   • the default course is still Living Lessons (Darrell 2026-09-11);
//   • a department tab narrows the picker to its own courses and the open
//     course follows ("lessons depending on the courses as usual");
//   • every course carries a derived catalog code (WW-101, MAT-101 ...);
//   • the Eternal Algorithms are a department INSIDE Learn, its study surface
//     mounted there, and the old Church route lands on that department;
//   • a department that does not exist falls back to the whole catalog — no
//     dead door (proven-to-catch: the link is stale, the page still opens).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors, LEARN_CATALOG } from '../lib/learn-catalog.js';
import { learnDepartments, departmentId } from '../lib/learn-organize.js';

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
const pickerOptions = () => [...container.querySelectorAll('#learn-course-pick option')].map((o) => o.textContent || '').filter((t) => !t.startsWith('Choose'));
// The department's own courses only: the picker also carries an "Also serves"
// optgroup of courses hosted elsewhere that serve this department (DR-0540).
// A cross-listing is a POINTER, never a course, so it is never counted as one.
const ownGroupOptions = () => {
  const pick = container.querySelector('#learn-course-pick');
  if (!pick) return [];
  const groups = [...pick.querySelectorAll('optgroup')];
  const own = groups.find((g) => !/Also serves/.test(g.getAttribute('label') || ''));
  const scope = own || pick;
  return [...scope.querySelectorAll('option')].map((o) => o.textContent || '').filter((t) => !t.startsWith('Choose'));
};
const heading = () => container.querySelector('#learn-h').textContent;

describe('Learn is a school — departments derived from the catalog', () => {
  it('renders the department row: Courses first and open, then one tab per derived department', () => {
    mount();
    const labels = deptTabs().map((b) => (b.textContent || '').trim());
    expect(labels[0]).toBe('Courses');
    expect(deptTabs()[0].getAttribute('aria-selected')).toBe('true');
    // The departments are exactly the catalog's own categories plus the
    // Eternal-Algorithms family — nothing typed here.
    const declared = new Set(LEARN_CATALOG.map((c) => c.meta.category).filter(Boolean));
    declared.add('The Eternal Algorithms');
    for (const d of declared) expect(labels, `department ${d} must be a tab`).toContain(d);
    expect(labels.length).toBe(declared.size + 1);
    // And the program line counts from the live catalog.
    expect(container.querySelector('[data-testid="learn-departments"]').textContent).toMatch(/One program · \d+ departments · \d+ courses · \d+ lessons/);
  });

  it('the default course is still Living Lessons, on the Courses tab, with every course in the picker', () => {
    mount();
    expect(heading()).toBe('Living Lessons from the Word');
    const opts = pickerOptions();
    expect(opts.length).toBeGreaterThanOrEqual(LEARN_CATALOG.length);
    // every option carries a catalog code
    for (const o of opts) expect(o).toMatch(/^(● )?[A-Z]{2,3}-\d{3} · /);
  });

  it('a department tab narrows the picker to its courses and the open course follows', () => {
    mount();
    clickTab('Kingdom Life & Stewardship');
    // The department's OWN courses live in the first optgroup. A second,
    // labelled "Also serves" group carries courses that are hosted elsewhere
    // but serve this department (DR-0540) -- Darrell 2026-09-19: "Inside the
    // dop down as options under the original or course/s that exist...". So
    // this assertion counts the department's own group; counting every option
    // would count pointers as courses, which is the exact inflation DR-0516
    // forbids.
    const own = ownGroupOptions();
    const keys = LEARN_CATALOG.filter((c) => c.meta.category === 'Kingdom Life & Stewardship').map((c) => c.meta.title);
    expect(own.length).toBe(keys.length);
    for (const o of own) expect(o).toMatch(/^(● )?KLS-\d{3} · /);
    expect(keys).toContain(heading());
    expect(container.querySelector('[data-testid="course-catalog-line"]').textContent).toMatch(/^KLS-\d{3} · Kingdom Life & Stewardship/);
    // back to Courses: the whole catalog again, and the course chosen nowhere → Living Lessons
    clickTab('Courses');
    expect(pickerOptions().length).toBeGreaterThanOrEqual(LEARN_CATALOG.length);
    expect(heading()).toBe('Living Lessons from the Word');
  });

  it('Mathematics is a department tab whose one course opens with its lessons (DR-0433)', () => {
    mount();
    clickTab('Mathematics');
    expect(heading()).toMatch(/^Mathematics/);
    expect(container.querySelector('[data-testid="course-catalog-line"]').textContent).toMatch(/^MAT-101 · Mathematics · Elementary · \d+ lessons/);
    // a single-course department still lists its lessons by title (the index)
    expect(container.querySelector('nav[aria-label*="by title"]')).toBeTruthy();
    expect(container.textContent).toMatch(/Count and Place Value/);
  });

  it('the Eternal Algorithms are a department inside Learn, with the study surface mounted under it', () => {
    mount();
    clickTab('The Eternal Algorithms');
    expect(container.querySelector('[data-testid="eternal-study-in-learn"]')).toBeTruthy();
    for (const o of pickerOptions()) expect(o).toMatch(/^(● )?EA-\d{3} · /);
    expect(heading()).toMatch(/Deep Processing/);
  });

  it('the old Church route lands on the department (initialDept), so no shared link dies', () => {
    mount({ initialDept: 'the-eternal-algorithms' });
    const on = deptTabs().find((b) => b.getAttribute('aria-selected') === 'true');
    expect((on.textContent || '').trim()).toBe('The Eternal Algorithms');
    expect(container.querySelector('[data-testid="eternal-study-in-learn"]')).toBeTruthy();
  });

  it('PROVEN-TO-CATCH: a department that does not exist falls back to the whole catalog', () => {
    mount({ initialDept: 'school-of-nothing' });
    const on = deptTabs().find((b) => b.getAttribute('aria-selected') === 'true');
    expect((on.textContent || '').trim()).toBe('Courses');
    expect(heading()).toBe('Living Lessons from the Word');
  });

  it('the shell no longer carries a separate Eternal Algorithms chip; the route resolves into Learn', async () => {
    const fs = await import('node:fs');
    const host = fs.readFileSync('src/poe-financial-mvp-v28.jsx', 'utf8');
    expect(host).not.toMatch(/\['eternal-algorithms',\s*<>/);
    expect(host).toMatch(/churchView === 'learn' \|\| churchView === 'eternal-algorithms'/);
    expect(host).toMatch(/initialDept=\{churchView === 'eternal-algorithms' \? 'the-eternal-algorithms' : null\}/);
    // and the id the host hands over is the one the organizer derives
    expect(departmentId('The Eternal Algorithms')).toBe('the-eternal-algorithms');
    // the department really exists on the mounted catalog
    const built = learnDepartments(extraCourses);
    expect(built.some((d) => d.label === 'The Word & The Way')).toBe(true);
  });
});
