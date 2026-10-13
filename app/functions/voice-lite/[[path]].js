// Same-origin sovereign transport for /voice-lite/* — the NAS's own real-audio
// reading voice (infra/nas-voice-lite, Piper on the NAS CPU).
//
// Darrell 2026-09-24: "Why doesn't the player remain playing in the background
// when I switch between apps?!!? Fix it." With the GPU studio dark the reader
// fell back to Web Speech, which Android stops in the background. This route
// carries the always-available AUDIO stand-in instead, the /voice shape exactly:
// /voice-lite/speak -> FUNNEL/voice-lite/speak, bearer-gated on the NAS.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';

export const onRequest = makeFunnelProxy({ upstreamPrefix: '/voice-lite', label: 'voice-lite' });
