// =============================================================================
// LoopHealth — the app reviews its own loops (Governor surface)
// =============================================================================
// Darrell 2026-06-15: "we need a loop review inside the PoeTech app — if anything
// begins to not loop or is stagnant, it asks if we should keep it after so long
// of it not updating data." This renders the loop-health engine (lib/loop-health):
// every tracked loop's REAL last-update, flagging the stagnant ones for a keep /
// retire decision. No painted freshness — a loop with no real update signal shows
// "never updated" (a retire candidate), which is the truth, not a guess.
import React from 'react';
import { assessLoops } from '../lib/loop-health.js';
import { KpiDot } from './KpiDot.jsx';

// Loop status -> shared KPI state (lib/kpi-status.js): fresh = good, stale =
// attention, never-updated = problem. Used for both the per-loop badge and the
// card's one summary KPI, so loop health reads like every other KPI in the app.
export const LOOP_KPI = { fresh: 'good', stale: 'attention', never: 'problem' };

const fmtAgo = (loop) => {
  if (loop.lastUpdate == null) return 'never updated from real data';
  if (loop.daysSince <= 0) return 'updated today';
  if (loop.daysSince === 1) return 'updated 1 day ago';
  return `updated ${loop.daysSince} days ago`;
};

export default function LoopHealth({ data = {}, decisions = {}, onDecision = null }) {
  let snapshotMarker = null;
  try { snapshotMarker = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem('poe-snapshot-marker') : null; } catch (e) { /* blocked */ }

  const loops = assessLoops(data, Date.now(), { snapshotMarker });
  const attention = loops.filter((l) => l.status !== 'fresh');
  const fresh = loops.filter((l) => l.status === 'fresh');

  // Shared-palette classes (literal so Tailwind JIT emits them): good #15803D,
  // attention #B45309, problem #DC2626.
  const badge = (status) => status === 'fresh'
    ? { t: '● updating', cls: 'text-[#15803D] border-[#15803D]' }
    : status === 'stale'
      ? { t: '◐ stagnant', cls: 'text-[#B45309] border-[#B45309]' }
      : { t: '○ never', cls: 'text-[#DC2626] border-[#DC2626]' };

  const summaryKpi = attention.length === 0
    ? { status: 'good', label: 'All looping' }
    : { status: 'attention', label: `${attention.length} need${attention.length === 1 ? 's' : ''} your call` };

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5" aria-labelledby="loop-health-h">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🩺 Loop Health</div>
        <KpiDot status={summaryKpi.status} label={summaryKpi.label} className="text-[9px] uppercase tracking-wider text-[#5A5751] shrink-0" />
      </div>
      <h2 id="loop-health-h" className="text-xl sm:text-2xl mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' }}>Is the app actually looping?</h2>
      <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        Each loop's last <strong>real</strong> update. A loop that hasn't moved past its window asks to be kept or retired — nothing stagnates silently.
      </p>

      {attention.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-[#5A6E3D] p-3 text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          ✓ Every tracked loop is updating within its window.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#7A1F1F] font-semibold">Needs your call · {attention.length}</div>
          {attention.map((l) => {
            const b = badge(l.status);
            const decided = decisions[l.key];
            return (
              <div key={l.key} className="border border-[#E8E4DC] p-3">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{l.label}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 border ${b.cls}`}>{b.t}</span>
                </div>
                <div className="text-[11px] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {fmtAgo(l)} · window {l.staleDays}d
                </div>
                {decided ? (
                  <div className="text-[11px] text-[#5A6E3D] font-semibold mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    {decided.decision === 'keep' ? `Kept — re-review ${(''+decided.reReview).slice(0, 10)}` : 'Marked to retire'}
                    {onDecision && <button type="button" onClick={() => onDecision(l.key, null)} className="ml-2 text-[10px] uppercase tracking-wider text-[#5A5751] underline hover:text-[#1A1815]">undo</button>}
                  </div>
                ) : onDecision ? (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => onDecision(l.key, 'keep')} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Keep · re-review later</button>
                    <button type="button" onClick={() => onDecision(l.key, 'retire')} className="text-[10px] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#7A1F1F] text-[#7A1F1F] hover:bg-[#7A1F1F] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">Retire it</button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {fresh.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
          <div className="text-[9px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-1">Updating · {fresh.length}</div>
          <ul className="space-y-0.5">
            {fresh.map((l) => (
              <li key={l.key} className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                <span className="text-[#15803D]">●</span> {l.label} — {fmtAgo(l)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
