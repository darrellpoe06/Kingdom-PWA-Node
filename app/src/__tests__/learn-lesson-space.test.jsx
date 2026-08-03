// =============================================================================
// The lesson's OWN space — the place-keeping contract (DR-0076, rendered).
// Darrell 2026-08-02: "each one needs a space that dont allow for loosing your
// place... the system sets up the reader to lose their places." Before this,
// all 70 lessons rendered stacked in one scroll and the title index only
// scrollIntoView-jumped inside the ocean. These pins hold the fix end-to-end:
//   • tapping a title opens THAT lesson ALONE (one card, the index gone);
//   • the space carries its sticky bar (back + prev/next + "N of M");
//   • Next/Prev move within the space, one lesson at a time;
//   • "← All lessons" returns to the full index;
//   • opening the space RECORDS the resume place (a reload is one Resume tap
//     from the same spot);
//   • Resume from the banner lands IN the space with the lesson's guide open.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { getPlace } from '../lib/learn-resume.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PLACE_KEY = 'poe-learn-place';

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.clear(); });

const extraCourses = buildCatalogCourseDescriptors();

const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchLearn, {
    extraCourses,
    progress: {},
    toggleModule: () => {},
    quizState: {},
    recordQuiz: () => {},
    learnLevel: 'auto',
    setLearnLevel: () => {},
    ageBand: 'adult',
    setAgeBand: () => {},
    ...props,
  })));

const click = (btn) => act(() => { btn.click(); });
const buttonByText = (text) =>
  [...container.querySelectorAll('button')].find((b) => (b.textContent || '').includes(text));
const lessonCards = () => container.querySelectorAll('li[id^="learn-lesson-"]');

function openLivingLessons() {
  const sel = container.querySelector('#learn-course-pick');
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    setter.call(sel, 'living-lessons');
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('the lesson\'s own space — no more losing your place', () => {
  it('tapping a title opens THAT lesson alone, with the space bar, and records the place', () => {
    mount();
    openLivingLessons();
    expect(lessonCards().length).toBeGreaterThan(4); // the full stacked list first

    click(buttonByText('Bodybuilding Christ'));

    const cards = lessonCards();
    expect(cards.length).toBe(1); // ONE lesson — its own space
    expect(cards[0].id).toBe('learn-lesson-ll3-bodybuilding-christ');
    expect(container.querySelector('[data-testid="lesson-space-bar"]')).toBeTruthy();
    expect(container.textContent).not.toContain('Pick a lesson by title'); // the index is out of the way
    const p = getPlace();
    expect(p && p.lessonId).toBe('ll3-bodybuilding-christ'); // reload = one Resume tap away
  });

  it('the space is SECURE — course picker, catalog line, progress strip, and section chips all leave the screen (DR-0264)', () => {
    mount();
    openLivingLessons();
    expect(container.querySelector('#learn-course-pick')).toBeTruthy();
    expect(container.textContent).toContain('Your progress');

    click(buttonByText('Bodybuilding Christ'));

    // Only the lesson remains: no course switcher, no sort, no catalog count,
    // no progress strip, no section chips — the whole screen is the lesson.
    expect(container.querySelector('#learn-course-pick')).toBeNull();
    expect(container.querySelector('#learn-course-sort')).toBeNull();
    expect(container.textContent).not.toContain('every finished lesson in the PoeTech App');
    expect(container.textContent).not.toContain('Your progress');
    expect(container.textContent).not.toContain('Story Library');

    // Leaving the space brings the full course back.
    click(buttonByText('← All lessons'));
    expect(container.querySelector('#learn-course-pick')).toBeTruthy();
    expect(container.textContent).toContain('Your progress');
  });

  it('Next → moves to the next lesson INSIDE the space; ← All lessons returns to the index', () => {
    mount();
    openLivingLessons();
    click(buttonByText('Bodybuilding Christ'));

    click(buttonByText('Next →'));
    let cards = lessonCards();
    expect(cards.length).toBe(1);
    expect(cards[0].id).toBe('learn-lesson-ll4-dying-to-live');
    expect(getPlace().lessonId).toBe('ll4-dying-to-live');

    click(buttonByText('← All lessons'));
    cards = lessonCards();
    expect(cards.length).toBeGreaterThan(4); // the full index is back
    expect(container.textContent).toContain('Pick a lesson by title');
  });

  it('one lesson, ONE copy — opening the guide removes the card\'s duplicate preview (Darrell 2026-08-03)', () => {
    // Reported from the phone: "each page is a duplicate on the same page" —
    // the card's big idea / benefits / hands-on / anchor stayed rendered ABOVE
    // the open guide, whose Open/Apply/Send-off stages render the SAME four
    // fields. The pin: with the guide open, each field appears exactly once.
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === 'll3-bodybuilding-christ');
    // Scope to the lesson card — the on-screen surface. (The print-only
    // curriculum block is CSS-hidden but present in jsdom text, so a
    // whole-container count would see it.)
    const count = (needle) => lessonCards()[0].textContent.split(needle).length - 1;

    mount();
    openLivingLessons();
    click(buttonByText('Bodybuilding Christ'));

    // Guide closed: the card preview is the one copy.
    expect(count(m.bigIdea)).toBe(1);

    click(buttonByText('Start this lesson'));

    // Guide open: the guide's stages are the one copy — the card preview left.
    expect(count(m.bigIdea)).toBe(1);
    expect(count(`Anchor — ${m.anchor.ref}`)).toBe(1);
    expect(count('What this frees in you')).toBeLessThanOrEqual(1);
    expect(count(m.inApp)).toBeLessThanOrEqual(1);

    // Closing the guide brings the scannable preview back.
    click(buttonByText('Close the guide'));
    expect(count(m.bigIdea)).toBe(1);
  });

  it('Resume from the banner lands IN the lesson\'s own space with its guide open', () => {
    window.localStorage.setItem(PLACE_KEY, JSON.stringify({ courseKey: 'living-lessons', lessonId: 'll3-bodybuilding-christ', stage: 1, step: 2, at: 1 }));
    mount();
    click(buttonByText('Resume →'));

    const cards = lessonCards();
    expect(cards.length).toBe(1); // contained — not a scroll into the ocean
    expect(cards[0].id).toBe('learn-lesson-ll3-bodybuilding-christ');
    expect(container.querySelector('#tutor-panel-ll3-bodybuilding-christ')).toBeTruthy();
  });
});
