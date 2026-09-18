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

  it('catches the lesson that prompted this gate', () => {
    // ll173's youth and teen bands are the same text. If this ever stops
    // reporting, either the lesson was genuinely re-authored — in which case it
    // leaves the baseline and this check is updated deliberately — or the
    // measure has gone blind.
    const l173 = scan.rows.find((r) => r.id.startsWith('ll173-'));
    expect(l173, 'll173 is not being measured at all').toBeTruthy();
    expect(l173.pairs['youth~teen'], 'll173 youth~teen is no longer reported as duplicated').toBeGreaterThanOrEqual(0.9);
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
