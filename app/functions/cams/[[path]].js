// Same-origin reverse proxy for /cams/* — the family camera road (DR-0756):
// go2rtc on the NAS behind poetech-cams.service (infra/nas-cameras). Prefix
// PRESERVED — tailscale strips the mount point NAS-side before the forwarder.
// Snapshots and playlists are small; a live MP4 is a long streamed body, which
// this factory passes through unbuffered (it returns upstream.body as the
// Response body). Implementation + full rationale: functions/_lib/funnel-proxy.js.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/cams', label: 'cams' });
