// =============================================================================
// BuildBoard — PoeTech building itself, in the open
// =============================================================================
// "All of the PoeTech app build should process through the PoeTech app so the
// work is transparent with estimated Go-Live Dates." (Darrell, 2026-06-10.)
// This is the build itself, shown to every user level: what's shipped, what's
// being built now, what's next with a target date, and what's deliberately
// gated on a decision. It is PLATFORM data (the same for everyone), so it
// lives here as a constant, not in a user's project list.
//
// Update this list as part of shipping — a project moves shipped/building/
// next as the work lands. Go-live dates are honest estimates, revised here.
import React, { useState } from 'react';
import WorkflowStatus from './WorkflowStatus.jsx';
import OpsBoard from './OpsBoard.jsx';
import QualityProof from './QualityProof.jsx';
import ConflictLoop from './ConflictLoop.jsx';
import WakeOrchestrator from './WakeOrchestrator.jsx';
import ProjectMgmtPulse from './ProjectMgmtPulse.jsx';
import LlmHealth from './LlmHealth.jsx';
import LlmReview from './LlmReview.jsx';
import { normalizeGovernanceQueue } from './GovernanceQueue.jsx';
import { FreshnessDot } from './FreshnessDot.jsx';
import { KpiLegend } from './KpiLegend.jsx';

// status: 'shipped' | 'building' | 'next' | 'gated'
const ROADMAP = [
  // — Shipped —
  { id: 'sw-version', title: 'Deploy-freshness fix', what: 'Every deploy ships a fresh service worker so updates always reach you (no stale app).', status: 'shipped', when: '2026-06-10' },
  { id: 'rentals-sync', title: 'Real Estate cloud sync', what: 'Properties, rent, mortgage, status sync across your devices — your full numbers, not a flattened copy.', status: 'shipped', when: '2026-06-11' },
  { id: 'dispatch', title: 'Maintenance → worker dispatch', what: 'A repair need becomes a work order, assigns a 1099 worker, texts them the job in one tap, tracked to done.', status: 'shipped', when: '2026-06-11' },
  { id: 'room-memory', title: 'Room memory + tenant turnover', what: 'Per-room photos + notes that persist for every tenant; turnover gives the next tenant a clean slate, landlord keeps the records.', status: 'shipped', when: '2026-06-11' },
  { id: 'life-gallery', title: 'The Biggest Picture', what: 'Family / business / project hero photos on the home screen. Yours — never sold, never mined, never used to train.', status: 'shipped', when: '2026-06-11' },
  { id: 'history-bridge', title: 'Property-history import', what: 'Pull your property chat history into the right property, verified by you before anything is kept.', status: 'shipped', when: '2026-06-11' },

  { id: 'conference', title: 'Conference module (77th National Assembly)', what: 'The Assembly on the Church tab — details, schedule, RSVPs, serving signups, and a direct feedback line from Bishop Gwin that shapes what we build next.', status: 'shipped', when: '2026-06-11' },
  { id: 'one-voice', title: 'One Voice (Church tab)', what: 'One box for everything — prayer, the Assembly, serving, ideas. It suggests where your words go; you always have the last word.', status: 'shipped', when: '2026-06-11' },
  { id: 'thinking-space', title: 'Thinking Space (your diary)', what: 'A sovereign, private place to think and come back to your thoughts — examine them against the Test, and tell PoeTech what to build right from a note.', status: 'shipped', when: '2026-06-11' },

  // — Shipped 2026-06-16/17 (the drive-until-empty pass: in-flight queue drained,
  //   deferred lanes verified on main, every landing traceable to a real SHA) —
  { id: 'learn-framework', title: 'Learn framework + The Infrastructure course', what: 'A shared, age-adaptive Learn framework every course runs on — skill levels, multi-modal lessons, quizzes — starting with The Infrastructure course (home + church).', status: 'shipped', when: '2026-06-16' },
  { id: 'role-scopes', title: 'Role-scoped access (owners · Governor · church staff · study circle)', what: 'Everyone signs in with a profile, and each person sees only their own surfaces — family owners, the tech Governor, church staff, and the private study circle are kept apart by design. Your data is never another role’s to see.', status: 'shipped', when: '2026-06-16' },
  { id: 'quiet-auth', title: 'Quiet in-app sign-in', what: 'Sign in without leaving the page — a focus-trapped modal with a Google popup, so you keep your place instead of being thrown to a full-page redirect.', status: 'shipped', when: '2026-06-17' },
  { id: 'event-mgmt', title: 'Venues — community Event Management', what: 'Funerals, weddings, and gatherings across both campuses: request a space, no double-booking, responsibilities and real revenue tracked. On the Church tab → Venues.', status: 'shipped', when: '2026-06-17' },
  { id: 'projects-cockpit', title: 'Projects hub + active-management cockpit', what: 'Your real projects, scopes, CapEx, and a Discussions surface in one place — a live management cockpit that reads your actual records, not a static list.', status: 'shipped', when: '2026-06-17' },
  { id: 'c2s', title: 'Command, Control & Serve Center', what: 'One steward seat that rolls every module up into a single view — see the whole system and serve from one place.', status: 'shipped', when: '2026-06-17' },
  { id: 'study', title: 'The Study (private circle)', what: 'A private reflection and Word-study surface for the study circle — sovereign and device-local, never public, never sold or mined.', status: 'shipped', when: '2026-06-17' },

  // — Building now —
  { id: 'build-board', title: 'Build-transparency board', what: 'This page — PoeTech building itself in the open: what shipped (with real SHAs in the Governor’s ops view), what’s next with go-live dates, and how the build itself is improving (the conflict-evaluation loop, quality gates, and KPI health all return here). Visible to every user.', status: 'shipped', when: '2026-06-17' },
  { id: 'ratings', title: 'Ratings — workers and PoeTech itself', what: '1099 workers who advertise accept being rated; PoeTech is rated on feedback the same way — so we always improve, or show plainly why we won’t do something.', status: 'next', when: '2026-06-17' },
  { id: 'pipeline-insights', title: 'Pipeline & promotions insights', what: 'Inside the app: what’s possible to do next, where pipeline investment pays, which services and promotions fit — insight surfaces grounded in your real data.', status: 'next', when: '2026-07-01' },
  { id: 'real-data-signedin', title: 'Your real bank + Gmail data when signed in', what: 'The import pipeline exists (download your statements → it reads them; Gmail cross-checks). Next: unlock it for a signed-in owner on the public site, carefully — it’s your most sensitive data.', status: 'next', when: '2026-06-24' },
  { id: 'bank-automation', title: 'Banking on autopilot (set up once, no human after)', what: 'Your bank emails statements → your own Gmail → your own NAS → verified ledger → the app. ACTIVATED under supervision 2026-06-11 — and the watched first run caught a real outage (expired Gmail credential, silently failing for hours). One reconnect heals the whole lane.', status: 'building', when: 'Gmail reconnect (1 min) + bank statement-emails on' },
  { id: 'reports-levels', title: 'Reports for every level of thinking', what: 'The same live truth, clarified differently — simple / standard / expert lenses on every report, so a child, a deacon, and a CPA all understand and decide from near-live data.', status: 'next', when: '2026-07-15' },
  { id: 'tenant-portal', title: 'Tenant logins (their own door)', what: 'A tenant signs in and sees ONLY their unit: their lease, their rent status, report-a-repair straight into the dispatch loop. The backend pipeline and privacy boundaries exist; the role-gated tenant surface is the build. Until then, tenants call or text — the landlord side records everything.', status: 'gated', when: 'after the family soak + merge — privacy review first (a tenant must never see the family’s books)' },
  { id: 'tlc-intake', title: 'Counseling intake for every TLC therapist', what: 'A client opens a therapist’s link, speaks once, and a clean intake lands with the right 1099 therapist — contact-level only; clinical records stay with the clinician. The counseling route shipped tonight; per-therapist routing is the last hop.', status: 'next', when: '2026-06-24' },
  { id: 'church-newsletter', title: 'Church newsletter on autopilot (with the Bishop’s yes)', what: 'A disciplined weekly draft built only from real church data — Assembly, schedule, serving, praise — held for Bishop Gwin’s one-tap approval before anything sends. The composing workflow pattern already runs daily for the build.', status: 'next', when: '2026-07-08' },
  { id: 'contractor-workspace', title: 'The handyman’s workspace (20 clients, organized)', what: 'The dispatch rails flipped to the worker’s side: my jobs today, my clients, my scopes, my invoices. Built for the tradesman who should prefer PoeTech because it runs his whole week.', status: 'next', when: '2026-07-15' },
  { id: 'sovereign-ai-diary', title: 'Your own AI in the Thinking Space', what: 'Talk a thought through with an AI that runs on your NAS — private, opt-in, never leaves your control. The diary is live now; this adds the conversation.', status: 'next', when: '2026-07-08' },
  { id: 'photos-two-way', title: 'Photos both ways (phone ↔ NAS)', what: 'Browse what’s already on your NAS without filling the phone (live now for property photos); push new phone photos to a space you own next.', status: 'building', when: '2026-06-20' },
  { id: 'occupancy', title: 'Occupancy-revenue model', what: 'Per-room income potential, with the full opportunity always shown — so every vacant room markets itself.', status: 'building', when: '2026-06-20' },
  { id: 'photo-ingest', title: 'Bring property photos in', what: 'File your existing property photos to the right room — see each place transform over the years.', status: 'shipped', when: '2026-06-11' },

  // — Next —
  { id: 'dash-merge', title: 'Dashboard into Projects', what: 'One page that fits every level of user and learner — know anything about everything.', status: 'next', when: '2026-06-24' },
  { id: 'feedback-ai', title: 'Feedback → AI-reviewed follow-up', what: 'Your feedback routed to the right person with follow-up; the sequence gets better over time.', status: 'next', when: '2026-07-01' },
  { id: 'sovereign-photos', title: 'Sovereign photo backup', what: 'Photos backed up to a space you own (your NAS, or your private PoeTech space) — safe across any phone change.', status: 'next', when: '2026-07' },
  { id: 'referral', title: 'Share with people you trust', what: 'Share with real friends and family through your own space — not a public link an ad network indexes.', status: 'next', when: '2026-07-08' },
  { id: 'verticals', title: 'Expert seed data per field', what: 'Lawyers first — each profession sees what an expert in their field would actually need and project.', status: 'next', when: '2026-07-15' },
  { id: 'family-finance', title: 'Family finance together', what: 'Member-level views so the whole family can discuss money and business together — free at the family level.', status: 'next', when: '2026-07-29' },

  // — Gated on a decision (honest about why) —
  { id: 'hardware', title: 'Hardware advisory', what: 'Help you buy the right machine for your needs, set up by the 1099 team.', status: 'gated', when: 'after the funding-model decision (underwriting, never ads)' },
  { id: 'iot', title: 'Cameras / IoT module', what: 'Your Wyze + cameras in one place — family, landlord, business each see only their own.', status: 'gated', when: 'research first (2026-07-22); fairness + privacy review' },
  { id: 'vision-training', title: 'Melanin-accurate vision (opt-in)', what: 'Opt in to train vision that works accurately on every skin tone — default off, your choice.', status: 'gated', when: 'after consent design + legal review (Illinois BIPA)' },
];

const STATUS = {
  shipped:  { label: 'Shipped',  color: '#5A6E3D', symbol: '✓', blurb: 'Live now' },
  building: { label: 'Building',  color: '#B85838', symbol: '◐', blurb: 'In progress' },
  next:     { label: 'Next',      color: '#2A5A8E', symbol: '→', blurb: 'Planned' },
  gated:    { label: 'Gated',     color: '#5A5751', symbol: '⏸', blurb: 'Waiting on a decision' },
};
const ORDER = ['building', 'next', 'gated', 'shipped'];

// Accountability: how many days past its committed target an unfinished item is.
// Only items still building/next with a real YYYY-MM-DD target count — the board
// holds itself to the dates it commits to, in the open. A board that won't flag
// its own slips isn't transparency, it's decoration.
function daysLate(r) {
  if (r.status !== 'building' && r.status !== 'next') return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.when || '')) return 0;
  const days = Math.floor((Date.now() - Date.parse(r.when)) / 86400000);
  return days > 0 ? days : 0;
}

// Real automation-pipeline count, computed at BUILD time from the actual n8n
// workflow files (vite.config __WORKFLOW_STATS__). Not a hand-typed number.
// `active` is repo state, not live run-status (Stage 2). Guarded so tests/SSR
// that don't run the vite define still render.
const WORKFLOW_STATS = (typeof __WORKFLOW_STATS__ !== 'undefined') ? __WORKFLOW_STATS__ : { built: 0, active: 0 };

// Open governance-decision count — the SAME real source as the Decisions tab
// (decision-queue.md parsed into __GOVERNANCE_QUEUE__ at build time), so the
// Build board can show "N waiting on you" alongside the build at a glance
// (build backlog #4). Governor-only surface (the Decisions tab is gated).
const GOVERNANCE_QUEUE = (typeof __GOVERNANCE_QUEUE__ !== 'undefined') ? __GOVERNANCE_QUEUE__ : { ok: false, openCount: 0, items: [] };

// Chronological ordering within a stage. The plan complaint (Darrell,
// 2026-06-13): the Next tab read 06-17, 07-01, 06-24, 07-15... — array order,
// not a timeline. Sort by the real target/ship date so each stage reads in
// order: upcoming work nearest-first (asc), shipped most-recent-first (desc).
// Items whose "when" is a prose condition rather than a date (e.g. "after the
// privacy review") have no place on the timeline, so they sink to the bottom in
// their listed order, both directions. Sorts the REAL dates already on each
// item — no invented or reordered data.
export function whenSortKey(r) {
  const t = Date.parse(r.when || '');
  return Number.isNaN(t) ? Infinity : t;
}
export function sortByWhen(list, dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1;
  return list
    .map((r, i) => [r, i])
    .sort((a, b) => {
      const ka = whenSortKey(a[0]), kb = whenSortKey(b[0]);
      if (ka === Infinity && kb === Infinity) return a[1] - b[1];
      if (ka === Infinity) return 1;
      if (kb === Infinity) return -1;
      return sign * (ka - kb) || (a[1] - b[1]);
    })
    .map(([r]) => r);
}

// Real ship span — the earliest and latest dated "shipped" item. Pulled from
// the board's own real dates, not invented.
function shipSpan() {
  const dates = ROADMAP
    .filter(r => r.status === 'shipped' && /^\d{4}-\d{2}-\d{2}$/.test(r.when || ''))
    .map(r => r.when)
    .sort();
  return { first: dates[0] || null, last: dates[dates.length - 1] || null };
}

// Build stamp injected at deploy (vite define) — proves the strip reflects the
// LIVE deployed build, not a static doc. Guarded for tests/SSR.
const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

// Recently-shipped momentum (build backlog #5): the most recent DATED 'shipped'
// items, newest-first — real ship dates from the board, not invented. Undated
// shipped items (no place on a timeline) are excluded. Exported for tests.
export function recentlyShipped(n = 4) {
  return sortByWhen(ROADMAP.filter(r => r.status === 'shipped' && whenSortKey(r) !== Infinity), 'desc').slice(0, n);
}

// RecentlyShipped — a compact, build-stamped continuity strip: what landed
// recently + the live build it's part of, so momentum is visible at a glance
// (not a static roadmap). Renders nothing when there are no dated ships.
export function RecentlyShipped() {
  const items = recentlyShipped(4);
  if (!items.length) return null;
  return (
    <section className="bg-white border border-[#5A6E3D] p-3">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A6E3D] font-semibold">✓ Recently shipped</div>
        <div className="text-[9px] uppercase tracking-wider text-[#5A5751] inline-flex items-center gap-1.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <span>live build {BUILD_SHA}{BUILD_TIME ? ` · ${BUILD_TIME.slice(0, 10)}` : ''}</span>
          <FreshnessDot />
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {items.map(r => (
          <li key={r.id} className="text-[11px] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            <span className="text-[#5A6E3D] mr-1" aria-hidden="true">✓</span>{r.title}
            <span className="text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {r.when}</span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] text-[#5A5751] italic mt-1.5" style={{ fontFamily: '"Fraunces", serif' }}>
        Real ship dates, stamped to the live build — momentum, not a static roadmap.
      </p>
    </section>
  );
}

export function BuildBoard({ onViewDecisions = null, isGovernor = false, projects = [], discussions = [], currentUserId = null }) {
  const [openId, setOpenId] = useState(null);
  // Open decisions waiting on the governor — read from the real queue (#4).
  const openDecisions = normalizeGovernanceQueue(GOVERNANCE_QUEUE).openCount;

  // Past Due — anything past its committed target but still in progress. A
  // cross-cutting view over Building + Next: the board adjusting to the real
  // flow of work, not the plan it started with.
  const overdueItems = ROADMAP.filter(r => daysLate(r) > 0).sort((a, b) => daysLate(b) - daysLate(a));
  const OVERDUE = { label: 'Past Due', color: '#B85838', symbol: '⚠', blurb: 'Past target, still in progress' };

  const counts = Object.fromEntries(ORDER.map(k => [k, ROADMAP.filter(r => r.status === k).length]));
  counts.overdue = overdueItems.length;

  // Lead with Past Due when anything slipped, so a missed date is the first
  // thing seen — not something to scroll for. Otherwise open on Building.
  const TABS = overdueItems.length ? ['overdue', ...ORDER] : ORDER;
  const firstTab = overdueItems.length ? 'overdue' : (ORDER.find(k => counts[k] > 0) || 'building');
  const [tab, setTab] = useState(firstTab);
  const meta = (k) => (k === 'overdue' ? OVERDUE : STATUS[k]);
  const s = meta(tab);
  const items = tab === 'overdue'
    ? overdueItems
    : sortByWhen(ROADMAP.filter(r => r.status === tab), tab === 'shipped' ? 'desc' : 'asc');
  const span = shipSpan();

  return (
    <div className="space-y-4">
      <RecentlyShipped />
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🛠 PoeTech, Built in the Open</div>
        <p className="text-sm mt-1 text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          The work is transparent on purpose. Here is what we&apos;ve shipped, what we&apos;re building now, what&apos;s next with a target date, and what&apos;s waiting on a decision — so you can see exactly where PoeTech is going.
        </p>
        <div className="text-[10px] uppercase tracking-wider font-semibold mt-2">
          <span className="text-[#5A6E3D]">✓ {counts.shipped} shipped{span.first ? `, ${span.first} → ${span.last}` : ''} · {counts.building} building · {counts.next} next</span>
          {counts.overdue > 0 && <span className="text-[#B85838]"> · ⚠ {counts.overdue} past target</span>}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          🔧 {WORKFLOW_STATS.built} automation workflows built · {WORKFLOW_STATS.active} active in the repo
        </div>
        <div className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          These counts are real — workflow files in the repo and dated ships, not hand-typed. Live run-status and per-item % complete are wiring up next.
        </div>
        {isGovernor && openDecisions > 0 && (
          <button
            type="button"
            onClick={() => onViewDecisions && onViewDecisions()}
            disabled={!onViewDecisions}
            aria-label={`${openDecisions} governance decision${openDecisions === 1 ? '' : 's'} awaiting your call — open the Decisions tab`}
            className="mt-2 inline-flex items-center text-[10px] uppercase tracking-wider text-[#B85838] hover:text-white hover:bg-[#B85838] border border-[#B85838] px-2.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-[#B85838]"
          >
            ⚖ {openDecisions} decision{openDecisions === 1 ? '' : 's'} awaiting your call →
          </button>
        )}
      </section>

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
              className="text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              style={active ? { backgroundColor: st.color, color: 'white', borderColor: st.color } : { color: st.color, borderColor: st.color }}
            >
              <span aria-hidden="true" className="mr-1">{st.symbol}</span>{st.label} ({k === 'overdue' ? counts.overdue : counts[k]})
            </button>
          );
        })}
      </div>

      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: s.color }}>
          <span aria-hidden="true" className="mr-1">{s.symbol}</span>{s.label} · {s.blurb} ({items.length})
        </h3>
        <div className="bg-white border border-[#1A1815]">
          {items.map((r, i) => {
            const late = daysLate(r);
            return (
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
                    <span className="text-[10px] uppercase tracking-wider flex items-center gap-2 flex-wrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      <span style={{ color: STATUS[r.status].color }}>
                        {r.status === 'shipped' ? `shipped ${r.when}` : r.status === 'gated' ? 'gated' : `target ${r.when}`}
                      </span>
                      {late > 0 && (
                        <span className="font-semibold" style={{ color: '#B85838' }}>⚠ {late} {late === 1 ? 'day' : 'days'} late</span>
                      )}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-0.5" aria-hidden="true">
                    {openId === r.id ? '▲ hide details' : '▼ details'}
                  </div>
                </button>
                {openId === r.id && (
                  <div className="px-3 pb-3">
                    <p className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{r.what}</p>
                    {r.status === 'gated' && (
                      <p className="text-xs text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Waiting on: {r.when}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
        Dates are honest estimates and move as we learn — that&apos;s the point of showing them. No blame, just build.
      </p>

      {/* The Key for every live KPI dot below (and the build-freshness dot in the
          header) — one reachable place, documenting the shared status states. */}
      <KpiLegend />

      <WorkflowStatus />

      {/* Project management — live read of the family's real projects +
          discussions (stage board, what's driving the work, staged hand-offs).
          Governor-gated: family-internal management data, and the no-leak filter
          inside keeps private discussions out of the counts. */}
      {isGovernor && <ProjectMgmtPulse projects={projects} discussions={discussions} currentUserId={currentUserId} isGovernor={isGovernor} />}

      {/* Orchestration internals (branches, PRs, lanes, SHAs) are a dev/ops
          view for the Governor — public data, but noise for a family user. */}
      {isGovernor && <OpsBoard />}

      {/* Quality / Proof — QA + reviews report their own real results in-app.
          Governor-gated for the same reason as the orchestration board. */}
      {isGovernor && <QualityProof />}

      {/* Conflict-evaluation loop — the orchestration learns from its own
          collisions so conflicts trend down as we grow (hot files + ranked
          decomposition). Governor-gated: orchestration internals. */}
      {isGovernor && <ConflictLoop />}

      {/* Wake Orchestrator cockpit — control + observability for the wake/handoff
          engine on the NAS. Governor-gated: arming controls + internal state. */}
      {isGovernor && <WakeOrchestrator />}

      <LlmHealth />

      <LlmReview />
    </div>
  );
}

export default BuildBoard;
