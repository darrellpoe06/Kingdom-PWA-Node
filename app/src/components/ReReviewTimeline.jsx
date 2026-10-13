// =============================================================================
// ReReviewTimeline — when each decision comes back, on the governance surface
// =============================================================================
// Darrell 2026-10-09: "Timelines based on the Way we work... DRs... etc...."
// The Way's timeline is the ledger's re-review dates (DR-0075): this renders
// lib/re-review-timeline.js over the ledger the build ships, passed dates
// first and named as passed, today, then week by week. Nothing is fetched;
// a record without a date is counted, never invented a date for.
// =============================================================================
import React from 'react';
import { buildReReviewTimeline, timelineSummary, shortDay } from '../lib/re-review-timeline.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

function Row({ r }) {
  return (
    <li className="flex items-baseline gap-2 text-xs text-[#1A1815]" data-testid="re-review-row" data-passed={r.passed ? 'true' : 'false'}>
      <span className="shrink-0 text-[0.625rem] text-[#5A5751]" style={mono}>{r.date}</span>
      <span className="shrink-0 text-[0.625rem] font-semibold text-[#5A6E3D]" style={mono}>{r.id}</span>
      <span className="min-w-0" style={serif}>{r.title}</span>
      {r.passed && <span className="shrink-0 text-[0.5625rem] uppercase tracking-wider text-[#B85838]">passed {r.daysLate}d</span>}
    </li>
  );
}

export default function ReReviewTimeline({ items = [], today = new Date().toISOString().slice(0, 10) }) {
  const tl = buildReReviewTimeline(items, today);
  return (
    <section className="bg-white border border-[#E8E4DC] p-4 sm:p-5" data-testid="re-review-timeline">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">Governance · Timeline — when each decision comes back</div>
      <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
        The Way does not promise a delivery date; it promises a re-review date on everything parked (DR-0075), and nothing parked is parked forever. This is that promise, read from each record&apos;s own <code>re-review:</code> line.
      </p>
      <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-testid="re-review-summary">{timelineSummary(tl)}</p>

      {tl.passed.length > 0 && (
        <div className="mt-3" data-testid="re-review-passed">
          <div className="text-[0.5625rem] uppercase tracking-wider font-semibold text-[#B85838]">Passed, not yet re-reviewed · {tl.passed.length}</div>
          <ul className="mt-1 space-y-0.5">{tl.passed.map((r) => <Row key={r.id} r={r} />)}</ul>
        </div>
      )}
      {tl.today.length > 0 && (
        <div className="mt-3" data-testid="re-review-today">
          <div className="text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A6E3D]">Due today · {shortDay(today)} · {tl.today.length}</div>
          <ul className="mt-1 space-y-0.5">{tl.today.map((r) => <Row key={r.id} r={r} />)}</ul>
        </div>
      )}
      {tl.weeks.length === 0 && tl.passed.length === 0 && tl.today.length === 0 && (
        <p className="text-xs mt-3 text-[#5A5751] italic" style={serif}>No record carries a re-review date in this build.</p>
      )}
      {tl.weeks.map((w, i) => (
        // The first two weeks open; later weeks fold, so a long horizon reads
        // as a horizon and not a wall. Every week is still on the page.
        <details key={w.start} className="mt-3" open={i < 2} data-testid="re-review-week">
          <summary className="cursor-pointer text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">
            {w.isThisWeek ? 'This week · ' : ''}{w.label} · {w.rows.length}
          </summary>
          <ul className="mt-1 space-y-0.5">{w.rows.map((r) => <Row key={r.id} r={r} />)}</ul>
        </details>
      ))}
      {tl.undated > 0 && (
        <p className="text-[0.625rem] mt-3 text-[#5A5751]" style={serif}>{tl.undated} records carry no re-review date; they are decided, not parked.</p>
      )}
    </section>
  );
}
