// =============================================================================
// sermon-engagement — PURE ranking math for the sermon video library.
// =============================================================================
// Darrell 2026-07-01: rank/sort the library by engagement — likes + hearts +
// views — so users find what resonates, and so the popularity signal feeds the
// content-marketing flywheel (what's popular -> what to surface / market).
//
// TWO ENGAGEMENT SOURCES, both deterministic (no LLM):
//   · IN-APP hearts + likes — reactions church members give inside the app
//     (sermon_reactions table, migration 0063). The resonance signal that comes
//     alive immediately.
//   · YOUTUBE public stats — views + likes aggregated FROM the channel onto the
//     sovereign backbone (sermon_video_stats table, loaded by a script). Data-IN
//     aggregation: we hold the number, we don't embed a tracker.
//
// This module owns the math only: tally reactions + stats into a per-video
// engagement object, compute a combined score, and sort. The Supabase wiring is
// sermon-engagement-sync.js; the surface is Pulpit.jsx. Pure + import-free ->
// safe in Node + browser + tests, and the ranking is verifiable in isolation.
//
// HONESTY (DR-0076): a count is only ever what's really recorded. A video with no
// reactions and no loaded stats scores 0 and ranks last — an honest "no signal
// yet", never a painted number.
// =============================================================================

// --- Reaction kinds ----------------------------------------------------------
export const REACTION_KINDS = ['heart', 'like'];
export const isReactionKind = (k) => REACTION_KINDS.includes(k);

// Normalize a raw sermon_reactions row to a stable shape.
export function toReactionShape(row) {
  return {
    id: row.id,
    videoId: row.video_id ?? null,
    userId: row.user_id ?? null,
    kind: isReactionKind(row.kind) ? row.kind : 'heart',
    createdAt: row.created_at ?? null,
  };
}

// Normalize a raw sermon_video_stats row (YouTube public stats) to a stable shape.
export function toStatsShape(row) {
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    videoId: row.video_id ?? null,
    ytViews: num(row.yt_views),
    ytLikes: num(row.yt_likes),
    ytComments: num(row.yt_comments),
    source: row.source ?? 'youtube',
    fetchedAt: row.fetched_at ?? null,
  };
}

// =============================================================================
// tallyEngagement — fold reaction rows + stats rows into a per-video map:
//   { [videoId]: { hearts, likes, myHeart, myLike, ytViews, ytLikes, ytComments,
//                  hasStats } }
// `myUserId` (optional) lights myHeart / myLike so the surface can show the
// signed-in user's own toggle state without a second query.
// =============================================================================
export function tallyEngagement(reactions = [], stats = [], myUserId = null) {
  const out = {};
  const ensure = (vid) => {
    if (!out[vid]) out[vid] = { hearts: 0, likes: 0, myHeart: false, myLike: false, ytViews: 0, ytLikes: 0, ytComments: 0, hasStats: false };
    return out[vid];
  };
  for (const raw of reactions) {
    const r = raw && raw.videoId ? raw : (raw && raw.video_id ? toReactionShape(raw) : null);
    if (!r || !r.videoId) continue;
    const e = ensure(r.videoId);
    if (r.kind === 'heart') { e.hearts += 1; if (myUserId && r.userId === myUserId) e.myHeart = true; }
    else if (r.kind === 'like') { e.likes += 1; if (myUserId && r.userId === myUserId) e.myLike = true; }
  }
  for (const raw of stats) {
    const s = raw && raw.videoId !== undefined && raw.ytViews !== undefined ? raw : (raw ? toStatsShape(raw) : null);
    if (!s || !s.videoId) continue;
    const e = ensure(s.videoId);
    e.ytViews = s.ytViews; e.ytLikes = s.ytLikes; e.ytComments = s.ytComments; e.hasStats = true;
  }
  return out;
}

// =============================================================================
// buildEngagementMap — assemble the per-video engagement map from the shapes the
// PRIVACY-RESPECTING data path actually returns:
//   counts:       [{ videoId, kind, count }]  — aggregate totals (RPC; no user_id)
//   myReactions:  [{ videoId, kind }]         — the caller's OWN rows (for toggle)
//   stats:        [ sermon_video_stats rows ]  — YouTube public views/likes
// This is the real path the surface uses; tallyEngagement (raw rows) stays for
// tests + any broadly-readable fallback. Both produce the identical map shape.
// =============================================================================
export function buildEngagementMap({ counts = [], myReactions = [], stats = [], myUserId = null } = {}) {
  const out = {};
  const ensure = (vid) => {
    if (!out[vid]) out[vid] = { hearts: 0, likes: 0, myHeart: false, myLike: false, ytViews: 0, ytLikes: 0, ytComments: 0, hasStats: false };
    return out[vid];
  };
  for (const c of counts) {
    const vid = c.videoId ?? c.video_id;
    if (!vid) continue;
    const e = ensure(vid);
    const n = Number.isFinite(Number(c.count)) ? Number(c.count) : 0;
    if (c.kind === 'heart') e.hearts = n;
    else if (c.kind === 'like') e.likes = n;
  }
  for (const r of myReactions) {
    const vid = r.videoId ?? r.video_id;
    if (!vid) continue;
    const e = ensure(vid);
    if (r.kind === 'heart') e.myHeart = true;
    else if (r.kind === 'like') e.myLike = true;
  }
  for (const raw of stats) {
    const s = raw && raw.ytViews !== undefined ? raw : (raw ? toStatsShape(raw) : null);
    if (!s || !s.videoId) continue;
    const e = ensure(s.videoId);
    e.ytViews = s.ytViews; e.ytLikes = s.ytLikes; e.ytComments = s.ytComments; e.hasStats = true;
  }
  // myUserId is accepted for symmetry with tallyEngagement; own-rows already
  // encode "mine", so it isn't needed here.
  void myUserId;
  return out;
}

// The zero object for a video with no signal yet (keeps the surface branch-free).
export const EMPTY_ENGAGEMENT = Object.freeze({
  hearts: 0, likes: 0, myHeart: false, myLike: false, ytViews: 0, ytLikes: 0, ytComments: 0, hasStats: false,
});

export function engagementFor(map, videoId) {
  return (videoId && map && map[videoId]) || EMPTY_ENGAGEMENT;
}

// =============================================================================
// engagementScore — ONE deterministic "popular" number combining both sources.
// In-app reactions weigh heaviest (they are the intentional resonance signal a
// person gives), then YouTube likes, then a gentle log of views (so a single
// viral video doesn't flatten the whole ranking). Tunable, but fixed + pure so
// the ranking is reproducible and testable.
// =============================================================================
export function engagementScore(e = EMPTY_ENGAGEMENT) {
  const hearts = e.hearts || 0;
  const likes = e.likes || 0;
  const ytLikes = e.ytLikes || 0;
  const ytViews = e.ytViews || 0;
  return hearts * 5 + likes * 3 + ytLikes * 1 + Math.log10(ytViews + 1) * 2;
}

// Sort keys the surface offers. 'newest' is handled by the date primitive; the
// two engagement modes rank by a specific number, tie-broken by newest date.
export const SORT_MODES = [
  { key: 'newest', label: 'Newest' },
  { key: 'hearted', label: 'Most hearted' },
  { key: 'viewed', label: 'Most viewed' },
];
export const isSortMode = (k) => SORT_MODES.some((m) => m.key === k);

// Rank a list of { videoId, serviceDate, ... } by an engagement map + mode.
// Returns a NEW array (does not mutate). Ties break newest-first so equal-signal
// videos still read chronologically. 'popular' is an alias for the combined score.
export function sortByEngagement(items, map, mode) {
  const list = Array.isArray(items) ? [...items] : [];
  const dateOf = (x) => String(x?.serviceDate || '');
  const eOf = (x) => engagementFor(map, x?.videoId);
  const metric = (x) => {
    const e = eOf(x);
    if (mode === 'hearted') return e.hearts * 1000 + e.likes;   // in-app resonance, likes as tiebreak
    if (mode === 'viewed') return e.ytViews;                    // reach
    return engagementScore(e);                                  // 'popular' / combined
  };
  return list.sort((a, b) => {
    const d = metric(b) - metric(a);
    if (d !== 0) return d;
    return dateOf(b).localeCompare(dateOf(a));
  });
}

// Compact human label for a video's engagement, e.g. "12 hearts · 340 views".
// Only shows the parts that carry a real number, so a no-signal video reads
// clean (empty string), never "0 hearts · 0 views".
export function engagementLabel(e = EMPTY_ENGAGEMENT) {
  const parts = [];
  if (e.hearts) parts.push(`${e.hearts} heart${e.hearts === 1 ? '' : 's'}`);
  if (e.likes) parts.push(`${e.likes} like${e.likes === 1 ? '' : 's'}`);
  if (e.ytViews) parts.push(`${e.ytViews.toLocaleString()} view${e.ytViews === 1 ? '' : 's'}`);
  return parts.join(' · ');
}
