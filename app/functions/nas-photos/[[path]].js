// Same-origin reverse proxy for /nas-photos/* (sovereign property/family/album
// photo server, infra/nas-property-photos). Prefix PRESERVED — the Funnel's
// proxy-mount strips it NAS-side before the Python server. Implementation +
// full rationale: functions/_lib/funnel-proxy.js.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/nas-photos', label: 'nas-photos' });
