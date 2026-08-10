// @vitest-environment jsdom
// =============================================================================
// A shared link really opens that lesson — in the real Learn render
// =============================================================================
// Darrell 2026-08-10: "links to the exact lessons." A link that builds
// correctly and then lands the reader on a course picker is not a link to a
// lesson. This walks the journey the recipient actually takes: they open a URL
// someone texted them, and the lesson is on the screen.
//
// It also pins the two ways a link can go stale — a course that no longer
// exists, and a lesson that no longer exists — because a dead link must open
// Learn normally, never a blank space (the "blank tab" class DR-0061 named).
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { lessonQuery } from '../lib/lesson-links.js';
import { buildHealthyLivingSchedule, HEALTHY_LIVING_META } from '../lib/healthy-living-course.js';
import { buildSelfPacedDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
const setSearch = (search) => {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
};

beforeEach(() => {
  window.localStorage.clear();
  setSearch('');
  container = document.createElement('main');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); setSearch(''); });

const mount = () => act(() => root.render(createElement(ChurchLearn, {
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  extraCourses: buildSelfPacedDescriptors({}),
})));

const text = () => container.textContent || '';

describe('the recipient opens the link and the lesson is there', () => {
  it('a lesson link opens that course AND that lesson’s own space', () => {
    const lesson = buildHealthyLivingSchedule()[1];
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: lesson.id }));
    mount();
    expect(container.querySelector('#learn-h').textContent).toBe(HEALTHY_LIVING_META.title);
    expect(text()).toContain(lesson.title);
    // The lesson's own space: its card is on screen and the index is not.
    expect(document.getElementById(`learn-lesson-${lesson.id}`)).toBeTruthy();
    const others = buildHealthyLivingSchedule().filter((m) => m.id !== lesson.id);
    expect(others.some((m) => document.getElementById(`learn-lesson-${m.id}`))).toBe(false);
  });

  it('a course link opens the course (no lesson space forced)', () => {
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key }));
    mount();
    expect(container.querySelector('#learn-h').textContent).toBe(HEALTHY_LIVING_META.title);
  });

  it('with no link at all, Learn opens exactly as before — the default course', () => {
    mount();
    // The picker still LISTS every course; what a link changes is which one is
    // ACTIVE, so the heading is the honest assertion.
    expect(container.querySelector('#learn-h').textContent).toBe('Learning A.I. The Way');
  });
});

describe('a stale link never lands on a dead screen', () => {
  it('a course that no longer exists opens Learn normally', () => {
    setSearch(lessonQuery({ courseKey: 'a-course-we-retired', lessonId: 'x' }));
    mount();
    expect(text()).toContain('Church · Learn');
    expect(container.querySelector('#learn-h').textContent).toBe('Learning A.I. The Way');
  });

  it('a lesson that no longer exists still opens its course', () => {
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key, lessonId: 'hl-a-lesson-we-removed' }));
    mount();
    expect(container.querySelector('#learn-h').textContent).toBe(HEALTHY_LIVING_META.title);
  });
});

describe('every lesson can be taken with you', () => {
  it('the card offers Copy lesson and Copy link', () => {
    setSearch(lessonQuery({ courseKey: HEALTHY_LIVING_META.key }));
    mount();
    const labels = [...container.querySelectorAll('button')].map((b) => b.textContent || '');
    expect(labels.some((t) => /Copy lesson/i.test(t))).toBe(true);
    expect(labels.some((t) => /Copy link/i.test(t))).toBe(true);
  });
});
