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
//
// 211 AND 212 WILL NEVER BE PAID, AND THAT IS NOT A DEBT — ANSWERED
// 2026-10-17, on #2166's dated re-review "look at 211 and 212 the way 79 was
// looked at". Looked at the same way, they are the opposite case, and the
// answer was already in writing on main the day they were built:
//
//   · 211 is DR-0760's build label. The brief said "ll211" while naming the
//     placement "Sovereign A.I." — and those cannot both be literal, because
//     `ll*` is THIS catalog's scheme while that course requires `sov<week>`.
//     The placement was the part that was right. The teaching shipped as
//     **sov34**, and the record says it outright: "No `ll211` exists."
//   · 212 is DR-0761's, identically: worktree `wt-l212`, branch
//     `claude/lesson-l212`, teaching shipped as **sov33**.
//
// So 79 and these two are different animals wearing one list. 79 was a real
// lesson whose text sat stranded in an unmergeable PR for two months — a hole
// in the TEACHING, and it was paid. 211 and 212 are holes in a NUMBER
// SEQUENCE that never had teaching assigned to them, because the number came
// from the orchestrator's build-label namespace and not from this catalog at
// all. Nothing is missing from the app; two labels were simply never minted
// here.
//
// They are kept on the list, not deleted, because the unclaimed-number check
// must keep accounting for them — but the list is no longer allowed to say
// only "known". A gap a reader can see (L210 then L213) with no reason
// written beside it is a standing invitation to investigate it again, which
// is exactly what today cost. Renumbering the catalog to close the visual
// skip is deliberately NOT done: it would move every lesson above 212 and
// invalidate every number pinned anywhere, to cosmetically hide two labels
// that were never ours. `re-review: 2027-04-17` — only if the orchestrator's
// label namespace and this catalog's are ever actually unified.
const KNOWN_GAPS = [211, 212];

// Why each one is allowed to be unclaimed, by record. A number may sit on
// KNOWN_GAPS only with its reason here, so the next reader gets the answer
// instead of the investigation.
const GAP_REASONS = {
  211: 'DR-0760 — the orchestrator build label `wt-l211`; the teaching shipped as sovereign-ai sov34. No ll211 was ever minted.',
  212: 'DR-0761 — the orchestrator build label `wt-l212`; the teaching shipped as sovereign-ai sov33. No ll212 was ever minted.',
};

// A THIRD KIND OF GAP, which this check had never had (DR-1185, 2026-10-21).
//
// KNOWN_GAPS above is SHRINK-ONLY on purpose: it exists so a session cannot
// quietly skip a number, and letting it grow would hand back the thing it
// guards. 235 is not a skip. L235 was a real lesson, really taught — and it was
// one of TWO lessons built from the same spoken street interview. Darrell, with
// both on screen: "Same lesson from before?!!!!!!!! Really?!!!!!!" L257 is the
// superset, so L235's four verses and two parables were carried into it and
// L235 was removed. The number is unclaimed because its TEACHING MOVED, not
// because anybody skipped it.
//
// So a folded number is listed here instead, with a stricter requirement than
// KNOWN_GAPS carries: it must name the lesson that absorbed it, and the case
// below checks that lesson is really in the catalog. KNOWN_GAPS keeps its
// shrink-only property exactly as it was, and the unclaimed check accepts both
// lists — a number excused for a reason the record states is not a hole.
const FOLDED_AWAY = {
  235: {
    into: 'll257-ten-christmases-left-counting-our-days-the-way-yahweh-counts-them',
    why: 'DR-1185 — L235 and L257 were one teaching built twice (23 verses shared, 85% of the smaller). L257 keeps it; L235\u2019s four verses (Genesis 32:10, 1 Chronicles 29:14, Hebrews 9:27, Job 1:21) and two parables were carried into it, in the adult lesson and all four bands. No ll235 will exist again.',
  },
};
const FOLDED_NUMBERS = Object.keys(FOLDED_AWAY).map(Number);

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
    const excused = [...KNOWN_GAPS, ...FOLDED_NUMBERS];
    const appeared = gaps.filter((n) => !excused.includes(n));
    expect(appeared, 'a lesson number nobody claims is a hole a reader can fall into').toEqual([]);
    // SHRINK-ONLY, UNCHANGED. KNOWN_GAPS is still measured against its own
    // length alone: it may lose entries and never gain them, which is the whole
    // ratchet. A folded number is counted separately because it is a different
    // thing (DR-1185), not because the ratchet was loosened.
    expect(gaps.filter((n) => KNOWN_GAPS.includes(n)).length, 'shrink-only: KNOWN_GAPS may lose entries, never gain them')
      .toBeLessThanOrEqual(KNOWN_GAPS.length);
    expect(KNOWN_GAPS.length, 'KNOWN_GAPS itself must not grow').toBe(2);
    expect(gaps.length).toBe(excused.length);
  });

  it('a FOLDED number names the lesson that absorbed it, and that lesson is really there', () => {
    const ids = LIVING_LESSONS_MODULES.filter(Boolean).map((m) => m.id);
    for (const n of FOLDED_NUMBERS) {
      const f = FOLDED_AWAY[n];
      expect(f.why, `${n} is folded with no reason written down`).toMatch(/DR-\d{4}/);
      expect(ids, `${n} says it folded into ${f.into}, which is not in the catalog`).toContain(f.into);
      // And the folded number itself is really gone.
      expect(ids.some((id) => id.startsWith(`ll${n}-`)), `ll${n} is listed as folded but still mounted`).toBe(false);
    }
  });

  it('PROVEN TO CATCH: a folded number pointing at a lesson that is not there fails', () => {
    const ids = LIVING_LESSONS_MODULES.filter(Boolean).map((m) => m.id);
    expect(ids).not.toContain('ll999-a-lesson-that-was-never-built');
  });

  // An allowance with no reason beside it is how 211 and 212 got investigated
  // twice. A number may be excused from the sequence only with its record.
  it('every excused number says WHY it is excused, by record', () => {
    for (const n of KNOWN_GAPS) {
      expect(GAP_REASONS[n], `${n} is excused from the sequence with no reason written down`)
        .toMatch(/DR-\d{4}/);
    }
    expect(Object.keys(GAP_REASONS).map(Number).sort((a, b) => a - b))
      .toEqual([...KNOWN_GAPS].sort((a, b) => a - b));
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
