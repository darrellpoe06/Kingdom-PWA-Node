// =============================================================================
// moore-door — pure model for the Moore Divahs public door (/?moore=1)
// =============================================================================
// The branded customer-facing app Shay shows in the Quad Cities (Darrell,
// 2026-07-07): Moore Divahs FIRST, then the family of businesses PoeTech
// supports + PoeTech itself. This lib is pure (no React/IO): the tab registry,
// the REAL PoeTech tier pricing, and the price-out logic.
//
// PRICING IS REAL OR ABSENT (DR-0076): the tier ladder + monthly prices below
// mirror the in-app ladder (entitlements.js foundation < poetech-plus < family
// < premium < business; prices per the ARPU model, components/DevOps.jsx:704).
// Business/white-label BUILD pricing was "custom quote" until Darrell set the
// numbers (2026-07-07, DR-0117): $2,000 minimum, 90 days same as cash ($500 to
// start, $500 at MVP, balance over the rest of the 90), then $150/mo support
// through the Feedback portal. Those figures render from client-engagements.js
// — one source of truth, never re-typed here. Larger builds quote UP from the
// minimum; that number stays the governor's hand.
// =============================================================================
import { BUILD_MINIMUM_CENTS, SUPPORT_MONTHLY_CENTS } from './client-engagements.js';

const dollars = (cents) => `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
export const BUILD_TERMS_LINE =
  `Your own branded app starts at ${dollars(BUILD_MINIMUM_CENTS)} — 90 days same as cash: $500 to start, $500 when your MVP is delivered, the balance over the rest of the 90 days. Then ${dollars(SUPPORT_MONTHLY_CENTS)}/mo keeps it supported through the Feedback portal.`;

// The family-of-businesses tab registry — Moore Divahs first, always.
export const DOOR_TABS = [
  { id: 'moore',    label: 'Moore Divahs', blurb: 'Custom clothing · scrub caps · custom shoes · sewing classes' },
  { id: 'practice', label: 'The Practice', blurb: 'TLC Therapy Solutions — faith-aware counseling and wellness' },
  { id: 'church',   label: 'The Church',   blurb: 'The Church of the Living God — Champaign-Urbana' },
  { id: 'poetech',  label: 'PoeTech',      blurb: 'The platform behind this app — built for families and businesses like yours' },
];

// The REAL subscriber tier ladder (source: entitlements.js order + the in-app
// ARPU model's monthly prices). Do not edit here without editing the source.
export const POETECH_TIERS = [
  { key: 'foundation',   label: 'Foundation',   monthly: 0,   blurb: 'Start free — the core tools, no card.' },
  { key: 'poetech-plus', label: 'PoeTech Plus', monthly: 39,  blurb: 'The full app for one household — books, projects, planning.' },
  { key: 'family',       label: 'Family',       monthly: 89,  blurb: 'The family suite — shared stewardship across the household.' },
  { key: 'premium',      label: 'Premium',      monthly: 149, blurb: 'Everything, plus the advanced planning + media surfaces.' },
  { key: 'business',     label: 'Business',     monthly: 249, blurb: 'Run a business on it — CRM, orders, inventory, KPIs.' },
];
export const TIER_ORDER = POETECH_TIERS.map((t) => t.key);

// Price-out needs — each maps honestly to the LOWEST tier that serves it.
export const PRICE_OUT_NEEDS = [
  { key: 'personal',  label: 'Personal money + planning basics', minTier: 'foundation' },
  { key: 'household', label: 'Full household books + projects',  minTier: 'poetech-plus' },
  { key: 'family',    label: 'Whole-family shared stewardship',  minTier: 'family' },
  { key: 'advanced',  label: 'Advanced forecasting + media',     minTier: 'premium' },
  { key: 'business',  label: 'Run my business (orders · CRM · inventory · KPIs)', minTier: 'business' },
  { key: 'branded',   label: 'My own branded app (like Moore Divahs)', minTier: 'business', customQuote: true },
];

// Pick the tier that covers every selected need; when a branded-app build is
// part of the ask, the note carries the REAL declared build terms (DR-0117).
export function priceOut(selectedKeys = []) {
  const picked = PRICE_OUT_NEEDS.filter((n) => selectedKeys.includes(n.key));
  if (!picked.length) return { tier: null, monthly: null, customQuote: false, note: 'Pick what you need — the price follows.' };
  let best = 0;
  for (const n of picked) best = Math.max(best, TIER_ORDER.indexOf(n.minTier));
  const tier = POETECH_TIERS[best];
  const customQuote = picked.some((n) => n.customQuote === true);
  return {
    tier: tier.key,
    label: tier.label,
    monthly: tier.monthly,
    customQuote,
    note: customQuote
      ? `${tier.label} covers the platform side ($${tier.monthly}/mo). ${BUILD_TERMS_LINE}`
      : `${tier.label} covers everything you picked — $${tier.monthly}/mo.`,
  };
}

// ---- View-as-customer — the door's reviewer lens (DR-0104 sibling) ----------
// The owner inspects her own app exactly as a customer meets it: updates,
// features, and what her users are experiencing. THE ONE LAW — STRICTLY
// NARROWING (same law as the main app's reviewer-mode): the lens can only HIDE
// steward privilege, never grant any. Someone forcing customerView=true with no
// steward role gets a strictly smaller view than they already had.
// my_business_role() + table RLS remain the real gates — this changes what the
// door RENDERS, not what the database allows.
export function doorView(role, customerView = false) {
  const stewardRole = role === 'owner' || role === 'admin';
  return {
    stewardRole,                                   // the REAL role — drives the toggle's visibility
    isSteward: stewardRole && !customerView,       // whether privileged UI renders
    customerView: stewardRole && customerView,     // the lens is ON (only meaningful for a real steward)
    authRole: stewardRole && customerView ? 'customer-view' : role, // what DoorAuth displays
  };
}

// The canonical customer share link — the her-name entry page (public/moore/
// index.html): QR codes, texted links, and social posts all point HERE so the
// preview reads Moore Divahs and the door opens installable under her name.
export const MOORE_SHARE_URL = 'https://poetech.us/moore';
export const MOORE_SHARE_URL_DISPLAY = 'poetech.us/moore';

// The union-attribution source every capture from this door carries — this is
// how "who came in from this union" shows up on the CRM + interest lists.
export const DOOR_SOURCE = 'moore-divahs-app';

// One-click reorder (Darrell 2026-07-07): a past order becomes the next
// inquiry's pre-filled note — editable before sending, and carrying the prior
// order reference so Shay knows exactly which piece "again" means.
export function buildReorderNote(order) {
  if (!order) return '';
  const what = (order.description || '').trim() || (order.product_type || 'my last piece');
  const ref = order.slug ? ` (prior order ${order.slug})` : '';
  return `Order this again: ${what}${ref}`;
}
