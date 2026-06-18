// =============================================================================
// n8n webhook base resolver — single source of truth
// =============================================================================
// Every PWA call to the family n8n instance (workflows 18, 30, 33, 34, 35,
// mark-noise, etc.) resolves its base URL here.
//
// Why this exists
// ---------------
// The Tailscale Funnel URL (https://poetech.tail5a2f35.ts.net) throttles
// cross-origin browser fetches that originate from https://poetech.us,
// returning HTTP 503 *before* the request reaches n8n. The Funnel relay
// treats the Vercel-served origin as abusive cross-origin traffic. Direct
// navigation to the same URL returns a clean 200, and wf18 itself is healthy
// (10+ successful executions, 100-220 ms). The bottleneck is the Funnel for
// the cross-origin case only.
//
// Full diagnosis:
//   docs/99-session-notes/2026-06-01-research-review-wf18-unreachable.md
//
// The fix (superseded — see 2026-06-17 update below)
// --------------------------------------------------
// The 2026-06-02 fix routed webhook calls through a same-origin Vercel rewrite
// "/n8n/* -> Funnel" (see app/vercel.json) to dodge the cross-origin throttle.
//
// 2026-06-17 supersession
// -----------------------
// The "/n8n" rewrite itself was the failure: Vercel's edge router CANNOT
// complete the TLS handshake to *.ts.net Funnel targets
// (ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR -> HTTP 502), so every Books ->
// Imported call 502'd before reaching n8n. Verified working paths: the public
// Funnel +bearer returns 200 with real data (2020 bank / 1878 gmail rows) for
// an external client, AND it emits correct CORS for poetech.us (OPTIONS 204,
// GET Access-Control-Allow-Origin). So the browser is now pointed DIRECTLY at
// the Funnel; only the Vercel rewrite hop was broken.
//
// Resolution order
// ----------------
//   1. If VITE_N8N_WEBHOOK_BASE is set, honor it (a future proper subdomain
//      overrides cleanly).
//   2. Otherwise default to the Tailscale Funnel directly.
//
// Reversible: restore the '/n8n' default (and the vercel.json rewrite) to roll
// back. Watch multi-device load in case the Funnel throttles under family-wide
// concurrent fetches — that is the "get off Vercel" data point on the board.
// =============================================================================

const RAW = import.meta.env?.VITE_N8N_WEBHOOK_BASE;

// 2026-06-17 update: route the browser DIRECTLY to the Tailscale Funnel.
// The Funnel serves correct CORS for poetech.us (OPTIONS preflight 204, GET 200
// with Access-Control-Allow-Origin), so a same-origin rewrite is unnecessary.
// The old "/n8n" Vercel rewrite is REMOVED because Vercel's edge router cannot
// complete the TLS handshake to *.ts.net Funnel targets
// (ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR -> 502) before the request ever
// reaches n8n. Reversible by restoring the rewrite default below ('/n8n').
const FUNNEL = 'https://poetech.tail5a2f35.ts.net';

// Resolved base, trailing slashes stripped so callers never produce "//".
// An explicit VITE_N8N_WEBHOOK_BASE override still wins (e.g. a future proper
// subdomain); otherwise the Funnel is the default target the browser calls.
export const N8N_BASE = RAW ? RAW.replace(/\/+$/, '') : FUNNEL;

// =============================================================================
// L16 — Bearer header for the wf18 imported-transactions PII webhook.
// =============================================================================
// wf18 serves real bank + Gmail PII (~2,020 Chase rows incl. Cash App / Zelle).
// Behind the D17 client gate, the NAS-side wf18 "Bearer check" node (L16)
// returns 401 unless the request carries this shared secret. Only an authorized
// load (family device, real saved profile) attaches it; the public demo /
// profileless state never sends it and stays 401-gated server-side even if the
// client gate were ever bypassed. Defense in depth: either gate alone fails
// closed.
//
// VITE_N8N_BEARER is a build-time Vite var, set in the Vercel project env to
// the SAME value the NAS apply script writes to /data/secrets/n8n-webhook-
// bearer.txt. IMPORTANT: VITE_-prefixed vars are inlined into the public client
// bundle and are therefore NOT a true secret -- this is a shared-secret speed
// bump that pairs with the D17 gate, not per-user cryptographic auth. True
// per-session secrecy arrives with the multi-user auth layer (L12 / Layer B),
// which will mint a per-session token fetched at runtime instead of a build-
// time constant. Full rationale + rotation steps: N8N-WEBHOOK-AUTH-PATTERN.md.
const N8N_BEARER = (import.meta.env?.VITE_N8N_BEARER || '').trim();

// Returns the Authorization header object ONLY when a bearer is configured AND
// the caller is authorized to fetch PII. Otherwise returns {} so the demo /
// profileless path sends nothing and the server gate denies it. Always spread
// the result into an existing headers object: { ...n8nAuthHeaders(allowed) }.
export function n8nAuthHeaders(authorized) {
  if (authorized && N8N_BEARER) return { Authorization: `Bearer ${N8N_BEARER}` };
  return {};
}
