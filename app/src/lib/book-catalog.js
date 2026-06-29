// book-catalog.js — the sellable catalog of DARRELL'S books (his voice/IP),
// each sourced from a real, already-buildable recipe (book-corpus) so the
// content is the family/community corpus, never fabricated.
//
// Darrell, 2026-06-25: full books from his SPIRITUAL MODULE + his other writing.
// The two below assemble from his ORIGINAL authored work that already lives in
// the app (the Living Lessons series + the Eternal Algorithms library). The
// Spiritual Module worldview book is seeded as DRAFT — honest: its source (the
// worldview doc) is not yet an in-app recipe, so it is not on sale until that
// content pipeline lands (no painted product).
//
// Governor edits (price / publish / conversation) persist as device-local
// overrides; cloud is the book_products table (migration, Darrell's-hand apply).

import { normalizeProduct } from './commerce.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

// Darrell's voice/IP — priced lean, healthy per-sale margin, mission-aligned.
export const SEED_PRODUCTS = [
  {
    id: 'prod-living-lessons',
    recipeId: 'course-living-lessons',
    title: 'Living Lessons from the Word',
    author: 'Darrell Poe',
    subtitle: 'Grace-centered, Word-first teaching for the whole family',
    blurb: 'Darrell\'s self-paced lessons — whole, not flawless. Each lesson pairs the deep teaching with plain, age-right language.',
    coverEmoji: '🕊',
    priceCents: 999,
    businesses: ['church'],
    status: 'published',
    conversationEnabled: true,
    // unified-subscriber lever: Household+ subscribers get it included
    tierIncluded: ['family', 'premium', 'business'],
  },
  {
    id: 'prod-eternal-algorithms',
    recipeId: 'algorithms',
    title: 'Eternal Algorithms',
    author: 'Darrell Poe',
    subtitle: 'Biblical patterns — and the outcomes they yield',
    blurb: 'Frameworks the Word gives, paired with the real-life outcome each one produces. Darrell\'s 4D/3D lens, made a book.',
    coverEmoji: '♾',
    priceCents: 1499,
    businesses: ['church', 'poetech'],
    status: 'published',
    conversationEnabled: true,
    tierIncluded: ['premium', 'business'],
  },
  {
    id: 'prod-spirit-integration',
    recipeId: 'holy-spirit-integration',     // not yet an in-app recipe
    title: 'The Holy Spirit Integration Worldview',
    author: 'Darrell Poe',
    subtitle: 'The spine of the Spiritual Module',
    blurb: 'Darrell\'s foundational work on integration as the relationship. Coming once the worldview text is brought into the app.',
    coverEmoji: '🔥',
    priceCents: 1999,
    businesses: ['church'],
    status: 'draft',                          // honest: content pipeline pending
    conversationEnabled: true,
    tierIncluded: ['premium', 'business'],
  },
];

export function seedCatalog() { return SEED_PRODUCTS.map(normalizeProduct); }

// Apply Governor overrides (price/status/conversationEnabled/tierIncluded) by id.
export function mergeCatalog(seed, overrides) {
  const byId = Object.fromEntries(asArr(overrides).map((o) => [asStr(o.id), o]));
  return asArr(seed).map((p) => (byId[p.id] ? normalizeProduct({ ...p, ...byId[p.id] }) : p));
}

export function publishedProducts(catalog) {
  return asArr(catalog).filter((p) => p.status === 'published');
}
export function productById(catalog, id) {
  return asArr(catalog).find((p) => p.id === asStr(id)) || null;
}

// --- device-local override store (fail-soft) --------------------------------

function safeStore(store) {
  try { return store || ((typeof localStorage !== 'undefined' && localStorage) ? localStorage : null); } catch { return null; }
}
export const OVERRIDES_KEY = 'poe-book-catalog-overrides';

export function loadOverrides(store) {
  const ls = safeStore(store);
  if (!ls) return [];
  try { const raw = ls.getItem(OVERRIDES_KEY); return raw ? asArr(JSON.parse(raw)) : []; } catch { return []; }
}
export function saveOverrides(overrides, store) {
  const ls = safeStore(store);
  if (!ls) return { skipped: 'no-storage' };
  try { ls.setItem(OVERRIDES_KEY, JSON.stringify(asArr(overrides))); return { saved: true }; } catch (e) { return { skipped: 'write-error', error: e }; }
}

// The live catalog = seed + Governor overrides.
export function loadCatalog(store) { return mergeCatalog(seedCatalog(), loadOverrides(store)); }

// Upsert one Governor override (e.g. change price, publish a draft).
export function upsertOverride(overrides, change) {
  const list = asArr(overrides).filter((o) => o.id !== change?.id);
  return change && change.id ? [...list, change] : list;
}
