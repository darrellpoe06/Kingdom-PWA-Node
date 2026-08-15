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
import { withUploadRetry } from './upload-retry.js';

// -----------------------------------------------------------------------------
// createDebouncer — coalesce a burst of calls into a single trailing run.
//
// A4 (rigorous-review 2026-06-13): every realtime postgres_change (including the
// device's OWN writes) triggered a full-table refetch with no debounce — N
// rapid edits fired N refetches, N× across N devices. Debouncing collapses a
// burst into one refetch. Exported + pure (timer-injectable) so it's testable.
// -----------------------------------------------------------------------------
export function createDebouncer(fn, ms = 400) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn(...args); }, ms);
  };
  debounced.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return debounced;
}

// -----------------------------------------------------------------------------
// shouldResyncOnStatus — decide whether a realtime status transition needs a
// catch-up refetch.
//
// A5 (rigorous-review 2026-06-13): subscribe() had no status handler, so a
// dropped websocket silently stopped all cross-device updates with no recovery.
// The first SUBSCRIBED is already covered by the initial fetchAll; a LATER
// SUBSCRIBED means the socket dropped and rejoined, so changes that happened
// while it was down must be re-fetched. Mutates `state.everSubscribed`.
// -----------------------------------------------------------------------------
export function shouldResyncOnStatus(status, state) {
  if (status === 'SUBSCRIBED') {
    const resync = state.everSubscribed === true;
    state.everSubscribed = true;
    return resync;
  }
  return false;
}

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

async function getTenantId() {
  // Reuses the same join_default_instance() RPC the feedback sync uses.
  // (Name kept as getTenantId for backward-compat with callers; the
  // underlying RPC was renamed in v2.1-infra.)
  const { data, error } = await supabase.rpc('join_default_instance', {
    display_name_in: null,
  });
  if (error) throw error;
  return data;
}

// Resolve the caller's instance id (the poe-family instance for family members,
// or their own self-serve instance). Used by the multi-point persona-PIN gate
// to scope set/verify_persona_pin to the right instance.
export async function getInstanceId() {
  return getTenantId();
}

export function createTableSync(spec) {
  const {
    localKey,
    remoteTable,
    toRow,
    fromRow,
    idOf = (item) => item?.id,
    // APPEND-ONLY tables refresh by DELTA, not by re-downloading the table.
    //
    // WHY THIS EXISTS (2026-08-14, the egress outage). record_events is the
    // audit log: one row per change to ANY tracked record, 20,129 rows / 15 MB,
    // with fat before/after JSON blobs (largest single row 1.18 MB). subscribe()
    // called fetchAll() on EVERY realtime change, so ten inventory edits meant
    // ten full 15 MB re-downloads on every connected device. 5 GB of free-tier
    // egress is ~340 of those refetches, and the project was hard-restricted
    // with `exceed_egress_quota` -- every account across all four apps locked
    // out for 3.5 days (last successful sign-in 2026-08-11 03:04 UTC, measured).
    //
    // Worse, the pagination directly above was added to fix TRUNCATION at 1,000
    // rows, which turned a capped 1,000-row pull into a guaranteed 20,129-row
    // one. The correctness fix made the egress bill strictly worse, and nothing
    // measured egress, so it was invisible until the service was cut off.
    //
    // Safe ONLY where the merge is a UNION (see mergeRemoteRecordEvents ->
    // unionPreservingLocal): the refresh then hands the consumer just the new
    // rows and the union folds them in. A consumer that REPLACES its list would
    // lose history, so this is opt-in per table and never a default.
    appendOnly = false,
    // MUTABLE tables refresh by WATERMARK on updated_at (2026-08-14, the second
    // half of the same egress work; the plan corrected by Gemini's review then
    // corrected again by measurement). transactions is 2,953 rows / 3.4 MB with
    // 17,374 lifetime writes — every one of which re-downloaded the whole
    // ledger. appendOnly is UNSOUND there (rows update; deletes happen), so:
    //
    //   * upserts ride `updated_at > watermark` (migration 0136 backfills the
    //     1,978 NULL updated_at rows and adds the touch trigger — measured 67%
    //     of the ledger was invisible to a watermark before that);
    //   * deletions are reconciled from record_events (record_kind=eventsKind,
    //     action='delete'), whose record_id carries the LOCAL id (measured);
    //     no soft-delete column, so the ledger's semantics and RLS are untouched;
    //   * the controller keeps a by-id cache and ALWAYS hands the consumer the
    //     FULL list, so the consumer contract is unchanged — a partial list to
    //     a replace-style consumer is how history gets lost (DR-0305's rule).
    //
    // Cheaper never means less correct: any failed leg falls back to fetchAll,
    // a partial full read never advances the watermark, and before the first
    // full load there is no delta at all.
    mutableDelta = false,
    // record_events.record_kind used for deletion reconciliation ('transaction').
    eventsKind = null,
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
    // Retry TRANSIENT failures (rate-limit / network blip / timeout) so a burst of
    // inserts — a reset-and-re-import fires hundreds at once — no longer silently
    // drops a row that hit a momentary error (Christina's books, 2026-07-18).
    // Permanent errors (unique/RLS/validation) stop immediately; a retry can't fix
    // them. INSERT stays idempotent-safe: a permanent unique_violation is NOT
    // retried, so a re-import can't double-write.
    const { data, error } = await withUploadRetry(() =>
      supabase.from(remoteTable).insert(row).select().single());
    if (error) {
      console.warn(`[table-sync:${remoteTable}] upload failed (after retries):`, error);
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

  // deleteRows(ids) — BATCH delete, chunked + awaited. The books dedupe removes
  // THOUSANDS of rows at once; firing that many single deleteRow() calls floods the
  // browser's ~6-connection-per-origin cap and the PostgREST rate limit, so most
  // silently never land and the cloud stays doubled ("removed" on screen but back on
  // refresh, Darrell 2026-07-19). One `.in()` delete per CHUNK ids (sequential, so it
  // never floods) reliably clears them. Returns the count actually deleted (via
  // .select) so a partial/RLS-blocked result is visible, not a false success (DR-0076).
  async function deleteRows(ids) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out', deleted: 0 };
    const list = [...new Set((ids || []).filter(Boolean))];
    if (!list.length) return { deleted: 0 };
    const CHUNK = 200;
    let deleted = 0;
    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK);
      const { data, error } = await supabase.from(remoteTable).delete().in('id', chunk).select('id');
      if (error) { console.warn(`[table-sync:${remoteTable}] batch delete failed:`, error); continue; }
      deleted += Array.isArray(data) ? data.length : 0;
    }
    return { deleted, requested: list.length };
  }

  async function deleteRow(id) {
    const session = await currentSession();
    if (!session) return { skipped: 'signed-out' };
    // Ask for the deleted rows back (.select) so a 0-row delete is DETECTED rather
    // than reported as a false success. A DELETE the RLS USING clause blocks — a
    // non-owner on the books (0100: DELETE is owner/admin only), or a row on
    // another instance — returns NO error but removes NOTHING. That silent no-op is
    // exactly what let cleared transactions resurrect on the next cloud merge
    // (Darrell 2026-07-19). Honest result so the caller can surface it (DR-0076).
    const { data, error } = await supabase.from(remoteTable).delete().eq('id', id).select('id');
    if (error) {
      console.warn(`[table-sync:${remoteTable}] delete failed:`, error);
      return { skipped: 'delete-error', error };
    }
    const affected = Array.isArray(data) ? data.length : 0;
    if (affected === 0) {
      console.warn(`[table-sync:${remoteTable}] delete removed 0 rows (RLS-blocked or already gone):`, id);
      return { skipped: 'no-op', affected: 0 };
    }
    return { deleted: true, affected };
  }

  // 2026-06-12 fix (review finding): reads used to rely on RLS alone, which
  // scopes to ALL instances the user belongs to. A user in two instances
  // pulled the union locally, and initialSync then re-uploaded the other
  // instance's rows into the default instance — duplication + cross-instance
  // bleed. Every read (and the realtime channel) now filters to the same
  // instance the writes target. Cached per controller; instance membership
  // doesn't change mid-session.
  let cachedTenantId = null;
  async function tenantIdCached() {
    if (!cachedTenantId) cachedTenantId = await getTenantId();
    return cachedTenantId;
  }

  async function fetchAll() {
    let tenantId;
    try {
      tenantId = await tenantIdCached();
    } catch (e) {
      console.warn(`[table-sync:${remoteTable}] tenant lookup failed:`, e);
      return null;
    }
    // PAGINATE. Supabase/PostgREST caps a single response at 1,000 rows, so a
    // plain .select() silently truncates any table over 1,000 rows — which
    // quietly dropped ~half the transaction ledger on the device (complete in
    // the DB, thin on screen: e.g. April showing 2 of 296, later accounts never
    // syncing at all). Loop .range() until a short page. Order by created_at
    // THEN id so the sort is a stable TOTAL order — without the id tiebreaker,
    // rows that share a created_at (bulk inserts land in the same millisecond)
    // could be skipped or duplicated across page boundaries.
    const PAGE = 1000;
    const rows = [];
    for (let from = 0; from < 200000; from += PAGE) {
      const { data, error } = await supabase
        .from(remoteTable)
        .select('*')
        .eq('instance_id', tenantId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.warn(`[table-sync:${remoteTable}] fetch failed at offset ${from}:`, error);
        // Keep what already paged in rather than dropping the whole ledger.
        // A PARTIAL read must not advance the watermark: doing so would make
        // the next delta start past rows this read never returned, and the gap
        // would be permanent and silent. For mutableDelta it must also CLEAR
        // the watermark: the cache is about to hold a partial picture, and the
        // only safe next refresh is another full read, not a delta on top of
        // a hole.
        updatedWatermark = null;
        return from === 0 ? null : rows.map(fromRow);
      }
      const batch = data || [];
      rows.push(...batch);
      if (batch.length < PAGE) break;
    }
    advanceWatermark(rows);
    advanceUpdatedWatermark(rows);
    return rows.map(fromRow);
  }

  // The high-water mark for an append-only table: the newest created_at this
  // controller has seen. Null until the first successful full load, and any
  // refresh before that falls back to fetchAll — never to "fetch nothing".
  let watermark = null;

  function advanceWatermark(rawRows) {
    for (const r of rawRows || []) {
      const t = r && r.created_at;
      if (t && (!watermark || t > watermark)) watermark = t;
    }
  }

  // Only rows written since the watermark. Same page loop and same stable total
  // order as fetchAll, so a burst landing in one millisecond cannot be skipped.
  // `.gt` (not `.gte`) because the watermark row is already held locally.
  async function fetchSince(since) {
    let tenantId;
    try {
      tenantId = await tenantIdCached();
    } catch (e) {
      console.warn(`[table-sync:${remoteTable}] tenant lookup failed:`, e);
      return null;
    }
    const PAGE = 1000;
    const raw = [];
    for (let from = 0; from < 200000; from += PAGE) {
      const { data, error } = await supabase
        .from(remoteTable)
        .select('*')
        .eq('instance_id', tenantId)
        .gt('created_at', since)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.warn(`[table-sync:${remoteTable}] delta fetch failed at offset ${from}:`, error);
        // A failed delta must not look like "nothing new" — fall back to the
        // full read so a dropped page can never silently lose history.
        return null;
      }
      const batch = data || [];
      raw.push(...batch);
      if (batch.length < PAGE) break;
    }
    advanceWatermark(raw);
    return raw.map(fromRow);
  }

  // ── mutableDelta: watermark on updated_at + deletes from record_events ─────
  // The by-id cache. The consumer's contract is a FULL list on every callback;
  // the cache is what lets the fetch be delta-sized while the callback stays
  // whole. Keyed by the LOCAL id (idOf after fromRow) because record_events
  // .record_id carries the local id (measured against production deletes).
  const cache = new Map();

  function cacheReplaceAll(items) {
    cache.clear();
    for (const it of items || []) { const k = idOf(it); if (k != null) cache.set(k, it); }
  }

  // updated_at watermark for mutableDelta (the created_at one above serves
  // appendOnly; they advance on different columns and never mix).
  let updatedWatermark = null;
  function advanceUpdatedWatermark(rawRows) {
    for (const r of rawRows || []) {
      const t = r && r.updated_at;
      if (t && (!updatedWatermark || t > updatedWatermark)) updatedWatermark = t;
    }
  }

  // Rows MODIFIED since the watermark — inserts and edits both, because the
  // 0136 trigger touches updated_at on INSERT OR UPDATE. Same stable total
  // order and page loop as fetchAll; `.gt` because the watermark row is held.
  async function fetchChangedSince(since) {
    let tenantId;
    try { tenantId = await tenantIdCached(); } catch (e) {
      console.warn(`[table-sync:${remoteTable}] tenant lookup failed:`, e);
      return null;
    }
    const PAGE = 1000;
    const raw = [];
    for (let from = 0; from < 200000; from += PAGE) {
      const { data, error } = await supabase
        .from(remoteTable)
        .select('*')
        .eq('instance_id', tenantId)
        .gt('updated_at', since)
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) {
        console.warn(`[table-sync:${remoteTable}] watermark delta failed at offset ${from}:`, error);
        return null; // a failed delta must never read as "nothing changed"
      }
      const batch = data || [];
      raw.push(...batch);
      if (batch.length < PAGE) break;
    }
    advanceUpdatedWatermark(raw);
    return raw.map(fromRow);
  }

  // Local ids deleted since the watermark, read from the audit log. No
  // soft-delete column: record_events already records every books delete
  // (18,502 of them measured), so the ledger's own semantics and RLS stay
  // untouched. A delete bumps no transactions row, so this window re-reads
  // until an upsert advances the watermark — idempotent removals, small rows.
  async function fetchDeletedIdsSince(since) {
    if (!eventsKind) return [];
    let tenantId;
    try { tenantId = await tenantIdCached(); } catch (_e) { return null; }
    const { data, error } = await supabase
      .from('record_events')
      .select('record_id')
      .eq('instance_id', tenantId)
      .eq('record_kind', eventsKind)
      .eq('action', 'delete')
      .gt('occurred_at', since)
      .order('occurred_at', { ascending: true })
      .range(0, 999);
    if (error) {
      console.warn(`[table-sync:${remoteTable}] delete reconciliation failed:`, error);
      return null; // fall back to the full read rather than resurrect deleted rows
    }
    return (data || []).map((r) => r.record_id).filter(Boolean);
  }

  function subscribe(onRemote) {
    let channel = null;
    let cancelled = false;
    const refresh = () => {
      if (mutableDelta && updatedWatermark) {
        // Both legs must succeed; either failing falls back to the full read.
        Promise.all([
          fetchChangedSince(updatedWatermark),
          fetchDeletedIdsSince(updatedWatermark),
        ]).then(async ([upserts, deletedIds]) => {
          if (cancelled) return;
          if (upserts === null || deletedIds === null) {
            const full = await fetchAll();
            if (!full || cancelled) return;
            cacheReplaceAll(full);
            onRemote(full);
            return;
          }
          if (upserts.length === 0 && deletedIds.length === 0) return; // quiet
          for (const it of upserts) { const k = idOf(it); if (k != null) cache.set(k, it); }
          for (const id of deletedIds) cache.delete(id);
          onRemote([...cache.values()]);
        });
        return;
      }
      // Append-only: ask for the delta. On any failure, or before the first
      // full load has set a watermark, fall back to the whole table — cheaper
      // is never allowed to mean less correct.
      const pull = (appendOnly && watermark)
        ? fetchSince(watermark).then((d) => (d === null ? fetchAll() : d))
        : fetchAll();
      pull.then((refreshed) => {
        if (!refreshed || cancelled) return;
        // A delta of zero rows is the common case once the log is quiet; there
        // is nothing for the consumer to merge, so do not churn its state.
        if (appendOnly && watermark && refreshed.length === 0) return;
        onRemote(refreshed);
      });
    };
    // A4: coalesce a burst of realtime changes (incl. own writes) into one
    // refetch. A5: state for the reconnect-resync decision.
    const debouncedRefresh = createDebouncer(refresh, 400);
    const statusState = { everSubscribed: false };
    (async () => {
      const session = await currentSession();
      if (!session || cancelled) return;
      const initial = await fetchAll();
      if (initial) {
        if (mutableDelta) cacheReplaceAll(initial);
        onRemote(initial);
      }
      let tenantId = null;
      try { tenantId = await tenantIdCached(); } catch (_) { /* filter below stays broad; fetchAll still scopes */ }
      if (cancelled) return;
      channel = supabase
        .channel(`${remoteTable}-stream`)
        .on(
          'postgres_changes',
          {
            event: '*', schema: 'public', table: remoteTable,
            ...(tenantId ? { filter: `instance_id=eq.${tenantId}` } : {}),
          },
          () => { debouncedRefresh(); }
        )
        .subscribe((status) => {
          // A5: a re-SUBSCRIBED after a dropped socket means changes were missed
          // while it was down — catch up with a fresh fetch.
          if (shouldResyncOnStatus(status, statusState) && !cancelled) refresh();
        });
    })();
    return function unsubscribe() {
      cancelled = true;
      debouncedRefresh.cancel();
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
      // 2026-07-19 RESURRECTION FIX (the cloud half). A row that was SYNCED
      // (carries a remoteUuid) but is now ABSENT from the cloud was DELETED
      // remotely — it must NOT be re-uploaded, or a delete resurrects itself in
      // the cloud on the next sign-in. This is the second half of the "duplicates
      // leave and come back" fix: on a storage-full device the stale localStorage
      // still holds the deleted rows, and without this guard initialSync re-INSERTED
      // them (their old slug was freed by the delete, so the unique index didn't
      // stop it). Only genuinely-new local rows (no remoteUuid) are ever uploaded.
      if (local && local.remoteUuid) return false;
      const lid = idOf(local);
      return !lid || !remoteIds.has(lid);
    });
    // 2026-06-12 data-loss fix: a failed upload used to vanish — the caller
    // replaced local state with the refetched cloud list, deleting the very
    // item whose INSERT had just failed (missing column, tier trigger,
    // network blip). Track failures and keep those items in the merged list
    // so the device copy survives; they retry on the next initialSync.
    const failedUploads = [];
    for (const local of toUpload) {
      const res = await upload(local);
      if (!res || !res.uploaded) failedUploads.push(local);
    }

    // Refetch after uploads so the caller gets the merged final state.
    const merged = await fetchAll();
    const base = merged || remoteItems;
    const baseIds = new Set(base.map((r) => idOf(r)));
    const preserved = failedUploads.filter((l) => !baseIds.has(idOf(l)));
    return { merged: [...base, ...preserved], uploadFailures: failedUploads.length };
  }

  return { localKey, remoteTable, upload, updateRow, deleteRow, deleteRows, fetchAll, subscribe, initialSync };
}

// -----------------------------------------------------------------------------
// unionPreservingLocal — 2026-06-12 data-loss fix for the wholesale replace.
//
// When a cloud list arrives (initial sync or a realtime event), replacing
// local state with it drops any locally-created item whose upload hasn't
// landed yet (or silently failed) — the item simply disappears from the
// device. Locally-created ids are prefixed strings ('inc-...', 'pr-...');
// synced rows carry DB UUIDs. So: take the cloud list, then keep any current
// local item whose id is NOT a UUID (never reached the cloud) and isn't
// already represented. UUID rows absent from the cloud list stay dropped —
// that's a genuine cross-device deletion propagating, which must still work.
// -----------------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function unionPreservingLocal(currentLocal, remoteItems, idOf = (item) => item?.id) {
  const remote = remoteItems || [];
  // SAFETY (Darrell 2026-07-19, post-incident): an EMPTY cloud list is NOT proof the
  // rows were deleted — a read on an out-of-space device can hiccup to empty. Without
  // this, the "drop UUID rows absent from remote" rule below would BLANK every synced
  // table at once (all Books tabs went empty + the app wedged). No authoritative
  // update from an empty read: keep the current rows and wait for a real sync.
  if (!remote.length) return currentLocal || [];
  const remoteIds = new Set(remote.map((r) => idOf(r)));
  const keep = (currentLocal || []).filter((l) => {
    const lid = idOf(l);
    return lid && !UUID_RE.test(String(lid)) && !remoteIds.has(lid);
  });
  return keep.length ? [...remote, ...keep] : remote;
}
