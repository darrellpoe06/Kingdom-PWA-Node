// =============================================================================
// AppFirmUp — the live "App Firm-Up / Completion" headline of the Projects hub.
// =============================================================================
// Darrell (2026-07-01, binding): the Projects boards timeline IS the timeline for
// FINISHING the whole app. This is the headline that rolls it all up — overall %
// done + projected finish date (from the real board_tasks), plus the two firm-up
// signals: the PERSISTENT-BACKEND share (SQL/Python/shell/CI climbing toward the
// target as loops migrate) and the MODULE-LEDGER monolith line-count (shrinking
// as extractions land). It reads the SAME shared board store the boards write, so
// closing an item moves this % on its own; the repo metrics come from the
// deterministic persistent-share.py JSON. No painted numbers — and no false
// liveness either (DR-0076 rule 8): the JSON is a SNAPSHOT, only as fresh as the
// last script run, so both repo-metric tiles carry its measured date instead of
// reading as a live gauge.
//
// Glyphs are geometric/arrow only (↑ ↓ → ▦), never device-font emoji, and text
// sizes are rem tokens — cross-device + large-print safe (consistency-guard).
// =============================================================================
import React from 'react';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import {
  overallCompletion, projectedFinish, persistentShare, moduleLedger,
} from '../lib/completion.js';

function fmtDate(d) {
  if (!d) return null;
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// The snapshot's own date, worn on the tile (honest provenance): the share % and
// ledger are real measured numbers, but only as fresh as the last
// scripts/persistent-share.py run — so they say WHEN, never posing as live.
function measuredLabel(iso) {
  return iso
    ? `measured ${fmtDate(String(iso).slice(0, 10))}`
    : 'snapshot — regenerate scripts/persistent-share.py to refresh';
}

function TrendArrow({ trend }) {
  if (!trend || trend.dir === 'flat') return <span className="text-[#5A5751]">→ flat</span>;
  const up = trend.dir === 'up';
  return (
    <span className={up ? 'text-[#5A6E3D]' : 'text-[#B85838]'}>
      {up ? '↑' : '↓'} {Math.abs(trend.delta).toFixed(2)} pts
    </span>
  );
}

export default function AppFirmUp({ onOpenBoards = null }) {
  const tasks = useBoardTasks();
  const overall = overallCompletion(tasks);
  const finish = projectedFinish(tasks);
  const share = persistentShare();
  const ledger = moduleLedger();

  const towardTarget = share.target ? Math.min(100, Math.round((share.current / share.target) * 100)) : 0;
  const ledgerHeld = ledger.delta != null && ledger.delta <= 0;

  return (
    <div className="rounded-2xl border border-[#E8E4DC] bg-white p-5 space-y-4">
      {/* Headline: overall completion + projected finish */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-[#5A5751]">App Firm-Up · Completion</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-[#1A1815]">
              {overall.pct == null ? '—' : `${overall.pct}%`}
            </span>
            <span className="text-sm text-[#5A5751]">
              {overall.total ? `${overall.done}/${overall.total} items done` : 'load a board to begin the timeline'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-[#5A5751]">Projected finish</div>
          <div className="text-lg font-medium text-[#1A1815]">
            {finish.date ? fmtDate(finish.date) : 'set target dates'}
          </div>
          <div className="text-xs text-[#5A5751]">
            {finish.date
              ? `latest open target${finish.undatedOpen ? ` · ${finish.undatedOpen} open items undated` : ''}`
              : `${finish.undatedOpen} open item${finish.undatedOpen === 1 ? '' : 's'} need a date to project`}
          </div>
        </div>
      </div>

      {/* Overall progress bar (honest: none when no items) */}
      {overall.pct != null && (
        <div className="h-2 rounded-full bg-[#1A1815]/10 overflow-hidden">
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${overall.pct}%` }} />
        </div>
      )}

      {/* The two firm-up signals + the ledger, side by side */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Persistent-backend share */}
        <div className="rounded-xl border border-[#E8E4DC] p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1A1815]">Persistent backend share</span>
            <span className="text-xs"><TrendArrow trend={share.trend} /></span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#1A1815]">{share.current}%</span>
            <span className="text-xs text-[#5A5751]">of {share.totalLines.toLocaleString()} lines · {measuredLabel(share.measuredAt)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#1A1815]/10 overflow-hidden" title={`toward ${share.target}% target`}>
            <div className="h-full bg-[#2A5A8E]" style={{ width: `${towardTarget}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs text-[#5A5751]">
            <span>baseline {share.baseline}%</span>
            <span>target {share.target}% ({share.toTarget > 0 ? `+${share.toTarget}` : share.toTarget} to go)</span>
          </div>
          <div className="mt-1 text-xs text-[#5A5751]">
            SQL {share.sub.sql}% · Python {share.sub.python}% · shell/PS {share.sub.shellPs}% · CI {share.sub.ci}%
            <span className="text-[#5A5751]"> — frontend {share.frontendPct}% drops as loops migrate</span>
          </div>
        </div>

        {/* Module ledger — monolith line-count + surfaces extracted */}
        <button
          type="button"
          onClick={onOpenBoards || undefined}
          className={`text-left rounded-xl border border-[#E8E4DC] p-3 ${onOpenBoards ? 'hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1A1815]">Module ledger</span>
            {onOpenBoards && <span className="text-xs text-[#5A5751]">open boards →</span>}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-[#1A1815]">{ledger.surfaces != null ? ledger.surfaces : '—'}</span>
            <span className="text-xs text-[#5A5751]">surfaces on the registry</span>
          </div>
          <div className="mt-2 text-sm text-[#1A1815]">
            Monolith {ledger.monolithLines != null ? ledger.monolithLines.toLocaleString() : '—'} lines
            <span className="text-xs text-[#5A5751]"> · {measuredLabel(ledger.measuredAt)}</span>
          </div>
          <div className="mt-1 text-xs">
            {ledger.frozenBudget != null && (
              <span className={ledgerHeld ? 'text-[#5A6E3D]' : 'text-[#B85838]'}>
                {ledgerHeld ? '↓' : '↑'} {ledger.delta != null ? `${Math.abs(ledger.delta)} ${ledgerHeld ? 'under' : 'over'}` : ''} the frozen {ledger.frozenBudget.toLocaleString()} — shrinks as modules land
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
