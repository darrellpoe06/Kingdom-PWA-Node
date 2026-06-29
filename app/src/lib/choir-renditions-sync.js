// =============================================================================
// choir-renditions-sync — Supabase I/O for the per-rendition surface:
//   • rendition-level loves (which VERSION the body loved most), and
//   • writing a rendition's ad-libs / keyboardist notes / archive source, and
//   • graduating a loved ad-lib into the song's kept arrangement.
// =============================================================================
// The rendition data ITSELF needs no fetch here — a rendition is a choir_songs
// row, already streamed by choir-sync.subscribeSongs. This file adds ONLY the
// rendition_loves stream + the focused writers, keeping the per-rendition edit
// surface off the hot choir-sync.js (same discipline as 0041's songbook-sync).
//
// The loves primitive mirrors choir_song_loves (0041) exactly — same shape, same
// fail-soft, same RLS-mirrored client — but keyed by the rendition (choir_songs
// row id), not the title. Writes fail soft + surface { skipped } to the caller.
// RLS is the real enforcement; the client mirrors it only so the UI matches.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { parseAdLibs } from './choir-renditions.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// --- Pure mapper (exported for tests) ----------------------------------------

export function toRenditionLoveShape(row, myUserId) {
  return {
    id: row.id,
    renditionId: row.rendition_id,
    userId: row.user_id ?? null,
    mine: !!myUserId && row.user_id === myUserId,
  };
}

// --- Realtime subscriber (mirror choir-songbook-sync.subscribeSongLoves) ------

export function subscribeRenditionLoves(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('choir_rendition_loves').select('*');
      if (error) { console.warn('[choir-renditions] loves fetch failed:', error); return null; }
      return (data || []).map((r) => toRenditionLoveShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('choir_rendition_loves-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choir_rendition_loves' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// --- Writes ------------------------------------------------------------------

// Toggle the current member's love for a specific RENDITION (a choir_songs row).
// hasLoved=true clears it. Any choir member may love any rendition (RLS).
export async function toggleRenditionLove(renditionId, hasLoved, displayName) {
  if (!renditionId) return { skipped: 'no-rendition' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-church' };
  const userId = session.user.id;
  if (hasLoved) {
    const { error } = await supabase.from('choir_rendition_loves')
      .delete().eq('instance_id', tenantId).eq('rendition_id', renditionId).eq('user_id', userId);
    return error ? { skipped: 'delete-error', error } : { saved: true, loved: false };
  }
  const { error } = await supabase.from('choir_rendition_loves')
    .insert({ instance_id: tenantId, rendition_id: renditionId, user_id: userId });
  return error ? { skipped: 'insert-error', error } : { saved: true, loved: true };
}

// Save a single rendition's per-performance detail onto its choir_songs row:
// the ad-libs (normalized JSON array) and the keyboardist's per-performance
// notes (0043). Owner/admin only (RLS). Only the keys provided in `fields` are
// written, so this never clobbers the song's cross-reference columns
// (themes/key/arrangement/soloist, 0041) nor the archive provenance
// (source/video_id/confidence/needs_review, 0042) — those are owned elsewhere.
// Returns { skipped } on failure.
export async function saveRenditionDetail(renditionId, fields = {}) {
  if (!renditionId) return { skipped: 'no-rendition' };
  const patch = {};
  if (fields.adLibs !== undefined) patch.ad_libs = parseAdLibs(fields.adLibs);
  if (fields.keyboardistNotes !== undefined) patch.keyboardist_notes = (fields.keyboardistNotes || '').trim() || null;
  if (!Object.keys(patch).length) return { skipped: 'no-fields' };
  const { error } = await supabase.from('choir_songs').update(patch).eq('id', renditionId);
  return error ? { skipped: 'update-error', error } : { saved: true };
}

// Graduate a loved ad-lib into the song's KEPT arrangement — set the new
// arrangement text across ALL the song's set-list rows (rowIds, from the
// Songbook entity) so the kept move becomes the song's standing arrangement and
// rides forward onto reused/future renditions (buildReusedSong carries it). The
// arrangement string is computed by lib/choir-renditions.graduateAdLib (pure).
// Owner/admin only (RLS). Touches ONLY the arrangement column.
export async function graduateAdLibToArrangement(rowIds, arrangement) {
  const ids = (rowIds || []).filter(Boolean);
  if (!ids.length) return { skipped: 'no-rows' };
  const { error } = await supabase.from('choir_songs')
    .update({ arrangement: (arrangement || '').trim() || null }).in('id', ids);
  return error ? { skipped: 'update-error', error } : { saved: true, count: ids.length };
}
