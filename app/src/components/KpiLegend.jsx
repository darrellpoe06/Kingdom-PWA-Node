import React, { useState } from 'react';
import { KPI_LEGEND } from '../lib/kpi-status.js';

// KpiLegend — the KEY for the status-indicator system. ONE reachable place (the
// Build board) documenting what each dot color means, so every KpiDot across the
// app is self-explaining. Collapsible to stay tight; the closed state still
// previews the four dots. Reads KPI_LEGEND, so it can never drift from the dots
// it documents (single source of truth).
export function KpiLegend({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-[#1A1815]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Status Key — what the KPI dot colors mean (${open ? 'collapse' : 'expand'})`}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔑 Status Key</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            {KPI_LEGEND.map((st) => (
              <span key={st.key} className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
            ))}
          </span>
          <span className="text-[10px] text-[#5A5751] ml-1" aria-hidden="true">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && (
        <ul className="px-3 pb-3 pt-1 space-y-1.5 border-t border-[#E8E4DC]">
          {KPI_LEGEND.map((st) => (
            <li key={st.key} className="flex items-center gap-2">
              <span aria-hidden="true" className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
              <span className="text-xs font-semibold text-[#1A1815] w-20 shrink-0" style={{ fontFamily: '"Fraunces", serif' }}>{st.label}</span>
              <span className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{st.meaning}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default KpiLegend;
