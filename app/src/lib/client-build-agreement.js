// =============================================================================
// client-build-agreement — the PoeTech client contract, DERIVED from the terms
// =============================================================================
// "Create a contract for people who want to do business with PoeTech — review
// the Ways and documentation and create a contract." (Darrell, 2026-07-08.)
//
// The contract is NOT a typed-out document that can drift from the recorded
// terms (DR-0121: no static data). Every number and fence in it derives from
// lib/client-engagements.js — the SAME module the door's price-out reads and
// the build gate (canStartBuild) enforces — so the agreement, the door, and
// the gate can never disagree. Change a term there (a new DR), and the
// contract follows on the next build.
//
// The Ways it encodes (reviewed for this template):
//   DR-0117 — $2,000 minimum · $500 deposit to start ("or we don't even start
//             work" — structural, canStartBuild) · $500 at MVP · balance over
//             the 90-day same-as-cash window · NO INTEREST EVER (a payment
//             plan, not consumer financing) · $150/mo Feedback-portal support
//             · beyond-scope = a new front-door engagement · payments RECORDED
//             never processed (money moves by the owner's hand, Moore §7).
//   DR-0117 defaults — day-90 non-payment: no fees, the balance reads visibly
//             past due, support does not start, and the client's data is
//             ALWAYS exportable — never a collection lever.
//   DR-0114 — the quote number is the governor's hand; nothing computes it.
//   DR-0104 — MVP delivered = live behind the lane + offered for the client's
//             own review, as a user meets it.
//   DATA-AS-EMPOWERMENT — the client owns their data: exportable at any time,
//             never sold, never an advertising asset, deletion honored.
//   DR-0021/DR-0026 posture — attorneys own legal sufficiency: this template
//             encodes the recorded business terms and ships as a DRAFT pending
//             counsel review before its first external signature.
//
// Pure + deterministic (proven-to-catch in client-build-agreement.test.js).
// =============================================================================
import {
  BUILD_MINIMUM_CENTS, DEPOSIT_CENTS, MVP_PAYMENT_CENTS, TERM_DAYS,
  SUPPORT_MONTHLY_CENTS, SUPPORT_SCOPE,
} from './client-engagements.js';

// Integer-dollar formatting for the derived clause text.
export const usd = (cents) => `$${Math.round(cents / 100).toLocaleString('en-US')}`;

// The counsel-review posture line — rides the top of the scope so it prints on
// every copy until an attorney signs the template off (then a DR flips it).
export const COUNSEL_REVIEW_LINE =
  "DRAFT — encodes PoeTech's recorded business terms (DR-0117); route to counsel for legal-sufficiency review before the first external signature. Not legal advice.";

export function clientBuildDefaults() {
  return {
    title: 'PoeTech Client Build Agreement',
    scopeOfWork: [
      COUNSEL_REVIEW_LINE,
      '',
      'PoeTech builds the client a working MVP of their business system on the PoeTech platform.',
      "Requirements come from the client's own recorded words (voice notes or a guided conversation): every requirement carries its source quote and is steward-reviewed with the client before it becomes build work. The MVP is built from the REVIEWED requirements — the scope, not evolving wishes.",
      `The quote is set per engagement at or above the ${usd(BUILD_MINIMUM_CENTS)} build minimum; larger or complex builds quote up from that floor.`,
    ].join('\n'),
    deliverables: [
      '• A working MVP on the PoeTech platform, delivered LIVE behind the release lane',
      "• The MVP offered for the client's own review — the client sees exactly what their users see before acceptance",
      "• Every built requirement traceable to the client's reviewed, recorded words",
      '• Revisions ride the Feedback portal; a conversation only when that is not enough',
    ].join('\n'),
    materials: [
      'PoeTech provides: the platform, the build-and-release lane, the review surface, and the Feedback portal.',
      'Client provides: their recorded discovery (voice notes or the guided conversation), timely review of extracted requirements and the delivered MVP, and access to any accounts/integrations that are theirs.',
    ].join('\n'),
    schedule: [
      `Build work starts when the ${usd(DEPOSIT_CENTS)} deposit is RECORDED — never before (the gate is structural, not a courtesy).`,
      `The ${TERM_DAYS}-day same-as-cash window runs from the first recorded payment. MVP target is set with the quote.`,
    ].join('\n'),
    paymentTerms: [
      `Build minimum ${usd(BUILD_MINIMUM_CENTS)}. Terms, client's choice:`,
      `• ${TERM_DAYS} days same as cash — ${usd(DEPOSIT_CENTS)} deposit to start, ${usd(MVP_PAYMENT_CENTS)} at MVP delivery, the remaining balance over the rest of the ${TERM_DAYS} days. NO INTEREST, EVER — this is a payment plan, not consumer financing.`,
      '• Or paid in full up front.',
      "Payments are RECORDED, never processed — money moves by the owner's hand (Square, Venmo, check, etc.); PoeTech holds no card or bank credentials in this agreement.",
      `Ongoing support after the build is paid: ${usd(SUPPORT_MONTHLY_CENTS)}/mo through the Feedback portal (includes the client's platform seat).`,
    ].join('\n'),
    acceptanceCriteria: [
      'The MVP is live behind the release lane and the client has been offered the review pass (seeing it as a user).',
      'Acceptance anchors to the reviewed requirements record — additions beyond it are new work, not revisions.',
    ].join('\n'),
    requirements: [
      '• Client records their discovery (or completes the guided conversation) before build work is scoped',
      '• Client reviews the extracted requirements — the steward confirms them together with the client',
      `• Deposit recorded before any build work begins (${usd(DEPOSIT_CENTS)}, or the full quote on up-front terms)`,
      '• Client keeps ownership of their own accounts and credentials; PoeTech never asks to hold them',
    ].join('\n'),
    warranty: [
      SUPPORT_SCOPE,
      'The client owns their data: exportable at any time, never sold, never an advertising asset, and deletion is honored. This holds in every state of the engagement, including non-payment.',
    ].join('\n'),
    terminationClause: [
      `Non-payment at day ${TERM_DAYS}: no late fees — the balance reads visibly past due, and monthly support does not start until it clears. The client's data stays exportable regardless (data is never a collection lever).`,
      'Either party may end the engagement with written notice; work stops at the last paid milestone, and everything already paid for is delivered as it stands.',
    ].join('\n'),
  };
}

// The Scopes · Agreements template card (Projects → Scopes · Agreements).
// Shape-identical to SCOPE_TEMPLATES entries; defaults derive at module load,
// so the card always carries the terms module's current numbers.
export const CLIENT_BUILD_TEMPLATE = {
  id: 'tmpl-client-build',
  name: 'PoeTech Build Client',
  type: 'client',
  description: `For a business engaging PoeTech to build — ${usd(BUILD_MINIMUM_CENTS)} minimum, ${TERM_DAYS} days same as cash, ${usd(SUPPORT_MONTHLY_CENTS)}/mo portal support. Derived from the recorded terms (DR-0117), never hand-typed.`,
  entityId: 'e-poetech',
  defaults: clientBuildDefaults(),
};
