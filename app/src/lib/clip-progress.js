// =============================================================================
// clip-progress — how far through a spoken clip are we, when the browser will
// not say how long it is?
// =============================================================================
// Darrell 2026-09-18, from the church door with a screenshot: "Reader does not
// read the full story... with highlights... it keeps reading and stops
// highlighting the whole lesson... it starts with the highlighting though."
//
// THE SHAPE OF THAT DEFECT, TRACED. In the sovereign/cloned voice the whole
// lesson is ONE audio clip, and the follow-along highlight is driven entirely
// by the clip's playback FRACTION (use-read-aloud.js -> cloudProgress ->
// segmentIndexAtFraction in TTSControl). Both playback sites computed that
// fraction as `currentTime / duration` behind `Number.isFinite(d) && d > 0`.
//
// An <audio> element served a streamed or chunk-encoded body — which is what a
// synthesis endpoint returns when it writes the clip as it makes it — reports
// `duration` as Infinity (or NaN before metadata lands) for the WHOLE of
// playback. So that guard was false on every tick, setCloudProgress was never
// called after its initial 0, cloudProgress stayed 0, and the sentence
// highlight painted segment ZERO once and never moved again while the audio
// read the entire lesson. Highlight at the start; none afterwards; reading
// unaffected. That is the report, exactly.
//
// THE RULE HERE: a highlight that keeps moving on an estimate beats a
// highlight frozen on sentence one. The ladder below takes real information
// wherever it exists and only estimates as the last rung, and the estimate is
// NAMED as an estimate rather than dressed up as a measurement (DR-0076 §8).

// Typical English reading aloud runs near 150 words a minute, and an English
// word averages about 5.1 letters plus its space — so roughly 15 characters a
// second. It is a STATED ESTIMATE, not a measurement of any particular voice:
// it is used only when the browser refuses to say how long the clip is, and a
// real duration always wins over it the moment one arrives.
export const ESTIMATED_CHARS_PER_SECOND = 15;

/** How long this text will probably take to speak, in seconds. Never zero. */
export function estimateClipSeconds(text, charsPerSecond = ESTIMATED_CHARS_PER_SECOND) {
  const n = String(text || '').trim().length;
  const rate = Number(charsPerSecond) > 0 ? Number(charsPerSecond) : ESTIMATED_CHARS_PER_SECOND;
  return n > 0 ? n / rate : 0;
}

/**
 * The 0..1 position through a clip, from the best information available.
 *   1. the element's own duration — a real measurement, always preferred;
 *   2. the far end of what is seekable — real, and present on some streams
 *      whose duration never resolves;
 *   3. the estimate above — degraded, moving, and honest.
 * Returns null when even currentTime is unusable, so a caller can leave the
 * highlight where it is rather than jump it to the top.
 */
export function clipFraction({ currentTime, duration, seekableEnd = null, estimatedSeconds = null } = {}) {
  const t = Number(currentTime);
  if (!Number.isFinite(t) || t < 0) return null;
  for (const total of [duration, seekableEnd, estimatedSeconds]) {
    const d = Number(total);
    if (Number.isFinite(d) && d > 0) return Math.min(1, Math.max(0, t / d));
  }
  return null;
}

/** The far end of an element's seekable range, or null. Never throws. */
export function seekableEndOf(audio) {
  try {
    const s = audio && audio.seekable;
    if (!s || !s.length) return null;
    const end = s.end(s.length - 1);
    return Number.isFinite(end) && end > 0 ? end : null;
  } catch (_) { return null; }
}
