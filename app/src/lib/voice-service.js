// =============================================================================
// voice-service — client for the voice endpoint: SOVEREIGN FIRST, vendor RECORDED
// =============================================================================
// The single seam where a personal voice stops being a labeled browser STAND-IN
// and becomes the person's REAL cloned timbre. The doctrine (Darrell 2026-07-10,
// DR-0138): "We want to not need any vendor llm if possible... use it outside of
// vendor time allotment or when offline" — AND "source the vendor AI for things
// we can't do, with a record of when we need to and what we need to build and/or
// purchase." So:
//
//   1. SOVEREIGN (always outranks): the XTTS studio on the family/church's OWN
//      RTX 4070 (infra/voice-studio, :8770) — offline-capable, unmetered. Point
//      VITE_VOICE_SERVICE_URL at it. Arming it CLOSES the vendor gap.
//   2. VENDOR FALLBACK (a RECORDED sovereignty gap, never the destination): the
//      same-origin /api/voice-speak function (XTTS-v2 via Replicate) — used only
//      while the local studio isn't armed, and carried as an open gap in
//      lib/sovereignty-gaps.js with its build/purchase path and re-review date.
//      Enable with VITE_VOICE_BRIDGE=1 (client) + REPLICATE_API_TOKEN (server).
//
// Contract every endpoint honors (model-agnostic, so XTTS today / F5/OpenVoice/
// Kokoro later swap with no app change):
//   POST {endpoint}  { text, voice, person_key, reference_audio, language }
//                    ->  audio/* body (wav/mp3)
//
// Every call is null-safe and returns a tagged error instead of throwing, so the
// caller can fall back to the browser stand-in and NEVER fail silently.

const BRIDGE_PATH = '/api/voice-speak';

function env(name) {
  try { const v = import.meta && import.meta.env && import.meta.env[name]; return typeof v === 'string' ? v.trim() : ''; }
  catch (_) { return ''; }
}

/** The sovereign studio base URL (expects POST {base}/speak), or ''. */
export function voiceServiceUrl() {
  return env('VITE_VOICE_SERVICE_URL').replace(/\/+$/, '');
}

/** The same-origin vendor bridge is enabled (a recorded sovereignty gap). */
export function voiceBridgeEnabled() {
  return env('VITE_VOICE_BRIDGE') === '1';
}

/** The active POST endpoint + whether the recorded reference must accompany it.
 *  Sovereign ALWAYS outranks the vendor bridge (DR-0138). */
export function activeVoiceEndpoint() {
  const sovereign = voiceServiceUrl();
  if (sovereign) return { url: `${sovereign}/speak`, kind: 'sovereign', needsReference: true };
  if (voiceBridgeEnabled()) return { url: BRIDGE_PATH, kind: 'bridge', needsReference: true };
  return null;
}

/** True when SOME voice endpoint (bridge or sovereign studio) is configured. */
export function isVoiceServiceReady() {
  return !!activeVoiceEndpoint();
}

/**
 * Synthesize speech in the chosen voice and return a playable object URL.
 * `referenceDataUri` is the person's recorded sample (base64) — required for the
 * few-shot clone. Returns { url } on success or { error } on any failure so the
 * caller can fall back to the browser stand-in.
 */
export async function synthesizeSpeech({ text, voiceId, personKey, referenceDataUri, language, signal } = {}) {
  const endpoint = activeVoiceEndpoint();
  if (!endpoint) return { error: 'voice-service-not-configured' };
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  if (endpoint.needsReference && !referenceDataUri) return { error: 'no-voice-sample' };
  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: body,
        voice: voiceId || null,
        person_key: personKey || null,
        reference_audio: referenceDataUri || null,
        language: language || 'en',
      }),
      signal,
    });
    if (!res || !res.ok) return { error: `voice-service-${res ? res.status : 'no-response'}` };
    const blob = await res.blob();
    if (!blob || !blob.size) return { error: 'voice-service-empty' };
    return { url: URL.createObjectURL(blob) };
  } catch (e) {
    return { error: (e && e.message) || 'voice-service-error' };
  }
}
