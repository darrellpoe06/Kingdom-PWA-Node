// =============================================================================
// properties/config — the Poe Properties door identity + the launch plan
// =============================================================================
// DATA, not code (the office-assistant pattern): everything landlord-specific is
// a config value, so a SECOND landlord on this engine is a new config object,
// never a fork. Poe Properties is the first config.
//
// The launch plan below is the app's own account of what is built, what is
// gated, and what is waiting on whose hand — and it VALIDATES (validateLaunchPlan)
// so a phase can never claim "done" without naming the evidence that proves it,
// and a deferral can never sit here without a re-review date (DR-0075/DR-0076).
// It renders in-app, so the timeline the family reads is the timeline the repo
// can prove, not a number typed into a chat message.
// =============================================================================

export const POE_PROPERTIES = Object.freeze({
  id: 'poe-properties',
  brand: Object.freeze({
    label: 'Poe Properties',
    tagline: 'Work orders, history, and the whole conversation — in one place.',
    accent: '#2F5D50',
    background: '#FAF8F4',
  }),
  // The installable face. Scope MUST be disjoint from every other face on the
  // origin or Chrome collapses two apps into one (DR-0258/DR-0261).
  scope: '/properties/',
  startUrl: '/properties/app/?properties=1',
  manifest: '/manifest-properties.webmanifest',
  shareUrl: 'https://poetech.us/properties/',
  doorParam: 'properties',
  // The same module mounts inside PoeTech at this route — one library, two doors.
  poetechView: 'properties',
});

// ---------------------------------------------------------------------------
// The launch plan. `state` is one of:
//   'built'   — shipped in this repo, with `evidence` naming the file/gate.
//   'gated'   — built, waiting on a named GATE that must go green.
//   'hand'    — waiting on a step only a human can take (`whoseHand`).
//   'planned' — not built yet; carries `reReview`.
// ---------------------------------------------------------------------------
export const LAUNCH_PLAN = Object.freeze([
  Object.freeze({
    id: 'P0', title: 'The seam: invite → claim → scoped access',
    state: 'built',
    detail: 'A landlord invites by email; the invited person is recognized only after signing in to that same address. The role ceiling is enforced inside the database function, so an invite can never widen a grant.',
    evidence: 'infra/supabase/migrations-auto/0150-poe-properties-app-invite-claim-and-household.sql',
  }),
  Object.freeze({
    id: 'P1', title: 'The tenant, their family, and the 1099 worker each have a face',
    state: 'built',
    detail: 'One module, mounted by both apps: tenant + household (place, work orders, thread, history, payments, notices), 1099 worker (jobs, two-tap documentation, property history, enabled job thread), manager/landlord (board, dispatch, doors, rent, the full relationship record, invites).',
    evidence: 'app/src/modules/properties/PropertiesApp.jsx',
  }),
  Object.freeze({
    id: 'P2', title: 'Isolation proven against the real database',
    state: 'gated',
    detail: 'An invite grants nothing before it is claimed; a stranger claiming gets nothing; a tenant sees one door; the family shares that door but never the rent write path; a field worker’s over-asking invite has its extra capability dropped; a manager cannot post to the books; nothing crosses to another landlord.',
    gate: 'rls-isolation / poe-properties (infra/supabase/tests/0150-poe-properties-isolation-smoke.sql)',
    evidence: '.github/workflows/rls-isolation.yml',
  }),
  Object.freeze({
    id: 'P3', title: 'The doors carry real tenancies',
    state: 'hand',
    detail: 'The 12 rental doors are live in the app; rental_tenancies is empty. Each door needs its tenant name, email, lease dates, and rent — the landlord’s own records, typed once from the Doors tab.',
    whoseHand: 'Darrell / Christina — but only for the CURRENT-STATE facts. The DR-0108 challenge was run 2026-08-26 rather than assumed: the agent CAN read the family\u2019s own records (a real 2022-23 lease PDF is in Drive; Gmail is connected), so sourcing and staging what exists is channel-drivable and is the next build. What no channel can supply is who lives where TODAY at what rent \u2014 that confirmation is the landlord\u2019s, and the agent will not invent it (DR-0076).',
    reReview: '2026-09-02',
  }),
  Object.freeze({
    id: 'P4', title: 'First live pilot — one door, one tenant, one 1099 worker',
    state: 'planned',
    detail: 'Invite one tenant and one worker on one door. Run a real work order end to end: reported → dispatched by text → documented → closed → the thread and history read correctly on all three phones.',
    reReview: '2026-09-09',
  }),
  Object.freeze({
    id: 'P5', title: 'Every door, every tenant, every worker',
    state: 'planned',
    detail: 'Roll out to all doors once the pilot round-trips. Rent records begin posting to the PoeTech books on confirm.',
    reReview: '2026-09-23',
  }),
  Object.freeze({
    id: 'P6', title: 'The policy playbook + application review',
    state: 'planned',
    detail: 'Written-once screening criteria, per-party acknowledgment, and the fair-housing / FCRA guardrail that DR-0101 §7 makes non-negotiable before any screening decision is recorded.',
    reReview: '2026-10-07',
  }),
  Object.freeze({
    id: 'P7', title: 'The app for OTHER landlords',
    state: 'planned',
    detail: 'A second landlord is a new config object on this engine (their own instance, their own doors). Tier C — a new external-facing product face is the Governor’s gate, not the agent’s.',
    gate: 'Governor review (Tier C — new external-facing publication)',
    reReview: '2026-10-21',
  }),
]);

// ---------------------------------------------------------------------------
// Opportunities and constraints (Darrell asked for both, 2026-08-26). Every
// opportunity carries a re-review date; every constraint is one we have actually
// hit or verified, not a hypothetical.
// ---------------------------------------------------------------------------
export const OPPORTUNITIES = Object.freeze([
  Object.freeze({ id: 'O1', title: 'Texting with no vendor, no spend, no registration', detail: 'Dispatch and tenant contact ride the phone’s own messaging app through sms:/tel: links with the job prefilled. It works the day it ships, costs nothing, and the durable record stays in the app’s append-only thread. A carrier gateway would mean A2P 10DLC registration and real money — this reaches the same outcome without either.', reReview: '2026-09-30' }),
  Object.freeze({ id: 'O2', title: 'The relationship record builds itself', detail: 'Work orders, messages, notes, job documentation, payments, and notices merge into one chronological history per door. Nobody has to assemble a timeline later — responsiveness is judged on real timestamps.', reReview: '2026-10-14' }),
  Object.freeze({ id: 'O3', title: 'Rent flows into the books instead of a spreadsheet', detail: 'A confirmed payment posts once into the PoeTech books as rental income against the property. One river: the landlord’s books stay whole without re-typing what the tenant already reported.', reReview: '2026-10-14' }),
  Object.freeze({ id: 'O4', title: 'A product for other landlords', detail: 'The engine is landlord-agnostic: a second landlord is a config object plus their own instance. Property management sells on its own; the books, taxes, entities, and forecasting stay the reason to add PoeTech — a natural upgrade, not a bundle nobody asked for.', reReview: '2026-10-21' }),
  Object.freeze({ id: 'O6', title: 'The tenancies can be STAGED from the family\u2019s own records', detail: 'The DR-0108 challenge found the agent is not blocked from the data it can reach: a real lease PDF sits in Drive and Gmail is connected, so leases and threads can be read and staged as draft tenancies for one-tap confirmation instead of twelve doors typed by hand. The landlord still confirms every row \u2014 staging is not asserting.', reReview: '2026-09-09' }),
  Object.freeze({ id: 'O5', title: 'The 1099 record and the work record become one', detail: 'The contractor list already lives in the books for taxes. When a worker documents jobs in the app, the year’s work and the year’s 1099 come from the same rows.', reReview: '2026-11-04' }),
]);

export const CONSTRAINTS = Object.freeze([
  Object.freeze({ id: 'C1', title: 'Nobody can be invited until the doors carry tenancies', detail: 'rental_tenancies is empty on the live database (measured 2026-08-26). The invite seam is built; the tenant records are the landlord’s to enter.' }),
  Object.freeze({ id: 'C2', title: 'Access needs a verified email on both sides', detail: 'A person is recognized only when the landlord invited their exact address AND they sign in to it. A tenant with no email address cannot be given a login — that is the security property, not a bug.' }),
  Object.freeze({ id: 'C3', title: 'Money never moves in the app', detail: 'Rent is recorded, never charged or transferred. A balance edit changes a number and lands an audit row; it moves no money (DR-0094).' }),
  Object.freeze({ id: 'C4', title: 'Screening is legally regulated', detail: 'Application review does not ship without the fair-housing / FCRA guardrail and consistent, documented criteria (DR-0101 §7). Guidance to verify with a licensed professional — never legal advice.' }),
  Object.freeze({ id: 'C5', title: 'Two installed apps need disjoint scopes', detail: 'A device can only install Poe Properties beside PoeTech because the scopes do not overlap. Its manifest scope is /properties/ and a gate fails the build if that ever collides (DR-0258/DR-0261).' }),
  Object.freeze({ id: 'C7', title: 'An invited person signs in with EMAIL — password or link', detail: 'Recognition matches the exact address the landlord invited, so the door leads with email rather than the phone+PIN way the congregation uses. Email + password works with no mail server at all; the magic-link path depends on the stack\u2019s SMTP and is rate-limited on the hosted plan (DR-0307 \u00a73 hit exactly that). A tenant with no email address cannot be invited today \u2014 named, not papered over.' }),
  Object.freeze({ id: 'C6', title: 'The rent history in the v2.2 lease spine still needs an auth hook', detail: 'Payments recorded on the tenancy spine reach the tenant today. The older leases/rent_payments portal (schema-v2.10) needs a Supabase dashboard toggle only the account owner can flip — named, not silently assumed.' }),
]);

/**
 * The plan validates itself (DR-0076): a 'built' phase must name evidence, a
 * 'gated' phase must name its gate, a 'hand' phase must name whose hand, and
 * anything not built must carry a re-review date (DR-0075). Returns
 * { ok, problems: [...] } — the test fails the build on any problem.
 */
export function validateLaunchPlan(plan = LAUNCH_PLAN) {
  const problems = [];
  const seen = new Set();
  for (const p of plan) {
    if (!p.id || seen.has(p.id)) problems.push(`duplicate or missing phase id: ${p.id || '(none)'}`);
    seen.add(p.id);
    if (!p.title) problems.push(`${p.id}: no title`);
    if (p.state === 'built' && !p.evidence) problems.push(`${p.id}: claims built with no evidence`);
    if (p.state === 'gated' && !p.gate) problems.push(`${p.id}: claims gated with no gate named`);
    if (p.state === 'hand' && !p.whoseHand) problems.push(`${p.id}: waits on a hand with nobody named`);
    if (p.state !== 'built' && !p.reReview && !p.gate) problems.push(`${p.id}: not built and carries no re-review date`);
    if (!['built', 'gated', 'hand', 'planned'].includes(p.state)) problems.push(`${p.id}: unknown state "${p.state}"`);
  }
  for (const o of OPPORTUNITIES) if (!o.reReview) problems.push(`${o.id}: opportunity with no re-review date`);
  return { ok: problems.length === 0, problems };
}
