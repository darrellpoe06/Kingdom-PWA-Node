// =============================================================================
// tlc-launch-sync — the office's launch-task statuses (tlc_office_tasks, 0188)
// =============================================================================
// Reads the office's rows through RLS (the member policies decide), upserts a
// status per task key, bounded by a timeout, fail-soft. The task list itself
// is data (lib/tlc-launch-plan.js); this only carries the office's status.
import supabase from './supabase.js';
import { tlcError } from './tlc-error.js';
import { getOfficeInstanceId } from './table-sync.js'; // the office's own instance (0193), never the family
import { normalizeStatus } from './tlc-launch-plan.js';

export const LAUNCH_TIMEOUT_MS = 10000;
function bounded(p, ms, what) {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${what} took longer than ${Math.round(ms / 1000)}s`)), ms); })]).finally(() => clearTimeout(t));
}

// { ok, statuses: { [taskKey]: { status, note, updatedAt } } }
export async function loadLaunchStatuses(officeId = 'tlc') {
  try {
    const instanceId = await getOfficeInstanceId();
    if (!instanceId) return { ok: false, reason: 'no-instance', statuses: {} };
    const { data, error } = await bounded(
      supabase.from('tlc_office_tasks').select('task_key,status,note,updated_at').eq('instance_id', instanceId).eq('office_id', officeId),
      LAUNCH_TIMEOUT_MS, 'reading the launch board');
    if (error) return { ok: false, reason: 'read-error', message: tlcError(error), statuses: {} };
    const statuses = {};
    for (const r of data || []) statuses[r.task_key] = { status: normalizeStatus(r.status), note: r.note || '', updatedAt: r.updated_at };
    return { ok: true, statuses };
  } catch (e) { return { ok: false, reason: 'network-error', message: tlcError(e), statuses: {} }; }
}

export async function setLaunchStatus(taskKey, status, { note = null, officeId = 'tlc' } = {}) {
  try {
    const instanceId = await getOfficeInstanceId();
    if (!instanceId) return { ok: false, reason: 'no-instance', message: 'Sign in to the office to update the board.' };
    const { data: sess } = await supabase.auth.getSession();
    const row = { instance_id: instanceId, office_id: officeId, task_key: taskKey, status: normalizeStatus(status), note, updated_by: sess?.session?.user?.id || null, updated_at: new Date().toISOString(), done_at: status === 'done' ? new Date().toISOString() : null };
    const { error } = await bounded(supabase.from('tlc_office_tasks').upsert(row, { onConflict: 'instance_id,office_id,task_key' }), LAUNCH_TIMEOUT_MS, 'saving the board');
    if (error) return { ok: false, reason: 'write-error', message: tlcError(error) };
    return { ok: true };
  } catch (e) { return { ok: false, reason: 'network-error', message: tlcError(e) }; }
}
