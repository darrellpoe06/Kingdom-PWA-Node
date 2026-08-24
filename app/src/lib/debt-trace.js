// =============================================================================
// debt-trace — every number on the Debts tab defends itself (tap → sources)
// =============================================================================
// Darrell 2026-08-24: "need to be able to evaluate the debts for all data that
// supports the number in each cell like our standards... click and see the
// source and meta data available... asap.... or slow because of the risks
// etc... either way is understood based on the data."
//
// The house standard is the traceable number (number-trace.js, Darrell
// 2026-06-16: "click on the number... and have it be a link to the sources").
// These are PURE builders of the same trace shape — { title, formula, result,
// inputs, sources, note } — computed from the SAME debt rows the surface
// renders, so a trace can never drift from its figure (DR-0076). Where a
// number's provenance is unknown, the trace says unknown; it never invents.

const money = (v) => ({ value: v, kind: 'money' });
const pctv = (v) => ({ value: v, kind: 'percent' });
const text = (v) => ({ value: v, kind: 'text' });

// --- Per-cell traces ---------------------------------------------------------

// RATE: where did this interest rate come from?
export function traceDebtRate(d) {
  const sources = [];
  if (d.rateSource === 'derived') {
    sources.push({ label: 'Read from this card’s own statement interest charges', ...text('statement-derived (data)') });
  } else if (d.rateSource === 'override') {
    sources.push({ label: 'Typed by hand — a deliberate override', ...text('override') });
    if (d.dataRate != null) sources.push({ label: 'The statements themselves say', ...pctv(d.dataRate) });
  } else if (d.rateKnown) {
    sources.push({ label: 'Entered on this row (rate edit / Add terms)', ...text('typed') });
  } else {
    sources.push({ label: 'No rate known yet — nothing entered, no statement interest seen', ...text('unknown, not zero') });
  }
  const inputs = [];
  if (d.rateMin != null) {
    inputs.push({ label: 'Issuer quotes a range — low end', ...pctv(d.rateMin) });
    inputs.push({ label: 'High end (the payoff is figured here, never rosier)', ...pctv(d.rate) });
  }
  return {
    title: `${d.name} · interest rate`,
    formula: d.rateMin != null
      ? 'The issuer quotes a range; every projection uses the HIGH end so no date is rosier than you can count on.'
      : 'The single rate used by every projection on this tab.',
    result: d.rateKnown ? pctv(d.rate) : text('—'),
    inputs,
    sources,
  };
}

// BALANCE: what stands behind the amount owed?
export function traceDebtBalance(d) {
  const sources = [
    { label: d.accountId ? 'This account’s recorded balance (edit writes to the account)' : 'Recorded on this row', ...money(d.balance) },
  ];
  if (isFinite(Number(d.highestBalance)) && Number(d.highestBalance) > 0) {
    sources.push({ label: 'Highest balance ever recorded (the peak)', ...money(d.highestBalance) });
  }
  const inputs = [];
  if (d.utilization != null && isFinite(Number(d.creditLimit))) {
    inputs.push({ label: 'Credit limit', ...money(d.creditLimit), op: '÷' });
    inputs.push({ label: 'Utilization', ...pctv(Math.round(d.utilization)) });
  }
  const paid = Number(d.highestBalance) - Number(d.balance);
  return {
    title: `${d.name} · balance owed`,
    formula: 'Today’s owed amount; “paid down” is peak minus today — your own numbers, never an estimate.',
    result: money(d.balance),
    inputs,
    sources,
    note: isFinite(paid) && paid > 0.5 ? `Paid down from the peak so far: $${Math.round(paid).toLocaleString()}.` : undefined,
  };
}

// MIN: the monthly payment the projections lean on.
export function traceDebtMin(d) {
  return {
    title: `${d.name} · monthly payment`,
    formula: 'The minimum/monthly payment; it funds the payoff timeline when no live payment history exists yet.',
    result: money(d.minPayment),
    inputs: [],
    sources: [
      { label: d.minPayment > 0 ? 'Entered on this row (or pre-filled from a recognized recurring payment)' : 'Not entered yet', ...text(d.minPayment > 0 ? 'recorded' : 'missing') },
    ],
  };
}

// PAYOFF: WHY this date — and whether the pace is asap or slow, from the data.
export function traceDebtPayoff(d, clearedAtMonth = null) {
  const sources = [];
  const inputs = [];
  let formula;
  let result;
  let note;
  if (d.growing) {
    formula = 'Observed charges meet or exceed observed payments — the balance is not going down at the current pace.';
    result = text('not going down');
    note = 'The risk stated plainly: at this pace there is no payoff date. New charges are the reason — the data, not a judgment.';
  } else if (d.estPayoffOnTrack && d.estPayoffMonths) {
    formula = 'Months = balance ÷ observed NET paydown per month (your real payments minus new charges, from this card’s own transactions).';
    result = text(`~${d.estPayoffMonths} months, at your pace`);
    if (isFinite(Number(d.payPace))) inputs.push({ label: 'Observed gross payment / month', ...money(Math.round(d.payPace)) });
    if (isFinite(Number(d.netPaydown))) inputs.push({ label: 'Observed NET paydown / month', ...money(Math.round(d.netPaydown)) });
    sources.push({ label: 'Source: this card’s own transaction history', ...text('observed payments') });
  } else if (clearedAtMonth) {
    formula = 'The snowball projection: minimums on every debt + the extra attacking one debt at a time; cleared month is where this card falls in that cascade.';
    result = text(`month ${clearedAtMonth} of the plan`);
    sources.push({ label: 'Source: the snowball engine over balance + rate + minimum', ...text('projected, not observed') });
  } else if (d.hasPayments === false && !d.leaveAlone) {
    formula = 'No payments observed and no full terms — nothing honest to project from yet.';
    result = text('no payments seen');
    note = 'Add the rate and minimum (or import a statement) and this cell earns a date.';
  } else {
    formula = 'Not projectable with what is recorded.';
    result = text('—');
  }
  return { title: `${d.name} · payoff`, formula, result, inputs, sources, note };
}

// --- The band traces (the seven headline cells) ------------------------------

export function traceTotalDebt(debts) {
  const active = (debts || []).filter((x) => x && !x.leaveAlone);
  return {
    title: 'Total debt',
    formula: 'Sum of today’s balances across every active (not parked) debt.',
    result: money(Math.round(active.reduce((s, x) => s + (Number(x.balance) || 0), 0))),
    inputs: active.slice(0, 8).map((x) => ({ label: x.name, ...money(Math.round(x.balance)), op: '+' })),
    sources: [{ label: `${active.length} active accounts on this tab (parked “leave alone” excluded)`, ...text('their recorded balances') }],
  };
}

export function tracePaidDown(paidDown) {
  return {
    title: 'Paid down so far',
    formula: 'For each card with a recorded peak: peak − today’s balance, summed. Lifetime interest paid is not in the records, so it is not claimed.',
    result: money(paidDown.total),
    inputs: [],
    sources: [{ label: `${paidDown.counted} card${paidDown.counted === 1 ? '' : 's'} with a recorded peak`, ...text('highest-balance records') }],
  };
}

export function traceLeftToPay(outlook, withPlan, extra) {
  return withPlan
    ? {
        title: `Left to pay · with $${Math.round(extra).toLocaleString()}/mo extra`,
        formula: 'Today’s balances + every interest dollar the snowball projection still charges before zero.',
        result: money(outlook.withPlanTotal),
        inputs: [
          { label: 'Balances today', ...money(outlook.balance), op: '+' },
          { label: 'Interest still to come (with the plan)', ...money(outlook.withPlanTotal - outlook.balance), op: '+' },
        ],
        sources: [{ label: 'Source: the snowball engine (monthly interest accrual per card; daily-compounded card class per FLAG-1)', ...text('projection') }],
      }
    : {
        title: 'Left to pay · minimums only',
        formula: outlook.minOnlyFinishes
          ? 'Balances + interest under minimums-only.'
          : 'Balances + interest under minimums-only — PLUS the truth that some debts never finish: their minimums don’t cover their own interest.',
        result: money(outlook.minOnlyTotal),
        inputs: [
          { label: 'Balances today', ...money(outlook.balance), op: '+' },
          { label: 'Interest under minimums only', ...money(outlook.minOnlyTotal - outlook.balance), op: '+' },
        ],
        sources: [{ label: outlook.minOnlyFinishes ? 'Minimum-only projection' : `${outlook.stuckCount} debt(s) NEVER finish at minimums — the “+” is honest`, ...text('projection') }],
      };
}

export function traceSaved(outlook) {
  return {
    title: 'The extra money saves',
    formula: 'Minimums-only total left − with-the-plan total left. Every dollar here is interest never paid.',
    result: money(outlook.saved),
    inputs: [
      { label: 'Minimums-only left', ...money(outlook.minOnlyTotal), op: '−' },
      { label: 'With the plan left', ...money(outlook.withPlanTotal) },
    ],
    sources: [{ label: 'Both projections over the same debts, same day', ...text('projection difference') }],
  };
}
