// Locks the course-split banner (DR-0215 §2): when the facilitator picks a slot
// shorter than the lesson's spoken teaching, the run-of-show shows that the
// lesson flows across N sessions -- content-preserving, nothing cut. A lesson
// that fits the slot shows no banner. Uses the repo's react-dom/client + act
// render pattern.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { LessonRunOfShow } from '../components/LessonFlow.jsx';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const mount = (props) => act(() => root.render(createElement(LessonRunOfShow, props)));

const L50 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll50-'));      // ~35 min spoken
const SHORT = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll1-'));     // ~12 min spoken

describe('course-split banner in the run-of-show', () => {
  it('shows the multi-session banner for an over-slot lesson at a 25-min slot', () => {
    mount({ module: L50, baseMinutes: 25 });
    expect(container.textContent).toMatch(/Runs across \d+ sessions/);
    expect(container.textContent).toMatch(/Session 1 of/);
    expect(container.textContent).toMatch(/nothing is cut|paced across sessions/i);
  });

  it('shows NO banner when the same lesson fits one longer slot', () => {
    mount({ module: L50, baseMinutes: 60 });
    expect(container.textContent).not.toMatch(/Runs across/);
  });

  it('shows NO banner for a short lesson even at a 25-min slot', () => {
    mount({ module: SHORT, baseMinutes: 25 });
    expect(container.textContent).not.toMatch(/Runs across/);
  });
});
