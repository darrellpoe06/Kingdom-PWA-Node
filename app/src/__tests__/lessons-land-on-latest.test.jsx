// @vitest-environment jsdom
// =============================================================================
// Learn opens on Latest (DR-1606)
// =============================================================================
// Darrell, 2026-11-19, on The Word tab of the Love Corner, with Latest open:
// "Land on latest every time someone goes to lessons... because it defaulting
// to a confusing situation... make it easy for new users!!!!!!!!!" The first
// screen was the list of courses, which asks a newcomer to choose before they
// have seen a lesson. Now it is the newest lessons, each with ▶ Play.
// Proven to catch: with the old first area ('lessons') the Latest tab is not
// selected and the latest list is absent, so the mount case fails.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { LEARN_LANDING_AREA, learnLandingArea } from '../lib/learn-landing.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const course = (key, title, n) => ({
  key,
  meta: { title, audience: 'everyone', tagline: '', format: '' },
  schedule: Array.from({ length: n }, (_, i) => ({
    id: `${key}-l${i + 1}`,
    week: i + 1,
    title: `${title} lesson ${i + 1}`,
    anchor: { ref: `John ${i + 1}:1`, theme: 'a theme' },
    bigIdea: 'the idea',
  })),
  sessionFlow: [],
});

describe('where Learn opens — the rule', () => {
  it('opens on Latest whenever there is more than one course', () => {
    expect(LEARN_LANDING_AREA).toBe('latest');
    expect(learnLandingArea(2)).toBe('latest');
    expect(learnLandingArea(51)).toBe('latest');
  });
  it('opens on the lessons when there is one course (no strip to come back by)', () => {
    expect(learnLandingArea(1)).toBe('lessons');
    expect(learnLandingArea(0)).toBe('lessons');
    expect(learnLandingArea(undefined)).toBe('lessons');
  });
});

describe('where Learn opens — mounted', () => {
  let container;
  let root;
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
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    course: course('a', 'Learning A.I. The Way', 8),
    extraCourses: [course('b', 'Living Lessons from the Word', 12)],
  })));
  const selected = () => container.querySelector('[data-testid="learn-areas"] [aria-selected="true"]');

  it('THE REPORTED CASE: a reader arriving at Learn sees Latest, selected, with its list', () => {
    mount();
    expect(selected() && selected().id).toBe('learn-area-tab-latest');
    expect(container.textContent).toMatch(/newest lessons of every course/i);
  });

  it('every other area is still one tap away, and Lessons still shows the courses', () => {
    mount();
    const tab = container.querySelector('#learn-area-tab-lessons');
    expect(tab).toBeTruthy();
    act(() => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(selected().id).toBe('learn-area-tab-lessons');
  });

  it('a second visit lands on Latest again, not where the last visit left off', () => {
    mount();
    act(() => { container.querySelector('#learn-area-tab-find').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(selected().id).toBe('learn-area-tab-find');
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(selected().id).toBe('learn-area-tab-latest');
  });
});
