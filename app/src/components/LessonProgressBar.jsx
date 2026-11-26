// =============================================================================
// LessonProgressBar — the thin "how far" bar on a lesson card (DR-1684)
// =============================================================================
// Darrell 2026-11-26: "an indicator bar that shows how far a lesson has been
// listened to or read so we can pick the ones we are closest to finishing",
// "For all lessons not just these." The ONE bar every Learn surface draws, so
// the number on every card comes from one place: lib/lesson-progress.js
// lessonProgress(), over the lesson's own saved place. A lesson with nothing
// measured draws nothing: no empty track standing in for "0%".
//
// Looks:
//   studio  - the new look (dark): a strip along the bottom of the cover, gold
//             on a dark track. Gold, never red: true red is reserved for the
//             Blood (Color Theology, DR-0099).
//   classic - the classic list: the same track/fill tokens as the in-lesson
//             bar (#E8E4DC / #5A6E3D), which every [data-theme] remaps.
//   oncolor - inside a filled button: currentColor, so it is exactly as
//             visible as the button's own words in every theme.
// No transition on the width (UX-PATTERNS: reduced motion; the still screen).
// The words ride as screen-reader text (and a tooltip), so the bar is never
// color alone.
// =============================================================================

import React from 'react';
import { lessonProgress } from '../lib/lesson-progress.js';

/**
 * A grid's place lookup, (courseKey, lessonId) -> place | null, from
 * lib/lesson-progress.js placeLookup(). Provided once by LearnStudio so every
 * card, list row and mini-list in the new look reads the same device places.
 */
export const PlaceLookupContext = React.createContext(null);

const LOOK = {
  studio: { track: 'ls-progress', fill: 'ls-progress-fill' },
  classic: { track: 'block h-1 mt-1 w-full bg-[#E8E4DC] overflow-hidden', fill: 'block h-full bg-[#5A6E3D]' },
  oncolor: { track: 'lpb-oncolor', fill: 'lpb-oncolor-fill' },
};

/**
 * @param {{ place?: object|null, progress?: object|null, look?: 'studio'|'classic'|'oncolor', className?: string, silent?: boolean }} props
 *   `place` is the lesson's saved place; `progress` (from lessonProgress) may be
 *   passed instead when the caller already computed it. `silent` drops the
 *   screen-reader words when the host already says them (its own text or its
 *   aria-label), so the number is never read out twice.
 */
export default function LessonProgressBar({ place = null, progress = null, look = 'classic', className = '', silent = false }) {
  const pr = progress || lessonProgress(place);
  if (!pr) return null;
  const css = LOOK[look] || LOOK.classic;
  // The fill is the measured fraction, unrounded; the words say it rounded down.
  const width = `${Math.max(0, Math.min(100, pr.fraction * 100))}%`;
  return (
    <span
      className={`${css.track} ${className}`.trim()}
      data-testid="lesson-progress"
      data-progress={pr.fraction}
      data-finished={pr.finished ? 'true' : 'false'}
      title={pr.label}
    >
      <span className={css.fill} style={{ width }} aria-hidden="true" data-testid="lesson-progress-fill" />
      {!silent && <span className="sr-only">{pr.label}</span>}
    </span>
  );
}

/** The bar for one lesson, found through the grid's PlaceLookupContext. */
export function LessonProgressFor({ courseKey, lessonId, look = 'studio', className = '' }) {
  const find = React.useContext(PlaceLookupContext);
  if (!find || !lessonId) return null;
  return <LessonProgressBar place={find(courseKey, lessonId)} look={look} className={className} />;
}
