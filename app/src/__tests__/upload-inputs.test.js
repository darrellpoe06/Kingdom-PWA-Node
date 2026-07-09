// @vitest-environment node
// =============================================================================
// upload inputs — every file input offers ALL sources (gate, DR-0076)
// =============================================================================
// 2026-07-05: adding a receipt only offered the camera — no photo library, no
// files. Root cause: capture="environment" on the <input type="file">, which
// on phones FORCES the camera and hides every other source. Three surfaces
// carried it (receipts, Chef's Corner recipe OCR, Church Observation photos);
// one even promised "pick one from your photos" in its own copy while the
// attribute blocked exactly that.
//
// The gate: no file input in the app ships with a capture attribute. Plain
// accept="image/*" gives the OS chooser (Take Photo / Photo Library / Files)
// on both iOS and Android — the camera stays one tap away, nothing is hidden.
// If a surface ever genuinely needs forced live capture, that is a deliberate
// decision: record it and adjust this gate to allowlist that one input.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..');

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '__tests__' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.(jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

describe('file inputs never force camera-only', () => {
  const files = sourceFiles(srcRoot);

  it('scans the real source tree (sanity: the known upload surfaces are covered)', () => {
    const names = files.map((f) => f.split(/[\\/]/).pop()); // cross-platform: Windows uses '\\'
    for (const known of ['BooksTransactions.jsx', 'ChefCorner.jsx', 'ChurchObservation.jsx', 'Rentals.jsx']) {
      expect(names).toContain(known);
    }
  });

  it('no capture attribute on any file input anywhere in app/src', () => {
    // JSX attribute form only (capture=" / capture={) — object keys like
    // `capture: {...}` (ClientGrowth stage map, addEventListener options)
    // are unrelated and stay out of the net.
    const offenders = files
      .filter((f) => /\bcapture=["'{]/.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(`${srcRoot}/`, ''));
    expect(offenders).toEqual([]);
  });
});
