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


// =============================================================================
// AND THE SAME QUESTION, ONE LEVEL UP (DR-0516)
// =============================================================================
// Darrell 2026-09-18, reading the live picker: "Why are the business courses
// that have business content and foundational insights and strategies and
// situational analysis Word first in Business however we only show one business
// course... each one could be considered a business course as well as another
// because it is integration of it throughout how do we need to differentiate
// between the following?"
//
// He is right, and it is measurable. 31 self-paced courses sit across 9
// departments, and Business holds exactly ONE (Rent to Own) while at least
// fourteen others are business content by any honest reading: all eight Real
// Estate courses, Kingdom Economics, Legacy Provisions, Handed Forward, both
// Project Management courses, and Development.
//
// The cause is that `meta.category` is a SINGLE string, so a course lives on
// exactly one shelf, and a curriculum whose whole design is integration cannot
// be described by a single string. DR-0447 hit the identical wall for LESSONS
// and answered it with a pointer. This is that answer at course scale.
//
// HOW TO DIFFERENTIATE — the rule, so this never becomes a taste argument:
//
//   HOME is what a course FORMS. Ask one question: if a person completed only
//   this course, what could he now DO that he could not before? The answer
//   names one discipline, and that discipline is the home. Rent to Own forms an
//   operator who can run a rent-to-own business. Financing forms an owner who
//   can read a note and name his position. Kingdom Economics forms a believer
//   who understands ownership, production and circulation. All three are
//   business; none of them is either of the others.
//
//   CROSS-LISTING is what a course SERVES. Everything else it genuinely
//   contributes to, declared as a pointer with a reason.
//
// The invariant is the one that made "credited either way" true for lessons: a
// cross-listed course is a POINTER, never a copy. It keeps one home, one
// credit, one place record. The program's totals do not move — the test pins
// them before and after — because no second identity was ever created.

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

/**
 * COURSE-level cross-listings (DR-0516). A whole course shelved into another
 * department it genuinely serves, as a pointer: `{ department, courseKey, why }`
 * with no lessonId. Home stays whatever `meta.category` says, so the count, the
 * credit and the place record are untouched.
 *
 * Written down one line at a time WITH ITS REASON, because which discipline a
 * course serves is a judgement and a judgement belongs in the record rather
 * than in a title match. What is never hand-kept is the course itself: the
 * title and lesson count are read live from the mounted catalog, and a
 * declaration naming a course the catalog does not carry FAILS THE BUILD.
 */
export const COURSE_CROSS_LISTINGS = [
  // The eight Real Estate courses. Every one is an operating discipline of a
  // property business, which is why a reader standing in Business could not see
  // the department that teaches most of what a property business actually does.
  { department: 'Business', courseKey: 'property-principle', why: 'Why owned property is a principle at all — the footing under every business that holds an asset.' },
  { department: 'Business', courseKey: 'buying-terms', why: 'Price, terms and the count to finish: the acquisition side of any business that buys.' },
  { department: 'Business', courseKey: 'leasing-tenants', why: 'Leasing and tenant selection — choosing who your revenue comes from, judged righteously.' },
  { department: 'Business', courseKey: 'maintenance-trades', why: 'Maintenance, repairs and the trades: operating cost, vendor selection and the work itself.' },
  { department: 'Business', courseKey: 'partnerships', why: 'Who you build with — the agreement, the yoke, the counterparty and the exit.' },
  { department: 'Business', courseKey: 'financing-debt', why: 'The debt you sign and the lender you face: position, timing, and what the head may require.' },
  { department: 'Business', courseKey: 'taxes-records', why: 'What the authorities take and what you can prove — assessments, filings and the register.' },
  { department: 'Business', courseKey: 'management-stewardship', why: 'Management is stewardship: the capstone on operating an asset for somebody other than yourself.' },
  // Kingdom Life & Stewardship, where the economics and the structures live.
  { department: 'Business', courseKey: 'kingdom-economics', why: 'Ownership against consumption, circulation against extraction — the economics under every venture here.' },
  { department: 'Business', courseKey: 'legacy-provisions', why: 'The constitution, the spendthrift wall and forced production: how a holding is structured to outlast its builder.' },
  { department: 'Business', courseKey: 'handed-forward', why: 'Succession — handing a venture to someone who will face problems the founder never met.' },
  // Delivery disciplines, which a business needs and a ministry needs equally.
  { department: 'Business', courseKey: 'project-management', why: 'Scope, schedule and the count before the build — delivery as a discipline.' },
  { department: 'Business', courseKey: 'software-project-management', why: 'The same discipline where the product is software and the estimate is hardest.' },
  { department: 'Business', courseKey: 'development', why: 'Building systems that tell the truth: the make-side of a business that runs on its own tools.' },
];

/** The course declarations shelved into one department, in authored order. */
export function courseCrossListingsFor(department) {
  const d = String(department || '');
  return d ? COURSE_CROSS_LISTINGS.filter((c) => c.department === d) : [];
}

/** Every department that gathers cross-listed COURSES, first-seen order. */
export function courseCrossListedDepartments() {
  const seen = [];
  for (const c of COURSE_CROSS_LISTINGS) if (!seen.includes(c.department)) seen.push(c.department);
  return seen;
}

/**
 * Resolve a department's course cross-listings against the LIVE catalog rows
 * (each `{ key, meta, schedule }` as the picker already has them). Every field
 * a shelf renders is read from the course, never retyped. A declaration whose
 * course is not mounted is dropped here and reported by
 * missingCourseCrossListings(), so a reader never meets a row opening nothing.
 */
export function resolveCourseCrossListed(department, courses) {
  const rows = Array.isArray(courses) ? courses : [];
  const byKey = new Map(rows.map((c) => [c.key, c]));
  const out = [];
  for (const c of courseCrossListingsFor(department)) {
    const r = byKey.get(c.courseKey);
    if (!r) continue;
    out.push({
      department: c.department,
      courseKey: c.courseKey,
      courseTitle: (r.meta && r.meta.title) || r.key,
      homeDepartment: (r.meta && r.meta.category) || 'General Studies',
      lessons: (r.schedule && r.schedule.length) || 0,
      unitCap: r.unitCap || 'Lesson',
      why: c.why,
    });
  }
  return out;
}

/** THE GATE. Course declarations the mounted catalog does not carry. */
export function missingCourseCrossListings(courses) {
  const have = new Set((Array.isArray(courses) ? courses : []).map((c) => c.key));
  return COURSE_CROSS_LISTINGS.filter((c) => !have.has(c.courseKey)).map((c) => c.courseKey);
}

/**
 * A course may never be cross-listed into the department that is already its
 * HOME — that would show it twice on one shelf under two different counts, and
 * it is the one mistake this file exists to prevent.
 */
export function selfListedCourseCrossListings(departmentOf) {
  const of = typeof departmentOf === 'function' ? departmentOf : () => '';
  return COURSE_CROSS_LISTINGS.filter((c) => of(c.courseKey) === c.department).map((c) => c.courseKey);
}

/** How many whole courses a department gathers from elsewhere. */
export function courseCrossListedCount(department) {
  return courseCrossListingsFor(department).length;
}
