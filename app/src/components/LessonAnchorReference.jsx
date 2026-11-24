// LessonAnchorReference — the lesson's Scripture outline, at the END, unread (DR-1631).
import React from 'react';
import VerseChips from './VerseChips.jsx';
import { anchorIsRun, referencesIn } from '../lib/verse-refs.js';
/**
 * The lesson's Scripture outline and every reference it stands on, at the END
 * of the lesson: there to open and study, never read aloud (`data-read-skip`,
 * lib/read-follow.js SKIP_SELECTOR — the list that decides what is heard).
 * Darrell 2026-11-24: "can they be at the end of the lessons, not read...
 * however there for their reference". The chips still open each verse in place.
 */
export default function LessonAnchorReference({ anchor }) {
  const ref = anchor && anchor.ref ? String(anchor.ref) : '';
  const theme = anchor && anchor.theme ? String(anchor.theme) : '';
  if (!ref && !theme) return null;
  const showRef = ref && !anchorIsRun(ref);
  const refs = referencesIn(`${showRef ? ref : ''} ${theme}`);
  if (!theme && refs.length === 0) return null;
  return (
    <aside
      className="mt-3 border-t border-[#E8E4DC] pt-2"
      data-read-skip="true"
      data-testid="lesson-anchor-reference"
      aria-label="Scripture in this lesson, for reference"
    >
      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">Scripture in this lesson · for your reference</div>
      {theme && (
        <p className="text-[0.6875rem] text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
          {showRef && <strong>Anchor — {ref}: </strong>}
          {theme}
        </p>
      )}
      {refs.length > 0 && <VerseChips refs={refs} tone="word" lead className="mt-1.5" data-testid="section-refs" />}
    </aside>
  );
}
