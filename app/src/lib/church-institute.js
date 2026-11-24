// =============================================================================
// church-institute — the TLC Theological Institute, as data (Slice A)
// =============================================================================
// The church's educational ministry, online, inside The Love Corner (the
// 2026-11-12 Institute note, docs/99-session-notes/2026-11-12-the-institute-in-
// the-love-corner-app.md; the redesign brief §7 and Darrell's addition the
// same day: "Give TLC Theological Institute its own prominent, beautifully
// designed featured card... Do not advertise courses or enrollment as
// available unless they actually exist. Do not describe the Institute as
// accredited or degree-granting without verified authorization.")
//
// Pure. Every course a program names must be a key in LEARN_CATALOG (a test
// enforces it), so "available today" can only ever mean a course that exists.
// Programs with no registered course are `planned`, and the surface says so.
// launchState never reads `open` unless the office has set the regulatory
// state to `confirmed` (Institute note §4.7) — enrollment is carried by data,
// never by memory.
//
// NAME: "TLC Theological Institute" is the brief's name (Darrell, 2026-11-12).
// In this codebase `tlc` is TLC Therapy Solutions, so the CODE identifier is
// `institute` everywhere (surface id, churchView, feedback key).
import { LEARN_CATALOG } from './learn-catalog.js';
import { AGE_BANDS } from './learn-framework.js';
import { LIVING_LESSONS_MODULES } from './living-lessons-class.js';
import { LITTLE_LEARNERS_MODULES } from './little-learners-class.js';

export const INSTITUTE_META = Object.freeze({
  key: 'institute',
  name: 'TLC Theological Institute',
  tagline: 'Equipping Believers. Developing Leaders. Deepening Faith.',
  of: 'The Church of the Living God',
  about:
    'An educational ministry of The Church of the Living God. The Institute teaches the Word, trains those who serve, and prepares leaders for the house. Credentials are religious certificates of completion. The Institute does not claim accreditation, state authorization, or degrees.',
  credentialKinds: ['certificate'],
  // What the public surface may say about credentials, verbatim. A test pins
  // that these words — and never "accredited", "degree", "authorized" as a
  // claim — are what renders.
  credentialNote: 'Religious certificates of completion. No accreditation or degrees are claimed.',
});

/**
 * The three programs the brief names. Two lists per program, both LEARN_CATALOG keys:
 *   courseKeys — the REQUIRED core. An application snapshots it and the
 *                completion standard (DR-1460, institute_completion) checks a
 *                passed quiz in each, so it changes only by a decision.
 *   alsoKeys   — every other registered course that belongs in this program
 *                (Darrell 2026-11-24: "All the courses should be flowing into
 *                their respective locations inside the institute"). Open study,
 *                listed and linked, never added to the certificate standard.
 * Only Word-and-house courses belong here; markets, real estate and A.I. stay
 * in Learn (the Institute "teaches the Word, trains those who serve").
 */
export const PROGRAMS = Object.freeze([
  {
    key: 'biblical-studies',
    title: 'Biblical Studies',
    blurb: 'Old and New Testament survey, how to interpret the Word, Christian doctrine.',
    courseKeys: ['who-he-is', 'made-in-time'],
    alsoKeys: ['living-lessons', 'prophetic-voices', 'world-issues'],
    planned: ['Old Testament Survey', 'New Testament Survey', 'Biblical Interpretation', 'Christian Doctrine'],
  },
  {
    key: 'ministry-leadership',
    title: 'Ministry Leadership',
    blurb: 'The offices of the house from the Word, stewardship, and handing the mission forward.',
    courseKeys: ['church-offices', 'handed-forward'],
    alsoKeys: ['word-out', 'sound-board', 'kingdom-economics', 'legacy-provisions'],
    planned: ['Pastoral Care', 'Preaching and Teaching', 'Church Administration'],
  },
  {
    key: 'christian-education',
    title: 'Christian Education',
    blurb: 'Teaching the Word to every age, from the littlest learners to the founding generation.',
    courseKeys: ['little-learners'],
    alsoKeys: ['living-lessons', 'made-in-time', 'healthy-living'],
    planned: ['Teaching Children the Word', 'Youth Discipleship', 'Adult Bible Study Leadership'],
    byAge: true,
  },
]);

const catalogByKey = () => new Map((LEARN_CATALOG || []).map((c) => [c.key, c]));

/** The registered Learn courses a program names — only ones that exist. */
export function programCourses(program, catalog = catalogByKey()) {
  return (program.courseKeys || []).map((k) => catalog.get(k)).filter(Boolean);
}

/** The program's other registered courses (open study), core keys excluded, only ones that exist. */
export function programAlsoCourses(program, catalog = catalogByKey()) {
  const core = new Set(program.courseKeys || []);
  return (program.alsoKeys || []).filter((k) => !core.has(k)).map((k) => catalog.get(k)).filter(Boolean);
}

/** Core first, then the rest: [{ course, required }] — what the program's card and the Courses tab list. */
export function programCourseList(program, catalog = catalogByKey()) {
  return [
    ...programCourses(program, catalog).map((course) => ({ course, required: true })),
    ...programAlsoCourses(program, catalog).map((course) => ({ course, required: false })),
  ];
}

/** Keys a program names (core or also) that the catalog does NOT hold (must be empty; a test asserts it). */
export function unresolvedCourseKeys(programs = PROGRAMS, catalog = catalogByKey()) {
  return programs.flatMap((p) =>
    [...(p.courseKeys || []), ...(p.alsoKeys || [])].filter((k) => !catalog.has(k)).map((k) => `${p.key}:${k}`)
  );
}

/** Does a lesson carry its own authored words for this depth? (`levels` is the authored set.) */
const hasLevel = (m, depth) => !!(m && m.levels && m.levels[depth]);

/**
 * The Word by population, young to seniors (Christian Education's "every age"):
 * Little Ones is the Little Learners course; every other row is an AGE_BANDS
 * band reading Living Lessons. `count` is MEASURED from the lessons — a band
 * counts only lessons with that band's own authored level, except Adult, which
 * reads the base lesson every Living Lesson carries. Never a typed number.
 */
export function populationPaths(living = LIVING_LESSONS_MODULES, little = LITTLE_LEARNERS_MODULES, bands = AGE_BANDS) {
  const rows = [{ key: 'little', label: 'Little Ones', range: '3–6', courseKey: 'little-learners', band: 'child', count: (little || []).length }];
  for (const b of bands) {
    const count = b.id === 'adult' ? (living || []).filter((m) => m && m.lesson).length : (living || []).filter((m) => hasLevel(m, b.depth || b.id)).length;
    rows.push({ key: b.id, label: b.label, range: b.range, courseKey: 'living-lessons', band: b.id, count });
  }
  return rows;
}

/** 'available' when at least one registered course exists for the program, else 'planned'. */
export function programStatus(program, catalog = catalogByKey()) {
  return programCourses(program, catalog).length ? 'available' : 'planned';
}

/** Every course the Institute can open today, across programs, de-duplicated (first program that names it wins). */
export function availableCourses(programs = PROGRAMS, catalog = catalogByKey()) {
  const seen = new Set();
  const out = [];
  for (const p of programs)
    for (const { course: c, required } of programCourseList(p, catalog)) {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        out.push({ course: c, program: p, required });
      }
    }
  return out;
}

/**
 * The enrollment door's state from the office's settings row (Slice B writes
 * it; until then the surface passes `null` and the door stays closed).
 *   exemption_status: 'not-filed' | 'filed' | 'confirmed'
 *   enrollment_open:  boolean
 * Returns 'open' ONLY when confirmed AND the office opened enrollment.
 */
export function launchState(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  if (s.exemption_status === 'confirmed' && s.enrollment_open === true) return 'open';
  if (s.exemption_status === 'confirmed') return 'confirmed-closed';
  if (s.exemption_status === 'filed') return 'filed';
  return 'not-filed';
}

/** What the Enrollment section says for each state, in the house's plain voice. */
export function enrollmentCopy(state) {
  switch (state) {
    case 'open':
      return 'Enrollment is open. Apply below; your application is kept on your own account.';
    case 'confirmed-closed':
      return 'The paperwork is confirmed. The office will open enrollment for the next cohort here.';
    case 'filed':
      return 'The paperwork is filed and awaiting confirmation. Enrollment opens after that.';
    default:
      return 'Enrollment opens when the office confirms the program and its paperwork. Until then the courses below are open to everyone in Learn.';
  }
}

/** The four steps enrollment will take, shown as the plan it is. */
export const ENROLLMENT_STEPS = Object.freeze([
  'Create your account or sign in. One sign-in serves the whole church app.',
  'Choose a program and read the student handbook.',
  'Submit the application on this page; it is kept on your own account.',
  'The church office confirms your seat and your cohort start date.',
]);
