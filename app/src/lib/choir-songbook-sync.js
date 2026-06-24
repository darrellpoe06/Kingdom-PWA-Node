// =============================================================================
// choir-songbook-sync — Supabase I/O for the Songbook's "most-loved" hearts.
// =============================================================================
// The community-engagement half of the Songbook: any choir member taps ❤ on a
// song and the most-loved rise to the top. The SAME shared primitive as the song
// workshop's votes (choir_song_votes / tallyVotes / toggleSongVote in
// song-workshop-sync.js) — reused, not re-rolled — but keyed by the song's
// normalized TITLE (choir_song_loves, 0041) so a love stays attached across every
// Sunday the song is re-scheduled (the set-list creates a fresh row per date).
//
// Cross-reference META (themes / key / arrangement / soloist / sermon link) and
// "add to a service" both ride the canonical choir_songs writers in choir-sync.js
// (saveSong / reuseSong) — this file adds ONLY the loves table, so it keeps the
// Songbook's edit-surface off that hot file (same discipline as 0036's workshop).
//
// All pure cross-reference logic (buildSongbook, suggestSongsForSermon, …) lives
// in lib/choir-songbook.js. Writes fail soft + surface { skipped } to the caller.
// RLS is the real enforcement; the client mirrors it only so the UI matches.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { normalizeTitle } from './choir-songbook.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// --- Pure mapper (exported for tests) ----------------------------------------

export function toLoveShape(row, myUserId) {
  return {
    id: row.id,
    titleKey: row.title_key,
    userId: row.user_id ?? null,
    mine: !!myUserId && row.user_id === myUserId,
  };
}

// --- Realtime subscriber (mirror choir-sync.makeSubscriber) ------------------

export function subscribeSongLoves(onChange) {
  let channel = null;
  let cancelled = false;
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    const myUserId = session.user.id;
    const fetchAll = async () => {
      const { data, error } = await supabase.from('choir_song_loves').select('*');
      if (error) { console.warn('[choir-songbook] loves fetch failed:', error); return null; }
      return (data || []).map((r) => toLoveShape(r, myUserId));
    };
    const initial = await fetchAll();
    if (initial && !cancelled) onChange(initial);
    channel = supabase
      .channel('choir_song_loves-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'choir_song_loves' }, () => {
        fetchAll().then((rows) => { if (rows && !cancelled) onChange(rows); });
      })
      .subscribe();
  })();
  return function unsubscribe() {
    cancelled = true;
    if (channel) supabase.removeChannel(channel);
  };
}

// --- Write -------------------------------------------------------------------

// Toggle the current member's love for a song (by its normalized title).
// hasLoved=true clears it. Accepts a raw title or an already-normalized key.
export async function toggleSongLove(titleOrKey, hasLoved, displayName) {
  const titleKey = normalizeTitle(titleOrKey);
  if (!titleKey) return { skipped: 'no-title' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { skipped: 'no-church' };
  const userId = session.user.id;
  if (hasLoved) {
    const { error } = await supabase.from('choir_song_loves')
      .delete().eq('instance_id', tenantId).eq('title_key', titleKey).eq('user_id', userId);
    return error ? { skipped: 'delete-error', error } : { saved: true, loved: false };
  }
  const { error } = await supabase.from('choir_song_loves')
    .insert({ instance_id: tenantId, title_key: titleKey, user_id: userId });
  return error ? { skipped: 'insert-error', error } : { saved: true, loved: true };
}

// Set a song's cross-reference metadata (themes / key / arrangement / soloist /
// sermon link) across ALL its set-list rows at once, so the song's tags stay
// coherent (a theme removed here is removed everywhere, not masked by an old
// row in the union). Owner/admin only (RLS). rowIds come from the Songbook
// entity (buildSongbook). Only the cross-ref columns are touched.
export async function saveSongCrossRef(rowIds, fields) {
  const ids = (rowIds || []).filter(Boolean);
  if (!ids.length) return { skipped: 'no-rows' };
  const patch = {
    themes: Array.isArray(fields.themes) ? fields.themes : [],
    song_key: (fields.songKey || '').trim() || null,
    arrangement: (fields.arrangement || '').trim() || null,
    soloist: (fields.soloist || '').trim() || null,
  };
  if (fields.sermonRef !== undefined) patch.sermon_ref = fields.sermonRef || null;
  const { error } = await supabase.from('choir_songs').update(patch).in('id', ids);
  return error ? { skipped: 'update-error', error } : { saved: true, count: ids.length };
}
