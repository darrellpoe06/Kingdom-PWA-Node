// Same-origin reverse proxy for /ways/* — the ways brain
// (infra/nas-ways/ways_ingest.py writes /ways/brain.json to the Caddy site).
// Built 2026-07-30 (same class as /llm).
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/ways', label: 'ways' });
