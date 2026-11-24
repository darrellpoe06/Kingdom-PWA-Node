// =============================================================================
// dhash — 64-bit difference hash of a picture, for "substantially similar"
// detection across the thumbnail library (Learn redesign spec §10)
// =============================================================================
// dHash: shrink to 9×8 greyscale, then one bit per pixel = "is it brighter
// than its right-hand neighbour". Robust to resizing, recompression and small
// colour shifts; different scenes land far apart. Compare with hamming():
//   0–5   the same picture (re-encoded / resized)
//   6–12  near-duplicate — send to a person
//   >12   different pictures
// =============================================================================
import { Buffer } from 'node:buffer';
import { setTimeout, clearTimeout } from 'node:timers';
import sharp from 'sharp';

export const NEAR_DUPLICATE_MAX = 12;

/** 16-hex-char (64-bit) difference hash of an image buffer. */
export async function dHash(buffer, { timeoutMs = 15000 } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new TypeError('dHash needs a non-empty image Buffer');
  const work = sharp(buffer, { failOn: 'error' })
    .timeout({ seconds: Math.ceil(timeoutMs / 1000) })
    .greyscale()
    .resize(9, 8, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer();
  let timer;
  const data = await Promise.race([
    work,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`dHash timed out after ${timeoutMs}ms`)), timeoutMs); }),
  ]).finally(() => clearTimeout(timer));
  let bits = 0n;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits = (bits << 1n) | (data[y * 9 + x] > data[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return bits.toString(16).padStart(16, '0');
}

/** Number of differing bits between two dHash hex strings (0–64). */
export function hamming(a, b) {
  if (!/^[0-9a-f]{16}$/i.test(String(a)) || !/^[0-9a-f]{16}$/i.test(String(b))) throw new TypeError('hamming needs two 16-hex-char hashes');
  let x = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
}

/** Every pair within `max` bits of each other: [{ a, b, distance }]. */
export function nearDuplicates(entries, max = NEAR_DUPLICATE_MAX) {
  const out = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const d = hamming(entries[i].dhash, entries[j].dhash);
      if (d <= max) out.push({ a: entries[i].id, b: entries[j].id, distance: d });
    }
  }
  return out;
}
