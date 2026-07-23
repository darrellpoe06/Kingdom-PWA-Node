// =============================================================================
// review-watcher — the review-sequences watcher, wired THROUGH the three brakes
// =============================================================================
// The seed-review-sequences concern: "Review sequences are not running — there
// is no watcher driving the staged review/freshness loop." This is that watcher,
// built the DR-0225 way: every run passes through lib/agent-brakes — the
// kill-switch is checked FIRST, the single-instance lock is taken (a
// concurrent fire SKIPS, never stacks), the budget caps the work, repeated
// failures trip the switch, and only success beats the heartbeat.
//
// What a run DOES: extract the dated re-review commitments from the REAL
// ledgers (re-reviews.js over __DR_LEDGER__ / __UIUX_REVIEWS__ rows — every
// item is a literal `re-review: <date>` in a decision or review finding,
// nothing invented) and produce the drive report: what is OVERDUE (act now)
// and what is DUE SOON (pull forward), each naming its source record. The
// report is the "staged proposals actually move through review" signal — it
// goes wherever the runner puts it (Ari's surface, a job summary, a rolling
// issue) instead of waiting for someone to remember.
//
// INERT BY CONSTRUCTION (ship inactive — DR-0225): importing this module
// schedules nothing. A runner (the scheduled workflow, once activated on a
// watched proof; or the app surface on open) calls runReviewWatch explicitly.
// Pure + deterministic: nowMs injected, state in an injected store.
// =============================================================================

import { extractReReviews, reReviewStatus, sortReReviews } from './re-reviews.js';
import { createBudget, acquireLock, releaseLock, killSwitch, memoryStore } from './agent-brakes.js';

export const WATCHER_NAME = 'review-watcher';

// Consecutive-failure ceiling: the Nth straight failure trips the kill-switch
// (P10: repeated failure PAUSES; it never keeps retrying into a runaway).
export const MAX_CONSECUTIVE_FAILURES = 3;

const FAIL_KEY = `watcher-fails:${WATCHER_NAME}`;
const readFails = (store) => { const n = parseInt(store.getItem(FAIL_KEY) || '0', 10); return Number.isFinite(n) ? n : 0; };

// The watcher as a self-describing fleet member for Ari's oversight board.
// ACTIVE since 2026-07-23: the scheduled runner (review-watcher.yml, daily
// 11:23 UTC) was activated on the watched dispatch proof — run 30014172152,
// green in 19s (DR-0225 activate-on-proof). The why is IN the record, read
// not invented (DR-0158).
export const REVIEW_WATCHER_MEMBER = Object.freeze({
  id: WATCHER_NAME,
  name: 'Review-sequences watcher',
  kind: 'app-watcher',
  active: true,
  braked: true,
  whyRecorded: true,
  why: 'Drives the staged review/freshness loop: extracts every dated re-review commitment from the decision + review ledgers and surfaces what is overdue / due soon, so proposals move through review instead of sitting (seed-review-sequences; DR-0225 brakes-in).',
});

// runReviewWatch — one braked run. Injectable `extract` exists so the failure
// path is provable in tests (a throwing extractor is the staged runaway).
export function runReviewWatch({
  reviews = null, decisions = null,
  store = memoryStore(), nowMs = 0,
  limits = {}, extract = extractReReviews,
} = {}) {
  const { maxItems = 500, maxWallMs = 5 * 60000, staleMs = 30 * 60000, missedMs = 14 * 86400000 } = limits;

  // BRAKE 3 first — a paused watcher does NO work until an explicit reset.
  const kill = killSwitch(store, WATCHER_NAME, { nowMs, missedMs });
  const paused = kill.check(nowMs);
  if (paused.paused) return { ok: false, paused: true, reason: paused.reason, report: null };

  // BRAKE 2 — single instance. A concurrent fire skips; it never stacks.
  const lock = acquireLock(store, WATCHER_NAME, { nowMs, staleMs, holder: `run@${nowMs}` });
  if (!lock.acquired) return { ok: false, skipped: true, reason: lock.reason, report: null };

  // BRAKE 1 — the budget: item + wall-clock ceilings on the run itself.
  const budget = createBudget({ maxUnits: maxItems, maxWallMs, nowMs });

  try {
    const items = extract({ reviews, decisions }, nowMs) || [];
    const kept = [];
    let truncated = 0;
    for (const it of items) {
      if (budget.exceeded(nowMs).exceeded) { truncated = items.length - kept.length; break; }
      budget.spend(1);
      kept.push(it);
    }
    const overdue = sortReReviews(kept.filter((it) => reReviewStatus(it).status === 'problem'), 'date', 'asc');
    const dueSoon = sortReReviews(kept.filter((it) => reReviewStatus(it).status === 'attention'), 'date', 'asc');
    const report = {
      generatedAtMs: nowMs,
      counts: { total: items.length, scanned: kept.length, overdue: overdue.length, dueSoon: dueSoon.length, truncated },
      overdue, dueSoon,
      // No silent caps: a truncated scan says so in the report itself.
      truncatedNote: truncated > 0 ? `budget ceiling reached — ${truncated} item(s) not scanned this run` : null,
    };
    // Success: reset the failure streak and beat the heartbeat.
    store.setItem(FAIL_KEY, '0');
    kill.beat(nowMs);
    return { ok: true, report, brakes: { budget: budget.snapshot(nowMs), lock: 'released', kill: 'beating' } };
  } catch (e) {
    // Repeated failure trips the switch — the watcher pauses itself rather
    // than retrying forever (and stays paused until an attributed reset).
    const fails = readFails(store) + 1;
    store.setItem(FAIL_KEY, String(fails));
    if (fails >= MAX_CONSECUTIVE_FAILURES) {
      kill.trip(`${fails} consecutive failures — last: ${e && e.message ? e.message : 'unknown error'}`);
    }
    return { ok: false, failed: true, consecutiveFailures: fails, tripped: fails >= MAX_CONSECUTIVE_FAILURES, reason: e && e.message ? e.message : 'unknown error', report: null };
  } finally {
    releaseLock(store, WATCHER_NAME);
  }
}

// formatWatchReport — the report as plain markdown for a job summary / rolling
// issue / Ari panel. Every line names its source record (evidence, DR-0076).
export function formatWatchReport(report) {
  if (!report) return 'No report (run paused, skipped, or failed).';
  const line = (it) => `- **${it.sourceId || it.title}** · ${reReviewStatus(it).label} · due ${it.date} · ${it.source || ''}`;
  const parts = [
    `Review watch · scanned ${report.counts.scanned}/${report.counts.total} dated commitments`,
    '',
    `**Overdue (${report.counts.overdue})** — act now:`,
    ...(report.overdue.length ? report.overdue.map(line) : ['- none']),
    '',
    `**Due within 7 days (${report.counts.dueSoon})** — pull forward:`,
    ...(report.dueSoon.length ? report.dueSoon.map(line) : ['- none']),
  ];
  if (report.truncatedNote) parts.push('', `_${report.truncatedNote}_`);
  return parts.join('\n');
}
