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

export const TENANT_TABS = [
  TAB('door', 'My place', 'The unit, the lease dates, who to reach.'),
  // THE PICTURES OF THIS PLACE (DR-1199): the listing pictures the landlord
  // shares of the door they live in (0309's switch, on by default) and the
  // pictures filed to their own tenancy, room by room. Read-only.
  TAB('pictures', 'Pictures', 'The pictures your landlord shares of this place, room by room.'),
  TAB('work', 'Work orders', 'Report something broken and watch it move.'),
  TAB('thread', 'Messages', 'One timestamped thread with the landlord, manager, and worker.'),
  TAB('history', 'History', 'Everything that has happened on this door, in order.'),
  TAB('rent', 'Payments', 'What was reported, what was confirmed, and when.'),
  TAB('notices', 'Notices', 'What the landlord has posted.'),
  // MY PAPERS (DR-0936): the lease and every paper filed to this tenancy, the
  // ones waiting for my signature first, and a paper of my own to file.
  TAB('papers', 'Documents', 'Your lease and papers, anything waiting for your signature, and a paper of your own to file.'),
  // THE CAMERAS AT THIS DOOR (DR-0841): the porch, the hallway, the lot — the
  // ones the landlord shared with this door, live, through the same NAS road.
  TAB('cameras', 'Cameras', 'The cameras your landlord shares with this door.'),
  // LIFE HERE (DR-1010): a picture of life at the property, signed over to the
  // family, shown on the building's public wall once they say yes.
  TAB('wall', 'Life here', 'Share a picture of life here for the community wall; see where each one stands.'),
];

export const WORKER_TABS = [
  // THE DOORS HE IS SENT TO, TENANT OR NO TENANT (2026-09-08, migration 0185).
  // A worker's whole face used to hang on a tenancy row, and the turn — the
  // microwave, the ductwork, the stairs — happens exactly when there is none.
  // "Add job documentation" now reaches the door itself, so the doors he is
  // delegated to are listed and their pictures can be filed from his phone.
  TAB('doors', 'My doors', 'The doors I am sent to, with their pictures.', 'docs.add'),
  TAB('jobs', 'My jobs', 'The work orders assigned to me.', 'property.history'),
  TAB('document', 'Document it', 'Fixed, or not fixed and why — two taps and a photo.', 'docs.add'),
  TAB('gallery', 'Pictures', 'Before and after, room by room — take a photo and say what it shows.', 'docs.add'),
  TAB('history', 'Property history', 'What this door has needed before.', 'property.history'),
  TAB('thread', 'Job messages', 'The thread for a job the landlord opened to me.'),
  // THE CAMERAS AT THE DOOR HE IS SENT TO (DR-0938): he asks for the ones he
  // needs (the porch, for a delivery); the family decides and for how long.
  TAB('cameras', 'Cameras', 'Ask for the cameras at the door I am sent to, and watch the ones given to me.'),
];

export const MANAGER_TABS = [
  // THE DOOR FIRST, THEN WHAT HAPPENS INSIDE IT (DR-0837; Darrell 2026-10-09:
  // "they should be options inside the apartment... doesn't make sense
  // separate"). The work board and the dispatch read ONE door; they sit after
  // the doors and under the door's own header, never beside it.
  TAB('doors', 'Doors', 'The doors I manage and who lives in them.'),
  TAB('board', 'Work board', 'The open work orders on this door.', 'request.manage'),
  TAB('dispatch', 'Dispatch', 'Send one of this door\u2019s jobs to a 1099 worker by text or call, and record it.', 'request.manage'),
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
  // THE METER (DR-1098): what this door's utility meter recorded, from the
  // utility's own Green Button file, home and rentals alike. The owner's
  // record: hourly reads show when a house stands empty, so 0302 lets no
  // viewer, assistant or delegate read them.
  TAB('energy', 'Energy', 'What this door\u2019s meter recorded: how much, when, the always-on draw and the rate, from the utility\u2019s own file.'),
  // Turning a unit into a listing is its own body of work — construction,
  // furnishing, supplies, safety, the listing itself — and it belongs to the
  // door, not to a side note. Darrell, 2026-09-12.
  // THE NIGHTS OF A SHORT-STAY DOOR (DR-0930): asks to confirm, what is
  // coming, blackouts, and stays the family enters itself.
  TAB('stays', 'Stays', 'Confirm or decline asked-for nights, black out dates, and book a stay yourself.'),
  TAB('readiness', 'Guest ready', 'Everything left before this unit can be listed and take a guest \u2014 and what it still costs.'),
  TAB('people', 'People', 'Invite a tenant, a family member, or a 1099 worker.'),
  TAB('cameras', 'Cameras', 'Share the cameras at this door with its household, and take them back.'),
  TAB('documents', 'Documents', 'The lease, the rules, the notices and the letters — filled from this door’s own records.'),
  // THE LIFE WALL (DR-1010): what tenants and guests shared, waiting for the
  // family's yes; approved pictures on the public wall, picked ones in the listing.
  TAB('wall', 'Life wall', 'Pictures tenants and guests shared of life here: approve them for the public wall, pick some for the listing.'),
  // BUILDING FROM THE GROUND UP (DR-1166): a project's budget, phases and
  // checks, change orders, value and the deal for investors. The owner's.
  TAB('development', 'Development', 'Build from the ground up: the budget, the phases and their checks, change orders, what it is worth, and the deal for investors.'),
  TAB('plan', 'Rollout', 'Where this app is in its build, what is gated, and what waits on a hand.'),
];

/**
 * WHAT THIS FACE IS NOT SHOWN (DR-0876). Darrell, 2026-10-10: "End to end....
 * historical accuracy and events" — and the reason it matters: "workers can
 * deduce things from historical data... less questions for owners."
 *
 * Row-level security does NOT error when it withholds something; it filters
 * the rows and returns an empty set. So a person who is not permitted to see
 * a part of a door's record gets exactly what a person looking at a brand new
 * door gets — nothing — under a heading that says "Everything that has
 * happened on this door, in order." A worker deducing from that would deduce
 * from an absence the app created, which is the opposite of what the record
 * is for.
 *
 * This names the gaps in plain words so the surface can SAY them. It mirrors
 * the 0150 read policies deliberately, the same way capabilitiesFor() mirrors
 * claim_property_access() — stated here so the duplication is a decision and
 * not an accident. If the policies move, this moves with them.
 *
 * Returns [] when this face sees the whole record.
 */
export function unseenByThisFace(role, grants = [], { since = null } = {}) {
  const held = new Set(grants);
  const out = [];
  // A tenant's history begins when the tenancy became theirs (DR-1167).
  if ((role === 'tenant' || role === 'household') && since) {
    const day = String(since).slice(0, 10);
    out.push(`Your history begins on ${day}, when this tenancy became yours. What happened at this door before that belongs to the landlord's record, not yours.`);
  }
  // tenant_messages_read (0150:242): owner/admin/member, the tenant, their
  // household, a delegate with message.tenant, or a worker enabled on a job.
  if (role === 'manager' && !held.has('message.tenant')) {
    out.push('Messages are not part of the history you are shown — your landlord has not turned on "Message tenants" for you.');
  }
  if (role === 'field_worker') {
    out.push('You are shown the job threads your landlord opened to you, not the tenant\u2019s whole conversation.');
  }
  // rent_records (0075 §3): the rent roll is a delegated sight.
  if (role === 'manager' && !held.has('rentroll.view')) {
    out.push('Payments are not part of the history you are shown — your landlord has not turned on "See the rent roll for managed doors".');
  }
  if (role === 'field_worker') {
    out.push('Payments and the tenant\u2019s private details are never part of a worker\u2019s history.');
  }
  // property_notes (0062) is the landlord's own door memory, passed only to
  // the management face by the caller — never promised to anyone else.
  if (role === 'tenant' || role === 'household') {
    out.push('Your landlord\u2019s own private notes about this property are not part of your history.');
  }
  return out;
}

/**
 * One sentence for a record that could not be fully READ (as opposed to one
 * the reader is not permitted to see). `unreadable` comes from
 * loadDoorRecord. Null when everything was read.
 */
export function unreadNote(unreadable = []) {
  const list = (Array.isArray(unreadable) ? unreadable : []).filter(Boolean);
  if (!list.length) return null;
  const which = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  return `This history is INCOMPLETE: the ${which} could not be read just now, so what is missing is unknown rather than absent. Try again before deciding anything from it.`;
}

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
  // THE OWNER HOLDS EVERY CAPABILITY BY BEING THE OWNER. His ceiling in
  // ROLE_CEILING is [] because he is an instance member, not a delegate — the
  // database grants him everything through user_role_in_instance, never
  // through a delegated_capabilities row. Reading his empty grant list as
  // "not turned on" locked Work board, Dispatch, Messages and Rent on the
  // landlord's own screen (Darrell's phone, 2026-09-08: "WORK BOARD · LOCKED"
  // above his twelve doors). A lock is for a delegate whose landlord has not
  // said yes; the landlord is the one who says it.
  const owner = role === 'owner';
  const tabs = base.map((t) => {
    // Household members share the tenant's face minus the rent WRITE path; the
    // read stays (it is their household's rent) — 0150 encodes exactly this.
    const locked = t.needs && !owner ? !held.has(t.needs) : false;
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
export function buildJobDoc({ instanceId, requestId, tenancyId, rentalId, outcome, followup, note, imageData } = {}) {
  const out = DOC_OUTCOMES.includes(outcome) ? outcome : 'not_fixed';
  // The scope is the REQUEST's (0260 copies it from the parent row before RLS
  // reads it); these are carried so a reader of the row sees the door at once.
  return {
    instance_id: instanceId || null,
    request_id: requestId || null,
    tenancy_id: tenancyId || null,
    rental_id: rentalId || null,
    outcome: out,
    followup: out === 'not_fixed' && DOC_FOLLOWUPS.includes(followup) ? followup : null,
    note: String(note || '').trim() || null,
    image_data: imageData || null,
  };
}

/** One note on the shared relationship record (tenancy_notes, 0150). */
export function buildTenancyNote({ instanceId, tenancyId, rentalId, requestId, authorRole, authorLabel, body } = {}) {
  const role = PROPERTY_ROLES.includes(authorRole) ? authorRole : 'tenant';
  return {
    instance_id: instanceId || null,
    tenancy_id: tenancyId || null,
    // A note on a door no tenancy holds (a vacant door, a short stay, our home)
    // names the door instead (0260 / DR-0897). At least one of the two is set.
    rental_id: rentalId || null,
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
  requests = [], messages = [], notes = [], docs = [], rent = [], notices = [], propertyNotes = [], changes = [],
  // Map(userId -> name) from people.js namesByUserId. Optional: when it is
  // absent the history reads exactly as it always did, by role. When it is
  // present a message says WHO said it, which is the whole point of keeping
  // the thread (DR-0871) — "landlord · tenant · landlord" cannot tell you who
  // was misled, and a name can.
  names = null,
} = {}) {
  const speaker = (row, role) => {
    const n = names && row && row.sender_user_id ? names.get(row.sender_user_id) : null;
    return n ? `${n} · ${role || ''}`.replace(/ \u00b7 $/, '') : (role || '');
  };
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
  for (const m of messages) push('message', m, at(m.sent_at), m.body || '', speaker(m, m.from_role));
  for (const n of notes) push('note', n, at(n.created_at), n.body || '', n.author_label || n.author_role || '');
  for (const d of docs) {
    const head = d.outcome === 'fixed' ? 'Fixed' : `Not fixed — ${FOLLOWUP_LABELS[d.followup] || 'follow-up needed'}`;
    push('job-doc', d, at(d.created_at), d.note ? `${head}. ${d.note}` : head, 'worker');
  }
  for (const r of rent) {
    const label = r.status === 'confirmed' ? 'Payment confirmed' : r.status === 'disputed' ? 'Payment disputed' : 'Payment reported';
    // A part payment says what is still owed and when it was promised (0262).
    const part = Number(r.remaining_after) > 0
      ? ` (part payment: $${Number(r.remaining_after).toFixed(2)} still owed${r.rest_promised_on ? `, promised by ${r.rest_promised_on}` : ''})`
      : '';
    // On the day the money CAME when that is known (0265 / DR-0903): a
    // January payment recorded in October belongs in January.
    const came = r.paid_on ? `${r.paid_on}T12:00:00Z` : null;
    const who = r.tenancy_id === null && r.rental_id ? ' (no tenant on record)' : '';
    push('rent', r, at(came, r.confirmed_at, r.reported_at), `${label}: $${Number(r.amount || 0).toFixed(2)}${r.for_period ? ` for ${r.for_period}` : ''}${part}${who}`, r.reported_by_role || '');
  }
  // EVERY CHANGE, TO THE INSTANT (DR-0899, door_events). The row above is
  // the record's birth; these are what happened to it after, each with its
  // own clock, so a situation can be recreated in order.
  const titleOf = new Map(requests.map((r) => [r.id, r.title]));
  for (const e of changes) {
    const s = changeSummary(e, titleOf);
    if (s) push('change', e, at(e.at), s, '');
  }
  for (const n of notices) push('notice', n, at(n.posted_at), n.title || 'Notice', 'landlord');
  // The landlord's own private door memory (property_notes, 0062) joins the
  // MANAGEMENT view only — the caller passes it in solely for that face.
  for (const n of propertyNotes) push('property-note', n, at(n.created_at, n.note_date), n.body || n.title || '', 'landlord');

  events.sort((a, b) => (a.ms - b.ms) || String(a.id).localeCompare(String(b.id)));
  return events;
}

/**
 * One change from door_events (0262) in words. The birth events ('reported',
 * 'filed') are skipped: the record itself is already on the timeline.
 */
export function changeSummary(e = {}, titleOf = new Map()) {
  const what = e.subject === 'rent' ? 'Payment' : `Work order${titleOf.get(e.subject_id) ? ` "${titleOf.get(e.subject_id)}"` : ''}`;
  switch (e.event) {
    case 'status': return `${what} moved from ${e.from_value || 'nothing'} to ${e.to_value || 'nothing'}`;
    case 'assigned': return e.to_value ? `${what} assigned to ${e.to_value}` : `${what} unassigned`;
    case 'priority': return `${what} priority changed from ${e.from_value} to ${e.to_value}`;
    case 'changed': return `${what} amount or dates changed`;
    case 'posted-to-books': return `${what} posted to the books`;
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// A TENANT SEES THEIR OWN TENANCY, FROM THE DAY IT BECAME THEIRS (DR-1167).
// Darrell, 2026-10-21, looking at Apt 2 "seen as a tenant": "A new tenant
// should only see their history... the landlord should see all historical
// events" — and "all tabs should make sense".
//
// The door keeps everything: every tenant, the months between them, and the
// landlord's own notes. A tenant's face is narrower. It reads this tenancy's
// rows only (never a row filed on the door itself), and only from the moment
// the tenancy had a person on it: `tenant_from`, which migration 0306 stamps
// when a name, a contact or an account first lands on the row. Before that the
// row was a vacant unit record, and what was written on it was the landlord's.
//
// The database enforces the same window for a signed-in tenant (0306's
// restrictive policies); this is the same rule on the screen, so the
// landlord's preview shows exactly what the tenant will get, not the owner's
// whole record under a tenant's heading.
// ---------------------------------------------------------------------------

/** Whether a tenancy row has a person on it (a name, a contact or an account). */
export function tenancyHasTenant(t) {
  if (!t) return false;
  return Boolean(t.tenant_user_id || String(t.tenant_name || '').trim()
    || String(t.tenant_email || '').trim() || String(t.tenant_phone || '').trim());
}

/** The moment this tenancy's history begins for its tenant, or null. */
export function tenantSightStart(t) {
  if (!tenancyHasTenant(t)) return null;
  return at(t.tenant_from, t.created_at);
}

/**
 * The door record narrowed to what this tenancy's tenant sees. `vacant` is
 * true when the row has nobody on it: a tenant's face then shows nothing,
 * because nothing on a vacant door is any tenant's yet.
 */
export function forThisTenancy(record = {}, tenancy = null) {
  const unreadable = record.unreadable || [];
  const none = { requests: [], messages: [], notes: [], docs: [], rent: [], notices: [], unreadable };
  const start = tenantSightStart(tenancy);
  if (!start) return { ...none, vacant: true, since: null };
  const theirs = (row, ...stamps) => {
    if (!row || row.tenancy_id !== tenancy.id) return false;
    const s = at(...stamps.map((k) => row[k]));
    return Boolean(s) && s.ms >= start.ms;
  };
  const requests = (record.requests || []).filter((r) => theirs(r, 'created_at'));
  const kept = new Set(requests.map((r) => r.id));
  return {
    requests,
    messages: (record.messages || []).filter((m) => theirs(m, 'sent_at')),
    notes: (record.notes || []).filter((n) => theirs(n, 'created_at')),
    docs: (record.docs || []).filter((d) => kept.has(d.request_id) && theirs(d, 'created_at')),
    rent: (record.rent || []).filter((r) => theirs(r, 'reported_at', 'confirmed_at')),
    notices: (record.notices || []).filter((n) => theirs(n, 'posted_at')),
    unreadable,
    vacant: false,
    since: start.iso,
  };
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
export function rentRecordToBookEntry(record = {}, { propertyLabel = '', unitLabel = '', entityId = null, accountId = null, entitySlug = null } = {}) {
  const amount = Number(record.amount) || 0;
  const when = record.paid_on || record.confirmed_at || record.reported_at || null;
  const door = [propertyLabel, unitLabel].filter(Boolean).join(' · ');
  return {
    id: `rent-${record.id}`,                 // stable -> the books row is idempotent
    date: when ? String(when).slice(0, 10) : '',
    description: `Rent${record.for_period ? ` ${record.for_period}` : ''}${door ? ` — ${door}` : ''}`,
    amount,
    type: 'income',
    // THE BOOKS' OWN SLUG (DR-1209). This said 'Rental Income' -- the label --
    // and the books keep only their slugs (BooksTransactions coerces anything
    // else to 'other'), so every rent posted from Properties counted as
    // "other" and no rental-income total or report ever saw it.
    category: 'rental-income',
    entityId,
    accountId,
    // WHICH BUSINESS, AND WHICH ASSET (DR-1209): the door's owning entity, and
    // the door itself by its id, so the books can be read per asset.
    entityOverride: entitySlug || null,
    linkedToKind: record.rental_id ? 'rental' : null,
    linkedToId: record.rental_id || null,
    method: record.method || 'other',
    source: 'poe-properties',
    sourceRecordId: record.id || null,
  };
}

/**
 * Is this payment already in the books? The same rent can be entered on
 * either tab -- Poe Properties (rent_records) or Real Estate (rent_payments)
 * -- and each is a different table, so the books are asked: an entry for the
 * same asset, the same amount, in the same month, is the same money (DR-1209).
 */
export function alreadyInBooks(transactions = [], { rentalId, amount, date }) {
  const month = String(date || '').slice(0, 7);
  const amt = Math.round((Number(amount) || 0) * 100);
  if (!rentalId || !month || !amt) return false;
  return (transactions || []).some((t) => t && t.linkedToId === rentalId
    && Math.round((Number(t.amount) || 0) * 100) === amt
    && String(t.date || '').slice(0, 7) === month);
}

/** A payment recorded on Real Estate's rent ledger, as the books entry it is (DR-1209). */
export function rentPaymentToBookEntry({ leaseId, month, amount, at, rentalId, entitySlug = null, label = '' } = {}) {
  const when = String(at || '').slice(0, 10) || `${String(month || '').slice(0, 7)}-01`;
  return {
    id: `rentpay-${leaseId}-${String(month || '').slice(0, 7)}-${String(at || '').replace(/[^0-9]/g, '').slice(0, 14)}`,
    date: when,
    description: `Rent ${String(month || '').slice(0, 7)}${label ? ` — ${label}` : ''}`,
    amount: Number(amount) || 0,
    type: 'income',
    category: 'rental-income',
    entityOverride: entitySlug || null,
    linkedToKind: rentalId ? 'rental' : null,
    linkedToId: rentalId || null,
    source: 'real-estate',
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

// ---------------------------------------------------------------------------
// A CO-LIVING DOOR SAYS SO (DR-0968)
// ---------------------------------------------------------------------------
// Darrell, 2026-10-11, right after settling that the apartment number decides
// what is one apartment: "Good... a tag for co-living?!!!"
//
// DERIVED, NEVER A CHECKBOX. He had just asked, in the same breath, "can we
// make sure this happens each time we co-living a place" -- so a tag that only
// appears when somebody remembers to tick it is the wrong answer to the
// question he actually asked. Both signals are facts the database already
// holds:
//
//   * `rentable_level` -- 0160 added it in 2026 and the client NEVER READ IT,
//     which is why nothing on any screen could say a door is a bed or a room.
//     'bed' and 'room' ARE co-living; 'unit' is a whole place.
//   * having a sibling at the same apartment number -- measured, not declared.
//     A door cannot be the only bed in a shared apartment.
//
// Either one is enough. A door that is a bed says so from the day it is
// created, and a whole unit that later gets split starts saying so the moment
// its second door exists, with nobody editing anything.
const SHARED_LEVELS = new Set(['bed', 'room']);

/** Is this door one part of a shared home? `siblings` is how many other doors sit at its apartment number. */
export function coLivingTag(rental, siblings = 0) {
  if (!rental) return null;
  const level = String(rental.rentable_level || '').toLowerCase();
  if (SHARED_LEVELS.has(level)) {
    return level === 'bed' ? 'Co-living \u2014 a bed' : 'Co-living \u2014 a private room';
  }
  // No level recorded, but it is demonstrably not alone in its apartment.
  if (Number(siblings) > 0) return 'Co-living \u2014 shares this apartment';
  return null;
}

/**
 * What the books hold for one asset in one year: {total, count} from the
 * entries linked to it (DR-1209), so a door shows the money the books show.
 */
export function assetBooksYear(transactions = [], rentalId, year) {
  let total = 0; let count = 0;
  if (!rentalId) return { total, count };
  const y = String(year || '');
  for (const t of transactions || []) {
    if (!t || t.linkedToId !== rentalId || (y && String(t.date || '').slice(0, 4) !== y)) continue;
    total += Number(t.amount) || 0; count += 1;
  }
  return { total: Math.round(total * 100) / 100, count };
}
