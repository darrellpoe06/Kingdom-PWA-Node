// =============================================================================
// Living Lessons — the ADULT band debt, measured and ratcheted
// =============================================================================
// Darrell, 2026-09-05: "Do the lessons actually adjust based on the age of the
// readers and the selected age groups?" then "Has the last 30 lessons adjusted
// based on the demographics?" and finally "if lessons don't have all age groups
// then add what's needed... 48 needs to be done".
//
// THE MEASURED ANSWER, per age band, across the whole series (not a claim — this
// file re-derives it every run):
//   • child (6-10)   0 gaps — every lesson has authored child prose.
//   • youth (11-14)  0 gaps.
//   • teen (15-17)   0 gaps.
//   • senior (65+)   0 gaps.
//   • adult (18-64)  48 gaps when first measured; 31 now, and falling. Each one
//                    paid off is a full adult-depth lesson authored at adult
//                    register, not a fallback tweak. Seventeen are done: ll78, ll80,
//                    and ll81 through ll95.
//
// WHAT THE ADULT GAP ACTUALLY IS. It is NOT a blank screen and NOT a fragment.
// 48 lessons (ll78 onward) were authored with child/teen/senior levels and no
// base `lesson` and no `levels.standard`, so learn-framework's emergency
// fallback serves the ADULT band the SENIOR text. Every word is real and the
// coverage is full; what the adult band does not get is prose written in its own
// register (AGE_BANDS: adult tone 'plain', senior tone 'respectful') — the
// widest audience in the series reading text tuned for 65+. Chunking still
// adapts (200 words per segment for adult vs 120 for senior), so the pacing
// layer works; only the text does not.
//
// THE RATCHET. The 48 are listed explicitly below. The list MAY ONLY SHRINK:
//   * a NEW lesson without adult-depth prose fails this build outright;
//   * an id in the list that has since been given a base `lesson` fails too,
//     so the list can never quietly overstate the debt;
//   * child / youth / teen / senior remain HARD INVARIANTS at zero.
// This is the same discipline that closed the teen debt in
// living-lessons-age-appropriateness.test.js, applied to the band it missed.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { AGE_BANDS, resolveForAge } from '../lib/learn-framework.js';

// A lesson serves the adult band its own depth when resolveForAge('adult')
// lands on 'standard' — i.e. a base `lesson` or an authored levels.standard.
const servesAdult = (m) => resolveForAge(m, 'adult', null).levelId === 'standard';

// The recorded debt. Shrink this list as adult prose is authored; never grow it.
const ADULT_DEBT = [
  'll96', 'll97', 'll98',
  'll99', 'll100', 'll101', 'll102', 'll103', 'll104', 'll105', 'll106', 'll107',
  'll108', 'll109', 'll110', 'll111', 'll112', 'll113', 'll114', 'll115', 'll116',
  'll117', 'll118', 'll119', 'll120', 'll121', 'll122', 'll123', 'll124', 'll125',
  'll126',
];

const numOf = (id) => id.split('-')[0];

describe('every band except adult is a hard invariant at zero', () => {
  for (const band of AGE_BANDS.filter((b) => b.id !== 'adult')) {
    it(`no lesson falls back to another band's prose for ${band.label} (${band.range})`, () => {
      const gaps = LIVING_LESSONS_MODULES
        .filter((m) => resolveForAge(m, band.id, null).levelId !== band.depth)
        .map((m) => numOf(m.id));
      expect(gaps, `${band.label} must always read prose authored for it`).toEqual([]);
    });
  }
});

describe('the adult band debt is measured, listed, and may only shrink', () => {
  const gaps = LIVING_LESSONS_MODULES.filter((m) => !servesAdult(m)).map((m) => numOf(m.id));

  it('records the real, current number so the claim is never taken on trust', () => {
    // If this number changes, the list below must change with it — which is the
    // point. A silently drifting count is how a debt becomes invisible.
    expect(gaps.length).toBe(ADULT_DEBT.length);
  });

  it('every lesson missing adult prose is on the recorded list — no NEW debt', () => {
    const unlisted = gaps.filter((id) => !ADULT_DEBT.includes(id));
    expect(
      unlisted,
      `these lessons have no adult-depth prose and are not on the recorded debt list.\n` +
      `Author a base \`lesson\` for them, or add them here with a reason: ${unlisted.join(', ')}`,
    ).toEqual([]);
  });

  it('no id on the list has quietly been paid off without being removed', () => {
    const stale = ADULT_DEBT.filter((id) => !gaps.includes(id));
    expect(
      stale,
      `these ids now HAVE adult prose and must be removed from ADULT_DEBT: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  it('no id on the list is fictional', () => {
    const real = new Set(LIVING_LESSONS_MODULES.map((m) => numOf(m.id)));
    const ghosts = ADULT_DEBT.filter((id) => !real.has(id));
    expect(ghosts, `ADULT_DEBT names lessons that do not exist: ${ghosts.join(', ')}`).toEqual([]);
  });

  it('the newest lesson does not add to the debt', () => {
    const newest = LIVING_LESSONS_MODULES[LIVING_LESSONS_MODULES.length - 1];
    expect(servesAdult(newest), `${newest.id} must carry adult-depth prose`).toBe(true);
  });
});

describe('the fallback is honest while the debt is being paid', () => {
  it('a lesson on the debt list still serves the adult band real text — never a blank', () => {
    for (const m of LIVING_LESSONS_MODULES.filter((x) => !servesAdult(x))) {
      const r = resolveForAge(m, 'adult', null);
      expect(r.text.length, `${m.id} serves the adult band empty text`).toBeGreaterThan(400);
      expect(r.levelId, 'the fallback should land on senior, the fullest authored text').toBe('senior');
    }
  });

  // A SECOND, SEPARATE FINDING, surfaced while measuring the first and recorded
  // rather than quietly folded into it. Two lessons — ll78 (581/730/745 chars)
  // and ll85 (1,468) — were THIN at every band, so the adult fallback handed
  // over a short text because the LESSON was short. Darrell named this class on
  // 2026-08-25 ("THE SHORT LESSON IS THE ONLY PROBLEM"), and the fix was fuller
  // authoring rather than a fallback change. BOTH now carry full adult prose,
  // so this list is empty — and it must stay empty.
  const THIN_AT_EVERY_BAND = [];

  it('the thin-lesson list is real, and does not grow', () => {
    const thin = LIVING_LESSONS_MODULES
      .filter((m) => !servesAdult(m) && resolveForAge(m, 'adult', null).text.length < 1500)
      .map((m) => numOf(m.id));
    expect(thin.sort(), 'a lesson became thin, or a thin one was fixed without updating this list')
      .toEqual([...THIN_AT_EVERY_BAND].sort());
  });

  it('the pacing layer adapts even where the text does not', () => {
    const adult = AGE_BANDS.find((b) => b.id === 'adult');
    const senior = AGE_BANDS.find((b) => b.id === 'senior');
    expect(adult.tone).not.toBe(senior.tone);
    expect(adult.segmentMinutes).not.toBe(senior.segmentMinutes);
  });
});
