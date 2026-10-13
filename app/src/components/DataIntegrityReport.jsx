// =============================================================================
// DataIntegrityReport — a STANDARD REPORT that shows how much of the app is
// verified live-data vs painted, and how that improves over time (Darrell
// 2026-07-20: "add these data-driven audits to the reports as a standard so we
// can see our growth"). It reads the committed audit ledger
// (data/data-integrity-audit.json) and the pure summarizer (lib/data-integrity.js)
// — every number here is derived from real audit records, nothing painted (the
// report is held to the very standard it measures, DR-0061 / DR-0076).
//
// Teach-through-the-system (DR-0195): it explains what it measures and that it
// grows as more surfaces are audited and findings are fixed.
import React from 'react';
import { KpiDot } from './KpiDot.jsx';
import { summarizeAudit } from '../lib/data-integrity-audit.js';
import ledger from '../data/data-integrity-audit.json';

const VERDICT = {
  clean: { status: 'good', label: 'clean' },
  findings: { status: 'attention', label: 'findings' },
  pending: { status: 'idle', label: 'in review' },
};

export default function DataIntegrityReport({ audit = ledger }) {
  const s = summarizeAudit(audit);

  return (
    <section className="border border-[#E8E4DC] bg-[#FAF8F4] p-3" aria-label="Data integrity report">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#1A1815] font-semibold">Data integrity · standard report</span>
        <KpiDot
          status={s.status}
          label={s.openHigh > 0 ? `${s.openHigh} high open` : s.openTotal > 0 ? `${s.openTotal} open` : s.pending > 0 ? `${s.audited}/${s.total} audited` : 'all clean'}
        />
      </div>

      {/* Teach what's under the hood + how growth shows up here. */}
      <p className="text-[0.5625rem] text-[#5A5751] leading-snug mb-2">
        Every surface is checked so its numbers trace to real data, not painted constants (DR-0061). This report reads the audit ledger — as more areas are audited and findings fixed, coverage rises and open findings fall. That trend is our growth.
      </p>

      {/* The live summary — all derived from the ledger. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Coverage</div>
          <div className="text-base font-medium text-[#1A1815]">{s.audited}/{s.total}</div>
          <div className="text-[0.5625rem] text-[#5A5751]">{s.coveragePct}% of areas audited</div>
        </div>
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Clean</div>
          <div className="text-base font-medium text-[#166534]">{s.clean}</div>
          <div className="text-[0.5625rem] text-[#5A5751]">{s.cleanPct}% of audited</div>
        </div>
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Open findings</div>
          <div className={`text-base font-medium ${s.openTotal > 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`}>{s.openTotal}</div>
          <div className="text-[0.5625rem] text-[#5A5751]">{s.openHigh} high · {s.openMed} med · {s.openLow} low</div>
        </div>
        <div className="border border-[#E8E4DC] bg-white p-2">
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">In review</div>
          <div className="text-base font-medium text-[#1A1815]">{s.pending}</div>
          <div className="text-[0.5625rem] text-[#5A5751]">{s.pending > 0 ? 'areas not yet audited' : 'fully audited'}</div>
        </div>
      </div>

      {/* Per-area verdicts — the real records. */}
      <ul className="space-y-1">
        {s.areas.map((a) => {
          const v = VERDICT[a.verdict] || VERDICT.pending;
          const findings = (a.high || 0) + (a.med || 0) + (a.low || 0);
          return (
            <li key={a.id} className="flex items-start justify-between gap-2 text-[0.6875rem] text-[#1A1815]">
              <span className="min-w-0">
                <span className="font-semibold">{a.label}</span>
                {a.verdict !== 'pending' && findings > 0 && (
                  <span className="text-[#5A5751]"> — {a.high || 0}H · {a.med || 0}M · {a.low || 0}L</span>
                )}
                {a.note && a.verdict === 'findings' && (
                  <span className="block text-[0.5625rem] text-[#5A5751] leading-snug">{a.note}</span>
                )}
              </span>
              <KpiDot status={v.status} label={v.label} />
            </li>
          );
        })}
      </ul>

      {/* Trend line — the growth signal. */}
      <div className="mt-3 pt-2 border-t border-[#E8E4DC] text-[0.5625rem] text-[#5A5751]">
        {s.trend.baseline ? (
          <>Baseline audit · {s.updatedAt}. Future runs show the change: coverage up, open findings down = growth.</>
        ) : (
          <>
            Since last run: coverage {s.trend.coverageDelta >= 0 ? '+' : ''}{s.trend.coverageDelta} area(s), high findings {s.trend.highDelta > 0 ? '+' : ''}{s.trend.highDelta}. Updated {s.updatedAt}.
          </>
        )}
      </div>
    </section>
  );
}
