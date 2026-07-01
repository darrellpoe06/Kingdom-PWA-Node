// =============================================================================
// budget-engine.js — the goal-driven, forward-looking budget engine (pure math)
// =============================================================================
// "Plan from income; look down the pipeline; warn before the overspend."
// (Darrell, 2026-07-01.) This is the DETERMINISTIC layer that sits ON TOP of the
// forward projection engine (financial-engineering.js) and the categorized
// ledger (transaction-analysis.js). It answers three questions from the family's
// OWN real data — never investment advice, never money movement:
//
//   1. GOAL PLANNING     — "save $X by date Y" / "pay off Z": what must be set
//      aside per period to stay on track, on/off-track, projected finish date.
//   2. CATEGORY vs PLAN  — month-to-date spend per category against a plan
//      derived from real trailing history, pace-aware ("running hot in X").
//   3. PIPELINE + GUIDANCE — upcoming obligations down the pipeline, and the
//      proactive hold / covered / behind signals WITH THEIR REASON.
//
// DETERMINISTIC-FIRST (DR-0076, sovereign): every number AND every reason string
// here is computed by plain arithmetic over real records — no LLM, no network,
// no randomness. An LLM may LATER rephrase a signal's `reason` into warmer prose,
// but the engine is complete and correct without it, so guidance never depends on
// a model being reachable. Guardrail: this is a BUDGETING / CASH-FLOW PLANNING
// tool on the owner's own goals + data (YNAB/Mint-style) — NOT personalized
// investment or financial advice, and it recommends NO investments or trades.
//
// HONEST CONFIDENCE: guidance is only as good as the ledger is complete +
// categorized. dataConfidence() reads monthCoverage + reviewStatus and every
// guidance payload carries a confidence level so the UI can show "based on
// partial data" instead of faking precision on a thin/uncategorized ledger.
//
// Kept a pure leaf module (imports only sibling pure libs) so the whole thing is
// fast and trivially unit-testable; the component only renders what it returns.
// =============================================================================

import {
  monthsBetween, monthLabelFrom, liveCashOnHand, deriveMonthlyFlows,
  deriveEntityFlows, deriveLumpEvents, deriveDebts, cashForScope,
} from './financial-engineering.js';
import { monthCoverage, reviewStatus } from './transaction-analysis.js';

function round2(x) { return Math.round((Number(x) || 0) * 100) / 100; }
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

// Whole-calendar-month step forward (matches financial-engineering's convention).
export function addMonths(date, n) {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

export function daysInMonth(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

// Fraction of the CURRENT calendar month already elapsed, in [0,1]. Day 1 of a
// 30-day month reads ~0.033; the last day reads 1. Used to pace a monthly plan:
// halfway through the month you should have spent ~half the plan, not all of it.
export function fractionOfMonthElapsed(date) {
  const d = date instanceof Date ? date : new Date(date);
  return clamp(d.getDate() / daysInMonth(d), 0, 1);
}

function isoDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

// -----------------------------------------------------------------------------
// freeMonthlyForScope — the steady monthly cash a scope has left AFTER its known
// steady obligations, i.e. what is genuinely available to pour into goals. This
// is the honest denominator for "can we hit the goal in time": it is the base
// net monthly (income minus steady outflow), NOT gross income. Non-monthly lumps
// are handled separately in the pipeline view, so they aren't double-counted.
// -----------------------------------------------------------------------------
export function freeMonthlyForScope(data, scope = 'consolidated') {
  if (scope === 'consolidated' || scope === 'family') {
    return round2(deriveMonthlyFlows(data).netMonthly);
  }
  return round2(deriveEntityFlows(data, scope).netMonthly);
}

// -----------------------------------------------------------------------------
// remainingForGoal — how much is still needed to reach a goal, from REAL state.
//   save   → targetAmount - currentAmount (what's already set aside toward it).
//   payoff → the LIVE balance of the linked debt right now (deriveDebts), so a
//            payment posted to the ledger moves the goal without any re-entry.
//            Falls back to targetAmount when no debt is linked/found.
// Returns { remaining, basis, liveBalance } — basis names where it came from so
// the UI can be transparent (DR-0076 no-painted-number).
// -----------------------------------------------------------------------------
export function remainingForGoal(goal, data, asOf = new Date()) {
  if (goal.goalType === 'payoff') {
    const debts = deriveDebts(data, asOf);
    const linked = goal.linkedDebtId ? debts.find((d) => d.id === goal.linkedDebtId) : null;
    if (linked) {
      return { remaining: round2(Math.max(0, linked.balance)), basis: 'live-debt', liveBalance: round2(linked.balance) };
    }
    return { remaining: round2(Math.max(0, Number(goal.targetAmount) || 0)), basis: 'target-amount', liveBalance: null };
  }
  const target = Number(goal.targetAmount) || 0;
  const have = Number(goal.currentAmount) || 0;
  return { remaining: round2(Math.max(0, target - have)), basis: 'target-minus-saved', liveBalance: null };
}

// -----------------------------------------------------------------------------
// planGoal — the core per-goal plan. Given the remaining amount, the deadline,
// and the monthly cash available to THIS goal, compute:
//   requiredMonthly  — remaining / whole months left to the target date.
//   projectedMonths  — at the available pace, how many months to actually hit it.
//   projectedDate    — that pace's finish date (may be after the target).
//   status           — 'achieved' | 'on-track' | 'behind' | 'no-date' | 'at-risk'.
// Deterministic; interest is NOT modeled into requiredMonthly (principal pace) —
// the engine says so rather than fake amortization it can't verify per goal.
// -----------------------------------------------------------------------------
export function planGoal(goal, opts = {}) {
  const { currentDate = new Date(), available = 0, remaining: remainingIn = null, data = null } = opts;
  const rem = remainingIn != null
    ? { remaining: round2(Math.max(0, remainingIn)), basis: 'explicit', liveBalance: null }
    : remainingForGoal(goal, data || {}, currentDate);
  const remaining = rem.remaining;
  const target = Number(goal.targetAmount) || 0;
  const pctFunded = target > 0 ? clamp(round2(((target - remaining) / target) * 100), 0, 100) : (remaining <= 0 ? 100 : 0);

  if (remaining <= 0.01) {
    return {
      goalId: goal.id, remaining: 0, requiredMonthly: 0, monthsRemaining: null,
      projectedMonths: 0, projectedDate: isoDay(currentDate), onTrack: true,
      status: 'achieved', shortfallMonthly: 0, pctFunded: 100, basis: rem.basis, liveBalance: rem.liveBalance,
    };
  }

  const avail = round2(Math.max(0, Number(available) || 0));
  // Months left until the deadline (at least 1 so we never divide by zero and a
  // due-this-month goal shows the full remaining as this month's requirement).
  let monthsRemaining = null;
  if (goal.targetDate) {
    const td = new Date(goal.targetDate);
    if (!isNaN(td.getTime())) monthsRemaining = Math.max(1, monthsBetween(currentDate, td));
  }

  // At the available pace, when do we actually finish? (Infinity if pace is 0.)
  const projectedMonths = avail > 0 ? Math.ceil(remaining / avail) : Infinity;
  const projectedDate = Number.isFinite(projectedMonths) ? isoDay(addMonths(currentDate, projectedMonths)) : null;

  if (monthsRemaining == null) {
    // A goal with no deadline: report the pace-based finish, not on/off-track.
    return {
      goalId: goal.id, remaining, requiredMonthly: 0, monthsRemaining: null,
      projectedMonths: Number.isFinite(projectedMonths) ? projectedMonths : null,
      projectedDate, onTrack: avail > 0, status: 'no-date',
      shortfallMonthly: 0, pctFunded, basis: rem.basis, liveBalance: rem.liveBalance,
    };
  }

  const requiredMonthly = round2(remaining / monthsRemaining);
  const onTrack = avail + 0.5 >= requiredMonthly; // half-dollar tolerance
  const shortfallMonthly = round2(Math.max(0, requiredMonthly - avail));
  // 'at-risk' = the deadline is impossible even by pouring ALL available cash in;
  // 'behind'  = achievable but the current allocation falls short of required.
  let status;
  if (onTrack) status = 'on-track';
  else if (avail <= 0) status = 'at-risk';
  else status = 'behind';

  return {
    goalId: goal.id, remaining, requiredMonthly, monthsRemaining,
    projectedMonths: Number.isFinite(projectedMonths) ? projectedMonths : null,
    projectedDate, onTrack, status, shortfallMonthly, pctFunded,
    basis: rem.basis, liveBalance: rem.liveBalance,
  };
}

// -----------------------------------------------------------------------------
// allocateGoals — spread the scope's free monthly cash across active goals in
// priority order (soonest deadline first, then explicit priority, then largest
// required). Each goal greedily draws its requiredMonthly; when the pool runs
// dry the rest are under-funded. Returns per-goal plans decorated with the
// ACTUAL monthly allocation they received, plus the pool summary. This is what
// makes the guidance honest: two goals competing for the same paycheck can't
// both silently claim to be on track.
// -----------------------------------------------------------------------------
export function allocateGoals(goals, data, opts = {}) {
  const { currentDate = new Date(), scope = 'consolidated', freeMonthly = null } = opts;
  const pool0 = freeMonthly != null ? round2(freeMonthly) : freeMonthlyForScope(data, scope);
  const active = (goals || [])
    .filter((g) => g && !g.archived && (g.scope || 'consolidated') === scope)
    .map((g) => ({ goal: g, rem: remainingForGoal(g, data, currentDate) }))
    .filter((x) => x.rem.remaining > 0.01);

  // Order: nearest deadline first (dateless goals last), then user priority asc,
  // then larger requirement first — deterministic and stable.
  active.sort((a, b) => {
    const ad = a.goal.targetDate || '9999-12-31';
    const bd = b.goal.targetDate || '9999-12-31';
    if (ad !== bd) return ad < bd ? -1 : 1;
    const ap = Number(a.goal.priority) || 0;
    const bp = Number(b.goal.priority) || 0;
    if (ap !== bp) return ap - bp;
    return b.rem.remaining - a.rem.remaining;
  });

  let pool = Math.max(0, pool0);
  const plans = active.map(({ goal, rem }) => {
    // First pass with the FULL pool to learn this goal's requirement...
    const req = planGoal(goal, { currentDate, available: pool0, remaining: rem.remaining, data });
    const need = req.requiredMonthly || 0;
    const allocated = round2(Math.min(pool, need > 0 ? need : rem.remaining));
    pool = round2(Math.max(0, pool - allocated));
    // ...then re-plan with what it ACTUALLY got, so status reflects competition.
    const plan = planGoal(goal, { currentDate, available: allocated, remaining: rem.remaining, data });
    return { goal, ...plan, allocated };
  });

  const totalRequired = round2(plans.reduce((s, p) => s + (p.requiredMonthly || 0), 0));
  return {
    scope,
    freeMonthly: pool0,
    totalRequired,
    surplus: round2(pool0 - totalRequired),
    fullyFunded: totalRequired <= pool0 + 0.5,
    remainingPool: pool,
    plans,
  };
}

// -----------------------------------------------------------------------------
// deriveCategoryPlans — a per-category monthly PLAN derived from real trailing
// history (no config required to start; DR-0076 grounded-in-real-data). For each
// spending category, take the outflow total in each of the last `lookbackMonths`
// COMPLETE months and use the average as the plan. Optional `overrides` (a map
// of category -> monthly plan the user set) win over the derived value, so the
// "signals the user controls" path is ready without a schema change. Income
// (credits) and transfer-like categories are ignored — a plan is a spend ceiling.
// -----------------------------------------------------------------------------
export function deriveCategoryPlans(txns, opts = {}) {
  const { currentDate = new Date(), lookbackMonths = 3, overrides = {} } = opts;
  // The complete months are the `lookbackMonths` months BEFORE the current one.
  const monthKeys = [];
  for (let i = 1; i <= lookbackMonths; i++) {
    const d = addMonths(currentDate, -i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const keySet = new Set(monthKeys);
  const byCat = {}; // cat -> { total, perMonth: {m: total} }
  for (const t of txns || []) {
    if (!t || !t.date) continue;
    const amt = Number(t.amount) || 0;
    if (amt >= 0) continue; // outflow only
    const m = String(t.date).slice(0, 7);
    if (!keySet.has(m)) continue;
    const cat = t.category || 'other';
    const c = byCat[cat] || (byCat[cat] = { perMonth: {} });
    c.perMonth[m] = (c.perMonth[m] || 0) + Math.abs(amt);
  }
  const plans = {};
  const cats = new Set([...Object.keys(byCat), ...Object.keys(overrides || {})]);
  for (const cat of cats) {
    const perMonth = (byCat[cat] && byCat[cat].perMonth) || {};
    const monthsSeen = Object.keys(perMonth).length;
    const derived = monthsSeen > 0
      ? round2(Object.values(perMonth).reduce((s, v) => s + v, 0) / lookbackMonths)
      : 0;
    const override = overrides && overrides[cat] != null ? round2(Number(overrides[cat])) : null;
    plans[cat] = {
      category: cat,
      plan: override != null ? override : derived,
      derived,
      override,
      monthsSeen,
      source: override != null ? 'user' : 'derived',
    };
  }
  return plans;
}

// -----------------------------------------------------------------------------
// categorySpendMTD — month-to-date outflow per category for the CURRENT calendar
// month (positive numbers = money spent). The live left side of the vs-plan check.
// -----------------------------------------------------------------------------
export function categorySpendMTD(txns, currentDate = new Date()) {
  const m = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const spent = {};
  for (const t of txns || []) {
    if (!t || !t.date) continue;
    if (String(t.date).slice(0, 7) !== m) continue;
    const amt = Number(t.amount) || 0;
    if (amt >= 0) continue;
    const cat = t.category || 'other';
    spent[cat] = round2((spent[cat] || 0) + Math.abs(amt));
  }
  return spent;
}

// -----------------------------------------------------------------------------
// categoryStatus — the pace-aware category-vs-plan scoreboard. For each category
// with a plan, compare month-to-date spend against what SHOULD be spent by this
// point in the month (plan * fraction elapsed), and project the full-month total
// at the current run-rate. `threshold` is the sensitivity the user controls
// (default 0.15 = 15% over): status is
//   'over'  — already spent more than the WHOLE month's plan;
//   'hot'   — on pace to finish > plan*(1+threshold) (the early warning);
//   'ok'    — tracking within the plan;
//   'under' — pacing well below plan (headroom).
// Sorted worst-first so the UI leads with what needs attention.
// -----------------------------------------------------------------------------
export function categoryStatus(plans, spentMTD, opts = {}) {
  const { currentDate = new Date(), threshold = 0.15 } = opts;
  const frac = Math.max(0.01, fractionOfMonthElapsed(currentDate));
  const rows = [];
  const cats = new Set([...Object.keys(plans || {}), ...Object.keys(spentMTD || {})]);
  for (const cat of cats) {
    const plan = (plans[cat] && plans[cat].plan) || 0;
    const spent = round2(spentMTD[cat] || 0);
    if (plan <= 0 && spent <= 0) continue;
    const expectedByNow = round2(plan * frac);
    const projected = round2(spent / frac); // run-rate full-month estimate
    let status;
    if (plan > 0 && spent > plan) status = 'over';
    else if (plan > 0 && projected > plan * (1 + threshold)) status = 'hot';
    else if (plan > 0 && projected < plan * (1 - threshold)) status = 'under';
    else status = 'ok';
    rows.push({
      category: cat, plan, spent, expectedByNow, projected,
      overBy: round2(Math.max(0, projected - plan)),
      remaining: round2(Math.max(0, plan - spent)),
      pctOfPlan: plan > 0 ? Math.round((spent / plan) * 100) : null,
      status, source: (plans[cat] && plans[cat].source) || 'derived',
    });
  }
  const rank = { over: 0, hot: 1, ok: 2, under: 3 };
  rows.sort((a, b) => (rank[a.status] - rank[b.status]) || (b.overBy - a.overBy) || (b.spent - a.spent));
  return rows;
}

// -----------------------------------------------------------------------------
// upcomingObligations — what's coming DOWN THE PIPELINE: the non-monthly bills
// (quarterly/annual/etc.) landing within the horizon, each with an approximate
// due month + running "cash after this lands" so the family can save ahead. Reads
// deriveLumpEvents (real recurringObligations) so it moves with the real data.
// `coveredBy` marks whether today's cash still covers everything up to and
// including that item. Returns soonest-first.
// -----------------------------------------------------------------------------
export function upcomingObligations(data, opts = {}) {
  const { currentDate = new Date(), months = 12, scope = 'consolidated', startingCash = null } = opts;
  const entityId = (scope === 'consolidated' || scope === 'family') ? null : scope;
  const lumps = deriveLumpEvents(data, currentDate, months, entityId)
    .filter((l) => l.amount < 0)
    .sort((a, b) => a.monthOffset - b.monthOffset);
  const cash0 = startingCash != null ? Number(startingCash) : cashForScope(data, currentDate, scope);
  let running = cash0;
  let cumulative = 0;
  return lumps.map((l) => {
    const amount = Math.abs(l.amount);
    running = round2(running - amount);
    cumulative = round2(cumulative + amount);
    return {
      label: l.label,
      amount: round2(amount),
      monthOffset: l.monthOffset,
      dueMonth: monthLabelFrom(currentDate, l.monthOffset),
      dueDateApprox: isoDay(addMonths(currentDate, l.monthOffset)),
      cashAfter: running,
      cumulative,
      coveredBySavings: running >= 0,
    };
  });
}

// -----------------------------------------------------------------------------
// dataConfidence — honest coverage/confidence for the whole engine. Reads
// monthCoverage (are months thin/missing) + reviewStatus (is it categorized).
// Returns a level the UI shows so guidance on a thin or uncategorized ledger is
// labeled "based on partial data" instead of faking precision (DR-0076).
// -----------------------------------------------------------------------------
export function dataConfidence(data) {
  const txns = data?.transactions || [];
  const cov = monthCoverage(txns);
  const rev = reviewStatus(txns);
  const thinCount = (cov.thin || []).length;
  const pctCat = rev.pctCategorized;
  let level = 'high';
  const reasons = [];
  if (rev.total === 0) { level = 'none'; reasons.push('No transactions loaded yet.'); }
  else {
    if (pctCat < 60) { level = 'low'; reasons.push(`${100 - pctCat}% of transactions are still uncategorized.`); }
    else if (pctCat < 85) { level = 'medium'; reasons.push(`${100 - pctCat}% of transactions still need a category.`); }
    if (thinCount > 0) {
      reasons.push(`${thinCount} month${thinCount === 1 ? '' : 's'} look thin or missing (${(cov.thin || []).join(', ')}).`);
      if (level === 'high') level = 'medium';
      if (level === 'medium' && thinCount >= 3) level = 'low';
    }
  }
  return {
    level, pctCategorized: pctCat, needsReview: rev.needsReview, total: rev.total,
    thinMonths: cov.thin || [], reasons,
    message: reasons.length ? reasons.join(' ') : 'Ledger looks complete and categorized.',
  };
}

// -----------------------------------------------------------------------------
// buildGuidance — the orchestrator. Turns the plans + category status + pipeline
// into an ordered list of proactive SIGNALS, each with a deterministic plain-
// language `reason` (do-spend / don't-spend / hold / covered / behind). The UI
// shows these; the user controls them (dismiss, adjust threshold). An LLM may
// rephrase `reason` later, but the signal + its numbers are already exact here.
//
// Signal shape: { id, kind, severity, category?, title, reason, amount? }
//   kind:     'goal' | 'category' | 'obligation' | 'covered' | 'coverage'
//   severity: 'alert' (act now) | 'watch' (heads-up) | 'info' (good news / FYI)
// -----------------------------------------------------------------------------
export function buildGuidance(data, goals, opts = {}) {
  const {
    currentDate = new Date(), scope = 'consolidated', months = 12,
    threshold = 0.15, categoryOverrides = {},
  } = opts;

  const money = (n) => `$${Math.abs(Math.round(Number(n) || 0)).toLocaleString()}`;
  const signals = [];
  const confidence = dataConfidence(data);

  // 1) Confidence banner as a leading signal when the ledger is not solid.
  if (confidence.level === 'low' || confidence.level === 'none') {
    signals.push({
      id: 'coverage-warn', kind: 'coverage', severity: 'watch',
      title: 'Guidance is running on partial data',
      reason: `${confidence.message} Treat the numbers below as directional until the ledger is complete and categorized.`,
    });
  }

  // 2) Goal signals — one per active goal, from the competitive allocation.
  const alloc = allocateGoals(goals, data, { currentDate, scope });
  for (const p of alloc.plans) {
    const name = p.goal.name || 'Goal';
    if (p.status === 'on-track') {
      signals.push({
        id: `goal-${p.goal.id}`, kind: 'goal', severity: 'info',
        title: `${name}: on track`,
        amount: p.requiredMonthly,
        reason: `Set aside ${money(p.requiredMonthly)}/mo to reach ${money(p.goal.targetAmount)} by ${p.goal.targetDate || 'your date'} — ${money(p.remaining)} to go, ${p.pctFunded}% funded.`,
      });
    } else if (p.status === 'behind') {
      signals.push({
        id: `goal-${p.goal.id}`, kind: 'goal', severity: 'watch',
        title: `${name}: behind plan`,
        amount: p.shortfallMonthly,
        reason: `Needs ${money(p.requiredMonthly)}/mo but only ${money(p.allocated)} is free for it — ${money(p.shortfallMonthly)}/mo short. At this pace it lands around ${p.projectedDate ? monthLabelFromISO(p.projectedDate) : 'later than planned'}. Free up ${money(p.shortfallMonthly)}/mo or move the date.`,
      });
    } else if (p.status === 'at-risk') {
      signals.push({
        id: `goal-${p.goal.id}`, kind: 'goal', severity: 'alert',
        title: `${name}: at risk`,
        amount: p.requiredMonthly,
        reason: `Reaching ${money(p.goal.targetAmount)} by ${p.goal.targetDate || 'the target'} needs ${money(p.requiredMonthly)}/mo, but there is no free monthly cash allocated to it right now. Raise income, cut outflow, or extend the date.`,
      });
    } else if (p.status === 'achieved') {
      signals.push({
        id: `goal-${p.goal.id}`, kind: 'goal', severity: 'info',
        title: `${name}: reached`,
        reason: `This goal is fully funded. ${p.goal.goalType === 'payoff' ? 'The linked balance is cleared.' : `You've set aside the full ${money(p.goal.targetAmount)}.`}`,
      });
    }
  }

  // 3) Category-vs-plan — the overspend / running-hot warnings WITH reasons.
  const plans = deriveCategoryPlans(data?.transactions, { currentDate, overrides: categoryOverrides });
  const spent = categorySpendMTD(data?.transactions, currentDate);
  const catRows = categoryStatus(plans, spent, { currentDate, threshold });
  for (const r of catRows) {
    if (r.status === 'over') {
      signals.push({
        id: `cat-${r.category}`, kind: 'category', severity: 'alert', category: r.category,
        title: `Over plan: ${r.category}`,
        amount: r.spent - r.plan,
        reason: `Already spent ${money(r.spent)} on ${r.category} this month — past the ${money(r.plan)} plan. Hold off here; every dollar more is over budget.`,
      });
    } else if (r.status === 'hot') {
      signals.push({
        id: `cat-${r.category}`, kind: 'category', severity: 'watch', category: r.category,
        title: `Running hot: ${r.category}`,
        amount: r.overBy,
        reason: `At ${money(r.spent)} so far, ${r.category} is on pace for ~${money(r.projected)} this month vs a ${money(r.plan)} plan — about ${money(r.overBy)} over. Ease up to stay on plan.`,
      });
    }
  }

  // 4) Pipeline — hold-for-what's-coming, and the covered good-news signal.
  const cash0 = cashForScope(data, currentDate, scope);
  const pipeline = upcomingObligations(data, { currentDate, months, scope, startingCash: cash0 });
  const soon = pipeline.filter((o) => o.monthOffset <= 3);
  const nearSum = round2(soon.reduce((s, o) => s + o.amount, 0));
  if (soon.length > 0) {
    const dips = soon.find((o) => o.cashAfter < 0);
    if (dips) {
      signals.push({
        id: 'pipeline-hold', kind: 'obligation', severity: 'alert',
        title: `Hold back — ${money(nearSum)} due soon`,
        amount: nearSum,
        reason: `${soon.map((o) => `${o.label} (${money(o.amount)}, ${o.dueMonth})`).join('; ')} land in the next 3 months. Current cash of ${money(cash0)} doesn't cover them all — it dips to ${money(dips.cashAfter)} around ${dips.dueMonth}. Set aside ${money(nearSum)} before spending elsewhere.`,
      });
    } else {
      const nextOne = soon[0];
      signals.push({
        id: 'pipeline-hold', kind: 'obligation', severity: 'watch',
        title: `Coming up: ${nextOne.label} (${money(nextOne.amount)})`,
        amount: nextOne.amount,
        reason: `${nextOne.label} of ${money(nextOne.amount)} is due around ${nextOne.dueMonth}. You're covered — cash stays at ${money(nextOne.cashAfter)} after it — but keep ${money(nextOne.amount)} reserved so it isn't spent by mistake.`,
      });
    }
  }

  // 5) Covered — explicit do-spend "you're fine here" when there's real surplus.
  if (alloc.surplus > 0 && (soon.length === 0 || soon.every((o) => o.cashAfter >= 0)) && confidence.level !== 'low' && confidence.level !== 'none') {
    signals.push({
      id: 'covered', kind: 'covered', severity: 'info',
      title: 'You have room this month',
      amount: alloc.surplus,
      reason: `After funding your goals and the bills in the pipeline, about ${money(alloc.surplus)}/mo is genuinely free. This is real breathing room — not a number to fear.`,
    });
  }

  const order = { alert: 0, watch: 1, info: 2 };
  signals.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    scope, confidence, allocation: alloc, categoryRows: catRows, pipeline,
    signals,
    counts: {
      alert: signals.filter((s) => s.severity === 'alert').length,
      watch: signals.filter((s) => s.severity === 'watch').length,
      info: signals.filter((s) => s.severity === 'info').length,
    },
  };
}

// Small helper: a friendly "Mon 'YY" label from an ISO day string (for reasons).
function monthLabelFromISO(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${M[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}
