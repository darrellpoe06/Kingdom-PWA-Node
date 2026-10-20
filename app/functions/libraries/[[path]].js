// /libraries/* -> the Funnel's /libraries mount (DR-1121): the libraries
// road's HEALTH door only (libraries_forwarder.py). Jellyfin and
// Audiobookshelf themselves are on the tailnet, never the Funnel, because
// their TV and phone apps cannot carry the family key. A plain pass-through,
// like /research.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';

export const onRequest = makeFunnelProxy({ upstreamPrefix: '/libraries', label: 'libraries' });
