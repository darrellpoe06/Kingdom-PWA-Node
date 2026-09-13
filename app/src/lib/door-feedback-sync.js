// =============================================================================
// door-feedback-sync — a customer tells a business its door is broken
// =============================================================================
// 0216 / DR-0376. Sterling Moore's order inquiry failed on every attempt for
// the whole life of the Moore Divahs door, and the only reason anyone ever
// found out is that he told Shay and she told Darrell. Her door had no way to
// report anything: `grep -i feedback` over MooreDoor.jsx returned nothing.
//
// THE ONE PROPERTY THAT DECIDES THIS MODULE'S SHAPE: the person most likely to
// meet a broken door is SIGNED OUT. So submit() never touches the session --
// door_feedback_submit is SECURITY DEFINER and anon-callable, and records
// auth.uid() as a nullable author rather than using it as a gate. The existing
// channels both fail that test, which is why neither is reused: feedback-sync
// requires sign-in and enrols the writer into 'poe-family'; send_business_message
// raises 'not authenticated' when auth.uid() is null.
//
// The AREAS vocabulary lives HERE and nowhere else. 0216 deliberately does not
// allowlist it in SQL -- a second hand-maintained registry is exactly what
// 0215 cost us, when crm_capture_lead's pipeline list and crm-engine.js
// disagreed and every order was refused for months.
// =============================================================================
import supabase from './supabase.js';

// What a customer can point at. Order is the reading order on the form; 'other'
// stays last because it is the fallback, not a category.
export const DOOR_FEEDBACK_AREAS = [
  { id: 'order',    label: 'Placing an order' },
  { id: 'classes',  label: 'Classes' },
  { id: 'gallery',  label: 'The gallery' },
  { id: 'messages', label: 'Messages' },
  { id: 'account',  label: 'Signing in / my account' },
  { id: 'other',    label: 'Something else' },
];

export function isValidArea(id) {
  return DOOR_FEEDBACK_AREAS.some((a) => a.id === id);
}

// The build the customer is actually on, when the bundle carries it. Not
// identifying, and it is the difference between "it is broken" and "it was
// broken on that deploy".
function buildVersion() {
  try {
    const v = import.meta.env?.VITE_BUILD_SHA || import.meta.env?.VITE_GITHUB_SHA;
    return v ? String(v).slice(0, 64) : null;
  } catch { return null; }
}

// Returns { ok } or { ok:false, error }. NEVER throws -- a report that fails
// must render a failure the customer can act on, not crash the door they were
// already struggling with (the exact lesson of 0215's silent retry line).
export async function submitDoorFeedback(doorSlug, instanceSlug, { area, body, contact } = {}) {
  const text = String(body || '').trim();
  if (!text) return { ok: false, error: { message: 'empty' } };
  const { data, error } = await supabase.rpc('door_feedback_submit', {
    p_door_slug: doorSlug,
    p_instance_slug: instanceSlug,
    p_payload: {
      area: isValidArea(area) ? area : 'other',
      body: text,
      contact: String(contact || '').trim() || null,
      appVersion: buildVersion(),
    },
  });
  if (error) { console.warn('[door-feedback] not filed:', error); return { ok: false, error }; }
  return { ok: true, id: data };
}

// The office side. RLS is the real gate (owner/admin of THAT instance); this
// read carries no role check of its own, because a client-side one would be
// decoration and a second place to drift.
export async function fetchDoorFeedback(instanceSlug, { limit = 100 } = {}) {
  const { data: inst, error: instErr } = await supabase
    .from('instances').select('id').eq('slug', instanceSlug).maybeSingle();
  if (instErr || !inst) return { ok: false, rows: [], error: instErr || { message: 'unknown instance' } };
  const { data, error } = await supabase
    .from('door_feedback')
    .select('id, door_slug, area, body, contact, submitted_by, app_version, status, office_note, created_at')
    .eq('instance_id', inst.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, rows: [], error };
  return { ok: true, rows: data || [] };
}

export async function setDoorFeedbackStatus(id, status, officeNote = null) {
  const patch = { status };
  if (officeNote !== null) patch.office_note = officeNote;
  const { error } = await supabase.from('door_feedback').update(patch).eq('id', id);
  return error ? { ok: false, error } : { ok: true };
}

// Pure. The office's own triage order: what nobody has looked at yet, first --
// and within that, oldest first, because the person who has been waiting
// longest is the one most likely to have given up.
export function triageOrder(rows = []) {
  const rank = { new: 0, reading: 1, answered: 2, closed: 3 };
  return [...(rows || [])].sort((a, b) => {
    const ra = rank[a?.status] ?? 9;
    const rb = rank[b?.status] ?? 9;
    if (ra !== rb) return ra - rb;
    return String(a?.created_at || '').localeCompare(String(b?.created_at || ''));
  });
}

// Pure. How many still need a human. The badge the steward board shows.
export function unhandledCount(rows = []) {
  return (rows || []).filter((r) => r && (r.status === 'new' || r.status === 'reading')).length;
}
