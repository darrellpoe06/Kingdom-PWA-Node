// =============================================================================
// learn-crosslist — a lesson taught in one course, shelved in another department
// =============================================================================
// Darrell 2026-09-16: "Most people want Ai understanding built in their
// curriculum" — and, of the department that gathers it, "can we use
// cross-referenced lessons that get credited either way."
//
// DR-0447 fixed the COUNT: the A.I. department really does hold three courses
// and 35 lessons, not one course and eight. But a count is not what he asked
// for. The curriculum teaches about A.I. in nine more places — the tower and
// the race in Living Lessons, the church's own GPU node in Data Systems, our
// models on our own hardware in The Infrastructure — and a reader standing in
// the A.I. department could not see any of it. Those lessons are not A.I.
// courses; they are the curriculum's A.I. understanding, scattered where it
// was taught. This gathers them WITHOUT moving them.
//
// THE RULE THAT MAKES "CREDITED EITHER WAY" TRUE BY CONSTRUCTION: a
// cross-listing is a POINTER, never a copy. A lesson has exactly one home
// course, and opening it from a department opens it IN that home course — same
// lesson, same session flow, same tutor, same place record (learn-resume.js
// keys { courseKey, lessonId }). So the credit cannot fork, because there was
// never a second identity to credit. Nothing is duplicated, so the program's
// own totals are untouched (25 courses, 486 lessons, before and after).
//
// The declarations below are a DECISION — which of the curriculum's lessons
// teach A.I. understanding — so they are written down, one line each with its
// reason, rather than guessed from a title match (a regex on "machine" or
// "data" pulls in a lesson about reasoning and one about a jar of secrets).
// What is NOT hand-kept is the lesson itself: every title, reference and unit
// label is read live from the mounted course (DR-0121), and a declaration whose
// lesson no longer exists FAILS THE BUILD rather than rendering a dead row.
//
// Pure + dependency-free; unit-tested in learn-crosslist.test.js.

export const CROSS_LISTINGS = [
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll34-the-tower-the-race-and-the-sovereign',
    why: 'Discernment in the age of A.I. — the tower, the race, and who is actually sovereign over it.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll67-made-in-his-image-we-make-why-ai-is-not-a-soul',
    why: 'What a machine is and is not: made in His image we make, and why A.I. is not a soul.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll21-hidden-vs-known',
    why: 'The needs no machine can meet — belonging and being known are not fillable by a model.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll99-watch-and-be-ready-no-date-setting-and-a-sober-word-on-ai-and-prophecy',
    why: 'A sober word on A.I. and prophecy, and why no date is set by either.',
  },
  {
    department: 'A.I. The Way', courseKey: 'living-lessons',
    lessonId: 'll163-the-build-we-are-going-for-and-why-according-to-the-word-a-school-yahweh-first',
    why: 'Why we build technology at all, Yahweh first — the frame every A.I. lesson here sits inside.',
  },
  {
    department: 'A.I. The Way', courseKey: 'datasystems',
    lessonId: 'dsi5-meet-ari',
    why: 'Meet Ari — the sovereign A.I. this house actually runs, and what it is for.',
  },
  {
    department: 'A.I. The Way', courseKey: 'datasystems',
    lessonId: 'dsi7-the-gpu-node',
    why: 'The GPU node: local A.I. at the church, on hardware the church owns.',
  },
  {
    department: 'A.I. The Way', courseKey: 'infrastructure',
    lessonId: 'inf6-local-ai',
    why: 'Our own A.I. — Ollama and the models running on our own machines.',
  },
  {
    department: 'A.I. The Way', courseKey: 'broadcast',
    lessonId: 'bc7-llms-for-broadcast',
    why: 'A.I. that serves the broadcast — and how it really works under the hood.',
  },
];

/** The declarations shelved into one department, in their authored order. */
export function crossListingsFor(department) {
  const d = String(department || '');
  return d ? CROSS_LISTINGS.filter((c) => c.department === d) : [];
}

/** Every department that gathers cross-listed lessons, first-seen order. */
export function crossListedDepartments() {
  const seen = [];
  for (const c of CROSS_LISTINGS) if (!seen.includes(c.department)) seen.push(c.department);
  return seen;
}

/**
 * Resolve a department's cross-listings against the LIVE lesson index
 * (learn-organize.buildLessonIndex over the whole mounted catalog). Each row
 * carries what the shelf renders — read from the lesson, never retyped — plus
 * the home course to open. A declaration whose lesson is not mounted is
 * dropped here and reported by missingCrossListings(), so the reader never
 * meets a row that opens nothing.
 */
export function resolveCrossListed(department, index) {
  const rows = Array.isArray(index) ? index : [];
  const byKey = new Map(rows.map((r) => [`${r.courseKey}::${r.lessonId}`, r]));
  const out = [];
  for (const c of crossListingsFor(department)) {
    const r = byKey.get(`${c.courseKey}::${c.lessonId}`);
    if (!r) continue;
    out.push({
      department: c.department,
      courseKey: c.courseKey,
      courseTitle: r.courseTitle,
      lessonId: c.lessonId,
      title: r.title,
      ref: r.ref,
      unitLabel: r.unitLabel,
      why: c.why,
    });
  }
  return out;
}

/**
 * THE GATE. Declarations that name a lesson the mounted catalog does not carry
 * — a renamed id, a removed lesson, a typo. Returned as readable
 * "course :: lesson" strings so a failing test says which line to fix.
 */
export function missingCrossListings(index) {
  const have = new Set((Array.isArray(index) ? index : []).map((r) => `${r.courseKey}::${r.lessonId}`));
  return CROSS_LISTINGS
    .filter((c) => !have.has(`${c.courseKey}::${c.lessonId}`))
    .map((c) => `${c.courseKey} :: ${c.lessonId}`);
}

/**
 * A cross-listing may never name a lesson that already lives in the department
 * it is shelved into — that would double-count the department's own course and
 * make the same lesson reachable twice under two different counts.
 */
export function selfListedCrossListings(departmentsOf) {
  const of = typeof departmentsOf === 'function' ? departmentsOf : () => '';
  return CROSS_LISTINGS
    .filter((c) => of(c.courseKey) === c.department)
    .map((c) => `${c.courseKey} :: ${c.lessonId}`);
}

/** How many lessons a department gathers from elsewhere. */
export function crossListedCount(department) {
  return crossListingsFor(department).length;
}
