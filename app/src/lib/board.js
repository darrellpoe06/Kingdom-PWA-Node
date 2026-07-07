// =============================================================================
// board — pure domain logic for the working Project Boards (Monday.com-style)
// =============================================================================
// Declared by Darrell (2026-06-30): the Projects tab must be a REAL, working
// board system inside PoeTech, where all the work is tracked and DRIVEN forward
// from inside the app. Boards with items, STATUS labels, OWNERS, dates, and
// PROGRESS that rolls up per board — live on the shared-persistence backbone,
// synced, RLS-safe (0059 board_tasks). NOT static like the old BuildBoard.
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

// =============================================================================
// OWNERSHIP — least-human default (declared by Darrell 2026-07-01)
// =============================================================================
// Default ownership follows LEAST-HUMAN: an item the SYSTEM can do is owned by
// the AI; a human owns an item ONLY when it truly needs one — a decision, a
// real-world action, or a credential a person physically holds. The app's AI is
// branded "Ari" (project-ari-ai-identity), so Ari is the one AI owner name the
// board speaks. Early seeds used the label "Claude" for that same AI; those are
// normalized to Ari on read so no board shows two names for one worker.
export const AI_OWNER = 'Ari';
const LEGACY_AI_OWNER_LABELS = ['claude', 'ai', 'assistant', 'system-ai'];
export function normalizeOwner(owner) {
  if (owner == null) return null;
  const s = String(owner).trim();
  if (!s) return null;
  return LEGACY_AI_OWNER_LABELS.includes(s.toLowerCase()) ? AI_OWNER : s;
}
export function isAiOwner(owner) {
  return normalizeOwner(owner) === AI_OWNER;
}

// The two principals of the human↔AI collaboration channel. A handoff reassigns
// an item to the OTHER party with a short note, and every push is logged to the
// item's history so both sides see what the other is thinking (the two-way
// record Darrell asked for; ties project-ai-hi-shared-memory-collaboration).
export const HANDOFF_TARGETS = [
  { value: AI_OWNER,  label: 'Push to Ari',     hint: 'AI / system can do this' },
  { value: 'Darrell', label: 'Push to Darrell', hint: 'needs a human — decision, real-world step, or a credential' },
];

// -----------------------------------------------------------------------------
// Handoff history — persisted on the shared backbone inside board_tasks.links
// (the existing synced jsonb column) as links.history: an append-only list of
// { at, from, to, by, note, kind } entries. No schema migration needed; it rides
// the same realtime sync every board_tasks row already uses, so it is live for
// both sides immediately. kind='handoff' = a deliberate push; kind='default' =
// the system re-defaulting an owner to least-human.
// -----------------------------------------------------------------------------
export function taskHistory(task) {
  const h = task && task.links && Array.isArray(task.links.history) ? task.links.history : [];
  return h;
}
export function makeHandoff({ at, from = null, to, by = null, note = '', kind = 'handoff' }) {
  return {
    at: at || null,
    from: from ?? null,
    to: to ?? null,
    by: by ?? null,
    note: (note || '').trim() || null,
    kind,
  };
}
// Return a new links object with the entry appended to links.history (immutable;
// preserves every other link field — project_slug, dr_ref, live_metric, …).
export function appendHistory(links, entry) {
  const base = links && typeof links === 'object' ? links : {};
  const history = Array.isArray(base.history) ? base.history : [];
  return { ...base, history: [...history, entry] };
}

// canonicalSeedOwner — the least-human owner a SEED item is defined to have, from
// its SEED_BOARDS spec. Used to self-heal live rows that were seeded with the old
// backwards default (a system item mis-assigned to a human) — unless a deliberate
// handoff has since moved it. Returns undefined for a non-seed / unknown slug.
export function canonicalSeedOwner(boardSlug, slug) {
  const spec = SEED_BOARD_BY_SLUG[boardSlug];
  if (!spec) return undefined;
  const prefix = `bt-seed-${boardSlug}-`;
  if (!slug || !slug.startsWith(prefix)) return undefined;
  const key = slug.slice(prefix.length);
  const item = (spec.items || []).find((it) => it.key === key);
  return item ? normalizeOwner(item.owner) : undefined;
}

// -----------------------------------------------------------------------------
// Seed drift — a live board can fall BEHIND its own build record (2026-07-07,
// Darrell's screenshot: the Moore board read "1/13 done" while the seed spec —
// the build's verifiable record — carried 14/16 SHIPPED). Two pure detectors
// drive two explicit one-tap board actions; nothing self-mutates silently:
//   * missingSeedTasks — spec items whose slug has no live row (the board was
//     seeded before the spec grew). loadSeed() already fills only gaps.
//   * staleSeedStatuses — live seed rows still 'not-started' while the spec
//     marks them 'done' (verifiably shipped, per the spec's notes). Upgrade
//     only, never a downgrade; a row a human moved past not-started is left
//     alone (their edit outranks the heal).
// -----------------------------------------------------------------------------
export function missingSeedTasks(boardSlug, tasks) {
  const have = new Set((Array.isArray(tasks) ? tasks : []).map((t) => t && t.slug).filter(Boolean));
  return seedTasksForBoard(boardSlug).filter((r) => !have.has(r.slug));
}
export function staleSeedStatuses(boardSlug, tasks) {
  const bySlug = new Map(seedTasksForBoard(boardSlug).map((r) => [r.slug, r]));
  return (Array.isArray(tasks) ? tasks : []).filter((t) => {
    const spec = t && bySlug.get(t.slug);
    return spec && spec.status === 'done' && t.status === 'not-started';
  });
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
// boardDueByMonth — dated, not-done board items per forecast month. Feeds the
// 12-Month Workload Forecast so the boards ARE on the timeline (Darrell
// 2026-07-01: "the boards timeline IS the timeline"; asked again 2026-07-07 —
// "why don't the boards go into the timelines?"). HONEST: a COUNT of real due
// items, never invented hours (a board item carries no hours/week — DR-0076).
// Keys match the forecast's `${year}-${paddedMonthIndex}` convention.
// -----------------------------------------------------------------------------
export function boardDueByMonth(tasks, { now = null } = {}) {
  const base = now ? new Date(now) : new Date();
  const out = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    out[`${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`] = 0;
  }
  for (const t of Array.isArray(tasks) ? tasks : []) {
    if (!t || t.status === 'done' || !t.dueDate) continue;
    const d = new Date(t.dueDate);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (key in out) out[key] += 1;
  }
  return out;
}

// -----------------------------------------------------------------------------
// slug helpers. New tasks get a non-UUID local id ('bt-...') so the sync
// substrate's unionPreservingLocal keeps them until their INSERT lands. Seed
// items carry a STABLE slug so re-seeding is idempotent (the 0059 unique index on
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
      { key: 's0', group: 'Stages', title: 'Stage 0 — new-surface = new-module (in force)', status: 'done', owner: 'Ari', notes: 'Every new surface ships as its own file; conference surfaces isolated. Already true.' },
      { key: 's1', group: 'Stages', title: 'Stage 1 — introduce surfaces.js registry + freeze monolith (C1/C2)', status: 'done', owner: 'Ari', notes: 'app/src/surfaces.js exists; the monolith is frozen (scripts/monolith-budget.json) and may only go DOWN — the live line-count vs budget is on this board metric above.' },
      { key: 's2', group: 'Stages', title: 'Stage 2 — migrate existing surfaces onto the registry-driven mount', status: 'in-progress', owner: 'Ari', notes: 'Registry holds every lazy loader; the shell still uses named exports + render switch. Replace the switch with a registry-driven mount (derive nav C3/C4, route allow-list C5, feedback-area C6).' },
      { key: 's3', group: 'Stages', title: 'Stage 3 — peel remaining in-file sections (Church wrapper, BigPicture, Admin, FeedbackModal)', status: 'not-started', owner: 'Ari', notes: 'Work queue = ranked hot-file output (conflict-analytics.mjs), highest-contention first. One section per PR, behavior pinned by tests.' },
      { key: 's4', group: 'Stages', title: 'Stage 4 — boundary gate + timestamped migration names', status: 'in-progress', owner: 'Ari', notes: 'module-boundary-guard.mjs + monolith-budget-guard.mjs exist. Remaining: timestamped migration allocator (YYYYMMDDHHMM-slug.sql) to end the duplicate-number class.' },
      { key: 's5', group: 'Stages', title: 'Stage 5 — full decomposition (monolith becomes a thin composition root)', status: 'not-started', owner: 'Ari', notes: 'After the in-flight queue drains + soak confirms the conflict trend turned DOWN.' },
    ],
  },

  // ── 2. Church LED wall + infrastructure ───────────────────────────────────
  {
    slug: 'board-church-infra',
    title: 'Church LED wall + infrastructure',
    domain: 'church',
    blurb: 'COLG sanctuary build: the Mirackle P1.99mm LED video wall and the sovereign church compute/AV stack. Grounded in the church-infra program + the LED signal-chain record.',
    groupOrder: ['LED video wall', 'Compute + AV stack', 'Network project'],
    items: [
      { key: 'led-layout', group: 'LED video wall', title: 'Confirm 8 columns × 6 rows = 48 Mirackle P1.99mm panels', status: 'done', owner: 'Darrell', notes: 'Layout recorded in-app (led-wall-signal-chain.js) + SVG on the wall record. PRs #407/#418/#453. Pixel map MEASURED 2026-07-03: 320x240/cabinet, wall 2560x1440.' },
      { key: 'led-signal', group: 'LED video wall', title: 'LED data path — 8 lines per COLUMN, direct (no switch)', status: 'done', owner: 'Darrell', notes: 'CONFIRMED AS BUILT 2026-07-03: 8 of 10 VX1000 Pro ports, one per column, cable enters the TOP cabinet, chains down.' },
      { key: 'led-videoin', group: 'LED video wall', title: 'Video-in — booth laptop on VX HDMI-3, one layer Full Screen', status: 'done', owner: 'Darrell', notes: 'COMMISSIONED 2026-07-03: first light + live sermon video full-wall same night. Screen saved to receiving cards; Preset 1 = service state. Runbook: 2026-07-03-led-wall-commissioning.md.' },
      { key: 'led-finish', group: 'LED video wall', title: 'Punch list — warranty modules + EDID 2560x1440 + NovaLCT backup to NAS', status: 'in-progress', owner: 'Darrell', notes: 'A few dark modules (vendor warranty swap, positions photographed); input EDID nicety for 1:1 pixels; copy the NovaLCT config export to the NAS share.' },
      { key: 'led-teach', group: 'LED video wall', title: 'Teaching card so staff can run the wall', status: 'done', owner: 'Ari', notes: 'In-app doc + teaching card with the signal-chain record; booth CLAUDE.md carries the full runbook. Sunday = PRESET 1, one button.' },
      { key: 'inf-nas', group: 'Compute + AV stack', title: 'Church NAS — the brain + barn (storage, services, backup)', status: 'in-progress', owner: 'Darrell', notes: 'Sovereign church stack. 3-2-1 backup incl. encrypted sealed-blob offsite. Ties infrastructure-class.js.' },
      { key: 'inf-towers', group: 'Compute + AV stack', title: 'Two compute towers (RTX 4070 pair) — Claude residents + Python pipelines', status: 'in-progress', owner: 'Darrell', notes: 'Tower 1 VERIFIED 2026-07-03: livestream-main-pc, RTX 4070 12GB, driver 595.95, Claude Code resident (Claude Max), faster-whisper install in flight, RustDesk-over-Tailscale chosen (Win11 Home = no native RDP host). Tower 2: repeat the recipe (~1 hr); it runs Proclaim + ATEM control Sundays, AI batch in the quiet window.' },
      { key: 'inf-tailnet', group: 'Network project', title: 'Tailnet verified — the sovereign overlay is live', status: 'done', owner: 'Ari', notes: 'Verified 2026-07-03 from the tower: livestream-main-pc 100.72.5.90, poetech (NAS), kingdom-home, z-fold7, tlcrackstation (offline 23d). Seed doc: 2026-07-03-network-infrastructure-seed.md.' },
      { key: 'inf-walkthrough', group: 'Network project', title: 'Walk-through inventory — rack/closet photos, switches, APs, ISP/modem', status: 'not-started', owner: 'Darrell', notes: 'Photos of the rack/closet + switch make/models feed the device register; the network-map command on each machine fills the subnet/ARP picture.' },
      { key: 'inf-rmm', group: 'Network project', title: 'Identify the Tactical RMM agent operator (found on tower 1)', status: 'not-started', owner: 'Darrell', notes: 'Third-party remote-management agent on livestream-main-pc (observed updating Tailscale via winget). Who operates it? Security-posture answer required before the VLAN design.' },
      { key: 'inf-network', group: 'Network project', title: 'UniFi gateway + VLAN walls (family · COLG · TLC · Properties · PoeTech)', status: 'not-started', owner: 'Darrell', notes: 'One door to the internet; separate walled VLAN rooms per domain. Designed AFTER the walk-through inventory.' },
    ],
  },

  // ── 2b. Church media go-live (weekly) ──────────────────────────────────────
  // Declared by Darrell 2026-07-04: "start the project for the church
  // infrastructure and this media scripts for our go lives each week - add it
  // to the PoeTech App build so we can run these projects as a team."
  {
    slug: 'board-media-golive',
    title: 'Church media go-live — weekly pipeline',
    domain: 'church',
    blurb: 'The weekly rhythm as braked Python (DR-0083 — no n8n): BG\'s Wednesday PROCLAIM email into the app; Sunday pre-service checks + wall Preset 1; the YouTube program feed (the exact camera switches) into whisper harvest on the towers. Scripts live in infra/church-media-golive/.',
    groupOrder: ['Ingest (Wednesday)', 'Go-live (Sunday)', 'Harvest (after service)'],
    items: [
      { key: 'med-docx', group: 'Ingest (Wednesday)', title: 'Index the local Proclaim docx archive (tower 2)', status: 'not-started', owner: 'Darrell', notes: 'proclaim_docx_index.py — stdlib-only; reads the docx folder the Proclaim team already keeps; extracts date/title/scripture/preacher + segments into proclaim-index.json. One instruction to tower 2\'s Claude runs it.' },
      { key: 'med-gmail', group: 'Ingest (Wednesday)', title: 'Gmail ingest — BG\'s weekly PROCLAIM email + .docx attachments (NAS Python)', status: 'not-started', owner: 'Ari', notes: 'gmail_ingest.py per DR-0083: full-history pagination (200+ threads verified in the mailbox 2026-07-03), attachment scope, three brakes, run-state to the Loops surface. The one human piece is the Gmail OAuth credential only Darrell holds.' },
      { key: 'med-oos', group: 'Ingest (Wednesday)', title: 'Order of Service tab — wire to the real BG format', status: 'not-started', owner: 'Ari', notes: 'The tab exists and waits (church-program). The first indexed docx defines the standard-order template; the ingest keeps it fresh weekly.' },
      { key: 'med-precheck', group: 'Go-live (Sunday)', title: 'Pre-service check — GO/NO-GO an hour before service', status: 'not-started', owner: 'Ari', notes: 'preservice_check.py on booth/tower: disk, GPU, tailnet peers, targets reachable. Problems surface at 9am, not 10:05. A human runs it; the script only reports.' },
      { key: 'med-preset', group: 'Go-live (Sunday)', title: 'Wall go-live = PRESET 1 (one button) — staff-runnable', status: 'done', owner: 'Darrell', notes: 'Saved during commissioning 2026-07-03: one layer, HDMI-3, Full Screen, brightness standard. Teaching card + booth CLAUDE.md carry it.' },
      { key: 'med-atem', group: 'Go-live (Sunday)', title: 'ATEM CLI tools — scripted switcher controls, weekday-tested, human-pressed', status: 'not-started', owner: 'Ari', notes: 'The ATEM speaks a network protocol with solid libraries; build cut/macro/stream CLI per AI-FOUNDATION (a click today = an API call tomorrow). ASSISTIVE only — never autonomous during live service (three brakes; human hands on Sunday).' },
      { key: 'med-youtube', group: 'Harvest (after service)', title: 'YouTube channel index → whisper queue (the videos ARE the camera switches)', status: 'not-started', owner: 'Ari', notes: 'youtube_index.py lists the channel uploads into the tower whisper queue. The published program output is also the switching ground truth for future assistive-ATEM training.' },
      { key: 'med-whisper', group: 'Harvest (after service)', title: 'faster-whisper transcription on the towers — no video lost', status: 'in-progress', owner: 'Darrell', notes: 'Pipeline install started on tower 1 (2026-07-03): Python 3.12 + ffmpeg + faster-whisper (no PyTorch needed — CTranslate2 wheel). Paused at an approval prompt; resumes on next touch. Then the back-catalog becomes a batch job.' },
      { key: 'med-library', group: 'Harvest (after service)', title: 'One linked record per sermon: video + transcript + points + order', status: 'not-started', owner: 'Ari', notes: 'The rails exist (sermon-points, sermon-library-sync, harvest-ledger). This task is the join once ingest + harvest both land.' },
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
      { key: 'fin-import', group: 'Pipeline', title: 'Bank statement import (email → Gmail → NAS → verified ledger)', status: 'in-progress', owner: 'Ari', notes: 'System work (wf18 import, repaired 2026-06-17). Coverage loaded Nov24–May26 (4 Chase accts, 1932 txns). Ari runs the import; the one human sub-step (Gmail reconnect — a credential Darrell holds) is pushed to Darrell when it comes due.' },
      { key: 'fin-categorize', group: 'Pipeline', title: 'Categorize + verify imported transactions', status: 'in-progress', owner: 'Ari', notes: 'Ari categorizes each txn; the human spot-verify before a txn is load-bearing is a push-to-Darrell checkpoint, not the owner of the whole loop. Books figures derive from the ledger (account-balances.js), never a stored balance.' },
      { key: 'fin-balances', group: 'Pipeline', title: 'Derived account balances reconcile to the bank', status: 'done', owner: 'Ari', notes: 'Balances derive from the append-only ledger and reconcile to bank (e.g. acct 7206 = $317.17). No painted totals.' },
      { key: 'fin-debts', group: 'Pipeline', title: 'Debts — snowball/avalanche payoff tracking', status: 'in-progress', owner: 'Ari', notes: 'System computes snowball/avalanche payoff order + progress from the ledger. Debts flow into the forecast as obligations. Darrell governs the strategy choice; the tracking is Ari.' },
      { key: 'fin-forecast', group: 'Pipeline', title: 'Forecast — dynamic cash-flow projection + scenarios (projected vs actual)', status: 'done', owner: 'Ari', notes: 'Family-gated Forecast: dynamic projections + scenarios + projected-vs-actual (financial-engineering.js, v2.16).' },
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
      { key: 'tlc-ingest', group: 'Courses + CE', title: 'YouTube-distill ingest (Rivah/Ellis → Couples track)', status: 'not-started', owner: 'Ari', notes: 'Distill SME video → course modules; local NAS pipeline.' },
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
      { key: 'suc-surface', group: 'Succession', title: 'Succession surface in-app (family-gated)', status: 'done', owner: 'Ari', notes: 'FamilySuccession.jsx built + mounted (surfaces.js: succession, family/governor-gated).' },
      { key: 'suc-map', group: 'Succession', title: 'Map each role/asset to a successor + readiness', status: 'not-started', owner: 'Darrell', notes: 'Who carries what; readiness per successor. Real family data, entered by Darrell.' },
      { key: 'suc-docs', group: 'Succession', title: 'Governing documents + access handoff plan', status: 'not-started', owner: 'Darrell', notes: 'DB primary → home hardware (~Jul–Aug 2026); sealed-blob backup at church. Access handoff on the same arc.' },
    ],
  },

  // ── 6. Moore Divahs — Shay's fashion business system ──────────────────────
  // Declared by Darrell 2026-07-07 ("Add this to our Ways" → DR-0113): the build
  // is watchable in-app from day one. Spec: docs/99-session-notes/
  // 2026-07-07-moore-divahs-business-system-discovery.md. Statuses HONEST —
  // discovery is the only shipped piece at kickoff.
  {
    slug: 'board-moore-divahs',
    title: 'Moore Divahs — business system',
    domain: 'business-moore-divahs',
    blurb: 'Shay\'s fashion business (custom clothing, scrub caps, custom shoes + sewing classes) built INTO the app: order pipeline with the 3-week clock, the structured bulk-apparel form, seat-held classes, inventory→margin, KPIs, and a branded customer front door. One backbone, two doors (steward tab + /moore).',
    groupOrder: ['Foundation', 'Orders', 'Classes', 'Money + KPIs', 'Front door'],
    items: [
      { key: 'md-discovery', group: 'Foundation', title: 'Discovery spec captured from Shay + Darrell (living doc)', status: 'done', owner: 'Ari', notes: 'docs/99-session-notes/2026-07-07-moore-divahs-business-system-discovery.md — both service lines, pricing ($45 group cap 10 / $75 one-on-one 2.5hr), 3-week turnaround, change-order ladder (50% floor, Shay-variable), inventory, KPIs, channels.' },
      { key: 'md-brand', group: 'Foundation', title: 'Brand record seam — Moore Divahs as data, not hardcoded', status: 'done', owner: 'Ari', notes: 'SHIPPED: MOORE_BRAND record (moore-divahs.js) drives the tab AND the /moore door + manifest-moore.webmanifest. The reusable white-label template for the next QC business.' },
      { key: 'md-crm', group: 'Foundation', title: 'Leads ride the ONE-CRM (business + pipeline config, no fork)', status: 'done', owner: 'Ari', notes: 'SHIPPED (#648): moore business + moore-orders pipeline as CONFIG on the one engine (DR-0081); sources tiktok / whats-going-on-qc / partner-business / moore-divahs-app; anon captures via crm_capture_lead only.' },
      { key: 'md-engine', group: 'Orders', title: 'Order engine — pipeline, 3-week clock, change-order ladder', status: 'done', owner: 'Ari', notes: 'SHIPPED: lib/moore-divahs.js + 22 pinned tests (moore-divahs.test.js). Clock starts at paid; 50%-floor Shay-variable change fee with fault attribution; card/bank fields structurally stripped.' },
      { key: 'md-table', group: 'Orders', title: 'custom_orders migration — instance RLS + realtime', status: 'done', owner: 'Ari', notes: 'SHIPPED: 0083-moore-divahs-orders.sql (0059 recipe: instance_id, GRANT authenticated, no anon, 4 policies, realtime) + moore-orders-sync.js round-trip pinned. Passes tenancy/grant/ONE-CRM guards.' },
      { key: 'md-tab', group: 'Orders', title: 'Moore Divahs tab — the Order Board surface, live in nav', status: 'done', owner: 'Ari', notes: 'SHIPPED: components/MooreDivahs.jsx via surfaces.js + family-gated nav/render (no-leak spread). One screen: who paid, the clock, ship/pickup, follow-up ask, change-order fee preview.' },
      { key: 'md-bulk', group: 'Orders', title: 'Structured bulk-apparel form (qty × cut × size × color + name roster)', status: 'done', owner: 'Ari', notes: 'SHIPPED (#646/#648 era): line-item editor in the add-order form + pick-list on the card ("6 × adult M · blue — names"). The Google-Doc intake is dead.' },
      { key: 'md-classes', group: 'Classes', title: 'Classes board — sessions, paid seat holds (group cap 10 / 1-on-1)', status: 'done', owner: 'Ari', notes: 'SHIPPED (#647): class_sessions + class_signups (0084), Classes section in the tab, paid-only seat holds, real seats-left; public listings via moore_public_classes RPC (0085) on the /moore door.' },
      { key: 'md-inventory', group: 'Money + KPIs', title: 'shop_inventory — materials on hand + spend feeding margin', status: 'done', owner: 'Ari', notes: 'SHIPPED: shop_inventory (0086) + Materials section in the tab (on-hand, unit cost, +/- use, derived value). Margin reads real material spend.' },
      { key: 'md-kpi', group: 'Money + KPIs', title: 'KPI history + revenue-goal planner', status: 'done', owner: 'Ari', notes: 'SHIPPED: "The numbers" section — revenue by channel, classes group-vs-1:1 + fill, repeat rate, change count, and the goal input ranking lanes by REAL per-unit earnings. Optimize-toward language.' },
      { key: 'md-door', group: 'Front door', title: 'Branded customer door — /moore standalone boot (PWA installable)', status: 'done', owner: 'Ari', notes: 'SHIPPED (#648): ?moore=1 lean boot — Moore Divahs first, family-of-businesses tabs, pricing + price-out, captures via forced-safe RPCs w/ source=moore-divahs-app; manifest-moore.webmanifest installs under HER name (icon artwork still awaits her asset).' },
      { key: 'md-customer-view', group: 'Front door', title: 'View as customer — Shay inspects her own app as her customers meet it', status: 'done', owner: 'Ari', notes: 'SHIPPED: 👁 toggle on her in-door steward board → the exact customer view (board hidden, auth line masked, pinned exit strip). Strictly narrowing (doorView, moore-door.js) — can only HIDE privilege, never grant; RLS + my_business_role stay the real gates; session-only so a reload always returns her board. Generalizes with the registry door (cf-registry).' },
      { key: 'md-share-link', group: 'Front door', title: 'Her-name share link — poetech.us/moore previews as Moore Divahs', status: 'done', owner: 'Ari', notes: 'SHIPPED: static entry page public/moore/index.html carries HER og/title tags (texted links preview "Moore Divahs", not "PoeTech Family OS") then meta-refreshes into the door; /mooredivahs alias in _redirects + vercel.json. Preview ICON still the platform P until Shay\'s artwork lands (md-brand sibling). Full her-name URL = md-dns custom domain.' },
      { key: 'md-family-tabs', group: 'Front door', title: 'Family-of-businesses tabs carry REAL content — therapists + live service', status: 'done', owner: 'Ari', notes: 'SHIPPED (Darrell 2026-07-07): Practice tab renders the real TLC clinical team (shared lib/tlc-practice.js — same record as the main app, no drift; public marketing facts only, capture stays contact-info-only) + insurance line; Church tab plays the live service in-window / latest message otherwise (church-live.js no-key embeds) + service times. PoeTech tab as-is per Darrell.' },
      { key: 'md-qr', group: 'Front door', title: 'Share-your-app QR on her board — customers install + keep their history', status: 'done', owner: 'Ari', notes: 'SHIPPED (Darrell 2026-07-07): "Share your app" card on her steward board (in-door, so it lives on her phone) — QR encoding poetech.us/moore + copy link + native Send… sheet. Scanned link opens her-name entry page, installs under HER name (manifest-moore); a signed-in customer\'s orders/class seats ride the 0087 read-own lane on their phone.' },
      { key: 'md-dns', group: 'Front door', title: 'Custom domain DNS (mooredivahs)', status: 'not-started', owner: 'Darrell', notes: 'Real-world step only Darrell can do: buy the domain + point DNS at the Cloudflare Pages project. Not blocking — poetech.us/moore is the her-name link until then.' },
      { key: 'md-handles', group: 'Front door', title: 'Shay\'s real social handles (IG / FB / TikTok)', status: 'not-started', owner: 'Darrell', notes: 'Values only Shay holds; wire into the intake link + follow-ups. Email confirmed: mooredivahs1@yahoo.com.' },
    ],
  },

  // ── 7. Client-business factory (DR-0114) — the all-clients machinery ──────
  // Declared by Darrell 2026-07-07: "run this like I will need to moving
  // forward with all clients... asap." Moore Divahs is the prototype; this
  // board carries the factory machinery + the P0 entrance overhaul (the login
  // loop hitting multiple users, and the unified admin/user front door).
  {
    slug: 'board-client-factory',
    title: 'Client-business factory',
    domain: 'business-poetech',
    blurb: 'The repeatable client-onboarding machinery (CLIENT-BUSINESS-FACTORY / DR-0114): one generic branded door driven by a business registry, per-client tenants, ONE-CRM pipelines — plus the P0 entrance overhaul so every login is clean.',
    groupOrder: ['Entrance (P0)', 'Registry', 'Provisioning', 'Commercial', 'Discovery validation (Moore)'],
    items: [
      { key: 'cf-loop', group: 'Entrance (P0)', title: 'Kill the login loop (password → PIN → password)', status: 'done', owner: 'Ari', notes: 'SHIPPED (#656): awaitPersistedSession() closes the ?login=1 reload race; isInAppBrowser() warns IG/FB webview users (their browsers drop sign-ins). Regression-pinned (session-handoff.test.js).' },
      { key: 'cf-door-roles', group: 'Entrance (P0)', title: 'Unified door: Admin login + User login, role-decided', status: 'done', owner: 'Ari', notes: 'SHIPPED (#657): Admin/User login on her front screen, in-place sign-in, my_business_role RPC (0090) decides — owner/admin renders the steward board IN-DOOR; customers get My Orders. Door also gained PoeTech themes + text-size (theme-css extraction; monolith shrank 5932→5447).' },
      { key: 'cf-registry', group: 'Registry', title: 'Business registry — one generic door at ?biz=<slug>', status: 'not-started', owner: 'Ari', notes: 'Brand/tabs/pipeline/policies/door-slug as DATA; one BusinessDoor renders any registered business; Moore converts to the first row (?moore=1 stays as alias). New client door = a registry row, never a new component. HELD (DR-0075) while Shay\'s demo day is live — converting her front door mid-demo risks the surface she is showing; Tier B/C soak applies. re-review: 2026-07-09.' },
      { key: 'cf-instance', group: 'Provisioning', title: 'moore-divahs instance + Shay\'s admin seat', status: 'done', owner: 'Ari', notes: 'SHIPPED (#656, 0089): moore-divahs instance provisioned; Shay owner (mooredivahs1@yahoo.com; invite auto-consumes on first sign-in if her account was not yet created); Darrell admin oversight. Row re-point of legacy poe-family moore data rides the next data increment.' },
      { key: 'cf-runbook', group: 'Provisioning', title: 'Per-client provisioning runbook (instance + seats + registry row)', status: 'done', owner: 'Ari', notes: 'SHIPPED: docs/templates/client-provisioning-runbook.md — factory steps 4-6 as an executable per-client checklist, every step citing its Moore-proven artifact (0089 tenant pattern, ONE-CRM config, forced-safe door RPCs 0088/0090-0092, 0087 read-own lane, DR-0107 deploy proof, DR-0104 live review). Target clock: same day.' },
      { key: 'cf-relay', group: 'Provisioning', title: 'Inquiry email relay per business (owner notified, address never public)', status: 'not-started', owner: 'Darrell', notes: 'NAS-side sender (three brakes); the credential is Darrell\'s hand. Until then each owner\'s inbox is their CRM pipeline view.' },
      { key: 'cf-pricing', group: 'Commercial', title: 'Business-build pricing — DECLARED (DR-0117): $2,000 min, 90 days same as cash, $150/mo support', status: 'done', owner: 'Darrell', notes: 'SET by Darrell 2026-07-07 (small no-overhead segment): $500 deposit / $500 at MVP / balance over the rest of the 90 days, or full upfront; $150/mo Feedback-portal support, beyond-scope re-enters at the minimum. Door price-out upgraded from "custom quote" to the figures (moore-door.js reads client-engagements.js). Larger builds still quote UP by Darrell\'s word.' },
      { key: 'cf-deposit-gate', group: 'Commercial', title: 'The deposit gate — no deposit recorded, no build starts (structural)', status: 'done', owner: 'Ari', notes: 'SHIPPED: lib/client-engagements.js canStartBuild() + derived stages (awaiting-deposit → cleared-to-build → mvp-review → in-term/past-due → complete) + the 90-day clock from the first recorded payment; pinned by client-engagements.test.js. Payments recorded, never processed (Moore §7). Steward surface for engagements rides a next increment.' },
      { key: 'cf-voice-discovery', group: 'Commercial', title: 'Recorded discovery — voice notes / LLM conversation → reviewed requirements → MVP', status: 'in-progress', owner: 'Ari', notes: 'Parser + extraction contract SHIPPED; the in-app review/import surface SHIPPED (Projects → ◈ Clients: paste requirements.json → preview → save extracted (discovery_items, 0093) → confirm/edit/reject with the client\'s source_quote as the receipt → confirmed requirements import as REAL board_tasks rows). Remaining: the NAS transcription ride (existing Whisper rails) feeding the paste box automatically.' },

      // ── Discovery validation (Moore) — the Current → Future → Gap → Decision
      //    lane (DR-0119; Darrell's Mosaic-board workflow applied to the first
      //    client). Every outcome below is grounded in a shipped PR or a
      //    recorded decision — never a painted Fit (DR-0076).
      { key: 'cfv-all-current', group: 'Discovery validation (Moore)', title: 'Her business data lived inside the shared poe-family instance', status: 'done', owner: 'Ari', notes: 'The pre-factory state: no tenant of her own, steward access only through the family.', links: { flow: 'current-state', unit: 'All units', outcome: 'gap' } },
      { key: 'cfv-all-future', group: 'Discovery validation (Moore)', title: 'Her own tenant: moore-divahs instance + Shay\'s owner seat', status: 'done', owner: 'Ari', notes: 'SHIPPED (#656, 0089): instance provisioned; Shay owner (invite auto-consumes on first sign-in); Darrell admin oversight; RLS isolation (0083).', links: { flow: 'future-state', unit: 'All units', outcome: 'fit' } },
      { key: 'cfv-all-decision', group: 'Discovery validation (Moore)', title: 'One generic registry-driven door (?biz=slug) — Moore converts to the first row', status: 'not-started', owner: 'Ari', notes: 'cf-registry: a new client door = a registry row, never a new component. Until it lands, the outcome here stays honestly unknown.', links: { flow: 'decision', unit: 'All units', outcome: 'unknown' } },

      { key: 'cfv-ord-current', group: 'Discovery validation (Moore)', title: 'Five DM inboxes re-read to know who paid, who is in week two, ship vs pickup', status: 'done', owner: 'Ari', notes: 'The inbox-digging killer named in discovery 2026-07-07 — the reason the order board exists.', links: { flow: 'current-state', unit: 'Orders', outcome: 'gap' } },
      { key: 'cfv-ord-future', group: 'Discovery validation (Moore)', title: 'One order board: stages, the 3-week clock, paid state, honest KPIs', status: 'done', owner: 'Ari', notes: 'SHIPPED: MooreDivahs order board (stages + orderClock + KPI tiles; seeds excluded from stats).', links: { flow: 'future-state', unit: 'Orders', outcome: 'fit' } },
      { key: 'cfv-ord-gap', group: 'Discovery validation (Moore)', title: 'Past DM orders and customers were not in the system', status: 'done', owner: 'Ari', notes: 'CLOSED (#666): history backfill (paste her past customers in) + CSV export (her data out, always).', links: { flow: 'gap', unit: 'Orders', outcome: 'fit' } },
      { key: 'cfv-ord-decision', group: 'Discovery validation (Moore)', title: 'Money is recorded, never processed — the board records Square / Venmo / Apple Pay', status: 'done', owner: 'Darrell', notes: 'DELIBERATE boundary (Moore §7): payment stays the owner\'s hand; partial fit by design, the uncovered part is processing and it stays uncovered on purpose.', links: { flow: 'decision', unit: 'Orders', outcome: 'partial-fit' } },

      { key: 'cfv-door-current', group: 'Discovery validation (Moore)', title: 'Word of mouth + IG DMs; no page of her own to send people to', status: 'done', owner: 'Ari', notes: 'Pre-door state from discovery.', links: { flow: 'current-state', unit: 'Storefront & sharing', outcome: 'gap' } },
      { key: 'cfv-door-future', group: 'Discovery validation (Moore)', title: 'Branded door at poetech.us/moore: showcase gallery, view-as-customer, share QR', status: 'done', owner: 'Ari', notes: 'SHIPPED (#665 showcase, #669 customer lens + her-name link, #672 share QR on her board).', links: { flow: 'future-state', unit: 'Storefront & sharing', outcome: 'fit' } },
      { key: 'cfv-door-gap', group: 'Discovery validation (Moore)', title: 'Link previews still show the platform icon, not her artwork', status: 'in-progress', owner: 'Darrell', notes: 'Texted links preview "Moore Divahs" (her og/title tags), but the preview ICON is the platform P until her artwork lands (md-brand). Her artwork is her hand.', links: { flow: 'gap', unit: 'Storefront & sharing', outcome: 'partial-fit' } },
      { key: 'cfv-door-decision', group: 'Discovery validation (Moore)', title: 'Ship the her-name share link now; the custom domain rides md-dns', status: 'done', owner: 'Darrell', notes: 'poetech.us/moore + /mooredivahs alias live; full her-name URL waits on the domain (Governor\'s hand — DNS).', links: { flow: 'decision', unit: 'Storefront & sharing', outcome: 'partial-fit' } },

      { key: 'cfv-cls-current', group: 'Discovery validation (Moore)', title: 'Class signups lived in texts and paper lists', status: 'done', owner: 'Ari', notes: 'Pre-board state from discovery.', links: { flow: 'current-state', unit: 'Classes', outcome: 'gap' } },
      { key: 'cfv-cls-future', group: 'Discovery validation (Moore)', title: 'Sessions, paid signups, and seat caps on her board', status: 'done', owner: 'Ari', notes: 'SHIPPED: classes on the steward board (sessions + paid signups + seatsLeft/canBook caps).', links: { flow: 'future-state', unit: 'Classes', outcome: 'fit' } },
      { key: 'cfv-cls-decision', group: 'Discovery validation (Moore)', title: 'Classes ride the same board as orders — one seat for her whole week', status: 'done', owner: 'Ari', notes: 'Classes tab shipped in the Moore section tabs; the gap step of this lane is honestly not-yet-examined.', links: { flow: 'decision', unit: 'Classes', outcome: 'fit' } },
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
    owner: normalizeOwner(it.owner),
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
