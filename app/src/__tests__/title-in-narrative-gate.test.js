// @vitest-environment node
// =============================================================================
// The title in the NARRATIVE — measured, ratcheted, and honest about the debt
// =============================================================================
// Darrell 2026-09-17: the title "should stay at the top of the presentations and
// as well as in the actual narrative so that people can remember what we're
// talking about."
//
// The display half is gated in the-title-stays-in-view.test.jsx. This is the
// text half, and it ships as a RATCHET rather than a sweep because the debt is
// large and the fix is authored per band: 468 of 652 bands open without naming
// their own lesson. Prefixing 468 authored prose strings by script would be the
// same class of error as a blind God->Yahweh sweep — a counter satisfied and
// good writing damaged. So: a NEWLY-unnamed band fails the build, recorded
// entries may only shrink, and each one is written for its age as the
// full-levels pass reaches it.
//
// L90 IS THE FIRST LESSON DONE BOTH WAYS and is deliberately NOT in the
// baseline — its four bands each carry the title in their own register rather
// than as a pasted prefix:
//   child   "NO RESPECTER OF PERSONS - that means Yahweh has no favourites."
//   teen    "...keep that title in front of you, because every movement below
//            is one of those three."
// If a future edit strips those, this gate reports L90 as a FRESH offender.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/title-in-narrative-baseline.json';
import {
  TITLE_BANDS, OPENING_WINDOW, titleKeywords, namesItsLesson,
  unnamedBands, scanTitleInNarrative, ratchetTitleInNarrative,
} from '../../../scripts/title-in-narrative.mjs';

const scan = scanTitleInNarrative(LIVING_LESSONS_MODULES);

describe('the measure itself is sound before anything is measured with it', () => {
  it('a band that opens with its lesson name passes; one that does not, fails', () => {
    const title = 'No Respecter of Persons — The Image, the Unrighteous Decree, and the Judge';
    expect(namesItsLesson(title, 'NO RESPECTER OF PERSONS - the image, the unrighteous decree, and the Judge of all the earth. A man walking a march...')).toBe(true);
    expect(namesItsLesson(title, 'A man walking a voting-rights march laid out a heavy, impassioned argument about the ballot...')).toBe(false);
  });

  it('it reads only the OPENING, so a title buried deep does not count', () => {
    const title = 'Bodybuilding Christ';
    const buried = `${'filler words to push it past the window. '.repeat(20)}bodybuilding christ`;
    expect(buried.length).toBeGreaterThan(OPENING_WINDOW);
    expect(namesItsLesson(title, buried)).toBe(false);
    expect(namesItsLesson(title, `Bodybuilding Christ. ${buried}`)).toBe(true);
  });

  it('case, punctuation and the em-dash do not decide the answer', () => {
    const title = 'The Energy You Were Given';
    for (const open of ['THE ENERGY YOU WERE GIVEN —', 'the energy you were given:', 'The Energy You Were Given.']) {
      expect(namesItsLesson(title, `${open} and here is the lesson`), open).toBe(true);
    }
  });

  it('an unmeasurable title is never reported as a gap', () => {
    // A title made only of stop-words has no identifying words, so claiming its
    // band "does not name it" would be a finding the measure cannot support.
    expect(titleKeywords('The One Of Them')).toEqual([]);
    expect(namesItsLesson('The One Of Them', 'anything at all')).toBe(true);
  });

  it('a MISSING band is full-levels debt, not this gate\'s to report', () => {
    const fake = { id: 'x', title: 'Bodybuilding Christ', levels: { child: 'Bodybuilding Christ...' } };
    expect(unnamedBands(fake)).toEqual([]);
  });
});

describe('THE LIVE SERIES — measured, not asserted', () => {
  it('the committed baseline is the REAL debt, not a painted number', () => {
    const ids = Object.keys(scan.unnamed).sort();
    expect(ids).toEqual(Object.keys(baseline.unnamed).sort());
    expect(scan.bandsUnnamed).toBe(baseline.bandsUnnamed);
    expect(scan.lessonsUnnamed).toBe(baseline.lessonsUnnamed);
  });

  it('no band is newly unnamed — the ratchet', () => {
    const r = ratchetTitleInNarrative(scan, baseline);
    expect(
      r.fresh,
      `these bands no longer name their own lesson near the start and are not recorded debt:\n${r.fresh.join('\n')}`,
    ).toEqual([]);
  });

  it('reports healing, so the baseline can be shrunk deliberately', () => {
    const r = ratchetTitleInNarrative(scan, baseline);
    expect(
      r.healed,
      `these bands NOW name their lesson — remove them from the baseline:\n${r.healed.join('\n')}`,
    ).toEqual([]);
  });

  it('every recorded id is a real lesson, and every recorded band is a real band', () => {
    const ids = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
    const stale = Object.keys(baseline.unnamed).filter((id) => !ids.has(id));
    expect(stale, `baseline ids no longer in the series: ${stale.join(', ')}`).toEqual([]);
    const badBands = [];
    for (const [id, bands] of Object.entries(baseline.unnamed)) {
      for (const b of bands) if (!TITLE_BANDS.includes(b)) badBands.push(`${id} :: ${b}`);
    }
    expect(badBands).toEqual([]);
  });

  it('PROVEN-TO-CATCH: a band stripped of its lesson name is reported fresh', () => {
    // The gate is only worth its green if it goes red. L90 names its lesson in
    // all four bands; strip the child band's opening in a COPY and the ratchet
    // must report it — if this ever passes, the ratchet is decoration.
    const l90 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll90-no-respecter'));
    expect(l90, 'L90 must exist').toBeTruthy();
    expect(unnamedBands(l90), 'L90 should name its lesson in every band').toEqual([]);
    const tampered = LIVING_LESSONS_MODULES.map((m) => (m === l90
      ? { ...m, levels: { ...m.levels, child: 'A man walking in a march about voting made a strong case about the ballot and the courts.' } }
      : m));
    const r = ratchetTitleInNarrative(scanTitleInNarrative(tampered), baseline);
    expect(r.fresh).toContain(`${l90.id} :: child`);
  });
});

describe('L90 is the first lesson done both ways, and says so in each register', () => {
  const l90 = LIVING_LESSONS_MODULES.find((m) => m.id.startsWith('ll90-no-respecter'));

  it('all four bands open by naming the lesson', () => {
    for (const band of TITLE_BANDS) {
      expect(namesItsLesson(l90.title, l90.levels[band]), `${band} does not name its lesson`).toBe(true);
    }
  });

  it('and each one does it in ITS OWN register, not as a pasted prefix', () => {
    // The child is TOLD what the phrase means; the teen is told why to hold it.
    // If these ever collapse into an identical prefix across four bands, the
    // thing Darrell asked for (the reader remembering what he is in) has been
    // replaced by a counter being satisfied.
    expect(l90.levels.child).toMatch(/that means Yahweh has no favourites/);
    expect(l90.levels.teen).toMatch(/keep that title in front of you/i);
    expect(l90.levels.child.slice(0, 220)).not.toBe(l90.levels.teen.slice(0, 220));
    expect(l90.levels.youth.slice(0, 220)).not.toBe(l90.levels.teen.slice(0, 220));
  });
});
