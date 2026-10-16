// =============================================================================
// church-profile-sync — Supabase I/O for church_profiles and the steward's
// provision call (migration 0297, DR-1066)
// =============================================================================
// The PURE rules live in church-profile.js; this file only moves rows. It
// mirrors the established church-surface pattern (church-giving-book-sync,
// church-member-sync): every network call races an explicit deadline (SOUL.md
// DoD #3), every outcome is a distinguishable, honest state rather than a
// throw, and the server's answer is never retried — a refusal is the answer.
//
// SCOPE, decided here and not by the nearest neighbour (USER-ACCOUNTS-AND-
// HISTORIES-STANDARD): church_profiles is an INSTANCE record — a public
// institution's own face and the channels it publishes — not a person's
// history. It holds nothing about any member, nothing sensitive, and its
// office can read every byte of it back (the row IS the export). Who may
// write it is the database's decision (0297 RLS + set_church_profile), never
// this file's.
//
// Outcomes: { ok:true, ... } | { ok:false, reason: 'signed-out'|'no-church'|
// 'forbidden'|'refused'|'network-error'|'error', message }.
// 'forbidden' is the wall (42501); 'refused' is the trigger / the RPC's own
// check (23514, check_violation) — the office typed something the rule does
// not allow, and the message says which rule, in the trigger's words.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceResolve } from './church-instance.js';

export const PROFILE_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([Promise.resolve(promise), timer]).finally(() => clearTimeout(t));
}

function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}

export function reasonFor(error) {
  const code = error && error.code;
  const text = String((error && error.message) || '');
  if (code === '42501' || /row-level security|permission denied|insufficient_privilege|only (a|the) /i.test(text)) return 'forbidden';
  if (code === '23514' || /refused|must be|needs a|at most|is required|reserved|too long|too large/i.test(text)) return 'refused';
  return 'error';
}

async function currentSession() {
  try {
    if (!supabase || !supabase.auth || typeof supabase.auth.getSession !== 'function') return null;
    const { data } = await withTimeout(supabase.auth.getSession(), PROFILE_TIMEOUT_MS, 'reading the session');
    return (data && data.session) || null;
  } catch {
    return null;
  }
}

async function rpc(name, args, what) {
  try {
    const { data, error } = await withTimeout(supabase.rpc(name, args), PROFILE_TIMEOUT_MS, what);
    if (error) return { ok: false, reason: reasonFor(error), message: message(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/**
 * The caller's church and its profile row, if any. The slug comes from the
 * instances row (readable by any member, 0056 instances_member_read) and is
 * what lets the Give panel know whether this church is COLG.
 *
 *   { ok:true, instanceId, slug, displayName, profile|null }
 *   { ok:false, reason:'signed-out'|'no-church'|'error', message }
 */
export async function loadMyChurchProfile(displayName) {
  const session = await currentSession();
  if (!session) return { ok: false, reason: 'signed-out', message: 'Sign in to see your church’s door.' };
  let resolved;
  try {
    resolved = await withTimeout(churchInstanceResolve(displayName ?? null), PROFILE_TIMEOUT_MS, 'finding your church');
  } catch (e) {
    return { ok: false, reason: 'error', message: message(e) };
  }
  if (!resolved || !resolved.ok) return { ok: false, reason: 'error', message: (resolved && resolved.message) || 'Your church could not be read.' };
  if (!resolved.value) return { ok: false, reason: 'no-church', message: 'Your account isn’t linked to a church yet.' };
  return loadChurchProfileFor(resolved.value);
}

/** The profile row and registry facts for a known church instance. */
export async function loadChurchProfileFor(instanceId) {
  if (!instanceId) return { ok: false, reason: 'no-church', message: 'No church was named.' };
  try {
    const [inst, prof] = await Promise.all([
      withTimeout(supabase.from('instances').select('id,slug,display_name').eq('id', instanceId).maybeSingle(), PROFILE_TIMEOUT_MS, 'reading the church'),
      withTimeout(supabase.from('church_profiles').select('instance_id,profile,giving_channels,is_public,updated_at').eq('instance_id', instanceId).maybeSingle(), PROFILE_TIMEOUT_MS, 'reading the church profile'),
    ]);
    if (inst.error) return { ok: false, reason: reasonFor(inst.error), message: message(inst.error) };
    if (prof.error) return { ok: false, reason: reasonFor(prof.error), message: message(prof.error) };
    return {
      ok: true,
      instanceId,
      slug: (inst.data && inst.data.slug) || null,
      displayName: (inst.data && inst.data.display_name) || null,
      profile: prof.data || null,
    };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

/** The office writes its profile and channels. A null part is left as it is. */
export async function saveChurchProfile(instanceId, { profile = null, channels = null, isPublic = null } = {}) {
  if (!instanceId) return { ok: false, reason: 'no-church', message: 'No church was named.' };
  const r = await rpc('set_church_profile', {
    instance_in: instanceId,
    profile_in: profile,
    channels_in: channels,
    public_in: isPublic,
  }, 'saving the church profile');
  if (!r.ok) return r;
  return { ok: true, profile: r.data || null };
}

/** Is the signed-in person a platform steward (owner/admin of the family space)? */
export async function amPlatformSteward() {
  const session = await currentSession();
  if (!session) return { ok: false, reason: 'signed-out', steward: false };
  const r = await rpc('is_platform_steward', {}, 'checking stewardship');
  if (!r.ok) return { ...r, steward: false };
  return { ok: true, steward: r.data === true };
}

/** The steward adds a church (or names another leader for an existing one). */
export async function provisionChurch(args) {
  const r = await rpc('provision_church_instance', args, 'adding the church');
  if (!r.ok) return r;
  const d = r.data || {};
  return {
    ok: true,
    instanceId: d.instance_id || null,
    slug: d.slug || null,
    created: d.created === true,
    leaderEmail: d.leader_email || null,
    leaderRole: d.leader_role || null,
  };
}
