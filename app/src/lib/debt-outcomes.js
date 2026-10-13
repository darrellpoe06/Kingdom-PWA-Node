// =============================================================================
// debt-outcomes — the Debts tab's headline truths, as pure arithmetic
// =============================================================================
// Darrell 2026-08-24 (Books > Debts screenshots): "add total payments up until
// today and total left to payoff with and without any added money... we want
// to show when there is more than the minimum payment being made and when
// it's not and the difference in outcome to be obvious."
//
// Every figure here is arithmetic on the family's OWN recorded numbers — the
// card peaks they recorded, the balances the ledger carries, the two payoff
// engines (lifecycle-and-flow.js) that already drive the tab. Nothing is
// estimated from outside data (DR-0076: measure, don't claim).

// --- Paid down until today ----------------------------------------------------
// The honest "total payments up until today" the data can actually support:
// how far each card has come DOWN from its highest recorded balance. (Lifetime
// interest paid historically is not in the records, so it is not claimed —
// this is principal ground regained, per the same green line each row shows.)
export function totalPaidDownFromPeaks(debts) {
  let total = 0;
  let counted = 0;
  for (const d of debts || []) {
    if (!d || d.leaveAlone) continue;
    const peak = Number(d.highestBalance);
    const bal = Number(d.balance);
    if (!isFinite(peak) || !isFinite(bal)) continue;
    const paid = peak - bal;
    if (paid > 0.5) { total += paid; counted += 1; }
  }
  return { total: Math.round(total), counted };
}

// --- Left to pay, with and without the added money ---------------------------
// "Left to payoff" = today's balances + the interest the journey still costs,
// under each world:
//   · WITH the plan (minimums + the extra): balances + snowball interest, and
//     a real finish date exists.
//   · MINIMUMS ONLY: balances + minimum-only interest — and when some debts'
//     minimums don't even cover their interest, there IS no finish: those are
//     named (stuckCount) instead of pretending a total closes the story.
export function payoffOutlook(debts, debtSnowball, debtMinOnly) {
  const active = (debts || []).filter((d) => d && !d.leaveAlone);
  const balance = Math.round(active.reduce((s, d) => s + (Number(d.balance) || 0), 0));
  const withPlan = balance + (Number(debtSnowball?.totalInterest) || 0);
  const minOnly = balance + (Number(debtMinOnly?.totalInterest) || 0);
  const stuckCount = (debtMinOnly?.stuckDebts || []).length;
  return {
    balance,
    withPlanTotal: withPlan,
    minOnlyTotal: minOnly,
    minOnlyFinishes: stuckCount === 0,
    stuckCount,
    saved: Math.max(0, minOnly - withPlan),
  };
}

// --- Above / below the minimum, per debt -------------------------------------
// The observed pace (payPace = the debt's real gross payment per month, from
// its own transactions) against its minimum. Returns null when there is no
// observed pace to speak from — silence, never a guess.
export function paymentPaceBadge(d) {
  if (!d || d.leaveAlone) return null;
  if (d.growing) {
    return { tone: 'growing', label: 'charges outpace payments' };
  }
  const pace = Number(d.payPace);
  const min = Number(d.minPayment);
  if (!isFinite(pace) || pace <= 0 || !isFinite(min) || min <= 0) return null;
  if (pace >= min * 1.05) {
    return { tone: 'above', label: `paying ~$${Math.round(pace).toLocaleString()}/mo · above the $${Math.round(min).toLocaleString()} min` };
  }
  if (pace < min * 0.95) {
    return { tone: 'below', label: `paying ~$${Math.round(pace).toLocaleString()}/mo · under the $${Math.round(min).toLocaleString()} min` };
  }
  return { tone: 'at', label: `paying the minimum (~$${Math.round(pace).toLocaleString()}/mo)` };
}

// --- The countdown: when are we down to only X debts left? -------------------
// Darrell 2026-08-24: "make sure we know when we can have each paid off with
// a only x number of debts left etc... type view." Groups the projected
// clearings by month and counts down what remains after each — including,
// honestly, the debts that CANNOT be scheduled yet (no rate/min terms): they
// stay in the "left" count and are named, so the countdown never pretends to
// reach zero while unscheduled debts remain.
export function debtCountdown(debts) {
  const active = (debts || []).filter((d) => d && !d.leaveAlone);
  const scheduled = active
    .filter((d) => Number.isFinite(d.clearedAtMonth) && d.clearedAtMonth > 0)
    .sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const unscheduled = active.length - scheduled.length;
  const milestones = [];
  let remaining = active.length;
  for (const d of scheduled) {
    const last = milestones[milestones.length - 1];
    remaining -= 1;
    if (last && last.monthOffset === d.clearedAtMonth) {
      last.cleared.push(d.name || 'debt');
      last.remaining = remaining;
    } else {
      milestones.push({ monthOffset: d.clearedAtMonth, cleared: [d.name || 'debt'], remaining });
    }
  }
  return {
    total: active.length,
    milestones,
    unscheduled,
    // Zero is only reached when every active debt has a projected clearing.
    reachesZero: unscheduled === 0 && active.length > 0,
  };
}

// Roll the per-debt badges up so the band can say it in one line.
export function paceSummary(debts) {
  const out = { above: 0, at: 0, below: 0, growing: 0, unknown: 0 };
  for (const d of debts || []) {
    if (!d || d.leaveAlone) continue;
    const b = paymentPaceBadge(d);
    if (!b) { out.unknown += 1; continue; }
    out[b.tone] += 1;
  }
  return out;
}
