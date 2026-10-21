// =============================================================================
// After the course, the LESSONS — the title index is the first thing in the body
// =============================================================================
// Darrell, 2026-09-06, with a screenshot of the live Learn tab: "Of course the
// lessons selection needs to be next to the course we just chose!?!!!!!!!!!" and
// "After we choose the course we have a lot of what?!!!!!!!" — lessons.
//
// What the screenshot showed: the "PICK A LESSON BY TITLE · 127" index sat
// BELOW the timeline header ("The 127 lessons · Self-paced") and below the
// Governor's facilitator panel ("Show facilitator guide", "Series overview",
// the "To teach a single session…" paragraph). On a phone, a person who had just
// chosen a course scrolled past two blocks of chrome before a single lesson
// title appeared. Everything on the screen was real; the ORDER was wrong.
//
// Same law as the course picker (learn-course-picker-is-first.test.jsx), one
// level down: pick the course, and the very next thing on screen is what is IN
// it. This file asserts DOM ORDER, not presence — the index has rendered
// correctly since 2026-07-15; its position is the only thing that regressed
// silently while every existing test stayed green.
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

const render = (props = {}) => act(() => root.render(React.createElement(ChurchLearn, {
  progress: {}, recordProgress: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  ...props,
})));
// LEARN'S ALL-COURSES VIEW OPENS ON THE ONE LIST NOW (DR-1183). Darrell
// 2026-10-21: "It's like a title page saying your inside living lessons...
// only have that sortable list when it is chosen". Nothing is open on that
// view until a course is chosen, and every case in this file is about what is
// INSIDE an open course -- so `mount` makes the same tap a reader makes. A
// DEPARTMENT tab still opens on its own first course (DR-0432/0433), so
// clicking one after this behaves exactly as it did.
const openFirstCourse = (match = null) => {
  const rows = [...container.querySelectorAll('[data-testid="course-choice-list"] button[data-course]')];
  if (!rows.length) return; // a department tab, or a course already remembered
  const row = match ? rows.find((b) => (b.textContent || '').includes(match)) : rows[0];
  if (!row) throw new Error(`course not offered: ${match}`);
  act(() => row.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};
// This file mounts without `extraCourses`, so the catalog is the host's own
// courses; the first row of the one list is the course these cases are about.
const mount = (props = {}) => { render(props); openFirstCourse(); };

const isBefore = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const picker = () => container.querySelector('#learn-course-pick');
const index = () => container.querySelector('nav[aria-label*="by title"]');
const timelineHeading = () => [...container.querySelectorAll('h3')]
  .find((h) => /^The \d+ (Lessons|Weeks|Sessions|Issues|Voices|Patterns)|^The (Lesson|Week)$/i.test(h.textContent.trim()));

describe('after the course comes the lesson index — nothing in between', () => {
  it('the title index renders for a course with enough lessons', () => {
    mount();
    expect(index(), 'the pick-a-lesson-by-title index must render').toBeTruthy();
  });

  it('the index comes AFTER the course picker (you pick the course first)', () => {
    mount();
    expect(isBefore(picker(), index())).toBe(true);
  });

  it('the index comes BEFORE the search box and BEFORE the all-courses shelf (Darrell: "still can\'t pick a lesson nor see what this course offers")', () => {
    // The live screenshot: after picking a course, the next list on screen was
    // the finder's blank-state shelf — OTHER courses' lessons — with the chosen
    // course's own titles far below. This course's lessons must come first.
    // Since DR-1190 the finder and the shelf are the Find AREA's: in the
    // Lessons area nothing at all sits between the course and its lessons, and
    // the Find tab, one tap away, carries the finder with the shelf under it.
    mount();
    expect(container.querySelector('#learn-lesson-find'), 'no finder between the course and its lessons').toBe(null);
    expect(container.querySelector('[data-testid="lesson-browse-all"]'), 'no shelf between the course and its lessons').toBe(null);
    const tab = container.querySelector('#learn-area-tab-find');
    expect(tab, 'the Find area is offered').toBeTruthy();
    act(() => { tab.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const find = container.querySelector('#learn-lesson-find');
    expect(find, 'the finder must render in its area').toBeTruthy();
    expect(isBefore(picker(), find), 'the picker precedes the finder').toBe(true);
    expect(index(), 'the index is the Lessons area\'s, not the Find area\'s').toBe(null);
  });

  it('there is ONE list, not two — the CourseView copy is gone', () => {
    mount();
    expect(container.querySelectorAll('nav[aria-label*="by title"]').length).toBe(1);
    expect(index().getAttribute('data-testid')).toBe('course-lessons-first');
  });

  it('the index comes BEFORE the timeline heading ("The N lessons · Self-paced")', () => {
    mount();
    const h = timelineHeading();
    expect(h, 'the timeline heading must exist').toBeTruthy();
    expect(isBefore(index(), h), 'lessons must precede the timeline header').toBe(true);
  });

  it('the index comes BEFORE the facilitator / series-overview panel when it renders', () => {
    mount({ isGovernor: true });
    const idx = index();
    const facilitator = [...container.querySelectorAll('button')]
      .find((b) => /facilitator guide|series overview/i.test(b.textContent || ''));
    if (!facilitator) return; // not rendered for this course/role — nothing to order against
    expect(isBefore(idx, facilitator), 'lessons must precede the facilitator panel').toBe(true);
  });

  it('the index comes BEFORE the first full lesson card (it is a jump list, not the content)', () => {
    mount();
    const firstCard = container.querySelector('li[id^="learn-lesson-"]');
    expect(firstCard, 'lesson cards must render').toBeTruthy();
    expect(isBefore(index(), firstCard)).toBe(true);
  });

  it('the index names the same count as the cards it jumps to (derived, never typed)', () => {
    mount();
    const stated = Number((index().textContent.match(/by title\s*·\s*(\d+)/i) || [])[1]);
    expect(Number.isFinite(stated)).toBe(true);
    expect(container.querySelectorAll('li[id^="learn-lesson-"]').length).toBe(stated);
  });
});
