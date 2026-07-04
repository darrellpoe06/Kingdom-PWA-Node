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
import { HIGHLIGHT_STYLES, styleFor } from '../lib/scripture-highlights.js';

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
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
          aria-label={`Highlight colors for ${refLabel}`}
          className="absolute right-0 top-full mt-1 z-10 flex flex-wrap items-center gap-1.5 bg-white border border-[#E8E4DC] shadow-md p-2 w-56"
        >
          {HIGHLIGHT_STYLES.map((s) => {
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
                className="inline-flex flex-col items-center gap-0.5 p-1 focus:outline focus:outline-2 focus:outline-[#B85838] hover:bg-[#FAF8F4]"
              >
                <span
                  aria-hidden="true"
                  className="inline-block w-6 h-6 rounded-full"
                  style={{ backgroundColor: s.swatch, boxShadow: active ? '0 0 0 0.125rem #B85838' : '0 0 0 0.0625rem #C9BFA8' }}
                />
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>{s.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            role="menuitemradio"
            aria-checked={value === 'none'}
            onClick={() => pick('none')}
            title="Clear this highlight"
            aria-label="Clear this highlight"
            className="inline-flex flex-col items-center gap-0.5 p-1 focus:outline focus:outline-2 focus:outline-[#B85838] hover:bg-[#FAF8F4]"
          >
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#C9BFA8] text-[#5A5751]"
              style={mono}
            >
              &times;
            </span>
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>Clear</span>
          </button>
        </span>
      )}
    </span>
  );
}
