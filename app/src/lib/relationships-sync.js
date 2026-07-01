// =============================================================================
// relationships-sync.js — persistence for the relationship workflows (0055)
// =============================================================================
// The pure rules live in relationships.js / tenant-portal.js / guardian-child.js.
// This is the thin, FAIL-SOFT adapter the surface uses to read + write the real
// tables. Every call is wrapped so a signed-out session or a backend hiccup
// degrades to "nothing loaded / not saved" instead of throwing into the UI.
//
// RLS does the real gating (migration 0055): a tenant only ever reads their own
// tenancy's rows; a guardian (owner/admin) is the only writer of child_capabilities.
// This layer adds NO trust of its own — it just shuttles rows.
// =============================================================================
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';
import { CHILD_CAPABILITY_POLICY } from './relationships.js';

const ok = (data) => ({ ok: true, data });
const fail = (error) => ({ ok: false, error: String(error && error.message ? error.message : error), data: null });

// The signed-in auth user, or null. Fail-soft: a signed-out session or a
// backend hiccup returns null instead of throwing into the UI.
export async function getSessionUser() {
  try { return (await supabase.auth.getUser()).data?.user || null; }
  catch { return null; }
}

// --- pure mappers (testable without a DB) ----------------------------------

// child_capabilities rows -> the config map the model consumes (cap -> setting).
// Only rows whose capability is a real child capability are kept (defense).
export function configFromRows(rows = []) {
  const config = {};
  for (const r of rows) {
    if (r && r.capability in CHILD_CAPABILITY_POLICY && r.setting) config[r.capability] = r.setting;
  }
  return config;
}

// One capability row ready to upsert.
export function capabilityRow({ instanceId, childPersona, childUserId, capability, setting, setBy }) {
  return {
    instance_id: instanceId ?? null,
    child_persona: childPersona ?? null,
    child_user_id: childUserId ?? null,
    capability,
    setting,
    set_by: setBy ?? null,
  };
}

// --- child capability config ------------------------------------------------

export async function loadChildCapabilities(childPersona) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    let q = supabase.from('child_capabilities').select('*').eq('instance_id', instanceId);
    if (childPersona) q = q.eq('child_persona', childPersona);
    const { data, error } = await q;
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

export async function saveChildCapability({ childPersona, childUserId, capability, setting }) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return fail('not signed in');
    const userId = (await supabase.auth.getUser()).data?.user?.id || null;
    const row = capabilityRow({ instanceId, childPersona, childUserId, capability, setting, setBy: userId });
    const { data, error } = await supabase
      .from('child_capabilities')
      .upsert(row, { onConflict: 'instance_id,child_persona,capability' })
      .select();
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

// --- child action / approval queue -----------------------------------------

export async function loadChildRequests({ status = null } = {}) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    let q = supabase.from('child_action_requests').select('*').eq('instance_id', instanceId).order('requested_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

export async function insertRow(table, row) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return fail('not signed in');
    const { data, error } = await supabase.from(table).insert({ ...row, instance_id: instanceId }).select();
    if (error) return fail(error);
    return ok((data && data[0]) || null);
  } catch (e) { return fail(e); }
}

export async function patchRow(table, id, patch) {
  try {
    const { data, error } = await supabase.from(table).update(patch).eq('id', id).select();
    if (error) return fail(error);
    return ok((data && data[0]) || null);
  } catch (e) { return fail(e); }
}

// --- landlord <-> tenant tables --------------------------------------------

export async function loadTenancies() {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    const { data, error } = await supabase.from('rental_tenancies').select('*').eq('instance_id', instanceId);
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

export async function loadTenancyWorkflows(tenancyId) {
  try {
    if (!tenancyId) return ok({ maintenance: [], rent: [], notices: [], messages: [] });
    const [m, r, n, msg] = await Promise.all([
      // 0055 RENAMED this table maintenance_requests -> tenant_maintenance_requests
      // (it collided with the pre-existing rentals maintenance_requests). Querying
      // the old name returned the WRONG table's rows / errored — fixed 2026-07-01.
      supabase.from('tenant_maintenance_requests').select('*').eq('tenancy_id', tenancyId),
      supabase.from('rent_records').select('*').eq('tenancy_id', tenancyId),
      supabase.from('tenant_notices').select('*').eq('tenancy_id', tenancyId),
      supabase.from('tenant_messages').select('*').eq('tenancy_id', tenancyId).order('sent_at', { ascending: true }),
    ]);
    return ok({
      maintenance: m.data || [],
      rent: r.data || [],
      notices: n.data || [],
      messages: msg.data || [],
    });
  } catch (e) { return fail(e); }
}

// The tenancies attached to one unit door (rental_ref). A unit can have a
// current tenant + archived past ones; the surface uses the active one to scope
// the thread + requests, and shows the door even when no tenancy exists yet.
export async function loadTenanciesForRental(rentalRef) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId || !rentalRef) return ok([]);
    const { data, error } = await supabase
      .from('rental_tenancies').select('*')
      .eq('instance_id', instanceId).eq('rental_ref', rentalRef);
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

// --- property_notes (landlord-private per-unit memory, migration 0062) ------

export async function loadPropertyNotes(rentalRef) {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return ok([]);
    let q = supabase.from('property_notes').select('*').eq('instance_id', instanceId);
    if (rentalRef) q = q.eq('rental_ref', rentalRef);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) return fail(error);
    return ok(data || []);
  } catch (e) { return fail(e); }
}

// row = buildPropertyNote(...) output; created_by stamped from the session.
export async function savePropertyNote(row) {
  try {
    const userId = (await supabase.auth.getUser()).data?.user?.id || null;
    return await insertRow('property_notes', { ...row, created_by: userId });
  } catch (e) { return fail(e); }
}

export async function deletePropertyNote(id) {
  try {
    const { error } = await supabase.from('property_notes').delete().eq('id', id);
    if (error) return fail(error);
    return ok(true);
  } catch (e) { return fail(e); }
}

// --- append-only tenant/PM/owner thread (tenant_messages, 0055 + 0062) ------
// GUARDRAIL: capturing/drafting is free; SENDING is a consequential action the
// caller only invokes AFTER an explicit human approve-to-send. This adapter
// just persists the approved row; it never auto-composes or auto-sends.
export async function sendTenantMessage({ tenancyId, body, fromRole }) {
  try {
    const userId = (await supabase.auth.getUser()).data?.user?.id || null;
    const role = ['tenant', 'landlord', 'manager'].includes(fromRole) ? fromRole : 'landlord';
    return await insertRow('tenant_messages', {
      tenancy_id: tenancyId, body, from_role: role, sender_user_id: userId,
    });
  } catch (e) { return fail(e); }
}

// --- service requests (tenant_maintenance_requests, 0055 + 0062) ------------

export async function fileServiceRequest(row) {
  try {
    const userId = (await supabase.auth.getUser()).data?.user?.id || null;
    return await insertRow('tenant_maintenance_requests', { ...row, created_by: userId });
  } catch (e) { return fail(e); }
}

export async function transitionServiceRequest(id, status) {
  return patchRow('tenant_maintenance_requests', id, { status });
}

// Assign a request to the person accountable (typically the PM). Label is
// denormalized so the board reads before the PM has a linked account.
export async function assignServiceRequest(id, { assignedTo = null, assignedToLabel = '' }) {
  return patchRow('tenant_maintenance_requests', id, {
    assigned_to: assignedTo, assigned_to_label: assignedToLabel || null,
  });
}
