// =============================================================================
// clip-rate — the speed chip has to move the CLOUD clip too
// =============================================================================
// Darrell 2026-09-18, reading on two devices: "Reader speed is different on the
// laptop vs cellphone... we may need 4.5 or even as high as 5x speed for the
// laptop... it's slower."
//
// THE DEFECT UNDER THAT REPORT, found by reading the two playback paths rather
// than by guessing at the engines. A device-voice read honours the rate: tts.js
// binds utterance.rate per segment and re-speaks the current segment when the
// rate changes. A CLOUD read — the sovereign studio or the vendor bridge, which
// since DR-0382 carries the SYSTEM voice and is therefore the default nobody
// changes — was created as `new Audio(url)` and played with playbackRate never
// touched at all. So on that path the speed chips moved the highlight on the
// button and changed nothing about the speech, and one device honouring the
// rate while the other ignores it is exactly "different on the laptop".
//
// A clip is also the EASIER of the two to speed up: an audio element takes a
// live playbackRate change mid-play, where an utterance has to be re-spoken.
//
// TWO THINGS THIS MODULE REFUSES TO DO BLIND. It does not claim a rate was
// applied — it reads playbackRate BACK and reports whether the device honoured
// it, because browsers clamp differently and a speed the engine refused must
// not be reported to the reader as working (DR-0076 §1). And it sets pitch
// preservation explicitly, because at 4x an unpreserved clip stops sounding
// like words at all, which would make the new top of the ladder useless.
//
// Pure, null-safe, and it never throws: a playbackRate setter that raises is a
// device fact, not an exception for the reader to see.

/** The clip ladder's own bounds. Kept in step with tts.js MIN_RATE/MAX_RATE. */
export const CLIP_RATE_MIN = 0.5;
export const CLIP_RATE_MAX = 5.0;

/** How far the applied rate may sit from the requested one and still count. */
export const HONOR_TOLERANCE = 0.01;

/** Clamp any requested rate into what a clip can be asked to do. */
export function clampClipRate(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(CLIP_RATE_MAX, Math.max(CLIP_RATE_MIN, n));
}

/**
 * Ask a clip to play at `rate`, then MEASURE what it actually took.
 * @returns {{requested:number, applied:(number|null), honored:boolean}}
 */
export function applyClipRate(audio, rate) {
  const requested = clampClipRate(rate);
  if (!audio || (typeof audio !== 'object' && typeof audio !== 'function')) {
    return { requested, applied: null, honored: false };
  }
  // Pitch preservation BEFORE the rate: a device that only honours the flag at
  // assignment time then carries it into the faster playback.
  for (const key of ['preservesPitch', 'mozPreservesPitch', 'webkitPreservesPitch']) {
    try { if (key in audio) audio[key] = true; } catch (_) { /* a device fact */ }
  }
  try { audio.playbackRate = requested; } catch (_) { /* a device fact */ }
  let applied = null;
  try { const got = Number(audio.playbackRate); if (Number.isFinite(got) && got > 0) applied = got; } catch (_) {}
  return { requested, applied, honored: applied !== null && Math.abs(applied - requested) <= HONOR_TOLERANCE };
}

const fmt = (n) => `${Number(n) % 1 === 0 ? Number(n).toFixed(0) : Number(n).toFixed(1)}×`;

/**
 * What to tell the reader when the device would not take the speed. Empty for
 * an honoured rate — a working control says nothing, an ignored one says so.
 */
export function clipRateNotice(result) {
  if (!result || result.honored) return '';
  if (result.applied === null) {
    return `This device would not take the ${fmt(result.requested)} speed for this voice — the clip is playing at its own pace.`;
  }
  if (Math.abs(result.applied - 1) <= HONOR_TOLERANCE) {
    return `This device ignored the ${fmt(result.requested)} speed for this voice and is reading at normal pace.`;
  }
  return `This device capped the read at ${fmt(result.applied)}; ${fmt(result.requested)} was asked for.`;
}
