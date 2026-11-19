// =============================================================================
// use-clip-rate — one speed for the reader's clip, whoever picked it
// =============================================================================
// The read-aloud hook's speed setter and its follower, kept together (split
// out of use-read-aloud.js, which is at its line budget):
//
//   setRate(r)  the reader's own chips: the device voice takes it (tts.js) and
//               a NAS-voice clip already playing takes it too, measured.
//   the effect  A SPEED PICKED SOMEWHERE ELSE REACHES A CLIP ALREADY PLAYING
//               (DR-1575). The Personalize sheet, another reader's chips or
//               another tab change the device's speed without calling this
//               reader's setRate; tts.rate follows the store (tts.js
//               subscribeTTSPrefs), and the clip on the element has to follow
//               it too, or the sheet moves its highlight while the voice keeps
//               its old pace. The speed this hook last put on its clip is
//               remembered, so its own setRate is never applied twice.
import { useCallback, useEffect, useRef } from 'react';
import { applyClipRate, clipRateNotice } from './clip-rate.js';
import { residualRate } from './voice-service.js';

/** @returns {(r:number)=>void} setRate */
export function useClipRate({ tts, rateRef, queueRef, audioRef, audioSpeedRef, setNotice }) {
  const clipRateRef = useRef(tts.rate);
  // Put a speed on whatever clip is playing; returns the measurement for a lone element.
  const toClip = useCallback(
    (r) => {
      clipRateRef.current = r;
      // The clip queue owns its element: it re-applies the remainder on every
      // piece and on this change, or the next paragraph snaps back to the old speed.
      if (queueRef.current) {
        queueRef.current.setRate(r);
        return null;
      }
      const a = audioRef.current;
      // An audio element takes a live rate change mid-play, unlike an utterance,
      // so this is audible at once, and it is MEASURED, never assumed (DR-0076).
      return a ? applyClipRate(a, residualRate(r, audioSpeedRef.current)) : null;
    },
    [queueRef, audioRef, audioSpeedRef]
  );

  /** Set the read speed, and carry it to a clip already playing. */
  const setRate = useCallback(
    (r) => {
      rateRef.current = r;
      tts.setRate(r);
      const msg = clipRateNotice(toClip(r));
      if (msg) setNotice(msg);
    },
    [tts, rateRef, toClip, setNotice]
  );

  useEffect(() => {
    const r = tts.rate;
    if (!Number.isFinite(r) || Math.abs(clipRateRef.current - r) < 0.001) return;
    toClip(r);
  }, [tts.rate, toClip]);

  return setRate;
}
