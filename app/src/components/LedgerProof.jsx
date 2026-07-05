// =============================================================================
// LedgerProof — the in-app proof that the money math holds over the real ledger
// =============================================================================
// Darrell 2026-07-05: "how do we prove the math is correct so when real numbers
// are uploaded for years of data it can paint a picture." This panel runs the
// ledger-integrity invariants (lib/ledger-integrity.js) over the REAL rows on
// this device, every render of the Books → Transactions tab, and shows each
// verdict with its receipts. Green here is earned per check (two independent
// derivations agreeing to the cent), never painted (DR-0076). When years of
// statements are imported, THIS panel is where the family sees the whole span
// verified — or exactly which rows need attention, listed by name.
import { useMemo, useState } from 'react';
import { runLedgerIntegrity } from '../lib/ledger-integrity.js';

const STATUS_META = {
  pass:   { chip: 'VERIFIED', cls: 'text-[#5A6E3D] border-[#5A6E3D]' },
  review: { chip: 'REVIEW',   cls: 'text-[#B85838] border-[#B85838]' },
  fail:   { chip: 'BROKEN',   cls: 'text-white bg-[#B85838] border-[#B85838]' },
};

export default function LedgerProof({ data, currentDate }) {
  const [open, setOpen] = useState(false);
  const report = useMemo(
    () => runLedgerIntegrity(data, currentDate ? new Date(currentDate) : new Date()),
    [data, currentDate]
  );
  const spanLine = report.span
    ? `${report.span.first} → ${report.span.last} (${report.span.years} yr${report.span.years === 1 ? '' : 's'})`
    : 'no dated rows yet';
  return (
    <section className="mt-6">
      <div className="bg-white border border-[#1A1815] p-5">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Proof of the math</div>
            <h3 className="text-lg text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
              Ledger integrity — {report.rows.toLocaleString()} rows · {spanLine}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {open ? 'Hide checks' : `${report.passed} verified · ${report.review} review · ${report.failed} broken — show`}
          </button>
        </div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Every check recomputes the displayed math a second, independent way (integer cents) and compares.
          A green is earned by agreement on your real rows — never assumed. Import years of statements and
          this panel verifies the whole span, or names exactly which rows need attention.
        </p>
        {open && (
          <div className="mt-3 space-y-2">
            {report.checks.map((c) => {
              const meta = STATUS_META[c.status] || STATUS_META.review;
              return (
                <div key={c.key} className="border border-[#E8E4DC] p-3">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.label}</span>
                    <span className={`text-[0.5625rem] uppercase tracking-wider font-semibold border px-1.5 py-0.5 ${meta.cls}`}>{meta.chip}</span>
                  </div>
                  <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{c.detail}</p>
                  {c.receipts && c.receipts.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {c.receipts.map((r, i) => (
                        <li key={i} className="text-[0.625rem] text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
