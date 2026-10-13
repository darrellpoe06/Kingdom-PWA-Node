// =============================================================================
// curriculum-snapshot — the course files, as rows for the NAS copy (DR-0677)
// =============================================================================
// The code is the master (Darrell 2026-09-29: "The apps code is needed to keep
// context!!!!!!!%"). This turns what the code holds into what the NAS database
// holds, and writes the SQL that makes the database hold exactly that:
//
//   loadRepoCurriculum()  every registered course (LEARN_CATALOG) plus the
//                         Eternal-Algorithms family, as the app mounts them:
//                         { list: [{ course, lessons }], courses: { key: lessons } }
//   snapshotRows(list)    the table rows (app/src/lib/curriculum-rows.js does
//                         the decomposition; this adds hashes + verse spans)
//   syncSql(rows, stamp)  one transaction: upsert every course and lesson as
//                         PUBLIC, replace each lesson's parts, withdraw public
//                         rows the code no longer carries, leave previews be
//
// CLI: scripts/curriculum-cli.mjs (the course files use extensionless imports,
// so it runs under vite-node from app/, exactly as the lessons-sync workflow does):
//   npx vite-node ../scripts/curriculum-cli.mjs --rows out.json
//   npx vite-node ../scripts/curriculum-cli.mjs --sql out.sql [--commit <sha>]
//   npx vite-node ../scripts/curriculum-cli.mjs --gate
//   npx vite-node ../scripts/curriculum-cli.mjs --verse-baseline
// =============================================================================
import { createHash, randomUUID } from 'node:crypto';
import { quotedTexts } from './quotation-integrity.mjs';
import { referencedSpans } from './quoted-verse-is-the-verse.mjs';
import {
  courseToRows, rowsToLesson, canonicalJson, asJson,
} from '../app/src/lib/curriculum-rows.js';

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

/** The content hash of a lesson: canonical JSON, so key order never matters. */
export const lessonHash = (lesson) => sha256(canonicalJson(asJson(lesson)));

/** Every course the app mounts, read from the code. */
export async function loadRepoCurriculum() {
  const { LEARN_CATALOG } = await import('../app/src/lib/learn-catalog.js');
  const { buildEternalProcessingCourses } = await import('../app/src/lib/eternal-algorithms-course.js');
  const list = [];
  for (const entry of LEARN_CATALOG) list.push({ course: entry, lessons: entry.buildScheduleRows() });
  for (const c of buildEternalProcessingCourses()) {
    list.push({
      course: { key: c.key, wiring: 'eternal', meta: c.meta, sessionFlow: c.sessionFlow, downloadName: c.downloadName, interestCopy: c.interestCopy, tutorCourseMeta: c.tutorCourseMeta },
      lessons: c.schedule,
    });
  }
  const courses = {};
  for (const { course, lessons } of list) courses[course.key] = lessons;
  return { list, courses };
}

/** Every referenced quotation a reader meets, as the verse gate reads it. */
export function verseSpanRows(courseKey, lesson) {
  return referencedSpans(lesson, quotedTexts).map((s, i) => ({
    course_key: courseKey,
    lesson_id: lesson.id,
    position: i,
    field: s.where,
    quoted: s.quoted,
    book: s.book,
    chapter: Number(s.chapter),
    verses: s.verses,
  }));
}

/** The code, as table rows. */
export function snapshotRows(list) {
  const out = { courses: [], lessons: [], bands: [], quiz: [], movements: [], sources: [], verse_spans: [] };
  list.forEach(({ course, lessons }, position) => {
    const r = courseToRows(course, position, lessons);
    out.courses.push(r.course);
    r.lessons.forEach((row, i) => {
      row.content_sha256 = lessonHash(lessons[i]);
      out.lessons.push(row);
    });
    out.bands.push(...r.bands);
    out.quiz.push(...r.quiz);
    out.movements.push(...r.movements);
    out.sources.push(...r.sources);
    for (const l of lessons) out.verse_spans.push(...verseSpanRows(course.key, asJson(l)));
  });
  return out;
}

/** Stamp every lesson row with the gate verdict it passed under. */
export function stampRows(rows, { passed, commit = null, runId = randomUUID(), gatedAt = new Date().toISOString() }) {
  for (const l of rows.lessons) {
    l.status = 'public';
    l.source_commit = commit;
    l.gate_verdict = {
      passed: !!passed,
      gate: 'scripts/curriculum-gates.mjs',
      run_id: runId,
      content_sha256: l.content_sha256,
      commit,
      gated_at: gatedAt,
    };
  }
  return rows;
}

/** A dollar-quote tag that does not occur in the text. */
export function dollarTag(text) {
  for (;;) {
    const tag = `$c${randomUUID().replace(/-/g, '').slice(0, 12)}$`;
    if (!text.includes(tag)) return tag;
  }
}

/**
 * One transaction that makes the NAS copy equal the code. The rows ride in as
 * ONE jsonb literal and every write is set-based from it, so the SQL is the
 * same few statements however many lessons there are.
 */
export function syncSql(rows, { commit = null } = {}) {
  const doc = JSON.stringify(rows);
  const tag = dollarTag(doc);
  return `\\set ON_ERROR_STOP 1
BEGIN;
CREATE TEMP TABLE _curriculum_snap (doc jsonb) ON COMMIT DROP;
INSERT INTO _curriculum_snap VALUES (${tag}${doc}${tag}::jsonb);

INSERT INTO curriculum_courses (course_key, position, title, category, wiring, unit_cap, meta, session_flow, entry, source_commit, synced_at)
SELECT c.course_key, c.position, c.title, c.category, c.wiring, c.unit_cap, c.meta, c.session_flow, c.entry, ${commit ? `'${commit.replace(/[^0-9a-f]/gi, '')}'` : 'NULL'}, now()
  FROM _curriculum_snap s, jsonb_to_recordset(s.doc->'courses')
       AS c(course_key text, position int, title text, category text, wiring text, unit_cap text, meta jsonb, session_flow jsonb, entry jsonb)
ON CONFLICT (course_key) DO UPDATE SET position = EXCLUDED.position, title = EXCLUDED.title, category = EXCLUDED.category,
  wiring = EXCLUDED.wiring, unit_cap = EXCLUDED.unit_cap, meta = EXCLUDED.meta, session_flow = EXCLUDED.session_flow,
  entry = EXCLUDED.entry, source_commit = EXCLUDED.source_commit, synced_at = now();

CREATE TEMP TABLE _curriculum_lessons ON COMMIT DROP AS
SELECT l.* FROM _curriculum_snap s, jsonb_to_recordset(s.doc->'lessons')
  AS l(course_key text, lesson_id text, position int, key_order text[], title text, big_idea text, in_app text,
       lesson_text text, anchor jsonb, benefits jsonb, facilitator jsonb, child_keys text[], rest jsonb,
       content_sha256 text, status text, source_commit text, gate_verdict jsonb);

-- A lesson that MOVED course (same id, new course) leaves its old row first.
DELETE FROM curriculum_lessons c USING _curriculum_lessons n
 WHERE c.lesson_id = n.lesson_id AND c.course_key <> n.course_key;

-- Public rows the code no longer carries are withdrawn; previews are left be.
WITH gone AS (
  DELETE FROM curriculum_lessons c
   WHERE c.status = 'public'
     AND NOT EXISTS (SELECT 1 FROM _curriculum_lessons n WHERE n.course_key = c.course_key AND n.lesson_id = c.lesson_id)
  RETURNING 1)
SELECT 'REMOVED=' || count(*) FROM gone;

WITH up AS (
  INSERT INTO curriculum_lessons (course_key, lesson_id, position, key_order, title, big_idea, in_app, lesson_text,
                                  anchor, benefits, facilitator, child_keys, rest, content_sha256, status, pr_url,
                                  source_commit, gate_verdict)
  SELECT course_key, lesson_id, position, key_order, title, big_idea, in_app, lesson_text, anchor, benefits,
         facilitator, child_keys, rest, content_sha256, 'public', NULL, source_commit, gate_verdict
    FROM _curriculum_lessons
  ON CONFLICT (course_key, lesson_id) DO UPDATE SET position = EXCLUDED.position, key_order = EXCLUDED.key_order,
    title = EXCLUDED.title, big_idea = EXCLUDED.big_idea, in_app = EXCLUDED.in_app, lesson_text = EXCLUDED.lesson_text,
    anchor = EXCLUDED.anchor, benefits = EXCLUDED.benefits, facilitator = EXCLUDED.facilitator,
    child_keys = EXCLUDED.child_keys, rest = EXCLUDED.rest, content_sha256 = EXCLUDED.content_sha256,
    status = 'public', pr_url = NULL, source_commit = EXCLUDED.source_commit, gate_verdict = EXCLUDED.gate_verdict
  WHERE curriculum_lessons.content_sha256 IS DISTINCT FROM EXCLUDED.content_sha256
     OR curriculum_lessons.status <> 'public'
     OR curriculum_lessons.position IS DISTINCT FROM EXCLUDED.position
  RETURNING 1)
SELECT 'WRITTEN=' || count(*) FROM up;

-- Each lesson's parts are replaced whole, so a removed band or question leaves.
DELETE FROM curriculum_lesson_bands       x USING _curriculum_lessons n WHERE x.course_key = n.course_key AND x.lesson_id = n.lesson_id;
DELETE FROM curriculum_lesson_quiz        x USING _curriculum_lessons n WHERE x.course_key = n.course_key AND x.lesson_id = n.lesson_id;
DELETE FROM curriculum_lesson_movements   x USING _curriculum_lessons n WHERE x.course_key = n.course_key AND x.lesson_id = n.lesson_id;
DELETE FROM curriculum_lesson_provenance  x USING _curriculum_lessons n WHERE x.course_key = n.course_key AND x.lesson_id = n.lesson_id;
DELETE FROM curriculum_lesson_verse_spans x USING _curriculum_lessons n WHERE x.course_key = n.course_key AND x.lesson_id = n.lesson_id;

INSERT INTO curriculum_lesson_bands (course_key, lesson_id, band, position, text)
SELECT b.course_key, b.lesson_id, b.band, b.position, b.text FROM _curriculum_snap s,
  jsonb_to_recordset(s.doc->'bands') AS b(course_key text, lesson_id text, band text, position int, text text);
INSERT INTO curriculum_lesson_quiz (course_key, lesson_id, position, q, answer, question)
SELECT q.course_key, q.lesson_id, q.position, q.q, q.answer, q.question FROM _curriculum_snap s,
  jsonb_to_recordset(s.doc->'quiz') AS q(course_key text, lesson_id text, position int, q text, answer int, question jsonb);
INSERT INTO curriculum_lesson_movements (course_key, lesson_id, position, title, text, movement)
SELECT m.course_key, m.lesson_id, m.position, m.title, m.text, m.movement FROM _curriculum_snap s,
  jsonb_to_recordset(s.doc->'movements') AS m(course_key text, lesson_id text, position int, title text, text text, movement jsonb);
INSERT INTO curriculum_lesson_provenance (course_key, lesson_id, position, kind, detail)
SELECT p.course_key, p.lesson_id, p.position, p.kind, p.detail FROM _curriculum_snap s,
  jsonb_to_recordset(s.doc->'sources') AS p(course_key text, lesson_id text, position int, kind text, detail jsonb);
INSERT INTO curriculum_lesson_verse_spans (course_key, lesson_id, position, field, quoted, book, chapter, verses)
SELECT v.course_key, v.lesson_id, v.position, v.field, v.quoted, v.book, v.chapter, v.verses FROM _curriculum_snap s,
  jsonb_to_recordset(s.doc->'verse_spans') AS v(course_key text, lesson_id text, position int, field text, quoted text, book text, chapter int, verses text);

-- Courses the code no longer registers (and that hold no preview) are withdrawn.
DELETE FROM curriculum_courses c
 WHERE NOT EXISTS (SELECT 1 FROM _curriculum_snap s, jsonb_array_elements(s.doc->'courses') e WHERE e->>'course_key' = c.course_key)
   AND NOT EXISTS (SELECT 1 FROM curriculum_lessons l WHERE l.course_key = c.course_key);
COMMIT;
`;
}

/** The SQL that reads the whole copy back as the same row document (for parity). */
export const READ_BACK_SQL = `SELECT json_build_object(
  'courses',   (SELECT coalesce(json_agg(r ORDER BY r.position), '[]') FROM curriculum_courses r),
  'lessons',   (SELECT coalesce(json_agg(r ORDER BY r.course_key, r.position), '[]') FROM curriculum_lessons r),
  'bands',     (SELECT coalesce(json_agg(r), '[]') FROM curriculum_lesson_bands r),
  'quiz',      (SELECT coalesce(json_agg(r), '[]') FROM curriculum_lesson_quiz r),
  'movements', (SELECT coalesce(json_agg(r), '[]') FROM curriculum_lesson_movements r),
  'sources',   (SELECT coalesce(json_agg(r), '[]') FROM curriculum_lesson_provenance r)
)::text;`;
// (Every alias is \`r\` on purpose: curriculum_lesson_quiz has a COLUMN named q,
// so json_agg(q) aggregated the question text instead of the row — found by the
// first real read-back, 100 lessons reading as quiz drift.)

/** Recompose a single lesson row set back into the lesson (re-exported for callers). */
export { rowsToLesson };
