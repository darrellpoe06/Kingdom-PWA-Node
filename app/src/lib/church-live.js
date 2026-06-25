// church-live.js — honest "is the church plausibly streaming right now?" logic.
//
// WHY THIS EXISTS (bug, 2026-06-17): the Church tab embeds the church's live
// broadcast via YouTube's no-API-key `/embed/live_stream?channel=` form. That
// player auto-follows the channel's CURRENT live broadcast when one is running,
// but when nothing is live YouTube does NOT reliably show a clean "offline"
// card — for a channel that has a stale/zombie scheduled broadcast (COLG's
// channel carries one dated June 9, 2019), the embed paints a perpetual
// "Waiting for <that 2019 stream>" frame. Auto-mounting the iframe 24/7 means
// the visitor sees a frozen, forever-waiting 2019 frame any time outside a
// live service. That is exactly the "dead/forever-waiting frame" the
// UNBREAKABLE standard forbids.
//
// We cannot truthfully detect live state on the client without the YouTube
// Data API (a vendor dependency we're avoiding), and painting our own "LIVE"
// badge would be a fabricated state (Reality-Trace P15). What we DO know
// truthfully is the church's real, published service schedule. So we only
// auto-mount the live player inside a plausible service window; outside it we
// render a graceful offline card (next service time + watch-latest link), with
// an explicit click-to-load escape hatch for off-schedule streams. The result:
// the zombie 2019 frame never auto-appears, and worship still plays prominently
// at service time.

const DAY_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

// ── ROLLING-LATEST embed sources (added 2026-06-17, Darrell) ─────────────────
// Desired behavior: "the live stream should show the latest live stream until
// the next one is streaming, and repeat." So the Live Worship slot must never be
// a dead/waiting frame — it shows the LIVE broadcast when one is running, and
// otherwise the channel's MOST RECENT upload (which, after a stream ends, IS
// that finished stream), rolling forward on its own as new streams land.
//
// We do this with ZERO API key and no vendor lock, via two no-key YouTube
// embeds:
//   • live  : /embed/live_stream?channel=UC...  — auto-follows the channel's
//             current live broadcast.
//   • latest: /embed/videoseries?list=UU...     — every channel's
//             auto-generated "uploads" playlist has the id formed by swapping
//             the channel id's `UC` prefix for `UU`, and that playlist is
//             ordered newest-first, so the embed opens on the most recent
//             upload. No weekly video-id edits; when the next stream ends it
//             becomes item #1 and the slot rolls to it automatically.
// The caller picks live vs latest from the honest service-window gate below.

// Standard YouTube channel id: `UC` + 22 url-safe base64 chars.
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

// uploadsPlaylistId('UCxxx…') -> 'UUxxx…' (the channel's uploads playlist), or
// null when the id is not a standard channel id (we never guess a playlist).
export function uploadsPlaylistId(channelId) {
  const id = String(channelId || '').trim();
  return CHANNEL_ID_RE.test(id) ? `UU${id.slice(2)}` : null;
}

// The no-key live broadcast embed for a channel, or null without a channel id.
export function liveStreamEmbedUrl(channelId) {
  const id = String(channelId || '').trim();
  return id ? `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(id)}` : null;
}

// The no-key "latest upload" embed (channel uploads playlist, newest-first), or
// null when no uploads playlist can be derived (caller falls back to a link).
export function latestUploadEmbedUrl(channelId) {
  const list = uploadsPlaylistId(channelId);
  return list ? `https://www.youtube.com/embed/videoseries?list=${list}&rel=0` : null;
}

// A stream may begin a little before the posted start time (pre-roll / praise
// & worship) and run well past it (a long service + the stream lingering on
// "stream ended" before YouTube tears it down). Generous on both sides so we
// never hide a service that's genuinely live, while still leaving the embed
// un-mounted the vast majority of the week.
const PRE_ROLL_MIN = 20;
const POST_ROLL_MIN = 210; // 3.5h covers a long service + lingering stream

// Parse a human service time like "11:00 AM" / "1:00 PM" -> minutes-since-midnight.
// Returns null when unparseable (caller skips that service rather than guessing).
export function parseServiceTime(time) {
  const m = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh > 23 || mm > 59) return null;
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && hh < 12) hh += 12;
  if (ap === 'AM' && hh === 12) hh = 0;
  return hh * 60 + mm;
}

// liveStatus(services, now) -> { live, current, next }
//   live    : boolean — is `now` inside any online service's live window?
//   current : the service whose window we're in (or null)
//   next    : { ...service, at: Date } — the soonest upcoming service start
//             (used for the offline card's "Next: Sunday 11:00 AM" hint), or null
//
// `now` is injectable for testing; defaults to the real clock in the app.
// Only services with `online !== false` count — an in-person-only service
// never lights the online player.
export function liveStatus(services, now = new Date()) {
  const list = (Array.isArray(services) ? services : []).filter(
    (s) => s && s.online !== false && s.day in DAY_INDEX && parseServiceTime(s.time) != null,
  );

  const nowMs = now.getTime();
  let current = null;
  let next = null;
  let nextDelta = Infinity;

  for (const svc of list) {
    const targetDow = DAY_INDEX[svc.day];
    const startMin = parseServiceTime(svc.time);
    const hh = Math.floor(startMin / 60);
    const mm = startMin % 60;

    // Check this week's occurrence plus the adjacent weeks so windows that
    // wrap across a week boundary (e.g. late Saturday into "Sunday") and the
    // next upcoming start are both found correctly.
    for (let wk = -1; wk <= 1; wk++) {
      const dayDelta = (targetDow - now.getDay()) + wk * 7;
      const occ = new Date(
        now.getFullYear(), now.getMonth(), now.getDate() + dayDelta, hh, mm, 0, 0,
      );
      const startMs = occ.getTime();
      const winStart = startMs - PRE_ROLL_MIN * 60000;
      const winEnd = startMs + POST_ROLL_MIN * 60000;

      if (nowMs >= winStart && nowMs <= winEnd) current = svc;

      if (startMs >= nowMs && startMs - nowMs < nextDelta) {
        nextDelta = startMs - nowMs;
        next = { ...svc, at: occ };
      }
    }
  }

  return { live: current != null, current, next };
}
