// =============================================================================
// No dead end at the end of a lesson (DR-1383)
// =============================================================================
// Darrell, 2026-11-10, with a screenshot of the bottom of an open lesson: "When
// reading a lesson users don't have a next lesson tab or previous... the reader
// does it automatically... however when not using it... I can't pick next
// lesson when I want to continue... fix it...", "We don't like dead-ends", and
// "one tap and you're where you want to be" (not three, not the bottom).
//
// THREE THINGS THIS GATE HOLDS:
//   1. An open lesson ends with a Previous and a Next door that name where they
//      go (the number and the title), and Next opens the next lesson in the
//      reader's own order with its guide open, ready to read.
//   2. Previous walks back the same way.
//   3. Never a dead end: All lessons is always a door, and at either end of the
//      course it is the one that stands where the missing neighbor would.
//   4. One tap lands at the top: Next scrolls to the top of the next lesson and
//      All lessons to the lessons bar, after the new screen has painted.
// PROVEN TO CATCH: the component with no onAll renders nothing, so a caller that
// forgets the way back fails case 3 rather than shipping a dead end silently.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import LessonNeighbors from '../components/LessonNeighbors.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const extraCourses = buildCatalogCourseDescriptors();
const mount = () =>
  act(() =>
    root.render(
      React.createElement(ChurchLearn, {
        extraCourses,
        progress: {},
        toggleModule: () => {},
        quizState: {},
        recordQuiz: () => {},
        learnLevel: 'auto',
        setLearnLevel: () => {},
        ageBand: 'adult',
        setAgeBand: () => {},
      })
    )
  );
const click = (el) => act(() => el.click());
const byText = (text) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
const cards = () => container.querySelectorAll('li[id^="learn-lesson-"]');
const q = (id) => container.querySelector(`[data-testid="${id}"]`);
function openLivingLessons() {
  const sel = container.querySelector('#learn-course-pick');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, 'living-lessons');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('an open lesson ends with Previous and Next, and never a dead end', () => {
  it('1. the end of an open lesson names the next lesson, and Next opens it with its guide ready', () => {
    mount();
    openLivingLessons();
    click(byText('Bodybuilding Christ'));
    const next = q('lesson-neighbor-next');
    expect(next, 'no Next door at the end of the lesson').toBeTruthy();
    expect(next.textContent).toMatch(/Next lesson/);
    expect(q('lesson-neighbor-all'), 'All lessons is one tap from the end').toBeTruthy();
    expect(next.textContent).toMatch(/Dying to Live/i);
    click(next);
    expect(cards().length).toBe(1);
    expect(cards()[0].id).toBe('learn-lesson-ll4-dying-to-live');
    expect(getPlace().lessonId).toBe('ll4-dying-to-live');
    expect(container.querySelector('#tutor-panel-ll4-dying-to-live'), 'the next lesson opens ready to read').toBeTruthy();
    expect(q('lesson-neighbors')).toBeTruthy();
  });

  it('2. Previous walks back the same way', () => {
    mount();
    openLivingLessons();
    click(byText('Dying to Live'));
    const prev = q('lesson-neighbor-prev');
    expect(prev.textContent).toMatch(/Previous lesson/);
    expect(prev.textContent).toMatch(/Bodybuilding Christ/i);
    click(prev);
    expect(cards()[0].id).toBe('learn-lesson-ll3-bodybuilding-christ');
  });

  it('3. at either end the All lessons door stands where the missing neighbor would, never a dead end', () => {
    const go = [];
    let all = 0;
    act(() =>
      root.render(
        React.createElement(LessonNeighbors, {
          prev: null,
          next: null,
          onGo: (id) => go.push(id),
          onAll: () => {
            all += 1;
          },
        })
      )
    );
    expect(q('lesson-neighbor-prev')).toBeNull();
    expect(q('lesson-neighbor-next')).toBeNull();
    const back = q('lesson-neighbor-all');
    expect(back.disabled).toBe(false);
    click(back);
    expect(all).toBe(1);
    expect(go).toEqual([]);
  });

  it('4. one tap lands at the top: Next at the top of the next lesson, All lessons at the lessons bar', () => {
    const raf = window.requestAnimationFrame;
    const into = Element.prototype.scrollIntoView;
    const to = window.scrollTo;
    const landed = [];
    const tops = [];
    // Frames run AFTER React has painted the new screen, as a browser runs them.
    const frames = [];
    const paint = () => {
      while (frames.length) frames.shift()(0);
    };
    window.requestAnimationFrame = (cb) => {
      frames.push(cb);
      return frames.length;
    };
    Element.prototype.scrollIntoView = function scrolled() {
      landed.push(this.getAttribute('data-testid') || this.id);
    };
    window.scrollTo = (a) => {
      tops.push(a && typeof a === 'object' ? a.top : a);
    };
    try {
      mount();
      openLivingLessons();
      click(byText('Bodybuilding Christ'));
      tops.length = 0;
      click(q('lesson-neighbor-next'));
      paint();
      expect(cards()[0].id).toBe('learn-lesson-ll4-dying-to-live');
      expect(tops, 'Next lands at the top of the next lesson').toContain(0);
      landed.length = 0;
      click(q('lesson-neighbor-all'));
      paint();
      expect(cards().length).toBeGreaterThan(4);
      expect(landed, 'All lessons lands at the lessons bar, not the bottom').toContain('lessons-bar');
    } finally {
      window.requestAnimationFrame = raf;
      Element.prototype.scrollIntoView = into;
      window.scrollTo = to;
    }
  });

  it('5. the doors stack full width, Next first, and a long word wraps inside its door (DR-1385)', () => {
    act(() =>
      root.render(
        React.createElement(LessonNeighbors, {
          prev: { id: 'a', label: 'L6', title: 'What borrowing makes you, and what it does not' },
          next: { id: 'b', label: 'L8', title: 'He that sweareth to his own hurt, and changeth not' },
          onGo: () => {},
          onAll: () => {},
        })
      )
    );
    const nav = q('lesson-neighbors');
    expect(nav.className).toMatch(/\bflex-col\b/);
    const order = [...nav.querySelectorAll('button')].map((b) => b.getAttribute('data-testid'));
    expect(order).toEqual(['lesson-neighbor-next', 'lesson-neighbor-prev', 'lesson-neighbor-all']);
    for (const b of nav.querySelectorAll('button')) expect(b.className).toMatch(/\bw-full\b/);
    expect(q('lesson-neighbor-next-title').className).toMatch(/\[overflow-wrap:anywhere\]/);
    expect(q('lesson-neighbor-prev-title').className).toMatch(/\[overflow-wrap:anywhere\]/);
  });

  it('PROVEN TO CATCH: a caller that forgets the way back renders no row at all, so case 3 fails instead of shipping a dead end', () => {
    act(() => root.render(React.createElement(LessonNeighbors, { prev: null, next: null, onGo: () => {} })));
    expect(q('lesson-neighbors')).toBeNull();
  });
});
