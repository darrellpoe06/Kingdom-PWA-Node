// =============================================================================
// church-cost-to-serve — what one church costs us to serve, worked out BEFORE
// the offer (DR-1128)
// =============================================================================
// Darrell, 2026-10-20: "We need to build in the cost to sustain their support
// before the offer so we are capable and ready for the requirements they
// give... not ask for money afterwards because we didn't see we would need
// it... rather lower cost that we agree on than... start with dead processes...
// because of funds."
//
// So the price is checked against the whole cost of serving a church before it
// is offered:
// - our share of what the platform measurably costs each month;
// - the support time the church will need;
// - its compute and storage;
// - a reserve for what we did not foresee.
// A workflow a church asks for is quoted the same way: the build plus the
// support it will need, in one agreed price up front.
//
// Then: "$200 is a minimum cost for each church.... we need to think about
// hiring or paying for devices we need to become sovereign." So $200 is the
// FLOOR, never the ceiling: the least price is the higher of $200 and the whole
// cost to serve. That cost carries two more shared lines:
// - hiring: paid support time, beyond the family's own;
// - the devices sovereignty needs (NAS, disks, GPU, backup), bought once and
//   paid back over the months chosen.
//
// Pure and deterministic. NOTHING IS GUESSED (DR-0076): a cost nobody has
// entered is named as missing, and "ready to offer" stays false until every
// cost is known and covered. A blank never reads as zero.
// =============================================================================

// Measured 2026-10-16 from receipts (research review §10.1): $273.12 for the AI
// subscription, $25.00 for the hosted database, and $9.99 for a storage plan
// that may be personal. The $9.99 is kept in, so the share errs high, never
// low. Shared across the churches.
export const MEASURED_PLATFORM_MONTHLY_CENTS = 30811;
export const DEFAULT_RESERVE_PCT = 20;
export const CHURCH_PRICE_CENTS = 20000;
// The floor for a church (DR-1128): the price never goes below this, whatever
// the arithmetic says.
export const CHURCH_FLOOR_CENTS = 20000;

const known = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
const cents = (v) => Math.round(Number(v));
// Up to the next whole $5, so a quoted price is a clean number and never under.
const roundUpTo5Dollars = (c) => Math.ceil(c / 500) * 500;

/**
 * The monthly cost of serving ONE church, and whether a price covers it.
 * Unknown inputs are reported in `missing`; `readyToOffer` needs none missing
 * and the price at or above the cost with its reserve.
 */
export function churchCostToServe({
  churches = 1,
  supportHoursPerMonth,
  hourlyRateCents,
  computeCentsPerMonth,
  storageCentsPerMonth,
  reservePct = DEFAULT_RESERVE_PCT,
  priceCents = CHURCH_PRICE_CENTS,
  platformMonthlyCents = MEASURED_PLATFORM_MONTHLY_CENTS,
  // Shared across the churches, like the platform: hired support time each
  // month, and sovereignty's devices paid back over `devicesMonths`.
  hiringMonthlyCents,
  devicesOneTimeCents,
  devicesMonths = 36,
  floorCents = CHURCH_FLOOR_CENTS,
} = {}) {
  const n = Math.max(1, Math.floor(Number(churches) || 1));
  const missing = [];
  if (!known(supportHoursPerMonth)) missing.push('support hours each month');
  if (!known(hourlyRateCents)) missing.push('the hourly rate for that time');
  if (!known(computeCentsPerMonth)) missing.push('compute each month');
  if (!known(storageCentsPerMonth)) missing.push('storage each month');
  if (!known(hiringMonthlyCents)) missing.push('hiring each month');
  if (!known(devicesOneTimeCents)) missing.push('devices for sovereignty');

  const platformShareCents = Math.ceil(cents(platformMonthlyCents) / n);
  const supportCents = known(supportHoursPerMonth) && known(hourlyRateCents)
    ? cents(Number(supportHoursPerMonth) * Number(hourlyRateCents)) : null;
  const computeCents = known(computeCentsPerMonth) ? cents(computeCentsPerMonth) : null;
  const storageCents = known(storageCentsPerMonth) ? cents(storageCentsPerMonth) : null;
  const hiringShareCents = known(hiringMonthlyCents) ? Math.ceil(cents(hiringMonthlyCents) / n) : null;
  const months = Math.max(1, Math.floor(Number(devicesMonths) || 36));
  const devicesShareCents = known(devicesOneTimeCents) ? Math.ceil(cents(devicesOneTimeCents) / months / n) : null;

  const lines = [
    { label: `Platform share (measured $${(platformMonthlyCents / 100).toFixed(2)} a month across ${n} ${n === 1 ? 'church' : 'churches'})`, cents: platformShareCents },
    { label: 'Support time', cents: supportCents },
    { label: 'Compute', cents: computeCents },
    { label: 'Storage', cents: storageCents },
    { label: `Hiring share (across ${n} ${n === 1 ? 'church' : 'churches'})`, cents: hiringShareCents },
    { label: `Devices for sovereignty (paid back over ${months} months, across ${n})`, cents: devicesShareCents },
  ];
  const knownCostCents = lines.reduce((s, l) => s + (l.cents || 0), 0);
  const reserve = Math.max(0, Number(reservePct) || 0);
  const withReserveCents = Math.ceil(knownCostCents * (1 + reserve / 100));
  const price = Math.max(0, cents(priceCents));
  const complete = missing.length === 0;
  const floor = Math.max(0, cents(floorCents));
  // What the price must reach: the cost with its reserve, and never below the floor.
  const needCents = Math.max(withReserveCents, floor);

  return {
    churches: n,
    lines,
    missing,
    complete,
    knownCostCents,
    reservePct: reserve,
    withReserveCents,
    floorCents: floor,
    belowFloor: price < floor,
    minimumPriceCents: complete ? Math.max(floor, roundUpTo5Dollars(withReserveCents)) : null,
    priceCents: price,
    // Only claimed when every cost is known: a partial sum that fits under the
    // price proves nothing about the parts no one entered.
    covers: complete ? price >= needCents : null,
    marginCents: complete ? price - needCents : null,
    readyToOffer: complete && price >= needCents,
  };
}

/**
 * A church's workflow request, quoted up front: the build plus the support it
 * will need for the months agreed, with the reserve, as one price. Spread
 * monthly it is the add-on that ends when the term does.
 */
export function workflowQuote({
  buildHours,
  hourlyRateCents,
  supportHoursPerMonth,
  months,
  reservePct = DEFAULT_RESERVE_PCT,
} = {}) {
  const missing = [];
  if (!known(buildHours)) missing.push('build hours');
  if (!known(hourlyRateCents)) missing.push('the hourly rate');
  if (!known(supportHoursPerMonth)) missing.push('support hours each month after it ships');
  if (!known(months) || Number(months) < 1) missing.push('how many months the support is priced for');
  if (missing.length) return { missing, complete: false, totalCents: null, monthlyCents: null };
  const m = Math.floor(Number(months));
  const buildCents = cents(Number(buildHours) * Number(hourlyRateCents));
  const supportCents = cents(Number(supportHoursPerMonth) * Number(hourlyRateCents) * m);
  const reserve = Math.max(0, Number(reservePct) || 0);
  const totalCents = roundUpTo5Dollars(Math.ceil((buildCents + supportCents) * (1 + reserve / 100)));
  return {
    missing,
    complete: true,
    buildCents,
    supportCents,
    reservePct: reserve,
    months: m,
    totalCents,
    monthlyCents: roundUpTo5Dollars(Math.ceil(totalCents / m)),
  };
}

/**
 * Months we choose to give a church. Darrell, 2026-10-20: "We can decide to
 * donate some months etc... however..." A gift is a decision, never a gap in
 * the price: it costs the full cost to serve for each month given, said out
 * loud, and the agreed price is unchanged.
 */
export function giftOfMonths({ months, costToServeCents } = {}) {
  if (!known(months) || Number(months) < 1 || costToServeCents === null || costToServeCents === undefined) {
    return { complete: false, months: known(months) ? Math.floor(Number(months)) : null, costCents: null };
  }
  const m = Math.floor(Number(months));
  return { complete: true, months: m, costCents: m * cents(costToServeCents) };
}

export function dollars(c) {
  if (c === null || c === undefined) return 'not entered';
  return `$${(c / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
