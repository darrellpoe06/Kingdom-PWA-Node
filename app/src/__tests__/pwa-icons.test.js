// Proven-to-catch gate for the store-ready PNG icon set (DR-0076). The PWA
// manifest and index.html now reference raster PNG icons that Google Play (TWA /
// PWABuilder) and Apple require. Icons are generated from the brand SVGs by
// scripts/gen-icons.mjs (npm run icons). This test fails the build if any
// manifest-declared PNG is missing OR its real pixel dimensions don't match the
// declared `sizes` — so a stale/half-regenerated icon set can never ship.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', '..', 'public');
const manifest = JSON.parse(readFileSync(join(PUBLIC, 'manifest.webmanifest'), 'utf8'));

// Read a PNG's IHDR width/height (bytes 16..24 after the 8-byte signature).
function pngSize(path) {
  const b = readFileSync(path);
  const isPng = b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (!isPng) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const pngIcons = manifest.icons.filter((i) => i.type === 'image/png');
// The bare filename under /poetech-app/<file>.png -> app/public/<file>.png.
const localPath = (src) => join(PUBLIC, src.replace(/^\/poetech-app\//, ''));

describe('PWA icon set — store-ready PNGs exist at declared sizes', () => {
  it('the manifest declares PNG icons (any + maskable, 192 + 512)', () => {
    expect(pngIcons.length).toBeGreaterThanOrEqual(4);
    const has = (purpose, size) => pngIcons.some((i) => i.purpose === purpose && i.sizes === size);
    expect(has('any', '192x192')).toBe(true);
    expect(has('any', '512x512')).toBe(true);
    expect(has('maskable', '192x192')).toBe(true);
    expect(has('maskable', '512x512')).toBe(true);
  });

  it('every manifest PNG exists on disk at its declared pixel size', () => {
    for (const icon of pngIcons) {
      const p = localPath(icon.src);
      expect(existsSync(p), `missing icon file: ${icon.src} (run: npm run icons)`).toBe(true);
      const [w, h] = icon.sizes.split('x').map(Number);
      const dim = pngSize(p);
      expect(dim, `${icon.src} is not a valid PNG`).not.toBeNull();
      expect(dim.w, `${icon.src} width`).toBe(w);
      expect(dim.h, `${icon.src} height`).toBe(h);
    }
  });

  it('the apple-touch-icon PNG (referenced by index.html) exists at 180x180', () => {
    const p = join(PUBLIC, 'apple-touch-icon.png');
    expect(existsSync(p), 'apple-touch-icon.png missing (run: npm run icons)').toBe(true);
    expect(pngSize(p)).toEqual({ w: 180, h: 180 });
  });
});
