// =============================================================================
// nas-photos — live photo reads from the family NAS (wf-property-photos)
// =============================================================================
// 2026-06-12, Darrell: "the images are already there for each rental and my
// home... why should I [file them] when you can start it — I'll adjust after."
// The galleries POPULATE THEMSELVES from the NAS bridge; the human's job is
// adjusting (file a photo to a room, keep one on the Big Picture), never
// seeding. Photos are displayed LIVE — Synology-generated thumbnails fetched
// per visit, never copied into device storage — so the NAS stays the one
// sovereign home for the bytes and the localStorage quota is untouched.
// Promotion to a room gallery or the Life Gallery is the deliberate,
// per-photo exception (the existing flows).
//
// Bridge contract (wf-property-photos, live on the NAS):
//   GET /n8n/webhook/property-photos?channel=<name>&limit=N&offset=M
//   Authorization: Bearer <poetech-chat-bridge-token>   (per-device token)
//   -> { photos: [{ id, thumb, date, text }] }
//
// 2026-06-13 — R15 sovereign photo WRITE path (DR-0055 brief next-best).
// Darrell: "photos stop living on one device." A new bearer-gated, path-
// sanitized upload workflow (wf-photo-upload) writes a photo to the family's
// own NAS, so every family device's gallery loads the same shared, backed-up
// pictures live-from-NAS instead of one phone's localStorage.
//   POST /n8n/webhook/photo-upload
//   Authorization: Bearer <token>
//   { dest: 'family'|<property-channel>, filename, dataUrl } -> { ok, id }
//   GET /n8n/webhook/family-photos?limit=N -> { photos: [...] }   (read back)
// =============================================================================

export const CHAT_BRIDGE_TOKEN_KEY = 'poetech-chat-bridge-token';

export function bridgeToken() {
  try { return (localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

export function hasBridgeToken() {
  return !!bridgeToken();
}

// Map a property to its Synology Chat channel name (the project-base channels
// Darrell used for years). His display names ("805 N Prospect (multi-unit)")
// don't match the channel names ("805NProspect"), and the photo/history bridge
// keys on the EXACT channel name — so this lookup, by stable property slug,
// routes each property to its real photo archive. Falls back to the property
// name for anything not in the map. This is the migration bridge for the Poe
// chat archive; new users instead get auto-sort from EXIF on upload (Layer 2).
export const PROPERTY_CHANNELS = {
  'r-805nprospect': '805NProspect',
  'r-440ss': '440SS',
  'r-709commercial': '709CommercialSt',
  'r-1513hh': '1513HH',
  'r-1508hh': '1508HH',
  'r-1213koehn': '1213KoehnDr',
  'r-2111talans': '2111TalansDr',
  'r-1003koehn': '1003Koehn',
  'r-1508williamsburg': '1508Williamsburg',
};

export function chatChannelFor(r) {
  if (!r) return '';
  return PROPERTY_CHANNELS[r.id] || r.name || '';
}

// Fetch one page of a property channel's photos. Returns { photos } on
// success, null on any failure (no token, offline, 401) — callers render
// nothing rather than an error wall; the NAS being unreachable must never
// degrade the rest of the page.
export async function fetchChannelPhotos(channel, { limit = 12, offset = 0 } = {}) {
  const token = bridgeToken();
  if (!token || !channel) return null;
  try {
    const resp = await fetch(`/n8n/webhook/property-photos?channel=${encodeURIComponent(channel)}&limit=${limit}&offset=${offset}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const payload = Array.isArray(json) ? (json[0] || {}) : json;
    return { photos: payload.photos || [], total: typeof payload.total === 'number' ? payload.total : (payload.photos || []).length };
  } catch (_) {
    return null;
  }
}

// The family-photo root (R15). 'family' is the shared family gallery; a
// property channel name routes to that property. Validated client-side too
// so a bad value never even leaves the device; the workflow re-validates
// (defense in depth — the client check is convenience, not the gate).
const DEST_RE = /^[A-Za-z0-9._-]{1,64}$/;
export function isValidDest(dest) {
  return typeof dest === 'string' && DEST_RE.test(dest) && !dest.includes('..');
}

// Fetch the shared family gallery from the NAS. Same fail-quiet contract as
// fetchChannelPhotos: null on any problem, never an error wall.
export async function fetchFamilyPhotos({ limit = 12 } = {}) {
  const token = bridgeToken();
  if (!token) return null;
  try {
    const resp = await fetch(`/n8n/webhook/family-photos?limit=${limit}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const payload = Array.isArray(json) ? (json[0] || {}) : json;
    return { photos: payload.photos || [], total: typeof payload.total === 'number' ? payload.total : (payload.photos || []).length };
  } catch (_) {
    return null;
  }
}

// Upload one photo (a compressed data URL) to the NAS. Returns { ok } | null.
// dest defaults to the shared family gallery. The caller falls back to
// device-local storage when this returns null (no token, offline, rejected) —
// the NAS is the better home, but a photo is never lost for lack of it.
export async function uploadPhoto(dataUrl, { dest = 'family', filename = '' } = {}) {
  const token = bridgeToken();
  if (!token || !dataUrl || !isValidDest(dest)) return null;
  // Keep the name to image chars only; the workflow re-sanitizes.
  const safeName = (filename || `photo-${Date.now()}.jpg`).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  try {
    const resp = await fetch('/n8n/webhook/photo-upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ dest, filename: safeName, dataUrl }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const payload = Array.isArray(json) ? (json[0] || {}) : json;
    return payload && payload.ok ? payload : null;
  } catch (_) {
    return null;
  }
}
