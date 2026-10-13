// =============================================================================
// Four bands on every lesson of a banded course, and every band HOLDS
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// course-band-coverage counts how many catalog lessons carry four bands. A
// count cannot tell a real child band from a copied paragraph, so every course
// that reaches four bands on every lesson is listed here and held to the same
// measures the Living Lessons series is held to, applied to every band:
//
//   present     child, youth, teen and senior all carry text
//   full        each band carries at least the floor share of the adult
//               lesson's own prose (full-levels, DR-0418), where the lesson
//               has an adult text to measure against
//   ordered     child reads no harder than youth, youth no harder than teen,
//               teen no harder than senior (the reading-level ladder)
//   child       the child band reads at or under the new-lesson ceiling
//   different   no two bands share half their 8-word shingles
//               (band-differentiation, DR-0544)
//   named       every band names its own lesson in its opening
//               (title-in-narrative)
//   the Word    every quotation followed by a reference is that verse,
//               verbatim from app/public/bible/kjv, and no name of the Godhead
//               is lowered in our voice (quoted-verse-is-the-verse)
//
// A course is added to BANDED_COURSES in the same commit that bands it. Zero is
// the committed number of failures: there is no baseline to hide in.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { lessonsOfCourse, bandsPresent } from '../../../scripts/course-band-coverage.mjs';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import {
  measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING,
} from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands } from '../../../scripts/band-differentiation.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';

const BANDED_COURSES = [
  'project-management',
];

const BANDS = ['child', 'youth', 'teen', 'senior'];
const bandTexts = (m) => BANDS
  .filter((b) => m.levels && typeof m.levels[b] === 'string')
  .map((b) => [`levels.${b}`, m.levels[b]]);

/** Every way one lesson's bands fail to hold, as readable lines. */
function bandFaults(m) {
  const out = [];
  const present = bandsPresent(m);
  const missing = BANDS.filter((b) => !present.includes(b));
  if (missing.length) out.push(`${m.id}: missing ${missing.join(', ')}`);
  const full = measureFullness(m);
  const short = shortBands(full).filter((b) => !missing.includes(b));
  for (const b of short) out.push(`${m.id}: ${b} carries ${full.bands[b].share} of the adult lesson`);
  const rl = measureLesson(m);
  if (isInverted(rl)) out.push(`${m.id}: reading grades out of order ${BANDS.map((b) => `${b} ${rl.bands[b] ? rl.bands[b].authored : '-'}`).join(', ')}`);
  if (breachesChildCeiling(rl, NEW_LESSON_CHILD_CEILING)) out.push(`${m.id}: child reads at grade ${rl.bands.child.authored}, over ${NEW_LESSON_CHILD_CEILING}`);
  for (const pair of duplicatedBands(measureDifferentiation(m))) out.push(`${m.id}: ${pair} repeat each other`);
  for (const b of unnamedBands(m)) out.push(`${m.id}: ${b} does not name its lesson in its opening`);
  for (const f of scanQuotedVerses([m], bandTexts).faults) out.push(describeFault(f));
  return out;
}

const lessonsOf = (key) => lessonsOfCourse(LEARN_CATALOG.find((c) => c.key === key));

describe('every lesson of a banded course carries four bands that hold', () => {
  for (const key of BANDED_COURSES) {
    it(`${key}: every band present, full, ordered, distinct, named, and true to the Word`, () => {
      const lessons = lessonsOf(key);
      expect(lessons.length, `${key} walked no lessons`).toBeGreaterThan(0);
      const faults = lessons.flatMap(bandFaults);
      expect(faults, faults.join('\n')).toEqual([]);
    });
  }
});

describe('proven-to-catch (DR-0076 sec.3), on copies of a real banded lesson', () => {
  const real = lessonsOf(BANDED_COURSES[0])[0];
  const withBand = (b, text) => ({ ...real, levels: { ...real.levels, [b]: text } });

  it('the real lesson passes, so a failure below is the break and not noise', () => {
    expect(bandFaults(real)).toEqual([]);
  });

  it('sees a missing band', () => {
    const { youth, ...rest } = real.levels;
    expect(bandFaults({ ...real, levels: rest }).join(' ')).toMatch(/missing youth/);
  });

  it('sees a child band written above the child ceiling', () => {
    const hard = `${real.title}. ${'Notwithstanding the considerable institutional complexity, organizational accountability necessitates comprehensive documentation. '.repeat(12)}`;
    expect(bandFaults(withBand('child', hard)).join(' ')).toMatch(/child reads at grade/);
  });

  it('sees a band copied from another band', () => {
    expect(bandFaults(withBand('youth', real.levels.teen)).join(' ')).toMatch(/youth~teen repeat each other/);
  });

  it('sees a band that does not name its lesson', () => {
    expect(bandFaults(withBand('child', `Once upon a time there was a boy. ${real.levels.child}`.replace(/^/, 'Zz. '.repeat(60)))).join(' ')).toMatch(/child does not name its lesson/);
  });

  it('sees a quotation that is not the verse it names', () => {
    const wrong = `${real.levels.child} "This man began to build, and was able to finish" (Luke 14:30).`;
    expect(bandFaults(withBand('child', wrong)).join(' ')).toMatch(/does not contain what we quote/);
  });

  it('sees a name of the Godhead lowered in our voice', () => {
    expect(bandFaults(withBand('child', `${real.levels.child} We thank yahweh.`)).join(' ')).toMatch(/lower case/);
  });
});
