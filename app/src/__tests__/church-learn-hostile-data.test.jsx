// church-learn-hostile-data — the Learn tab must survive REAL device data
// (Darrell 2026-07-10: "learn tab is dead…" — the error boundary on the live
// signed-in device while the seeded/local render was fine). The existing render
// gates click every course with CLEAN props; a signed-in device carries rows
// written by older builds — quiz entries that are booleans or missing fields,
// progress keyed by ids that no longer exist, junk levels, unparseable cohort
// dates. This gate mounts the full host prop surface with hostile shapes and
// clicks every section: a data-dependent crash fails HERE, not on a phone.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const HOSTILE = {
  cohortStart: 'not-a-date',
  cohortConfirmed: 1,
  setCohortStart: () => {},
  confirmCohort: () => {},
  // Rows an older build (or a partial write) could have left behind.
  progress: { 'wk1-what-is-ai': 0, 'gone-module-id': 'yes', 'wk2-asking': null },
  toggleModule: () => {},
  addChurchVoice: () => {},
  submitClassInterest: () => {},
  classRoster: [null, {}, { name: 42 }, { name: 'Real Kid', email: null }],
  isGovernor: true,
  currentUserName: null,
  onLaunch: () => {},
  quizState: {
    'wk1-what-is-ai': true,                    // boolean, not the object shape
    'wk2-asking': { passed: 'yes' },           // missing pct/at
    'wk3-the-test': null,
    'gone-module-id': { passed: true, pct: NaN, at: 12345 },
  },
  recordQuiz: () => {},
  learnLevel: 'bogus-level',
  setLearnLevel: () => {},
  ageBand: 'bogus-band',
  setAgeBand: () => {},
  onEngagement: () => {},
  submitHelper: () => {},
  extraCourses: buildCatalogCourseDescriptors(),
};

const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, { ...HOSTILE, ...props })));

const clickAllTabs = () => {
  const tabs = [...container.querySelectorAll('[role="tab"]')];
  for (const tab of tabs) {
    act(() => tab.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.textContent).not.toContain('This page hit an error');
  }
};

describe('ChurchLearn survives hostile signed-in data (the live "learn tab is dead" class)', () => {
  it('mounts with junk progress/quiz/cohort/roster and renders the curriculum', () => {
    mount();
    expect(container.textContent.length).toBeGreaterThan(500);
    expect(container.textContent).not.toContain('This page hit an error');
  });
  it('every section tab renders under hostile data', () => {
    mount();
    clickAllTabs();
  });
  it('signed-out shape (null handlers) still renders', () => {
    mount({ toggleModule: null, addChurchVoice: null, recordQuiz: null, progress: {}, quizState: {} });
    expect(container.textContent.length).toBeGreaterThan(500);
  });
});
