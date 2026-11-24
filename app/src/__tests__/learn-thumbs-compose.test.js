// =============================================================================
// The thumbnail compositor makes every asset from one TEXT-FREE master,
// renders the headline in Anton, and never leaves a half-written lesson
// (scripts/learn-thumbs — Learn redesign)
// =============================================================================
// Fixtures are generated in-test (no network, no external images).
// The compositor carries its own isolated dependency (sharp) in
// scripts/learn-thumbs/package.json so it never enters the PWA bundle; on a
// checkout where `npm ci` has not been run in that folder this suite is
// SKIPPED with the reason printed, never silently passed.
// =============================================================================
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

const DIR = join(process.cwd(), 'scripts/learn-thumbs');
const READY = existsSync(join(DIR, 'node_modules/sharp'));
if (!READY) console.warn('[learn-thumbs] SKIPPED: run `npm ci` in app/scripts/learn-thumbs to test the compositor.');

describe.skipIf(!READY)('learn-thumbs compositor', () => {
  let compose;
  let dh;
  let sharp;
  let out;

  const scene = async (a, b, cx = 0.7, w = 1920, h = 1080) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="${cx}" cy="0.45" r="0.7"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * cx}" cy="${h / 2}" r="${h / 4}" fill="#000" fill-opacity="0.4"/><rect x="${w * 0.1}" y="${h * 0.7}" width="${w * 0.3}" height="${h * 0.12}" fill="#fff" fill-opacity="0.3"/></svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  };

  beforeAll(async () => {
    compose = await import('../../scripts/learn-thumbs/compose.mjs');
    dh = await import('../../scripts/learn-thumbs/dhash.mjs');
    // A runtime path, so vite never tries to resolve sharp on a checkout that has not installed it (the suite is skipped there).
    ({ default: sharp } = await import(/* @vite-ignore */ pathToFileURL(join(DIR, 'node_modules/sharp/lib/index.js')).href));
    out = await mkdtemp(join(tmpdir(), 'learn-thumbs-'));
  });
  afterAll(async () => {
    if (out) await rm(out, { recursive: true, force: true });
  });

  it('renders the headline in Anton, not a fallback face', async () => {
    const r = await compose.assertAntonRenders();
    expect(r.ratio).toBeGreaterThan(0.95);
    expect(r.ratio).toBeLessThan(1.05);
  });

  it('stacks lines exactly as LearnStudio does, and colours only the last line gold', () => {
    expect(compose.stackLines('WHO GETS RICH?')).toEqual(['WHO GETS', 'RICH?']);
    expect(compose.stackLines('IT ONLY LOOKS LIKE CHEATING')).toEqual(['IT ONLY', 'LOOKS LIKE', 'CHEATING']);
    expect(compose.stackLines("NOBODY'S WATCHING")).toEqual(["NOBODY'S", 'WATCHING']);
    expect([0, 1, 2].map((i) => compose.lineColor(i, 3))).toEqual(['#FFFFFF', '#FFFFFF', '#CFA63C']);
  });

  it('a two-word headline too small on one line is stacked for the thumbnail', async () => {
    expect(await compose.thumbLines("NOBODY'S WATCHING")).toEqual(["NOBODY'S", 'WATCHING']);
  });

  it('writes every derivative, the 1280×720 share image and a manifest the presentation record can use', async () => {
    const master = await scene('#1b2a3a', '#d8913a');
    const m = await compose.composeLesson({
      image: master,
      courseKey: 'living-lessons',
      lessonId: 'll338-not-with-eyeservice',
      thumbHeadline: "NOBODY'S WATCHING",
      layout: 'left',
      department: 'Living Lessons',
      outDir: out,
    });
    const dir = join(out, 'living-lessons', 'll338-not-with-eyeservice');
    const files = (await readdir(dir)).sort();
    for (const w of compose.WIDTHS) {
      expect(files).toContain(`w${w}.avif`);
      expect(files).toContain(`w${w}.webp`);
    }
    expect(files).toEqual(expect.arrayContaining(['master.png', 'og.jpg', 'manifest.json']));

    const og = await sharp(join(dir, 'og.jpg')).metadata();
    expect([og.width, og.height, og.format]).toEqual([1280, 720, 'jpeg']);
    for (const s of m.sizes) {
      const a = await sharp(join(dir, s.avif)).metadata();
      const w = await sharp(join(dir, s.webp)).metadata();
      expect([a.format, a.width, a.height]).toEqual(['heif', s.width, s.height]);
      expect([w.format, w.width, w.height]).toEqual(['webp', s.width, s.height]);
      expect(Math.abs(s.width / s.height - 16 / 9)).toBeLessThan(0.01);
    }
    const onDisk = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
    expect(onDisk.image.src).toBe('/learn-thumbs/living-lessons/ll338-not-with-eyeservice/w1280.webp');
    expect(onDisk.image.srcSet.avif).toMatch(/w320\.avif 320w/);
    expect(onDisk.image.lqip).toMatch(/^data:image\/webp;base64,/);
    expect(onDisk.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(onDisk.dhash).toMatch(/^[0-9a-f]{16}$/);
    expect(await readFile(join(dir, 'master.png'))).toEqual(master); // the provider's bytes, untouched
  });

  it('the app derivatives stay text-free: they match the master, the share image does not', async () => {
    const master = await scene('#2a1408', '#f2a541', 0.75);
    const m = await compose.composeLesson({
      image: master,
      courseKey: 'living-lessons',
      lessonId: 'll332-give-me-this-mountain',
      thumbHeadline: "IT'S NOT TOO LATE",
      outDir: out,
    });
    const dir = join(out, 'living-lessons', 'll332-give-me-this-mountain');
    const plain = await sharp(master).resize(1280, 720, { fit: 'cover', position: 'attention' }).greyscale().resize(64, 36).raw().toBuffer();
    const deriv = await sharp(join(dir, 'w1280.webp')).greyscale().resize(64, 36).raw().toBuffer();
    const ogPx = await sharp(join(dir, 'og.jpg')).greyscale().resize(64, 36).raw().toBuffer();
    const meanDiff = (a, b) => a.reduce((t, v, i) => t + Math.abs(v - b[i]), 0) / a.length;
    expect(meanDiff(plain, deriv)).toBeLessThan(4); // only encoding noise
    expect(meanDiff(plain, ogPx)).toBeGreaterThan(8); // the headline and gradient are there
    expect(m.headline.fontSize).toBeGreaterThanOrEqual(140);
  });

  it('dHash: identical for identical pictures, close for a resized copy, far for a different scene', async () => {
    const a = await scene('#06131f', '#2f7d6e', 0.3);
    const b = await scene('#3a0d0d', '#f0c040', 0.8);
    const small = await sharp(a).resize(960, 540).jpeg({ quality: 70 }).toBuffer();
    const ha = await dh.dHash(a);
    expect(await dh.dHash(Buffer.from(a))).toBe(ha);
    expect(dh.hamming(ha, await dh.dHash(small))).toBeLessThanOrEqual(5);
    expect(dh.hamming(ha, await dh.dHash(b))).toBeGreaterThan(dh.NEAR_DUPLICATE_MAX);
    expect(
      dh
        .nearDuplicates([
          { id: 'a', dhash: ha },
          { id: 'a2', dhash: await dh.dHash(small) },
          { id: 'b', dhash: await dh.dHash(b) },
        ])
        .map((p) => `${p.a}~${p.b}`)
    ).toEqual(['a~a2']);
  });

  it('a corrupt picture fails cleanly and leaves the previous output exactly as it was', async () => {
    const dir = join(out, 'living-lessons', 'll338-not-with-eyeservice');
    const before = await readFile(join(dir, 'manifest.json'), 'utf8');
    const bad = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('not really a png')]);
    await expect(
      compose.composeLesson({ image: bad, courseKey: 'living-lessons', lessonId: 'll338-not-with-eyeservice', thumbHeadline: 'X Y', outDir: out })
    ).rejects.toMatchObject({ name: 'ComposeError', code: 'corrupt-image' });
    expect(await readFile(join(dir, 'manifest.json'), 'utf8')).toBe(before);
    const leftovers = (await readdir(join(out, 'living-lessons'))).filter((f) => f.startsWith('.'));
    expect(leftovers).toEqual([]);
  });

  it('rejects unsafe paths and missing inputs before touching the disk', async () => {
    const img = await scene('#000', '#555');
    await expect(compose.composeLesson({ image: img, courseKey: '../etc', lessonId: 'x', thumbHeadline: 'A B', outDir: out })).rejects.toMatchObject({
      code: 'bad-input',
    });
    await expect(compose.composeLesson({ image: img, courseKey: 'c', lessonId: 'x', thumbHeadline: '', outDir: out })).rejects.toMatchObject({
      code: 'bad-input',
    });
    await expect(
      compose.composeLesson({ image: img, courseKey: 'c', lessonId: 'x', thumbHeadline: 'A B', layout: 'middle', outDir: out })
    ).rejects.toMatchObject({ code: 'bad-input' });
    const missing = join(out, 'nope.png');
    await expect(compose.composeLesson({ image: missing, courseKey: 'c', lessonId: 'x', thumbHeadline: 'A B', outDir: out })).rejects.toMatchObject({
      code: 'read-failed',
    });
  });
});
