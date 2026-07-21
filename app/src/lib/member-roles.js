// Instance role controls (DR-0220 Phase 3) — change an existing member's role in
// an instance, and list the real members. Shared by the Choir Roster and the Admin
// "Role & stewards" tab (and any other "obvious place"), because they all ride
// instance_members.role. Backed by the guarded SECURITY-DEFINER RPCs in migration
// 0111 (set_member_role / list_instance_members); RLS + those guards are the real
// enforcement — the pure helper here only mirrors them so the UI shows the right
// options.
import { supabase } from './supabase.js';

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin (edit)',
  member: 'Member (view)',
  viewer: 'Viewer',
  specialist: 'Specialist',
  child: 'Child',
  successor: 'Successor',
  assistant: 'Assistant',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || 'no role';
}

// The roles an actor MAY set for a given target — the exact mirror of the
// set_member_role guards (0111), so the UI never offers an option the RPC will
// reject. Returns [] when the target is not editable by this actor.
//   * an owner is never editable here (untouchable — no lockout)
//   * only an owner may grant/alter admin
//   * an admin may move a member between member<->viewer only
//   * you cannot edit yourself
export function grantableRoles(actorRole, targetRole, { isSelf = false } = {}) {
  if (isSelf) return [];
  if (targetRole === 'owner') return [];        // owners untouchable via this control
  if (actorRole === 'owner') return ['admin', 'member', 'viewer'];
  if (actorRole === 'admin') {
    if (targetRole === 'admin') return [];       // only an owner touches an admin
    return ['member', 'viewer'];                 // an admin can't grant admin
  }
  return [];                                     // not an owner/admin -> no control
}

// Can this actor change this target's role at all?
export function canEditRole(actorRole, targetRole, opts) {
  return grantableRoles(actorRole, targetRole, opts).length > 0;
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
