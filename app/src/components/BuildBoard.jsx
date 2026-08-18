// =============================================================================
// BuildBoard — PoeTech building itself, in the open (DERIVED, never hand-kept)
// =============================================================================
// "All of the PoeTech app build should process through the PoeTech app so the
// work is transparent with estimated Go-Live Dates." (Darrell, 2026-06-10.)
// "No static data, combine what makes sense and keep cleaning until we like
// it." (Darrell, 2026-07-07 — DR-0121.)
//
// This page's 39-item hand-typed ROADMAP constant is RETIRED. The ship story
// now derives from the three record streams the platform already maintains as
// part of shipping (lib/build-story.js):
//   ✓ Shipped   — the Decision-Record ledger (every landed feature files a
//                 dated DR; re-parsed from docs/decisions/ on every build)
//   ◐ Building / → Next — the live board store (board_tasks; the SEED_BOARDS
//                 specs as the code-maintained fallback on a device with no
//                 live rows yet) with real phase state + real due dates only
//   ⏸ Gated     — the OPEN governance decision queue (the same real file the
//                 Decisions tab reads)
// A hand-kept list can silently rot (it did — 20 days); a derived one can only
// go stale if the ways themselves stop recording, which is the failure we
// actually want surfaced (DR-0076 / DR-0120 / DR-0121).
import React, { useState } from 'react';
import WorkflowStatus from './WorkflowStatus.jsx';
import LlmHealth from './LlmHealth.jsx';
import LlmReview from './LlmReview.jsx';
import { normalizeGovernanceQueue } from './GovernanceQueue.jsx';
import { FreshnessDot } from './FreshnessDot.jsx';
import DownloadLatest from './DownloadLatest.jsx';
import { KpiLegend } from './KpiLegend.jsx';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import {
  whenSortKey as storyWhenSortKey, sortByWhen as storySortByWhen,
  shippedFromLedger, inFlightStory, pastDueTasks, gatedFromQueue,
} from '../lib/build-story.js';

// Re-exported so existing consumers/tests keep their import site; the
// implementations live in lib/build-story.js (pure, fixture-tested).
export const whenSortKey = storyWhenSortKey;
export const sortByWhen = storySortByWhen;

// Each stage carries THEMEABLE classes (text/bg/border), not just a raw hex, so
// the per-[data-theme] remap applies (contrast guard scans for regressions).
const STATUS = {
  shipped:  { label: 'Shipped',  color: '#5A6E3D', text: 'text-[#5A6E3D]', bg: 'bg-[#5A6E3D]', border: 'border-[#5A6E3D]', symbol: '✓', blurb: 'Live now' },
  building: { label: 'Building',  color: '#B85838', text: 'text-[#B85838]', bg: 'bg-[#B85838]', border: 'border-[#B85838]', symbol: '◐', blurb: 'In progress' },
  next:     { label: 'Next',      color: '#2A5A8E', text: 'text-[#2A5A8E]', bg: 'bg-[#2A5A8E]', border: 'border-[#2A5A8E]', symbol: '→', blurb: 'Planned' },
  gated:    { label: 'Gated',     color: '#5A5751', text: 'text-[#5A5751]', bg: 'bg-[#5A5751]', border: 'border-[#5A5751]', symbol: '⏸', blurb: 'Waiting on a decision' },
};
const ORDER = ['building', 'next', 'gated', 'shipped'];


// Open governance-decision queue — the SAME real source as the Decisions tab
// (decision-queue.md parsed into __GOVERNANCE_QUEUE__ at build time). It now
// also IS the Gated stage: "waiting on a decision" reads from the queue itself.
const GOVERNANCE_QUEUE = (typeof __GOVERNANCE_QUEUE__ !== 'undefined') ? __GOVERNANCE_QUEUE__ : { ok: false, openCount: 0, items: [] };

// The Decision-Record ledger — the maintained ship record (DR-0065/DR-0121),
// re-parsed from docs/decisions/ on every build.
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };

// Build stamp injected at deploy (vite define) — proves the strip reflects the
// LIVE deployed build, not a static doc. Guarded for tests/SSR.
const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

// Recently-shipped momentum: the most recent DATED ship records, newest-first —
// real dates from the decision ledger, not invented. Exported for tests (which
// inject a fixture ledger).
export function recentlyShipped(n = 4, ledger = DR_LEDGER) {
  return shippedFromLedger(ledger, { limit: n });
}

// RecentlyShipped — a compact, build-stamped continuity strip: what landed
// recently + the live build it's part of, so momentum is visible at a glance.
export function RecentlyShipped() {
  const items = recentlyShipped(4);
  if (!items.length) return null;
  return (
    <section className="bg-white border border-[#5A6E3D] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">✓ Recently shipped</div>
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] inline-flex items-center gap-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <span>live build {BUILD_SHA}{BUILD_TIME ? ` · ${BUILD_TIME.slice(0, 10)}` : ''}</span>
          <FreshnessDot />
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {items.map(r => (
          <li key={r.id} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="text-[#5A6E3D] mr-1" aria-hidden="true">✓</span>{r.title}
            <span className="text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {r.when}</span>
          </li>
        ))}
      </ul>
      <p className="text-[0.5625rem] text-[#5A5751] italic mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
        Real ship dates from the decision ledger, stamped to the live build — momentum, derived, never hand-kept.
      </p>
    </section>
  );
}

export function BuildBoard({ onViewDecisions = null, onNavigate = null, isGovernor = false }) {
  const [openId, setOpenId] = useState(null);
  const tasks = useBoardTasks();
  // Open decisions waiting on the governor — read from the real queue.
  const openDecisions = normalizeGovernanceQueue(GOVERNANCE_QUEUE).openCount;

  // The derived story — every stage from its live source (lib/build-story.js).
  const shipped = shippedFromLedger(DR_LEDGER);
  const inFlight = inFlightStory(tasks);
  const gated = gatedFromQueue(GOVERNANCE_QUEUE);
  const overdueItems = pastDueTasks(tasks);
  const OVERDUE = { label: 'Past Due', color: '#B85838', text: 'text-[#B85838]', bg: 'bg-[#B85838]', border: 'border-[#B85838]', symbol: '⚠', blurb: 'Past target, still in progress' };

  const stageItems = {
    shipped,
    building: inFlight.building,
    next: inFlight.next,
    gated,
    overdue: overdueItems,
  };
  const counts = Object.fromEntries(ORDER.map(k => [k, stageItems[k].length]));
  counts.overdue = overdueItems.length;
  const span = shipped.length ? { first: shipped[shipped.length - 1].when, last: shipped[0].when } : { first: null, last: null };

  // Lead with Past Due when anything slipped, so a missed date is the first
  // thing seen — not something to scroll for. Otherwise open on Building.
  const TABS = overdueItems.length ? ['overdue', ...ORDER] : ORDER;
  const firstTab = overdueItems.length ? 'overdue' : (ORDER.find(k => counts[k] > 0) || 'building');
  const [tab, setTab] = useState(firstTab);
  const meta = (k) => (k === 'overdue' ? OVERDUE : STATUS[k]);
  const s = meta(tab);
  const items = stageItems[tab] || [];
  const anySeedFallback = [...inFlight.building, ...inFlight.next].some(b => !b.live);

  return (
    <div className="space-y-4">
      <RecentlyShipped />
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🛠 PoeTech, Built in the Open</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The work is transparent on purpose. Here is what we&apos;ve shipped, what we&apos;re building now, what&apos;s next, and what&apos;s waiting on a decision — each read live from the record stream that carries it, never a hand-kept list.
        </p>
        <div className="text-[0.625rem] uppercase tracking-wider font-semibold mt-2">
          <span className="text-[#5A6E3D]">✓ {counts.shipped} decision records shipped{span.first ? `, ${span.first} → ${span.last}` : ''} · {counts.building} boards building · {counts.next} queued</span>
          {counts.overdue > 0 && <span className="text-[#B85838]"> · ⚠ {counts.overdue} past target</span>}
          {inFlight.complete.length > 0 && <span className="text-[#5A6E3D]"> · {inFlight.complete.length} board{inFlight.complete.length === 1 ? '' : 's'} complete</span>}
        </div>
        {/* Provenance line (DR-0076/DR-0121): name the real source behind each
            stage, on the surface itself. */}
        <div className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Derived live — Shipped: the decision ledger ({DR_LEDGER.count} records, re-read every build) · Building/Next: the live boards{anySeedFallback ? ' (boards without live rows on this device show their maintained spec)' : ''} · Gated: the open governance queue.
        </div>
        {/* One tap to pull the newest deployed build onto THIS device. */}
        <div className="mt-3">
          <DownloadLatest />
        </div>
        {isGovernor && openDecisions > 0 && (
          <button
            type="button"
            onClick={() => onViewDecisions && onViewDecisions()}
            disabled={!onViewDecisions}
            aria-label={`${openDecisions} governance decision${openDecisions === 1 ? '' : 's'} awaiting your call — open the Decisions tab`}
            className="mt-2 inline-flex items-center text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-white hover:bg-[#B85838] border border-[#B85838] px-2.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#B85838]"
          >
            ⚖ {openDecisions} decision{openDecisions === 1 ? '' : 's'} awaiting your call →
          </button>
        )}
      </section>

      {/* Governor deep-link — the build/dev FUNCTIONS live together in one seat,
          the Command, Control & Serve Center. */}
      {isGovernor && (
        <section className="bg-[#FAF8F4] border border-[#1A1815] p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🎛 Steward build &amp; ops functions</div>
          <p className="text-xs text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            Operations, Quality &amp; Proof, the conflict loop, the wake orchestrator, and the live project-management pulse are gathered in one seat — the Command, Control &amp; Serve Center — instead of scattered down this page.
          </p>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('center')}
            disabled={!onNavigate}
            aria-label="Open the Command, Control & Serve Center"
            className="mt-2 inline-flex items-center text-[0.625rem] uppercase tracking-wider text-[#1A1815] hover:text-white hover:bg-[#1A1815] border border-[#1A1815] px-2.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#1A1815]"
          >
            Open the Center →
          </button>
        </section>
      )}

      {/* Stage sub-tabs — pick a stage and see just that short list, instead of
          one long scroll down the phone. Past Due leads when anything slipped. */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Build stages">
        {TABS.map(k => {
          if (k !== 'overdue' && !counts[k]) return null;
          const st = meta(k);
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => { setTab(k); setOpenId(null); }}
              className={`text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838] ${st.border} ${active ? `${st.bg} text-white` : st.text}`}
            >
              <span aria-hidden="true" className="mr-1">{st.symbol}</span>{st.label} ({k === 'overdue' ? counts.overdue : counts[k]})
            </button>
          );
        })}
      </div>

      <section>
        <h3 className={`text-[0.625rem] uppercase tracking-[0.25em] font-semibold mb-2 ${s.text}`}>
          <span aria-hidden="true" className="mr-1">{s.symbol}</span>{s.label} · {s.blurb} ({items.length})
        </h3>
        {items.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-5 text-center">
            <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              Nothing in this stage right now — honestly empty, not hiding anything.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#1A1815]">
            {items.map((r, i) => (
              <div key={r.id} className={i < items.length - 1 ? 'border-b border-[#E8E4DC]' : ''}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  aria-expanded={openId === r.id}
                  aria-label={openId === r.id ? `Hide details for ${r.title}` : `Show details for ${r.title}`}
                  className="w-full text-left p-3 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{r.title}</span>
                    <span className="text-[0.625rem] uppercase tracking-wider flex items-center gap-2 flex-wrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {tab === 'overdue' ? (
                        <span className="font-semibold text-[#B85838]">⚠ {r.daysLate} {r.daysLate === 1 ? 'day' : 'days'} late</span>
                      ) : (
                        <span className={(STATUS[r.status] || STATUS.building).text}>
                          {r.status === 'shipped' ? `shipped ${r.when}` : r.status === 'gated' ? 'gated' : r.when ? `next due ${r.when}` : 'no dated commitment'}
                        </span>
                      )}
                      {r.progress && (
                        <span className="text-[#5A5751]">{r.progress.done}/{r.progress.total} done{r.progress.blocked ? ` · ${r.progress.blocked} blocked` : ''}</span>
                      )}
                    </span>
                  </div>
                  {r.currentPhase && (
                    <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5">current phase: {r.currentPhase}{r.live === false ? ' · from the maintained spec (no live rows on this device yet)' : ''}</div>
                  )}
                  <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-0.5" aria-hidden="true">
                    {openId === r.id ? '▲ hide details' : '▼ details'}
                  </div>
                </button>
                {openId === r.id && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{r.what}</p>
                    {r.status === 'gated' && (
                      <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Waiting on: {r.when}</p>
                    )}
                    {(tab === 'building' || tab === 'next') && (
                      <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                        The live, phase-tracked detail is on <button type="button" onClick={() => onNavigate && onNavigate('projects')} className="underline text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] rounded">Projects → ▦ Boards</button>.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Dates are honest commitments read from the live records and move as we learn — that&apos;s the point of showing them. No blame, just build.
      </p>

      {/* The Key for every live KPI dot below (and the build-freshness dot in the
          header) — one reachable place, documenting the shared status states. */}
      <KpiLegend />

      {/* Automation pipeline + local-LLM health stay here as part of the PUBLIC
          "built in the open" transparency story. */}
      <WorkflowStatus />

      <LlmHealth />

      <LlmReview />
    </div>
  );
}

export default BuildBoard;
