// =============================================================================
// preview_lesson.mjs -- the builder's preview write, through the DR-0677 gate
// =============================================================================
// Option A+ (DR-0677): the code is the master; the NAS holds a synced copy;
// a lesson that passes every gate is readable AT ONCE by Darrell's two
// sign-ins and the Governor as a PREVIEW, with its PR. This is the one door
// the NAS lesson builder (DR-0669) uses to write that preview:
//
//   1. loadRepoCurriculum() reads the school from the BUILDER'S WORKTREE, the
//      committed branch the PR carries (the new lesson already in its course);
//   2. gateLessonForPublish() judges the school as it would be with the lesson
//      in it, with the very gates CI runs (scripts/curriculum-gates.mjs);
//   3. only on a pass: the lesson's rows exactly as the sync writes them
//      (snapshotRows: the same decomposition, content hash and verse spans),
//      stamped status 'preview', its pr_url, and the verdict over its hash.
//
// Runs under vite-node from the worktree's app/ (the course files use
// extensionless imports, as scripts/curriculum-cli.mjs does). Reads
// {course_key, lesson_id, pr_url, commit} from the PREVIEW_REQUEST environment
// variable (under vite-node a stdin read ends the process before the course
// files finish loading, measured 2026-09-29); prints one JSON object:
// {passed, fresh, evidence, rows} -- rows only when passed. Writes nothing:
// the builder writes the rows in one transaction.
// =============================================================================
import { randomUUID } from 'node:crypto';
import { loadRepoCurriculum, snapshotRows } from '../../scripts/curriculum-snapshot.mjs';
import { gateLessonForPublish } from '../../scripts/curriculum-gates.mjs';


export function previewRows(list, courseKey, lessonId, { prUrl = null, commit = null, verdict, runId = randomUUID(), gatedAt = new Date().toISOString() }) {
  const entry = list.find((x) => x.course.key === courseKey);
  if (!entry) throw new Error(`course ${courseKey} is not in the school`);
  const all = snapshotRows([entry]);
  const mine = (r) => r.lesson_id === lessonId;
  const rows = {
    courses: all.courses,
    lessons: all.lessons.filter(mine),
    bands: all.bands.filter(mine),
    quiz: all.quiz.filter(mine),
    movements: all.movements.filter(mine),
    sources: all.sources.filter(mine),
    verse_spans: all.verse_spans.filter(mine),
  };
  if (rows.lessons.length !== 1) throw new Error(`lesson ${lessonId} is not in ${courseKey}`);
  for (const l of rows.lessons) {
    l.status = 'preview';
    l.pr_url = prUrl;
    l.source_commit = commit;
    l.gate_verdict = {
      passed: !!verdict.passed,
      gate: 'scripts/curriculum-gates.mjs#gateLessonForPublish',
      run_id: runId,
      content_sha256: l.content_sha256,
      commit,
      gated_at: gatedAt,
      writer: 'nas-lesson-builder (DR-0669)',
    };
  }
  return rows;
}

// Run directly: vite-node drops the script path from argv, so its own bin
// being argv[1] (or plain node naming this file) is what marks a direct run.
const isMain = /(^|\/)vite-node(\.m?js)?$/.test(process.argv[1] || '') || /preview_lesson\.mjs$/.test(process.argv[1] || '');
if (isMain) {
  const req = JSON.parse(process.env.PREVIEW_REQUEST || '{}');
  const { list, courses } = await loadRepoCurriculum();
  const lesson = (courses[req.course_key] || []).find((l) => l.id === req.lesson_id);
  if (!lesson) {
    process.stdout.write(JSON.stringify({ passed: false, fresh: [`structure :: ${req.lesson_id} is not in ${req.course_key}`] }));
  } else {
    const verdict = gateLessonForPublish(courses, req.course_key, lesson);
    const out = { passed: verdict.passed, fresh: verdict.fresh.slice(0, 60), evidence: verdict.evidence };
    if (verdict.passed) {
      out.rows = previewRows(list, req.course_key, req.lesson_id, { prUrl: req.pr_url || null, commit: req.commit || null, verdict });
    }
    process.stdout.write(JSON.stringify(out));
  }
}
