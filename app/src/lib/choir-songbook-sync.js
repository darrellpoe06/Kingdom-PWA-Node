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
import { parseServiceTitle } from './choir-sync.js';
import { parseRepertoireJson, buildArchiveSongsFromChannel, selectNewArchiveSongs, attributeToCorpus } from './choir-archive.js';

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

// --- Archive sourcing: auto-seed the historical repertoire (0042) ------------
// The choir's PAST songs are inside the church archive (the YouTube channel +
// NAS recordings the content engine uses). Two faithful sources feed the seed,
// both reviewed before they are trusted (see lib/choir-archive.js):
//   importRepertoireJson — the SME/content pipeline's reviewed per-song extract.
//   scanArchiveForSongs  — song lists / chapters in the channel's video
//                          DESCRIPTIONS (real-today, always needs_review).
// Both insert into choir_songs (the cross-referenced Songbook home), deduped by
// (video_id, title), owner/admin via RLS.

async function archiveWriteContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

// The service videos we ALREADY have (choir_sermons) — the corpus the historical
// repertoire is harvested from. Read-only; degrades to [] so a corpus read never
// blocks an import. Used to REUSE each service's existing video link + date
// instead of re-fetching the channel (one source, two harvests).
async function fetchServiceCorpus(ctx) {
  const { data, error } = await supabase.from('choir_sermons')
    .select('video_id, youtube_url, service_date, service_type').eq('instance_id', ctx.tenantId);
  if (error) { console.warn('[choir-songbook] service corpus fetch failed:', error); return []; }
  return (data || []).map((r) => ({
    videoId: r.video_id, youtubeUrl: r.youtube_url, serviceDate: r.service_date, serviceType: r.service_type,
  }));
}

// Map a choir-archive row (parseRepertoireJson / buildArchiveSongsFromChannel)
// to a choir_songs insert row. Exported (pure) so the persist guard can assert
// every column it writes actually exists in the migrations — the deterministic
// catch for the "archive insert silently fails on a missing column" class that
// keeps the Songbook empty even after a successful scan/import.
export function archiveRowToInsert(ctx, r) {
  return {
    instance_id: ctx.tenantId,
    created_by: ctx.userId,
    title: r.title,
    youtube_url: r.youtubeUrl,
    video_id: r.videoId,
    start_seconds: Number.isFinite(r.startSeconds) ? r.startSeconds : null,
    service_date: r.serviceDate || null,
    service_type: r.serviceType || 'sunday',
    scripture_ref: r.scriptureRef || null,
    source: 'archive',
    confidence: r.confidence || null,
    needs_review: r.needsReview !== false,
    status: 'active',
  };
}

async function insertArchiveRows(ctx, rows) {
  // Dedup against what's already seeded (idempotent re-seed).
  const { data: existing } = await supabase.from('choir_songs').select('video_id, title').eq('instance_id', ctx.tenantId);
  const fresh = selectNewArchiveSongs(rows, (existing || []).map((e) => ({ videoId: e.video_id, title: e.title })));
  if (!fresh.length) return { imported: 0, scanned: rows.length };
  const { error } = await supabase.from('choir_songs').insert(fresh.map((r) => archiveRowToInsert(ctx, r)));
  if (error) return { skipped: 'insert-error', error };
  return { imported: fresh.length, scanned: rows.length };
}

// Import the pipeline's repertoire.json (paste/upload) into the Songbook. Each
// song is attributed to the service it was sung in — REUSING the existing service
// video we already hold (choir_sermons) for its link + date — so the imported
// song lands as a rendition of that real, historical service (one source, two
// harvests; reuse, don't re-fetch).
export async function importRepertoireJson(jsonText, displayName) {
  let parsed;
  try { parsed = parseRepertoireJson(jsonText); }
  catch (e) { return { skipped: 'bad-json', error: e }; }
  if (!parsed.rows.length) return { skipped: 'empty', unclear: parsed.unclear };
  const ctx = await archiveWriteContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  const corpus = await fetchServiceCorpus(ctx);
  const { rows, scope } = attributeToCorpus(parsed.rows, corpus);
  const res = await insertArchiveRows(ctx, rows);
  return res.skipped ? res : { ...res, unclear: parsed.unclear, linked: scope.matched, unlinked: scope.unmatched };
}

// Scan the church YouTube channel's recent uploads and seed any songs listed in
// their descriptions / chapters (real metadata; always needs_review). Idempotent.
const CHURCH_CHANNEL_HANDLE = 'thelovecorner';
async function ytApi(path, key) {
  const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}&key=${encodeURIComponent(key)}`);
  if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`YouTube API ${res.status}: ${body.slice(0, 160)}`); }
  return res.json();
}

export async function scanArchiveForSongs(displayName) {
  const key = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YOUTUBE_API_KEY) || '';
  if (!key) return { skipped: 'no-key' };
  const ctx = await archiveWriteContext(displayName);
  if (ctx.error) return { skipped: ctx.error };
  try {
    const ch = await ytApi(`channels?part=contentDetails&forHandle=${encodeURIComponent('@' + CHURCH_CHANNEL_HANDLE)}`, key);
    const uploads = ch?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploads) return { skipped: 'channel-not-found' };
    const pl = await ytApi(`playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(uploads)}`, key);
    const items = (pl?.items || []).map((i) => {
      const parsed = parseServiceTitle(i?.snippet?.title || '');
      return {
        videoId: i?.contentDetails?.videoId,
        title: i?.snippet?.title,
        description: i?.snippet?.description || '',
        serviceDate: parsed.serviceDate || null,
        serviceType: parsed.serviceType || 'sunday',
      };
    });
    const built = buildArchiveSongsFromChannel(items);
    if (!built.length) return { imported: 0, scanned: items.length, songsFound: 0 };
    // Reuse the services we already hold for each song's link + date.
    const { rows } = attributeToCorpus(built, await fetchServiceCorpus(ctx));
    const res = await insertArchiveRows(ctx, rows);
    return res.skipped ? res : { ...res, songsFound: rows.length };
  } catch (e) {
    return { skipped: 'api-error', error: e };
  }
}

// A steward confirms an archive-seeded song is correct (clears needs_review), or
// rejects it (deletes the seeded row). Owner/admin via RLS.
export async function confirmArchiveSong(rowId) {
  const { error } = await supabase.from('choir_songs').update({ needs_review: false }).eq('id', rowId);
  return error ? { skipped: 'update-error', error } : { saved: true };
}
