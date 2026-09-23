// =============================================================================
// DecisionIntelligence — the six readouts of Darrell's brief, derived live
// from the rows this instance already holds (DR-0589)
// =============================================================================
// "How can PoeTech App do these functions for me?!!!!" — Risks (what appears
// repeatedly), Dependencies (what cannot move until another item completes),
// Ownership gaps (who should own this but doesn't), Escalation needs (what has
// stalled), Patterns (what appears across areas), Timeline threats (what
// evidence says a date is at risk), and the board's own column: Decisions
// required (who must decide what).
//
// REAL DATA ONLY (DR-0061): concerns / projects / discussions as the app
// already syncs them. Every item names the rows it came from and says why in
// one sentence; no rows → "unavailable", never a painted zero. The thresholds
// are printed, so "stalled" is a number a reader can check.
// =============================================================================
import React, { useMemo } from 'react';
import { deriveDecisionIntelligence, STALL_DAYS, DUE_SOON_DAYS, PROJECT_HORIZON_DAYS, REPEAT_MIN } from '../lib/decision-intelligence.js';

const PANELS = [
  { key: 'risks', title: 'Risks · what appears repeatedly', color: '#B85838', empty: 'No concern is stated twice on this board.' },
  { key: 'dependencies', title: 'Dependencies · what cannot move yet', color: '#8B6F47', empty: 'No open item names something it waits on.' },
  { key: 'ownershipGaps', title: 'Ownership gaps · who should own this', color: '#B85838', empty: 'Every open item has an owner.' },
  { key: 'escalations', title: 'Escalation · what has stalled', color: '#B85838', empty: 'Nothing has slipped its date or gone quiet.' },
  { key: 'patterns', title: 'Patterns · across areas', color: '#2A5A8E', empty: 'No worry spans more than one area.' },
  { key: 'timelineThreats', title: 'Timeline threats · dates at risk', color: '#8B6F47', empty: 'No date inside the window is under threat.' },
  { key: 'decisionsRequired', title: 'Decisions required · who decides what', color: '#5A6E3D', empty: 'No open row names a decision it waits on.' },
];

function Item({ it, color }) {
  return (
    <li className="border-l-2 pl-2" style={{ borderLeftColor: color }}>
      <p className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
        {it.title}
        {typeof it.count === 'number' && it.count > 1 && <span className="ml-1 text-[0.625rem] font-normal text-[#5A5751]">×{it.count}</span>}
        {typeof it.days === 'number' && <span className="ml-1 text-[0.625rem] font-normal text-[#5A5751]">{it.days}d</span>}
        {typeof it.daysLeft === 'number' && <span className="ml-1 text-[0.625rem] font-normal text-[#5A5751]">{it.daysLeft}d left</span>}
      </p>
      <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{it.why}</p>
      {it.decision && <p className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}><span className="uppercase tracking-wider text-[0.625rem] text-[#5A6E3D]">Decide · </span>{it.decision}</p>}
      {it.impact && <p className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}><span className="uppercase tracking-wider text-[0.625rem] text-[#B85838]">If not · </span>{it.impact}</p>}
      <p className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>from {it.sources.join(', ')}</p>
    </li>
  );
}

export default function DecisionIntelligence({ concerns = [], projects = [], discussions = [], nowMs = Date.now() }) {
  const r = useMemo(() => deriveDecisionIntelligence({ concerns, projects, discussions, nowMs }), [concerns, projects, discussions, nowMs]);
  return (
    <div className="space-y-3" data-testid="decision-intelligence">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#2A5A8E] font-semibold">Governance · Decision intelligence</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          Read live from this instance&apos;s concerns, projects and hand-offs — nothing typed in here. What repeats, what waits on what, what has no owner, what has stalled, what spans areas, what threatens a date, and who must decide what.
          {r.ok
            ? ` Read: ${r.read.concerns} concerns · ${r.read.projects} projects · ${r.read.discussions} discussions.`
            : ' Unavailable: no concerns, projects or discussions to read yet.'}
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          stalled = no update for {STALL_DAYS}d or a passed target · due-soon = {DUE_SOON_DAYS}d with no work started · project horizon = {PROJECT_HORIZON_DAYS}d · repeated = the same worry ×{REPEAT_MIN}
        </p>
      </section>
      {r.ok && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PANELS.map((p) => {
            const list = r[p.key] || [];
            return (
              <section key={p.key} className="bg-white border border-[#E8E4DC] p-3" data-testid={`di-${p.key}`}>
                <div className="flex items-baseline justify-between">
                  <h4 className="text-[0.625rem] uppercase tracking-wider font-semibold" style={{ color: p.color }}>{p.title}</h4>
                  <span className="text-[0.625rem]" style={{ fontFamily: '"JetBrains Mono", monospace', color: list.length ? p.color : '#5A5751' }}>{list.length}</span>
                </div>
                {list.length === 0
                  ? <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.empty}</p>
                  : <ul className="mt-1.5 space-y-1.5">{list.slice(0, 8).map((it, i) => <Item key={`${it.id || it.key}-${i}`} it={it} color={p.color} />)}</ul>}
                {list.length > 8 && <p className="text-[0.625rem] text-[#5A5751] mt-1">and {list.length - 8} more</p>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
