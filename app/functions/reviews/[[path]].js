// Same-origin reverse proxy for /reviews/* — the sovereign review feed
// (infra/nas-review-feed/review_server.py writes /reviews/llm-review.json to
// the Caddy site). Built 2026-07-30 (same class as /llm — see that file).
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/reviews', label: 'reviews' });
