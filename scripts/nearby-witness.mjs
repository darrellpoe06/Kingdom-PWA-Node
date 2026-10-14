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
import { nearbyAround, roundArea, milesText, OVERPASS, overpassGaveUp, NEARBY_KINDS } from '../app/src/modules/properties/area.js';
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
const near = await nearbyAround({ lat: g.lat, lng: g.lng }, { userAgent: UA, timeoutMs: 75000, serverTimeoutS: 60 });
if (!near.ok) {
  console.error(`NEARBY FAILED: ${near.reason}`);
  for (const t of near.tried || []) console.error(`  mirror ${new URL(t.endpoint).host}: ${t.reason}`);
  // ONE KIND AT A TIME (DR-1023). The whole query asks ten kinds in ten
  // radii at once; Danville timed out on it at 90 s of server patience on
  // both mirrors, four runs running (placer 38592341539, witness
  // 38593963107, placer 38597571793), while Champaign answers in seconds.
  // Which kind is the heavy one is not knowable from the whole; each is
  // asked alone here, timed, with the server's own remark, so the next
  // change is measured rather than guessed (DR-0076 §4).
  console.error('per kind (each alone, 25 s of server patience, first mirror):');
  for (const [kind, sel, miles] of NEARBY_KINDS) {
    const parts = sel.split(';').map((one) => `${one}(around:${Math.round(miles * 1609.344)},${g.lat.toFixed(6)},${g.lng.toFixed(6)});`);
    const q = `[out:json][timeout:25];(${parts.join('')});out center tags;`;
    const t0 = Date.now();
    try {
      const r = await fetch(OVERPASS, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA }, body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(45000) });
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (!r.ok) { console.error(`  ${kind.padEnd(9)} HTTP ${r.status} after ${secs} s`); continue; }
      const body = await r.json();
      const gaveUp = overpassGaveUp(body);
      const n = Array.isArray(body?.elements) ? body.elements.length : 0;
      console.error(`  ${kind.padEnd(9)} ${gaveUp ? `GAVE UP after ${secs} s: ${gaveUp}` : `${n} element(s) in ${secs} s (${miles} mi)`}`);
    } catch (e) {
      console.error(`  ${kind.padEnd(9)} ${e?.name === 'TimeoutError' ? 'no answer in 45 s' : (e?.name || 'failed')}`);
    }
  }
  process.exit(1);
}
console.log(`what is nearby (${near.lines.length}):`);
for (const l of near.lines) console.log(`  ${l.label} · ${milesText(l.miles)}`);
