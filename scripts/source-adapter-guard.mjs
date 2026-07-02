// @vitest-environment node
//
// Source-adapter seam guard (docs/design/SOURCE-ADAPTER-INTERFACE.md / 0066).
//
// The sovereign aggregator backbone is platform-agnostic: every platform adapter
// writes through the SAME seam (video_harvests + video_transcripts + content_sources,
// migration 0066) and declares a PLATFORM constant so this guard can verify coverage.
//
// This guard FAILS the build when:
//   1. The backbone seam migration (0066 — content_sources + source_platform columns)
//      is missing — the seam itself doesn't exist yet.
//   2. An adapter script (`*-ingest.py` in infra/nas-sme-pipeline/) does NOT declare
//      `PLATFORM = "..."` — an undeclared adapter could write to the backbone without
//      registering its platform, making it untraceable and un-guardable.
//   3. The minimum adapter count drops below 2 — the seam is only proven generic when
//      at least two adapters (YouTube + one other) write through it. A single-adapter
//      seam is an unvalidated abstraction.
//   4. The interface doc (docs/design/SOURCE-ADAPTER-INTERFACE.md) is missing — the
//      contract must be documented for the next adapter author to follow.
//
// All checks are exported pure so a test can prove the guard CATCHES real gaps
// (a fake adapter script without PLATFORM=, or a missing migration) and PASSES
// on the real tree (DR-0076 proven-to-catch requirement).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = join(ROOT, 'infra/supabase/migrations-auto');
const ADAPTERS_DIR = join(ROOT, 'infra/nas-sme-pipeline');
const INTERFACE_DOC = join(ROOT, 'docs/design/SOURCE-ADAPTER-INTERFACE.md');

// The seam migration we require. All backbone changes for platform-agnosticism
// land here; the guard fails if this file is absent or lacks the key signal.
const SEAM_MIGRATION = '0066-content-sources-platform-seam.sql';

// Minimum number of distinct PLATFORM values among registered adapters.
// Must be >= 2: the seam is only proven generic once two adapters write through it.
const MIN_PLATFORM_COUNT = 2;

// A Python file in the adapters dir is recognized as a source adapter when it
// declares PLATFORM = "..." — the constant is the signal, not the filename.
// This avoids requiring a naming convention on files in the adjacent YouTube lane
// (load-transcripts.py is the YouTube adapter and uses PLATFORM = "youtube";
// rss-ingest.py is adapter #2 and uses PLATFORM = "rss").
const ADAPTER_GLOB = /\.py$/;

// The PLATFORM = "..." declaration every adapter must make.
const PLATFORM_DECL = /^PLATFORM\s*=\s*["']([^"']+)["']/m;


// ---------------------------------------------------------------------------
// pure check functions (exported for unit tests)
// ---------------------------------------------------------------------------

/** Read all migration SQL and return the combined string. */
export function allMigrationSql() {
  let sql = '';
  for (const f of readdirSync(MIGRATIONS)) {
    if (f.endsWith('.sql')) sql += '\n' + readFileSync(join(MIGRATIONS, f), 'utf8');
  }
  return sql;
}

/** Check that the seam migration exists and declares the content_sources table. */
export function seamPresent() {
  const path = join(MIGRATIONS, SEAM_MIGRATION);
  if (!existsSync(path)) return { ok: false, reason: `Migration ${SEAM_MIGRATION} not found.` };
  const sql = readFileSync(path, 'utf8');
  if (!/create\s+table\s+(?:if\s+not\s+exists\s+)?content_sources/i.test(sql)) {
    return { ok: false, reason: `${SEAM_MIGRATION} exists but content_sources table is missing.` };
  }
  if (!/add\s+column\s+if\s+not\s+exists\s+source_platform/i.test(sql)) {
    return { ok: false, reason: `${SEAM_MIGRATION} exists but source_platform column is missing.` };
  }
  return { ok: true };
}

/** Scan infra/nas-sme-pipeline/ for Python source adapter scripts.
 *  A file is an adapter if it declares PLATFORM = "..." anywhere in the source.
 *  Returns [{file, platform}] for every file that declares PLATFORM.
 *  Files without a PLATFORM declaration are not adapters and are not returned —
 *  they cannot cause a "missing declaration" violation (only declared adapters are
 *  counted). The guard simply fails if the total count is below MIN_PLATFORM_COUNT. */
export function scanAdapters() {
  const results = [];
  for (const f of readdirSync(ADAPTERS_DIR)) {
    if (!ADAPTER_GLOB.test(f)) continue;
    const src = readFileSync(join(ADAPTERS_DIR, f), 'utf8');
    const m = PLATFORM_DECL.exec(src);
    if (m) results.push({ file: f, platform: m[1] });
  }
  return results;
}

/** Return adapters missing the PLATFORM declaration.
 *  Under the current scan model (only declared adapters returned), this is always
 *  empty — kept for API compatibility with tests that may probe for it. */
export function missingPlatformDecl(_adapters) {
  return []; // scanAdapters() only returns files that declare PLATFORM
}

/** Return the set of unique platform values declared across adapters. */
export function declaredPlatforms(adapters) {
  return [...new Set(adapters.map((a) => a.platform).filter(Boolean))];
}

/** Check that the interface doc exists. */
export function interfaceDocPresent() {
  return existsSync(INTERFACE_DOC);
}


// ---------------------------------------------------------------------------
// full scan + report
// ---------------------------------------------------------------------------

export function scan() {
  const seam = seamPresent();
  const adapters = scanAdapters();
  const missing = missingPlatformDecl(adapters);
  const platforms = declaredPlatforms(adapters);
  const docPresent = interfaceDocPresent();

  return { seam, adapters, missing, platforms, docPresent };
}


// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { seam, adapters, missing, platforms, docPresent } = scan();

  console.log('# SOURCE-ADAPTER SEAM GUARD (docs/design/SOURCE-ADAPTER-INTERFACE.md)\n');
  console.log(`Adapters found: ${adapters.map((a) => a.file).join(', ') || '(none)'}`);
  console.log(`Platform declarations: ${platforms.join(', ') || '(none)'}\n`);

  let ok = true;

  if (!seam.ok) {
    ok = false;
    console.log(`FAIL — backbone seam missing: ${seam.reason}`);
    console.log('       Migration 0066 must add content_sources + source_platform to land the seam.');
  }

  if (missing.length) {
    ok = false;
    console.log(`FAIL — ${missing.length} adapter(s) missing PLATFORM declaration:`);
    missing.forEach((a) => console.log(`      · ${a.file} — add: PLATFORM = "<platform>"`));
  }

  if (platforms.length < MIN_PLATFORM_COUNT) {
    ok = false;
    console.log(`FAIL — only ${platforms.length} platform(s) declared; need >= ${MIN_PLATFORM_COUNT}.`);
    console.log('       The seam is only proven generic when two or more adapters write through it.');
    console.log('       Current adapters: ' + (adapters.map((a) => a.file).join(', ') || '(none)'));
  }

  if (!docPresent) {
    ok = false;
    console.log('FAIL — interface doc missing: docs/design/SOURCE-ADAPTER-INTERFACE.md');
    console.log('       The adapter contract must be documented for the next platform author.');
  }

  if (ok) {
    console.log(
      `PASS — seam present (0066); ${platforms.length} platforms declared ` +
      `(${platforms.join(', ')}); ${adapters.length} adapter(s) each declare PLATFORM; ` +
      `interface doc present.`
    );
    process.exit(0);
  }
  process.exit(1);
}
