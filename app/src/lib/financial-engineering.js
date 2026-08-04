// =============================================================================
// financial-engineering.js — the forward projection engine (pure, no React)
// =============================================================================
// "Future financial situations should be clear" (Darrell, 2026-06-25). This is
// the LONG-HORIZON financial layer that sits ON TOP of the existing finance
// surfaces — it does NOT replace the per-account 30/60/90 cash forecast in Books
// (that stays the short-horizon, transaction-level view). This engine answers
// the bigger question — "where will we be financially in 12 / 24 / 36 months" —
// for each business, the church, the family, and consolidated.
//
// EVERY number here is DERIVED from real, persisted data (accounts + cleared
// transactions + recurring obligations + debts + rentals + salaries). Nothing is
// hardcoded. Change a salary, a rent, or an obligation and the projection moves.
// That is the whole point: a dynamic, tracked, grounded forecast — PROJECTIONS,
// NOT PROMISES (a model of the owner's own data, never investment advice).
//
// Design (kept a pure leaf module so the math is fast + trivially unit-testable):
//   projectCashFlow(inputs)         — the core projector (heavily tested)
//   liveCashOnHand(data, date)      — starting cash, derived from the real ledger
//   deriveMonthlyFlows(data)        — consolidated monthly in/out (matches Big Picture totals)
//   deriveEntityFlows(data, id)     — itemized per-entity monthly in/out
//   deriveLumpEvents(data, ...)     — non-monthly obligations landing on their real month
//   buildProjection(data, opts)     — wires the above together for a scope
//
// The two small helpers (monthLabelFrom, freqToMonthly) mirror the monolith's
// versions on purpose — re-implemented locally so this engine has NO import of
// poe-financial-mvp-v28.jsx (which would drag React into the projection math).
// =============================================================================

import { deriveApr, debtPayoffInsight, looksLikeDebtAccount, linkedDebtPaymentStats, estimatePayoff } from './debt-payments.js';

const MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Cash = spendable balances only. Mirrors the Big Picture `allAccountsCash`
// definition: credit/loan are debts, not cash; inLegal accounts are out of the
// financial picture (disputed/frozen/probate) and surface in the Legal tab.
export const CASH_TYPES = ['checking', 'savings', 'cash', 'investment'];

export function monthLabelFrom(date, offset) {
  const x = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`;
}

// Mirror of frequencyToMonthly in financial-calcs.js (kept local — see header).
export function freqToMonthly(amount, frequency) {
  const a = Number(amount) || 0;
  switch (frequency) {
    case 'monthly': return a;
    case 'quarterly': return a / 3;
    case 'semi-annual': return a / 6;
    case 'annual': return a / 12;
    case 'biennial': return a / 24;
    default: return 0;
  }
}

export function freqToMonths(frequency) {
  switch (frequency) {
    case 'monthly': return 1;
    case 'quarterly': return 3;
    case 'semi-annual': return 6;
    case 'annual': return 12;
    case 'biennial': return 24;
    default: return 0;
  }
}

function round2(x) {
  return Math.round((Number(x) || 0) * 100) / 100;
}

// Whole-month bucket distance from `from` to `to` (calendar months, sign-aware).
export function monthsBetween(from, to) {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

// -----------------------------------------------------------------------------
// deriveAccountBalances — the "Right now" balance for EVERY account (all types),
// derived from the real ledger:
//   balance = (openingBalance ?? balance) + sum of that account's CLEARED tx,
// where "cleared" = transaction date on or before `asOf`. openingBalance falls
// back to the stored `balance` for accounts that predate the field (and for
// user-created accounts with no ledger yet → now = balance).
//
// This is THE single source of truth for displayed balances across the whole
// app — Big Picture, Accounts, Entities, Transactions, and the forecast all read
// from here, so a transaction entered OR imported moves every balance in
// lockstep (no static seed, no painted number — DR-0076). Returns a plain map
// { [accountId]: balance } (credit/loan included; callers filter by type).
// -----------------------------------------------------------------------------
export function deriveAccountBalances(data, asOf = new Date()) {
  const clearedByAccount = {};
  for (const t of data?.transactions || []) {
    if (!t || !t.accountId) continue;
    const d = new Date(t.date);
    if (isNaN(d.getTime()) || d > asOf) continue; // only settled history
    clearedByAccount[t.accountId] = (clearedByAccount[t.accountId] || 0) + (Number(t.amount) || 0);
  }
  const out = {};
  for (const a of data?.accounts || []) {
    const opening = a.openingBalance != null ? a.openingBalance : (a.balance || 0);
    out[a.id] = round2(opening + (clearedByAccount[a.id] || 0));
  }
  return out;
}

// -----------------------------------------------------------------------------
// applyManualBalance — honor a hand-entered CURRENT balance (Christina's books,
// 2026-07-31). The number typed into the account editor is the account's current
// available balance — it must be what every surface displays, immediately.
//
// The defect this closes: for an account with imported history, the stored
// `balance` is only the derivation ANCHOR (`openingBalance ?? balance` at the
// start of the ledger), so writing the manual entry into `balance` made the app
// display entered + the whole imported history on top ($4,350.42 typed,
// $16,953 shown). And `openingBalance` cannot carry the correction because the
// accounts sync round-trip strips it (schema v1.2 has no such column — see
// accounts-sync.js fromRow), which would leave each device with a different
// balance (DR-0076 forbids device-dependent truth).
//
// So the correction is expressed IN the ledger, where it syncs like everything
// else: a visible `balance-adjustment` transaction of exactly (entered − derived
// now), which lands deriveAccountBalances on the entered number on every device
// and every surface. Imported rows (and their bank running balances) stay
// historical reference; they can never override the manual entry again.
//
// Three outcomes:
//  · anchor     — account has no cleared ledger rows: the stored balance IS the
//                 current balance; write it directly (fresh accounts, manual debts).
//  · adjustment — account has cleared rows: post the delta row, leave the anchor
//                 untouched (moving it would double-apply the correction).
//  · noop       — entered equals what is already displayed; nothing to record.
// -----------------------------------------------------------------------------
export function applyManualBalance(data, accountId, entered, asOf = new Date()) {
  const amount = round2(entered);
  const hasCleared = (data?.transactions || []).some((t) => {
    if (!t || t.accountId !== accountId) return false;
    const d = new Date(t.date);
    return !isNaN(d.getTime()) && d <= asOf;
  });
  if (!hasCleared) return { mode: 'anchor', balance: amount };
  const derivedNow = deriveAccountBalances(data, asOf)[accountId] ?? 0;
  const delta = round2(amount - derivedNow);
  if (Math.abs(delta) < 0.005) return { mode: 'noop' };
  return {
    mode: 'adjustment',
    adjustment: {
      date: asOf.toISOString().slice(0, 10),
      accountId,
      amount: delta,
      description: `Balance set to ${amount.toFixed(2)} — manual adjustment`,
      category: 'balance-adjustment',
      isBalanceAdjustment: true,
    },
  };
}

// -----------------------------------------------------------------------------
// resolveAccountUpdates — updateAccount's front door for the manual balance
// edit. Returns the updates the account row should actually store, posting the
// balance-adjustment row through `postTx` when applyManualBalance says this
// ledgered account needs one. In that case `balance` is blanked (undefined) so
// the stored anchor never moves — moving it too would double-apply the edit.
// -----------------------------------------------------------------------------
export function resolveAccountUpdates(data, accountId, updates, asOf = new Date(), postTx = () => {}) {
  if (!updates || updates.balance === undefined) return updates;
  const manual = applyManualBalance(data, accountId, parseFloat(updates.balance) || 0, asOf);
  if (manual.mode === 'anchor') return updates;
  if (manual.mode === 'adjustment') postTx(manual.adjustment);
  return { ...updates, balance: undefined };
}

// -----------------------------------------------------------------------------
// liveCashOnHand — TODAY'S spendable cash, derived from the real ledger. Cash =
// spendable balances only (excludes credit/loan debts + inLegal accounts).
// Reads deriveAccountBalances so it can never drift from the rest of the app.
// Returns the total plus a per-account breakdown (so per-entity views can sum
// their own accounts).
// -----------------------------------------------------------------------------
export function liveCashOnHand(data, currentDate = new Date()) {
  const balances = deriveAccountBalances(data, currentDate);
  const accounts = (data?.accounts || []).filter(
    (a) => CASH_TYPES.includes(a.type) && !a.inLegal && !a.treatAsDebt,
  );
  let total = 0;
  const byAccount = [];
  for (const a of accounts) {
    const balance = balances[a.id] != null ? balances[a.id] : 0;
    byAccount.push({ id: a.id, entityId: a.entityId, name: a.name, balance });
    total += balance;
  }
  return { total: round2(total), byAccount };
}

// -----------------------------------------------------------------------------
// deriveDebts — the Debts/snowball tab as a LIVE VIEW of real state (DR-0061),
// not a hand-maintained list. Pulls what is actually owed from two real sources:
//   1. credit/loan ACCOUNTS whose derived balance is negative (money owed), e.g.
//      the Chase Line of Credit — balance is the amount owed (positive here).
//   2. RENTAL mortgages (data.inflows.rentals[].mortgage) — balance/rate/P&I.
// It does NOT write into data.debts, so it never double-counts: a credit account
// already reduces net worth as a negative account balance; this view just shows
// the debt side for payoff planning. `needsTerms` flags a debt missing rate or a
// minimum payment, so the UI can show the real balance but decline to fake a
// payoff date. Deterministic; no n8n.
// -----------------------------------------------------------------------------
export function deriveDebts(data, asOf = new Date()) {
  const balances = deriveAccountBalances(data, asOf);
  const txns = data?.transactions || [];
  const out = [];
  for (const a of (data?.accounts || [])) {
    const bal = balances[a.id] != null ? balances[a.id] : (a.balance || 0);
    // A debt account is one of three, most-authoritative first:
    //  · TYPED credit/loan (bank feed / the account editor);
    //  · MANUALLY declared a debt (treatAsDebt) — the user's own "this is a debt
    //    account" toggle (Darrell 2026-07-20), which counts its balance MAGNITUDE
    //    as the amount owed, so an account whose owed balance is stored positive
    //    (a card the bank reports as a positive "balance owed") still shows;
    //  · NAME-classified AND genuinely owed (negative) — surfaces an imported card
    //    that synced as 'checking'. Non-destructive: the stored account is untouched.
    const typedDebt = a.type === 'credit' || a.type === 'loan';
    const manualDebt = a.treatAsDebt === true;
    // Type/name debts count only the negative (owed) side; a manually-declared debt
    // treats its balance magnitude as owed (the user said it's a debt).
    const owed = manualDebt ? Math.abs(bal) : (bal < 0 ? -bal : 0);
    const nameDebt = !typedDebt && !manualDebt && owed > 0.01 && looksLikeDebtAccount(a);
    if (!typedDebt && !manualDebt && !nameDebt) continue;
    // A manually-declared debt (treatAsDebt) stays on the tab even at $0 owed, so
    // the "Add as debt" / "Treat as debt" flows always produce a VISIBLE row the
    // family can then set the balance on inline (the "+ owed" editor). The add
    // panel literally invites "Leave blank to add it now and set the balance later"
    // — dropping the row when they do exactly that made the tap go nowhere (the
    // reported Debts-tab bug; DR-0061 the surface must show the real record).
    // Derived (typed/name) debts still drop at ~0 owed — a paid-off credit account
    // read from the feed is not a debt worth listing.
    if (owed <= 0.01 && !manualDebt) continue;
    // Interest RATE: the account's OWN interest charges are authoritative — a rate
    // read from the data can't be undermined by a wrong manual entry (Darrell
    // 2026-07-20). Fall back to the stored (user-editable) rate ONLY when the data
    // shows no interest line. rateSource tells the UI which it is.
    const derived = deriveApr(txns, a.id, owed, asOf);
    const storedRate = Number(a.rate) || 0;
    const rate = derived.apr != null ? derived.apr : storedRate;
    const rateSource = derived.apr != null ? 'derived' : (storedRate > 0 ? 'manual' : 'none');
    // Expected payoff from their REAL payments (not a fabricated minimum): the pace
    // they actually pay, the net paydown, and the truthful reach-zero date.
    let insight = debtPayoffInsight(txns, a.id, owed, asOf);
    // A debt DECLARED from a recurring-payment suggestion has no ledger rows of
    // its own — its payments ride in checking under the payee name. Recover that
    // pace by cleaned-name match so the row shows the real "$110/mo" instead of
    // "no payments seen" (the 2026-08-04 Debts bug). Checking-side data shows
    // payments only (a card's new charges never hit this ledger), so the pace is
    // the payment pace, and the payoff is dated at that pace.
    let paceSource = 'own';
    if (manualDebt && !insight.hasPayments) {
      const linked = linkedDebtPaymentStats(txns, a.name, a.id, asOf);
      if (linked.paymentCount > 0) {
        const payoff = estimatePayoff(owed, linked.grossPaymentPerMonth, asOf);
        insight = {
          ...insight,
          grossPaymentPerMonth: linked.grossPaymentPerMonth,
          netPaydownPerMonth: linked.grossPaymentPerMonth,
          paymentCount: linked.paymentCount,
          payoffMonths: payoff.months,
          payoffDate: payoff.date,
          onTrack: payoff.onTrack,
          clear: payoff.clear,
          growing: false,
          hasPayments: true,
        };
        paceSource = 'linked';
      }
    }
    const minPayment = Number(a.minPayment) || 0;
    out.push({
      id: `debt-acct-${a.id}`, name: (a.name || 'Credit account') + (a.fragment ? ' ' + a.fragment : ''),
      balance: round2(owed), rate, rateSource, minPayment, entityId: a.entityId ?? null,
      debtType: typedDebt ? a.type : 'credit', accountId: a.id, source: 'account',
      // manual = the user's own "treat as debt" declaration: its owed balance is
      // hand-set (editable), vs a ledger-derived balance that stays truthful.
      manual: manualDebt,
      leaveAlone: false, needsTerms: !(rate > 0 && minPayment > 0),
      // Payment-derived payoff — independent of the rate-based snowball engine.
      // paceSource 'linked' = pace recovered from checking-side payee payments.
      payPace: insight.grossPaymentPerMonth, netPaydown: insight.netPaydownPerMonth,
      estPayoffMonths: insight.payoffMonths, estPayoffOnTrack: insight.onTrack,
      growing: insight.growing, hasPayments: insight.hasPayments, paceSource,
    });
  }
  for (const r of (data?.inflows?.rentals || [])) {
    const m = r && r.mortgage;
    const bal = m ? Number(m.balance) || 0 : 0;
    if (bal <= 0.01) continue;
    const rate = Number(m.rate) || 0;
    const minPayment = Number(m.monthlyPI) || 0;
    out.push({
      id: `debt-rental-${r.id}`, name: (r.name || r.address || 'Rental') + ' mortgage',
      balance: round2(bal), rate, minPayment, entityId: r.entityId ?? null,
      debtType: 'mortgage', source: 'rental', leaveAlone: false,
      needsTerms: !(rate > 0 && minPayment > 0),
    });
  }
  return out;
}

// -----------------------------------------------------------------------------
// deriveEntityRollups — per-entity account/cash/credit/inflow/debt rollup, with
// every account decorated with its DERIVED balance (deriveAccountBalances). This
// is the shared source the Accounts, Entities, and Big Picture surfaces all read,
// so they move with the ledger in lockstep (extracted from the monolith — was
// inline static `a.balance`; DR-0076 no-painted-number). Entities sort personal
// first, then business, preserving insertion order within each type.
// -----------------------------------------------------------------------------
export function deriveEntityRollups(data, visibleEntities, asOf = new Date()) {
  const balances = deriveAccountBalances(data, asOf);
  const entities = visibleEntities || data?.entities || [];
  const accounts = data?.accounts || [];
  const debts = data?.debts || [];
  const salaries = data?.inflows?.salaries || [];
  const rentals = data?.inflows?.rentals || [];
  // A manually-declared debt (treatAsDebt) is a debt, not cash — so it never
  // double-counts as both (it leaves cash, joins credit).
  const isCash = (a) => CASH_TYPES.includes(a.type) && !a.treatAsDebt;
  const isCredit = (a) => a.type === 'credit' || a.type === 'loan' || a.treatAsDebt === true;
  const sorted = [...entities].sort((a, b) => (a.type === b.type ? 0 : a.type === 'personal' ? -1 : 1));
  return sorted.map((entity) => {
    const entAccounts = accounts
      .filter((a) => a.entityId === entity.id)
      .map((a) => ({ ...a, derivedBalance: balances[a.id] != null ? balances[a.id] : (a.balance || 0) }));
    const sumBal = (pred) => round2(
      entAccounts.filter((a) => pred(a) && !a.inLegal).reduce((s, a) => s + a.derivedBalance, 0),
    );
    const inflow = round2(
      salaries.filter((s) => s.entityId === entity.id).reduce((s, x) => s + (Number(x.actual) || 0), 0)
      + rentals.filter((r) => r.entityId === entity.id).reduce((s, x) => s + (Number(x.actual) || 0), 0),
    );
    const entDebts = debts.filter((d) => d.entityId === entity.id);
    const debtBalance = round2(entDebts.reduce((s, d) => s + (Number(d.balance) || 0), 0));
    return {
      entity,
      accounts: entAccounts,
      balance: sumBal(() => true), // legacy total (all non-legal types)
      cashBalance: sumBal(isCash),
      creditBalance: sumBal(isCredit),
      inflow,
      debts: entDebts,
      debtBalance,
    };
  });
}

// -----------------------------------------------------------------------------
// deriveMonthlyFlows — consolidated steady monthly inflow/outflow.
//
// Deliberately uses the SAME basis as the Big Picture `totals` so the forecast
// headline reconciles with the dashboard the family already trusts:
//   inflow  = salaries actually received + income-producing rent actually received
//   outflow = the aggregate monthly outflow buckets (mortgages + utilities +
//             household + debt service + giving)
// The NON-monthly obligations (quarterly/annual) are NOT in these buckets; they
// ride in deriveLumpEvents as the lumpy reserve drains, matching computeReserves.
// -----------------------------------------------------------------------------
export function deriveMonthlyFlows(data) {
  const salaries = data?.inflows?.salaries || [];
  const rentals = (data?.inflows?.rentals || []).filter((r) => (r.rent || 0) > 0);
  const salaryActual = salaries.reduce((s, x) => s + (Number(x.actual) || 0), 0);
  const rentalActual = rentals.reduce((s, x) => s + (Number(x.actual) || 0), 0);
  const monthlyInflow = salaryActual + rentalActual;
  const outflows = data?.outflows || {};
  const monthlyOutflow = Object.values(outflows).reduce((s, x) => s + (Number(x) || 0), 0);
  return {
    salaryActual,
    rentalActual,
    monthlyInflow: round2(monthlyInflow),
    monthlyOutflow: round2(monthlyOutflow),
    netMonthly: round2(monthlyInflow - monthlyOutflow),
  };
}

// -----------------------------------------------------------------------------
// deriveEntityFlows — itemized per-entity steady monthly inflow/outflow.
//
// The aggregate outflow buckets above are NOT entity-tagged, so per-entity views
// derive from the itemized, entity-stamped records instead (every line carries
// entityId): salaries + rent for inflow; debt minimums + rental mortgage P&I +
// escrow + MONTHLY recurring obligations for steady outflow. Non-monthly entity
// obligations land as lumps (deriveLumpEvents filtered by entity). Because the
// family-level household/utility buckets aren't itemized per entity, the sum of
// per-entity nets will not equal the consolidated net — the UI says so plainly.
// -----------------------------------------------------------------------------
export function deriveEntityFlows(data, entityId) {
  const salaries = (data?.inflows?.salaries || []).filter((s) => s.entityId === entityId);
  const incomeRentals = (data?.inflows?.rentals || []).filter(
    (r) => r.entityId === entityId && (r.rent || 0) > 0,
  );
  const allEntityRentals = (data?.inflows?.rentals || []).filter((r) => r.entityId === entityId);
  const inflow = salaries.reduce((s, x) => s + (Number(x.actual) || 0), 0)
    + incomeRentals.reduce((s, x) => s + (Number(x.actual) || 0), 0);

  const debtMin = (data?.debts || [])
    .filter((d) => d.entityId === entityId && !d.leaveAlone)
    .reduce((s, d) => s + (Number(d.minPayment) || 0), 0);
  const mortgages = allEntityRentals.reduce(
    (s, r) => s + ((Number(r.mortgage?.monthlyPI) || 0) + (Number(r.mortgage?.escrow) || 0)),
    0,
  );
  const monthlyObligations = (data?.recurringObligations || [])
    .filter((o) => o.enabled && o.entityId === entityId && o.frequency === 'monthly')
    .reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const outflowSteady = debtMin + mortgages + monthlyObligations;
  return {
    entityId,
    inflow: round2(inflow),
    monthlyOutflow: round2(outflowSteady),
    netMonthly: round2(inflow - outflowSteady),
    parts: { debtMin: round2(debtMin), mortgages: round2(mortgages), monthlyObligations: round2(monthlyObligations) },
  };
}

// -----------------------------------------------------------------------------
// deriveLumpEvents — non-monthly recurring obligations as dated lump outflows.
//
// Quarterly/semi-annual/annual/biennial obligations don't hit every month — they
// hit on their schedule. Each enabled non-monthly obligation is walked forward
// from its `nextDue` across the horizon, dropping a negative lump on every month
// it lands in. Optionally filtered to one entity. Monthly obligations are
// excluded here (they're in the steady monthly outflow, not lumps).
// -----------------------------------------------------------------------------
export function deriveLumpEvents(data, currentDate = new Date(), months = 12, entityId = null) {
  const events = [];
  const obligations = (data?.recurringObligations || []).filter(
    (o) => o.enabled && o.frequency && o.frequency !== 'monthly'
      && (entityId == null || o.entityId === entityId),
  );
  for (const o of obligations) {
    const step = freqToMonths(o.frequency);
    if (!step) continue;
    let due = o.nextDue ? new Date(o.nextDue) : null;
    if (!due || isNaN(due.getTime())) continue;
    for (let guard = 0; guard < 240; guard++) {
      const offset = monthsBetween(currentDate, due);
      if (offset > months) break;
      if (offset >= 1) {
        events.push({
          monthOffset: offset,
          amount: -(Number(o.amount) || 0),
          label: o.name || 'Obligation',
          kind: 'obligation',
          entityId: o.entityId || null,
        });
      }
      due = new Date(due.getFullYear(), due.getMonth() + step, due.getDate());
    }
  }
  return events;
}

// -----------------------------------------------------------------------------
// projectCashFlow — THE CORE PROJECTOR. Pure math over explicit inputs.
//
// Walks `months` forward. Each month: endCash = startCash + monthlyInflow
// - monthlyOutflow + (signed lump total for that month). Returns the full
// timeline plus the clarity figures: ending cash, runway (months of positive
// cash), the lowest point, and totals. Inputs are explicit so scenario modeling
// can pass adjusted values and tracking can replay a saved set of assumptions.
// -----------------------------------------------------------------------------
export function projectCashFlow(inputs = {}) {
  const {
    startingCash = 0,
    monthlyInflow = 0,
    monthlyOutflow = 0,
    lumpEvents = [],
    currentDate = new Date(),
    months = 12,
  } = inputs;

  const lumpsByMonth = {};
  for (const e of lumpEvents) {
    const m = e.monthOffset;
    if (!Number.isFinite(m) || m < 1 || m > months) continue;
    if (!lumpsByMonth[m]) lumpsByMonth[m] = [];
    lumpsByMonth[m].push({ label: e.label, amount: Number(e.amount) || 0, kind: e.kind || 'lump' });
  }

  const timeline = [];
  let cash = Number(startingCash) || 0;
  let runwayMonths = null; // null = never goes negative within horizon
  let lowest = { monthOffset: 0, endCash: round2(cash), label: monthLabelFrom(currentDate, 0) };

  for (let m = 1; m <= months; m++) {
    const startCash = cash;
    const lumps = lumpsByMonth[m] || [];
    const lumpIn = lumps.filter((l) => l.amount > 0).reduce((s, l) => s + l.amount, 0);
    const lumpOut = lumps.filter((l) => l.amount < 0).reduce((s, l) => s + l.amount, 0); // <= 0
    const net = (monthlyInflow - monthlyOutflow) + lumpIn + lumpOut;
    cash = startCash + net;
    timeline.push({
      monthOffset: m,
      label: monthLabelFrom(currentDate, m),
      startCash: round2(startCash),
      inflow: round2(monthlyInflow + lumpIn),
      outflow: round2(monthlyOutflow + Math.abs(lumpOut)),
      lumps,
      net: round2(net),
      endCash: round2(cash),
    });
    if (runwayMonths === null && cash < 0) runwayMonths = m - 1;
    if (cash < lowest.endCash) lowest = { monthOffset: m, endCash: round2(cash), label: monthLabelFrom(currentDate, m) };
  }

  return {
    timeline,
    startingCash: round2(startingCash),
    endingCash: round2(cash),
    netMonthly: round2(monthlyInflow - monthlyOutflow),
    runwayMonths,
    runwayDate: runwayMonths != null ? monthLabelFrom(currentDate, runwayMonths) : null,
    lowest,
    horizonMonths: months,
    totalInflow: round2(timeline.reduce((s, r) => s + r.inflow, 0)),
    totalOutflow: round2(timeline.reduce((s, r) => s + r.outflow, 0)),
  };
}

// -----------------------------------------------------------------------------
// buildProjection — the convenience that derives real inputs for a SCOPE and
// runs the projector. scope = 'consolidated' | 'family' | <entityId>.
// extraMonthlyIncome / extraMonthlyExpense / capitalEvents let scenario modeling
// layer on top without re-deriving the base. Returns the projection plus the
// derived inputs (so the UI can show the assumptions transparently).
// -----------------------------------------------------------------------------
export function buildProjection(data, opts = {}) {
  const {
    currentDate = new Date(),
    months = 12,
    scope = 'consolidated',
    extraMonthlyIncome = 0,
    extraMonthlyExpense = 0,
    capitalEvents = [],
  } = opts;

  const cash = liveCashOnHand(data, currentDate);
  let monthlyInflow;
  let monthlyOutflow;
  let startingCash;
  let lumpEvents;

  if (scope === 'consolidated' || scope === 'family') {
    const flows = deriveMonthlyFlows(data);
    monthlyInflow = flows.monthlyInflow;
    monthlyOutflow = flows.monthlyOutflow;
    startingCash = cash.total;
    lumpEvents = deriveLumpEvents(data, currentDate, months);
  } else {
    const ef = deriveEntityFlows(data, scope);
    monthlyInflow = ef.inflow;
    monthlyOutflow = ef.monthlyOutflow;
    startingCash = round2(
      cash.byAccount.filter((a) => a.entityId === scope).reduce((s, a) => s + a.balance, 0),
    );
    lumpEvents = deriveLumpEvents(data, currentDate, months, scope);
  }

  const allLumps = [...lumpEvents, ...(capitalEvents || [])];
  const projection = projectCashFlow({
    startingCash,
    monthlyInflow: monthlyInflow + (Number(extraMonthlyIncome) || 0),
    monthlyOutflow: monthlyOutflow + (Number(extraMonthlyExpense) || 0),
    lumpEvents: allLumps,
    currentDate,
    months,
  });

  return {
    ...projection,
    scope,
    inputs: {
      startingCash,
      monthlyInflow: round2(monthlyInflow + (Number(extraMonthlyIncome) || 0)),
      monthlyOutflow: round2(monthlyOutflow + (Number(extraMonthlyExpense) || 0)),
      baseMonthlyInflow: round2(monthlyInflow),
      baseMonthlyOutflow: round2(monthlyOutflow),
      extraMonthlyIncome: round2(extraMonthlyIncome),
      extraMonthlyExpense: round2(extraMonthlyExpense),
      lumpCount: allLumps.length,
    },
  };
}

// -----------------------------------------------------------------------------
// cashForScope — spendable cash at a date for a scope (consolidated or entity).
// The "actual" side of projected-vs-actual tracking reads from here.
// -----------------------------------------------------------------------------
export function cashForScope(data, date, scope = 'consolidated') {
  const cash = liveCashOnHand(data, date);
  if (scope === 'consolidated' || scope === 'family') return cash.total;
  return round2(cash.byAccount.filter((a) => a.entityId === scope).reduce((s, a) => s + a.balance, 0));
}

function addMonthsISO(baseDate, months) {
  const d = new Date(baseDate);
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}

// -----------------------------------------------------------------------------
// snapshotFromProjection — freeze a projection into a persistable record so the
// forecast is TRACKED OVER TIME (institutional memory of what we predicted).
// The assumptions are stored alongside, so a future review can see not just the
// projected number but the stated basis it rested on. Persisted via forecast-sync.
// -----------------------------------------------------------------------------
export function snapshotFromProjection(projection, opts = {}) {
  const { scope = projection.scope || 'consolidated', assumptions = {}, currentDate = new Date(), label = '' } = opts;
  const baseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const horizonDate = addMonthsISO(baseDate, projection.horizonMonths || 12);
  return {
    scope,
    label: label || `${scope} · ${projection.horizonMonths}mo`,
    baseDate: baseDate.toISOString().slice(0, 10),
    horizonMonths: projection.horizonMonths || 12,
    horizonDate: horizonDate.toISOString().slice(0, 10),
    startingCash: projection.startingCash,
    projectedEndCash: projection.endingCash,
    projectedLowestCash: projection.lowest ? projection.lowest.endCash : null,
    projectedRunwayMonths: projection.runwayMonths,
    netMonthly: projection.netMonthly,
    assumptions,
  };
}

// -----------------------------------------------------------------------------
// actualVsProjected — score a saved snapshot against what really happened.
// Only computes an actual once the horizon date has been reached; before that it
// returns { reached:false } so the UI shows "pending" honestly (no fake actual).
// accuracyLabel buckets the absolute % error so forecast quality is visible over
// time and the future picture becomes better-grounded with each closed cycle.
// -----------------------------------------------------------------------------
export function actualVsProjected(snapshot, data, asOf = new Date()) {
  const horizon = new Date(snapshot.horizonDate);
  const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  if (asOfDay < horizon) {
    return { reached: false, projectedEndCash: snapshot.projectedEndCash, horizonDate: snapshot.horizonDate };
  }
  const actualEndCash = cashForScope(data, horizon, snapshot.scope);
  const variance = round2(actualEndCash - snapshot.projectedEndCash);
  const base = Math.abs(snapshot.projectedEndCash);
  const variancePct = base > 0 ? round2((variance / base) * 100) : null;
  const absPct = variancePct == null ? null : Math.abs(variancePct);
  let accuracyLabel = 'unscored';
  if (absPct != null) {
    if (absPct <= 5) accuracyLabel = 'on-target';
    else if (absPct <= 15) accuracyLabel = 'close';
    else if (absPct <= 30) accuracyLabel = 'off';
    else accuracyLabel = 'way-off';
  }
  return {
    reached: true,
    projectedEndCash: snapshot.projectedEndCash,
    actualEndCash,
    variance,
    variancePct,
    accuracyLabel,
    horizonDate: snapshot.horizonDate,
    direction: variance > 0 ? 'ahead' : variance < 0 ? 'behind' : 'exact',
  };
}
