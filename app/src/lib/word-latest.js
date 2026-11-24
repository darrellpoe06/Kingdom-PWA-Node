// =============================================================================
// word-latest — which message The Word tab opens on (DR-1639)
// =============================================================================
// Darrell 2026-11-24, with The Word tab and the Church tab side by side: "The
// Word tab needs to be updated... it should be inviting... BG's latest in big
// like the Home tab does." The Church tab's player opens on the channel's
// newest upload; The Word tab opened on tools (Present, We are live, the
// library) with no message to watch.
//
// BG's LATEST, not merely the channel's latest: guest preachers and teachers
// fill in (the library credits each), so the newest upload is not always his.
// The first feed item whose title names Gwin is his latest; when none does
// (a feed of guests, or titles without names), the newest item is shown and
// said to be the church's latest, never claimed as his.
//
// Pure. The feed is parseYoutubeFeed's shape: [{ videoId, title, published }].
// =============================================================================

const HIS = /\bgwin\b/i;

/**
 * The message The Word tab leads with.
 * @returns {{ video: object, his: boolean } | null}
 */
export function wordLatest(feed) {
  const items = (Array.isArray(feed) ? feed : []).filter((v) => v && /^[\w-]{6,}$/.test(String(v.videoId || '')));
  if (!items.length) return null;
  const mine = items.find((v) => HIS.test(String(v.title || '')));
  return mine ? { video: mine, his: true } : { video: items[0], his: false };
}

/** "Wednesday, November 18, 2026" from an RSS published stamp, or '' when unreadable. */
export function latestDate(published) {
  const t = Date.parse(String(published || ''));
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
