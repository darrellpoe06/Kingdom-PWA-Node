// =============================================================================
// youtube-feed — parse a channel's public RSS/Atom feed into recent videos
// =============================================================================
// The Church tab shows the last few livestreams DIRECTLY from the channel, so they
// are ALWAYS current even when the curated sermon library hasn't imported them yet
// (Darrell 2026-07-19: "sometimes that other tab will not have the last or previous
// 5 livestreams... I always see the livestreams... I want them so whenever the
// other tab pulls it in it'll be there too"). The source is YouTube's NO-API-KEY
// public feed https://www.youtube.com/feeds/videos.xml?channel_id=UC… — fetched by
// the same-origin /api/church-recent proxy (a browser can't read it cross-site), so
// no vendor key and no quota. This is the pure parser for the client; deterministic.
// =============================================================================

// Thumbnail for a video id — YouTube's always-present medium still, no API key and
// no third-party tracker (same host the sermon library already uses).
export function youtubeThumb(videoId) {
  const id = String(videoId || '').trim();
  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
}

// parseYoutubeFeed(xml, limit) -> [{ videoId, title, published, url, thumbnail }]
// newest-first (the feed's own order), at most `limit` entries. Returns [] on
// empty/garbage input — the caller renders nothing rather than throwing. Pure.
export function parseYoutubeFeed(xml, limit = 5) {
  const text = String(xml || '');
  if (!text.includes('<entry')) return [];
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
  const out = [];
  // Split on entry boundaries; each <entry>…</entry> is one video.
  const entries = text.split(/<entry\b/).slice(1);
  for (const chunk of entries) {
    const videoId = (chunk.match(/<yt:videoId>\s*([\w-]{6,})\s*<\/yt:videoId>/) || [])[1]
      || (chunk.match(/<id>\s*yt:video:([\w-]{6,})\s*<\/id>/) || [])[1]
      || null;
    if (!videoId) continue;
    const rawTitle = (chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '';
    const title = decodeEntities(rawTitle).trim();
    const published = (chunk.match(/<published>\s*([^<]+?)\s*<\/published>/) || [])[1] || '';
    out.push({
      videoId,
      title,
      published,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: youtubeThumb(videoId),
    });
    if (out.length >= cap) break;
  }
  return out;
}

// Minimal XML/HTML entity decode for feed titles (they carry &amp; &#39; etc.).
function decodeEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
