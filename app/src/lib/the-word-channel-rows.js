// =============================================================================
// the-word-channel-rows — a new service joins its MONTH the day it posts (DR-1427)
// =============================================================================
// Darrell 2026-11-11, on The Word -> Migdal with the month stepper on October
// 2026 and five November services sitting in a "Just posted · joins the
// archive shortly" strip above it: "the months are not populating in the next
// month!!!! Fix it for all months... this was an issue before".
//
// WHAT WAS MEASURED. The archive (choir_sermons on the sovereign database the
// app reads) is filled from the hosted project by sovereign-content-sync.yml,
// and that lane had failed every day from 2026-11-04 to 2026-11-11 (eight
// runs) because the runner's tailnet key had expired ("backend error: invalid
// key: API key does not exist"). The same class bit on 2026-09-16 (DR-0442:
// "0 of 901 messages · September 2026"). While the archive waits, the page
// already HAS the new services: the channel's own feed (/api/church-recent),
// shown only in a strip outside the months, so "This month" read empty.
//
// THE RULE NOW. A channel video the archive does not hold yet becomes a row
// like any other, dated by its title (the Bishop dates his titles) or else by
// its YouTube publish day, so it lands in its month in the same list, every
// month, whatever the import lane is doing. It is marked `fromChannel` (not
// editable, not re-preachable: there is no archive row to edit yet), and it
// gives way to the archive row the moment that row arrives. An archive row
// with NO date borrows the channel's date for the same video, so a dateless
// title never falls out of every month.
//
// PURE. No window, no network.
// =============================================================================
import { parseServiceTitle, extractYoutubeId } from './youtube-title-parse.js';

const isoDay = (s) => (/^\d{4}-\d{2}-\d{2}/.test(String(s || '')) ? String(s).slice(0, 10) : null);
const vidOf = (s) => (s && (s.videoId || extractYoutubeId(s.youtubeUrl || ''))) || null;

/** One channel feed item ({ videoId, title, published, url }) as an archive-shaped row. */
export function channelRow(v) {
  const p = parseServiceTitle(v && v.title);
  return {
    id: `yt-${v.videoId}`,
    videoId: v.videoId,
    youtubeUrl: v.url || `https://www.youtube.com/watch?v=${v.videoId}`,
    title: p.title || String((v && v.title) || '').trim() || 'Untitled message',
    serviceDate: p.serviceDate || isoDay(v && v.published),
    serviceType: p.serviceType,
    speaker: p.speaker,
    status: 'active',
    source: 'youtube',
    fromChannel: true,
  };
}

/**
 * The archive plus every channel video it does not hold yet, as one list. An
 * archive row with no service date takes the same video's channel date.
 */
export function withChannelRows(archive = [], fresh = []) {
  const feed = (Array.isArray(fresh) ? fresh : []).filter((v) => v && v.videoId);
  const byVid = new Map(feed.map((v) => [v.videoId, v]));
  const held = new Set();
  const rows = (Array.isArray(archive) ? archive : []).map((s) => {
    const vid = vidOf(s);
    if (vid) held.add(vid);
    if (s && !s.serviceDate && vid && byVid.has(vid)) {
      const c = channelRow(byVid.get(vid));
      return c.serviceDate ? { ...s, serviceDate: c.serviceDate } : s;
    }
    return s;
  });
  const added = feed.filter((v) => !held.has(v.videoId)).map(channelRow);
  return [...rows, ...added];
}
