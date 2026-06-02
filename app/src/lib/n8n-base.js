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
// The fix
// -------
// Route every webhook call through the same-origin Vercel rewrite
// "/n8n/* -> Funnel" (see app/vercel.json). The browser then issues a
// same-origin request to poetech.us, and Vercel egress proxies to the Funnel.
// The Funnel sees ONE trusted client (Vercel egress) instead of every family
// browser, so the cross-origin throttling condition is eliminated.
//
// Resolution order
// ----------------
//   1. If VITE_N8N_WEBHOOK_BASE is set AND does not point at the throttled
//      Funnel host, honor it. This lets a future proper subdomain (the
//      post-vacation Caddy + Let's Encrypt build) override cleanly.
//   2. Otherwise default to the relative "/n8n" path served by the rewrite.
//
// Note on neutralizing the Funnel host: the binding "Always-Now Viable Fix"
// directive (2026-06-02) asked for a "/n8n" default with the env var allowed
// to override. But the Vercel env var currently still holds the absolute
// Funnel URL, so a plain default would be overridden and the bug would persist
// until the dashboard is changed by hand. To close the bug today without a
// dashboard dependency while Darrell is on vacation, a base still pointing at
// the throttled Funnel host is treated as stale and replaced with the
// same-origin rewrite path. Once the env var is cleared (or repointed at a
// real subdomain) post-vacation, that override path is exercised normally.
// =============================================================================

const RAW = import.meta.env?.VITE_N8N_WEBHOOK_BASE;

// The throttled Tailscale Funnel host. Any base pointing here is neutralized
// in favor of the same-origin rewrite path.
const THROTTLED_FUNNEL = /tail5a2f35\.ts\.net/i;

// Resolved base, trailing slashes stripped so callers never produce "//".
export const N8N_BASE = (RAW && !THROTTLED_FUNNEL.test(RAW))
  ? RAW.replace(/\/+$/, '')
  : '/n8n';
