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

// Local urgency rank for the budget's spend order (overdue < due-soon < later).
// Derived from reReviewStatus so it can never drift from the status the report
// renders — one definition of "urgent", read rather than restated.
const urgencyRank = (it) => {
  const s = reReviewStatus(it).status;
  return s === 'problem' ? 0 : s === 'attention' ? 1 : 2;
};


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
    // URGENCY-ORDERED SPEND (2026-09-08): the budget caps how many commitments a
    // run carries, but it must not decide WHICH ones arbitrarily. Spending in
    // extraction order meant the ceiling dropped whatever happened to sit at the
    // tail of the ledger scan — on the real repo (599 commitments, ceiling 500)
    // that silently withheld 99, and an OVERDUE item could be among them while a
    // far-future one was kept. The ceiling is unchanged (same units, same
    // truncation note); only the ORDER it consumes is fixed, so what survives a
    // truncated run is always the most urgent. A brake may bound the work; it
    // may never bias the finding.
    const byDate = sortReReviews(items, 'date', 'asc');
    const ordered = byDate.slice().sort((a, b) => urgencyRank(a) - urgencyRank(b));

    // A RESERVED SLICE so the ceiling cannot erase a whole category (2026-09-08).
    // Ordering by urgency alone still let the most urgent class eat the entire
    // budget: on the real repo, 502 overdue consumed all 500 units and the
    // "due within 7 days — pull forward" section rendered EMPTY while 27 items
    // were due that week. Starving a category is the same defect as biasing the
    // order, one layer up — the operator loses the whole pull-forward view and
    // cannot tell it is missing. So due-soon holds a floor of up to a fifth of
    // the ceiling; whatever it does not need returns to overdue, which means a
    // run with few due-soon items behaves exactly as before.
    const DUE_SOON_SHARE = 0.2;
    const soonAll = ordered.filter((it) => reReviewStatus(it).status === 'attention');
    // The Math.min is for readability only -- slice() already clamps -- so a
    // mutation removing it changes nothing and no gate pins it. Said here
    // because an unpinned line invites a future reader to assume it is load-bearing.
    const soonQuota = Math.min(soonAll.length, Math.floor(maxItems * DUE_SOON_SHARE));
    const soonKeep = new Set(soonAll.slice(0, soonQuota));
    // The floor is spent FIRST, or it is not a floor: left in urgency order the
    // reserved rows still sat behind all 502 overdue and the ceiling never
    // reached them. Order inside `kept` carries no meaning — each section is
    // re-sorted by date when the report is built.
    const spendOrder = [
      ...soonAll.slice(0, soonQuota),
      ...ordered.filter((it) => !soonKeep.has(it)),
    ];

    const kept = [];
    let truncated = 0;
    for (const it of spendOrder) {
      if (budget.exceeded(nowMs).exceeded) { truncated = spendOrder.length - kept.length; break; }
      budget.spend(1);
      kept.push(it);
    }
    const overdue = sortReReviews(kept.filter((it) => reReviewStatus(it).status === 'problem'), 'date', 'asc');
    const dueSoon = sortReReviews(kept.filter((it) => reReviewStatus(it).status === 'attention'), 'date', 'asc');
    // TRUE TOTALS, over every extracted item rather than the kept ones (2026-09-08).
    // `overdue.length` is how many overdue rows this run could SHOW; on a
    // truncated run that is the ceiling, not the count. The real repo read
    // "Overdue (500)" while 502 were actually past due — the ceiling answering
    // a question about the backlog. Extraction already produced every item, so
    // the true tallies are free; the brake bounds what is LISTED, never what is
    // COUNTED. Same rule as the spend order above, one layer up.
    const overdueTotal = items.filter((it) => reReviewStatus(it).status === 'problem').length;
    const dueSoonTotal = items.filter((it) => reReviewStatus(it).status === 'attention').length;
    const report = {
      generatedAtMs: nowMs,
      counts: {
        total: items.length, scanned: kept.length, truncated,
        overdue: overdueTotal, dueSoon: dueSoonTotal,
        overdueShown: overdue.length, dueSoonShown: dueSoon.length,
      },
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
  // The DISTINGUISHER is not optional. One record routinely carries several
  // open commitments that share a date (docs/decisions/INDEX.md alone had five
  // for 2026-08-25), and without the clause text every one of them renders as
  // the same row — a report a reader cannot act on, which is the failure
  // re-reviews.js already computes `detail` to prevent. The in-app surface
  // showed it; this report, the one the daily drive and the job summary read,
  // dropped it. Evidence over identifier (DR-0076).
  const line = (it) => {
    const head = `- **${it.sourceId || it.title}** · ${reReviewStatus(it).label} · due ${it.date} · ${it.source || ''}`;
    return it.detail ? `${head}\n  - ${it.detail}` : head;
  };
  const shown = (total, listed) => {
    if (listed == null || listed >= total) return '';
    return listed === 0
      ? ' — none listed, the ceiling was spent elsewhere'
      : ` — showing the ${listed} most urgent`;
  };
  const parts = [
    `Review watch · scanned ${report.counts.scanned}/${report.counts.total} dated commitments`,
    '',
    // A count that differs from what is listed says so, rather than letting the
    // shown rows read as the whole truth.
    `**Overdue (${report.counts.overdue})**${shown(report.counts.overdue, report.counts.overdueShown)} — act now:`,
    ...(report.overdue.length ? report.overdue.map(line) : ['- none']),
    '',
    `**Due within 7 days (${report.counts.dueSoon})**${shown(report.counts.dueSoon, report.counts.dueSoonShown)} — pull forward:`,
    ...(report.dueSoon.length ? report.dueSoon.map(line) : ['- none']),
  ];
  if (report.truncatedNote) parts.push('', `_${report.truncatedNote}_`);
  return parts.join('\n');
}
