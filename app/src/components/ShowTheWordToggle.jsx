// =============================================================================
// ShowTheWordToggle — the one tap that shows, or hides, every Scripture here
// =============================================================================
// Darrell, 2026-09-08: "make all scriptures open with one click so the reader
// can read it with or without the scriptures presented." And: "Make sure the
// users know also..."
//
// Placed once near the top of any surface that carries VerseChips or
// WordInline. It flips the app-wide switch (lib/show-the-word.js), so every
// reference on the page opens or closes together; each chip still works on its
// own on top of it. Nothing scrolls when it flips — the verses open where they
// sit and the screen holds still (Pattern 2e).
//
// NO HOVER COLOUR SWAP (2026-09-09, Darrell's screenshot: a blank button). A
// phone keeps :hover on the last thing tapped, and a hover that turned the text white over a
// surface a theme paints white left the label invisible. Hover now only
// darkens the text and border, the way the sibling toggles on the map do.
//
// THE READER IS TOLD. The button says what it will do, and one plain line
// beside it says the three things a reader needs: any reference can be
// tapped, this switch opens them all, and they read in the order they
// happened as far as the Word settles it. No tour, no tooltip a thumb cannot
// hover — the sentence sits where the chips are.
// =============================================================================
import React from 'react';
import { useShowTheWord, toggleShowTheWord } from '../lib/show-the-word.js';

export const SHOW_THE_WORD_HINT = 'Tap any verse reference to read it right here. Show the Word opens them all at once, in the order they happened, as far as the Word itself settles it.';

export default function ShowTheWordToggle({ className = '', hint = true }) {
  const on = useShowTheWord();
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button" onClick={toggleShowTheWord} aria-pressed={on}
        className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${
          on ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'bg-white text-[#5A6E3D] border-[#5A6E3D] hover:text-[#1A1815] hover:border-[#1A1815]'}`}
      >
        {on ? 'Hide the Word — read without the verses open' : 'Show the Word — open every verse on this page'}
      </button>
      {hint && (
        <span className="text-[0.75rem] text-[#5A5751] leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
          {SHOW_THE_WORD_HINT}
        </span>
      )}
    </div>
  );
}
