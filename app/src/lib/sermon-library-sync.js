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

// How many transcripts one call may carry. A transcript is the FULL caption
// text of a service, so this is the only read in this module whose rows are
// measured in tens of kilobytes rather than bytes — the cap is what keeps a
// phone from paying for the whole archive to show a few lines of outline.
export const TRANSCRIPT_BATCH_CAP = 60;

/**
 * Transcript text for NAMED videos, keyed by video id. RLS: user_in_choir
 * read; a non-member gets {}.
 *
 * WHY THIS TAKES IDS (DR-1057). Until 2026-10-15 this module's transcript read
 * was `select('video_id,text')` with NO WHERE and NO LIMIT — the full caption
 * text of every service the church has ever posted, pulled to the phone on
 * arrival at The Word. Darrell, that day: "We need to find out why it takes
 * long to populating these tabs."
 *
 * What made it worth fixing rather than tuning is what the bytes were FOR. The
 * transcript is the THIRD precedence in sermon-points.js — BG's prep outline
 * wins, then the harvest row, and only then is an outline derived from the
 * captions — and the derivation yields at most 8 short strings
 * (extractSermonPoints limit: 8). So for every message that already had prep,
 * the whole transcript was read and discarded.
 *
 * The discipline was already in this repo, one call site over: Choir.jsx fetches
 * transcripts only when somebody taps "draft words", and caches them. The Word
 * fetched eagerly on arrival. Same function, two call sites, opposite habits.
 */
export async function fetchTranscriptsFor(videoIds = [], { cap = TRANSCRIPT_BATCH_CAP } = {}) {
  const ids = [...new Set((Array.isArray(videoIds) ? videoIds : [])
    .filter((v) => typeof v === 'string' && v.trim()))].slice(0, Math.max(0, cap));
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from('video_transcripts').select('video_id,text').in('video_id', ids);
  if (error) { console.warn('[sermon-library] transcripts fetch failed:', error); return {}; }
  const out = {};
  for (const r of data || []) {
    const text = r && typeof r.text === 'string' ? r.text : '';
    if (r && r.video_id && text.trim()) out[r.video_id] = { text };
  }
  return out;
}

/**
 * Pure. WHICH messages actually need a transcript, newest first.
 *
 * Only the ones the first two precedences do not already answer. Exported so
 * the saving is a tested property and not a claim: the set this returns is
 * exactly what crosses the wire.
 */
export function videosNeedingTranscript(sermons = [], { prepBySermon = {}, harvestsByVideo = {}, videoIdOf = (s) => s && s.videoId, cap = TRANSCRIPT_BATCH_CAP } = {}) {
  const out = [];
  for (const s of Array.isArray(sermons) ? sermons : []) {
    if (!s) continue;
    if (prepBySermon[s.id]) continue;              // BG's own outline wins
    const vid = videoIdOf(s);
    if (!vid) continue;                            // nothing to key a transcript by
    if (harvestsByVideo[vid]) continue;            // the harvest lane already has refs
    out.push(vid);
    if (out.length >= cap) break;
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

// The two CHEAP points sources, in one shot. Returns { prepBySermon,
// harvestsByVideo }. Transcripts are deliberately NOT here any more (DR-1057):
// they are the expensive source and the least-preferred one, so they are
// fetched after these land, only for the messages these two did not answer.
export async function fetchPointsData() {
  const [prepBySermon, harvestsByVideo] = await Promise.all([
    fetchPrepBySermon(),
    fetchHarvestsByVideo(),
  ]);
  return { prepBySermon, harvestsByVideo };
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
