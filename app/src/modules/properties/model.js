// =============================================================================
// properties/model — the Poe Properties engine (PURE: no React, no I/O)
// =============================================================================
// ONE MODULE, TWO DOORS (Darrell, 2026-08-26: "keep that as another Module/s so
// we can use the PoeTech App or the Poe Properties App for management ... Both
// Apps should be able to work together or separate ... keeping both with latest
// Synced data"). Everything the properties workflows KNOW lives here; the PoeTech
// surface and the Poe Properties door both render it. There is no second copy of
// this logic and no second store — both faces read the same Supabase rows through
// the same RLS, so "synced" is structural, not a job that can fall behind.
//
// The capability vocabulary below MIRRORS migration 0075 exactly (verified against
// infra/supabase/migrations-auto/0075-delegated-property-management.sql). It is
// the app's read of a database contract, never a second source of truth: the DB
// policies are the gate (DR-0060) — this decides what the UI OFFERS, and a
// properties-model.test.js gate fails if the two lists ever drift.
// =============================================================================

/** The roles a person can hold on a door. Mirrors 0075 role_label + 0150. */
export const PROPERTY_ROLES = Object.freeze(['owner', 'manager', 'field_worker', 'tenant', 'household']);

/** The capability grid, per role. EXACTLY 0075's vocabulary + ceiling. */
export const ROLE_CEILING = Object.freeze({
  manager: Object.freeze([
    'request.manage', 'message.tenant', 'notice.post',
    'rentroll.view', 'rent.confirm', 'rent.adjust', 'application.review',
  ]),
  field_worker: Object.freeze(['property.history', 'docs.add']),
  tenant: Object.freeze([]),     // a tenant's reach is their tenancy, not a grant
  household: Object.freeze([]),
  owner: Object.freeze([]),      // the owner is an instance member, not a delegate
});

/** Every capability that exists. Nothing outside this list is grantable. */
export const ALL_CAPABILITIES = Object.freeze(
  Array.from(new Set([...ROLE_CEILING.manager, ...ROLE_CEILING.field_worker])).sort()
);

/** Plain-language labels — what the landlord is actually turning on. */
export const CAPABILITY_LABELS = Object.freeze({
  'request.manage': 'Manage work orders (triage, assign, close)',
  'message.tenant': 'Message tenants',
  'notice.post': 'Post notices + see tenant contact',
  'rentroll.view': 'See the rent roll for managed doors',
  'rent.confirm': 'Confirm a payment was received',
  'rent.adjust': 'Adjust a balance owed (audited)',
  'application.review': 'Review rental applications',
  'property.history': 'See the property history',
  'docs.add': 'Add job documentation (photos, outcome)',
});

/**
 * Intersect a requested capability set with the role's ceiling. The SAME rule the
 * database's claim_property_access() enforces — kept here so the invite UI cannot
 * even OFFER something the server would drop (and the test proves they agree).
 */
export function capabilitiesFor(role, requested = []) {
  const ceiling = ROLE_CEILING[role] || [];
  return ceiling.filter((c) => requested.includes(c));
}

// ---------------------------------------------------------------------------
// Faces. Which surfaces a person meets when they open either app. A face is
// derived from the role + the REAL grants that person holds — never from a
// hard-coded assumption about who they are.
// ---------------------------------------------------------------------------
const TAB = (id, label, why, needs = null) => ({ id, label, why, needs });

const TENANT_TABS = [
  TAB('door', 'My place', 'The unit, the lease dates, who to reach.'),
  TAB('work', 'Work orders', 'Report something broken and watch it move.'),
  TAB('thread', 'Messages', 'One timestamped thread with the landlord, manager, and worker.'),
  TAB('history', 'History', 'Everything that has happened on this door, in order.'),
  TAB('rent', 'Payments', 'What was reported, what was confirmed, and when.'),
  TAB('notices', 'Notices', 'What the landlord has posted.'),
];

const WORKER_TABS = [
  TAB('jobs', 'My jobs', 'The work orders assigned to me.', 'property.history'),
  TAB('document', 'Document it', 'Fixed, or not fixed and why — two taps and a photo.', 'docs.add'),
  TAB('history', 'Property history', 'What this door has needed before.', 'property.history'),
  TAB('thread', 'Job messages', 'The thread for a job the landlord opened to me.'),
];

const MANAGER_TABS = [
  TAB('board', 'Work board', 'Every open work order across the doors I manage.', 'request.manage'),
  TAB('dispatch', 'Dispatch', 'Send a job to a 1099 worker by text or call.', 'request.manage'),
  TAB('doors', 'Doors', 'The doors I manage and who lives in them.'),
  TAB('thread', 'Messages', 'Tenant threads for my doors.', 'message.tenant'),
  TAB('rent', 'Rent', 'Confirm what came in; correct a balance with a reason.', 'rentroll.view'),
  TAB('history', 'History', 'The whole relationship record, notes included.'),
  TAB('timeline', 'Door history', 'This door across every tenancy it has held — move-ins, move-outs, and the turn between.'),
  TAB('rooms', 'Rooms', 'The rooms in this unit and their pictures. Add or remove one without a code change.'),
  TAB('gallery', 'Pictures', 'This property\u2019s photographs. Listing shots are the only kind a stranger can see.'),
  TAB('files', 'Files', 'The signed lease, permits, insurance, receipts \u2014 the papers this door already has.'),
  // Every property, our own home included \u2014 "keeping a mechanical history of
  // the system's and issues like all our properties" (Darrell, 2026-08-28).
  TAB('systems', 'Systems', 'The furnace, the roof, the water heater \u2014 how old each one is and everything that has happened to it.'),
  TAB('people', 'People', 'Invite a tenant, a family member, or a 1099 worker.'),
  TAB('documents', 'Documents', 'The lease, the rules, the notices and the letters — filled from this door’s own records.'),
  TAB('plan', 'Rollout', 'Where this app is in its build, what is gated, and what waits on a hand.'),
];

/**
 * Resolve the face a signed-in person meets.
 *   role   — 'owner' | 'manager' | 'field_worker' | 'tenant' | 'household'
 *   grants — the capability strings actually held (from delegated_capabilities)
 * A tab whose `needs` capability is missing comes back `locked` with an honest
 * reason instead of being silently dropped: the person can SEE that the landlord
 * has not turned it on, which is the difference between a gate and a mystery.
 */
export function resolveFace(role, grants = []) {
  const held = new Set(grants);
  const base = role === 'tenant' || role === 'household' ? TENANT_TABS
    : role === 'field_worker' ? WORKER_TABS
    : MANAGER_TABS;
  const tabs = base.map((t) => {
    // Household members share the tenant's face minus the rent WRITE path; the
    // read stays (it is their household's rent) — 0150 encodes exactly this.
    const locked = t.needs ? !held.has(t.needs) : false;
    return { ...t, locked, lockReason: locked ? `Your landlord has not turned on "${CAPABILITY_LABELS[t.needs] || t.needs}" yet.` : '' };
  });
  return {
    role,
    label: FACE_LABELS[role] || role,
    tabs,
    canWriteRent: role === 'tenant' || role === 'owner' || held.has('rent.confirm'),
    canPostToBooks: role === 'owner',   // the books belong to the instance (0150 trigger)
    readOnly: role === 'household' ? ['rent'] : [],
  };
}

export const FACE_LABELS = Object.freeze({
  owner: 'Landlord',
  manager: 'Property manager',
  field_worker: '1099 worker',
  tenant: 'Tenant',
  household: 'Household member',
});

// ---------------------------------------------------------------------------
// The frictionless job documentation (DR-0101 §6). Tradespeople hate typing, so
// the whole entry is two taps: an outcome, and — when it is not fixed — why.
// ---------------------------------------------------------------------------
export const DOC_OUTCOMES = Object.freeze(['fixed', 'not_fixed']);
export const DOC_FOLLOWUPS = Object.freeze(['needs_parts', 'needs_money', 'needs_time', 'other']);
export const FOLLOWUP_LABELS = Object.freeze({
  needs_parts: 'Needs parts',
  needs_money: 'Needs money approved',
  needs_time: 'Needs more time',
  other: 'Something else',
});

/**
 * Build one documentation row for request_documentation (0075). `followup` is
 * only meaningful when the job is NOT fixed — the DB comment says the app
 * enforces that, so it is enforced here and proven in the test.
 */
export function buildJobDoc({ instanceId, requestId, tenancyId, outcome, followup, note, imageData } = {}) {
  const out = DOC_OUTCOMES.includes(outcome) ? outcome : 'not_fixed';
  return {
    instance_id: instanceId || null,
    request_id: requestId || null,
    tenancy_id: tenancyId || null,
    outcome: out,
    followup: out === 'not_fixed' && DOC_FOLLOWUPS.includes(followup) ? followup : null,
    note: String(note || '').trim() || null,
    image_data: imageData || null,
  };
}

/** One note on the shared relationship record (tenancy_notes, 0150). */
export function buildTenancyNote({ instanceId, tenancyId, requestId, authorRole, authorLabel, body } = {}) {
  const role = PROPERTY_ROLES.includes(authorRole) ? authorRole : 'tenant';
  return {
    instance_id: instanceId || null,
    tenancy_id: tenancyId || null,
    request_id: requestId || null,
    author_role: role === 'owner' ? 'landlord' : role === 'field_worker' ? 'worker' : role,
    author_label: String(authorLabel || '').trim() || null,
    body: String(body || '').trim(),
  };
}

// ---------------------------------------------------------------------------
// THE HISTORICAL RECORD. Darrell, 2026-08-26: "management should be able to see
// all notes included in the view for historical understanding of the relationship
// between Poe Properties and the tenants and also 1099 workers who support."
//
// Every real event on a door, merged into one chronological stream. REAL DATES
// ONLY (DR-0076/DR-0124): a row with no usable timestamp is carried with
// `undated: true` and sorted to the end — never given an invented date.
// ---------------------------------------------------------------------------
const at = (...candidates) => {
  for (const c of candidates) {
    if (!c) continue;
    const t = Date.parse(c);
    if (Number.isFinite(t)) return { iso: new Date(t).toISOString(), ms: t };
  }
  return null;
};

export function buildHistory({
  requests = [], messages = [], notes = [], docs = [], rent = [], notices = [], propertyNotes = [],
} = {}) {
  const events = [];
  const push = (kind, row, stamp, summary, who) => {
    events.push({
      kind,
      id: row.id || `${kind}-${events.length}`,
      at: stamp ? stamp.iso : null,
      ms: stamp ? stamp.ms : Number.POSITIVE_INFINITY,
      undated: !stamp,
      summary,
      who: who || '',
      raw: row,
    });
  };

  for (const r of requests) {
    push('work-order', r, at(r.created_at), r.title || 'Work order', r.created_by_role || '');
    if (r.status === 'resolved' && r.updated_at) {
      push('work-order-closed', r, at(r.updated_at), `Closed: ${r.title || 'work order'}`, r.assigned_to_label || '');
    }
  }
  for (const m of messages) push('message', m, at(m.sent_at), m.body || '', m.from_role || '');
  for (const n of notes) push('note', n, at(n.created_at), n.body || '', n.author_label || n.author_role || '');
  for (const d of docs) {
    const head = d.outcome === 'fixed' ? 'Fixed' : `Not fixed — ${FOLLOWUP_LABELS[d.followup] || 'follow-up needed'}`;
    push('job-doc', d, at(d.created_at), d.note ? `${head}. ${d.note}` : head, 'worker');
  }
  for (const r of rent) {
    const label = r.status === 'confirmed' ? 'Payment confirmed' : r.status === 'disputed' ? 'Payment disputed' : 'Payment reported';
    push('rent', r, at(r.confirmed_at, r.reported_at), `${label}: $${Number(r.amount || 0).toFixed(2)}${r.for_period ? ` for ${r.for_period}` : ''}`, r.reported_by_role || '');
  }
  for (const n of notices) push('notice', n, at(n.posted_at), n.title || 'Notice', 'landlord');
  // The landlord's own private door memory (property_notes, 0062) joins the
  // MANAGEMENT view only — the caller passes it in solely for that face.
  for (const n of propertyNotes) push('property-note', n, at(n.created_at, n.note_date), n.body || n.title || '', 'landlord');

  events.sort((a, b) => (a.ms - b.ms) || String(a.id).localeCompare(String(b.id)));
  return events;
}

/** Oldest-first is the reading order (DR-0124). Newest-first for the inbox view. */
export function newestFirst(events = []) {
  return [...events].sort((a, b) => {
    if (a.undated !== b.undated) return a.undated ? 1 : -1;
    return (b.ms - a.ms) || String(a.id).localeCompare(String(b.id));
  });
}

// ---------------------------------------------------------------------------
// THE MONEY RIVER (Darrell, 2026-08-26: "the money will populate the PoeTech App
// books because it's money from our tenants"). No money moves in the app — a
// CONFIRMED rent record posts ONCE as an income entry in the books. The database
// holds the idempotency (rent_records.posted_tx_id + the posting trigger, 0150);
// this is the pure mapper the books surface writes through.
// ---------------------------------------------------------------------------
export function rentRecordToBookEntry(record = {}, { propertyLabel = '', unitLabel = '', entityId = null, accountId = null } = {}) {
  const amount = Number(record.amount) || 0;
  const when = record.confirmed_at || record.reported_at || null;
  const door = [propertyLabel, unitLabel].filter(Boolean).join(' · ');
  return {
    id: `rent-${record.id}`,                 // stable -> the books row is idempotent
    date: when ? String(when).slice(0, 10) : '',
    description: `Rent${record.for_period ? ` ${record.for_period}` : ''}${door ? ` — ${door}` : ''}`,
    amount,
    type: 'income',
    category: 'Rental Income',
    entityId,
    accountId,
    method: record.method || 'other',
    source: 'poe-properties',
    sourceRecordId: record.id || null,
  };
}

/** Which confirmed rent records have NOT yet reached the books. */
export function unpostedRent(records = []) {
  return records.filter((r) => r && r.status === 'confirmed' && !r.posted_tx_id);
}

/**
 * Is this rent record safe to post? Guards the two ways a books entry goes wrong:
 * posting something not confirmed, and posting the same record twice.
 */
export function canPostToBooks(record = {}) {
  if (!record || !record.id) return { ok: false, reason: 'no-record' };
  if (record.status !== 'confirmed') return { ok: false, reason: 'not-confirmed' };
  if (record.posted_tx_id) return { ok: false, reason: 'already-posted' };
  if (!(Number(record.amount) > 0)) return { ok: false, reason: 'no-amount' };
  return { ok: true, reason: '' };
}

// ---------------------------------------------------------------------------
// WHO ARE YOU? (Darrell, 2026-08-26: "Ask who they are landlord tenant or
// applicant... others?... Options to see inventory and rented or available")
//
// The door used to have one thing to say to someone with no door assigned —
// "a landlord invites you" — which is a dead end for the person most likely to
// open a property app first: someone looking for a place. These are the real
// answers, and each routes somewhere that actually exists.
// ---------------------------------------------------------------------------
export const WHO_OPTIONS = Object.freeze([
  Object.freeze({ id: 'applicant', label: 'Looking for a place', blurb: 'See what is available and apply.', needsAccount: false, goes: 'vacancies' }),
  Object.freeze({ id: 'tenant', label: 'I live here', blurb: 'Your unit, work orders, messages, and payment history.', needsAccount: true, goes: 'sign-in' }),
  Object.freeze({ id: 'household', label: 'I live here with my family', blurb: 'The same door as the person on the lease.', needsAccount: true, goes: 'sign-in' }),
  Object.freeze({ id: 'field_worker', label: 'I do the work (1099)', blurb: 'Your jobs, the property history, and two-tap documentation.', needsAccount: true, goes: 'sign-in' }),
  Object.freeze({ id: 'manager', label: 'I manage properties', blurb: 'The work board, dispatch, rent, and the whole record.', needsAccount: true, goes: 'sign-in' }),
  Object.freeze({ id: 'landlord', label: 'I own properties', blurb: 'Run your doors here, or bring your own portfolio.', needsAccount: true, goes: 'sign-in' }),
]);

/** The one thing a visitor with no account can do without signing in. */
export function whoCanBrowse() {
  return WHO_OPTIONS.filter((w) => !w.needsAccount).map((w) => w.id);
}

/**
 * The inventory, split the way a person asks about it: what is rented, what is
 * available. REAL rows only — a door whose tenancy the caller cannot see is
 * counted as `unknown`, never assumed empty, because "available" is a claim
 * that brings strangers to an address (DR-0076).
 */
export function inventory(doors = [], tenancies = [], vacancies = []) {
  const activeRefs = new Set(
    tenancies.filter((t) => t && t.status === 'active').map((t) => t.rental_ref || t.rentalRef)
  );
  const listedIds = new Set(vacancies.map((v) => v.id));
  const rented = [];
  const available = [];
  const unknown = [];
  for (const d of doors) {
    const ref = d.slug || d.rental_ref || d.id;
    if (activeRefs.has(ref)) rented.push(d);
    else if (listedIds.has(d.id) || d.listed_at) available.push(d);
    else unknown.push(d);
  }
  return {
    rented, available, unknown,
    counts: { rented: rented.length, available: available.length, unknown: unknown.length, total: doors.length },
    // Said plainly on the surface rather than hidden: not-listed is not vacant.
    unknownMeans: 'Not listed publicly. A unit is only shown as available when the landlord lists it — an empty unit is never advertised automatically.',
  };
}
