// /research/* -> the Funnel's /research mount (DR-1101): the research road,
// research_forwarder.py in front of Vane + our own SearxNG on the NAS. A
// plain pass-through, like /cams: the NAS forwarder holds the family key and
// serves only /health and /ask, never Vane's own pages.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';

export const onRequest = makeFunnelProxy({ upstreamPrefix: '/research', label: 'research' });
