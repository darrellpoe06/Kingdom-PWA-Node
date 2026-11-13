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
// Pure: no React, no I/O.

export const EPISODE_STATUSES = Object.freeze(['planned', 'in-production', 'published']);

const ep = (id, title, scripture, storybook, status, source = null) => ({ id, title, scripture, storybook, status, source });

/** The Love Corner Bible Adventures, the original series. */
export const EPISODES = Object.freeze([
  ep('jonah', 'Jonah and the Great Fish', 'Jonah 1–3', 'jonah', 'in-production'),
  ep('noah', 'Noah and the Door Yahweh Shut', 'Genesis 6–9', 'noah', 'planned'),
  ep('david', 'David and the Giant', '1 Samuel 17', 'david', 'planned'),
]);

/** A URL the app may play: the church's own channel, or a published episode's source. */
const PLAYABLE = /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//;

/** The problems with a registry; empty when it is honest. */
export function validateEpisodes(episodes = EPISODES) {
  const out = [];
  const seen = new Set();
  for (const e of episodes) {
    if (!e.id || seen.has(e.id)) out.push(`${e.id || '?'}: missing or repeated id`);
    seen.add(e.id);
    if (!EPISODE_STATUSES.includes(e.status)) out.push(`${e.id}: unknown status ${e.status}`);
    if (e.status === 'published' && !PLAYABLE.test(String(e.source || ''))) out.push(`${e.id}: marked published with no playable source`);
    if (e.status !== 'published' && e.source) out.push(`${e.id}: carries a source but is not published`);
    if (!e.scripture) out.push(`${e.id}: no Scripture range`);
  }
  return out;
}

/** True only for an episode a child can actually watch. */
export function watchable(e) {
  return !!e && e.status === 'published' && PLAYABLE.test(String(e.source || ''));
}

/** The shelf as the surface shows it: a label per status, never "available" for what is not. */
export function shelfLabel(e) {
  if (watchable(e)) return 'WATCH';
  if (e && e.status === 'in-production') return 'IN PRODUCTION';
  return 'PLANNED';
}

/**
 * What plays now: the first published episode, else the church's own channel
 * from the record, else nothing (and the surface says so).
 */
export function nowShowing(church, episodes = EPISODES) {
  const live = episodes.find(watchable);
  if (live) return { kind: 'episode', title: live.title, url: live.source, episode: live };
  const url = church && church.media && church.media.youtube;
  if (url && PLAYABLE.test(String(url))) return { kind: 'channel', title: 'The church channel', url, episode: null };
  return { kind: 'none', title: 'Nothing to play yet', url: null, episode: null };
}

/** Every line of our own voice in the Theater, for the voice gate. */
export function theaterVoiceLines(episodes = EPISODES) {
  return episodes.map((e) => ({ where: `episode:${e.id}`, text: `${e.title} ${e.scripture}` }));
}
