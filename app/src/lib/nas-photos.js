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
// =============================================================================

export const CHAT_BRIDGE_TOKEN_KEY = 'poetech-chat-bridge-token';

export function bridgeToken() {
  try { return (localStorage.getItem(CHAT_BRIDGE_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

export function hasBridgeToken() {
  return !!bridgeToken();
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
    return { photos: payload.photos || [] };
  } catch (_) {
    return null;
  }
}
