// Same-origin sovereign transport for /voice/* — the reading voice's road home.
//
// Darrell 2026-09-20, after a night of the Fire TV reading nothing aloud: "You
// do it!!! Why would I be doing that when you can and should?!! No human being
// unless necessary!!"
//
// The studio serves plain HTTP on :8770. A browser on an HTTPS page refuses to
// fetch that — mixed content — so pointing VITE_VOICE_SERVICE_URL straight at
// the tailnet host could never have worked from poetech.us, and the runbook
// that said to do it was wrong on that point. The house already solved this
// shape once: the PWA reaches the NAS through a SAME-ORIGIN transport, never an
// absolute Funnel URL, because the absolute URL throttles cross-origin
// (CLAUDE.md, DR-0083/0132/0217). This is that transport for the voice.
//
// /voice/speak -> FUNNEL/voice/speak, over the Funnel's own HTTPS. Nothing in
// the client needs a secret, a per-device setting, or the same network.
//
// The prefix is PRESERVED rather than stripped (the /nas-photos shape, not the
// legacy /n8n one), so the NAS sees the path it publishes and the route name
// stays sovereign-neutral from birth — the rename that /n8n is still owed.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';

export const onRequest = makeFunnelProxy({ upstreamPrefix: '/voice', label: 'voice' });
