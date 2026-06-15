// =============================================================================
// portable-manifest.mjs — single source of truth for the portable-bundle
// freshness gate (DR-0075 perpetual improvement / DR-0076 verification doctrine).
// =============================================================================
// The portable orchestrator bundle (infra/ai-orchestrator/portable/) is the
// copy-paste-to-a-new-NAS artifact Darrell hands to clients on demand. Standing
// requirement (2026-06-15): it must NOT silently drift from our processes — it
// has to stay client-ready. "I'll remember to update it" is exactly the promise
// that fails across sessions, so this makes staleness FAIL THE BUILD instead.
//
// Two consumers import this module so the hashing is computed ONE way:
//   - scripts/stamp-portable-manifest.mjs  — writes MANIFEST.json (re-stamp tool)
//   - app/src/__tests__/portable-bundle-fresh.test.js — the gate (runs in verify+CI)
//
// The gate fails when (a) any shipped bundle file changes without a re-stamp,
// (b) a new bundle file appears that the manifest doesn't cover, or (c) a tracked
// upstream source changes. Re-stamping (node scripts/stamp-portable-manifest.mjs)
// IS the conscious "is the bundle still client-ready?" review — not busywork.

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

// The bundle lives here, relative to the repo root.
export const BUNDLE_REL = 'infra/ai-orchestrator/portable';

// External repo files the bundle's content depends on. If one of these changes,
// the portable bundle may be stale and must be reviewed (then re-stamped). Keep
// this list SMALL and HIGH-SIGNAL — only files whose change genuinely means the
// portable skeleton should be looked at — so the gate stays meaningful, not noisy.
//   - the Cage README: the portable is explicitly "built on the Cage"; its
//     contract changing is a reason to re-check the portable's claims.
//   - guarded-action.sh: the Cage's brake-enforcement primitive that the
//     portable's brakes.sh mirrors conceptually.
// The canonical Charter (charter/CHARTER.md) and its generated charter.yml both
// live INSIDE the bundle, so they are already hash-tracked by computeBundleHashes
// below — a silent edit to either fails this gate. The remaining drift (CHARTER.md
// edited but charter.yml not regenerated) is caught by the generation gate in
// portable-bundle-fresh.test.js, which re-runs scripts/generate-charter.mjs and
// compares. So both files are gated; neither needs to be a TRACKS entry here.
export const TRACKS = [
  'infra/ai-orchestrator/README.md',
  'infra/ai-orchestrator/scripts/guarded-action.sh',
];

// Runtime / secret files that live UNDER the bundle dir but are not part of the
// shipped artifact. Mirror of infra/ai-orchestrator/portable/.gitignore, plus
// MANIFEST.json itself (a file cannot hash itself). Never hashed, never gated.
export function isRuntimeFile(relPosix) {
  return (
    relPosix === 'MANIFEST.json' ||
    relPosix === '.env' ||
    (relPosix.startsWith('events/') && relPosix.endsWith('.jsonl')) ||
    relPosix === 'state/ARMED' ||
    relPosix.startsWith('state/orchestrator.lock/') ||
    (relPosix.startsWith('state/spend-') && relPosix.endsWith('.txt'))
  );
}

function sha256(absPath) {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}

function walk(absDir, baseAbs, out) {
  for (const name of readdirSync(absDir).sort()) {
    const abs = join(absDir, name);
    if (statSync(abs).isDirectory()) { walk(abs, baseAbs, out); continue; }
    const relPosix = relative(baseAbs, abs).split(/[\\/]/).join('/');
    if (!isRuntimeFile(relPosix)) out[relPosix] = sha256(abs);
  }
}

// { 'README.md': '<sha256>', 'charter/charter.yml': '<sha256>', ... }
export function computeBundleHashes(repoRoot) {
  const out = {};
  const base = join(repoRoot, BUNDLE_REL);
  walk(base, base, out);
  return out;
}

// { 'infra/ai-orchestrator/README.md': '<sha256>', ... }
export function computeTrackHashes(repoRoot) {
  const out = {};
  for (const rel of TRACKS) out[rel] = sha256(join(repoRoot, rel));
  return out;
}
