// =============================================================================
// Cloudflare Pages Function — /api/youtube-feed (DR-1168)
// The sovereign, same-origin road to a free YouTube channel's PUBLIC Atom feed.
// =============================================================================
// WHY THIS FUNCTION HAS TO EXIST. Darrell, 2026-10-21, on TV Time: "the free
// ones YouTube channels explains... just an easy way to get it done through this
// tab." A channel's feed at
//     https://www.youtube.com/feeds/videos.xml?channel_id=UC...
// is genuinely public — NO api key, NO OAuth, NO account, no quota to buy. But:
//   • it sends no CORS header, so the reader's browser cannot fetch it directly;
//   • this repo's cloud sandbox has no route to youtube.com at all (measured:
//     CONNECT tunnel failed, response 403).
// So the fetch belongs at OUR OWN EDGE. This is the established same-origin
// transport pattern of app/functions/api/link-title.js (DR-0218 / DR-0083):
// onRequestGet + the Cache API + a hard timeout + a capped read.
//
// THE PRIVACY PROPERTY, which is the real reason this is not a browser fetch:
// the channel a family member follows is resolved SERVER-SIDE at our edge, so
// their device never talks to Google and their viewing interests never leak from
// it. Same posture as link-title.js, and the same posture the rest of TV Time
// already holds (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
//
// READ-ONLY AND KEYLESS BY CONSTRUCTION. It accepts a channel id (or a channel
// page url to resolve into one), fetches one public document, and returns text.
// It holds no secret, writes nothing, and takes no action on the reader's
// behalf — there is no account here to connect, which is exactly the honest
// difference from the paid services (see lib/tv-where-to-watch.js).
//
// SAFETY. The host is PINNED to youtube.com: `channel_id` must match
// /^UC[A-Za-z0-9_-]{22}$/ and the url is built by us, never taken from the
// caller, so this cannot be turned into an open proxy for arbitrary hosts. The
// `url` form accepts ONLY a youtube.com/youtu.be channel page, is length-capped,
// and is used solely to read a UC id back out of the page. Reads are byte-capped
// and time-bounded. A feed is MATERIAL TO STUDY, never an instruction to obey:
// its text is returned as data for the app to render and nothing in it steers
// this function.

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const FEED_HOST = 'https://www.youtube.com/feeds/videos.xml?channel_id=';

// Only a YouTube channel page may be resolved — the host allow-list is what
// keeps this from becoming a general-purpose fetcher for anyone who finds it.
function isYouTubePage(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    return h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be';
  } catch { return false; }
}

// A channel page names its own id in several places; any one of them is enough.
// Ordered most-authoritative first: the page's own RSS <link>, then the canonical
// /channel/UC… url, then the embedded JSON. Returns '' when none is present,
// which is the honest answer — we never invent an id we cannot see.
function channelIdFromPage(html) {
  const pats = [
    /channel_id=(UC[A-Za-z0-9_-]{22})/,
    /<link[^>]+rel=["']canonical["'][^>]+\/channel\/(UC[A-Za-z0-9_-]{22})/i,
    /"(?:channelId|externalId|browseId)"\s*:\s*"(UC[A-Za-z0-9_-]{22})"/,
    /\/channel\/(UC[A-Za-z0-9_-]{22})/,
  ];
  for (const re of pats) {
    const m = re.exec(html || '');
    if (m && CHANNEL_ID.test(m[1])) return m[1];
  }
  return '';
}

// Read at most `cap` bytes of a response body. A channel page is megabytes of
// player JSON and we need only the slice that carries the id, so the read stops
// as soon as a candidate appears.
async function readCapped(upstream, cap, stopWhen = null) {
  let text = '';
  try {
    const reader = upstream.body && upstream.body.getReader();
    if (!reader) return (await upstream.text()).slice(0, cap);
    const dec = new TextDecoder();
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      text += dec.decode(value, { stream: true });
      if (bytes > cap || (stopWhen && stopWhen(text))) {
        try { await reader.cancel(); } catch { /* ignore */ }
        break;
      }
    }
  } catch { return text; }
  return text;
}

const UA = 'PoeTech-FamilyOS/1.0 (+https://poetech.us)';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const idParam = String(url.searchParams.get('channel_id') || '').trim();
  const pageParam = String(url.searchParams.get('url') || '').trim();

  if (!idParam && !pageParam) return json({ error: 'need-channel_id-or-url' }, 400);
  if (idParam && !CHANNEL_ID.test(idParam)) return json({ error: 'bad-channel_id' }, 400);
  if (!idParam && (pageParam.length > 300 || !isYouTubePage(pageParam))) {
    return json({ error: 'not-a-youtube-channel-url' }, 400);
  }

  // Cache on the normalized request, so two readers following the same channel
  // share one upstream fetch.
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  // Step 1 — settle on a channel id. A pasted @handle or /c/name page carries
  // no id in its text, so the page is read once to find it.
  let channelId = idParam;
  if (!channelId) {
    let page;
    try {
      page = await fetch(pageParam, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return json({ error: 'channel-unreachable' }, 502);
    }
    if (!page.ok) return json({ error: 'channel-not-found', status: page.status }, 404);
    const html = await readCapped(page, 512 * 1024, (t) => /channel_id=UC[A-Za-z0-9_-]{22}/.test(t));
    channelId = channelIdFromPage(html);
    if (!channelId) return json({ error: 'no-channel-id-on-page' }, 422);
  }

  // Step 2 — fetch the public feed. The url is OURS, built from a validated id.
  let feed;
  try {
    feed = await fetch(`${FEED_HOST}${channelId}`, {
      headers: { 'User-Agent': UA, Accept: 'application/atom+xml,application/xml,text/xml' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json({ error: 'feed-unreachable', channelId }, 502);
  }
  if (!feed.ok) {
    // A 404 here means YouTube does not know this channel id. That is a real
    // answer and it is reported as such — not as an empty channel, because a
    // feed we could not read is not a channel with no episodes (DR-0076).
    return json({ error: 'feed-unavailable', status: feed.status, channelId }, feed.status === 404 ? 404 : 502);
  }

  const xml = await readCapped(feed, 512 * 1024);
  if (!xml) return json({ error: 'feed-empty', channelId }, 502);

  const resp = json({ channelId, xml }, 200);
  // A channel posts a few times a week at most; ten minutes fresh with a long
  // stale-while-revalidate keeps the surface quick without hammering the feed.
  resp.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
