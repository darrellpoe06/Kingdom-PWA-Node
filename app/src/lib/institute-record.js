// =============================================================================
// institute-record — the student's own accomplishments, every line from a real row
// =============================================================================
// Darrell 2026-11-26: students "want to see their competency increase" and have
// "their work and skills of accomplishments" acknowledged. "Give credit where
// it's due." The record already exists (learner_records rows, the shell's quiz
// and progress maps); the Institute home did not show it. This file turns the
// student's OWN rows into what the home acknowledges. Pure over injected inputs.
//
// WHERE EACH LINE COMES FROM (nothing is painted):
//   • lessons finished — rows with completedAt, plus the shell's progress map.
//   • exams taken / passed, average — rows with quizPct, plus the shell's quiz
//     map; one score per lesson (the row wins, the same rule as record-headline).
//   • standing — competencyBand(average): the app's own bands and pass line.
//   • growth — the average of the newer half of the dated scores against the
//     older half. Fewer than four dated scores → null, and the surface says the
//     trend appears after four exams instead of drawing one.
//   • earned — each passed exam, newest first, with its real title and date. A
//     lesson whose title is not in the mounted catalog is counted but not listed.
import { competencyBand } from './learner-records.js';

const DAY = 86400000;
const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const mean = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** lessonId → { title, courseKey, course } over the mounted courses. */
export function lessonIndex(courses = []) {
  const out = new Map();
  for (const c of Array.isArray(courses) ? courses : []) {
    const key = c && (c.key || (c.meta && c.meta.key));
    const course = (c && c.meta && c.meta.title) || String(key || '');
    let rows = (c && c.schedule) || null;
    if (!rows && c && typeof c.buildScheduleRows === 'function') {
      try {
        rows = c.buildScheduleRows(); // the catalog holds builders, not built schedules
      } catch {
        rows = null;
      }
    }
    for (const m of rows || []) {
      if (m && m.id && !out.has(m.id)) out.set(m.id, { title: m.title || null, courseKey: key || null, course, courseRef: c });
    }
  }
  return out;
}

export function myAccomplishments({ records = [], quizState = {}, progress = {}, courses = [], index: given = null, userId = null, now = Date.now(), limit = 6 } = {}) {
  const index = given || lessonIndex(courses);
  const rows = (Array.isArray(records) ? records : []).filter((r) => r && r.lessonId && (!userId || !r.userId || r.userId === userId));

  const read = new Map(); // lessonId → iso
  for (const r of rows) if (r.completedAt) read.set(r.lessonId, r.completedAt);
  for (const [id, at] of Object.entries(progress || {})) if (at && !read.has(id)) read.set(id, typeof at === 'string' ? at : '');

  const exams = new Map(); // lessonId → { pct, passed, at }
  for (const r of rows) {
    const pct = num(r.quizPct);
    if (pct !== null) exams.set(r.lessonId, { pct, passed: r.quizPassed === true, at: r.quizAt || '' });
  }
  for (const [id, q] of Object.entries(quizState || {})) {
    const pct = q ? num(q.pct) : null;
    if (pct !== null && !exams.has(id)) exams.set(id, { pct, passed: q.passed === true, at: q.at || '' });
  }

  const all = [...exams.entries()].map(([lessonId, e]) => ({ lessonId, ...e }));
  const average = mean(all.map((e) => e.pct));
  const dated = all.filter((e) => e.at && !Number.isNaN(new Date(e.at).getTime())).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  let growth = null;
  if (dated.length >= 4) {
    const half = Math.floor(dated.length / 2);
    const earlier = mean(dated.slice(0, half).map((e) => e.pct));
    const recent = mean(dated.slice(dated.length - half).map((e) => e.pct));
    growth = { earlier, recent, change: recent - earlier, exams: dated.length };
  }
  const within = (iso) => {
    const t = iso ? new Date(iso).getTime() : NaN;
    return !Number.isNaN(t) && now - t <= 30 * DAY && t <= now + DAY;
  };
  const passed = all.filter((e) => e.passed);
  const titled = passed.filter((e) => index.has(e.lessonId) && index.get(e.lessonId).title).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const earned = titled.slice(0, limit).map((e) => ({ ...e, ...index.get(e.lessonId) }));

  return {
    lessonsFinished: read.size,
    examsTaken: all.length,
    examsPassed: passed.length,
    average,
    band: competencyBand(average),
    growth,
    last30: { passed: passed.filter((e) => within(e.at)).length, finished: [...read.values()].filter(within).length },
    earned,
    earnedMore: passed.length - earned.length,
  };
}
