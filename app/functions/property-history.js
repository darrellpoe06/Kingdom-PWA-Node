// Same-origin reverse proxy for /property-history — the rentals bridge
// (components/Rentals.jsx). NOTE: the NAS side is still the n8n-era shell
// (infra/n8n/property-history.sh); this transport makes the path reachable so
// the sovereign replacement lands behind a working route (DR-0218 P-item).
// Built 2026-07-30 (same class as /llm — see functions/llm/[[path]].js).
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/property-history', label: 'property-history' });
