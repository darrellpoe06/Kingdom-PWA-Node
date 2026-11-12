// =============================================================================
// poetech-plus — the app's half of the PoeTech+ checkout (DR-1432)
// =============================================================================
// Darrell 2026-11-12: "build the PoeTech+ checkout". DR-1428 set the rule (the
// rigorous levels of the PoeTech subjects are PoeTech+, $39/mo, for a PERSON,
// in either app) and DR-1430 kept every lesson in both apps: access is what is
// paid for. This module is how a person buys it, sees that they hold it, and
// manages or cancels it. It moves no money and holds no key: /api/checkout and
// /api/billing-portal hold Stripe, and the person's tier is a row only the
// Stripe webhook writes (member_subscriptions, migration 0321).
//
// HONEST BY CONSTRUCTION. The buy button exists only when GET /api/checkout
// says the tier is open for sale; an answer that is not that JSON (Functions
// down, the SPA shell, a timeout) reads as NOT open, never as open (DR-0076).
// Every network call has a timeout. Nothing here can grant a tier: the app
// only READS the row the webhook wrote. For a signed-in person outside the
// family list the app's tier follows that row (a cancellation lowers it); a
// family member's grant is untouched (the shell never calls this for them).
// =============================================================================
import { TIER_LABEL } from './tiers.js';

export const FREE_TIER = 'foundation';

export const PLUS_TIER = 'poetech-plus';
export const PLUS_LABEL = TIER_LABEL[PLUS_TIER];
export const TIMEOUT_MS = 12000;
// A card that fails is retried by Stripe for a while. A member keeps the tier
// through that, up to this long past the paid period, never an abrupt lockout.
export const PAST_DUE_GRACE_DAYS = 14;

const asStr = (v) => (typeof v === 'string' ? v : '');

async function timed(fetchImpl, url, init = {}, ms = TIMEOUT_MS) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
    return await fetchImpl(url, ctl ? { ...init, signal: ctl.signal } : init);
  } finally {
    if (t) clearTimeout(t);
  }
}

const doFetch = (f) => f || (typeof fetch !== 'undefined' ? fetch : null);

/** Is PoeTech+ really for sale right now? Anything but the server's own "yes" is no. */
export async function checkoutOpen({ fetchImpl } = {}) {
  const f = doFetch(fetchImpl);
  if (!f) return false;
  try {
    const res = await timed(f, '/api/checkout', { method: 'GET', headers: { accept: 'application/json' } });
    if (!res || !res.ok) return false;
    const data = await res.json();
    return Array.isArray(data?.subscriptions) && data.subscriptions.includes(PLUS_TIER);
  } catch {
    return false;
  }
}

/** The paid tier a member's row grants right now, or null. Pure. */
export function paidTierFrom(rows, nowIso = new Date().toISOString()) {
  const r = Array.isArray(rows) ? rows[0] : null;
  if (!r || !asStr(r.tier)) return null;
  if (r.status === 'active') return r.tier;
  if (r.status === 'past-due') {
    const end = Date.parse(asStr(r.current_period_end));
    const now = Date.parse(nowIso);
    if (Number.isFinite(end) && Number.isFinite(now) && now <= end + PAST_DUE_GRACE_DAYS * 86400000) return r.tier;
  }
  return null;
}

/**
 * Read the signed-in person's own row (RLS returns only theirs).
 * -> { ok: true, tier } when the database answered (tier null = no paid tier),
 *    { ok: false } when it did not (network, timeout, table not there yet).
 */
export async function readMemberTier(client) {
  try {
    if (!client || typeof client.from !== 'function') return { ok: false };
    const q = client.from('member_subscriptions').select('tier,status,current_period_end').limit(1);
    const { data, error } = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), TIMEOUT_MS))]);
    if (error || !Array.isArray(data)) return { ok: false };
    return { ok: true, tier: paidTierFrom(data) };
  } catch {
    return { ok: false };
  }
}

/**
 * The tier a signed-in person who is NOT on the family list should hold, from
 * a read of their own row. Pure. A read that did not answer changes nothing
 * (unknown is not "unpaid"); an answer sets the tier to what was paid for, so
 * a cancellation takes effect too, and no paid row means the free tier.
 */
export function memberTierDecision(current, read) {
  if (!read || !read.ok) return current;
  return read.tier || FREE_TIER;
}

/** On sign-in (non-family, not demo, not reviewer): the app's tier follows the member's row. */
export async function syncMemberTier(client, setData) {
  const read = await readMemberTier(client);
  if (read.ok && typeof setData === 'function') {
    setData((d) => {
      const next = memberTierDecision(d && d.userTier, read);
      return next === (d && d.userTier) ? d : { ...d, userTier: next };
    });
  }
  return read;
}

/** Where Stripe sends the buyer back: the page they bought from, marked. Pure. */
export function returnPaths(pathname = '/poetech-app/', search = '') {
  const path = asStr(pathname).startsWith('/') && !asStr(pathname).startsWith('//') ? pathname : '/poetech-app/';
  const q = new URLSearchParams(asStr(search).replace(/^\?/, ''));
  q.delete('poetech_plus');
  const base = q.toString() ? `${path}?${q.toString()}` : path;
  const sep = base.includes('?') ? '&' : '?';
  return { successUrl: `${base}${sep}poetech_plus=welcome`, cancelUrl: base };
}

const SAY = Object.freeze({
  'processor-not-configured': 'PoeTech+ checkout is not open yet. Nothing was charged.',
  'identity-not-configured': 'PoeTech+ checkout is not open yet. Nothing was charged.',
  'sign-in-required': 'Sign in first, so PoeTech+ is yours on every device you use.',
  'no-subscription': 'There is no PoeTech+ subscription on this sign-in.',
});

/** Plain words for a server answer. Pure. */
export function sayCheckoutError(code) {
  return SAY[code] || `Checkout could not start (${asStr(code) || 'no answer'}). Nothing was charged.`;
}

async function postJson(fetchImpl, url, token, body) {
  const f = doFetch(fetchImpl);
  if (!f) return { error: 'no-fetch' };
  try {
    const res = await timed(f, url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && asStr(data.url).startsWith('https://')) return { url: data.url };
    return { error: asStr(data?.error) || `http-${res.status}` };
  } catch (e) {
    return { error: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  }
}

/** Start the Stripe Checkout for PoeTech+. Returns { url } to go to, or { error }. */
export async function startPlusCheckout({ token, pathname, search, fetchImpl } = {}) {
  if (!token) return { error: 'sign-in-required' };
  const { successUrl, cancelUrl } = returnPaths(pathname, search);
  return postJson(fetchImpl, '/api/checkout', token, { kind: 'subscription', tier: PLUS_TIER, successUrl, cancelUrl });
}

/** Open Stripe's portal (card, receipts, cancel) for the signed-in member. */
export async function openPlusPortal({ token, pathname, fetchImpl } = {}) {
  if (!token) return { error: 'sign-in-required' };
  return postJson(fetchImpl, '/api/billing-portal', token, { returnPath: pathname || '/poetech-app/' });
}
