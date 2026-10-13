#!/usr/bin/env node
// =============================================================================
// nearby-witness — the real answer for a real address, read from a runner (DR-0996)
// =============================================================================
// The cloud sandbox has no route to the Census geocoder or OpenStreetMap's
// Overpass API, so every unit test reads RECORDED answers. This reads the LIVE
// ones, the same way the family's app does when it places a door: the address
// is looked up (app/functions/geocode.js: Census, then OpenStreetMap), the
// match is checked to be THIS house (place-on-map.js matchesAddress), and what
// is nearby is asked around its own point (area.js nearbyAround).
//
// Prints the matched address, the rounded area the app would save, and every
// nearby line with its miles. Never prints the exact point. Exit 0 only when
// all three answered; 1 when any did not.
//
// Usage: node scripts/nearby-witness.mjs "805 North Prospect Avenue" Champaign Illinois
// =============================================================================
import { geocode } from '../app/functions/geocode.js';
import { nearbyAround, roundArea, milesText } from '../app/src/modules/properties/area.js';
import { matchesAddress } from '../app/src/modules/properties/place-on-map.js';

const [street, city = '', state = ''] = process.argv.slice(2);
if (!street) { console.error('usage: nearby-witness.mjs "<street>" <city> <state>'); process.exit(2); }
const query = [street, city, state].filter(Boolean).join(', ');

const g = await geocode(query);
if (!g.ok) { console.error(`LOOKUP FAILED for "${query}": ${g.reason}`); process.exit(1); }
console.log(`matched (${g.source}): ${g.matched}`);
if (!matchesAddress(g.matched, { address: street, city })) {
  console.error(`NOT THIS HOUSE: "${g.matched}" does not carry the house number and town of "${query}"; the app would save nothing.`);
  process.exit(1);
}
const area = roundArea(g.lat, g.lng);
console.log(`area the app saves (rounded): ${area.lat}, ${area.lng}`);
const near = await nearbyAround({ lat: g.lat, lng: g.lng });
if (!near.ok) { console.error(`NEARBY FAILED: ${near.reason}`); process.exit(1); }
console.log(`what is nearby (${near.lines.length}):`);
for (const l of near.lines) console.log(`  ${l.label} · ${milesText(l.miles)}`);
