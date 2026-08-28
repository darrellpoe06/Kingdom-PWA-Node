// =============================================================================
// properties/cloud — RLS-scoped I/O for the Poe Properties App
// =============================================================================
// WHY THIS IS NOT relationships-sync.js: that library scopes every read by the
// signed-in person's INSTANCE (getInstanceId()), which is right for the family
// looking at their own portfolio and USELESS for the people this app is for — a
// tenant, a household member, and a 1099 worker are NOT instance members, so an
// instance-scoped read returns nothing for them.
//
// Here the query carries NO instance filter and the DATABASE does the scoping:
// user_is_tenant / user_is_tenancy_household / user_is_enabled_worker /
// user_delegated_can (0075 + 0150). RLS is the gate (DR-0060) — this file cannot
// widen it and never tries. A person with no access gets [] , not an error.
//
// Injectable client (`client = supabase`) so every path is testable with a fake.
// Never throws: every function returns { ok, ... } with an honest reason.
// =============================================================================
import supabase, { phoneLoginEmail, normalizePhone } from '../../lib/supabase.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, error) => ({ ok: false, reason, error: (error && error.message) || undefined });

/**
 * What anyone can see with NO account: the units the landlord has LISTED.
 * Reads through public_vacancies(), which is column-explicit by design — it
 * cannot return the family's mortgage balances or a current tenant's name even
 * if a later change asked it to (0152). Never throws; empty is a real answer.
 */
export async function loadPublicVacancies(client = supabase) {
  try {
    const { data, error } = await client.rpc('public_vacancies');
    if (error) {
      const msg = error.message || String(error);
      const reason = /function .*public_vacancies.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return no(reason, error);
    }
    return ok({ vacancies: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Submit a rental application — with or without an account. The intake model
 * refuses an SSN before this is called, and the database refuses one too
 * (rental_applications_no_ssn); belt and suspenders on the one field that
 * would change what this database is.
 */
export async function submitApplication({ instanceId, rentalId, name, email, phone, answers }, client = supabase) {
  const payload = { ...(answers || {}) };
  delete payload['applicant.ssn'];
  delete payload['applicant.driversLicense'];
  try {
    const uid = await userId(client);
    // The id comes BACK (0158). The applicant has no account, so there is no
    // identity to check later — but the row they just created is proof they are
    // the person who asked, and it is what unlocks the street address they were
    // not shown while browsing. Returned to them by their own insert and to
    // nobody else: 0152 grants no SELECT on this table.
    const { data, error } = await client.from('rental_applications').insert({
      instance_id: instanceId || null,
      rental_id: rentalId || null,
      applicant_name: String(name || '').trim(),
      applicant_email: String(email || '').trim() || null,
      applicant_phone: String(phone || '').trim() || null,
      answers: payload,
      submitted_by: uid,
    }).select('id').single();
    return error ? no('write-failed', error) : ok({ applicationId: data?.id || null });
  } catch (e) { return no('unexpected', e); }
}

/** Turn an invitation into access. Idempotent; safe to call on every sign-in. */
export async function claimPropertyAccess(client = supabase) {
  try {
    const { data, error } = await client.rpc('claim_property_access');
    if (error) {
      const msg = error.message || String(error);
      // The RPC does not exist until 0150 applies — say so plainly.
      const reason = /function .*claim_property_access.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return no(reason, error);
    }
    return ok({ receipt: data || {} });
  } catch (e) { return no('unexpected', e); }
}

/** The doors this person can see AT ALL — tenant, family, worker, or manager. */
export async function loadMyDoors(client = supabase) {
  try {
    const { data, error } = await client
      .from('rental_tenancies')
      .select('id, instance_id, rental_ref, property_label, unit_label, tenant_name, tenant_email, tenant_phone, lease_start, lease_end, monthly_rent, deposit, status')
      .order('property_label', { ascending: true });
    if (error) return no('read-failed', error);
    return ok({ doors: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Every capability grant this person actually holds (their own rows only). */
export async function loadMyGrants(client = supabase) {
  try {
    const { data, error } = await client
      .from('delegated_capabilities')
      .select('scope_ref, capability, setting, role_label');
    if (error) return no('read-failed', error);
    const rows = (data || []).filter((r) => r.setting === 'allow');
    return ok({
      grants: rows.map((r) => r.capability),
      byScope: rows.reduce((m, r) => { (m[r.scope_ref] ||= []).push(r.capability); return m; }, {}),
      roleLabel: rows.find((r) => r.role_label)?.role_label || null,
    });
  } catch (e) { return no('unexpected', e); }
}

/** Am I a household member somewhere? (their own rows only, per 0150 RLS) */
export async function loadMyHousehold(client = supabase) {
  try {
    const { data, error } = await client
      .from('tenancy_household')
      .select('tenancy_id, display_name, relationship, active');
    if (error) return no('read-failed', error);
    return ok({ memberships: (data || []).filter((r) => r.active !== false) });
  } catch (e) { return no('unexpected', e); }
}

/** Everything that has ever happened on one door — the whole relationship record. */
export async function loadDoorRecord(tenancyId, client = supabase) {
  if (!tenancyId) return ok({ requests: [], messages: [], notes: [], docs: [], rent: [], notices: [] });
  try {
    const [req, msg, note, rent, ntc] = await Promise.all([
      client.from('tenant_maintenance_requests').select('*').eq('tenancy_id', tenancyId).order('created_at', { ascending: true }),
      client.from('tenant_messages').select('*').eq('tenancy_id', tenancyId).order('sent_at', { ascending: true }),
      client.from('tenancy_notes').select('*').eq('tenancy_id', tenancyId).order('created_at', { ascending: true }),
      client.from('rent_records').select('*').eq('tenancy_id', tenancyId).order('reported_at', { ascending: true }),
      client.from('tenant_notices').select('*').eq('tenancy_id', tenancyId).order('posted_at', { ascending: true }),
    ]);
    // Documentation hangs off the requests we can see.
    const requests = req.data || [];
    let docs = [];
    if (requests.length) {
      const d = await client.from('request_documentation').select('*')
        .in('request_id', requests.map((r) => r.id)).order('created_at', { ascending: true });
      docs = d.data || [];
    }
    return ok({
      requests,
      messages: msg.data || [],
      notes: note.data || [],
      rent: rent.data || [],
      notices: ntc.data || [],
      docs,
    });
  } catch (e) { return no('unexpected', e); }
}

const userId = async (client) => {
  try { return (await client.auth.getUser()).data?.user?.id || null; } catch { return null; }
};

/** File a work order. Tenant, household member, manager, or landlord. */
export async function fileWorkOrder(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { data, error } = await client.from('tenant_maintenance_requests')
      .insert({ ...row, created_by: uid }).select().single();
    if (error) return no('write-failed', error);
    return ok({ row: data });
  } catch (e) { return no('unexpected', e); }
}

/** Move a work order along its lifecycle (the state machine is in tenant-portal.js). */
export async function setWorkOrderStatus(id, status, client = supabase) {
  try {
    const { error } = await client.from('tenant_maintenance_requests')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Assign a job to a 1099 worker (label is denormalized so the board reads early). */
export async function assignWorkOrder(id, { assignedTo = null, assignedToLabel = '' } = {}, client = supabase) {
  try {
    const { error } = await client.from('tenant_maintenance_requests')
      .update({ assigned_to: assignedTo, assigned_to_label: assignedToLabel || null }).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Post to the shared, timestamped thread. Never auto-composed, never auto-sent. */
export async function postMessage({ instanceId, tenancyId, body, fromRole }, client = supabase) {
  try {
    const uid = await userId(client);
    // The thread names who actually spoke (0150 widened the CHECK): a worker's
            // message must not appear as the manager's.
    const role = ['tenant', 'household', 'worker', 'manager', 'landlord'].includes(fromRole) ? fromRole : 'tenant';
    const { error } = await client.from('tenant_messages').insert({
      instance_id: instanceId, tenancy_id: tenancyId, body, from_role: role, sender_user_id: uid,
    });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Append one note to the relationship record (buildTenancyNote made the row). */
export async function postNote(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { error } = await client.from('tenancy_notes').insert({ ...row, author_user_id: uid });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Two-tap job documentation (buildJobDoc made the row). Append-only by design. */
export async function postJobDoc(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { error } = await client.from('request_documentation').insert({ ...row, author_user_id: uid });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Report or confirm rent. Records reality; moves no money (DR-0094). */
export async function recordRent({ instanceId, tenancyId, amount, forPeriod, method, memo, status, role }, client = supabase) {
  try {
    const uid = await userId(client);
    const { error } = await client.from('rent_records').insert({
      instance_id: instanceId, tenancy_id: tenancyId, reported_by: uid,
      reported_by_role: ['tenant', 'manager', 'landlord'].includes(role) ? role : 'tenant',
      amount, for_period: forPeriod || null, method: method || 'other', memo: memo || null,
      status: status || 'reported', money_moved_in_app: false,
    });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

export async function confirmRent(id, client = supabase) {
  try {
    const { error } = await client.from('rent_records')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/**
 * Stamp a confirmed rent record as posted to the books. Instance-side only — the
 * database trigger refuses this from any delegated operator (0150), so a failure
 * here is the gate working, not a bug.
 */
export async function markRentPosted(id, txId, client = supabase) {
  try {
    const uid = await userId(client);
    const { error } = await client.from('rent_records')
      .update({ posted_tx_id: txId, posted_at: new Date().toISOString(), posted_by: uid }).eq('id', id);
    return error ? no('write-refused', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/**
 * Create the tenancy a landlord CONFIRMED from a staged record. Owner/admin or
 * member only (0055's rental_tenancies_insert policy is the gate) — a delegated
 * operator can never create a door's tenancy.
 */
export async function createTenancy(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { data, error } = await client.from('rental_tenancies')
      .insert({ ...row, created_by: uid }).select().single();
    if (error) return no('write-failed', error);
    return ok({ row: data });
  } catch (e) { return no('unexpected', e); }
}

// --- the landlord side: invitations ----------------------------------------

/**
 * Write an invitation. Owner/admin only (RLS enforces it). Grants nothing yet.
 *
 * IDENTITY: an email OR a cell phone. A phone login is a real identity here —
 * the app signs up the synthetic `<digits>@phone.poetech.us` address (DR-0172),
 * so a phone invite carries that same address and the claim matches with no
 * special case. The typed phone rides along in `invited_phone` for display, so
 * the roster shows "(563) 650-2416" and never the synthetic string.
 * The normalization is the ONE shared helper the phone+PIN signup uses — if the
 * two ever disagreed, an invited person would sign in and be told they have no
 * door (properties-door.test.js pins that they agree).
 */
export function inviteIdentity({ email, phone }) {
  const typedPhone = String(phone || '').trim();
  if (typedPhone) {
    const synthetic = phoneLoginEmail(typedPhone);
    if (!synthetic) return { ok: false, reason: 'bad-phone' };
    return { ok: true, email: synthetic, phone: normalizePhone(typedPhone) };
  }
  const addr = String(email || '').trim().toLowerCase();
  if (!addr.includes('@')) return { ok: false, reason: 'bad-email' };
  return { ok: true, email: addr, phone: null };
}

export async function inviteToProperties({ instanceId, email, phone, roleLabel, tenancyId, scopeRef, capabilities, displayName, relationship }, client = supabase) {
  const id = inviteIdentity({ email, phone });
  if (!id.ok) return no(id.reason);
  try {
    const uid = await userId(client);
    const { data, error } = await client.from('property_access_invites').insert({
      instance_id: instanceId,
      email: id.email,
      invited_phone: id.phone,
      role_label: roleLabel,
      tenancy_id: tenancyId || null,
      scope_ref: scopeRef || null,
      capabilities: capabilities || [],
      display_name: displayName || null,
      relationship: relationship || null,
      invited_by: uid,
    }).select().single();
    if (error) return no('write-failed', error);
    return ok({ invite: data });
  } catch (e) { return no('unexpected', e); }
}

/** The invitations on this instance (landlord view) or addressed to me (invitee). */
export async function loadInvites(client = supabase) {
  try {
    const { data, error } = await client.from('property_access_invites')
      .select('*').order('created_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ invites: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Revoke an invitation that has not been claimed (or after). Owner/admin only. */
export async function revokeInvite(id, client = supabase) {
  try {
    const { error } = await client.from('property_access_invites').update({ revoked: true }).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

// ---------------------------------------------------------------------------
// The door's rooms and its pictures (0153). Rooms are rows, so the app never
// branches on a room name — it renders whatever the door has.
// ---------------------------------------------------------------------------

/** Every room on a door, archived ones included — the archived carry history. */
export async function loadRooms(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ rooms: [] });
  try {
    const { data, error } = await client
      .from('property_rooms').select('*').eq('rental_ref', rentalRef).order('sort_order');
    if (error) return no('read-failed', error);
    return ok({ rooms: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Add a room. The row is built and validated by rooms.js before it gets here. */
export async function addRoom(row, client = supabase) {
  try {
    const { data, error } = await client.from('property_rooms').insert(row).select().single();
    if (error) return no('insert-failed', error);
    return ok({ room: data });
  } catch (e) { return no('unexpected', e); }
}

/** Archive or restore. There is no delete path — the photos outlive the room. */
export async function patchRoom(id, patch, client = supabase) {
  if (!id) return no('no-room');
  try {
    const { data, error } = await client.from('property_rooms').update(patch).eq('id', id).select().single();
    if (error) return no('update-failed', error);
    return ok({ room: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * The door's photos. RLS decides what comes back — a tenant sees only their own
 * tenancy's, and never the door-level turn between households.
 */
export async function loadDoorPhotos(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ photos: [] });
  try {
    const { data, error } = await client
      .from('property_photos').select('*').eq('rental_ref', rentalRef).order('taken_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Every tenancy this door has held — the chapters of its chronology. */
export async function loadDoorTenancies(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ tenancies: [] });
  try {
    const { data, error } = await client
      .from('rental_tenancies').select('*').eq('rental_ref', rentalRef).order('lease_start', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ tenancies: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * The landlord's OWN doors — the `rentals` rows, not the tenancies on them.
 *
 * THE DEFECT THIS CLOSES (measured 2026-08-27): loadMyDoors reads
 * rental_tenancies only, so a landlord with 12 properties and no tenancy rows
 * yet opened the app to NOTHING — not even his own doors — and the role
 * resolver, which needed a door to call him an owner, fell through and showed
 * him a TENANT face. The first thing he saw of his own app was an empty screen
 * meant for someone else.
 *
 * Reading a rentals row is itself proof of membership: the live policy is
 * `rentals_select USING user_in_instance(instance_id)` (read from pg_policy,
 * not assumed). RLS is the gate; this is the UI reflecting it (DR-0060).
 */
export async function loadMyRentals(client = supabase) {
  try {
    const { data, error } = await client
      .from('rentals')
      .select('id, slug, instance_id, address, unit, city, state, status, monthly_rent, tenant_name, display_name, property_type, listed_at, listed_rent, listed_note, notes')
      .order('address', { ascending: true });
    if (error) return no('read-failed', error);
    return ok({ rentals: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Edit a tenancy, and leave a trace. EDITABLE-EVERYWHERE names Leases and
 * Tenants explicitly — "a record without an Edit affordance is a bug, not a
 * feature" — and IDENTITY-ROLES-AUDIT says every edit is attributable.
 *
 * There is no lifecycle_log table in this app, so the trace goes where the
 * relationship record already lives: tenancy_notes, which is append-only and
 * which management already reads in full. A note nobody can rewrite is a better
 * audit trail than a column somebody can.
 */
export async function updateTenancy(id, patch, { summary = '', authorLabel = '', instanceId } = {}, client = supabase) {
  if (!id) return no('no-tenancy');
  if (!patch || Object.keys(patch).length === 0) return ok({ row: null, unchanged: true });
  try {
    const { data, error } = await client.from('rental_tenancies').update(patch).eq('id', id).select().single();
    if (error) return no('update-failed', error);
    if (summary) {
      // Best-effort: the edit itself already landed, so a failed note must not
      // report the edit as failed — it is reported as an untraced edit instead.
      const uid = await userId(client);
      const { error: noteErr } = await client.from('tenancy_notes').insert({
        instance_id: instanceId || data.instance_id,
        tenancy_id: id,
        author_user_id: uid,
        author_role: 'landlord',
        author_label: authorLabel || '',
        body: `Edited — ${summary}`,
      });
      if (noteErr) return ok({ row: data, traced: false, traceError: noteErr.message });
    }
    return ok({ row: data, traced: Boolean(summary) });
  } catch (e) { return no('unexpected', e); }
}

/** Edit a door. The trace rides in the door's own notes, which is what it has. */
export async function updateRental(id, patch, { summary = '' } = {}, client = supabase) {
  if (!id) return no('no-rental');
  if (!patch || Object.keys(patch).length === 0) return ok({ row: null, unchanged: true });
  try {
    const body = { ...patch };
    if (summary) {
      const { data: cur } = await client.from('rentals').select('notes').eq('id', id).single();
      const stamp = new Date().toISOString().slice(0, 10);
      body.notes = `${cur?.notes || ''}\n[${stamp}] Edited — ${summary}`.trim();
    }
    const { data, error } = await client.from('rentals').update(body).eq('id', id).select().single();
    if (error) return no('update-failed', error);
    return ok({ row: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Every photo this person may see, across all their doors — what the Properties
 * board needs to show a cover thumbnail per property without a query per row.
 * RLS does the scoping: a tenant gets their own tenancy's photos and nothing
 * else, so this is safe to call from any face.
 */
export async function loadAllPhotos(client = supabase) {
  try {
    const { data, error } = await client
      .from('property_photos')
      .select('id, rental_ref, tenancy_id, room_id, kind, caption, storage_path, taken_at, uploaded_at, archived_at')
      .is('archived_at', null)
      .order('taken_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** File a photo against a door (and optionally a room / tenancy). */
export async function addPhoto(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { data, error } = await client.from('property_photos')
      .insert({ ...row, uploaded_by: uid }).select().single();
    if (error) return no('insert-failed', error);
    return ok({ photo: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Correct a photo's description, or archive it. The image itself is frozen by a
 * trigger (0154) — this can only reach caption / room_id / kind / archived_at.
 */
export async function patchPhoto(id, patch, client = supabase) {
  if (!id) return no('no-photo');
  try {
    const { data, error } = await client.from('property_photos').update(patch).eq('id', id).select().single();
    if (error) return no('update-failed', error);
    return ok({ photo: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * THE LANDLORD'S OWN MEMORY OF THIS DOOR (property_notes, 0062).
 *
 * The dead-end this closes, measured 2026-08-28: buildHistory has accepted a
 * `propertyNotes` argument since it was written and NOTHING has ever passed
 * one. Meanwhile the Real Estate tab has been writing to that exact table —
 * four rows are in it right now, including the three on 1508 Williamsburg.
 * Darrell typed them in one app and they were invisible in the other, which is
 * the whole of "need all data to be reflected in the apps".
 *
 * SLUG-KEYED, not UUID. property_notes.rental_ref is TEXT (the rentals slug),
 * unlike property_rooms / property_photos / property_systems next door. Both
 * are correct for their own table; passing the wrong one matches nothing and
 * fails silently, which is exactly how Rooms and Photos were empty for weeks.
 *
 * A TENANT NEVER SEES THESE. 0062 grants read to owner/admin/member only, so
 * this returns [] for a household member or a field worker without this file
 * doing anything — RLS is the gate (DR-0060). "She said her toilet is backing
 * up and understands she will have to pay if her kids put something down the
 * toilet" is the landlord's private record, not a message to the household.
 */
export async function loadDoorNotes(rentalSlug, client = supabase) {
  if (!rentalSlug) return ok({ notes: [] });
  try {
    const { data, error } = await client
      .from('property_notes').select('*')
      .eq('rental_ref', rentalSlug)
      .order('created_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ notes: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** The papers on a door and its tenancies — leases, notices, permits, receipts. */
export async function loadDocuments(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ documents: [] });
  try {
    const { data, error } = await client
      .from('property_documents')
      .select('*')
      .eq('rental_ref', rentalRef)
      .is('archived_at', null)
      .order('uploaded_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ documents: data || [] });
  } catch (e) { return no('unexpected', e); }
}

export async function addDocument(row, client = supabase) {
  try {
    const uid = await userId(client);
    const { data, error } = await client.from('property_documents')
      .insert({ ...row, uploaded_by: uid }).select().single();
    if (error) return no('insert-failed', error);
    return ok({ document: data });
  } catch (e) { return no('unexpected', e); }
}

/** Correct a document's description, or archive it. The file itself is not replaceable. */
export async function patchDocument(id, patch, client = supabase) {
  if (!id) return no('no-document');
  try {
    const { data, error } = await client.from('property_documents').update(patch).eq('id', id).select().single();
    if (error) return no('update-failed', error);
    return ok({ document: data });
  } catch (e) { return no('unexpected', e); }
}

// ---------------------------------------------------------------------------
// THE MECHANICAL HISTORY (0156). "keeping a mechanical history of the system's
// and issues like all our properties" (Darrell, 2026-08-28) — so these read for
// EVERY door, our own home included. Keyed by rentals.id (uuid), the same key
// property_rooms and property_photos use, never the slug.
// ---------------------------------------------------------------------------

/** The equipment recorded at a door, installed and retired alike. */
export async function loadSystems(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ systems: [] });
  try {
    const { data, error } = await client
      .from('property_systems').select('*').eq('rental_ref', rentalRef).order('kind');
    if (error) return no('read-failed', error);
    return ok({ systems: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Everything that has happened to this door's systems, newest first. */
export async function loadSystemEvents(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ events: [] });
  try {
    const { data, error } = await client
      .from('property_system_events').select('*')
      .eq('rental_ref', rentalRef).order('event_date', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ events: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Add a system. systems.js has already built and validated the row. */
export async function addSystem(row, client = supabase) {
  try {
    const { data, error } = await client.from('property_systems').insert(row).select().single();
    if (error) return no('insert-failed', error);
    return ok({ system: data });
  } catch (e) { return no('unexpected', e); }
}

/** Correct a system, or retire it. There is no delete — its history outlives it. */
export async function patchSystem(id, patch, client = supabase) {
  if (!id) return no('no-system');
  try {
    const { data, error } = await client.from('property_systems')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) return no('update-failed', error);
    return ok({ system: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Record what happened. Append-only by design (0156 grants no UPDATE and no
 * DELETE): an event is a date, and a date is corrected by recording what is
 * true now, the way the rest of this schema treats evidence.
 */
export async function addSystemEvent(row, client = supabase) {
  try {
    const { data, error } = await client.from('property_system_events').insert(row).select().single();
    if (error) return no('insert-failed', error);
    return ok({ event: data });
  } catch (e) { return no('unexpected', e); }
}

/**
 * The LISTING photographs for one advertised unit — the only photos a stranger
 * may ever see. public_vacancy_photos (0154) is SECURITY DEFINER and refuses on
 * its own for a door that is unadvertised or occupied, and it returns only
 * kind='listing': a move-out condition set of somebody's home can never leak
 * through it, whatever this function is asked for. anon holds EXECUTE, so this
 * needs no account — which is the point (Darrell: "without an account!!!").
 */
export async function loadVacancyPhotos(rentalId, client = supabase) {
  if (!rentalId) return ok({ photos: [] });
  try {
    const { data, error } = await client.rpc('public_vacancy_photos', { p_rental: rentalId });
    if (error) {
      const msg = error.message || String(error);
      const reason = /function .*public_vacancy_photos.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return no(reason, error);
    }
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * The street address of the place someone just applied for (0158).
 *
 * Darrell, 2026-08-28: "we may or may not want the addresses to show on the
 * Properties tab until they submit a request for an application to rent then
 * show." This is the "then show".
 *
 * Keyed by the application id, which the applicant receives from their own
 * insert and which nobody can read back out of the table. A wrong or stale id
 * returns nothing rather than an error, so guessing reveals nothing.
 */
export async function loadVacancyAddress(applicationId, client = supabase) {
  if (!applicationId) return ok({ address: null });
  try {
    const { data, error } = await client.rpc('vacancy_address_for_applicant', { p_application: applicationId });
    if (error) {
      const msg = error.message || String(error);
      const reason = /function .*vacancy_address_for_applicant.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return no(reason, error);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return ok({ address: row || null });
  } catch (e) { return no('unexpected', e); }
}
