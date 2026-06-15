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
import {
  generateCharterYml,
  CHARTER_MD_REL,
  CHARTER_YML_REL,
} from '../../../scripts/generate-charter.mjs';

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

// =============================================================================
// Charter generation gate (DR-0075 / DR-0076).
// =============================================================================
// CHARTER.md is the single human-approved source of truth; charter.yml is the
// machine config GENERATED from it (npm run charter:gen). Both files live INSIDE
// the bundle, so the manifest above already catches a silent edit to either one.
// This gate catches the OTHER drift the hash check cannot: CHARTER.md edited and
// re-stamped, but charter.yml never regenerated — leaving the config inconsistent
// with the policy it claims to encode. It re-runs the generator and fails if the
// committed charter.yml is not exactly what CHARTER.md produces. Source and
// config can never silently disagree.
const REGEN = 'node scripts/generate-charter.mjs (npm run charter:gen)';
const charterMd = readFileSync(join(repoRoot, CHARTER_MD_REL), 'utf8');
const committedYml = readFileSync(join(repoRoot, CHARTER_YML_REL), 'utf8');

describe('charter.yml is generated from CHARTER.md (no source↔config drift)', () => {
  it('committed charter.yml matches a fresh generation from CHARTER.md', () => {
    expect(
      generateCharterYml(charterMd),
      `charter.yml drifted from CHARTER.md — regenerate: ${REGEN}`,
    ).toBe(committedYml);
  });

  it('the generator actually discriminates — a changed source yields a changed config (proven-to-catch)', () => {
    // Anti-theater (DR-0076): a gate that always passes is itself a lie. Mutate a
    // real policy value in the source and prove the generator's output changes —
    // so a green check above genuinely means source and config agree.
    const mutated = charterMd.replace('per_task_usd: 2', 'per_task_usd: 7');
    expect(mutated).not.toBe(charterMd); // the anchor must exist, or the proof is hollow
    expect(generateCharterYml(mutated)).not.toBe(committedYml);
  });

  it('safety: generated config keeps self_drive_implemented false (ships inert)', () => {
    // The supervisor honors charter.yml self_drive_implemented as a hard gate
    // above the ARM flag. Generation must never flip it true.
    expect(committedYml).toMatch(/^\s*self_drive_implemented:\s*false\s*$/m);
  });
});
