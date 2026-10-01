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

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fleschKincaidGrade, ourProseOnly, measureLesson, NEW_LESSON_CHILD_CEILING } from './reading-level.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from './full-levels.mjs';
import { measureDifferentiation, DIFF_CEILING } from './band-differentiation.mjs';
import { namesItsLesson } from './title-in-narrative.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

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
  const missing = {};
  let total = 0; let allFour = 0; let adultOnly = 0; let adultRegister = 0;
  for (const c of Array.isArray(catalog) ? catalog : []) {
    if (!c || !c.key) continue;
    let lessons = 0; let four = 0; let bare = 0; let over = 0;
    const grades = [];
    for (const m of lessonsOfCourse(c)) {
      if (ownedIds.has(m.id)) continue;
      lessons += 1; total += 1;
      const n = bandsPresent(m).length;
      if (n === 4) { four += 1; allFour += 1; } else (missing[c.key] = missing[c.key] || []).push(m.id);
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
  return { total, allFour, adultOnly, adultRegister, courses, missing };
}

/**
 * THE FOUR-BAND REQUIREMENT BINDS NEW WORK AT ONCE (DR-0697, LESSONS P60).
 * Measured 2026-09-30: 376 of 398 recorded catalog lessons lacked all four
 * bands, and new courses kept arriving with two (teen + senior) because the
 * ratchet below watches only adult-only lessons and lost four-band lessons, so
 * a lesson with two bands changed nothing it could see. Darrell: "why not when
 * that has been requested and required?!"
 *
 * The gap is `lessons - allFour` per course. These ceilings are the gaps
 * measured from the real catalog on 2026-09-30 (400 lessons, 22 with all
 * four). They are FROZEN BY HAND and never regenerated from a scan, because a
 * regenerated ceiling would re-license whatever the scan found: they may only
 * be LOWERED as bands land. A course not listed has a ceiling of 0, so a new
 * course arrives with all four bands on every lesson or the build fails, and
 * a lesson added to a listed course without all four raises its gap and fails.
 * sovereign-ai reads 31 where the baseline file recorded 29: two lessons were
 * added below the standard before this gate existed; they are backlog like the
 * rest, and nothing more joins them. property-principle and
 * management-stewardship reached 0 the same afternoon (DR-0696).
 *
 * THE CEILING TIGHTENS ITSELF: the effective ceiling is the lower of this frozen
 * number and the course's gap in the baseline file, which every band PR
 * regenerates from a fresh scan. So a course that closes its gap is held at the
 * new number without anyone editing this table, and a regenerated baseline can
 * never raise a course above its frozen line.
 */
export const FOUR_BAND_GAP_CEILING = Object.freeze({
  ai: 8, 'ai-legal-blueprint': 6, appraisal: 8, banking: 8, bonds: 8, broadcast: 9,
  'business-research-wars': 9, 'buying-terms': 8, 'church-offices': 7, datasystems: 14,
  development: 8, evictions: 8, 'financing-debt': 8, 'handed-forward': 5, 'healthy-living': 12,
  'historical-research-1619': 0, 'history-truth': 8, infrastructure: 10, inspections: 8,
  'insurance-risk': 8, investing: 8, 'kingdom-economics': 8, 'leasing-tenants': 8,
  'legacy-provisions': 7, 'little-learners': 6, 'made-in-time': 18, 'maintenance-trades': 8,
  'management-stewardship': 0, mathematics: 8, partnerships: 8, 'project-management': 12,
  'property-principle': 0, 'prophetic-voices': 6, 'rent-to-own-business': 8,
  'software-project-management': 10, 'sound-board': 8, 'sovereign-ai': 31, stocks: 8,
  'taxes-records': 8, 'who-he-is': 0, 'word-out': 5, 'world-issues': 19, 'world-market': 8,
});

/**
 * Courses whose four-band gap is above its ceiling: the frozen number (0 when
 * unlisted), lowered to the baseline file's recorded gap when that is lower.
 */
export function fourBandGapFindings(scan, ceiling = FOUR_BAND_GAP_CEILING, baseline = null) {
  const out = [];
  const recorded = (baseline && baseline.courses) || {};
  for (const [key, row] of Object.entries((scan && scan.courses) || {})) {
    const listed = Object.prototype.hasOwnProperty.call(ceiling, key);
    const was = recorded[key];
    const wasGap = was && Number.isFinite(was.lessons) && Number.isFinite(was.allFour) ? was.lessons - was.allFour : Infinity;
    const max = Math.min(listed ? ceiling[key] : 0, wasGap);
    const gap = row.lessons - row.allFour;
    if (gap <= max) continue;
    out.push(listed
      ? `${key}: ${gap} lessons without all four bands, ceiling ${max}: a lesson was added below the standard (DR-0697)`
      : `${key}: a new course must carry child, youth, teen and senior on every lesson; ${gap} of ${row.lessons} lessons do not (DR-0697)`);
  }
  return out;
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

// =============================================================================
// ALL FOUR, ON EVERY LESSON FROM HERE ON (DR-0692)
// =============================================================================
// Darrell 2026-09-30: "Do we have all the lessons for each lessons age groups
// yet? If not, why not when that has been requested and required?!"
//
// Measured that day: 398 catalog-course lessons, 22 carrying all four bands.
// The course-level ratchet above only ever said "no WORSE than the baseline":
// it let a new course land carrying two bands (the teen+senior contract,
// DR-0509) and still called it healthy, so the gap never closed. This is the
// per-lesson rule that closes it. The lessons missing a band on 2026-09-30 are
// pinned BY ID in course-band-four-allowlist.json; that list may only shrink.
// A lesson that is not on it and does not carry child, youth, teen AND senior
// fails, and the failure names the lesson and the bands it lacks.

export const FOUR_BAND_ALLOWLIST_PATH = join(HERE, '..', 'app', 'src', 'lib', 'course-band-four-allowlist.json');

export function loadFourBandAllowlist(path = FOUR_BAND_ALLOWLIST_PATH) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return raw && raw.courses ? raw : { courses: {} };
}

/**
 * The per-lesson rule. `fresh`: a lesson missing a band that the pinned list
 * does not excuse — the build fails and names it. `healed`: a pinned lesson
 * that now carries all four (or is gone) — the list must drop it, so the
 * excuse cannot outlive the debt.
 */
export function ratchetFourBands(scan, allowlist, catalogLessons = null) {
  const pinned = (allowlist && allowlist.courses) || {};
  const fresh = [];
  const healed = [];
  for (const [key, ids] of Object.entries(scan.missing || {})) {
    const excused = new Set(pinned[key] || []);
    for (const id of ids) {
      if (excused.has(id)) continue;
      const m = catalogLessons && catalogLessons[`${key}/${id}`];
      const lacks = m ? BANDS.filter((b) => !bandsPresent(m).includes(b)) : null;
      fresh.push(`${key}/${id}: missing ${lacks ? lacks.join(', ') : 'a band'} — every lesson added after DR-0692 carries child, youth, teen and senior`);
    }
  }
  for (const [key, ids] of Object.entries(pinned)) {
    const still = new Set((scan.missing || {})[key] || []);
    for (const id of ids) if (!still.has(id)) healed.push(`${key}/${id}`);
  }
  return { fresh, healed };
}

/** Pinned list minus what has healed. Never adds: a fresh gap is not excusable. */
export function shrinkFourBandAllowlist(scan, allowlist) {
  const out = {};
  for (const [key, ids] of Object.entries((allowlist && allowlist.courses) || {})) {
    const still = new Set((scan.missing || {})[key] || []);
    out[key] = ids.filter((id) => still.has(id));
  }
  return out;
}

/**
 * One id per line, one course per block, and a course that is finished keeps
 * its (empty) block. Five sessions shrink this file at once; with every block
 * bounded by its own key line and closing line, two sessions removing ids from
 * two courses never touch adjacent lines, so git merges them without a hand.
 */
export function serializeFourBandAllowlist(courses, note) {
  const keys = Object.keys(courses).sort();
  const lines = ['{', `  "note": ${JSON.stringify(note)},`, '  "courses": {'];
  keys.forEach((k, i) => {
    lines.push(`    ${JSON.stringify(k)}: [`);
    const ids = [...courses[k]].sort();
    ids.forEach((id, j) => lines.push(`      ${JSON.stringify(id)}${j < ids.length - 1 ? ',' : ''}`));
    lines.push(`    ]${i < keys.length - 1 ? ',' : ''}`);
  });
  lines.push('  }', '}', '');
  return lines.join('\n');
}

/**
 * The house band gates on one four-band lesson, the ones Who He Is is held to:
 * each band's share of the adult teaching (full-levels floor), a rising ladder
 * child < youth < teen <= senior with the child band at or under the new-lesson
 * ceiling, four genuinely different texts (eight-word shingles), and every
 * band naming its lesson near its start. Returns the faults, [] when clean.
 */
export function fourBandGateFaults(m) {
  const out = [];
  const f = measureFullness(m);
  for (const b of FULL_BANDS) if (!(f.bands[b].share >= FULL_FLOOR[b])) out.push(`${b} share ${f.bands[b].share} under ${FULL_FLOOR[b]}`);
  const g = Object.fromEntries(Object.entries(measureLesson(m).bands).map(([k, v]) => [k, v.authored]));
  if (!(g.child < g.youth && g.youth < g.teen && g.teen <= g.senior)) out.push(`ladder child ${g.child} < youth ${g.youth} < teen ${g.teen} <= senior ${g.senior} does not hold`);
  if (!(g.child <= NEW_LESSON_CHILD_CEILING)) out.push(`child reads ${g.child}, over ${NEW_LESSON_CHILD_CEILING}`);
  const d = measureDifferentiation(m);
  if (!d || !(d.worst < DIFF_CEILING)) out.push(`bands overlap ${d ? d.worst : 'unmeasured'}, ceiling ${DIFF_CEILING}`);
  for (const b of FULL_BANDS) if (!namesItsLesson(m.title, m.levels[b])) out.push(`${b} does not name its lesson near its start`);
  return out;
}
