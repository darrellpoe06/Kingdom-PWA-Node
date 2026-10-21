// =============================================================================
// youtube-follow — follow a free YouTube channel and see its new episodes
// (DR-1168; Darrell 2026-10-21: "the free ones YouTube channels explains...
// just an easy way to get it done through this tab").
//
// WHY THIS IS THE SOVEREIGN HALF OF TV TIME. The paid services have no consumer
// API — nothing to connect, nothing to read (see tv-where-to-watch.js). A free
// YouTube channel is the opposite: every channel publishes a PUBLIC Atom feed at
//   https://www.youtube.com/feeds/videos.xml?channel_id=UC...
// with NO API key, NO OAuth, NO account, and no quota to buy. So the one place a
// family can genuinely "connect a platform" is the free one, and it costs us
// nothing but a parser.
//
// THE ROAD ALREADY EXISTED, AND THIS USES IT RATHER THAN BUILDING A SECOND ONE.
// YouTube's feed sends no CORS header, so a browser cannot fetch it, and this
// repo has had a same-origin proxy for exactly that since 2026-07-19: the Church
// tab's `/api/church-recent?channel=UC…` (functions/api/church-recent.js), which
// validates the channel id, builds the feed url server-side, caches it ~10
// minutes and returns the raw XML. Its per-entry parser is `parseYoutubeFeed`
// in lib/youtube-feed.js.
//
// I FIRST BUILT BOTH AGAIN — a second proxy and a second entry parser — and only
// found the originals when main merged under this branch. Two roads to one truth
// drift (DR-0621; DR-1151 and DR-1152 are the same lesson paid for twice), so the
// duplicates are gone: this module now DELEGATES every entry to parseYoutubeFeed
// and the surface fetches through /api/church-recent.
//
// WHAT IS GENUINELY NEW here, and the only reason this file exists at all:
//   • the CHANNEL-LEVEL facts parseYoutubeFeed does not read — which channel the
//     feed belongs to and what it is called — including the "UC" trap below;
//   • a device-local FOLLOW LIST, per signed-in identity;
//   • merging several channels into one newest-first list, where a feed we could
//     not read is reported as un-read and never as empty.
// Resolving a pasted @handle to a channel id is the other new piece and lives in
// functions/api/youtube-channel-id.js, because nothing on main could do it.
//
// THE CHANNEL FACTS ARE VERIFIED AGAINST A REAL FEED, not a shape recalled from
// memory: a one-shot GitHub-runner probe fetched two live feeds and the recorded
// sample in youtube-follow.test.js is a slice of that actual document (DR-0076 §4).
//
// SOVEREIGN + PRIVATE + FAIL-SOFT, exactly like tv-time.js: the follow list is
// DEVICE-LOCAL (localStorage), keyed to the signed-in identity, and a throwing
// or absent localStorage degrades to an in-memory empty state and never throws
// into the render. Every transform here is PURE.
//
// A FEED IS MATERIAL TO STUDY, NEVER AN INSTRUCTION TO OBEY. Titles and
// descriptions arriving from a channel are third-party text: they are escaped
// and rendered as content, and nothing in a feed steers this app's behaviour.
// =============================================================================

import { parseYoutubeFeed } from './youtube-feed.js';

const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.tvchannels.v1';

// A YouTube channel id: literally 'UC' followed by 22 url-safe base64 chars.
// Anchored, so a whole URL is not mistaken for an id.
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

/** Pure. Is this a well-formed YouTube channel id? */
export function isChannelId(value) {
  return CHANNEL_ID.test(String(value || '').trim());
}

/**
 * Pure. Pull a channel id out of whatever the reader pasted. Accepts a bare id,
 * a /channel/UC… url, a feed url, and anything else carrying a UC id. Returns ''
 * for a handle url (@name) or a /c/name url — those carry NO id in the text and
 * must be resolved by the edge function, which reads the channel page. Returning
 * '' here is the honest answer: we do not guess an id we cannot see.
 */
export function channelIdFrom(input) {
  const s = String(input || '').trim();
  if (isChannelId(s)) return s;
  const m = /(UC[A-Za-z0-9_-]{22})/.exec(s);
  return m && isChannelId(m[1]) ? m[1] : '';
}

/** Pure. The public Atom feed url for a channel id. '' for a bad id. */
export function feedUrlFor(channelId) {
  return isChannelId(channelId)
    ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    : '';
}

/** Pure. The watch url for a video id — where a tap actually goes. */
export function watchUrlFor(videoId) {
  const v = String(videoId || '').trim();
  return /^[A-Za-z0-9_-]{6,20}$/.test(v) ? `https://www.youtube.com/watch?v=${v}` : '';
}

// --- Reading the feed: channel facts here, entries from the existing parser ---
// The live feed (measured, not remembered) is a <feed> of <entry> elements. The
// ENTRIES are parsed by lib/youtube-feed.js parseYoutubeFeed, which the Church
// tab has used since 2026-07-19 and which already yields exactly what this
// surface renders: videoId, title, published, url and a thumbnail. What it does
// not read is which channel the feed belongs to, and that is what is here.

// First text child of <tag> in a chunk. Tolerates attributes and namespaces.
function tagText(chunk, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const m = re.exec(chunk);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ').trim() : '';
}

/**
 * Pure. Parse a feed document into { channelId, channelTitle, episodes }.
 * Fail-soft by construction: junk in yields empty lists out, never a throw.
 * Episodes keep the feed's own order — YouTube publishes newest first — and come
 * from parseYoutubeFeed, so there is ONE entry parser in the repository.
 *
 * THE TRAP THE LIVE DOCUMENT EXPOSED (measured, run 39558498265). The feed's own
 * header element DROPS the "UC" prefix from the channel id:
 *
 *     <id>yt:channel:AuUUnT6oDeKwE6v1NGQxug</id>
 *     <yt:channelId>AuUUnT6oDeKwE6v1NGQxug</yt:channelId>     <-- no "UC"
 *     <link rel="self" href="...?channel_id=UCAuUUnT6oDeKwE6v1NGQxug"/>
 *     <link rel="alternate" href=".../channel/UCAuUUnT6oDeKwE6v1NGQxug"/>
 *
 * while the SAME element inside an <entry> keeps it. Reading yt:channelId alone
 * therefore yields a 22-char string that is NOT a channel id, which would have
 * produced a silently un-followable row. So the id is taken from the header's
 * urls — where YouTube writes it in full — and yt:channelId is accepted only when
 * it really is well formed. A parser written from a remembered shape ships this
 * bug; the live document is why this one does not (DR-0076 §4).
 */
export function parseFeed(xml, limit = 24) {
  const text = String(xml || '');
  const cut = text.indexOf('<entry');
  const head = text.slice(0, cut >= 0 ? cut : 4000);
  return {
    channelId: channelIdFrom(head) || channelIdFrom(tagText(head, 'yt:channelId')),
    channelTitle: tagText(head, 'title') || '',
    episodes: parseYoutubeFeed(text, limit),
  };
}

// --- Device-local follow list (the only I/O; fails soft) ---------------------

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

/** Pure. The per-identity storage key, matching tv-time.js's convention. */
export function channelsKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

/** Pure. An empty follow list. */
export function emptyChannels() {
  return { version: STORE_VERSION, channels: {} };
}

/**
 * Pure. Clean any parsed blob into a valid follow list. An entry whose key is
 * not a real channel id is dropped, so a corrupt or hand-edited store cannot
 * put a junk row on the surface or a junk id into a fetch.
 */
export function normalizeChannels(parsed) {
  const channels = {};
  const src = parsed && typeof parsed.channels === 'object' && parsed.channels ? parsed.channels : {};
  for (const [id, raw] of Object.entries(src)) {
    if (!isChannelId(id) || !raw || typeof raw !== 'object') continue;
    channels[id] = {
      id,
      title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : id,
      addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : '',
    };
  }
  return { version: STORE_VERSION, channels };
}

export function loadChannels(email) {
  const ls = safeStorage();
  if (!ls) return emptyChannels();
  try {
    const raw = ls.getItem(channelsKey(email));
    if (!raw) return emptyChannels();
    return normalizeChannels(JSON.parse(raw));
  } catch { return emptyChannels(); }
}

export function saveChannels(email, state) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(channelsKey(email), JSON.stringify(normalizeChannels(state)));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

/**
 * Pure. Follow a channel. `nowIso` is passed in so this layer stays clock-free.
 * Re-following refreshes the stored title without losing the original addedAt.
 * A bad id returns the state UNCHANGED — never a row that cannot be fetched.
 */
export function followChannel(state, { id, title } = {}, nowIso = '') {
  const base = normalizeChannels(state);
  if (!isChannelId(id)) return base;
  const prev = base.channels[id];
  return {
    version: STORE_VERSION,
    channels: {
      ...base.channels,
      [id]: {
        id,
        title: (typeof title === 'string' && title.trim()) ? title.trim() : (prev ? prev.title : id),
        addedAt: (prev && prev.addedAt) || String(nowIso || ''),
      },
    },
  };
}

/** Pure. Stop following a channel. */
export function unfollowChannel(state, id) {
  const base = normalizeChannels(state);
  if (!base.channels[id]) return base;
  const channels = { ...base.channels };
  delete channels[id];
  return { version: STORE_VERSION, channels };
}

/** Pure. The followed channels as a list, oldest follow first, then by title. */
export function followedChannels(state) {
  return Object.values(normalizeChannels(state).channels)
    .sort((a, b) => (a.addedAt || '').localeCompare(b.addedAt || '') || a.title.localeCompare(b.title));
}

/** Pure. Is this channel already followed? */
export function isFollowing(state, id) {
  return !!normalizeChannels(state).channels[id];
}

/**
 * Pure. Merge every followed channel's episodes into ONE newest-first list —
 * "see its new episodes" across the whole follow set.
 *
 * `byChannel` is { channelId: { channelTitle, episodes } } as fetched. A channel
 * with NO fetched entry is simply absent: it contributes nothing and is NEVER
 * represented as having no new episodes, because a feed we have not read is not
 * a feed that is empty (DR-0076 — unknown is not a no). The surface reports
 * un-read channels separately, from `missing`.
 *
 * Sort is deterministic: published desc, then title asc, then videoId asc, so
 * two episodes sharing a timestamp never swap places between renders.
 */
export function mergeEpisodes(state, byChannel, limit = 24) {
  const follows = followedChannels(state);
  const src = byChannel && typeof byChannel === 'object' ? byChannel : {};
  const rows = [];
  const missing = [];
  for (const ch of follows) {
    const got = src[ch.id];
    if (!got || !Array.isArray(got.episodes)) { missing.push(ch); continue; }
    for (const ep of got.episodes) {
      if (!ep || !ep.videoId) continue;
      rows.push({ ...ep, channelId: ch.id, channelTitle: got.channelTitle || ch.title });
    }
  }
  rows.sort((a, b) => (b.published || '').localeCompare(a.published || '')
    || a.title.localeCompare(b.title)
    || a.videoId.localeCompare(b.videoId));
  return { episodes: rows.slice(0, Math.max(0, limit)), missing, read: follows.length - missing.length };
}
