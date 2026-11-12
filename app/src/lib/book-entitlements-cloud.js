// =============================================================================
// book-entitlements-cloud — the books a signed-in person owns, read from their
// own rows (book_entitlements, migration 0051; RLS returns only theirs)
// =============================================================================
// DR-1447. The Stripe webhook now hands a paid book to its buyer by writing
// this table (grant_book_entitlement). Until this module, nothing in the app
// read it back: the store's "Owned" came only from the device-local record,
// so a book bought on the phone was unowned on the laptop. One read, one
// timeout; a read that did not answer is unknown, never "not owned" (DR-0076).
// =============================================================================
import { TIMEOUT_MS } from './poetech-plus.js';

const asStr = (v) => (typeof v === 'string' ? v : '');

/** -> { ok: true, productIds: [...] } when the database answered; { ok: false, productIds: [] } when it did not. */
export async function readMyBookEntitlements(client) {
  try {
    if (!client || typeof client.from !== 'function') return { ok: false, productIds: [] };
    const q = client.from('book_entitlements').select('product_id');
    const { data, error } = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (error || !Array.isArray(data)) return { ok: false, productIds: [] };
    return { ok: true, productIds: [...new Set(data.map((r) => asStr(r && r.product_id)).filter(Boolean))] };
  } catch {
    return { ok: false, productIds: [] };
  }
}

/** Owned on this device OR on the person's own cloud row. Pure. */
export function ownsBook(localOwned, cloudIds, productId) {
  return !!localOwned || (Array.isArray(cloudIds) && cloudIds.includes(asStr(productId)));
}
