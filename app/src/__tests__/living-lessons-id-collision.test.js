// @vitest-environment node
// =============================================================================
// Living Lessons — lesson-number collision gate
// =============================================================================
// THE INCIDENT (2026-09-02). Three sessions authored Living Lessons the same
// day, each off its own branch. Two of them independently claimed L114, and a
// third claimed L115. Nothing in the repo noticed: the collision surfaced only
// because both L114 branches happened to name their verse test
// `living-lessons-l114-verses.test.js`, so git raised an add/add conflict on the
// FILENAME. That was luck, not a check. Had the two sessions named their test
// files differently — or had one shipped without a per-lesson test — both would
// have merged green and the catalog would silently carry two lessons numbered
// L114, with `weeks` counting them as two while every human reference ("see
// L114") became ambiguous.
//
// A lesson number is an identifier the teaching material refers to by hand:
// facilitator run-sheets open with "Recap (10): L115 — …", session notes cite
// lesson numbers, and DR/REV records name them. A duplicate number corrupts all
// of those silently, and no existing test looked for it — the per-lesson verse
// tests each assert only their OWN id, and the catalog-wide tests (format, age,
// research-integrity) never look at numbering at all.
//
// WHAT THIS GATE ASSERTS, and why it asserts exactly this and no more. The
// numbering was MEASURED before the gate was written (DR-0076 §5 — characterize
// before you change), and two properties a naive gate would have demanded are
// NOT true of this catalog:
//   • NOT CONTIGUOUS. Number 79 is absent: 115 lessons span ll1..ll116. A
//     "sequential" assertion would fail the build on a historical gap that has
//     nothing to do with the hazard. The gap is instead RATCHETED below, so a
//     NEW gap — the signature of a session picking the wrong next number — fails
//     while the old one is recorded rather than hidden.
//   • NOT MONOTONIC IN FILE ORDER. Two inversions predate this gate:
//     ll61 → ll60 (index 60) and ll94 → ll90 (index 92). This is worth knowing
//     because `buildLivingLessonsSchedule()` assigns `week: i + 1` from FILE
//     order, so for those entries the week number and the lesson number differ.
//     That is pre-existing and out of scope here; it is recorded so a future
//     reader does not mistake it for something this gate blessed.
// So the gate holds the one property the incident proves must hold: a lesson
// number is claimed at most once.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const ID_SHAPE = /^ll(\d+)-[a-z0-9-]+$/;

const numbered = (mods) => mods.map((m) => {
  const hit = ID_SHAPE.exec(m.id);
  return { id: m.id, n: hit ? Number(hit[1]) : null };
});

// The one historical gap, measured 2026-09-02. THIS LIST MAY ONLY SHRINK: fill
// the gap and delete the entry. A gap that is NOT in this list is a session that
// skipped a number, which is the same race that produced the duplicate above.
const KNOWN_MISSING = [79];

describe('every lesson id is shaped ll<number>-<slug>', () => {
  it('no lesson carries an unparseable id', () => {
    const bad = numbered(LIVING_LESSONS_MODULES).filter((x) => x.n === null).map((x) => x.id);
    expect(bad, `ids that do not match ll<number>-<slug>: ${bad.join(', ')}`).toEqual([]);
  });
});

describe('a lesson number is claimed at most once — the collision gate', () => {
  it('NO two lessons share a number', () => {
    const seen = new Map();
    const collisions = [];
    for (const { id, n } of numbered(LIVING_LESSONS_MODULES)) {
      if (seen.has(n)) collisions.push(`L${n}: ${seen.get(n)} AND ${id}`);
      else seen.set(n, id);
    }
    expect(
      collisions,
      `two sessions claimed the same lesson number:\n${collisions.map((c) => ` - ${c}`).join('\n')}`,
    ).toEqual([]);
  });

  it('NO two lessons share a full id', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate lesson ids: ${dupes.join(', ')}`).toEqual([]);
  });

  it('the painted lesson count is the real one', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });
});

describe('the numbering gaps are recorded, not hidden — shrink-only ratchet', () => {
  it('the only missing numbers are the ones on the record', () => {
    const claimed = new Set(numbered(LIVING_LESSONS_MODULES).map((x) => x.n));
    const highest = Math.max(...claimed);
    const missing = [];
    for (let n = 1; n <= highest; n += 1) if (!claimed.has(n)) missing.push(n);
    expect(
      missing,
      `unrecorded gap(s) in the lesson numbering — a session skipped a number: ${missing.join(', ')}`,
    ).toEqual(KNOWN_MISSING);
  });

  it('no number in the record has quietly been filled', () => {
    const claimed = new Set(numbered(LIVING_LESSONS_MODULES).map((x) => x.n));
    const filled = KNOWN_MISSING.filter((n) => claimed.has(n));
    expect(filled, `these are no longer missing — delete them from KNOWN_MISSING: ${filled.join(', ')}`).toEqual([]);
  });
});

describe('PROVEN-TO-CATCH — the gate fails on the exact 2026-09-02 collision', () => {
  // The real catalog is correct, so the checks above pass on it and prove
  // nothing by themselves. These replay the incident against the same logic.
  const collisionsIn = (mods) => {
    const seen = new Map();
    const out = [];
    for (const { id, n } of numbered(mods)) {
      if (seen.has(n)) out.push(`L${n}: ${seen.get(n)} AND ${id}`);
      else seen.set(n, id);
    }
    return out;
  };

  it('CATCHES two sessions claiming L114 with different slugs', () => {
    const collided = [
      { id: 'll113-the-spirit-is-willing' },
      { id: 'll114-what-makes-having-you-better-covenant-not-contract' },
      { id: 'll114-the-thirty-day-experiment-action-produces-information' },
    ];
    const found = collisionsIn(collided);
    expect(found.length).toBe(1);
    expect(found[0]).toContain('L114');
  });

  it('does NOT fire on the differently-numbered lessons that actually shipped', () => {
    const shipped = [
      { id: 'll114-what-makes-having-you-better-covenant-not-contract' },
      { id: 'll115-meek-and-quiet-strength-the-ornament-of-great-price' },
      { id: 'll116-the-thirty-day-experiment-action-produces-information' },
    ];
    expect(collisionsIn(shipped)).toEqual([]);
  });

  it('CATCHES a session that skips a free number instead of taking it', () => {
    // ll117 free, a session jumps to ll118 — the same race, different symptom.
    const skipped = [{ id: 'll116-a' }, { id: 'll118-b' }];
    const claimed = new Set(numbered(skipped).map((x) => x.n));
    const gaps = [];
    for (let n = 116; n <= 118; n += 1) if (!claimed.has(n)) gaps.push(n);
    expect(gaps).toEqual([117]);
  });

  it('CATCHES an id that is not shaped like a lesson id at all', () => {
    expect(numbered([{ id: 'the-thirty-day-experiment' }])[0].n).toBe(null);
  });
});
