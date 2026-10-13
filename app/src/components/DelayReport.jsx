// =============================================================================
// DelayReport — the data-driven request-to-finish dashboard (task 20, DR-0115)
// =============================================================================
// Darrell 2026-07-07: "so it can be data driven reports always... weigh it
// against the time it should have taken based on what time it then took...
// for our data-driven reasons to use this model AI or that one."
// Renders the delay ledger (lib/delay-ledger.json) — every number derived on
// read by delayStats/entryOverrun; nothing painted; governor-gated mount.
// =============================================================================
import React from 'react';
import { loadDelayLedger, delayStats, entryOverrun, DELAY_CATEGORIES } from '../lib/delay-ledger.js';

const SERIF = { fontFamily: '"Fraunces", serif' };

function Tile({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-white px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-[#5A5751]">{label}</div>
      <div className="text-lg font-semibold text-[#1A1815]" style={SERIF}>{value}</div>
      {sub && <div className="text-xs text-[#5A5751]">{sub}</div>}
    </div>
  );
}

export default function DelayReport() {
  const entries = loadDelayLedger();
  const s = delayStats(entries);
  if (!s.count) {
    return <p className="mt-4 text-sm text-[#5A5751]">No delay entries recorded — the ledger fills as incidents happen (and stays empty when delivery stays on the work&rsquo;s own clock).</p>;
  }
  return (
    <div className="mt-2 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Delays — should have taken vs took</h2>
        <p className="text-xs text-[#5A5751]">The family&rsquo;s wall clock is the metric: request time → finish time, weighed against the work&rsquo;s own clock. Every figure derives from the ledger on read.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile label="Incidents" value={s.count} />
        <Tile label="Should have taken" value={`${s.totalShouldHaveTakenHours}h`} />
        <Tile label="Actually took" value={`${s.totalActualHours}h`} />
        <Tile label="Overrun factor" value={s.overallOverrunFactor == null ? '—' : `${s.overallOverrunFactor}×`} sub="1.0× = on the work's clock" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#5A5751]">Unnecessary hours by reason</div>
          {Object.entries(s.byCategory).sort((a, b) => b[1].hours - a[1].hours).map(([cat, v]) => (
            <div key={cat} className="mt-1 flex justify-between text-[#1A1815]" title={DELAY_CATEGORIES[cat] || ''}>
              <span>{cat}</span><span>{v.count} · {v.hours}h</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#5A5751]">By model (the comparison base)</div>
          {Object.entries(s.byModel).map(([m, v]) => (
            <div key={m} className="mt-1 flex justify-between text-[#1A1815]"><span>{m}</span><span>{v.count} · {v.hours}h</span></div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <div key={e.id} className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-[#1A1815]" style={SERIF}>{e.request}</div>
                <div className="text-xs text-[#5A5751]">
                  requested {String(e.requestedAt).replace('T', ' ').slice(0, 16)} · finished {String(e.finishedAt).replace('T', ' ').slice(0, 16)}
                  {' '}· {e.category} · {e.model}
                </div>
                {e.notes && <div className="mt-1 text-xs text-[#5A5751]">{e.notes}</div>}
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${(entryOverrun(e) || 0) > 2 ? 'border-[#B85838] text-[#B85838]' : 'border-[#5A6E3D] text-[#5A6E3D]'}`}>
                {entryOverrun(e) == null ? 'no benchmark' : `${entryOverrun(e)}×`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
