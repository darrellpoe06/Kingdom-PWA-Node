// Instance role controls (DR-0220 Phase 3) — change an existing member's role in
// an instance, and list the real members. Shared by the Choir Roster and the Admin
// "Role & stewards" tab (and any other "obvious place"), because they all ride
// instance_members.role. Backed by the guarded SECURITY-DEFINER RPCs in migration
// 0111 (set_member_role / list_instance_members); RLS + those guards are the real
// enforcement — the pure helper here only mirrors them so the UI shows the right
// options.
import { supabase } from './supabase.js';
import { inviteToInstance } from './family-invite.js';

// Surface-says-truth (DR-0076/DR-0241): each label states what the database
// actually grants. `member` reads AND writes the space's shared records (the
// collaborative family/team role); `viewer` is truly read-only — enforced by
// the 0125 RESTRICTIVE deny-overlay and proven by viewer-readonly-isolation.
export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin (edit + members)',
  member: 'Member (edit)',
  viewer: 'Viewer (read-only)',
  specialist: 'Specialist',
  child: 'Child',
  successor: 'Successor',
  assistant: 'Assistant (office workspace only)',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'no role';
}

// The roles an actor MAY set for a given target — the exact mirror of the
// set_member_role guards (0111, widened by 0130 to carry 'assistant'), so the
// UI never offers an option the RPC will reject. Returns [] when the target is
// not editable by this actor.
//   * an owner is never editable here (untouchable — no lockout)
//   * only an owner may grant/alter admin
//   * an admin may move a member between member<->viewer<->assistant
//   * you cannot edit yourself
export function grantableRoles(actorRole, targetRole, { isSelf = false } = {}) {
  if (isSelf) return [];
  if (targetRole === 'owner') return [];        // owners untouchable via this control
  if (actorRole === 'owner') return ['admin', 'member', 'viewer', 'assistant'];
  if (actorRole === 'admin') {
    if (targetRole === 'admin') return [];       // only an owner touches an admin
    return ['member', 'viewer', 'assistant'];    // an admin can't grant admin
  }
  return [];                                     // not an owner/admin -> no control
}

// Can this actor change this target's role at all?
export function canEditRole(actorRole, targetRole, opts) {
  return grantableRoles(actorRole, targetRole, opts).length > 0;
}

// A liberal-but-safe email shape check (mirrors the invite validators).
export function isInviteEmail(email) {
  const e = String(email || '').trim();
  return e.length > 3 && /\S+@\S+\.\S+/.test(e);
}

// Invite a person into a space so they can start USING the app (Darrell 2026-07-22
// "I want people using the apps"). Branches by instance type:
//   - church  -> invite_to_church: they get access on their next sign-in (the
//     join_church_instance path consumes the pending invite). Returns {ok, kind:'church'}.
//   - other   -> invite_to_instance (DR-0187 token flow): returns {ok, link} — the
//     one-time claim LINK the inviter delivers; the invitee claims, the inviter
//     confirms (two-party). Never grants 'owner' (the RPC enforces it too).
// The caller must be owner/admin (enforced server-side). When the UI shows a
// space picker, pass the picked instanceId — the RPC then targets THAT space
// (0125); without it the server resolves the caller's family-first default.
export async function inviteToSpace(instanceType, email, role, instanceId = null) {
  const clean = String(email || '').trim().toLowerCase();
  if (!isInviteEmail(clean)) return { ok: false, reason: 'bad-email' };
  // church invites keep the narrow set; the instance path may mint 'assistant'
  // (DR-0271 — the office-workspace-only role). Never 'owner' anywhere.
  const instanceRoles = ['admin', 'member', 'viewer', 'assistant'];
  const churchRoles = ['admin', 'member', 'viewer'];
  const safeRole = (instanceType === 'church' ? churchRoles : instanceRoles).includes(role) ? role : 'member';
  if (instanceType === 'church') {
    const { error } = await supabase.rpc('invite_to_church', { email_in: clean, role_in: safeRole });
    if (error) return { ok: false, reason: 'rpc-error', error: error.message || String(error) };
    return { ok: true, kind: 'church', email: clean, role: safeRole };
  }
  const r = await inviteToInstance(clean, safeRole, instanceId);
  return { ...r, kind: 'instance' };
}

// Remove a member from a space entirely — the REVOKE half of assistant rights
// (DR-0271, RPC remove_instance_member in 0130). The RPC enforces: caller
// owner/admin; never an owner; only an owner removes an admin; no self-removal.
// Returns { status: 'removed'|'noop', role } or { skipped, error }.
export async function removeInstanceMember(instanceId, targetUserId) {
  if (!instanceId || !targetUserId) return { skipped: 'bad-args' };
  const { data, error } = await supabase.rpc('remove_instance_member', {
    instance_uuid: instanceId, target_user: targetUserId,
  });
  if (error) return { skipped: 'remove-error', error };
  return data || { status: 'noop' };
}

// Change a member's role. Returns { status: 'changed'|'noop', role } or
// { skipped, error } (the error message carries the RPC's reason).
export async function setMemberRole(instanceId, targetUserId, newRole) {
  if (!instanceId || !targetUserId || !newRole) return { skipped: 'bad-args' };
  const { data, error } = await supabase.rpc('set_member_role', {
    instance_uuid: instanceId, target_user: targetUserId, new_role: newRole,
  });
  if (error) return { skipped: 'role-change-error', error };
  return data || { status: 'noop', role: newRole };
}

// The instances the caller may administer (owner/admin), so a role-control panel
// can offer an instance picker — the family space AND the COLG/Love Corner church
// instance (and any ministry space they lead). Returns
// [{ instanceId, displayName, instanceType, role }], church spaces first.
export async function listMyAdminInstances() {
  const { data, error } = await supabase.rpc('list_my_admin_instances');
  if (error) { console.warn('[member-roles] list_my_admin_instances failed:', error); return []; }
  return (data || []).map((r) => ({
    instanceId: r.instance_id,
    displayName: r.display_name ?? null,
    instanceType: r.instance_type ?? null,
    role: r.role ?? null,
  }));
}

// ---------------------------------------------------------------------------
// The governance CHECKLIST (DR-0242) — additive per-person capabilities between
// the base roles, granted/revoked by an owner/admin via set_member_capability
// (0126). The DB is the enforcement (area-mapped RESTRICTIVE overlay + guarded
// RPC); this catalog only mirrors it so the UI never offers a box the server
// would reject. DEFAULT DENY: anything not listed here cannot be granted, and
// the money core is never unlockable no matter what is checked.
// ---------------------------------------------------------------------------
export const CAPABILITIES = [
  { key: 'invite:viewer',   group: 'Governance', label: 'May invite guests (read-only)',
    note: 'Can send one-time invite links that grant Viewer access only. The claim-and-confirm handshake still applies.' },
  { key: 'write:choir',     group: 'Areas', label: 'Choir — edit',
    note: 'Songs, schedule, notes, and the rest of the choir workspace.' },
  { key: 'write:bus',       group: 'Areas', label: 'Bus ministry — edit',
    note: 'Routes, schedules, ride requests, drivers.' },
  { key: 'write:inventory', group: 'Areas', label: 'Inventory — edit',
    note: 'Items, counts, movements, purchase orders.' },
  { key: 'write:crm',       group: 'Areas', label: 'CRM — edit',
    note: 'Leads and activities.' },
  { key: 'write:events',    group: 'Areas', label: 'Events & classes — edit',
    note: 'Events, sessions, conferences, class signups.' },
  { key: 'write:property',  group: 'Areas', label: 'Property — edit',
    note: 'Rent records, tenancies, maintenance, property notes.' },
  { key: 'write:content',   group: 'Areas', label: 'Content — edit',
    note: 'Discussions, discovery, recipes, showcase.' },
];

export function capabilityLabel(key) {
  const c = CAPABILITIES.find((x) => x.key === key);
  return c ? c.label : key;
}

// Mirror of set_member_capability's guards: only an owner/admin edits the
// checklist, never for themselves, never for an owner/admin target (they
// already hold these powers). Pure — the RPC is the real gate.
export function canEditCapabilities(actorRole, targetRole, { isSelf = false } = {}) {
  if (isSelf) return false;
  if (!['owner', 'admin'].includes(actorRole)) return false;
  return ['member', 'viewer'].includes(targetRole);
}

// The full checklist for a space: [{ userId, capability }] (owner/admin only;
// empty on error / no access).
export async function listMemberCapabilities(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('list_member_capabilities', { instance_uuid: instanceId });
  if (error) { console.warn('[member-roles] list_member_capabilities failed:', error); return []; }
  return (data || []).map((r) => ({ userId: r.user_id, capability: r.capability }));
}

// Check one box on/off. Returns { status } or { skipped, error }.
export async function setMemberCapability(instanceId, targetUserId, capability, enabled) {
  if (!instanceId || !targetUserId || !capability) return { skipped: 'bad-args' };
  const { data, error } = await supabase.rpc('set_member_capability', {
    instance_uuid: instanceId, target_user: targetUserId, capability_in: capability, enabled: !!enabled,
  });
  if (error) return { skipped: 'capability-error', error };
  return data || { status: enabled ? 'granted' : 'revoked' };
}

// The real member roster for an instance (owner/admin only). Returns an array of
// { userId, displayName, email, role } (empty on error / no access).
export async function listInstanceMembers(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('list_instance_members', { instance_uuid: instanceId });
  if (error) { console.warn('[member-roles] list_instance_members failed:', error); return []; }
  return (data || []).map((r) => ({
    userId: r.user_id,
    displayName: r.display_name ?? null,
    email: r.email ?? null,
    role: r.role ?? null,
  }));
}
