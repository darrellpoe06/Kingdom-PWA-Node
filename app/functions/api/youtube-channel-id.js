// =============================================================================
// Cloudflare Pages Function — /api/youtube-channel-id  (handle → channel id)
// =============================================================================
// THIS IS THE ONE PIECE OF THE YOUTUBE ROAD THE REPOSITORY DID NOT ALREADY HAVE.
//
// TV Time lets a family member follow a free YouTube channel (DR-1168). The feed
// itself is already served by `/api/church-recent?channel=UC…` — the Church tab's
// same-origin proxy, live since 2026-07-19, which validates the id, builds the
// feed url server-side, caches it ~10 minutes and hands back the raw XML. This
// function does NOT duplicate that, and an earlier draft of DR-1168 did: it
// shipped a second proxy doing the same job with the same SSRF guard and the same
// cache, which is the two-roads-to-one-truth defect this house has now paid for
// three times (DR-0621; DR-1151; DR-1152). That duplicate is deleted.
//
// WHAT IS LEFT, AND WHY IT HAS TO EXIST: `church-recent` takes a channel ID. A
// person does not have one. They have the link in their address bar —
// `youtube.com/@SomeChannel` or `/c/SomeName` — and that page carries NO id in
// its text that a browser could read cross-site. So this reads the channel page
// SERVER-SIDE and returns just the id, which the caller then hands to
// church-recent. One job, one answer, nothing cached that church-recent caches.
//
// WHY SERVER-SIDE AT ALL, besides CORS: the channel a family member is about to
// follow is resolved at our own edge, so their device never asks Google about it
// and their viewing interests do not leave it — the same posture link-title.js
// keeps for the pages they read (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
//
// SAFETY. The URL comes from the caller, which is the shape of an open proxy and
// of a server-side request forgery, so the host is on a strict allow-list:
// youtube.com / m.youtube.com / youtu.be over http(s) only, length-capped. It
// then returns a STRING ID and nothing else — never the page, never a redirect
// target — so even a reachable page cannot be used to exfiltrate content through
// this route. The guards are exported so a vitest case can RUN them, and
// youtube-channel-id.test.js proves the allow-list catches a widened match.
//
// A channel page is MATERIAL TO READ, never an instruction to obey: the only
// thing taken from it is a 24-character id matched against a fixed pattern.

const json = (obj, status) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

// A YouTube channel id: literally `UC` + 22 url-safe base64 characters.
// Anchored, so a whole URL can never pass as an id.
export const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

// Only a YouTube channel page may be fetched. Equality on the host, never a
// substring: `youtube.com.evil.com` must not pass, and a test proves it does not.
export function isYouTubePage(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const h = u.hostname.replace(/^www\./, '').toLowerCase();
    return h === 'youtube.com' || h === 'm.youtube.com' || h === 'youtu.be';
  } catch { return false; }
}

// A channel page names its own id in several places; any one is enough. Ordered
// most-authoritative first: the page's own RSS link, the canonical /channel/ url,
// then the embedded JSON. Returns '' when none is present — we never invent an id
// we cannot see, and '' is reported to the caller as a real answer.
export function channelIdFromPage(html) {
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

// A channel page is megabytes of player JSON and we need only the slice carrying
// the id, so the read stops as soon as a candidate appears, and hard-stops at the
// cap either way.
async function readCapped(upstream, cap, stopWhen) {
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

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const target = String(url.searchParams.get('url') || '').trim();
  if (!target) return json({ error: 'need-url' }, 400);
  if (target.length > 300 || !isYouTubePage(target)) {
    return json({ error: 'not-a-youtube-channel-url' }, 400);
  }

  // An id resolves once and then never changes, so a day is a safe hold and it
  // keeps a re-follow from touching Google at all.
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let page;
  try {
    page = await fetch(target, {
      headers: { 'User-Agent': 'PoeTech-FamilyOS/1.0 (+https://poetech.us)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return json({ error: 'channel-unreachable' }, 502);
  }
  if (!page.ok) return json({ error: 'channel-not-found', status: page.status }, 404);

  const html = await readCapped(page, 512 * 1024, (t) => /channel_id=UC[A-Za-z0-9_-]{22}/.test(t));
  const channelId = channelIdFromPage(html);
  // A page that loaded but names no id is a REAL and different answer from a page
  // that could not be reached, and the surface prints them differently.
  if (!channelId) return json({ error: 'no-channel-id-on-page' }, 422);

  const resp = json({ channelId }, 200);
  resp.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
