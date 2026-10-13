// =============================================================================
// Cadence — any door, any cadence, and the true month beside each (DR-1003)
// =============================================================================
// Darrell, 2026-10-13: "$800 a monthly however $200 weekly... sounds the same
// until you get a 5 week month."
//
// A weekly price is paid 52 times a year, not 48: $200 a week is $867 a month
// on average and $1,000 in a five-week month. Every two weeks is paid 26 times
// a year: $400 is $867 on average and $1,200 in a month with three paydays. A
// listing that prints "$200/week" beside "$800/month" and stops there leaves
// the renter to find that out at the end of the first long month. So the shelf
// prints the true month beside every cadence the family offers, and says which
// one is the better deal, before anyone chooses.
//
// A NIGHT IS A STAY, NOT A CADENCE (DR-1008). Darrell, 2026-10-13, on the card
// that printed "Nightly $150 ($4,563 a month on average, $4,650 in a 31-night
// month)" and "Monthly is the better deal: $3,813 a month less than nightly":
// "We prefer short term rentals... different business model... we want only
// the difference between co-living situations... not Airbnb." A nightly price
// is a stay someone books for the nights they want; stretching it over a month
// compares two different businesses and talks the family's preferred one down.
// The cadences compared here are the ways a co-living renter PAYS for the same
// month — monthly, weekly, every two weeks. The nightly price stays on the card
// as "Short stay welcome · $150/night", by itself.
//
// PURE: no I/O, no React. The arithmetic lives here once, tested, and both the
// public card and the family's door editor read it.
// =============================================================================

/** The cadences a door may be priced by, with how many of each make a month. */
export const CADENCES = Object.freeze([
  Object.freeze({ id: 'monthly', label: 'Monthly', aMonth: 1, long: 1, longName: '' }),
  // 52 weeks over 12 months: 4.333 a month on average; five in a long month.
  Object.freeze({ id: 'weekly', label: 'Weekly', aMonth: 52 / 12, long: 5, longName: 'a five-week month' }),
  // 26 paydays over 12 months: 2.167 a month on average; three in a long month.
  Object.freeze({ id: 'biweekly', label: 'Every two weeks', aMonth: 26 / 12, long: 3, longName: 'a month with three paydays' }),
]);

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Whole dollars with thousands separated: 866.67 → "$867". */
export function dollars(n) {
  return `$${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
}

/**
 * The cadences a door actually offers, each with its price, its average month
 * and its long month. A price that is missing, zero, negative or not a number
 * is not offered — it is never shown as "$0".
 */
export function cadencePrices({ monthly, weekly, biweekly } = {}) {
  // A nightly price handed in is a stay, not a cadence: it is never compared.
  const given = { monthly: money(monthly), weekly: money(weekly), biweekly: money(biweekly) };
  return CADENCES
    .filter((c) => given[c.id] != null)
    .map((c) => ({
      id: c.id,
      label: c.label,
      price: given[c.id],
      averageMonth: given[c.id] * c.aMonth,
      longMonth: given[c.id] * c.long,
      longName: c.longName,
    }));
}

/**
 * The sentence the renter reads. Empty when the door offers nothing beyond a
 * monthly price: the monthly figure is already printed on its own, and a
 * comparison of one thing with itself is noise.
 */
export function cadenceLine(prices) {
  const list = Array.isArray(prices) ? prices : [];
  if (!list.some((p) => p.id !== 'monthly')) return '';
  return list
    .map((p) => (p.id === 'monthly'
      ? `${p.label} ${dollars(p.price)}`
      : `${p.label} ${dollars(p.price)} (${dollars(p.averageMonth)} a month on average, ${dollars(p.longMonth)} in ${p.longName})`))
    .join(' · ');
}

/**
 * Which cadence costs the least over a year, and by how much a month against
 * the next one. Null with fewer than two cadences — there is no choice to
 * inform.
 */
export function betterDeal(prices) {
  const list = Array.isArray(prices) ? prices : [];
  if (list.length < 2) return null;
  // Within a dollar a month is a tie, and a tie keeps the cadence order
  // (monthly first) rather than whichever side a fraction of a cent fell on.
  const sorted = [...list].sort((a, b) => (Math.abs(a.averageMonth - b.averageMonth) < 0.5 ? 0 : a.averageMonth - b.averageMonth));
  const [best, next] = sorted;
  return { id: best.id, label: best.label, than: next.label, savesAMonth: next.averageMonth - best.averageMonth };
}

/** "Monthly is the better deal: $67 a month less than weekly on average." */
export function dealLine(prices) {
  const d = betterDeal(prices);
  if (!d) return '';
  const than = d.than.toLowerCase();
  if (Math.round(d.savesAMonth) < 1) return `${d.label} and ${than} cost the same over a year.`;
  return `${d.label} is the better deal: ${dollars(d.savesAMonth)} a month less than ${than} on average.`;
}

/** Everything a surface needs in one read. */
export function cadenceChoice(input) {
  const prices = cadencePrices(input);
  return { prices, line: cadenceLine(prices), deal: dealLine(prices) };
}
