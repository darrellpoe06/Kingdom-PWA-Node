// =============================================================================
// gen-icons — rasterize the brand SVG icons to the PNG sizes stores require
// =============================================================================
// The PWA manifest historically shipped SVG-only icons. That works in browsers,
// but the app STORES (Google Play via a TWA / PWABuilder, and Apple) require
// raster PNGs at fixed sizes, and iOS ignores SVG apple-touch-icons on some
// versions. This script produces the canonical PNG set from the existing SVGs
// so the source of truth stays the vector art — regenerate any time the brand
// mark changes (npm run icons).
//
// It drives the Chromium that Playwright pre-installs in this environment
// (/opt/pw-browsers) so it needs NO image-processing dependency (no sharp /
// canvas / imagemagick). Verify, don't claim: each output is asserted to be a
// PNG of the exact expected pixel dimensions before the script exits 0.
import { readdirSync, existsSync, mkdtempSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', 'app', 'public');

// The render list: [sourceSvg, outputPng, sizePx]. "any"-purpose icons come from
// the rounded-rect mark (transparent corners); maskable + apple come from the
// full-bleed mark so the platform's own mask/rounding never clips the glyph.
const TARGETS = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-192.png', 192],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
  // TLC Therapy Solutions — raster fallbacks so the TLC install carries real
  // PNGs like the other three brands (manifest-tlc had SVG-only icons; older
  // Android/Samsung installers are safest with 192/512 rasters).
  // Poe Properties (DR-0313) — the fifth installable face needs real rasters
  // like the other four (older Android/Samsung installers are safest with
  // 192/512 PNGs; iOS ignores SVG apple-touch-icons on some versions).
  ['properties-icon.svg', 'properties-icon-192.png', 192],
  ['properties-icon.svg', 'properties-icon-512.png', 512],
  ['properties-icon-maskable.svg', 'properties-icon-maskable-192.png', 192],
  ['properties-icon-maskable.svg', 'properties-icon-maskable-512.png', 512],
  ['properties-icon-maskable.svg', 'properties-apple-touch.png', 180],
  ['tlc-icon.svg', 'tlc-icon-192.png', 192],
  ['tlc-icon.svg', 'tlc-icon-512.png', 512],
  ['tlc-icon.svg', 'tlc-apple-touch.png', 180],
  // Moore Divahs — HER OWN mark (DR-0227; the 'awaits her asset' stall is
  // closed: the interim mark derives from her real brand record and swaps in
  // one file when supplied artwork lands).
  ['moore-icon.svg', 'moore-icon-192.png', 192],
  ['moore-icon.svg', 'moore-icon-512.png', 512],
  ['moore-icon-maskable.svg', 'moore-icon-maskable-192.png', 192],
  ['moore-icon-maskable.svg', 'moore-icon-maskable-512.png', 512],
  ['moore-icon-maskable.svg', 'moore-apple-touch.png', 180],
];

// Locate the pre-installed Chromium (Playwright layout under /opt/pw-browsers).
function findChrome() {
  const roots = ['/opt/pw-browsers'];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const d of readdirSync(root)) {
      if (!/^chromium(-|$)/.test(d)) continue;
      const p = join(root, d, 'chrome-linux', 'chrome');
      if (existsSync(p)) return p;
    }
  }
  throw new Error('Chromium not found under /opt/pw-browsers — is Playwright provisioned?');
}

// PNG magic + IHDR width/height (bytes 16..24) so we can assert real dimensions.
function pngSize(path) {
  const b = readFileSync(path);
  const isPng = b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (!isPng) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const chrome = findChrome();
const tmp = mkdtempSync(join(tmpdir(), 'poe-icons-'));
let failed = 0;

for (const [src, out, size] of TARGETS) {
  const srcPath = join(PUBLIC, src);
  if (!existsSync(srcPath)) { console.error(`MISS  ${src} (source not found)`); failed++; continue; }

  // Wrap the SVG in a zero-margin page sized exactly to the target so it renders
  // edge-to-edge at the requested pixel dimensions.
  const svg = readFileSync(srcPath, 'utf8');
  const html = `<!doctype html><meta charset="utf-8">`
    + `<style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}`
    + `svg{display:block;width:${size}px;height:${size}px}</style>${svg}`;
  const htmlPath = join(tmp, `${out}.html`);
  writeFileSync(htmlPath, html);
  const outPath = join(PUBLIC, out);

  execFileSync(chrome, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--screenshot=${outPath}`,
    `--window-size=${size},${size}`,
    '--default-background-color=00000000',
    `file://${htmlPath}`,
  ], { stdio: ['ignore', 'ignore', 'ignore'] });

  const dim = existsSync(outPath) ? pngSize(outPath) : null;
  if (!dim || dim.w !== size || dim.h !== size) {
    console.error(`FAIL  ${out} — expected ${size}x${size}, got ${dim ? `${dim.w}x${dim.h}` : 'no PNG'}`);
    failed++;
  } else {
    console.log(`ok    ${out}  ${dim.w}x${dim.h}  (${statSync(outPath).size} B)  <- ${src}`);
  }
}

if (failed) { console.error(`\n${failed} icon(s) failed to generate.`); process.exit(1); }
console.log(`\nAll ${TARGETS.length} icons generated into app/public/.`);
