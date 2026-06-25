// =============================================================================
// voice-service — client for the SOVEREIGN voice studio (the cloned-voice swap)
// =============================================================================
// This is the single seam where a personal voice stops being a labeled browser
// STAND-IN and becomes the person's REAL cloned timbre. It is wired but INERT
// until the local voice studio exists:
//
//   - No endpoint configured (today) → isVoiceServiceReady() === false. Every
//     personal voice plays the browser stand-in (lib/tts.js). Nothing is faked.
//   - Endpoint configured (when the studio is live on the church 2x RTX 4070 /
//     home GPU box) → set VITE_VOICE_SERVICE_URL. Personal voices POST here and
//     play the returned audio — the real cloned voice, behind the SAME UI.
//
// The studio is a small local HTTP service (Kokoro / Piper for synthetic, XTTS /
// Voicebox for cloned) reachable on the LAN / Tailscale only — sovereign, nothing
// leaves the network (DATA-AS-EMPOWERMENT). Contract it must honor:
//   POST {base}/speak  { text, voice, person_key }  ->  audio/* body (wav/mp3)
//   GET  {base}/health ->  200
//
// Every call is null-safe and returns a tagged error instead of throwing, so the
// caller can fall back to the browser stand-in and NEVER fail silently.

/** The configured studio base URL, or '' when the studio is not live yet. */
export function voiceServiceUrl() {
  try {
    const u = import.meta && import.meta.env && import.meta.env.VITE_VOICE_SERVICE_URL;
    return typeof u === 'string' ? u.trim().replace(/\/+$/, '') : '';
  } catch (_) {
    return '';
  }
}

/** True only when a real sovereign voice studio endpoint is configured. */
export function isVoiceServiceReady() {
  return !!voiceServiceUrl();
}

/**
 * Synthesize speech on the sovereign studio and return a playable object URL.
 * Returns { url } on success or { error } on any failure (caller falls back to
 * the browser stand-in). `personKey` selects the enrolled cloned voice.
 */
export async function synthesizeSpeech({ text, voiceId, personKey, signal } = {}) {
  const base = voiceServiceUrl();
  if (!base) return { error: 'voice-service-not-configured' };
  const body = String(text || '').trim();
  if (!body) return { error: 'empty-text' };
  try {
    const res = await fetch(`${base}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body, voice: voiceId || null, person_key: personKey || null }),
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
