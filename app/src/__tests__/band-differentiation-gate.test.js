// @vitest-environment node
// =============================================================================
// BAND DIFFERENTIATION — four age versions, or one repeated four times?
// =============================================================================
// Darrell 2026-09-18: "Last lessons don't have diversity of lessons for all
// reading levels... why not? Fill up the lessons and don't stop."
//
// He was right and no gate in the house could have told him. full-levels
// measures each band's word-count SHARE of the adult lesson; reading-level
// measures FK grade and monotonicity. NEITHER COMPARES THE BANDS TO EACH
// OTHER. ll173 passes every existing check — shares 0.97/1.00/1.08/1.26, ladder
// 3.2/7.1/7.2 — while its youth and teen bands are the same text. That is the
// third instance in one session of a check that never looks, after the verbatim
// check that read only five of a module's fields (DR-0483) and the renderer
// window that silently dropped four of six headings.
//
// PROVEN-TO-CATCH IS THE POINT OF THIS FILE (DR-0076 §3). A gate that always
// passes is itself a lie, so the first four tests break the measure on purpose
// and require it to report — including on the real ll173, whose defect is the
// reason the measure exists.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import {
  shingles, overlap, measureDifferentiation, duplicatedBands,
  scanDifferentiation, ratchetDifferentiation, DIFF_CEILING, BAND_PAIRS,
} from '../../../scripts/band-differentiation.mjs';
import baseline from '../lib/band-differentiation-baseline.json';

const four = (child, youth, teen, senior) => ({ id: 'test', levels: { child, youth, teen, senior } });
// Long enough to produce real shingle sets; the content is ordinary prose.
const A = 'the steward counts what he was given and reports it plainly to the owner every month without dressing the bad month up as a good one because the record is the relationship ';
const B = 'a child who sweeps the floor before being asked has already understood the thing his father was going to explain to him later that evening after supper was finished ';
const C = 'consider the manner in which an obligation undertaken voluntarily differs from one imposed externally and how that difference alters the disposition of the party who must discharge it ';
const D = 'the neighbour on the corner keeps his fence painted and nobody ever told him to do it and that is the whole of what we mean when we say a man tends his own ground ';

describe('the measure catches what it exists to catch', () => {
  it('scores identical bands at the top of the scale', () => {
    const m = measureDifferentiation(four(A.repeat(3), A.repeat(3), A.repeat(3), A.repeat(3)));
    expect(m.worst).toBe(1);
    for (const [x, y] of BAND_PAIRS) expect(m.pairs[`${x}~${y}`]).toBe(1);
  });

  it('scores genuinely different bands far below the ceiling', () => {
    const m = measureDifferentiation(four(A.repeat(3), B.repeat(3), C.repeat(3), D.repeat(3)));
    expect(m.worst).toBeLessThan(DIFF_CEILING);
  });

  it('catches a SHORT band wholly contained in a longer one', () => {
    // The reason overlap divides by the SMALLER set. A union denominator would
    // score a fully-duplicated short band as roughly half-different and pass it.
    const m = measureDifferentiation(four(A, A.repeat(4), C.repeat(3), D.repeat(3)));
    expect(m.pairs['child~youth'], 'a contained band is fully duplicated whatever the lengths').toBe(1);
  });

  it('does NOT punish bands for quoting the same verses', () => {
    // Every band quotes the same Scripture — it is the same lesson. Counting
    // quotations would condemn a well-differentiated lesson for carrying the
    // Word in all four versions, which is the opposite of the intent.
    const verse = ' "Charity suffereth long, and is kind" (1 Corinthians 13:4) ';
    const m = measureDifferentiation(four(
      A.repeat(3) + verse, B.repeat(3) + verse, C.repeat(3) + verse, D.repeat(3) + verse,
    ));
    expect(m.worst, 'shared quotations have leaked into the measure').toBeLessThan(DIFF_CEILING);
  });

  it('reports the offending pair by name rather than only a number', () => {
    const m = measureDifferentiation(four(A.repeat(3), A.repeat(3), C.repeat(3), D.repeat(3)));
    expect(duplicatedBands(m)).toContain('child~youth');
  });
});

describe('the measure, run on the real corpus', () => {
  const scan = scanDifferentiation(LIVING_LESSONS_MODULES);

  it('reads every lesson that carries all four bands', () => {
    expect(scan.measuredLessons).toBe(baseline.measuredLessons);
  });

  it('still catches a near-identical pair living in the real corpus', () => {
    // RE-ANCHORED 2026-09-18 (DR-0485). This check was pinned to ll173, whose
    // youth and teen bands were the same text. ll173 was re-authored the same
    // day and now measures 0.16 on that pair, which took the check with it —
    // exactly as the original comment said it would. The lesson: a live
    // proven-to-catch anchored to a defect we INTEND to fix has to be
    // re-anchored every time we fix one, and re-anchoring by hand is the point.
    // It is now pinned to the worst row the corpus still carries, so it keeps
    // proving the measure can see a real duplicate — and when the last one is
    // repaired this fails, and someone reads it and retires it deliberately
    // rather than a silent green standing in for a cleared debt.
    const worst = scan.rows.slice().sort((a, b) => b.worst - a.worst)[0];
    expect(worst, 'nothing in the corpus is being measured at all').toBeTruthy();
    expect(worst.worst, `the worst row left is ${worst.id} at ${worst.worst} — if the debt is cleared, retire this check`).toBeGreaterThanOrEqual(0.9);
  });

  it('records the repair: ll173 is under the ceiling and may not drift back', () => {
    // The debt shrank by one. Deleting the old check and recording nothing in
    // its place would leave the repair unwitnessed; this is the witness.
    const l173 = scan.rows.find((r) => r.id.startsWith('ll173-'));
    expect(l173, 'll173 is not being measured at all').toBeTruthy();
    expect(l173.worst, 'll173 has drifted back over the ceiling').toBeLessThan(DIFF_CEILING);
    expect(l173.id in baseline.duplicated, 'll173 is repaired but still recorded as debt — remove it').toBe(false);
  });

  it('a lesson that heals LEAVES the baseline in the same commit', () => {
    // Without this the baseline shrinks only when someone remembers. A padded
    // allowance nobody lowers becomes an exemption — the same discipline the
    // anchor gate enforces on its owed list.
    const { healed } = ratchetDifferentiation(scan, baseline);
    expect(healed, `re-authored and still recorded as debt:\n${healed.join('\n')}`).toEqual([]);
  });

  it('the healed check can see a re-authored lesson left in the file (proven-to-catch)', () => {
    // ll174 is a real lesson, measured, and under the ceiling. Recording it as
    // debt is exactly the stale entry this check exists to report.
    const id = scan.rows.find((r) => r.id.startsWith('ll174-')).id;
    const padded = { ...baseline, duplicated: { ...baseline.duplicated, [id]: { worst: 0.99, pairs: {} } } };
    expect(ratchetDifferentiation(scan, padded).healed).toContain(id);
  });

  it('reports a recorded id the corpus no longer carries, which can never heal', () => {
    // Found while re-anchoring: `healed` only ever walked the rows it MEASURED,
    // so an entry for a lesson that was renamed or removed was invisible to it
    // and would have sat in the file for ever. The first assertion is the
    // proven-to-catch; the second is the real baseline having none.
    const ghost = { ...baseline, duplicated: { ...baseline.duplicated, 'll999-a-lesson-that-does-not-exist': { worst: 0.99, pairs: {} } } };
    expect(ratchetDifferentiation(scan, ghost).stale).toContain('ll999-a-lesson-that-does-not-exist');
    expect(ratchetDifferentiation(scan, baseline).stale, 'the baseline records a lesson the corpus does not carry').toEqual([]);
  });

  it('adds no NEW lesson to the duplication debt', () => {
    const { fresh } = ratchetDifferentiation(scan, baseline);
    expect(fresh, `bands newly duplicated:\n${fresh.join('\n')}`).toEqual([]);
  });

  it('keeps the recorded debt from growing', () => {
    expect(scan.rows.filter((r) => r.over.length).length).toBeLessThanOrEqual(baseline.lessonsDuplicated);
  });

  it('holds both lessons written the day this gate was built under the ceiling', () => {
    for (const p of ['ll174-', 'll175-']) {
      const r = scan.rows.find((x) => x.id.startsWith(p));
      expect(r.worst, `${p} is over the ceiling`).toBeLessThan(DIFF_CEILING);
    }
  });
});

describe('the helpers behave', () => {
  it('produces no shingle from text shorter than the window', () => {
    expect(shingles('too short').size).toBe(0);
  });

  it('scores an empty set as no overlap rather than throwing', () => {
    expect(overlap(new Set(), shingles(A))).toBe(0);
  });

  it('returns nothing for a lesson missing a band', () => {
    expect(measureDifferentiation({ id: 'x', levels: { child: A, teen: B, senior: C } })).toBe(null);
  });
});
