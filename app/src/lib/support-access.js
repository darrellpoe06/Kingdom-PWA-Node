// The Governed Support Door — client half (DR-0223 / DR-0220 Phase 6). How the
// technology team fixes issues WITHOUT ambient access to data: a steward grants a
// Dev/Ops Specialist a scoped, time-boxed, AUDITED break-glass grant to ONE non-PHI
// record; the specialist reads only that record while the grant is live, and every
// read is logged. Backed by the SECURITY-DEFINER RPCs in migration 0114 — those
// guards (never PHI, capability-gated, own-live-grant-only, logged) are the real
// enforcement; this lib just calls them.
import { supabase } from './supabase.js';

// The non-PHI resource types a grant may target — MIRRORS support_supportable_table
// in 0114 (clinical/PHI + anything not listed is never break-glass-able, server-side).
export const SUPPORTABLE_TYPES = ['transaction', 'instance_member', 'choir_member', 'inquiry', 'invite'];

export function isSupportableType(t) {
  return SUPPORTABLE_TYPES.includes(String(t || '').toLowerCase());
}

// Roles that carry the support.breakglass capability (mirrors the 0114 seed) — the
// grantee picker offers only these; the RPC enforces it regardless.
export const BREAKGLASS_ROLES = ['owner', 'specialist'];
export function canReceiveBreakglass(role) {
  return BREAKGLASS_ROLES.includes(String(role || '').toLowerCase());
}

// Owner/admin grants a capable specialist a scoped, expiring grant. Returns
// { ok, id } or { ok:false, reason, error }.
export async function grantSupportAccess(instanceId, granteeUserId, resourceType, resourceId, reason, minutes = 60) {
  if (!instanceId || !granteeUserId || !resourceId) return { ok: false, reason: 'bad-args' };
  if (!isSupportableType(resourceType)) return { ok: false, reason: 'not-supportable' };
  if (!String(reason || '').trim()) return { ok: false, reason: 'reason-required' };
  const { data, error } = await supabase.rpc('grant_support_access', {
    instance_uuid: instanceId,
    grantee: granteeUserId,
    resource_type_in: String(resourceType).toLowerCase(),
    resource_id_in: resourceId,
    reason_in: String(reason).trim(),
    minutes_in: Math.max(1, Math.min(Number(minutes) || 60, 1440)),
  });
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { ok: true, id: data };
}

// The specialist reads a scoped resource via a live grant. Returns the RPC envelope
// { status: 'ok'|'expired'|'no-grant', resource_type, resource_id, data } or { skipped }.
export async function supportRead(grantId) {
  if (!grantId) return { status: 'no-grant' };
  const { data, error } = await supabase.rpc('support_read', { grant_id: grantId });
  if (error) return { skipped: 'read-error', error: error.message || String(error) };
  return data || { status: 'no-grant' };
}

// The caller's own live grants (the specialist's panel).
export async function listMySupportGrants() {
  const { data, error } = await supabase.rpc('list_my_support_grants');
  if (error) { console.warn('[support-access] list_my_support_grants failed:', error); return []; }
  return (data || []).map((r) => ({
    grantId: r.grant_id,
    instanceId: r.instance_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    reason: r.reason,
    expiresAt: r.expires_at,
  }));
}

export async function revokeSupportAccess(grantId) {
  if (!grantId) return { ok: false };
  const { data, error } = await supabase.rpc('revoke_support_access', { grant_id: grantId });
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { ok: !!data };
}

// --- User-initiated self-grant (0115) ---------------------------------------
// A member opens a support specialist's access to THEIR OWN record. Same safety
// envelope (never PHI, capable grantee, scoped/logged) + the caller must own the
// record (enforced server-side). Returns { ok, id } or { ok:false, reason }.
export async function requestSupportAccess(instanceId, granteeUserId, resourceType, resourceId, reason, minutes = 60) {
  if (!instanceId || !granteeUserId || !resourceId) return { ok: false, reason: 'bad-args' };
  if (!String(reason || '').trim()) return { ok: false, reason: 'reason-required' };
  const { data, error } = await supabase.rpc('request_support_access', {
    instance_uuid: instanceId,
    grantee: granteeUserId,
    resource_type_in: String(resourceType).toLowerCase(),
    resource_id_in: resourceId,
    reason_in: String(reason).trim(),
    minutes_in: Math.max(1, Math.min(Number(minutes) || 60, 1440)),
  });
  if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
  return { ok: true, id: data };
}

// The support specialists a member can pick to grant (names only).
export async function listSupportSpecialists(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('list_support_specialists', { instance_uuid: instanceId });
  if (error) { console.warn('[support-access] list_support_specialists failed:', error); return []; }
  return (data || []).map((r) => ({ userId: r.user_id, displayName: r.display_name }));
}

// The caller's OWN records they can open for help (their membership + choir row),
// so the surface lists them instead of asking for a raw id.
export async function mySupportableRecords(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('my_supportable_records', { instance_uuid: instanceId });
  if (error) { console.warn('[support-access] my_supportable_records failed:', error); return []; }
  return (data || []).map((r) => ({ resourceType: r.resource_type, resourceId: r.resource_id, label: r.label }));
}
