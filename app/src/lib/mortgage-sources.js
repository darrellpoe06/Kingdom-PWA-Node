// =============================================================================
// mortgage-sources — the drop-down the calculator fills itself from (DR-1413)
// =============================================================================
// Darrell, 2026-11-10: "easy population of our actual numbers... based on a
// drop down for each asset... and debt to get rid of it... easy to see."
//
// Every choice is a record that already exists: a property's own mortgage
// (data.inflows.rentals[].mortgage — balance, rate, P&I, escrow, and the value
// on file for loan-to-value) or a debt the ledger already shows (deriveDebts).
// Grouped by kind, then by the entity that holds it: every property first
// (one with no mortgage entered is still listed, and says so), then every other
// debt. Choosing one copies its figures into the calculator. A figure that is
// not on file is named as missing, never filled with a guess.
// =============================================================================

export const PROSPECT_GROUP = '__prospects';
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
  const name = r.name || r.address || 'Property';
  const o = {
    id: `property:${r.id}`,
    kind: 'property',
    rentalId: r.id,
    entityId: r.entityId ?? null,
    name,
    principal: num(m.balance),
    ratePct: num(m.rate),
    payment: num(m.monthlyPI),
    propertyValue: num(r.market && r.market.marketValue) || num(r.estimatedValue),
    escrowMonthly: num(m.escrow),
    rent: num(r.rent),
    estimated: m.estimated === true,
    record: m,
  };
  // A property with no balance on file is still listed: it is ours, and the
  // list says plainly that its mortgage has not been entered (DR-1415).
  o.hasMortgage = o.principal > 0;
  o.label = o.hasMortgage ? name : `${name} · no mortgage on file`;
  return { ...o, missing: missingOf(o) };
}

function debtOption(d) {
  const o = {
    id: `debt:${d.id}`,
    kind: 'debt',
    entityId: d.entityId ?? null,
    label: d.name || 'Debt',
    principal: num(d.balance),
    ratePct: num(d.rate),
    payment: num(d.minPayment),
    propertyValue: 0,
    escrowMonthly: 0,
    estimated: false,
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
 * @param {object[]} [p.prospects] properties being weighed (lib/purchase-prospects.js);
 *   listed first, in their own group, because they are not on the books
 * @returns {{groups: {entityId: string|null, label: string, options: object[]}[],
 *   count: number, propertiesWithoutMortgage: number}}
 */
export function loanGroups({ rentals = [], debts = [], entities = null, prospects = [] } = {}) {
  const allowed = Array.isArray(entities) && entities.length ? new Set(entities.map((e) => e.id)) : null;
  const visible = (entityId) => !allowed || entityId == null || allowed.has(entityId);
  const nameOf = (entityId) => ((entities || []).find((e) => e.id === entityId) || {}).name || (entityId == null ? 'not assigned to an entity' : 'other');
  const order = (entities || []).map((e) => e.id);
  const rank = (id) => (id == null ? Number.MAX_SAFE_INTEGER : order.indexOf(id) < 0 ? order.length : order.indexOf(id));

  const properties = (rentals || []).filter((r) => r && visible(r.entityId ?? null)).map(propertyOption);
  const others = (debts || []).filter((d) => d && d.source !== 'rental' && visible(d.entityId ?? null) && num(d.balance) > 0).map(debtOption);
  const weighing = (prospects || [])
    .filter((p) => p && p.id && visible(p.entityId ?? null))
    .map((p) => {
      const f = p.figures || {};
      const held = p.entityId != null ? nameOf(p.entityId) : '';
      return {
        id: `prospect:${p.id}`,
        kind: 'prospect',
        prospectId: p.id,
        entityId: p.entityId ?? null,
        name: p.name,
        label: held ? `${p.name} · ${held}` : p.name,
        principal: num(f.principal) || Math.max(0, num(f.value) - num(f.down)),
        figures: f,
        missing: [],
      };
    });

  // One group per kind and entity. Every property comes before any other debt,
  // so a mortgage is never below a long run of cards (DR-1415).
  const byEntity = (options, title, key) => {
    const out = [];
    for (const o of options) {
      let g = out.find((x) => x.entityId === o.entityId);
      if (!g) {
        g = { key: `${key}:${String(o.entityId)}`, entityId: o.entityId, label: `${title} · ${nameOf(o.entityId)}`, options: [] };
        out.push(g);
      }
      g.options.push(o);
    }
    out.sort((a, b) => rank(a.entityId) - rank(b.entityId));
    for (const g of out) g.options.sort((a, b) => b.principal - a.principal);
    return out;
  };
  const groups = [
    ...(weighing.length ? [{ key: PROSPECT_GROUP, entityId: PROSPECT_GROUP, label: 'Properties we are weighing', options: weighing }] : []),
    ...byEntity(properties, 'Properties and their mortgages', 'property'),
    ...byEntity(others, 'Other debt', 'debt'),
  ];
  return {
    groups,
    count: properties.length + others.length + weighing.length,
    propertiesWithoutMortgage: properties.filter((o) => !o.hasMortgage).length,
  };
}

export function findLoan(groups, id) {
  for (const g of groups || []) for (const o of g.options) if (o.id === id) return o;
  return null;
}
