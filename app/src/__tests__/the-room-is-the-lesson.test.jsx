// @vitest-environment jsdom
// =============================================================================
// THE ROOM IS THE LESSON (DR-0749)
// =============================================================================
// Darrell 2026-10-02, seven screenshots of L105 and Sovereign A.I. week 29:
// "we have a lot of not necessary information within the lessons space...
// after the user chooses the lesson we want that space cleared from
// clutter... the top staying the same after we already read it while the
// bottom moves makes the reading space smaller... the next page isn't flowing
// well.. the page starting point has to always be found instead of starting
// where we need based on where we are in the lesson." And: "once inside the
// lessons we have the opportunity to scroll or click next... I like both...
// however not just one."
//
// MEASURED on main 6e329a99 before a line was written, with a lesson open and
// its guide open: the course title, the Word-first lead, "The 31 weeks", the
// cohort pill and the start date stood above the lesson; the card's action
// row (Share · Copy lesson · Copy link · Download · Close the guide · Play ·
// Present · Mark done) rendered TWICE, back to back, over the guide; the
// timeline line sat between them; the sticky block (bar + two-line title +
// progress) never moved while the body scrolled; a Next tap left the view
// where it was; the only way through the Teach core was the pager.
//
// PROVEN-TO-CATCH: every render case below fails against that tree.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import {
  nextChromeState, stepScrollTop, stepInView, readFlowMode, writeFlowMode, landStep, announceStep, chromeAfterLanding, chromePinned,
  FLOW_KEY, FLOW_WORDS, CHROME_HIDE_AFTER, CHROME_DELTA, LANDED_EVENT,
} from '../lib/lesson-room.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// ── 1. THE DECISIONS, PURE ──────────────────────────────────────────────────
describe('the chrome hides as you read down and returns as you look up', () => {
  it('stays shown near the top, whatever the move', () => {
    expect(nextChromeState('hidden', 300, 40)).toBe('shown');
    expect(nextChromeState('shown', 0, CHROME_HIDE_AFTER)).toBe('shown');
  });
  it('PROVEN-TO-CATCH: a real scroll down hides it; a real scroll up shows it; a tremor changes nothing', () => {
    expect(nextChromeState('shown', 400, 400 + CHROME_DELTA + 1)).toBe('hidden');
    expect(nextChromeState('hidden', 900, 900 - CHROME_DELTA - 1)).toBe('shown');
    expect(nextChromeState('hidden', 900, 905)).toBe('hidden');
    expect(nextChromeState('shown', 900, 895)).toBe('shown');
  });
});

describe('a step lands under the chrome', () => {
  it('scrolls so the step top sits the gap below the chrome, never above the page', () => {
    expect(stepScrollTop({ elTop: 700, scrollY: 1000, chromeHeight: 120 })).toBe(1572);
    expect(stepScrollTop({ elTop: 10, scrollY: 0, chromeHeight: 200 })).toBe(0);
  });
  it('landStep puts the step at the top of the screen with the chrome aside, says where it landed, and counts the chrome only near the page top', () => {
    const calls = []; const said = [];
    const win = { scrollY: 500, scrollTo: (o) => calls.push(o), dispatchEvent: (e) => said.push(e) };
    const el = { getBoundingClientRect: () => ({ top: 300 }) };
    const chrome = { getBoundingClientRect: () => ({ height: 90 }) };
    // Deep in the page: the chrome steps aside, so its height is not counted.
    expect(landStep(el, { chromeEl: chrome, win })).toBe(500 + 300 - 8);
    expect(calls).toEqual([{ top: 792, behavior: 'auto' }]);
    expect(said.length).toBe(1);
    expect(said[0].type).toBe(LANDED_EVENT);
    expect(said[0].detail).toEqual({ top: 792 });
    expect(chromeAfterLanding(792)).toBe('hidden');
    // Near the top of the page the chrome always shows: the line sits under it.
    const nearTop = { scrollY: 0, scrollTo: (o) => calls.push(o), dispatchEvent: () => {} };
    expect(landStep({ getBoundingClientRect: () => ({ top: 100 }) }, { chromeEl: chrome, win: nearTop })).toBe(2);
    expect(chromeAfterLanding(2)).toBe('shown');
    expect(chromeAfterLanding(CHROME_HIDE_AFTER)).toBe('shown');
    expect(chromeAfterLanding(CHROME_HIDE_AFTER + 1)).toBe('hidden');
    expect(landStep(null, { win })).toBe(false);
  });
  it('the chrome steps aside only once it is pinned at the top of the screen, never while it still stands in the page above the lesson', () => {
    const at = (top, height) => ({ getBoundingClientRect: () => ({ top, height }) });
    expect(chromePinned(at(0, 90), 'shown')).toBe(true);
    expect(chromePinned(at(180, 210), 'shown'), 'standing 180px down the page: a slide up would cover the course header').toBe(false);
    // Hidden, it is translated up by its own height: measured at -90 it is pinned at 0.
    expect(chromePinned(at(-90, 90), 'hidden')).toBe(true);
    expect(chromePinned(at(100, 90), 'hidden')).toBe(false);
    expect(chromePinned(null, 'shown'), 'nothing to measure counts as pinned').toBe(true);
  });
  it('announceStep sends the step on the window and never throws without one', () => {
    const got = [];
    const onStep = (e) => got.push(e.detail.el);
    window.addEventListener('poetech:lesson-step', onStep);
    const el = document.createElement('div');
    expect(announceStep(el, window)).toBe(true);
    window.removeEventListener('poetech:lesson-step', onStep);
    expect(got).toEqual([el]);
    expect(announceStep(el, null)).toBe(false);
  });
});

describe('step by step, or scroll it all: the reader\'s choice, kept', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
  it('defaults to steps; keeps a real choice; ignores a bad one', () => {
    const s = mem();
    expect(readFlowMode(s)).toBe('steps');
    expect(writeFlowMode('scroll', s)).toBe('scroll');
    expect(s.getItem(FLOW_KEY)).toBe('scroll');
    expect(readFlowMode(s)).toBe('scroll');
    expect(writeFlowMode('sideways', s)).toBe('steps');
    expect(FLOW_WORDS.steps).toBe('Step by step');
    expect(FLOW_WORDS.scroll).toBe('Scroll it all');
  });
  it('the step under the eye is the last one whose top is above the reading line', () => {
    expect(stepInView([-400, -100, 50, 300], 60)).toBe(2);
    expect(stepInView([100, 400], 60)).toBe(0);
    expect(stepInView([], 60)).toBe(-1);
  });
});

// ── 2. THE ROOM, RENDERED ───────────────────────────────────────────────────
describe('inside a lesson, the room is the lesson', () => {
  let container; let root;
  const extraCourses = buildCatalogCourseDescriptors();
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    try { window.localStorage.clear(); window.sessionStorage.clear(); } catch (_) { /* ignore */ }
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
    extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {}, ...props,
  })));
  const byText = (text) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
  const openLivingLessons = () => {
    const sel = container.querySelector('#learn-course-pick');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      setter.call(sel, 'living-lessons');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
  };
  const openALesson = () => { mount(); openLivingLessons(); act(() => { byText('Bodybuilding Christ').click(); }); };
  const start = () => act(() => { byText('Start this lesson').click(); });
  const stepNext = () => [...container.querySelectorAll('button')]
    .filter((b) => /Next\s*→/.test(b.textContent || ''))
    .find((b) => !b.closest('[data-testid="lesson-space-sticky"]'));

  it('PROVEN-TO-CATCH: the course\'s schedule furniture waits while a lesson is open; the course header stays', () => {
    mount(); openLivingLessons();
    expect(container.textContent).toMatch(/The \d+ lessons/);
    expect(container.textContent).toContain('Word-first');
    act(() => { byText('Bodybuilding Christ').click(); });
    expect(container.textContent).not.toMatch(/The \d+ lessons/);
    expect(container.textContent).not.toMatch(/Cohort 1|Self-paced/);
    // Darrell 2026-10-02: "I want the course header!!!" — the course's name
    // and its opening Word stay above the lesson.
    const h2 = container.querySelector('#learn-h');
    expect(h2.className).not.toContain('sr-only');
    expect(h2.textContent.trim().length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Word-first');
  });

  it('PROVEN-TO-CATCH: with the guide open the head row keeps Close and Play, folds the rest under More, and the second row waits until after the guide', () => {
    openALesson();
    const before = container.querySelector('[data-testid="lesson-head-row"]');
    expect(before.textContent).toContain('Copy link');
    start();
    const head = container.querySelector('[data-testid="lesson-head-row"]');
    expect(head.getAttribute('data-folded')).toBe('true');
    expect(head.textContent).toContain('Close the guide');
    expect(head.textContent).toContain('Play');
    expect(head.textContent).toContain('More');
    expect(head.textContent).not.toContain('Copy link');
    expect(head.textContent).not.toContain('Present');
    expect(head.textContent).not.toContain('Mark this lesson done');
    // One head row, and the foot row after the guide, not under the head.
    const guide = container.querySelector('[id^="tutor-panel-"]');
    const foot = container.querySelector('[data-testid="lesson-foot-row"]');
    expect(foot, 'the finished reader still needs the row').toBeTruthy();
    expect(guide.contains(foot), 'the foot row belongs after the guide').toBe(true);
    expect(foot.textContent).toContain('Mark this lesson done');
    // The timeline line waits for the guide to close.
    expect(container.textContent).not.toContain('On the timeline:');
    // More opens the rest in place.
    act(() => { container.querySelector('[data-testid="lesson-head-more"]').click(); });
    const opened = container.querySelector('[data-testid="lesson-head-row"]');
    expect(opened.getAttribute('data-folded')).toBe('false');
    expect(opened.textContent).toContain('Copy link');
    expect(opened.textContent).toContain('Present');
    // Close the guide: the full row and the timeline come back.
    act(() => { container.querySelector('[data-testid="lesson-close-guide"]').click(); });
    expect(container.querySelector('[data-testid="lesson-head-row"]').textContent).toContain('Start this lesson');
  });

  it('PROVEN-TO-CATCH: the sticky block knows it is reading, keeps its two-line title and fold, and hides on a scroll down', () => {
    openALesson();
    const sticky = () => container.querySelector('[data-testid="lesson-space-sticky"]');
    expect(sticky().getAttribute('data-room')).toBe('course');
    expect(sticky().getAttribute('data-chrome')).toBe('shown');
    expect(sticky().className).toContain('lesson-space-sticky');
    expect(sticky().className).toContain('sticky');
    // Never the Presenter's own marker: the idle lock and the ▶ Play tests read
    // [data-reading="true"] as "the deck is open" (use-idle-lock.jsx).
    expect(container.querySelector('[data-reading="true"]')).toBeNull();
    start();
    expect(sticky().getAttribute('data-room')).toBe('reading');
    expect(container.querySelector('[data-reading="true"]')).toBeNull();
    // The title is NOT shrunk while reading (Darrell 2026-10-02: "half is
    // shown and the drop down... don't take away what I've already discussed
    // and firmed up"): the two-line ceiling of DR-0605 stands.
    const title = container.querySelector('[data-testid="lesson-space-title"]');
    expect(title.getAttribute('style') || '').toMatch(/2\.8em/);
    expect(title.className).toContain('text-[0.875rem]');
    // The reader scrolls down past the top: the chrome hides.
    const scrollTo = (y) => { Object.defineProperty(window, 'scrollY', { configurable: true, value: y }); act(() => { window.dispatchEvent(new Event('scroll')); }); };
    const rafs = [];
    const oldRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { rafs.push(cb); return rafs.length; };
    try {
      scrollTo(400);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('hidden');
      // A flick up brings it back.
      scrollTo(300);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('shown');
      // Down again, hidden; a flick up, shown; then a tapped step deep in the
      // page lands the words at the top of the screen and the chrome steps
      // aside for them.
      scrollTo(900);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('hidden');
      scrollTo(860);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('shown');
      act(() => { byText('Teach').click(); });
      const scrolls = [];
      window.scrollTo = (o) => scrolls.push(o);
      const next = stepNext();
      expect(next, 'the teach stage should be paced').toBeTruthy();
      act(() => { next.click(); });
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(scrolls.length, 'the step must be landed').toBeGreaterThan(0);
      // jsdom measures every rect as 0: the step lands at scrollY - gap, deep in the page.
      expect(scrolls[scrolls.length - 1].top).toBe(860 - 8);
      expect(sticky().getAttribute('data-chrome'), 'the chrome steps aside for the landed words').toBe('hidden');
      // The landing's own scroll is not the reader's: arriving changes nothing.
      scrollTo(852);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('hidden');
      // The reader's next flick up brings the chrome back as before.
      scrollTo(800);
      act(() => { rafs.splice(0).forEach((cb) => cb()); });
      expect(sticky().getAttribute('data-chrome')).toBe('shown');
    } finally {
      window.requestAnimationFrame = oldRaf;
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    }
  });

  it('PROVEN-TO-CATCH: Scroll it all shows every step at once, Step by step brings the pager back, and the choice is kept on the device', () => {
    openALesson();
    start();
    const modeRow = container.querySelector('[data-testid="lesson-flow-mode"]');
    expect(modeRow, 'the reader needs the switch').toBeTruthy();
    const stepsBtn = modeRow.querySelector('[data-flow="steps"]');
    const scrollBtn = modeRow.querySelector('[data-flow="scroll"]');
    expect(stepsBtn.getAttribute('aria-pressed')).toBe('true');
    act(() => { byText('Teach').click(); });
    expect(container.querySelectorAll('[data-step-index]').length).toBe(0);
    expect(stepNext()).toBeTruthy();
    act(() => { scrollBtn.click(); });
    expect(window.localStorage.getItem(FLOW_KEY)).toBe('scroll');
    expect(container.querySelector('[data-flow="scroll"]').getAttribute('aria-pressed')).toBe('true');
    const steps = container.querySelectorAll('[data-step-index]');
    expect(steps.length, 'every step of the core should be on the page').toBeGreaterThan(1);
    expect(container.textContent).toContain('Reading the whole lesson');
    expect(stepNext()).toBeFalsy();
    act(() => { container.querySelector('[data-flow="steps"]').click(); });
    expect(window.localStorage.getItem(FLOW_KEY)).toBe('steps');
    act(() => { byText('Teach').click(); });
    // The pager is back, opened at the step the eye was on while scrolling
    // (the place followed the reading); in this DOM without layout that is
    // the last step, so the pager's Back control is the sure sign of it.
    expect(byText('◀ Back'), 'the pager is back').toBeTruthy();
    expect(container.querySelectorAll('[data-step-index]').length).toBe(0);
  });

  it('the pace controls start open on a fresh lesson (nothing is removed)', () => {
    openALesson();
    start();
    const fold = container.querySelector('[data-testid="lesson-pace-fold"]');
    expect(fold.getAttribute('data-open')).toBe('true');
    expect(container.textContent).toContain('How much time do you have?');
  });
});
