// =============================================================================
// ProjectMgmtPulse — managing + outcomes, observable on the Operations board
// =============================================================================
// "Surface on the Operations/Quality board so managing + outcomes are observable
// in-app (loops return inside)." (Darrell, 2026-06-17.) This is a LIVE read of
// the real projects + discussions the family manages — how many sit in each
// eternal-stage right now, how many discussions drive the work, and how many
// hand-offs are staged behind the Cage. No painted numbers: every count is a
// tally of the same real synced rows the cockpit edits. When there's nothing yet,
// it says so honestly instead of showing a hopeful zero-dressed-as-progress.
import React, { useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import { ETERNAL_STAGES, stageBoard, stageMeta } from '../lib/project-management.js';
import { discussionCounts, visibleDiscussions, DISCUSSION_KINDS } from '../lib/discussions.js';
import { pendingHandoffs } from '../lib/orchestrator-handoff.js';

export default function ProjectMgmtPulse({ projects = [], discussions = [], currentUserId = null, isGovernor = false }) {
  const board = useMemo(() => stageBoard(projects), [projects]);
  const visible = useMemo(() => visibleDiscussions(discussions, currentUserId, isGovernor), [discussions, currentUserId, isGovernor]);
  const dc = useMemo(() => discussionCounts(visible), [visible]);
  const staged = useMemo(() => pendingHandoffs(visible), [visible]);

  const working = (board.research || 0) + (board.plan || 0) + (board.execute || 0);
  const pulseKpi = staged.length > 0
    ? { status: 'attention', label: `${staged.length} hand-off${staged.length === 1 ? '' : 's'} staged` }
    : working > 0
      ? { status: 'good', label: `${working} in motion` }
      : { status: 'idle', label: 'nothing in motion yet' };

  return (
    <section className="bg-white border border-[#5A6E3D] p-3 mt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <h3 className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          📋 Project management — live
        </h3>
        <KpiDot status={pulseKpi.status} label={pulseKpi.label} />
      </div>

      {/* Eternal-sequence board — real tally per stage. */}
      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">By stage (Research → Plan → Execute)</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ETERNAL_STAGES.map((s) => (
          <span key={s.key} className="inline-flex items-baseline gap-1 px-2 py-1 border border-[#E8E4DC] text-[0.6875rem]" style={{ fontFamily: '"Fraunces", serif' }}>
            <span aria-hidden="true">{s.glyph}</span>
            <span>{s.label}</span>
            <span className="font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{board[s.key] || 0}</span>
          </span>
        ))}
      </div>

      {/* Discussions roll-up — what's driving the work. */}
      <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Discussions driving the work</div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[0.6875rem] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
        <span><span className="text-[#5A5751]">total</span> <span className="font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{dc.total}</span></span>
        <span><span className="text-[#5A5751]">open</span> <span className="font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{dc.open}</span></span>
        {DISCUSSION_KINDS.map((k) => (
          <span key={k.key}><span className="text-[#5A5751]">{k.label.toLowerCase()}</span> <span className="font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{dc.byKind[k.key] || 0}</span></span>
        ))}
      </div>

      {/* Braked hand-offs — recorded, never auto-run. */}
      <div className="mt-2 pt-2 border-t border-[#E8E4DC]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[0.6875rem]" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="uppercase tracking-wider text-[0.625rem] text-[#2A5A8E] font-semibold mr-1">🛰 Staged hand-offs</span>
            {staged.length} queued to feed a lane
          </span>
          <KpiDot status={staged.length > 0 ? 'attention' : 'idle'} label={staged.length > 0 ? 'awaiting your call' : 'none staged'} />
        </div>
        <p className="text-[0.5625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Hand-offs stay behind the Cage (budget + concurrency lock + kill-switch). Nothing here auto-runs — the deep autonomous-drive is staged; the brake state lives in the Wake Orchestrator cockpit below.
        </p>
      </div>

      <p className="text-[0.5625rem] text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Live tally of your real projects + discussions — not a static count. {(stageMeta('execute').label)} = the build is running.
      </p>
    </section>
  );
}
