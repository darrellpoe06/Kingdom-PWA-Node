// =============================================================================
// ministry-roster — who is on a team, for every team (DR-1052)
// =============================================================================
// Darrell, 2026-10-15, from his phone on the Choir tab: "Media?!!!!!!!!!! Other
// members of the other teams who should have access..."
//
// WHY THIS EXISTS, measured before it was written. The church names 23
// ministries in lib/church-ministries.js — bus, choir, band, MEDIA, ushers,
// security, hospitality, outreach, music, it, parking, deacons, prayer,
// missions, children, youth, college, administration, events, care and the
// rest. Across every migration and every lib on main there were exactly four
// membership predicates: user_in_instance (the whole house, not a team),
// user_in_choir, user_in_security, user_in_group. So 23 teams, one of them
// seatable. A Media volunteer could not be ON the media team anywhere in the
// system, and the only door that existed was being added to the CHOIR's roster
// as choir_role 'media' — a team as a role inside another team.
//
// 0296 adds the seat (ministry_members + user_in_ministry). This is the thin
// data layer over it, mirroring choir-sync's addMember/removeMember exactly so
// a reader who knows the choir knows this.
//
// THE MINISTRY ID IS THE REGISTRY'S ID, never free text typed at a call site:
// church-ministries.js is the one list the feedback picker, the staff ops list
// and the ministries surface already read, and a second vocabulary is the
// go-stale failure feedback-area-guard exists to catch.
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { ask, askRole } from './church-access.js';
import { ministryById } from './church-ministries.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/** Pure. A roster row as the app reads it. Exported for tests. */
export function toMemberShape(row) {
  return {
    id: row.id,
    ministry: row.ministry,
    userId: row.user_id ?? null,
    displayName: row.display_name ?? '',
    teamRole: row.team_role ?? 'member',
    linked: !!row.user_id,          // false = on the roster, no app account yet
    createdAt: row.created_at ?? null,
  };
}

/**
 * Pure. Is this a ministry the church actually names? Exported for tests.
 *
 * The roster is keyed by the registry's id, so a typo cannot quietly create a
 * team that exists only in one roster row and shows up nowhere else.
 */
export const isKnownMinistry = (id) => !!ministryById(id);

async function writeContext() {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId();
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

/**
 * My role in the church, or null. Asks the same RPC getChoirAccess asks, so
 * the ministries surface and the choir surface cannot disagree about who the
 * caller is. Only owner/admin may edit a roster (0296 RLS); everyone else
 * reads the team they are on.
 */
export async function myChurchRole() {
  const session = await currentSession();
  if (!session) return null;
  const tenantId = await churchInstanceId();
  if (!tenantId) return null;
  // A read that could not be made is NOT a no (DR-1053).
  const answer = await askRole(tenantId);
  return answer.ok ? (answer.value ?? null) : null;
}

/** Pure. Who may edit a roster — owner/admin, mirroring the 0296 write policy. */
export const canEditRoster = (role) => role === 'owner' || role === 'admin';

/**
 * The roster of ONE team. RLS returns rows only to that team and to
 * owner/admin (0296), so an empty list is an honest "you are not on this team
 * or it has nobody yet" — never a silent partial.
 */
export async function listMinistryMembers(ministry) {
  if (!isKnownMinistry(ministry)) return { ok: true, rows: [], reason: 'unknown-ministry' };
  const session = await currentSession();
  if (!session) return { ok: true, rows: [], reason: 'signed-out' };
  const tenantId = await churchInstanceId();
  if (!tenantId) return { ok: true, rows: [], reason: 'no-church' };
  const answer = await ask(() => supabase
    .from('ministry_members')
    .select('id, ministry, user_id, display_name, team_role, created_at')
    .eq('instance_id', tenantId)
    .eq('ministry', ministry)
    .order('display_name', { ascending: true }));
  // AN EMPTY ROSTER AND AN UNREAD ROSTER ARE DIFFERENT THINGS (DR-1053).
  // This returned [] for both until 2026-10-15, and the panel then told the
  // person "nobody is listed for Media that you can see — ask a director to
  // add you": a statement about their standing, assembled out of a failed
  // read. That is the exact defect the Choir tab showed Darrell an hour
  // before this file was written, reproduced in the surface built for his
  // own question about Media.
  if (!answer.ok) return { ok: false, rows: [], reason: answer.reason, message: answer.message };
  return { ok: true, rows: (answer.value ?? []).map(toMemberShape), reason: 'answered' };
}

/** Am I on this team? Asks the database's own predicate, not a local guess. */
export async function amIOnMinistry(ministry) {
  if (!isKnownMinistry(ministry)) return false;
  const session = await currentSession();
  if (!session) return false;
  const tenantId = await churchInstanceId();
  if (!tenantId) return false;
  const { data, error } = await supabase.rpc('user_in_ministry', {
    instance_uuid: tenantId,
    ministry_in: ministry,
  });
  return error ? false : data === true;
}

/**
 * Seat someone on a team. Owner/admin only — enforced by ministry_members_write
 * RLS (0296), not by this function; this reports the refusal rather than
 * pretending it worked.
 *
 * userId null is deliberate and matches the choir: a director can build the
 * roster before the people have app accounts.
 */
export async function addMinistryMember(ministry, member) {
  if (!isKnownMinistry(ministry)) return { skipped: 'unknown-ministry' };
  const name = (member?.displayName ?? '').trim();
  if (!name) return { skipped: 'no-name' };
  const ctx = await writeContext();
  if (ctx.error) return { skipped: ctx.error };
  const { error } = await supabase.from('ministry_members').insert({
    instance_id: ctx.tenantId,
    ministry,
    user_id: member.userId ?? null,
    display_name: name,
    team_role: (member.teamRole ?? '').trim() || 'member',
    added_by: ctx.userId,
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

/** Take someone off a team. Owner/admin only (RLS). */
export async function removeMinistryMember(id) {
  const { error } = await supabase.from('ministry_members').delete().eq('id', id);
  return error ? { skipped: 'delete-error', error } : { deleted: true };
}
