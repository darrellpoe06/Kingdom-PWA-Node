// =============================================================================
// No two Living Lessons carry the same lesson NUMBER (2026-10-13, DR-0998)
// =============================================================================
// learn-integration.test.js already asserts ids are unique, but it compares
// WHOLE ids and only across three other courses. That cannot catch this class:
// on 2026-10-13 a new lesson was written as `ll240-advice-with-no-name-on-it…`
// while `ll240-he-said-it-and-did-not-do-it…` was already on main (the Numbers
// 14 lesson, DR-0981, the same day). The two full ids differ, so a Set of ids
// is the same size either way and reads green — yet everything that resolves a
// lesson by its number prefix (`find(id.startsWith('ll240-'))`, and a reader
// following a numbered link) silently gets whichever one comes first.
//
// The number is the lesson's name to a person. Two lessons cannot share it.
//
// The next number therefore comes from the catalog in the tree being built on,
// never from another checkout — the cause of the original mistake was asking a
// repository directory that was parked on an older branch.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

/** The numeric part of a lesson id: `ll241-advice…` -> 241. Null if unnumbered. */
export function lessonNumber(id) {
  const m = /^ll(\d+)-/.exec(String(id || ''));
  return m ? Number(m[1]) : null;
}

/** Every number carried by more than one module, with the ids that share it. */
export function duplicateNumbers(modules) {
  const byNumber = new Map();
  for (const m of modules || []) {
    const n = lessonNumber(m && m.id);
    if (n === null) continue;
    if (!byNumber.has(n)) byNumber.set(n, []);
    byNumber.get(n).push(m.id);
  }
  return [...byNumber.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([number, ids]) => ({ number, ids: ids.slice().sort() }))
    .sort((a, b) => a.number - b.number);
}

describe('Living Lessons — the lesson number is unique', () => {
  it('no two modules share a lesson number', () => {
    expect(duplicateNumbers(LIVING_LESSONS_MODULES)).toEqual([]);
  });

  it('every module carries a number (nothing unnumbered slips into the catalog)', () => {
    const unnumbered = LIVING_LESSONS_MODULES.filter((m) => lessonNumber(m.id) === null).map((m) => m.id);
    expect(unnumbered).toEqual([]);
  });

  // PROVEN-TO-CATCH, on the real shape of the 2026-10-13 mistake: two different
  // full ids sharing one number. A whole-id Set reads green on this input.
  it('catches two different ids that share one number, where an id Set does not', () => {
    const collided = [
      { id: 'll240-he-said-it-and-did-not-do-it-the-offer-moses-refused' },
      { id: 'll240-advice-with-no-name-on-it-the-paid-room' },
      { id: 'll241-something-else' },
    ];
    const ids = collided.map((m) => m.id);
    expect(new Set(ids).size, 'the whole-id check cannot see this — that is the hazard').toBe(ids.length);
    expect(duplicateNumbers(collided)).toEqual([
      {
        number: 240,
        ids: [
          'll240-advice-with-no-name-on-it-the-paid-room',
          'll240-he-said-it-and-did-not-do-it-the-offer-moses-refused',
        ],
      },
    ]);
  });

  it('lessonNumber reads the number and refuses what is not one', () => {
    expect(lessonNumber('ll241-advice-with-no-name-on-it')).toBe(241);
    expect(lessonNumber('ll7-short')).toBe(7);
    expect(lessonNumber('sov32-whose-errand')).toBeNull();
    expect(lessonNumber('ll-no-number')).toBeNull();
    expect(lessonNumber('')).toBeNull();
    expect(lessonNumber(undefined)).toBeNull();
  });
});
