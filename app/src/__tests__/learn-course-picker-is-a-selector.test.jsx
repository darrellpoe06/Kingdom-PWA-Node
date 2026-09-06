// @vitest-environment jsdom
// =============================================================================
// The course picker READS AS A SELECTOR — a prompt by default, then the last
// course chosen on this device
// =============================================================================
// Darrell 2026-09-06, from the live tab, after the picker was moved to the top:
// "We need the Drop Down for courses to be even more obvious that this is a
// selection of courses... not a titled section with only those lessons below...
// So maybe have the default say Select a Course of 23? Then leave it on the
// last one?"
//
// Three things, each pinned against the real component:
//   1. A device that has never chosen shows the PROMPT ("Select a course · N
//      to choose from") as the select's value — not the first course's title
//      dressed as a heading.
//   2. Choosing a course shows that course and REMEMBERS it (localStorage,
//      lib/learn-organize.js); a fresh mount reopens on the last one.
//   3. The lesson index under the picker names its course in its own heading,
//      so the list underneath is never "those lessons" under a title-like
//      control — the reader is told whose lessons they are.
// Plus the memory helpers themselves, fail-soft on a blocked store.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import React from 'react';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { rememberedCourseKey, rememberCourseKey, COURSE_MEMORY_KEY } from '../lib/learn-organize.js';
import { recordPlace, clearPlace } from '../lib/learn-resume.js';

let container; let root;

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
});

const mount = (props = {}) => act(() => root.render(React.createElement(ChurchLearn, {
  progress: {},
  recordProgress: () => {},
  quizState: {},
  recordQuiz: () => {},
  learnLevel: 'auto',
  setLearnLevel: () => {},
  ageBand: 'adult',
  setAgeBand: () => {},
  ...props,
})));

const picker = () => container.querySelector('#learn-course-pick');
const prompt = () => picker().querySelector('option[value=""]');
const shownText = () => {
  const p = picker();
  const opt = [...p.options].find((o) => o.value === p.value);
  return opt ? opt.textContent : '';
};
const index = () => container.querySelector('nav[aria-label*="by title"]');
const choose = (key) => act(() => {
  const p = picker();
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
  setter.call(p, key);
  p.dispatchEvent(new Event('change', { bubbles: true }));
});

describe('the memory helpers', () => {
  it('remember and recall a course key per device, and clear on a falsy key', () => {
    expect(rememberedCourseKey()).toBeNull();
    rememberCourseKey('living-lessons');
    expect(window.localStorage.getItem(COURSE_MEMORY_KEY)).toBe('living-lessons');
    expect(rememberedCourseKey()).toBe('living-lessons');
    rememberCourseKey(null);
    expect(rememberedCourseKey()).toBeNull();
  });

  it('a blocked or throwing store never breaks the picker', () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => {} };
    expect(rememberedCourseKey(broken)).toBeNull();
    expect(() => rememberCourseKey('x', broken)).not.toThrow();
    expect(rememberedCourseKey(null)).toBeNull();
  });
});

describe('a device that has never chosen sees the PROMPT, not a course dressed as a heading', () => {
  it('the select’s value is the prompt, which states the count and is not a course', () => {
    mount();
    expect(picker().value).toBe('');
    expect(picker().dataset.chosen).toBe('false');
    const n = picker().querySelectorAll('option:not([value=""])').length;
    expect(n).toBeGreaterThan(1);
    expect(shownText()).toBe(`Select a course · ${n} to choose from`);
    expect(prompt().disabled, 'the prompt is not a choice').toBe(true);
  });

  it('the label says what the control does, and the lesson index names its course', () => {
    mount();
    const label = container.querySelector('label[for="learn-course-pick"]');
    expect(label.textContent).toMatch(/Courses · select one of \d+/);
    // the list under the picker is labelled by COURSE, so it never reads as
    // "those lessons" under a title-like control
    const heading = index().textContent;
    expect(heading).toMatch(/Learning A\.I\. The Way · pick a \w+ by title · \d+/i);
  });
});

describe('choosing a course shows it and REMEMBERS it — "then leave it on the last one"', () => {
  it('after a choice the select shows that course, and the device remembers the key', () => {
    mount();
    const key = [...picker().options].map((o) => o.value).find((v) => v && v !== 'ai');
    choose(key);
    expect(picker().value).toBe(key);
    expect(picker().dataset.chosen).toBe('true');
    expect(shownText()).not.toMatch(/^Select a course/);
    expect(window.localStorage.getItem(COURSE_MEMORY_KEY)).toBe(key);
  });

  it('a fresh mount reopens on the remembered course, not on the prompt', () => {
    mount();
    const key = [...picker().options].map((o) => o.value).find((v) => v && v !== 'ai');
    choose(key);
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(picker().value).toBe(key);
    expect(index().textContent).not.toMatch(/Learning A\.I\. The Way · pick/);
  });

  it('the saved place is the fallback memory — a learner mid-course reopens on that course', () => {
    mount();
    const key = [...picker().options].map((o) => o.value).find((v) => v && v !== 'ai');
    act(() => root.unmount());
    window.localStorage.clear();
    recordPlace({ courseKey: key, lessonId: 'll1' });
    root = createRoot(container);
    mount();
    expect(picker().value).toBe(key);
    expect(picker().dataset.chosen).toBe('true');
    clearPlace();
  });

  it('PROVEN-TO-CATCH — the old default (the A.I. course shown as if chosen) fails the prompt pin', () => {
    mount();
    // What the pre-fix picker displayed on a fresh device:
    expect(shownText()).not.toBe('Learning A.I. The Way · 8 lessons');
  });
});
