// =============================================================================
// VerseHighlighter — the in-app color picker for a single verse (Darrell
// 2026-07-04, from his Logos color-coding: "change the color of text to make it
// stand out for me"). Presentational only: it shows the palette and reports the
// pick. The parent (VerseCard) owns the persisted state (scripture-highlights.js)
// and restyles the verse text, so this component stays pure and testable.
// =============================================================================
// Accessibility mirrors the surface: #1A1815 body, #5A5751 secondary, visible
// #B85838 focus outline (AA). No device-font emoji (consistency-guard) — the
// swatches ARE colored chips; the control is labelled for screen readers. Sizes
// are rem-based so the large-print primitive scales them.
import React, { useState } from 'react';
import { HIGHLIGHT_GROUPS, styleFor, cssForHighlight } from '../lib/scripture-highlights.js';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

// value: the current style key ('none' or a palette key). onPick(key) fires with
// the chosen key (or 'none' to clear). refLabel names the verse for a11y.
export default function VerseHighlighter({ value = 'none', onPick, refLabel = 'this verse' }) {
  const [open, setOpen] = useState(false);
  const current = styleFor(value);
  const marked = value && value !== 'none';

  const pick = (key) => {
    if (onPick) onPick(key);
    setOpen(false);
  };

  return (
    <span className="relative inline-flex items-center">
      {/* A clean, quiet swatch dot — a hollow ring when unmarked, filled with the
          highlight color when set (Darrell 2026-07-04: the boxed "MARK" was
          clunky). No text; the label rides the aria-label + tooltip. */}
      {/* aria-haspopup="menu" is NOT decoration — it is load-bearing (Darrell
          2026-08-13: "the color tab pops up on its own after a while"). Before
          reading, lib/read-reveal.js opens collapsed disclosures by CLICKING
          every `[aria-expanded="false"]` inside the reading root, and its own
          header says it must NEVER touch "menus/dialogs ([aria-haspopup])".
          This button opens a role="menu" but never declared it, so the reveal
          pass matched it as a disclosure and popped a colour palette open on
          every verse on the page. The guard was right; the attribute was
          missing. It is also simply correct ARIA for a button that opens a
          menu, which is why it belongs here rather than as a special case in
          the reader. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-read-no-expand=""
        aria-label={marked ? `Highlight for ${refLabel}: ${current.label}. Change or clear.` : `Highlight ${refLabel}`}
        title={marked ? `${current.label} — tap to change` : 'Highlight'}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full focus:outline focus:outline-2 focus:outline-[#B85838] hover:bg-[#FAF8F4]"
      >
        <span
          aria-hidden="true"
          className="inline-block w-3.5 h-3.5 rounded-full border-2"
          style={{ backgroundColor: marked ? (current.swatch || 'transparent') : 'transparent', borderColor: marked ? (current.swatch || '#C9BFA8') : '#C9BFA8' }}
        />
      </button>

      {open && (
        <span
          role="menu"
          aria-label={`Highlight styles for ${refLabel}`}
          className="absolute right-0 top-full mt-1 z-10 flex flex-col gap-1.5 bg-white border border-[#E8E4DC] shadow-md p-2 w-64"
        >
          {/* Grouped the way Logos groups it: colored text · highlighter pens ·
              emphasis markup. Each chip previews its own look on a sample "Aa". */}
          {HIGHLIGHT_GROUPS.map((g) => (
            <span key={g.kind} role="group" aria-label={g.label} className="flex flex-col gap-0.5">
              <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>{g.label}</span>
              <span className="flex flex-wrap items-center gap-1">
                {g.styles.map((s) => {
                  const active = s.key === value;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => pick(s.key)}
                      title={`${s.label} — ${s.meaning}`}
                      aria-label={`${s.label}: ${s.meaning}`}
                      className="inline-flex items-center justify-center min-w-[2rem] h-7 px-1.5 rounded border focus:outline focus:outline-2 focus:outline-[#B85838] hover:border-[#1A1815]"
                      style={{ borderColor: active ? '#B85838' : '#E8E4DC', borderWidth: active ? '0.125rem' : '0.0625rem' }}
                    >
                      <span aria-hidden="true" className="text-[0.8125rem] leading-none" style={cssForHighlight(s.key)}>Aa</span>
                    </button>
                  );
                })}
              </span>
            </span>
          ))}
          <button
            type="button"
            role="menuitemradio"
            aria-checked={value === 'none'}
            onClick={() => pick('none')}
            title="Clear this highlight"
            aria-label="Clear this highlight"
            className="inline-flex items-center gap-1.5 self-start px-1.5 py-1 rounded border border-[#C9BFA8] text-[#5A5751] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            <span aria-hidden="true" style={mono}>&times;</span>
            <span className="text-[0.5625rem] uppercase tracking-wider" style={mono}>Clear highlight</span>
          </button>
        </span>
      )}
    </span>
  );
}
