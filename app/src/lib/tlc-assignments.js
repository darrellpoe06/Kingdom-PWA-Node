// =============================================================================
// tlc-assignments — a therapist schedules a lesson for a client (DR-0345)
// =============================================================================
// The seam over tlc_lesson_assignments (0189). The therapist's calls are
// scoped by the office instance; the client's read is by the email on their
// session, so a client who is not an office member still sees what was
// assigned to them. Bounded by a timeout, fail-soft, no PHI.
import supabase from './supabase.js';
import { tlcError } from './tlc-error.js';
import { getInstanceId } from './table-sync.js';
import { normalizeEmail, validAssignment, splitAssignments } from './tlc-assignments-core.js';
export { normalizeEmail, validAssignment, splitAssignments };

export const ASSIGN_TIMEOUT_MS = 10000;
function bounded(p, ms, what) {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} took longer than ${Math.round(ms / 1000)}s`)), ms); })]).finally(() => clearTimeout(t));
}
const fail = (reason, message) => ({ ok: false, reason, message });
const COLS = 'id,client_email,therapist_email,lesson_id,lesson_title,track,note,due_on,status,reviewed_at,created_at,updated_at';

// The therapist assigns a lesson to a client.
export async function assignLesson({ clientEmail, lesson, track = 'client', dueOn = null, note = '' }) {
  const problems = validAssignment({ clientEmail, lesson, dueOn, note });
  if (problems.length) return fail('invalid', `Still needed: ${problems.join(', ')}.`);
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return fail('no-instance', 'Sign in to the office to assign a lesson.');
    const row = { instance_id: instanceId, office_id: 'tlc', client_email: normalizeEmail(clientEmail), lesson_id: lesson.id, lesson_title: lesson.title, track, note: note || null, due_on: dueOn || null };
    const { data, error } = await bounded(supabase.from('tlc_lesson_assignments').insert(row).select(COLS).single(), ASSIGN_TIMEOUT_MS, 'assigning the lesson');
    if (error) return fail('write-error', tlcError(error));
    return { ok: true, row: data };
  } catch (e) { return fail('network-error', tlcError(e)); }
}

// What this therapist has assigned, newest first.
export async function listMyAssignments() {
  try {
    const instanceId = await getInstanceId();
    if (!instanceId) return { ok: false, reason: 'no-instance', rows: [] };
    const { data, error } = await bounded(supabase.from('tlc_lesson_assignments').select(COLS).eq('instance_id', instanceId).order('created_at', { ascending: false }).limit(200), ASSIGN_TIMEOUT_MS, 'reading assignments');
    if (error) return { ok: false, reason: 'read-error', message: tlcError(error), rows: [] };
    return { ok: true, rows: data || [] };
  } catch (e) { return { ok: false, reason: 'network-error', message: tlcError(e), rows: [] }; }
}

// What was assigned to the signed-in person (RLS matches their session email).
export async function listAssignedToMe() {
  try {
    const { data, error } = await bounded(supabase.from('tlc_lesson_assignments').select(COLS).order('due_on', { ascending: true, nullsFirst: false }).limit(100), ASSIGN_TIMEOUT_MS, 'reading your lessons');
    if (error) return { ok: false, reason: 'read-error', message: tlcError(error), rows: [] };
    return { ok: true, rows: data || [] };
  } catch (e) { return { ok: false, reason: 'network-error', message: tlcError(e), rows: [] }; }
}

export async function markReviewed(id, reviewed = true) {
  try {
    const patch = reviewed ? { status: 'reviewed', reviewed_at: new Date().toISOString() } : { status: 'assigned', reviewed_at: null };
    const { error } = await bounded(supabase.from('tlc_lesson_assignments').update(patch).eq('id', id), ASSIGN_TIMEOUT_MS, 'saving the review');
    if (error) return fail('write-error', tlcError(error));
    return { ok: true };
  } catch (e) { return fail('network-error', tlcError(e)); }
}

export async function removeAssignment(id) {
  try {
    const { error } = await bounded(supabase.from('tlc_lesson_assignments').delete().eq('id', id), ASSIGN_TIMEOUT_MS, 'removing the assignment');
    if (error) return fail('write-error', tlcError(error));
    return { ok: true, removed: true };
  } catch (e) { return fail('network-error', tlcError(e)); }
}
