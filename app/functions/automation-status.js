// Same-origin reverse proxy for /automation-status (components/WorkflowStatus).
// Built 2026-07-30 (same class as /llm — see functions/llm/[[path]].js).
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/automation-status', label: 'automation-status' });
