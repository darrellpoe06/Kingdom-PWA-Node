// =============================================================================
// ReadSections -- the lesson's sections in Read: count, where you are, one tap back (DR-1677)
// =============================================================================
// DR-0385's speaker's index, in the new lesson screen: the number of sections is
// stated before anything is tapped, every section is listed with its number, the
// one you are in is marked, and tapping goes there. Darrell 2026-11-26: "How can
// we go back or to a chapter without chapters?" A lesson the author wrote as one
// continuous reading says so rather than inventing an outline (DR-0076).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { sectionLeadOf } from './lesson-sections.js';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

/** [{ at, lead }]: each paragraph that opens with a section lead. Pure. */
export function readSections(paragraphs) {
  return paragraphs.map((p, at) => ({ at, lead: sectionLeadOf(p).lead })).filter((s) => s.lead);
}

export default function ReadSections({ paragraphs, page, onGo }) {
  const [open, setOpen] = useState(false);
  const sections = useMemo(() => readSections(paragraphs), [paragraphs]);
  if (sections.length < 2) return null;
  // The section you are in: the last one that starts at or before your paragraph.
  let here = -1;
  sections.forEach((s, i) => {
    if (s.at <= page) here = i;
  });
  return (
    <div className="le-read-sections" data-testid="le-read-sections">
      <button
        type="button"
        className={`le-tool le-tool--row ${RING}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="le-read-sections-toggle"
      >
        <span aria-hidden="true">☰</span>
        <span>
          {sections.length} sections{here >= 0 ? ` · you are in ${here + 1}` : ''}
        </span>
      </button>
      {open && (
        <ol className="le-chapters">
          {sections.map((s, i) => (
            <li key={s.at}>
              <button
                type="button"
                className={`le-chapter ${i === here ? 'is-here' : ''} ${RING}`}
                aria-current={i === here ? 'true' : undefined}
                onClick={() => {
                  setOpen(false);
                  onGo(s.at);
                }}
                data-testid={`le-read-section-${i + 1}`}
              >
                <span>
                  {i + 1}. {s.lead}
                </span>
                {i === here && <span className="le-tstamp">You are here</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
