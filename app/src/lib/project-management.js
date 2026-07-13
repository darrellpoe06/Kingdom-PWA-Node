// =============================================================================
// project-management — pure helpers that turn the Projects hub from a VIEW into
// an active MANAGEMENT cockpit
// =============================================================================
// "I want to start managing projects from inside the PoeTech app." (Darrell,
// 2026-06-17.) Active management = move a project through the eternal-sequence
// (Research -> Plan -> Execute -> Done), track honest progress, archive what's
// finished, and group church vs personal — all derived from the REAL fields
// already on each project (status + lifecycle), so there is one source of truth
// and no painted state.
//
// The eternal-sequence is a 3-stage lens (plus two terminal rests) mapped 1:1
// onto the existing project STATUS values. It does not fork the data model — it
// reads status and, when you advance a stage, sets the canonical status for the
// new stage. Every helper is pure and unit-tested.
// =============================================================================

// The eternal-sequence stages, in order. `done` and `parked` are terminal rests,
// shown after the three working stages. Each maps to the canonical project status
// it sets when you move a project INTO that stage.
export const ETERNAL_STAGES = [
  { key: 'research', label: 'Research', glyph: '🔍', status: 'planning',
    blurb: 'Learn what is true and what it would take — gather before you commit.' },
  { key: 'plan',     label: 'Plan',     glyph: '🗺',  status: 'planning',
    blurb: 'Shape the path — scope, sequence, who and when.' },
  { key: 'execute',  label: 'Execute',  glyph: '⚒',  status: 'active',
    blurb: 'Do the work — the build is running.' },
  { key: 'done',     label: 'Done',     glyph: '✓',  status: 'complete', terminal: true,
    blurb: 'Finished — kept for the record.' },
  { key: 'parked',   label: 'Parked',   glyph: '⏸',  status: 'on-hold', terminal: true,
    blurb: 'Set down on purpose — waiting on something.' },
];

export const STAGE_KEYS = ETERNAL_STAGES.map((s) => s.key);
export const WORKING_STAGE_KEYS = ['research', 'plan', 'execute'];

export const stageMeta = (key) =>
  ETERNAL_STAGES.find((s) => s.key === key) || { key, label: key, glyph: '•', blurb: '' };

// status -> stage. The 1:1 lens. `tbd` (parked-until-capacity) reads as research
// (not yet committed); `ending-soon` is still execute; `complete` is done;
// `on-hold` is parked. An unknown status defaults to research so nothing vanishes.
const STATUS_TO_STAGE = {
  tbd:           'research',
  planning:      'plan',
  active:        'execute',
  'ending-soon': 'execute',
  complete:      'done',
  'on-hold':     'parked',
};

export function stageOfStatus(status) {
  return STATUS_TO_STAGE[status] || 'research';
}

export function stageOfProject(project) {
  return stageOfStatus(project && project.status);
}

// The canonical status to write when a project is moved INTO a stage. Research
// uses 'planning' too (both are pre-execution), but moving research->plan still
// records a lifecycle log entry via the note, so the intent is captured even when
// the status string is unchanged.
export function statusForStage(stageKey) {
  return stageMeta(stageKey).status || 'planning';
}

// The next working stage after the current one (research->plan->execute->done).
// Returns null when already at the end of the working path (execute's next is
// done, a terminal rest). Parked has no linear "next" — it re-enters via resume.
export function nextStage(stageKey) {
  const order = ['research', 'plan', 'execute', 'done'];
  const i = order.indexOf(stageKey);
  if (i < 0 || i >= order.length - 1) return null;
  return order[i + 1];
}

// -----------------------------------------------------------------------------
// stageProgress — honest, derived progress for a project. NOT a painted percent:
// it is the position along the working sequence (research=0, plan=1, execute=2,
// done=3 of 3). Terminal `parked` reports its pre-park progress is unknown, so we
// return null pct (the UI shows "parked", never a fake bar). This is "verifiably
// right or marked unverified": the number is the real stage index, nothing more.
// -----------------------------------------------------------------------------
export function stageProgress(project) {
  const stage = stageOfProject(project);
  if (stage === 'parked') return { stage, step: null, of: 3, pct: null };
  const STEP = { research: 1, plan: 2, execute: 3, done: 3 };
  const step = STEP[stage] ?? 1;
  const of = 3;
  // Done is 100%; the three working stages are 1/3, 2/3, 3/3 *entered* — we show
  // entered-progress, the same honest convention the timeline bar uses elsewhere.
  const pct = stage === 'done' ? 100 : Math.round((step / of) * 100);
  return { stage, step, of, pct };
}

// -----------------------------------------------------------------------------
// Church vs personal grouping. The cockpit groups a person's whole life into the
// two halves Darrell named — Church/ministry work and everything personal/family/
// business. Derived from the project's real `domain`. A 'church' domain is church;
// everything else is personal-side. Returns 'church' | 'personal'.
// -----------------------------------------------------------------------------
export function lifeGroupOfProject(project) {
  return project && project.domain === 'church' ? 'church' : 'personal';
}

export function groupProjectsByLife(projects) {
  const out = { church: [], personal: [] };
  for (const p of Array.isArray(projects) ? projects : []) {
    out[lifeGroupOfProject(p)].push(p);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Archive. The data model has no destructive-only "archive" — archiving is a
// non-destructive move to the 'on-hold' parked rest with an archived flag in the
// lifecycle, so the record is kept (never silently dropped) but out of the active
// list. Returns the update patch the reducer applies (status + a marker note);
// the lifecycle log entry is appended by updateProject's existing path.
// -----------------------------------------------------------------------------
export function archivePatch() {
  return { status: 'on-hold', _by: 'user', _note: 'archived — set down, kept for the record' };
}

// markCompletePatch — close a finished project in one tap from the row. Writes the
// terminal `complete` status plus a lifecycle note, so a finished project stops
// inflating the Active metric + 12-month forecast the moment it's done (the
// numbers already exclude `complete`; this makes closing cheap so they're right).
// Same _by/_note path moveToStage uses, so the lifecycle trail records the close.
export function markCompletePatch() {
  return { status: 'complete', _by: 'user', _note: 'marked complete from the project row' };
}

// reschedulePatch — push a project's end date out (the overdue affordance beside
// "Mark complete"). For a project that's still in flight but slipped past its
// target — reschedule instead of falsely closing it. Records the new date in the
// lifecycle note so the slip is visible in the trail.
export function reschedulePatch(endDate) {
  return { endDate, _by: 'user', _note: `rescheduled end date to ${endDate}` };
}

// isArchived — a project parked with the archive note. Read from the real
// lifecycle log so the active list can hide archived items without a new column.
export function isArchived(project) {
  if (!project || project.status !== 'on-hold') return false;
  const log = project.lifecycle && Array.isArray(project.lifecycle.log) ? project.lifecycle.log : [];
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e && e.toPhase === 'on-hold') {
      return typeof e.note === 'string' && e.note.toLowerCase().includes('archived');
    }
    // A later move OUT of on-hold means it was un-parked since; stop looking.
    if (e && e.toPhase && e.toPhase !== 'on-hold') break;
  }
  return false;
}

// -----------------------------------------------------------------------------
// projectTimelineLanes — the Projects-hub fallback so the timeline is a LIVE
// view, never a dead "go load a board" end when real projects exist (Darrell
// 2026-07-13: "why does the Project tab have the timelines section empty?").
// Each live (non-archived) project rides the SAME timeline as the boards — a
// lane derived from the shared project engine (its eternal-stage + real dates).
// This is the one-engine-two-views model (DR-0187) in miniature: a board lane
// carries the phase-by-phase walk; a project lane carries the stage until a
// board is loaded. REAL fields only (DR-0076) — stage from status, dates from
// the row; an empty list stays empty, never a painted lane.
// -----------------------------------------------------------------------------
export function projectTimelineLanes(projects) {
  return (Array.isArray(projects) ? projects : [])
    // The live timeline shows OPEN work — completed + archived projects are kept
    // for the record but stay off the default timeline, the same rule the list
    // uses (isClosed = complete OR archived). Parked (on-hold, not archived) is
    // still in-flight, so it stays.
    .filter((p) => p && p.status !== 'complete' && !isArchived(p))
    .map((p) => {
      const prog = stageProgress(p);
      return {
        id: p.id,
        title: (typeof p.title === 'string' && p.title.trim()) ? p.title : 'Untitled project',
        stage: prog.stage,
        stageLabel: stageMeta(prog.stage).label,
        pct: prog.pct,                       // null when parked — honest, not 0
        startDate: p.startDate || null,
        endDate: p.endDate || null,
        domain: p.domain || null,
      };
    });
}

// -----------------------------------------------------------------------------
// stageBoard — the real roll-up that drives the cockpit + the management pulse:
// how many projects sit in each eternal-stage right now. Counts only the projects
// passed in (already role/scope filtered by the caller), so the board never shows
// a project the viewer can't see. No invented numbers — pure tally of real rows.
// -----------------------------------------------------------------------------
export function stageBoard(projects) {
  const counts = Object.fromEntries(STAGE_KEYS.map((k) => [k, 0]));
  for (const p of Array.isArray(projects) ? projects : []) {
    counts[stageOfProject(p)] += 1;
  }
  return counts;
}

// -----------------------------------------------------------------------------
// lifecycleTrail — the project's real state-transition history, newest-first, for
// the inline "how this moved" trail. Reads the lifecycle.log that the monolith
// already seeds + appends on every status change. Returns [] when none.
// -----------------------------------------------------------------------------
export function lifecycleTrail(project) {
  const log = project && project.lifecycle && Array.isArray(project.lifecycle.log)
    ? project.lifecycle.log : [];
  return log.slice().reverse();
}
