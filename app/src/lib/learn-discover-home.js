// =============================================================================
// learn-discover-home — what the discovery page shows, derived from real state
// =============================================================================
// Continue Learning reads the device's saved places (learn-resume.js, the same
// record Learn's own Continue reads). Newest reads the real day each lesson was
// added (lesson-dates.json). Featured reads the presentation records' own
// `featured` flag. Relationships is the hand-picked shelf Learn Studio already
// carries. Nothing is painted: an empty source shows no row.
// =============================================================================
import { RELATIONSHIP_LESSONS } from './learn-presentation/presentation.js';
import { placeReached } from './learn-resume.js';

/** Begun-and-not-finished places -> index rows, newest first. */
export function continueRows(P, places = [], limit = 12) {
  const out = [];
  for (const pl of Array.isArray(places) ? places : []) {
    const L = P.byId.get(pl && pl.lessonId);
    if (!L || (pl.courseKey && L.course.k !== pl.courseKey)) continue;
    out.push({ row: L.raw, course: L.course, reached: Math.max(0, Math.min(1, placeReached(pl))), at: pl.at || 0 });
    if (out.length >= limit) break;
  }
  return out;
}

/** The lessons most recently added, by the recorded day each was added. */
export function newestRows(P, dates, limit = 12) {
  const courses = (dates && dates.courses) || {};
  const rows = [];
  for (const L of P.lessons) {
    const d = courses[L.course.k] && courses[L.course.k][L.raw.i];
    if (Array.isArray(d) && d[0] && L.raw.im) rows.push({ L, day: d[0] });
  }
  rows.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : a.L.order - b.L.order));
  return rows.slice(0, limit).map((r) => ({ row: r.L.raw, course: r.L.course, day: r.day }));
}

/** Lessons the presentation records mark `featured`, in their own order. */
export function featuredRows(P, records, limit = 8) {
  const feat = (records || []).filter((r) => r && r.featured && P.byId.has(r.lessonId))
    .sort((a, b) => (Number(a.featuredOrder) || 99) - (Number(b.featuredOrder) || 99));
  return feat.slice(0, limit).map((r) => ({ row: P.byId.get(r.lessonId).raw, course: P.byId.get(r.lessonId).course }));
}

/** The Relationships shelf Learn Studio already carries, resolved against the index. */
export function relationshipRows(P) {
  return RELATIONSHIP_LESSONS.map((id) => P.byId.get(id)).filter(Boolean).map((L) => ({ row: L.raw, course: L.course }));
}
