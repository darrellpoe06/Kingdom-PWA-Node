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
 *  Sovereign ALWAYS outranks the vendor bridge (DR-0138).
 *
 *  `needsReference` USED TO BE HARDCODED TRUE on both, and that one word was the
 *  reason every lesson read in the device's robot voice (DR-0382). It made the
 *  service clone-only by construction: the System voice — the default nobody
 *  changes — could never reach it, so a church running its own voice studio
 *  still heard Android's built-in engine. The flag is now about the REQUEST,
 *  not the endpoint: a cloned voice needs its sample, a built-in voice does
 *  not, and whether this particular deployment can serve a built-in speaker is
 *  DISCOVERED by asking rather than assumed (see synthesizeSpeech). */
export function activeVoiceEndpoint() {
  const sovereign = voiceServiceUrl();
  if (sovereign) return { url: `${sovereign}/speak`, kind: 'sovereign', needsReference: true };
  if (voiceBridgeEnabled()) return { url: BRIDGE_PATH, kind: 'bridge', needsReference: true };
  return null;
}

// WHAT THIS DEPLOYMENT CAN ACTUALLY DO, learned at runtime rather than declared.
//
// Some /speak backends (XTTS, Piper and friends) happily synthesize with a
// built-in speaker when no reference sample is sent; others refuse. Which one
// is on the NAS today is NOT something this file can know, and guessing either
// way is how a feature ships broken. So the first built-in request is an
// experiment: if it returns audio, built-in is supported and every later read
// uses it; if it fails, the answer is remembered and we never pay for that
// round trip again — we fall straight through to the device voice, which is
// exactly the behaviour before this change. Strictly better, never worse.
let builtInSupport = 'unknown'; // 'unknown' | 'yes' | 'no'

/** For tests and for a deliberate re-probe after the service is upgraded. */
export function resetBuiltInVoiceProbe() { builtInSupport = 'unknown'; }

/** What we have learned so far. Honest third state — never reported as yes. */
export function builtInVoiceSupport() { return builtInSupport; }

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
export async function synthesizeSpeech({
  text, voiceId, personKey, referenceDataUri, language, signal,
  // The caller is asking for the service's OWN voice rather than a clone of a
  // person. Set by the System-voice read path; never set for a person's voice,
  // where a missing sample is a real error the reader must be told about.
  allowBuiltIn = false,
} = {}) {
  const endpoint = activeVoiceEndpoint();
  if (!endpoint) return { error: 'voice-service-not-configured' };
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  if (!referenceDataUri) {
    if (!allowBuiltIn) return { error: 'no-voice-sample' };
    // Already asked once and been refused — do not spend the round trip again.
    if (builtInSupport === 'no') return { error: 'no-builtin-voice' };
  }
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
    if (!res || !res.ok) {
      if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
      return { error: `voice-service-${res ? res.status : 'no-response'}` };
    }
    const blob = await res.blob();
    if (!blob || !blob.size) {
      if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
      return { error: 'voice-service-empty' };
    }
    if (!referenceDataUri && allowBuiltIn) builtInSupport = 'yes';
    return { url: URL.createObjectURL(blob) };
  } catch (e) {
    if (!referenceDataUri && allowBuiltIn) builtInSupport = 'no';
    return { error: (e && e.message) || 'voice-service-error' };
  }
}
