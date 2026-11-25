// The Lesson Experience across the WHOLE catalog (Darrell, 2026-11-25:
// "expand this exact approved design and functionality across all 994
// lessons and 4,258 age-specific readings... Preserve every word").
// One reusable component; this proves it against every lesson, every reading.
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LessonExperience, { readingText } from '../components/learn-studio/LessonExperience.jsx';
import { learnInventory } from '../lib/learn-presentation/integrity.js';
import { lessonVersions, READING_VERSIONS } from '../lib/learn-organize.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const inventory = learnInventory();
const all = inventory.flatMap((c) => c.lessons.map((l) => ({ course: c, lesson: l })));
const squash = (t) => String(t || '').replace(/\s+/g, '');
// A silent narrator: these checks are about the words on the page.
const createNarrator = () => ({ load() {}, play() {}, pause() {}, resume() {}, stop() {}, setRate() {}, onBoundary() {} });

describe('every reading the Experience offers is the catalog reading, verbatim', () => {
  it('the catalog is the measured baseline: 994 lessons, 4,258 readings', () => {
    const readings = all.reduce((n, x) => n + lessonVersions(x.lesson).length, 0);
    expect(all.length).toBe(994);
    expect(readings).toBe(4258);
  });

  it('each of the 4,258 readings resolves to its own original text, never empty, never another band', () => {
    let checked = 0;
    for (const { lesson } of all) {
      for (const id of lessonVersions(lesson)) {
        const band = READING_VERSIONS.find((b) => b.id === id);
        const own = lesson.levels && typeof lesson.levels[band.key] === 'string' && lesson.levels[band.key].trim() ? lesson.levels[band.key] : '';
        const expected = own || (id === 'adult' ? lesson.lesson : '');
        const got = readingText(lesson, id);
        expect(got, `${lesson.id} ${id}`).toBe(expected);
        expect(got.trim().length, `${lesson.id} ${id}`).toBeGreaterThan(0);
        checked += 1;
      }
    }
    expect(checked).toBe(4258);
  });
});

describe('every one of the 994 lessons renders in the Experience with every word and its real quiz', () => {
  let container, root;
  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('Read shows every character of the default reading, in order; Study shows the real quiz', () => {
    let rendered = 0;
    for (const { course, lesson } of all) {
      const ids = lessonVersions(lesson);
      const level = ids.includes('adult') ? 'adult' : ids[0];
      act(() =>
        root.render(
          <LessonExperience
            key={`${course.key}/${lesson.id}`}
            lesson={lesson}
            record={null}
            onExit={() => {}}
            initialMode="read"
            initialLevel={level}
            createNarrator={createNarrator}
          />
        )
      );
      const book = [...container.querySelectorAll('.le-book-p')].map((p) => p.textContent).join('');
      expect(squash(book), `${course.key}/${lesson.id} ${level}`).toBe(squash(readingText(lesson, level)));
      expect(container.textContent, `${lesson.id} title`).toContain(lesson.title);
      const studyBtn = [...container.querySelectorAll('button[role="tab"]')].find((b) => b.textContent.trim() === 'Study');
      act(() => studyBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      for (const q of (lesson.quiz && lesson.quiz.questions) || []) {
        expect(container.textContent, `${lesson.id} quiz`).toContain(q.q);
      }
      rendered += 1;
    }
    expect(rendered).toBe(994);
  }, 240000);
});
