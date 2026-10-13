// =============================================================================
// transaction-noise-sync — sovereign persistence for "mark as noise" (DR-0218)
// =============================================================================
// The sovereign replacement for the retired n8n mark-noise webhook: a
// noise flag now persists to the RLS-scoped transaction_noise table (migration
// 0127, isolation-proven in tests/0127-*-smoke.sql), scoped to the caller's
// instance via the SAME join_default_instance resolver the transactions ledger
// uses (getInstanceId) so noise lands in the same tenant as the rows it hides.
// Thin I/O; RLS is the real gate. Honest {ok, reason} so the surface degrades
// truthfully (local-only) when signed out, never a false "saved".
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';

async function currentUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

/** All noise flags for the caller's instance (fitids), newest first. */
export async function loadNoiseFlags() {
  const uid = await currentUserId();
  if (!uid) return { ok: false, reason: 'signed-out', fitids: [] };
  let instanceId;
  try { instanceId = await getInstanceId(); } catch (e) { return { ok: false, reason: e.message, fitids: [] }; }
  const { data, error } = await supabase
    .from('transaction_noise')
    .select('institution, fitid')
    .eq('instance_id', instanceId)
    .limit(5000);
  if (error) return { ok: false, reason: error.message, fitids: [] };
  return { ok: true, reason: '', fitids: (data || []).map((r) => r.fitid) };
}

/** Persist one noise flag. Returns {ok, reason}; caller keeps optimistic UI. */
export async function addNoiseFlag({ institution, fitid, reason = 'pwa-tx-mark-noise' }) {
  if (!institution || !fitid) return { ok: false, reason: 'missing-institution-or-fitid' };
  const uid = await currentUserId();
  if (!uid) return { ok: false, reason: 'signed-out' };
  let instanceId;
  try { instanceId = await getInstanceId(); } catch (e) { return { ok: false, reason: e.message }; }
  const { error } = await supabase
    .from('transaction_noise')
    .upsert({ instance_id: instanceId, institution, fitid, reason, created_by: uid },
            { onConflict: 'instance_id,institution,fitid' });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, reason: '' };
}

/** Un-mark (correct a mistaken flag). */
export async function removeNoiseFlag({ institution, fitid }) {
  const uid = await currentUserId();
  if (!uid) return { ok: false, reason: 'signed-out' };
  let instanceId;
  try { instanceId = await getInstanceId(); } catch (e) { return { ok: false, reason: e.message }; }
  const { error } = await supabase
    .from('transaction_noise')
    .delete()
    .eq('instance_id', instanceId).eq('institution', institution).eq('fitid', fitid);
  if (error) return { ok: false, reason: error.message };
  return { ok: true, reason: '' };
}
