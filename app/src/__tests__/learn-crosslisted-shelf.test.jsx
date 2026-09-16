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
import { getPlace } from '../lib/learn-resume.js';

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

describe('the A.I. department gathers the curriculum\'s A.I. lessons', () => {
  it('shows nothing of the kind on the whole-catalog tab', () => {
    mount();
    expect(shelf()).toBe(null);
  });

  it('shows every gathered lesson, with the course it lives in', () => {
    mount();
    clickTab('A.I. The Way');
    const el = shelf();
    expect(el, 'no gathered shelf in the A.I. department').toBeTruthy();
    const text = el.textContent || '';
    expect(text).toContain('Also taught across the curriculum');
    const declared = crossListingsFor('A.I. The Way');
    expect(declared.length).toBeGreaterThanOrEqual(9);
    expect(el.querySelectorAll('li')).toHaveLength(declared.length);
    // The home course is named on every row — the reader is told where a
    // lesson lives before they go there.
    expect(text).toContain('Living Lessons');
    expect(text).toMatch(/Lesson \d+/);
    // And the tab's own summary says how many are gathered.
    expect(container.querySelector('[data-testid="learn-departments"]').textContent)
      .toContain('more taught across the curriculum');
  });

  it('opens a gathered lesson in its HOME course, out of the department', () => {
    mount();
    clickTab('A.I. The Way');
    const rows = [...shelf().querySelectorAll('li button')];
    const tower = rows.find((b) => (b.textContent || '').includes('Tower'));
    expect(tower, 'the cross-listed Tower lesson is not on the shelf').toBeTruthy();
    const title = (tower.textContent || '');
    act(() => tower.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    // The lesson is open and in focus — the department strip steps aside, as it
    // does for any opened lesson.
    expect(deptTabs()).toHaveLength(0);
    expect(container.textContent).toContain(title.slice(0, 40).trim().split(' · ')[0].slice(0, 30));
    // AND THE CREDIT IS THE HOME COURSE'S. This is the whole claim: the place
    // record written by opening it from the A.I. department names Living
    // Lessons, the course the lesson actually lives in — so there is one
    // credit, not two, whichever shelf the reader found it on.
    const place = getPlace();
    expect(place, 'opening a gathered lesson recorded no place').toBeTruthy();
    expect(place.courseKey).toBe('living-lessons');
    expect(place.lessonId).toBe('ll34-the-tower-the-race-and-the-sovereign');
  });

  it('a department with no cross-listings shows no shelf', () => {
    mount();
    clickTab('Mathematics');
    expect(shelf()).toBe(null);
  });
});
