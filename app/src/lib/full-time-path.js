// =============================================================================
// full-time-path — when the family can work full time inside PoeTech, and when
// the next hire is both needed and paid for (DR-1129)
// =============================================================================
// Darrell, 2026-10-20: "The goal would be to have we able to work full-time
// inside PoeTech.... based on workloads and revenue... and to be able to keep
// hiring to support this industry... in our businesses and children." Then:
// "Not church only.... the PoeTech App allowed me to build the other apps...
// so making apps for businesses and churches etc..."
//
// So revenue is a set of LINES, not one: churches on the $200 floor, business
// plans, family plans, and apps built for a business or a church (each build
// is work as well as revenue). Every line has the same four entries: how many,
// the price of each a month, what each costs to run a month, and the hours
// each takes a month.
//
// Two questions, answered from the same entries:
// - REVENUE: does what comes in, less the platform, the running costs and the
//   reserve, cover each person's full-time pay with its employer costs?
// - WORKLOAD: do the hours all the lines need fit the hours on the payroll?
// A hire is NEEDED when the workload passes the capacity guard's 80% line
// (lib/opportunity-capacity.js uses the same threshold) and PAID FOR when the
// revenue covers that hire's pay as well. A hire needed before it is paid for
// is the "dead process" DR-1128 exists to prevent: the answer then is the
// price or the pace, not a hope.
//
// "How many more" is asked of ONE line at a time (the one chosen to grow),
// with every other line held where it was entered. People are paid in the
// order entered. Pure and deterministic. NOTHING IS GUESSED (DR-0076): a pay,
// hour, count or cost nobody entered is named as missing and nothing is
// claimed until it is filled.
// =============================================================================
import { MEASURED_PLATFORM_MONTHLY_CENTS } from './church-cost-to-serve.js';

// The capacity guard's warn line: past this share of the hours, more help is due.
export const HIRE_AT_LOAD_PCT = 80;
// Search ceiling for "how many more", so numbers that can never cover the pay
// say so instead of looping.
export const MAX_ADDED = 10000;

const known = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const num = (v) => Number(v);

/**
 * lines:  [{ name, count, priceCents, costCents, hoursEach }]   (each a month)
 * people: [{ role, monthlyPayCents, hoursPerMonth }]             (paid in order)
 * growLine: index of the line "how many more" is counted in.
 */
export function fullTimePath({
  lines = [],
  growLine = 0,
  platformMonthlyCents = MEASURED_PLATFORM_MONTHLY_CENTS,
  employerCostPct,
  reservePct = 20,
  people = [],
  nextHire = null,
} = {}) {
  const missing = [];
  if (!lines.length) missing.push('at least one revenue line');
  lines.forEach((l, i) => {
    const what = l.name || `line ${i + 1}`;
    if (!known(l.count)) missing.push(`how many ${what}`);
    if (!known(l.priceCents)) missing.push(`the price for ${what}`);
    if (!known(l.costCents)) missing.push(`the running cost for ${what}`);
    if (!known(l.hoursEach)) missing.push(`the hours for ${what}`);
  });
  if (!known(employerCostPct)) missing.push('employer costs (%)');
  if (!people.length) missing.push('who is going full time');
  people.forEach((p, i) => {
    const who = p.role || `person ${i + 1}`;
    if (!known(p.monthlyPayCents)) missing.push(`${who}'s full-time pay`);
    if (!known(p.hoursPerMonth)) missing.push(`${who}'s hours a month`);
  });
  if (nextHire) {
    if (!known(nextHire.monthlyPayCents)) missing.push("the next hire's pay");
    if (!known(nextHire.hoursPerMonth)) missing.push("the next hire's hours a month");
  }
  if (missing.length) return { complete: false, missing };

  const g = Math.min(Math.max(0, Math.floor(num(growLine) || 0)), lines.length - 1);
  const ctx = { lines, g, platformMonthlyCents, employerCostPct, reservePct, people, nextHire };
  const now = month(ctx, 0);

  // The least number ADDED to the growing line at which a step comes true.
  const firstAt = (test) => {
    for (let k = 0; k <= MAX_ADDED; k += 1) if (test(month(ctx, k))) return k;
    return null;
  };
  const eachFullTimeAt = people.map((_, i) => firstAt((m) => m.fullTimeCovered > i));
  const hireNeededAt = nextHire ? firstAt((m) => m.loadPct >= HIRE_AT_LOAD_PCT) : null;
  const hireAffordableAt = nextHire ? firstAt((m) => m.hireAffordable) : null;

  return {
    complete: true,
    missing,
    growName: lines[g].name || `line ${g + 1}`,
    ...now,
    eachFullTimeAt,
    allFullTimeAt: eachFullTimeAt[eachFullTimeAt.length - 1],
    hireNeededAt,
    hireAffordableAt,
    // Needed before it is paid for: the work outruns the money.
    hireGap: hireNeededAt !== null && (hireAffordableAt === null || hireNeededAt < hireAffordableAt)
      ? (hireAffordableAt === null ? null : hireAffordableAt - hireNeededAt) : 0,
  };
}

function month({ lines, g, platformMonthlyCents, employerCostPct, reservePct, people, nextHire }, added) {
  let revenueCents = 0;
  let lineCostCents = 0;
  let workloadHours = 0;
  lines.forEach((l, i) => {
    const n = Math.floor(num(l.count)) + (i === g ? added : 0);
    revenueCents += n * Math.round(num(l.priceCents));
    lineCostCents += n * Math.round(num(l.costCents));
    workloadHours += n * num(l.hoursEach);
  });
  const reserveCents = Math.ceil(revenueCents * Math.max(0, num(reservePct) || 0) / 100);
  const runCents = Math.round(num(platformMonthlyCents)) + lineCostCents;
  const forPeopleCents = revenueCents - reserveCents - runCents;
  const loaded = (p) => Math.ceil(Math.round(num(p.monthlyPayCents)) * (1 + num(employerCostPct) / 100));

  let left = forPeopleCents;
  let fullTimeCovered = 0;
  for (const p of people) {
    if (left < loaded(p)) break;
    left -= loaded(p);
    fullTimeCovered += 1;
  }
  const payrollCents = people.reduce((s, p) => s + loaded(p), 0);
  const allCovered = fullTimeCovered === people.length;
  const capacityHours = people.reduce((s, p) => s + num(p.hoursPerMonth), 0);
  const loadPct = capacityHours > 0 ? Math.round((workloadHours / capacityHours) * 100) : (workloadHours > 0 ? Infinity : 0);

  return {
    added,
    revenueCents,
    reserveCents,
    runCents,
    forPeopleCents,
    payrollCents,
    fullTimeCovered,
    allCovered,
    shortCents: allCovered ? 0 : payrollCents - forPeopleCents,
    workloadHours: Math.round(workloadHours * 10) / 10,
    capacityHours,
    loadPct,
    hireAffordable: nextHire ? allCovered && left >= loaded(nextHire) : false,
  };
}
