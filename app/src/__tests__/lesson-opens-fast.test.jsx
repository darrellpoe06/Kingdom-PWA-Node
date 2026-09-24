// =============================================================================
// A lesson opens fast: the list renders what is near the reader, and the
// print-only curriculum exists only while printing (DR-0637)
// =============================================================================
// Measured 2026-09-24 in Chromium at 390x844 (DR-0637): the Learn tab held
// 34,022 elements — 19,023 of them every lesson's full card, 9,919 a hidden
// print-only copy of the curriculum — and a Continue tap spent 1.5–1.75 s of
// script tearing them down. These pins hold the fix in the real Learn tree.
// The test DOM has no IntersectionObserver, so one is installed here to stand
// for the browser; without it every card renders in full (the fallback,
// pinned last).
//
// PROVEN-TO-CATCH: over the ChurchLearn before this change, the light-card and
// print pins fail (every card full, the print copy always mounted) — see the
// DR for the recorded run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// A stand-in IntersectionObserver the test drives by hand.
let observers = [];
class FakeIO {
  constructor(cb) { this.cb = cb; this.els = new Set(); observers.push(this); }
  observe(el) { this.els.add(el); }
  unobserve(el) { this.els.delete(el); }
  disconnect() { this.els.clear(); }
}
const bringNear = (el) => act(() => {
  for (const o of observers) if (o.els.has(el)) o.cb([{ target: el, isIntersecting: true }]);
});

const extraCourses = buildCatalogCourseDescriptors();
let container, root, realIO;
beforeEach(() => {
  window.localStorage.clear();
  observers = [];
  realIO = window.IntersectionObserver;
  window.IntersectionObserver = FakeIO;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.IntersectionObserver = realIO;
  window.localStorage.clear();
});
const mount = () => act(() => root.render(createElement(ChurchLearn, {
  extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
})));
const cards = () => [...container.querySelectorAll('ol > li[id^="learn-lesson-"]')];
const printCopy = () => container.querySelector('.hidden.print\\:block');

describe('the lesson list renders what is near the reader', () => {
  it('the first cards render in full; the rest are light cards that keep their id and title', () => {
    mount();
    const all = cards();
    expect(all.length).toBeGreaterThan(100); // Living Lessons, the default course
    const light = all.filter((li) => li.hasAttribute('data-lazy-card'));
    const full = all.filter((li) => !li.hasAttribute('data-lazy-card'));
    expect(full.length).toBe(6);
    expect(light.length).toBe(all.length - 6);
    // a light card is still findable by id and says which lesson it is
    expect(light[0].id).toMatch(/^learn-lesson-/);
    expect(light[0].textContent).toMatch(/Lesson \d+ · /);
    // and it is light: a handful of elements, not a full card's hundreds
    expect(light[0].getElementsByTagName('*').length).toBeLessThan(5);
    expect(full[0].getElementsByTagName('*').length).toBeGreaterThan(20);
  });

  it('a light card fills in when it comes near, and stays filled', () => {
    mount();
    const target = cards().find((li) => li.hasAttribute('data-lazy-card'));
    const id = target.id;
    bringNear(target);
    const now = document.getElementById(id);
    expect(now.hasAttribute('data-lazy-card')).toBe(false);
    expect(now.textContent).toMatch(/Start this lesson/);
  });

  it('without IntersectionObserver every card renders in full, as before', () => {
    window.IntersectionObserver = undefined;
    mount();
    expect(cards().filter((li) => li.hasAttribute('data-lazy-card')).length).toBe(0);
  });
});

describe('the print-only curriculum exists only while printing', () => {
  it('absent on screen; mounted for beforeprint with every lesson; gone after afterprint', () => {
    mount();
    expect(printCopy(), 'not on screen').toBeNull();
    act(() => { window.dispatchEvent(new Event('beforeprint')); });
    const p = printCopy();
    expect(p, 'mounted for printing').toBeTruthy();
    expect(p.querySelectorAll('h2').length).toBe(cards().length);
    act(() => { window.dispatchEvent(new Event('afterprint')); });
    expect(printCopy()).toBeNull();
  });
});
