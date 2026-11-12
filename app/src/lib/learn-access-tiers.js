// =============================================================================
// learn-access-tiers — which courses could ever carry a price, and which never
// =============================================================================
// Darrell, 2026-09-19, with a screenshot of the Learn tab: "should we separate
// certain courses for the paid versions? If so... which one!!!!!!"
//
// THE ANSWER THIS MODULE ENCODES, and the reason for it.
//
// The Word is never sold. "Ho, every one that thirsteth, come ye to the waters,
// and he that hath no money; come ye, buy, and eat" (Isaiah 55:1), and "freely
// ye have received, freely give" (Matthew 10:8). That is not a pricing
// preference, it is the mission this school exists for -- Darrell's own reason
// for the age bands was "especially our children... this is mainly about
// getting them understanding even if and when the parents don't have it." A
// child who cannot pay must never meet a locked lesson.
//
// Labour is still legitimately paid. "The labourer is worthy of his reward"
// (1 Timothy 5:18). So the line is NOT free-versus-paid content. It is:
//
//     SELL THE ACCOMPANIMENT, NEVER THE CONTENT.
//
// A course is classified FORMATION (forms a disciple or a child -- never
// priced, nothing around it priced) or VOCATIONAL (credentials a professional
// -- the READING stays free, and only the accompaniment may ever carry a
// price: a certificate, facilitated cohort time, the AI teacher's time, the
// billable templates and workbooks a professional actually uses at work).
//
// DERIVED, NEVER A HAND-KEPT LIST. Darrell, on a different surface: "Why would
// I need to approve a script we agree to and see the outcome of initially so it
// can stay consistent with the changes???!!!!! I don't want more work I want
// more done better without me." So the tier comes from the DEPARTMENT the
// registry already declares. A new course lands in its department and is
// classified the moment it mounts; nobody edits a list, and a course cannot be
// silently left unclassified -- the test proves total coverage.
//
// SHIPPED INACTIVE, AND NOT BY ITS OWN CHOICE. ACCESS_ENFORCEMENT is false and
// nothing reads it to gate a lesson. The app currently promises the reader, in
// its own copy, "you can read everything here; nothing is locked" -- and that
// promise stays true. This module is the MODEL and the recommendation; turning
// any of it into money is Darrell's decision and a Tier C gate (RELEASE-TIERS),
// which is why the classification is built and the enforcement is not.
//
// SUPERSEDED IN PART BY DR-1428 (Darrell, 2026-11-11). "Love Corner App... all
// spiritual lessons free... the others are to advertise PoeTech App learning
// content and space.... PoeTech has the higher level content... however the
// child level for everything is available in The Love Corner App... the more
// rigorous the level that's when it gets to PoeTech App... and the initial
// lesson for each course is free inside the Love Corner App." What DR-0536
// protected still holds: no child meets a locked lesson, because the CHILD
// level of every lesson in every subject stays free, and the spiritual
// departments stay free at every level. What changes: in the PoeTech subjects
// the more rigorous levels become PoeTech+ ($39). See lessonAccess() below.
// Enforcement stays OFF until a real way to pay exists (there is no checkout
// in the app today): a lock with no way through it would only shut people out.
// =============================================================================

/** Departments whose subject is the Word, the house, or a child's schooling. */
export const FORMATION_DEPARTMENTS = Object.freeze([
  'The Word & The Way',        // Little Learners and the rest of the Word's own shelf
  'Living Lessons',            // the Word itself — its own department since DR-0598 (2026-09-24); never sold
  'Serve the House',           // serving your own congregation is never a product
  'Kingdom Life & Stewardship', // biblical economics; the Word's own money teaching
  'The Eternal Algorithms',    // the Word's own patterns, studied
  // Mathematics and A.I. The Way moved to the PoeTech subjects (DR-1428): their
  // CHILD level stays free in the Love Corner, which keeps DR-0536's line.
]);

/**
 * THE SPIRITUAL DEPARTMENTS (DR-1428): free at every level, on both doors.
 * Every other department is a PoeTech subject.
 */
export const SPIRITUAL_DEPARTMENTS = FORMATION_DEPARTMENTS;

/** The level of every lesson that is free in every subject: no child meets a lock. */
export const ALWAYS_FREE_BANDS = Object.freeze(['child']);

/** The plan a rigorous level of a PoeTech subject needs (lib/tiers.js: PoeTech+ $39/mo). */
export const PREMIUM_TIER = 'poetech-plus';

/** What may ever be priced beside a vocational course. Never the reading. */
export const SELLABLE_ACCOMPANIMENT = Object.freeze([
  'certificate',
  'facilitated-cohort',
  'teacher-time',
  'professional-templates',
]);

/** False on purpose. Nothing in the app gates a lesson on payment. */
export const ACCESS_ENFORCEMENT = false;

/** 'formation' | 'vocational', from the department the registry already declares. */
export function accessTier(department) {
  const d = String(department || '').trim();
  if (!d) return 'formation'; // unclassified defaults to FREE, never to paid
  return FORMATION_DEPARTMENTS.includes(d) ? 'formation' : 'vocational';
}

/** What may carry a price for a course in this department. Formation: nothing. */
export function sellableFor(department) {
  return accessTier(department) === 'formation' ? [] : [...SELLABLE_ACCOMPANIMENT];
}

/**
 * The reading is free in EVERY tier. This is the invariant the whole module
 * exists to protect, stated as a function so a caller cannot get it wrong.
 */
export function lessonTextIsFree() {
  return !ACCESS_ENFORCEMENT;
}

/**
 * DR-1428, as one function: may this lesson, at this level, be read without
 * PoeTech+? `band` is 'child' | 'youth' | 'teen' | 'standard' | 'senior';
 * `lessonIndex` is the lesson's 0-based place in its course.
 *   - a spiritual department: free at every level;
 *   - any subject at the child level: free;
 *   - the FIRST lesson of every course, at every level: free (the taste);
 *   - every other level of a PoeTech subject: PoeTech+.
 * Returns { free, needs, why }. `free` is the RULE; whether anything is
 * actually locked is ACCESS_ENFORCEMENT's call (off today).
 */
export function lessonAccess({ department, band = 'standard', lessonIndex = 0 } = {}) {
  if (accessTier(department) === 'formation') return { free: true, needs: null, why: 'spiritual: free at every level' };
  if (ALWAYS_FREE_BANDS.includes(String(band || '').toLowerCase())) return { free: true, needs: null, why: 'the child level of every lesson is free' };
  if (!(Number(lessonIndex) > 0)) return { free: true, needs: null, why: 'the first lesson of every course is free' };
  return { free: false, needs: PREMIUM_TIER, why: 'a rigorous level of a PoeTech subject: PoeTech+' };
}

/** A summary over (course -> department) pairs, for a surface or a report. */
export function summarize(pairs) {
  const out = { formation: [], vocational: [] };
  for (const { key, department } of pairs || []) out[accessTier(department)].push({ key, department });
  return {
    ...out,
    counts: { formation: out.formation.length, vocational: out.vocational.length },
    enforcement: ACCESS_ENFORCEMENT,
  };
}
