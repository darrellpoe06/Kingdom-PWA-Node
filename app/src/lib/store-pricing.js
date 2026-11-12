// =============================================================================
// store-pricing — how a store product is priced, and what one purchase hands
// over (DR-1449: the sovereign storefront)
// =============================================================================
// Darrell 2026-11-12, with a Payhip storefront link: "Make our store have this
// capability", then "Do we need that or can we do it sovereign?" This module
// is the sovereign answer for the money shapes a Payhip-class store sells
// with, on the seam the house already owns (Stripe through our own Pages
// Functions, DR-1432/DR-1438), never a third party's storefront:
//
//   fixed          one price, in cents (what the store sold with before);
//   pay-what-you-want (pwyw)  the buyer names the price on Stripe's own
//                  page, at or above a MINIMUM the server holds, with a
//                  PRESET suggested; the client never sends an amount;
//   offering       $0 (the Word's own, DR-0536: never sold; a gift welcome);
//   bundle         one purchase GRANTS several books (every id in `grants`).
//   coupons        Stripe promotion codes, made in the Stripe dashboard,
//                  entered on Stripe's page (allow_promotion_codes).
//
// THE CATALOG ENTRY IS THE SERVER'S TRUTH. functions/api/checkout.js reads
// STRIPE_CATALOG (env JSON) and charges only what it holds. This module and
// the function read the SAME entry shape, so the store shows what the server
// will charge: parseCatalogEntry here MIRRORS catalogEntry in checkout.js
// (conformance-tested in the-sovereign-storefront.test.js, as PRODUCT_ENTITY
// is between the webhook and payments-ledger.js).
//
//   STRIPE_CATALOG = {
//     "prod-living-lessons": 999,                              fixed $9.99
//     "prod-eternal-algorithms": { "cents": 1499 },            fixed, long form
//     "prod-world-issues": { "pwyw": { "min": 500, "preset": 1499 } },
//     "bundle-darrells-books": { "cents": 1999,
//        "grants": ["prod-living-lessons", "prod-eternal-algorithms"] }
//   }
// =============================================================================

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const int = (v) => (Number.isInteger(v) && v >= 0 ? v : null);

export const PRICING_KINDS = Object.freeze(['fixed', 'pwyw', 'offering']);

/**
 * One catalog entry -> { kind, cents, minCents, presetCents, grants } or null
 * when the entry is not a shape the server would charge. Pure. MIRRORED in
 * functions/api/checkout.js (catalogEntry).
 */
export function parseCatalogEntry(raw) {
  if (Number.isInteger(raw)) return raw > 0 ? { kind: 'fixed', cents: raw, minCents: raw, presetCents: raw, grants: [] } : null;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const grants = asArr(raw.grants).map(asStr).filter(Boolean);
  if (raw.pwyw && typeof raw.pwyw === 'object') {
    const min = int(raw.pwyw.min);
    const preset = int(raw.pwyw.preset);
    if (min === null || min <= 0) return null;
    return { kind: 'pwyw', cents: preset !== null && preset >= min ? preset : min, minCents: min, presetCents: preset !== null && preset >= min ? preset : min, grants };
  }
  const cents = int(raw.cents);
  if (cents === null || cents <= 0) return null;
  return { kind: 'fixed', cents, minCents: cents, presetCents: cents, grants };
}

/** The ids one purchase of `productId` hands over: itself, or a bundle's grants. Pure. */
export function grantsFor(productId, entry) {
  const id = asStr(productId);
  if (!id) return [];
  const g = entry && asArr(entry.grants).filter(Boolean);
  return g && g.length ? [...new Set(g)] : [id];
}

/** The product's own pricing (what the store shows), from its catalog fields. Pure. */
export function productPricing(product = {}) {
  const cents = Number.isFinite(product.priceCents) ? Math.max(0, Math.round(product.priceCents)) : 0;
  if (product.pricing === 'pwyw') {
    const min = Number.isFinite(product.minCents) ? Math.max(0, Math.round(product.minCents)) : cents;
    return { kind: 'pwyw', cents: Math.max(cents, min), minCents: min, presetCents: Math.max(cents, min) };
  }
  if (cents === 0) return { kind: 'offering', cents: 0, minCents: 0, presetCents: 0 };
  return { kind: 'fixed', cents, minCents: cents, presetCents: cents };
}

const dollars = (c) => `$${(c / 100).toFixed(2)}`;

/** The price as the shelf says it. Pure. */
export function priceLabel(pricing) {
  const p = pricing || { kind: 'offering', cents: 0 };
  if (p.kind === 'pwyw') return `Pay what you want, from ${dollars(p.minCents)}`;
  if (p.kind === 'offering' || !(p.cents > 0)) return 'An offering (free)';
  return dollars(p.cents);
}

/**
 * The store's bundles: one purchase, several books. A bundle is a draft until
 * the Governor publishes it, like any product; it is publishable only when
 * every book it grants is itself published (no painted contents).
 */
export const SEED_BUNDLES = Object.freeze([
  {
    id: 'bundle-darrells-books',
    title: "Darrell's books, together",
    subtitle: 'Living Lessons from the Word and Eternal Algorithms, in one',
    blurb: 'The two published books in one purchase, priced below the pair.',
    coverEmoji: '📚',
    priceCents: 1999,
    grants: ['prod-living-lessons', 'prod-eternal-algorithms'],
    businesses: ['church', 'poetech'],
    status: 'draft',
    tierIncluded: ['premium', 'business'],
  },
]);

/** A bundle may go on sale only when every book it grants is on sale. Pure. */
export function bundlePublishable(bundle, publishedIds) {
  const ids = new Set(asArr(publishedIds));
  const missing = asArr(bundle && bundle.grants).filter((g) => !ids.has(g));
  if (!asArr(bundle && bundle.grants).length) return { ok: false, reasons: ['A bundle needs at least one book.'] };
  return missing.length ? { ok: false, reasons: [`Not every book in it is published yet: ${missing.join(', ')}.`] } : { ok: true, reasons: [] };
}

/** A bundle's saving against buying each book alone, in cents and percent. Pure. */
export function bundleSaving(bundle, products) {
  const by = new Map(asArr(products).map((p) => [p.id, p]));
  const alone = asArr(bundle && bundle.grants).reduce((a, id) => a + ((by.get(id) || {}).priceCents || 0), 0);
  const price = Number.isFinite(bundle && bundle.priceCents) ? bundle.priceCents : 0;
  const saved = Math.max(0, alone - price);
  return { aloneCents: alone, savedCents: saved, pct: alone ? Math.round((saved / alone) * 100) : 0 };
}
