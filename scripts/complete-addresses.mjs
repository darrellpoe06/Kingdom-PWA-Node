#!/usr/bin/env node
// =============================================================================
// complete-addresses — the lane completes each door's address from evidence (DR-1207)
// =============================================================================
// Darrell, 2026-10-22: "fix the addresses to reflect the correct addresses and
// not the abbreviated addresses... Each asset should work end to end."
//
// The live rows were measured first (rentals-address-probe, run 39717503181):
// eight of thirteen doors held an incomplete address in the ONE record Poe
// Properties and Real Estate both read. This completes them the way
// place-doors places them: from a runner, through the same /geocode lookup the
// app trusts (Census, then OpenStreetMap), with the rules in
// app/src/modules/properties/complete-address.js (the house number, the street
// and the town must all be this door's), written through SQL that carries the
// same "[date] Edited — ..." trace the app's door edit path writes, and stamps
// updated_at so every device's merge takes the whole address (the app sets
// updated_at itself on every edit; there is no trigger to do it).
//
// Guarded twice: a statement is built only for a uuid and text with no dollar
// quote in it, and it changes a row only while that row still holds exactly
// what was read (a family edit in between wins; this does nothing).
//
// Pure where it can be: rowsFromJson / completeRows / updatesSql. The live
// lookups live only in main(). The trace names each door by its id and says
// what it did, never the address: this repository's run pages are public.
//
// Usage: node scripts/complete-addresses.mjs rows.json > updates.sql
//   rows.json: [{id, instance_id, address, unit, city, state, zip, display_name}, ...]
// =============================================================================
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { geocode } from '../app/functions/geocode.js';
import { wantsCompleting, familyTowns, questionsFor, completion } from '../app/src/modules/properties/complete-address.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Bounded, never a loop: at most this many lookups a run, one a second and a bit.
export const MAX_LOOKUPS = 30;
export const GAP_MS = 1100;

/** The rows the database handed over, kept only when they are doors. */
export function rowsFromJson(text) {
  let v;
  try { v = JSON.parse(String(text || '[]')); } catch { return []; }
  if (!Array.isArray(v)) return [];
  const s = (x) => String(x == null ? '' : x).trim();
  return v.filter((d) => d && UUID.test(s(d.id))).map((d) => ({
    id: s(d.id).toLowerCase(), instance_id: s(d.instance_id), address: s(d.address), unit: s(d.unit),
    city: s(d.city), state: s(d.state), zip: s(d.zip), display_name: s(d.display_name),
  }));
}

/**
 * Ask, per door that wants completing, and decide. `find(q)` is the geocoder;
 * returns {results: [{id, ok, patch?, summary?, why?, asked}], looked}.
 */
export async function completeRows(rows, { find, wait = (ms) => new Promise((r) => setTimeout(r, ms)), max = MAX_LOOKUPS, gapMs = GAP_MS } = {}) {
  const results = [];
  let looked = 0;
  for (const row of rows || []) {
    if (!wantsCompleting(row)) continue;
    const towns = familyTowns((rows || []).filter((r) => r.instance_id === row.instance_id));
    const questions = questionsFor(row, towns);
    if (!questions.length) { results.push({ id: row.id, ok: false, why: 'no town to ask in', asked: 0 }); continue; }
    if (looked + questions.length > max) { results.push({ id: row.id, ok: false, why: 'left for the next run (the lookup budget is spent)', asked: 0 }); continue; }
    const answers = [];
    for (const qn of questions) {
      if (looked > 0) await wait(gapMs);
      looked += 1;
      let hit;
      try { hit = await find(qn.q); } catch (e) { hit = { ok: false, reason: String(e && e.message || e) }; }
      answers.push({ town: qn.town, state: qn.state, hit });
    }
    results.push({ id: row.id, asked: questions.length, ...completion(row, answers) });
  }
  return { results, looked };
}

const safe = (v) => !String(v).includes('$q$');
const lit = (v) => `$q$${v}$q$`;
const isNot = (col, v) => (v ? `${col} = ${lit(v)}` : `nullif(btrim(coalesce(${col}, '')), '') IS NULL`);

/** One guarded UPDATE per completed door, in the shape the app's edit path writes. */
export function updatesSql(rows, results, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const byId = new Map((rows || []).map((r) => [r.id, r]));
  const out = [];
  for (const res of results || []) {
    if (!res || !res.ok || !UUID.test(String(res.id || ''))) continue;
    const row = byId.get(res.id);
    if (!row) continue;
    const patch = res.patch || {};
    const cols = ['address', 'city', 'state', 'zip', 'display_name'].filter((k) => typeof patch[k] === 'string' && patch[k].trim());
    if (!cols.length) continue;
    const note = `[${today}] Edited — ${String(res.summary || '').replace(/\s+/g, ' ').trim()} (automatic, by the lane)`;
    const values = [...cols.map((k) => patch[k]), note, row.address, row.city, row.zip];
    if (!values.every(safe)) continue;
    const set = cols.map((k) => `${k} = ${lit(patch[k].trim())}`).join(', ');
    out.push(
      `UPDATE public.rentals SET ${set}, updated_at = now(), `
      + `notes = btrim(concat_ws(E'\\n', nullif(btrim(coalesce(notes, '')), ''), ${lit(note)})) `
      + `WHERE id = '${res.id}' AND ${isNot('address', row.address)} AND ${isNot('city', row.city)} AND ${isNot('zip', row.zip)};`,
    );
  }
  return out.length ? `${out.join('\n')}\n` : '';
}

async function main() {
  const file = process.argv[2];
  if (!file) { process.stderr.write('usage: complete-addresses.mjs rows.json > updates.sql\n'); process.exit(2); }
  const rows = rowsFromJson(readFileSync(file, 'utf8'));
  const find = async (q) => {
    const g = await geocode(q);
    return g.ok ? { ok: true, matched: g.matched, source: g.source, ...(g.parts ? { parts: g.parts } : {}) } : { ok: false, reason: g.reason };
  };
  const r = await completeRows(rows, { find });
  const done = r.results.filter((x) => x.ok).length;
  process.stderr.write(`complete-addresses: ${rows.length} door(s) read; ${r.results.length} wanted completing; ${r.looked} lookup(s); ${done} completed\n`);
  for (const x of r.results) {
    process.stderr.write(`  ${x.id.slice(0, 8)} -> ${x.ok ? `completed: ${Object.keys(x.patch).join(', ')}` : `left as it is: ${x.why}`} (${x.asked} question${x.asked === 1 ? '' : 's'})\n`);
  }
  process.stdout.write(updatesSql(rows, r.results));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { process.stderr.write(`complete-addresses: ${e && e.stack || e}\n`); process.exit(1); });
}
