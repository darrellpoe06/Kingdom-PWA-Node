// =============================================================================
// lesson-speed — the lesson player's read-aloud speed IS the device's speed
// =============================================================================
// THE LISTENER'S SPEED IS THE DEVICE'S SPEED (DR-1688). Darrell 2026-11-26: "When I push it to push
// play, it will not keep the 1.5 reading level I like." The player (LessonExperience.jsx) kept its
// own useState(1): it never read the speed saved on the device (lib/tts.js 'poe-tts-prefs', the one
// the READ button and the Personalize sheet share), never saved a pick, and built each lesson's
// narrator at 1x. Here the speed is read from that store, every pick is saved to it, a pick made
// elsewhere reaches an open player, and giveSpeed hands it to a narrator before play.
import { useCallback, useEffect, useRef, useState } from 'react';
import { RATE_STEPS, loadTTSPrefs, saveTTSRate, subscribeTTSPrefs } from '../../lib/tts.js';

// The four speeds the player's chip cycles -- the engine's own RATE_STEPS, the first four.
export const SPEEDS = RATE_STEPS.slice(0, 4);

/** The chip's next step: the first of its four above this speed, else back to the first. */
export function nextSpeed(rate) {
  const up = SPEEDS.find((s) => s.value > rate + 0.001);
  return (up || SPEEDS[0]).value;
}

/** Any speed named exactly (1.5×, 1.25×, 5×), never a fallback label. */
export function speedLabelFor(rate) {
  const step = RATE_STEPS.find((s) => Math.abs(s.value - rate) < 0.001);
  return step ? step.label : `${Number(rate.toFixed(2))}×`;
}

function savedSpeed() {
  try {
    return loadTTSPrefs().rate;
  } catch {
    return 1;
  }
}

/** Put the speed on a narrator (any on the createNarrator seam) unless it already holds it. */
export function giveSpeed(engine, rate) {
  if (!engine || typeof engine.setRate !== 'function') return;
  if (Math.abs((Number(engine.rate) || 0) - rate) > 0.001) engine.setRate(rate);
}

/** The player's speed: { rate, rateRef, cycleSpeed }, kept in the device store. */
export function useLessonSpeed(engineRef) {
  const [rate, setRate] = useState(savedSpeed);
  const rateRef = useRef(rate);
  rateRef.current = rate;
  // A speed picked anywhere on this device (the Personalize sheet, the READ button) reaches this player.
  useEffect(
    () =>
      subscribeTTSPrefs((now) => {
        if (!now || !Number.isFinite(now.rate)) return;
        setRate(now.rate);
        giveSpeed(engineRef.current, now.rate);
      }),
    [engineRef]
  );
  const cycleSpeed = useCallback(() => {
    const next = nextSpeed(rateRef.current);
    rateRef.current = next;
    setRate(next);
    giveSpeed(engineRef.current, next);
    try {
      saveTTSRate(next); // remembered on this device, and told to every reader on the page
    } catch {
      /* no store (private mode): the pick still holds for this visit */
    }
  }, [engineRef]);
  return { rate, rateRef, cycleSpeed };
}
