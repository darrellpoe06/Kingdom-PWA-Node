// =============================================================================
// properties/documents — the paperwork, PREPOPULATED from what the app knows
// =============================================================================
// Darrell, 2026-08-27: "Did we create a prepopulated version of all documents we
// need so they can be the initial starting point for those documents based on
// what is required? Built into the app..."
//
// Honest answer before this file existed: no. The application's FIELDS were
// ported from his form and the co-living checklist was built, but the documents
// a landlord actually hands people — the lease, the house rules, the notices,
// the contractor agreement, the decision letters — did not exist anywhere.
//
// THE PATTERN IS THE HOUSE'S OWN (lib/client-build-agreement.js): a document is
// DERIVED from records, never a typed-out file that drifts from them. Give it a
// door, a tenancy, a room, a worker — it fills itself. Change the rent on the
// tenancy and the lease draft follows; there is no second copy of the number.
//
// ── WHAT THIS IS NOT ────────────────────────────────────────────────────────
// Not legal advice, and not ready to sign. Every document carries COUNSEL_LINE
// until an attorney signs the template off (then a DR flips it), exactly as the
// client build agreement does. Three of them are REGULATED in ways that bite,
// and each says which law and why:
//   · the decline letter is an FCRA adverse-action notice when a consumer
//     report touched the decision — wrong or missing, that is a statutory
//     violation, not a style problem;
//   · every screening document rides the Fair Housing consistency rule
//     (DR-0101 §7) — same criteria, every applicant, reason on the record;
//   · the per-room lease is a DIFFERENT legal regime per parcel (DR-029) and is
//     gated behind the co-living compliance checklist, not merely warned about.
//
// A blank a record cannot fill is left as a NAMED blank — `[…]` with the field
// listed in `blanks` — never a plausible-looking invention (DR-0076).
// =============================================================================
import { ROOM_DEFAULTS, canSwitchToByRoom } from './coliving.js';
import { FCRA_RIGHTS } from './intake.js';
import { legalValue } from './jurisdictions.js';

export const COUNSEL_LINE =
  'DRAFT — a starting point built from Poe Properties’ own records and recorded practice. Route to counsel for legal-sufficiency review before it is given to anyone to sign. Not legal advice.';

const money = (n) => (Number.isFinite(Number(n)) && Number(n) > 0 ? `$${Number(n).toFixed(2)}` : null);
const dateOf = (d) => (d ? String(d).slice(0, 10) : null);

/** A field the record could not fill. Named, so the gap is visible not guessed. */
const BLANK = (label) => `[${label}]`;

/**
 * Fill a line from a record, or leave a NAMED blank and report it.
 * Returns [text, blankLabelOrNull] so the caller accumulates real gaps.
 */
function fill(value, label) {
  return value ? [String(value), null] : [BLANK(label), label];
}

/**
 * The document set. `requires` names the records a document needs; `regulated`
 * names the law that governs it and why, in plain words.
 */
export const DOCUMENT_SET = Object.freeze([
  Object.freeze({ id: 'lease-whole-unit', title: 'Residential lease — whole unit', requires: ['door', 'tenancy'], regulated: null,
    why: 'The agreement for a conventional whole-unit tenancy.' }),
  Object.freeze({ id: 'lease-by-room', title: 'Room lease — co-living', requires: ['door', 'room', 'tenancy'], regulated: 'Per-room tenancy law differs by parcel (DR-029). This document is gated behind the co-living compliance checklist and cannot be produced until it is cleared.',
    why: 'The agreement for one room in a rent-by-the-room house.' }),
  Object.freeze({ id: 'house-rules', title: 'House rules — shared spaces', requires: ['door'], regulated: null,
    why: 'The spec requires explicit house rules wherever living room and bathrooms are shared (DR-027).' }),
  Object.freeze({ id: 'move-in-condition', title: 'Move-in condition report', requires: ['door', 'tenancy'], regulated: null,
    why: 'What the unit looked like on day one — the record a deposit dispute turns on.' }),
  Object.freeze({ id: 'move-out-deposit', title: 'Move-out and deposit accounting', requires: ['door', 'tenancy'], regulated: 'Deposit return deadlines and itemization rules are set by state law and are strict. Counsel sets the deadline this template prints.',
    why: 'What was withheld, why, and what is returned.' }),
  Object.freeze({ id: 'notice-entry', title: 'Notice of entry', requires: ['door', 'tenancy'], regulated: 'Advance-notice periods for entry are set by state law.',
    why: 'Told in advance, on the record.' }),
  Object.freeze({ id: 'notice-late-rent', title: 'Notice — rent past due', requires: ['tenancy'], regulated: 'Cure periods and the wording that must precede any further step are set by state law.',
    why: 'A plain, dated notice — never a threat.' }),
  Object.freeze({ id: 'application-approved', title: 'Application approved', requires: ['application'], regulated: null,
    why: 'The offer, with what happens next.' }),
  Object.freeze({ id: 'application-declined', title: 'Application declined — adverse action notice', requires: ['application'], regulated: 'When a consumer report touched the decision, the FCRA REQUIRES an adverse-action notice naming the agency, that the agency did not make the decision, and the applicant’s right to a free copy and to dispute. Missing or wrong is a statutory violation.',
    why: 'The decline, with the applicant’s rights stated because the law requires it.' }),
  Object.freeze({ id: 'contractor-1099', title: 'Independent contractor agreement (1099)', requires: ['worker'], regulated: 'Worker classification is legally consequential — a contractor who is treated as an employee is one regardless of what the paper says. Counsel reviews the classification, not just the wording.',
    why: 'The scope, the pay, and the independence that makes it a 1099.' }),
  Object.freeze({ id: 'work-order', title: 'Work order', requires: ['door', 'request'], regulated: null,
    why: 'What is wrong, where, how urgent, and who was sent.' }),
]);

export const DOCUMENT_IDS = Object.freeze(DOCUMENT_SET.map((d) => d.id));

/**
 * Build one document from the records the app already holds.
 *
 * Returns { ok, id, title, lines, blanks, regulated, acknowledgment } — or
 * { ok:false, reason } when a gate refuses (the room lease behind the co-living
 * checklist) or the records needed are absent.
 */
export function buildDocument(id, records = {}) {
  const spec = DOCUMENT_SET.find((d) => d.id === id);
  if (!spec) return { ok: false, reason: 'unknown-document' };

  const { door = null, tenancy = null, room = null, worker = null, application = null, request = null, clearances = [] } = records;

  // The co-living gate is structural here too: a room lease cannot be produced
  // for a door whose legal regime has not been cleared (DR-029).
  if (id === 'lease-by-room') {
    const gate = canSwitchToByRoom(clearances);
    if (!gate.ok) return { ok: false, reason: 'coliving-not-cleared', message: gate.message, outstanding: gate.outstanding };
  }

  for (const need of spec.requires) {
    const have = { door, tenancy, room, worker, application, request }[need];
    if (!have) return { ok: false, reason: `missing-${need}` };
  }

  const blanks = [];
  const line = (value, label) => {
    const [text, blank] = fill(value, label);
    if (blank) blanks.push(blank);
    return text;
  };
  // A legal value comes from the jurisdiction registry, which returns the
  // CITATION to check when nothing has been verified — never a number recalled
  // from memory. The place is the door's own state and city.
  const place = { state: door && door.state, city: door && door.city };
  const legal = (id) => {
    const v = legalValue(id, place);
    if (v.verified) return v.value;
    blanks.push(v.citation ? `${id} (${v.citation})` : id);
    return v.blank;
  };

  const property = door ? [door.property_label || door.display_name, door.unit_label || door.unit].filter(Boolean).join(' · ') : null;
  const lines = [COUNSEL_LINE, ''];

  if (spec.regulated) lines.push(`REGULATED — ${spec.regulated}`, '');

  lines.push(`POE PROPERTIES — ${spec.title.toUpperCase()}`, '');

  switch (id) {
    case 'lease-whole-unit':
      lines.push(
        `Property: ${line(property, 'property address')}`,
        `Tenant: ${line(tenancy.tenant_name, 'tenant name')}`,
        `Term: ${line(dateOf(tenancy.lease_start), 'lease start')} to ${line(dateOf(tenancy.lease_end), 'lease end')}`,
        `Monthly rent: ${line(money(tenancy.monthly_rent), 'monthly rent')}, due on the first.`,
        `Security deposit: ${line(money(tenancy.deposit), 'deposit')}`,
        '',
        `Disclosures this lease must carry: ${legal('lease-disclosures')}`,
        '',
        'Rent is paid to Poe Properties directly. The app records what was paid and when; it never moves money and never holds a card.',
        'Repairs are reported through the Poe Properties app, where the tenant can watch the work order to done and read every message and date.',
      );
      break;
    case 'lease-by-room':
      lines.push(
        `House: ${line(property, 'house address')}`,
        `Room: ${line(room.name, 'room name')}`,
        `Tenant: ${line(tenancy.tenant_name, 'tenant name')}`,
        `Term: ${line(dateOf(tenancy.lease_start), 'lease start')} to ${line(dateOf(tenancy.lease_end), 'lease end')}`,
        `Monthly rent: ${line(money(room.monthly_rent || ROOM_DEFAULTS.monthlyRent), 'room rent')}${ROOM_DEFAULTS.utilitiesIncluded ? ', utilities included' : ''}.`,
        `Occupancy for this room: up to ${room.occupancy || ROOM_DEFAULTS.occupancyMin}.`,
        '',
        `Shared: ${ROOM_DEFAULTS.shared}.`,
        'Room access is by smart lock, issued at move-in and revoked at move-out; the lock keeps an access log at the door.',
        'There is no camera, microphone or sensor inside any room — not now and not later.',
      );
      break;
    case 'house-rules':
      lines.push(
        `House: ${line(property, 'house address')}`,
        '',
        'Shared living room and bathrooms are everyone’s — leave them the way you would want to find them.',
        'Quiet hours, guests, parking and cleaning rotation: [agreed by the house and written here before anyone moves in]',
        'Anything broken in a shared space is reported in the app, so the whole house can see it is being handled.',
      );
      blanks.push('house-agreed rules');
      break;
    case 'move-in-condition':
    case 'move-out-deposit':
      lines.push(
        `Property: ${line(property, 'property address')}`,
        `Tenant: ${line(tenancy.tenant_name, 'tenant name')}`,
        `Date: ${line(dateOf(id === 'move-in-condition' ? tenancy.lease_start : tenancy.lease_end), 'date')}`,
        '',
        'Room by room, with photographs taken the same day and filed on this door in the app.',
        ...(id === 'move-out-deposit' ? ['',
          `Deposit held: ${line(money(tenancy.deposit), 'deposit')}`,
          `Deadline to return it: ${legal('deposit-return-days')}`,
          `Deadline for the itemized statement: ${legal('deposit-itemization-days')}`,
          `Interest owed: ${legal('deposit-interest')}`,
          'Itemized: [each deduction, what it was for, and what it cost]',
          'Returned: [amount] by [method] on [date]'] : []),
      );
      if (id === 'move-out-deposit') blanks.push('itemized deductions', 'amount returned');
      break;
    case 'notice-entry':
      lines.push(
        `Property: ${line(property, 'property address')}`,
        `Tenant: ${line(tenancy.tenant_name, 'tenant name')}`,
        `Advance notice required here: ${legal('entry-notice-hours')}`,
        'Date and time of entry: [date and time]',
        'Reason: [repair, inspection, or showing]',
      );
      blanks.push('entry date and time', 'reason');
      break;
    case 'notice-late-rent':
      lines.push(
        `Tenant: ${line(tenancy.tenant_name, 'tenant name')}`,
        `Amount past due: ${line(money(tenancy.monthly_rent), 'amount past due')}`,
        'Period: [which month]',
        '',
        'This is a notice, not a threat. If something happened, tell us in the app — the conversation is on the record and we would rather work it out.',
        `What happens next, and by when: ${legal('late-rent-cure-days')}`,
      );
      blanks.push('period');
      break;
    case 'application-approved':
      lines.push(
        `Applicant: ${line(application.applicant_name, 'applicant name')}`,
        '',
        'Your application is approved. Next: the lease, the deposit, and a move-in date that works for you.',
        'Once you are on the lease, the app is where you report anything broken and where every message and date is kept — for you as much as for us.',
      );
      break;
    case 'application-declined':
      lines.push(
        `Applicant: ${line(application.applicant_name, 'applicant name')}`,
        '',
        `Decision: declined. Reason: ${line(application.decision_reason, 'the documented criterion this rests on')}`,
        '',
        'If a consumer report was part of this decision, the law gives you these rights:',
        ...FCRA_RIGHTS.map((r) => `• ${r}`),
        '',
        'The consumer reporting agency did not make this decision and cannot tell you why it was made.',
        'Agency contacted: [name, address and phone of the agency actually used]',
      );
      blanks.push('consumer reporting agency details');
      break;
    case 'contractor-1099':
      lines.push(
        `Contractor: ${line(worker.name || worker.display_name, 'contractor name')}`,
        `Trade: ${line(worker.trade || worker.role, 'trade')}`,
        '',
        'Work is offered job by job; the contractor decides which jobs to accept, sets their own hours, and supplies their own tools.',
        'Pay is per job at the amount agreed before the work starts. Poe Properties does not withhold taxes; a 1099 is issued for the year.',
        'Jobs are documented in the app — fixed, or not fixed and why — and that record is the contractor’s protection as much as ours.',
      );
      break;
    case 'work-order':
      lines.push(
        `Property: ${line(property, 'property address')}`,
        `What is wrong: ${line(request.title, 'description')}`,
        `Priority: ${line(request.priority, 'priority')}`,
        `Reported: ${line(dateOf(request.created_at), 'date reported')}`,
        `Assigned to: ${line(request.assigned_to_label, 'worker')}`,
        '',
        'Close it in the app with Fixed, or Not fixed and the reason — that is what makes the timeline true later.',
      );
      break;
    default:
      break;
  }

  return {
    ok: true,
    id, title: spec.title,
    lines, blanks,
    regulated: spec.regulated,
    // Per-party acknowledgment, timestamped — "they were told", on the record
    // (DR-0101 §7). The document is not acknowledged until a person does it.
    acknowledgment: { required: true, by: null, at: null },
  };
}

/** Which documents THIS door can produce right now, and what each still needs. */
export function availableDocuments(records = {}) {
  return DOCUMENT_SET.map((spec) => {
    const built = buildDocument(spec.id, records);
    return {
      id: spec.id, title: spec.title, why: spec.why, regulated: spec.regulated,
      ready: built.ok,
      reason: built.ok ? '' : built.reason,
      blanks: built.ok ? built.blanks : [],
    };
  });
}

/** Record that a party read and acknowledged a document. Both facts required. */
export function acknowledge(doc, { by, at } = {}) {
  if (!doc || !doc.ok) return { ok: false, reason: 'no-document' };
  if (!String(by || '').trim()) return { ok: false, reason: 'no-one-named' };
  if (!at) return { ok: false, reason: 'no-date' };
  return { ok: true, document: { ...doc, acknowledgment: { required: true, by: String(by).trim(), at } } };
}
