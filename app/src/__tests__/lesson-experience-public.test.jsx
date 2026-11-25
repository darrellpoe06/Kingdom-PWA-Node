// The four-mode Lesson Experience goes public ONLY for lessons with their own
// completed cover (Darrell, 2026-11-25: "only ... the lessons that already have
// their own completed custom thumbnail images ... publicly available to
// everyone ... Leave the remaining lessons in their existing format ... Do not
// use temporary department images to launch additional lessons").
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchLearn from '../components/ChurchLearn.jsx';
import { lessonQuery } from '../lib/lesson-links.js';
import { buildSelfPacedDescriptors } from '../lib/learn-catalog.js';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { isExperienceLesson, experienceRecord } from '../components/learn-studio/LessonExperienceDoor.jsx';
import RECORDS from '../lib/learn-presentation/presentation-records.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const inventory = learnInventory();
const all = inventory.flatMap((c) => c.lessons.map((l) => ({ course: c, lesson: l })));
const live = all.filter(({ course, lesson }) => isExperienceLesson(lesson, course));
const ownCover = new Set(RECORDS.records.filter((r) => r.image && r.image.src).map((r) => r.lessonId));

describe('which lessons are live in the new look', () => {
  it('exactly the 150 lessons with their own finished cover, every one of them', () => {
    expect(ownCover.size).toBe(150);
    expect(live.length).toBe(150);
    expect(live.every(({ lesson }) => ownCover.has(lesson.id))).toBe(true);
  });

  it('every live lesson shows its OWN cover, never department art', () => {
    for (const { course, lesson } of live) {
      const rec = experienceRecord(lesson, course);
      expect(rec.image.src, lesson.id).toContain(`learn-thumbs/${course.key}/${lesson.id}/`);
    }
  });

  it('a lesson without its own cover stays in its existing format', () => {
    const waiting = all.filter(({ lesson }) => !ownCover.has(lesson.id));
    expect(waiting.length).toBe(994 - 150);
    expect(waiting.some(({ course, lesson }) => isExperienceLesson(lesson, course))).toBe(false);
  });
});

describe('in classic Learn, for everyone', () => {
  let container, root;
  const setSearch = (search) => window.history.replaceState({}, '', `${window.location.pathname}${search}`);
  beforeEach(() => {
    window.localStorage.clear();
    container = document.createElement('main');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
    setSearch('');
  });
  const mount = () =>
    act(() =>
      root.render(
        createElement(ChurchLearn, {
          progress: {},
          toggleModule: () => {},
          quizState: {},
          recordQuiz: () => {},
          learnLevel: 'auto',
          setLearnLevel: () => {},
          ageBand: 'adult',
          setAgeBand: () => {},
          extraCourses: buildSelfPacedDescriptors({}),
          userTier: 'poetech-plus',
        })
      )
    );
  const click = (n) => act(() => n.dispatchEvent(new MouseEvent('click', { bubbles: true })));

  it('a live lesson opens in the four-mode Experience, and the classic reader is one tap away', () => {
    const { course, lesson } = live.find((x) => x.lesson.id === 'll338-not-with-eyeservice');
    setSearch(lessonQuery({ courseKey: course.key, lessonId: lesson.id }));
    mount();
    expect(container.querySelector('.le-root')).toBeTruthy();
    for (const m of ['Watch', 'Read', 'Listen', 'Study']) {
      expect([...container.querySelectorAll('button[role="tab"]')].some((b) => b.textContent.trim() === m)).toBe(true);
    }
    expect(container.textContent).toContain(lesson.title);
    click([...container.querySelectorAll('button[role="tab"]')].find((b) => b.textContent.trim() === 'Study'));
    click([...container.querySelectorAll('button')].find((b) => b.textContent.includes('Open in the classic reader')));
    expect(container.querySelector('.le-root')).toBeNull();
    expect(document.getElementById(`learn-lesson-${lesson.id}`)).toBeTruthy();
  });

  it('a lesson still waiting for its own cover opens in the classic reader, unchanged', () => {
    const c = inventory.find((x) => x.key === 'living-lessons');
    const lesson = c.lessons.find((l) => !ownCover.has(l.id));
    setSearch(lessonQuery({ courseKey: c.key, lessonId: lesson.id }));
    mount();
    expect(container.querySelector('.le-root')).toBeNull();
    expect(document.getElementById(`learn-lesson-${lesson.id}`)).toBeTruthy();
  });
});
