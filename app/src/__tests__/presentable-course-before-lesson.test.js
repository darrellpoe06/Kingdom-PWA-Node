// =============================================================================
// COURSE BEFORE THE LESSON — Darrell 2026-09-05
// =============================================================================
// A single pushed lesson used to present, and to SHARE, under its own title
// alone: a room (or anyone handed the shared link) saw the lesson with no idea
// which course it belonged to. When the caller knows the course, the course
// leads. The kicker is a DIFFERENT slot — the "through the church to present"
// branding — and must not be displaced by this.
import { describe, it, expect } from 'vitest';
import { lessonPresentable, DEFAULT_KICKER } from '../lib/presentable.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

const lesson = { id: 'x1', title: 'The Lesson Title', bigIdea: 'An idea worth a slide.' };

describe('lessonPresentable — the course leads the title', () => {
  it('puts the course BEFORE the lesson when the caller knows it', () => {
    const p = lessonPresentable(lesson, { courseTitle: 'The Course Name' });
    expect(p.title).toBe('The Course Name — The Lesson Title');
    expect(p.title.indexOf('The Course Name')).toBeLessThan(p.title.indexOf('The Lesson Title'));
  });

  it('falls back to the lesson title alone when no course is given', () => {
    expect(lessonPresentable(lesson).title).toBe('The Lesson Title');
    expect(lessonPresentable(lesson, { courseTitle: '   ' }).title).toBe('The Lesson Title');
  });

  it('does not repeat itself when the course and lesson share a title', () => {
    const p = lessonPresentable({ ...lesson, title: 'Same' }, { courseTitle: 'Same' });
    expect(p.title).toBe('Same');
  });

  it('leaves the church kicker alone — it is a different slot', () => {
    const p = lessonPresentable(lesson, { courseTitle: 'The Course Name' });
    expect(p.kicker).toBe(DEFAULT_KICKER);
  });

  it('still builds real scenes — the title change is not a regression', () => {
    const p = lessonPresentable(lesson, { courseTitle: 'The Course Name' });
    expect(p.scenes.length).toBeGreaterThan(0);
  });

  it('works on a REAL catalog lesson, at every age band', () => {
    const m = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    for (const level of [null, 'child', 'teen', 'senior']) {
      const p = lessonPresentable(m, { level, courseTitle: 'Living Lessons from the Word' });
      expect(p.title.startsWith('Living Lessons from the Word — ')).toBe(true);
      expect(p.title).toContain(m.title);
      expect(p.scenes.length).toBeGreaterThan(0);
    }
  });
});
