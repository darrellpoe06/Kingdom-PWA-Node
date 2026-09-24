// =============================================================================
// learn-open — "take me to that lesson, at that sentence", from anywhere
// (lib/learn-open.js). The read-aloud's "Show the text" calls this; Learn
// answers it through its own Continue path, never a fork of it.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { buildCatalogCourseDescriptors } from '../lib/learn-catalog.js';
import { requestOpenLesson, takeOpenLessonRequest, subscribeOpenLesson, OPEN_LESSON_MAX_AGE_MS } from '../lib/learn-open.js';
import { recordPlace, getPlaceFor } from '../lib/learn-resume.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const LESSON = 'll3-bodybuilding-christ';

beforeEach(() => { window.localStorage.clear(); takeOpenLessonRequest(); });
afterEach(() => { window.localStorage.clear(); takeOpenLessonRequest(); });

describe('the request itself', () => {
  it('needs a lesson id', () => {
    expect(requestOpenLesson({})).toBe(false);
    expect(takeOpenLessonRequest()).toBeNull();
  });

  it("writes the sentence into that lesson's own place, and is taken once", () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: LESSON, stage: 1, step: 2 });
    expect(requestOpenLesson({ lessonId: LESSON, sentence: 9, sentenceKey: 'abc12' })).toBe(true);
    expect(getPlaceFor('living-lessons', LESSON)).toMatchObject({ stage: 1, step: 2, sentence: 9, sentenceKey: 'abc12' });
    expect(takeOpenLessonRequest()).toMatchObject({ lessonId: LESSON, courseKey: 'living-lessons' });
    expect(takeOpenLessonRequest()).toBeNull();
  });

  it('lapses if nothing takes it in time', () => {
    requestOpenLesson({ lessonId: LESSON }, { now: 1000 });
    expect(takeOpenLessonRequest(1000 + OPEN_LESSON_MAX_AGE_MS + 1)).toBeNull();
  });

  it('tells subscribers, and unsubscribing stops it', () => {
    const heard = [];
    const off = subscribeOpenLesson((r) => heard.push(r.lessonId));
    requestOpenLesson({ lessonId: LESSON });
    off();
    requestOpenLesson({ lessonId: LESSON });
    expect(heard).toEqual([LESSON]);
  });
});

describe('Learn answers it through Continue', () => {
  let container, root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });
  const mount = () => act(() => root.render(createElement(ChurchLearn, {
    extraCourses: buildCatalogCourseDescriptors(), progress: {}, toggleModule: () => {}, quizState: {}, recordQuiz: () => {},
    learnLevel: 'auto', setLearnLevel: () => {}, ageBand: 'adult', setAgeBand: () => {},
  })));

  it('a request made before Learn mounts opens the lesson, guide open, at its saved part', () => {
    recordPlace({ courseKey: 'living-lessons', lessonId: LESSON, stage: 1, step: 2 });
    requestOpenLesson({ lessonId: LESSON, sentence: 3, sentenceKey: 'zz' });
    mount();
    const panel = container.querySelector(`#tutor-panel-${LESSON}`);
    expect(panel).toBeTruthy();
    expect(panel.textContent).toMatch(/[^\d]2 \/ \d+ · ~/);
  });

  it('a request made while Learn is on screen opens it at once, the course resolved from the catalog', () => {
    mount();
    expect(container.querySelector(`#tutor-panel-${LESSON}`)).toBeNull();
    act(() => { requestOpenLesson({ lessonId: LESSON }); });
    expect(container.querySelector(`#tutor-panel-${LESSON}`)).toBeTruthy();
  });

  it('a lesson that is not in the catalog opens nothing', () => {
    mount();
    act(() => { requestOpenLesson({ lessonId: 'no-such-lesson' }); });
    expect(container.querySelector('[data-testid="lesson-space-bar"]')).toBeNull();
  });
});
