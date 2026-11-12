// =============================================================================
// store-catalog — everything the storefront sells, in one list (DR-1449)
// =============================================================================
// A Payhip-class storefront is one page of everything for sale: digital
// books, bundles, courses, coaching, a membership. Ours gathers the same from
// the sources the house already keeps, never a second hand-typed list:
//   books       the published Bookstore products (book-catalog.js);
//   bundles     SEED_BUNDLES that are published and whose books are published;
//   courses     every registered course's self-paced product (learning-products);
//   workshops   the open in-person seats (workshops.js rows, read live);
//   membership  PoeTech+ (poetech-plus.js).
// Each item carries `kind`, a price label and what opens it. Nothing is
// counted that is not on the list, and the counts shown are the list's own.
//
// WHAT CAN REALLY BE BOUGHT is the server's answer (GET /api/checkout:
// `books` and `subscriptions`), read by the same road PoeTech+ uses, never a
// build flag (DR-1438's next build, closed here).
// =============================================================================
import { loadCatalog, publishedProducts } from './book-catalog.js';
import { catalogProductLines } from './learning-products.js';
import { productPricing, priceLabel, SEED_BUNDLES, bundlePublishable, bundleSaving } from './store-pricing.js';
import { PLUS_TIER, PLUS_LABEL, TIMEOUT_MS } from './poetech-plus.js';
import { normalizeProduct } from './commerce.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

/** The bundles as products in the Bookstore's shape, with their saving. Pure. */
export function bundleProducts(books, bundles = SEED_BUNDLES, overrides = []) {
  const byId = Object.fromEntries(asArr(overrides).map((o) => [asStr(o.id), o]));
  const publishedIds = asArr(books)
    .filter((b) => b.status === 'published')
    .map((b) => b.id);
  return asArr(bundles).map((b) => {
    const merged = byId[b.id] ? { ...b, ...byId[b.id] } : b;
    const p = normalizeProduct({ ...merged, recipeId: 'bundle' });
    return { ...p, kind: 'bundle', grants: asArr(merged.grants), saving: bundleSaving(merged, books), publishable: bundlePublishable(merged, publishedIds) };
  });
}

/**
 * The storefront list. `books` and `overrides` come from the device catalog,
 * `lines` from the registry, `events` from the live workshop rows (already
 * normalized), `open` from GET /api/checkout. Pure.
 */
export function storefrontItems({ books = null, overrides = [], lines = null, events = [], open = { books: [], subscriptions: [] } } = {}) {
  const catalog = books || loadCatalog();
  const published = publishedProducts(catalog);
  const openBooks = new Set(asArr(open && open.books));
  const plusOpen = asArr(open && open.subscriptions).includes(PLUS_TIER);
  const items = [];
  for (const b of published) {
    const pricing = productPricing(b);
    items.push({
      kind: 'book',
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      blurb: b.blurb,
      coverEmoji: b.coverEmoji,
      pricing,
      priceLabel: priceLabel(pricing),
      buyable: openBooks.has(b.id),
      product: b,
    });
  }
  for (const bu of bundleProducts(catalog, SEED_BUNDLES, overrides)) {
    if (bu.status !== 'published' || !bu.publishable.ok) continue;
    const pricing = productPricing(bu);
    items.push({
      kind: 'bundle',
      id: bu.id,
      title: bu.title,
      subtitle: bu.subtitle,
      blurb: `${bu.blurb} Save ${bu.saving.pct}%.`,
      coverEmoji: bu.coverEmoji,
      pricing,
      priceLabel: priceLabel(pricing),
      buyable: openBooks.has(bu.id),
      product: bu,
      grants: bu.grants,
    });
  }
  const courseLines = lines || catalogProductLines();
  for (const l of courseLines) {
    const c = l.course;
    items.push({
      kind: 'course',
      id: c.id,
      title: c.title,
      subtitle: `${c.department} · ${c.lessons} lessons in ${c.sections.length} sections`,
      blurb: `Walk-throughs recorded: ${c.coverage.recorded} of ${c.coverage.lessons}.`,
      coverEmoji: c.free ? '🕊' : '🎓',
      pricing: c.free ? { kind: 'offering', cents: 0 } : { kind: 'membership', cents: 3900 },
      priceLabel: c.free ? 'Free' : `Included with ${PLUS_LABEL}`,
      buyable: c.free || plusOpen,
      course: c,
    });
  }
  for (const ev of asArr(events)) {
    const pricing = ev.priceCents > 0 ? { kind: 'fixed', cents: ev.priceCents } : { kind: 'offering', cents: 0 };
    items.push({
      kind: 'workshop',
      id: ev.id,
      title: ev.title,
      subtitle: ev.location,
      blurb: ev.goingRateNote || '',
      coverEmoji: '🪑',
      pricing,
      priceLabel: ev.priceCents > 0 ? `${priceLabel(pricing)} a seat` : 'An offering (free seat)',
      buyable: ev.status === 'open' && (ev.seatsLeft === null || ev.seatsLeft > 0),
      event: ev,
    });
  }
  items.push({
    kind: 'membership',
    id: PLUS_TIER,
    title: PLUS_LABEL,
    subtitle: 'The deeper levels of every PoeTech subject, in either app',
    blurb: 'Monthly, cancel any time from the app.',
    coverEmoji: '✦',
    pricing: { kind: 'membership', cents: 3900 },
    priceLabel: '$39.00 a month',
    buyable: plusOpen,
  });
  return items;
}

/** Counts by kind, from the list itself. Pure. */
export function storefrontCounts(items) {
  const out = { book: 0, bundle: 0, course: 0, workshop: 0, membership: 0, total: 0 };
  for (const it of asArr(items)) {
    if (out[it.kind] !== undefined) out[it.kind] += 1;
    out.total += 1;
  }
  return out;
}

/** What the server says can really be bought: { books: [ids], subscriptions: [tiers] }; anything else reads as nothing open. */
export async function readOpen({ fetchImpl } = {}) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return { books: [], subscriptions: [] };
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const res = await f('/api/checkout', { method: 'GET', headers: { accept: 'application/json' }, ...(ctl ? { signal: ctl.signal } : {}) });
    if (!res || !res.ok) return { books: [], subscriptions: [] };
    const data = await res.json();
    return {
      books: asArr(data && data.books)
        .map(asStr)
        .filter(Boolean),
      subscriptions: asArr(data && data.subscriptions)
        .map(asStr)
        .filter(Boolean),
    };
  } catch {
    return { books: [], subscriptions: [] };
  } finally {
    if (t) clearTimeout(t);
  }
}
