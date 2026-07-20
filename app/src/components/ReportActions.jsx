// =============================================================================
// ReportActions — the reusable Download + Print toolbar (adopt on any surface)
// =============================================================================
// Darrell 2026-07-01: any data surface should be able to download (CSV / print to
// PDF) and print a clean report of what's on screen. This is the ~90%-prebuilt
// primitive: hand it a `buildModel` that returns the CURRENT view as a report
// model (lib/report-export.js shape) and, optionally, a list of one-click preset
// reports. It renders "Download CSV" + "Print / PDF" for the current view and a
// "Reports" menu of the presets — CSV or Print for each.
//
// DISPLAY/EXPORT only; deterministic; RLS-safe (it exports only the model the
// surface built from the rows the user can already see).
// =============================================================================

import React, { useState } from 'react';
import { downloadCSV, printReport } from '../lib/report-export.js';

const BTN = 'px-2.5 py-1 text-[0.6875rem] uppercase tracking-wider border border-[#E8E4DC] bg-white text-[#1A1815] hover:bg-[#FAF8F4] rounded-md';

export default function ReportActions({ buildModel, filenameBase = 'report', presets = [], label = 'This view', className = '', onView }) {
  const [open, setOpen] = useState(false);
  const csv = (make, name) => { const m = make && make(); if (m) downloadCSV(m, name); };
  const print = (make, name) => { const m = make && make(); if (m) printReport(m, name); };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{label}</span>
      <button type="button" onClick={() => csv(buildModel, filenameBase)} className={BTN} aria-label="Download CSV of the current view">↓ CSV</button>
      <button type="button" onClick={() => print(buildModel, filenameBase)} className={BTN} aria-label="Print or save the current view as PDF">Print / PDF</button>

      {presets.length > 0 && (
        <div className="relative">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={BTN}>Reports ▾</button>
          {open && (
            <div className="absolute z-20 mt-1 right-0 min-w-[17rem] max-w-[22rem] border border-[#1A1815] bg-white shadow-lg">
              {/* KPI reports lead the menu (the money-flow signals every user
                  should see), each with a one-line teaching hint; the standard
                  export presets follow under a divider. */}
              {presets.some((p) => p.kpi) && (
                <div className="px-3 pt-2 pb-1 text-[0.625rem] tracking-[0.12em] text-[#5A6E3D] font-semibold border-b border-[#E8E4DC]">KPI&rsquo;s &middot; see your money flow{onView ? ' — View on screen, or download' : ''}</div>
              )}
              {presets.map((p, i) => {
                const prev = presets[i - 1];
                const dividerBeforeStandard = !p.kpi && (i === 0 ? false : !!prev && prev.kpi);
                return (
                  <React.Fragment key={p.key}>
                    {dividerBeforeStandard && (
                      <div className="px-3 pt-2 pb-1 text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold border-b border-t border-[#E8E4DC]">Standard reports</div>
                    )}
                    <div className="flex items-start justify-between gap-2 px-3 py-1.5 border-b border-[#E8E4DC] last:border-b-0">
                      <span className="min-w-0">
                        <span className="text-[0.75rem] text-[#1A1815] flex items-center gap-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
                          {p.kpi && <span className="text-[0.5rem] uppercase tracking-wider text-[#5A6E3D] border border-[#5A6E3D] rounded px-1 py-px shrink-0">KPI</span>}
                          {p.label}
                        </span>
                        {p.hint && <span className="block text-[0.5625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{p.hint}</span>}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        {p.kpi && onView && (
                          <button type="button" onClick={() => { onView(p.key); setOpen(false); }} className="text-[0.625rem] uppercase tracking-wider text-white bg-[#5A6E3D] hover:bg-[#1A1815] rounded px-1.5 py-0.5" aria-label={`View ${p.label} on screen`}>View</button>
                        )}
                        <button type="button" onClick={() => { csv(p.buildModel, p.filenameBase || p.key); setOpen(false); }} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] border border-[#E8E4DC] rounded px-1.5 py-0.5" aria-label={`Download ${p.label} as CSV`}>CSV</button>
                        <button type="button" onClick={() => { print(p.buildModel, p.filenameBase || p.key); setOpen(false); }} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] border border-[#E8E4DC] rounded px-1.5 py-0.5" aria-label={`Print ${p.label}`}>Print</button>
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
