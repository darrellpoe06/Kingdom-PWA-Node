// =============================================================================
// ComfortBarToggle — "Hide ▾" / "Show controls ▴" for the big-text bottom block
// =============================================================================
// Darrell 2026-10-01, at A44 on his Fold 7: "How do I get rid of the below
// header?!!!!! I need a button!!!!" (see lib/comfort-bar.js, DR-0716).
//
// Mounted FIRST inside the header's controls row. That row only becomes the
// fixed bottom block at Largest and Big Print, and only there does this toggle
// show (index.css, .comfort-toggle-row). Collapsed, index.css hides every other
// item in the row and leaves this one: the way back ("Show controls ▴") and the
// text-size dropdown, so big text is still one tap from reversible (DR-0276).
// Nothing unmounts, so nothing the block offers is lost.
//
// The same square bordered look as the text-size chips. No .ts-chrome-region of
// its own: it rides inside the controls row, which already carries the cap, and
// a second zoom would shrink it twice. 2.75rem = 44px on screen at every size.
import React from 'react';
import { useComfortCollapsed } from '../lib/comfort-bar.js';
import TextSizeControl from './TextSizeControl.jsx';

const BTN = 'inline-flex items-center gap-[0.375rem] min-h-[2.75rem] px-[0.625rem] rounded-md border-2 border-[#E8E4DC] bg-white text-[#1A1815] text-[0.75rem] uppercase tracking-wider font-semibold whitespace-nowrap hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

export default function ComfortBarToggle() {
  const [collapsed, setCollapsed] = useComfortCollapsed();
  return (
    <div className="comfort-toggle-row items-center gap-2" data-testid="comfort-toggle-row">
      {collapsed ? (
        <>
          <button
            type="button"
            data-testid="comfort-show"
            onClick={() => setCollapsed(false)}
            aria-expanded="false"
            aria-label="Show controls: account, give, subscribe, help, text size, voice and theme"
            title="Show the controls"
            className={BTN}
          >
            Show controls <span aria-hidden="true">▴</span>
          </button>
          <TextSizeControl variant="compact" />
        </>
      ) : (
        <button
          type="button"
          data-testid="comfort-hide"
          onClick={() => setCollapsed(true)}
          aria-expanded="true"
          aria-label="Hide these controls to one slim row"
          title="Hide the controls"
          className={BTN}
        >
          Hide <span aria-hidden="true">▾</span>
        </button>
      )}
    </div>
  );
}
