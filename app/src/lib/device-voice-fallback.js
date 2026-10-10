// =============================================================================
// device-voice-fallback — when the reader may use the Piper already on this
// device, instead of the device's own speech engine (DR-0881)
// =============================================================================
// Darrell, 2026-10-10, on the Firestick: "Words keep slurring not articulate
// or even decernable... we need other strategies for making the reader read
// appropriately. Opportunities and constraints!!!"
//
// THE CONSTRAINT, as the repo already measured it. On Android — and a Fire TV
// is Android — Chrome hands a web page ONE voice per language, and which
// engine actually speaks is the device's own Text-to-speech setting
// (device-voice-route.js:24). So no in-app voice list can change how Web
// Speech sounds, and on a Fire TV stick that engine is Fire OS's own. When
// the NAS cannot be reached, the reading fell to exactly that.
//
// THE OPPORTUNITY. lib/device-voice.js runs the SAME Piper model the NAS runs
// (/voice-lite), in a Web Worker on this device's CPU, with phoneme ids
// measured identical to the NAS binary — and after one download it needs no
// network at all. Its own header has said since DR-0656 that it is "not wired
// into the reader yet". This file is the policy for wiring it in.
//
// The decisions here are deliberately narrow, and each is a real limit rather
// than caution for its own sake:
//
//   PACE 1 ONLY. The NAS voice is asked to SPEAK faster (voiceSpeedFor), and
//   the clip queue stretches only the remainder. The device voice has no
//   speed parameter, so a clip it made would be filed under the fast key and
//   played without the stretch that key implies — the wrong pace, which is
//   worse than the wrong voice. Until the worker takes a speed, pace 1 (the
//   default, and what most reading is done at) is where this helps.
//
//   ALREADY DOWNLOADED ONLY. The model is ~63 MB and the runtime ~14 MB.
//   Pulling that silently because a reading stumbled would be a surprise on a
//   metered connection. The Voice surface is where a person chooses to
//   download it; here we only use what is already in the cache.
//
//   FASTER THAN REAL TIME, MEASURED. A Fire TV stick is a low-power ARM box
//   running ONNX on single-threaded WASM, and whether it synthesises faster
//   than it speaks is a genuine unknown that cannot be answered from a
//   sandbox. So it is MEASURED on the first piece rather than assumed: if the
//   device cannot keep ahead of its own playback, continuing would stutter,
//   which is not an improvement on slurring. It stands down for the rest of
//   the session and says so.
// =============================================================================

/** The pace the device voice can serve — it has no speed parameter. */
export const DEVICE_VOICE_PACE = 1;

/**
 * How much faster than real time the synthesis ran. 2 means two seconds of
 * speech per second of work. Below 1 the voice cannot keep ahead of itself.
 * Pure; null when it cannot be told.
 */
export function realtimeFactor({ ms, audioSeconds } = {}) {
  const work = Number(ms);
  const audio = Number(audioSeconds);
  if (!Number.isFinite(work) || work <= 0) return null;
  if (!Number.isFinite(audio) || audio <= 0) return null;
  return audio / (work / 1000);
}

// A little above 1, because a factor measured at exactly real time leaves no
// room for the next piece, the page, or anything else the device is doing.
export const MIN_REALTIME = 1.25;

/** Did this piece prove the device can keep ahead? Pure. null = unknown. */
export function keepsAhead(measure) {
  const f = realtimeFactor(measure);
  return f === null ? null : f >= MIN_REALTIME;
}

/**
 * May the reader ask the device voice for this piece? Pure, so the policy is
 * pinned rather than scattered through the reader.
 *
 *   speed   — the pace this piece was asked for
 *   ready   — the model is in the cache on this device
 *   stoodDown — a piece already proved too slow in this session
 */
export function mayUseDeviceVoice({ speed = 1, ready = false, stoodDown = false } = {}) {
  if (!ready || stoodDown) return false;
  return Number(speed) === DEVICE_VOICE_PACE;
}

/**
 * What the listener is told when the device voice stood down, in words that
 * say what to do rather than naming a subsystem. Pure.
 */
export function standDownReason(factor) {
  const f = Number(factor);
  if (!Number.isFinite(f) || f <= 0) {
    return 'The reading voice stored on this device could not be measured, so the reading carried on in the device’s own voice.';
  }
  return 'This device makes the good reading voice slower than it speaks it, so the reading carried on in the device’s own voice. A reading saved while you are on wifi plays in the good voice with nothing to make up.';
}
