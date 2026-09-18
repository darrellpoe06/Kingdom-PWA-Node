// =============================================================================
// course-band-coverage — do the OTHER courses carry the four age bands?
// =============================================================================
// Darrell 2026-09-18: "Fill up the lessons and don't stop or not always do all
// of these lessons for each group asap." His words were about the lessons and
// the groups, not about one series.
//
// WHAT WAS NEVER LOOKED AT. Three ratchets hold the four-band requirement:
// full-levels (share of the adult lesson), reading-level (the FK ladder) and
// band-differentiation (four versions rather than one repeated). All three
// scan LIVING_LESSONS_MODULES and nothing else. Measured 2026-09-18 across the
// whole catalog: 211 lessons live OUTSIDE that series, ZERO of them carry all
// four authored bands, and 43 carry no authored band at all — whoever opens
// one gets the single `lesson` field through resolveForAge's fallback, and no
// gate in the house has ever said so.
//
// AND THE COUNT ALONE WOULD LIE — the second measure exists because the first
// one over-claimed. "No authored band" does NOT mean "adult words served to a
// child": measured the same day, `little-learners` reads at grade 0.3 and
// `mathematics` at 1.6 in that single field — those two are already written
// for the youngest readers and the missing bands are a LABEL gap, not a
// register gap. `broadcast` reads at 12.4, which is the real defect. So this
// module measures the grade of the text actually served, counts the bandless
// lessons that read ABOVE the adult-register ceiling, and ratchets that number
// too. Naming 43 lessons as one undifferentiated debt would have been the
// impression this file was written to replace (DR-0076 §1 §4).
//
// That is the defect L178 is about, committed by the instruments: the need is
// real, the gate reports nothing, and a problem no instrument reports reads as
// a problem that does not exist. This module is the instrument. It does not
// impose the Living-Lessons floors on a course lesson — a paced course lesson
// is a different artifact and that would be a decision, not a measurement.
// What it does is COUNT, honestly, and refuse to let the count get worse.
//
// SHRINK-ONLY, from the first commit. The baseline records the debt as it
// actually is today. A new lesson with no bands where its course already has
// some FAILS; the recorded numbers may only fall.

import { fleschKincaidGrade, ourProseOnly } from './reading-level.mjs';

export const BANDS = ['child', 'youth', 'teen', 'senior'];

/**
 * Above this grade, the single `lesson` field is genuinely adult-register — a
 * bandless lesson at grade 12 hands twelfth-grade prose to a nine-year-old,
 * while a bandless lesson at grade 1 does not. Ninth grade is the line: it is
 * the point past which the text is no longer reachable by the youth band the
 * ladder tops out at, so the fallback stops being survivable.
 */
export const ADULT_REGISTER_CEILING = 9.0;

/**
 * The grade of the text a reader with no band actually receives. Quoted spans
 * are stripped first for the same reason the reading-level ratchet strips them:
 * verbatim Scripture is not ours to simplify and must not be scored against
 * the author. Returns null when there is no prose to measure.
 */
export function servedGrade(module) {
  const raw = module && typeof module.lesson === 'string' ? module.lesson : '';
  const fk = fleschKincaidGrade(ourProseOnly(raw));
  return fk === null ? null : Math.round(fk * 10) / 10;
}

/** The middle value of a list of grades, or null for an empty list. */
export function median(values) {
  const nums = (Array.isArray(values) ? values : []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  const m = nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
  return Math.round(m * 10) / 10;
}

/** How many of the four bands does this module actually carry? */
export function bandsPresent(module) {
  const lv = module && module.levels && typeof module.levels === 'object' ? module.levels : {};
  return BANDS.filter((b) => typeof lv[b] === 'string' && lv[b].trim().length > 0);
}

/**
 * Walk one course's schedule rows into the lesson records underneath them.
 * Courses hand back rows in more than one shape (`{ module }` or the module
 * itself), and a course whose builder throws is reported as zero rather than
 * crashing the scan — an unreadable course is a finding, not an exception.
 */
export function lessonsOfCourse(course) {
  let rows = [];
  try { rows = course && typeof course.buildScheduleRows === 'function' ? course.buildScheduleRows() : []; } catch (_) { rows = []; }
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => (r && (r.module || r)))
    .filter((m) => m && typeof m === 'object' && m.id && (m.lesson || m.levels));
}

/**
 * Count band coverage across every course in the catalog, skipping the ids the
 * Living-Lessons ratchets already own so the two measures never double-count.
 * Each course also reports how many of its bandless lessons read ABOVE the
 * adult-register ceiling, and the median grade of the ones that are bandless —
 * the distinction between a missing label and adult prose served to a child.
 */
export function scanCourseBands(catalog, ownedIds = new Set(), { ceiling = ADULT_REGISTER_CEILING } = {}) {
  const courses = {};
  let total = 0; let allFour = 0; let adultOnly = 0; let adultRegister = 0;
  for (const c of Array.isArray(catalog) ? catalog : []) {
    if (!c || !c.key) continue;
    let lessons = 0; let four = 0; let bare = 0; let over = 0;
    const grades = [];
    for (const m of lessonsOfCourse(c)) {
      if (ownedIds.has(m.id)) continue;
      lessons += 1; total += 1;
      const n = bandsPresent(m).length;
      if (n === 4) { four += 1; allFour += 1; }
      if (n === 0) {
        bare += 1; adultOnly += 1;
        const g = servedGrade(m);
        if (g !== null) {
          grades.push(g);
          if (g > ceiling) { over += 1; adultRegister += 1; }
        }
      }
    }
    if (lessons) {
      courses[c.key] = { lessons, allFour: four, adultOnly: bare, adultRegister: over };
      const med = median(grades);
      if (med !== null) courses[c.key].bandlessGrade = med;
    }
  }
  return { total, allFour, adultOnly, adultRegister, courses };
}

/** Which courses got WORSE than the baseline recorded? */
export function ratchetCourseBands(scan, baseline) {
  const known = (baseline && baseline.courses) || {};
  const worse = [];
  for (const [key, row] of Object.entries(scan.courses)) {
    const was = known[key];
    if (!was) { worse.push(`${key}: not recorded — add it to the baseline with its real numbers`); continue; }
    if (row.adultOnly > was.adultOnly) worse.push(`${key}: ${row.adultOnly} adult-only lessons, baseline recorded ${was.adultOnly}`);
    if (row.allFour < was.allFour) worse.push(`${key}: ${row.allFour} four-band lessons, baseline recorded ${was.allFour}`);
    // The register dimension. A baseline row written before this measure
    // existed carries no number, and an absent number is not a licence — it is
    // reported as unrecorded, the same way an unrecorded course is.
    if (was.adultRegister === undefined) worse.push(`${key}: no adultRegister recorded — re-measure and record it`);
    else if (row.adultRegister > was.adultRegister) worse.push(`${key}: ${row.adultRegister} bandless lessons above the adult-register ceiling, baseline recorded ${was.adultRegister}`);
  }
  // A recorded course the catalog no longer carries can never heal, so it is
  // reported rather than left to inflate the totals for ever (the stale-entry
  // lesson from the band-differentiation ratchet).
  const stale = Object.keys(known).filter((k) => !(k in scan.courses));
  return { worse, stale };
}

export function buildCourseBandBaseline(scan) {
  return {
    note: 'Shrink-only debt. Measured 2026-09-18: the four-band requirement was never applied outside the Living Lessons series. A course that gets WORSE fails the build; these numbers may only improve. Authoring bands for a course lesson lowers its adultOnly and raises its allFour, and the baseline is lowered in the same commit. adultRegister counts the BANDLESS lessons whose single lesson field reads above grade 9 — the ones where the fallback really does hand adult prose to a child; bandlessGrade is the median grade of a course bandless lessons, recorded so a low number is never mistaken for a high one.',
    total: scan.total,
    allFour: scan.allFour,
    adultOnly: scan.adultOnly,
    adultRegister: scan.adultRegister,
    courses: Object.fromEntries(Object.entries(scan.courses).sort(([a], [b]) => a.localeCompare(b))),
  };
}
