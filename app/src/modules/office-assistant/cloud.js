// =============================================================================
// office-assistant/cloud — cross-device sync for the office workspace
// =============================================================================
// The store's own header promised it: "Device-local for now ... a Supabase
// table sync per office instance is the wired follow-up." This is that wire
// (DR-0271, Christina 2026-08-04: her assistant must SEE the same workspace
// she sees). One office = one instance's slice of the office_records table
// (migration 0130): orgs / posts / ideas one jsonb row each (slug = the local
// id), the schedule as ONE row (kind 'schedule', payload.blocks — the store
// persists the whole list wholesale, the row mirrors that authority).
//
// Sync contract (the proven table-sync posture, purpose-built for the
// multi-kind shape):
//   * SEED/SAMPLE rows are NEVER uploaded (isSeedId) — every cloud row is a
//     real record (DR-0061). Seeds keep merging in locally as the baseline.
//   * Cloud is authoritative for synced rows; a never-uploaded local record
//     (no remoteUuid) survives every merge and uploads on the next sign-in.
//   * All methods are fail-soft no-ops signed out — the workspace keeps
//     working from localStorage alone (DR-0076: honest, never blocking).
//   * Realtime: one channel per office, debounced refetch, reconnect-resync
//     (the A4/A5 lessons, reused from table-sync's exported helpers).
// =============================================================================
import supabase from '../../lib/supabase.js';
import { onAuthChange } from '../../lib/supabase.js';
import { createDebouncer, shouldResyncOnStatus, getInstanceId } from '../../lib/table-sync.js';
import { withUploadRetry } from '../../lib/upload-retry.js';
import { isSeedId } from './model.js';

const TABLE = 'office_records';
const KINDS = ['org', 'post', 'idea'];
const KIND_OF_LIST = { orgs: 'org', posts: 'post', ideas: 'idea' };
const LIST_OF_KIND = { org: 'orgs', post: 'posts', idea: 'ideas' };

// The payload is the local item minus sync bookkeeping (remoteUuid lives on
// the row id, not inside it).
function cleanPayload(item) {
  const { remoteUuid, ...rest } = item || {};
  return rest;
}

async function currentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch { return null; }
}

export function createOfficeCloud(config) {
  let cachedTenantId = null;
  async function tenantIdCached() {
    if (!cachedTenantId) cachedTenantId = await getInstanceId();
    return cachedTenantId;
  }

  function toRow(kind, item, { tenantId, userId }) {
    return {
      instance_id: tenantId,
      created_by: userId,
      office_id: config.id,
      kind,
      slug: kind === 'schedule' ? 'schedule' : String(item.id || ''),
      payload: cleanPayload(item),
    };
  }

  // row -> { kind, item } (item keeps its ORIGINAL local id via slug; the
  // cloud row uuid rides along as remoteUuid, like the practice-leads shape).
  function fromRow(row) {
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    return {
      kind: row.kind,
      item: { ...payload, id: payload.id || row.slug, remoteUuid: row.id },
    };
  }

  // Paginated full fetch of THIS office's rows in the caller's instance
  // (PostgREST caps a response at 1,000 rows — the transactions lesson).
  async function fetchAll() {
    const session = await currentSession();
    if (!session) return null;
    let tenantId;
    try { tenantId = await tenantIdCached(); } catch (e) {
      console.warn('[office-cloud] tenant lookup failed:', e);
      return null;
    }
    const PAGE = 1000;
    const rows = [];
    for (let from = 0; from < 100000; from += PAGE) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('instance_id', tenantId)
        .eq('office_id', config.id)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.warn(`[office-cloud:${config.id}] fetch failed at offset ${from}:`, error);
        return from === 0 ? null : rows;
      }
      const batch = data || [];
      rows.push(...batch);
      if (batch.length < PAGE) break;
    }
    return rows;
  }

  // rows -> the partitioned remote snapshot the store merges:
  // { orgs, posts, ideas, schedule } (schedule = blocks list or null).
  function partition(rows) {
    const out = { orgs: [], posts: [], ideas: [], schedule: null };
    for (const row of rows || []) {
      const { kind, item } = fromRow(row);
      if (kind === 'schedule') {
        const blocks = Array.isArray(item.blocks) ? item.blocks : null;
        if (blocks) out.schedule = { blocks, remoteUuid: item.remoteUuid };
      } else if (LIST_OF_KIND[kind]) {
        out[LIST_OF_KIND[kind]].push(item);
      }
    }
    return out;
  }

  // --- outbound (called by the store after each local mutation) --------------

  // Add: upload one real (non-seed) record; stamp(remoteUuid) on success so
  // later edits patch the same row.
  async function onAdd(kind, item, stamp) {
    if (!item || isSeedId(item.id)) return { skipped: 'seed' };
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    let tenantId;
    try { tenantId = await tenantIdCached(); } catch (e) { return { skipped: 'no-tenant', error: e }; }
    const row = toRow(kind, item, { tenantId, userId: session.user.id });
    const { data, error } = await withUploadRetry(() =>
      supabase.from(TABLE).insert(row).select().single());
    if (error) {
      console.warn(`[office-cloud:${config.id}] upload failed:`, error);
      return { skipped: 'insert-error', error };
    }
    if (typeof stamp === 'function') stamp(kind, item.id, data.id);
    return { uploaded: true, remoteUuid: data.id };
  }

  // Update: patch the synced row's payload. A not-yet-synced record uploads
  // instead (its edit rides along), so an offline add + edit never diverges.
  async function onUpdate(kind, item, stamp) {
    if (!item || isSeedId(item.id)) return { skipped: 'seed' };
    if (!item.remoteUuid) return onAdd(kind, item, stamp);
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    const { error } = await supabase
      .from(TABLE)
      .update({ payload: cleanPayload(item), updated_at: new Date().toISOString() })
      .eq('id', item.remoteUuid);
    if (error) {
      console.warn(`[office-cloud:${config.id}] update failed:`, error);
      return { skipped: 'update-error', error };
    }
    return { updated: true };
  }

  // The schedule syncs WHOLESALE as one row (upsert on the unique slug) —
  // exactly the store's own authority model for it.
  async function onScheduleReplace(blocks) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    let tenantId;
    try { tenantId = await tenantIdCached(); } catch (e) { return { skipped: 'no-tenant', error: e }; }
    const row = toRow('schedule', { blocks: (blocks || []).map(cleanPayload) }, { tenantId, userId: session.user.id });
    const { error } = await withUploadRetry(() =>
      supabase.from(TABLE).upsert(row, { onConflict: 'instance_id,office_id,kind,slug' }));
    if (error) {
      console.warn(`[office-cloud:${config.id}] schedule upsert failed:`, error);
      return { skipped: 'upsert-error', error };
    }
    return { uploaded: true };
  }

  // --- inbound (initial sync + realtime) -------------------------------------

  // Push every local real record the cloud doesn't have yet, then hand back
  // the merged remote snapshot (the caller merges it into the store).
  async function initialSync(state, stamp) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    const rows = await fetchAll();
    if (rows == null) return { skipped: 'fetch-failed' };
    const remoteIds = new Set(rows.map((r) => `${r.kind}|${r.slug}`));
    for (const listKey of Object.keys(KIND_OF_LIST)) {
      const kind = KIND_OF_LIST[listKey];
      for (const item of state?.[listKey] || []) {
        // Synced-elsewhere rows (remoteUuid) and seeds never re-upload; a
        // remote row with the same slug already covers the id.
        if (!item || item.remoteUuid || isSeedId(item.id)) continue;
        if (remoteIds.has(`${kind}|${item.id}`)) continue;
        await onAdd(kind, item, stamp);
      }
    }
    const merged = await fetchAll();
    return { merged: partition(merged || rows) };
  }

  // Fetch + realtime-subscribe. onRemote(partitioned) fires with the full
  // remote snapshot each time it changes. Returns an unsubscribe fn.
  function subscribe(onRemote) {
    let channel = null;
    let cancelled = false;
    const refresh = () => {
      fetchAll().then((rows) => {
        if (rows && !cancelled) onRemote(partition(rows));
      });
    };
    const debouncedRefresh = createDebouncer(refresh, 400);
    const statusState = { everSubscribed: false };
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      refresh();
      let tenantId = null;
      try { tenantId = await tenantIdCached(); } catch { /* fetchAll still scopes */ }
      if (cancelled) return;
      channel = supabase
        .channel(`${TABLE}-${config.id}-stream`)
        .on(
          'postgres_changes',
          {
            event: '*', schema: 'public', table: TABLE,
            ...(tenantId ? { filter: `instance_id=eq.${tenantId}` } : {}),
          },
          () => { debouncedRefresh(); }
        )
        .subscribe((status) => {
          if (shouldResyncOnStatus(status, statusState) && !cancelled) refresh();
        });
    })();
    return function unsubscribe() {
      cancelled = true;
      debouncedRefresh.cancel();
      if (channel) supabase.removeChannel(channel);
    };
  }

  return { config, KINDS, toRow, fromRow, partition, cleanPayload, onAdd, onUpdate, onScheduleReplace, initialSync, subscribe, fetchAll };
}

// Wire a store to its cloud: outbound CRUD hooks + inbound merge, (re)started
// on every sign-in and stopped on sign-out. Call once per office singleton.
export function attachOfficeCloud(store, cloud) {
  store.attachCloud(cloud);
  let unsub = null;
  const start = async () => {
    if (unsub) return;
    const res = await cloud.initialSync(store.getState(), store.stampRemote);
    if (res?.merged) store.mergeRemote(res.merged);
    unsub = cloud.subscribe((remote) => store.mergeRemote(remote));
  };
  const stop = () => { if (unsub) { unsub(); unsub = null; } };
  try {
    onAuthChange((session) => { if (session) start(); else stop(); });
  } catch { /* non-browser (tests): caller drives start() explicitly if needed */ }
  return { start, stop };
}
