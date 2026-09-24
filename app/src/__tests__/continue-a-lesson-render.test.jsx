// =============================================================================
// Continue a lesson — the RENDERED contract in the real Learn tree (DR-0623)
// =============================================================================
// Darrell 2026-09-24: "Continuing a lesson doesn't work well... it needs to be
// way better..."  Measured before (the before-*.png journeys): one Continue
// per device, at y≈2,084 on an 844-px phone, gone after one use, and a second
// lesson erased the first. These pins hold what replaced it:
//   • every lesson begun is offered, newest first, directly under the picker;
//   • Continue on an OLDER lesson opens THAT lesson at ITS saved part;
//   • the open course's Continue sits in the sticky lessons bar;
//   • each lesson row says Continue (begun) or Finished (done);
//   • the lesson's own button says Continue when it is in progress;
//   • Start fresh asks first, and forgets only the lesson it names;
//   • leaving by the end door records the lesson as finished.
// PROVEN-TO-CATCH: against the pre-DR-0623 ChurchLearn, the first, second and
// third tests fail (no "Also in progress", no offer under the picker, and the
// older lesson could not be reached) — see the DR for the recorded run.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { recordPlace, getPlaceFor, finishPlace } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root, realConfirm;
beforeEach(() => {
  window.localStorage.clear();
  realConfirm = window.confirm;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.localStorage.clear();
  window.confirm = realConfirm;
});

const extraCourses = buildCatalogCourseDescriptors();
const mount = () => act(() => root.render(createElement(ChurchLearn, {
  extraCourses,
  progress: {},
  toggleModule: () => {},
  quizState: {},
  recordQuiz: () => {},
  learnLevel: 'auto',
  setLearnLevel: () => {},
  ageBand: 'adult',
  setAgeBand: () => {},
})));
const click = (el) => act(() => { el.click(); });
const byTestId = (id) => container.querySelector(`[data-testid="${id}"]`);
const isBefore = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const OLDER = { courseKey: 'living-lessons', lessonId: 'll3-bodybuilding-christ' };
const NEWER = { courseKey: 'ai', lessonId: 'wk1-what-is-ai' };

function seedTwo() {
  const now = Date.now();
  recordPlace({ ...OLDER, stage: 1, step: 2 }, { now: now - 3 * 3600 * 1000 });
  recordPlace({ ...NEWER, stage: 2 }, { now: now - 60 * 1000 });
}

describe('every lesson begun is one tap away', () => {
  it('offers BOTH lessons, the newest first, the older under "Also in progress"', () => {
    seedTwo();
    mount();
    const offer = byTestId('continue-offer');
    expect(offer, 'the Continue offer must render').toBeTruthy();
    expect(byTestId('continue-latest').textContent).toContain('What is A.I., really?');
    const others = byTestId('continue-others');
    expect(others, 'the older lesson must still be offered').toBeTruthy();
    expect(others.textContent).toContain('Also in progress · 1');
    expect(others.textContent).toContain('Bodybuilding Christ');
    expect(others.textContent).toContain('part 2, step 3');
  });

  it('sits directly under the course picker — after it, and before the lesson list', () => {
    seedTwo();
    mount();
    const picker = container.querySelector('#learn-course-pick');
    const offer = byTestId('continue-offer');
    const list = byTestId('course-lessons-first');
    expect(isBefore(picker, offer), 'the picker stays first (Darrell 2026-09-06)').toBe(true);
    expect(isBefore(offer, list), 'the offer precedes the lesson list, not two screens below it').toBe(true);
  });

  it('Continue on the OLDER lesson opens that lesson with its guide at ITS saved part', () => {
    seedTwo();
    mount();
    const btn = byTestId('continue-others').querySelector('button');
    click(btn);
    const panel = container.querySelector(`#tutor-panel-${OLDER.lessonId}`);
    expect(panel, 'the older lesson opens, guide open').toBeTruthy();
    // The part pager reads "2 / N" — the saved stage, not part one.
    expect(panel.textContent).toMatch(/[^\d]2 \/ \d+ · ~/);
    // ...and the paced step inside it is the saved step, not step one.
    expect(panel.textContent).toContain("Step 3 of");
    // And the place it resumed is still the older lesson's own.
    expect(getPlaceFor(OLDER.courseKey, OLDER.lessonId)).toMatchObject({ stage: 1, step: 2 });
  });
});

describe('the course and the list carry their own Continue', () => {
  it("the sticky lessons bar offers the open course's lesson in progress", () => {
    seedTwo();
    mount(); // opens on the latest place's course (the A.I. course)
    const chip = byTestId('lessons-bar').querySelector('[data-testid="continue-chip"]');
    expect(chip, 'the course-level Continue must be in the sticky bar').toBeTruthy();
    expect(chip.getAttribute('aria-label')).toContain('What is A.I., really?');
  });

  it('a begun lesson row says Continue; a finished one says Finished; others say nothing', () => {
    seedTwo();
    finishPlace({ courseKey: 'ai', lessonId: 'wk2-good-questions' });
    mount();
    const row = (id) => container.querySelector(`[data-testid="course-lesson-list"] li[data-lesson-id="${id}"]`);
    expect(row(NEWER.lessonId).querySelector('[data-testid="row-continue"]')).toBeTruthy();
    const list = byTestId('course-lesson-list');
    const untouched = [...list.querySelectorAll('li[data-lesson-id]')].find((li) => ![NEWER.lessonId, 'wk2-good-questions'].includes(li.getAttribute('data-lesson-id')));
    expect(untouched.querySelector('[data-testid="row-continue"], [data-testid="row-finished"]')).toBeNull();
  });

  it('the row Continue lands in the lesson with its guide open', () => {
    seedTwo();
    mount();
    click(container.querySelector(`li[data-lesson-id="${NEWER.lessonId}"] [data-testid="row-continue"]`));
    expect(container.querySelector(`#tutor-panel-${NEWER.lessonId}`)).toBeTruthy();
  });
});

describe("the lesson's own button, Start fresh, and the end door", () => {
  it('a lesson in progress says "Continue this lesson" on its own card', () => {
    recordPlace({ ...OLDER, stage: 1, step: 2 });
    mount();
    // Browse to it (the title, not Continue) — the card's own button must say
    // what the tap will do.
    const title = [...container.querySelectorAll(`li[data-lesson-id="${OLDER.lessonId}"] button`)][0];
    click(title);
    const own = [...container.querySelectorAll('button')].find((b) => /Continue this lesson →/.test(b.textContent));
    expect(own, 'the card must offer Continue, not Start').toBeTruthy();
  });

  it('Start fresh asks first, and forgets only the lesson it names', () => {
    seedTwo();
    mount();
    const fresh = [...byTestId('continue-offer').querySelectorAll('button')].find((b) => b.textContent === 'Start fresh');
    window.confirm = () => false;
    click(fresh);
    expect(getPlaceFor(NEWER.courseKey, NEWER.lessonId), 'declined: nothing is forgotten').toBeTruthy();
    window.confirm = () => true;
    click(fresh);
    expect(getPlaceFor(NEWER.courseKey, NEWER.lessonId)).toBeNull();
    expect(getPlaceFor(OLDER.courseKey, OLDER.lessonId), 'the other lesson keeps its place').toBeTruthy();
    // ...and the offer now leads with the lesson that remains.
    expect(byTestId('continue-latest').textContent).toContain('Bodybuilding Christ');
  });

  it('leaving by the end door records the lesson as finished', () => {
    recordPlace({ ...OLDER, stage: 9 }); // clamps to the last part
    mount();
    click(byTestId('continue-latest'));
    const endAll = byTestId('lesson-end-all');
    expect(endAll, 'the end doors render at the last part').toBeTruthy();
    click(endAll);
    expect(getPlaceFor(OLDER.courseKey, OLDER.lessonId).done).toBe(true);
    // A finished lesson is no longer offered as one to continue.
    expect(byTestId('continue-offer')).toBeNull();
  });
});
