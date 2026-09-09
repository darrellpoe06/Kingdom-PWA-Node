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
// The text comes from bible-kjv.js, hosted in the app, fetched verbatim and
// lazily by book (DR-0076). A verse that cannot be reached says so; it is
// never filled in.
//
// A chip in running text keeps the line rhythm (negative vertical margin) while
// its hit area still clears the 36px house floor (Pattern 2g.2).
// =============================================================================
import React, { useId, useState } from 'react';
import { verseText } from '../lib/bible-kjv.js';
import { segmentByReferences } from '../lib/verse-refs.js';
import { VerseBlock } from './VerseChips.jsx';

const CHIP = 'inline-flex items-center align-baseline min-h-[36px] -my-2 px-1.5 border text-[0.8em] leading-none focus:outline focus:outline-2 focus:outline-[#B85838]';

export default function WordInline({
  text, as: Tag = 'p', className = '', style, load = verseText, children,
}) {
  const source = typeof text === 'string' ? text : (typeof children === 'string' ? children : '');
  const segments = segmentByReferences(source);
  const [open, setOpen] = useState(() => new Set());
  const base = useId();
  const toggle = (r) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(r)) next.delete(r); else next.add(r);
    return next;
  });
  const refs = [];
  for (const seg of segments) if (seg.type === 'ref' && !refs.includes(seg.value)) refs.push(seg.value);
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
            aria-expanded={open.has(seg.value)}
            aria-controls={open.has(seg.value) ? blockId(seg.value) : undefined}
            aria-label={`${open.has(seg.value) ? 'Close' : 'Open'} ${seg.value}`}
            className={`${CHIP} ${open.has(seg.value)
              ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]'
              : 'bg-[#FAF8F4] text-[#1A1815] border-[#C9C2B6] hover:border-[#1A1815]'}`}
          >{seg.raw}</button>
        )))}
      </Tag>
      {refs.some((r) => open.has(r)) && (
        <div className="mt-1.5 space-y-1.5">
          {refs.map((r) => (open.has(r) ? <VerseBlock key={r} refStr={r} load={load} id={blockId(r)} /> : null))}
        </div>
      )}
    </>
  );
}
