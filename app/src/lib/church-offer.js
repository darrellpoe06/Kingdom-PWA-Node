// =============================================================================
// church-offer — the church price and the options above it, as the page says
// them (DR-1144; the numbers are DR-1128's)
// =============================================================================
// Darrell, 2026-10-20, from the Paid tiers page: "I need the prices for church
// and other options like surveillance..."
//
// ONE SOURCE. The church price on the page is CHURCH_FLOOR_CENTS from the
// cost-to-serve model (DR-1128): $200 a month at least, the higher of $200 and
// the whole cost to serve. Nothing here invents a second number for it.
//
// THE OPTIONS sit above the base and never inside it (DR-1128 §7): each is a
// fixed, written amount. Two carry a number here; the third is quoted up front
// by design (§4). Each says what it is, what the number rests on, and whether
// it can be had today — cameras cannot until they are proven on PoeTech's own
// (camera-health is that proof), and the card says so rather than selling it.
//
// Pure data; ChurchOffer.jsx renders it.
// =============================================================================
import { CHURCH_FLOOR_CENTS, dollars } from './church-cost-to-serve.js';

export const CHURCH_TIER = Object.freeze({
  name: 'Church · Supported',
  monthlyCents: CHURCH_FLOOR_CENTS,
  pricePrefix: 'from',
  tagline: 'One flat price for the whole church · no contract · 0% of giving',
  bestFor: 'a church that wants its instance run and supported: the same price for 50 members or 2,000.',
  replaces: 'A Pushpay-class platform fee (about $200/mo on a multi-year auto-renewing contract, plus 2.1–2.9% + $0.20–0.30 on every gift). PoeTech takes 0%: gifts move through the church\'s own channels and its own processor account.',
  includes: Object.freeze([
    'The giving book and annual contribution statements',
    'Order of Service and the team views',
    'The 23 ministries, Bus / Van included',
    'Team Docs and records',
    'The Living Lessons catalog for every age',
    'A hosted, backed-up instance, run and supported by PoeTech',
  ]),
  terms: Object.freeze([
    'No contract. Cancel any month. Export your records at any time.',
    'Free where PoeTech does no work: every member\'s Church tab, self-hosting, and the published catalog exactly as it is.',
    'A church that cannot pay is served through the Community tier when a sponsor pays for the time. Free to the church never means unpaid work.',
    'The price is the higher of $200 and the whole cost to serve, worked out before the offer. We never come back for more because a cost was not foreseen.',
  ]),
});

export const CHURCH_OPTIONS = Object.freeze([
  Object.freeze({
    key: 'cameras',
    name: 'Cameras',
    priceCents: 1000,
    unit: 'a camera a month',
    available: false,
    availableWhen: 'offered once proven on PoeTech\'s own cameras (camera-health is the proof)',
    what: 'Recorded on PoeTech\'s own recorder with 30 days kept and no per-clip fee; the church (or a household) watches live and plays back from the app.',
    basis: 'Consumer cloud plans run about $3–10 a camera a month (Wyze, Arlo, Nest, Ring; 2026 prices). Ours is sovereign storage plus support time, set at the top of that range so each camera covers its own cost.',
    forWhom: Object.freeze(['church', 'household']),
  }),
  Object.freeze({
    key: 'ministers-lessons',
    name: 'The minister\'s own lessons',
    priceCents: 5000,
    unit: 'a month',
    available: true,
    availableWhen: '',
    what: 'Sermons and teachings brought into the church\'s own space as lessons for every age, reviewed before they publish.',
    basis: 'A standing workflow: the review time each month with the reserve, rounded to a clean number the way every quote is (DR-1128 §5).',
    forWhom: Object.freeze(['church']),
  }),
  Object.freeze({
    key: 'built-for-you',
    name: 'A workflow built for your church',
    priceCents: null,
    unit: 'quoted up front',
    available: true,
    availableWhen: '',
    what: 'Written down, scoped and priced before any work starts: what it does, who uses it, and the date it ships. When it ships it joins the base for every church.',
    basis: 'One fixed price agreed up front, never "whatever it takes" (DR-1128 §4); the quote comes from the cost-to-serve screen.',
    forWhom: Object.freeze(['church']),
  }),
]);

/** "$10 a camera a month" / "quoted up front". */
export function optionPriceLabel(o) {
  if (!o || o.priceCents === null || o.priceCents === undefined) return (o && o.unit) || '';
  return `${dollars(o.priceCents).replace(/\.00$/, '')} ${o.unit}`;
}

/** "$200" for the card, from the one source. */
export const churchMonthlyDollars = () => String(CHURCH_TIER.monthlyCents / 100);
