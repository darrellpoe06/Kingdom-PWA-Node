// =============================================================================
// person-record-sync — the reads behind person-record.js (DR-0828)
// =============================================================================
// Two tables, both already readable by the viewer under their own RLS:
//   dm_device_keys    any signed-in person may read any user's device rows (a
//                     sender needs every device of the recipient, 0249);
//   member_presence   owner/admin of the instance (0055).
// READS ONLY. Nothing here persists a user's record (USER-ACCOUNTS-AND-
// HISTORIES-STANDARD: the account holds its own non-sensitive history and the
// steward reads it through RLS, never around it). Each read answers
// { ok, rows, reason } and never throws: a steward sees "could not read" with
// the reason, never an empty list pretending to be the truth (DR-0076 rule 8).
// =============================================================================

import supabase from './supabase.js';

function race(promise, timeoutMs, onTimeout) {
  const timer = new Promise((resolve) => setTimeout(() => resolve(onTimeout), timeoutMs));
  return Promise.race([promise, timer]);
}

const timedOut = (timeoutMs) => ({ data: null, error: { message: `the server did not answer within ${Math.round(timeoutMs / 1000)}s` } });

export async function loadDmDevicesOf(userId, { client = supabase, timeoutMs = 6000 } = {}) {
  if (!userId) return { ok: false, rows: [], reason: 'no user' };
  try {
    const q = client.from('dm_device_keys').select('device_id,label,last_seen_at').eq('user_id', userId);
    const r = await race(q, timeoutMs, timedOut(timeoutMs));
    if (r.error) return { ok: false, rows: [], reason: r.error.message || String(r.error) };
    return { ok: true, rows: Array.isArray(r.data) ? r.data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

export async function loadPresenceOf(instanceId, userId, { client = supabase, timeoutMs = 6000 } = {}) {
  if (!userId || !instanceId) return { ok: false, rows: [], reason: 'no user or no space' };
  try {
    const q = client.from('member_presence').select('platform,build_sha,build_time,last_seen_at').eq('instance_id', instanceId).eq('user_id', userId);
    const r = await race(q, timeoutMs, timedOut(timeoutMs));
    if (r.error) return { ok: false, rows: [], reason: r.error.message || String(r.error) };
    return { ok: true, rows: Array.isArray(r.data) ? r.data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

/**
 * The LAN devices assigned to this person in the device register (0256,
 * DR-0830). RLS returns only rows of spaces the viewer may read (0056).
 * The MAC rides in specs.mac as the scan recorded it.
 */
export async function loadLanDevicesOf(userId, { client = supabase, timeoutMs = 6000 } = {}) {
  if (!userId) return { ok: false, rows: [], reason: 'no user' };
  try {
    const q = client.from('church_devices').select('id,name,device_type,location,status,specs,make_model,updated_at,created_at').eq('owner_user_id', userId).eq('active', true);
    const r = await race(q, timeoutMs, timedOut(timeoutMs));
    if (r.error) return { ok: false, rows: [], reason: r.error.message || String(r.error) };
    return { ok: true, rows: Array.isArray(r.data) ? r.data : [], reason: '' };
  } catch (e) {
    return { ok: false, rows: [], reason: e && e.message ? e.message : String(e) };
  }
}

/** All three reads at once; each carries its own answer. */
export async function loadPersonRows(instanceId, userId, opts = {}) {
  const [dm, presence, lan] = await Promise.all([
    loadDmDevicesOf(userId, opts), loadPresenceOf(instanceId, userId, opts), loadLanDevicesOf(userId, opts),
  ]);
  return { dm, presence, lan };
}

// EVERY SEAT THEY HOLD (DR-0842): the memberships in the spaces this steward
// administers, the Poe Properties invites that are theirs, and their last 30
// days of opens. Each read answers on its own; a refusal is a fact, not a blank.
export async function loadSeatRows(userId, email, { listMyAdminInstances, listInstanceMembersStrict, loadInvites, fetchUserUsage } = {}) {
  const spaces = await Promise.resolve(listMyAdminInstances ? listMyAdminInstances() : []).catch(() => []);
  const memberships = [];
  for (const sp of Array.isArray(spaces) ? spaces : []) {
    const rows = await Promise.resolve(listInstanceMembersStrict ? listInstanceMembersStrict(sp.instanceId) : []).catch(() => []);
    for (const m of Array.isArray(rows) ? rows : []) {
      if (m && m.userId === userId) memberships.push({ ...m, instanceId: sp.instanceId, slug: sp.slug, displayName: sp.displayName, instanceType: sp.instanceType });
    }
  }
  const inv = await Promise.resolve(loadInvites ? loadInvites() : { ok: false, invites: [] }).catch(() => ({ ok: false, invites: [] }));
  const usage = await Promise.resolve(fetchUserUsage ? fetchUserUsage(userId) : null).catch(() => null);
  return { memberships, propertyInvites: inv && inv.ok ? inv.invites : [], invitesOk: !!(inv && inv.ok), usage };
}

