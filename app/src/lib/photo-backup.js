// =============================================================================
// photo-backup — the app's side of the photo-backup road (DR-1120)
// =============================================================================
// Darrell 2026-10-19: "Bring Immich home by the Way now." The phones back up
// every new photo and video, in the background, onto our own pool through
// Immich on the NAS; this module is the whole contract the app holds with
// that road:
//   GET /photo-backup/health   open; 200 only when Immich answers on loopback,
//                              the library folder is on the pool and the pool
//                              has room; 503 with the reason in words.
// The uploads themselves never pass through the app: the Immich app on the
// phone talks to the door on the Funnel directly (the same-origin proxy
// buffers bodies, and a video is bigger than its cap), carrying the family key
// on its own header. infra/nas-immich/immich_forwarder.py is the other end,
// and its selftest pins the same facts this file states.
//
// THE OTHER LANE STAYS. The app's own pick-and-verify backup (PhoneBackup.jsx,
// media-backup.js) still lands files under /volume1/PoeTech/phone-backup; this
// road is the automatic one a PWA cannot be (the camera roll in the
// background), and its library lives beside it at /volume1/PoeTech/immich.
// =============================================================================

export const PHOTO_BACKUP_BASE = '/photo-backup';
export const KEY_HEADER = 'X-Family-Key';            // the forwarder's own header; Immich keeps Authorization
export const PHONE_SERVER_URL = 'https://poetech.tail5a2f35.ts.net/photo-backup';
export const LIBRARY_PATH = '/volume1/PoeTech/immich';
export const HEALTH_TIMEOUT_MS = 12000;

export function healthUrl() { return `${PHOTO_BACKUP_BASE}/health`; }

/** The steps a phone takes once, in the Immich app's own words. */
export const PHONE_STEPS = Object.freeze([
  'Install the Immich app on the phone (it is free, and it is the only app that can back up the camera roll in the background).',
  `Before signing in, open its Settings, then Advanced, then Custom proxy headers, and add the header ${KEY_HEADER} with this device’s family key (the Copy button below).`,
  `Set the server URL to ${PHONE_SERVER_URL} and sign in with the Immich account made for you on the NAS.`,
  'Turn on background backup for the albums you want kept. Every new shot then lands on the pool by itself.',
]);

/**
 * The road's state from its /health answer.
 * live: Immich answered with a version and the pool has room; dark: the NAS
 * answered but the road is not ready (the reason is the NAS's own words);
 * unreachable: nothing answered.
 */
export function classifyHealth(status, body) {
  if (status === 200 && body && body.ok === true) {
    return {
      state: 'live',
      version: body.version ? String(body.version) : null,
      freeGb: typeof body.free_gb === 'number' ? body.free_gb : null,
      library: body.library ? String(body.library) : null,
    };
  }
  if (typeof status === 'number' && status > 0 && body && typeof body === 'object' && 'ok' in body) {
    return { state: 'dark', reason: String(body.reason || `the road answered ${status}`) };
  }
  return { state: 'unreachable', reason: 'The photo-backup road is not answering yet. It starts on the NAS once Immich is up and the pool has room.' };
}

async function timed(fetchImpl, url, opts, ms) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch { /* already done */ } }, ms);
  try {
    return await fetchImpl(url, ctrl ? { ...opts, signal: ctrl.signal } : opts);
  } finally {
    clearTimeout(timer);
  }
}

export async function photoBackupHealth({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') return classifyHealth(0, null);
  try {
    const res = await timed(fetchImpl, healthUrl(), { method: 'GET', cache: 'no-store' }, HEALTH_TIMEOUT_MS);
    let body;
    try { body = await res.json(); } catch { body = null; }
    return classifyHealth(res.status, body);
  } catch {
    return classifyHealth(0, null);
  }
}
