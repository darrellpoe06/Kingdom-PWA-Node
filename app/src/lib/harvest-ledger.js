// =============================================================================
// harvest-ledger — Supabase wiring for the video harvest coverage ledger
// =============================================================================
// Backs the video_harvests table (migration 0050) and JOINS it over the real
// corpus — choir_sermons (the ingested videos) + choir_songs (linked back via
// source_video_id) — so the coverage ledger reflects REAL state. The pure math
// lives in video-harvest.js; this module only fetches, subscribes, and writes.
//
// ACCESS mirrors the choir module: read = any choir member (user_in_choir);
// write = owner/admin (RLS-enforced, 0050). The client mirrors that with
// getChoirAccess() at the surface; RLS is the real wall either way.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { toSermonShape, toSongShape } from './choir-sync.js';
import { buildLedger, HARVEST_KEYS } from './video-harvest.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// --- Pure mappers ------------------------------------------------------------

export function toHarvestShape(row) {
  return {
    id: row.id,
    videoId: row.video_id,
    sourceKind: row.source_kind ?? 'service',
    serviceDate: row.service_date ?? null,
    serviceType: row.service_type ?? null,
    title: row.title ?? null,
    harvests: row.harvests && typeof row.harvests === 'object' ? row.harvests : {},
    notes: row.notes ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

// A song row carries source_video_id only after 0050; map it through (back-compat
// null) so buildLedger can link songs to the video they were harvested from.
export function toLinkedSongShape(row) {
  return { ...toSongShape(row), sourceVideoId: row.source_video_id ?? null };
}

// Fold video_transcripts rows into the { [videoId]: { text } } shape buildLedger
// consumes. Only rows with real text count — an empty/no-caption row (recorded so
// the loader stops retrying it) is NOT a transcript and must not light the
// transcript harvests. This is the un-freeze: with a transcript present, the
// fromTranscript harvests (lessons/discernment/testimony/trivia + the full
// Scripture sweep) derive LIVE in the app (video-harvest.js deriveSignals), no
// GPU, no Whisper, no n8n.
export function transcriptsByVideo(rows) {
  const out = {};
  for (const r of rows || []) {
    const text = r && typeof r.text === 'string' ? r.text : '';
    if (r && r.video_id && text.trim()) out[r.video_id] = { text };
  }
  return out;
}

// --- Combined fetch ----------------------------------------------------------

// Pull the three sources and assemble the coverage ledger. Each fetch degrades to
// [] on error (the surface never throws); buildLedger then honestly shows the
// rest. Returns the full harvestLedgerSummary plus the raw harvest rows (so the
// surface can edit a row by id).
export async function fetchLedger() {
  const [sermonsRes, harvestsRes, songsRes, transcriptsRes] = await Promise.all([
    supabase.from('choir_sermons').select('*'),
    supabase.from('video_harvests').select('*'),
    supabase.from('choir_songs').select('*'),
    // The transcript source (0058). Select only what buildLedger needs. Degrades
    // to [] if the table isn't migrated yet (older cloud) — the ledger then shows
    // the fromRow harvests exactly as before (the ~22% floor), never throwing.
    supabase.from('video_transcripts').select('video_id,text'),
  ]);
  if (sermonsRes.error) console.warn('[harvest-ledger] sermons fetch failed:', sermonsRes.error);
  if (harvestsRes.error) console.warn('[harvest-ledger] harvests fetch failed:', harvestsRes.error);
  if (songsRes.error) console.warn('[harvest-ledger] songs fetch failed:', songsRes.error);
  if (transcriptsRes.error) console.warn('[harvest-ledger] transcripts fetch failed:', transcriptsRes.error);

  const sermons = (sermonsRes.data || []).map(toSermonShape);
  const harvestRows = (harvestsRes.data || []).map(toHarvestShape);
  const songs = (songsRes.data || []).map(toLinkedSongShape);
  const transcripts = transcriptsByVideo(transcriptsRes.data);

  // Passing transcripts is what un-freezes the % past 22%: buildLedger ->
  // deriveSignals lights the fromTranscript harvests for every video that has one.
  const summary = buildLedger({ sermons, harvests: harvestRows, songs, transcripts });
  // Index raw harvest rows by video so the surface can resolve an existing row id.
  const rawByVideo = {};
  for (const h of harvestRows) rawByVideo[h.videoId] = h;
  // Corpus-wide transcript coverage — the observable stall signal (how many
  // videos still owe a transcript). Never a silent hang: the surface shows it.
  const transcribedVideos = Object.keys(transcripts).length;
  return { ...summary, rawByVideo, transcribedVideos };
}

// Subscribe to the ledger: initial load + a live recompute whenever any of the
// three underlying tables changes. Returns an unsubscribe fn.
export function subscribeLedger(onChange) {
  let cancelled = false;
  const channels = [];
  const refresh = () => {
    fetchLedger().then((ledger) => { if (!cancelled) onChange(ledger); });
  };
  (async () => {
    const session = await currentSession();
    if (!session || cancelled) return;
    refresh();
    for (const table of ['video_harvests', 'choir_sermons', 'choir_songs', 'video_transcripts']) {
      const ch = supabase
        .channel(`harvest-ledger-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
        .subscribe();
      channels.push(ch);
    }
  })();
  return function unsubscribe() {
    cancelled = true;
    for (const ch of channels) supabase.removeChannel(ch);
  };
}

// --- Writes (owner/admin via RLS; fail soft) ---------------------------------

async function writeContext(displayName) {
  const session = await currentSession();
  if (!session) return { error: 'signed-out' };
  const tenantId = await churchInstanceId(displayName);
  if (!tenantId) return { error: 'no-church' };
  return { tenantId, userId: session.user.id };
}

function isoNow() {
  // Date.now()/new Date() are fine in app code (only workflow scripts ban them).
  return new Date().toISOString();
}

// Record (or update) one harvest type for a video. Upserts the ledger row by
// (instance_id, video_id) — idempotent: re-recording the same type overwrites
// that type's record and leaves the others untouched. `meta` carries the source
// video's date/type/title so an orphan row created here is self-describing.
export async function recordHarvest(videoId, typeKey, record, meta, displayName) {
  if (!videoId) return { skipped: 'no-video' };
  if (!HARVEST_KEYS.includes(typeKey)) return { skipped: 'bad-type' };
  const ctx = await writeContext(displayName);
  if (ctx.error) return { skipped: ctx.error };

  const status = ['none', 'partial', 'complete', 'na'].includes(record?.status) ? record.status : 'complete';
  const entry = {
    status,
    count: Number.isFinite(record?.count) ? record.count : (status === 'complete' ? 1 : 0),
    refs: Array.isArray(record?.refs) ? record.refs : [],
    note: record?.note ?? null,
    harvested_at: isoNow(),
    harvested_by: ctx.userId,
  };

  // Read the existing row (if any) so we merge into its harvests jsonb.
  const { data: existing } = await supabase
    .from('video_harvests')
    .select('id, harvests')
    .eq('instance_id', ctx.tenantId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (existing) {
    const next = { ...(existing.harvests && typeof existing.harvests === 'object' ? existing.harvests : {}), [typeKey]: entry };
    const { error } = await supabase
      .from('video_harvests')
      .update({ harvests: next, updated_by: ctx.userId })
      .eq('id', existing.id);
    return error ? { skipped: 'update-error', error } : { saved: true };
  }

  const { error } = await supabase.from('video_harvests').insert({
    instance_id: ctx.tenantId,
    created_by: ctx.userId,
    video_id: videoId,
    source_kind: meta?.sourceKind || 'service',
    service_date: meta?.serviceDate || null,
    service_type: meta?.serviceType || null,
    title: meta?.title || null,
    harvests: { [typeKey]: entry },
  });
  return error ? { skipped: 'insert-error', error } : { saved: true };
}

// Mark a harvest type genuinely absent for a video (e.g. a Bible study with no
// choir song). Records the honest 'na' so it stops reading as a gap.
export async function markHarvestNotApplicable(videoId, typeKey, meta, displayName) {
  return recordHarvest(videoId, typeKey, { status: 'na' }, meta, displayName);
}
