// =============================================================================
// learner-records — a learner's real record, and what it adds up to (DR-0754)
// =============================================================================
// Darrell 2026-10-05: "my son is reading the lessons testing the app and seeing
// how it flows for him... we want to keep analytics on what he's completion
// rates are and competency scores based on the exams in the lessons.. make
// sense?"
//
// WHAT WAS MEASURED BEFORE THIS. The shell's `data.classProgress` (module id →
// the moment it was marked read) and `data.classQuiz` (module id → {passed,
// pct, at}) live in the browser on one device and are in no synced table, so a
// son reading on his own phone left no record his father could look at. The
// Governor's only view was an engagement BAND by age. No completion rate, no
// competency score, no learner.
//
// THIS FILE IS PURE. It maps rows ↔ records and does the arithmetic; the
// network lives in learner-records-sync.js and the screen in ChurchLearn.
// Every number here comes from a real row. Nothing is painted (P15): a learner
// with no rows reads as an honest zero, never as a guess or a placeholder.
// Word-first: "Give an account of thy stewardship" (Luke 16:2).
// =============================================================================

// The competency bands the Governor reads at a glance. The pass line is the
// framework's own QUIZ_PASS_RATIO (0.7 → 70) so one number governs both the
// gate a learner feels and the band his father sees.
export const COMPETENCY_BANDS = [
  { key: 'mastered', label: 'Mastered', min: 90 },
  { key: 'strong', label: 'Strong', min: 80 },
  { key: 'passing', label: 'Passing', min: 70 },
  { key: 'working', label: 'Working at it', min: 1 },
  { key: 'not-yet', label: 'Not yet tested', min: 0 },
];

// A score → its band. `null`/undefined means no exam has been taken, which is
// NOT a zero score: it reads "Not yet tested" so an untested learner is never
// shown as a failing one.
export function competencyBand(pct) {
  if (pct === null || pct === undefined || Number.isNaN(Number(pct))) {
    return COMPETENCY_BANDS[COMPETENCY_BANDS.length - 1];
  }
  const n = Math.max(0, Math.min(100, Math.round(Number(pct))));
  if (n <= 0) return COMPETENCY_BANDS[COMPETENCY_BANDS.length - 1];
  return COMPETENCY_BANDS.find((b) => n >= b.min) || COMPETENCY_BANDS[COMPETENCY_BANDS.length - 1];
}

function iso(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function intOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

// One database row → the shape the app reads. Unknown columns are dropped; a
// row with no lesson id is not a record and is discarded by the callers.
export function rowToRecord(row = {}) {
  return {
    userId: row.user_id || row.userId || null,
    lessonId: row.lesson_id || row.lessonId || null,
    courseKey: row.course_key || row.courseKey || null,
    learnerLabel: row.learner_label || row.learnerLabel || null,
    ageBand: row.age_band || row.ageBand || null,
    completedAt: iso(row.completed_at || row.completedAt),
    quizPct: intOrNull(row.quiz_pct ?? row.quizPct),
    quizPassed: row.quiz_passed === null || row.quiz_passed === undefined
      ? (row.quizPassed ?? null)
      : !!row.quiz_passed,
    quizAttempts: intOrNull(row.quiz_attempts ?? row.quizAttempts) || 0,
    quizAt: iso(row.quiz_at || row.quizAt),
    updatedAt: iso(row.updated_at || row.updatedAt),
  };
}

// The record the app wants to keep → the row the database takes. `user_id` is
// deliberately absent: the column defaults to auth.uid() and the write wall
// refuses any other account, so the client never names the owner (DR-0060).
export function recordToRow(rec = {}) {
  const row = {
    lesson_id: rec.lessonId,
    course_key: rec.courseKey ?? null,
    learner_label: rec.learnerLabel ?? null,
    age_band: rec.ageBand ?? null,
    completed_at: iso(rec.completedAt),
    quiz_pct: intOrNull(rec.quizPct),
    quiz_passed: rec.quizPassed === null || rec.quizPassed === undefined ? null : !!rec.quizPassed,
    quiz_attempts: intOrNull(rec.quizAttempts) || 0,
    quiz_at: iso(rec.quizAt),
    updated_at: new Date().toISOString(),
  };
  return row;
}

// Fold a set of rows into the shell's two device-local maps, so a record
// written on his phone shows up on the tablet he reads on next. The device
// copy WINS on a module it already knows, because it is what he is looking at
// right now; the rows fill in everything that device never saw.
export function mergeRecordsIntoState(records = [], { progress = {}, quizState = {} } = {}) {
  const nextProgress = { ...progress };
  const nextQuiz = { ...quizState };
  for (const rec of records) {
    if (!rec?.lessonId) continue;
    if (rec.completedAt && !nextProgress[rec.lessonId]) {
      nextProgress[rec.lessonId] = rec.completedAt;
    }
    if (rec.quizAt && !nextQuiz[rec.lessonId]) {
      nextQuiz[rec.lessonId] = {
        passed: !!rec.quizPassed,
        pct: rec.quizPct === null ? 0 : rec.quizPct,
        at: rec.quizAt,
      };
    }
  }
  return { progress: nextProgress, quizState: nextQuiz };
}

function summarize(records) {
  const lessonsRead = records.filter((r) => !!r.completedAt).length;
  const tested = records.filter((r) => r.quizPct !== null && r.quizPct !== undefined);
  const scores = tested.map((r) => r.quizPct);
  const passed = tested.filter((r) => r.quizPassed === true).length;
  const attempts = records.reduce((sum, r) => sum + (r.quizAttempts || 0), 0);
  const avgQuizPct = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const bestQuizPct = scores.length ? Math.max(...scores) : null;
  const lastActivityAt = records
    .map((r) => r.quizAt || r.completedAt || r.updatedAt)
    .filter(Boolean)
    .sort()
    .pop() || null;
  return {
    lessons: records.length,
    lessonsRead,
    examsTaken: tested.length,
    examsPassed: passed,
    quizAttempts: attempts,
    avgQuizPct,
    bestQuizPct,
    competency: competencyBand(avgQuizPct),
    lastActivityAt,
  };
}

// Completion is measured against the course the learner is actually in, when
// the caller knows how many lessons it holds. `courseTotals` is
// { [courseKey]: lessonCount }. Without it, completion stays null rather than
// being invented from the rows the learner happens to have (P15 — a painted
// number is worse than none on a surface whose value is trust).
function withCompletion(summary, courseTotals, courseKey) {
  const total = courseTotals && courseKey ? Number(courseTotals[courseKey]) : NaN;
  if (!Number.isFinite(total) || total <= 0) {
    return { ...summary, courseLessons: null, completionPct: null };
  }
  return {
    ...summary,
    courseLessons: total,
    completionPct: Math.min(100, Math.round((summary.lessonsRead / total) * 100)),
  };
}

// Every learner's record, rolled up per learner and per course. The Governor
// reads this; a learner reading his own record gets the same shape with one
// learner in it, because the read wall already decided what rows he sees.
export function aggregateLearnerRecords(rows = [], { courseTotals = null } = {}) {
  const records = (Array.isArray(rows) ? rows : [])
    .map((r) => (r && r.lessonId !== undefined ? r : rowToRecord(r || {})))
    .filter((r) => r && r.lessonId);

  const byLearner = new Map();
  for (const rec of records) {
    const key = rec.userId || 'unknown';
    if (!byLearner.has(key)) byLearner.set(key, []);
    byLearner.get(key).push(rec);
  }

  const learners = [...byLearner.entries()].map(([userId, list]) => {
    const byCourse = new Map();
    for (const rec of list) {
      const ck = rec.courseKey || 'unplaced';
      if (!byCourse.has(ck)) byCourse.set(ck, []);
      byCourse.get(ck).push(rec);
    }
    const courses = [...byCourse.entries()]
      .map(([courseKey, cl]) => ({
        courseKey,
        ...withCompletion(summarize(cl), courseTotals, courseKey),
      }))
      .sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''));
    return {
      userId,
      // A label only if the learner's own record carries one; never invented.
      label: list.map((r) => r.learnerLabel).find(Boolean) || null,
      ageBand: list.map((r) => r.ageBand).find(Boolean) || null,
      ...summarize(list),
      courses,
    };
  }).sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''));

  return {
    learners,
    totals: {
      learners: learners.length,
      ...summarize(records),
    },
  };
}
