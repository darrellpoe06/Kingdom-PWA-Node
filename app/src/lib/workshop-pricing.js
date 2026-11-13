// =============================================================================
// workshop-pricing — what an in-person workshop seat is offered at, and why
// =============================================================================
// Darrell 2026-11-12: "an in-person paid workshop, costs varied on location and
// going rates for the area or type of knowledge etc... whatever works best for
// demand". So a seat's price has four named parts, each visible to the
// Governor who sets the final figure:
//   1. the KNOWLEDGE TYPE's day rate (the house's own policy, below);
//   2. the LOCATION's cost tier (rural .. major metro);
//   3. the FORMAT (half day, one day, two days);
//   4. DEMAND, measured from the last offering's fill (seats asked for over
//      seats held), clamped so a sell-out never doubles a price overnight.
// The figure this module returns is a RECOMMENDATION. The price that is
// charged is the one on the workshop_events row (migration 0323), which the
// server reads itself (functions/api/checkout.js) — never the client's number.
//
// The rates are OUR policy, anchored on the Academy's own ladder
// (cohort-programs.js: $1,000 for a three-week hands-on cycle, about $333 a
// week of in-person time). They are not a market survey; a market survey for
// a place belongs on the event row as its going-rate note, not in code.
//
// The Word's line holds here as in DR-1428: a spiritual department (the Love
// Corner's own, lesson-links.js) is never sold. Its workshop is 'offering', a
// free seat with an optional gift, and this module prices it at 0 and says so.
// This module reads no access model and locks nothing; it only prices.
// =============================================================================
import { LOVE_CORNER_DEPARTMENTS } from './lesson-links.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const num = (v, d) => (Number.isFinite(v) ? v : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The kinds of knowledge a workshop teaches, with a one-day seat rate in cents. */
export const KNOWLEDGE_TYPES = Object.freeze({
  trade: { label: 'Trade and hands-on', dayRateCents: 14900 },
  business: { label: 'Business and stewardship', dayRateCents: 19900 },
  technical: { label: 'Technical (A.I., data, infrastructure)', dayRateCents: 24900 },
  spiritual: { label: 'The Word (never sold; an offering)', dayRateCents: 0 },
});

/** Where the workshop is held: a cost-of-delivery multiplier by place tier. */
export const LOCATION_TIERS = Object.freeze({
  rural: { label: 'Rural or small town', factor: 0.8 },
  city: { label: 'City', factor: 1.0 },
  metro: { label: 'Metro', factor: 1.25 },
  'major-metro': { label: 'Major metro', factor: 1.5 },
});

/** How long the room is held. */
export const FORMATS = Object.freeze({
  'half-day': { label: 'Half day (3 hours)', factor: 0.6, hours: 3 },
  day: { label: 'One day (6 hours)', factor: 1.0, hours: 6 },
  'two-day': { label: 'Two days (12 hours)', factor: 1.8, hours: 12 },
});

/** Demand never moves a price more than this, either way. */
export const DEMAND_MIN = 0.85;
export const DEMAND_MAX = 1.3;

/** A department the Word owns: never sold (DR-1428's spiritual departments). Pure. */
export function isSpiritualDepartment(department) {
  return LOVE_CORNER_DEPARTMENTS.includes(String(department || '').trim());
}

/** Department -> knowledge type. A spiritual department is 'spiritual' whatever its name. */
export function knowledgeTypeFor(department) {
  if (isSpiritualDepartment(department)) return 'spiritual';
  const d = asStr(department).toLowerCase();
  if (/a\.i\.|data|infrastructure|development|software|mathematics/.test(d)) return 'technical';
  if (/real estate|business|project management|stock|banking|history|economics/.test(d)) return 'business';
  return 'trade';
}

/** Demand factor from the last offering: seats asked for over seats held, clamped. 1.0 when unknown. */
export function demandFactor({ requested, capacity } = {}) {
  const r = num(requested, NaN);
  const c = num(capacity, NaN);
  if (!(c > 0) || !(r >= 0)) return 1.0;
  return clamp(r / c, DEMAND_MIN, DEMAND_MAX);
}

/**
 * The recommended seat price, with every part named. Pure.
 * { cents, parts: { type, dayRateCents, location, locationFactor, format, formatFactor, demand }, offering }
 */
export function recommendSeatPrice({ department, knowledgeType, location = 'city', format = 'day', requested, capacity } = {}) {
  const type = KNOWLEDGE_TYPES[knowledgeType] ? knowledgeType : knowledgeTypeFor(department);
  const kt = KNOWLEDGE_TYPES[type];
  const loc = LOCATION_TIERS[location] || LOCATION_TIERS.city;
  const fmt = FORMATS[format] || FORMATS.day;
  const demand = demandFactor({ requested, capacity });
  const raw = kt.dayRateCents * loc.factor * fmt.factor * demand;
  // Rounded to the nearest $5 so a list reads cleanly.
  const cents = type === 'spiritual' ? 0 : Math.round(raw / 500) * 500;
  return {
    cents,
    offering: type === 'spiritual',
    parts: {
      type,
      typeLabel: kt.label,
      dayRateCents: kt.dayRateCents,
      location: LOCATION_TIERS[location] ? location : 'city',
      locationFactor: loc.factor,
      format: FORMATS[format] ? format : 'day',
      formatFactor: fmt.factor,
      hours: fmt.hours,
      demand: Math.round(demand * 100) / 100,
    },
  };
}

/** A sentence that says how the figure was reached, for the Governor's screen. Pure. */
export function explainPrice(rec) {
  if (!rec || !rec.parts) return '';
  const p = rec.parts;
  if (rec.offering) return 'The Word is never sold: this seat is an offering, free, with a gift welcome.';
  const dollars = (c) => (c / 100).toFixed(0);
  return `${p.typeLabel} at $${dollars(p.dayRateCents)} a day x ${p.locationFactor} (${LOCATION_TIERS[p.location].label}) x ${p.formatFactor} (${FORMATS[p.format].label}) x ${p.demand} demand = $${dollars(rec.cents)} a seat.`;
}
