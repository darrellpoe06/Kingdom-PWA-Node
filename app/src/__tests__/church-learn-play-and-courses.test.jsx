// @vitest-environment jsdom
// =============================================================================
// The play button, and knowing which course you are in
// =============================================================================
// Darrell, 2026-09-11, with the big reader open on screen in a screenshot:
//
//   "We want the lessons and overviews to have a play button next to each one
//    that will pop up this slide for it to be read and be big enough to cover
//    the screen like this with the controls as shown here... easier and clearer
//    to access from the list to choose from... the reader reading for you or you
//    read it in the big nice easy to read views."
//
//   "the staff couldn't tell that they have other courses even though they
//    labeled.... we need more clarification on this is a list of courses...
//    without resaying it over and over every time.... something should somehow
//    highlight the course... also let the default courses be... Living Lessons
//    not Ai etc"
//
// The screen he photographed is <Presenter> — it already existed. BOTH play
// controls sat inside ChurchLearn's Governor-only block, so from a staff or
// member account the entire affordance was invisible. That gate is what these
// tests pin open, along with the default course and the open-course line.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const course = (key, title, n) => ({
  key,
  meta: { key, title, audience: 'everyone', tagline: '', format: '', weeks: n },
  schedule: Array.from({ length: n }, (_, i) => ({
    id: `${key}-l${i + 1}`,
    week: i + 1,
    title: `${title} lesson ${i + 1}`,
    anchor: { ref: `John ${i + 1}:1`, theme: 'a theme' },
    bigIdea: 'the idea',
  })),
  sessionFlow: [],
  // Courses come from the catalog carrying a progressSummary; the fixture does
  // too, so these tests exercise the ordinary shape rather than the edge one.
  progressSummary: (p) => ({ done: Object.keys(p || {}).length, total: n, pct: 0 }),
});

const AI = course('ai-way', 'Learning A.I. The Way', 8);
const LIVING = course('living-lessons', 'Living Lessons from the Word', 12);

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

// isGovernor deliberately omitted/false — this is the member and staff view,
// the one the gate was hiding the reader from.
const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
  course: AI, extraCourses: [LIVING], ...props,
})));

const buttons = () => Array.from(container.querySelectorAll('button'));
// The per-lesson control is exactly "▶ Play"; the series control reads
// "▶ Play the overview …". Matched separately so a test about one can never be
// silently satisfied by the other.
const playButtons = () => buttons().filter((b) => /^▶\s*Play$/.test(b.textContent.trim()));
const overviewButton = () => buttons().find((b) => /Play the overview/i.test(b.textContent));

describe('▶ Play is there for a member — not only the Governor', () => {
  it('THE REPORTED CASE: a non-Governor sees play buttons on the lessons', () => {
    mount();
    expect(playButtons().length, 'the list must carry a play control per lesson').toBeGreaterThan(0);
  });

  it('plays the OVERVIEW too, not only single lessons', () => {
    mount();
    expect(overviewButton(), 'the series overview needs its own play control').toBeTruthy();
  });

  it('says what play actually does — big type, or read to you', () => {
    mount();
    expect(container.textContent).toMatch(/big full-screen view/i);
    expect(container.textContent).toMatch(/read it to you|Read aloud/i);
  });

  it('a play control carries a plain-language title for the hesitant reader', () => {
    mount();
    const play = playButtons()[0];
    expect(play.getAttribute('title')).toMatch(/read it yourself or have it read aloud/i);
  });

  it('PLAY OPENS THE BIG VIEW — the presenter takes the whole surface', () => {
    mount();
    const before = container.textContent;
    act(() => { playButtons()[0].click(); });
    // The Presenter replaces the course body wholesale; the course list is gone
    // and the reader's own controls are on screen.
    expect(container.textContent).not.toBe(before);
    // The presenter console: its own read-aloud, the full-screen hand-off, and
    // the way out. (The bare "Read aloud / Full screen / Speaker view ✕" strip
    // in Darrell's screenshot is this same component once it is ON SCREEN.)
    expect(container.textContent).toMatch(/Read it aloud/i);
    expect(container.textContent).toMatch(/Present on this screen/i);
    expect(container.textContent).toMatch(/Exit/i);
  });

  it('is ALSO there for the Governor — ungating took nothing away', () => {
    mount({ isGovernor: true });
    expect(playButtons().length).toBeGreaterThan(0);
    expect(overviewButton()).toBeTruthy();
  });
});

describe('which course am I in, and are there others', () => {
  it('DEFAULTS TO LIVING LESSONS, not the A.I. course', () => {
    mount();
    expect(container.textContent).toContain('Living Lessons from the Word');
  });

  it('names the open course ONCE, statically, above its lessons', () => {
    // Darrell 2026-09-11: "have the choose a course blank or say choose another
    // course and leave the current static name above the listed lessons inside
    // the course area." So the heading carries it — not a repeated banner, and
    // not the picker (a select showing the open course reads as a title for the
    // lessons under it, which is what hid the other courses in the first place).
    mount();
    const heading = container.querySelector('#learn-h');
    expect(heading).toBeTruthy();
    expect(heading.textContent).toBe('Living Lessons from the Word');
    // Said in ONE place: the course name is not repeated as a second banner.
    expect(container.textContent).not.toMatch(/Open now/);
  });

  it('the picker always offers the way OUT, never the open course', () => {
    mount();
    const picker = container.querySelector('#learn-course-pick');
    expect(picker.value).toBe('');
    const shown = [...picker.options].find((o) => o.value === '');
    expect(shown.textContent).toMatch(/^Choose another course/);
  });

  it('marks the open course inside the picker itself', () => {
    mount();
    const selected = Array.from(container.querySelectorAll('#learn-course-pick option'))
      .filter((o) => /●/.test(o.textContent));
    expect(selected.length, 'exactly one option carries the open-now mark').toBe(1);
    expect(selected[0].textContent).toMatch(/Living Lessons/);
  });

  it('still lists every course — highlighting one hides none', () => {
    mount();
    const opts = Array.from(container.querySelectorAll('#learn-course-pick option'))
      .map((o) => o.textContent);
    expect(opts.some((t) => /Living Lessons/.test(t))).toBe(true);
    expect(opts.some((t) => /Learning A\.I\./.test(t))).toBe(true);
  });

  it('falls back to a REAL course when Living Lessons is not mounted', () => {
    // Never assume a course exists (DR-0061): an instance without Living Lessons
    // must still open on something, never a blank.
    act(() => root.render(createElement(ChurchLearn, { course: AI, extraCourses: [] })));
    expect(container.textContent).toContain('Learning A.I. The Way');
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES the Governor gate coming back — the member view is the assertion', () => {
    // This is the whole regression: if ▶ Play is ever re-wrapped in isGovernor,
    // this mount (no isGovernor prop) finds zero play buttons and fails.
    mount({ isGovernor: false });
    expect(playButtons().length).toBeGreaterThan(0);
  });

  it('CATCHES a default that quietly reverts to the A.I. course', () => {
    mount();
    const heading = container.querySelector('#learn-h').textContent;
    expect(heading).toMatch(/Living Lessons/);
    expect(heading).not.toMatch(/Learning A\.I\./);
  });
});
