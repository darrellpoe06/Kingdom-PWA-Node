// =============================================================================
// TabHelp — the "How to use this tab" short walkthrough (DP 2026-07-12)
// =============================================================================
// "A how-to-use short guide on each tab as an option... no stress for the staff."
// The research (per-tab-tutorial-way session note): a SHORT interactive
// walkthrough (3-5 steps) beats a static video and stays maintainable. This is
// the reusable affordance — a quiet "How to use this tab" button that expands an
// ordered, read-aloud-friendly step list right where the person is working.
// Generic by design: give it a title + steps; every tab reuses it. The
// per-tab registry + the coverage/staleness gates (so a guide can't silently
// drift when a tab changes) are the next increment (DR to follow); this proves
// the pattern on the steward Record Giving tab first.
//
// Accessible: a real <button> toggling an aria-expanded region, large tap target,
// numbered steps, keyboard-operable, theme-safe tokens. No external deps.
// =============================================================================
import React, { useId, useState } from 'react';

export default function TabHelp({ title = 'How to use this tab', steps = [] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (!steps || steps.length === 0) return null;

  return (
    <div className="print:hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-2 min-h-[40px] px-3 text-xs uppercase tracking-wider border focus:outline focus:outline-2"
        style={{ borderColor: '#B85838', color: '#B85838', outlineColor: '#B85838' }}
      >
        <span aria-hidden="true" className="inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px]" style={{ borderColor: '#B85838' }}>?</span>
        {open ? 'Hide the guide' : title}
      </button>
      {open && (
        <div
          id={panelId}
          className="mt-2 border p-4 text-sm"
          style={{ borderColor: '#1A1815', background: '#FAF8F4', color: '#1A1815' }}
        >
          <div className="text-[0.625rem] uppercase tracking-[0.25em] mb-2" style={{ color: '#5A5751' }}>{title}</div>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="shrink-0 flex items-center justify-center w-6 h-6 text-xs font-semibold text-white" style={{ background: '#5A6E3D', borderRadius: '999px' }}>{i + 1}</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
