// DR-1674: the new look's lesson screen gets the classic space's own tools, so what you read there is
// saved where Continue Learning, Recently opened and the read marks look, and a reading is credited.
// Darrell 2026-11-26: "Not showing what I was just reading!!!!!!! No where!!!!!"
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { studioSavePlace } from '../lib/learn-studio-bridge.js';
import { listPlaces, getPlaceFor, placeIsFinished } from '../lib/learn-resume.js';
import { experienceTools } from '../components/learn-studio/LessonExperienceTools.jsx';
import LearnStudioPreview from '../components/learn-studio/LearnStudioPreview.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const COURSES = learnInventory().map((c) => ({ key: c.key, meta: { ...(c.meta || {}), key: c.key }, schedule: c.lessons }));
const LL = 'living-lessons';
const LESSON = COURSES.find((c) => c.key === LL).schedule.find((l) => l.id === 'll338-not-with-eyeservice');

let container, root;
beforeEach(() => {
  window.localStorage.clear();
  window.speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    speak() {},
    cancel() {},
    pause() {},
    resume() {},
    getVoices: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('what you read in the new look is kept where the app looks for it', () => {
  it('reading part way puts the lesson on the Continue list; reading to the floor credits it, with its version', () => {
    const save = studioSavePlace({ courseKey: LL, lesson: LESSON, ageBand: 'adult' });
    save({ lessonId: LESSON.id, seen: 0.3 });
    expect(listPlaces({ inProgress: true }).map((p) => p.lessonId)).toContain(LESSON.id);
    expect(placeIsFinished(getPlaceFor(LL, LESSON.id))).toBe(false);
    save({ lessonId: LESSON.id, seen: 0.95 });
    const p = getPlaceFor(LL, LESSON.id);
    expect(placeIsFinished(p)).toBe(true);
    expect(p.version).toBeTruthy();
  });

  it('the new look hands its lesson screen the full tools: downloads show in Study, and the screen reports what is seen', () => {
    let opener = null;
    const seen = [];
    const lessonToolsFor = (lesson, course) => {
      const t = experienceTools({
        module: lesson,
        course: { ...course, key: course.key },
        ageBand: 'adult',
        versionCount: 0,
        savePlace: studioSavePlace({ courseKey: course.key, lesson, ageBand: 'adult' }),
      });
      return { ...t, onSeen: (f, v) => (seen.push(f), t.onSeen(f, v)) };
    };
    act(() =>
      root.render(
        <LearnStudioPreview
          courses={COURSES}
          onOpenLesson={() => {}}
          onExit={() => {}}
          ownerDevice
          registerOpener={(fn) => (opener = fn)}
          lessonToolsFor={lessonToolsFor}
        />
      )
    );
    act(() => opener(LL, LESSON.id, { mode: 'read' }));
    expect(container.querySelector('.le-root')).toBeTruthy();
    const study = [...container.querySelectorAll('button[role="tab"]')].find((b) => b.textContent.includes('Study'));
    act(() => study.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(container.querySelector('[data-testid="lesson-experience-downloads"]')).toBeTruthy();
  });
});
