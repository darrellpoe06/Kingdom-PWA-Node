// =============================================================================
// tiers — the subscription tier ladder + gating comparator (extracted from the
// monolith shell 2026-08-04, a DR-0078 peel; behavior byte-for-byte unchanged).
// Single source of truth for which subscription tier unlocks which view.
// Tiers (ordered cheapest → most expensive):
//   foundation < poetech-plus < family < premium < business
// Special tiers (community / sponsor / founding) inherit at least 'foundation'
// privileges; the inherits-as map promotes them to the tier they should match.
// =============================================================================
export const TIER_ORDER = ['foundation', 'poetech-plus', 'family', 'premium', 'business'];
export const TIER_LABEL = {
  'foundation':   'Foundation (free)',
  'poetech-plus': 'PoeTech+ ($39/mo)',
  // 2026-06-02 rename per tier-review (commits d3733f5 / 4cb55b9): "Family" read as
  // the default/for-everyone tier and bounced a single-adult beta user (Freddie) who
  // saw $89 as the headline price. "Household" keeps the warmth while dropping the
  // "this is the multi-person family tier" misread — it is the multi-module tier for
  // multi-entity households, landlords, or solo pros. Internal key stays 'family' so
  // TIER_ORDER, aliases, and all gating are untouched.
  'family':       'Household ($89/mo)',
  'premium':      'Premium ($149/mo)',
  'business':     'PoeTech Business ($249/mo)',
};
// Special tier names mapped to their effective standard tier for gating.
export const TIER_ALIASES = {
  'loved-ones':       'poetech-plus', // Founding Family — free PoeTech+ for life
  'community':        'poetech-plus', // Sponsored Community tier
  'community-partner':'business',     // Mission-aligned 501(c)(3) — full features
};
export const effectiveTier = (t) => TIER_ALIASES[t] || t || 'foundation';
// Comparator — true if user's effective tier meets or exceeds the required tier.
export const tierMeets = (userTier, requiredTier) => {
  const u = TIER_ORDER.indexOf(effectiveTier(userTier));
  const r = TIER_ORDER.indexOf(requiredTier);
  return u >= 0 && r >= 0 && u >= r;
};
