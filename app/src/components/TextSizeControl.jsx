// =============================================================================
// TextSizeControl — the large-print control surface (WCAG 2.1 Resize Text 1.4.4)
// =============================================================================
// A simple, obvious A / A+ / A++ / A+++ / A44 stepper that drives the shared-core
// text-size primitive (lib/text-size.js). Big tap targets, plain labels, no
// jargon — built for a non-technical, elderly reader who just wants the words
// bigger. The active step is announced for screen readers (aria-pressed), and
// the whole group is keyboard reachable.
//
// Two variants from one component:
//   variant="header" — compact, lives beside the theme swatches in the header.
//   variant="panel"  — prominent labeled card for the reading-heavy areas
//                       (The Word, Learn, Conference) and the About/Settings page.
import React from 'react';
import { useTextSize, DEFAULT_TEXT_SIZE } from '../lib/text-size.js';

export default function TextSizeControl({ variant = 'header', className = '' }) {
  const [active, setSize, steps] = useTextSize();
  const isPanel = variant === 'panel';

  const buttons = (
    <div
      className="flex flex-wrap items-stretch gap-1"
      role="group"
      aria-label="Text size — make reading text larger"
    >
      {steps.map((s, i) => {
        const selected = active === s.key;
        // The label font is FIXED in px (a gentle step up per option, so "bigger =
        // more plusses" still reads at a glance) and deliberately does NOT scale
        // with the root multiplier — otherwise the control would compound with its
        // own setting and overflow at Largest. The page behind the control is what
        // previews the real effect; this control just stays a usable control.
        const labelPx = (isPanel ? [15, 17, 19, 21, 24] : [12, 13, 14, 15, 16])[i] || 15;
        // Header variant rides inside a `.ts-chrome-region` (the header controls
        // row, DR-0276) whose zoom would shrink a raw px label to ~6px at Big
        // Print. Dividing by --ts-chrome-scale cancels the zoom exactly — the
        // label renders at labelPx on screen at every step. Outside any capped
        // region the same formula grows the label gently with the chrome
        // multiplier (bounded ~1.9x at Big Print), never the full content scale.
        const labelSize = isPanel ? `${labelPx}px` : `calc(${labelPx}px / var(--ts-chrome-scale, 1))`;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setSize(s.key)}
            aria-pressed={selected}
            aria-label={`${s.name} text size${selected ? ' (current)' : ''}`}
            title={`${s.name} text`}
            className={[
              'flex items-end justify-center font-semibold leading-none rounded-md transition-all whitespace-nowrap',
              'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]',
              isPanel ? 'flex-1 min-w-[3.25rem] px-2 py-3 min-h-[3rem]' : 'px-2 py-1.5 min-w-[2rem] min-h-[2rem]',
              selected
                ? 'bg-[#1A1815] text-white border-2 border-[#1A1815]'
                : 'bg-white text-[#1A1815] border-2 border-[#E8E4DC] hover:border-[#1A1815]',
            ].join(' ')}
            style={{ fontSize: labelSize }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );

  if (!isPanel) {
    // Header variant: an aA icon hint + the stepper, kept tight.
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <span aria-hidden="true" className="text-[#5A5751] leading-none select-none" style={{ fontSize: '0.95rem' }}>
          <span style={{ fontSize: '0.7em' }}>A</span>A
        </span>
        {buttons}
      </div>
    );
  }

  // Panel variant: a labeled, prominent card for reading areas + settings.
  const current = steps.find((s) => s.key === active);
  return (
    <div className={`bg-white border-2 border-[#E8E4DC] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">Text size</div>
          <div className="text-xs text-[#5A5751]">Make the words bigger or smaller — your choice is saved on this device.</div>
        </div>
        <div className="text-xs font-semibold text-[#B85838] whitespace-nowrap">{current ? current.name : ''}</div>
      </div>
      {buttons}
    </div>
  );
}


// =============================================================================
// TextSizeEscapeHatch — the way OUT of big text survives the header hideaway
// =============================================================================
// Darrell, 2026-08-30, at Big Print 44 on his phone: "large font block the
// ability to change it afterwards after selecting it...!!!!!!!!??????"
//
// MEASURED, not guessed (chrome-layout-probe, 360px + 412px, Big Print and
// Largest): with the header EXPANDED, five text-size controls render and all
// five are fully on screen — the DR-0276 escape hatch works. With the header
// COLLAPSED, the count is ZERO. The header hideaway unmounts the whole comfort
// row (account, voice, FONT, theme), so the escape hatch was not merely pushed
// off screen — it did not exist in the DOM. The only control left was the
// collapse chevron, which looks like a chevron, not like the way back to
// normal text.
//
// DR-0276 rule 3 says text-size controls are chrome so "big text is ALWAYS
// reversible." The hideaway broke that word: reversible only from a state the
// reader may have left. This restores it without taking the hideaway away —
// Darrell built that for dashboard room and it stays.
//
// Renders NOTHING at Normal: at 1x there is no trap, so a reader who tucked
// the top bar away for room gets exactly the clean surface they asked for.
// Above Normal it renders inside the .ts-safe-sticky header carrying
// .ts-escape-hatch, so the existing index.css rules take over at the sizes
// that actually trap (sticky at Larger; a fixed bottom bar at Largest and Big
// Print) — no new layout mechanism, the proven one is reused.
export function TextSizeEscapeHatch({ collapsed }) {
  const [active] = useTextSize();
  // Only when the header is tucked away AND the reader is above Normal.
  if (!collapsed || active === DEFAULT_TEXT_SIZE) return null;
  return (
    <div className="ts-chrome-region ts-escape-hatch bg-[#FAF8F4] border-t border-[#E8E4DC] px-3 py-1.5 flex items-center justify-end gap-2 flex-wrap">
      {/* Plain words, not an icon: the reader who needs this is the reader who
          could not find it. Fixed px (like the control's own labels) so the
          way out never compounds with the setting it undoes. */}
      <span className="text-[#5A5751] font-semibold whitespace-nowrap" style={{ fontSize: 'calc(11px / var(--ts-chrome-scale, 1))' }}>
        Text size
      </span>
      <TextSizeControl variant="header" />
    </div>
  );
}
