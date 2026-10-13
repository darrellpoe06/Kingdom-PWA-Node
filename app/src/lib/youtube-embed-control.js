// =============================================================================
// youtube-embed-control — skip buttons a remote can actually reach
// =============================================================================
// Darrell 2026-09-20, watching the church's announcements reel on the TV: "Need
// a way to fast forward videos.... can't"
//
// The player is a YouTube <iframe>, so the scrub bar belongs to YouTube and
// lives inside the frame. On a phone you drag it with a thumb. On a television
// you are pushing a cursor with a D-pad at a four-pixel line, which is not a
// target anyone can hit — and there is no keyboard to press the arrow keys
// YouTube itself would honour, because the frame never has focus.
//
// So the controls have to be OURS: real <button>s in our own DOM, which the
// D-pad navigation already walks and the new focus ring already makes visible.
//
// WHY POSTMESSAGE AND NOT THE IFRAME PLAYER API. Loading YouTube's iframe_api
// script would mean pulling a vendor's JavaScript into every page that shows a
// video, for two buttons. The embed already speaks a documented postMessage
// protocol when `enablejsapi=1` is set, and it costs nothing to load. That is
// the lighter, local primitive this house prefers over a bundled dependency.
//
// Everything here is a pure function over strings and numbers. The DOM half is
// a dozen lines in the component, so the protocol itself is fully testable.

export const YT_ORIGIN = 'https://www.youtube.com';

/** Is this a YouTube embed we can drive? */
export function isYouTubeEmbed(src) {
  return /^https?:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\//.test(String(src || ''));
}

/**
 * Add `enablejsapi=1` (and an origin, which YouTube requires alongside it)
 * without disturbing the parameters already there — `list` and `rel=0` are
 * load-bearing in worshipPlayerSrc and must survive untouched.
 */
export function withJsApi(src, origin) {
  const s = String(src || '');
  if (!isYouTubeEmbed(s)) return s;
  const [base, query = ''] = s.split('?');
  const params = new URLSearchParams(query);
  params.set('enablejsapi', '1');
  if (origin) params.set('origin', origin);
  return `${base}?${params.toString()}`;
}

/** The message that asks the embed to start reporting its state back. */
export function listenCommand() {
  return JSON.stringify({ event: 'listening', id: 1, channel: 'widget' });
}

/** A player command, in the shape the embed accepts. */
export function command(func, args = []) {
  return JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' });
}

/**
 * Pull the playback position out of whatever the embed just posted.
 * Returns null for anything that is not a state report — and MUST, because a
 * page receives messages from many sources and treating a stray one as a time
 * would make the buttons jump somewhere random.
 */
export function readPlayerInfo(data) {
  let parsed = data;
  if (typeof data === 'string') {
    try { parsed = JSON.parse(data); } catch (_) { return null; }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const info = parsed.info || (parsed.event === 'infoDelivery' ? parsed.info : null);
  if (!info || typeof info !== 'object') return null;
  const out = {};
  if (typeof info.currentTime === 'number') out.currentTime = info.currentTime;
  if (typeof info.duration === 'number') out.duration = info.duration;
  if (typeof info.playerState === 'number') out.playerState = info.playerState;
  return Object.keys(out).length ? out : null;
}

/**
 * Where a skip lands. Clamped at both ends: past the end YouTube would simply
 * stop, and a negative time is not a position at all.
 *
 * A duration of 0 or Infinity means "not known yet" — a live stream reports
 * exactly that — so only the lower bound applies and forward skipping still
 * works rather than being pinned to zero.
 */
export function nextSeek(currentTime, delta, duration) {
  const now = Number.isFinite(currentTime) ? currentTime : 0;
  const target = now + delta;
  if (target < 0) return 0;
  if (Number.isFinite(duration) && duration > 0 && target > duration) return duration;
  return target;
}

/** The skips offered. Back is shorter than forward — a missed word costs less to re-hear than a long wait to skip past. */
export const SKIPS = Object.freeze([
  { delta: -10, label: '10s back', glyph: '« 10s' },
  { delta: 30, label: '30s forward', glyph: '30s »' },
]);
