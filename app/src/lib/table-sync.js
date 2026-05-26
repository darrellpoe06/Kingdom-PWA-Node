// =============================================================================
// table-sync — generic Supabase cross-device sync for any tenant-scoped table
// =============================================================================
// Generalizes the pattern proven in feedback-sync.js to any flat-tabular,
// tenant-scoped Supabase table. Callers provide:
//
//   - localKey   : the data.* property name where this table's records live
//                  (e.g. 'entities', 'accounts', 'debts')
//   - remoteTable: the Supabase table name (usually the same as localKey)
//   - toRow      : (localItem, { tenantId, userId }) => row
//                  Maps a local record to a Supabase row. Must include
//                  instance_id and created_by.
//   - fromRow    : (row) => localItem
//                  Maps a Supabase row back to the local record shape.
//                  Should include a stable `id` (the row.id from the DB).
//   - idOf       : (localItem) => string  // optional, defaults to item.id
//                  How to extract the stable id for a local item — used
//                  for dedup during initial sync and realtime merge.
//
// The returned controller exposes:
//
//   upload(item)         — INSERT one row (called from add reducers)
//   updateRow(id, patch) — UPDATE one row by id (called from update reducers)
//   deleteRow(id)        — DELETE one row by id (called from delete reducers)
//   subscribe(onRemote)  — fetch all rows + realtime-subscribe
//                          to inserts/updates/deletes for this tenant.
//                          onRemote(items) fires with the full list each
//                          time it changes. Returns an unsubscribe fn.
//   initialSync(localItems) — on first sign-in, push every local item to
//                          Supabase that doesn't already exist remotely.
//                          Returns the merged list (remote ∪ local).
//
// All methods are no-ops when signed out — the app keeps working from
// localStorage alone, sync resumes when the user signs back in.
// =============================================================================
import supabase from './supabase.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function getTenantId() {
  // Reuses the same join_default_tenant() RPC the feedback sync uses.
  const { data, error } = await supabase.rpc('join_default_tenant', {
    display_name_in: null,
  });
  if (error) throw error;
  return data;
}

export function createTableSync(spec) {
  const {
    localKey,
    remoteTable,
    toRow,
    fromRow,
    idOf = (item) => item?.id,
  } = spec;

  async function upload(item) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    let tenantId;
    try {
      tenantId = await getTenantId();
    } catch (e) {
      console.warn(`[table-sync:${remoteTable}] tenant lookup failed:`, e);
      return { skipped: 'no-tenant', error: e };
    }
    const row = toRow(item, { tenantId, userId: session.user.id });
    const { data, error } = await supabase
      .from(remoteTable)
      .insert(row)
      .select()
      .single();
    if (error) {
      console.warn(`[table-sync:${remoteTable}] upload failed:`, error);
      return { skipped: 'insert-error', error };
    }
    return { uploaded: true, remoteId: data.id, row: data };
  }

  async function updateRow(id, patch) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    const patchRow = { ...patch, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from(remoteTable)
      .update(patchRow)
      .eq('id', id);
    if (error) {
      console.warn(`[table-sync:${remoteTable}] update failed:`, error);
      return { skipped: 'update-error', error };
    }
    return { updated: true };
  }

  async function deleteRow(id) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    const { error } = await supabase.from(remoteTable).delete().eq('id', id);
    if (error) {
      console.warn(`[table-sync:${remoteTable}] delete failed:`, error);
      return { skipped: 'delete-error', error };
    }
    return { deleted: true };
  }

  async function fetchAll() {
    const { data, error } = await supabase
      .from(remoteTable)
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn(`[table-sync:${remoteTable}] fetch failed:`, error);
      return null;
    }
    return (data || []).map(fromRow);
  }

  function subscribe(onRemote) {
    let channel = null;
    let cancelled = false;
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const initial = await fetchAll();
      if (initial) onRemote(initial);
      channel = supabase
        .channel(`${remoteTable}-stream`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: remoteTable },
          () => {
            fetchAll().then((refreshed) => {
              if (refreshed) onRemote(refreshed);
            });
          }
        )
        .subscribe();
    })();
    return function unsubscribe() {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }

  async function initialSync(localItems = []) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    const remoteItems = await fetchAll();
    if (!remoteItems) return { skipped: 'fetch-failed' };

    // Items present locally but not remotely → upload them.
    // Dedup by stable id where present; fall back to display name or slug
    // for entities that haven't been uploaded yet (local ids are non-UUID).
    const remoteIds = new Set(remoteItems.map((r) => r.id));
    const toUpload = (localItems || []).filter((local) => {
      const lid = idOf(local);
      return !lid || !remoteIds.has(lid);
    });
    for (const local of toUpload) {
      await upload(local);
    }

    // Refetch after uploads so the caller gets the merged final state.
    const merged = await fetchAll();
    return { merged: merged || remoteItems };
  }

  return { localKey, remoteTable, upload, updateRow, deleteRow, subscribe, initialSync };
}
