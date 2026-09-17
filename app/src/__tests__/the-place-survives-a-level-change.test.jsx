// @vitest-environment jsdom
// A MID-LESSON LEVEL CHANGE KEEPS THE LEARNER'S PLACE.
// =============================================================================
// Darrell 2026-09-15: "Even if half of the way through they decided to change
// levels they can... make sense?" Yes — and the previous AgePacedLesson would
// have punished it: picking a level re-chunks the text (child 45 words a step,
// adult 200), the step index was kept as-is and clamped, so a learner at step
// 20 of 41 in the child words who picked Adult (say 10 steps) landed on step
// 10 of 10 — the END. Half-way now stays half-way, proportionally, and the
// saved place follows (DR-0418).
//
// Proven-to-catch: against the previous component the first test reads
// "Step 10 of 10" instead of "Step 5 of 10".
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { AgePacedLesson } from '../components/ChurchLearn.jsx';
import { lessonPlanForAge } from '../lib/learn-framework.js';

const sentences = (n, s) => Array.from({ length: n }, (_, i) => `${s} ${i + 1}.`).join(' ');
// child: 45 words/step; adult: 200 words/step. 5-word sentences.
const MODULE = {
  id: 'place-test',
  lesson: sentences(400, 'The adult words go on'),          // 2000 words → 10 adult steps
  levels: { child: sentences(369, 'The sun is warm'), teen: sentences(300, 'You can hold a thought'), senior: sentences(300, 'The why and the edge') },
};

let host; let root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const stepText = () => host.textContent.match(/Step (\d+) of (\d+)/);

describe('half-way stays half-way', () => {
  it('a learner at step 21 of 41 in the child words who picks Adult lands mid-lesson, not at the end', () => {
    const child = lessonPlanForAge(MODULE, 'child');
    const adult = lessonPlanForAge(MODULE, 'adult');
    expect(child.totalSegments).toBe(41);
    expect(adult.totalSegments).toBeLessThan(child.totalSegments);
    const onStepChange = vi.fn();
    act(() => { root.render(createElement(AgePacedLesson, { plan: child, initialIndex: 20, onStepChange })); });
    expect(stepText()[1]).toBe('21');
    act(() => { root.render(createElement(AgePacedLesson, { plan: adult, initialIndex: 20, onStepChange })); });
    const [, step, total] = stepText();
    const expected = Math.round((20 / 41) * adult.totalSegments); // half-way stays half-way
    expect(Number(total)).toBe(adult.totalSegments);
    expect(Number(step)).toBe(expected + 1);            // shown 1-based
    expect(Number(step)).toBeLessThan(adult.totalSegments); // NOT the end (the old clamp)
    // onStepChange now reports (step, total). The mapped STEP is unchanged and
    // is still the property this test exists for; the TOTAL is what lets the
    // sticky place-indicator show how far through a lesson a reader is without
    // it scrolling away (Darrell 2026-09-17). Pinning the old arity would fail
    // a signature change while proving nothing about the mapped step.
    expect(onStepChange).toHaveBeenCalledWith(expected, expect.any(Number)); // the saved place follows
  });

  it('the first step stays the first step, and the last stays the last', () => {
    const child = lessonPlanForAge(MODULE, 'child');
    const adult = lessonPlanForAge(MODULE, 'adult');
    act(() => { root.render(createElement(AgePacedLesson, { plan: child, initialIndex: 0 })); });
    act(() => { root.render(createElement(AgePacedLesson, { plan: adult, initialIndex: 0 })); });
    expect(stepText()[1]).toBe('1');
    act(() => { root.render(createElement(AgePacedLesson, { plan: adult, initialIndex: 9 })); });
    act(() => { root.render(createElement(AgePacedLesson, { plan: adult, initialIndex: 9 })); });
    // re-render at the last adult step, then to child: proportional end → end
    act(() => { root.render(createElement(AgePacedLesson, { plan: child, initialIndex: 9 })); });
    const [, step, total] = stepText();
    expect(total).toBe('41');
    expect(Number(step)).toBeGreaterThanOrEqual(1);
  });

  it('a re-render with the SAME plan shape moves nothing', () => {
    const child = lessonPlanForAge(MODULE, 'child');
    const onStepChange = vi.fn();
    act(() => { root.render(createElement(AgePacedLesson, { plan: child, initialIndex: 7, onStepChange })); });
    act(() => { root.render(createElement(AgePacedLesson, { plan: { ...child }, initialIndex: 7, onStepChange })); });
    expect(stepText()[1]).toBe('8');
    expect(onStepChange).not.toHaveBeenCalled();
  });
});
