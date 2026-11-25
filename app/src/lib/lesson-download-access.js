// =============================================================================
// lesson-download-access — who may take a lesson off the page (DR-1652)
// =============================================================================
// Darrell 2026-11-24: "Don't allow any lesson to be downloaded... we will now
// be charging a fee or if they have a subscription they can... make sense?"
//
// THE LINE. Reading and the reading voice stay open to everyone, signed in or
// not, at every level, so no child and no one without money is ever kept from
// a lesson (DR-0536 / DR-1428 hold unchanged). What is paid is TAKING THE
// LESSON AWAY: the offline download (one lesson, a course, every lesson), the
// full-text copy, and the curriculum export (markdown copy, .md file, print).
// That is the accompaniment, not the content (learn-access-tiers.js).
//
// TWO WAYS THROUGH, BOTH ALREADY BUILT:
//   1. PoeTech+ (or any higher tier): the subscription (DR-1432). A family
//      member's grant counts the same way, through tierMeets.
//   2. The Download Pass: a one-time fee, sold through the existing one-off
//      checkout (kind 'book', DR-1448/1449) as catalog product
//      DOWNLOAD_PASS_ID. Its PRICE lives only in STRIPE_CATALOG, Darrell's
//      custody; until that entry exists the server says it is not for sale and
//      the app never shows a buy button for it. The webhook hands the paid
//      pass to the buyer as a book_entitlements row; the app reads it back.
//
// FAIL CLOSED, SAY WHY. A read that did not answer is 'unknown': downloads
// stay shut and the reader is told the check did not answer and can retry,
// never told they have not paid (DR-0076). Every network call has a timeout.
// =============================================================================
import { tierMeets } from './tiers.js';
import { PLUS_TIER, TIMEOUT_MS } from './poetech-plus.js';
import { readMyBookEntitlements } from './book-entitlements-cloud.js';

/**
 * THE DOWNLOADS SWITCH (DR-1655). Darrell 2026-11-25: "We actually don't want
 * downloads unless we have a specific reason... so make that behind a control
 * ... no one can by default... asking the administration for copies of the
 * content... however I'm not allowing it currently... but want to be able to
 * at will." OFF: no one takes a lesson off the page, at any tier, with or
 * without the pass; the door offers to ask the administration for a copy. ON:
 * the DR-1652 rule (PoeTech+ or the Download Pass) decides. Only Darrell's word
 * flips it. Reading and Play stay free for everyone either way.
 */
export const DOWNLOADS_OPEN = false;
// DR-1656: the live switch is stored (platform_switches, migration 0344) and
// flipped in the app by the Governor; DOWNLOADS_OPEN is what the app uses when
// the stored answer has not come back (in flight, an error, a timeout): closed.

/** The one-time product in STRIPE_CATALOG that unlocks downloads for a person. */
export const DOWNLOAD_PASS_ID = 'learn-download-pass';
export const DOWNLOAD_PASS_TITLE = 'PoeTech Lesson Download Pass';

/** The states a download door can be in. */
export const ACCESS = Object.freeze({
  SIGN_IN: 'sign-in', // signed out: the existing free-account prompt
  CHECKING: 'checking', // the entitlement read is in flight
  ALLOWED: 'allowed', // PoeTech+ (or higher) or the pass is theirs
  NEEDS_PURCHASE: 'needs-purchase', // the database answered: neither is theirs
  UNKNOWN: 'unknown', // the read did not answer: shut, with a retry
  CLOSED: 'closed', // the administration has downloads switched off for everyone
});

const asStr = (v) => (typeof v === 'string' ? v : '');

/** Does this tier carry downloads by itself? Pure. */
export function tierAllowsDownloads(userTier) {
  return tierMeets(userTier, PLUS_TIER);
}

/**
 * The access decision. Pure.
 *   signedIn   — the shell's !!authSession
 *   userTier   — the app's tier (family grant, or synced from the member row)
 *   read       — { ok, productIds } from readMyBookEntitlements, or null while in flight
 *   open       — the downloads switch; anything but true is closed (fail closed)
 */
export function downloadAccess({ signedIn = false, userTier = 'foundation', read = null, open = DOWNLOADS_OPEN } = {}) {
  if (open !== true) return ACCESS.CLOSED;
  if (!signedIn) return ACCESS.SIGN_IN;
  if (tierAllowsDownloads(userTier)) return ACCESS.ALLOWED;
  if (!read) return ACCESS.CHECKING;
  if (!read.ok) return ACCESS.UNKNOWN;
  return Array.isArray(read.productIds) && read.productIds.includes(DOWNLOAD_PASS_ID) ? ACCESS.ALLOWED : ACCESS.NEEDS_PURCHASE;
}

/** Read whether the signed-in person owns the pass (RLS returns only their rows). */
export async function readDownloadPass(client) {
  return readMyBookEntitlements(client);
}

async function timed(f, url, init = {}, ms = TIMEOUT_MS) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
    return await f(url, ctl ? { ...init, signal: ctl.signal } : init);
  } finally {
    if (t) clearTimeout(t);
  }
}

/**
 * What can really be bought right now, from the server's own GET /api/checkout.
 * -> { plus: bool, pass: bool }. Anything but the server's JSON reads as
 * nothing for sale, never as open (DR-0076).
 */
export async function readDownloadOffers({ fetchImpl } = {}) {
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const none = { plus: false, pass: false };
  if (!f) return none;
  try {
    const res = await timed(f, '/api/checkout', { method: 'GET', headers: { accept: 'application/json' } });
    if (!res || !res.ok) return none;
    const data = await res.json();
    return {
      plus: Array.isArray(data?.subscriptions) && data.subscriptions.includes(PLUS_TIER),
      pass: Array.isArray(data?.books) && data.books.includes(DOWNLOAD_PASS_ID),
    };
  } catch {
    return none;
  }
}

/** Where Stripe sends the buyer back: this page, marked. Pure. */
export function passReturnPaths(pathname = '/poetech-app/', search = '') {
  const path = asStr(pathname).startsWith('/') && !asStr(pathname).startsWith('//') ? pathname : '/poetech-app/';
  const q = new URLSearchParams(asStr(search).replace(/^\?/, ''));
  q.delete('download_pass');
  const base = q.toString() ? `${path}?${q.toString()}` : path;
  const sep = base.includes('?') ? '&' : '?';
  return { successUrl: `${base}${sep}download_pass=welcome`, cancelUrl: base };
}

/**
 * Start the one-time Download Pass checkout. The server prices it from
 * STRIPE_CATALOG and verifies the buyer from the token; nothing here prices.
 * -> { url } to go to, or { error }.
 */
export async function startDownloadPassCheckout({ token, pathname, search, fetchImpl } = {}) {
  if (!token) return { error: 'sign-in-required' };
  const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!f) return { error: 'no-fetch' };
  const { successUrl, cancelUrl } = passReturnPaths(pathname, search);
  try {
    const res = await timed(f, '/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ kind: 'book', productId: DOWNLOAD_PASS_ID, title: DOWNLOAD_PASS_TITLE, successUrl, cancelUrl }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && asStr(data.url).startsWith('https://')) return { url: data.url };
    return { error: asStr(data?.error) || `http-${res.status}` };
  } catch (e) {
    return { error: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  }
}

const SAY = Object.freeze({
  'processor-not-configured': 'Checkout is not open yet. Nothing was charged.',
  'identity-not-configured': 'Checkout is not open yet. Nothing was charged.',
  'unknown-product': 'The Download Pass is not for sale yet. Nothing was charged.',
  'sign-in-required': 'Sign in first, so the pass is yours on every device you use.',
  timeout: 'Checkout did not answer in time. Nothing was charged. Try again.',
  network: 'Checkout could not be reached. Nothing was charged. Try again.',
});

/** Plain words for a checkout answer. Pure. */
export function sayPassError(code) {
  return SAY[code] || `Checkout could not start (${asStr(code) || 'no answer'}). Nothing was charged.`;
}

/**
 * Ask the administration for a copy (DR-1655), through the same feedback
 * pipe every other request in the app rides (feedback table, the space the
 * person stands in, triaged by the stewards). -> { ok } or { ok:false, why }.
 */
export async function requestLessonCopy({ what = 'a lesson', where = '', upload } = {}) {
  const send = upload || (await import('./feedback-sync.js')).uploadFeedback;
  const text = `Copy request: please send me a copy of ${asStr(what) || 'a lesson'}.${where ? ` (${asStr(where)})` : ''}`;
  try {
    const r = await send({ text, area: 'Learn: copy request', sentiment: 'neutral' }, { activeTab: 'Learn: copy request' });
    if (r && r.uploaded) return { ok: true };
    return { ok: false, why: r && r.skipped === 'signed-out' ? 'sign-in' : 'failed' };
  } catch {
    return { ok: false, why: 'failed' };
  }
}

function withTimeout(p, ms) {
  let t;
  return Promise.race([p, new Promise((_, rej) => (t = setTimeout(() => rej(new Error('timeout')), ms)))]).finally(() => clearTimeout(t));
}

/** The stored switch (DR-1656). -> { ok, open }. Anything but the database's own true is closed. */
export async function readDownloadsOpen(client, ms = TIMEOUT_MS) {
  if (!client || typeof client.rpc !== 'function') return { ok: false, open: false };
  try {
    const { data, error } = await withTimeout(Promise.resolve(client.rpc('downloads_open')), ms);
    if (error) return { ok: false, open: false };
    return { ok: true, open: data === true };
  } catch {
    return { ok: false, open: false };
  }
}

/** The Governor flips the switch (DR-1656). -> { ok, open } or { ok:false, why }. */
export async function setDownloadsOpen(client, on, ms = TIMEOUT_MS) {
  if (!client || typeof client.rpc !== 'function') return { ok: false, why: 'failed' };
  try {
    const { data, error } = await withTimeout(Promise.resolve(client.rpc('set_downloads_open', { on_in: on === true })), ms);
    if (error) return { ok: false, why: error.code === '42501' ? 'not-governor' : 'failed' };
    return { ok: true, open: data === true };
  } catch (e) {
    return { ok: false, why: e && e.message === 'timeout' ? 'timeout' : 'failed' };
  }
}
