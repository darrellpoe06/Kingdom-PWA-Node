// =============================================================================
// stamp-portable-manifest.mjs — (re)write the portable bundle's freshness manifest.
// =============================================================================
// Run this AFTER an intentional change to the portable bundle, OR after
// reconciling the bundle to a changed upstream (tracked) source:
//
//     node scripts/stamp-portable-manifest.mjs
//
// Re-stamping is the deliberate "the bundle is current and client-ready" act.
// The verify gate (app/src/__tests__/portable-bundle-fresh.test.js) fails until
// the manifest matches reality, so you cannot silently ship a stale bundle.
// See scripts/portable-manifest.mjs for what is tracked and why.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeBundleHashes, computeTrackHashes, BUNDLE_REL } from './portable-manifest.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const manifest = {
  _comment:
    'Freshness manifest for the portable orchestrator bundle. The verify gate ' +
    '(app/src/__tests__/portable-bundle-fresh.test.js) FAILS the build if the bundle ' +
    'drifts from these hashes or a tracked upstream source changes. After an ' +
    'INTENTIONAL bundle change -- or after reconciling the bundle to a changed ' +
    'upstream source -- re-stamp: node scripts/stamp-portable-manifest.mjs. ' +
    'Re-stamping IS the conscious "is the bundle still client-ready?" review ' +
    '(DR-0075 / DR-0076). Do not hand-edit.',
  algorithm: 'sha256',
  bundle: computeBundleHashes(repoRoot),
  tracks: computeTrackHashes(repoRoot),
};

const out = join(repoRoot, BUNDLE_REL, 'MANIFEST.json');
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(
  'stamped', out,
  '|', Object.keys(manifest.bundle).length, 'bundle files,',
  Object.keys(manifest.tracks).length, 'tracked sources',
);
