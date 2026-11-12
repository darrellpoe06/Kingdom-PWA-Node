// =============================================================================
// instant-delivery — the book is in the buyer's hands the moment Stripe
// sends them back (DR-1449)
// =============================================================================
// Stripe returns the buyer to the store with `?paid=1&session_id=cs_...`.
// This module reads that, asks /api/deliver what the session bought (the
// server asks Stripe; the app never holds a key), grants the device-local
// entitlement for every book handed over, and names the downloads the app
// can build itself (book-formats.js). An answer that is not the server's
// own "ok" delivers nothing and says so: the library still shows the book
// once the webhook writes the buyer's row (DR-0076).
// =============================================================================
import { TIMEOUT_MS } from './poetech-plus.js';
import { grantBookEntitlement } from './entitlements.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);

/** The session id a Stripe return carries, or ''. Pure. */
export function sessionIdFromSearch(search = '') {
  const q = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const id = asStr(q.get('session_id'));
  return /^cs_(test|live)_[A-Za-z0-9]+$/.test(id) ? id : '';
}

/** The return path the checkout asks Stripe for: this page, marked, with the session id Stripe fills in. Pure. */
export function deliveryReturnPaths(pathname = '/poetech-app/', search = '') {
  const path = asStr(pathname).startsWith('/') && !asStr(pathname).startsWith('//') ? pathname : '/poetech-app/';
  const q = new URLSearchParams(asStr(search).replace(/^\?/, ''));
  q.delete('paid');
  q.delete('session_id');
  const base = q.toString() ? `${path}?${q.toString()}` : path;
  const sep = base.includes('?') ? '&' : '?';
  // Stripe substitutes {CHECKOUT_SESSION_ID} itself; it must not be URL-encoded.
  return { successUrl: `${base}${sep}paid=1&session_id={CHECKOUT_SESSION_ID}`, cancelUrl: base };
}

/** Ask the server what the session bought. -> { ok:true, product, grants, email } | { ok:false, error } */
export async function readDelivery(sessionId, { fetchImpl } = {}) {
  const id = asStr(sessionId);
  if (!id) return { ok: false, error: 'no-session' };
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return { ok: false, error: 'no-fetch' };
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const res = await f(`/api/deliver?session_id=${encodeURIComponent(id)}`, {
      headers: { accept: 'application/json' },
      ...(ctl ? { signal: ctl.signal } : {}),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.ok === true && asStr(data.product)) {
      return { ok: true, product: data.product, grants: asArr(data.grants).map(asStr).filter(Boolean), email: asStr(data.email) || null };
    }
    return { ok: false, error: asStr(data && data.error) || `http-${res.status}` };
  } catch (e) {
    return { ok: false, error: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    if (t) clearTimeout(t);
  }
}

/** Grant every delivered book on this device. Pure over the subscriber. */
export function applyDelivery(sub, delivery) {
  let next = sub;
  for (const id of asArr(delivery && delivery.grants)) next = grantBookEntitlement(next, id);
  return next;
}

const SAY = Object.freeze({
  'not-paid': 'The payment has not cleared yet. The book appears in your library the moment it does.',
  'unknown-session': 'That checkout could not be found. If you were charged, the book reaches your library when the payment lands.',
  'processor-not-configured': 'Delivery is not open yet. Nothing was charged.',
  timeout: 'The delivery check timed out. Your library shows the book once the payment lands.',
});

/** Plain words for a delivery that did not happen. Pure. */
export function sayDeliveryError(code) {
  return SAY[code] || `The book could not be delivered right now (${asStr(code) || 'no answer'}). Your library shows it once the payment lands.`;
}
