#!/usr/bin/env node
// =============================================================================
// complete-addresses — the lane completes each door's address from evidence (DR-1211)
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
import { execFileSync } from 'node:child_process';
import { lookup } from 'node:dns/promises';
import { wantsCompleting, questionsFor, completion, needsFromFamily, completionFromPages } from '../app/src/modules/properties/complete-address.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Bounded, never a loop: at most this many lookups a run, one a second and a bit.
export const MAX_LOOKUPS = 30;
export const GAP_MS = 1100;
// The second road (the research road and its source pages) is slower: a few doors a run.
export const MAX_RESEARCH = 4;
export const MAX_PAGES = 5;

/** The rows the database handed over, kept only when they are doors. */
export function rowsFromJson(text) {
  let v;
  try { v = JSON.parse(String(text || '[]')); } catch { return []; }
  if (!Array.isArray(v)) return [];
  const s = (x) => String(x == null ? '' : x).trim();
  return v.filter((d) => d && UUID.test(s(d.id))).map((d) => ({
    id: s(d.id).toLowerCase(), slug: s(d.slug), instance_id: s(d.instance_id), address: s(d.address), unit: s(d.unit),
    city: s(d.city), state: s(d.state), zip: s(d.zip), display_name: s(d.display_name), notes: String(d.notes || ''),
  }));
}

/**
 * Ask, per door that wants completing, and decide. `find(q)` is the geocoder;
 * returns {results: [{id, ok, patch?, summary?, why?, asked}], looked}.
 */
export async function completeRows(rows, { find, ask = null, readPage = null, wait = (ms) => new Promise((r) => setTimeout(r, ms)), max = MAX_LOOKUPS, gapMs = GAP_MS, maxResearch = MAX_RESEARCH, maxPages = MAX_PAGES } = {}) {
  const results = [];
  let looked = 0;
  let researched = 0;
  for (const row of rows || []) {
    if (!wantsCompleting(row)) continue;
    const questions = questionsFor(row);
    if (!questions.length) { results.push({ id: row.id, slug: row.slug, ok: false, why: `the family must name ${needsFromFamily(row) || 'the town'}`, asked: 0 }); continue; }
    if (looked + questions.length > max) { results.push({ id: row.id, ok: false, why: 'left for the next run (the lookup budget is spent)', asked: 0 }); continue; }
    const answers = [];
    for (const qn of questions) {
      if (looked > 0) await wait(gapMs);
      looked += 1;
      let hit;
      try { hit = await find(qn.q); } catch (e) { hit = { ok: false, reason: String(e && e.message || e) }; }
      answers.push({ town: qn.town, state: qn.state, hit });
    }
    let done = completion(row, answers);
    // THE SECOND ROAD (DR-1211): the map could not find this house, so the
    // research road is asked where it is, and its SOURCE PAGES are read by
    // the lane itself; only a page that shows this house in its own town
    // with a ZIP is evidence (completionFromPages).
    if (!done.ok && /could not find this house/.test(done.why || '') && ask && readPage && researched < maxResearch) {
      researched += 1;
      let urls = [];
      try { urls = (await ask(`What is the full mailing address, with the street type and the ZIP code, of ${questions[0].q}?`)) || []; } catch { urls = []; }
      const pages = [];
      for (const u of urls.slice(0, maxPages)) {
        try { const text = await readPage(u); if (text) pages.push({ url: u, text }); } catch { /* a page that cannot be read is no evidence */ }
      }
      const second = completionFromPages(row, pages);
      done = second.ok ? second : { ok: false, why: `${done.why}; the research road's ${pages.length} readable source page(s): ${second.why}` };
    }
    results.push({ id: row.id, slug: row.slug, town: questions[0].town, asked: questions.length, ...done });
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

// A page is read only from a PUBLIC address. The runner sits on the tailnet,
// so a source URL that points inside the house (a private, loopback,
// link-local or tailnet address) is refused before a byte is asked for, and
// every redirect is checked the same way. Bounded: 15 s and 2 MB a page.
const PRIVATE = [/^10\./, /^127\./, /^0\./, /^169\.254\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^f[cd]/i, /^fe80/i, /^::ffff:(10|127|192\.168|169\.254)\./i];
export function isPublicAddress(ip) {
  return Boolean(ip) && !PRIVATE.some((re) => re.test(String(ip)));
}
export async function publicUrl(u, resolve = (h) => lookup(h, { all: true })) {
  let url;
  try { url = new URL(u); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (/^(localhost|.*\.local|.*\.lan|.*\.internal|.*\.ts\.net)$/i.test(host)) return null;
  let addrs = [];
  try { addrs = await resolve(host); } catch { return null; }
  if (!addrs.length || !addrs.every((a) => isPublicAddress(a.address))) return null;
  return url;
}
async function readPublicPage(u) {
  let url = await publicUrl(u);
  for (let hop = 0; url && hop < 4; hop += 1) {
    const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'PoeTech address check/1 (+https://poetech.us)', accept: 'text/html,text/plain' }, signal: AbortSignal.timeout(15000) });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { url = await publicUrl(new URL(res.headers.get('location'), url).href); continue; }
    if (!res.ok || !/text\/(html|plain)/i.test(res.headers.get('content-type') || '')) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.subarray(0, 2 * 1024 * 1024).toString('utf8');
  }
  return '';
}
// The research road on the NAS (the same /ask research-inbox.yml uses), over
// the tailnet with the NAS key; only its source URLs are kept.
function askResearch(question) {
  const key = process.env.NAS_SSH_KEY_FILE;
  if (!key) return [];
  const py = [
    'import base64, json, os, sys, urllib.request',
    "p = '/volume1/PoeTech/secrets/chat-bridge-token.txt'",
    "tok = open(p).read().strip() if os.path.exists(p) else ''",
    "q = base64.b64decode(sys.argv[1]).decode()",
    "req = urllib.request.Request('http://127.0.0.1:8797/ask', method='POST', data=json.dumps({'query': q, 'mode': 'speed', 'sources': ['web']}).encode())",
    "req.add_header('Content-Type', 'application/json')",
    "req.add_header('Authorization', 'Bearer ' + tok)",
    "body = json.loads(urllib.request.urlopen(req, timeout=200).read().decode() or '{}')",
    "print(json.dumps([s.get('url', '') for s in body.get('sources', []) if isinstance(s, dict)]))",
  ].join('\n');
  const q64 = Buffer.from(String(question), 'utf8').toString('base64');
  try {
    const out = execFileSync('ssh', ['-i', key, '-o', 'StrictHostKeyChecking=accept-new', '-o', 'ConnectTimeout=20', '-o', 'BatchMode=yes', '-o', 'LogLevel=ERROR',
      process.env.NAS_HOST || 'dpoe@poetech.tail5a2f35.ts.net', `PATH=/usr/local/bin:/opt/bin:/usr/bin:/bin:$PATH python3 - ${q64}`], { input: py, timeout: 230000 }).toString();
    const urls = JSON.parse(out.trim().split('\n').pop() || '[]');
    return Array.isArray(urls) ? urls.filter((x) => typeof x === 'string' && /^https:\/\//i.test(x)) : [];
  } catch { return []; }
}

async function main() {
  const file = process.argv[2];
  if (!file) { process.stderr.write('usage: complete-addresses.mjs rows.json > updates.sql\n'); process.exit(2); }
  const rows = rowsFromJson(readFileSync(file, 'utf8'));
  const find = async (q) => {
    const g = await geocode(q);
    return g.ok ? { ok: true, matched: g.matched, source: g.source, ...(g.parts ? { parts: g.parts } : {}) } : { ok: false, reason: g.reason };
  };
  const r = await completeRows(rows, { find, ask: askResearch, readPage: readPublicPage });
  const done = r.results.filter((x) => x.ok).length;
  process.stderr.write(`complete-addresses: ${rows.length} door(s) read; ${r.results.length} wanted completing; ${r.looked} lookup(s); ${done} completed\n`);
  for (const x of r.results) {
    process.stderr.write(`  ${(x.slug || x.id).slice(0, 10)}${x.town ? ` [${x.town}]` : ''} -> ${x.ok ? `completed: ${Object.keys(x.patch).join(', ')}` : `left as it is: ${x.why}`} (${x.asked} question${x.asked === 1 ? '' : 's'})\n`);
  }
  process.stdout.write(updatesSql(rows, r.results));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { process.stderr.write(`complete-addresses: ${e && e.stack || e}\n`); process.exit(1); });
}
