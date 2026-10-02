// @vitest-environment node
// =============================================================================
// ALL FOUR AGE BANDS, AUTHORED — GROUP A OF THE BACKFILL (DR-0692)
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// The courses in COURSES below carried no age band at all (or, for ai wk3,
// only teen and senior). Each lesson now carries child, youth, teen and senior,
// each a faithful retelling of that lesson for that reader. This file holds
// the courses to it, beyond the house band gates course-band-coverage.test.js
// already runs on every four-band lesson:
//   - every lesson of the course carries all four (the course is whole);
//   - every quoted span is the KJV verse it names (the repo's verse gate);
//   - our voice names Yahweh, never the generic term, outside a quotation, and
//     never capitalizes the adversary;
//   - the renderer drops no word of any band (the L178 defect class).
// A course is added to COURSES in the same commit that bands it.
import { describe, it, expect } from 'vitest';
import { LEARN_CATALOG } from '../lib/learn-catalog.js';
import { lessonsOfCourse, bandsPresent, fourBandGateFaults, BANDS } from '../../../scripts/course-band-coverage.mjs';
import { scanQuotedVerses, describeFault } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const COURSES = ['ai', 'little-learners', 'mathematics', 'development', 'rent-to-own-business'];

const lessonsOf = (key) => {
  const c = LEARN_CATALOG.find((x) => x.key === key);
  if (!c) throw new Error(`course ${key} is gone — this file measures nothing`);
  return lessonsOfCourse(c);
};
const ourVoice = (t) => String(t || '').replace(/"[^"]*"/g, ' ');

for (const key of COURSES) {
  describe(`${key}: all four bands, authored and sound`, () => {
    const lessons = lessonsOf(key);

    it('every lesson carries child, youth, teen and senior', () => {
      expect(lessons.length).toBeGreaterThan(0);
      for (const m of lessons) expect(bandsPresent(m), m.id).toEqual(BANDS);
    });

    it('every lesson passes the house band gates', () => {
      const faults = lessons.flatMap((m) => fourBandGateFaults(m).map((f) => `${m.id}: ${f}`));
      expect(faults, faults.join('\n')).toEqual([]);
    });

    it('every quoted span in every band is the KJV verse it names', () => {
      const bandsOnly = lessons.map((m) => ({ id: m.id, lesson: BANDS.map((b) => m.levels[b]).join('\n\n') }));
      const scan = scanQuotedVerses(bandsOnly, quotedTexts);
      expect(scan.faults.map(describeFault)).toEqual([]);
      expect(scan.spans).toBeGreaterThan(0);
    });

    it('our voice says Yahweh, not the generic term, and never capitalizes the adversary', () => {
      for (const m of lessons) for (const b of BANDS) {
        const o = ourVoice(m.levels[b]);
        expect(o, `${m.id} ${b}`).not.toMatch(/\bGod\b/);
        expect(o, `${m.id} ${b}`).not.toMatch(/\b(Satan|Lucifer|The devil|The Adversary|The Accuser)\b/);
      }
    });

    it('the renderer keeps every word of every band', () => {
      for (const m of lessons) for (const b of BANDS) {
        const text = m.levels[b];
        const flat = JSON.stringify(formatLessonText(text)).replace(/[^A-Za-z’' ]/g, ' ');
        const missing = (text.match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
        expect(missing, `${m.id} ${b}`).toEqual([]);
      }
    });
  });
}

describe('proven-to-catch (DR-0076 §3)', () => {
  const m = lessonsOf(COURSES[0])[0];

  it('a band quoting a verse with one word changed fails the verse gate', () => {
    const broken = { id: m.id, lesson: '"Prove all things; hold fast that which is great" (1 Thessalonians 5:21)' };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('the generic term planted in a band, outside a quotation, is seen', () => {
    expect(ourVoice(`${m.levels.child} God is good.`)).toMatch(/\bGod\b/);
    expect(ourVoice('"God is love." (1 John 4:8)')).not.toMatch(/\bGod\b/);
  });

  it('a lesson that drops a band is not whole', () => {
    const levels = { ...m.levels };
    delete levels.youth;
    expect(bandsPresent({ ...m, levels })).not.toEqual(BANDS);
  });
});
