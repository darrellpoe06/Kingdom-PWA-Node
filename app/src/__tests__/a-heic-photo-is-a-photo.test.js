// =============================================================================
// A HEIC PHOTO IS A PHOTO — decoded against a REAL .heic file
// =============================================================================
// Darrell, 2026-10-10, on the Add a picture panel, with a move-out condition
// set refused fourteen photographs at a time:
//
//   "Skipped 14: 6660.heic (the image could not be decoded on this device
//    (HEIC or an unsupported format?)), 6659.heic ..."
//   "I want to accept this type of images!!! Fix it!!!"
//
// THE FIXTURE IS A REAL HEIC. `fixtures/a-real-photo.heic` was written by
// libheif's own encoder (through pillow-heif) and `file` identifies it as
// "ISO Media, HEIF Image HEVC Main or Main Still Picture Profile". It is 64x48
// with a known shape — the left half red, the right half blue — so this gate
// can check the PIXELS that come back, not merely that something came back.
// A decoder that returned a grey rectangle would pass a "did it throw?" test
// and fail this one.
//
// WHY THAT MATTERS HERE PARTICULARLY. The first attempt at a fixture was made
// with ffmpeg: `file` called it a HEIF, and libheif refused it with "No images
// found" — correctly, because an ffmpeg-made container carries the HEVC
// bitstream without the HEIF image items a real photo has. Had this gate
// mocked the decoder, that distinction would have been invisible and the
// "fix" could have shipped against a file shape no phone produces.
// =============================================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  looksHeicBytes, looksHeicName, decodeHeicToRgba, _resetHeicDecoder,
} from '../lib/heic.js';

const here = dirname(fileURLToPath(import.meta.url));
const REAL = () => new Uint8Array(readFileSync(join(here, 'fixtures', 'a-real-photo.heic')));

beforeEach(() => { _resetHeicDecoder(); });

describe('knowing a HEIC when one arrives', () => {
  it('reads it from the BYTES, because the name and the MIME both lie', () => {
    // Android hands the browser an empty or octet-stream type often enough
    // that image.js already carries a comment about it, and a file from a
    // cloud picker can have no extension at all.
    expect(looksHeicBytes(REAL())).toBe(true);
  });

  it('is not fooled by a JPEG, a PNG, or something too short to tell', () => {
    const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0, 1, 0, 0, 0, 0]);
    const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 0, 0, 0, 0]);
    expect(looksHeicBytes(jpeg)).toBe(false);
    expect(looksHeicBytes(png)).toBe(false);
    expect(looksHeicBytes(new Uint8Array([1, 2, 3]))).toBe(false);
    expect(looksHeicBytes(null)).toBe(false);
  });

  it('an mp4 is an ISO container too, and is still not a photo', () => {
    // 'ftyp' + 'isom' — the shape a video shares with a HEIC. Getting this
    // wrong would send a movie into the picture decoder.
    const mp4 = new Uint8Array(32);
    mp4.set([0, 0, 0, 24], 0);
    mp4.set([...'ftypisomisom'].map((c) => c.charCodeAt(0)), 4);
    expect(looksHeicBytes(mp4)).toBe(false);
  });

  it('finds the brand when it is a COMPATIBLE one, not the major', () => {
    const b = new Uint8Array(32);
    b.set([0, 0, 0, 24], 0);
    b.set([...'ftypmp42mp42heic'].map((c) => c.charCodeAt(0)), 4);
    expect(looksHeicBytes(b)).toBe(true);
  });

  it('the cheap name check still works, for deciding whether to read bytes at all', () => {
    expect(looksHeicName({ name: 'IMG_6660.HEIC', type: '' })).toBe(true);
    expect(looksHeicName({ name: 'x', type: 'image/heif' })).toBe(true);
    expect(looksHeicName({ name: 'IMG_6660.jpg', type: 'image/jpeg' })).toBe(false);
    expect(looksHeicName(null)).toBe(false);
  });
});

describe('PROVEN-TO-CATCH: the decode, on a real file', () => {
  it('decodes it, and the PIXELS are the ones that went in', async () => {
    const { width, height, data } = await decodeHeicToRgba(REAL());
    expect(width).toBe(64);
    expect(height).toBe(48);
    expect(data.length).toBe(64 * 48 * 4);

    // Left half red, right half blue. Sampled well inside each half so the
    // lossy edge between them cannot decide the result.
    const at = (x, y) => {
      const i = (y * width + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const [lr, lg, lb] = at(8, 24);
    const [rr, rg, rb] = at(56, 24);
    expect(lr, `left half should be red, got rgb(${lr},${lg},${lb})`).toBeGreaterThan(180);
    expect(lb).toBeLessThan(80);
    expect(rb, `right half should be blue, got rgb(${rr},${rg},${rb})`).toBeGreaterThan(180);
    expect(rr).toBeLessThan(80);
  });

  it('a HEIC container with no picture in it says so, and is not called "unsupported"', async () => {
    // ffmpeg writes exactly this: the HEVC bitstream in an ISO container with
    // the heic brand and no HEIF image items. A person given "unsupported
    // format" here would go hunting the wrong problem.
    const notAPhoto = await decodeHeicToRgba(REAL(), {
      loader: async () => ({ HeifDecoder: function D() { this.decode = () => []; } }),
    }).catch((e) => e);
    expect(notAPhoto).toBeInstanceOf(Error);
    expect(notAPhoto.message).toMatch(/container with no picture/);
  });

  it('a decoder that cannot load says THAT, rather than blaming the photograph', async () => {
    const err = await decodeHeicToRgba(REAL(), { loader: async () => ({}) }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/decoder could not be loaded/);
  });
});

describe('the pipeline the panel actually calls', () => {
  it('compressImageFile tries the NATIVE path first and only then the decoder', async () => {
    const src = readFileSync(join(here, '..', 'lib', 'image.js'), 'utf8');
    // Safari decodes HEIC natively and beats any WASM build; the megabytes are
    // only fetched when the browser has genuinely failed.
    expect(src).toMatch(/nativeCompress\(file, maxWidth, quality\)\.catch\(/);
    expect(src).toMatch(/await import\('\.\/heic\.js'\)/);
  });

  it('the decoder is imported LAZILY, so nobody who never sees a HEIC pays for it', () => {
    const src = readFileSync(join(here, '..', 'lib', 'image.js'), 'utf8');
    expect(src).not.toMatch(/^import .*heic\.js/m);
  });

  it('the message a person sees comes from the thing that actually tried', () => {
    const src = readFileSync(join(here, '..', 'lib', 'image.js'), 'utf8');
    // The old text guessed its own cause ("HEIC or an unsupported format?")
    // and could do nothing about it. A real reason replaces a right guess.
    expect(src).toMatch(/heicError && heicError\.message/);
  });
});

// =============================================================================
// A WRITE THAT NEVER ANSWERS IS NOT A WRITE (DR-0908)
// =============================================================================
// Darrell, 2026-10-10, on build 21F4C39 — the one that already had the serial
// save: "After trying to upload it did not work.... pictures looked like they
// would upload and never did".
//
// That build would have shown "Saving 1 of 14" and sat there, which is the
// signature of a promise that never settles rather than one that fails.
// Nothing in cloud.js had a deadline: reads got one long ago, writes were left
// to the network on the assumption they would land or error.
//
// WHY THEY STALL (measured): the Pages Functions outage (#2057) killed the
// same-origin /sb road, so the deploy points the client at the ABSOLUTE Funnel
// URL (deploy-cloudflare-pages.yml:147) — and CLAUDE.md's standing note says
// the app must reach the NAS same-origin, "never the absolute Funnel URL (it
// throttles cross-origin)". Small reads pass. Fourteen cross-origin POSTs each
// carrying a ~300KB base64 data URL do not.
//
// A deadline cannot make the write succeed. It makes the failure VISIBLE and
// the picture RECOVERABLE.
describe('a write that never answers', () => {
  it('PROVEN-TO-CATCH: a hung insert gives up and SAYS so, instead of hanging', async () => {
    const { addPhoto } = await import('../modules/properties/cloud.js');
    // A client whose insert never settles — exactly the stall he met.
    const hung = {
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
      from: () => ({
        insert: () => ({ select: () => ({ single: () => new Promise(() => {}) }) }),
      }),
    };
    const started = Date.now();
    const res = await addPhoto({ instance_id: 'i1', rental_ref: 'r1' }, hung, { deadlineMs: 60 });
    expect(res.ok, 'a stalled write reported success').toBe(false);
    expect(res.error || res.reason).toBeTruthy();
    expect(Date.now() - started, 'it waited far longer than its deadline').toBeLessThan(5000);
  });

  it('the deadline says how long it waited, in words a person can act on', async () => {
    const { withDeadline } = await import('../modules/properties/cloud.js');
    const err = await withDeadline(new Promise(() => {}), 30, 'the picture server').catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/the picture server did not answer/);
  });

  it('a write that DOES answer is untouched by the deadline', async () => {
    const { withDeadline } = await import('../modules/properties/cloud.js');
    await expect(withDeadline(Promise.resolve('landed'), 5000)).resolves.toBe('landed');
  });
});
