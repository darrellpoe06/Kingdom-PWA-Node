// =============================================================================
// observation-cameras — Wyze + IP camera registry for the Observation board
// =============================================================================
// Pure helpers behind the per-space "Cameras" section of ChurchObservation.
// Camera entries are METADATA (name / brand / URLs / location / notes) stored
// on the space record (data.churchObservation.spaces[].cameras), so they ride
// the family snapshot rail with the rest of the observation board — verified:
// snapshot-sync's stripPhotoBytes drops only keys literally named `photos`
// and data: URL strings (lib/snapshot-sync.js), so a `cameras` array of
// http/rtsp URLs survives the push. The photo BYTES stay device-local; the
// camera REGISTRY follows the account.
//
// HONEST BROWSER CONSTRAINTS this module encodes (DR-0076 — no painted
// "live" promises a PWA cannot keep):
//   - rtsp:// CANNOT play in any browser. Wyze cams expose RTSP only with
//     Wyze's RTSP firmware. In-app live view for RTSP cams arrives with the
//     family NAS restream bridge (go2rtc/Frigate style, RTSP -> HLS/WebRTC)
//     — LAN-side work, a follow-up, not this surface. Until then an RTSP
//     camera is REGISTERED, and the chip says so plainly.
//   - MJPEG / HTTP snapshot URLs render via <img>. HLS (.m3u8) plays
//     natively only in Safari's <video> — attempt, fall back honestly.
//   - Mixed content: an http:// LAN URL is blocked on the https app — the
//     status says so instead of showing a silent broken image.
// =============================================================================

// Brand presets. One-line setup hint each — shown under the brand select so
// staff know what the URL should be before they go hunting for it.
export const CAMERA_BRANDS = [
  {
    id: 'wyze',
    label: 'Wyze',
    hint: "Wyze cams expose RTSP only with Wyze's RTSP firmware — in-app live view for RTSP arrives via the family NAS restream bridge.",
  },
  {
    id: 'generic-rtsp',
    label: 'Generic RTSP camera',
    hint: 'rtsp:// streams cannot play in any browser — register the URL now; live view arrives with the NAS restream bridge.',
  },
  {
    id: 'ip-http',
    label: 'IP camera (HTTP snapshot / MJPEG)',
    hint: 'HTTP snapshot (.jpg) and MJPEG URLs render right here — note that an http:// LAN URL is blocked on the https app; use Open direct on the LAN.',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Paste whatever URL the camera exposes — the status chip says honestly what this browser can do with it.',
  },
];

export function brandLabel(id) {
  const b = CAMERA_BRANDS.find((x) => x.id === id);
  return b ? b.label : 'Camera';
}

// What kind of URL is this, in terms of what a BROWSER can actually do with it?
//   'rtsp'               — cannot play in any browser (NAS bridge territory)
//   'hls'                — .m3u8; <video> plays it natively ONLY in Safari
//   'mjpeg-or-snapshot'  — renders via <img> (still or motion JPEG)
//   'http-page'          — a camera's own web UI; open direct, no inline embed
//   'unknown'            — empty / unrecognized scheme
export function classifyStreamUrl(url) {
  if (typeof url !== 'string') return 'unknown';
  const u = url.trim().toLowerCase();
  if (!u) return 'unknown';
  if (u.startsWith('rtsp://') || u.startsWith('rtsps://')) return 'rtsp';
  if (!u.startsWith('http://') && !u.startsWith('https://')) return 'unknown';
  const path = u.split(/[?#]/)[0];
  if (path.endsWith('.m3u8')) return 'hls';
  if (/\.(jpe?g|png|gif|webp)$/.test(path)) return 'mjpeg-or-snapshot';
  if (/mjpe?g|snapshot|\/video\.cgi|faststream/.test(u)) return 'mjpeg-or-snapshot';
  return 'http-page';
}

// True when the page is https and the URL is plain http:// — the browser
// blocks that fetch (mixed content), so we say so instead of rendering a
// silent broken image. rtsp:// is not mixed content; it simply never plays.
export function mixedContentBlocked(url, pageProtocol) {
  if (typeof url !== 'string') return false;
  return pageProtocol === 'https:' && url.trim().toLowerCase().startsWith('http://');
}

// Build a camera record. Pure — the caller passes id and addedAt (timestamps
// are the component's job), unknown brands normalize to 'other'.
export function makeCamera({ id, name, brand, streamUrl, snapshotUrl, location, notes, addedAt } = {}) {
  const t = (v) => (typeof v === 'string' ? v.trim() : '');
  const b = CAMERA_BRANDS.some((x) => x.id === brand) ? brand : 'other';
  return {
    id: t(id),
    name: t(name),
    brand: b,
    streamUrl: t(streamUrl),
    snapshotUrl: t(snapshotUrl),
    location: t(location),
    notes: t(notes),
    addedAt: t(addedAt),
  };
}

// Normalize a space's cameras — older space records have no `cameras` key.
export function camerasOf(space) {
  return space && Array.isArray(space.cameras) ? space.cameras : [];
}

// Replace by id, or append when the id is new. Tolerates a missing array.
export function upsertCamera(cameras, camera) {
  const list = Array.isArray(cameras) ? cameras : [];
  if (!camera || !camera.id) return list;
  const i = list.findIndex((c) => c && c.id === camera.id);
  if (i === -1) return [...list, camera];
  return list.map((c, j) => (j === i ? { ...c, ...camera } : c));
}

export function removeCamera(cameras, id) {
  return (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id !== id);
}

// Short, honest status chip for the camera row — derived from the stored
// URLs, never painted. kind mirrors classifyStreamUrl plus 'mixed-blocked'
// and 'none' (no URL registered yet).
export function streamStatus(camera, pageProtocol) {
  const url = (camera && camera.streamUrl) || '';
  const kind = classifyStreamUrl(url);
  if (kind !== 'rtsp' && kind !== 'unknown' && mixedContentBlocked(url, pageProtocol)) {
    return { kind: 'mixed-blocked', label: 'http URL · blocked on this https page' };
  }
  switch (kind) {
    case 'rtsp':
      return { kind, label: 'RTSP · registered — awaiting NAS bridge' };
    case 'hls':
      return { kind, label: 'HLS · plays natively in Safari' };
    case 'mjpeg-or-snapshot':
      return { kind, label: 'Snapshot / MJPEG · viewable here' };
    case 'http-page':
      return { kind, label: 'Web page · open direct' };
    default: {
      if (!url && camera && camera.snapshotUrl) {
        return mixedContentBlocked(camera.snapshotUrl, pageProtocol)
          ? { kind: 'mixed-blocked', label: 'http URL · blocked on this https page' }
          : { kind: 'snapshot-only', label: 'Snapshot URL only' };
      }
      return url ? { kind: 'unknown', label: 'URL not recognized' } : { kind: 'none', label: 'No URL yet' };
    }
  }
}

// Pick what the live-view area should attempt for this camera, preferring a
// renderable URL (streamUrl first, then snapshotUrl — so a Wyze with an rtsp
// stream AND an http(s) snapshot still shows the snapshot).
//   { mode: 'img' | 'video' | 'blocked' | 'bridge' | 'page' | 'none', url }
export function pickLiveView(camera, pageProtocol) {
  const candidates = [camera && camera.streamUrl, camera && camera.snapshotUrl].filter(Boolean);
  let blocked = '';
  for (const url of candidates) {
    const kind = classifyStreamUrl(url);
    if (kind !== 'mjpeg-or-snapshot' && kind !== 'hls') continue;
    if (mixedContentBlocked(url, pageProtocol)) { blocked = blocked || url; continue; }
    return { mode: kind === 'hls' ? 'video' : 'img', url };
  }
  if (blocked) return { mode: 'blocked', url: blocked };
  const rtsp = candidates.find((u) => classifyStreamUrl(u) === 'rtsp');
  if (rtsp) return { mode: 'bridge', url: rtsp };
  // A camera's own web UI opens fine as a top-level tab even when http-on-https
  // (only inline embeds are mixed-content blocked), so it stays a valid target.
  const page = candidates.find((u) => classifyStreamUrl(u) === 'http-page');
  if (page) return { mode: 'page', url: page };
  return { mode: 'none', url: '' };
}
