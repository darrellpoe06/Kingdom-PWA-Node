// =============================================================================
// The course picker is the FIRST control on the Learn tab — asserted by ORDER
// =============================================================================
// Darrell, 2026-09-06, having said it repeatedly: "the course drop down is still
// not above the lessons scroll... we need the scroll and the lookup to be below
// the course picking drop downs... its hard to find!!! I've said this already
// too many times!!! Give me the reason it's not moved". Then, with a screenshot
// of the live Learn tab: "even above where you left off" and "Share course is at
// the top not the course drop down to pick".
//
// WHY IT KEPT NOT MOVING — the thing this gate exists to prevent. Two earlier
// passes at "hard to find" each answered with a NEW control rather than moving
// the one he named: the sticky "All lessons" landmark bar
// (data-testid="lessons-bar") and the lesson finder. Both are good, and neither
// is the course picker. Meanwhile the picker itself stayed BELOW the course
// title, the Share button, the derived catalog line and the resume banner — so
// on a phone it was a finger-flick below the fold and effectively invisible.
//
// PRESENCE WAS NEVER THE PROBLEM, so presence is not what this file tests.
// Existing suites already prove the picker renders and switches courses
// (learn-catalog-render, learn-lesson-space). This one asserts its POSITION in
// the DOM, because position is the entire complaint and the only thing that can
// silently regress while every other test stays green.
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
  progress: {},
  recordProgress: () => {},
  quizState: {},
  recordQuiz: () => {},
  learnLevel: 'auto',
  setLearnLevel: () => {},
  ageBand: 'adult',
  setAgeBand: () => {},
  ...props,
})));

// Document order of two nodes: true when a comes before b.
const isBefore = (a, b) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const picker = () => container.querySelector('#learn-course-pick');

describe('the course picker comes FIRST on the Learn tab', () => {
  it('the picker is on screen at all', () => {
    mount();
    expect(picker(), 'the course dropdown must render').toBeTruthy();
  });

  it('comes before the course TITLE — you pick the course, then it names itself', () => {
    mount();
    const h2 = container.querySelector('#learn-h');
    expect(h2, 'the Learn heading must exist').toBeTruthy();
    expect(isBefore(picker(), h2), 'the picker must precede the course title').toBe(true);
  });

  it('comes before SHARE THIS COURSE (Darrell: "Share course is at the top not the course drop down")', () => {
    mount();
    const share = [...container.querySelectorAll('button')]
      .find((b) => /share this course/i.test(b.textContent || ''));
    expect(share, 'the share-course control must exist').toBeTruthy();
    expect(isBefore(picker(), share), 'the picker must precede Share this course').toBe(true);
  });

  it('comes before the derived catalog line', () => {
    mount();
    const line = [...container.querySelectorAll('p')]
      .find((p) => /every finished lesson in the PoeTech App/i.test(p.textContent || ''));
    expect(line, 'the catalog line must exist').toBeTruthy();
    expect(isBefore(picker(), line), 'the picker must precede the catalog line').toBe(true);
  });

  it('comes before RESUME — Darrell: "even above where you left off"', () => {
    // The resume banner only renders when a saved place resolves against the
    // mounted catalog, so this asserts order only when it is actually present.
    mount();
    const resume = [...container.querySelectorAll('div')]
      .find((d) => /pick up where you left off/i.test(d.textContent || '') && d.children.length < 8);
    if (!resume) return; // no saved place in this environment — nothing to order against
    expect(isBefore(picker(), resume), 'the picker must precede the resume banner').toBe(true);
  });

  it('comes before the sticky lessons bar and the lesson finder — the scroll and the lookup sit BELOW it', () => {
    mount();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(bar, 'the landmark bar must exist').toBeTruthy();
    expect(isBefore(picker(), bar), 'the picker must precede the lessons bar').toBe(true);

    const find = container.querySelector('#learn-lesson-find');
    if (find) expect(isBefore(picker(), find), 'the picker must precede the finder').toBe(true);
  });

  it('the SORT control travels with it, so the pair is not split across the fold', () => {
    mount();
    const sort = container.querySelector('#learn-course-sort');
    expect(sort, 'the sort control must exist').toBeTruthy();
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(isBefore(sort, bar), 'sort must also sit above the lessons bar').toBe(true);
  });

  it('the picker is a real 44px touch target', () => {
    mount();
    const minH = Number((picker().className.match(/min-h-\[(\d+)px\]/) || [])[1]);
    expect(minH, 'the picker must declare a touch-target height').toBeGreaterThanOrEqual(44);
  });
});

describe('the obvious progression: pick one of N courses, or search by name, then scroll', () => {
  // Darrell, 2026-09-06: "Pick one of 23 courses... or below search by name...
  // then scroll to see if one sticks out to the user by title.... obvious
  // progression". Three steps, in that order, before anything else on the page.
  it('STEP 1 — the picker names the live course count rather than a vague label', () => {
    mount();
    const label = container.querySelector('label[for="learn-course-pick"]');
    expect(label, 'the picker must be labelled').toBeTruthy();
    const n = Number((label.textContent.match(/select one of (\d+)/i) || [])[1]);
    expect(Number.isFinite(n), `label must state a count, got: ${label.textContent}`).toBe(true);
    // The number is DERIVED from the mounted catalog, never typed (DR-0121):
    // it must equal the options actually in the dropdown.
    // the prompt option ("Select a course · N to choose from") is not a course
    expect(picker().querySelectorAll('option:not([value=""])').length).toBe(n);
  });

  it('STEP 2 — the search box sits directly BELOW the picker, before anything else', () => {
    mount();
    const find = container.querySelector('#learn-lesson-find');
    expect(find, 'the lesson finder must render').toBeTruthy();
    expect(isBefore(picker(), find), 'picker first').toBe(true);
    // and nothing from the old ordering may come between them
    const h2 = container.querySelector('#learn-h');
    const share = [...container.querySelectorAll('button')]
      .find((b) => /share this course/i.test(b.textContent || ''));
    expect(isBefore(find, h2), 'the finder must precede the course title').toBe(true);
    if (share) expect(isBefore(find, share), 'the finder must precede Share').toBe(true);
  });

  it('STEP 3 — the scroll (the lessons bar and the schedule) comes after both', () => {
    mount();
    const find = container.querySelector('#learn-lesson-find');
    const bar = container.querySelector('[data-testid="lessons-bar"]');
    expect(isBefore(find, bar), 'search must precede the lessons bar').toBe(true);
  });
});
