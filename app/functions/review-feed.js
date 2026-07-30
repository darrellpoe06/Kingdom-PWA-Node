// Same-origin reverse proxy for /review-feed (components/ReviewFeed.jsx) —
// found by the client-path-parity guard's FIRST red run (2026-07-30), beyond
// the nine paths the review had already named: the guard catching a tenth
// path on day one is its proven-to-catch receipt.
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/review-feed', label: 'review-feed' });
