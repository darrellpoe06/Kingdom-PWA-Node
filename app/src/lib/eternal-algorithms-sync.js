// =============================================================================
// eternal-algorithms-sync — the forge follows its owner; the pulpit reads only
// what the owner published (Darrell 2026-07-03: the forge→pulpit bridge).
// =============================================================================
// Same owner-only rail as study-sync (migration 0071 mirrors 0070): the
// finished gallery follows its owner's sign-in across devices through the
// family's own server — never a third-party cloud, never mined. Every row is
// owner-only at the database on every operation.
//
// THE BRIDGE: an entry the owner marks published (doc.published + publishedAt,
// with doc.publish4D deciding whether the deep layer goes out — DR-0094: the
// owner decides what's shared, per entry, per layer) becomes visible through
// the ONE public window, the SECURITY DEFINER function
// eternal_algorithms_public(). fetchPublishedAlgorithms() reads that window —
// it works signed-out (the church series is public, Father's-Business reach)
// and NEVER sees unpublished rows: the filter is in the database, not here.
//
// Merge semantics mirror study-sync (newest-wins by the entry's own updatedAt;
// tombstones propagate deletes; local-only entries upload on first sync) with
// one difference: seed entries dedupe by NAME (the catalog's stable identity —
// ids are generated per device), keeping the newer/edited copy.
// All merge logic is pure; every I/O function fails SOFT so a server outage
// degrades to exactly the old device-local behavior.
// =============================================================================
import { supabase } from './supabase.js';
import { normalizeAlgorithm } from './eternal-algorithms.js';

// --- Pure: row <-> entry mapping ---------------------------------------------

export function algorithmToRow(entry) {
  // normalizeAlgorithm carries the publish state (it is part of the canonical
  // entry shape) — the public window reads publish4D/publishedAt out of the
  // doc, and the `published` column mirrors doc.published so the DB filters.
  const e = normalizeAlgorithm(entry || {});
  return {
    id: e.id,
    doc: e,
    published: !!e.published,
    deleted: false,
    updated_at: e.updatedAt,
  };
}

export function rowToAlgorithm(row) {
  if (!row || row.deleted) return null;
  return normalizeAlgorithm(row.doc || {});
}

// --- Pure: merge --------------------------------------------------------------

const ts = (v) => {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : 0;
};

const nameKey = (e) => String(e?.name || '').trim().toLowerCase().replace(/\s+/g, ' ');

// Collapse per-device duplicate SEED entries (same catalog teaching, different
// generated ids). The newer/edited copy wins; dropped ids that live in the
// cloud are tombstoned by the caller so every device converges.
export function dedupeSeedAlgorithms(entries) {
  const byName = new Map();
  const out = [];
  const dropped = [];
  for (const e of entries) {
    if (!e.seed || !nameKey(e)) { out.push(e); continue; }
    const key = nameKey(e);
    const prior = byName.get(key);
    if (!prior) { byName.set(key, e); out.push(e); continue; }
    if (ts(e.updatedAt) > ts(prior.updatedAt)) {
      dropped.push(prior.id);
      byName.set(key, e);
      out[out.indexOf(prior)] = e;
    } else {
      dropped.push(e.id);
    }
  }
  return { entries: out, dropped };
}

// local = {label, entries} (device store); cloud = {rows} (fetchLibraryCloud).
// Returns { library, pushEntries, pushTombstones }.
export function mergeLibrary(local, cloud) {
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
      if (ts(le.updatedAt) > ts(row.updated_at)) { merged.push(le); pushEntries.push(le); }
      continue;
    }
    const ce = rowToAlgorithm(row);
    if (ts(le.updatedAt) > ts(ce.updatedAt)) { merged.push(le); pushEntries.push(le); }
    else merged.push(ce);
  }
  for (const row of cloudById.values()) {
    const ce = rowToAlgorithm(row);
    if (ce) merged.push(ce);
  }

  const { entries, dropped } = dedupeSeedAlgorithms(merged);
  const droppedSet = new Set(dropped);
  const cloudIds = new Set(rows.map((r) => r.id));
  return {
    library: { version: 1, label: local?.label || 'Eternal Algorithms', entries },
    pushEntries: pushEntries.filter((e) => !droppedSet.has(e.id)),
    pushTombstones: dropped.filter((id) => cloudIds.has(id)),
  };
}

// --- I/O (owner-only via RLS; all fail-soft) ----------------------------------

async function ownedSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  } catch { return null; }
}

export async function fetchLibraryCloud() {
  const session = await ownedSession();
  if (!session) return null;
  try {
    const { data, error } = await supabase
      .from('eternal_algorithms')
      .select('id,doc,published,deleted,updated_at');
    if (error) { console.warn('[ea-sync] fetch failed:', error); return null; }
    return { rows: data || [] };
  } catch (err) {
    console.warn('[ea-sync] fetch failed:', err);
    return null;
  }
}

export async function pushAlgorithms(entries) {
  if (!entries || !entries.length) return true;
  const session = await ownedSession();
  if (!session) return false;
  try {
    const { error } = await supabase
      .from('eternal_algorithms')
      .upsert(entries.map(algorithmToRow), { onConflict: 'owner,id' });
    if (error) { console.warn('[ea-sync] push failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[ea-sync] push failed:', err);
    return false;
  }
}

export async function tombstoneAlgorithms(ids, nowIso) {
  if (!ids || !ids.length) return true;
  const session = await ownedSession();
  if (!session) return false;
  try {
    const at = nowIso || new Date().toISOString();
    const { error } = await supabase
      .from('eternal_algorithms')
      .upsert(ids.map((id) => ({ id, doc: {}, published: false, deleted: true, updated_at: at })), { onConflict: 'owner,id' });
    if (error) { console.warn('[ea-sync] tombstone failed:', error); return false; }
    return true;
  } catch (err) {
    console.warn('[ea-sync] tombstone failed:', err);
    return false;
  }
}

export function subscribeAlgorithmsRealtime(onRemoteChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await ownedSession();
    if (!session || cancelled) return;
    try {
      channel = supabase
        .channel('ea-sync-stream')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eternal_algorithms' }, () => { if (!cancelled) onRemoteChange(); })
        .subscribe();
    } catch (err) {
      console.warn('[ea-sync] realtime subscribe failed:', err);
    }
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) { try { supabase.removeChannel(channel); } catch { /* closed */ } }
  };
}

// --- The public window (the pulpit's read; anon-friendly) ----------------------

// Shape the church surface renders. NULL four_d_summary means the owner kept
// the deep layer private for that entry — the surface omits the section, it
// never paints a placeholder.
export function normalizePublished(row) {
  return {
    id: String(row?.id || ''),
    name: String(row?.name || '').trim(),
    outcome: String(row?.outcome || '').trim(),
    threeD: String(row?.three_d_summary || '').trim(),
    fourD: row?.four_d_summary ? String(row.four_d_summary).trim() : null,
    scripture: String(row?.scripture || '').trim(),
    tags: Array.isArray(row?.tags) ? row.tags.map((t) => String(t)) : [],
    publishedAt: row?.published_at || null,
  };
}

// --- Pure: scripture cross-reference (the Word is the join key) ---------------
// "Scriptures are eternal algorithms" (Darrell 2026-07-03): the Scripture tab
// shows which PUBLISHED algorithms a verse anchors. Matching is honest and
// conservative: same book + chapter, and where both sides carry verse numbers
// the ranges must OVERLAP (Jas 1:27 does not match an algorithm anchored at
// Jas 1:2-4). A ref with no verse part matches the whole chapter.

// "1 Corinthians 2:16" -> { book:'1 corinthians', chapter:2, v1:16, v2:16 }
// "James 1:2-4"        -> { book:'james', chapter:1, v1:2, v2:4 }
// "Psalm 23"           -> { book:'psalm', chapter:23, v1:null, v2:null }
export function parseScriptureRef(refStr) {
  const m = String(refStr || '').trim().match(/^([1-3]?\s*[A-Za-z][A-Za-z .]*?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!m) return null;
  const book = m[1].toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const chapter = parseInt(m[2], 10);
  const v1 = m[3] ? parseInt(m[3], 10) : null;
  const v2 = m[4] ? parseInt(m[4], 10) : v1;
  return { book, chapter, v1, v2 };
}

export function refsOverlap(aStr, bStr) {
  const a = parseScriptureRef(aStr);
  const b = parseScriptureRef(bStr);
  if (!a || !b) return false;
  if (a.book !== b.book || a.chapter !== b.chapter) return false;
  if (a.v1 == null || b.v1 == null) return true; // chapter-level ref matches the chapter
  return a.v1 <= b.v2 && b.v1 <= a.v2;
}

// The published algorithms (fetchPublishedAlgorithms shape) anchored at refStr.
export function algorithmsAnchoredAt(refStr, published) {
  if (!refStr || !Array.isArray(published)) return [];
  return published.filter((alg) =>
    String(alg.scripture || '').split(';').some((r) => refsOverlap(refStr, r.trim())));
}

export async function fetchPublishedAlgorithms() {
  try {
    const { data, error } = await supabase.rpc('eternal_algorithms_public');
    if (error) { console.warn('[ea-sync] public fetch failed:', error); return []; }
    return (data || []).map(normalizePublished).filter((a) => a.name);
  } catch (err) {
    console.warn('[ea-sync] public fetch failed:', err);
    return [];
  }
}
