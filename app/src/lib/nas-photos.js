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
//   GET the retired n8n property-photos webhook (channel,limit,offset)
//   Authorization: Bearer <poetech-chat-bridge-token>   (per-device token)
//   -> { photos: [{ id, thumb, date, text }] }
//
// 2026-06-13 — R15 sovereign photo WRITE path (DR-0055 brief next-best).
// Darrell: "photos stop living on one device." A new bearer-gated, path-
// sanitized upload workflow (wf-photo-upload) writes a photo to the family's
// own NAS, so every family device's gallery loads the same shared, backed-up
// pictures live-from-NAS instead of one phone's localStorage.
//   POST /nas-photos/upload
//   Authorization: Bearer <token>
//   { dest: 'family'|<property-channel>, filename, dataUrl } -> { ok, id }
//   GET /nas-photos/family-photos?limit=N -> { photos: [...] }   (read back)
//
// 2026-07-21 (DR-0218 zero-n8n): the family + album reads joined the property
// reads on the SOVEREIGN Python image server (`/nas-photos`, photo_server.py) —
// no n8n webhook anywhere in the photo path. family-photos lists the sovereign
// upload folder; album-photos is served honestly-empty until the Synology Photos
// service-account lane ships.
// =============================================================================

export const CHAT_BRIDGE_TOKEN_KEY = 'poetech-chat-bridge-token';

// Property photos are served by the SOVEREIGN PYTHON IMAGE SERVER on the NAS
// (infra/nas-property-photos/photo_server.py) via the same-origin `/nas-photos`
// Vercel rewrite -> Tailscale-fronted NAS. This REPLACED the old n8n bridge
// (the retired n8n property-photos webhook) after the 2026-07-01 regression: the count
// (psql, live) kept working while every thumbnail came back null, because the
// old n8n->SSH->resolver chain's thumbnail-path assumption drifted. One
// deterministic Python process now owns the whole path -- no n8n hop. The
// wire contract is unchanged: { count, total, photos:[{id,date,name,text,thumb}] }.
// (family/album galleries are separate workflows and still ride `/n8n`.)
export const NAS_PHOTO_BASE = '/nas-photos';

export function propertyPhotosUrl(channel, { limit = 24, offset = 0 } = {}) {
  return `${NAS_PHOTO_BASE}/property-photos?channel=${encodeURIComponent(channel)}&limit=${limit}&offset=${offset}`;
}

// Family gallery + curated-album reads join the SAME sovereign `/nas-photos`
// server (DR-0218 zero-n8n): /family-photos lists the photos the sovereign upload
// path wrote back; /album-photos is served honestly-empty until the Synology
// Photos service-account lane ships. Both are relative same-origin paths, never
// an n8n webhook — matching propertyPhotosUrl, so a stray edit can't route them
// back through /n8n (the 2026-07-01 regression class).
export function familyPhotosUrl({ limit = 12 } = {}) {
  return `${NAS_PHOTO_BASE}/family-photos?limit=${limit}`;
}
export function albumPhotosUrl(album, { limit = 60 } = {}) {
  return `${NAS_PHOTO_BASE}/album-photos?album=${encodeURIComponent(album)}&limit=${limit}`;
}

export function bridgeToken() {
  try { return (localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

export function hasBridgeToken() {
  return !!bridgeToken();
}

// Set (or clear) the NAS photo-bridge token on THIS device (Darrell 2026-07-18:
// "the bridge needs wiring"). Once set, uploadPhoto() authenticates and new
// photos flow to the NAS instead of piling up in localStorage. Per-device by
// design (the token is a device credential, never synced). A blank/whitespace
// value clears it. Returns the trimmed token that is now in effect ('' if
// cleared). Trims + length-caps so a stray paste can't store garbage.
export function setBridgeToken(token) {
  const clean = String(token || '').trim().slice(0, 512);
  try {
    if (clean) localStorage.setItem(CHAT_BRIDGE_TOKEN_KEY, clean);
    else localStorage.removeItem(CHAT_BRIDGE_TOKEN_KEY);
  } catch (_) { /* private mode / quota — non-fatal, the field just won't persist */ }
  return clean;
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
    const resp = await fetch(propertyPhotosUrl(channel, { limit, offset }), {
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
    const resp = await fetch(familyPhotosUrl({ limit }), {
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

// =============================================================================
// Curated album source for the Big Picture page (2026-06-24, Darrell:
// "can we use the Photos or Files app to populate the Big Picture page?").
// YES — sovereignly, from the family's own NAS, NOT an external cloud. His
// phone photos already back up to the NAS (DS file: /home/Photos/MobileBackup),
// but the raw camera-roll dump is private. So the OWNER designates ONE curated
// Synology Photos album (or NAS folder) to feed the Big Picture page; only that
// album is served. Default: nothing — the personal camera roll is never exposed.
// Served-not-surveilled: thumbnails fetched live per visit, never copied to the
// device. Same bearer-token + fail-quiet contract as the family/property reads.
//
// Bridge contract (album read, NAS-side — the Synology Photos service-account
// integration is pending; the sovereign server answers honestly-empty until it
// ships, DR-0218 zero-n8n):
//   GET /nas-photos/album-photos?album=<name>&limit=N
//   Authorization: Bearer <poetech-chat-bridge-token>
//   -> { photos: [{ id, thumb, date, text }] }
//
// TWO trust boundaries — do not conflate them (2026-06-24 design, Darrell):
//   1. The Authorization bearer above (poetech-chat-bridge-token) is the
//      CLIENT gate to the webhook. It is per-device, stored in localStorage,
//      and is the ONLY secret this client touches.
//   2. The NAS workflow then reads Synology Photos as a DEDICATED, read-only
//      SERVICE ACCOUNT (poetech-photos) scoped to ONLY the one shared album —
//      NOT the main dpoe account. That credential lives server-side in the
//      NAS secret store (n8n encrypted credentials), NEVER in this client,
//      NEVER in the repo, NEVER logged. The client below never sees it.
//   Full spec + DSM setup:
//   docs/99-session-notes/2026-06-24-big-picture-nas-photos-service-account-spec.md
// =============================================================================

// The owner's chosen album/folder name that feeds the Big Picture page. Stored
// per-device alongside the bridge token (same sovereign config pattern); empty
// by default so NOTHING from the camera roll is ever exposed without a
// deliberate choice. (Promoting this to a family-shared NAS setting is a
// follow-up; per-device matches the token's proven pattern for v1.)
export const BIG_PICTURE_ALBUM_KEY = 'poetech-bigpicture-album';

export function bigPictureAlbum() {
  try { return (localStorage.getItem(BIG_PICTURE_ALBUM_KEY) || '').trim(); } catch (_) { return ''; }
}

// Album names are HUMAN-named in Synology Photos and routinely contain spaces
// ("Big Picture", "Family Favorites") and apostrophes — so isValidDest (a slug
// validator for upload dests) is too strict here. Allow letters, digits,
// spaces, and . _ - ' & while still blocking path traversal and slashes so the
// value can never escape the album lookup. The workflow re-validates server-side.
const ALBUM_RE = /^[A-Za-z0-9 ._\-'&]{1,80}$/;
export function isValidAlbum(name) {
  return typeof name === 'string' && ALBUM_RE.test(name) && !name.includes('..') && !name.includes('/') && !name.includes('\\');
}

// Set (or clear, with '') the curated album. Validated to safe chars so a bad
// value never leaves the device; the workflow re-validates (defense in depth).
export function setBigPictureAlbum(name) {
  const clean = (name || '').trim();
  try {
    if (!clean) localStorage.removeItem(BIG_PICTURE_ALBUM_KEY);
    else if (isValidAlbum(clean)) localStorage.setItem(BIG_PICTURE_ALBUM_KEY, clean);
  } catch (_) { /* storage unavailable — no-op */ }
}

// Fetch the owner's curated Big Picture album from the NAS. Same fail-quiet
// contract: null on any problem (no token, no album chosen, offline, 401),
// never an error wall — until wf-album-photos ships, this simply renders
// nothing, which is the correct honest default.
export async function fetchAlbumPhotos(album, { limit = 60 } = {}) {
  const token = bridgeToken();
  if (!token || !album || !isValidAlbum(album)) return null;
  try {
    const resp = await fetch(albumPhotosUrl(album, { limit }), {
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
    // Sovereign Python photo server (same-origin /nas-photos rewrite), NOT n8n —
    // the write path now matches the read path (Ways: Python-first, off n8n).
    const resp = await fetch(`${NAS_PHOTO_BASE}/upload`, {
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
