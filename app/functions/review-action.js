// Same-origin reverse proxy for /review-action (components/ReviewFeed.jsx) —
// the eleventh path, found by the same first red run as /review-feed.
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/review-action', label: 'review-action' });
