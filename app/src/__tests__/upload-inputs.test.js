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

  // THE ONE DELIBERATE EXCEPTION (2026-09-08, DR-0339). The Properties picture
  // form carries a "Take a photo" input with capture="environment" so a
  // landlord or a 1099 worker walking a unit reaches the camera in one tap.
  // It is allowed ONLY because it stands BESIDE a plain picker in the same
  // form ("Choose from this phone": accept="image/*", multiple, no capture),
  // so no source is hidden — the harm this gate exists for cannot occur.
  // The pairing is checked structurally below, not merely allowlisted by name:
  // a file that carries capture with no sibling chooser still fails.
  const CAMERA_BESIDE_A_CHOOSER = Object.freeze({
    'modules/properties/DoorTabs.jsx': 'the walk-through camera button, beside "Choose from this phone" (DR-0339)',
  });

  it('no capture attribute on any file input anywhere in app/src, except a camera that stands beside a chooser', () => {
    // JSX attribute form only (capture=" / capture={) — object keys like
    // `capture: {...}` (ClientGrowth stage map, addEventListener options)
    // are unrelated and stay out of the net.
    const offenders = files
      .filter((f) => /\bcapture=["'{]/.test(readFileSync(f, 'utf8')))
      .map((f) => f.replace(`${srcRoot}/`, ''))
      .filter((f) => !CAMERA_BESIDE_A_CHOOSER[f]);
    expect(offenders).toEqual([]);
  });

  it('every allowed camera input has a plain image chooser beside it in the same file, and takes one shot', () => {
    for (const rel of Object.keys(CAMERA_BESIDE_A_CHOOSER)) {
      const src = readFileSync(join(srcRoot, rel), 'utf8');
      const inputs = [...src.matchAll(/<input\b[^>]*type="file"[^>]*>/gs)].map((m) => m[0]);
      const cameras = inputs.filter((t) => /\bcapture=/.test(t));
      const choosers = inputs.filter((t) => !/\bcapture=/.test(t) && /accept="image\/\*"/.test(t));
      expect(cameras.length, `${rel} is allowlisted but carries no capture input — drop it from the list`).toBeGreaterThan(0);
      expect(choosers.length, `${rel}: a camera with no plain chooser beside it hides the photo library`).toBeGreaterThan(0);
      for (const c of cameras) expect(c).not.toMatch(/\bmultiple\b/);   // a camera returns one shot
    }
  });
});
