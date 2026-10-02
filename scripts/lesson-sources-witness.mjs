#!/usr/bin/env node
// =============================================================================
// lesson-sources-witness — every researched figure in a lesson is read back
// from its publisher's own page by a runner that can reach the web (DR-0750,
// DR-0100, DR-0076). Darrell 2026-10-02: "We are supposed to independently
// research those American policies". The NAS writer has no web, and the
// cloud sandbox cannot reach epi.org or bls.gov; a GitHub runner can.
//
// app/src/lib/lesson-sources.json: { <lesson id>: [ { publisher, title, url,
// read, says: [strings the page must contain], claim, format? } ] }.
// Exit 1 when any `says` string is missing from its page — the figure in the
// lesson no longer stands on its source and the lesson is corrected, not the
// check. `--selftest` proves the witness can fail: a fake entry that no page
// says must be refused.
// =============================================================================
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELFTEST = process.argv.includes('--selftest');
const FILE = fileURLToPath(new URL('../app/src/lib/lesson-sources.json', import.meta.url));
const UA = 'Mozilla/5.0 (compatible; PoeTech lesson-sources-witness; +https://poetech.us)';

function normalize(t) {
  return String(t || '').replace(/–|—/g, '-').replace(/\s+/g, ' ');
}

async function pageText(entry) {
  const res = await fetch(entry.url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (entry.format === 'pdf') {
    const buf = Buffer.from(await res.arrayBuffer());
    // pdftotext (poppler) on the runner; the text is read from stdin to stdout.
    return execFileSync('pdftotext', ['-layout', '-', '-'], { input: buf, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  }
  return (await res.text()).replace(/<[^>]+>/g, ' ');
}

export function missingSays(text, says) {
  const hay = normalize(text);
  return (says || []).filter((s) => !hay.includes(normalize(s)));
}

async function witness(entries) {
  let failures = 0;
  for (const [lesson, list] of Object.entries(entries)) {
    for (const e of list) {
      try {
        const text = await pageText(e);
        const missing = missingSays(text, e.says);
        if (missing.length) { failures += 1; console.log(`WITNESS FAIL  ${lesson} — ${e.publisher}: ${e.url} does not say ${JSON.stringify(missing)}`); }
        else console.log(`witness ok  ${lesson} — ${e.publisher}: ${e.says.length} figures read back from ${e.url}`);
      } catch (err) {
        failures += 1;
        console.log(`WITNESS FAIL  ${lesson} — ${e.publisher}: ${e.url} unreadable (${err.message})`);
      }
    }
  }
  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const entries = JSON.parse(readFileSync(FILE, 'utf8'));
  if (SELFTEST) {
    // Pure: a page that does not say the figure is refused; one that does passes.
    const bad = missingSays('productivity grew 50 percent', ['86.5', '31.7']);
    const good = missingSays('net productivity rose 86.5% while pay rose 31.7%', ['86.5', '31.7']);
    if (bad.length !== 2 || good.length !== 0) { console.log('SELFTEST FAIL: the witness cannot tell a missing figure from a present one'); process.exit(1); }
    console.log('selftest ok  the witness refuses a page that does not say the figure');
    process.exit(0);
  }
  const failures = await witness(entries);
  console.log(failures ? `${failures} source(s) failed the witness` : 'every researched figure read back from its source');
  process.exit(failures ? 1 : 0);
}
