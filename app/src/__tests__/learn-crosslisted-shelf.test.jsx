// =============================================================================
// A.I. understanding, gathered on the department's own shelf (DR-0448)
// =============================================================================
// Darrell 2026-09-16: "Most people want Ai understanding built in their
// curriculum also make the tab after eternal algorithms" — and, of the
// cross-references, "that get credited either way."
//
// learn-crosslist.test.js proves the declarations resolve to real lessons.
// This is the surface (DR-0076 §6): on the REAL component tree, standing in
// the A.I. The Way department, the nine lessons the rest of the program
// teaches about A.I. are THERE, each naming its home course — and clicking one
// leaves the department and opens it where it lives, which is what makes "one
// credit, either way" true rather than claimed.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { crossListingsFor } from '../lib/learn-crosslist.js';

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
const shelf = () => container.querySelector('[data-testid="learn-crosslisted"]');

// AMENDED 2026-10-21 (DR-1182). Darrell: "on those specific tabs that are
// isolating out living lessons or history or whatever it is specifically, only
// have the course information in that one for that list... Do not put any
// other lessons out there other than that, period." The gathered-lessons block
// no longer renders on ANY department tab. The declarations stay (they still
// resolve to live lessons, learn-crosslist.test.js), the course-level pointers
// stay in the picker (DR-0516), and the Courses tab's shelf reaches every
// lesson of every course. This file now pins the ABSENCE on the real tree.
describe('a department tab shows no other course\'s lessons (DR-1182)', () => {
  it('shows nothing of the kind on the whole-catalog tab', () => {
    mount();
    expect(shelf()).toBe(null);
  });

  it('the A.I. department still DECLARES its gathered lessons, and renders none of them as a block', () => {
    mount();
    clickTab('A.I. The Way');
    const declared = crossListingsFor('A.I. The Way');
    expect(declared.length).toBeGreaterThanOrEqual(9);
    expect(shelf(), 'other courses\' lessons rendered on a department tab').toBe(null);
    const text = container.textContent || '';
    expect(text).not.toContain('Also taught across the curriculum');
    expect(container.querySelector('[data-testid="learn-departments"]').textContent).not.toContain('more lessons taught across the curriculum');
  });

  it('PROVEN TO CATCH: the block\'s own test id is what this file looks for', () => {
    // The selector is the one the block carried; a block that came back under
    // the same id would fail the assertions above, not slip past them.
    expect(shelf).toBeTypeOf('function');
    const fake = document.createElement('div');
    fake.setAttribute('data-testid', 'learn-crosslisted');
    container.appendChild(fake);
    expect(shelf()).toBe(fake);
    fake.remove();
  });

  it('a department with no cross-listings shows no shelf either', () => {
    mount();
    clickTab('Mathematics');
    expect(shelf()).toBe(null);
  });
});
