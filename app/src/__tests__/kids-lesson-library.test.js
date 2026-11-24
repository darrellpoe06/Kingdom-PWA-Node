// =============================================================================
// The Kids Zone lesson library (2026-11-24): every children's lesson, chosen
// by age, each listed only where it carries that age's own authored words.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LIBRARY_AGES, defaultLibraryAge, libraryLessons, libraryCounts, lessonLabel } from '../lib/kids/lesson-library.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from '../lib/little-learners-class.js';

describe('the ages are the app’s own, youngest first', () => {
  it('Little Ones 3–6, Kids 6–10, Youth 11–14, Teen 15–17', () => {
    expect(LIBRARY_AGES.map((a) => `${a.label} ${a.range}`)).toEqual(['Little Ones 3–6', 'Kids 6–10', 'Youth 11–14', 'Teen 15–17']);
    expect(defaultLibraryAge('little')).toBe('little');
    expect(defaultLibraryAge('kids')).toBe('child');
  });
});

describe('every lesson is offered, at the right age', () => {
  it('counts are MEASURED from the lessons: Little Ones holds every Little Learners lesson; each band holds every Living Lesson with its own level', () => {
    const c = libraryCounts();
    expect(c.little).toBe(LITTLE_LEARNERS_MODULES.length);
    for (const band of ['child', 'youth', 'teen']) expect(c[band]).toBe(LIVING_LESSONS_MODULES.filter((m) => m.levels && m.levels[band]).length);
    expect(c.child).toBeGreaterThan(300);
  });
  it('PROVEN-TO-CATCH: a lesson without that age’s own words is not listed for it', () => {
    const living = [
      { id: 'll1-a', title: 'A', levels: { child: 'x' } },
      { id: 'll2-b', title: 'B', levels: { teen: 'y' } },
    ];
    expect(libraryLessons('child', '', { living }).map((r) => r.lessonId)).toEqual(['ll1-a']);
    expect(libraryLessons('teen', '', { living }).map((r) => r.lessonId)).toEqual(['ll2-b']);
  });
  it('Living Lessons read newest first; Little Learners keep teaching order; each row opens at its band', () => {
    const kids = libraryLessons('child');
    expect(kids[0].lessonId).toBe([...LIVING_LESSONS_MODULES].reverse().find((m) => m.levels && m.levels.child).id);
    expect(kids.every((r) => r.courseKey === 'living-lessons' && r.band === 'child')).toBe(true);
    const little = libraryLessons('little');
    expect(little[0].lessonId).toBe(LITTLE_LEARNERS_MODULES[0].id);
    expect(little.every((r) => r.courseKey === 'little-learners')).toBe(true);
    expect(libraryLessons('youth').every((r) => r.band === 'youth')).toBe(true);
  });
  it('search matches title and big idea, case- and accent-blind', () => {
    const living = [
      { id: 'll1-a', title: 'David and Goliath', bigIdea: 'COURAGE', levels: { child: 'x' } },
      { id: 'll2-b', title: 'Prayer', bigIdea: 'ASK, SEEK, KNOCK', levels: { child: 'x' } },
    ];
    expect(libraryLessons('child', 'goliath', { living }).map((r) => r.lessonId)).toEqual(['ll1-a']);
    expect(libraryLessons('child', 'Knock', { living }).map((r) => r.lessonId)).toEqual(['ll2-b']);
    expect(libraryLessons('child', 'nothing-here', { living })).toEqual([]);
  });
  it('labels a lesson by its number', () => {
    expect(lessonLabel('ll341-whoso')).toBe('L341');
    expect(lessonLabel('lil3-big')).toBe('Little 3');
    expect(lessonLabel('other')).toBeNull();
  });
});
