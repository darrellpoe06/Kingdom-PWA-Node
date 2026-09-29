// =============================================================================
// curriculum-rows — one lesson, as the NAS database holds it, and back (DR-0677)
// =============================================================================
// Darrell 2026-09-29: "Why don't the lessons live on the nas?!!!!!!!!!!" and,
// the same morning: "The apps code is needed to keep context!!!!!!!%"
//
// Both are true, and this file is where they meet. The course files in
// app/src/lib stay the MASTER copy: every session, review and `git blame` reads
// them, and the per-lesson tests are pinned beside them. The NAS database holds
// a SYNCHRONIZED copy (migration 0242) that serves reads, fast opens, offline
// use, the Firestick, and the instant preview of a lesson that has passed every
// gate but is not yet in merged code.
//
// This module is the ONE shape both sides agree on. It is pure (no network, no
// node-only imports) so the same code runs in:
//   * scripts/curriculum-snapshot.mjs  — repo -> rows (the sync and CI job);
//   * app/src/lib/lesson-store.js      — rows -> lessons (the app read path);
//   * the round-trip test              — rows -> lessons must deep-equal source.
//
// LOSSLESS BY CONSTRUCTION. A lesson row keeps the lesson's own key order
// (`key_order`). The named columns (title, bigIdea, ...) and the child tables
// (bands, quiz questions, movements, sources) carry what they carry; EVERY
// other key rides whole in `rest`. Recomposing walks key_order and takes each
// key from where it went. Nothing is dropped because nothing is left without a
// place. (JSON itself cannot carry `undefined`; a key whose value is undefined
// is treated as absent, which is what deep equality already means by it.)
// =============================================================================

/** Keys that become named columns on curriculum_lessons. */
export const LESSON_COLUMNS = Object.freeze({
  title: 'title',
  bigIdea: 'big_idea',
  inApp: 'in_app',
  lesson: 'lesson_text',
  anchor: 'anchor',
  benefits: 'benefits',
  facilitator: 'facilitator',
});

/** Keys that become child tables, when (and only when) their shape is the plain one. */
export const CHILD_KEYS = Object.freeze(['levels', 'quiz', 'movements', 'sources']);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isString = (v) => typeof v === 'string';

/** Deep copy through JSON — exactly what a jsonb column can hold. */
export function asJson(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

/**
 * Canonical JSON: object keys sorted at every depth, so two equal lessons hash
 * equal whatever order a writer (or jsonb) put their keys in.
 */
export function canonicalJson(v) {
  if (v === undefined) return 'null';
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => (x === undefined ? 'null' : canonicalJson(x))).join(',')}]`;
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`;
}

// --- which child shapes are "plain" (and so go to their own table) ----------

/** levels: an object of band -> string. Anything else stays whole in `rest`. */
export function plainLevels(v) {
  return isPlainObject(v) && Object.values(v).every(isString);
}

/** quiz: exactly { questions: [ {...}, ... ] }. */
export function plainQuiz(v) {
  return isPlainObject(v) && Object.keys(v).length === 1 && Array.isArray(v.questions)
    && v.questions.every(isPlainObject);
}

/** movements: [{ title, text, ... }] — the NAS builder's shape (DR-0669). */
export function plainMovements(v) {
  return Array.isArray(v) && v.every(isPlainObject);
}

/** sources: an array of provenance entries (any JSON). */
export function plainSources(v) {
  return Array.isArray(v);
}

const CHILD_TEST = { levels: plainLevels, quiz: plainQuiz, movements: plainMovements, sources: plainSources };

/**
 * One lesson (the row a course's buildScheduleRows() hands the app) -> the rows
 * the database holds for it. `position` is its index in the course.
 */
export function lessonToRows(courseKey, lesson, position) {
  const m = asJson(lesson);
  const keyOrder = Object.keys(m);
  const row = {
    course_key: courseKey,
    lesson_id: m.id,
    position,
    key_order: keyOrder,
    title: null,
    big_idea: null,
    in_app: null,
    lesson_text: null,
    anchor: null,
    benefits: null,
    facilitator: null,
    child_keys: [],
    rest: {},
  };
  const bands = [];
  const quiz = [];
  const movements = [];
  const sources = [];

  for (const k of keyOrder) {
    if (k === 'id') continue;
    const v = m[k];
    if (Object.prototype.hasOwnProperty.call(LESSON_COLUMNS, k)) {
      row[LESSON_COLUMNS[k]] = v;
      continue;
    }
    if (CHILD_KEYS.includes(k) && CHILD_TEST[k](v)) {
      row.child_keys.push(k);
      if (k === 'levels') {
        Object.keys(v).forEach((band, i) => bands.push({ course_key: courseKey, lesson_id: m.id, band, position: i, text: v[band] }));
      } else if (k === 'quiz') {
        v.questions.forEach((q, i) => quiz.push({
          course_key: courseKey, lesson_id: m.id, position: i,
          q: isString(q.q) ? q.q : null,
          answer: Number.isInteger(q.answer) ? q.answer : null,
          question: q,
        }));
      } else if (k === 'movements') {
        v.forEach((mv, i) => movements.push({
          course_key: courseKey, lesson_id: m.id, position: i,
          title: isString(mv.title) ? mv.title : null,
          text: isString(mv.text) ? mv.text : null,
          movement: mv,
        }));
      } else if (k === 'sources') {
        v.forEach((s, i) => sources.push({ course_key: courseKey, lesson_id: m.id, position: i, kind: 'source', detail: s }));
      }
      continue;
    }
    row.rest[k] = v;
  }
  return { lesson: row, bands, quiz, movements, sources };
}

const byPosition = (a, b) => a.position - b.position;

/**
 * The rows for one lesson -> the lesson, exactly. Child arrays may arrive in
 * any order (a database does not promise one); position puts them back.
 */
export function rowsToLesson({ lesson: row, bands = [], quiz = [], movements = [], sources = [] }) {
  const out = {};
  const cols = Object.entries(LESSON_COLUMNS);
  const children = new Set(row.child_keys || []);
  // A row written by hand with no key_order still names its lesson (the parity
  // gate must be able to say WHICH row is extra — found when a hand-inserted
  // row read back as "undefined").
  if (!(row.key_order || []).includes('id')) out.id = row.lesson_id;
  for (const k of row.key_order || []) {
    if (k === 'id') { out.id = row.lesson_id; continue; }
    const col = cols.find(([key]) => key === k);
    if (col) { out[k] = row[col[1]]; continue; }
    if (children.has(k)) {
      if (k === 'levels') {
        out.levels = {};
        for (const b of [...bands].sort(byPosition)) out.levels[b.band] = b.text;
      } else if (k === 'quiz') {
        out.quiz = { questions: [...quiz].sort(byPosition).map((q) => q.question) };
      } else if (k === 'movements') {
        out.movements = [...movements].sort(byPosition).map((mv) => mv.movement);
      } else if (k === 'sources') {
        out.sources = [...sources].sort(byPosition).map((s) => s.detail);
      }
      continue;
    }
    if (row.rest && Object.prototype.hasOwnProperty.call(row.rest, k)) out[k] = row.rest[k];
  }
  return out;
}

/** The fields of a course entry the database keeps (everything JSON can hold). */
export function courseToRow(course, position) {
  const meta = asJson(course.meta || {});
  return {
    course_key: course.key,
    position,
    title: isString(meta.title) ? meta.title : null,
    category: isString(meta.category) ? meta.category : null,
    wiring: course.wiring || null,
    unit_cap: course.unitCap || null,
    meta,
    session_flow: asJson(course.sessionFlow || []),
    entry: asJson({
      downloadName: course.downloadName,
      interestTag: course.interestTag,
      helperTag: course.helperTag,
      interestCopy: course.interestCopy,
      tutorCourseMeta: course.tutorCourseMeta,
    }) || {},
  };
}

/**
 * A whole course -> every row. `lessons` is the course's schedule rows (the
 * objects the app renders).
 */
export function courseToRows(course, position, lessons) {
  const out = { course: courseToRow(course, position), lessons: [], bands: [], quiz: [], movements: [], sources: [] };
  lessons.forEach((l, i) => {
    const r = lessonToRows(course.key, l, i);
    out.lessons.push(r.lesson);
    out.bands.push(...r.bands);
    out.quiz.push(...r.quiz);
    out.movements.push(...r.movements);
    out.sources.push(...r.sources);
  });
  return out;
}

/** Group flat child rows by lesson key, so each lesson recomposes in O(1). */
export function groupChildren(rows) {
  const key = (r) => `${r.course_key}\u0000${r.lesson_id}`;
  const g = new Map();
  for (const name of ['bands', 'quiz', 'movements', 'sources']) {
    const list = rows[name];
    if (!Array.isArray(list)) continue;
    for (const r of list) {
      const k = key(r);
      if (!g.has(k)) g.set(k, { bands: [], quiz: [], movements: [], sources: [] });
      g.get(k)[name].push(r);
    }
  }
  return { get: (lessonRow) => g.get(key(lessonRow)) || { bands: [], quiz: [], movements: [], sources: [] } };
}

/**
 * Flat table rows (as the database returns them) -> { courseKey: [lesson, ...] }
 * in each course's own order.
 */
export function rowsToCourses(rows) {
  const children = groupChildren(rows);
  const byCourse = {};
  for (const l of [...(rows.lessons || [])].sort(byPosition)) {
    (byCourse[l.course_key] = byCourse[l.course_key] || []).push(rowsToLesson({ lesson: l, ...children.get(l) }));
  }
  return byCourse;
}
