// =============================================================================
// study-sync — the Study follows its owner across devices (Darrell 2026-07-03)
// =============================================================================
// "We need sync for BG he will use multiple devices and so do we." The Study
// (Darrell + Christina + Bishop Gwin) was device-local by design; this rail
// keeps the sovereignty promise while adding sync, because the Supabase backend
// is the family's OWN server (self-hosted on the Synology NAS —
// infra/supabase/README.md). Notes move between the owner's devices THROUGH the
// family NAS — never a third-party cloud, never mined, never trained on.
//
// PRIVACY MODEL (migration 0070): every row is OWNER-ONLY at the database —
// auth.uid() = owner on select/insert/update/delete, and the realtime stream
// respects the same RLS. BG's sign-in reads BG's rows and nothing else; same
// for Darrell and Christina. "His notes are his space" holds at the DB layer.
//
// SYNC SHAPE — localStorage stays the source of immediate truth on the device
// (instant, offline-tolerant); the cloud table is the courier between devices:
//   pull  : fetchStudyCloud() → mergeStudy(local, cloud) — pure, newest-wins
//           by the entry's own updatedAt; cloud tombstones remove local copies;
//           local-only entries survive and are queued for push (first sync
//           uploads the existing device store).
//   push  : the component diffs state changes and calls pushStudyEntries /
//           tombstoneStudyEntries / pushStudyLabel. Deletes are TOMBSTONES so
//           a delete on one device propagates instead of resurrecting.
//   live  : subscribeStudyRealtime() re-pulls on any change to the owner's rows.
//
// SEED DEDUPE: seed themes are created per-device with generated ids, so two
// devices seeding independently hold the same teaching under different ids.
// The merge collapses seed:true entries by normalized title — the edited /
// newer copy wins, the duplicate is dropped and (if it lives in the cloud)
// tombstoned, so every device converges on one copy per teaching.
//
// All merge logic is PURE (node-testable); only the fetch/push/subscribe
// functions touch supabase, and every one fails SOFT (returns null / false) so
// a NAS outage degrades to exactly the old device-local behavior, never a
// broken surface (PERPETUAL-PIPELINE-HEALTH: try-catch every external I/O).
// =============================================================================
import { supabase } from './supabase.js';
import { normalizeEntry, DEFAULT_LABEL } from './study-space.js';

// --- Pure: row <-> entry mapping ---------------------------------------------

// A cloud row carries the whole normalized entry as jsonb `doc`. The entry's own
// updatedAt (ISO) is copied onto the row column for ordering; the doc stays the
// single source of the entry shape (study-space owns it).
export function entryToRow(entry) {
  const e = normalizeEntry(entry || {});
  return { id: e.id, doc: e, deleted: false, updated_at: e.updatedAt };
}

export function rowToEntry(row) {
  if (!row || row.deleted) return null;
  return normalizeEntry(row.doc || {});
}

// --- Pure: merge --------------------------------------------------------------

const iso = (v) => {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : 0;
};

// Normalized title key — mirrors study-space's seed identity rule (seeds are
// 1:1 with their human title; ids differ per device).
const titleKey = (e) => String(e?.title || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Collapse per-device duplicate SEED entries (same teaching, different ids).
// Keeps the copy with the newer updatedAt (an edited seed beats a fresh one);
// ties keep the first seen. Returns { entries, dropped } — dropped ids that
// exist in the cloud are tombstoned by the caller so every device converges.
export function dedupeSeeds(entries) {
  const byTitle = new Map();
  const out = [];
  const dropped = [];
  for (const e of entries) {
    if (!e.seed || !titleKey(e)) { out.push(e); continue; }
    const key = titleKey(e);
    const prior = byTitle.get(key);
    if (!prior) { byTitle.set(key, e); out.push(e); continue; }
    if (iso(e.updatedAt) > iso(prior.updatedAt)) {
      dropped.push(prior.id);
      byTitle.set(key, e);
      out[out.indexOf(prior)] = e;
    } else {
      dropped.push(e.id);
    }
  }
  return { entries: out, dropped };
}

// The merge. local = {label, entries} (the device store); cloud = {label, rows}
// (fetchStudyCloud's shape). Pure + total. Returns:
//   study          — the merged {version, label, entries} to render + save locally
//   pushEntries    — entries the cloud is missing or holds stale (upload these)
//   pushTombstones — ids to tombstone in the cloud (collapsed seed duplicates)
//   pushLabel      — true when the local label should be written up
export function mergeStudy(local, cloud) {
  const localEntries = Array.isArray(local?.entries) ? local.entries : [];
  const rows = Array.isArray(cloud?.rows) ? cloud.rows : [];
  const cloudById = new Map(rows.map((r) => [r.id, r]));

  const merged = [];
  const pushEntries = [];

  for (const le of localEntries) {
    const row = cloudById.get(le.id);
    if (!row) { merged.push(le); pushEntries.push(le); continue; }
    cloudById.delete(le.id);
    if (row.deleted) {
      // A tombstone wins unless the local copy was edited AFTER the delete
      // (the owner kept working on another device — their words never lose).
      if (iso(le.updatedAt) > iso(row.updated_at)) { merged.push(le); pushEntries.push(le); }
      continue;
    }
    const ce = rowToEntry(row);
    if (iso(le.updatedAt) > iso(ce.updatedAt)) { merged.push(le); pushEntries.push(le); }
    else merged.push(ce);
  }
  // Cloud entries this device has never seen.
  for (const row of cloudById.values()) {
    const ce = rowToEntry(row);
    if (ce) merged.push(ce);
  }

  const { entries, dropped } = dedupeSeeds(merged);
  const droppedSet = new Set(dropped);
  const cloudIds = new Set(rows.map((r) => r.id));
  const study = {
    version: 1,
    // The cloud label is authoritative once one exists (renames push
    // immediately); a device with a custom label seeds the cloud on first sync.
    label: (cloud?.label || '').trim() || local?.label || DEFAULT_LABEL,
    entries,
  };
  return {
    study,
    pushEntries: pushEntries.filter((e) => !droppedSet.has(e.id)),
    pushTombstones: dropped.filter((id) => cloudIds.has(id)),
    pushLabel: !(cloud?.label || '').trim() && !!(local?.label || '').trim() && local.label !== DEFAULT_LABEL,
  };
}

// --- I/O: fetch / push / subscribe (owner-only via RLS; all fail-soft) --------

async function ownedSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch { return null; }
}

// Pull the owner's whole Study from the family server. null = unreachable or
// signed out (caller stays device-local); {rows, label} otherwise.
export async function fetchStudyCloud() {
  const session = await ownedSession();
  if (!session) return null;
  try {
    const [{ data: rows, error: e1 }, { data: spaces, error: e2 }] = await Promise.all([
      supabase.from('study_entries').select('id,doc,deleted,updated_at'),
      supabase.from('study_spaces').select('label,updated_at'),
    ]);
    if (e1) { console.warn('[study-sync] entries fetch failed:', e1); return null; }
    if (e2) console.warn('[study-sync] spaces fetch failed:', e2);
    return { rows: rows || [], label: spaces?.[0]?.label || '' };
  } catch (err) {
    console.warn('[study-sync] fetch failed:', err);
    return null;
  }
}

export async function pushStudyEntries(entries) {
  if (!entries || !entries.length) return true;
  const session = await ownedSession();
  if (!session) return false;
  try {
    const { error } = await supabase
      .from('study_entries')
      .upsert(entries.map(entryToRow), { onConflict: 'owner,id' });
    if (error) { console.warn('[study-sync] push failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[study-sync] push failed:', err);
    return false;
  }
}

// Tombstone: the row stays (so other devices see the delete) but the content is
// emptied — a deleted thought leaves nothing behind on the server.
export async function tombstoneStudyEntries(ids, nowIso) {
  if (!ids || !ids.length) return true;
  const session = await ownedSession();
  if (!session) return false;
  try {
    const at = nowIso || new Date().toISOString();
    const { error } = await supabase
      .from('study_entries')
      .upsert(ids.map((id) => ({ id, doc: {}, deleted: true, updated_at: at })), { onConflict: 'owner,id' });
    if (error) { console.warn('[study-sync] tombstone failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[study-sync] tombstone failed:', err);
    return false;
  }
}

export async function pushStudyLabel(label) {
  const session = await ownedSession();
  if (!session) return false;
  try {
    const { error } = await supabase
      .from('study_spaces')
      .upsert({ owner: session.user.id, label: String(label || '').trim() || DEFAULT_LABEL, updated_at: new Date().toISOString() }, { onConflict: 'owner' });
    if (error) { console.warn('[study-sync] label push failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[study-sync] label push failed:', err);
    return false;
  }
}

// Live: any change to the owner's rows (RLS scopes the stream) re-triggers the
// caller's pull+merge. Returns an unsubscribe function; safe when offline.
export function subscribeStudyRealtime(onRemoteChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await ownedSession();
    if (!session || cancelled) return;
    try {
      channel = supabase
        .channel('study-sync-stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_entries' }, () => { if (!cancelled) onRemoteChange(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_spaces' }, () => { if (!cancelled) onRemoteChange(); })
        .subscribe();
    } catch (err) {
      console.warn('[study-sync] realtime subscribe failed:', err);
    }
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* already closed */ } }
  };
}
