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
// =============================================================================

/** Departments whose subject is the Word, the house, or a child's schooling. */
export const FORMATION_DEPARTMENTS = Object.freeze([
  'The Word & The Way',        // Little Learners and the rest of the Word's own shelf
  'Living Lessons',            // the Word itself — its own department since DR-0598 (2026-09-24); never sold
  'Serve the House',           // serving your own congregation is never a product
  'Kingdom Life & Stewardship', // biblical economics; the Word's own money teaching
  'Mathematics',               // a child's schooling
  'A.I. The Way',              // discernment for believers, not a credential
]);

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
  return true;
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
