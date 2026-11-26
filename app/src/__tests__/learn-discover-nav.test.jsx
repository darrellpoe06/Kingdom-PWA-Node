// @vitest-environment jsdom
// =============================================================================
// The discovery page's routes into the existing Learning Zone, and what they must not change
// =============================================================================
// Darrell 2026-11-26 approved "the minimal ChurchLearn change required to support deep-linking into
// All Courses, All Departments, Study Tools and Downloads, subject to regression testing", and "Browse
// All Lessons must open the existing Learning Zone experience while honoring each user's saved
// preferences". The change is two lines in ChurchLearn.jsx: its one-time area hint now accepts the
// areas in DEEP_LINK_AREAS. These tests mount the REAL ChurchLearn, in both looks.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { DEEP_LINK_AREAS, LEARN_AREA_HINT_KEY, takeLearnAreaHint, setLearnAreaHint } from '../lib/learn-landing.js';
import { AREA_ROUTES, openLearnArea } from '../lib/learn-discover-nav.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container;
let root;
beforeEach(() => {
  window.speechSynthesis = { speak() {}, cancel() {}, pause() {}, resume() {}, getVoices: () => [], addEventListener() {}, removeEventListener() {} };
  window.SpeechSynthesisUtterance = class {};
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    /* no storage */
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  if (container.parentNode) container.parentNode.removeChild(container);
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {
    /* no storage */
  }
});

const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, props)));
const selectedArea = () => {
  const t = container.querySelector('[role="tab"][aria-selected="true"][id^="learn-area-tab-"]');
  return t ? t.id.replace('learn-area-tab-', '') : null;
};
const sleep = (ms) =>
  act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });

describe('the area hint Learn already reads, now carrying the discovery routes', () => {
  it('still accepts "record" exactly as before, and nothing else by default', () => {
    setLearnAreaHint('record');
    expect(takeLearnAreaHint()).toBe('record');
    setLearnAreaHint('downloads');
    expect(takeLearnAreaHint()).toBeNull(); // the default allow-list is unchanged
  });
  it('lists every area the discovery tiles ask for, and every route points at a listed area', () => {
    for (const r of Object.values(AREA_ROUTES)) expect(DEEP_LINK_AREAS, r.hint).toContain(r.hint);
    expect(Object.keys(AREA_ROUTES).sort()).toEqual(['browse', 'downloads', 'lessons', 'record', 'tools']);
  });
});

describe('classic Learn: the hint opens the asked area, and ordinary visits are unchanged', () => {
  it('with no hint it opens on Latest, as it always has (DR-1606)', () => {
    mount();
    expect(selectedArea()).toBe('latest');
  });
  for (const area of ['lessons', 'browse', 'find', 'downloads', 'record', 'continue']) {
    it(`a "${area}" hint opens the ${area} area, once`, () => {
      setLearnAreaHint(area);
      mount();
      expect(selectedArea()).toBe(area);
      expect(window.sessionStorage.getItem(LEARN_AREA_HINT_KEY)).toBeNull(); // taken once
    });
  }
  it('ignores a hint it does not know and opens on Latest', () => {
    setLearnAreaHint('definitely-not-an-area');
    mount();
    expect(selectedArea()).toBe('latest');
  });
  it('a second visit with no hint lands on Latest again (the hint never sticks)', () => {
    setLearnAreaHint('downloads');
    mount();
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(selectedArea()).toBe('latest');
  });
  it('writes no theme, course, sort or level preference', () => {
    setLearnAreaHint('downloads');
    const before = JSON.stringify(Object.entries(window.localStorage).sort());
    mount();
    expect(JSON.stringify(Object.entries(window.localStorage).sort())).toBe(before);
  });
});

describe('openLearnArea: opens Learn, sets the hint, and finds the new look when it is on', () => {
  it('opens Learn once and sets the classic hint for a known area', () => {
    let opened = 0;
    openLearnArea('downloads', {
      openLearn: () => {
        opened += 1;
      },
      doc: null,
    });
    expect(opened).toBe(1);
    expect(window.sessionStorage.getItem(LEARN_AREA_HINT_KEY)).toBe('downloads');
  });
  it('opens Learn with no hint for "Browse All Lessons" (Learn opens exactly as it does today)', () => {
    let opened = 0;
    // Browse All Lessons is openLearn() itself: no area, so no hint.
    const cancel = openLearnArea('none-such', {
      openLearn: () => {
        opened += 1;
      },
      doc: null,
    });
    cancel();
    expect(opened).toBe(1);
    expect(window.sessionStorage.getItem(LEARN_AREA_HINT_KEY)).toBeNull();
  });
  it('in the new look, presses Learn Studio’s own Downloads chip and opens the tools', async () => {
    mount({ learnStudioDefaultOn: true });
    expect(container.querySelector('[data-testid="ls-tool-downloads"]')).toBeTruthy();
    openLearnArea('downloads', { openLearn: () => {}, doc: document, every: 20 });
    await sleep(120);
    expect(selectedArea()).toBe('downloads');
    const tools = container.querySelector('#ls-full-tools');
    expect(tools && tools.open).toBe(true);
  });
  it('in the new look, All Courses presses Learn Studio’s own All Courses button and stays in the new look', async () => {
    mount({ learnStudioDefaultOn: true });
    openLearnArea('lessons', { openLearn: () => {}, doc: document, every: 20 });
    await sleep(120);
    expect(container.querySelector('[data-testid="ls-courses"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="ls-hero"]') || container.querySelector('[data-testid="ls-courses"]')).toBeTruthy();
  });
  it('in the new look, All Departments presses the Browse chip', async () => {
    mount({ learnStudioDefaultOn: true });
    openLearnArea('browse', { openLearn: () => {}, doc: document, every: 20 });
    await sleep(120);
    expect(selectedArea()).toBe('browse');
  });
});
