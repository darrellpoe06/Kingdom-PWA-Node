// =============================================================================
// LEAVING A LESSON LANDS AT THE TOP OF ALL LESSONS
// =============================================================================
// Darrell, 2026-10-10: "Or the all lessons link... just take it to the top of
// the All Lessons!!!!!!!!!!!!!!!!! Fix it!!!!!!!!!!!!"
//
// WHAT WAS TRUE. The bar's primary control — the one DR-0438 deliberately made
// the biggest thing in the bar, because it is the only way out of a lesson —
// did exactly one thing:
//
//     onClick={() => setFocusId(null)}
//
// Clearing the focus swaps WHAT RENDERS. It does not move the page. So the
// reader kept whatever scroll offset the LESSON had them at, and the list
// rendered underneath it — leaving them in the middle of a list they never
// chose to be in the middle of. The longer the lesson, the further down they
// landed, which is exactly why this reads as "the button doesn't work" rather
// than as a scroll position: the button did work, every time.
//
// This pins the SCROLL, not the clear: the clear was never the broken half.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'ChurchLearn.jsx'),
  'utf8',
);

// The control, from its testid to the end of its onClick handler.
function allButtonHandler() {
  const at = SRC.indexOf('data-testid="lesson-bar-all"');
  expect(at, 'the way out of a lesson is gone').toBeGreaterThan(-1);
  // The handler sits just above the testid on this element.
  const from = SRC.lastIndexOf('<button', at);
  return SRC.slice(from, at);
}

describe('the way out of a lesson', () => {
  it('PROVEN-TO-CATCH: it no longer ONLY clears the focus', () => {
    const h = allButtonHandler();
    // The whole defect, in one line. Its presence as the entire handler is
    // the bug; restoring it turns this red.
    expect(h.replace(/\s+/g, ' ')).not.toContain('onClick={() => setFocusId(null)} data-');
  });

  it('still clears the focus — the list has to render before it can be scrolled to', () => {
    expect(allButtonHandler()).toContain('setFocusId(null)');
  });

  it('scrolls to the lessons landmark, at its TOP', () => {
    const h = allButtonHandler();
    expect(h).toContain('[data-testid="lessons-bar"]');
    expect(h).toContain("block: 'start'");
  });

  it('waits for the swap to paint before measuring where to go', () => {
    // Scrolling in the same tick targets the layout the LESSON left behind.
    expect(allButtonHandler()).toContain('requestAnimationFrame');
  });

  it('honours reduced motion, like the bar\'s own All control', () => {
    expect(allButtonHandler()).toContain('motionBehavior()');
  });

  it('falls back to the top of the page when the landmark is absent', () => {
    // The bar only renders when a course has siblings (courses.length > 1),
    // so on a single-course department there is no landmark to find.
    const h = allButtonHandler();
    expect(h).toContain('learn-lesson-find');
    expect(h).toContain('window.scrollTo');
  });

  it('never throws on an engine without smooth scrolling, or without a document', () => {
    const h = allButtonHandler();
    expect(h).toContain("typeof document === 'undefined'");
    expect(h).toMatch(/catch \(_\)/);
  });
});

describe('the landmark it aims at', () => {
  it('exists, and is the bar the lesson list hangs under', () => {
    expect(SRC).toContain('data-testid="lessons-bar"');
  });
});
