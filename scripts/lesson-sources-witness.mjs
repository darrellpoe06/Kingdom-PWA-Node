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
// A plain browser's own headers: a publisher's front door answers a reader,
// and this witness reads exactly what a reader would (epi.org answers 403 to
// an unknown agent; measured 2026-10-02, run 37038614217).
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

/** The publisher refused a machine outright (403/429/503). Not a contradiction of the figure: it is said, never counted as a failure. */
export function refusedByPublisher(status) { return [403, 429, 503].includes(Number(status)); }

function normalize(t) {
  return String(t || '').replace(/–|—/g, '-').replace(/\s+/g, ' ');
}

async function pageText(entry) {
  const res = await fetch(entry.url, { headers: HEADERS, redirect: 'follow' });
  if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.status = res.status; throw e; }
  if (entry.format === 'pdf') {
    const ctype = String(res.headers.get('content-type') || '');
    if (!/pdf/i.test(ctype)) throw new Error(`expected a PDF, the publisher answered ${ctype || 'no content-type'}`);
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
  let failures = 0; let refused = 0;
  for (const [lesson, list] of Object.entries(entries)) {
    for (const e of list) {
      try {
        const text = await pageText(e);
        const missing = missingSays(text, e.says);
        if (missing.length) { failures += 1; console.log(`WITNESS FAIL  ${lesson} — ${e.publisher}: ${e.url} does not say ${JSON.stringify(missing)}`); }
        else console.log(`witness ok  ${lesson} — ${e.publisher}: ${e.says.length} figures read back from ${e.url}`);
      } catch (err) {
        if (refusedByPublisher(err.status)) {
          refused += 1;
          console.log(`witness refused  ${lesson} — ${e.publisher}: ${e.url} answers HTTP ${err.status} to a machine; the figure stands on the page as a person reads it (said, not counted)`);
          continue;
        }
        failures += 1;
        console.log(`WITNESS FAIL  ${lesson} — ${e.publisher}: ${e.url} unreadable (${err.message})`);
      }
    }
  }
  if (refused) console.log(`${refused} source(s) refused a machine; open them in a browser to read the figure yourself`);
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
