// =============================================================================
// test-census — the REAL size of the verification suite, measured from source
// =============================================================================
// The Quality & Throughput surface (DR-0089) shows how much verification stands
// behind every merge. The suite's pass/fail already surfaces live (the CI
// conclusion on the served SHA, via lib/github-ops.js) — but the suite's SIZE
// was recorded nowhere: any "3,862 tests" line would have been a painted number
// the moment it was typed (DR-0076: measure, don't claim).
//
// This census MEASURES it: it walks the actual test tree (app/src/__tests__)
// at build time and counts the files and the `it(` / `test(` call sites in the
// real source. Two honesty notes, carried into the artifact itself:
//   - `callSites` counts statically-written tests; parameterized suites
//     (`it.each` / `test.each`) expand at runtime, so the LIVE run count
//     (vitest's own total) is >= callSites. `eachSuites` counts those
//     expanders separately so the gap is explained, not hidden.
//   - pass/fail is NOT asserted here — that stays the live CI verdict.
//
// Importable (buildTestCensus) so vite.config bakes it into __TEST_CENSUS__;
// censusFromSources is the pure core so a vitest can prove the counting
// CATCHES (a fixture with a known census must count exactly). CLI:
//   node scripts/test-census.mjs
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = join(ROOT, 'app', 'src', '__tests__');

// A test call site: `it(` / `test(` (with optional .skip/.only/.fails/
// .concurrent/.todo modifiers) at a call boundary — not `fit(`, not `unit(`,
// not `visit(`. `.each` suites are counted separately (they expand at runtime).
const CALL_SITE = /(?:^|[^.\w$])(?:it|test)(?:\.(?:skip|only|fails|concurrent|todo))*\s*\(/g;
const EACH_SUITE = /(?:^|[^.\w$])(?:it|test)\.each\s*[(`]/g;

function countMatches(re, text) {
  let n = 0;
  re.lastIndex = 0;
  while (re.exec(text) !== null) n++;
  return n;
}

// Pure core: sources = [{ path, text }]. Exact and deterministic, so the census
// test can prove it catches (a known fixture must produce a known census).
export function censusFromSources(sources) {
  let callSites = 0;
  let eachSuites = 0;
  for (const s of sources || []) {
    callSites += countMatches(CALL_SITE, s.text || '');
    eachSuites += countMatches(EACH_SUITE, s.text || '');
  }
  return { files: (sources || []).length, callSites, eachSuites };
}

function collectTestFiles(dir, out = []) {
  let names = [];
  try { names = readdirSync(dir); } catch { return out; }
  for (const name of names) {
    const full = join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) collectTestFiles(full, out);
    else if (/\.test\.(js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

// Build-time entry. Best-effort: a missing tree degrades to an honest empty
// census (`ok:false`), never a crashed build.
export function buildTestCensus() {
  const files = collectTestFiles(TEST_DIR);
  if (!files.length) {
    return { ok: false, files: 0, callSites: 0, eachSuites: 0, source: 'app/src/__tests__' };
  }
  const sources = [];
  for (const f of files) {
    try { sources.push({ path: relative(ROOT, f), text: readFileSync(f, 'utf8') }); }
    catch { /* an unreadable file is simply not counted — the count stays real */ }
  }
  const census = censusFromSources(sources);
  return { ok: true, ...census, source: 'app/src/__tests__' };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const c = buildTestCensus();
  console.log(`test census (${c.source}):`);
  console.log(`  files:      ${c.files}`);
  console.log(`  call sites: ${c.callSites} (it/test)`);
  console.log(`  each-suites:${c.eachSuites} (expand to more tests at runtime)`);
}
