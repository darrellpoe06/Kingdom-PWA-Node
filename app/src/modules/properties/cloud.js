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

/**
 * The landlord seat this person holds, if any (0207's resolver): the space
 * the properties tab reads, and the proof that "I own properties" is true of
 * them. A failed read is a failure, never "no seat" (DR-0946): the door must
 * not offer a new space to someone whose seat it merely could not read.
 */
export async function loadMyLandlordSeat(client = supabase) {
  try {
    const { data, error } = await client.rpc('my_properties_instance_role');
    if (error) return no('read-failed', error);
    return ok({ seat: data && data.instance_id ? data : null });
  } catch (e) { return no('unexpected', e); }
}

/**
 * A landlord gets their own space, by their own hand (DR-1007, 0287).
 * path: 'properties' (Poe Properties by itself) or 'poetech' (the full app,
 * which also mints the person's family home). Idempotent on the database's
 * side: a seat already held comes back as 'already'.
 */
export async function claimLandlordSpace({ path = 'properties', name = null } = {}, client = supabase) {
  try {
    const { data, error } = await client.rpc('claim_landlord_space', { display_name_in: name || null, path_in: path });
    if (error) return no('rpc-error', error);
    return ok({ receipt: data || {} });
  } catch (e) { return no('unexpected', e); }
}

/** A slug a door can be filed under: r-<the address and unit, compacted>. */
export function doorSlug({ address = '', unit = '' } = {}) {
  const compact = `${address} ${unit}`.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 48);
  return `r-${compact || 'door'}`;
}

/**
 * A new door on the landlord's own space (DR-1007). The first door a new
 * landlord adds is the one that makes the board real; before it, there was
 * no way to make one from the properties door at all. The slug is derived
 * from the address; a second door at the same words gets a numbered one
 * (rentals_instance_slug_uniq). created_by is the signed-in person, as
 * rentals_member_insert requires.
 */
export async function addRental({ instanceId, address, unit = '', city = '', state = '', propertyType = 'single-family', monthlyRent = null, displayName = '' } = {}, client = supabase) {
  if (!instanceId) return no('no-space');
  if (!String(address || '').trim()) return no('no-address');
  try {
    const uid = await userId(client);
    const base = doorSlug({ address, unit });
    const row = {
      instance_id: instanceId, created_by: uid,
      address: String(address).trim(), unit: String(unit || '').trim() || null,
      city: String(city || '').trim() || null, state: String(state || '').trim() || null,
      display_name: String(displayName || '').trim() || `${String(address).trim()}${unit ? ` ${String(unit).trim()}` : ''}`,
      property_type: propertyType, status: 'vacant',
      monthly_rent: Number(monthlyRent) > 0 ? Number(monthlyRent) : null,
    };
    for (let n = 0; n < 5; n += 1) {
      const slug = n === 0 ? base : `${base}-${n + 1}`;
      const { data, error } = await client.from('rentals').insert({ ...row, slug }).select().single();
      if (!error) return ok({ row: data });
      if (String(error.code) !== '23505') return no('write-failed', error);
    }
    return no('slug-taken');
  } catch (e) { return no('unexpected', e); }
}

/** The doors this person can see AT ALL — tenant, family, worker, or manager. */
export async function loadMyDoors(client = supabase) {
  try {
    const { data, error } = await client
      .from('rental_tenancies')
      .select('id, instance_id, rental_ref, property_label, unit_label, tenant_name, tenant_email, tenant_phone, lease_start, lease_end, monthly_rent, deposit, status, camera_grant, camera_grant_note')
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

/**
 * Everything that has ever happened on one door — the whole relationship record.
 *
 * TWO KEYS (0260 / DR-0897). A tenancy's record is keyed by tenancy_id. Work on
 * the DOOR itself (a vacant door, a short stay, the family's own home) has no
 * tenancy and is keyed by rental_id. When both are known the landlord reads
 * both: the job filed between tenants is part of this door's history. RLS keeps
 * the door rows from a tenant (every tenancy arm is false on a NULL tenancy),
 * so asking for them is safe from any seat. Messages, rent and notices exist
 * only through a tenancy and stay empty on a door with none.
 *
 * AND A RECORD THAT COULD NOT BE READ IS NOT AN EMPTY RECORD (DR-0876).
 *
 * Darrell, 2026-10-10, on what this record is FOR: "a place to make sure we
 * have all-in-one information about this place... workers can deduce things
 * from historical data" and "End to end.... historical accuracy and events".
 *
 * This used to write `msg.data || []` five times and return ok() whatever
 * happened, so a failed read, a permission refusal and a door where genuinely
 * nothing occurred all produced one identical answer — an empty array, under a
 * heading reading "Everything that has happened on this door, in order."
 * Somebody concluding "nothing was ever said here" could have been concluding
 * it from a network error. `unreadable` carries the parts that FAILED, so the
 * surface can say so (DR-0076 §8).
 *
 * The quieter half is that RLS does not error — it filters rows and returns an
 * empty set, so a face not permitted to see part of the record cannot learn
 * that here at all. That is answered on the surface instead, from the face
 * itself: see unseenByThisFace() in model.js.
 *
 * The two halves are independent and both are kept: 0260 widened WHICH rows
 * belong to a door; DR-0876 is about whether the answer can be trusted.
 */
export async function loadDoorRecord(tenancyId, { rentalId = null, earlierTenancyIds = [] } = {}, client = supabase) {
  const empty = { requests: [], messages: [], notes: [], docs: [], rent: [], notices: [], unreadable: [] };
  // EVERY TENANCY THE DOOR HAS HAD (DR-1167): the landlord's record of a door
  // is every tenant's, not only the current one's. `earlierTenancyIds` is
  // passed for the landlord's faces only; a tenant's read stays their own, and
  // RLS (0150 + 0306) would withhold the rest from them regardless.
  const ids = [...new Set([tenancyId, ...(earlierTenancyIds || [])].filter(Boolean))];
  if (!ids.length && !rentalId) return ok(empty);
  const byTenancy = (q) => (ids.length === 1 ? q.eq('tenancy_id', ids[0]) : q.in('tenancy_id', ids));
  const scoped = (q) => (ids.length && rentalId
    ? q.or(`tenancy_id.in.(${ids.join(',')}),rental_id.eq.${rentalId}`)
    : ids.length ? byTenancy(q) : q.eq('rental_id', rentalId));
  const none = Promise.resolve({ data: [] });
  try {
    const [req, msg, note, rent, ntc] = await Promise.all([
      scoped(client.from('tenant_maintenance_requests').select('*')).order('created_at', { ascending: true }),
      ids.length ? byTenancy(client.from('tenant_messages').select('*')).order('sent_at', { ascending: true }) : none,
      scoped(client.from('tenancy_notes').select('*')).order('created_at', { ascending: true }),
      // The door keeps its money (0265 / DR-0903): every payment on this door,
      // with a tenant or without, under the reader's own RLS — a tenant still
      // reads only their own; the family reads the door's whole history.
      scoped(client.from('rent_records').select('*')).order('reported_at', { ascending: true }),
      ids.length ? byTenancy(client.from('tenant_notices').select('*')).order('posted_at', { ascending: true }) : none,
    ]);
    const unreadable = [];
    const part = (res, what) => {
      if (res && res.error) { unreadable.push(what); return []; }
      return (res && res.data) || [];
    };
    const requests = part(req, 'work orders');
    // Documentation hangs off the requests we can see.
    let docs = [];
    if (requests.length) {
      // The list never carries a video's bytes (DR-0303 / 0264): has_video
      // says one is there; loadJobVideo fetches it when someone opens it.
      const d = await client.from('request_documentation')
        .select('id, instance_id, request_id, tenancy_id, rental_id, author_user_id, outcome, followup, note, image_data, has_video, created_at')
        .in('request_id', requests.map((r) => r.id)).order('created_at', { ascending: true });
      docs = part(d, 'job documentation');
    }
    return ok({
      requests,
      messages: part(msg, 'messages'),
      notes: part(note, 'notes'),
      rent: part(rent, 'payments'),
      notices: part(ntc, 'notices'),
      docs,
      unreadable,
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
export async function recordRent({ instanceId, tenancyId = null, rentalId = null, paidOn = null, amount, forPeriod, method, memo, status, role, part = null }, client = supabase) {
  try {
    const uid = await userId(client);
    // The part-payment facts (0262 / DR-0899) ride along only when given, so a
    // plain report never names a column a not-yet-migrated database lacks.
    const extra = {};
    if (part) {
      for (const k of ['due_amount', 'remaining_after', 'rest_promised_on', 'reported_on_device_at']) {
        if (part[k] !== null && part[k] !== undefined) extra[k] = part[k];
      }
    }
    // The door and the day the money came (0265) ride along only when given,
    // for the same reason. A payment the family received is confirmed as it
    // is written: they are the ones who would confirm it.
    if (rentalId) extra.rental_id = rentalId;
    if (paidOn) extra.paid_on = paidOn;
    if (status === 'confirmed') extra.confirmed_at = new Date().toISOString();
    const { error } = await client.from('rent_records').insert({
      instance_id: instanceId, tenancy_id: tenancyId || null, reported_by: uid,
      reported_by_role: ['tenant', 'manager', 'landlord'].includes(role) ? role : 'tenant',
      amount, for_period: forPeriod || null, method: method || 'other', memo: memo || null,
      status: status || 'reported', money_moved_in_app: false, ...extra,
    });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/**
 * What every door this person can see has brought in, month by month
 * (door_money_months, 0265). No instance filter, as everywhere here: the view
 * runs under the reader's RLS, so it returns exactly the money they may see.
 */
export async function loadDoorMoney(client = supabase) {
  try {
    const { data, error } = await client.from('door_money_months').select('*');
    if (error) return no('read-failed', error);
    return ok({ months: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * How this landlord is paid, as the family reads and writes it (0262). Like
 * every read in this module it carries NO instance filter: RLS returns only
 * the payee rows of instances this person belongs to, and the door's own
 * instance is picked from those.
 */
export async function loadRentPayee(instanceId, client = supabase) {
  if (!instanceId) return ok({ payee: null });
  try {
    const { data, error } = await client.from('rent_payee').select('*');
    if (error) return no('read-failed', error);
    return ok({ payee: (data || []).find((r) => r.instance_id === instanceId) || null });
  } catch (e) { return no('unexpected', e); }
}

/** Save how this landlord is paid. Blank lines are stored as none. */
export async function saveRentPayee(instanceId, fields, client = supabase) {
  try {
    const uid = await userId(client);
    const clean = (v) => (String(v ?? '').trim() || null);
    const row = {
      instance_id: instanceId,
      cashtag: clean(fields.cashtag) && `$${clean(fields.cashtag).replace(/^\$/, '')}`,
      venmo: clean(fields.venmo), zelle_to: clean(fields.zelle_to), cash_note: clean(fields.cash_note),
      deposit_note: clean(fields.deposit_note), check_payable_to: clean(fields.check_payable_to),
      square_link: clean(fields.square_link),
      updated_by: uid, updated_at: new Date().toISOString(),
    };
    const { error } = await client.from('rent_payee').upsert(row, { onConflict: 'instance_id' });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** How to pay, as a tenant or household member of this door reads it. */
export async function loadPayeeForTenancy(tenancyId, client = supabase) {
  if (!tenancyId) return ok({ payee: null });
  try {
    const { data, error } = await client.rpc('rent_payee_for_tenancy', { p_tenancy: tenancyId });
    if (error) return no('read-failed', error);
    return ok({ payee: (Array.isArray(data) ? data[0] : data) || null });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Every change to these rent records and work orders, to the instant, oldest
 * first (door_events, 0262). RLS returns exactly the events of the records
 * this person can already read.
 */
export async function loadRecordEvents(subjectIds = [], client = supabase) {
  const ids = [...new Set((subjectIds || []).filter(Boolean))];
  if (!ids.length) return ok({ events: [] });
  try {
    const { data, error } = await client.from('door_events').select('*').in('subject_id', ids).order('at', { ascending: true });
    return error ? no('read-failed', error) : ok({ events: data || [] });
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

// ---------------------------------------------------------------------------
// THE LIST CARRIES NO PICTURES AT ALL — NOT EVEN SMALL ONES (DR-0955).
// ---------------------------------------------------------------------------
// 0185 / DR-0303 got half of this right and the half it got wrong is what froze
// the Properties tab. storage_path holds the whole compressed image as a data
// URL, so it was taken out of every list; a list read thumb_path instead. But
// THUMB_PATH IS ALSO AN IMAGE — the same base64 data URL, written at upload
// 640 px wide at 75% JPEG (DoorTabs THUMB_MAX_WIDTH / THUMB_QUALITY).
//
// MEASURED 2026-10-11, encoding photographic content at exactly those
// settings: 47 KB of base64 for a smooth interior, 60 KB for an ordinary
// detailed one. Call it 55 KB A ROW. loadAllPhotos reads every unarchived
// picture across every door on every boot of the tab, to choose one cover per
// door; his board holds 67 rows today, which is ~3.6 MB in one response, and
// it grows by 55 KB every time he takes a photograph. A single door's gallery
// is the same shape smaller: Room 1 - Bed A carries 39 pictures, ~2.1 MB.
//
// With Pages Functions dark (#2057) the app is on the ABSOLUTE Funnel URL,
// which CLAUDE.md's own standing note says throttles cross-origin. Small reads
// pass. Multi-megabyte ones do not, and boundedRead gives up at 6 s — so the
// tab froze, then came back without the pictures. "It keeps flashing... and
// pausing the coming back with new images about 20 seconds later" is that
// read, arriving after the UI stopped waiting for it.
//
// SO THE LIST IS METADATA, FULL STOP. No storage_path, no thumb_path: 67 rows
// of ids, kinds, captions and timestamps is tens of kilobytes and the board
// opens at once. pickCovers already chose covers from metadata alone, and
// SharpPicture already fetched full images by id, a few at a time, when a tile
// was on screen and wanted more pixels. Thumbnails now ride that same road,
// which is the road that works. The column list is a named constant so a test
// can pin exactly what goes over the wire.
export const PHOTO_LIST_COLUMNS = [
  'id', 'instance_id', 'rental_ref', 'tenancy_id', 'room_id', 'request_id',
  'kind', 'caption', 'taken_at', 'uploaded_at', 'uploaded_by',
  'author_label', 'archived_at', 'archived_by', 'sort_order',
  // DR-0932 (0267): which system, and which service visit, a picture shows.
  'system_id', 'system_event_id',
].join(', ');

/** The most full images one call may carry. A door's gallery opens one at a time. */
export const PHOTO_IMAGE_BATCH = 24;

/**
 * The thumbnail for a few pictures, by id — the ONLY read of thumb_path in
 * this module, and bounded for the same reason loadPhotoImages is: so no
 * caller can quietly reassemble the unbounded list that froze the tab.
 *
 * Smaller than the batch for full images on purpose. A thumbnail is ~55 KB of
 * base64; twelve is ~660 KB, which is about as much as the Funnel road will
 * carry in one answer while the page still feels alive.
 */
export const PHOTO_THUMB_BATCH = 12;

export async function loadPhotoThumbs(ids = [], client = supabase) {
  const want = Array.from(new Set((ids || []).filter(Boolean)));
  if (!want.length) return ok({ thumbs: {} });
  if (want.length > PHOTO_THUMB_BATCH) return no('too-many-at-once');
  try {
    const { data, error } = await client
      .from('property_photos').select('id, thumb_path').in('id', want);
    if (error) return no('read-failed', error);
    const thumbs = {};
    // A row from before 0185 has no thumbnail. It is left OUT rather than
    // recorded as empty, so the caller can tell "no thumbnail exists" from
    // "I did not ask" and fall through to the full image (DR-0946).
    for (const row of data || []) if (row.thumb_path) thumbs[row.id] = row.thumb_path;
    return ok({ thumbs });
  } catch (e) { return no('unexpected', e); }
}

/**
 * The full image for a few pictures, by id — the ONLY read of storage_path in
 * this module. Bounded: more ids than the batch are refused, not silently
 * truncated, so a caller cannot rebuild the unbounded list by accident.
 */
export async function loadPhotoImages(ids = [], client = supabase) {
  const want = Array.from(new Set((ids || []).filter(Boolean)));
  if (!want.length) return ok({ images: {} });
  if (want.length > PHOTO_IMAGE_BATCH) return no('too-many-at-once');
  try {
    const { data, error } = await client
      .from('property_photos').select('id, storage_path').in('id', want);
    if (error) return no('read-failed', error);
    const images = {};
    for (const row of data || []) images[row.id] = row.storage_path;
    return ok({ images });
  } catch (e) { return no('unexpected', e); }
}

// hydrateLegacyImages IS GONE (DR-0955), and removing it is part of the fix
// rather than tidying after it.
//
// It existed to give the pre-0185 rows — the ones with no thumbnail — their
// full image in one bounded read at boot, and it told them apart by asking
// `!p.thumb_path`. With thumb_path out of the list that question has no
// answer: EVERY row looks legacy, so it would have fetched twenty-four FULL
// images (~300 KB each, ~7 MB) on every boot. The same defect, eight times
// heavier.
//
// What it was protecting is still protected, and now lazily: a tile with
// nothing to draw asks for its own thumbnail when it comes on screen, and a
// row that turns out to have none asks for its full image instead
// (SharpPicture). An older gallery still fills in; it no longer makes the
// whole tab wait to find out.

/**
 * The door's photos. RLS decides what comes back — a tenant sees only their own
 * tenancy's, and never the door-level turn between households.
 */
/**
 * Which NAS pictures this door has already filed: {source: photo id} (DR-1002).
 * Its OWN read, never a column on the list read: the column lands with
 * db-migrate while the deploy is already serving, and a list read that named
 * it would fail for every door until then (DR-0935). A failed read is
 * "unknown", not "none" -- the shelf then offers every picture and lets the
 * database refuse the second copy (0285).
 */
export async function loadDoorPhotoSources(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ sources: {} });
  try {
    const { data, error } = await client
      .from('property_photos').select('id, source').eq('rental_ref', rentalRef).not('source', 'is', null);
    if (error) return no('read-failed', error);
    const sources = {};
    for (const row of data || []) if (row && row.source) sources[row.source] = row.id;
    return ok({ sources });
  } catch (e) { return no('unexpected', e); }
}

export async function loadDoorPhotos(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ photos: [] });
  try {
    const { data, error } = await client
      .from('property_photos').select(PHOTO_LIST_COLUMNS).eq('rental_ref', rentalRef)
      // The landlord's arrangement first (0160), newest as the tie-break for
      // pictures he has not placed. photo-order.js reproduces this exactly so a
      // reload cannot reorder what a nudge just moved.
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('taken_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}


// ---------------------------------------------------------------------------
// SAME APARTMENT NUMBER, SAME PLACE (DR-0967)
// ---------------------------------------------------------------------------
// Darrell, 2026-10-11: "If it has the same apt number its the same location...
// can we make sure this happens each time we co-live a place?!!!!!!!!"
//
// The first version compared `address` and `unit` as exact strings, and his
// own doors break it: Bed B carries `805 North Prospect Avenue Apt 4` / `Apt 4`
// while Apt 2 carries `805 North Prospect Avenue` / `Apt 2`. The unit got typed
// into the address on one door and not another, which is what anybody does
// entering a co-living building by hand, and exact equality then says two beds
// in one apartment are two different buildings.
//
// So the street is compared with the unit FOLDED OUT of it, and the unit is
// compared by its NUMBER. `Apt 4`, `apt. 4`, `#4`, `Unit 4` and `4` are one
// apartment, because to the person standing in it they are.
//
// Deliberately NOT a fuzzy address match. `805 North Prospect Ave` and
// `805 N Prospect Avenue` still read as different streets: guessing that two
// addresses are "probably" the same is how one family's pictures end up
// advertising another family's door. The unit is normalised; the street is
// only cleaned.
export { unitKey, streetKey, sameApartment } from './apartment.js';
import { sameApartment } from './apartment.js';

/**
 * The pictures of the OTHER doors in the same apartment (DR-0963).
 *
 * Darrell, 2026-10-11, standing on "805 North Prospect Avenue Room 1 - Bed B"
 * reading "PICTURES (0) — No pictures on this property yet":
 *
 *   "Same options as the other co-living tenant... pictures are already
 *    available for this place apartment 4... remember?"
 *   "Where are the images... they should be able to be used here too!!!!!!!"
 *
 * He is right, and I had built only half of it. DR-0952 / 0273 taught the
 * STRANGER'S road to borrow — `public_vacancy_photos` falls back to a sibling
 * listing, so the public card for Bed B shows the apartment. It never touched
 * the LANDLORD'S gallery, which is the screen he is standing on: that calls
 * `loadDoorPhotos` for ONE door, and Bed B has none of its own.
 *
 * So a stranger could see Apartment 4's kitchen and the man who owns it could
 * not. The borrowing worked for everyone except the person with the camera.
 *
 * WHAT MAKES TWO DOORS THE SAME APARTMENT: same instance, same `address`,
 * same `unit`. Bed A and Bed B are both `805 North Prospect Avenue` / `Apt 4`.
 * Both fields are already on the rental row, so this needs no migration.
 *
 * NOTHING NEW IS PUBLISHED. Every row returns through the reader's own RLS on
 * property_photos, exactly as their own door's do — a person who may not see
 * the sibling door gets [] from the DATABASE, not from a decision in this
 * file. 0273's borrowing had to be SECURITY DEFINER because its reader is a
 * stranger with no account at all; this reader is the landlord, who already
 * holds the rows.
 *
 * KEYED ON THE DOOR'S id, AND I HAD THIS BACKWARDS ONCE (DR-0967). The
 * column is called `rental_ref`, and `loadDoorPhotos`'s parameter is called
 * `rentalRef`, so the first version of this function fed it SLUGS and the
 * comment here congratulated itself for catching a bug it had just written.
 * The column holds the rental's UUID: `PropertiesApp` calls
 * `loadDoorPhotos(rentalId)`, and `apt2-photos-probe.yml` joins
 * `r.id = p.rental_ref`. Slugs matched zero rows, every time, silently — the
 * card simply never appeared, which is the quietest kind of wrong and exactly
 * what I claimed to be avoiding.
 *
 * Metadata only, like every list since DR-0955.
 */
export async function loadSiblingPhotos(rentalId, client = supabase) {
  if (!rentalId) return ok({ photos: [], siblings: [] });
  try {
    const { data: me, error: meErr } = await client
      .from('rentals').select('id, slug, instance_id, address, unit').eq('id', rentalId).single();
    if (meErr) return no('read-failed', meErr);
    // NO UNIT MEANS THIS IS THE WHOLE PLACE, not one door inside it. A house
    // with no unit must never borrow from the next house at the same address,
    // and 0273 draws the same line on the public side ("never for a whole
    // unit"). The two halves agree on purpose.
    if (!me || !me.address || !me.unit) return ok({ photos: [], siblings: [] });

    // THE QUERY DOES NOT SCOPE BY THE CALLER'S TENANCY, and that is a rule
    // this file keeps on purpose; `properties-door.test.js` fails the build
    // on any such filter here. (Its check is a source scan, so it reads this
    // comment too — which is why the forbidden call is described in words
    // rather than written out.)
    // This module is mounted by BOTH the PoeTech app and the standalone
    // Poe Properties door, and a client-side instance filter is what would
    // stop a non-member using the second. RLS decides what comes back; the
    // client never scopes a read by the caller's tenancy.
    //
    // The same-instance rule still holds, as a CORRECTNESS refinement applied
    // to rows already returned, not as the wall: a person who is a member of
    // two instances that each happen to hold a "805 North Prospect Avenue /
    // Apt 4" must not have one borrow from the other. 0273 draws the same
    // line ("never across instances") on the public side.
    const { data: sibs, error: sibErr } = await client
      .from('rentals').select('id, slug, display_name, instance_id, address, unit');
    if (sibErr) return no('read-failed', sibErr);
    const mine = (sibs || []).filter((r) => (
      r.id !== rentalId
      && r.instance_id === me.instance_id
      && sameApartment(r, me)
    ));
    const refs = mine.map((r) => r.id).filter(Boolean);
    if (!refs.length) return ok({ photos: [], siblings: [] });

    const { data, error } = await client
      .from('property_photos').select(PHOTO_LIST_COLUMNS)
      .in('rental_ref', refs)
      .is('archived_at', null)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('taken_at', { ascending: false });
    if (error) return no('read-failed', error);
    // THIS DOOR'S OWN ORDER of what it borrows (DR-0984, 0282). A failed read
    // here is not a reason to hide the pictures: they come back in the owning
    // door's order and say so, never as "none".
    const { data: placed, error: placedErr } = await client
      .from('door_photo_order').select('photo_id, position').eq('rental_id', rentalId);
    const order = {};
    for (const row of placed || []) order[row.photo_id] = row.position;
    return ok({ photos: data || [], siblings: mine, order, orderUnread: Boolean(placedErr) });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Save THIS door's order of the pictures it borrows from the rest of its
 * apartment (DR-0984). `patches` is what photo-order.js's movePhoto/makeCover
 * return ([{id, patch: {sort_order}}]); each becomes this door's position for
 * that picture. The picture itself is never touched -- Bed A keeps its own
 * order and cover while Bed B leads with the bedroom. The database refuses a
 * picture that is not in this door's apartment (0282's trigger) and anyone
 * who is not the family (RLS).
 */
export async function saveDoorPhotoOrder(rentalId, instanceId, patches = [], client = supabase) {
  const rows = (Array.isArray(patches) ? patches : [])
    .filter((x) => x && x.id && Number.isFinite(Number(x.patch?.sort_order)))
    .map((x) => ({ rental_id: rentalId, photo_id: x.id, instance_id: instanceId, position: Math.round(Number(x.patch.sort_order)) }));
  if (!rentalId || !instanceId) return no('no-door');
  if (!rows.length) return ok({ saved: 0 });
  try {
    const { error } = await client.from('door_photo_order').upsert(rows, { onConflict: 'rental_id,photo_id' });
    if (error) return no('write-failed', error);
    return ok({ saved: rows.length });
  } catch (e) { return no('unexpected', e); }
}

/** Every door's own order of borrowed pictures the family may read: {rental_id: {photo_id: position}}. */
export async function loadDoorPhotoOrders(client = supabase) {
  try {
    const { data, error } = await client.from('door_photo_order').select('rental_id, photo_id, position');
    if (error) return no('read-failed', error);
    const orders = {};
    for (const row of data || []) (orders[row.rental_id] ||= {})[row.photo_id] = row.position;
    return ok({ orders });
  } catch (e) { return no('unexpected', e); }
}

/**
 * How a GUEST pays for nights on a listed door: the family's Square payment
 * link and the nightly rate (0277, DR-0960).
 *
 * Darrell, 2026-10-11: "If they pay!!!" and "Square payment options!!!" and
 * then, on the shape of it: "This can't be member scoped... we will need to be
 * able to receive funds from everyone..." — so the RPC is granted to anon AND
 * authenticated, and rent_payee itself stays member-only. Anybody may pay;
 * nobody may read the rest of the family's payment details.
 */
export async function loadStayPayment(rentalId, client = supabase) {
  if (!rentalId) return no('no-rental');
  try {
    const { data, error } = await client.rpc('public_stay_payment', { p_rental: rentalId });
    if (error) return no('read-failed', error);
    const row = Array.isArray(data) ? data[0] : data;
    return ok({ squareLink: (row && row.square_link) || null, nightlyRate: (row && row.nightly_rate) ?? null });
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
// THE COLUMNS THE BOARD READS, and the ones it can live without for a while.
// A column a NEW migration adds is read only when the database already has it
// (DR-1199): the app deploys on merge and the migration applies on its own
// lane, so for a few minutes -- or for good, on a database a migration has not
// reached -- the app asks for a column that does not exist. PostgREST then
// refuses the WHOLE read, and the Properties tab says it could not be reached:
// the door-journeys leg caught exactly that on 2026-10-21 (0309's
// pictures_shared_with_door, missing from the e2e chain). So a missing
// OPTIONAL column is dropped and the read asked again; the board loses only
// that column's word, never the doors.
export const RENTAL_COLUMNS = 'id, slug, instance_id, address, unit, city, state, status, monthly_rent, tenant_name, display_name, property_type, rentable_level, listed_at, listed_rent, listed_note, notes, showcase_order, address_visibility';
export const RENTAL_OPTIONAL_COLUMNS = Object.freeze(['pictures_shared_with_door']);

/** The optional columns a PostgREST error says do not exist, or []. */
export function missingOptionalColumns(error, optional = RENTAL_OPTIONAL_COLUMNS) {
  const msg = String((error && (error.message || error.details || error.hint)) || '');
  if (!/does not exist|could not find|schema cache/i.test(msg)) return [];
  return optional.filter((c) => msg.includes(c));
}

export async function loadMyRentals(client = supabase) {
  try {
    let optional = [...RENTAL_OPTIONAL_COLUMNS];
    for (let attempt = 0; attempt <= RENTAL_OPTIONAL_COLUMNS.length; attempt += 1) {
      const cols = [RENTAL_COLUMNS, ...optional].join(', ');
      const { data, error } = await client
        .from('rentals')
        // showcase_order MUST be here (RENTAL_COLUMNS): the board sorts by
        // shelfOrder(rentals), so without it every door reads as unplaced and
        // "Show first" writes to a column the reloaded board never sees -- the
        // door never moves (the bug Darrell hit 2026-08-28). The DB order is a
        // stable fallback only.
        .select(cols)
        .order('showcase_order', { ascending: true, nullsFirst: false })
        .order('address', { ascending: true });
      if (!error) return ok({ rentals: data || [], missingColumns: RENTAL_OPTIONAL_COLUMNS.filter((c) => !optional.includes(c)) });
      const gone = missingOptionalColumns(error, optional);
      if (!gone.length) return no('read-failed', error);
      optional = optional.filter((c) => !gone.includes(c));
    }
    return no('read-failed', { message: 'the rentals read kept refusing its optional columns' });
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

/**
 * A door's area on the map and its nearby lines (0270), read on their own so
 * the main rentals read never names a column a database without 0270 lacks
 * (deploy and db-migrate run side by side). Only the rounded area exists to read.
 */
export async function loadDoorArea(id, client = supabase) {
  if (!id) return no('no-rental');
  try {
    const { data, error } = await client.from('rentals').select('area_lat, area_lng, nearby').eq('id', id).single();
    if (error) return no('read-failed', error);
    const has = data && data.area_lat != null && data.area_lng != null;
    return ok({ area: has ? { lat: Number(data.area_lat), lng: Number(data.area_lng) } : null, nearby: (data && data.nearby) || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Which of this person's doors are already on the map (DR-0998): one read, the
 * ids that carry a rounded area. RLS scopes it to the doors they can see.
 */
export async function loadDoorAreas(client = supabase) {
  try {
    const { data, error } = await client.from('rentals').select('id, area_lat, area_lng');
    if (error) return no('read-failed', error);
    const rows = (data || []).filter((r) => r.area_lat != null && r.area_lng != null);
    return ok({
      placed: new Set(rows.map((r) => r.id)),
      // The rounded areas themselves, by door, so the Real Estate card can show
      // the same map Poe Properties shows (DR-0999). Never an exact point.
      areas: Object.fromEntries(rows.map((r) => [r.id, { lat: Number(r.area_lat), lng: Number(r.area_lng) }])),
    });
  } catch (e) { return no('unexpected', e); }
}

/**
 * Each door's picture archive on the NAS and when its address was last held
 * in its parts (0284, DR-0999). Its OWN read, as the areas are: the columns
 * arrive by db-migrate beside the deploy, and a column the database does not
 * yet have must not cost the main rentals read. {channels: {id: name},
 * heldAt: {id: iso}}.
 */
export async function loadDoorArchives(client = supabase) {
  try {
    const { data, error } = await client.from('rentals').select('id, photo_channel, address_held_at');
    if (error) return no('read-failed', error);
    const channels = {}; const heldAt = {};
    for (const r of data || []) {
      if (r.photo_channel) channels[r.id] = r.photo_channel;
      if (r.address_held_at) heldAt[r.id] = r.address_held_at;
    }
    return ok({ channels, heldAt });
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
      const line = `[${stamp}] Edited — ${summary}`;
      // Don't stack: a repeated same-day, same-summary edit (e.g. a run of
      // showcase-order nudges) must not append the identical audit line again.
      const notes = (cur?.notes || '').trimEnd();
      body.notes = notes.endsWith(line) ? notes : `${notes}\n${line}`.trim();
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
      .select(PHOTO_LIST_COLUMNS)
      .is('archived_at', null)
      // sort_order so the board's cover is the picture the landlord placed
      // first, not merely the newest (0160). taken_at breaks a tie.
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('taken_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** File a photo against a door (and optionally a room / tenancy). */
/**
 * A WRITE THAT NEVER ANSWERS IS NOT A WRITE (DR-0908). Darrell, 2026-10-10,
 * uploading fourteen move-out photographs on build 21F4C39: "After trying to
 * upload it did not work.... pictures looked like they would upload and never
 * did".
 *
 * Nothing in this file had a deadline. Reads got one long ago (boundedRead in
 * PropertiesApp), because a slow read leaves a spinner; a slow WRITE was left
 * to the network, on the assumption it would either land or error. It does
 * neither here.
 *
 * WHY IT HANGS, measured 2026-10-10: the Pages Functions outage (#2057) means
 * the same-origin /sb road is dead, so the deploy points the client at the
 * ABSOLUTE Funnel URL (deploy-cloudflare-pages.yml:147). CLAUDE.md's own
 * standing note says why that is a stopgap and not a home: the app must reach
 * the NAS same-origin, "never the absolute Funnel URL (it throttles
 * cross-origin)". Small reads get through. Fourteen cross-origin POSTs each
 * carrying a ~300KB base64 data URL do not — they stall, and with no deadline
 * the promise simply never settles. The button sat at "Saving 1 of 14" and the
 * pictures looked like they were going somewhere.
 *
 * A deadline cannot make the write succeed. It makes the failure VISIBLE and
 * the picture RECOVERABLE, which is the difference between a stall and a loss.
 */
export const WRITE_DEADLINE_MS = 45000;

export function withDeadline(promise, ms = WRITE_DEADLINE_MS, label = 'the server') {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not answer in ${Math.round(ms / 1000)}s`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => { if (timer) clearTimeout(timer); });
}

export async function addPhoto(row, client = supabase, { deadlineMs = WRITE_DEADLINE_MS } = {}) {
  try {
    const uid = await userId(client);
    const { data, error } = await withDeadline(
      client.from('property_photos').insert({ ...row, uploaded_by: uid }).select().single(),
      deadlineMs,
      'the picture server',
    );
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
    // THE LIST NEVER CARRIES THE BYTES (DR-1016; 0290). Darrell, 2026-10-14:
    // "It takes about 10 - 20 seconds to populate". public_vacancy_photos
    // returned every picture's whole data URL -- 37 full images for one card.
    // The list is now ids, captions and whether a thumbnail exists; a card
    // asks loadVacancyPicture for ONE picture at a time.
    const { data, error } = await client.rpc('public_vacancy_photo_list', { p_rental: rentalId });
    if (error) {
      const msg = error.message || String(error);
      const reason = /function .*public_vacancy_photo_list.* does not exist/i.test(msg) ? 'not-enabled-yet' : 'rpc-error';
      return no(reason, error);
    }
    return ok({ photos: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/**
 * ONE listing picture's bytes, for the open shelf (DR-1016; 0290): the
 * thumbnail ('thumb', the default; the full image when the upload wrote no
 * thumbnail) or the full image ('full'), only while that picture is in the
 * unit's showable set. A picture that is not answers null, never an error.
 */
export async function loadVacancyPicture(rentalId, photoId, size = 'thumb', client = supabase) {
  if (!rentalId || !photoId) return ok({ src: null });
  try {
    const { data, error } = await client.rpc('public_vacancy_picture', { p_rental: rentalId, p_id: photoId, p_size: size === 'full' ? 'full' : 'thumb' });
    if (error) return no('rpc-error', error);
    return ok({ src: typeof data === 'string' && data ? data : null });
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

// ---------------------------------------------------------------------------
// THE GUEST CARD (DR-0898, 0261). A guest inside a door reports a problem with
// no account. The family opens, replaces and closes the card's key; the guest
// sees only which door it is and can file one report at a time. Every wall is
// in the database; these are thin, never-throwing calls.
// ---------------------------------------------------------------------------

/** The live key on a door, or null. Only the family can read it (RLS). */
export async function loadGuestLink(rentalId, client = supabase) {
  if (!rentalId) return ok({ token: null });
  try {
    const { data, error } = await client.from('door_guest_links').select('token, created_at').eq('rental_id', rentalId).maybeSingle();
    if (error) return no('read-failed', error);
    return ok({ token: data?.token || null, since: data?.created_at || null });
  } catch (e) { return no('unexpected', e); }
}

/** Open a door's card, or replace it (the old card stops working). */
export async function openGuestLink(rentalId, client = supabase) {
  try {
    const { data, error } = await client.rpc('door_guest_link_open', { p_rental: rentalId });
    return error ? no('write-failed', error) : ok({ token: data || null });
  } catch (e) { return no('unexpected', e); }
}

/** Close a door's card. Every printed copy stops working. */
export async function closeGuestLink(rentalId, client = supabase) {
  try {
    const { error } = await client.rpc('door_guest_link_close', { p_rental: rentalId });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** Which door a guest's card names. Label and unit only; empty for a dead card. */
export async function loadGuestDoor(token, client = supabase) {
  try {
    const { data, error } = await client.rpc('guest_report_door', { p_token: token });
    if (error) return no('read-failed', error);
    const row = Array.isArray(data) ? data[0] : data;
    return ok({ door: row ? { label: row.label, unit: row.unit || null } : null });
  } catch (e) { return no('unexpected', e); }
}

/** File the guest's report. The database's refusal is passed through in its own words. */
export async function submitGuestReport({ token, title, detail, name, contact, urgent }, client = supabase) {
  try {
    const { error } = await client.rpc('guest_report_problem', {
      p_token: token, p_title: String(title || '').trim(), p_detail: String(detail || '').trim() || null,
      p_name: String(name || '').trim() || null, p_contact: String(contact || '').trim() || null, p_urgent: Boolean(urgent),
    });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

// ---------------------------------------------------------------------------
// SIGNING (DR-0936, 0263). Documents are filed where they belong (a door, or a
// tenancy's papers); the family asks for signatures; each signer signs the
// fingerprint of the exact bytes their screen showed. Every wall is in the
// database; these are thin, never-throwing calls.
// ---------------------------------------------------------------------------

/**
 * Every live paper on a door: the door's own and every tenancy's on it (a
 * tenant's upload carries only its tenancy). RLS decides what this seat reads.
 */
export async function loadDoorPapers({ rentalId = null, tenancyIds = [] } = {}, client = supabase) {
  const ids = (tenancyIds || []).filter(Boolean);
  if (!rentalId && !ids.length) return ok({ documents: [] });
  try {
    let q = client.from('property_documents').select('*').is('archived_at', null);
    if (rentalId && ids.length) q = q.or(`rental_ref.eq.${rentalId},tenancy_id.in.(${ids.join(',')})`);
    else if (rentalId) q = q.eq('rental_ref', rentalId);
    else q = q.in('tenancy_id', ids);
    const { data, error } = await q.order('uploaded_at', { ascending: false });
    return error ? no('read-failed', error) : ok({ documents: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** The signatures on these documents, oldest first. */
export async function loadSignatures(documentIds = [], client = supabase) {
  const ids = [...new Set((documentIds || []).filter(Boolean))];
  if (!ids.length) return ok({ signatures: [] });
  try {
    const { data, error } = await client.from('property_document_signatures').select('*').in('document_id', ids).order('signed_at', { ascending: true });
    return error ? no('read-failed', error) : ok({ signatures: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Ask for signatures. The database's refusal comes back in its own words. */
export async function requestSignatures(documentId, signers, counselReviewed = false, client = supabase) {
  try {
    const { data, error } = await client.rpc('property_document_request_signatures', {
      p_doc: documentId, p_signers: signers, p_counsel_reviewed: Boolean(counselReviewed),
    });
    return error ? no(error.message || 'write-failed', error) : ok({ version: data });
  } catch (e) { return no('unexpected', e); }
}

/** Sign as 'tenant' or 'landlord' with the fingerprint of what was shown. */
export async function signDocument({ documentId, role, signature, version, attestation, consent, deviceAt }, client = supabase) {
  try {
    const { data, error } = await client.rpc('property_document_sign', {
      p_doc: documentId, p_role: role, p_signature: String(signature || '').trim(), p_doc_version: version,
      p_attestation: attestation, p_consent: consent, p_device_at: deviceAt || null,
    });
    return error ? no(error.message || 'write-failed', error) : ok({ state: data });
  } catch (e) { return no('unexpected', e); }
}

/** One job video's bytes, fetched only when someone opens it (0264). */
export async function loadJobVideo(docId, client = supabase) {
  try {
    const { data, error } = await client.from('request_documentation').select('video_data').eq('id', docId).maybeSingle();
    return error ? no('read-failed', error) : ok({ video: data?.video_data || null });
  } catch (e) { return no('unexpected', e); }
}

/** The family sets what proof a job needs before it is done and paid (0264). */
export async function setWorkOrderProof(id, { proofRequired = 'none', proofNote = null } = {}, client = supabase) {
  try {
    const { error } = await client.from('tenant_maintenance_requests')
      .update({ proof_required: proofRequired, proof_note: (String(proofNote || '').trim() || null) }).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

// =============================================================================
// A door's cameras, asked for and given (DR-0938, 0266). The menu is what the
// family offers on a door (names only); the access rows are who asked for or
// was given which cameras, who decided, until when. RLS: anyone on the door
// reads the menu; each person reads their own rows; the family reads and
// decides all of them. The NAS mints and enforces the grant itself (DR-0778).
// =============================================================================
export async function loadCameraMenu(rentalId, client = supabase) {
  if (!rentalId) return ok({ menu: [] });
  try {
    const { data, error } = await client.from('door_camera_menu').select('camera_id, camera_name').eq('rental_id', rentalId).order('camera_name', { ascending: true });
    if (error) return no('read-failed', error);
    return ok({ menu: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Replace what a door offers: the family ticks the cameras people may ask for. */
export async function saveCameraMenu({ instanceId, rentalId, cameras = [] }, client = supabase) {
  if (!instanceId || !rentalId) return no('no-door');
  try {
    const keep = cameras.map((c) => c.id);
    const del = client.from('door_camera_menu').delete().eq('rental_id', rentalId);
    const { error: e1 } = keep.length ? await del.not('camera_id', 'in', `(${keep.map((k) => `"${String(k).replace(/"/g, '')}"`).join(',')})`) : await del;
    if (e1) return no('write-failed', e1);
    if (!keep.length) return ok();
    const { error: e2 } = await client.from('door_camera_menu').upsert(
      cameras.map((c) => ({ instance_id: instanceId, rental_id: rentalId, camera_id: c.id, camera_name: c.name || c.id })),
      { onConflict: 'rental_id,camera_id', ignoreDuplicates: false },
    );
    return e2 ? no('write-failed', e2) : ok();
  } catch (e) { return no('unexpected', e); }
}

export async function loadCameraAccess(rentalId, client = supabase) {
  if (!rentalId) return ok({ rows: [] });
  try {
    const { data, error } = await client.from('door_camera_access').select('*').eq('rental_id', rentalId).order('created_at', { ascending: false });
    if (error) return no('read-failed', error);
    return ok({ rows: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** A person on the door asks. Their role is stamped by the database, not here. */
export async function askForCameras({ instanceId, rentalId, cameras, reason, label }, client = supabase) {
  try {
    const uid = await userId(client);
    if (!uid) return no('not-signed-in');
    const { error } = await client.from('door_camera_access').insert({
      instance_id: instanceId, rental_id: rentalId, kind: 'request', person_user_id: uid, person_role: 'other',
      person_label: String(label || '').trim() || 'Someone on this door', cameras, reason: String(reason || '').trim() || null,
    });
    return error ? no(error.code === '23505' ? 'already-asked' : 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** The family decides: granted (with the NAS grant), declined, or revoked. */
export async function decideCameraAccess(id, patch, client = supabase) {
  try {
    const { error } = await client.from('door_camera_access').update(patch).eq('id', id);
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** The family gives access outright: a person with an account, or by link. */
export async function giveCameraAccess(row, client = supabase) {
  try {
    const { error } = await client.from('door_camera_access').insert({ ...row, kind: 'given', status: 'granted' });
    return error ? no('write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** The door of a tenancy this person is on (0266), for a face that cannot read rentals. */
export async function doorOfMyTenancy(tenancyId, client = supabase) {
  if (!tenancyId) return ok({ rentalId: null });
  try {
    const { data, error } = await client.rpc('door_of_my_tenancy', { p_tenancy: tenancyId });
    if (error) return no('read-failed', error);
    return ok({ rentalId: data || null });
  } catch (e) { return no('unexpected', e); }
}

// =============================================================================
// A short-stay door's calendar (DR-0930, 0269). The public reads taken ranges
// only (door_booked_nights); a guest asks through request_a_stay(); the family
// reads, blocks, confirms and declines; a signed-in guest reads their own.
// =============================================================================
export async function loadBookedNights(rentalId, from, to, client = supabase) {
  if (!rentalId) return ok({ ranges: [] });
  try {
    const { data, error } = await client.rpc('door_booked_nights', { p_rental: rentalId, p_from: from, p_to: to });
    if (error) return no('read-failed', error);
    return ok({ ranges: data || [] });
  } catch (e) { return no('unexpected', e); }
}

export async function requestAStay(a, client = supabase) {
  try {
    const { data, error } = await client.rpc('request_a_stay', {
      p_rental: a.rentalId, p_in: a.checkIn, p_out: a.checkOut, p_name: a.name, p_phone: a.phone || null,
      p_email: a.email || null, p_guests: Number(a.guests) || 1, p_note: a.note || null,
      p_21_plus: !!a.is21, p_house_rules: !!a.rules, p_wishes: a.wishes || null, p_offers_by_email: !!a.offers,
    });
    if (error) return no(error.message || 'write-failed', error);
    return ok({ id: data });
  } catch (e) { return no('unexpected', e); }
}

export async function loadDoorStays(rentalId, client = supabase) {
  if (!rentalId) return ok({ rows: [] });
  try {
    const { data, error } = await client.from('door_stays').select('*').eq('rental_id', rentalId).order('check_in', { ascending: true });
    if (error) return no('read-failed', error);
    return ok({ rows: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** The family writes on the calendar: a blackout, or a stay it enters itself. */
export async function addDoorStay(row, client = supabase) {
  try {
    const { error } = await client.from('door_stays').insert(row);
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

export async function decideStay(id, status, client = supabase) {
  try {
    const { error } = await client.from('door_stays').update({ status }).eq('id', id);
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

// ---------------------------------------------------------------------------
// THE LIFE WALL (DR-1010, 0289). A tenant, a household member or a guest hands
// the family a picture of life at the property, signed over at submission;
// the family approves, declines or removes; the poster may ask for a
// take-down; an approved picture can be copied into the door's listing. Every
// wall is in the database; these are thin, never-throwing calls.
// ---------------------------------------------------------------------------

/** The current wording, its fingerprint, and whether this door's family has counsel's attestation on it. Anyone may read it. */
export async function loadStayWallWording(rentalId = null, client = supabase) {
  try {
    const { data, error } = await client.rpc('stay_wall_wording', { p_rental: rentalId || null });
    if (error) return no('read-failed', error);
    const row = Array.isArray(data) ? data[0] : data;
    return row ? ok({ wording: row }) : no('no-wording');
  } catch (e) { return no('unexpected', e); }
}

const stayWallArgs = (a = {}) => ({
  p_image: a.image, p_thumb: a.thumb || null, p_caption: String(a.caption || '').trim(),
  p_poster_name: String(a.name || '').trim(), p_show_name: Boolean(a.showName),
  p_attests_own: Boolean(a.own), p_attests_consent: Boolean(a.consent), p_attests_minors: Boolean(a.minors),
  p_wording_version: a.wordingVersion, p_wording_hash: a.wordingHash,
  p_attestation: a.attestation, p_consent: a.consentText,
  p_device_at: a.deviceAt || new Date().toISOString(), p_taken_at: a.takenAt || null,
});

/** Signed in: share one picture of this door. The database's refusal comes back in its own words. */
export async function submitStayPicture(a, client = supabase, { deadlineMs = WRITE_DEADLINE_MS } = {}) {
  try {
    const { data, error } = await withDeadline(client.rpc('stay_wall_submit', { p_rental: a.rentalId, ...stayWallArgs(a) }), deadlineMs, 'the picture server');
    return error ? no(error.message || 'write-failed', error) : ok({ id: data });
  } catch (e) { return no(e && e.message ? e.message : 'unexpected', e); }
}

/** Through the door's guest card: no account, the key says which door. */
export async function submitStayPictureAsGuest(a, client = supabase, { deadlineMs = WRITE_DEADLINE_MS } = {}) {
  try {
    const { data, error } = await withDeadline(client.rpc('stay_wall_submit_as_guest', { p_token: a.token, ...stayWallArgs(a) }), deadlineMs, 'the picture server');
    return error ? no(error.message || 'write-failed', error) : ok({ id: data });
  } catch (e) { return no(e && e.message ? e.message : 'unexpected', e); }
}

/** A poster's own pictures, newest first (RLS: theirs alone). Never the bytes. */
export async function loadMyStayPictures(client = supabase) {
  try {
    const uid = await userId(client);
    if (!uid) return ok({ pictures: [] });
    const { data, error } = await client.from('stay_pictures')
      .select('id, rental_id, caption, thumb, status, decline_reason, removal_asked_at, listing_photo_id, created_at, show_name, poster_name')
      .eq('submitted_by', uid).order('created_at', { ascending: false });
    return error ? no('read-failed', error) : ok({ pictures: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** Every picture on a door, for the family (RLS: the family alone). Never the bytes. */
export async function loadDoorStayPictures(rentalId, client = supabase) {
  if (!rentalId) return ok({ pictures: [] });
  try {
    const { data, error } = await client.from('stay_pictures')
      .select('id, rental_id, instance_id, submitted_role, poster_name, show_name, caption, thumb, taken_at, status, decline_reason, removal_asked_at, removed_reason, listing_photo_id, wording_version, signed_at, signed_on_device_at, created_at')
      .eq('rental_id', rentalId).order('created_at', { ascending: false });
    return error ? no('read-failed', error) : ok({ pictures: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** One picture's bytes, for someone who can read its row (the family, or the poster). */
export async function loadStayPictureImage(id, client = supabase) {
  if (!id) return no('no-picture');
  try {
    const { data, error } = await client.from('stay_pictures').select('image').eq('id', id).maybeSingle();
    return error ? no('read-failed', error) : ok({ image: data?.image || null });
  } catch (e) { return no('unexpected', e); }
}

export async function decideStayPicture(id, decision, reason = '', client = supabase) {
  try {
    const { data, error } = await client.rpc('stay_wall_decide', { p_id: id, p_decision: decision, p_reason: reason || null });
    return error ? no(error.message || 'write-failed', error) : ok({ status: data });
  } catch (e) { return no('unexpected', e); }
}

export async function removeStayPicture(id, reason = '', client = supabase) {
  try {
    const { error } = await client.rpc('stay_wall_remove', { p_id: id, p_reason: reason || null });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

export async function askStayPictureRemoval(id, client = supabase) {
  try {
    const { error } = await client.rpc('stay_wall_ask_removal', { p_id: id });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

export async function askStayPictureRemovalAsGuest(token, id, client = supabase) {
  try {
    const { error } = await client.rpc('stay_wall_ask_removal_as_guest', { p_token: token, p_id: id });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** The family copies an approved picture into the door's listing (on), or takes the copy back (off). */
export async function putStayPictureInListing(id, on, client = supabase) {
  try {
    const { data, error } = await client.rpc('stay_wall_use_in_listing', { p_id: id, p_on: Boolean(on) });
    return error ? no(error.message || 'write-failed', error) : ok({ photoId: data || null });
  } catch (e) { return no('unexpected', e); }
}

/** The family records that counsel reviewed a wording version. */
export async function attestStayWallWording(instanceId, version, note = '', client = supabase) {
  try {
    const { error } = await client.rpc('stay_wall_wording_attest', { p_instance: instanceId, p_version: version, p_note: note || null });
    return error ? no(error.message || 'write-failed', error) : ok();
  } catch (e) { return no('unexpected', e); }
}

/** The public walls: every approved picture, grouped by its building, without the bytes. No account needed. */
export async function loadPublicStayWalls(client = supabase) {
  try {
    const { data, error } = await client.rpc('public_stay_walls');
    return error ? no('read-failed', error) : ok({ rows: data || [] });
  } catch (e) { return no('unexpected', e); }
}

/** One wall picture's bytes, for anyone, only while it is on the wall. */
export async function loadPublicStayWallImage(id, client = supabase) {
  if (!id) return no('no-picture');
  try {
    const { data, error } = await client.rpc('public_stay_wall_image', { p_id: id });
    return error ? no('read-failed', error) : ok({ image: data || null });
  } catch (e) { return no('unexpected', e); }
}

// ---------------------------------------------------------------------------
// THE METER (DR-1098, migration 0302). What a door's utility meter said, read
// from the utility's own Green Button file. Owner, admin and member read; a
// viewer and the assistant read nothing, because hourly reads show when a
// house stands empty. RLS is the wall; these functions never widen it.
// Every call carries a timeout, so a dark network ends in a reason, never a
// spinner that waits forever.
// ---------------------------------------------------------------------------
const ENERGY_TIMEOUT_MS = 15000;
const ENERGY_PAGE = 1000;
const ENERGY_MAX_PAGES = 60;   // 60,000 folded hours: two years of electricity in, out, and gas
const ENERGY_CHUNK = 500;

const withTimeout = (q, ms = ENERGY_TIMEOUT_MS) => {
  if (q && typeof q.abortSignal === 'function' && typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return q.abortSignal(AbortSignal.timeout(ms));
  }
  return q;
};
const timedOut = (e) => e && (e.name === 'TimeoutError' || e.name === 'AbortError' || /abort|timed? ?out/i.test(e.message || ''));

/** The files imported onto a door, newest first. */
export async function loadEnergyImports(rentalRef, client = supabase) {
  if (!rentalRef) return ok({ imports: [] });
  try {
    const { data, error } = await withTimeout(client.from('property_energy_imports').select('*')
      .eq('rental_ref', rentalRef).order('created_at', { ascending: false }));
    if (error) return no(timedOut(error) ? 'timed-out' : 'read-failed', error);
    return ok({ imports: data || [] });
  } catch (e) { return no(timedOut(e) ? 'timed-out' : 'unexpected', e); }
}

/**
 * The door's readings folded to the hour by the database (0302's
 * property_energy_hourly), paged. Says `truncated` when the ceiling was hit,
 * so a screen never presents a cut-off history as the whole one.
 */
export async function loadEnergyHours(rentalRef, { since = null } = {}, client = supabase) {
  if (!rentalRef) return ok({ hours: [], truncated: false });
  const hours = [];
  try {
    for (let page = 0; page < ENERGY_MAX_PAGES; page += 1) {
      const from = page * ENERGY_PAGE;
      const { data, error } = await withTimeout(client.rpc('property_energy_hourly', { p_rental_ref: rentalRef, p_since: since })
        .range(from, from + ENERGY_PAGE - 1));
      if (error) {
        const msg = error.message || String(error);
        const reason = /property_energy_hourly.* does not exist|Could not find the function/i.test(msg) ? 'not-enabled-yet'
          : timedOut(error) ? 'timed-out' : 'read-failed';
        return no(reason, error);
      }
      const rows = data || [];
      hours.push(...rows);
      if (rows.length < ENERGY_PAGE) return ok({ hours, truncated: false });
    }
    return ok({ hours, truncated: true });
  } catch (e) { return no(timedOut(e) ? 'timed-out' : 'unexpected', e); }
}

/**
 * File one meter file: the ledger row, then its readings in chunks, upserted
 * on the reading's identity so an overlapping file replaces and never doubles.
 * A chunk that fails stops the save and says how many readings landed; the
 * same file imported again finishes the job, because the write is idempotent.
 */
export async function saveEnergyImport({ importRow, buildRows }, client = supabase) {
  if (!importRow || typeof buildRows !== 'function') return no('nothing-to-save');
  try {
    // Filed in the signed-in person's name, always: 0302 refuses any other.
    const uid = await userId(client);
    if (!uid) return no('signed-out');
    const { data: imp, error } = await withTimeout(client.from('property_energy_imports')
      .insert({ ...importRow, created_by: uid }).select().single());
    if (error) return no(timedOut(error) ? 'timed-out' : 'insert-failed', error);
    const rows = buildRows(imp.id);
    let saved = 0;
    for (let i = 0; i < rows.length; i += ENERGY_CHUNK) {
      const chunk = rows.slice(i, i + ENERGY_CHUNK);
      const { error: e2 } = await withTimeout(client.from('property_energy_readings')
        .upsert(chunk, { onConflict: 'rental_ref,commodity,direction,start_at,seconds' }));
      if (e2) return { ok: false, reason: timedOut(e2) ? 'timed-out' : 'readings-failed', saved, total: rows.length, importId: imp.id, error: e2.message };
      saved += chunk.length;
    }
    return ok({ importId: imp.id, saved, total: rows.length });
  } catch (e) { return no(timedOut(e) ? 'timed-out' : 'unexpected', e); }
}

/** Take back a wrong file. The owner or an admin only; its readings go with it. */
export async function deleteEnergyImport(id, client = supabase) {
  if (!id) return no('no-import');
  try {
    const { data, error } = await withTimeout(client.from('property_energy_imports').delete().eq('id', id).select('id'));
    if (error) return no(timedOut(error) ? 'timed-out' : 'delete-failed', error);
    if (!data || !data.length) return no('not-allowed');
    return ok();
  } catch (e) { return no(timedOut(e) ? 'timed-out' : 'unexpected', e); }
}
