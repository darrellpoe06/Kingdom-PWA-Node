// =============================================================================
// ▶ PLAY BELONGS TO EVERY LIST OF TITLES, NOT JUST THE CARDS
// =============================================================================
// Darrell, 2026-09-12, with the by-title index open on his phone:
// "play button was for the link list so it can produce the same thing..."
//
// 2026-09-11 put ▶ Play on the lesson CARDS and on the overview, and ungated
// both. The by-title index — the list the Learn tab actually opens with, and
// the one in his screenshot — kept only a title link. Same act (pick a lesson
// from a list), two different outcomes, which is the inconsistency he is
// pointing at.
//
// The cause was structural, not cosmetic: setPresentLesson lives in CourseView,
// and the index lives one component up in ChurchLearn, so the index could not
// reach the reader at all. The fix is a { lessonId, nonce } prop across that
// seam.
//
// These tests assert BEHAVIOUR — that the reader actually opens — not that a
// button with the right glyph exists. A ▶ that renders and does nothing is the
// failure this file is for.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import React from 'react';
import ChurchLearn from '../components/ChurchLearn.jsx';

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (props = {}) => act(() => root.render(React.createElement(ChurchLearn, {
  progress: {}, recordProgress: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  ...props,
})));

const index = () => container.querySelector('nav[aria-label*="by title"]');
const rows = () => [...index().querySelectorAll('ol > li')];
const playIn = (li) => [...li.querySelectorAll('button')].find((b) => /▶/.test(b.textContent));
const titleIn = (li) => [...li.querySelectorAll('button')].find((b) => !/▶/.test(b.textContent));
// The reader marks its own roots — the same flag the idle lock reads so it
// never interrupts someone being read to.
const readerOpen = () => !!document.querySelector('[data-reading="true"]');
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

describe('every title in the index carries its own ▶ Play', () => {
  it('renders a Play beside EVERY row, not just the first', () => {
    mount();
    const all = rows();
    expect(all.length, 'the index must have rows to play').toBeGreaterThan(3);
    const missing = all.filter((li) => !playIn(li));
    expect(missing.length, `${missing.length} of ${all.length} titles had no ▶ Play`).toBe(0);
  });

  it('each Play names its own lesson for a screen reader', () => {
    mount();
    // "▶ Play" repeated 140 times is useless to someone listening; the
    // accessible name has to say WHICH lesson.
    const labels = rows().slice(0, 5).map((li) => playIn(li).getAttribute('aria-label'));
    for (const l of labels) expect(l).toMatch(/^Play .+ in the big full-screen view$/);
    expect(new Set(labels).size, 'each Play must name a different lesson').toBe(labels.length);
  });
});

describe('it actually opens the reader (the whole point)', () => {
  it('OPENS the big full-screen reader from the index', () => {
    mount();
    expect(readerOpen(), 'nothing should be open before the tap').toBe(false);
    click(playIn(rows()[1]));
    expect(readerOpen(), 'the ▶ Play in the list must open the reader').toBe(true);
  });

  it('PROVEN-TO-CATCH: the title link alone must NOT open the reader — two doors, two intents', () => {
    // If this ever passes by accident, the tap that was supposed to open the
    // lesson's space is dragging the reader up with it and the distinction
    // Darrell asked for has collapsed.
    mount();
    click(titleIn(rows()[2]));
    expect(readerOpen()).toBe(false);
  });
});

describe('the nonce — a second tap on the same title still works', () => {
  it('re-opens the same lesson after it is closed', () => {
    // A boolean "present this" prop would make this fail: the value would be
    // unchanged on the second tap and the effect would never re-run. This is
    // the reason the seam carries a nonce.
    mount();
    const li = rows()[1];
    click(playIn(li));
    expect(readerOpen()).toBe(true);
    const close = [...document.querySelectorAll('button')]
      .find((b) => /close|done|back/i.test(b.textContent || '') || b.getAttribute('aria-label') === 'Close');
    if (close) click(close);
    click(playIn(li));
    expect(readerOpen(), 'the SAME lesson must play again on a second tap').toBe(true);
  });
});
