// Same-origin reverse proxy for /wake-orchestrator-control (WakeOrchestrator).
// Built 2026-07-30 (same class as /llm — see functions/llm/[[path]].js).
import { makeFunnelProxy } from './_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/wake-orchestrator-control', label: 'wake-orchestrator-control' });
