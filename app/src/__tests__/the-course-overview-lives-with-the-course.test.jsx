// @vitest-environment jsdom
// =============================================================================
// The whole-course overview lives with the course, not above an open lesson
// (DR-0688)
// =============================================================================
// Darrell 2026-09-30, from his phone, with L200 open in Living Lessons and the
// big green "PLAY THE OVERVIEW (ALL 199 AT A GLANCE)" button sitting above the
// lesson's own bar:
//
//   "Also the over view should not be at the top of each lesson it is
//    confusing.... only play button should be to play that specific lesson...
//    the whole course overview can live somewhere just not in a confusing
//    place... make. Sense?"
//
// Pinned here, for EVERY course in the catalog (not only Living Lessons):
//   - the course's own page (the lesson list) carries the whole-course
//     overview exactly once, named as the whole course, count from the data;
//   - an open lesson carries NO course-overview control and NO overview
//     caption; its play control is its own ▶ Play.
//
// PROVEN-TO-CATCH: with ChurchLearn.jsx as it was on main (the overview
// rendered unconditionally above the lesson bar), "an open lesson shows no
// course overview" fails on the first course. See DR-0688 for the run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const extraCourses = buildCatalogCourseDescriptors();

const mount = (props = {}) => act(() => root.render(createElement(ChurchLearn, {
  extraCourses,
  progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
  learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  ...props,
})));

const pick = (key) => {
  const sel = container.querySelector('#learn-course-pick');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, key);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

const buttons = () => [...container.querySelectorAll('button')];
// Any course-wide play control, under its old wording or its new one.
const overviewButtons = () => buttons().filter((b) => /Play the (whole course )?overview/i.test(b.textContent));
const lessonPlays = () => buttons().filter((b) => /^▶\s*Play$/.test(b.textContent.trim()));
// Every play control on screen belongs to the one open lesson's card. (Its
// actions row renders at the head of the card and again after the content, by
// design, so a finished reader need not scroll back; both are its own Play.)
const onlyTheLessonsOwnPlay = () => {
  const cards = container.querySelectorAll('li[id^="learn-lesson-"]');
  const plays = lessonPlays();
  return cards.length === 1 && plays.length >= 1 && plays.every((b) => cards[0].contains(b));
};
const courseKeys = () => [...container.querySelector('#learn-course-pick').querySelectorAll('option')]
  .map((o) => o.value).filter((v) => v && extraCourses.some((c) => c.meta.key === v));

describe('the whole-course overview lives with the course (DR-0688)', () => {
  it('THE REPORTED CASE: Living Lessons L200 open shows its own Play and no course overview', () => {
    mount({ isGovernor: true });
    pick('living-lessons');
    const card = container.querySelector('li[id^="learn-lesson-ll200-"]');
    expect(card, 'L200 must be in the list').toBeTruthy();
    const play = [...card.querySelectorAll('button')].find((b) => /^▶\s*Play$/.test(b.textContent.trim()));
    act(() => { play.click(); });
    expect(container.querySelector('[data-testid="lesson-space-bar"]'), 'L200 opened in its own space').toBeTruthy();
    expect(overviewButtons().length, 'no course overview above an open lesson').toBe(0);
    expect(container.textContent).not.toMatch(/at a glance/i);
    expect(onlyTheLessonsOwnPlay(), 'the only play control is the lesson\'s own').toBe(true);
    // The Governor's facilitator toggle stays: it reveals THIS lesson's guide.
    expect(buttons().some((b) => /facilitator guide/i.test(b.textContent))).toBe(true);
    // The course-wide cohort date does not ride above the lesson.
    expect(container.querySelector('input[type="date"][id^="cohort-start-"]')).toBeNull();
  });

  it('every course: the lesson list shows the overview ONCE, named as the whole course, counted from the data; an open lesson shows none', () => {
    mount();
    const keys = courseKeys();
    expect(keys.length).toBeGreaterThan(1);
    for (const key of keys) {
      pick(key);
      const c = extraCourses.find((x) => x.meta.key === key);
      const n = c.schedule.length;
      const ov = overviewButtons();
      expect(ov.length, `${key}: the course page carries the overview once`).toBe(1);
      expect(ov[0].textContent).toMatch(new RegExp(`whole course overview \\(${n} `));
      const firstPlay = lessonPlays()[0];
      expect(firstPlay, `${key}: a lesson carries its own Play`).toBeTruthy();
      act(() => { firstPlay.click(); });
      expect(container.querySelector('[data-testid="lesson-space-bar"]'), `${key}: the lesson opened`).toBeTruthy();
      expect(overviewButtons().length, `${key}: no course overview above an open lesson`).toBe(0);
      expect(onlyTheLessonsOwnPlay(), `${key}: the only play is the open lesson's own`).toBe(true);
      // back to the course for the next one
      act(() => { container.querySelector('[data-testid="lesson-bar-all"]').click(); });
      expect(overviewButtons().length, `${key}: back on the course page, the overview is there again`).toBe(1);
    }
  }, 180000);
});
