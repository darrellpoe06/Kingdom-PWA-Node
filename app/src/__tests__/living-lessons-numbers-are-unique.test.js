// =============================================================================
// No two Living Lessons carry the same lesson NUMBER (2026-10-13, DR-1001)
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

/**
 * Numbers inside the catalog's own range that NO module claims.
 *
 * A number claimed twice is loud; a number claimed never is silent, and that is
 * why ll79 sat missing from 2026-08-14 until a drain triage went looking on
 * 2026-10-13. The lesson that was meant to fill it was sitting in #1255, whose
 * catalog holds 81 modules against this one's 239 — so the file could not be
 * merged, only the module mined out of it, which is what 2026-10-14 did. 79 is
 * PAID; the gap list is the proof it was ever open.
 *
 * Gaps are RECORDED DEBT, not an error: the two below are real holes awaiting
 * their lessons. The ratchet below is shrink-only, so paying one off is always
 * allowed and opening a NEW one fails.
 */
export function unclaimedNumbers(modules) {
  const claimed = new Set();
  for (const m of modules || []) {
    const n = lessonNumber(m && m.id);
    if (n !== null) claimed.add(n);
  }
  if (!claimed.size) return [];
  const nums = [...claimed];
  const out = [];
  for (let n = Math.min(...nums); n <= Math.max(...nums); n += 1) if (!claimed.has(n)) out.push(n);
  return out;
}

// The holes as measured on main `83d06328b`, 2026-10-13. Shrink-only: a lesson
// that fills one of these removes it from the list, which the test allows; a
// number that goes missing is not on this list, which fails.
//
// 79 was PAID on 2026-10-14: "A Gospel With a Hole In It — Why Justice and
// Righteousness Travel Together" was mined out of #1255, rebuilt to the band
// floors in all four bands, and spliced between ll78 and ll80. The entry comes
// off the list rather than being left as a passing-but-stale allowance, which
// is the whole point of a shrink-only ratchet.
const KNOWN_GAPS = [211, 212];

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

  it('no NEW number goes unclaimed, and a filled one may always be removed', () => {
    const gaps = unclaimedNumbers(LIVING_LESSONS_MODULES);
    const appeared = gaps.filter((n) => !KNOWN_GAPS.includes(n));
    expect(appeared, 'a lesson number nobody claims is a hole a reader can fall into').toEqual([]);
    expect(gaps.length, 'shrink-only: KNOWN_GAPS may lose entries, never gain them')
      .toBeLessThanOrEqual(KNOWN_GAPS.length);
  });

  // PROVEN-TO-CATCH on the real shape of the ll79 miss: a catalog that skips a
  // number reads perfectly to every uniqueness check there is.
  it('catches a skipped number, where uniqueness checks cannot', () => {
    const skipped = [
      { id: 'll77-the-king-over-the-children-of-pride' },
      { id: 'll78-the-snare-of-the-fear-of-man' },
      { id: 'll80-the-four-warnings-of-a-hardening-heart' },
    ];
    expect(duplicateNumbers(skipped), 'uniqueness is satisfied — that is the hazard').toEqual([]);
    expect(skipped.filter((m) => lessonNumber(m.id) === null)).toEqual([]);
    expect(unclaimedNumbers(skipped)).toEqual([79]);
  });

  it('unclaimedNumbers reads a dense catalog as whole, and an empty one as nothing', () => {
    expect(unclaimedNumbers([{ id: 'll1-a' }, { id: 'll2-b' }, { id: 'll3-c' }])).toEqual([]);
    expect(unclaimedNumbers([{ id: 'll5-only' }])).toEqual([]);
    expect(unclaimedNumbers([])).toEqual([]);
    expect(unclaimedNumbers([{ id: 'sov1-not-a-living-lesson' }])).toEqual([]);
    expect(unclaimedNumbers([{ id: 'll1-a' }, { id: 'll4-d' }])).toEqual([2, 3]);
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
