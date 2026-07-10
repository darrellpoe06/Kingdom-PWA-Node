// =============================================================================
// sermon-library-sync — Supabase wiring for the sermon library's POINTS + the
// SECONDARY YouTube stats display. (In-app reactions — the PRIMARY signal — are
// the content-agnostic primitive in reactions-sync.js, keyed content_type='sermon'.)
// =============================================================================
// Two enrichments that ride on the public message library (Pulpit):
//   1. POINTS SOURCE — video_transcripts (0058) + video_harvests (0050) rows a
//      signed-in church member can read, so sermon-points.js attaches BG's
//      numbered outline under each video.
//   2. YOUTUBE STATS (secondary) — sermon_video_stats (0063), the public
//      view/like numbers, shown as supplementary display + the "Most viewed"
//      sort. NOT the ranking source — in-app reactions rank the library.
//
// Every fetch degrades to empty on error (RLS-deny / un-migrated cloud), so the
// library shows videos + title scriptures + an honest empty state, never throwing.
// =============================================================================
import supabase from './supabase.js';
import { toHarvestShape } from './harvest-ledger.js';
import { toStatsShape } from './sermon-engagement.js';

// --- Points-source data ------------------------------------------------------

// Transcript text keyed by video id. Empty/no-caption rows are skipped. RLS:
// user_in_choir read; a non-member gets [].
export async function fetchTranscriptsByVideo() {
  const { data, error } = await supabase.from('video_transcripts').select('video_id,text');
  if (error) { console.warn('[sermon-library] transcripts fetch failed:', error); return {}; }
  const out = {};
  for (const r of data || []) {
    const text = r && typeof r.text === 'string' ? r.text : '';
    if (r && r.video_id && text.trim()) out[r.video_id] = { text };
  }
  return out;
}

// Sovereign caption tracks keyed by video id (migration 0095: video_transcripts
// gains vtt + cue_count). Returns only rows that carry a REAL timestamped track
// (non-empty vtt AND cue_count > 0) — an untimed transcript is NOT a caption
// (captions.js hasCaptions / DR-0076). Provenance (source) + lang ride along so
// the panel can show "Captions: YouTube auto-captions | Whisper (sovereign)".
//
// DEGRADE-SAFE ORDERING: the vtt/cue_count columns only exist once migration 0095
// applies. If this select runs against a not-yet-migrated cloud (the deploy can
// briefly precede the migration), selecting vtt errors — so we catch it and
// RETRY with the guaranteed-present columns, returning {} rather than throwing.
// This keeps the existing transcript/points path (fetchTranscriptsByVideo, which
// this never touches) working, and lights captions up the moment the column lands.
export async function fetchCaptionsByVideo() {
  let data;
  const full = await supabase.from('video_transcripts').select('video_id,vtt,cue_count,source,lang');
  if (full.error) {
    // Almost always "column vtt does not exist" pre-migration — degrade quietly.
    console.warn('[sermon-library] captions fetch (pre-migration?):', full.error.message);
    return {};
  }
  data = full.data;
  const out = {};
  for (const r of data || []) {
    const vtt = r && typeof r.vtt === 'string' ? r.vtt : '';
    const cues = r && Number.isFinite(r.cue_count) ? r.cue_count : 0;
    if (r && r.video_id && vtt.trim() && cues > 0) {
      out[r.video_id] = { vtt, cueCount: cues, source: r.source || 'youtube-asr', lang: r.lang || 'en' };
    }
  }
  return out;
}

// Recorded harvest rows keyed by video id (for the harvest-lane `lessons` refs
// that become points). RLS: user_in_choir read; non-member gets [].
export async function fetchHarvestsByVideo() {
  const { data, error } = await supabase.from('video_harvests').select('*');
  if (error) { console.warn('[sermon-library] harvests fetch failed:', error); return {}; }
  const out = {};
  for (const raw of data || []) {
    const h = toHarvestShape(raw);
    if (h.videoId) out[h.videoId] = h;
  }
  return out;
}

// BG's parsed pre-service PREP outlines keyed by sermon id (the authoritative
// points + scripture feed, migration 0067). RLS: user_in_choir read; a non-member
// (or an un-migrated cloud) gets {} and the library degrades to transcript/title.
export async function fetchPrepBySermon() {
  const { data, error } = await supabase.from('sermon_prep')
    .select('sermon_id,points,scriptures,theme,anchor,source,needs_review');
  if (error) { console.warn('[sermon-library] prep fetch failed:', error); return {}; }
  const out = {};
  for (const r of data || []) {
    if (r && r.sermon_id) {
      out[r.sermon_id] = {
        points: Array.isArray(r.points) ? r.points : [],
        scriptures: Array.isArray(r.scriptures) ? r.scriptures : [],
        theme: r.theme || '', anchor: r.anchor || null,
        source: r.source || 'email', needsReview: r.needs_review !== false,
      };
    }
  }
  return out;
}

// All points sources in one shot. Returns { prepBySermon, transcriptsByVideo, harvestsByVideo }.
export async function fetchPointsData() {
  const [prepBySermon, transcriptsByVideo, harvestsByVideo] = await Promise.all([
    fetchPrepBySermon(),
    fetchTranscriptsByVideo(),
    fetchHarvestsByVideo(),
  ]);
  return { prepBySermon, transcriptsByVideo, harvestsByVideo };
}

// --- YouTube stats (secondary display + the "Most viewed" sort) --------------

// { [videoId]: { ytViews, ytLikes, ytComments } }. Readable by any signed-in user;
// degrades to {} if the table isn't migrated. NOT the ranking source.
export async function fetchVideoStats() {
  const { data, error } = await supabase.from('sermon_video_stats').select('*');
  if (error) { console.warn('[sermon-library] video stats failed:', error); return {}; }
  const out = {};
  for (const raw of data || []) {
    const s = toStatsShape(raw);
    if (s.videoId) out[s.videoId] = { ytViews: s.ytViews, ytLikes: s.ytLikes, ytComments: s.ytComments };
  }
  return out;
}
