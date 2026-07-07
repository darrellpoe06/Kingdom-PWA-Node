// Projects · ProjectsWrapper · ProjectConversationLog · DateField —
// extracted from monolith (r34) per MODULAR-EXTENSIBILITY.md. Includes
// PROJECT_DOMAINS + PROJECT_STATUSES constants. Inline edit per row
// shipped r20; this is the structural extraction.
import React, { useState, useMemo } from 'react';
import { useHistoryValue } from '../lib/nav-history.js';
import { MetricCell, SectionTitle, TabScroll } from './shared.jsx';
import { BuildBoard } from './BuildBoard.jsx';
import { ConcernsBoard } from './ConcernsBoard.jsx';
import ProjectBoards from './ProjectBoards.jsx';
import AppFirmUp from './AppFirmUp.jsx';
import GovernanceQueue from './GovernanceQueue.jsx';
import { deriveAppDecisions } from '../lib/decisions.js';
import { useBoardTasks } from '../lib/use-board-tasks.js';
import { boardDueByMonth, boardTimelineLanes, phaseCompletions } from '../lib/board.js';
import DelayReport from './DelayReport.jsx';
import ClientDiscovery from './ClientDiscovery.jsx';
import ReviewFeed from './ReviewFeed.jsx';
import LoopHealth from './LoopHealth.jsx';
import DbHealth from './DbHealth.jsx';
import Discussions from './Discussions.jsx';
import {
  ETERNAL_STAGES, stageOfProject, stageMeta, statusForStage, nextStage,
  stageProgress, lifecycleTrail, archivePatch, isArchived,
  markCompletePatch, reschedulePatch,
} from '../lib/project-management.js';
import { discussionsForProject, kindMeta } from '../lib/discussions.js';
import { evaluateHandoffGate, buildHandoff } from '../lib/orchestrator-handoff.js';

const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

// Defensive date parsing. A missing or malformed startDate must NEVER render as
// "12/31/1969" (epoch zero in local time), sort to the top of the timeline, or
// stretch the 12-month forecast back to 1970. Returns a valid Date or null;
// callers show an honest "date not set" affordance instead of a junk date.
// (Darrell, 2026-06-13: a synced project with a null start_date was showing
// 12/31/1969 — "this whole screen should be working.")
const safeDate = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const dateMs = (s) => { const d = safeDate(s); return d ? d.getTime() : Infinity; };

// -----------------------------------------------------------------------------
// BoardsOnTimeline — the work boards rendered ON the Projects timeline (DR-0120).
// One lane per live board: the phase walk (each group / swim lane as a chip —
// ✓ complete, ◐ current, ○ ahead), the honest done/total, and the nearest real
// due date. Under the lanes: the timeline CONTEXT feed — every recorded
// phase-complete moment (written by the finish ripple the instant a phase's
// last item goes done). Derived entirely from real board_tasks rows; an empty
// state says so honestly instead of painting lanes.
// -----------------------------------------------------------------------------
function BoardsOnTimeline({ tasks }) {
  const lanes = useMemo(() => boardTimelineLanes(tasks), [tasks]);
  const completions = useMemo(() => phaseCompletions(tasks), [tasks]);
  const when = (iso) => {
    const d = safeDate(iso);
    return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'date not recorded';
  };
  return (
    <section>
      <SectionTitle eyebrow="Coordination">Boards on the Timeline · Phase Walk</SectionTitle>
      {lanes.length === 0 ? (
        <div className="bg-white border border-[#E8E4DC] p-4 text-sm text-[#5A5751]">
          No board items yet — open <span aria-hidden="true">▦</span> Boards and load a program board&apos;s real items; each board then rides this timeline as a lane.
        </div>
      ) : (
        <div className="space-y-2">
          {lanes.map((lane) => (
            <div key={lane.slug} className="bg-white border border-[#E8E4DC] p-3">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-[#1A1815]"><span aria-hidden="true">▦</span> {lane.title}</span>
                <span className="text-xs text-[#5A5751]">
                  {lane.progress.done}/{lane.progress.total} done · {lane.progress.pct}%
                  {lane.nextDue ? ` · next due ${when(lane.nextDue)}` : ''}
                </span>
              </div>
              {/* The phase walk — the board's groups (swim lanes) in order. */}
              <div className="tab-scroll w-full overflow-x-auto overscroll-x-contain mt-2">
                <div className="flex items-center gap-1.5 min-w-max">
                  {lane.phases.map((ph, i) => {
                    const state = ph.complete ? 'complete' : (ph.label === lane.currentPhase ? 'current' : 'ahead');
                    const cls = state === 'complete'
                      ? 'border-[#5A6E3D] text-[#5A6E3D]'
                      : state === 'current' ? 'border-[#2A5A8E] text-[#2A5A8E]' : 'border-[#E8E4DC] text-[#5A5751]';
                    return (
                      <React.Fragment key={ph.label}>
                        {i > 0 && <span aria-hidden="true" className="text-[#5A5751] text-xs shrink-0">→</span>}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${cls}`}
                          title={`${ph.label}: ${ph.done}/${ph.total} done${ph.blocked ? ` · ${ph.blocked} blocked` : ''}`}
                        >
                          <span aria-hidden="true">{state === 'complete' ? '✓' : state === 'current' ? '◐' : '○'}</span>
                          {ph.label} <span className="text-[#5A5751]">{ph.done}/{ph.total}</span>
                          {ph.blocked > 0 && <span className="text-[#B85838]" aria-hidden="true">▲</span>}
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {/* The timeline context feed — recorded phase completions, newest first. */}
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-1">Timeline context · phases completed</div>
            {completions.length === 0 ? (
              <p className="text-xs text-[#5A5751]">
                None recorded yet. From now on, the moment a phase&apos;s last item is marked done, its completion lands here on its own — with the board, the phase, and the real moment it happened.
              </p>
            ) : (
              <ul className="space-y-1">
                {completions.map((c, i) => (
                  <li key={`${c.boardSlug}-${c.phase}-${c.at || i}`} className="text-xs text-[#1A1815]">
                    <span className="text-[#5A6E3D]" aria-hidden="true">✓</span>{' '}
                    Phase <span className="font-medium">“{c.phase}”</span> completed — {c.boardTitle}
                    <span className="text-[#5A5751]"> · {when(c.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// Per-user project scope (Darrell, 2026-06-13): "show me my projects since I'm
// logged in ... each user has their own list ... the whole family's projects can
// be in the same place." Real attribution — every project row carries created_by
// (the signed-in user who added it), surfaced here as `createdBy`. "Mine" = the
// projects I own; "Everyone" = the whole family's shared list. This filters on
// the real owner already stored on each project — no painted or invented data.
// "Mine" = a project I CREATED (created_by) OR one assigned to me personally
// (assignee_personas, migration 0005 — by persona so a member with more than one
// sign-in email matches once). No painted data — both are real fields on the row.
export const isMine = (p, userId, persona = null) => {
  if (!p) return false;
  if (userId && p.createdBy === userId) return true;
  if (persona && Array.isArray(p.assigneePersonas) && p.assigneePersonas.includes(persona)) return true;
  return false;
};
export const scopeProjects = (projects, userId, persona, scope) =>
  scope === 'mine' ? projects.filter(p => isMine(p, userId, persona)) : projects;
// Land a signed-in person on their OWN list when they have one (created or
// assigned) — but never on an empty screen if nothing is attributed to them yet:
// then fall back to everyone so real data always shows up.
export const defaultProjectScope = (projects, userId, persona) =>
  ((userId || persona) && projects.some(p => isMine(p, userId, persona))) ? 'mine' : 'all';

// Manual reprioritization (Darrell, 2026-06-13): "rearrange the list so we can
// reprioritize based on current needs." A persisted priority_rank the user sets
// by hand — the HUMAN-decide half of "system ranks, the human decides." Lower
// rank = higher priority; unranked (null) sorts after ranked and falls back to
// the timeline date order. The local-AI pushback half lands later (DR-0062) and
// proposes a rank; this hand-set order always wins.
export const rankOf = (p) => (p && p.priorityRank != null ? p.priorityRank : Infinity);
export const orderProjects = (list, mode) => {
  const arr = [...list];
  if (mode === 'priority') {
    arr.sort((a, b) => rankOf(a) - rankOf(b) || dateMs(a.startDate) - dateMs(b.startDate));
  } else {
    arr.sort((a, b) => dateMs(a.startDate) - dateMs(b.startDate));
  }
  return arr;
};
// Start in Priority order when the list already carries a hand-set order, so a
// reprioritized list stays reprioritized across visits; otherwise Timeline.
export const defaultOrderMode = (projects) =>
  projects.some(p => p && p.priorityRank != null) ? 'priority' : 'timeline';

// Build backlog #2 (ANXIETY-CLARITY): a project's NEXT ACTION and any BLOCKER,
// surfaced on the card so the list answers what's-next / what's-stuck at a
// glance. Free-text fields (migration 0006); these helpers report presence so
// the UI and any future "needs attention" roll-up read the same truth. Treats
// whitespace-only as empty so a stray space never reads as a real next step.
export const hasNextStep = (p) => !!(p && typeof p.nextStep === 'string' && p.nextStep.trim());
export const isBlocked = (p) => !!(p && typeof p.blocker === 'string' && p.blocker.trim());

// Reorder helper (build backlog #3): swap two items by id within a list,
// leaving every other element — including filter-hidden rows between them — in
// place. Moving a card "past the next visible one" while a filter hides rows is
// exactly this: swap the two visible ids inside the full ordered list. Returns
// the original list unchanged if either id is missing; never mutates the input.
export const swapById = (list, idA, idB) => {
  const arr = [...(list || [])];
  const i = arr.findIndex(p => p && p.id === idA);
  const j = arr.findIndex(p => p && p.id === idB);
  if (i < 0 || j < 0) return list;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  return arr;
};

// Closure lifecycle (2026-06-23 closure-lifecycle check). Closing a project is
// 100% manual + un-prompted, so a finished project lingers as active/overdue and
// inflates the live Active metric + 12-month forecast. These pure predicates make
// "closed" a single honest definition the counts AND the default list share:
//   complete  = the terminal "done" status
//   closed    = complete OR archived (parked with the archived note, isArchived)
// `openProjects` is the live, still-in-flight set — what the headline counts and
// the default list should reflect. Completed/archived stay findable via the
// "Show completed" toggle and the status filter; they're hidden, never dropped.
export const isComplete = (p) => !!p && p.status === 'complete';
export const isClosed = (p) => isComplete(p) || isArchived(p);
export const openProjects = (list) => (Array.isArray(list) ? list.filter(p => !isClosed(p)) : []);

// listVisible — the single predicate the default list uses, so the count and the
// rows agree. Domain + status filters apply as before; closed projects are hidden
// by default UNLESS the user opts in (showCompleted) or is explicitly filtering to
// a status (e.g. picks "complete"/"on-hold" in the dropdown), so closed work stays
// reachable without clutter in the everyday view.
export const listVisible = (p, { filterDomain = 'all', filterStatus = 'all', showCompleted = false } = {}) => {
  if (!p) return false;
  if (filterDomain !== 'all' && p.domain !== filterDomain) return false;
  if (filterStatus !== 'all') return p.status === filterStatus;
  if (!showCompleted && isClosed(p)) return false;
  return true;
};

const PROJECT_DOMAINS = [
  { key: 'personal', label: 'Personal', color: '#5A6E3D' },
  { key: 'family', label: 'Family', color: '#B85838' },
  { key: 'friends', label: 'Friends · Community', color: '#8B6F47' },
  { key: 'church', label: 'Church · Ministry', color: '#7A5A8E' },
  { key: 'business-poetech', label: 'Cornerstone Tech', color: '#1A1815' },
  { key: 'business-poeprops', label: 'Steward Real Estate', color: '#5A4A2E' },
  { key: 'business-tlc', label: 'Wellness Practice', color: '#3E6E78' },
  { key: 'business-uiuc', label: 'Regional University · Day Job', color: '#4A4A4A' },
  { key: 'tech', label: 'Tech · Repair · Build', color: '#2A5A8E' },
  { key: 'other', label: 'Other', color: '#5A5751' },
];
const PROJECT_STATUSES = ['planning', 'active', 'ending-soon', 'complete', 'on-hold', 'tbd'];

// MONTHS_ABBR duplicated locally — still in active use by the monolith
// (monthLabel + transaction display); duplicating instead of moving avoids
// creating a new no-undef there. Same pattern as Debts.jsx + Rentals.jsx.
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// CAPEX constants + SCOPE_TEMPLATES moved from poe-financial-mvp-v28.jsx (r41).
// All consumers were inside ProjectInventory / Scope (also moved below); the
// monolith had no remaining reference.
const CAPEX_STATUSES = ['planned','researching','wishlist','on-hold','purchased'];
const CAPEX_CATEGORIES = ['Networking','Tools','Storage','Home','Office','Vehicle','Software','Other'];

const SCOPE_TEMPLATES = [
  { id: 'tmpl-msw', name: 'MSW Clinical Contractor', type: 'clinical', description: 'For licensed clinical contractors joining the wellness practice', entityId: 'e-tlc',
    defaults: { title: 'Clinical Contractor Agreement', scopeOfWork: 'Provide licensed clinical mental health services to assigned clients of the practice.', deliverables: '• Documented clinical sessions within 48 hours\n• Monthly caseload report\n• Quarterly case review participation', materials: 'Practice provides: EHR access, billing infrastructure, referral pipeline.\nContractor provides: Personal LCSW license, individual malpractice coverage.', schedule: 'Minimum 15 client hours/week. Maximum 30/week.', paymentTerms: '60/40 split. Paid bi-monthly via 1099. W-9 required.', acceptanceCriteria: 'Sessions documented per state LCSW standards.', requirements: '• Active state LCSW license\n• Individual professional liability insurance\n• W-9 on file\n• HIPAA training current', warranty: 'Services meet state LCSW standards of care.', terminationClause: '30-day notice from either party.' }},
  { id: 'tmpl-prop', name: 'Property Contractor', type: 'property', description: 'For tradespeople servicing the real estate portfolio', entityId: 'e-poeprops',
    defaults: { title: 'Property Service Agreement', scopeOfWork: '[Describe specific work — what gets done, where, with what materials]', deliverables: '• Work meeting Illinois code\n• Photos of completed work\n• Final walkthrough', materials: '[Specify who provides what]', schedule: 'Start: [date]. Completion: [date].', paymentTerms: '50% deposit upon acceptance. 50% upon completion. Paid via 1099 if > $600/yr.', acceptanceCriteria: 'Work passes inspection. All systems function.', requirements: '• Active Illinois trade license\n• General liability insurance $1M+\n• W-9 on file', warranty: 'Labor warranty: 1 year. Materials per manufacturer.', terminationClause: '7 days written notice with cure opportunity.' }},
  { id: 'tmpl-blank', name: 'Custom Scope (blank)', type: 'custom', description: 'Start from scratch', entityId: 'e-personal', defaults: { title: 'Service Agreement', scopeOfWork: '', deliverables: '', materials: '', schedule: '', paymentTerms: '', acceptanceCriteria: '', requirements: '', warranty: '', terminationClause: '' }},
];

function ProjectsWrapper({ projects, scopes, entities, contractors = [], addProject, updateProject, deleteProject, addScope, deleteScope, capexItems = [], addCapexItem, updateCapexItem, deleteCapexItem, netCashFlow = 0, rentals = [], accounts = [], transactions = [], debts = [], feedbackPanel = null, currentUserId = null, currentUserPersona = null, familyMembers = [], isGovernor = false, loopData = {}, loopDecisions = {}, onLoopDecision = null, financialDocAt = null, discussions = [], addDiscussion = null, updateDiscussion = null, deleteDiscussion = null, wakeData = null, onNavigate = null, concerns = [], feedback = [], addConcern = null, updateConcern = null, deleteConcern = null }) {
  const [subView, setSubView] = useState('list');
  // Back returns from a Projects sub-tab (Discussions/Concerns/Scopes/etc.) to
  // the timeline list, then on up the app history — the device Back button no
  // longer jumps straight out of Projects. (lib/nav-history.js; base = 'list'.)
  useHistoryValue(subView, setSubView, { base: 'list', key: 'projects-sub' });
  // The governance queue names credentials, spend, and Tier-C activations — it
  // shows only for a signed-in family/governor account.
  // Feedback rides its OWN visible sub-tab with a live count (Darrell
  // 2026-07-07: he submitted feedback and couldn't find it — it rendered buried
  // below the fold of the list view). Count = real rows, shown even at zero.
  const tabs = [['list','Projects · Timeline'],['boards','▦ Boards'],['feedback', `◍ Feedback (${feedback.length})`],['discussions','💬 Discussions'],['concerns','⚠ Concerns & Solutions'],['scopes','Scopes · Agreements'],['inventory','Inventory · Capital Forecast'],['build','🛠 PoeTech Build']];
  if (isGovernor) tabs.push(['governance','⚖ Decisions']);
  // Loop Health (DR-0061/0075) — the app reviews its own loops; stagnant ones
  // ask the Governor to keep or retire them. Governor-gated like the rest.
  // The freshness-loop Review feed (DR-0072) used to be its own sub-tab, but it
  // sits at the same altitude as Loops ("the system watching itself") and its
  // name overloaded "review" against feedback — per the Projects coherence
  // review it now folds in here as the "what the loops are flowing" section.
  if (isGovernor) tabs.push(['loops','🩺 Loops']);
  // DB Health (DR-0084) — the app verifies its own schema: the real db-migrate
  // ledger (what applied / what failed / when), read from inside the app so a
  // governor never has to open a shell or Studio to confirm a migration landed.
  if (isGovernor) tabs.push(['db','DB Health']);
  // The delay ledger (DR-0115): request-to-finish vs should-have-taken, the
  // data-driven model-choice report Darrell ordered. Governor-only.
  if (isGovernor) tabs.push(['delays','◔ Delays']);
  // Recorded client discovery (cf-voice-discovery, DR-0114/0117): the review
  // gate where extracted requirements become build-board items by a steward's
  // hand. Governor-gated like the rest of the factory surfaces.
  if (isGovernor) tabs.push(['clients','◈ Clients']);
  return (
    <div className="space-y-4">
      {/* App Firm-Up / Completion headline — the live rollup of the whole build.
          Darrell 2026-07-01: the boards timeline IS the timeline for finishing
          the app, so overall % + projected finish + the persistent-backend share
          + the module-ledger line-count lead the hub. Reads the shared board
          store, so closing an item moves this on its own. */}
      <AppFirmUp onOpenBoards={() => setSubView('boards')} />
      {/* The sub-tab strip scrolls horizontally so every section stays reachable
          on a phone — Decisions / Loops fall off the right edge of a
          full-width <main> (#264) otherwise, and the un-scrollable overflow used
          to expose a white band beside the dark theme. <TabScroll> owns the
          scroll; see shared.jsx. */}
      <TabScroll className="border-b border-[#E8E4DC]" label="Project sections">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setSubView(id)} className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${subView === id ? 'border-[#B85838] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}>{label}</button>
        ))}
      </TabScroll>
      {subView === 'list' && (
        <>
          <Projects projects={projects} entities={entities} contractors={contractors} addProject={addProject} updateProject={updateProject} deleteProject={deleteProject} currentUserId={currentUserId} currentUserPersona={currentUserPersona} familyMembers={familyMembers} isGovernor={isGovernor} discussions={discussions} addDiscussion={addDiscussion} wakeData={wakeData} onOpenDiscussions={() => setSubView('discussions')} />
          {/* Feedback moved to its OWN sub-tab with a count (2026-07-07) — it
              rendered buried below the fold here and Darrell lost his own
              submission. See the 'feedback' branch below. */}
          {/* v28+ MVP v1.5 round 3 — Inventory + forecast also appears at the
              bottom of the Projects list so the connection is obvious. The
              dedicated Inventory sub-tab is where the editing/adding lives. */}
          <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} compact />
        </>
      )}
      {subView === 'boards' && (
        <ProjectBoards isGovernor={isGovernor} currentUserPersona={currentUserPersona} projects={projects} />
      )}
      {subView === 'feedback' && (
        <div className="space-y-4">
          {feedbackPanel || <p className="text-sm text-[#5A5751]">No feedback submissions yet — the FEEDBACK button on any page lands here.</p>}
        </div>
      )}
      {subView === 'discussions' && (
        <Discussions discussions={discussions} projects={projects} addDiscussion={addDiscussion} updateDiscussion={updateDiscussion} deleteDiscussion={deleteDiscussion} currentUserId={currentUserId} currentUserPersona={currentUserPersona} isGovernor={isGovernor} />
      )}
      {subView === 'concerns' && (
        <ConcernsBoard concerns={concerns} feedback={feedback} transactions={transactions} rentals={rentals} debts={debts} addConcern={addConcern} updateConcern={updateConcern} deleteConcern={deleteConcern} isGovernor={isGovernor} currentUserId={currentUserId} />
      )}
      {subView === 'scopes' && <Scope scopes={scopes} projects={projects} entities={entities} addScope={addScope} deleteScope={deleteScope} />}
      {subView === 'inventory' && <ProjectInventory projects={projects} entities={entities} capexItems={capexItems} addCapexItem={addCapexItem} updateCapexItem={updateCapexItem} deleteCapexItem={deleteCapexItem} netCashFlow={netCashFlow} rentals={rentals} accounts={accounts} />}
      {subView === 'build' && <BuildBoard isGovernor={isGovernor} onViewDecisions={() => setSubView('governance')} onNavigate={onNavigate} />}
      {subView === 'delays' && isGovernor && <DelayReport />}
      {subView === 'clients' && isGovernor && <ClientDiscovery />}
      {subView === 'governance' && isGovernor && (
        <GovernanceQueue
          appDecisions={deriveAppDecisions({ discussions, concerns })}
          familyInstanceId={(concerns.find((c) => c && c.tenantId)?.tenantId) || null}
          signedIn={!!currentUserId}
        />
      )}
      {subView === 'loops' && isGovernor && (
        <div className="space-y-6">
          <LoopHealth data={loopData} decisions={loopDecisions} onDecision={onLoopDecision} financialDocAt={financialDocAt} />
          {/* The freshness-loop Review feed, folded in from its former standalone
              sub-tab: Loops shows whether the loops are running; this shows what
              one of them (the freshness loop) is flowing for the Governor to
              keep or dismiss. Same altitude, one home. */}
          <ReviewFeed />
        </div>
      )}
      {subView === 'db' && isGovernor && <DbHealth />}
    </div>
  );
}

// ProjectConversationLog — per-project conversation thread (mirrors the
// pattern used on property records and Practice inquiries). State lives
// inside the component so each project keeps its own form / open-toggle.
function ProjectConversationLog({ project, updateProject }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const blank = () => ({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const addNote = () => {
    if (!form.summary) { alert('Summary is required.'); return; }
    const entry = { ...form, id: `cv-${Date.now()}` };
    updateProject(project.id, { conversationLog: [...(project.conversationLog || []), entry] });
    setForm(blank()); setShowForm(false);
  };
  const deleteNote = (entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateProject(project.id, { conversationLog: (project.conversationLog || []).filter(e => e.id !== entryId) });
  };
  const log = project.conversationLog || [];
  return (
    <div className="mt-3 pt-2 border-t border-[#E8E4DC]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">💬 Conversations · {log.length}</div>
        <button type="button" onClick={(e) => { e.preventDefault(); setShowForm(!showForm); setForm(blank()); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{showForm ? '× Cancel' : '+ Log a touchpoint'}</button>
      </div>
      {showForm && (
        <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <input className="p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Who: client / contractor / stakeholder" value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} />
          </div>
          <input className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'kickoff call, requirements confirmed'" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          <textarea className="w-full p-1.5 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" rows="2" placeholder="Notes · decisions · next step · who owns what" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button type="button" onClick={addNote} className="w-full bg-[#1A1815] text-white py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Note</button>
        </div>
      )}
      {log.length === 0 && !showForm ? (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
      ) : (
        <div className="space-y-1">
          {[...log].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                  <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                  {e.notes && <div className="text-[10px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                </div>
                <button type="button" onClick={() => deleteNote(e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ProjectClarity (build backlog #2) — the next action and any blocker, shown on
// the card and editable in place so the list answers what's-next / what's-stuck
// at a glance (ANXIETY-CLARITY). Free text; persists + syncs immediately via
// updateProject (UPDATE-only columns, migration 0006 — same path as assignees,
// so a not-yet-migrated column fails soft instead of breaking a create).
function ProjectClarity({ project, updateProject }) {
  const [editing, setEditing] = useState(null); // 'next' | 'blocker' | null
  const [draft, setDraft] = useState('');
  const nextStep = (project.nextStep || '').trim();
  const blocker = (project.blocker || '').trim();
  const begin = (field, current) => { setEditing(field); setDraft(current); };
  const commit = (field) => {
    const key = field === 'next' ? 'nextStep' : 'blocker';
    const val = draft.trim();
    const prev = field === 'next' ? nextStep : blocker;
    if (val !== prev) updateProject(project.id, { [key]: val });
    setEditing(null); setDraft('');
  };
  const onKey = (e, field) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(field); }
    else if (e.key === 'Escape') { e.preventDefault(); setEditing(null); setDraft(''); }
  };
  return (
    <div className="mb-2 space-y-1">
      {/* Next action */}
      {editing === 'next' ? (
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => commit('next')} onKeyDown={e => onKey(e, 'next')}
          placeholder="What's the next action?" aria-label={`Next step for ${project.title}`}
          className="w-full p-1.5 border border-[#5A6E3D] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#5A6E3D]" />
      ) : nextStep ? (
        <button type="button" onClick={() => begin('next', nextStep)} aria-label={`Edit next step for ${project.title}`}
          className="w-full text-left text-[11px] text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#5A6E3D] px-1.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="text-[#5A6E3D] font-semibold uppercase tracking-wider text-[10px] mr-1">▶ Next</span>{nextStep}
        </button>
      ) : (
        <button type="button" onClick={() => begin('next', '')} aria-label={`Add a next step for ${project.title}`}
          className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#5A6E3D] border border-transparent hover:border-[#5A6E3D] px-1.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#5A6E3D]">
          ▶ Add next step
        </button>
      )}
      {/* Blocker — only the warning treatment when one is actually set */}
      {editing === 'blocker' ? (
        <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onBlur={() => commit('blocker')} onKeyDown={e => onKey(e, 'blocker')}
          placeholder="What's blocking it? (empty = nothing)" aria-label={`Blocker for ${project.title}`}
          className="w-full p-1.5 border border-[#B85838] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
      ) : blocker ? (
        <button type="button" onClick={() => begin('blocker', blocker)} aria-label={`Edit blocker for ${project.title}`}
          className="w-full text-left text-[11px] text-[#1A1815] bg-[#FAF8F4] hover:bg-white border-l-2 border border-transparent border-l-[#B85838] hover:border-[#B85838] px-1.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>
          <span className="text-[#B85838] font-semibold uppercase tracking-wider text-[10px] mr-1">⛔ Blocked</span>{blocker}
        </button>
      ) : (
        <button type="button" onClick={() => begin('blocker', '')} aria-label={`Flag a blocker for ${project.title}`}
          className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] border border-transparent hover:border-[#B85838] px-1.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">
          + Flag a blocker
        </button>
      )}
    </div>
  );
}

// ProjectManage — the active-management panel that turns a project ROW from a
// view into a cockpit: move it through the eternal-sequence (Research → Plan →
// Execute → Done), see its real lifecycle trail, archive it, read the discussions
// driving it, and (governor) record a BRAKED hand-off to a lane. Everything reads
// or writes the REAL project fields (status + lifecycle, via updateProject) and
// the REAL discussions table — no painted state.
function ProjectManage({ project, updateProject, discussions = [], addDiscussion = null, currentUserPersona = null, isGovernor = false, wakeData = null, onOpenDiscussions = null }) {
  const [open, setOpen] = useState(false);
  const [lane, setLane] = useState('');
  const [handoffMsg, setHandoffMsg] = useState('');
  const stage = stageOfProject(project);
  const sm = stageMeta(stage);
  const prog = stageProgress(project);
  const next = nextStage(stage);
  const trail = lifecycleTrail(project);
  const driving = discussionsForProject(discussions, project.id);
  const archived = isArchived(project);

  const moveToStage = (stageKey, note) => {
    const status = statusForStage(stageKey);
    updateProject(project.id, { status, _by: 'user', _note: note || `moved to ${stageMeta(stageKey).label}` });
  };
  const doArchive = () => {
    if (!confirm(`Archive "${project.title}"? It's kept for the record, just out of the active list.`)) return;
    updateProject(project.id, archivePatch());
  };
  const doHandoff = () => {
    if (!addDiscussion) return;
    const gate = evaluateHandoffGate(wakeData);
    const record = buildHandoff({
      project, action: `at stage ${sm.label}`, lane, gate,
      persona: currentUserPersona, nowIso: new Date().toISOString(),
    });
    addDiscussion(record);
    setLane('');
    setHandoffMsg(gate.allowed
      ? 'Hand-off staged. Brakes are clear — it would run when the deep-drive is wired (still your call).'
      : `Hand-off staged + held by the Cage: ${gate.reasons[0] || 'a brake is holding'}`);
  };

  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen(!open)}
        className="text-xs uppercase tracking-wider text-[#2A5A8E] hover:text-white hover:bg-[#2A5A8E] border border-[#2A5A8E] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
        {open ? '× Close manage' : `🧭 Manage · ${sm.label}${driving.length ? ` · ${driving.length} discussion${driving.length === 1 ? '' : 's'}` : ''}`}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-[#FAF8F4] border border-[#2A5A8E] space-y-3">
          {/* Eternal-sequence stage control */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#2A5A8E] font-semibold mb-1.5">Eternal sequence · Research → Plan → Execute</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ETERNAL_STAGES.filter((s) => !s.terminal).map((s) => {
                const here = s.key === stage;
                return (
                  <button key={s.key} type="button" aria-pressed={here} onClick={() => moveToStage(s.key)}
                    className="text-[10px] px-2.5 py-1.5 border uppercase tracking-wider min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={here ? { backgroundColor: '#2A5A8E', color: 'white', borderColor: '#2A5A8E' } : { color: '#5A5751', borderColor: '#E8E4DC' }}>
                    {s.glyph} {s.label}
                  </button>
                );
              })}
              {next && (
                <button type="button" onClick={() => moveToStage(next, `advanced to ${stageMeta(next).label}`)}
                  className="text-[10px] px-2.5 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] uppercase tracking-wider min-h-[36px] hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                  ▶ Advance to {stageMeta(next).label}
                </button>
              )}
            </div>
            <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
              {sm.blurb}{prog.pct != null ? ` · ${prog.step} of ${prog.of}` : ' · parked'}
            </p>
          </div>

          {/* Real lifecycle trail */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">How it moved ({trail.length})</div>
            {trail.length === 0 ? (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No transitions logged yet.</p>
            ) : (
              <ul className="space-y-0.5">
                {trail.slice(0, 6).map((e, i) => (
                  <li key={i} className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{String(e.at || '').slice(0, 10)}</span>
                    {' · '}{e.fromPhase ? `${e.fromPhase} → ` : ''}<span className="text-[#1A1815]">{e.toPhase}</span>
                    {e.note ? ` — ${e.note}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Driving discussions */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[10px] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Discussions driving this ({driving.length})</div>
              {onOpenDiscussions && (
                <button type="button" onClick={onOpenDiscussions} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">+ open Discussions</button>
              )}
            </div>
            {driving.length === 0 ? (
              <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>None linked yet — capture one in the Discussions tab and link it to this project.</p>
            ) : (
              <ul className="space-y-0.5">
                {driving.slice(0, 5).map((d) => (
                  <li key={d.id} className="text-[11px]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <span aria-hidden="true">{kindMeta(d.kind).glyph}</span> <span className="text-[#5A5751] uppercase tracking-wider text-[9px]">{kindMeta(d.kind).label}</span> · {d.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Archive */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E8E4DC]">
            {archived ? (
              <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">⏸ Archived — kept for the record</span>
            ) : (
              <button type="button" onClick={doArchive} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-white border border-[#E8E4DC] hover:border-[#5A5751] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">⏸ Archive</button>
            )}
          </div>

          {/* Braked hand-off to a lane — governor only. Records the intent; the
              Cage governs whether it could ever run. Never auto-dispatches. */}
          {isGovernor && addDiscussion && (
            <div className="pt-2 border-t border-[#E8E4DC]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#2A5A8E] font-semibold mb-1">🛰 Hand off to a lane (braked)</div>
              <div className="flex flex-wrap items-center gap-1.5">
                <input value={lane} onChange={(e) => setLane(e.target.value)} placeholder="lane (e.g. church-build)"
                  aria-label={`Lane to hand ${project.title} off to`}
                  className="flex-1 min-w-[140px] p-1.5 border border-[#E8E4DC] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#2A5A8E]" />
                <button type="button" onClick={doHandoff}
                  className="text-[10px] px-2.5 py-1.5 border border-[#2A5A8E] text-[#2A5A8E] uppercase tracking-wider min-h-[36px] hover:bg-[#2A5A8E] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                  Stage hand-off
                </button>
              </div>
              {handoffMsg && <p className="text-[10px] text-[#1A1815] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{handoffMsg}</p>}
              <p className="text-[9px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                Records the intent as a hand-off discussion. It stays behind the Cage (budget + lock + kill-switch) — nothing auto-runs; the deep autonomous-drive is staged.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ProjectCloseControls — one-tap closing FROM THE ROW (2026-06-23 closure-lifecycle
// fix). Closing was 100% manual + buried in Manage -> Advance, so finished projects
// lingered as active/overdue and kept inflating the Active metric + 12-month
// forecast. This puts "✓ Mark complete" right where you see the project — controls
// in context, in place, no scroll-to-top, no view-snap. On an OVERDUE project it
// also offers "Reschedule" (an inline new end date) for work that slipped but isn't
// actually done — so the honest choice is one tap either way. Already-complete rows
// render nothing (there's nothing to close). Same updateProject write path the
// Manage panel uses, so the lifecycle trail records the close.
function ProjectCloseControls({ project, updateProject, isOverdue }) {
  const [rescheduling, setRescheduling] = useState(false);
  const [newEnd, setNewEnd] = useState(project.endDate || '');
  if (isComplete(project)) return null;
  const markComplete = () => updateProject(project.id, markCompletePatch());
  const saveReschedule = () => {
    if (!newEnd) return;
    updateProject(project.id, reschedulePatch(newEnd));
    setRescheduling(false);
  };
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={markComplete} aria-label={`Mark ${project.title} complete`}
        className="text-[10px] uppercase tracking-wider text-[#5A6E3D] hover:text-white hover:bg-[#5A6E3D] border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
        ✓ Mark complete
      </button>
      {isOverdue && !rescheduling && (
        <button type="button" onClick={() => { setNewEnd(project.endDate || ''); setRescheduling(true); }} aria-label={`Reschedule ${project.title}`}
          className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-white hover:bg-[#B85838] border border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
          ↻ Reschedule
        </button>
      )}
      {isOverdue && rescheduling && (
        <span className="flex flex-wrap items-center gap-1.5">
          <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} aria-label={`New end date for ${project.title}`}
            className="p-1.5 border border-[#B85838] text-xs bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" />
          <button type="button" onClick={saveReschedule} disabled={!newEnd}
            className="text-[10px] uppercase tracking-wider text-white bg-[#1A1815] hover:bg-[#B85838] border border-[#1A1815] px-3 py-1.5 min-h-[36px] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]">Save</button>
          <button type="button" onClick={() => setRescheduling(false)}
            className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] border border-transparent hover:border-[#5A5751] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
        </span>
      )}
    </div>
  );
}

function Projects({ projects, entities, contractors = [], addProject, updateProject, deleteProject, currentUserId = null, currentUserPersona = null, familyMembers = [], isGovernor = false, discussions = [], addDiscussion = null, wakeData = null, onOpenDiscussions = null }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [scope, setScope] = useState(() => defaultProjectScope(projects, currentUserId, currentUserPersona));
  const [orderMode, setOrderMode] = useState(() => defaultOrderMode(projects));
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  // Default view = active work only. Completed + archived projects are hidden
  // until the user flips this on (or filters to a closed status) — they stay
  // findable, just out of the everyday list. (2026-06-23 closure-lifecycle fix.)
  const [showCompleted, setShowCompleted] = useState(false);
  const [projError, setProjError] = useState('');
  const [openConvId, setOpenConvId] = useState(null);
  const [newProject, setNewProject] = useState({
    title: '', startDate: '', endDate: '', status: 'planning',
    domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal',
    contractorIds: []
  });

  const submitProject = () => {
    if (!newProject.title || !newProject.startDate) {
      setProjError('Title and start date are required.');
      return;
    }
    setProjError('');
    if (editingId) {
      updateProject(editingId, newProject);
      setEditingId(null);
    } else {
      addProject(newProject);
    }
    setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] });
    setShowForm(false);
  };

  const startEdit = (p) => {
    setNewProject({
      title: p.title, startDate: p.startDate, endDate: p.endDate || '',
      status: p.status, domain: p.domain, description: p.description || '',
      hoursPerWeek: p.hoursPerWeek || 0, entityId: p.entityId || 'e-personal',
      contractorIds: Array.isArray(p.contractorIds) ? p.contractorIds : []
    });
    setEditingId(p.id);
    setShowForm(false);
    setProjError('');
    // r19 — Inline edit per IN-PLACE-FIRST.md. The top "Add new" form stays
    // closed during edit; the same form mounts inline under the edited row.
    // Real Estate Quick-Edit pattern (shipped r7) — eyes stay where you tapped.
  };
  const cancelEdit = () => { setEditingId(null); setProjError(''); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); };

  // Per-user scope first: "Mine" (projects I own) vs "Everyone" (the whole
  // family's shared list). Everything below — stats, the 12-month workload, and
  // the list — reads from `scoped`, so each user sees a coherent picture of their
  // own perspective, or the family's, depending on the toggle.
  const scoped = useMemo(() => scopeProjects(projects, currentUserId, currentUserPersona, scope), [projects, currentUserId, currentUserPersona, scope]);
  // Headline counts reflect OPEN (still-in-flight) work only, so the "Mine/Everyone"
  // numbers are an honest active load — not all-time totals padded by finished +
  // archived projects. Matches the default list (which also hides closed). (2026-06-23.)
  const mineCount = useMemo(() => openProjects(projects.filter(p => isMine(p, currentUserId, currentUserPersona))).length, [projects, currentUserId, currentUserPersona]);
  const everyoneCount = useMemo(() => openProjects(projects).length, [projects]);

  // Order (Timeline by date, or the hand-set Priority order) THEN filter, so the
  // displayed list and the reorder controls agree on positions.
  const ordered = useMemo(() => orderProjects(scoped, orderMode), [scoped, orderMode]);
  const filtered = ordered.filter(p => listVisible(p, { filterDomain, filterStatus, showCompleted }));
  // How many closed projects the default view is hiding right now (for the toggle
  // label) — counted within the current scope + domain so the number matches what
  // flipping the toggle would reveal. Status filter is ignored here on purpose:
  // it's the toggle's own dimension.
  const hiddenClosedCount = useMemo(
    () => ordered.filter(p => isClosed(p) && (filterDomain === 'all' || p.domain === filterDomain)).length,
    [ordered, filterDomain]
  );

  // Hand reordering by priority. filtersActive still drives the COPY (we explain
  // the slide-past-hidden behavior), but reorder now works WITH filters on: a
  // move swaps the two VISIBLE neighbors' positions within the full ordered list
  // (swapById), leaving filter-hidden rows in place, then re-ranks the whole
  // list 0..n so the order is durable and syncs across devices.
  const filtersActive = filterDomain !== 'all' || filterStatus !== 'all';
  const canReorder = orderMode === 'priority' && filtered.length > 1;
  const moveProject = (index, dir) => {
    const j = dir === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= filtered.length) return;
    // Swap the two visible neighbors by id in the FULL ordered list (not just
    // `filtered`), so rows hidden by a domain/status filter keep their slot;
    // then persist a clean 0..n rank across everything in scope.
    const arr = swapById(ordered, filtered[index].id, filtered[j].id);
    arr.forEach((p, idx) => { if ((p.priorityRank ?? null) !== idx) updateProject(p.id, { priorityRank: idx }); });
  };

  // Compute timeline range. `now` is captured in a useMemo so the workload
  // useMemo below has a stable dep (otherwise it'd re-run every render).
  const now = useMemo(() => new Date(), []);
  const visibleProjects = filtered.filter(p => p.status !== 'complete');
  let earliestDate = now;
  let latestDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  visibleProjects.forEach(p => {
    const s = safeDate(p.startDate);
    if (!s) return; // undated project: don't let it stretch the timeline range
    const e = safeDate(p.endDate) || new Date(s.getFullYear(), s.getMonth() + 3, s.getDate());
    if (s < earliestDate) earliestDate = s;
    if (e > latestDate) latestDate = e;
  });
  const rangeStart = new Date(Math.min(earliestDate.getTime(), now.getTime() - 30*24*60*60000));
  const rangeEnd = new Date(latestDate.getTime() + 30*24*60*60000);
  // Preparatory scaffolding — pending timeline-summary chip ("X days of horizon").
  // eslint-disable-next-line no-unused-vars
  const totalDays = Math.max(1, (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

  // Workload calculation — sum of active project hours/week by month
  const monthlyWorkload = useMemo(() => {
    const months = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      months[key] = { label: MONTHS_ABBR[d.getMonth()] + " '" + String(d.getFullYear()).slice(2), hours: 0, projects: [] };
    }
    scoped.filter(p => p.status === 'active' || p.status === 'ending-soon').forEach(p => {
      const s = safeDate(p.startDate);
      if (!s) return; // undated project can't be placed on the forecast
      const e = safeDate(p.endDate) || new Date(s.getFullYear() + 1, s.getMonth(), s.getDate());
      Object.keys(months).forEach(key => {
        const [y, m] = key.split('-').map(Number);
        const monthStart = new Date(y, m, 1);
        const monthEnd = new Date(y, m + 1, 0);
        if (e >= monthStart && s <= monthEnd) {
          months[key].hours += (p.hoursPerWeek || 0);
          months[key].projects.push(p.title);
        }
      });
    });
    return months;
  }, [scoped, now]);

  // The boards ARE on the timeline (Darrell 2026-07-01 ruling; asked again
  // 2026-07-07): dated, not-done board items count into each forecast month.
  // HONEST count, never invented hours — a board item carries no hours/week.
  const boardTasks = useBoardTasks();
  const boardDue = useMemo(() => boardDueByMonth(boardTasks, { now }), [boardTasks, now]);

  // Preparatory scaffolding — pending "current month's committed hours" chip.
  // eslint-disable-next-line no-unused-vars
  const totalActiveHours = Object.values(monthlyWorkload).length > 0 ? Object.values(monthlyWorkload)[0].hours : 0;
  const peakWorkload = Math.max(...Object.values(monthlyWorkload).map(m => m.hours), 1);

  const domainColor = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.color || '#5A5751';
  const domainLabel = (key) => PROJECT_DOMAINS.find(d => d.key === key)?.label || key;
  const statusColor = (s) => s === 'active' ? '#5A6E3D' : s === 'ending-soon' ? '#B85838' : s === 'complete' ? '#5A5751' : s === 'on-hold' ? '#8B6F47' : '#1A1815';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Projects · Timeline · Workload</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>See your whole life at once.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Personal projects · family commitments · friend time · church work · day job · tech consulting · rental real estate · clinical practice · tech repairs. Every project has a start, an end, and a weekly load. Track them all in one place so you can see when things are heavy and when they ease up. Coordinate, not just survive.
        </p>
      </section>

      {/* Whose projects am I looking at? — the same data, seen from each user's
          own perspective. "Mine" is your own list; "Everyone" is the whole
          family's, all in one place. Plain words + counts so anyone, regardless
          of how technical they are, knows exactly what they're seeing. */}
      {currentUserId && projects.length > 0 && (
        <section className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Whose projects</span>
            <div className="flex" role="group" aria-label="Whose projects to show">
              {[['mine', `Mine (${mineCount})`], ['all', `Everyone (${everyoneCount})`]].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={scope === k}
                  onClick={() => setScope(k)}
                  className="text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  style={scope === k ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { color: '#5A5751', borderColor: '#E8E4DC' }}
                >{label}</button>
              ))}
            </div>
            <span className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
              {scope === 'mine' ? 'The projects you own.' : "Everyone's projects, in one place."}
            </span>
          </div>
        </section>
      )}

      {/* Snapshot stats — at a glance */}
      {scoped.length > 0 && (
        <section>
          <div className="grid grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="Active" value={`${scoped.filter(p => p.status === 'active').length}`} sub="in flight" small accent="green" />
            <MetricCell label="Ending soon" value={`${scoped.filter(p => p.status === 'ending-soon').length}`} sub="<30 days" small accent="rust" />
            <MetricCell label="Planning" value={`${scoped.filter(p => p.status === 'planning').length}`} sub="to launch" small />
            <MetricCell label="Total weekly" value={`${scoped.filter(p => p.status === 'active' || p.status === 'ending-soon').reduce((s,p) => s + (p.hoursPerWeek || 0), 0)}h`} sub="/wk active" small />
          </div>
        </section>
      )}

      {/* Workload visualization */}
      {scoped.length > 0 && (
        <section>
          <SectionTitle eyebrow="Coordination">12-Month Workload Forecast · Hours / Week</SectionTitle>
          <div className="bg-white border border-[#1A1815] p-5">
            <div className="space-y-1.5">
              {Object.entries(monthlyWorkload).map(([key, m], i) => {
                const pct = (m.hours / peakWorkload) * 100;
                const isHeavy = m.hours > 40;
                const isModerate = m.hours > 20 && m.hours <= 40;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#5A5751] w-12 shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.label}</div>
                    <div className="flex-1 h-5 bg-[#FAF8F4] border border-[#E8E4DC] relative">
                      <div className={`h-full ${isHeavy ? 'bg-[#B85838]' : isModerate ? 'bg-[#8B6F47]' : 'bg-[#5A6E3D]'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      {m.hours > 0 && <div className="absolute inset-0 flex items-center px-2 text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: isHeavy ? '#FAF8F4' : '#1A1815' }}>{m.hours}h/wk · {m.projects.length} active</div>}
                    </div>
                    {(boardDue[key] || 0) > 0 && (
                      <div className="text-xs text-[#5A5751] shrink-0">▦ {boardDue[key]} due</div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              Olive: sustainable (≤20h/wk added load) · Brown: stretched (20-40h) · Terracotta: overloaded (40+h). When you can see the heavy months coming, you can plan rest, delegate, or push timelines.
            </p>
          </div>
        </section>
      )}

      {/* Boards ON the timeline (DR-0120; Darrell 2026-07-01 + 2026-07-07: "why
          don't the boards show up on the timelines?"). Each live board is a
          LANE: its phase walk (the groups / swim lanes, in board order), the
          honest roll-up, and the phase it is currently in. Below the lanes,
          the timeline CONTEXT feed — every recorded phase completion, written
          the moment the last item of a phase went done (the finish ripple in
          use-board-tasks.patchTask). All derived from the real board_tasks
          rows and real recorded moments — never an invented date (DR-0076). */}
      <BoardsOnTimeline tasks={boardTasks} />

      {/* Filter + add */}
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Projects</h2>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Order: Timeline (by date) vs Priority (hand-set order you can
                rearrange). Switching to Priority reveals up/down controls. */}
            <div className="flex" role="group" aria-label="Order the list">
              {[['timeline', 'Timeline'], ['priority', 'Priority']].map(([k, label]) => (
                <button key={k} type="button" aria-pressed={orderMode === k} onClick={() => setOrderMode(k)}
                  className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  style={orderMode === k ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { color: '#5A5751', borderColor: '#E8E4DC' }}
                >{label}</button>
              ))}
            </div>
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
              <option value="all">All domains</option>
              {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <select className="text-xs p-1.5 border border-[#E8E4DC] bg-[#FAF8F4]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Show completed/archived — default view is active work only, so a
                finished project doesn't clutter the list (it also stops inflating
                the headline counts). One tap to bring closed work back into view;
                the status filter (above) still isolates a specific closed status.
                Hidden while a specific status is being filtered (the toggle has no
                effect then). (2026-06-23 closure-lifecycle fix.) */}
            {filterStatus === 'all' && (
              <button type="button" aria-pressed={showCompleted} onClick={() => setShowCompleted(v => !v)}
                className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                style={showCompleted ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { color: '#5A5751', borderColor: '#E8E4DC' }}>
                {showCompleted ? '✓ Showing completed' : `Show completed${hiddenClosedCount > 0 ? ` (${hiddenClosedCount})` : ''}`}
              </button>
            )}
            <button type="button" onClick={() => { setEditingId(null); setNewProject({ title: '', startDate: '', endDate: '', status: 'planning', domain: 'personal', description: '', hoursPerWeek: 0, entityId: 'e-personal', contractorIds: [] }); setShowForm(!showForm); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add project'}</button>
          </div>
        </div>

        {/* Priority mode — explain the hand-set order + honestly mark where the
            local AI's pushback will land (DR-0062: the AI proposes, you decide).
            No painted AI data: it says plainly it isn't active yet. */}
        {orderMode === 'priority' && (
          <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 mb-3 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            {filtersActive ? (
              <span>Ordering by priority with filters on — <span aria-hidden="true">▲ ▼</span> moves a card past the next <strong>visible</strong> one; rows hidden by the filter keep their place. Saves and syncs across your devices.</span>
            ) : (
              <span>Use <span aria-hidden="true">▲ ▼</span> on each project to set the order — top is highest priority. It saves and syncs across your devices.</span>
            )}
            <span className="block mt-1 italic text-[#8B6F47]">
              The local AI&apos;s suggested order isn&apos;t active yet — you&apos;re setting it by hand. When the orchestrator brain is on, it will propose an order here and you&apos;ll still have the final say.
            </span>
          </div>
        )}

        {/* r19 — Top form panel ONLY for ADD NEW. Edit happens inline under
            the edited row (see renderProjectForm + the row map below). */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">New project</div>
            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Project title (e.g., PoeTech v1 launch, kitchen renovation, mom's care plan)" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>
                  {PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week (estimate)</label>
                <input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity (optional)</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}>
                  <option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned (optional)</label>
              {contractors.length === 0 ? (
                <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s. They'll appear here as toggleable chips.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {contractors.map(k => {
                    const assigned = (newProject.contractorIds || []).includes(k.id);
                    return (
                      <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                        {assigned ? '✓ ' : ''}{k.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Optional — attach the 1099 workers helping with this project so YTD tracking and tax docs flow correctly.</p>
            </div>
            {/* Round 7 fix — bumped rows from 2 → 8 so multi-line descriptions
                (especially the auto-created "Wrap me with the tech" handoff
                from Dev/Ops, which includes the opportunity context) are fully
                visible and editable without scrolling inside the textarea. */}
            <div>
              <label htmlFor="proj-desc" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · key milestones · who's involved · opportunity context (for auto-created projects from Dev/Ops, this carries the example + tech-stack details — feel free to edit)</label>
              <textarea id="proj-desc" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" rows="8" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
            </div>
            {projError && <div className="text-xs text-[#B85838] mb-2 px-3 py-2 bg-[#FAF8F4] border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
            <button type="button" onClick={submitProject} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Project'}</button>
          </div>
        )}

        {/* "Mine" is empty but the family has projects — don't show the cold
            "no projects yet" / load-examples block (it would read as if their
            data vanished). Point them to Everyone or to adding their own. */}
        {filtered.length === 0 && !showForm && scope === 'mine' && projects.length > 0 && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              None of these projects are yours yet. Switch to <strong>Everyone</strong> to see the whole family&apos;s, or add one of your own — it&apos;ll show up in your list.
            </p>
            <button type="button" onClick={() => setScope('all')} className="text-[10px] uppercase tracking-wider px-4 py-2 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white">
              See everyone&apos;s projects ({projects.length})
            </button>
          </div>
        )}

        {/* Signed in with no projects: invite the FIRST real project (saved to
            your account), not example data that would just clutter your list. */}
        {filtered.length === 0 && !showForm && !(scope === 'mine' && projects.length > 0) && currentUserId && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              No projects yet. Add the things you&apos;re working on across your life — work, family, ministry, side projects, repairs. They&apos;re yours, saved to your account and synced across your devices.
            </p>
            <button type="button" onClick={() => { setEditingId(null); setShowForm(true); }} className="text-[10px] uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
              + Add your first project
            </button>
          </div>
        )}

        {/* Signed out / exploring: examples help someone see the workload view.
            They stay local (never upload) and so never pollute a real account. */}
        {filtered.length === 0 && !showForm && !(scope === 'mine' && projects.length > 0) && !currentUserId && (
          <div className="bg-white border border-[#E8E4DC] p-6 text-center">
            <p className="text-sm text-[#5A5751] italic mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
              No projects yet. Add the things you're working on across your life — work, family, ministry, side projects, repairs. The first ones often feel obvious; the value comes when you can see them all together.
            </p>
            <button type="button" onClick={() => {
              const examples = [
                { title: 'Cornerstone Tech v1 Public Launch · Loved Ones cohort', startDate: '2026-05-16', endDate: '2026-09-30', status: 'active', domain: 'business-poetech', description: 'Foundation launch through Cornerstone Community Church. Onboard first 100 founding families. Validate pricing tiers and core Financial module.', hoursPerWeek: 20, entityId: 'e-poetech' },
                { title: 'Hannah college transition', startDate: '2026-05-16', endDate: '2026-08-25', status: 'active', domain: 'family', description: 'Visits, paperwork, dorm prep, financial aid coordination, the goodbye conversations that matter.', hoursPerWeek: 4, entityId: 'e-personal' },
                { title: 'Sponsor outreach Q3 — first cohort', startDate: '2026-06-01', endDate: '2026-08-31', status: 'planning', domain: 'business-poetech', description: 'Reach out to Tier B + C targets. Sign 1 Module Sponsor + 2 Directory Partners by Sept.', hoursPerWeek: 5, entityId: 'e-poetech' },
                { title: '1521 Oak Ave — resolve LATE rent', startDate: '2026-05-16', endDate: '2026-06-15', status: 'ending-soon', domain: 'business-poeprops', description: 'Tenant conversation, payment plan or escalation. Recover $850 gap or transition unit.', hoursPerWeek: 3, entityId: 'e-poeprops' },
                { title: 'Wellness Practice — add 1-2 MSW contractors', startDate: '2026-06-01', endDate: '2026-09-15', status: 'planning', domain: 'business-tlc', description: 'Recruit through Naomi\'s clinical network. Each contractor = ~$2K/mo additional revenue.', hoursPerWeek: 4, entityId: 'e-tlc' },
                { title: 'Worldview teaching book · finish + publish', startDate: '2026-05-16', endDate: '2026-11-30', status: 'active', domain: 'business-poetech', description: 'Complete the book. Publishing submission. Print proof. Launch alongside Spiritual Life module.', hoursPerWeek: 6, entityId: 'e-poetech' },
              ];
              examples.forEach(ex => addProject(ex));
            }} className="text-[10px] uppercase tracking-wider px-4 py-2 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white">
              📋 Load 6 example projects to see how it works
            </button>
            <p className="text-[10px] text-[#5A5751] mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              You can delete any of the examples and add your own — they're just there to show the workload visualization at work.
            </p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((p, index) => {
              const now = new Date();
              const start = safeDate(p.startDate);
              const end = safeDate(p.endDate);
              const isOverdue = end && end < now && p.status !== 'complete';
              const daysUntilEnd = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
              const totalDays = (start && end) ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) : null;
              const daysElapsed = start ? Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24))) : 0;
              const progressPct = totalDays && totalDays > 0 ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
              return (
                <div key={p.id} className="bg-white border-l-4 border border-[#E8E4DC] p-4" style={{ borderLeftColor: domainColor(p.domain) }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {canReorder && (
                        <span className="flex flex-col shrink-0">
                          <button type="button" onClick={() => moveProject(index, 'up')} disabled={index === 0} aria-label={`Move ${p.title} up`} className="text-[10px] leading-none px-1.5 py-0.5 border border-[#E8E4DC] text-[#5A5751] hover:text-white hover:bg-[#1A1815] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">▲</button>
                          <button type="button" onClick={() => moveProject(index, 'down')} disabled={index === filtered.length - 1} aria-label={`Move ${p.title} down`} className="text-[10px] leading-none px-1.5 py-0.5 border border-t-0 border-[#E8E4DC] text-[#5A5751] hover:text-white hover:bg-[#1A1815] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">▼</button>
                        </span>
                      )}
                      {canReorder && <span className="text-[10px] text-[#5A5751] shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>#{index + 1}</span>}
                      <h4 className="text-base truncate" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{p.title}</h4>
                    </div>
                    {/* Round 7 — properly-sized Edit / Delete tap targets, divider between them. */}
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <span style={{ color: statusColor(p.status) }} className="font-medium px-2">{p.status}{p.status === 'tbd' && ' · parked'}</span>
                      {/* Round 11 — TBD projects show a "Promote → Active" button so the user
                          can flip them when capacity opens up. Plain text-only edit otherwise. */}
                      {p.status === 'tbd' && (
                        <>
                          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                          <button type="button" onClick={() => updateProject(p.id, { status: 'planning' })} aria-label={`Promote ${p.title} from TBD to planning`} className="text-xs uppercase tracking-wider text-[#5A6E3D] hover:text-white hover:bg-[#5A6E3D] border border-[#5A6E3D] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">▶ Promote</button>
                        </>
                      )}
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => startEdit(p)} aria-label={`Edit project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit</button>
                      <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC]" />
                      <button type="button" onClick={() => { if (confirm(`Delete project "${p.title}"?`)) deleteProject(p.id); }} aria-label={`Delete project ${p.title}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                    </div>
                  </div>
                  <div className="text-xs text-[#5A5751] mb-2">
                    <span style={{ color: domainColor(p.domain) }} className="font-medium">{domainLabel(p.domain)}</span>
                    <span> · </span>
                    {start
                      ? <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{start.toLocaleDateString()}</span>
                      : <button type="button" onClick={() => startEdit(p)} className="italic text-[#B85838] underline decoration-dotted hover:text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>start date not set — add one</button>}
                    {end && <><span> → </span><span style={{ fontFamily: '"JetBrains Mono", monospace' }} className={isOverdue ? 'text-[#B85838] font-medium' : ''}>{end.toLocaleDateString()}{isOverdue ? ' (overdue)' : daysUntilEnd > 0 && daysUntilEnd < 30 ? ` (${daysUntilEnd}d left)` : ''}</span></>}
                    {p.hoursPerWeek > 0 && <> · {p.hoursPerWeek}h/wk</>}
                  </div>
                  {/* One-tap close from the row (esp. for overdue rows that linger
                      as active + inflate the live numbers). Mark complete, or
                      reschedule a slipped-but-not-done project. (2026-06-23 fix.) */}
                  <ProjectCloseControls project={p} updateProject={updateProject} isOverdue={isOverdue} />
                  {Array.isArray(p.contractorIds) && p.contractorIds.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mb-2 flex flex-wrap gap-1.5">
                      <span className="uppercase tracking-wider">👤 1099:</span>
                      {p.contractorIds.map(cid => {
                        const k = contractors.find(c => c.id === cid);
                        return k ? <span key={cid} className="px-1.5 py-0.5 border border-[#E8E4DC] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>{k.name}</span> : null;
                      })}
                    </div>
                  )}
                  {/* Personal assignment (migration 0005) — assign a family
                      member and it shows up in their "Mine" list too. In-place
                      toggle chips; persists + syncs immediately. */}
                  {familyMembers.length > 0 && (
                    <div className="text-[10px] text-[#5A5751] mb-2 flex flex-wrap items-center gap-1.5">
                      <span className="uppercase tracking-wider">🧑‍🤝‍🧑 Assigned:</span>
                      {familyMembers.map(m => {
                        const on = Array.isArray(p.assigneePersonas) && p.assigneePersonas.includes(m.key);
                        return (
                          <button
                            type="button"
                            key={m.key}
                            onClick={() => {
                              const cur = Array.isArray(p.assigneePersonas) ? p.assigneePersonas : [];
                              const nextAssignees = on ? cur.filter(x => x !== m.key) : [...cur, m.key];
                              updateProject(p.id, { assigneePersonas: nextAssignees });
                            }}
                            aria-pressed={on}
                            aria-label={on ? `Unassign ${m.name} from ${p.title}` : `Assign ${m.name} to ${p.title}`}
                            className={`px-2 py-1 border uppercase tracking-wider min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'border-[#5A6E3D] bg-[#5A6E3D] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#5A6E3D] hover:text-[#1A1815]'}`}
                          >
                            {on ? '✓ ' : ''}{m.name}
                          </button>
                        );
                      })}
                      {(!Array.isArray(p.assigneePersonas) || p.assigneePersonas.length === 0) && (
                        <span className="italic" style={{ fontFamily: '"Fraunces", serif' }}>tap a name to add it to their list</span>
                      )}
                    </div>
                  )}
                  <ProjectClarity project={p} updateProject={updateProject} />
                  <ProjectManage project={p} updateProject={updateProject} discussions={discussions} addDiscussion={addDiscussion} currentUserPersona={currentUserPersona} isGovernor={isGovernor} wakeData={wakeData} onOpenDiscussions={onOpenDiscussions} />
                  {totalDays && p.status !== 'complete' && (
                    <div className="h-1 bg-[#E8E4DC] mb-2">
                      <div className="h-full" style={{ width: `${progressPct}%`, backgroundColor: domainColor(p.domain) }}></div>
                    </div>
                  )}
                  {p.description && <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{p.description}</p>}
                  <div className="mt-2">
                    {/* Round 9 — type="button" prevents default-submit behavior on browsers
                        that interpret a naked <button> as a form-submit even without a form
                        ancestor (which can scroll the page to the top under some conditions). */}
                    <button type="button" onClick={(e) => { e.preventDefault(); setOpenConvId(openConvId === p.id ? null : p.id); }} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                      {openConvId === p.id ? '× Close conversations' : `💬 Conversations (${(p.conversationLog || []).length})`}
                    </button>
                  </div>
                  {openConvId === p.id && <ProjectConversationLog project={p} updateProject={updateProject} />}
                  {/* r19 — Inline edit form, mounted DIRECTLY under the row
                      the user clicked Edit on. No jump-to-top, eyes stay put.
                      Per IN-PLACE-FIRST.md + Real Estate Quick-Edit pattern. */}
                  {editingId === p.id && (
                    <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {p.title}</div>
                        <button type="button" onClick={cancelEdit} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">× Cancel</button>
                      </div>
                      <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="Project title" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Start date</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">End date (target)</label><input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Domain</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.domain} onChange={e => setNewProject({...newProject, domain: e.target.value})}>{PROJECT_DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>{PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Hours / week</label><input type="number" min="0" step="1" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.hoursPerWeek} onChange={e => setNewProject({...newProject, hoursPerWeek: parseInt(e.target.value) || 0})} /></div>
                        <div><label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={newProject.entityId} onChange={e => setNewProject({...newProject, entityId: e.target.value})}><option value="e-personal">Personal</option><option value="e-poeprops">Steward Real Estate</option><option value="e-poetech">Cornerstone Tech</option><option value="e-tlc">Wellness Practice</option></select></div>
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1.5">1099 contractors assigned</label>
                        {contractors.length === 0 ? (
                          <div className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No contractors yet — add them in Books · 1099s.</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {contractors.map(k => {
                              const assigned = (newProject.contractorIds || []).includes(k.id);
                              return (
                                <button type="button" key={k.id} onClick={() => setNewProject({ ...newProject, contractorIds: assigned ? (newProject.contractorIds || []).filter(id => id !== k.id) : [...(newProject.contractorIds || []), k.id] })} className={`text-[10px] px-2 py-1 border uppercase tracking-wider ${assigned ? 'border-[#B85838] bg-[#B85838] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#1A1815]'}`}>
                                  {assigned ? '✓ ' : ''}{k.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <label htmlFor={`proj-desc-edit-${p.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Description · milestones · context</label>
                        <textarea id={`proj-desc-edit-${p.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" rows="6" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                      </div>
                      {projError && <div className="text-xs text-[#B85838] px-3 py-2 bg-white border border-[#B85838]" role="alert" style={{ fontFamily: '"Fraunces", serif' }}>{projError}</div>}
                      <div className="flex gap-2">
                        <button type="button" onClick={submitProject} className="flex-1 bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                        <button type="button" onClick={cancelEdit} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

// DateField - input type="date" with explicit year nav (arrows + dropdown)
// Browser native date picker keeps working; arrows step by 1 year, dropdown
// jumps to any year in range (currentYear - 5 to currentYear + 25).
function DateField({ value, onChange, className }) {
  const todayY = new Date().getFullYear();
  const currentYear = value && /^\d{4}-/.test(value) ? parseInt(value.slice(0, 4)) : todayY;
  const years = [];
  for (let y = currentYear - 10; y <= currentYear + 30; y++) years.push(y);
  const setYear = (year) => {
    if (!value) {
      const t = new Date();
      const m = String(t.getMonth() + 1).padStart(2, '0');
      const d = String(t.getDate()).padStart(2, '0');
      onChange(`${year}-${m}-${d}`);
      return;
    }
    const [, mm, dd] = value.split('-');
    onChange(`${year}-${mm || '01'}-${dd || '01'}`);
  };
  return (
    <div className={`flex items-center gap-1 ${className || ''}`}>
      <button type="button" onClick={() => setYear(currentYear - 1)} title="Previous year" aria-label="Previous year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">«</button>
      <input type="date" className="flex-1 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={value || ''} onChange={e => onChange(e.target.value)} />
      <button type="button" onClick={() => setYear(currentYear + 1)} title="Next year" aria-label="Next year" className="px-2 py-1.5 text-xs border border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815] bg-[#FAF8F4]">»</button>
      <select value={currentYear} onChange={e => setYear(parseInt(e.target.value))} className="p-2 border border-[#E8E4DC] text-xs bg-[#FAF8F4]" title="Jump to year" aria-label="Jump to year">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// =============================================================================
// ProjectInventory — moved from poe-financial-mvp-v28.jsx (r41) per
// MODULAR-EXTENSIBILITY.md. Only consumer was <ProjectsWrapper/> above; the
// monolith had no remaining reference.
// =============================================================================
function ProjectInventory({ projects = [], entities = [], capexItems = [], addCapexItem, updateCapexItem, deleteCapexItem, netCashFlow = 0, rentals = [], accounts = [], compact = false }) {
  const blankCapex = () => ({
    category: 'Tools', name: '', description: '', link: '',
    priority: 3, cost: 0, neededBy: '', status: 'researching', notes: '',
    entityId: entities[0]?.id || 'e-personal', module: '', projectId: '',
    purchaseTargetDate: '',
    locationId: '', purchasedFromAccountId: '',
    make: '', model: '', serial: '',
  });
  const [capexForm, setCapexForm] = useState(blankCapex());
  const [showCapexForm, setShowCapexForm] = useState(false);
  const [capexFilter, setCapexFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('all');

  const visibleCapex = capexItems.filter(c => {
    if (capexFilter !== 'all' && c.status !== capexFilter) return false;
    if (projFilter === 'all') return true;
    if (projFilter === 'unassigned') return !c.projectId;
    return c.projectId === projFilter;
  });

  const capexTotalPlanned = capexItems.filter(c => c.status !== 'purchased').reduce((s, c) => s + (parseFloat(c.cost) || 0), 0);

  const submitCapex = () => {
    if (!capexForm.name) { alert('Item name is required.'); return; }
    addCapexItem && addCapexItem(capexForm);
    setCapexForm(blankCapex()); setShowCapexForm(false);
  };

  const forecast = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: `${MONTHS_ABBR[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`, items: [], total: 0 });
    }
    let unscheduled = { key: 'unscheduled', label: 'Unscheduled', items: [], total: 0 };
    for (const c of capexItems) {
      if (c.status === 'purchased') continue;
      const cost = parseFloat(c.cost) || 0;
      if (!c.purchaseTargetDate) { unscheduled.items.push(c); unscheduled.total += cost; continue; }
      const d = new Date(c.purchaseTargetDate);
      if (isNaN(d.getTime())) { unscheduled.items.push(c); unscheduled.total += cost; continue; }
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find(m => m.key === key);
      if (bucket) { bucket.items.push(c); bucket.total += cost; }
      else if (d < now) {
        months[0].items.push({ ...c, _overdue: true });
        months[0].total += cost;
      } else {
        unscheduled.items.push(c); unscheduled.total += cost;
      }
    }
    return { months, unscheduled };
  }, [capexItems]);

  const today = new Date();
  const savingsPrompts = capexItems
    .filter(c => c.status !== 'purchased' && c.purchaseTargetDate && (parseFloat(c.cost) || 0) > 0)
    .map(c => {
      const target = new Date(c.purchaseTargetDate);
      const monthsLeft = Math.max(0, (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth()));
      const cost = parseFloat(c.cost) || 0;
      const perMonth = monthsLeft > 0 ? cost / monthsLeft : cost;
      return { ...c, monthsLeft, perMonth };
    })
    .sort((a, b) => a.monthsLeft - b.monthsLeft || b.perMonth - a.perMonth);

  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
  const projectLookup = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      {!compact && (
        <section className="bg-white border border-[#1A1815] p-5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Project Inventory · Capital Forecast</div>
          <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Tools you need · when you'll buy them · whether the money will be there.</h2>
          <p className="text-sm leading-relaxed mt-2 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Add equipment a project needs, give it a target purchase date, and the forecast below shows the month-by-month outflow against your current net cash flow. If a month doesn't pencil, the row turns amber so you know to push the date back or save harder before then.
          </p>
        </section>
      )}

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Items tracked" value={`${capexItems.length}`} small />
          <MetricCell label="Open spend" value={fmt(capexTotalPlanned)} sub="not yet purchased" small accent="rust" />
          <MetricCell label="Scheduled" value={`${capexItems.filter(c => c.purchaseTargetDate && c.status !== 'purchased').length}`} sub="have a target date" small />
          <MetricCell label="Net cash flow" value={fmt(netCashFlow)} sub="per mo · current" small accent={netCashFlow >= 0 ? 'green' : 'rust'} />
        </div>
      </section>

      <section aria-labelledby="forecast-h">
        <h3 id="forecast-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">12-Month Capital Forecast</h3>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#1A1815] bg-[#FAF8F4]">
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3 text-right">Projected outflow</th>
                <th scope="col" className="p-3 text-right">Gap vs net cash</th>
                <th scope="col" className="p-3">Items</th>
              </tr>
            </thead>
            <tbody>
              {forecast.months.map((m, i) => {
                const gap = netCashFlow - m.total;
                const short = m.total > 0 && gap < 0;
                return (
                  <tr key={m.key} className={`border-b border-[#E8E4DC] ${i % 2 === 1 ? 'bg-[#FAF8F4]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                    <td className="p-3" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{m.label}</td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: m.total > 0 ? 500 : 400 }}>
                      {m.total > 0 ? fmt(m.total) : <span className="text-[#5A5751]">—</span>}
                    </td>
                    <td className={`p-3 text-right ${short ? 'text-[#B85838] font-semibold' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {m.total > 0 ? (
                        <>
                          <span aria-hidden="true">{short ? '⚠ ' : '✓ '}</span>
                          <span className="sr-only">{short ? 'short by ' : 'covered, '}</span>
                          {fmt(gap)}
                        </>
                      ) : <span>—</span>}
                    </td>
                    <td className="p-3 text-xs">
                      {m.items.length === 0 ? <span className="text-[#5A5751]">—</span> : (
                        <div className="flex flex-wrap gap-1">
                          {m.items.map(it => (
                            <span key={it.id} className={`inline-flex items-baseline gap-1 px-2 py-0.5 border ${it._overdue ? 'border-[#B85838] text-[#B85838]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                              {it.name} <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {fmt(parseFloat(it.cost) || 0)}</span>
                              {it._overdue && <span className="text-[9px] uppercase tracking-wider">overdue</span>}
                              {it.projectId && projectLookup[it.projectId] && <span className="text-[9px] uppercase tracking-wider">· {(projectLookup[it.projectId].title || 'Untitled').slice(0, 20)}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {forecast.unscheduled.items.length > 0 && (
                <tr className="border-t-2 border-[#1A1815] bg-[#FAF8F4]" style={{ fontFamily: '"Fraunces", serif' }}>
                  <td className="p-3 text-[10px] uppercase tracking-wider text-[#5A5751]">Unscheduled</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(forecast.unscheduled.total)}</td>
                  <td className="p-3 text-right text-[10px] text-[#5A5751]">no target date set</td>
                  <td className="p-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {forecast.unscheduled.items.map(it => (
                        <span key={it.id} className="inline-flex items-baseline gap-1 px-2 py-0.5 border border-[#E8E4DC] text-[#5A5751]">{it.name} <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {fmt(parseFloat(it.cost) || 0)}</span></span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Each row compares projected outflows for that month against your <strong>current</strong> net cash flow ({fmt(netCashFlow)}/mo). Real net cash will shift with seasonality and rent collection — treat the gap column as a "talk about it now" signal, not a hard ledger.
        </p>
      </section>

      {savingsPrompts.length > 0 && (
        <section aria-labelledby="prompts-h">
          <h3 id="prompts-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2 pb-2 border-b border-[#1A1815]">Savings Prompts · per item with a target date</h3>
          <div className="bg-white border border-[#1A1815]">
            {savingsPrompts.map((p, i, arr) => {
              const overdue = p.monthsLeft === 0;
              const stretch = !overdue && p.perMonth > Math.max(0, netCashFlow);
              const tag = overdue ? 'overdue · lump sum needed' : stretch ? 'tight at current net cash' : 'fits at current net cash';
              const accent = overdue ? 'text-[#B85838]' : stretch ? 'text-[#B85838]' : 'text-[#5A6E3D]';
              return (
                <div key={p.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`} style={{ fontFamily: '"Fraunces", serif' }}>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm" style={{ fontWeight: 600 }}>{p.name}</div>
                      <div className="text-xs text-[#5A5751]">
                        {p.category} · target {p.purchaseTargetDate} · {fmt(parseFloat(p.cost) || 0)} total
                        {p.projectId && projectLookup[p.projectId] && <> · project: {projectLookup[p.projectId].title}</>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg ${accent}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                        {overdue ? `${fmt(parseFloat(p.cost) || 0)} now` : `${fmt(p.perMonth)}/mo`}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{p.monthsLeft} month{p.monthsLeft === 1 ? '' : 's'} left</div>
                    </div>
                  </div>
                  <div className={`text-[10px] uppercase tracking-wider mt-2 ${accent}`}>
                    {overdue ? '⚠' : stretch ? '⚠' : '✓'} <span className="sr-only">{overdue ? 'overdue ' : stretch ? 'stretch ' : 'fits '}</span>{tag}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Per-item set-aside = remaining cost ÷ months until target date. If the per-item ask exceeds your monthly net, the row warns — either push the date, lower the cost, or raise net (cut discretionary, close the rent gap).
          </p>
        </section>
      )}

      {!compact && (
        <section aria-labelledby="items-h">
          <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
            <h3 id="items-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">All Inventory Items · {capexItems.length}</h3>
            <button type="button" onClick={() => { setShowCapexForm(!showCapexForm); setCapexForm(blankCapex()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{showCapexForm ? '× Cancel' : '+ Add inventory item'}</button>
          </div>

          <div className="flex flex-wrap gap-1 mb-3 text-[10px] uppercase tracking-wider items-center">
            <span className="text-[#5A5751] mr-1">Status:</span>
            <button type="button" onClick={() => setCapexFilter('all')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${capexFilter === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>All</button>
            {CAPEX_STATUSES.map(s => (
              <button key={s} type="button" onClick={() => setCapexFilter(s)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${capexFilter === s ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{s}</button>
            ))}
            <span className="text-[#5A5751] mx-1">·</span>
            <span className="text-[#5A5751] mr-1">Project:</span>
            <button type="button" onClick={() => setProjFilter('all')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === 'all' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>Any</button>
            <button type="button" onClick={() => setProjFilter('unassigned')} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === 'unassigned' ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>Unassigned</button>
            {projects.map(p => (
              <button key={p.id} type="button" onClick={() => setProjFilter(p.id)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${projFilter === p.id ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{(p.title || 'Untitled').slice(0, 24)}</button>
            ))}
          </div>

          {showCapexForm && (
            <div className="bg-white border border-[#B85838] p-3 mb-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor="cx-cat" className={labelCls}>Category</label><select id="cx-cat" className={fieldCls} value={capexForm.category} onChange={e => setCapexForm({ ...capexForm, category: e.target.value })}>{CAPEX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="sm:col-span-3"><label htmlFor="cx-name" className={labelCls}>Item name</label><input id="cx-name" className={fieldCls} value={capexForm.name} onChange={e => setCapexForm({ ...capexForm, name: e.target.value })} /></div>
              </div>
              <div><label htmlFor="cx-desc" className={labelCls}>Description</label><input id="cx-desc" className={fieldCls} value={capexForm.description} onChange={e => setCapexForm({ ...capexForm, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor="cx-pri" className={labelCls}>Priority (1–5)</label><input id="cx-pri" type="number" min="1" max="5" className={fieldCls} value={capexForm.priority} onChange={e => setCapexForm({ ...capexForm, priority: e.target.value })} /></div>
                <div><label htmlFor="cx-cost" className={labelCls}>Cost</label><input id="cx-cost" type="number" step="0.01" min="0" inputMode="decimal" className={fieldCls} value={capexForm.cost} onChange={e => setCapexForm({ ...capexForm, cost: e.target.value })} /></div>
                <div><label htmlFor="cx-target" className={labelCls}>Target purchase date</label><input id="cx-target" type="date" className={fieldCls} value={capexForm.purchaseTargetDate} onChange={e => setCapexForm({ ...capexForm, purchaseTargetDate: e.target.value })} /></div>
                <div><label htmlFor="cx-stat" className={labelCls}>Status</label><select id="cx-stat" className={fieldCls} value={capexForm.status} onChange={e => setCapexForm({ ...capexForm, status: e.target.value })}>{CAPEX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label htmlFor="cx-proj" className={labelCls}>Linked project (optional)</label><select id="cx-proj" className={fieldCls} value={capexForm.projectId} onChange={e => setCapexForm({ ...capexForm, projectId: e.target.value })}><option value="">— none —</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                <div><label htmlFor="cx-ent" className={labelCls}>Entity</label><select id="cx-ent" className={fieldCls} value={capexForm.entityId} onChange={e => setCapexForm({ ...capexForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                <div><label htmlFor="cx-need" className={labelCls}>Needed by (free text)</label><input id="cx-need" className={fieldCls} placeholder="ASAP / Soon / Later" value={capexForm.neededBy} onChange={e => setCapexForm({ ...capexForm, neededBy: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="cx-loc" className={labelCls}>Purchased FOR (location / property)</label>
                  <select id="cx-loc" className={fieldCls} value={capexForm.locationId} onChange={e => setCapexForm({ ...capexForm, locationId: e.target.value })}>
                    <option value="">— not assigned to a property —</option>
                    {rentals.map(r => <option key={r.id} value={r.id}>{r.name}{r.city ? ` · ${r.city}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cx-acct" className={labelCls}>Purchased FROM (account that pays)</label>
                  <select id="cx-acct" className={fieldCls} value={capexForm.purchasedFromAccountId} onChange={e => setCapexForm({ ...capexForm, purchasedFromAccountId: e.target.value })}>
                    <option value="">— not specified —</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.fragment ? ` (${a.fragment})` : ''} · {a.type}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label htmlFor="cx-make" className={labelCls}>Make (brand)</label><input id="cx-make" className={fieldCls} placeholder="e.g., UniFi, Klein, Dell" value={capexForm.make} onChange={e => setCapexForm({ ...capexForm, make: e.target.value })} /></div>
                <div><label htmlFor="cx-model" className={labelCls}>Model #</label><input id="cx-model" className={fieldCls} placeholder="e.g., UCG-Max-NS" value={capexForm.model} onChange={e => setCapexForm({ ...capexForm, model: e.target.value })} /></div>
                <div><label htmlFor="cx-serial" className={labelCls}>Serial #</label><input id="cx-serial" className={fieldCls} placeholder="warranty / theft recovery" value={capexForm.serial} onChange={e => setCapexForm({ ...capexForm, serial: e.target.value })} /></div>
              </div>
              <div><label htmlFor="cx-link" className={labelCls}>Link (optional)</label><input id="cx-link" type="url" className={fieldCls} placeholder="https://..." value={capexForm.link} onChange={e => setCapexForm({ ...capexForm, link: e.target.value })} /></div>
              <div><label htmlFor="cx-notes" className={labelCls}>Notes</label><input id="cx-notes" className={fieldCls} value={capexForm.notes} onChange={e => setCapexForm({ ...capexForm, notes: e.target.value })} /></div>
              <button type="button" onClick={submitCapex} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save Inventory Item</button>
            </div>
          )}

          {visibleCapex.length === 0 ? (
            <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{capexItems.length === 0 ? 'No inventory items yet. Add the first one above.' : 'No items match this filter.'}</p>
          ) : (
            <div className="bg-white border border-[#1A1815]">
              {[...visibleCapex].sort((a, b) => (a.priority || 99) - (b.priority || 99) || (b.cost || 0) - (a.cost || 0)).map((c, i, arr) => (
                <div key={c.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider text-[#B85838] font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>P{c.priority || '?'}</span>
                        <span className="text-[10px] uppercase tracking-wider text-[#5A5751]">{c.category}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{c.name}</span>
                        {c.link && <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">link →</a>}
                      </div>
                      {c.description && <div className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{c.description}</div>}
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">
                        {c.purchaseTargetDate && <>target {c.purchaseTargetDate}{c.projectId && projectLookup[c.projectId] ? ' · ' : ''}</>}
                        {c.projectId && projectLookup[c.projectId] && <>project: {projectLookup[c.projectId].title}</>}
                        {!c.purchaseTargetDate && !c.projectId && <span className="italic">unscheduled · unlinked</span>}
                      </div>
                      {(c.locationId || c.purchasedFromAccountId || c.make || c.model || c.serial) && (
                        <div className="text-[10px] text-[#5A5751] mt-1 space-x-2" style={{ fontFamily: '"Fraunces", serif' }}>
                          {c.locationId && rentals.find(r => r.id === c.locationId) && <span>📍 for <strong>{rentals.find(r => r.id === c.locationId).name}</strong></span>}
                          {c.purchasedFromAccountId && accounts.find(a => a.id === c.purchasedFromAccountId) && <span>💳 paid via <strong>{accounts.find(a => a.id === c.purchasedFromAccountId).name}</strong></span>}
                          {(c.make || c.model) && <span>🔖 {[c.make, c.model].filter(Boolean).join(' ')}</span>}
                          {c.serial && <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>S/N {c.serial}</span>}
                        </div>
                      )}
                      {c.notes && <div className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{c.notes}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{c.cost ? fmt(c.cost) : '—'}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{c.status}{c.neededBy ? ` · ${c.neededBy}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <label htmlFor={`cx-edit-stat-${c.id}`} className="sr-only">Status for {c.name}</label>
                    <select id={`cx-edit-stat-${c.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.status} onChange={e => updateCapexItem && updateCapexItem(c.id, { status: e.target.value })}>
                      {CAPEX_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label htmlFor={`cx-edit-proj-${c.id}`} className="sr-only">Project for {c.name}</label>
                    <select id={`cx-edit-proj-${c.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.projectId || ''} onChange={e => updateCapexItem && updateCapexItem(c.id, { projectId: e.target.value })}>
                      <option value="">— no project —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <label htmlFor={`cx-edit-date-${c.id}`} className="sr-only">Target date for {c.name}</label>
                    <input id={`cx-edit-date-${c.id}`} type="date" className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={c.purchaseTargetDate || ''} onChange={e => updateCapexItem && updateCapexItem(c.id, { purchaseTargetDate: e.target.value })} />
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                    <button type="button" onClick={() => { if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteCapexItem && deleteCapexItem(c.id); }} aria-label={`Delete ${c.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {compact && (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          Add or edit inventory items in the <strong>Inventory · Capital Forecast</strong> sub-tab above.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Scope + ScopeForm + ScopeView + FormField — moved from
// poe-financial-mvp-v28.jsx (r41). Only consumer was <ProjectsWrapper/> above;
// the monolith had no remaining reference.
// =============================================================================
function Scope({ scopes, projects = [], entities, addScope, deleteScope }) {
  const [mode, setMode] = useState('list');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeScopeId, setActiveScopeId] = useState(null);
  const [formData, setFormData] = useState({});

  const startNew = (t) => { setSelectedTemplate(t); setFormData({ templateType: t.type, templateName: t.name, ...t.defaults, entityId: t.entityId, contractorName: '', contractorEmail: '', contractorPhone: '', projectId: '' }); setMode('new'); };
  const saveNew = () => { if (!formData.title || !formData.contractorName) { alert('Title and contractor name are required.'); return; } addScope(formData); setMode('list'); setFormData({}); };
  const viewScope = (s) => { setActiveScopeId(s.id); setMode('view'); };
  const activeScope = scopes.find(s => s.id === activeScopeId);

  if (mode === 'view' && activeScope) {
    return <ScopeView scope={activeScope} projects={projects} entities={entities} onBack={() => setMode('list')} onDelete={() => { if (confirm('Delete this scope?')) { deleteScope(activeScope.id); setMode('list'); } }} />;
  }
  if (mode === 'new') {
    return <ScopeForm formData={formData} setFormData={setFormData} projects={projects} entities={entities} templateName={selectedTemplate?.name} onSave={saveNew} onCancel={() => { setMode('list'); setFormData({}); }} />;
  }
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle eyebrow="Scope of Work">Contractor Agreements</SectionTitle>
        <p className="text-sm text-[#5A5751] leading-relaxed max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>Before work begins, write the scope. Both sides agree. Reviews anchor to the scope, not evolving wishes. Each scope can stand alone OR link to an internal project so the work is tracked in the right timeline.</p>
      </section>
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Start from a template</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SCOPE_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => startNew(t)} className="bg-white border border-[#1A1815] p-4 text-left hover:border-[#B85838]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-1">{t.type}</div>
              <h4 className="text-lg mb-2" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{t.name}</h4>
              <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{t.description}</p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-3 pb-2 border-b border-[#1A1815]">Your scopes ({scopes.length})</h3>
        {scopes.length === 0 ? (
          <div className="bg-white border border-[#E8E4DC] p-8 text-center"><p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No scopes yet. Pick a template above.</p></div>
        ) : (
          <div className="space-y-2">
            {scopes.map(s => { const entity = entities.find(e => e.id === s.entityId); const proj = projects.find(p => p.id === s.projectId); return (
              <button key={s.id} onClick={() => viewScope(s)} className="w-full text-left bg-white border border-[#1A1815] p-4 hover:border-[#B85838]">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div>
                    <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{s.title}</div>
                    <div className="text-xs text-[#5A5751] mt-1">{s.contractorName} · {entity?.name.split('(')[0].trim()}</div>
                    {proj && <div className="text-[10px] uppercase tracking-wider text-[#5A6E3D] mt-1 font-medium">⛓ Linked to: {proj.title}</div>}
                    {!proj && s.projectId === '' && <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mt-1">Standalone</div>}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{s.status}</div>
                </div>
              </button>
            );})}
          </div>
        )}
      </section>
    </div>
  );
}

function ScopeForm({ formData, setFormData, projects = [], entities, templateName, onSave, onCancel }) {
  const update = (f) => (e) => setFormData({ ...formData, [f]: e.target.value });
  return (
    <div className="space-y-4 max-w-3xl">
      <section className="flex items-baseline justify-between border-b border-[#1A1815] pb-3">
        <div><div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-medium">New Scope · {templateName}</div><h2 className="text-xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Fill out the agreement</h2></div>
        <button type="button" onClick={onCancel} className="text-[10px] uppercase tracking-wider text-[#5A5751]">× Cancel</button>
      </section>
      <FormField label="Job title *"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.title || ''} onChange={update('title')} /></FormField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Entity"><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.entityId || 'e-personal'} onChange={update('entityId')}>{entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></FormField>
        <FormField label="Link to internal project (optional)"><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.projectId || ''} onChange={update('projectId')}>
          <option value="">— Standalone (no project)</option>
          {projects.filter(p => p.status !== 'complete').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Contractor name *"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorName || ''} onChange={update('contractorName')} /></FormField>
        <FormField label="Email"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorEmail || ''} onChange={update('contractorEmail')} /></FormField>
        <FormField label="Phone"><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={formData.contractorPhone || ''} onChange={update('contractorPhone')} /></FormField>
      </div>
      <FormField label="Scope of work"><textarea rows="4" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.scopeOfWork || ''} onChange={update('scopeOfWork')} /></FormField>
      <FormField label="Deliverables"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.deliverables || ''} onChange={update('deliverables')} /></FormField>
      <FormField label="Materials"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.materials || ''} onChange={update('materials')} /></FormField>
      <FormField label="Schedule"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.schedule || ''} onChange={update('schedule')} /></FormField>
      <FormField label="Who pays for materials? (drives payment terms)">
        <select
          className="w-full p-2 border border-[#E8E4DC] text-sm bg-white"
          value={formData.materialsPaidBy || 'contractor'}
          onChange={(e) => {
            const who = e.target.value;
            const suggested =
              who === 'owner'        ? 'Owner supplies all materials. Contractor invoices labor ONLY. Default: pay full balance within 7 days of acceptance walkthrough. If contractor needs start money (helpers, small startup costs), 20% labor-only deposit on day 1; balance at acceptance.' :
              who === 'split'        ? 'Materials split per the Materials section above. Deposit covers contractor-supplied materials only (typically 50% of contractor materials). Balance + labor at acceptance.' :
                                       '50% deposit on materials delivery to cover contractor outlay. 50% balance within 7 days of acceptance walkthrough. Paid via 1099 (W-9 on file).';
            setFormData({ ...formData, materialsPaidBy: who, paymentTerms: suggested });
          }}
        >
          <option value="contractor">Contractor supplies materials → 50% / 50%</option>
          <option value="owner">Owner supplies materials → pay at completion (or 20% start)</option>
          <option value="split">Split → negotiated terms</option>
        </select>
        <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          <strong>Policy:</strong> When the owner pays for materials, the contractor isn't fronting that cost — so a 50% material-style deposit isn't fair. Default is "pay full at completion," with a 20% labor-only start fee available if the contractor needs help-hire money or small startup outlay. Picking an option auto-fills the Payment Terms below; you can still edit.
        </p>
      </FormField>
      <FormField label="Payment terms"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.paymentTerms || ''} onChange={update('paymentTerms')} /></FormField>
      <FormField label="Acceptance criteria"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.acceptanceCriteria || ''} onChange={update('acceptanceCriteria')} /></FormField>
      <FormField label="Requirements"><textarea rows="3" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.requirements || ''} onChange={update('requirements')} /></FormField>
      <FormField label="Warranty"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.warranty || ''} onChange={update('warranty')} /></FormField>
      <FormField label="Termination"><textarea rows="2" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white font-mono" value={formData.terminationClause || ''} onChange={update('terminationClause')} /></FormField>
      <div className="flex gap-2 pt-3 border-t border-[#1A1815]">
        <button type="button" onClick={onSave} className="bg-[#1A1815] text-[#FAF8F4] px-6 py-2.5 text-xs uppercase tracking-wider">Save</button>
        <button type="button" onClick={onCancel} className="border border-[#1A1815] px-6 py-2.5 text-xs uppercase tracking-wider">Cancel</button>
      </div>
    </div>
  );
}

function ScopeView({ scope, projects = [], entities, onBack, onDelete }) {
  const entity = entities.find(e => e.id === scope.entityId);
  // Preparatory scaffolding — pending "Linked to: <project>" header in this view.
  // eslint-disable-next-line no-unused-vars
  const linkedProject = projects.find(p => p.id === scope.projectId);
  return (
    <div className="space-y-4 max-w-3xl">
      <section className="flex items-baseline justify-between border-b border-[#1A1815] pb-3 print:hidden">
        <button type="button" onClick={onBack} className="text-[10px] uppercase tracking-wider">← Back</button>
        <div className="flex gap-3"><button type="button" onClick={() => window.print()} className="text-[10px] uppercase tracking-wider text-[#B85838]">⎙ Print</button><button type="button" onClick={onDelete} className="text-[10px] uppercase tracking-wider">× Delete</button></div>
      </section>
      <div className="bg-white border border-[#1A1815] p-6 sm:p-8 print:border-0 print:p-0">
        <div className="text-center mb-6 pb-6 border-b border-[#E8E4DC]">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] mb-1">Scope of Work · {scope.templateType}</div>
          <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{scope.title}</h1>
        </div>
        <div className="space-y-5 text-sm leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E8E4DC]">
            <div><div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1">Engaging Entity</div><div>{entity?.name}</div></div>
            <div><div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1">Contractor</div><div>{scope.contractorName}</div></div>
          </div>
          {[['Scope of Work', scope.scopeOfWork], ['Deliverables', scope.deliverables], ['Materials', scope.materials], ['Schedule', scope.schedule], ['Payment Terms', scope.paymentTerms], ['Acceptance', scope.acceptanceCriteria], ['Requirements', scope.requirements], ['Warranty', scope.warranty], ['Termination', scope.terminationClause]].map(([t, c]) => c && c.trim() ? (
            <div key={t}><div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-1.5">{t}</div><div className="whitespace-pre-line">{c}</div></div>
          ) : null)}
        </div>
        <div className="mt-8 pt-6 border-t border-[#1A1815]">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-4">Acknowledgement</div>
          <div className="grid grid-cols-2 gap-8">
            <div><div className="border-b border-[#1A1815] h-8"></div><div className="text-xs text-[#5A5751] mt-1">{entity?.name.split('(')[0].trim()}</div></div>
            <div><div className="border-b border-[#1A1815] h-8"></div><div className="text-xs text-[#5A5751] mt-1">{scope.contractorName}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) { return (<div><label className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] mb-1 block">{label}</label>{children}</div>); }

export { ProjectsWrapper, Projects, ProjectInventory, ProjectConversationLog, DateField, PROJECT_DOMAINS, PROJECT_STATUSES };
export default ProjectsWrapper;
