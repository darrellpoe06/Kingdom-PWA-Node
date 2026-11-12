// =============================================================================
// cash-forecast — the 30 / 60 / 90-day cash forecast, from the Safe to Spend
// engine (Darrell 2026-11-11)
// =============================================================================
// The Transactions screen's forecast showed the same figure for Now, +30, +60
// and +90: it added only future-dated ledger rows and the NEXT occurrence of
// each recurring bill, and only when the bill named an account. Bills with no
// paying account, debt minimums, mortgages, rent, paychecks and the inferred
// rhythms never reached it, so nothing moved.
//
// This forecast is the engine's own day-by-day walk (buildSafeToSpend over a
// 90-day custom period), read at each horizon, with every dated item placed on
// the account that pays or receives it:
//   * an item that names an account (a bill with a paying account, a scheduled
//     ledger row, an inferred bill) lands there;
//   * everything else in a pocket (debt minimums, mortgages, rent, paychecks)
//     lands on that pocket's primary spendable account, or its only one; with
//     neither, the pocket gets its own "not yet on an account" row, never a
//     guess at which account;
//   * the undated reserves the engine accrues day by day (living, tax set-aside,
//     planned savings) ride the same account, as estimates.
// Confirmed and estimated are kept apart on every row: an item is confirmed
// when it is entered and dated (a bill on file, a debt minimum with its due day,
// a scheduled row, a pay schedule); it is an estimate when its timing or amount
// is inferred or assumed, and so is every accrual. Nothing is invented: a day
// with no item moves nothing.
//
// The rows add up to the engine's own timeline at each horizon (to the cent, by
// construction), so this table and the Overview can never disagree.
// =============================================================================
import { buildSafeToSpend, resolveScope, round2, isoDay, addDays } from './safe-to-spend.js';

const CASH_TYPES = ['checking', 'savings', 'cash'];
const DAYS_PER_MONTH = 365.25 / 12; // the engine's own month
const HORIZONS = [30, 60, 90];

/** The engine scope the Transactions entity filter means. */
export function scopeForEntityFilter(data, entityFilter, visibleEntities = null) {
  if (!entityFilter || entityFilter === 'all') return 'consolidated';
  const e = (visibleEntities || data?.entities || []).find((x) => x && x.id === entityFilter);
  if (e && (!e.type || e.type === 'personal' || e.type === 'joint')) return 'personal';
  return entityFilter;
}

const isEstimate = (it) => !!(it.assumed || it.inferred || it.kind === 'inferred-bill' || it.source === 'inferred');

function emptyWindows() {
  const w = {};
  for (const h of HORIZONS) {
    w[`w${h}`] = 0;
    w[`confirmed${h}`] = 0;
    w[`estimated${h}`] = 0;
  }
  return w;
}

export function cashForecast(data, opts = {}) {
  const asOfRaw = opts.currentDate instanceof Date ? opts.currentDate : new Date();
  const asOf = new Date(asOfRaw.getFullYear(), asOfRaw.getMonth(), asOfRaw.getDate());
  const scopeId = opts.scope || 'consolidated';
  const settings = opts.settings || data?.moneyPlan?.settings || {};
  const horizon = {};
  for (const h of HORIZONS) horizon[h] = isoDay(addDays(asOf, h));
  const result = buildSafeToSpend(data, {
    currentDate: asOf,
    period: 'custom',
    customEnd: horizon[90],
    scope: scopeId,
    settings,
    visibleEntities: opts.visibleEntities || null,
    goals: opts.goals,
    recurringDecisions: opts.recurringDecisions,
    goalMeta: opts.goalMeta,
  });
  const pockets = result.byEntity && result.byEntity.length ? result.byEntity : result.status === 'unavailable' ? [] : [result];
  const accounts = (data?.accounts || []).filter((a) => a && a.id && CASH_TYPES.includes(a.type) && !a.inLegal && !a.treatAsDebt);
  const rows = new Map();
  const unattributed = [];
  const entities = opts.visibleEntities || data?.entities || [];

  for (const pocket of pockets) {
    const sc = pocket.scope.kind === 'personal' ? resolveScope(data, 'personal', entities) : resolveScope(data, pocket.scope.id, entities);
    const inScope = (entityId) => (entityId == null || entityId === '' ? !!sc.includeUnassigned : sc.entityIds.includes(entityId));
    const mine = accounts.filter((a) => inScope(a.entityId));
    const sources = new Map((pocket.balanceSources || []).map((b) => [b.id, b]));
    for (const a of mine) {
      if (rows.has(a.id)) continue;
      const src = sources.get(a.id) || {};
      rows.set(a.id, {
        id: a.id,
        name: a.name,
        fragment: a.fragment || null,
        type: a.type,
        entityId: a.entityId ?? null,
        isPrimary: !!a.isPrimary,
        pocket: pocket.scope.label,
        balance: round2(src.balance != null ? src.balance : 0),
        verifiedOn: src.verifiedOn || null,
        counted: src.counted !== false,
        ...emptyWindows(),
      });
    }
    const primary = mine.find((a) => a.isPrimary) || (mine.length === 1 ? mine[0] : null);
    let fallback = primary ? rows.get(primary.id) : null;
    if (!fallback) {
      fallback = {
        id: `pocket:${pocket.scope.id}`,
        name: `${pocket.scope.label}: items not yet on an account`,
        fragment: null,
        type: 'unattributed',
        entityId: pocket.scope.id,
        isPrimary: false,
        pocket: pocket.scope.label,
        balance: 0,
        verifiedOn: null,
        counted: false,
        ...emptyWindows(),
        unattributed: true,
      };
      unattributed.push(fallback);
    }
    const place = (it, amount, estimate) => {
      const target = it.accountId && rows.get(it.accountId) && mine.some((a) => a.id === it.accountId) ? rows.get(it.accountId) : fallback;
      for (const h of HORIZONS) {
        if (it.date > horizon[h]) continue;
        target[`w${h}`] = round2(target[`w${h}`] + amount);
        target[estimate ? `estimated${h}` : `confirmed${h}`] = round2(target[estimate ? `estimated${h}` : `confirmed${h}`] + amount);
      }
    };
    for (const it of pocket.items || []) place(it, Number(it.amount) || 0, isEstimate(it));
    // The engine's undated reserves accrue from day 1 (day 0 accrues nothing),
    // exactly as its timeline does: living, tax set-aside and planned savings.
    const m = pocket.monthly || {};
    const daily = ((Number(m.living) || 0) + (Number(m.tax) || 0) + (Number(m.savings) || 0)) / DAYS_PER_MONTH;
    if (daily) {
      for (const h of HORIZONS) {
        fallback[`w${h}`] = round2(fallback[`w${h}`] - daily * h);
        fallback[`estimated${h}`] = round2(fallback[`estimated${h}`] - daily * h);
      }
    }
  }
  // Each row starts from its own Now; accounts left out of available cash
  // (unverified while others are verified) still show their ledger figure.
  for (const r of rows.values()) for (const h of HORIZONS) r[`w${h}`] = round2(r[`w${h}`] + r.balance);

  const list = [...rows.values(), ...unattributed];
  const totals = { balance: 0, ...emptyWindows() };
  for (const r of list) {
    totals.balance = round2(totals.balance + r.balance);
    for (const h of HORIZONS) {
      totals[`w${h}`] = round2(totals[`w${h}`] + r[`w${h}`]);
      totals[`confirmed${h}`] = round2(totals[`confirmed${h}`] + r[`confirmed${h}`]);
      totals[`estimated${h}`] = round2(totals[`estimated${h}`] + r[`estimated${h}`]);
    }
  }
  // The engine's own figure at each horizon, for the self-check: the sum of
  // the rows above must equal it (counted accounts only).
  const engineAt = {};
  const leftOut = round2(list.filter((r) => !r.counted && !r.unattributed).reduce((s, r) => s + r.balance, 0));
  for (const h of HORIZONS) {
    engineAt[h] = round2(
      leftOut +
        pockets.reduce((s, p) => {
          const t = (p.timeline || [])[h];
          return s + (t ? t.cash : Number(p.lines && p.lines.availableCash) || 0);
        }, 0)
    );
  }
  return {
    asOf: isoDay(asOf),
    horizon,
    scope: result.scope,
    status: result.status,
    reconciliationRequired: !!result.reconciliationRequired,
    rows: list,
    totals,
    engineAt,
    reasons: (result.confidence && result.confidence.reasons) || [],
  };
}
