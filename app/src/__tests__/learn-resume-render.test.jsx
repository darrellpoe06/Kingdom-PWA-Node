// =============================================================================
// Resume-your-place in the Learn space — the RENDERED contract (DR-0076).
// Darrell 2026-07-30: "It's too easy to lose your place inside of the Learn
// space after starting one self-paced lesson." This pins the fix end-to-end in
// the real component tree:
//   • a saved place renders the "Pick up where you left off" banner naming the
//     real course + lesson;
//   • Resume opens that course and that lesson's guide (not just a scroll);
//   • a stale place (lesson no longer in the catalog) offers NOTHING — the
//     banner never points at a dead door;
//   • Start fresh clears the record;
//   • opening a lesson writes the place record (so the next visit can resume).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlace, clearPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PLACE_KEY = 'poe-learn-place';

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
    extraCourses,
    progress: {},
    toggleModule: () => {},
    quizState: {},
    recordQuiz: () => {},
    learnLevel: 'auto',
    setLearnLevel: () => {},
    ageBand: 'adult',
    setAgeBand: () => {},
    ...props,
  })));

const click = (btn) => act(() => { btn.click(); });
const buttonByText = (text) =>
  [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));

// A real Living Lessons lesson (self-paced — the exact surface of the report).
const savedPlace = { courseKey: 'living-lessons', lessonId: 'll3-bodybuilding-christ', stage: 1, step: 2, at: 1 };

describe('Learn resume-your-place', () => {
  it('a saved place renders the banner with the real course + lesson, and Resume opens that lesson', () => {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify(savedPlace));
    mount();

    expect(container.textContent).toContain('Pick up where you left off');
    expect(container.textContent).toContain('Living Lessons from the Word');
    expect(container.textContent).toContain('Bodybuilding Christ');

    click(buttonByText('Resume →'));

    // The saved course is now active and the saved lesson's guide is OPEN —
    // the tutor panel exists for exactly that lesson.
    expect(container.querySelector('#tutor-panel-ll3-bodybuilding-christ')).toBeTruthy();
    // And the banner is gone (its job is done).
    expect(container.textContent).not.toContain('Pick up where you left off');
  });

  it('a stale place (lesson gone from the catalog) offers nothing — no dead door', () => {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify({ ...savedPlace, lessonId: 'll-removed-lesson' }));
    mount();
    expect(container.textContent).not.toContain('Pick up where you left off');
  });

  it('no saved place → no banner (the old first-visit surface, unchanged)', () => {
    mount();
    expect(container.textContent).not.toContain('Pick up where you left off');
  });

  it('Start fresh clears the record from the device', () => {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify(savedPlace));
    mount();
    click(buttonByText('Start fresh'));
    expect(container.textContent).not.toContain('Pick up where you left off');
    expect(getPlace()).toBeNull();
  });

  it('opening a lesson guide records the place, so the NEXT visit can resume', () => {
    mount();
    expect(getPlace()).toBeNull();
    // Default course is the youth A.I. class; open week 1's guide.
    const start = buttonByText('Start this week →');
    expect(start).toBeTruthy();
    click(start);
    const p = getPlace();
    expect(p).toBeTruthy();
    expect(p.courseKey).toBe('ai');
    expect(p.lessonId).toBe('wk1-what-is-ai');
    clearPlace();
  });
});
