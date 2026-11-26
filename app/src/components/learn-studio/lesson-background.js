// =============================================================================
// lesson-background — the lesson player owns the lock screen while it reads (DR-1705)
// =============================================================================
// Darrell, 2026-11-26: "if you want to turn off your screen and let it read to
// you, that should be something that you're able to do."
//
// The classic reader (use-read-aloud.js) holds lib/background-audio.js for as
// long as it reads: one silent looping element (so the gaps between clips are
// still media and the page counts as playing), the lock-screen card, and the
// phone's own play / pause / next / previous wired to the reader's controls.
// The new lesson look (LessonExperience.jsx) held none of it, so the phone had
// no card, no buttons, and nothing to keep the page alive between sentences.
//
// claim() runs INSIDE the tap that starts playback (a phone refuses play()
// outside one). The card follows the player's status; when the player has
// stayed idle for RELEASE_MS (a stop, the end of the lesson) every button is
// handed back so the listener's own music keeps its controls. A skip is a
// stop and a play in the same tick, so the delay keeps the card from blinking.
// =============================================================================
import { useCallback, useEffect, useRef } from 'react';
import { createBackgroundAudio } from '../../lib/background-audio.js';

export const RELEASE_MS = 2000;

/** The first sentence of the paragraph after (dir 1) or before (dir -1) the one sentence `idx` sits in. Pure. */
export function paragraphStep(segPara, firstSeg, idx, dir) {
  const n = Array.isArray(segPara) ? segPara.length : 0;
  if (!n) return Math.max(0, idx + dir);
  const here = segPara[Math.max(0, Math.min(n - 1, idx))] || 0;
  if (dir > 0) {
    const next = firstSeg[here + 1];
    return next == null || next < 0 ? n - 1 : next;
  }
  // Back from inside a paragraph returns to its start; from its first sentence, to the one before.
  const start = firstSeg[here] ?? 0;
  if (idx > start) return start;
  return here > 0 ? firstSeg[here - 1] ?? 0 : 0;
}

/**
 * @param {object} o
 * @param {'idle'|'playing'|'paused'} o.status  the narrator's status
 * @param {number} o.position   seconds into the lesson (estimate)
 * @param {number} o.duration   seconds the lesson lasts (estimate)
 * @param {number} o.rate       the listener's speed
 * @param {string} o.title      the lesson title (the card's title)
 * @param {string} o.album      the course (the card's album line)
 * @param {object} o.controls   { play, pause, next, prev } — read live through a ref
 * @param {Function} [o.make]   tests inject the background-audio session
 */
export function useLessonBackground({ status, position, duration, rate, title, album, controls, make = createBackgroundAudio }) {
  const bgRef = useRef(null);
  const ctlRef = useRef(controls);
  ctlRef.current = controls;
  const bg = () => {
    if (!bgRef.current) {
      try {
        bgRef.current = make();
      } catch {
        bgRef.current = null;
      }
    }
    return bgRef.current;
  };
  const meta = useRef({ title, album });
  meta.current = { title, album };

  const claim = useCallback(() => {
    const b = bg();
    if (!b) return;
    const call = (name) => () => {
      const fn = ctlRef.current && ctlRef.current[name];
      if (typeof fn === 'function') fn();
    };
    try {
      b.start();
      b.describe({ title: meta.current.title, album: meta.current.album });
      b.onControl({ onPlay: call('play'), onPause: call('pause'), onStop: call('pause'), onNext: call('next'), onPrev: call('prev') });
      b.setState('playing');
    } catch {
      /* a phone without media controls still reads */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The card follows the player; a lasting idle hands the phone back.
  useEffect(() => {
    const b = bgRef.current;
    if (!b) return undefined;
    if (status === 'playing' || status === 'paused') {
      try {
        if (status === 'playing' && !b.active) b.start();
        b.setState(status);
      } catch {
        /* never fatal */
      }
      return undefined;
    }
    const t = setTimeout(() => {
      try {
        b.stop();
      } catch {
        /* already released */
      }
    }, RELEASE_MS);
    return () => clearTimeout(t);
  }, [status]);

  // Where the lesson is, for the lock-screen progress bar.
  useEffect(() => {
    const b = bgRef.current;
    if (!b || status === 'idle') return;
    try {
      b.setPosition({ duration, position, playbackRate: rate });
    } catch {
      /* the bar is a convenience */
    }
  }, [status, position, duration, rate]);

  // Leaving the lesson releases everything at once.
  useEffect(
    () => () => {
      try {
        if (bgRef.current) bgRef.current.stop();
      } catch {
        /* already released */
      }
    },
    []
  );

  return claim;
}
