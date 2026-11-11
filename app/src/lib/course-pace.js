// =============================================================================
// course-pace — the goal, the gap, and the date this pace reaches it
// =============================================================================
// Darrell, 2026-11-11, on the exam figures: "Completed courses... mastery at
// 100% tested... should need the goal and measurements", then "Read and
// tested...", then "Fully completed courses... x amount x to go... on pace for
// completing by x date at this pace".
//
// WHAT THE RECORD ALREADY SAID, AND WHAT IT DID NOT. The learner's card counts
// lessons read, exams taken, exams passed and an average, and each course shows
// a completion percent. Every one of those is a COUNT OF THE PAST. None of them
// states a GOAL, none says how far is left, and nothing anywhere in app/src/lib
// computed a completed COURSE or a date. So the figures could grow all week and
// never answer "am I going to finish, and when".
//
// DONE MEANS READ AND TESTED, in his words. A lesson counts toward a course
// only when the reading is on the record AND its exam has been passed. Read
// alone is not done; a pass with nothing read is not done either (that case is
// already its own figure, "Passed before the lesson"). Mastery at 100% is
// counted BESIDE it, never folded into it, because they answer different
// questions and DR-1386 keeps taking and grading apart.
//
// THE DATE IS MEASURED, NEVER PAINTED (DR-0076 §4). The pace is this learner's
// own finished lessons over the days they actually span -- not a target, not an
// average of other people. Where the record cannot support a projection it says
// so and offers NO date: one finished lesson is not a pace, and a projection
// from nothing is the painted number this house refuses (DR-0061 / P15). An
// unreachable pace reads as "longer than ten years" rather than a precise day
// in the next century, which is true but useless to a reader.
// =============================================================================

const DAY = 86400000;
/** Two finished lessons are the fewest that can describe a rate. */
export const MIN_FOR_PACE = 2;
/** Past this, a precise date tells a reader nothing useful. */
export const FAR_YEARS = 10;

/**
 * A RATE MUST NEVER ROUND TO ZERO WHILE IT IS REAL. One decimal place turns a
 * true 0.0019 lessons a week into "0", which a reader takes as no progress at
 * all — the false zero this house keeps finding (DR-1186's shape, in a rate).
 * A tenth is plenty once the pace is brisk; below that, keep two significant
 * figures so slow and stopped never render the same.
 */
export function roundRate(n) {
  if (!(n > 0)) return 0;
  if (n >= 1) return Math.round(n * 10) / 10;
  const f = Math.pow(10, Math.ceil(-Math.log10(n)) + 1);
  return Math.round(n * f) / f;
}

const ms = (v) => {
  const t = typeof v === 'number' ? v : Date.parse(v || '');
  return Number.isFinite(t) ? t : null;
};

/**
 * THE SUMMARY COLUMNS ARE A REAL ATTEMPT (measured 2026-11-11). `rowToRecord`
 * fills `quizHistory` ONLY from a `quiz_history` column; a record that keeps
 * the single-attempt summary (`quiz_passed`, `quiz_pct`, `quiz_at`) arrives
 * with an EMPTY history. Reading only the array rendered such a learner as
 * "Read and tested 0 of 2" on the same screen that said "Exams passed 2" — a
 * false zero, caught by the render check rather than by the unit test, because
 * the unit test had fabricated the array the live rows do not carry.
 */
export function attemptsOf(record) {
  const h = Array.isArray(record && record.quizHistory) ? record.quizHistory.filter(Boolean) : [];
  if (h.length) return h;
  if (!record) return [];
  const hasSummary = record.quizPassed === true || Number.isFinite(Number(record.quizPct));
  if (!hasSummary) return [];
  return [{ at: record.quizAt || record.updatedAt || record.completedAt, pct: record.quizPct, passed: record.quizPassed === true }];
}

/**
 * When this lesson became DONE: the later of the reading on record and the
 * first passing attempt. Null when either half is missing — that is the whole
 * point of "read and tested".
 */
export function doneAt(record) {
  if (!record) return null;
  const read = ms(record.readEvidenceAt) ?? ms(record.completedAt);
  if (read === null) return null;
  const passes = attemptsOf(record).filter((e) => e && e.passed).map((e) => ms(e.at)).filter((t) => t !== null);
  if (!passes.length) return null;
  return Math.max(read, Math.min(...passes));
}

/** Was this lesson mastered: read, and an exam answered entirely right. */
export function masteredAt(record) {
  const done = doneAt(record);
  if (done === null) return null;
  const full = attemptsOf(record).some((e) => e && e.passed && Number(e.pct) >= 100);
  return full ? done : null;
}

/**
 * Course by course, from this learner's own records and the course's lesson
 * ids. A course with no known lesson ids is NOT counted — its goal is unknown,
 * and an unknown goal must never read as a reached one.
 * @returns {{courses:Array, coursesTotal:number, coursesComplete:number, coursesToGo:number,
 *   lessonsTotal:number, lessonsDone:number, lessonsToGo:number, mastered:number, doneMoments:number[]}}
 */
export function standing(records = [], courseLessonIds = {}) {
  const byCourse = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (!r || !r.courseKey || !r.lessonId) continue;
    if (!byCourse.has(r.courseKey)) byCourse.set(r.courseKey, new Map());
    const prev = byCourse.get(r.courseKey).get(r.lessonId);
    // One record per lesson wins: the earliest moment it was both read and passed.
    const t = doneAt(r);
    if (!prev || (t !== null && (prev.done === null || t < prev.done))) {
      byCourse.get(r.courseKey).set(r.lessonId, { done: t, mastered: masteredAt(r) });
    }
  }
  const courses = [];
  const doneMoments = [];
  let lessonsTotal = 0;
  let lessonsDone = 0;
  let mastered = 0;
  for (const [courseKey, ids] of Object.entries(courseLessonIds || {})) {
    if (!Array.isArray(ids) || !ids.length) continue; // unknown goal: not counted
    const seen = byCourse.get(courseKey) || new Map();
    let done = 0;
    let mast = 0;
    for (const id of ids) {
      const hit = seen.get(id);
      if (hit && hit.done !== null) {
        done += 1;
        doneMoments.push(hit.done);
        if (hit.mastered !== null) mast += 1;
      }
    }
    lessonsTotal += ids.length;
    lessonsDone += done;
    mastered += mast;
    courses.push({ courseKey, total: ids.length, done, toGo: ids.length - done, mastered: mast, complete: done === ids.length });
  }
  const coursesComplete = courses.filter((c) => c.complete).length;
  return {
    courses,
    coursesTotal: courses.length,
    coursesComplete,
    coursesToGo: courses.length - coursesComplete,
    lessonsTotal,
    lessonsDone,
    lessonsToGo: lessonsTotal - lessonsDone,
    mastered,
    doneMoments: doneMoments.sort((a, b) => a - b),
  };
}

/**
 * The pace this record actually shows, and where it lands.
 * @returns {{perWeek:number|null, basisDays:number|null, basisCount:number,
 *   finishAt:number|null, far:boolean, why:string}}
 */
export function pace(stand, now = Date.now()) {
  const moments = stand && Array.isArray(stand.doneMoments) ? stand.doneMoments : [];
  const toGo = stand ? stand.lessonsToGo : 0;
  if (stand && stand.lessonsTotal > 0 && toGo === 0) {
    return { perWeek: null, basisDays: null, basisCount: moments.length, finishAt: null, far: false, why: 'every lesson on every course is read and tested' };
  }
  if (moments.length < MIN_FOR_PACE) {
    return { perWeek: null, basisDays: null, basisCount: moments.length, finishAt: null, far: false, why: `${moments.length} lesson${moments.length === 1 ? '' : 's'} read and tested so far — two are needed before a pace can be measured` };
  }
  const span = moments[moments.length - 1] - moments[0];
  // Lessons finished across the days they span. The first lesson opens the
  // window rather than counting inside it, so n events give n-1 intervals.
  const days = span / DAY;
  if (!(days > 0)) {
    return { perWeek: null, basisDays: 0, basisCount: moments.length, finishAt: null, far: false, why: 'every finished lesson lands in the same moment — a pace needs more than one day' };
  }
  const perDay = (moments.length - 1) / days;
  const perWeek = roundRate(perDay * 7);
  const daysLeft = toGo / perDay;
  const far = daysLeft > FAR_YEARS * 365;
  return {
    perWeek,
    basisDays: Math.round(days * 10) / 10,
    basisCount: moments.length,
    finishAt: far ? null : Math.round(now + daysLeft * DAY),
    far,
    why: '',
  };
}

/** The whole answer in one call: where you stand and where this pace lands. */
export function courseStanding(records = [], courseLessonIds = {}, now = Date.now()) {
  const stand = standing(records, courseLessonIds);
  return { ...stand, pace: pace(stand, now) };
}
