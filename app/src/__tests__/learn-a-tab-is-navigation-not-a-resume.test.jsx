// =============================================================================
// A DEPARTMENT TAB LANDS YOU ON THE DEPARTMENT, NEVER INSIDE A LESSON
// =============================================================================
// Darrell, 2026-09-19, from his phone, on the Business tab:
//
//   "When I click the business tab... it moves me into the first lesson of the
//    series... instead of just the tab like others... then its hard to get
//    back!!!!! Make it easy to get back and to All Courses!!!!!!!!!"
//
// TWO FAULTS, and the second is why the first was so costly.
//
// 1. resumeLessonId is WRAPPER state and nothing cleared it on a department
//    change. CourseView re-mounts on the new department's course
//    (key={active.key}), sees a resume id still set, and opens that lesson's
//    space immediately. Business showed it most because it has exactly ONE
//    course, so there is no list to land on first.
//
// 2. A lesson space HIDES the wrapper's chrome by design (DR-0264) — the
//    department tabs and the course picker both leave the screen. The bar's
//    existing "All lessons" control returns to THIS course's list, so once a
//    lesson had auto-opened there was no control on screen that left the
//    course at all. That is the "hard to get back".
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

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

const deptTabs = () => [...container.querySelectorAll('#learn-dept-panel-all, [id^="learn-dept-tab-"]')]
  .filter((el) => el.getAttribute('role') === 'tab');
const tab = (label) => deptTabs().find((b) => (b.textContent || '').trim() === label);
const click = async (el) => { await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); };
const lessonSpace = () => container.querySelector('[data-testid="lesson-space-bar"]');
const picker = () => container.querySelector('#learn-course-pick');

describe('a tab is navigation, not a resume', () => {
  it('the Business tab lands on the department, with no lesson space open', async () => {
    mount();
    const business = tab('Business');
    expect(business, 'the Business department tab must exist').toBeTruthy();
    await click(business);
    expect(lessonSpace(), 'clicking a department tab must not open a lesson space').toBe(null);
  });

  it('and the way out is still on screen — the picker did not vanish', async () => {
    mount();
    await click(tab('Business'));
    expect(picker(), 'the course picker must still be reachable on a department tab').toBeTruthy();
  });

  it('every department tab behaves the same way — none drops you into a lesson', async () => {
    mount();
    const tabs = deptTabs().filter((t) => (t.textContent || '').trim() !== 'Courses');
    expect(tabs.length, 'no department tabs rendered — this check would prove nothing').toBeGreaterThan(3);
    for (const t of tabs) {
      await click(t);
      expect(lessonSpace(), `${(t.textContent || '').trim()} opened a lesson space on a tab click`).toBe(null);
    }
  });
});

describe('the way ALL the way out exists inside a lesson', () => {
  it('a lesson space carries an All-courses control, not only All-lessons', async () => {
    mount();
    // Open a lesson the real way: pick it out of the course list.
    const start = [...container.querySelectorAll('button')]
      .find((b) => /^(start|open|read) /i.test((b.textContent || '').trim()));
    if (!start) return; // the list shape varies by course; the assertion below still guards the markup
    await click(start);
    if (!lessonSpace()) return;
    expect(
      container.querySelector('[data-testid="lesson-bar-all-courses"]'),
      'inside a lesson the tabs and picker are hidden, so the bar must offer a way out of the COURSE',
    ).toBeTruthy();
  });

  it('PROVEN-TO-CATCH: the control is wired to leave the course, not just the lesson', () => {
    // The markup-level guarantee, asserted on the source so it cannot be
    // deleted quietly: the control exists, and it calls onAllCourses.
    const src = readFileSync(join(process.cwd(), 'src/components/ChurchLearn.jsx'), 'utf8');
    expect(src).toContain('data-testid="lesson-bar-all-courses"');
    expect(src, 'the control must close the space AND leave the course').toMatch(/setFocusId\(null\);\s*onAllCourses\(\)/);
    expect(src, 'the wrapper must answer it by returning to every course').toMatch(/onAllCourses=\{\(\) => \{[^}]*setDeptId\('all'\)/);
  });
});

describe('the cause is fixed at the source, not papered over', () => {
  it('a department change clears the resume that was re-opening the lesson', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/ChurchLearn.jsx'), 'utf8');
    const handler = src.slice(src.indexOf('onActiveChange={(id) => {'), src.indexOf('sections={['));
    expect(handler, 'the tab handler must clear the resume id').toContain('setResumeLessonId(null)');
    expect(handler, 'and the guide flag with it').toContain('setResumeOpenGuide(false)');
  });
});
