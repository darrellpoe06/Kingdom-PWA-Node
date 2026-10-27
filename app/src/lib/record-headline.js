// =============================================================================
// record-headline — the learner's record, announced: how much has been
// consumed, what the exams prove, and the next thing to do (DR-1260)
// =============================================================================
// Darrell 2026-10-27, with his Class Record open (54 lessons read, average
// 100%, 3 exams passed, folded under one Learn area): "The record should be
// more announced so it can be used and known for how much knowledge has been
// consumed and how many test reflect the competence of the information... so
// users can be motivated to do more or finish more tests and reading."
//
// PURE. One headline from everything the app really holds for ONE learner:
//   • his cloud rows (learner_lesson_records: completed, exam, versions read),
//   • the device's places (finishes, versions — filed to the rows, but the
//     row may not have arrived yet, DR-0622),
//   • the shell's merged maps (progress, quizState),
//   • the mounted catalog (how many lessons, how many carry an exam, the
//     versions each carries).
// Every number is counted from a real record against the real catalog.
// Nothing is painted (P15): a learner with nothing read reads as zero, a
// lesson the catalog does not carry is not counted, and "untested" counts
// only lessons that HAVE an exam to answer.
// =============================================================================
import { placeFinishes, versionsRead, READ_VERSION_IDS } from './learn-resume.js';
import { competencyBand } from './learner-records.js';
import { lessonVersions, countReadings } from './learn-organize.js';
import { VERSION_LABEL, bandVersion } from './lesson-read-mark.js';

const hasQuiz = (m) => Array.isArray(m?.quiz?.questions) && m.quiz.questions.length > 0;
const later = (a, b) => (String(b || '') > String(a || '') ? b : a);

/**
 * @param {object} p
 * @param {Array}  p.records   the learner's OWN rows (already his; never another learner's)
 * @param {Array}  p.places    the device's places (lib/learn-resume listPlaces())
 * @param {Array}  p.courses   the mounted catalog
 * @param {object} p.progress  { [lessonId]: completedAt } — the shell's merged map
 * @param {object} p.quizState { [lessonId]: { passed, pct, at } } — the shell's merged map
 * @param {string} p.ageBand   the reader's band, for the version an unversioned read served
 */
export function recordHeadline({ records = [], places = [], courses = [], progress = {}, quizState = {}, ageBand = 'adult' } = {}) {
  const byId = new Map();
  const courseOf = new Map();
  for (const c of Array.isArray(courses) ? courses : []) {
    const key = c?.key || c?.meta?.key;
    for (const m of (c?.schedule || [])) {
      if (!m?.id || byId.has(m.id)) continue;
      byId.set(m.id, m);
      courseOf.set(m.id, { key, title: c?.meta?.title || String(key || '') });
    }
  }
  const lessonsTotal = byId.size;
  const readingsTotal = countReadings([...byId.values()]).readings;
  const examsAvailable = [...byId.values()].filter(hasQuiz).length;

  const recById = new Map();
  for (const r of Array.isArray(records) ? records : []) if (r?.lessonId && byId.has(r.lessonId)) recById.set(r.lessonId, r);
  const placeById = new Map();
  for (const p of Array.isArray(places) ? places : []) if (p?.lessonId && byId.has(p.lessonId)) placeById.set(p.lessonId, p);

  // READ: the union of every source, per lesson, with when it was last read.
  const read = new Map(); // lessonId → lastReadAt (iso or '') 
  for (const [id, r] of recById) if (r.completedAt) read.set(id, later(read.get(id), r.completedAt));
  for (const [id, at] of Object.entries(progress || {})) if (at && byId.has(id)) read.set(id, later(read.get(id), at));
  for (const [id, p] of placeById) {
    if (placeFinishes(p) > 0) {
      const at = p.lastFinishedAt ? new Date(p.lastFinishedAt).toISOString() : '';
      read.set(id, later(read.get(id), at));
    }
  }

  // VERSIONS READ, per lesson: the rows' and the places' lists, else the
  // band's version for a read that predates the record (DR-1257).
  const versionsOf = (id) => {
    const ids = new Set();
    for (const v of recById.get(id)?.versionsRead || []) if (VERSION_LABEL[v]) ids.add(v);
    for (const v of versionsRead(placeById.get(id))) ids.add(v);
    if (!ids.size) {
      const m = byId.get(id);
      const have = lessonVersions(m);
      const v = have.length === 1 ? have[0] : bandVersion(m, (recById.get(id)?.ageBand) || ageBand);
      if (v && have.includes(v)) ids.add(v);
    }
    return READ_VERSION_IDS.filter((v) => ids.has(v));
  };
  let readingsRead = 0;
  const versionsEver = new Set();
  for (const id of read.keys()) {
    const vs = versionsOf(id);
    readingsRead += vs.length;
    for (const v of vs) versionsEver.add(v);
  }

  // EXAMS: the union of the rows and the shell's map; a score is a score once.
  const exams = new Map(); // lessonId → { pct, passed, at }
  for (const [id, r] of recById) if (r.quizPct !== null && r.quizPct !== undefined) exams.set(id, { pct: r.quizPct, passed: r.quizPassed === true, at: r.quizAt || '' });
  for (const [id, q] of Object.entries(quizState || {})) {
    if (!q || !byId.has(id) || exams.has(id)) continue;
    if (q.pct === null || q.pct === undefined) continue;
    exams.set(id, { pct: Number(q.pct) || 0, passed: q.passed === true, at: q.at || '' });
  }
  const scores = [...exams.values()].map((e) => e.pct);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const best = scores.length ? Math.max(...scores) : null;
  const passed = [...exams.values()].filter((e) => e.passed).length;

  // THE NEXT THING TO DO — read, with an exam, not yet answered; newest first.
  const untested = [...read.entries()]
    .filter(([id]) => hasQuiz(byId.get(id)) && !exams.has(id))
    .sort((a, b) => String(b[1]).localeCompare(String(a[1])))
    .map(([id]) => ({ lessonId: id, courseKey: courseOf.get(id)?.key || null, title: byId.get(id)?.title || id }));
  // A version never read in any lesson, and the newest read lesson that carries it.
  const nextVersion = READ_VERSION_IDS.find((v) => !versionsEver.has(v)) || null;
  let nextVersionLesson = null;
  if (nextVersion) {
    const newest = [...read.entries()].sort((a, b) => String(b[1]).localeCompare(String(a[1])));
    for (const [id] of newest) {
      if (lessonVersions(byId.get(id)).includes(nextVersion)) { nextVersionLesson = { lessonId: id, courseKey: courseOf.get(id)?.key || null, title: byId.get(id)?.title || id }; break; }
    }
  }

  const lessonsRead = read.size;
  return {
    lessonsTotal,
    lessonsRead,
    readPct: lessonsTotal ? Math.round((lessonsRead / lessonsTotal) * 100) : 0,
    readingsTotal,
    readingsRead,
    examsAvailable,
    examsTaken: exams.size,
    examsPassed: passed,
    avgQuizPct: avg,
    bestQuizPct: best,
    competency: competencyBand(avg),
    untested: untested.length,
    nextExam: untested[0] || null,
    versionsEver: READ_VERSION_IDS.filter((v) => versionsEver.has(v)),
    versionsOffered: READ_VERSION_IDS.length,
    nextVersion,
    nextVersionLesson,
  };
}

/** "54 of 855 lessons read (6%) · 3 exams passed of 3 taken, average 100%". */
export function headlineLine(h) {
  if (!h) return '';
  const read = `${h.lessonsRead} of ${h.lessonsTotal} ${h.lessonsTotal === 1 ? 'lesson' : 'lessons'} read (${h.readPct}%)`;
  const exam = h.examsTaken
    ? `${h.examsPassed} ${h.examsPassed === 1 ? 'exam' : 'exams'} passed of ${h.examsTaken} taken, average ${h.avgQuizPct}%`
    : 'no exam answered yet';
  return `${read} · ${exam}`;
}

/** The one next step the strip offers, or null when every road is walked. */
export function nextStep(h) {
  if (!h) return null;
  if (h.nextExam) {
    return {
      kind: 'exam',
      lessonId: h.nextExam.lessonId,
      courseKey: h.nextExam.courseKey,
      label: `Take the exam on ${h.nextExam.title}`,
      why: `${h.untested} ${h.untested === 1 ? 'lesson' : 'lessons'} read with the exam not yet answered — an exam is what proves the reading`,
    };
  }
  if (h.nextVersion && h.nextVersionLesson) {
    return {
      kind: 'version',
      lessonId: h.nextVersionLesson.lessonId,
      courseKey: h.nextVersionLesson.courseKey,
      version: h.nextVersion,
      label: `Read ${h.nextVersionLesson.title} in the ${VERSION_LABEL[h.nextVersion]} version`,
      why: `${h.versionsEver.length} of ${h.versionsOffered} versions read so far — the same Word, written for ${VERSION_LABEL[h.nextVersion].toLowerCase()} readers, has not been read yet`,
    };
  }
  if (h.lessonsRead < h.lessonsTotal) {
    return { kind: 'read', label: 'Read the next lesson', why: `${h.lessonsTotal - h.lessonsRead} ${h.lessonsTotal - h.lessonsRead === 1 ? 'lesson' : 'lessons'} not read yet` };
  }
  return null;
}
