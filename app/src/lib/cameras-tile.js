// =============================================================================
// cameras-tile — the Cameras option on the front page, and its live line (DR-1237)
// =============================================================================
// Darrell, 2026-10-27: "shouldn't we see the camera option on the front page
// inside the PoeTech App?" The cameras existed as a view, in the sidebar's
// Life group and as the 13th quick action (cut at the default density); the
// home a family member lands on offered no option at all.
//
// Reality-trace (DR-0061):
//   REAL DATA  the line under the tile is read from the running camera road
//              and nowhere else. With a key on this device: GET /cams/list
//              (the cameras THIS credential opens, the NAS is the wall) and
//              GET /cams/streams/health (each camera's `last_seen`, stamped by
//              the forwarder's own sampler, StreamHealth.camera() in
//              infra/nas-cameras/cams_forwarder.py). With no key: GET
//              /cams/health, unauthenticated, whose `stream_health.cameras`
//              counts the house's cameras and `last_sample_at` says when the
//              NAS last looked. A road that does not answer reads as not
//              reachable, never as "no cameras" (DR-0076).
//   END-TO-END the same CAMS_BASE, bearer and parsers the Cameras tab uses
//              (lib/cameras.js); nothing here is a second copy of a road.
//   WHO        canSeeCameras (lib/surface-access.js), the one predicate the
//              nav entry and the shell gate ask as well.
//
// Pure except readCameraTile, whose fetch is injected so it tests in plain JS.
// =============================================================================
import {
  FETCH_TIMEOUT_MS, fetchWithTimeout, authHeaders, listUrl, healthUrl, parseCameraList, fetchStreamHealth,
} from './cameras.js';

/** The tile record, in the shape of a Life Hub tile, so the no-two-doors pin (DR-1196) can count it. */
export const CAMERAS_TILE = Object.freeze({ key: 'cameras', label: 'Cameras', sub: 'Your own cameras, from your own server', view: 'cameras', churchView: null });

/** How often the line is read again while the front page is open and visible. */
export const CAMERAS_TILE_REFRESH_MS = 60000;

/** 'HH:MM' in the reader's own clock; '' for nothing. */
export function clockOf(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  try { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

/** The newest `last_seen` (forwarder seconds) across the stream-health cameras, in ms; null when none was ever seen. */
export function latestFrameAt(cameras = {}) {
  let best = 0;
  for (const c of Object.values(cameras || {})) {
    const t = Number(c && c.last_seen);
    if (Number.isFinite(t) && t > best) best = t;
  }
  return best > 0 ? best * 1000 : null;
}

/**
 * The one line under the tile. Every branch names what was read; nothing
 * green is painted, and an unknown never reads as fine.
 */
export function cameraTileLine(r = {}) {
  const n = Number(r.count) || 0;
  const cams = `${n} camera${n === 1 ? '' : 's'}`;
  switch (r.state) {
    case 'reading': return 'reading the cameras…';
    case 'unreachable': return 'cameras not reachable from here';
    case 'refused': return 'the camera key on this device was refused · open to fix it';
    case 'empty': return 'the NAS lists no cameras yet · open to add them';
    case 'ready': {
      const at = clockOf(r.lastFrameAt);
      return at ? `${cams} · last frame ${at}` : `${cams} · no frame seen yet`;
    }
    case 'no-key': {
      const at = clockOf(r.checkedAt);
      const house = n > 0 ? `${cams} on the NAS` : 'the NAS answers';
      return `${house}${at ? ` · checked ${at}` : ''} · this device has no key yet`;
    }
    default: return 'cameras not reachable from here';
  }
}

/**
 * Read the tile's state from the road. `token` is the family bridge bearer or
 * a grant on this device; '' asks /health alone.
 */
export async function readCameraTile({ token = '', fetchImpl = globalThis.fetch } = {}) {
  const f = fetchImpl;
  if (!token) {
    try {
      const r = await fetchWithTimeout(healthUrl(), {}, FETCH_TIMEOUT_MS, f);
      let body = null; try { body = await r.json(); } catch { body = null; }
      if (r.status !== 200 || !body || body.ok !== true) return { state: 'unreachable', count: 0 };
      const sh = body.stream_health && typeof body.stream_health === 'object' ? body.stream_health : {};
      const at = Number(sh.last_sample_at);
      return { state: 'no-key', count: Number(sh.cameras) || 0, checkedAt: Number.isFinite(at) && at > 0 ? at * 1000 : null };
    } catch { return { state: 'unreachable', count: 0 }; }
  }
  let list;
  try {
    const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(token) }, FETCH_TIMEOUT_MS, f);
    let body = null; try { body = await r.json(); } catch { body = null; }
    list = { status: r.status, cameras: r.status === 200 ? parseCameraList(body) : [] };
  } catch { return { state: 'unreachable', count: 0 }; }
  if (list.status === 401 || list.status === 403) return { state: 'refused', count: 0 };
  if (list.status !== 200) return { state: 'unreachable', count: 0 };
  if (!list.cameras.length) return { state: 'empty', count: 0 };
  const sh = await fetchStreamHealth(token, f);
  return { state: 'ready', count: list.cameras.length, lastFrameAt: sh.ok ? latestFrameAt(sh.cameras) : null };
}
