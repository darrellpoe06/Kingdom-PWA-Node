// =============================================================================
// course-band-baseline-write — regenerate the course-band numbers from the
// real catalog, never by hand (DR-0691)
// =============================================================================
// Five sessions author bands in parallel, and every one of them lowers the
// same totals in app/src/lib/course-band-coverage-baseline.json. Hand-merging
// those numbers after `git merge origin/main` is how a wrong number ships. This
// script re-measures instead:
//
//   cd app && npx vite-node ../scripts/course-band-baseline-write.mjs
//
//   - the baseline is rebuilt from a fresh scan (its running note is kept);
//   - course-band-four-allowlist.json is SHRUNK: every pinned lesson that now
//     carries all four bands leaves it. Nothing is ever added — a lesson
//     missing a band that is not already pinned is a failure, not debt, and
//     this script prints it and exits 1 rather than excusing it.
//
// `--check` writes nothing and exits 1 if either file differs from what it
// would write.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEARN_CATALOG } from '../app/src/lib/learn-catalog.js';
import { LIVING_LESSONS_MODULES } from '../app/src/lib/living-lessons-class.js';
import {
  scanCourseBands, buildCourseBandBaseline, loadFourBandAllowlist, ratchetFourBands,
  shrinkFourBandAllowlist, serializeFourBandAllowlist, FOUR_BAND_ALLOWLIST_PATH,
} from './course-band-coverage.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, '..', 'app', 'src', 'lib', 'course-band-coverage-baseline.json');
const check = process.argv.includes('--check');

const owned = new Set(LIVING_LESSONS_MODULES.map((m) => m.id));
const scan = scanCourseBands(LEARN_CATALOG, owned);
const oldBaseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const allowlist = loadFourBandAllowlist();

const { fresh } = ratchetFourBands(scan, allowlist);
if (fresh.length) {
  console.error(`Not excusable — these lessons must carry all four bands:\n${fresh.join('\n')}`);
  process.exit(1);
}

const baseline = { ...buildCourseBandBaseline(scan), note: oldBaseline.note };
const baselineText = `${JSON.stringify(baseline, null, 2)}\n`;
const allowText = serializeFourBandAllowlist(shrinkFourBandAllowlist(scan, allowlist), allowlist.note);

const oldBaselineText = readFileSync(BASELINE, 'utf8');
const oldAllowText = readFileSync(FOUR_BAND_ALLOWLIST_PATH, 'utf8');
if (check) {
  const stale = [];
  if (oldBaselineText !== baselineText) stale.push(BASELINE);
  if (oldAllowText !== allowText) stale.push(FOUR_BAND_ALLOWLIST_PATH);
  if (stale.length) { console.error(`stale: ${stale.join(', ')}`); process.exit(1); }
  console.log('course-band baseline and allowlist are current');
} else {
  writeFileSync(BASELINE, baselineText);
  writeFileSync(FOUR_BAND_ALLOWLIST_PATH, allowText);
  const pinned = Object.values(shrinkFourBandAllowlist(scan, allowlist)).reduce((t, l) => t + l.length, 0);
  console.log(`total ${scan.total}  allFour ${scan.allFour}  adultOnly ${scan.adultOnly}  still pinned ${pinned}`);
}
