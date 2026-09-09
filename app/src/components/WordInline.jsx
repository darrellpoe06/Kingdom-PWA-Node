// =============================================================================
// WordInline — prose whose Scripture references open the Word in place
// =============================================================================
// Darrell, 2026-09-08: "really anywhere should have this ability... so the
// scriptures can always be read... anywhere at anytime... simple functions
// just to show the Word."
//
// The sibling of VerseChips for PROSE. Hand it a paragraph; every reference it
// names ("Genesis 1:26", "1 John 4:8", "Exodus 3:2-6") becomes a small button
// right where the words sit, and pressing it opens the verbatim King James
// text directly beneath the paragraph — same card, same scroll position, no
// link, no navigation (UX-PATTERNS principle 6 / Pattern 2e). Not one
// character of the prose changes: the chip shows the author's own words.
//
// The page-wide switch (ShowTheWordToggle / lib/show-the-word.js) opens or
// closes every reference here together; a chip still toggles on its own on
// top of it (useOpenRefs, shared with VerseChips — one model of "open").
//
// The text comes from bible-kjv.js, hosted in the app, fetched verbatim and
// lazily by book (DR-0076). A verse that cannot be reached says so; it is
// never filled in.
//
// A chip in running text keeps the line rhythm (negative vertical margin) while
// its hit area still clears the 36px house floor (Pattern 2g.2).
// =============================================================================
import React, { useId } from 'react';
import { verseText } from '../lib/bible-kjv.js';
import { segmentByReferences } from '../lib/verse-refs.js';
import { VerseBlock, useOpenRefs } from './VerseChips.jsx';
import { sortRefs } from '../lib/scripture-order.js';

const CHIP = 'inline-flex items-center align-baseline min-h-[36px] -my-2 px-1.5 border text-[0.8em] leading-none focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function WordInline({
  text, as: Tag = 'p', className = '', style, load = verseText, children,
}) {
  const source = typeof text === 'string' ? text : (typeof children === 'string' ? children : '');
  const segments = segmentByReferences(source);
  const [isOpen, toggle, all] = useOpenRefs();
  const base = useId();
  // The prose is the author's and stays exactly as written; the verses that
  // open beneath it read in timeline-then-flow order (lib/scripture-order.js).
  const named = [];
  for (const seg of segments) if (seg.type === 'ref' && !named.includes(seg.value)) named.push(seg.value);
  const refs = sortRefs(named);
  const blockId = (r) => `${base}-${refs.indexOf(r)}`;

  if (!segments.some((s) => s.type === 'ref')) {
    return <Tag className={className} style={style}>{source}</Tag>;
  }
  return (
    <>
      <Tag className={className} style={style}>
        {segments.map((seg, i) => (seg.type === 'text' ? (
          <React.Fragment key={i}>{seg.value}</React.Fragment>
        ) : (
          <button
            key={i} type="button"
            onClick={() => toggle(seg.value)}
            aria-expanded={isOpen(seg.value)}
            aria-controls={isOpen(seg.value) ? blockId(seg.value) : undefined}
            aria-label={`${isOpen(seg.value) ? 'Close' : 'Open'} ${seg.value}`}
            className={`${CHIP} ${isOpen(seg.value)
              ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]'
              : 'bg-[#FAF8F4] text-[#1A1815] border-[#C9C2B6] hover:border-[#1A1815]'}`}
          >{seg.raw}</button>
        )))}
      </Tag>
      {refs.some(isOpen) && (
        <div className="mt-1.5 space-y-1.5">
          {refs.map((r) => (isOpen(r) ? <VerseBlock key={r} refStr={r} load={load} id={blockId(r)} reveal={!all} /> : null))}
        </div>
      )}
    </>
  );
}
