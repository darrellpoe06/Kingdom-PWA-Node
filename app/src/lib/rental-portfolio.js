// Rental-portfolio derivation — the single source of truth behind the Real
// Estate header ("N Doors · <Entity>") and its rollup (mortgage debt, P&I,
// rent, rent gap). Pulled out of the Rentals component so the math is pure and
// directly unit-testable (DR-0076 verification doctrine: a header/rollup is a
// LIVE view of real property records, never a painted literal; the gate proves
// it recomputes from the data).
//
// A "door" = a rentable unit. A property can hold several (r.units, default 1):
// a single-family = 1 door, a fourplex = 4. The door count is the SUM of units
// across the rental portfolio, so it moves the moment a property — or its unit
// count — is added or edited.

// A property is PERSONAL when it's the family's own home (primary/secondary
// home, owner-occupied, or under the personal entity) — NOT merely because rent
// isn't entered yet (Darrell 2026-06-13: rentals stay rentals before their rent
// imports). Personal homes are excluded from the rental rollup + door count.
export const isPersonalProp = (r) =>
  r.propertyType === 'primary-home' ||
  r.propertyType === 'secondary-home' ||
  r.status === 'owner-occupied' ||
  r.entityId === 'e-personal';

// Doors in one property: a positive integer, default 1. Guards against blank,
// zero, negative, or fractional input.
export const unitsOf = (r) => Math.max(1, Math.round(Number(r && r.units) || 1));

// Derive the whole portfolio view from the real rental records + entity list.
// Everything the Real Estate header and rollup show comes from this one call.
export function derivePortfolio(rentals = [], entities = []) {
  const portfolioRentals = (rentals || []).filter((r) => !isPersonalProp(r));
  const doorCount = portfolioRentals.reduce((s, r) => s + unitsOf(r), 0);

  // Entity label = the business that owns the portfolio. Exactly one owner →
  // its name (e.g. "Steward Real Estate LLC"); mixed or none → a neutral label,
  // so we never hardcode an LLC name the data doesn't back.
  const portfolioEntityIds = [...new Set(portfolioRentals.map((r) => r.entityId).filter(Boolean))];
  const portfolioEntity =
    portfolioEntityIds.length === 1
      ? (entities || []).find((e) => e.id === portfolioEntityIds[0])
      : null;
  const portfolioLabel = portfolioEntity
    ? String(portfolioEntity.name || '').split('(')[0].trim() || 'Real Estate Portfolio'
    : 'Real Estate Portfolio';

  // Rollup sums only figures that are actually present; a property missing a
  // figure is counted as "needs input" and flagged, never silently zeroed into
  // the whole portfolio (honest-uncertainty: a painted $0 is worse than a
  // flagged gap on a surface whose value is trust).
  const acc = portfolioRentals.reduce(
    (a, r) => {
      const bal = Number(r.mortgage && r.mortgage.balance) || 0;
      const pi = Number(r.mortgage && r.mortgage.monthlyPI) || 0;
      const rent = Number(r.rent) || 0;
      const actual = Number(r.actual) || 0;
      a.mortgageDebt += bal;
      a.monthlyPI += pi;
      a.monthlyRent += rent;
      a.actualRent += actual;
      if (!(bal > 0)) a.missingDebt += 1;
      if (!(rent > 0)) a.missingRent += 1;
      return a;
    },
    { mortgageDebt: 0, monthlyPI: 0, monthlyRent: 0, actualRent: 0, missingDebt: 0, missingRent: 0 }
  );

  // Rent gap = expected rent − rent actually collected (the established app
  // meaning, poe-financial-mvp totals). Collection rate is actual ÷ expected.
  const rentGap = acc.monthlyRent - acc.actualRent;
  const collectionRate = acc.monthlyRent > 0 ? (acc.actualRent / acc.monthlyRent) * 100 : 0;

  return {
    portfolioRentals,
    portfolioCount: portfolioRentals.length,
    doorCount,
    portfolioLabel,
    mortgageDebt: acc.mortgageDebt,
    monthlyPI: acc.monthlyPI,
    monthlyRent: acc.monthlyRent,
    actualRent: acc.actualRent,
    missingDebt: acc.missingDebt,
    missingRent: acc.missingRent,
    rentGap,
    collectionRate,
  };
}
