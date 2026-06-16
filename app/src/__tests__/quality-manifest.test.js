// Proven-to-catch gate for the in-app Quality / Proof manifest (DR-0076 #3).
// The panel's whole value is that every gate/loop row points at a REAL file. If
// a referenced test or guard script is deleted/renamed, the manifest marks that
// row unverified and this test FAILS the build -- the panel can never silently
// list a check whose file no longer exists. It also confirms the panel is fed
// real, non-empty data and a real WCAG measurement, and that the UI/UX review
// registry parses to real records.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildQualityManifest } from '../../../scripts/quality-manifest.mjs';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const m = buildQualityManifest();

describe('quality manifest — real, non-empty, file-verified', () => {
  it('assembles ok', () => {
    expect(m.ok).toBe(true);
  });

  it('lists adversarial gates AND closed-loop tests', () => {
    expect(m.gates.length).toBeGreaterThanOrEqual(5);
    expect(m.loops.length).toBeGreaterThanOrEqual(5);
  });

  // The proven-to-catch heart: every row's referenced file must exist on disk.
  it('every gate is file-verified (delete a guard/test and this fails)', () => {
    const broken = m.gates.filter((g) => !g.verified);
    expect(broken, `unverified gates: ${broken.map((g) => g.id).join(', ')}`).toEqual([]);
  });

  it('every closed-loop test file exists (delete a loop test and this fails)', () => {
    const broken = m.loops.filter((l) => !l.verified);
    expect(broken, `unverified loops: ${broken.map((l) => l.id).join(', ')}`).toEqual([]);
    // Belt-and-braces: independently confirm the path resolves from the repo root.
    for (const l of m.loops) {
      expect(existsSync(join(REPO_ROOT, l.test)), `${l.id}: ${l.test} missing`).toBe(true);
    }
  });

  it('measures real WCAG contrast over the real themes', () => {
    expect(m.contrast.ok).toBe(true);
    expect(m.contrast.themeCount).toBeGreaterThanOrEqual(2);
    // We assert it was MEASURED, not that it passes — the contrast-guard test
    // owns the pass assertion. But a violation must carry numbers, never a vibe.
    for (const v of m.contrast.violations) {
      expect(v.ratio != null || v.error != null).toBe(true);
    }
  });

  it('reads the real CI floor from ci.yml', () => {
    expect(m.ci.exists).toBe(true);
    expect(m.ci.steps.length).toBeGreaterThanOrEqual(2);
  });
});

describe('UI/UX review registry — real records parse from REVIEWS.md', () => {
  const reviewsPath = join(REPO_ROOT, 'docs/reviews/REVIEWS.md');
  it('the registry file exists', () => {
    expect(existsSync(reviewsPath)).toBe(true);
  });
  it('contains real REV- records with the required fields', () => {
    const raw = readFileSync(reviewsPath, 'utf8');
    const ids = raw.match(/^###\s+REV-\d+/gm) || [];
    expect(ids.length).toBeGreaterThanOrEqual(1);
    // Each record must carry a Status and a Source (no source -> not real).
    const statuses = raw.match(/\*\*Status:\*\*/g) || [];
    const sources = raw.match(/\*\*Source:\*\*/g) || [];
    expect(statuses.length).toBe(ids.length);
    expect(sources.length).toBe(ids.length);
  });
  it('every cited source path actually exists (no phantom citations)', () => {
    const raw = readFileSync(reviewsPath, 'utf8');
    const sources = [...raw.matchAll(/\*\*Source:\*\*\s*([^\n]+)/g)].map((x) => x[1].trim());
    for (const s of sources) {
      // Sources are repo-relative paths; each must resolve.
      expect(existsSync(join(REPO_ROOT, s)), `cited source missing: ${s}`).toBe(true);
    }
  });
});
