// =============================================================================
// curriculum-parity — do the code and the NAS copy hold the same lessons? (DR-0677)
// =============================================================================
// The code is the master; the NAS database is a synchronized copy. This is the
// witness that says so, lesson by lesson and field by field, rather than
// trusting that a sync that exited 0 wrote what it meant to (DR-0076 §1: the
// ledger is a receipt, not an observation).
//
// Every finding names the lesson id and the field:
//   missing-on-nas   a lesson the code carries and the copy does not
//   extra-on-nas     a PUBLIC lesson the copy carries and the code does not
//   stale-preview    a PREVIEW lesson older than the window (a NAS-only lesson
//                    must never outlive its PR: the builder commits it through
//                    the lane, and a merged lesson turns public on the next sync)
//   wrong-course     the same id under a different course
//   field            a field whose value differs (compared as canonical JSON,
//                    so key order never reads as drift and nothing else hides)
//   hash             the row's content_sha256 is not the hash of what it holds
//   status           a lesson the code carries is still marked preview
//
// Where it runs: the lessons-sync workflow, right after each sync, against the
// copy read back FROM the NAS database; and the CI curriculum job, against a
// snapshot round-tripped through the same row shape. Proven to catch drift by
// app/src/__tests__/curriculum-parity.test.js.
// =============================================================================
import { rowsToCourses, canonicalJson, asJson } from '../app/src/lib/curriculum-rows.js';
import { lessonHash } from './curriculum-snapshot.mjs';

export const PREVIEW_WINDOW_HOURS = 72;

/**
 * @param repoCourses { courseKey: [lesson] } — from the code
 * @param dbRows      { lessons, bands, quiz, movements, sources } — from the copy
 */
export function parity(repoCourses, dbRows, { now = Date.now(), previewWindowHours = PREVIEW_WINDOW_HOURS } = {}) {
  const drift = [];
  const dbCourses = rowsToCourses(dbRows);
  const rowById = new Map((dbRows.lessons || []).map((r) => [r.lesson_id, r]));
  const dbById = new Map();
  for (const [key, lessons] of Object.entries(dbCourses)) for (const l of lessons) dbById.set(l.id, { key, lesson: l });
  const repoIds = new Set();

  for (const [key, lessons] of Object.entries(repoCourses)) {
    for (const src of lessons) {
      const lesson = asJson(src);
      repoIds.add(lesson.id);
      const hit = dbById.get(lesson.id);
      if (!hit) { drift.push({ id: lesson.id, course: key, field: '*', kind: 'missing-on-nas' }); continue; }
      if (hit.key !== key) drift.push({ id: lesson.id, course: key, field: 'course_key', kind: 'wrong-course', nas: hit.key });
      const row = rowById.get(lesson.id);
      if (row && row.status !== 'public') drift.push({ id: lesson.id, course: key, field: 'status', kind: 'status', nas: row.status });
      const keys = new Set([...Object.keys(lesson), ...Object.keys(hit.lesson)]);
      for (const f of [...keys].sort()) {
        if (canonicalJson(lesson[f]) !== canonicalJson(hit.lesson[f])) drift.push({ id: lesson.id, course: key, field: f, kind: 'field' });
      }
      if (row && row.content_sha256 !== lessonHash(hit.lesson)) drift.push({ id: lesson.id, course: key, field: 'content_sha256', kind: 'hash' });
    }
  }

  for (const [id, { key }] of dbById) {
    if (repoIds.has(id)) continue;
    const row = rowById.get(id) || {};
    if (row.status === 'preview') {
      const born = Date.parse(row.updated_at || '') || now;
      if (now - born > previewWindowHours * 3600 * 1000) {
        drift.push({ id, course: key, field: 'status', kind: 'stale-preview', pr: row.pr_url || null });
      }
      continue;
    }
    drift.push({ id, course: key, field: '*', kind: 'extra-on-nas' });
  }
  return { inStep: drift.length === 0, drift };
}

/** One readable line per finding. */
export const describeDrift = (d) => `${d.kind} :: ${d.course}/${d.id} :: ${d.field}${d.nas ? ` (nas: ${d.nas})` : ''}${d.pr ? ` (${d.pr})` : ''}`;
