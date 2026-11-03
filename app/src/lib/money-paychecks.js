// =============================================================================
// money-paychecks.js — paycheck-based budgeting over the Safe-to-Spend walk (pure)
// =============================================================================
// Christina, 2026-10-28: "Paycheck-based budgeting must account for the actual
// timing of income and bills. A bill due before the next paycheck must be
// reserved from money already available. Do not treat future income as
// available before its expected receipt date. The paycheck view must clearly
// identify any period where income is insufficient to cover scheduled
// obligations."
//
// The periods are cut at the engine's own income events (lib/safe-to-spend.js:
// an entered pay schedule, else a rhythm inferred from real deposits and
// labeled so, else nothing — a world with no known paydays returns no periods
// and says what is missing). Period 0 runs from today to the first payday and
// has NO income: its obligations are funded from cash already on hand, minus
// the cushion. Each later period is funded by the paycheck that opens it plus
// whatever the previous period left over (never a deficit carried as money).
// A shortfall is named per period and never netted against later income.
// =============================================================================
import { buildSafeToSpend, addDays, isoDay, parseDay } from './safe-to-spend.js';

const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;

export function paycheckPeriods(data, opts = {}) {
  const asOfRaw = opts.currentDate instanceof Date ? opts.currentDate : new Date();
  const asOf = new Date(asOfRaw.getFullYear(), asOfRaw.getMonth(), asOfRaw.getDate());
  const horizonDays = Number(opts.horizonDays) || 90;
  const end = addDays(asOf, horizonDays);
  const result = buildSafeToSpend(data, { ...opts, currentDate: asOf, period: 'custom', customEnd: isoDay(end) });
  const items = (result.items || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const paydays = [...new Set(items.filter((it) => it.kind === 'income' && it.date > isoDay(asOf)).map((it) => it.date))].sort();
  const missing = [];
  if (!paydays.length) missing.push('No upcoming pay dates are known. Enter a pay schedule in Money → Settings; a rhythm the ledger shows is used until then and labeled inferred.');
  const cushion = Number(result.lines.minCushion) || 0;
  const bounds = [isoDay(asOf), ...paydays, isoDay(end)];
  const periods = [];
  let carriedIn = 0;
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i]; const next = bounds[i + 1];
    const last = i === bounds.length - 2;
    // period i holds items dated in [start, next) — the payday that opens the NEXT period is not in this one
    const inPeriod = items.filter((it) => (i === 0 ? it.date >= start : it.date >= start) && (last ? it.date <= next : it.date < next));
    const income = inPeriod.filter((it) => it.amount > 0);
    const outflows = inPeriod.filter((it) => it.amount < 0);
    const obligations = round2(outflows.reduce((s, it) => s + Math.abs(it.amount), 0));
    const incomeTotal = round2(income.reduce((s, it) => s + it.amount, 0));
    const fromCash = i === 0 ? round2(Math.max(0, (Number(result.lines.availableCash) || 0) - cushion)) : 0;
    const funds = round2(fromCash + carriedIn + incomeTotal);
    const shortfall = round2(Math.max(0, obligations - funds));
    const leftover = round2(Math.max(0, funds - obligations));
    periods.push({
      index: i, start, end: last ? next : isoDay(addDays(parseDay(next), -1)), nextPayday: last ? null : next,
      source: i === 0 ? 'cash-on-hand' : 'paycheck',
      income: incomeTotal, incomeItems: income, inferredIncome: income.some((it) => it.inferred),
      fromCash, carriedIn, funds, obligations, items: outflows,
      shortfall, leftover, sufficient: shortfall === 0,
      note: i === 0
        ? `Bills due before the next paycheck come from cash on hand (after the cushion); the next paycheck is not counted until ${paydays[0] || 'it is known'}.`
        : `Funded by the paycheck of ${start}${carriedIn > 0 ? ` plus ${round2(carriedIn)} carried from the period before` : ''}.`,
    });
    carriedIn = leftover;
  }
  return {
    periods,
    paydays,
    missing,
    status: result.status,
    reasons: result.confidence.reasons,
    availableCash: result.lines.availableCash,
    cushion,
    horizon: { start: isoDay(asOf), end: isoDay(end) },
    insufficientCount: periods.filter((p) => !p.sufficient).length,
  };
}
