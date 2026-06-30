// =============================================================================
// board — pure domain logic for the working Project Boards (Monday.com-style)
// =============================================================================
// Declared by Darrell (2026-06-30): the Projects tab must be a REAL, working
// board system inside PoeTech, where all the work is tracked and DRIVEN forward
// from inside the app. Boards with items, STATUS labels, OWNERS, dates, and
// PROGRESS that rolls up per board — live on the shared-persistence backbone,
// synced, RLS-safe (0057 board_tasks). NOT static like the old BuildBoard.
//
// THE MODEL — one data model, two views (coordinates with the Projects hub):
//   * A BOARD is identified by `boardSlug` (+ a display `boardTitle`). It maps to
//     a real project's slug OR to a program board ('board-*'). No boards table —
//     a board exists when it has a task, or a SEED_BOARD names it.
//   * A TASK (board_tasks row) is one item: title + status + owner + dates +
//     group (the column within a board). Progress rolls up per boardSlug from
//     these REAL rows — done/total, an honest derived percent (DR-0076), null
//     when a board is empty (no fake bar), never a painted number.
//
// This file is PURE (no React, no network) so every helper is unit-testable and
// the rollup gate can prove it catches a miscount. The seed specs below are REAL
// current work (grounded in the module-cutover plan, the church infra program,
// the financial loops, TLC training, and succession) with HONEST status on each
// item — a done item is only marked done where it is verifiably shipped.
// =============================================================================

// The four board statuses. Mapped onto the app's THEMED accent tokens (the three
// the contrast guard remaps per-theme + textSecondary grey), so every chip is
// per-theme contrast-safe and never introduces an un-themeable raw hex:
//   not-started -> grey  (#5A5751 textSecondary)  "not begun"
//   in-progress -> blue  (#2A5A8E accentBlue)     "working on it"
//   blocked     -> rust  (#B85838 accentRust)     "stuck — needs attention"
//   done        -> olive (#5A6E3D accentGreen)    "finished"
export const BOARD_STATUS = {
  'not-started': { label: 'Not started', color: '#5A5751', text: 'text-[#5A5751]', bg: 'bg-[#5A5751]', border: 'border-[#5A5751]', symbol: '○', blurb: 'Not begun' },
  'in-progress': { label: 'In progress', color: '#2A5A8E', text: 'text-[#2A5A8E]', bg: 'bg-[#2A5A8E]', border: 'border-[#2A5A8E]', symbol: '◐', blurb: 'Being worked' },
  'blocked':     { label: 'Blocked',     color: '#B85838', text: 'text-[#B85838]', bg: 'bg-[#B85838]', border: 'border-[#B85838]', symbol: '▲', blurb: 'Stuck — needs attention' },
  'done':        { label: 'Done',        color: '#5A6E3D', text: 'text-[#5A6E3D]', bg: 'bg-[#5A6E3D]', border: 'border-[#5A6E3D]', symbol: '✓', blurb: 'Finished' },
};
export const BOARD_STATUS_ORDER = ['not-started', 'in-progress', 'blocked', 'done'];

export function statusMeta(status) {
  return BOARD_STATUS[status] || BOARD_STATUS['not-started'];
}

// The next status in the cycle when you tap the status chip (Monday.com-style
// one-tap advance): not-started -> in-progress -> blocked -> done -> not-started.
export function nextStatus(status) {
  const i = BOARD_STATUS_ORDER.indexOf(status);
  return BOARD_STATUS_ORDER[(i + 1) % BOARD_STATUS_ORDER.length];
}

const DEFAULT_GROUP = 'General';
export function groupLabelOf(task) {
  const g = task && typeof task.group === 'string' ? task.group.trim() : '';
  return g || DEFAULT_GROUP;
}

// -----------------------------------------------------------------------------
// boardProgress — the honest roll-up that drives the per-board progress bar and
// the board-selector pills. Pure tally of the REAL rows passed in (already
// instance/role-scoped by the caller). pct = done / total, rounded. When a board
// has NO tasks, pct is null — the UI shows "no items yet", never a fake 0%/100%
// bar (DR-0076: verifiably right or marked unverified).
// -----------------------------------------------------------------------------
export function boardProgress(tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  const by = { 'not-started': 0, 'in-progress': 0, 'blocked': 0, 'done': 0 };
  for (const t of list) {
    const s = BOARD_STATUS[t && t.status] ? t.status : 'not-started';
    by[s] += 1;
  }
  const total = list.length;
  const done = by.done;
  return {
    total,
    done,
    inProgress: by['in-progress'],
    blocked: by.blocked,
    notStarted: by['not-started'],
    pct: total ? Math.round((done / total) * 100) : null,
  };
}

// -----------------------------------------------------------------------------
// sortTasks — order items within a group: hand-set sortRank first (lower = top),
// then not-started/in-progress/blocked ahead of done, then nearest due date, then
// stable insertion order. Done items sink so the live work is at the top.
// -----------------------------------------------------------------------------
const STATUS_WEIGHT = { 'blocked': 0, 'in-progress': 1, 'not-started': 2, 'done': 3 };
function dueKey(t) {
  const v = Date.parse((t && t.dueDate) || '');
  return Number.isNaN(v) ? Infinity : v;
}
export function sortTasks(list) {
  return [...(Array.isArray(list) ? list : [])]
    .map((t, i) => [t, i])
    .sort((a, b) => {
      const ra = a[0]?.sortRank, rb = b[0]?.sortRank;
      if (ra != null || rb != null) {
        return (ra == null ? Infinity : ra) - (rb == null ? Infinity : rb) || (a[1] - b[1]);
      }
      const wa = STATUS_WEIGHT[a[0]?.status] ?? 2, wb = STATUS_WEIGHT[b[0]?.status] ?? 2;
      if (wa !== wb) return wa - wb;
      const da = dueKey(a[0]), db = dueKey(b[0]);
      if (da !== db) return da - db;
      return a[1] - b[1];
    })
    .map(([t]) => t);
}

// -----------------------------------------------------------------------------
// groupTasks — split a board's tasks into ordered groups (the columns/sections).
// Group order follows `groupOrder` (the board's declared order) first, then any
// remaining groups in first-seen order. Each group's tasks are sorted. Returns
// [{ label, tasks }].
// -----------------------------------------------------------------------------
export function groupTasks(tasks, groupOrder = []) {
  const buckets = new Map();
  const seen = [];
  for (const t of Array.isArray(tasks) ? tasks : []) {
    const g = groupLabelOf(t);
    if (!buckets.has(g)) { buckets.set(g, []); seen.push(g); }
    buckets.get(g).push(t);
  }
  const ordered = [];
  for (const g of groupOrder) if (buckets.has(g)) ordered.push(g);
  for (const g of seen) if (!ordered.includes(g)) ordered.push(g);
  return ordered.map((label) => ({ label, tasks: sortTasks(buckets.get(label)) }));
}

// -----------------------------------------------------------------------------
// boardsFromTasks — derive the live board list from the real task rows: distinct
// boardSlug, with its display title and a task count + progress. The component
// merges this with the SEED_BOARDS so an un-seeded board still appears (letting
// the user load its real items) and a board the user created from scratch shows
// the moment its first task lands.
// -----------------------------------------------------------------------------
export function boardsFromTasks(tasks) {
  const map = new Map();
  for (const t of Array.isArray(tasks) ? tasks : []) {
    if (!t || !t.boardSlug) continue;
    if (!map.has(t.boardSlug)) {
      map.set(t.boardSlug, { slug: t.boardSlug, title: t.boardTitle || t.boardSlug, tasks: [] });
    }
    const b = map.get(t.boardSlug);
    b.tasks.push(t);
    if (t.boardTitle) b.title = t.boardTitle;
  }
  return [...map.values()].map((b) => ({
    slug: b.slug,
    title: b.title,
    progress: boardProgress(b.tasks),
  }));
}

// tasksForBoard — the rows on one board.
export function tasksForBoard(tasks, boardSlug) {
  return (Array.isArray(tasks) ? tasks : []).filter((t) => t && t.boardSlug === boardSlug);
}

// -----------------------------------------------------------------------------
// slug helpers. New tasks get a non-UUID local id ('bt-...') so the sync
// substrate's unionPreservingLocal keeps them until their INSERT lands. Seed
// items carry a STABLE slug so re-seeding is idempotent (the 0057 unique index on
// (instance, slug) makes a re-upload a no-op instead of a duplicate).
// -----------------------------------------------------------------------------
export function newTaskSlug(boardSlug) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `bt-${boardSlug}-${Date.now().toString(36)}-${rand}`;
}
export function seedTaskSlug(boardSlug, key) {
  return `bt-seed-${boardSlug}-${key}`;
}

// =============================================================================
// SEED_BOARDS — the real current program boards. Each is a board a family member
// can OPEN and, if it has no items yet, LOAD (one tap writes its real items as
// editable, synced board_tasks rows — real state, not painted). Statuses are
// HONEST: 'done' only where verifiably shipped; otherwise 'in-progress' /
// 'not-started' / 'blocked'. Grounded in the memory ledger + foundation docs.
//
// `metric` (optional) names a LIVE figure the board shows as context (computed by
// the component from real in-app state), separate from the item roll-up.
// =============================================================================
export const SEED_BOARDS = [
  // ── 1. Modular cutover — the monolith → modules decomposition ─────────────
  {
    slug: 'board-modular-cutover',
    title: 'Modular cutover',
    domain: 'business-poetech',
    blurb: 'Decompose the frozen monolith into modules mounted via the surface registry (DR-0078 / HYBRID-MODULAR-IMPLEMENTATION-PLAN). Live metric below is real, not painted.',
    metric: 'modular-cutover',
    groupOrder: ['Stages'],
    items: [
      { key: 's0', group: 'Stages', title: 'Stage 0 — new-surface = new-module (in force)', status: 'done', owner: 'Claude', notes: 'Every new surface ships as its own file; conference surfaces isolated. Already true.' },
      { key: 's1', group: 'Stages', title: 'Stage 1 — introduce surfaces.js registry + freeze monolith (C1/C2)', status: 'done', owner: 'Claude', notes: 'app/src/surfaces.js exists; monolith frozen at 9386 lines (scripts/monolith-budget.json, 2026-06-29). Line count may only go DOWN.' },
      { key: 's2', group: 'Stages', title: 'Stage 2 — migrate existing surfaces onto the registry-driven mount', status: 'in-progress', owner: 'Claude', notes: 'Registry holds every lazy loader; the shell still uses named exports + render switch. Replace the switch with a registry-driven mount (derive nav C3/C4, route allow-list C5, feedback-area C6).' },
      { key: 's3', group: 'Stages', title: 'Stage 3 — peel remaining in-file sections (Church wrapper, BigPicture, Admin, FeedbackModal)', status: 'not-started', owner: 'Claude', notes: 'Work queue = ranked hot-file output (conflict-analytics.mjs), highest-contention first. One section per PR, behavior pinned by tests.' },
      { key: 's4', group: 'Stages', title: 'Stage 4 — boundary gate + timestamped migration names', status: 'in-progress', owner: 'Claude', notes: 'module-boundary-guard.mjs + monolith-budget-guard.mjs exist. Remaining: timestamped migration allocator (YYYYMMDDHHMM-slug.sql) to end the duplicate-number class.' },
      { key: 's5', group: 'Stages', title: 'Stage 5 — full decomposition (monolith becomes a thin composition root)', status: 'not-started', owner: 'Claude', notes: 'After the in-flight queue drains + soak confirms the conflict trend turned DOWN.' },
    ],
  },

  // ── 2. Church LED wall + infrastructure ───────────────────────────────────
  {
    slug: 'board-church-infra',
    title: 'Church LED wall + infrastructure',
    domain: 'church',
    blurb: 'COLG sanctuary build: the Mirackle P1.99mm LED video wall and the sovereign church compute/AV stack. Grounded in the church-infra program + the LED signal-chain record.',
    groupOrder: ['LED video wall', 'Compute + AV stack'],
    items: [
      { key: 'led-layout', group: 'LED video wall', title: 'Confirm 8 columns × 6 rows = 48 Mirackle P1.99mm panels', status: 'done', owner: 'Darrell', notes: 'Layout recorded in-app (led-wall-signal-chain.js) + SVG on the wall record. PRs #407/#418/#453.' },
      { key: 'led-signal', group: 'LED video wall', title: 'LED data path — 8 lines per COLUMN, direct (no switch)', status: 'done', owner: 'Darrell', notes: 'Recorded: LED data = 8 lines per column direct; ATEM = production, VX1000 = source switch.' },
      { key: 'led-videoin', group: 'LED video wall', title: 'Video-in via owned KEQINX HDMI-over-Cat6', status: 'in-progress', owner: 'Darrell', notes: 'Owned KEQINX HDMI-over-Cat6 for video-in. Confirm runs + terminations on the finish checklist.' },
      { key: 'led-finish', group: 'LED video wall', title: 'Finish checklist — mounting, alignment, calibration', status: 'not-started', owner: 'Darrell', notes: 'In-app finish-checklist on the video-wall record; walk it on-site.' },
      { key: 'led-teach', group: 'LED video wall', title: 'Teaching card so staff can run the wall', status: 'done', owner: 'Claude', notes: 'In-app doc + teaching card shipped with the signal-chain record.' },
      { key: 'inf-nas', group: 'Compute + AV stack', title: 'Church NAS — the brain + barn (storage, services, backup)', status: 'in-progress', owner: 'Darrell', notes: 'Sovereign church stack. 3-2-1 backup incl. encrypted sealed-blob offsite. Ties infrastructure-class.js.' },
      { key: 'inf-towers', group: 'Compute + AV stack', title: 'Two compute towers next to the NovaStar (Ollama / XTTS / whisper, LAN-only)', status: 'not-started', owner: 'Darrell', notes: 'TWO tower PCs, specs SME/TBD; compose local AI + voice + transcription, LAN-only. Parallel sovereign local-coder workers (mesh nodes.json).' },
      { key: 'inf-network', group: 'Compute + AV stack', title: 'UniFi gateway + VLAN walls (family · COLG · TLC · Properties · PoeTech)', status: 'not-started', owner: 'Darrell', notes: 'One door to the internet; separate walled VLAN rooms per domain.' },
    ],
  },

  // ── 3. Financial loops ────────────────────────────────────────────────────
  {
    slug: 'board-financial-loops',
    title: 'Financial loops',
    domain: 'family',
    blurb: 'The money pipeline end to end: bank data in → categorize + verify → debts + forecast. Each stage is a real loop that must move LIVE data, not paint a number.',
    groupOrder: ['Pipeline'],
    items: [
      { key: 'fin-import', group: 'Pipeline', title: 'Bank statement import (email → Gmail → NAS → verified ledger)', status: 'in-progress', owner: 'Darrell', notes: 'wf18 import repaired (2026-06-17). Coverage loaded Nov24–May26 (4 Chase accts, 1932 txns). Needs a fresh June export + Gmail reconnect to fully automate.' },
      { key: 'fin-categorize', group: 'Pipeline', title: 'Categorize + verify imported transactions', status: 'in-progress', owner: 'Darrell', notes: 'Human-verify step before a txn is load-bearing. Books figures derive from the ledger (account-balances.js), never a stored balance.' },
      { key: 'fin-balances', group: 'Pipeline', title: 'Derived account balances reconcile to the bank', status: 'done', owner: 'Claude', notes: 'Balances derive from the append-only ledger and reconcile to bank (e.g. acct 7206 = $317.17). No painted totals.' },
      { key: 'fin-debts', group: 'Pipeline', title: 'Debts — snowball/avalanche payoff tracking', status: 'in-progress', owner: 'Darrell', notes: 'Debts flow into the forecast as obligations.' },
      { key: 'fin-forecast', group: 'Pipeline', title: 'Forecast — dynamic cash-flow projection + scenarios (projected vs actual)', status: 'done', owner: 'Claude', notes: 'Family-gated Forecast: dynamic projections + scenarios + projected-vs-actual (financial-engineering.js, v2.16).' },
    ],
  },

  // ── 4. TLC training library ───────────────────────────────────────────────
  {
    slug: 'board-tlc-training',
    title: 'TLC training library',
    domain: 'business-tlc',
    blurb: 'Clinician training + CE for the wellness practice: built-out courses, CE/CEU renewal tracking, and the Christina SME review gate.',
    groupOrder: ['Courses + CE'],
    items: [
      { key: 'tlc-courses', group: 'Courses + CE', title: 'Clinician courses — 10 fields, pre/post tests, hours + cert', status: 'in-progress', owner: 'Christina', notes: 'FOUR-STRAND spine (Yahweh centre + clinical + neuroscience + societal); multi-track grounded IL/CSWE hours. PracticeLearn.jsx, PR #429.' },
      { key: 'tlc-ceu', group: 'Courses + CE', title: 'CE/CEU renewal tracker (multi-state)', status: 'in-progress', owner: 'Christina', notes: 'ceu-tracker.js STATE_RULESETS; IL ruleset confirmed:false pending Christina SME. 0055.' },
      { key: 'tlc-sme', group: 'Courses + CE', title: 'Christina SME gate — clinical content review before publish', status: 'not-started', owner: 'Christina', notes: 'SME sign-off gate on clinician-facing content. Reviewed by use in her hands.' },
      { key: 'tlc-ingest', group: 'Courses + CE', title: 'YouTube-distill ingest (Rivah/Ellis → Couples track)', status: 'not-started', owner: 'Claude', notes: 'Distill SME video → course modules; local NAS pipeline.' },
    ],
  },

  // ── 5. Family succession ──────────────────────────────────────────────────
  {
    slug: 'board-succession',
    title: 'Family succession map',
    domain: 'family',
    blurb: 'The stewardship handoff: who carries what, and the plan for passing the system + the ministry + the businesses to the next generation.',
    groupOrder: ['Succession'],
    items: [
      { key: 'suc-surface', group: 'Succession', title: 'Succession surface in-app (family-gated)', status: 'done', owner: 'Claude', notes: 'FamilySuccession.jsx built + mounted (surfaces.js: succession, family/governor-gated).' },
      { key: 'suc-map', group: 'Succession', title: 'Map each role/asset to a successor + readiness', status: 'not-started', owner: 'Darrell', notes: 'Who carries what; readiness per successor. Real family data, entered by Darrell.' },
      { key: 'suc-docs', group: 'Succession', title: 'Governing documents + access handoff plan', status: 'not-started', owner: 'Darrell', notes: 'DB primary → home hardware (~Jul–Aug 2026); sealed-blob backup at church. Access handoff on the same arc.' },
    ],
  },
];

export const SEED_BOARD_BY_SLUG = Object.fromEntries(SEED_BOARDS.map((b) => [b.slug, b]));

// -----------------------------------------------------------------------------
// seedTasksForBoard — expand a SEED_BOARD spec into the board_tasks row shape the
// sync layer uploads. Stable slugs → idempotent. Returns [] for an unknown slug.
// The caller only writes items whose slug isn't already present (so re-loading a
// partially-seeded board fills gaps without clobbering the user's edits).
// -----------------------------------------------------------------------------
export function seedTasksForBoard(boardSlug) {
  const spec = SEED_BOARD_BY_SLUG[boardSlug];
  if (!spec) return [];
  return (spec.items || []).map((it, i) => ({
    slug: seedTaskSlug(boardSlug, it.key),
    boardSlug,
    boardTitle: spec.title,
    title: it.title,
    status: BOARD_STATUS[it.status] ? it.status : 'not-started',
    owner: it.owner || null,
    group: it.group || DEFAULT_GROUP,
    startDate: it.startDate || null,
    dueDate: it.dueDate || null,
    sortRank: i,
    notes: it.notes || null,
    links: it.links || {},
  }));
}

// mergedBoardList — the full set of boards to show: every SEED_BOARD (so an
// un-seeded program board still appears with a "Load N items" affordance) unioned
// with every board that exists only in the live task rows (a board the user
// created from scratch, or a project-backed board). Progress is the real roll-up
// from whatever rows currently exist for each slug.
export function mergedBoardList(tasks) {
  const live = boardsFromTasks(tasks);
  const liveBySlug = new Map(live.map((b) => [b.slug, b]));
  const out = [];
  for (const spec of SEED_BOARDS) {
    const l = liveBySlug.get(spec.slug);
    out.push({
      slug: spec.slug,
      title: spec.title,
      blurb: spec.blurb,
      domain: spec.domain,
      metric: spec.metric || null,
      seedCount: (spec.items || []).length,
      progress: l ? l.progress : boardProgress([]),
      seeded: !!l,
    });
    liveBySlug.delete(spec.slug);
  }
  // Any remaining live boards were not seed boards — user/project boards.
  for (const b of liveBySlug.values()) {
    out.push({ slug: b.slug, title: b.title, blurb: null, domain: null, metric: null, seedCount: 0, progress: b.progress, seeded: true });
  }
  return out;
}
