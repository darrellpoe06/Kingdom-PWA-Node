// =============================================================================
// lessons-walked — the lessons one person chose, how far, and at what level
// =============================================================================
// Darrell, 2026-10-09: "Different lessons I choose to learn from how many times
// and which levels?" And the goal that frames the measure: "Lesson the goal is
// to fill up with Yahweh's Perspectives explicitly... Highest Authority And
// Level... So its easy to See From Deeper space... Yahweh's Way Of Getting
// Life Done With Him..."
//
// The rows are learner_lesson_records (0250): one per person per lesson, with
// the course, the age band the lesson was taken at, when it was completed,
// the quiz score, the attempts, when last. Pure: records in, the walk out.
// Honest about what is held: "times" here is the times a lesson was TESTED
// (quiz attempts) plus whether it was completed; a lesson's opens are not
// recorded per lesson (usage_events records the tab, not the lesson), and the
// line says so rather than counting what it does not have.
import { rowToRecord, competencyBand } from './learner-records.js';

const isoDay = (v) => (v ? String(v).slice(0, 10) : null);

/** One person's walk through the lessons. `titleOf(lessonId, courseKey)` names a lesson when the build knows it. */
export function lessonsWalked(rows = [], userId, { titleOf = () => null } = {}) {
  const records = (Array.isArray(rows) ? rows : [])
    .map((r) => (r && r.lessonId !== undefined ? r : rowToRecord(r || {})))
    .filter((r) => r && r.lessonId && (!userId || r.userId === userId));
  const lessons = records.map((r) => {
    const band = competencyBand(r.quizPct);
    const lastAt = [r.updatedAt, r.quizAt, r.completedAt].filter(Boolean).sort().pop() || null;
    return {
      lessonId: r.lessonId, courseKey: r.courseKey || 'unplaced', title: titleOf(r.lessonId, r.courseKey) || r.lessonId,
      ageBand: r.ageBand || null, completed: !!r.completedAt, completedAt: isoDay(r.completedAt),
      quizPct: r.quizPct, band: band.key, bandLabel: band.label, attempts: r.quizAttempts || 0, lastAt: isoDay(lastAt),
    };
  }).sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')) || a.title.localeCompare(b.title));
  const bands = { mastered: 0, strong: 0, passing: 0, working: 0, 'not-yet': 0 };
  for (const l of lessons) bands[l.band] = (bands[l.band] || 0) + 1;
  const byCourse = new Map();
  for (const l of lessons) {
    const c = byCourse.get(l.courseKey) || { courseKey: l.courseKey, lessons: 0, completed: 0, attempts: 0 };
    c.lessons += 1; if (l.completed) c.completed += 1; c.attempts += l.attempts;
    byCourse.set(l.courseKey, c);
  }
  const byLevel = new Map();
  for (const l of lessons) { const k = l.ageBand || 'unsaid'; byLevel.set(k, (byLevel.get(k) || 0) + 1); }
  return {
    lessons,
    counts: {
      lessons: lessons.length,
      completed: lessons.filter((l) => l.completed).length,
      attempts: lessons.reduce((n, l) => n + l.attempts, 0),
      tested: lessons.filter((l) => l.attempts > 0).length,
      bands,
    },
    byCourse: Array.from(byCourse.values()).sort((a, b) => b.lessons - a.lessons || a.courseKey.localeCompare(b.courseKey)),
    byLevel: Array.from(byLevel.entries()).map(([level, n]) => ({ level, n })).sort((a, b) => b.n - a.n),
    lastAt: lessons[0] ? lessons[0].lastAt : null,
  };
}

/** One honest line. */
export function walkedLine(w) {
  if (!w || w.counts.lessons === 0) return 'No lesson walked yet.';
  const c = w.counts;
  const parts = [`${c.lessons} ${c.lessons === 1 ? 'lesson' : 'lessons'} walked, ${c.completed} completed, across ${w.byCourse.length} ${w.byCourse.length === 1 ? 'course' : 'courses'}`];
  const levels = w.byLevel.filter((l) => l.level !== 'unsaid').map((l) => `${l.n} at ${l.level}`);
  if (levels.length) parts.push(`levels: ${levels.join(', ')}`);
  const b = c.bands;
  const bandBits = [['mastered', 'mastered'], ['strong', 'strong'], ['passing', 'passing'], ['working', 'working at it']].filter(([k]) => b[k] > 0).map(([k, label]) => `${b[k]} ${label}`);
  parts.push(bandBits.length ? `tested ${c.tested} (${bandBits.join(', ')}; ${c.attempts} ${c.attempts === 1 ? 'attempt' : 'attempts'})` : 'none tested yet');
  if (w.lastAt) parts.push(`last ${w.lastAt}`);
  return `${parts.join(' · ')}.`;
}
