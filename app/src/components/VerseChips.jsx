// =============================================================================
// VerseChips — tap a reference, the Word opens RIGHT THERE. Nothing navigates.
// =============================================================================
// Darrell, 2026-09-08, on the Torah pattern map: "Make the bible verses
// clickable for seeing the Word when pressed... don't leave the page... just
// open right there... no quick moves to another place... open at the location
// it's clicked... don't want users needing to find the previous location...
// inline."
//
// This is UX-PATTERNS principle 6 (inline, no jumping — DR-0201) and Pattern
// 2e (the still screen — DR-0131 / DR-0274) applied to a Scripture reference:
// a reference is a BUTTON, not a link. Pressing it opens the verbatim King
// James text directly beneath the row of chips, in the same card, with the
// pressed chip marked; pressing again closes it. Several can be open at once,
// in the order the chips sit. Scroll position, the open pattern, the family
// tab — none of it moves. There is no href anywhere in this component, so
// there is nothing that CAN take a reader away. If a TAPPED verse's top edge
// sits below the fold, gentleReveal nudges by exactly the overshoot and no
// more, honouring reduced motion — usually it moves nothing.
//
// COLLECTIVELY AND INDEPENDENTLY, BOTH (Darrell, same day: "make all
// scriptures open with one click... collectively... and close collectively...
// also work independently... both"). The app-wide switch (lib/show-the-word.js,
// flipped by ShowTheWordToggle) opens or closes every reference on the page at
// once; a chip still toggles on its own on top of it. Flipping the switch
// clears the individual choices. A verse opened by the switch never nudges
// the screen — a page opening thirty verses must hold perfectly still.
//
// THE TEXT IS THE TEXT (DR-0076 / SCRIPTURE-REFERENCE-STANDARD). It comes from
// bible-kjv.js — the whole KJV hosted in the app, fetched verbatim, one book
// lazily loaded and cached. Nothing is quoted from memory. A verse the device
// cannot reach right now says so plainly; it is never filled in. The KJV is
// the edition this app hosts in full (Pattern 1's ESV-first badge waits on an
// edition the app is licensed to hold; the badge here says what it is).
//
// IN ORDER (Darrell, same day: "have them chronological... as much as they can
// be... based on their timelines and or the flow of scriptures"). A chip row
// and the verses beneath it read in timeline-then-flow order
// (lib/scripture-order.js): era band first, then the Word's own arrangement,
// then chapter and verse. The author's list is not changed, only shown in order.
//
// Reusable on purpose: any surface that lists references can render
// <VerseChips refs={[...]} /> and get the same behaviour, so "the standard
// applies everywhere" (DR-0314) is one import, not a re-implementation.
// Touch floor 36px (Pattern 2g.2), focus ring on every control (2g.1), rem
// type so the large-print control scales it (2b).
// =============================================================================
import React, { useEffect, useId, useRef, useState } from 'react';
import { verseText, parseRef } from '../lib/bible-kjv.js';
import { gentleReveal } from '../lib/gentle-motion.js';
import { useShowTheWord } from '../lib/show-the-word.js';
import { sortRefs } from '../lib/scripture-order.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

/** One opened verse: loads its text once, and says honestly when it cannot. */
export function VerseBlock({ refStr, load = verseText, id, reveal = true }) {
  // 'loading' | 'ready' | 'missing'
  const [state, setState] = useState({ status: 'loading', text: '' });
  const box = useRef(null);
  useEffect(() => {
    let live = true;
    setState({ status: 'loading', text: '' });
    Promise.resolve()
      .then(() => load(refStr))
      .then((t) => { if (live) setState(t ? { status: 'ready', text: t } : { status: 'missing', text: '' }); })
      .catch(() => { if (live) setState({ status: 'missing', text: '' }); });
    return () => { live = false; };
  }, [refStr, load]);
  // The still screen: a TAPPED verse opened under the finger usually moves
  // nothing; a verse opened by the page-wide switch never moves anything.
  useEffect(() => { if (reveal) gentleReveal(box.current); }, [reveal]);

  return (
    <div ref={box} id={id} className="border-l-2 border-[#5A6E3D] bg-[#FAF8F4] pl-3 pr-2 py-1.5" role="region" aria-label={refStr}>
      {state.status === 'loading' && (
        <p className="text-xs text-[#5A5751] italic" style={serif}>Opening {refStr}…</p>
      )}
      {state.status === 'ready' && (
        <p className="text-sm text-[#1A1815] leading-relaxed" style={serif}>
          “{state.text}”<span className="text-[0.625rem] text-[#5A5751] ml-1" style={mono}>KJV</span>
        </p>
      )}
      {state.status === 'missing' && (
        <p className="text-xs text-[#5A5751] italic" style={serif}>
          {refStr} could not be opened on this device right now — nothing is filled in for it.
        </p>
      )}
      <div className="text-[0.6875rem] text-[#5A6E3D] mt-0.5" style={serif}>{refStr}</div>
    </div>
  );
}

/**
 * The open-state model shared by VerseChips and WordInline: the page-wide
 * switch, with per-reference overrides on top. Returns [isOpen(ref), toggle(ref)].
 * Flipping the switch clears the overrides, so the page reads whole again.
 */
export function useOpenRefs() {
  const all = useShowTheWord();
  const [overrides, setOverrides] = useState(() => new Set());
  useEffect(() => { setOverrides(new Set()); }, [all]);
  const isOpen = (r) => (overrides.has(r) ? !all : all);
  const toggle = (r) => setOverrides((prev) => {
    const next = new Set(prev);
    if (next.has(r)) next.delete(r); else next.add(r);
    return next;
  });
  return [isOpen, toggle, all];
}

/**
 * A row of reference chips. Each is a toggle; each open one renders its verse
 * beneath the row, in chip order. `load` is injectable for tests.
 */
export default function VerseChips({ refs = [], load = verseText, className = '' }) {
  const [isOpen, toggle, all] = useOpenRefs();
  const base = useId();
  const list = sortRefs((refs || []).filter(Boolean));
  const blockId = (i) => `${base}-verse-${i}`;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1">
        {list.map((r, i) => {
          const open = isOpen(r);
          const resolvable = Boolean(parseRef(r));
          return (
            <button
              key={r} type="button"
              onClick={() => toggle(r)}
              aria-expanded={open}
              aria-controls={open ? blockId(i) : undefined}
              aria-label={`${open ? 'Close' : 'Open'} ${r}${resolvable ? '' : ' (not a reference this app can open)'}`}
              className={`px-2 py-1 min-h-[36px] text-[0.625rem] border focus:outline focus:outline-2 focus:outline-[#B85838] ${
                open
                  ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]'
                  : 'bg-[#FAF8F4] text-[#1A1815] border-[#C9C2B6] hover:border-[#1A1815]'}`}
            >{r}</button>
          );
        })}
      </div>
      {list.some(isOpen) && (
        <div className="mt-1.5 space-y-1.5">
          {list.map((r, i) => (isOpen(r) ? <VerseBlock key={r} refStr={r} load={load} id={blockId(i)} reveal={!all} /> : null))}
        </div>
      )}
    </div>
  );
}
