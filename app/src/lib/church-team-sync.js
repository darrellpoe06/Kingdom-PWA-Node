// =============================================================================
// church-team-sync — the church dev/ops team roster (Darrell 2026-07-21)
// =============================================================================
// "A dedicated church 'dev/ops team' surface with its own cross-app tester role
// and separate RLS." Instance-scoped, cross-device-synced (DR-0061), backed by
// church_team_members (migration 0109). Mirrors choir-sync's roster shape.
//
// THE TWO LAYERS (kept separate on purpose):
//   1. The TEAM record — church_team_members — is WHAT each helper does
//      (lead / dev / ops / tester) + the audit trail. Read = anyone on the team;
//      manage (add/remove/change-role) = owner/admin only (RLS in 0109).
//   2. The APP ACCESS — the instance role — is what they can actually READ/EDIT,
//      enforced by RLS everywhere. Adding a helper ALSO invites them to the
//      church instance at the role their team-role maps to, so "tester only" is a
//      real view-only grant (viewer), not just a label:
//        tester → viewer (view, never edit) · dev/ops → member · lead → admin.
//   A stray team row can never widen access — the instance role is the authority.
//
// Access probes are bounded (the getSession cross-tab-lock hang class — pin.js /
// PrivateGate / choir getChoirAccess) and report `unverified` so a lapsed/hung
// session is never mistaken for "not on the team."
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { inviteToChurch } from './choir-sync.js';

// team_role → the instance role its invite grants (the real RLS access).
export const TEAM_ROLE_TO_INSTANCE_ROLE = { tester: 'viewer', dev: 'member', ops: 'member', lead: 'admin' };
export function teamRoleToInstanceRole(teamRole) {
  return TEAM_ROLE_TO_INSTANCE_ROLE[teamRole] || 'viewer';
}

export const TEAM_ROLES = [
  ['tester', 'Tester (view only)'],
  ['dev', 'Dev'],
  ['ops', 'Ops'],
  ['lead', 'Team lead'],
];
export const teamRoleLabel = (r) => (TEAM_ROLES.find(([k]) => k === r)?.[1]) || r;

// --- Pure helpers (exported for tests) ---------------------------------------

export function toTeamMemberShape(row, myUserId) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name ?? '',
    email: row.email ?? null,
    teamRole: row.team_role ?? 'tester',
    notes: row.notes ?? null,
    addedBy: row.added_by ?? null,
    createdAt: row.created_at ?? null,
    mine: !!(myUserId && row.user_id === myUserId),
  };
}

// owner/admin MANAGE the team; anyone on the team (or owner/admin) SEES it. A
// tester (viewer instance role, on the team) can see, NEVER manage.
export function deriveTeamAccess(instanceRole, onTeam) {
  const canManage = instanceRole === 'owner' || instanceRole === 'admin';
  return { canManage, canSee: canManage || !!onTeam };
}

// --- Session / access (bounded, honest) --------------------------------------

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export const TEAM_ACCESS_TIMEOUT_MS = 8000;
const ACCESS_TIMEOUT = Symbol('church-team-access-timeout');
function withAccessTimeout(promise, ms = TEAM_ACCESS_TIMEOUT_MS) {
  let timer;
  const t = new Promise((resolve) => { timer = setTimeout(() => resolve(ACCESS_TIMEOUT), ms); });
  return Promise.race([promise, t]).finally(() => clearTimeout(timer));
}

// { signedIn, canSee, canManage, unverified, tenantId, instanceRole, teamRole }.
// unverified:true = a lapsed/hung session or an RPC error — the surface guides a
// sign-in refresh instead of rendering "you're not on the team" (DR-0076).
export async function getTeamAccess(displayName) {
  const unverified = (extra = {}) => ({ signedIn: true, canSee: false, canManage: false, unverified: true, tenantId: null, instanceRole: null, teamRole: null, ...extra });
  let session;
  try { session = await withAccessTimeout(currentSession()); } catch { return unverified(); }
  if (session === ACCESS_TIMEOUT) return unverified();
  if (!session) return { signedIn: false, canSee: false, canManage: false, unverified: false, tenantId: null, instanceRole: null, teamRole: null };
  let tenantId;
  try { tenantId = await withAccessTimeout(churchInstanceId(displayName)); } catch { return unverified(); }
  if (tenantId === ACCESS_TIMEOUT) return unverified();
  if (!tenantId) return { signedIn: true, canSee: false, canManage: false, unverified: false, tenantId: null, instanceRole: null, teamRole: null };
  try {
    const res = await withAccessTimeout(Promise.all([
      supabase.rpc('user_role_in_instance', { tenant_uuid: tenantId }),
      supabase.rpc('user_on_church_team', { instance_uuid: tenantId }),
      supabase.rpc('user_team_role_in_instance', { instance_uuid: tenantId }),
    ]));
    if (res === ACCESS_TIMEOUT) return unverified({ tenantId });
    const [{ data: role, error: roleErr }, { data: onTeam, error: teamErr }, { data: teamRole, error: trErr }] = res;
    if (roleErr || teamErr || trErr) return unverified({ tenantId });
    const { canManage, canSee } = deriveTeamAccess(role, onTeam);
    return { signedIn: true, canSee, canManage, unverified: false, tenantId, instanceRole: role ?? null, teamRole: teamRole ?? null };
  } catch { return unverified({ tenantId }); }
}

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

// --- Live roster subscription (realtime, cold-start-race hardened) ------------

export function subscribeTeam(onChange, onError) {
  let channel = null;
  let cancelled = false;
  (async () => {
    let session = null;
    for (let i = 0; i < 8 && !cancelled; i += 1) {
      session = await currentSession();
      if (session) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    if (cancelled) return;
    if (!session) { onChange([]); return; }
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('church_team_members').select('*').order('created_at', { ascending: true });
      if (error) { console.warn('[church-team-sync] fetch failed:', error); if (onError) onError(error); return null; }
      return (data || []).map((r) => toTeamMemberShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('church_team_members-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'church_team_members' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// --- Mutations (owner/admin only; RLS is the real gate) ----------------------

// Add a helper to the team. Inserts the team row AND — when an email is given —
// invites them to the church instance at the role their team-role maps to, so
// their app access matches their label (tester → view-only). Returns the invite
// outcome too so the UI can say "invited" honestly.
export async function addTeamMember(member, displayName) {
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const teamRole = TEAM_ROLE_TO_INSTANCE_ROLE[member.teamRole] ? member.teamRole : 'tester';
  const { error } = await supabase.from('church_team_members').insert({
    instance_id: ctx.tenantId,
    user_id: member.userId ?? null,
    display_name: member.displayName ?? '',
    email: member.email ?? null,
    team_role: teamRole,
    notes: member.notes ?? null,
    added_by: ctx.userId,
  });
  if (error) return { skipped: 'insert-error', error };
  let invited = null;
  const email = (member.email || '').trim();
  if (email) invited = await inviteToChurch(email, teamRoleToInstanceRole(teamRole)).catch(() => ({ skipped: 'invite-error' }));
  return { saved: true, invited };
}

export async function removeTeamMember(id) {
  const { error } = await supabase.from('church_team_members').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}

// Change a helper's team role. Updates the row and — when we have their email —
// re-invites at the new mapped instance role so access follows the role change.
export async function updateTeamMemberRole(member, teamRole) {
  const role = TEAM_ROLE_TO_INSTANCE_ROLE[teamRole] ? teamRole : 'tester';
  const { error } = await supabase.from('church_team_members').update({ team_role: role }).eq('id', member.id);
  if (error) return { skipped: 'update-error', error };
  let invited = null;
  const email = (member.email || '').trim();
  if (email) invited = await inviteToChurch(email, teamRoleToInstanceRole(role)).catch(() => ({ skipped: 'invite-error' }));
  return { saved: true, invited };
}
