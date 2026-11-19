// =============================================================================
// worker-reach-cloud — the rows "why isn't he getting them?" is read from
// =============================================================================
// The owner reads every grant in his instance (0075 delegated_capabilities_read)
// and every work order (0150/0260). Never throws; a failed read is a failure,
// never an empty list (DR-0876), so the screen says "unknown" instead of
// concluding a worker holds nothing (DR-1594).
// =============================================================================
import supabase from '../../lib/supabase.js';
import { loadAllWorkOrders } from './cloud.js';

const LIMIT_MS = 8000;
const bounded = (p) => Promise.race([p, new Promise((resolve) => setTimeout(() => resolve({ ok: false, reason: 'timeout' }), LIMIT_MS))]);

/** The 1099 workers' grants in one instance. */
export async function loadWorkerGrants(instanceId, client = supabase) {
  if (!instanceId) return { ok: false, reason: 'no-space' };
  try {
    const res = await bounded(
      client
        .from('delegated_capabilities')
        .select('grantee_user_id, scope_ref, capability, setting, role_label')
        .eq('instance_id', instanceId)
        .eq('role_label', 'field_worker')
    );
    if (!res || res.ok === false) return { ok: false, reason: (res && res.reason) || 'read-failed' };
    if (res.error) return { ok: false, reason: 'read-failed' };
    return { ok: true, grants: res.data || [] };
  } catch {
    return { ok: false, reason: 'unexpected' };
  }
}

/** Both reads at once: grants and work orders, each null when it could not be read. */
export async function loadWorkerReach(instanceId, { grants = loadWorkerGrants, work = loadAllWorkOrders } = {}) {
  const [g, w] = await Promise.all([grants(instanceId), bounded(work())]);
  return {
    grants: g && g.ok ? g.grants : null,
    jobs: w && w.ok ? (w.requests || []).filter((r) => !instanceId || r.instance_id === instanceId) : null,
  };
}
