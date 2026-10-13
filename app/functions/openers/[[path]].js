// Same-origin reverse proxy for /openers/* — the house openers road (DR-0823):
// the garage door and any other opener, pressed by a small service on the NAS
// (infra/nas-openers). Prefix PRESERVED, the shape every sovereign route uses;
// the cloud never touches a relay and never learns a device address. A press is
// a short POST, so nothing here needs streaming. Implementation + full
// rationale: functions/_lib/funnel-proxy.js.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/openers', label: 'openers' });
