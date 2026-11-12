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
  if (!record) return [];
  const h = Array.isArray(record.quizHistory) ? record.quizHistory.filter(Boolean) : [];
  const hasSummary = record.quizPassed === true || (record.quizPct !== null && Number.isFinite(Number(record.quizPct)));
  const best = hasSummary
    ? { at: record.quizAt || record.updatedAt || record.completedAt, pct: record.quizPct, passed: record.quizPassed === true ? true : record.quizPassed === false ? false : null }
    : null;
  if (!h.length) return best ? [best] : [];
  // DR-1434 (Darrell 2026-11-12, "I have more than 2 courses completed"): the
  // history is kept only from the day migration 0313 was applied, while the
  // row's own quiz_passed / quiz_pct is the BEST of every attempt (0313's own
  // words). A pass the row holds that the history does not is still a pass,
  // so it stands beside the history instead of being dropped by it.
  if (best && isPass(best) && !h.some(isPass)) return [...h, best];
  return h;
}

/**
 * Did this attempt pass? A score of 100% is a pass whatever the mark, even
 * where an older write left `passed` empty; an attempt marked failed stays
 * failed.
 */
export function isPass(e) {
  if (!e) return false;
  if (e.passed === true) return true;
  if (e.passed === false) return false;
  return Number(e.pct) >= 100;
}

/** The lessons of one course that are read but whose exam is not passed yet, in course order. */
export function examsOwed(records = [], courseKey, ids = []) {
  const read = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (!r || r.courseKey !== courseKey || !r.lessonId) continue;
    const prev = read.get(r.lessonId);
    const isRead = !!(r.readEvidenceAt || r.completedAt);
    const done = doneAt(r) !== null;
    read.set(r.lessonId, { read: isRead || (prev && prev.read), done: done || (prev && prev.done) });
  }
  return (Array.isArray(ids) ? ids : []).map((id, i) => ({ id, n: i + 1 })).filter((x) => read.get(x.id)?.read && !read.get(x.id)?.done);
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
  const passes = attemptsOf(record)
    .filter(isPass)
    .map((e) => ms(e.at))
    .filter((t) => t !== null);
  if (!passes.length) return null;
  return Math.max(read, Math.min(...passes));
}

/** Was this lesson mastered: read, and an exam answered entirely right. */
export function masteredAt(record) {
  const done = doneAt(record);
  if (done === null) return null;
  const full = attemptsOf(record).some((e) => isPass(e) && Number(e.pct) >= 100);
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
      byCourse.get(r.courseKey).set(r.lessonId, {
        done: t,
        mastered: masteredAt(r),
        read: !!(r.readEvidenceAt || r.completedAt) || !!(prev && prev.read),
        tested: attemptsOf(r).length > 0 || !!(prev && prev.tested),
        tries: Math.max(Number(r.quizAttempts) || 0, attemptsOf(r).length) + ((prev && prev.tries) || 0),
      });
    } else {
      // A second row for a lesson already counted still adds its reading, its trying and its tries.
      prev.read = prev.read || !!(r.readEvidenceAt || r.completedAt);
      prev.tested = prev.tested || attemptsOf(r).length > 0;
      prev.tries += Math.max(Number(r.quizAttempts) || 0, attemptsOf(r).length);
    }
  }
  const courses = [];
  const doneMoments = [];
  let lessonsTotal = 0;
  let lessonsDone = 0;
  let mastered = 0;
  let lessonsRead = 0;
  let lessonsTested = 0;
  let tries = 0;
  for (const [courseKey, ids] of Object.entries(courseLessonIds || {})) {
    if (!Array.isArray(ids) || !ids.length) continue; // unknown goal: not counted
    const seen = byCourse.get(courseKey) || new Map();
    let done = 0;
    let mast = 0;
    let read = 0;
    let courseTries = 0;
    let grow = 0;
    for (const id of ids) {
      const hit = seen.get(id);
      if (hit && hit.read) read += 1;
      if (hit && hit.tested) lessonsTested += 1;
      // Studied (read or tested) and not yet understood: the room to grow.
      if (hit && (hit.read || hit.tested) && hit.mastered === null) grow += 1;
      if (hit) courseTries += hit.tries || 0;
      if (hit && hit.done !== null) {
        done += 1;
        doneMoments.push(hit.done);
        if (hit.mastered !== null) mast += 1;
      }
    }
    lessonsTotal += ids.length;
    lessonsDone += done;
    mastered += mast;
    lessonsRead += read;
    tries += courseTries;
    courses.push({ courseKey, total: ids.length, done, read, tries: courseTries, grow, toGo: ids.length - done, mastered: mast, complete: done === ids.length, readInFull: read === ids.length, understoodAll: mast === ids.length });
  }
  const coursesComplete = courses.filter((c) => c.complete).length;
  return {
    courses,
    coursesTotal: courses.length,
    coursesComplete,
    // DR-1439: reading counts on its own, and every try is study.
    coursesRead: courses.filter((c) => c.readInFull).length,
    coursesUnderstood: courses.filter((c) => c.understoodAll).length,
    lessonsRead,
    lessonsTested,
    tries,
    coursesToGo: courses.length - coursesComplete,
    lessonsTotal,
    lessonsDone,
    lessonsToGo: lessonsTotal - lessonsDone,
    mastered,
    doneMoments: doneMoments.sort((a, b) => a - b),
  };
}

/**
 * COURSES EARN CROWNS (DR-1440, Darrell 2026-11-12: "Courses should be
 * rewarded", "Courses should earn crowns", "Starting the record with how many
 * crowns"). A lesson earns a lion; a course earns a crown:
 *   crown        completed: every lesson read and its exam passed
 *   crown, 100%  and every lesson understood at 100% (the crown made full)
 *   book         every lesson read in full, exams still to pass
 * Crowns first (100% before the rest), then books, then by name. Pure.
 */
export const COURSE_AWARDS = Object.freeze({
  crownFull: 'Crown at 100%: every lesson understood',
  crown: 'Crown: every lesson read and passed',
  book: 'Read in full: every lesson read, exams still to pass',
});
export function courseAwards(stand) {
  const rank = { crownFull: 0, crown: 1, book: 2 };
  return (stand && Array.isArray(stand.courses) ? stand.courses : [])
    .map((c) => ({ courseKey: c.courseKey, kind: c.complete && c.understoodAll ? 'crownFull' : c.complete ? 'crown' : c.readInFull ? 'book' : null }))
    .filter((a) => a.kind)
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.courseKey.localeCompare(b.courseKey))
    .map((a) => ({ ...a, award: a.kind === 'book' ? 'book' : 'crown', label: COURSE_AWARDS[a.kind] }));
}

/** How many crowns this record holds: one for each course completed. Pure. */
export function crownCount(stand) {
  return stand && Number.isFinite(stand.coursesComplete) ? stand.coursesComplete : 0;
}

/**
 * MOST STUDIED (DR-1439, Darrell 2026-11-12: "Most studied subjects and or
 * material"). Understanding comes by the repetition of the study, so the
 * courses are ranked by how often they were studied: times tested, then
 * lessons read. A course never opened is not listed. Pure.
 */
export function mostStudied(stand, n = 3) {
  return (stand && Array.isArray(stand.courses) ? stand.courses : [])
    .filter((c) => (c.tries || 0) + (c.read || 0) > 0)
    .sort((a, b) => (b.tries || 0) - (a.tries || 0) || (b.read || 0) - (a.read || 0) || a.courseKey.localeCompare(b.courseKey))
    .slice(0, n);
}

/**
 * MOST OPPORTUNITIES TO GROW UNDERSTANDING (DR-1439, Darrell 2026-11-12). The
 * courses holding the most lessons already studied (read or tested) but not
 * yet understood at 100%: the nearest gains, where one more round of study
 * turns into understanding. Ranked by that count, then by how much was
 * studied. A course with none is not listed. Pure.
 */
export function growthOpportunities(stand, n = 3) {
  return (stand && Array.isArray(stand.courses) ? stand.courses : [])
    .filter((c) => (c.grow || 0) > 0)
    .sort((a, b) => b.grow - a.grow || (b.tries || 0) - (a.tries || 0) || a.courseKey.localeCompare(b.courseKey))
    .slice(0, n);
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
    return {
      perWeek: null,
      basisDays: null,
      basisCount: moments.length,
      finishAt: null,
      far: false,
      why: `${moments.length} lesson${moments.length === 1 ? '' : 's'} read and tested so far — two are needed before a pace can be measured`,
    };
  }
  const span = moments[moments.length - 1] - moments[0];
  // Lessons finished across the days they span. The first lesson opens the
  // window rather than counting inside it, so n events give n-1 intervals.
  const days = span / DAY;
  if (!(days > 0)) {
    return {
      perWeek: null,
      basisDays: 0,
      basisCount: moments.length,
      finishAt: null,
      far: false,
      why: 'every finished lesson lands in the same moment — a pace needs more than one day',
    };
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
