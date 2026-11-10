// =============================================================================
// mortgage-sources — the drop-down the calculator fills itself from (DR-1413)
// =============================================================================
// Darrell, 2026-11-10: "easy population of our actual numbers... based on a
// drop down for each asset... and debt to get rid of it... easy to see."
//
// Every choice is a record that already exists: a property's own mortgage
// (data.inflows.rentals[].mortgage — balance, rate, P&I, escrow, and the value
// on file for loan-to-value) or a debt the ledger already shows (deriveDebts).
// Grouped by the entity that holds it. Read-only: choosing one copies its
// figures into the calculator; nothing is written back. A figure that is not on
// file is named as missing, never filled with a guess.
// =============================================================================

const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

function missingOf(o) {
  const missing = [];
  if (!(o.principal > 0)) missing.push('the balance');
  if (!(o.ratePct > 0)) missing.push('the interest rate');
  if (!(o.payment > 0)) missing.push('the monthly payment');
  return missing;
}

function propertyOption(r) {
  const m = r.mortgage || {};
  const o = {
    id: `property:${r.id}`, kind: 'property', entityId: r.entityId ?? null,
    label: `${r.name || r.address || 'Property'} · mortgage`,
    principal: num(m.balance), ratePct: num(m.rate), payment: num(m.monthlyPI),
    propertyValue: num(r.market && r.market.marketValue) || num(r.estimatedValue),
    escrowMonthly: num(m.escrow), estimated: m.estimated === true,
  };
  return { ...o, missing: missingOf(o) };
}

function debtOption(d) {
  const o = {
    id: `debt:${d.id}`, kind: 'debt', entityId: d.entityId ?? null, label: d.name || 'Debt',
    principal: num(d.balance), ratePct: num(d.rate), payment: num(d.minPayment),
    propertyValue: 0, escrowMonthly: 0, estimated: false,
  };
  return { ...o, missing: missingOf(o) };
}

/**
 * @param {object} p
 * @param {object[]} [p.rentals]  property records (the home included)
 * @param {object[]} [p.debts]    deriveDebts() rows; its rental-mortgage rows are
 *   skipped because the property record is the fuller source of the same loan
 * @param {object[]} [p.entities] the entities this person may see; a record held
 *   by an entity outside the list is left out
 * @returns {{groups: {entityId: string|null, label: string, options: object[]}[],
 *   count: number, propertiesWithoutMortgage: number}}
 */
export function loanGroups({ rentals = [], debts = [], entities = null } = {}) {
  const allowed = Array.isArray(entities) && entities.length ? new Set(entities.map((e) => e.id)) : null;
  const visible = (entityId) => !allowed || entityId == null || allowed.has(entityId);
  const nameOf = (entityId) => ((entities || []).find((e) => e.id === entityId) || {}).name || (entityId == null ? 'Not assigned to an entity' : 'Other');

  const options = [];
  let propertiesWithoutMortgage = 0;
  for (const r of rentals || []) {
    if (!r || !visible(r.entityId ?? null)) continue;
    if (!(num(r.mortgage && r.mortgage.balance) > 0)) { propertiesWithoutMortgage += 1; continue; }
    options.push(propertyOption(r));
  }
  for (const d of debts || []) {
    if (!d || d.source === 'rental' || !visible(d.entityId ?? null) || !(num(d.balance) > 0)) continue;
    options.push(debtOption(d));
  }

  const order = (entities || []).map((e) => e.id);
  const rank = (id) => (id == null ? Number.MAX_SAFE_INTEGER : order.indexOf(id) < 0 ? order.length : order.indexOf(id));
  const groups = [];
  for (const o of options) {
    let g = groups.find((x) => x.entityId === o.entityId);
    if (!g) { g = { entityId: o.entityId, label: nameOf(o.entityId), options: [] }; groups.push(g); }
    g.options.push(o);
  }
  groups.sort((a, b) => rank(a.entityId) - rank(b.entityId));
  for (const g of groups) g.options.sort((a, b) => (a.kind === b.kind ? b.principal - a.principal : a.kind === 'property' ? -1 : 1));
  return { groups, count: options.length, propertiesWithoutMortgage };
}

export function findLoan(groups, id) {
  for (const g of groups || []) for (const o of g.options) if (o.id === id) return o;
  return null;
}
