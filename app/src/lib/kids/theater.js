// =============================================================================
// kids/theater — the Bible Adventure Theater's registry (DR-1508)
// =============================================================================
// Darrell, 2026-11-13: "Bible Adventure Theater: a dedicated section for
// animated Bible stories and our future original cartoon series."
//
// HONEST ABOUT WHAT EXISTS (P15; DR-0076): no episode of the original series
// is published yet. The registry names each episode with its Scripture range
// and a status; only a `published` episode with a real source plays, and
// `validateEpisodes` refuses a registry that marks one published without a
// source, proven to catch in kids-theater.test.js. Until the first episode
// lands, the Theater plays the church's own channel from the church record
// (resolveChurch(church).media.youtube), inside the app, the way Live Worship
// already embeds it. Nothing is painted as available before it is.
//
// J1 of the Jonah adventure (DR-1523): an episode of our own may also be a
// file we serve ourselves (an MP4 or WebM under lovecorner/kids/episodes/,
// on the NAS through the same-origin transport or beside the app), with a
// poster frame and a WebVTT caption track, so the series never depends on
// YouTube; the YouTube road stays. Only the file road can know a child
// watched to the end (the player's own `ended`), so only it writes the
// `episode-<id>` record the trail and the Front Row badge read.
// Pure: no React, no I/O.

import { LANDED } from './guides.js';

export const EPISODE_STATUSES = Object.freeze(['planned', 'in-production', 'published']);

const ep = (id, title, scripture, storybook, status, source = null, extra = {}) => ({
  id,
  title,
  scripture,
  storybook,
  status,
  source,
  poster: extra.poster || null,
  captions: extra.captions || null,
});

/** The series as planned: every episode starts `planned`; the files decide the rest. */
export const SERIES = Object.freeze([
  ep('jonah', 'Jonah and the Great Fish', 'Jonah 1–3', 'jonah', 'planned'),
  ep('noah', 'Noah and the Door Yahweh Shut', 'Genesis 6–9', 'noah', 'planned'),
  ep('david', 'David and the Giant', '1 Samuel 17', 'david', 'planned'),
]);

/** The files an episode is made of, under the kids folder (the production brief names them). */
export const EPISODE_FILES = Object.freeze({
  video: (id) => [`episodes/${id}.mp4`, `episodes/${id}.webm`],
  poster: (id) => [`episodes/${id}-poster.jpg`, `episodes/${id}-poster.png`],
  captions: (id) => [`episodes/${id}.en.vtt`],
});

/**
 * The series as the files make it (DR-1527): a video on disk publishes the
 * episode with that source; a poster with no video reads in production (the
 * poster shows, nothing claims to play); captions ride when their file is
 * there. Nothing is published by hand and nothing by a tap.
 */
export function episodesFrom(manifest, series = SERIES) {
  const has = (f) => !!(manifest && manifest.files && manifest.files[f]);
  return series.map((e) => {
    const video = EPISODE_FILES.video(e.id).find(has) || null;
    const poster = EPISODE_FILES.poster(e.id).find(has) || null;
    const captions = video ? EPISODE_FILES.captions(e.id).find(has) || null : null;
    if (video)
      return {
        ...e,
        status: 'published',
        source: `lovecorner/kids/${video}`,
        poster: poster ? `lovecorner/kids/${poster}` : null,
        captions: captions ? `lovecorner/kids/${captions}` : null,
      };
    if (poster) return { ...e, status: 'in-production', source: null, poster: `lovecorner/kids/${poster}`, captions: null };
    return e;
  });
}

/** The Love Corner Bible Adventures, the original series, as the kids folder has it today. */
export const EPISODES = Object.freeze(episodesFrom(LANDED));

/** A URL the app may play: the church's own channel, or a published episode's YouTube source. */
const PLAYABLE = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//;
/** A file of our own: under the kids' episodes folder, served same-origin, MP4 or WebM only. */
const FILE_SOURCE = /^\/?lovecorner\/kids\/episodes\/[\w-]+\.(mp4|webm)$/;
const VTT = /^\/?lovecorner\/kids\/episodes\/[\w.-]+\.vtt$/;

/** 'youtube', 'file', or null for a source the app will not play. */
export function mediaKind(source) {
  const s = String(source || '');
  if (PLAYABLE.test(s)) return 'youtube';
  if (FILE_SOURCE.test(s)) return 'file';
  return null;
}

/** The problems with a registry; empty when it is honest. */
export function validateEpisodes(episodes = EPISODES) {
  const out = [];
  const seen = new Set();
  for (const e of episodes) {
    if (!e.id || seen.has(e.id)) out.push(`${e.id || '?'}: missing or repeated id`);
    seen.add(e.id);
    if (!EPISODE_STATUSES.includes(e.status)) out.push(`${e.id}: unknown status ${e.status}`);
    if (e.status === 'published' && !mediaKind(e.source)) out.push(`${e.id}: marked published with no playable source`);
    if (e.status !== 'published' && e.source) out.push(`${e.id}: carries a source but is not published`);
    if (!e.scripture) out.push(`${e.id}: no Scripture range`);
    if (e.captions && !VTT.test(String(e.captions))) out.push(`${e.id}: captions must be a WebVTT file under the episodes folder`);
    if (e.captions && mediaKind(e.source) !== 'file') out.push(`${e.id}: captions ride only a file of our own`);
  }
  return out;
}

/** True only for an episode a child can actually watch. */
export function watchable(e) {
  return !!e && e.status === 'published' && !!mediaKind(e.source);
}

/** The shelf as the surface shows it: a label per status, never "available" for what is not. */
export function shelfLabel(e) {
  if (watchable(e)) return 'WATCH';
  if (e && e.status === 'in-production') return 'IN PRODUCTION';
  if (e && e.status === 'planned') return 'COMING SOON';
  return 'PLANNED';
}

/**
 * What plays now: the first published episode, else the church's own channel
 * from the record, else nothing (and the surface says so).
 */
export function nowShowing(church, episodes = EPISODES) {
  const live = episodes.find(watchable);
  if (live) return { kind: 'episode', title: live.title, url: live.source, media: mediaKind(live.source), episode: live };
  const url = church && church.media && church.media.youtube;
  if (url && PLAYABLE.test(String(url))) return { kind: 'channel', title: 'The church channel', url, media: 'youtube', episode: null };
  return { kind: 'none', title: 'Nothing to play yet', url: null, media: null, episode: null };
}

/** Every line of our own voice in the Theater, for the voice gate. */
export function theaterVoiceLines(episodes = EPISODES) {
  return episodes.map((e) => ({ where: `episode:${e.id}`, text: `${e.title} ${e.scripture}` }));
}
