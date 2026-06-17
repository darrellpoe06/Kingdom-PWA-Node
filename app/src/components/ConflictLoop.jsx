// =============================================================================
// ConflictLoop — the conflict-evaluation learning loop, shown INSIDE the app.
// =============================================================================
// Darrell, 2026-06-17: "Do we have orchestration conflict evaluations for fewer
// conflicts as we move forward because of the fixes as we grow?" This surfaces
// that loop's REAL output (built from docs/orchestration/conflict-events.jsonl
// via conflict-analytics.mjs, baked into __CONFLICT_LOOP__):
//   - the conflict-RATE trend (target: DOWN over time),
//   - the current HOT FILES (the chronically-collided ones — the monolith #1),
//   - the recommended DECOMPOSITION, ranked.
// Nothing painted (DR-0076): an empty spine renders an honest empty surface.
//
// Governor-gated at the mount (BuildBoard), like OpsBoard / QualityProof — this
// is dev/ops orchestration internals. Reuses KpiDot + the shared KPI palette.
import React from 'react';
import { KpiDot } from './KpiDot.jsx';
import {
  normalizeConflictManifest, trendVerdict, hotFileStatus, rateBars,
} from '../lib/conflict-loop.js';

const MANIFEST = normalizeConflictManifest(typeof __CONFLICT_LOOP__ !== 'undefined' ? __CONFLICT_LOOP__ : null);

export default function ConflictLoop() {
  const m = MANIFEST;
  const tv = trendVerdict(m.rate);
  const bars = rateBars(m.rate);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 mt-4">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">
        🧭 Conflict-evaluation loop — fewer conflicts as we grow
      </div>
      <p className="text-xs text-[#5A5751] mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Every merge/rebase conflict is recorded as an event. The loop finds the chronically-collided files and feeds the fix back: decompose them, and build new surfaces as new modules. The target is a conflict rate that trends <span className="font-semibold">down</span> as the system grows.
      </p>

      {!m.ok && m.eventCount === 0 ? (
        <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          No conflict events recorded yet — the spine (docs/orchestration/conflict-events.jsonl) is empty. Nothing is shown rather than guessing.
        </p>
      ) : (
        <>
          {/* Conflict-rate trend — the headline metric. */}
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5 mb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#1A1815] font-semibold">Conflict rate · {m.eventCount} events recorded</span>
              <KpiDot status={tv.status} label={tv.label} className="text-[0.5625rem] uppercase tracking-wider" />
            </div>
            {bars.length > 0 ? (
              <div className="flex items-end gap-2 mt-2 h-16">
                {bars.map((b) => (
                  <div key={b.bucket} className="flex flex-col items-center justify-end flex-1 min-w-[28px]">
                    <span className="text-[0.625rem] text-[#1A1815] font-semibold mb-0.5">{b.count}</span>
                    <div
                      className="w-full"
                      style={{ height: `${Math.max(b.pct, 6)}%`, backgroundColor: '#B85838', minHeight: '3px' }}
                      aria-hidden="true"
                    />
                    <span className="text-[0.5rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{b.bucket.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-[0.625rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Target: <span className="font-semibold">down</span>. {m.rate.trend === 'baseline'
                ? 'Baseline just established — the loop now records every future merge; the trend line populates as work lands.'
                : `Latest day: ${m.rate.latest}${m.rate.priorMean != null ? ` vs prior mean ${m.rate.priorMean.toFixed(1)}` : ''}.`}
            </p>
          </div>

          {/* Hot files — the chronically-collided ones. */}
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
            Hot files — most-contended first ({m.hotFiles.length})
          </div>
          <ul className="border border-[#E8E4DC] mb-3">
            {m.hotFiles.map((h) => {
              const hs = hotFileStatus(h);
              return (
                <li key={h.file} className="px-2 py-1.5 border-b border-[#F2EEE6] last:border-b-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {h.file}{h.isMonolith ? ' ⟵ monolith' : ''}
                    </span>
                    <KpiDot status={hs.status} label={hs.label} className="text-[0.5625rem] uppercase tracking-wider shrink-0" />
                  </div>
                  {h.branches.length > 0 && (
                    <p className="text-[0.625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                      {h.contendingBranches} branch{h.contendingBranches === 1 ? '' : 'es'}: {h.branches.join(', ')}
                    </p>
                  )}
                </li>
              );
            })}
            {m.hotFiles.length === 0 && <li className="px-2 py-2 text-[0.6875rem] text-[#5A5751] italic">No hot files — every conflict was on a distinct file.</li>}
          </ul>

          {/* Recommended decomposition — ranked. The loop's prevention output. */}
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">
            Recommended decomposition — ranked by collision frequency ({m.decomposition.length})
          </div>
          {m.decomposition.length > 0 ? (
            <ul className="space-y-2">
              {m.decomposition.map((d) => (
                <li key={d.target} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[0.6875rem] text-[#1A1815] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{d.target}</span>
                    <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold shrink-0">P{d.priority} · {d.collisions}× collided</span>
                  </div>
                  <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{d.recommendation}</p>
                  {d.rankedExtractions.length > 0 && (
                    <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                      {d.rankedExtractions.map((x, i) => (
                        <li key={i} className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{x}</li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              No file has collided twice yet — nothing to decompose. The loop will recommend one the moment a file becomes chronic.
            </p>
          )}

          {m.problems.length > 0 && (
            <p className="text-[0.625rem] text-[#B85838] mt-2">Spine problems: {m.problems.join('; ')}</p>
          )}
          <p className="text-[0.5625rem] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Built from <span className="font-mono">docs/orchestration/conflict-events.jsonl</span> at build time — every event traceable to a PR, a git log, or a guard. No invented data.
          </p>
        </>
      )}
    </section>
  );
}
