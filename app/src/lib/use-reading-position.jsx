// =============================================================================
// use-reading-position — keep the exact place while reading, restore it on return
// =============================================================================
// Darrell 2026-09-14: "Lessons keep being interrupted and I'm loosing my exact
// location!!!!!!!!!!!!!????? Fix it!!!!!!!!!!!!"
//
// The record (learn-resume) and the geometry (reading-position) already exist.
// This is the part that was missing: something that WATCHES a silent reader and
// something that PUTS HIM BACK. See reading-position.js for why the previous two
// passes did not hold.
//
// Three writers now feed one record, and that is the point -- whichever way he
// is reading, the place is kept:
//   * this hook, as he SCROLLS (eyes only, the common case);
//   * TTSControl's device-voice sentence effect;
//   * TTSControl's cloud/cloned-voice sentence effect.
//
// AND IT FLUSHES ON INTERRUPTION. A phone call, the app backgrounded, the tab
// switched, the screen locked: `visibilitychange` and `pagehide` write
// immediately rather than waiting for the throttle, because the interruption IS
// the moment the place matters and the page may never get another frame.
import { useEffect, useRef } from 'react';
import { buildFollowMap, rangeFor } from './read-follow.js';
import { getPlace, recordPlace, sentenceKeyOf, findSentence } from './learn-resume.js';
import { pickTopSentence, sentenceBoxes, scrollToSentence, throttle } from './reading-position.js';

const READING_LINE = 96; // px below the top edge: sticky chrome lives above it

/**
 * @param {object} o
 * @param {string} o.elementId  the element rendering the lesson's prose.
 * @param {string} o.lessonId   the lesson this position belongs to.
 * @param {boolean} o.enabled   false while the lesson is closed.
 * @param {number} o.restoreKey bump to re-run the restore (a re-tap, DR-0392).
 */
export function useReadingPosition({ elementId, lessonId, enabled = true, restoreKey = 0 } = {}) {
  const restoredFor = useRef('');

  // ---- WATCH -------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !elementId || !lessonId) return undefined;
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

    const write = () => {
      const el = document.getElementById(elementId);
      if (!el) return;
      // Only ever write onto the lesson this hook belongs to: a stale mount
      // must never stamp its sentence onto whatever is open now.
      const place = getPlace();
      if (!place || place.lessonId !== lessonId) return;
      const follow = buildFollowMap(el, document);
      if (!follow || !Array.isArray(follow.segments) || !follow.segments.length) return;
      const idx = pickTopSentence(sentenceBoxes(follow, rangeFor, document), READING_LINE);
      if (idx < 0) return;
      const seg = follow.segments[idx];
      if (!seg || !seg.text) return;
      recordPlace({ sentence: idx, sentenceKey: sentenceKeyOf(seg.text) });
    };

    const onScroll = throttle(write, 700);
    // An interruption may be the page's LAST frame, so it writes now, not soon.
    const onInterrupt = () => { onScroll.cancel(); write(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onInterrupt);
    window.addEventListener('pagehide', onInterrupt);
    return () => {
      onScroll.cancel();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onInterrupt);
      window.removeEventListener('pagehide', onInterrupt);
      // Leaving the lesson is itself an interruption worth recording.
      write();
    };
  }, [enabled, elementId, lessonId]);

  // ---- RESTORE -----------------------------------------------------------
  useEffect(() => {
    if (!enabled || !elementId || !lessonId) return undefined;
    if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;
    const token = `${lessonId}:${restoreKey}`;
    if (restoredFor.current === token) return undefined;

    const place = getPlace();
    if (!place || place.lessonId !== lessonId) return undefined;
    if (!place.sentenceKey && !(place.sentence > 0)) return undefined; // nothing to go back to

    let tries = 0;
    let timer = null;
    const attempt = () => {
      const el = document.getElementById(elementId);
      const follow = el ? buildFollowMap(el, document) : null;
      if (follow && Array.isArray(follow.segments) && follow.segments.length) {
        const found = findSentence(follow.segments.map((s) => (s && s.text) || ''), place);
        if (found.index > 0) {
          scrollToSentence({ follow, index: found.index, rangeFor, doc: document, win: window, topInset: READING_LINE });
          restoredFor.current = token;
          return;
        }
        // The sentence is genuinely gone (an edited lesson). Mark it done and
        // LEAVE THE SCROLL ALONE -- jumping to the top is the defect, not the
        // fallback.
        if (found.how === 'gone') { restoredFor.current = token; return; }
      }
      // The lesson paints in stages; give it a few frames before giving up.
      tries += 1;
      if (tries < 12) timer = setTimeout(attempt, 120);
      else restoredFor.current = token;
    };
    timer = setTimeout(attempt, 60);
    return () => { if (timer) clearTimeout(timer); };
  }, [enabled, elementId, lessonId, restoreKey]);
}

export default useReadingPosition;
