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
// four authored bands, and 43 carry adult text only — so a child who opens one
// is served the adult words by resolveForAge's fallback, silently, and no gate
// in the house has ever said so.
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

export const BANDS = ['child', 'youth', 'teen', 'senior'];

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
 */
export function scanCourseBands(catalog, ownedIds = new Set()) {
  const courses = {};
  let total = 0; let allFour = 0; let adultOnly = 0;
  for (const c of Array.isArray(catalog) ? catalog : []) {
    if (!c || !c.key) continue;
    let lessons = 0; let four = 0; let bare = 0;
    for (const m of lessonsOfCourse(c)) {
      if (ownedIds.has(m.id)) continue;
      lessons += 1; total += 1;
      const n = bandsPresent(m).length;
      if (n === 4) { four += 1; allFour += 1; }
      if (n === 0) { bare += 1; adultOnly += 1; }
    }
    if (lessons) courses[c.key] = { lessons, allFour: four, adultOnly: bare };
  }
  return { total, allFour, adultOnly, courses };
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
  }
  // A recorded course the catalog no longer carries can never heal, so it is
  // reported rather than left to inflate the totals for ever (the stale-entry
  // lesson from the band-differentiation ratchet).
  const stale = Object.keys(known).filter((k) => !(k in scan.courses));
  return { worse, stale };
}

export function buildCourseBandBaseline(scan) {
  return {
    note: 'Shrink-only debt. Measured 2026-09-18: the four-band requirement was never applied outside the Living Lessons series. A course that gets WORSE fails the build; these numbers may only improve. Authoring bands for a course lesson lowers its adultOnly and raises its allFour, and the baseline is lowered in the same commit.',
    total: scan.total,
    allFour: scan.allFour,
    adultOnly: scan.adultOnly,
    courses: Object.fromEntries(Object.entries(scan.courses).sort(([a], [b]) => a.localeCompare(b))),
  };
}
