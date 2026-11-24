// @vitest-environment jsdom
// =============================================================================
// LearnStudioPreview: Read Lesson / Listen / an age chip must actually hand the
// tap back to the REAL reader (ChurchLearn's onOpenLesson), not just to
// LearnStudio's own internal onRead/onListen/onVersion props.
//
// Regression (2026-11-24): LearnStudio calls its onRead/onListen/onVersion
// props as onRead(lesson, course, mode) -- the bare lesson/course objects (see
// learn-studio.test.jsx, which already pins that CONTRACT). LearnStudioPreview
// wired a single-argument `open(x)` that checked `x.p` -- `x` was actually the
// bare `lesson`, which has no `.p`, so the guard was always false and
// onOpenLesson was NEVER called. No crash, no console error: the lesson cover
// just sat there while the rest of the app kept responding -- exactly what
// Darrell's wife described: "They were just static images without
// functionality added... the app still moved!!!!?!!" This test drives the
// real integration (LearnStudioPreview -> LearnStudio -> a real click) instead
// of unit-testing either side alone, which is what let the mismatch through.
// =============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const render = (el) => act(() => root.render(el));
const click = (node) => act(() => node.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const byText = (text) =>
  [...container.querySelectorAll('button')].filter((n) => n.textContent.trim() === text && ![...n.children].some((c) => c.textContent.trim() === text));

const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
// A lesson Learn Studio will actually feature/discover on the home screen, so
// the test reaches it the way a real tap does, via Hero's own Listen button.

describe('LearnStudioPreview: Read/Listen/a version chip reach the real lesson (DR-0691 follow-up)', () => {
  it('tapping Listen on the home-screen hero hands the real course key + lesson id to onOpenLesson', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} />);
    const listenBtn = byText('Listen')[0];
    expect(listenBtn).toBeTruthy();
    click(listenBtn);
    expect(onOpenLesson).toHaveBeenCalledTimes(1);
    const [courseKey, lessonId] = onOpenLesson.mock.calls[0];
    expect(typeof courseKey).toBe('string');
    expect(courseKey.length).toBeGreaterThan(0);
    expect(typeof lessonId).toBe('string');
    expect(lessonId.length).toBeGreaterThan(0);
  });

  it('tapping Read Lesson on the opened lesson cover also reaches onOpenLesson with a real course key + lesson id', () => {
    const onOpenLesson = vi.fn();
    render(<LearnStudioPreview courses={COURSES} onOpenLesson={onOpenLesson} onExit={vi.fn()} />);
    // Start Lesson only opens Learn Studio's OWN cover screen (internal state,
    // never the external hand-off); Read Lesson on that cover is what must
    // reach the real reader.
    click(byText('Start Lesson')[0]);
    const readBtn = byText('Read Lesson')[0];
    expect(readBtn).toBeTruthy();
    click(readBtn);
    expect(onOpenLesson).toHaveBeenCalledTimes(1);
    expect(onOpenLesson.mock.calls[0][0]).toBeTruthy();
    expect(onOpenLesson.mock.calls[0][1]).toBeTruthy();
  });
});
