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
import { extractReReviews, reReviewStatus, sortReReviews } from './re-reviews.js';
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
  ['inputs', 'Input follow-through', 'Did what the family added produce a usable result, or land inert?'],
  ['data', 'Data integrity', 'Do the real records contradict themselves?'],
  ['recurrence', 'Lessons recurrence', 'Are the documented past incident classes staying fixed?'],
  ['oversight', 'Agent-fleet oversight', 'Is every standing automation working for our good, with its brakes on?'],
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
// Cap the number of individually-named overdue re-reviews so a big backlog can't
// flood the review; the rest roll into one remainder finding. NAMING each one
// (which DR/REV, how overdue) is the point — a dated commitment nobody owns can't
// hide inside a count (Darrell 2026-07-13: "WHO WILL FOLLOWUP AND WHAT TIMELINE").
const OVERDUE_NAMED_CAP = 5;

function reviewFreshness({ reviews, decisions }, nowMs) {
  const items = extractReReviews({ reviews, decisions }, nowMs);
  const findings = [];
  const overdueItems = sortReReviews(
    items.filter((it) => reReviewStatus(it).status === 'problem'),
    'date', 'asc', // soonest past-due first = most overdue first (dates ascend)
  );
  const overdue = overdueItems.length;
  let soon = 0;
  for (const it of items) {
    if (reReviewStatus(it).status === 'attention') soon += 1;
  }
  // Name each overdue re-review as its own finding: the source (DR-xxxx / REV-xx),
  // its due date, and how many days it has slipped — a concrete, pullable item.
  overdueItems.slice(0, OVERDUE_NAMED_CAP).forEach((it) => {
    const who = it.sourceId || it.title || 're-review';
    const days = Math.abs(it.dueInDays);
    findings.push(finding(
      'reviews', 'warning',
      `${who} re-review overdue ${days}d`,
      `${it.source || 'ledger'} · was due ${it.date}`,
      `Run the ${who} re-review now, or re-date it with a reason (DR-0075)`,
      { sourceId: it.sourceId || null, date: it.date, dueInDays: it.dueInDays },
    ));
  });
  // The remainder, if the backlog is deeper than the cap.
  const rest = overdue - Math.min(overdue, OVERDUE_NAMED_CAP);
  if (rest > 0) {
    findings.push(finding(
      'reviews', 'warning',
      `${rest} more dated re-review${rest === 1 ? '' : 's'} overdue`,
      `${rest} additional re-review item(s) past due beyond the ${OVERDUE_NAMED_CAP} named above`,
      'Open the Review feed to run the rest',
      { count: rest },
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

// ---- dimension: input follow-through ---------------------------------------
// The bug class the 2026-07-23 Debts fix exposed: the family takes an action that
// creates a REAL record, but the surface then shows nothing usable — the tap
// "goes nowhere." Ari now watches for that directly on the live derived debts so
// the NEXT inert-input bug is caught before a human hits it (DR-0108 tighten the
// apps when we find a bug; DR-0076 evidence-per-finding). Two concrete signals,
// both computed from real derived-debt rows, both pointing at the inline fix:
//   · a family-DECLARED debt (manual) with no balance owed yet — added, but inert
//     until the amount is set (the exact "leave blank" path that used to vanish);
//   · any active debt that still needsTerms — it shows, but can't reach a payoff
//     date until a rate + minimum are present.
function reviewInputs({ debts }) {
  const rows = (Array.isArray(debts) ? debts : []).filter((d) => d && !d.leaveAlone);
  const findings = [];
  // Declared-but-no-balance: manual (treatAsDebt) debts sitting at ~$0 owed.
  const noBalance = rows.filter((d) => d.manual === true && !(Number(d.balance) > 0.01));
  if (noBalance.length) {
    findings.push(finding(
      'inputs', 'warning',
      `${noBalance.length} debt${noBalance.length === 1 ? '' : 's'} you added ${noBalance.length === 1 ? 'has' : 'have'} no amount owed yet`,
      `${noBalance.length} derived debt row(s) with manual:true and balance <= 0.01 (added via "Add as debt"/"Treat as debt", balance not set)`,
      'Set the amount owed on the Debts tab (the inline "+ owed" editor) so the payoff computes',
      { count: noBalance.length },
    ));
  }
  // Shows, but can't project a payoff — missing rate and/or minimum payment.
  const needTerms = rows.filter((d) => d.needsTerms === true && Number(d.balance) > 0.01);
  if (needTerms.length) {
    findings.push(finding(
      'inputs', 'nit',
      `${needTerms.length} debt${needTerms.length === 1 ? '' : 's'} can't show a payoff date until terms are added`,
      `${needTerms.length} derived debt row(s) with a balance but needsTerms:true (missing rate and/or minimum payment)`,
      'Add the rate + minimum on the Debts tab (inline "+ rate" / "+ pay") to compute the timeline',
      { count: needTerms.length },
    ));
  }
  return { key: 'inputs', findings, metrics: { noBalance: noBalance.length, needTerms: needTerms.length } };
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

// ---- dimension: lessons recurrence ------------------------------------------
// Ari "catching up on all the bugs — a lot of historical events and
// documentation" (Darrell 2026-07-23): the LESSONS-LEARNED incident classes,
// turned into LIVE recurrence checks over the data this review already holds.
// Each finding names the principle (P-id) and the dated incident it guards, so
// the historical record is a working instrument, not shelf paper. Only classes
// genuinely checkable from this data are checked here — the deploy/site/worker
// classes (P25/P26/P31/P32/P33) have their own standing witnesses (site-health,
// sw-nav-check, boot-check) and are not re-painted as pseudo-checks (DR-0076).
const DAY_MS = 86400000;
// P30 thresholds: the 2026-07-07 incident was month-old queue items that every
// count-based check called fine. Age is the failure signal, so age is checked.
export const QUEUE_AGE_DAYS = 21;
export const FEEDBACK_AGE_DAYS = 14;

// Days since a date string ('YYYY-MM-DD' or ISO); null when unparseable — an
// unknown age NEVER reads as fresh OR stale, it just isn't counted (DR-0076).
function ageDays(s, nowMs) {
  if (typeof s !== 'string' || !s) return null;
  const ms = Date.parse(DATE_RE.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(ms)) return null;
  return Math.floor((nowMs - ms) / DAY_MS);
}

export function reviewRecurrence({ concerns = [], feedback = [], transactions = [], demoRowIds = null } = {}, nowMs = 0) {
  const findings = [];
  const cs = (Array.isArray(concerns) ? concerns : []).filter((c) => c && (c.status === 'open' || c.status === 'in-progress'));
  // P30 — queue age: an open concern sitting past the age bar is the exact
  // "live view of an untended queue" the 2026-07-07 incident documented.
  // Age is measured from the LAST TOUCH (`refreshed`, falling back to `created`)
  // so a refresh pass actually clears the finding — "AGED ITEMS NEED REFRESH
  // OBVIOUSLY" (Darrell 2026-07-23, DR-0225): a worked/re-dated item stops
  // firing; an untouched one keeps firing until someone tends it.
  const touched = (c) => c.refreshed || c.created;
  const aged = cs.filter((c) => { const a = ageDays(touched(c), nowMs); return a != null && a > QUEUE_AGE_DAYS; });
  if (aged.length) {
    const oldest = Math.max(...aged.map((c) => ageDays(touched(c), nowMs)));
    findings.push(finding(
      'recurrence', 'warning',
      `P30 recurrence: ${aged.length} concern${aged.length === 1 ? '' : 's'} sitting open past ${QUEUE_AGE_DAYS} days (oldest ${oldest}d)`,
      `${aged.length} open/in-progress concerns row(s) untouched (refreshed/created) for > ${QUEUE_AGE_DAYS}d — the 2026-07-07 untended-queue class`,
      'Work or re-date the aged concerns (a live view of an untended queue is still stale)',
      { count: aged.length, oldestDays: oldest, principle: 'P30' },
    ));
  }
  // P30 — target slippage: a concern past its own committed targetDate and not
  // done ("concerns days past their targets" was literally in the incident).
  const slipped = cs.filter((c) => { const a = ageDays(c.targetDate, nowMs); return a != null && a > 0; });
  if (slipped.length) {
    findings.push(finding(
      'recurrence', 'warning',
      `P30 recurrence: ${slipped.length} concern${slipped.length === 1 ? '' : 's'} past ${slipped.length === 1 ? 'its' : 'their'} own target date`,
      `${slipped.length} open/in-progress concerns row(s) whose targetDate is before now — the 2026-07-07 slipped-targets class`,
      'Finish or honestly re-date the slipped concerns (DR-0075: a new date with a why, never a silent slide)',
      { count: slipped.length, principle: 'P30' },
    ));
  }
  // P30 — feedback age: family words waiting past the bar. The promote queue
  // holding month-old tester notes was one of the four stale surfaces.
  const fb = (Array.isArray(feedback) ? feedback : []).filter((f) => f && (f.status === 'open' || f.status === 'new' || f.addressed === false));
  const agedFb = fb.filter((f) => { const a = ageDays(f.createdAt || f.created, nowMs); return a != null && a > FEEDBACK_AGE_DAYS; });
  if (agedFb.length) {
    findings.push(finding(
      'recurrence', 'warning',
      `P30 recurrence: ${agedFb.length} feedback item${agedFb.length === 1 ? '' : 's'} waiting past ${FEEDBACK_AGE_DAYS} days`,
      `${agedFb.length} feedback row(s) still open/unaddressed with createdAt > ${FEEDBACK_AGE_DAYS}d ago — family words are build input, not shelf paper`,
      'Triage the aged feedback now (each item ends addressed, or dated with a why)',
      { count: agedFb.length, principle: 'P30' },
    ));
  }
  // P14 — demo-provenance leak: a demo-only row appearing in the live, signed-in
  // world is the 2026-06-11 demo-rows-in-the-cloud class recurring. The caller
  // passes demoRowIds ONLY for a signed-in, non-demo instance (seed rows are
  // legitimate starter state and are deliberately NOT flagged). Severity 'bug' —
  // this is a data-isolation regression, not housekeeping.
  let demoLeaks = 0;
  if (demoRowIds && typeof demoRowIds.has === 'function') {
    demoLeaks = (Array.isArray(transactions) ? transactions : []).filter((t) => t && typeof t.id === 'string' && demoRowIds.has(t.id)).length;
    if (demoLeaks > 0) {
      findings.push(finding(
        'recurrence', 'bug',
        `P14 recurrence: ${demoLeaks} demo-only row${demoLeaks === 1 ? '' : 's'} present in the live signed-in data`,
        `${demoLeaks} transaction row(s) whose id is in DEMO_ONLY_IDS while signed in outside demo mode — the 2026-06-11 provenance-leak class`,
        'Run the provenance sweep: enumerate every sync path and audit the cloud tables (P14) — demo rows never ride with real data',
        { count: demoLeaks, principle: 'P14' },
      ));
    }
  }
  return {
    key: 'recurrence',
    findings,
    metrics: { agedConcerns: aged.length, slippedTargets: slipped.length, agedFeedback: agedFb.length, demoLeaks, provenanceChecked: !!(demoRowIds && typeof demoRowIds.has === 'function') },
  };
}

// ---- dimension: agent-fleet oversight ---------------------------------------
// "A team or teams of agents supporting systems while Ari makes sure they are
// effectively working for our good" (Darrell 2026-07-23) — Ari's oversight of
// the standing-automation fleet, from the REAL build-measured workflow registry
// (never typed). Brake coverage comes only from agent-brakes.BRAKE_DECLARATIONS
// (which grows as real code wires the kit) — an ACTIVE automation with no
// proven brakes is the P10 class, named per member. When the registry isn't
// available (test/dev builds), fleetChecked reports false — an unchecked fleet
// never reads as a safe fleet (DR-0076).
function reviewOversight({ fleet = null } = {}) {
  const findings = [];
  const checked = !!(fleet && Array.isArray(fleet.members));
  if (checked && fleet.counts.activeUnbraked > 0) {
    const names = fleet.activeUnbraked.slice(0, 6).map((m) => m.name).join(', ');
    findings.push(finding(
      'oversight', 'warning',
      `${fleet.counts.activeUnbraked} active automation${fleet.counts.activeUnbraked === 1 ? '' : 's'} running without proven brakes`,
      `${fleet.counts.activeUnbraked} of ${fleet.counts.active} active fleet member(s) have no budget+lock+kill declaration (${names}) — the P10 class; today this honestly names the legacy n8n webhooks the Ways are retiring (DR-0132)`,
      'Wire each through lib/agent-brakes (or retire it per the DR-0132 P1-P5 migration); coverage counts only with all three brakes proven',
      { count: fleet.counts.activeUnbraked, principle: 'P10' },
    ));
  }
  // INTENTION CONSISTENCY (Darrell 2026-07-23: "fine tuned for the intentions
  // and intended purposes of the workflows so contextual understanding is
  // consistent"): an ACTIVE member with no recorded why is a named expertise
  // gap — Ari cannot judge "working for our good" without the purpose on
  // record (DR-0158). The why is always READ from the paired README, never
  // invented, so Ari's context stays consistent across every surface.
  if (checked && fleet.counts.activeNoWhy > 0) {
    const names = fleet.activeNoWhy.slice(0, 6).map((m) => m.name).join(', ');
    findings.push(finding(
      'oversight', 'warning',
      `${fleet.counts.activeNoWhy} active automation${fleet.counts.activeNoWhy === 1 ? '' : 's'} with no recorded intention (why)`,
      `${fleet.counts.activeNoWhy} active fleet member(s) whose why-we-use-it is unrecorded (${names}) — Ari cannot judge "working for our good" without the purpose on record (DR-0158)`,
      'Pair a README beside each export recording its intended purpose; Ari reads it, never invents it',
      { count: fleet.counts.activeNoWhy, principle: 'DR-0158' },
    ));
  }
  return {
    key: 'oversight',
    findings,
    metrics: checked
      ? { fleetChecked: true, ...fleet.counts }
      : { fleetChecked: false, total: 0, active: 0, braked: 0, activeUnbraked: 0, whyRecorded: 0, activeNoWhy: 0 },
  };
}

// ---------------------------------------------------------------------------
// deriveRecommendations — Ari's data-derived UPGRADE recommendations: not a
// problem/finding, but "you could do better," visible ONLY from the aggregate,
// live data Ari sees across the whole picture (Darrell 2026-07-23: "Ari should
// recommend upgrading whatever based on the data only Ari could know"). Evidence
// per recommendation (DR-0076); nothing here is generic advice — each is computed
// from the family's real rows. Pure.
// ---------------------------------------------------------------------------
export function deriveRecommendations({ debts = [] } = {}) {
  const recs = [];
  const active = (Array.isArray(debts) ? debts : []).filter((d) => d && !d.leaveAlone && Number(d.balance) > 0.01);
  // Interest-first opportunity: the highest-APR debt is where each extra dollar
  // saves the most — a call only the WHOLE debt picture (every rate at once) can
  // make. Only surfaces when at least two debts carry a real rate to compare.
  const withRate = active.filter((d) => Number(d.rate) > 0);
  if (withRate.length >= 2) {
    const top = withRate.reduce((a, b) => (Number(b.rate) > Number(a.rate) ? b : a));
    const ratePct = Number(top.rate).toFixed(2).replace(/\.00$/, '');
    recs.push({
      area: 'Debts',
      recommendation: `Aim extra payments at "${top.name}" first — at ${ratePct}% it's your highest-rate debt, so each extra dollar there kills the most interest (Avalanche order).`,
      basis: `Highest APR of ${withRate.length} rated debts: ${top.name} at ${ratePct}% on a $${Math.round(Number(top.balance)).toLocaleString()} balance`,
      action: 'Set the payoff order to Avalanche (highest rate) on the Debts tab',
    });
  }
  return recs;
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
    transactions = [], rentals = [], debts = [], demoRowIds = null, fleet = null,
  } = input;

  const raw = [
    reviewDelivery(tasks),
    reviewPlan(tasks, nowMs),
    reviewFreshness({ reviews, decisions }, nowMs),
    reviewBacklog({ concerns, feedback }),
    reviewInputs({ debts }),
    reviewData({ transactions, rentals, debts }),
    reviewRecurrence({ concerns, feedback, transactions, demoRowIds }, nowMs),
    reviewOversight({ fleet }),
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

  const recommendations = deriveRecommendations({ debts });

  return { generatedAtMs: nowMs, completion: overallCompletion(tasks), dimensions, findings, summary, recommendations };
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
