// =============================================================================
// Inside a lesson, the lesson is named by ITS OWN number, and Prev / Next walk
// the order the reader chose in the list (DR-0623, agreeing with DR-0626)
// =============================================================================
// DR-0626 put the Living Lessons LIST in number order and named each row by
// its own number (the digits in its id). The inside of a lesson still read the
// WRITTEN array: Darrell's screenshot shows "191 / 191" on L192 "Two Hours
// Became Six", and because the array holds L61 before L60, Next from L60
// skipped L61. The Continue offers named lessons by array position too.
//
// PROVEN-TO-CATCH: run over the ChurchLearn and LessonContinue from before
// this change, the counter reads "191 / 191" on L192, Next from L60 opens L62,
// and the offer says "Lesson 191" — see the DR for the recorded run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { recordPlace } from '../lib/learn-resume.js';
import { orderLessons } from '../lib/lesson-order.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const L192 = 'll192-two-hours-became-six-the-pattern-the-yea-the-inspection-and-the-faith';
const L191 = 'll191-who-he-said-he-was-every-hearer-every-situation-and-the-keys-of-hell-';
const L60 = 'll60-fearfully-and-wonderfully-maintained-thyroid-hair-temple';
const L61 = 'll61-the-audit-fruit-not-photographs-accountable-shepherds';

const extraCourses = buildCatalogCourseDescriptors();
const living = extraCourses.find((c) => (c.meta && c.meta.key) === 'living-lessons' || c.key === 'living-lessons');
const fullId = (prefix) => living.schedule.find((m) => m.id.startsWith(prefix)).id;

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const mount = () => act(() => root.render(createElement(ChurchLearn, {
  extraCourses, progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
})));
const click = (el) => act(() => { el.click(); });
const byTestId = (id) => container.querySelector(`[data-testid="${id}"]`);
const openedLessonId = () => {
  const card = [...container.querySelectorAll('[id^="learn-lesson-"]')].find((e) => e.id !== 'learn-lesson-find');
  return card ? card.id.replace('learn-lesson-', '') : null;
};
const barButtons = () => [...byTestId('lesson-space-bar').querySelectorAll('button')];

describe('the facts this rests on (measured, not assumed)', () => {
  it('L192 sits at array position 191, and L61 is written before L60', () => {
    const ids = living.schedule.map((m) => m.id);
    expect(living.schedule.find((m) => m.id === fullId('ll192-')).week).toBe(191);
    expect(ids.indexOf(fullId('ll61-'))).toBeLessThan(ids.indexOf(fullId('ll60-')));
  });
});

describe('the lesson is named by its own number', () => {
  it('the in-lesson counter says L192 on L192, never "191 / 191"', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: fullId('ll192-'), stage: 1 });
    mount();
    click(byTestId('continue-latest'));
    const n = byTestId('lesson-bar-number');
    expect(n, 'the counter must render').toBeTruthy();
    expect(n.textContent.trim().startsWith('L192')).toBe(true);
    expect(n.textContent).not.toMatch(/^\s*191\s*\/\s*191/);
    expect(n.getAttribute('data-lesson-number')).toBe('192');
  });

  it('"Pick up where you left off" and the course chip name L192 by its own number', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: fullId('ll192-'), stage: 1 });
    mount();
    expect(byTestId('continue-latest').textContent).toContain('Lesson 192 · ');
    expect(byTestId('continue-latest').textContent).not.toContain('Lesson 191 · Two Hours');
    expect(byTestId('continue-chip').textContent.replace(/\s+/g, '')).toBe('ContinueL192');
  });
});

describe('Prev / Next walk the reader\'s order', () => {
  it('by number (the default): Next from L60 opens L61, which is written before it', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: fullId('ll60-'), stage: 1 });
    mount();
    click(byTestId('continue-latest'));
    expect(openedLessonId()).toBe(fullId('ll60-'));
    const next = barButtons()[barButtons().length - 1];
    click(next);
    expect(openedLessonId()).toBe(fullId('ll61-'));
  });

  it('L192 is the last by number: Next is off and Prev opens L191', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: fullId('ll192-'), stage: 1 });
    mount();
    click(byTestId('continue-latest'));
    const btns = barButtons();
    expect(btns[btns.length - 1].disabled).toBe(true);
    click(btns[btns.length - 2]);
    expect(openedLessonId()).toBe(fullId('ll191-'));
  });

  it('"Newest first" picked in the list: Next follows that order instead', () => {
    window.localStorage.setItem('poetech.learn.lessonOrder.v1', JSON.stringify({ 'living-lessons': 'newest' }));
    const newest = orderLessons(living.schedule, 'newest');
    const start = newest[3];
    recordPlace({ courseKey: 'living-lessons', lessonId: start.id, stage: 1 });
    mount();
    click(byTestId('continue-latest'));
    const next = barButtons()[barButtons().length - 1];
    click(next);
    expect(openedLessonId()).toBe(newest[4].id);
  });
});

// Keep the literal ids referenced so a renamed lesson fails loudly here.
it('the lesson ids this file names still exist', () => {
  for (const id of [L192, L191, L60, L61]) expect(living.schedule.some((m) => m.id.startsWith(id.slice(0, 20)))).toBe(true);
});
