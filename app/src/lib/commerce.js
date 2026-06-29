// commerce.js — sellable book PRODUCTS + SUSTAINABLE-GROWTH unit economics.
//
// Darrell, 2026-06-25: the book line is a monetized product (his voice/IP from
// the Spiritual Module + his other work). Revenue must SUSTAIN itself —
// cost-lean by default, healthy unit economics per sale, and the proceeds
// reinvest into the mission (app development, community skills, Father's Business
// reach), not extractive engagement-milking.
//
// BINDING: money is the owner's hand. This module models the CATALOG, PRICING,
// and the COST-EFFICIENCY SCREEN only. The payment processor moves money
// (checkout-seam.js), configured by Darrell with his own keys. No secrets here.
//
// PURE: product model + price math + the unit-economics screen. No I/O.

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);
const asBool = (v) => v === true;

export const CURRENCY = 'usd';

// Format integer cents as a price string ("Free" at 0).
export function formatPrice(cents, currency = CURRENCY) {
  const c = asNum(cents, 0);
  if (c <= 0) return 'Free';
  const sym = currency === 'usd' ? '$' : '';
  return `${sym}${(c / 100).toFixed(2)}`;
}

// Stripe-style processor fee (default 2.9% + $0.30). Configurable; the real
// number comes from Darrell's processor account. Returns integer cents.
export function processorFee(amountCents, { pctBps = 290, fixedCents = 30 } = {}) {
  const c = asNum(amountCents, 0);
  if (c <= 0) return 0;
  return Math.round((c * pctBps) / 10000) + asNum(fixedCents, 0);
}

// A sellable book product references a build RECIPE (book-corpus) so the content
// is assembled from the real corpus — the product layer adds price + commerce.
export function normalizeProduct(raw = {}) {
  return {
    id: asStr(raw.id) || `prod-${asStr(raw.recipeId) || 'book'}`,
    recipeId: asStr(raw.recipeId),          // what book-corpus.buildRecipe assembles
    bookId: asStr(raw.bookId) || asStr(raw.recipeId),
    title: asStr(raw.title) || 'Untitled',
    author: asStr(raw.author) || 'Darrell Poe',
    subtitle: asStr(raw.subtitle),
    blurb: asStr(raw.blurb),
    coverEmoji: asStr(raw.coverEmoji) || '📖',
    priceCents: Math.max(0, asNum(raw.priceCents, 0)),
    currency: asStr(raw.currency) || CURRENCY,
    businesses: asArr(raw.businesses).map(asStr).filter(Boolean).length ? asArr(raw.businesses) : ['church'],
    status: raw.status === 'published' ? 'published' : 'draft',
    conversationEnabled: asBool(raw.conversationEnabled),
    // tiers whose subscribers get this book included (unified-subscriber lever)
    tierIncluded: asArr(raw.tierIncluded).map(asStr).filter(Boolean),
    createdIso: asStr(raw.createdIso),
  };
}

export function validateProduct(p) {
  const errs = [];
  if (!asStr(p?.title).trim()) errs.push('A product needs a title.');
  if (!asStr(p?.recipeId).trim()) errs.push('A product needs a source recipe (the book it sells).');
  if (asNum(p?.priceCents, -1) < 0) errs.push('Price cannot be negative.');
  return errs;
}

// Publish gate (preview -> execute): a product only goes on sale when it is
// complete. The surface previews this before the publish action fires.
export function publishableProduct(p) {
  const errs = validateProduct(p);
  return { ok: errs.length === 0, reasons: errs };
}

export const LEAN_DEFAULT_NOTE =
  'Default lean. Spend is justified only when it drives sustainable growth that ' +
  'feeds the mission — never growth-at-all-costs.';

// THE COST-EFFICIENCY SCREEN (per sale). Digital books have near-zero marginal
// cost; the real cost per sale is the processor fee + any delivery cost. This is
// the screen Darrell reads before pricing/publishing.
export function unitEconomics(product, { unitCostCents = 0, fixedMonthlyCents = 0, processor } = {}) {
  const priceCents = Math.max(0, asNum(product?.priceCents, 0));
  const feeCents = priceCents > 0 ? processorFee(priceCents, processor) : 0;
  const cost = feeCents + Math.max(0, asNum(unitCostCents, 0));
  const netCents = priceCents - cost;
  const marginPct = priceCents > 0 ? Math.round((netCents / priceCents) * 100) : 0;
  const fixed = Math.max(0, asNum(fixedMonthlyCents, 0));
  return {
    priceCents,
    processorFeeCents: feeCents,
    unitCostCents: Math.max(0, asNum(unitCostCents, 0)),
    netCents,
    marginPct,
    isProfitable: netCents > 0,                       // each sale stands on its own
    // how many sales cover an allocated fixed monthly cost (0 when none assigned)
    breakEvenUnits: fixed > 0 && netCents > 0 ? Math.ceil(fixed / netCents) : 0,
    leanAlternative: LEAN_DEFAULT_NOTE,
  };
}

// The 90-day-free app trial modeled against break-even, so it is a growth lever
// (justified) rather than a loss leader that never converts. Sovereign infra
// makes the trial's marginal cost near-zero, which is the whole point.
export function trialEconomics({ monthlyCents = 0, trialDays = 90, expectedPaidMonths = 12, convertPct = 50, trialInfraCentsPerMonth = 0, processor } = {}) {
  const monthly = Math.max(0, asNum(monthlyCents, 0));
  const monthlyNet = monthly - processorFee(monthly, processor);
  const convert = Math.min(1, Math.max(0, asNum(convertPct, 0) / 100));
  const trialMonths = asNum(trialDays, 90) / 30;
  const trialCostCents = Math.round(asNum(trialInfraCentsPerMonth, 0) * trialMonths);
  // expected lifetime value of a trial start (probability-weighted)
  const ltvCents = Math.round(monthlyNet * asNum(expectedPaidMonths, 12) * convert);
  return {
    trialDays: asNum(trialDays, 90),
    trialCostCents,
    monthlyNetCents: monthlyNet,
    expectedLtvCents: ltvCents,
    justified: ltvCents > trialCostCents,              // growth that sustains itself
    note: trialCostCents === 0
      ? 'Sovereign infra makes the free period near-zero marginal cost — the trial is a pure growth lever.'
      : LEAN_DEFAULT_NOTE,
  };
}
