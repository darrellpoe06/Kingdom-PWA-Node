// =============================================================================
// sermon-library-sync — Supabase wiring for the enriched sermon video library.
// =============================================================================
// Feeds two enrichments that ride ON TOP of the public message library (Pulpit):
//
//   1. ENGAGEMENT — in-app hearts/likes + YouTube public stats (migration 0063),
//      so the library ranks by what resonates. Privacy path: aggregate counts via
//      the sermon_reaction_counts() RPC (no user_id), the caller's OWN rows for
//      toggle state, and sermon_video_stats for views/likes. The pure map/score
//      math lives in sermon-engagement.js.
//
//   2. POINTS SOURCE — the video_transcripts (0058) + video_harvests (0050) rows a
//      signed-in church member can read, so sermon-points.js can attach BG's
//      numbered outline under each video. The pure extraction lives in
//      sermon-points.js.
//
// EVERY fetch degrades to empty on error (RLS denies a non-member, or the table
// isn't migrated on this cloud yet) — the library then shows videos + title-level
// scriptures + an honest empty engagement state, and never throws. This is the
// graceful-until-backfilled contract: points come alive as transcripts land, and
// view counts as the stats loader runs, with no broken/empty state in between.
// =============================================================================
import supabase from './supabase.js';
import { churchInstanceId } from './church-instance.js';
import { toHarvestShape } from './harvest-ledger.js';
import { buildEngagementMap, isReactionKind } from './sermon-engagement.js';

async function currentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

// --- Points-source data ------------------------------------------------------

// Transcript text keyed by video id. Empty/no-caption rows are skipped (a blank
// transcript is not a transcript). RLS: user_in_choir read; a non-member gets [].
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

// Both points sources in one shot (parallel). Returns { transcriptsByVideo,
// harvestsByVideo } — the two maps sermon-points.pointsForVideo() consumes.
export async function fetchPointsData() {
  const [transcriptsByVideo, harvestsByVideo] = await Promise.all([
    fetchTranscriptsByVideo(),
    fetchHarvestsByVideo(),
  ]);
  return { transcriptsByVideo, harvestsByVideo };
}

// --- Engagement data ---------------------------------------------------------

// Aggregate per-video reaction counts via the SECURITY DEFINER RPC (no user_id
// leak). Returns [{ videoId, kind, count }].
async function fetchReactionCounts(instanceId) {
  if (!instanceId) return [];
  const { data, error } = await supabase.rpc('sermon_reaction_counts', { p_instance: instanceId });
  if (error) { console.warn('[sermon-library] reaction counts failed:', error); return []; }
  return (data || []).map((r) => ({ videoId: r.video_id, kind: r.kind, count: Number(r.count) || 0 }));
}

// The caller's OWN reaction rows (RLS own-only) — lights the toggle state.
async function fetchMyReactions() {
  const { data, error } = await supabase.from('sermon_reactions').select('video_id,kind');
  if (error) { console.warn('[sermon-library] my reactions failed:', error); return []; }
  return (data || []).map((r) => ({ videoId: r.video_id, kind: r.kind }));
}

// YouTube public stats rows (readable by any signed-in user).
async function fetchVideoStats() {
  const { data, error } = await supabase.from('sermon_video_stats').select('*');
  if (error) { console.warn('[sermon-library] video stats failed:', error); return []; }
  return (data || []).map((r) => ({
    videoId: r.video_id,
    ytViews: Number(r.yt_views) || 0,
    ytLikes: Number(r.yt_likes) || 0,
    ytComments: Number(r.yt_comments) || 0,
    source: r.source || 'youtube',
    fetchedAt: r.fetched_at || null,
  }));
}

// Assemble the full engagement map (counts + my toggles + stats). Signed-out ->
// an empty map (every video reads as no-signal-yet), never an error.
export async function fetchEngagementMap(displayName) {
  const session = await currentSession();
  if (!session) return {};
  const instanceId = await churchInstanceId(displayName);
  const [counts, myReactions, stats] = await Promise.all([
    fetchReactionCounts(instanceId),
    fetchMyReactions(),
    fetchVideoStats(),
  ]);
  return buildEngagementMap({ counts, myReactions, stats, myUserId: session.user.id });
}

// Toggle the signed-in member's OWN heart/like on a video. Insert if absent,
// delete if present (idempotent, self-scoped by RLS). Fails soft: a signed-out
// or non-member caller gets a { skipped } result, never a throw.
export async function toggleReaction(videoId, kind = 'heart', displayName) {
  if (!videoId) return { skipped: 'no-video' };
  if (!isReactionKind(kind)) return { skipped: 'bad-kind' };
  const session = await currentSession();
  if (!session) return { skipped: 'signed-out' };
  const instanceId = await churchInstanceId(displayName);
  if (!instanceId) return { skipped: 'no-church' };
  const userId = session.user.id;

  // Does my row already exist?
  const { data: existing, error: readErr } = await supabase
    .from('sermon_reactions')
    .select('id')
    .eq('instance_id', instanceId)
    .eq('video_id', videoId)
    .eq('user_id', userId)
    .eq('kind', kind)
    .maybeSingle();
  if (readErr) return { skipped: 'read-error', error: readErr };

  if (existing) {
    const { error } = await supabase.from('sermon_reactions').delete().eq('id', existing.id);
    return error ? { skipped: 'delete-error', error } : { removed: true };
  }
  const { error } = await supabase.from('sermon_reactions').insert({
    instance_id: instanceId, video_id: videoId, user_id: userId, kind,
  });
  return error ? { skipped: 'insert-error', error } : { added: true };
}

// Subscribe to engagement: initial load + a live recompute whenever reactions or
// stats change. Returns an unsubscribe fn. Signed-out -> a no-op subscription
// that still delivers an empty map once (so the surface renders its empty state).
export function subscribeEngagement(onMap, displayName) {
  let cancelled = false;
  const channels = [];
  const refresh = () => { fetchEngagementMap(displayName).then((m) => { if (!cancelled) onMap(m); }); };
  (async () => {
    const session = await currentSession();
    if (cancelled) return;
    if (!session) { onMap({}); return; }
    refresh();
    for (const table of ['sermon_reactions', 'sermon_video_stats']) {
      const ch = supabase
        .channel(`sermon-engagement-${table}`)
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
