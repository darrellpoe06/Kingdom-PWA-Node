// =============================================================================
// Portable orchestrator bundle — freshness gate (DR-0075 / DR-0076).
// =============================================================================
// The portable bundle (infra/ai-orchestrator/portable/) is the copy-paste
// client-handoff artifact. Standing requirement (Darrell, 2026-06-15): it must
// stay client-ready and never silently drift from our processes. This gate makes
// drift FAIL THE BUILD instead of relying on anyone remembering to update it.
//
// It fails when: a shipped bundle file changed without a re-stamp; a NEW bundle
// file appeared the manifest doesn't cover; or a tracked upstream source changed.
// The fix in every case is the deliberate review: reconcile the bundle, then
// `node scripts/stamp-portable-manifest.mjs`. Hashing logic is shared with the
// stamper via scripts/portable-manifest.mjs, so the gate and the stamp can't
// disagree by construction.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  computeBundleHashes,
  computeTrackHashes,
  BUNDLE_REL,
} from '../../../scripts/portable-manifest.mjs';

// Resolve the repo root by walking up until the bundle manifest is found. Robust
// whether vitest runs from app/ (npm run verify, CI) or the repo root. Avoids
// import.meta.url, which vitest does not expose as a file: URL.
function findRepoRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, BUNDLE_REL, 'MANIFEST.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`portable bundle MANIFEST.json not found upward from ${start}`);
}

const repoRoot = findRepoRoot(process.cwd());
const manifest = JSON.parse(
  readFileSync(join(repoRoot, BUNDLE_REL, 'MANIFEST.json'), 'utf8'),
);
const RESTAMP = 'node scripts/stamp-portable-manifest.mjs';

describe('portable orchestrator bundle freshness gate', () => {
  it('manifest is well-formed (sha256, non-empty bundle + tracks)', () => {
    expect(manifest.algorithm).toBe('sha256');
    expect(Object.keys(manifest.bundle).length).toBeGreaterThan(0);
    expect(Object.keys(manifest.tracks).length).toBeGreaterThan(0);
  });

  it('every shipped bundle file matches the manifest — no silent edits', () => {
    const actual = computeBundleHashes(repoRoot);
    for (const [file, hash] of Object.entries(manifest.bundle)) {
      expect(
        actual[file],
        `bundle file missing or changed: ${file} — reconcile, then re-stamp: ${RESTAMP}`,
      ).toBe(hash);
    }
  });

  it('no bundle file exists that the manifest does not cover', () => {
    const actual = computeBundleHashes(repoRoot);
    for (const file of Object.keys(actual)) {
      expect(
        manifest.bundle[file],
        `new bundle file not in manifest: ${file} — re-stamp: ${RESTAMP}`,
      ).toBeDefined();
    }
  });

  it('tracked upstream sources are unchanged — else review the bundle', () => {
    const actual = computeTrackHashes(repoRoot);
    for (const [file, hash] of Object.entries(manifest.tracks)) {
      expect(
        actual[file],
        `tracked source changed: ${file} — review the portable bundle against it, then re-stamp: ${RESTAMP}`,
      ).toBe(hash);
    }
    for (const file of Object.keys(actual)) {
      expect(
        manifest.tracks[file],
        `tracked source not in manifest: ${file} — re-stamp: ${RESTAMP}`,
      ).toBeDefined();
    }
  });
});
