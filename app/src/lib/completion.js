// =============================================================================
// completion — the App Firm-Up rollup: one live "how done is the whole app" view
// =============================================================================
// Darrell (2026-07-01, binding): the Projects boards timeline IS the timeline for
// FINISHING the app. So the per-item dates + per-board progress must roll up into
// ONE live completion readout — overall % done + a projected finish date — that
// MOVES on its own when an item is closed or a date changes. This is the headline
// of the Projects hub.
//
// HONEST BY CONSTRUCTION (DR-0076):
//   * overall % = done / total across every real board_tasks row (the boards ARE
//     the modular-cutover, financial-loops, church-infra, TLC, succession work).
//     null when there are no items — never a painted number.
//   * projected finish = the latest target date among still-open items. If no
//     open item carries a date, we say so ("set target dates to project") instead
//     of inventing one. Closing the latest-dated item moves the projection to the
//     next one — the date moves on its own.
//   * the persistent-share + module-ledger figures come from a deterministic
//     script (scripts/persistent-share.py), read from the committed JSON — a
//     measured number, not a claim, that climbs as loops migrate to Python/SQL.
// =============================================================================
import SHARE from './persistent-share.json';
import { boardProgress } from './board.js';

// overallCompletion — done/total across ALL board tasks (every board aggregated).
export function overallCompletion(tasks) {
  const p = boardProgress(tasks);       // reuses the same honest tally the boards use
  return { total: p.total, done: p.done, inProgress: p.inProgress, blocked: p.blocked, pct: p.pct };
}

function isOpen(t) {
  return t && t.status !== 'done';
}
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// projectedFinish — the latest committed target date among still-open items, and
// how many open items have no date (the honest gap). Returns:
//   { date: 'YYYY-MM-DD'|null, datedOpen, undatedOpen }
export function projectedFinish(tasks) {
  const open = (Array.isArray(tasks) ? tasks : []).filter(isOpen);
  let latest = null;
  let datedOpen = 0;
  for (const t of open) {
    const d = t.dueDate;
    if (typeof d === 'string' && DATE_RE.test(d)) {
      datedOpen += 1;
      if (!latest || d > latest) latest = d;
    }
  }
  return { date: latest, datedOpen, undatedOpen: open.length - datedOpen };
}

// perBoardBreakdown — each board's live roll-up, for the headline's mini-bars.
// [{ slug, title, pct, done, total }], boards with items only, done-last order.
export function perBoardBreakdown(tasks) {
  const map = new Map();
  for (const t of Array.isArray(tasks) ? tasks : []) {
    if (!t || !t.boardSlug) continue;
    if (!map.has(t.boardSlug)) map.set(t.boardSlug, { slug: t.boardSlug, title: t.boardTitle || t.boardSlug, rows: [] });
    map.get(t.boardSlug).rows.push(t);
  }
  return [...map.values()]
    .map((b) => { const p = boardProgress(b.rows); return { slug: b.slug, title: b.title, pct: p.pct, done: p.done, total: p.total }; })
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
}

// trendOf — a signed direction from two percentages (for the up/down arrow).
export function trendOf(current, previous) {
  if (previous == null || current == null) return { dir: 'flat', delta: 0 };
  const delta = Math.round((current - previous) * 100) / 100;
  return { dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', delta };
}

// persistentShare — the committed, script-measured persistent-layer metric with
// its baseline, target, and since-last-run trend. Pure read of the JSON.
export function persistentShare() {
  const current = SHARE.persistentPct;
  const t = trendOf(current, SHARE.previousPct);
  return {
    current,
    baseline: SHARE.baselinePct,
    target: SHARE.targetPct,
    previous: SHARE.previousPct,
    trend: t,
    toTarget: Math.round((SHARE.targetPct - current) * 100) / 100,
    sub: SHARE.sub,
    frontendPct: SHARE.frontendPct,
    configDocsPct: SHARE.configDocsPct,
    totalLines: SHARE.totalLines,
    totalFiles: SHARE.totalFiles,
  };
}

// moduleLedger — the monolith line-count signal (shrinking = firming up), read
// from the same committed JSON. delta = current - frozen (0 or negative = held).
export function moduleLedger() {
  const ml = SHARE.moduleLedger || {};
  const monolithLines = ml.monolithLines ?? null;
  const frozen = ml.frozenBudget ?? null;
  const delta = (monolithLines != null && frozen != null) ? monolithLines - frozen : null;
  // `surfaces` = the registry size, counted by the deterministic script and read
  // from the JSON — feature modules must NOT import surfaces.js (shell-only,
  // module-boundary-guard / DR-0076), so the count arrives via this measured JSON.
  return { monolithLines, frozenBudget: frozen, delta, surfaces: ml.surfaces ?? null };
}
