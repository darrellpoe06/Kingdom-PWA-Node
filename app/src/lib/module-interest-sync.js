// =============================================================================
// module-interest-sync — module priority votes pool to the family instance
// =============================================================================
// 2026-07-05 live-data rails: the About tab said the roadmap is shaped by "the
// aggregate of family priority votes" while every vote lived in one device's
// localStorage — the one painted claim on that surface (DR-0076). This rail
// makes the claim true: one row per (instance, user, module) in
// `module_interest` (0077), so each member's votes follow their sign-in AND
// the family aggregate is a real cross-member count, not a mirage.
//
// Local shape stays what About/ModuleCard already render:
//   data.moduleInterest = { [moduleKey]: { signedAt, priority } }   (MY votes)
// and the new family aggregate rides alongside:
//   { [moduleKey]: { votes, points, latestAt } }                    (ALL votes)
// Fail-soft everywhere: signed out or pre-migration, calls skip and the
// device-local map keeps working exactly as before.
import supabase from './supabase.js';
import { getInstanceId } from './table-sync.js';

const TABLE = 'module_interest';

const PRIORITY_POINTS = { critical: 5, important: 3, nice: 1 };

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// Pure: reduce the instance's vote rows to (a) the signed-in user's own map
// (the shape toggleModuleInterest keeps locally) and (b) the family aggregate.
// Exported for tests.
export function reduceInterestRows(rows = [], userId = null) {
  const mine = {};
  const family = {};
  for (const row of rows) {
    if (!row || !row.module_key) continue;
    const priority = row.priority || 'nice';
    const signedAt = row.signed_at || row.created_at || null;
    if (userId && row.created_by === userId) {
      mine[row.module_key] = { signedAt, priority };
    }
    const agg = family[row.module_key] || { votes: 0, points: 0, latestAt: null };
    agg.votes += 1;
    agg.points += PRIORITY_POINTS[priority] || 1;
    if (!agg.latestAt || (signedAt && signedAt > agg.latestAt)) agg.latestAt = signedAt;
    family[row.module_key] = agg;
  }
  return { mine, family };
}

async function fetchRows() {
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    console.warn('[module-interest-sync] tenant lookup failed:', e);
    return null;
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select('module_key, priority, signed_at, created_by, created_at')
    .eq('instance_id', tenantId);
  if (error) {
    console.warn('[module-interest-sync] fetch failed:', error);
    return null;
  }
  return data || [];
}

// Upsert the caller's vote for one module. The (instance, user, module) unique
// index makes this idempotent — re-voting changes priority, never duplicates.
export async function pushModuleInterest(moduleKey, { priority = 'nice', signedAt = null } = {}) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    return { skipped: 'no-tenant', error: e };
  }
  const { error } = await supabase
    .from(TABLE)
    .upsert(
      {
        instance_id: tenantId,
        created_by: session.user.id,
        module_key: moduleKey,
        priority,
        signed_at: signedAt || new Date().toISOString(),
      },
      { onConflict: 'instance_id,created_by,module_key' }
    );
  if (error) {
    console.warn('[module-interest-sync] upsert failed:', error);
    return { skipped: 'upsert-error', error };
  }
  return { pushed: true };
}

// Remove the caller's own vote for one module (RLS restricts to own rows).
export async function clearModuleInterest(moduleKey) {
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  let tenantId;
  try {
    tenantId = await getInstanceId();
  } catch (e) {
    return { skipped: 'no-tenant', error: e };
  }
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('instance_id', tenantId)
    .eq('created_by', session.user.id)
    .eq('module_key', moduleKey);
  if (error) {
    console.warn('[module-interest-sync] delete failed:', error);
    return { skipped: 'delete-error', error };
  }
  return { deleted: true };
}

// Push every local vote the cloud doesn't hold yet (first sign-in), then
// stream: onRemote({ mine, family }) fires on connect and after every change.
export function subscribeModuleInterest(onRemote, { localVotes = {} } = {}) {
  let channel = null;
  let cancelled = false;
  const refresh = async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const rows = await fetchRows();
    if (rows && !cancelled) onRemote(reduceInterestRows(rows, session.user.id));
  };
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    // Initial push: local device votes that predate sync land as the user's
    // rows (upsert — never duplicates, never overwrites a NEWER cloud vote
    // shape since priority is the whole payload and the local one is the
    // user's latest expressed intent on this device).
    const rows = await fetchRows();
    if (rows) {
      const remoteMine = new Set(
        rows.filter((r) => r.created_by === session.user.id).map((r) => r.module_key)
      );
      for (const [moduleKey, val] of Object.entries(localVotes || {})) {
        if (!remoteMine.has(moduleKey)) {
          await pushModuleInterest(moduleKey, {
            priority: (typeof val === 'object' && val?.priority) || 'nice',
            signedAt: (typeof val === 'object' && val?.signedAt) || null,
          });
        }
      }
    }
    await refresh();
    let tenantId = null;
    try { tenantId = await getInstanceId(); } catch (_) { /* fetch stays scoped */ }
    if (cancelled) return;
    channel = supabase
      .channel(`${TABLE}-stream`)
      .on(
        'postgres_changes',
        {
          event: '*', schema: 'public', table: TABLE,
          ...(tenantId ? { filter: `instance_id=eq.${tenantId}` } : {}),
        },
        () => { refresh(); }
      )
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}
