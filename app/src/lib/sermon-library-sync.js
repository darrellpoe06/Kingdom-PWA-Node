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
import { publicRpc } from './public-rpc.js';
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
// points + scripture feed, migration 0067). RLS: OWNER/ADMIN read only (0101 —
// Darrell: only he, BG, and Christina see the prep). A non-leader gets {}; the
// PUBLIC points below is how everyone else gets the published outline.
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

// The PUBLIC teaching outline — points + scriptures + theme for PUBLISHED
// (non-draft) messages, via the SECURITY DEFINER RPC (0101). Readable by EVERYONE
// (signed in or not); NO notes (they aren't in prep), NO drafts. This is how the
// public library shows BG's key points + scriptures without exposing the prep
// itself (Darrell 2026-07-14). Keyed by sermon id, same shape as fetchPrepBySermon.
export async function fetchPublicPoints() {
  // Rides publicRpc (anon + hard deadline), NEVER the shared client — same
  // cross-tab auth-lock hang that stranded the public library (fetchPublicSermons).
  // This is enrichment (points under each video), so absence is fine: it keeps the
  // {}-on-error contract and never strands the surface.
  const { data, error } = await publicRpc('theword_public_points');
  if (error) { console.warn('[sermon-library] public points fetch failed:', error); return {}; }
  const out = {};
  for (const r of data || []) {
    if (r && r.sermon_id) {
      out[r.sermon_id] = {
        points: Array.isArray(r.points) ? r.points : [],
        scriptures: Array.isArray(r.scriptures) ? r.scriptures : [],
        theme: r.theme || '', anchor: null, source: 'prep', needsReview: false,
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
