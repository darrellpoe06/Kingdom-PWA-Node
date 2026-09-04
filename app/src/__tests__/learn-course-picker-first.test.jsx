// @vitest-environment jsdom
// =============================================================================
// The course picker comes FIRST on the Learn tab, and reads as a control
// =============================================================================
// Darrell, 2026-09-01, with two screenshots of the live church door
// (poetech.us/lovecorner/app/?view=church, Learn tab): "The courses drop-down
// should be at the top.... obvious for users."
//
// WHAT THE SCREENSHOTS SHOWED. Reading them in order: the title, the resume
// card, the finder, then "OR JUST BROWSE — ALL 401 LESSONS, EVERY COURSE" and a
// long list of lessons — and only after scrolling past all of that, "CHOOSE A
// COURSE". The browse shelf that DR-0318 added is capped at max-h-[55vh], so on
// a phone it consumes better than half the viewport on its own and pushes the
// picker a full screen below the fold. The control existed; nobody could see it.
//
// This is the same class the shelf itself was built for — an affordance that is
// present but not FOUND — so it gets the same treatment: put it where the eye
// lands, and give it enough weight to read as a control rather than as a caption.
// Nothing about the picker's behaviour changes; its groups and counts still
// derive from the mounted catalog (DR-0121).
//
// PROVEN-TO-CATCH: against the pre-fix render order both order assertions below
// fail — the picker's DOM position came after the browse shelf's.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const course = (key, title, n) => ({
  key,
  meta: { title, unit: 'Week', audience: 'everyone', tagline: '', format: '' },
  schedule: Array.from({ length: n }, (_, i) => ({
    id: `${key}-l${i + 1}`,
    week: i + 1,
    title: `${title} lesson ${i + 1}`,
    anchor: { ref: `John ${i + 1}:1`, theme: 'a theme' },
    bigIdea: 'the idea',
  })),
  sessionFlow: [],
});

describe('Learn — the course picker is the first control the reader meets', () => {
  let container, root;
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

  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    course: course('a', 'Learning A.I. The Way', 8),
    extraCourses: [course('b', 'Living Lessons from the Word', 12)],
  })));

  // DOCUMENT_POSITION_FOLLOWING === 4: b comes after a in document order.
  const comesBefore = (a, b) =>
    Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  it('THE REPORTED CASE: the picker renders before the browse shelf, not under it', () => {
    mount();
    const picker = container.querySelector('#learn-course-pick');
    const shelf = container.querySelector('[data-testid="lesson-browse-all"]');
    expect(picker, 'the course picker must be mounted').toBeTruthy();
    expect(shelf, 'the browse shelf must be mounted').toBeTruthy();
    expect(
      comesBefore(picker, shelf),
      'the course picker must come BEFORE the 55vh browse shelf — otherwise it is a full screen below the fold on a phone',
    ).toBe(true);
  });

  it('also comes before the lesson finder, so the first control is the simplest one', () => {
    mount();
    const picker = container.querySelector('#learn-course-pick');
    const finder = container.querySelector('#learn-lesson-find');
    expect(finder, 'the lesson finder must be mounted').toBeTruthy();
    expect(comesBefore(picker, finder)).toBe(true);
  });

  it('its label reads as a control, not as a caption', () => {
    mount();
    const label = container.querySelector('label[for="learn-course-pick"]');
    expect(label, 'the picker must keep its label').toBeTruthy();
    expect(label.textContent.trim()).toBe('Choose a course');
    // The 10px grey caption is what made it invisible; it must not come back.
    expect(
      label.className.includes('text-[0.625rem]'),
      'the label must not fall back to the 10px caption size',
    ).toBe(false);
    expect(label.className).toMatch(/font-semibold/);
  });

  it('the sort control travels with it — one row, still together', () => {
    mount();
    const picker = container.querySelector('#learn-course-pick');
    const sort = container.querySelector('#learn-course-sort');
    expect(sort, 'sort must still be mounted beside the picker').toBeTruthy();
    expect(picker.closest('div').parentElement).toBe(sort.closest('div').parentElement);
  });

  it('moving it changed position only — every course is still reachable in the picker', () => {
    mount();
    const opts = [...container.querySelectorAll('#learn-course-pick option')];
    expect(opts.length, 'the picker must still list the mounted courses').toBeGreaterThan(1);
    const titles = opts.map((o) => o.textContent);
    expect(titles.some((t) => t.includes('Learning A.I. The Way'))).toBe(true);
    expect(titles.some((t) => t.includes('Living Lessons from the Word'))).toBe(true);
    // counts stay derived, never typed (DR-0121)
    expect(titles.every((t) => /· \d+ lessons$/.test(t))).toBe(true);
  });
});
