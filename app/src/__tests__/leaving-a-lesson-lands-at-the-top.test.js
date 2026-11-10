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

  it('scrolls to the top of the lesson list, at its TOP (DR-1393: the sticky bar never moves when scrolled to)', () => {
    const h = allButtonHandler();
    expect(h).toContain("getElementById('learn-all-lessons-top')");
    expect(h).toContain("block: 'start'");
  });

  it('forgets the row just left, so the leave effect cannot scroll back down to it (DR-1393)', () => {
    expect(allButtonHandler()).toContain('lastFocusRef.current = null');
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

  it('and the top anchor sits just before it, outside the sticky bar', () => {
    const anchor = SRC.indexOf('id="learn-all-lessons-top"');
    expect(anchor).toBeGreaterThan(-1);
    const bar = SRC.indexOf('data-testid="lessons-bar"', anchor);
    expect(bar - anchor, 'the anchor is right above the bar').toBeLessThan(400);
  });
});

// =============================================================================
// AND ITS ONE-SECOND TIMER DOES NOT OUTLIVE THE PAGE (2026-11-10, measured)
// =============================================================================
// The handler listens for popstate so a reader who lands with the back button
// still gets scrolled, then stops listening after a second. That timer kept no
// handle and cleared nothing on the popstate path, so a run that finished
// inside its second fired the callback with the environment already gone:
//
//   ReferenceError: window is not defined
//    at Timeout._onTimeout src/components/ChurchLearn.jsx:2757
//
// It failed `app - vitest shard 3/4` on ll300's PR from
// `the-course-overview-lives-with-the-course.test.jsx` -- a file that never
// touches this component -- while ci.yml was green on main. Red only under
// sharding, green alone, blamed on an unrelated file: the shape of a leaked
// timer, not of a broken test.
describe('the popstate timer it arms', () => {
  it('keeps the handle, so something can cancel it', () => {
    const h = allButtonHandler();
    expect(h).toMatch(/stopListening\s*=\s*window\.setTimeout/);
  });

  it('PROVEN-TO-CATCH: it is never armed as a bare, unheld setTimeout again', () => {
    const h = allButtonHandler().replace(/\s+/g, ' ');
    // The exact defect: the call as a statement, its handle thrown away.
    expect(h).not.toContain("window.setTimeout(() => window.removeEventListener('popstate', again), 1000)");
  });

  it('clears the timer the moment the listener is removed for real', () => {
    const h = allButtonHandler();
    expect(h).toMatch(/if \(stopListening\) window\.clearTimeout\(stopListening\)/);
  });

  it('cannot throw when it fires after its page is gone', () => {
    const h = allButtonHandler();
    // The late callback's removeEventListener is inside a try: with the
    // environment torn down the reference itself throws, and there is nothing
    // left to stop listening to, so catching is the correct answer.
    expect(h).toMatch(/try \{ window\.removeEventListener\('popstate', again\); \} catch/);
  });

  it('and still does the thing the listener exists for', () => {
    // Guarding the teardown path must not cost the behaviour: a real popstate
    // still re-lands the reader at the top.
    const h = allButtonHandler();
    expect(h).toContain("window.addEventListener('popstate', again)");
    expect(h).toMatch(/const again = \(\) => \{[\s\S]*land\(\);/);
  });
});
