// =============================================================================
// four-band-ladder — the measure every catalog course lesson answers to once it
// carries all four age bands (child, youth, teen, senior).
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// One function, so the ten courses banded in this pass are held to ONE ladder
// rather than ten hand-copied variants that drift. It is the same ladder the
// rebuilt 1619 course pins (historical-research-course.test.js) and the same
// gates the NAS lesson builder runs on a draft (band_gates.mjs), stated as the
// list of faults a lesson carries, so an empty list is the pass:
//
//   * every band present and carrying the lesson: child at least half of the
//     adult prose, youth / teen / senior at least 0.6 (quotations excluded on
//     both sides — the Word is carried, not counted);
//   * the reading ladder rises: child < youth < teen < senior, the child band
//     under the new-lesson ceiling, teen and senior under their ceilings;
//   * four versions, not one repeated: no band a near copy of another or of
//     the adult lesson;
//   * each band names its lesson in its opening (title-in-narrative);
//   * each band renders without losing a word (the L178 defect class).
import { ourProseOnly, fleschKincaidGrade, NEW_LESSON_CHILD_CEILING } from '../../../../scripts/reading-level.mjs';
import { shingles, overlap } from '../../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../../scripts/title-in-narrative.mjs';
import { formatLessonText } from '../../lib/lesson-format.js';

export const FOUR_BANDS = ['child', 'youth', 'teen', 'senior'];
export const LADDER = {
  childCeiling: NEW_LESSON_CHILD_CEILING,
  teenCeiling: 6.0,
  seniorCeiling: 10.0,
  floor: { child: 0.5, youth: 0.6, teen: 0.6, senior: 0.6 },
  nearCopy: 0.25,
};

export const fk = (t) => fleschKincaidGrade(ourProseOnly(String(t || '')));
export const words = (t) => (ourProseOnly(String(t || '')).match(/[A-Za-z’']+/g) || []).length;
export const overlapOf = (a, b) => overlap(shingles(ourProseOnly(String(a || ''))), shingles(ourProseOnly(String(b || ''))));

/** Every way one lesson falls short of the four-band ladder. Empty = passes. */
export function fourBandFaults(m, ladder = LADDER) {
  const out = [];
  const lv = (m && m.levels) || {};
  const missing = FOUR_BANDS.filter((b) => typeof lv[b] !== 'string' || !lv[b].trim());
  if (missing.length) return missing.map((b) => `${b}: missing`);
  const adult = words(m.lesson);
  for (const b of FOUR_BANDS) {
    const share = adult ? words(lv[b]) / adult : 0;
    if (share < ladder.floor[b]) out.push(`${b}: carries ${share.toFixed(2)} of the adult lesson, floor ${ladder.floor[b]}`);
  }
  const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(lv[b])]));
  for (let i = 0; i + 1 < FOUR_BANDS.length; i += 1) {
    const [a, b] = [FOUR_BANDS[i], FOUR_BANDS[i + 1]];
    if (!(g[a] < g[b])) out.push(`ladder: ${a} ${g[a]} does not read easier than ${b} ${g[b]}`);
  }
  if (g.child > ladder.childCeiling) out.push(`child: grade ${g.child} over ${ladder.childCeiling}`);
  if (g.teen > ladder.teenCeiling) out.push(`teen: grade ${g.teen} over ${ladder.teenCeiling}`);
  if (g.senior > ladder.seniorCeiling) out.push(`senior: grade ${g.senior} over ${ladder.seniorCeiling}`);
  for (let i = 0; i < FOUR_BANDS.length; i += 1) {
    const a = FOUR_BANDS[i];
    if (overlapOf(lv[a], m.lesson) > ladder.nearCopy) out.push(`${a}~adult: near copy`);
    for (let j = i + 1; j < FOUR_BANDS.length; j += 1) {
      const b = FOUR_BANDS[j];
      if (overlapOf(lv[a], lv[b]) > ladder.nearCopy) out.push(`${a}~${b}: near copy`);
    }
  }
  for (const b of FOUR_BANDS) {
    if (!namesItsLesson(m.title, lv[b])) out.push(`${b}: does not name its lesson in its opening`);
    const flat = JSON.stringify(formatLessonText(lv[b])).replace(/[^A-Za-z’' ]/g, ' ');
    const lost = (lv[b].match(/[A-Za-z’']{4,}/g) || []).filter((w) => !flat.includes(w));
    if (lost.length) out.push(`${b}: renders without ${lost.slice(0, 3).join(', ')}`);
  }
  return out;
}
