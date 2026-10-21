// =============================================================================
// hub-camera — which camera the Life Hub plays, kept on this device (DR-1181)
// =============================================================================
// Darrell, 2026-10-21, circling the empty space beside the Life Hub's title:
// "I would to have a live stream of the camera chosen by the user as a
// livestream... right where the white box is... With a connect a camera feed or
// even a ability to see smaller ones and click on one to stay there
// consistently... it should be a picture of their home or a home and the text
// explains the function of the space." Then: "Advertising the app... family
// operating system shows privileges other's potential users would like to be
// able to use..." and "We already have a cameras tab... this would be great to
// have as another big picture location for advertising that surveillance is
// also available."
//
// So the space has two readers. A device that holds a camera credential (the
// family key, or a grant the owner gave it) sees ITS chosen camera live, the
// rest small beneath it, and a tap keeps a camera there on this device. A
// device that holds none sees a painted home and the words for what the space
// is: the same promoting half DR-1176 gave the Poe Properties door, in the
// Family Operating Systems voice. Nothing here opens a camera: the NAS is the
// wall (/list answers only the credential's cameras, /ticket 403s the rest).
//
// Pure: no React, no network. The storage is injected so it tests in plain JS.
// =============================================================================

export const HUB_CAMERA_KEY = 'poetech.hub.camera.v1';
/** Small frames under the live picture: the rest of the cameras, at most this many. */
export const HUB_THUMBS_MAX = 4;
/** How often a small frame is asked again while the Hub is open and visible. */
export const HUB_THUMB_REFRESH_MS = 60000;
/** The small frames' width: a phone row of four needs no more. */
export const HUB_THUMB_WIDTH = 320;

const store = (storage) => storage || (typeof localStorage !== 'undefined' ? localStorage : null);

/** The camera id this device chose for the Hub, or '' when it never chose. */
export function loadHubCamera(storage = null) {
  try {
    const v = store(storage) && store(storage).getItem(HUB_CAMERA_KEY);
    return typeof v === 'string' ? v : '';
  } catch {
    return '';
  }
}

/** Keep the choice on this device (a convenience: a lost choice falls back to the first camera). */
export function saveHubCamera(id, storage = null) {
  try { if (id && store(storage)) store(storage).setItem(HUB_CAMERA_KEY, String(id)); } catch { /* per device */ }
}

/**
 * The camera the Hub plays: the one this device chose, while the credential
 * still opens it; otherwise the first in the list. Null for an empty list.
 * A choice the credential no longer opens is never played (and never shown).
 */
export function pickHubCamera(cameras = [], savedId = '') {
  const list = (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id);
  if (!list.length) return null;
  return list.find((c) => c.id === savedId) || list[0];
}

/** The small frames: every other camera, in list order, at most `max`. */
export function hubThumbs(cameras = [], chosen = null, max = HUB_THUMBS_MAX) {
  const id = chosen && chosen.id;
  return (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id && c.id !== id).slice(0, Math.max(0, max));
}

/**
 * What the space shows. `status` is the camera list's own state ('loading',
 * 'ready', 'http-<code>', 'unreachable'), so a road that did not answer is
 * never reported as "no cameras" (DR-0076).
 *   advert     no credential on this device: the painted home and the words
 *   reading    the list is being asked
 *   live       a camera to play
 *   connect    the credential opens no camera yet
 *   no-answer  the road did not answer
 */
export function hubCameraState({ token = '', status = 'loading', cameras = [] } = {}) {
  if (!token) return 'advert';
  if (status === 'loading') return 'reading';
  if (status !== 'ready') return 'no-answer';
  return (Array.isArray(cameras) && cameras.some((c) => c && c.id)) ? 'live' : 'connect';
}

/**
 * THE WORDS FOR THE SPACE (Darrell: "the text explains the function of the
 * space"). Every line describes shipped behaviour: the live picture is
 * TileLive, the small frames and the kept choice are this file, recordings,
 * sharing by link and the garage door live in the Cameras tab (DR-0775,
 * DR-0778, DR-0777).
 */
export const HUB_CAMERA_WORDS = Object.freeze({
  title: 'Your home, live',
  advert: 'Family Operating Systems can keep a camera of your home right here: the one you choose plays live, the others wait small beneath it, and a tap keeps the one you want.',
  advertMore: 'Recordings, who may watch and for how long, and the garage door all live in the Cameras tab, for the family and anyone the owner shares a camera with.',
  connect: 'Your camera key is on this device, but it opens no camera yet. Connect one in the Cameras tab and it plays here.',
  noAnswer: 'The camera road did not answer just now, so nothing is playing. The Cameras tab says why.',
  reading: 'Asking which cameras this device may see…',
  choose: 'Tap a camera to keep it here.',
});
