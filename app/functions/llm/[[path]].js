// Same-origin reverse proxy for /llm/* — the sovereign LLM lane (DR-0218):
// /llm/chat + /llm/health -> infra/nas-llm (llm_server.py / ollama_health.py)
// behind the NAS Caddy. Built 2026-07-30: the app cut over to this path with
// no transport on poetech.us, so the tutor/thought/talk-about/skill surfaces
// silently served their authored fallbacks (client-path-parity.test.js gates
// the class). Implementation: functions/_lib/funnel-proxy.js.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/llm', label: 'llm' });
