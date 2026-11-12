// =============================================================================
// store-profile — the storefront's own face: who is selling, what, and where
// to find them (DR-1449)
// =============================================================================
// A Payhip-class storefront opens with the seller's name, a line, a short
// bio, the ways to reach them, and a share link, before any product. Ours is
// the same, in our own voice and on our own door. No numbers are painted
// here: counts come from the live catalog (store-catalog.js).
// =============================================================================
import { PERSONAL_DOOR } from './app-doors.js';

export const STORE_PATH = `${PERSONAL_DOOR}?view=store`;

export const STORE_PROFILE = Object.freeze({
  name: 'PoeTech Store',
  seller: 'Darrell Poe',
  tagline: 'Books, courses and workshops from the house, on its own door.',
  bio:
    'Teaching from the Word first: books built from the courses, self-paced courses with a walk-through of each section, ' +
    'and in-person workshops priced for the place they are held. The Word is never sold; the deeper levels of the PoeTech subjects open with PoeTech+.',
  links: Object.freeze([
    { label: 'The app', href: PERSONAL_DOOR },
    { label: 'Learn', href: `${PERSONAL_DOOR}?view=church&church=learn` },
    { label: 'Pricing', href: `${PERSONAL_DOOR}?view=about` },
  ]),
});

/** The full share URL for the store, or for one product on it. Pure. */
export function storeUrl({ origin, productId } = {}) {
  const o = origin !== undefined ? origin : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  return `${o || ''}${STORE_PATH}${productId ? `&product=${encodeURIComponent(productId)}` : ''}`;
}

/** What a share carries. Pure. */
export function storeShareText(product) {
  if (product && product.title) return `${product.title} — ${STORE_PROFILE.name}: ${product.subtitle || product.blurb || ''}`.trim();
  return `${STORE_PROFILE.name}: ${STORE_PROFILE.tagline}`;
}

/** The product a store link points at, from the page's query string. Pure. */
export function productFromSearch(search = '') {
  const q = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  return q.get('product') || '';
}
