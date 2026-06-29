// entitlements.js — the UNIFIED SUBSCRIBER + 90-day-free app trial + access.
//
// Darrell, 2026-06-25 (two binding rules):
//   1. SAME SUBSCRIBER ACROSS THE TIERS — ONE subscriber identity spans every
//      product + business (PoeTech, Church, TLC, books). One login, one
//      subscription, entitlements resolve across the whole app per their tier.
//      (Individual book purchases still exist, but the SUBSCRIBER is one record.)
//   2. 90 DAYS FREE — a new subscriber gets 90 days of free access TO THE POETECH
//      APP at their tier, then converts to paid at day 90 — gracefully, with an
//      honest "X days left" countdown, never an abrupt lockout (anxiety-clarity).
//
// Ties into the existing tier ladder (foundation < poetech-plus < family <
// premium < business) and the schema's instance_subscriptions (tier/status/
// period). Money is the owner's hand (checkout-seam.js); this is the trial +
// tier + entitlement LOGIC, which is ours.
//
// PURE helpers + a fail-soft device-local mirror (cloud is instance_subscriptions
// via the migration; documented as Darrell's-hand apply).

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);

export const FREE_TIER = 'foundation';
export const DEFAULT_TRIAL_TIER = 'poetech-plus';     // full app, the entry paid tier
export const TRIAL_DAYS = 90;

// The unified subscriber — ONE record per person, across everything.
export function normalizeSubscriber(raw = {}) {
  return {
    userKey: asStr(raw.userKey),
    tier: asStr(raw.tier) || FREE_TIER,                // the tier they hold/chose
    status: ['trial', 'active', 'past-due', 'expired', 'cancelled'].includes(raw.status) ? raw.status : 'none',
    trialStartIso: asStr(raw.trialStartIso) || null,
    trialDays: asNum(raw.trialDays, TRIAL_DAYS),
    currentPeriodEndIso: asStr(raw.currentPeriodEndIso) || null,
    purchasedBookIds: Array.from(new Set(asArr(raw.purchasedBookIds).map(asStr).filter(Boolean))),
    stripeCustomerId: asStr(raw.stripeCustomerId) || null,
    createdIso: asStr(raw.createdIso) || null,
  };
}

function ms(iso) { const t = Date.parse(asStr(iso)); return Number.isFinite(t) ? t : null; }
export function daysBetween(aIso, bIso) {
  const a = ms(aIso); const b = ms(bIso);
  if (a == null || b == null) return 0;
  return (b - a) / 86400000;
}
function addDaysIso(iso, days) {
  const t = ms(iso);
  if (t == null) return null;
  return new Date(t + days * 86400000).toISOString();
}

// The honest 90-day countdown. Graceful: at day 90 the phase becomes 'expired'
// but access falls back to the free tier — never a lockout.
export function trialState(sub, nowIso) {
  const s = normalizeSubscriber(sub);
  if (s.status === 'active') return { phase: 'paid', daysLeft: 0, endsIso: s.currentPeriodEndIso, percentElapsed: 0, message: 'Your subscription is active.' };
  if (s.status !== 'trial' || !s.trialStartIso) {
    return { phase: 'none', daysLeft: 0, endsIso: null, percentElapsed: 0, message: '' };
  }
  const endsIso = addDaysIso(s.trialStartIso, s.trialDays);
  const elapsed = daysBetween(s.trialStartIso, nowIso);
  const daysLeft = Math.max(0, Math.ceil(s.trialDays - elapsed));
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsed / s.trialDays) * 100)));
  if (elapsed >= s.trialDays) {
    return {
      phase: 'expired', daysLeft: 0, endsIso, percentElapsed: 100,
      message: 'Your free 90 days are complete — you are on the free Foundation tier. Upgrade any time to restore your full features; nothing was deleted.',
    };
  }
  const day = daysLeft === 1 ? 'day' : 'days';
  return {
    phase: 'trial', daysLeft, endsIso, percentElapsed,
    message: `${daysLeft} ${day} left in your free 90-day access. No charge until then.`,
  };
}

// The tier actually in force right now. Full app at their tier through the 90
// free days; after that (unpaid) it drops gracefully to free — not a lockout.
export function effectiveTier(sub, nowIso) {
  const s = normalizeSubscriber(sub);
  if (s.status === 'active') return s.tier;
  const t = trialState(s, nowIso);
  if (t.phase === 'trial') return s.tier;
  return FREE_TIER;
}

// Everyone signed-in always has at least free access — there is never a wall.
export function appAccess(sub, nowIso) {
  const t = trialState(sub, nowIso);
  const tier = effectiveTier(sub, nowIso);
  return { tier, fullApp: tier !== FREE_TIER, inTrial: t.phase === 'trial', daysLeft: t.daysLeft, phase: t.phase };
}

// A book is unlocked if it is free, purchased outright, or included in the
// subscriber's effective tier (the unified-subscriber lever).
export function entitledToBook(sub, product, nowIso) {
  if (!product) return false;
  if (asNum(product.priceCents, 0) <= 0) return true;          // free book
  const s = normalizeSubscriber(sub);
  if (s.purchasedBookIds.includes(asStr(product.id))) return true;
  const tier = effectiveTier(s, nowIso);
  if (asArr(product.tierIncluded).includes(tier)) return true;
  return false;
}

// --- transitions (pure) -----------------------------------------------------

export function startTrial(sub, nowIso, tier) {
  const s = normalizeSubscriber(sub);
  if (s.status === 'active' || s.status === 'trial') return s;   // idempotent
  // explicit tier wins; else keep an already-chosen non-free tier; else default.
  const chosen = asStr(tier) || (s.tier && s.tier !== FREE_TIER ? s.tier : DEFAULT_TRIAL_TIER);
  return normalizeSubscriber({ ...s, status: 'trial', tier: chosen, trialStartIso: asStr(nowIso), trialDays: TRIAL_DAYS, createdIso: s.createdIso || asStr(nowIso) });
}

export function grantBookEntitlement(sub, productId) {
  const s = normalizeSubscriber(sub);
  if (!productId) return s;
  return normalizeSubscriber({ ...s, purchasedBookIds: [...s.purchasedBookIds, asStr(productId)] });
}

export function activatePaid(sub, { tier, periodEndIso, stripeCustomerId } = {}) {
  const s = normalizeSubscriber(sub);
  return normalizeSubscriber({ ...s, status: 'active', tier: asStr(tier) || s.tier, currentPeriodEndIso: asStr(periodEndIso) || s.currentPeriodEndIso, stripeCustomerId: asStr(stripeCustomerId) || s.stripeCustomerId });
}

// --- device-local mirror (fail-soft) ----------------------------------------

function safeStore(store) {
  try { return store || ((typeof localStorage !== 'undefined' && localStorage) ? localStorage : null); } catch { return null; }
}
export function subscriberKey(userKey) { return `poe-subscriber.${asStr(userKey).toLowerCase() || 'anon'}`; }

export function loadSubscriber(userKey, store) {
  const ls = safeStore(store);
  const base = normalizeSubscriber({ userKey });
  if (!ls) return base;
  try {
    const raw = ls.getItem(subscriberKey(userKey));
    return raw ? normalizeSubscriber({ ...JSON.parse(raw), userKey }) : base;
  } catch { return base; }
}

export function saveSubscriber(userKey, sub, store) {
  const ls = safeStore(store);
  if (!ls) return { skipped: 'no-storage' };
  try { ls.setItem(subscriberKey(userKey), JSON.stringify(normalizeSubscriber({ ...sub, userKey }))); return { saved: true }; }
  catch (e) { return { skipped: 'write-error', error: e }; }
}

// Load (or first-time create + START the 90-day trial) for a signed-in user.
// Family/loved-ones lifetime tiers are handled by the existing tier aliases in
// the shell; this is the self-serve default.
export function ensureSubscriber(userKey, nowIso, { store, autoTrial = true, trialTier = DEFAULT_TRIAL_TIER } = {}) {
  let s = loadSubscriber(userKey, store);
  if (autoTrial && s.status === 'none') {
    s = startTrial(s, nowIso, trialTier);
    saveSubscriber(userKey, s, store);
  }
  return s;
}
