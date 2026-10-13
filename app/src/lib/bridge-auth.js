// =============================================================================
// bridge-auth — the per-device bearer for the sovereign NAS bridges
// =============================================================================
// Every same-origin NAS bridge the app calls (/llm/*, /nas-photos/*, /taxes/*,
// the review/wake feeds, skill analytics) is gated by ONE shared per-device
// token: localStorage 'poetech-chat-bridge-token', typed once on a family
// device and never present in the public bundle.
//
// History (kept for accuracy): this lived in lib/n8n-base.js beside an n8n
// webhook base resolver. n8n was retired to zero (DR-0132 / DR-0218) and then
// left the repository entirely (DR-0617, 2026-09-24); the resolver went with
// it, and the header helper that outlived it was renamed from n8nAuthHeaders
// to bridgeAuthHeaders because nothing it serves is n8n.
//
// The 2026-07-30 access evaluation closed the build-time VITE_ bearer fallback
// (it shipped the NAS bearer inside the public bundle for 27 days). The ONLY
// source is the device token; a device without it degrades honestly (server
// 401, feature fallback) instead of the site leaking the key.
// =============================================================================

export const BRIDGE_DEVICE_TOKEN_KEY = 'poetech-chat-bridge-token';

// Resolve the bearer at CALL time (not module load) so pasting the token into
// a device takes effect without a reload. Injectable win for tests; never throws.
export function resolveBridgeBearer(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    const device = (w && w.localStorage && w.localStorage.getItem(BRIDGE_DEVICE_TOKEN_KEY)) || '';
    if (device.trim()) return device.trim();
  } catch { /* private mode — no device token readable */ }
  return '';
}

// Returns the Authorization header object ONLY when a bearer is available AND
// the caller is authorized. Otherwise returns {} so the demo / profileless path
// sends nothing and the server gate denies it. Always spread the result into an
// existing headers object: { ...bridgeAuthHeaders(allowed) }.
export function bridgeAuthHeaders(authorized, win) {
  const bearer = resolveBridgeBearer(win);
  if (authorized && bearer) return { Authorization: `Bearer ${bearer}` };
  return {};
}
