// @vitest-environment jsdom
// =============================================================================
// A lesson never read says Start, and the speaker inside a lesson reads THAT
// lesson from the beginning (DR-0702)
// =============================================================================
// Darrell 2026-09-30, from his phone on L202 "Prepared Before the Position"
// (L202 · 1 of 201): "I've never read this lesson and it's already asking me to
// continue?... also... the reader should be asking me to read it from the
// beginning because I pushed the speaker while inside the lesson... why isn't
// it working?.... it only works after I hit play... it should be both...
// make sense?"
//
// Two real causes, both pinned here:
//   1. placeInProgress() counted `started` on its own (set by arriving from a
//      link, or any Start / Play tap) and a sentence fingerprint at index 0
//      (the eye-scroll writer's first sentence) as progress, so the card of a
//      lesson never read offered "Continue this lesson".
//   2. The lesson's reading registered only while its GUIDE was open, so the
//      speaker inside a lesson opened by its title found nothing to read but
//      the page. And "start to finish" silently resumed at a bookmark.
// PROVEN-TO-CATCH: against the pre-DR-0702 code 9 of these 11 fail (the
// recorded run is in the DR). The two that pass on both are controls, on
// purpose: the generic panel on a page with no lesson, and a lesson with real
// progress still saying Continue.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

const readSpy = vi.fn();
vi.mock('../lib/use-read-aloud.js', () => ({
  useReadAloud: () => ({
    supported: true, isReading: false, isPaused: false, rate: 1,
    read: (...a) => readSpy(...a), pause: () => {}, resume: () => {}, stop: () => {}, claimAudio: () => {},
    setRate: () => {}, segmentIndex: 0, deviceRead: true, setBoundaryHandler: null, cloudProgress: 0,
    setSkipHandlers: () => {},
    catalog: [{ id: 'sys', label: 'System voice', group: 'Default', usable: true }],
    voiceId: 'sys', setVoiceId: () => {}, currentItem: { id: 'sys', ai: false },
  }),
}));
const { default: TTSControl } = await import('../components/TTSControl.jsx');
const { default: ChurchLearn } = await import('../components/ChurchLearn.jsx');
const { setReadTarget, clearReadTarget, getReadTarget, requestRead, pendingRead, clearRead } = await import('../lib/read-target.js');
const { saveBookmark, clearBookmark } = await import('../lib/reader-bookmarks.js');
const { recordPlace, sentenceKeyOf } = await import('../lib/learn-resume.js');
const { buildCatalogCourseDescriptors } = await import('../lib/learn-catalog.js');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L202 = { courseKey: 'living-lessons', lessonId: 'll202-prepared-before-the-position-homecoming-legacy-good-success-and-represent' };
const OWNER = 'lesson-start-test';
const PARAS = [
  'The first paragraph opens the lesson. It says two things.',
  'The second paragraph teaches the middle. It has its own words.',
  'The third paragraph closes the lesson. It is the end.',
];

let container, root, lessonEl, realConfirm;
beforeEach(() => {
  readSpy.mockClear();
  try { window.localStorage.clear(); } catch { /* ignore */ }
  clearRead();
  const t = getReadTarget(); if (t) clearReadTarget(t.owner);
  realConfirm = window.confirm;
  lessonEl = document.createElement('main');
  lessonEl.innerHTML = `<div id="lesson-el">${PARAS.map((p) => `<p>${p}</p>`).join('')}</div>`;
  document.body.appendChild(lessonEl);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove(); lessonEl.remove();
  const t = getReadTarget(); if (t) clearReadTarget(t.owner);
  clearBookmark(OWNER);
  clearRead();
  try { window.localStorage.clear(); } catch { /* ignore */ }
  window.confirm = realConfirm;
});

const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 400)); });
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
const buttons = () => [...container.querySelectorAll('button')];
const byText = (re) => buttons().find((b) => re.test(b.textContent));

// ---------------------------------------------------------------------------
// The reader panel
// ---------------------------------------------------------------------------
const renderReader = () => act(() => root.render(createElement(TTSControl, { view: 'church' })));
const openPanel = () => {
  const fab = container.querySelector('button[aria-label*="read-aloud controls"]');
  act(() => { fab.click(); });
};
const registerFull = () => act(() => { setReadTarget(OWNER, { label: 'this lesson', text: PARAS.join(' '), elementId: 'lesson-el' }); });

describe('the speaker inside an open lesson offers THAT lesson from the beginning', () => {
  it('a lesson open with its guide closed (a door) is offered first, and the press opens it from the top', () => {
    const open = vi.fn();
    renderReader();
    act(() => { setReadTarget(OWNER, { label: 'this lesson', title: 'Prepared Before the Position', open }); });
    openPanel();
    const primary = byText(/Read this lesson — start to finish/);
    expect(primary, 'the lesson must be offered, not only the page').toBeTruthy();
    // It is the FIRST reading choice on the panel, above Read this page.
    const all = buttons();
    expect(all.indexOf(primary)).toBeLessThan(all.indexOf(byText(/Read this page/)));
    // Never read: nothing to resume.
    expect(q('reader-resume')).toBeNull();
    act(() => { primary.click(); });
    expect(open).toHaveBeenCalledWith({ startSentence: 0 });
  });

  it('offers Resume only when that lesson has a real saved place, and Resume opens it there', () => {
    const open = vi.fn();
    saveBookmark(OWNER, { sentence: 2, key: sentenceKeyOf('The second paragraph teaches the middle.'), para: 1, paras: 3 });
    renderReader();
    act(() => { setReadTarget(OWNER, { label: 'this lesson', open }); });
    openPanel();
    const resume = q('reader-resume');
    expect(resume).toBeTruthy();
    expect(resume.textContent).toMatch(/Resume · Paragraph 2 of 3/);
    act(() => { resume.click(); });
    expect(open).toHaveBeenCalledWith({ startSentence: 2 });
  });

  it('with the lesson mounted, "start to finish" starts at the top even when a bookmark exists', async () => {
    saveBookmark(OWNER, { sentence: 2, key: sentenceKeyOf('The second paragraph teaches the middle.'), para: 1, paras: 3 });
    renderReader();
    registerFull();
    openPanel();
    act(() => { byText(/Read this lesson — start to finish/).click(); });
    await settle();
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The first paragraph opens the lesson\./);
  });

  it('a lesson place past the start (no voice bookmark) is offered as Resume and lands on its sentence', async () => {
    recordPlace({ courseKey: 'c', lessonId: OWNER, sentence: 2, sentenceKey: sentenceKeyOf('The second paragraph teaches the middle.') });
    renderReader();
    registerFull();
    openPanel();
    const resume = q('reader-resume');
    expect(resume, 'a real saved place must be offered').toBeTruthy();
    expect(resume.textContent).toMatch(/Resume where you left off/);
    act(() => { resume.click(); });
    await settle();
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The second paragraph teaches the middle\./);
  });

  it('the want carries "from the beginning" through to the lesson once it registers', async () => {
    saveBookmark(OWNER, { sentence: 2, key: sentenceKeyOf('The second paragraph teaches the middle.'), para: 1, paras: 3 });
    renderReader();
    act(() => { requestRead(OWNER, { startSentence: 0 }); });
    registerFull();
    await settle();
    expect(readSpy).toHaveBeenCalled();
    expect(String(readSpy.mock.calls.at(-1)[0])).toMatch(/^The first paragraph opens the lesson\./);
  });

  it('a page with no lesson keeps the generic panel exactly', () => {
    renderReader();
    openPanel();
    expect(byText(/start to finish/)).toBeFalsy();
    expect(byText(/Read this page/)).toBeTruthy();
    expect(byText(/Start where I tap/)).toBeTruthy();
    expect(byText(/Talk about this/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// The real Learn tree
// ---------------------------------------------------------------------------
const extraCourses = buildCatalogCourseDescriptors();
const mountLearn = () => act(() => root.render(createElement(ChurchLearn, {
  extraCourses,
  progress: {},
  toggleModule: () => {},
  quizState: {},
  recordQuiz: () => {},
  learnLevel: 'auto',
  setLearnLevel: () => {},
  ageBand: 'adult',
  setAgeBand: () => {},
})));
const browseTo = (lessonId) => {
  const title = container.querySelector(`li[data-lesson-id="${lessonId}"] button`);
  expect(title, 'the lesson is listed').toBeTruthy();
  act(() => { title.click(); });
};

describe('a lesson never read says Start, not Continue', () => {
  it('arriving once by a link (started, never moved) leaves the card saying Start', () => {
    recordPlace({ ...L202, started: true });
    mountLearn();
    browseTo(L202.lessonId);
    expect(byText(/Continue this lesson →/), 'no Continue on a lesson never read').toBeFalsy();
    expect(byText(/Start this lesson →/)).toBeTruthy();
  });

  it('a first-sentence fingerprint (a finger drag at the top) is not a place to continue', () => {
    recordPlace({ ...L202, sentence: 0, sentenceKey: 'abc123' });
    mountLearn();
    browseTo(L202.lessonId);
    expect(byText(/Continue this lesson →/)).toBeFalsy();
    expect(byText(/Start this lesson →/)).toBeTruthy();
  });

  it('a lesson with real progress still says Continue', () => {
    recordPlace({ ...L202, stage: 1, step: 2 });
    mountLearn();
    browseTo(L202.lessonId);
    expect(byText(/Continue this lesson →/)).toBeTruthy();
  });
});

describe('inside an open lesson the speaker has the lesson to read', () => {
  it('opened by its title (guide closed), the lesson registers itself; the door opens the guide and asks for the read', () => {
    recordPlace({ ...L202, started: true });
    mountLearn();
    browseTo(L202.lessonId);
    const door = getReadTarget();
    expect(door, 'the lesson must be registered for the reader').toBeTruthy();
    expect(door.owner).toBe(L202.lessonId);
    expect(typeof door.open).toBe('function');
    act(() => { door.open({ startSentence: 0 }); });
    // The same path Play takes: the guide is open, the full lesson registered,
    // and a want for THIS lesson from the top is waiting for the reader.
    expect(container.querySelector(`#tutor-panel-${L202.lessonId}`)).toBeTruthy();
    const full = getReadTarget();
    expect(full.owner).toBe(L202.lessonId);
    expect(full.text.length).toBeGreaterThan(100);
    expect(full.open).toBeFalsy();
    expect(pendingRead()).toMatchObject({ owner: L202.lessonId, opts: { startSentence: 0 } });
  });

  it('closing the guide brings the door back, so the speaker still reads this lesson', () => {
    mountLearn();
    browseTo(L202.lessonId);
    act(() => { byText(/Start this lesson →/).click(); });
    expect(getReadTarget().open).toBeFalsy();
    act(() => { byText(/Close the guide/).click(); });
    const t = getReadTarget();
    expect(t && t.owner).toBe(L202.lessonId);
    expect(typeof t.open).toBe('function');
  });
});
