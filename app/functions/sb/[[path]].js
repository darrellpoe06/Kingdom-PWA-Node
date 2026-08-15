// Same-origin transport for the SOVEREIGN Supabase stack (DR-0307): poetech.us
// /sb/auth/v1/* (+ rest/realtime/storage) proxies to the Funnel's /sb path
// mount, where kong's /sb mirror routes strip the prefix and the same services
// answer that serve the loopback gateway. Same factory, same reasons
// (functions/_lib/funnel-proxy.js): the Funnel throttles cross-origin browser
// fetches, so the family's browsers ride one same-origin door.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/sb', label: 'sovereign-supabase' });
