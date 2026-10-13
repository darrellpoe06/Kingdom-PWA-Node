// Same-origin reverse proxy for /n8n/* — the LEGACY strip-prefix route:
// /n8n/webhook/foo proxies to FUNNEL/webhook/foo. Implementation + full
// rationale: functions/_lib/funnel-proxy.js. Renaming this route to a
// sovereign-neutral name is tracked (DR-0075 item; tests pin the /n8n prefix
// until the last webhooks retire — DR-0218).
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '', label: 'n8n' });
