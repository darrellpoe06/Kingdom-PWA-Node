// =============================================================================
// TextSizeControl — the large-print control surface (WCAG 2.1 Resize Text 1.4.4)
// =============================================================================
// A simple, obvious A / A+ / A++ / A+++ / A++++ / A44 stepper that drives the shared-core
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
import { useTextSize } from '../lib/text-size.js';

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
        const labelPx = (isPanel ? [15, 17, 19, 21, 23, 25] : [12, 13, 14, 15, 16, 17])[i] || 15;
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
            style={{ fontSize: `${labelPx}px` }}
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
