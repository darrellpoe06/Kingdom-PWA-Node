// Same-origin reverse proxy for /scribe and /scribe/* — the sovereign scribe
// ingest (infra/nas-scribe/scribe_ingest_server.py: /scribe/session,
// /scribe [chunks], /scribe/complete). Built 2026-07-30 (same class as /llm).
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/scribe', label: 'scribe' });
