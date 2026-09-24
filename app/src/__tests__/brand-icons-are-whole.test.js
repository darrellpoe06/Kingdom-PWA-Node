// =============================================================================
// The brand icons are WHOLE — the bottom of each mark is drawn, not blank
// =============================================================================
// Darrell 2026-09-24, on the About page's app cards: "I don't like that the
// logos are cut off half way... fix it...". Measured: the PoeTech, TLC and Poe
// Properties PNGs had their lower part painted flat white. scripts/gen-icons.mjs
// screenshotted with Chrome's CLI --window-size, which counts the browser frame,
// so the page viewport was shorter than the icon and the rest came out blank.
// Its only check was the PNG's pixel SIZE, which a half-drawn icon passes.
//
// This reads every generated PNG (a small inflate + unfilter, no image
// dependency) and fails when the bottom band is mostly EMPTY: fully transparent
// or flat white, the exact signature of the cut-off render (measured: the
// broken RGBA icons were transparent below the cut; a real rounded mark is
// transparent only at its corners). Proven to catch on the broken files before
// they were regenerated.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8; let w = 0; let h = 0; let depth = 0; let ctype = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  if (depth !== 8 || (ctype !== 6 && ctype !== 2)) throw new Error(`unsupported PNG (depth ${depth}, type ${ctype})`);
  const bpp = ctype === 6 ? 4 : 3; const stride = w * bpp;
  const raw = inflateSync(Buffer.concat(idat)); const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)]; const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0; const b = y ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, px };
}

// Share of the bottom band (rows 80%-95%, above the rounded corners' curve
// band) that is EMPTY: fully transparent, or opaque pure white.
export function bottomEmptyShare({ w, h, bpp, px }) {
  let empty = 0; let total = 0;
  for (let y = Math.floor(h * 0.8); y < Math.floor(h * 0.95); y++) {
    for (let x = Math.floor(w * 0.15); x < Math.ceil(w * 0.85); x++) {
      const i = (y * w + x) * bpp; total++;
      const transparent = bpp === 4 && px[i + 3] === 0;
      const white = (bpp === 3 || px[i + 3] === 255) && px[i] === 255 && px[i + 1] === 255 && px[i + 2] === 255;
      if (transparent || white) empty++;
    }
  }
  return empty / total;
}

const ICONS = readdirSync(PUBLIC).filter((f) => /(icon|apple-touch).*\.png$/.test(f));

describe('every brand icon is drawn to its bottom edge', () => {
  it('finds the icon set', () => { expect(ICONS.length).toBeGreaterThanOrEqual(15); });
  for (const f of ICONS) {
    it(`${f} is not cut off (its bottom band is drawn)`, () => {
      const share = bottomEmptyShare(decodePng(readFileSync(join(PUBLIC, f))));
      expect(share, `${f}: ${(share * 100).toFixed(0)}% of the bottom band is empty — the render stopped short`).toBeLessThan(0.5);
    });
  }
});
