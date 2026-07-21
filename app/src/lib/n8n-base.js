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
// History of the default (three eras, each superseding the last)
// ---------------------------------------------------------------
// 2026-06-02: same-origin '/n8n' via a Vercel rewrite, to dodge the Funnel's
// cross-origin 503 throttle.
//
// 2026-06-17: Funnel-direct. The Vercel rewrite itself was broken — Vercel's
// edge router could not complete the TLS handshake to *.ts.net targets
// (ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR -> 502) — so the browser was pointed
// straight at the Funnel, accepting the cross-origin throttle risk as the
// lesser evil while Vercel was the host.
//
// 2026-07-05 (current): same-origin '/n8n' again, via the Cloudflare Pages
// Function at app/functions/n8n/[[path]].js. Production moved off Vercel to
// Cloudflare Pages, which proxies *.ts.net fine — the 06-17 reason for
// Funnel-direct died with the Vercel hosting. Funnel-direct is now strictly
// worse: the Funnel throttles cross-origin browser fetches from poetech.us
// with 503s, which is exactly the intermittent "works, then doesn't" failure.
// The cutover checklist and the standing rule (project_app_to_nas_transport_and_
// sovereign_python) both require the same-origin default; this restores it.
//
// DR-0218 zero-n8n (2026-07-21): the interactive-LLM libs (class-tutor,
// talk-about, thought-finalizer) have since been cut over to the sovereign
// same-origin '/llm/chat' path (infra/nas-llm/llm_server.py) and no longer use
// this '/n8n' base; checkout/subscribe moved to '/api/*'. This resolver now
// serves only the still-legacy transports (nas-photos uploads and the remaining
// webhooks being retired) until those cut over too.
//
// Resolution order
// ----------------
//   1. If VITE_N8N_WEBHOOK_BASE is set, honor it (a future proper subdomain
//      overrides cleanly).
//   2. Otherwise default to the same-origin '/n8n' proxy (Pages Function in
//      production, the vite dev-server proxy locally — see vite.config.js).
// =============================================================================

const RAW = import.meta.env?.VITE_N8N_WEBHOOK_BASE;

// Same-origin proxy base. In production this is the Cloudflare Pages Function
// (app/functions/n8n/[[path]].js); in `vite dev` the dev-server proxy in
// vite.config.js forwards it to the LAN NAS. The browser never calls the
// Tailscale Funnel cross-origin (it throttles those with 503 before n8n).
const SAME_ORIGIN_PROXY = '/n8n';

// Resolved base, trailing slashes stripped so callers never produce "//".
// An explicit VITE_N8N_WEBHOOK_BASE override still wins (e.g. a future proper
// subdomain); otherwise the same-origin proxy is the default the browser calls.
export const N8N_BASE = RAW ? RAW.replace(/\/+$/, '') : SAME_ORIGIN_PROXY;

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
// TOKEN SOURCE ORDER (2026-07-03, Darrell: close the shipped-bearer exposure).
// The old source was ONLY VITE_N8N_BEARER — a build-time var inlined into the
// PUBLIC client bundle, so any visitor could extract the NAS webhook bearer
// from the site's JS (the old comment itself admitted "NOT a true secret").
// The PRIMARY source is now the PER-DEVICE bridge token — localStorage
// 'poetech-chat-bridge-token', the same token the NAS photo/history bridges
// already use: typed once on a family device, never present in the bundle.
// VITE_N8N_BEARER remains ONLY as a transition fallback; once every family
// device carries the bridge token, delete the var from the Vercel project and
// ROTATE the bearer on the NAS — the bundle-extractable value then dies.
// Rotation steps: N8N-WEBHOOK-AUTH-PATTERN.md.
const N8N_BEARER_FALLBACK = (import.meta.env?.VITE_N8N_BEARER || '').trim();
export const N8N_DEVICE_TOKEN_KEY = 'poetech-chat-bridge-token';

// Resolve the bearer at CALL time (not module load) so pasting the token into
// a device takes effect without a reload. Injectable win for tests; never throws.
export function resolveN8nBearer(win) {
  try {
    const w = win || (typeof window !== 'undefined' ? window : null);
    const device = (w && w.localStorage && w.localStorage.getItem(N8N_DEVICE_TOKEN_KEY)) || '';
    if (device.trim()) return device.trim();
  } catch { /* private mode — fall through to the transition fallback */ }
  return N8N_BEARER_FALLBACK;
}

// Returns the Authorization header object ONLY when a bearer is available AND
// the caller is authorized to fetch PII. Otherwise returns {} so the demo /
// profileless path sends nothing and the server gate denies it. Always spread
// the result into an existing headers object: { ...n8nAuthHeaders(allowed) }.
export function n8nAuthHeaders(authorized, win) {
  const bearer = resolveN8nBearer(win);
  if (authorized && bearer) return { Authorization: `Bearer ${bearer}` };
  return {};
}
