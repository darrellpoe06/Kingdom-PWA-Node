// Same-origin reverse proxy for /poetech-app/taxes/* — the tax archive
// (infra/nas-tax-ingest writes /taxes/archive.json + /taxes/files/* to the
// Caddy site). Lives under /poetech-app because lib/tax-archive.js fetches
// BASE-RELATIVE (`${baseHref()}taxes/...`) and the app's base is
// /poetech-app/. Forwards to the Funnel's /taxes/*. Built 2026-07-30
// (same class as /llm — see functions/llm/[[path]].js).
import { makeFunnelProxy } from '../../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/taxes', label: 'taxes' });
