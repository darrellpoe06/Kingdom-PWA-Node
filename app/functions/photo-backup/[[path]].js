// /photo-backup/* -> the Funnel's /photo-backup mount (DR-1120): the photo
// backup road, immich_forwarder.py in front of Immich on the NAS. A plain
// pass-through, like /research: the NAS forwarder holds the family key
// (X-Family-Key) and passes only Immich's API, never its pages. The app uses
// this route for /health; a phone's uploads go to the Funnel directly (this
// proxy buffers bodies, and a video is bigger than its cap).
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';

export const onRequest = makeFunnelProxy({ upstreamPrefix: '/photo-backup', label: 'photo-backup' });
