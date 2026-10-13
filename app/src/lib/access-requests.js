// =============================================================================
// access-requests — asking the office for a tab, and the office deciding (0211)
// =============================================================================
// Darrell 2026-09-11: "each user will be able to be upgraded based on checking
// another access these tabs type functionality for the office staff and tech
// team to give access based on BG and have an request and approval process for
// changing or giving access to the tabs that are staff and work related"
//
// BG is Bishop Gwin (bg@thechurchofthelivinggod.com) — already the whole church
// staff allowlist, and the person named as the gate.
//
// THE ONE THING THIS MODULE MUST NEVER DO is let a surface claim a request was
// approved when nothing was granted. 0211 puts the grant INSIDE the decision
// (through 0126's guarded set_member_capability), so a decision that cannot
// grant raises and writes nothing at all. This seam therefore has no "mark
// approved" call to reach for, by design — there is only `decide`.
//
// GRANTING OPENS EVERY STAFF TAB, NOT JUST THE ONE ASKED FOR. Every staff
// church surface gates on the same predicate today, so one key is what actually
// exists. A key per tab would be a promise the app cannot keep. The request
// still names the surface, so the office sees what was wanted — and the copy
// below says the rest out loud rather than letting somebody find out.
// =============================================================================
import supabase from './supabase.js';

export const RPC_TIMEOUT_MS = 15000;

/** The one capability a staff-tab request asks for. Mirrors 0211's allowlist. */
export const STAFF_CAPABILITY = 'see:church-staff';

/** Said in the surface, because a grant that quietly does more is a surprise. */
export const GRANT_IS_ALL_STAFF_TABS =
  'Approving this opens every staff tab, not only the one asked for — those tabs all share one key today, and the app will not pretend otherwise.';

export const REQUEST_STATES = Object.freeze({
  open: { id: 'open', label: 'Waiting on the office', tone: 'waiting' },
  granted: { id: 'granted', label: 'Granted', tone: 'good' },
  refused: { id: 'refused', label: 'Not this one', tone: 'plain' },
  withdrawn: { id: 'withdrawn', label: 'Withdrawn', tone: 'plain' },
});

function withTimeout(promise, ms, what) {
  let t;
  const timer = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(t));
}
function message(error) {
  const raw = String((error && (error.message || error.msg)) || error || '').replace(/^.*?:\s*/, '');
  return raw || 'That did not go through.';
}
function fail(reason, msg) { return { ok: false, reason, message: msg }; }

async function rpc(name, args, what) {
  try {
    const { data, error } = await withTimeout(supabase.rpc(name, args), RPC_TIMEOUT_MS, what);
    if (error) return { ok: false, reason: 'rpc-error', message: message(error) };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, reason: 'network-error', message: message(e) };
  }
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return (data && data.user && data.user.id) || null;
}

const fromRow = (r) => ({
  id: r.id,
  userId: r.user_id,
  displayName: r.display_name || '',
  email: r.email || '',
  memberRole: r.member_role || '',
  surfaceId: r.surface_id,
  surfaceLabel: r.surface_label || r.surface_id,
  capability: r.capability,
  reason: r.reason || '',
  status: r.status,
  decidedBy: r.decided_by || null,
  decidedAt: r.decided_at || null,
  decisionNote: r.decision_note || '',
  createdAt: r.created_at,
  alreadyGranted: r.already_granted === true,
});

/** My own church membership and my own capabilities — what the app may draw. */
export async function myChurchAccess() {
  const res = await rpc('my_church_access', {}, 'checking what you can open');
  if (!res.ok) return { ok: false, message: res.message, instanceId: null, role: '', capabilities: [] };
  const d = res.data || {};
  return {
    ok: true,
    instanceId: d.instance_id || null,
    instanceSlug: d.instance_slug || '',
    role: d.role || '',
    capabilities: Array.isArray(d.capabilities) ? d.capabilities : [],
  };
}

/** Ask the office for a tab. One open ask per tab — asking twice is still waiting. */
export async function askForAccess({ instanceId, surfaceId, surfaceLabel = '', reason = '', capability = STAFF_CAPABILITY }) {
  if (!instanceId) return fail('no-instance', 'This app cannot tell which church you belong to yet.');
  if (!String(surfaceId || '').trim()) return fail('no-surface', 'Nothing to ask about.');
  const userId = await currentUserId();
  if (!userId) return fail('signed-out', 'Sign in first.');
  try {
    const { data, error } = await withTimeout(
      supabase.from('access_requests').insert({
        instance_id: instanceId, user_id: userId,
        surface_id: surfaceId, surface_label: surfaceLabel || surfaceId,
        capability, reason: String(reason || '').trim() || null,
      }).select().single(),
      RPC_TIMEOUT_MS, 'sending your request');
    if (error) {
      // The one-open-ask index. Not an error a person needs to see as one.
      if (/duplicate key|unique/i.test(String(error.message || ''))) {
        return fail('already-asked', 'You have already asked for this one — it is still with the office.');
      }
      return fail('rpc-error', message(error));
    }
    return { ok: true, row: fromRow(data) };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/** My own asks, whatever their state. RLS returns mine and nobody else's. */
export async function myAccessRequests(instanceId = null) {
  try {
    let q = supabase.from('access_requests')
      .select('id, instance_id, user_id, surface_id, surface_label, capability, reason, status, decided_by, decided_at, decision_note, created_at')
      .order('created_at', { ascending: false });
    if (instanceId) q = q.eq('instance_id', instanceId);
    const { data, error } = await withTimeout(q, RPC_TIMEOUT_MS, 'reading your requests');
    if (error) return { ok: false, message: message(error), rows: [] };
    return { ok: true, rows: (data || []).map(fromRow) };
  } catch (e) {
    return { ok: false, message: message(e), rows: [] };
  }
}

/** Take back an open ask. Yours to withdraw; a decided one stays on the record. */
export async function withdrawAccessRequest(id) {
  try {
    const { error } = await withTimeout(
      supabase.from('access_requests').delete().eq('id', id), RPC_TIMEOUT_MS, 'withdrawing your request');
    if (error) return fail('rpc-error', message(error));
    return { ok: true, withdrawn: true };
  } catch (e) {
    return fail('network-error', message(e));
  }
}

/** The office queue. Owner/admin only — the server decides, not this. */
export async function accessRequestQueue(instanceId = null) {
  const res = await rpc('access_request_queue', { instance_in: instanceId }, 'opening the access queue');
  if (!res.ok) return { ...res, rows: [], open: 0 };
  const d = res.data || {};
  return { ok: true, rows: (d.rows || []).map(fromRow), open: d.open || 0, instanceId: d.instance_id || null };
}

/**
 * Decide one request. An approval GRANTS — there is no separate "now actually
 * give it to them" step to forget, and no way to mark one granted without the
 * grant happening.
 */
export async function decideAccessRequest(id, decision, note = '') {
  if (!['granted', 'refused'].includes(decision)) return fail('bad-decision', 'A decision is granted or refused.');
  const res = await rpc('access_request_decide',
    { request_in: id, decision_in: decision, note_in: note || null }, 'recording the decision');
  if (!res.ok) return res;
  return { ok: true, decision: res.data };
}

/** How the queue stands. Counts only — the office is looking at names already. */
export function queueSummary(rows = []) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return {
    total: list.length,
    open: list.filter((r) => r.status === 'open').length,
    granted: list.filter((r) => r.status === 'granted').length,
    refused: list.filter((r) => r.status === 'refused').length,
    // The surfaces people are actually asking for, most-asked first. This is
    // the same shape as the feedback clustering: what the congregation keeps
    // reaching for is what the house should look at.
    bySurface: Object.entries(
      list.reduce((m, r) => { m[r.surfaceLabel || r.surfaceId] = (m[r.surfaceLabel || r.surfaceId] || 0) + 1; return m; }, {}),
    ).sort((a, b) => b[1] - a[1]).map(([label, n]) => ({ label, n })),
  };
}
