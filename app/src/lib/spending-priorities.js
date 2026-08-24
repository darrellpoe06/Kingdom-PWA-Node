// =============================================================================
// spending-priorities — kill debts with the money already being spent
// =============================================================================
// Darrell 2026-08-24: "Potential opportunities to kill debts based on
// spending... prioritizing the spending for the users... from important or
// high to low... if a lot of low priority items are bought without the debts
// reduction at least $1000 dollars off the bottom line of debt not just
// minimum payments etc..."
//
// Every figure is arithmetic on the family's OWN transactions (charges are
// NEGATIVE amounts; dates on t.date ?? t.posted) through the ONE deterministic
// categorizer (lib/categorize.js, learned overrides included) — never a guess
// (DR-0076). Where the data can't say, the surface says so plainly.
//
// PRIORITY TIERS over the categorizer's categories. Two deliberate stands:
//   · charitable giving is COVENANT, never "low priority" — the tithe is
//     first-fruits to Yahweh (Proverbs 3:9), not discretionary spending to
//     redirect; it is shown separately and never counted killable.
//   · 'other' (uncategorized) is UNKNOWN, not low — claiming it is killable
//     would be a painted number. It is named so it can be categorized.
import { categorize } from './categorize.js';

export const PRIORITY_TIERS = {
  essential: ['groceries', 'utilities', 'medical', 'insurance', 'fuel', 'vehicle', 'professional', 'business'],
  covenant: ['charitable'],
  medium: ['household'],
  low: ['dining', 'subscription'],
  // salary / rental-income / transfer / debt-payment are money movement, not spending.
};

export function tierOfCategory(category) {
  for (const [tier, cats] of Object.entries(PRIORITY_TIERS)) {
    if (cats.includes(category)) return tier;
  }
  return category === 'other' ? 'unknown' : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Classify the window's SPENDING (negative amounts) into priority tiers.
export function spendingByPriority(transactions, { learned = {}, nowMs = null, days = 30 } = {}) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const since = now - days * DAY_MS;
  const tiers = { essential: 0, covenant: 0, medium: 0, low: 0, unknown: 0 };
  const counts = { essential: 0, covenant: 0, medium: 0, low: 0, unknown: 0 };
  // Darrell 2026-08-24: "want to be able to drill down into the totals at the
  // top too... Main totals" — every tier keeps its own purchase list, largest
  // first, so each headline number can show exactly what it is made of.
  const itemsByTier = { essential: [], covenant: [], medium: [], low: [], unknown: [] };
  let sawDated = false;
  for (const t of transactions || []) {
    const amt = Number(t?.amount);
    if (!isFinite(amt) || amt >= 0) continue; // spending only
    const when = new Date(t.date ?? t.posted ?? NaN).getTime();
    if (!isFinite(when)) continue;
    sawDated = true;
    if (when < since || when > now) continue;
    const { category } = categorize(t.description || t.payee || '', { learned });
    const tier = tierOfCategory(category);
    if (!tier) continue; // movement, not spending
    const spend = Math.abs(amt);
    tiers[tier] += spend;
    counts[tier] += 1;
    itemsByTier[tier].push({ description: t.description || t.payee || '', amount: spend, category });
  }
  for (const k of Object.keys(itemsByTier)) itemsByTier[k].sort((a, b) => b.amount - a.amount);
  return {
    days,
    tiers: Object.fromEntries(Object.entries(tiers).map(([k, v]) => [k, Math.round(v)])),
    counts,
    itemsByTier,
    lowItems: itemsByTier.low,
    hasData: sawDated,
  };
}

// The opportunity: what would the window's LOW-priority spend kill outright?
// Walks the active debts smallest-balance first and lists every debt the pool
// clears completely, plus what remains as straight bottom-line reduction.
export function killOpportunities(debts, lowPoolDollars) {
  const pool = Number(lowPoolDollars) || 0;
  const targets = (debts || [])
    .filter((d) => d && !d.leaveAlone && Number(d.balance) > 0)
    .sort((a, b) => a.balance - b.balance);
  const kills = [];
  let left = pool;
  for (const d of targets) {
    if (d.balance <= left) { kills.push({ name: d.name || 'debt', balance: Math.round(d.balance) }); left -= d.balance; }
    else break;
  }
  return { pool: Math.round(pool), kills, leftover: Math.round(left) };
}

// The verdict Darrell asked to see plainly: did low-priority buying outweigh
// real debt progress? Progress = the observed NET bottom-line paydown per
// month (netPaydown from each debt's own transactions), summed — beyond-the-
// minimum progress, not minimum payments. The $1,000 floor is his number.
export const BOTTOM_LINE_FLOOR = 1000;

export function spendVsDebtVerdict(spending, debts, { floor = BOTTOM_LINE_FLOOR } = {}) {
  const low = spending?.tiers?.low || 0;
  const observed = (debts || []).filter((d) => d && !d.leaveAlone && isFinite(Number(d.netPaydown)));
  const bottomLine = Math.round(observed.reduce((s, d) => s + Math.max(0, Number(d.netPaydown)), 0));
  const measurable = observed.length > 0;
  return {
    lowSpend: low,
    bottomLineReduction: bottomLine,
    measurable,
    floor,
    // The flag he asked for: meaningful low-priority buying while the debt
    // bottom line moved less than the floor.
    flagged: measurable && low > 0 && bottomLine < floor && low >= floor / 2,
  };
}

// --- Drill-down trace for a tier's headline total ----------------------------
// The same tap-the-number standard as the rest of the Debts tab: formula,
// inputs, and EVERY real purchase behind the figure. Darrell 2026-08-24:
// "give me all of them not x left... we are reviewing in this location...
// we want to see" — the drill-down is the review surface, so nothing is
// truncated; the full list renders, largest first.
const TIER_TITLES = {
  essential: 'Essential spending',
  covenant: 'Giving (covenant)',
  medium: 'Medium-priority spending',
  low: 'Low-priority spending',
  unknown: 'Uncategorized spending',
};
const TIER_FORMULAS = {
  essential: 'Sum of purchases the categorizer marks essential: groceries, utilities, medical, insurance, fuel, vehicle, professional, fees — learned corrections included.',
  covenant: 'Charitable giving — the tithe and offerings. Covenant, never counted killable (Proverbs 3:9): shown for the full picture, excluded from every kill calculation.',
  medium: 'Household-class purchases — real needs mixed with wants; reviewed, not auto-condemned.',
  low: 'Dining and subscriptions — the tier the kill calculations draw from.',
  unknown: 'Purchases the categorizer could not place. UNKNOWN is not LOW: nothing here is counted killable until it is categorized (one correction on the Tx tab teaches the payee everywhere).',
};

export function traceSpendTier(tierKey, spending) {
  const total = spending?.tiers?.[tierKey] || 0;
  const count = spending?.counts?.[tierKey] || 0;
  const items = spending?.itemsByTier?.[tierKey] || [];
  return {
    title: `${TIER_TITLES[tierKey] || tierKey} · last ${spending?.days || 30} days`,
    formula: TIER_FORMULAS[tierKey] || '',
    result: { value: total, kind: 'money' },
    inputs: [{ label: `${count} purchase${count === 1 ? '' : 's'} in the window — all listed below`, value: count, kind: 'count' }],
    sources: items.map((i) => ({ label: i.description, value: Math.round(i.amount), kind: 'money', op: '+' })),
  };
}
