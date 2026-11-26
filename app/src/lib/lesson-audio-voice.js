// =============================================================================
// lesson-audio-voice — the lesson player's System voice is REAL AUDIO (DR-1705)
// =============================================================================
// Darrell, 2026-11-26: "why does the app not work when ... you turn the screen
// off ... it should work in the background. That's the point of the app. It's
// a reader app."
//
// THE TRACE. The new lesson look (learn-studio/LessonExperience.jsx, the look
// most lessons open in) read the System voice through lib/tts.js
// createBrowserTTS: the phone's Web Speech engine. Web Speech is not media.
// Android Chrome stops it when the screen turns off or the app leaves the
// screen, and iOS pauses it on lock. The classic reader (use-read-aloud.js)
// has played the System voice as NAS audio clips (/voice-lite, Piper) since
// 2026-09-24, and that is what keeps playing; the new look never took it.
//
// This is the piece maker the clip narrator (chosen-voice-narrator.js
// createCloneNarrator) asks for each sentence: a clip already saved on this
// device first (no road needed), else the NAS voice, bounded by its own
// timeout (15 s for the first piece, 60 s for the ones fetched ahead while one
// plays). A miss is remembered for as long as its cause lasts
// (markLiteVoiceMiss), so the next lesson goes straight to the device voice
// instead of paying the same timeout again.
// =============================================================================
import { synthesizeLite, markLiteVoiceMiss, voiceSpeedFor, LITE_FIRST_TIMEOUT_MS, LITE_TIMEOUT_MS } from './voice-service.js';
import { clipKey, deviceClipCache } from './clip-cache.js';
import { toSpokenForm } from './speech-text.js';
import { forSynthesis } from './synthesis-text.js';

/** The text the voice is handed (the same shaping, and so the same cache keys, as the classic reader). */
export const forVoice = (t) => forSynthesis(toSpokenForm(String(t || '')));

/** How long a saved-clip lookup may take before the road is asked instead. */
export const CACHE_LOOKUP_MS = 1500;

function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}

/**
 * fetchClip(text, index, pace) -> Promise<{url}|{error}> in the NAS System
 * voice. Every dependency is injectable so a test drives it with no network.
 */
export function liteClipFor(voice = 'male', {
  synth = synthesizeLite,
  cache = () => { try { return deviceClipCache(); } catch { return null; } },
  markMiss = markLiteVoiceMiss,
  makeUrl = (blob) => URL.createObjectURL(blob),
  cacheMs = CACHE_LOOKUP_MS,
} = {}) {
  return async (text, index, pace) => {
    const spoken = forVoice(text);
    if (!spoken.trim()) return { error: 'empty-text' };
    const speed = voiceSpeedFor(pace);
    const key = clipKey({ voice, text: spoken, speed });
    const store = cache();
    if (store && typeof store.get === 'function') {
      const blob = await withTimeout(store.get(key), cacheMs, null);
      if (blob && blob.size) {
        try { return { url: makeUrl(blob), saved: true }; } catch { /* fall to the road */ }
      }
    }
    const got = await synth({ text: spoken, voice, speed, timeoutMs: index === 0 ? LITE_FIRST_TIMEOUT_MS : LITE_TIMEOUT_MS });
    if (!got || !got.url) {
      const error = (got && got.error) || 'voice-lite-empty';
      try { markMiss(error); } catch { /* remembering a miss is never fatal */ }
      return { error };
    }
    if (got.blob && store && typeof store.put === 'function') {
      try { Promise.resolve(store.put(key, got.blob)).catch(() => {}); } catch { /* a full device still plays */ }
    }
    return { url: got.url };
  };
}

/** The one line the player shows when the System voice had to fall to the phone's own voice. */
export function deviceVoiceNote(reason = '') {
  const why = /401|403/.test(String(reason))
    ? 'The church’s reading voice needs this device signed in.'
    : 'The church’s reading voice did not answer.';
  return `${why} The phone’s own voice reads from here, and it stops when the screen turns off.`;
}
