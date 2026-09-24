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
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { deriveDecisionIntelligence, STALL_DAYS, DUE_SOON_DAYS, PROJECT_HORIZON_DAYS, REPEAT_MIN } from '../lib/decision-intelligence.js';
import { recordReadout, fetchReadouts, trendFor, todayIso } from '../lib/decision-readouts.js';
import supabase from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';

// Color rides theme CLASSES, never inline hex (legibility guard, the Chef's
// Corner class): a class is remapped per theme, an inline color is not.
const TONE = {
  rust: { text: 'text-[#B85838]', border: 'border-[#B85838]' },
  bronze: { text: 'text-[#8B6F47]', border: 'border-[#8B6F47]' },
  blue: { text: 'text-[#2A5A8E]', border: 'border-[#2A5A8E]' },
  green: { text: 'text-[#5A6E3D]', border: 'border-[#5A6E3D]' },
};
const PANELS = [
  { key: 'risks', title: 'Risks · what appears repeatedly', tone: 'rust', empty: 'No concern is stated twice on this board.' },
  { key: 'dependencies', title: 'Dependencies · what cannot move yet', tone: 'bronze', empty: 'No open item names something it waits on.' },
  { key: 'ownershipGaps', title: 'Ownership gaps · who should own this', tone: 'rust', empty: 'Every open item has an owner.' },
  { key: 'escalations', title: 'Escalation · what has stalled', tone: 'rust', empty: 'Nothing has slipped its date or gone quiet.' },
  { key: 'patterns', title: 'Patterns · across areas', tone: 'blue', empty: 'No worry spans more than one area.' },
  { key: 'timelineThreats', title: 'Timeline threats · dates at risk', tone: 'bronze', empty: 'No date inside the window is under threat.' },
  { key: 'decisionsRequired', title: 'Decisions required · who decides what', tone: 'green', empty: 'No open row names a decision it waits on.' },
];

function Item({ it, tone }) {
  return (
    <li className={`border-l-2 pl-2 ${TONE[tone].border}`}>
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

// The daily record (DR-0612): written once per open per day, read back as the
// trend. `deps` lets tests prove the path without a network; `record` false
// keeps a preview or a signed-out view from writing.
const LIVE_DEPS = { supabase, getInstanceId };

export default function DecisionIntelligence({ concerns = [], projects = [], discussions = [], boardTasks = [], feedback = [], incidents = [], nowMs = Date.now(), record = true, deps = LIVE_DEPS }) {
  const r = useMemo(
    () => deriveDecisionIntelligence({ concerns, projects, discussions, boardTasks, feedback, incidents, nowMs }),
    [concerns, projects, discussions, boardTasks, feedback, incidents, nowMs],
  );
  const today = todayIso(nowMs);
  const [history, setHistory] = useState({ ok: false, rows: [], reason: 'not read yet' });
  const wrote = useRef('');
  useEffect(() => {
    let live = true;
    fetchReadouts(deps).then((h) => { if (live) setHistory(h); });
    return () => { live = false; };
  }, [deps]);
  // Record today's counts once the readout has settled on real rows.
  const countsKey = r.ok ? JSON.stringify(r.counts) : '';
  useEffect(() => {
    if (!record || !r.ok || wrote.current === `${today}:${countsKey}`) return;
    wrote.current = `${today}:${countsKey}`;
    recordReadout({ ...deps, counts: r.counts, read: r.read, nowMs });
  }, [record, countsKey, today]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-3" data-testid="decision-intelligence">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#2A5A8E] font-semibold">Governance · Decision intelligence</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          Read live from this instance&apos;s concerns, projects, hand-offs, board tasks, feedback and incidents — nothing typed in here. What repeats, what waits on what, what has no owner, what has stalled, what spans areas, what threatens a date, and who must decide what.
          {r.ok
            ? ` Read: ${r.read.concerns} concerns · ${r.read.projects} projects · ${r.read.discussions} discussions · ${r.read.boardTasks} board tasks · ${r.read.feedback} feedback · ${r.read.incidents} incidents.`
            : ' Unavailable: nothing to read yet.'}
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          stalled = no update for {STALL_DAYS}d or a passed target · due-soon = {DUE_SOON_DAYS}d with no work started · project horizon = {PROJECT_HORIZON_DAYS}d · repeated = the same worry ×{REPEAT_MIN}
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid="di-history">
          {history.ok
            ? (history.rows.filter((h) => h.day < today).length
              ? `daily record: ${history.rows.length} day(s) kept; each panel compares with the last recorded day before today`
              : 'daily record: today is the first day kept; the trend appears from the next day the board is opened')
            : `daily record unavailable (${history.reason})`}
        </p>
      </section>
      {r.ok && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PANELS.map((p) => {
            const list = r[p.key] || [];
            const t = history.ok ? trendFor(p.key, history.rows, today, list.length) : null;
            return (
              <section key={p.key} className="bg-white border border-[#E8E4DC] p-3" data-testid={`di-${p.key}`}>
                <div className="flex items-baseline justify-between">
                  <h4 className={`text-[0.625rem] uppercase tracking-wider font-semibold ${TONE[p.tone].text}`}>{p.title}</h4>
                  <span className={`text-[0.625rem] ${list.length ? TONE[p.tone].text : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{list.length}</span>
                </div>
                {t && (
                  <p className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} data-testid={`di-trend-${p.key}`}>
                    was {t.prev} on {t.prevDay}{t.delta ? ` (${t.delta > 0 ? '+' : ''}${t.delta})` : ' (same)'}
                  </p>
                )}
                {list.length === 0
                  ? <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{p.empty}</p>
                  : <ul className="mt-1.5 space-y-1.5">{list.slice(0, 8).map((it, i) => <Item key={`${it.id || it.key}-${i}`} it={it} tone={p.tone} />)}</ul>}
                {list.length > 8 && <p className="text-[0.625rem] text-[#5A5751] mt-1">and {list.length - 8} more</p>}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
