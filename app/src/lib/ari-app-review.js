// =============================================================================
// ari-app-review — Ari's COMPREHENSIVE, cloud-runnable review of the PoeTech app
// =============================================================================
// Darrell 2026-07-11 (two Projects screenshots): "We need Ari to have better
// comprehensive reviews of the PoeTech App."
//
// The house already had review PIECES — the perpetual history (perpetual-report),
// the NAS-bound LLM diff review (llm-review, needs the NAS + a branch), the
// concerns board, the App Firm-Up %, the board/build sync — but no ONE review
// that assesses the WHOLE app in the cloud, across dimensions, with evidence per
// finding. This is that review: Ari SYNTHESIZES the app's own real records into a
// ranked, dimensional health read that runs anywhere the app runs (no NAS, no
// diff), so a comprehensive review is always one tap away.
//
// EVIDENCE, NOT CLAIMS (DR-0076). Every finding is computed from a REAL record —
// a board_tasks row vs its build-record spec, an open item with no date, an
// overdue re-review parsed from the ledger, an open concern, a derived data
// contradiction. Each finding carries an `evidence` string that names the count
// and source, and an `action` that points at the existing fix. Nothing is
// painted; a clean dimension reports 'ok' honestly, never a fake score.
//
// PURE + deterministic (nowMs injected; proven-to-catch in ari-app-review.test.js).
// It COMPOSES the tested signal producers rather than re-deriving them:
//   board.js (staleSeedStatuses/missingSeedTasks/SEED_BOARDS/tasksForBoard),
//   completion.js (overallCompletion/projectedFinish),
//   re-reviews.js (extractReReviews/reReviewStatus),
//   derive-concerns.js (deriveDataConcerns).
// =============================================================================
import { SEED_BOARDS, tasksForBoard, staleSeedStatuses, missingSeedTasks } from './board.js';
import { overallCompletion, projectedFinish } from './completion.js';
import { extractReReviews, reReviewStatus } from './re-reviews.js';
import { deriveDataConcerns } from './derive-concerns.js';

// Severity ranking — shared vocabulary with llm-review so the whole app reads
// findings the same way. Higher = worse.
export const REVIEW_SEVERITY_RANK = { bug: 3, warning: 2, nit: 1, ok: 0 };

// The dimensions Ari reviews, in display order. `key` is stable (tests + surface).
export const REVIEW_DIMENSIONS = [
  ['delivery', 'Delivery integrity', 'Does the board reflect what actually shipped?'],
  ['plan', 'Plan health', 'Can every open item reach the timeline, and is anything overdue?'],
  ['reviews', 'Review freshness', 'Are dated re-reviews being honored, or slipping?'],
  ['backlog', 'Concern & feedback backlog', 'What has the family raised that is still open?'],
  ['data', 'Data integrity', 'Do the real records contradict themselves?'],
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isOpen = (t) => t && t.status !== 'done';
const isArchived = (t) => !!(t && (t.archived || t.status === 'archived'));

function finding(dimension, severity, title, evidence, action, extra = {}) {
  return { dimension, severity, title, evidence, action, ...extra };
}

// ---- dimension: delivery integrity -----------------------------------------
// The exact drift the screenshot flagged: the build record marks an item shipped
// (seed spec status 'done') while the board still reads 'not-started'. Plus
// specced items that were never loaded onto the board.
function reviewDelivery(tasks) {
  const findings = [];
  let driftTotal = 0;
  let missingTotal = 0;
  for (const b of SEED_BOARDS) {
    const boardTasks = tasksForBoard(tasks, b.slug);
    // A board with no tasks is simply not-started (a fresh instance), not a
    // drift/unloaded finding — only review boards actually in use, so the review
    // is honest for a new user's empty world (DR-0076, no noise).
    if (!boardTasks.length) continue;
    const drift = staleSeedStatuses(b.slug, boardTasks);
    if (drift.length) {
      driftTotal += drift.length;
      findings.push(finding(
        'delivery', 'warning',
        `${b.title}: ${drift.length} item${drift.length === 1 ? '' : 's'} shipped in the build record but still read "Not started"`,
        `${drift.length} board_tasks row(s) on ${b.slug} whose seed spec status is 'done' while the live status is 'not-started'`,
        'Sync statuses from the build record',
        { board: b.slug, count: drift.length },
      ));
    }
    const missing = missingSeedTasks(b.slug, boardTasks);
    if (missing.length) {
      missingTotal += missing.length;
      findings.push(finding(
        'delivery', 'nit',
        `${b.title}: ${missing.length} specced item${missing.length === 1 ? '' : 's'} not yet loaded onto the board`,
        `${missing.length} seed spec row(s) for ${b.slug} with no matching board_tasks row`,
        'Load the newly-specced items',
        { board: b.slug, count: missing.length },
      ));
    }
  }
  return { key: 'delivery', findings, metrics: { drift: driftTotal, unloaded: missingTotal } };
}

// ---- dimension: plan health -------------------------------------------------
// Undated open items never reach the 12-month timeline (DR-0170); overdue open
// items are past their committed date and still not done.
function reviewPlan(tasks, nowMs) {
  const findings = [];
  const finish = projectedFinish(tasks);
  if (finish.undatedOpen > 0) {
    findings.push(finding(
      'plan', 'warning',
      `${finish.undatedOpen} open item${finish.undatedOpen === 1 ? '' : 's'} have no target date — they can't reach the timeline`,
      `projectedFinish: ${finish.undatedOpen} open item(s) with no dueDate (of ${finish.datedOpen + finish.undatedOpen} open)`,
      'Give each open item a target date (Ari sequences by dependency)',
      { count: finish.undatedOpen },
    ));
  }
  const overdue = (Array.isArray(tasks) ? tasks : []).filter((t) => {
    if (!isOpen(t) || isArchived(t)) return false;
    const d = t.dueDate;
    if (typeof d !== 'string' || !DATE_RE.test(d)) return false;
    return Date.parse(`${d}T23:59:59Z`) < nowMs;
  });
  if (overdue.length) {
    findings.push(finding(
      'plan', 'warning',
      `${overdue.length} open item${overdue.length === 1 ? '' : 's'} past the committed target date`,
      `${overdue.length} open board_tasks row(s) whose dueDate is before now`,
      'Re-date or finish the overdue items',
      { count: overdue.length },
    ));
  }
  return { key: 'plan', findings, metrics: { undated: finish.undatedOpen, overdue: overdue.length, finish: finish.date } };
}

// ---- dimension: review freshness -------------------------------------------
// Dated re-reviews parsed from the review + decision ledgers (re-reviews.js).
// Overdue ones are the ones slipping; due-soon are the near backlog.
function reviewFreshness({ reviews, decisions }, nowMs) {
  const items = extractReReviews({ reviews, decisions }, nowMs);
  const findings = [];
  let overdue = 0;
  let soon = 0;
  for (const it of items) {
    const st = reReviewStatus(it);
    if (st.status === 'problem') overdue += 1;
    else if (st.status === 'attention') soon += 1;
  }
  if (overdue > 0) {
    findings.push(finding(
      'reviews', 'warning',
      `${overdue} dated re-review${overdue === 1 ? '' : 's'} overdue`,
      `${overdue} re-review item(s) parsed from REVIEWS.md / the DR ledger with a past due date`,
      'Run the overdue re-reviews (Review feed)',
      { count: overdue },
    ));
  }
  if (soon > 0) {
    findings.push(finding(
      'reviews', 'nit',
      `${soon} re-review${soon === 1 ? '' : 's'} due within 7 days`,
      `${soon} re-review item(s) due soon`,
      'Pull the near re-reviews forward',
      { count: soon },
    ));
  }
  return { key: 'reviews', findings, metrics: { overdue, soon, total: items.length } };
}

// ---- dimension: concern & feedback backlog ---------------------------------
function reviewBacklog({ concerns, feedback }) {
  const findings = [];
  const cs = Array.isArray(concerns) ? concerns : [];
  const openC = cs.filter((c) => c && c.status === 'open').length;
  const wipC = cs.filter((c) => c && c.status === 'in-progress').length;
  if (openC > 0) {
    findings.push(finding(
      'backlog', 'warning',
      `${openC} concern${openC === 1 ? '' : 's'} open (named, not yet started)`,
      `${openC} concerns row(s) with status 'open'`,
      'Start or schedule the open concerns',
      { count: openC },
    ));
  }
  if (wipC > 0) {
    findings.push(finding(
      'backlog', 'nit',
      `${wipC} concern${wipC === 1 ? '' : 's'} in progress`,
      `${wipC} concerns row(s) with status 'in-progress'`,
      'Drive the in-progress concerns to done',
      { count: wipC },
    ));
  }
  // Feedback that carries an explicit open/unaddressed status; only counted when
  // the shape actually says so (never invents an "unread" state — DR-0076).
  const fb = Array.isArray(feedback) ? feedback : [];
  const openFb = fb.filter((f) => f && (f.status === 'open' || f.status === 'new' || f.addressed === false)).length;
  if (openFb > 0) {
    findings.push(finding(
      'backlog', 'nit',
      `${openFb} feedback item${openFb === 1 ? '' : 's'} awaiting a response`,
      `${openFb} feedback row(s) marked open / not addressed`,
      'Triage the open feedback',
      { count: openFb },
    ));
  }
  return { key: 'backlog', findings, metrics: { openConcerns: openC, wipConcerns: wipC, openFeedback: openFb } };
}

// ---- dimension: data integrity ---------------------------------------------
// The self-contradictions the app can detect in the family's real financial data
// (coverage gaps, door-collapse, shape mismatches) — deriveDataConcerns.
function reviewData({ transactions, rentals, debts }) {
  const derived = deriveDataConcerns({ transactions, rentals, debts }) || [];
  const findings = derived.map((c) => finding(
    'data', 'warning',
    c.concern || c.title || 'Data contradiction',
    c.detail || c.why || 'A derived contradiction in the real records',
    c.action || c.solution || 'Reconcile the source records',
    { source: c.id || c.area || 'derived' },
  ));
  return { key: 'data', findings, metrics: { count: findings.length } };
}

// worst severity among a dimension's findings -> the dimension's status.
function worstSeverity(findings) {
  let worst = 'ok';
  for (const f of findings) {
    if (REVIEW_SEVERITY_RANK[f.severity] > REVIEW_SEVERITY_RANK[worst]) worst = f.severity;
  }
  return worst;
}

// ---------------------------------------------------------------------------
// buildAppReview — the whole comprehensive review. nowMs is injected (pure).
// Returns:
//   { generatedAtMs, completion, dimensions: [{key,label,question,status,findings,metrics}],
//     findings: [ranked], summary: { status, counts:{bug,warning,nit}, total, topActions } }
// ---------------------------------------------------------------------------
export function buildAppReview(input = {}, nowMs = 0) {
  const {
    tasks = [], concerns = [], feedback = [], reviews = null, decisions = null,
    transactions = [], rentals = [], debts = [],
  } = input;

  const raw = [
    reviewDelivery(tasks),
    reviewPlan(tasks, nowMs),
    reviewFreshness({ reviews, decisions }, nowMs),
    reviewBacklog({ concerns, feedback }),
    reviewData({ transactions, rentals, debts }),
  ];
  const labelOf = Object.fromEntries(REVIEW_DIMENSIONS.map(([k, label, q]) => [k, { label, question: q }]));

  const dimensions = raw.map((d) => ({
    key: d.key,
    label: labelOf[d.key].label,
    question: labelOf[d.key].question,
    status: worstSeverity(d.findings),
    findings: d.findings,
    metrics: d.metrics,
  }));

  const findings = rankFindings(dimensions.flatMap((d) => d.findings));
  const counts = { bug: 0, warning: 0, nit: 0 };
  for (const f of findings) if (counts[f.severity] != null) counts[f.severity] += 1;

  const summary = {
    status: worstSeverity(findings),
    counts,
    total: findings.length,
    // The top actions to pull next: the most-severe findings, de-duplicated by action.
    topActions: dedupeActions(findings).slice(0, 5),
  };

  return { generatedAtMs: nowMs, completion: overallCompletion(tasks), dimensions, findings, summary };
}

// Rank findings most-severe first; stable within a severity (dimension order).
export function rankFindings(findings) {
  return (findings || [])
    .map((f, i) => [f, i])
    .sort((a, b) => (REVIEW_SEVERITY_RANK[b[0].severity] - REVIEW_SEVERITY_RANK[a[0].severity]) || (a[1] - b[1]))
    .map((x) => x[0]);
}

function dedupeActions(rankedFindings) {
  const seen = new Set();
  const out = [];
  for (const f of rankedFindings) {
    const key = f.action || f.title;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ action: f.action, severity: f.severity, count: f.count || null });
  }
  return out;
}

// A one-line human summary of the review (for a heading / a spoken read).
export function reviewHeadline(review) {
  if (!review || !review.summary) return 'No review yet.';
  const { total, counts, status } = review.summary;
  if (total === 0) return 'Comprehensive review: clean — no open findings across all dimensions.';
  const parts = [];
  if (counts.bug) parts.push(`${counts.bug} critical`);
  if (counts.warning) parts.push(`${counts.warning} to address`);
  if (counts.nit) parts.push(`${counts.nit} minor`);
  return `Comprehensive review: ${parts.join(', ')} (worst: ${status}).`;
}
