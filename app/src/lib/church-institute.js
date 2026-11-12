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

/** The three programs the brief names. `courseKeys` reference LEARN_CATALOG. */
export const PROGRAMS = Object.freeze([
  {
    key: 'biblical-studies',
    title: 'Biblical Studies',
    blurb: 'Old and New Testament survey, how to interpret the Word, Christian doctrine.',
    courseKeys: ['who-he-is', 'made-in-time'],
    planned: ['Old Testament Survey', 'New Testament Survey', 'Biblical Interpretation', 'Christian Doctrine'],
  },
  {
    key: 'ministry-leadership',
    title: 'Ministry Leadership',
    blurb: 'The offices of the house from the Word, stewardship, and handing the mission forward.',
    courseKeys: ['church-offices', 'handed-forward'],
    planned: ['Pastoral Care', 'Preaching and Teaching', 'Church Administration'],
  },
  {
    key: 'christian-education',
    title: 'Christian Education',
    blurb: 'Teaching the Word to every age, from the littlest learners to the founding generation.',
    courseKeys: ['little-learners'],
    planned: ['Teaching Children the Word', 'Youth Discipleship', 'Adult Bible Study Leadership'],
  },
]);

const catalogByKey = () => new Map((LEARN_CATALOG || []).map((c) => [c.key, c]));

/** The registered Learn courses a program names — only ones that exist. */
export function programCourses(program, catalog = catalogByKey()) {
  return (program.courseKeys || []).map((k) => catalog.get(k)).filter(Boolean);
}

/** Keys a program names that the catalog does NOT hold (must be empty; a test asserts it). */
export function unresolvedCourseKeys(programs = PROGRAMS, catalog = catalogByKey()) {
  return programs.flatMap((p) => (p.courseKeys || []).filter((k) => !catalog.has(k)).map((k) => `${p.key}:${k}`));
}

/** 'available' when at least one registered course exists for the program, else 'planned'. */
export function programStatus(program, catalog = catalogByKey()) {
  return programCourses(program, catalog).length ? 'available' : 'planned';
}

/** Every course the Institute can open today, across programs, de-duplicated. */
export function availableCourses(programs = PROGRAMS, catalog = catalogByKey()) {
  const seen = new Set();
  const out = [];
  for (const p of programs)
    for (const c of programCourses(p, catalog)) {
      if (!seen.has(c.key)) {
        seen.add(c.key);
        out.push({ course: c, program: p });
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
      return 'Enrollment is open. Apply from your My Record page.';
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
  'Submit the application from your My Record page.',
  'The church office confirms your seat and your cohort start date.',
]);
