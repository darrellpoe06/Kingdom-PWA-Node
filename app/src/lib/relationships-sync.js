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
      supabase.from('maintenance_requests').select('*').eq('tenancy_id', tenancyId),
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
