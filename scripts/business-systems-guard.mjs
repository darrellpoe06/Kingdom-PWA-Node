// =============================================================================
// business-systems-guard — deterministic "the business systems get COMPLETED" gate
// =============================================================================
// Declared by Darrell 2026-07-25: "comprehensive review and implementation plan
// and development of the systems that make sure we complete our business
// systems." The 2026-07-25 ways-review measured three recurring completion
// failures that only a human reading the repo ever caught — each is now a
// machine check that FAILS THE BUILD (Verification Doctrine, DR-0076: every
// "looked-fine-but-wasn't" class becomes a gate):
//
//   1. DECISIONS-LEDGER DRIFT. docs/decisions/INDEX.md is "the single source
//      of truth for what is decided" — yet its Next-ID pointer went stale and
//      DR files landed with no INDEX row TWICE in one week (0189-0218 backfill
//      closed 2026-07-23; DR-0234 + a stale pointer re-opened it by 07-25).
//      A drifted ledger silently un-decides decided work.
//   2. RETIRED-TRANSPORT SPREAD. DR-0218 retired n8n ("zero n8n — historical
//      warning only, never forward guidance"), but `/n8n/webhook` references
//      keep riding along in shipped app code (the TLC revenue surface's
//      practice-growth call is pinned there BY A TEST). The legacy set is
//      allowlisted exactly; ANY NEW file that reaches for the retired
//      transport turns the build red.
//   3. VENDOR FORM ENDPOINTS. The landing waitlist posts to formsubmit.co with
//      a personal Gmail hardcoded in the client bundle — third-party absolute
//      endpoints violate the same-origin sovereignty posture other surfaces
//      already gate (review-feed.test.js). The one existing occurrence is a
//      tracked exception (re-review in the 2026-07-25 plan); new ones fail.
//
// Pure functions exported for vitest (proven-to-catch in
// app/src/__tests__/business-systems-guard.test.js); CLI:
//   node scripts/business-systems-guard.mjs
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// -----------------------------------------------------------------------------
// 1. Decisions-ledger integrity.
// -----------------------------------------------------------------------------
// Per-DR files exist from DR-0050 onward (0001-0016 predate the ledger split,
// 0017-0049 live only as chain-table rows — the documented numbering-era
// artifact recorded in INDEX.md's 2026-07-23 audit).
export const DR_FILE_FLOOR = 50;

export function drIdsOnDisk(fileNames) {
  return fileNames
    .map((f) => /^DR-(\d{4})-/.exec(f))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

export function drLedgerFindings({ indexText, diskIds }) {
  const findings = [];
  for (const id of diskIds) {
    if (id < DR_FILE_FLOOR) continue;
    const tag = `DR-${String(id).padStart(4, '0')}`;
    if (!indexText.includes(`[${tag}]`)) {
      findings.push(`INDEX.md has no row for ${tag} — a decision file exists on disk that the ledger does not know.`);
    }
  }
  const max = diskIds.length ? diskIds[diskIds.length - 1] : 0;
  const m = /\*\*Next ID:\*\*\s*DR-(\d{4})/.exec(indexText);
  if (!m) {
    findings.push('INDEX.md is missing its "**Next ID:** DR-XXXX" pointer.');
  } else if (Number(m[1]) !== max + 1) {
    findings.push(`INDEX.md Next ID says DR-${m[1]} but the newest decision on disk is DR-${String(max).padStart(4, '0')} — the pointer must read DR-${String(max + 1).padStart(4, '0')}.`);
  }
  return findings;
}

// -----------------------------------------------------------------------------
// 2 + 3. Containment: a retired/foreign endpoint pattern may exist ONLY in its
// pinned legacy set. New files reaching for it fail the build.
// -----------------------------------------------------------------------------
// ZERO n8n in app SOURCE (DR-0218; Darrell 2026-07-30 "get rid of it now").
// Every app source file that referenced /n8n/webhook has been cut over or
// scrubbed — the last three live calls (thought, practice-growth, mark-noise)
// were retired to graceful degrades on 2026-07-30. The ONLY remaining allowed
// references are the TESTS that intentionally assert sovereignty / forbid n8n.
// Any n8n webhook reference in NON-TEST app source now FAILS the build. This
// list may only shrink to zero; growing it — or adding a source file — is
// forbidden.
export const N8N_ALLOWLIST = [
  'app/src/__tests__/conference-feedback-sovereign.test.jsx',
  'app/src/__tests__/nas-photos.test.js',
  'app/src/__tests__/review-feed.test.js',
];

// The one landing-page waitlist post (tracked exception; sovereign /waitlist
// replacement is the dated plan item). New vendor form endpoints are forbidden.
// EMPTY since 2026-07-30: the last vendor form (the formsubmit.co waitlist
// stopgap in the monolith) was rewired to the sovereign app_interest lane.
// Any vendor form endpoint appearing anywhere now FAILS this guard — the
// allowlist grows only with a recorded decision, never a drive-by.
export const VENDOR_FORM_ALLOWLIST = [];

export function containmentFindings({ label, files, allowlist }) {
  const allowed = new Set(allowlist);
  return files
    .filter((f) => !allowed.has(f))
    .map((f) => `${f}: NEW ${label} reference — this class is retired/contained (DR-0218 / sovereignty posture); route through the sovereign same-origin lane instead.`);
}

// -----------------------------------------------------------------------------
// Repo scan (CLI).
// -----------------------------------------------------------------------------
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === 'node_modules' || f === 'dist' || f.startsWith('.')) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs|ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

export function scanRepo() {
  const srcFiles = walk(join(ROOT, 'app/src'));
  const withPattern = (re) => srcFiles
    .filter((p) => re.test(readFileSync(p, 'utf8')))
    .map((p) => relative(ROOT, p).replaceAll('\\', '/'))
    .sort();
  const indexText = readFileSync(join(ROOT, 'docs/decisions/INDEX.md'), 'utf8');
  const diskIds = drIdsOnDisk(readdirSync(join(ROOT, 'docs/decisions')));
  return {
    indexText,
    diskIds,
    n8nFiles: withPattern(/\/n8n\/webhook/),
    vendorFormFiles: withPattern(/formsubmit\.co|formspree\.io/),
  };
}

export function allFindings(scan) {
  return [
    ...drLedgerFindings(scan),
    ...containmentFindings({ label: 'retired n8n transport', files: scan.n8nFiles, allowlist: N8N_ALLOWLIST }),
    ...containmentFindings({ label: 'vendor form endpoint', files: scan.vendorFormFiles, allowlist: VENDOR_FORM_ALLOWLIST }),
  ];
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const scan = scanRepo();
  const findings = allFindings(scan);
  if (findings.length) {
    console.error('business-systems-guard: FAIL');
    for (const f of findings) console.error('  - ' + f);
    process.exit(1);
  }
  console.log(`business-systems-guard: OK — ledger whole (newest DR-${String(scan.diskIds[scan.diskIds.length - 1]).padStart(4, '0')}, pointer correct), n8n contained to ${scan.n8nFiles.length} legacy files, vendor forms contained to ${scan.vendorFormFiles.length}.`);
}
