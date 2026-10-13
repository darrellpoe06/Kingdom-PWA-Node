#!/usr/bin/env node
// =============================================================================
// nearby-witness — the real answer for a real address, read from a runner (DR-0998)
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
import { nearbyAround, roundArea, milesText, OVERPASS, overpassQuery } from '../app/src/modules/properties/area.js';
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
// The runner names itself (Overpass's usage policy); a phone sends its own.
const UA = 'PoeTech nearby witness/1 (+https://poetech.us)';
// A runner can wait longer than a phone: the public servers answered their
// own 504s and timeouts on 2026-10-13, and a short patience here would hide
// a slow-but-honest answer behind "took too long".
const near = await nearbyAround({ lat: g.lat, lng: g.lng }, { userAgent: UA, timeoutMs: 60000 });
if (!near.ok) {
  console.error(`NEARBY FAILED: ${near.reason}`);
  // Map the space in this one run, so the next change is measured, not
  // guessed (2026-10-13: two runs answered 406 with and without an Accept
  // header; what differs between a runner and a phone is the User-Agent and
  // the verb).
  const q = overpassQuery({ lat: g.lat, lng: g.lng });
  const said = async (label, url, init) => {
    try {
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(30000) });
      const body = String(await r.text()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      console.error(`  probe ${label}: HTTP ${r.status}${r.ok ? ' (answered)' : `: ${body}`}`);
    } catch (e) { console.error(`  probe ${label}: ${e?.name || 'failed'}`); }
  };
  await said('POST, no User-Agent', OVERPASS, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` });
  await said('POST, browser-like headers', OVERPASS, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36', accept: '*/*' }, body: `data=${encodeURIComponent(q)}` });
  await said('GET ?data=, named', `${OVERPASS}?data=${encodeURIComponent(q)}`, { method: 'GET', headers: { 'user-agent': UA } });
  await said('GET ?data=, browser-like', `${OVERPASS}?data=${encodeURIComponent(q)}`, { method: 'GET', headers: { 'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36', accept: '*/*' } });
  process.exit(1);
}
console.log(`what is nearby (${near.lines.length}):`);
for (const l of near.lines) console.log(`  ${l.label} · ${milesText(l.miles)}`);
