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
  // DR-1657: chronological by default (first lesson first), every order on offer.
  it('Living Lessons read in order by default; Little Learners keep teaching order; each row opens at its band', () => {
    const kids = libraryLessons('child');
    expect(kids[0].lessonId).toBe(LIVING_LESSONS_MODULES.find((m) => m.levels && m.levels.child).id);
    expect(libraryLessons('child', '', { sort: 'newest' })[0].lessonId).toBe([...LIVING_LESSONS_MODULES].reverse().find((m) => m.levels && m.levels.child).id);
    const az = libraryLessons('child', '', { sort: 'az' }).map((r) => r.title);
    expect(az.slice(0, 5)).toEqual([...az].slice(0, 5).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })));
    expect(libraryLessons('child', '', { sort: 'za' })[0].title).toBe(az[az.length - 1]);
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

// Darrell 2026-11-25: "make sure the lesson is align with the age demographics."
// Measured: every row of every age opens at THAT age's own authored version.
import { bandOpening } from '../lib/learn-framework.js';
import { LITTLE_LEARNERS_MODULES as LITTLE_ALL } from '../lib/little-learners-class.js';
import { LIVING_LESSONS_MODULES as LIVING_ALL } from '../lib/living-lessons-class.js';
describe('every lesson opens at its age (DR-1657)', () => {
  const byId = new Map([...LIVING_ALL, ...LITTLE_ALL].map((m) => [m.id, m]));
  it('Kids, Youth and Teen each open at their own written version; Little Ones at the little course', () => {
    for (const a of LIBRARY_AGES) {
      const off = libraryLessons(a.key)
        .map((r) => ({ r, o: bandOpening(byId.get(r.lessonId), r.band) }))
        .filter(({ o }) => !o.own || (a.courseKey === 'living-lessons' && o.levelId !== a.depth))
        .map(({ r, o }) => `${a.key}:${r.lessonId}:${o.levelId}`);
      expect(off).toEqual([]);
    }
  });
  it('proven to catch: a Kids row opened at the Teen band reads the Teen words, not the Kids words', () => {
    const r = libraryLessons('child')[0];
    expect(bandOpening(byId.get(r.lessonId), 'teen').levelId).not.toBe('child');
  });
});
