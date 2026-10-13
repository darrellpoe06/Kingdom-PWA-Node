// Same-origin reverse proxy for /interest — the sovereign-neutral interest
// intake declared by lib/matched-services.js (interest_endpoint). No client
// component fetches it yet; the transport exists so the declared endpoint is
// REAL (an honest 502/404 from the NAS, never a silent SPA fallback) the day
// the intake form wires up (no waitlist posture — a dated timeline per entry, Darrell 2026-07-30) — and so the client-path-parity guard holds the
// catalog's promise to the same standard as live calls (2026-07-30).
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/interest', label: 'interest' });
