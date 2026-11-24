// =============================================================================
// learn-presentation/integrity — the author's work, measured before anything
// is put in front of it (Learn redesign, Phase 1)
// =============================================================================
// The Learn redesign is a PRESENTATION layer. It may add a display title, a
// thumbnail headline and a picture beside a lesson; it may never change a
// lesson. This module is how that promise is checked instead of asserted:
//
//   learnInventory()        every mounted course and lesson, read from the SAME
//                           sources ChurchLearn mounts (the LEARN_CATALOG
//                           registry + the Eternal Algorithms processing
//                           courses), in authored order.
//   snapshotInventory(inv, hash)
//                           one record per lesson: course, department, position,
//                           id, the exact title, a hash of the whole raw lesson
//                           object, and a hash per age version.
//   compareSnapshots(base, now)
//                           what was removed, retitled, rewritten, moved or lost
//                           an age version. Additions are reported, never
//                           failed: the author keeps writing (LL338–LL341 landed
//                           this month) and a new lesson is not a regression.
//
// The hash function is injected (node:crypto in tests and scripts) so this file
// stays free of Node-only imports and can be read by the browser bundle.
// =============================================================================

import { LEARN_CATALOG } from '../learn-catalog.js';
import { buildEternalProcessingCourses } from '../eternal-algorithms-course.js';
import { courseDepartment, lessonVersions, READING_VERSIONS } from '../learn-organize.js';

/** Key-sorted JSON so the same object always hashes the same. Functions are named, not serialized. */
export function stableStringify(value) {
  const seen = new WeakSet();
  const walk = (v) => {
    if (typeof v === 'function') return '[function]';
    if (v === undefined) return null;
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return '[circular]';
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
    return out;
  };
  return JSON.stringify(walk(value));
}

/** The text of one age version, as lessonVersions() reads it (adult = top-level `lesson`). */
export function versionTextOf(lesson, versionId) {
  const band = READING_VERSIONS.find((b) => b.id === versionId);
  if (!band || !lesson) return '';
  const levels = lesson.levels && typeof lesson.levels === 'object' ? lesson.levels : {};
  const own = typeof levels[band.key] === 'string' ? levels[band.key] : '';
  if (own.trim()) return own;
  return versionId === 'adult' && typeof lesson.lesson === 'string' ? lesson.lesson : '';
}

/**
 * Every mounted course with its RAW lesson rows (before date stamping, Word
 * quotes and side stories are layered on for display — those are derived, the
 * rows are the author's). Order is the order Learn mounts them.
 */
export function learnInventory() {
  const registry = LEARN_CATALOG.map((e) => ({
    key: e.key,
    title: (e.meta && e.meta.title) || e.key,
    meta: e.meta,
    source: 'registry',
    lessons: e.buildScheduleRows(),
  }));
  const eternal = buildEternalProcessingCourses().map((c) => ({
    key: c.key || (c.meta && c.meta.key),
    title: (c.meta && c.meta.title) || c.key,
    meta: c.meta,
    source: 'eternal-algorithms',
    lessons: c.schedule || [],
  }));
  return [...registry, ...eternal].map((c) => ({
    ...c,
    department: courseDepartment({ key: c.key, meta: c.meta }),
  }));
}

/** One record per lesson. `hash` is (string) => hex digest. */
export function snapshotInventory(inventory, hash) {
  const lessons = [];
  const courses = [];
  const departments = new Map();
  let readings = 0;
  for (const c of inventory) {
    courses.push({ key: c.key, title: c.title, department: c.department, lessons: c.lessons.length, source: c.source });
    departments.set(c.department, (departments.get(c.department) || 0) + 1);
    c.lessons.forEach((l, i) => {
      const versions = lessonVersions(l);
      readings += versions.length;
      lessons.push({
        id: l.id,
        course: c.key,
        department: c.department,
        position: i + 1,
        title: typeof l.title === 'string' ? l.title : null,
        contentSha: hash(stableStringify(l)),
        versions: Object.fromEntries(versions.map((v) => [v, hash(versionTextOf(l, v))])),
      });
    });
  }
  return {
    counts: { departments: departments.size, courses: courses.length, lessons: lessons.length, readings },
    departments: [...departments.entries()].map(([label, courseCount]) => ({ label, courses: courseCount })),
    courses,
    lessons,
  };
}

/** Compare a committed baseline to the catalog as it stands now. */
export function compareSnapshots(base, now) {
  const key = (l) => `${l.course}::${l.id}`;
  const nowBy = new Map(now.lessons.map((l) => [key(l), l]));
  const baseBy = new Map(base.lessons.map((l) => [key(l), l]));
  const out = { removed: [], retitled: [], rewritten: [], moved: [], versionsLost: [], versionsChanged: [], added: [], coursesRemoved: [], coursesRedepartmented: [] };
  for (const b of base.lessons) {
    const n = nowBy.get(key(b));
    if (!n) { out.removed.push(key(b)); continue; }
    if (n.title !== b.title) out.retitled.push({ id: key(b), was: b.title, now: n.title });
    if (n.contentSha !== b.contentSha) out.rewritten.push(key(b));
    if (n.position !== b.position || n.department !== b.department) out.moved.push({ id: key(b), was: [b.department, b.position], now: [n.department, n.position] });
    for (const [v, sha] of Object.entries(b.versions || {})) {
      if (!(v in (n.versions || {}))) out.versionsLost.push(`${key(b)}#${v}`);
      else if (n.versions[v] !== sha) out.versionsChanged.push(`${key(b)}#${v}`);
    }
  }
  for (const n of now.lessons) if (!baseBy.has(key(n))) out.added.push(key(n));
  const nowCourses = new Map(now.courses.map((c) => [c.key, c]));
  for (const c of base.courses) {
    const n = nowCourses.get(c.key);
    if (!n) out.coursesRemoved.push(c.key);
    else if (n.department !== c.department) out.coursesRedepartmented.push({ key: c.key, was: c.department, now: n.department });
  }
  const failing = ['removed', 'retitled', 'rewritten', 'moved', 'versionsLost', 'versionsChanged', 'coursesRemoved', 'coursesRedepartmented'];
  out.clean = failing.every((k) => out[k].length === 0);
  return out;
}
