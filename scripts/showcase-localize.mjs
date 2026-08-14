// =============================================================================
// showcase-localize — resize the showcase originals and serve them from Cloudflare
// =============================================================================
// Darrell, 2026-08-14, after the egress lockout: "resize the moore-showcase
// images and move them to cloudflare".
//
// WHAT THIS SOLVES. `moore-showcase` is a PUBLIC Supabase bucket holding
// camera-original photographs — 12 objects, 29.7 MB, of which the top THREE are
// 24.4 MB (10.6 / 7.3 / 6.5 MB). Every public view of that gallery billed
// Supabase egress against a 5 GB monthly free quota, and image transformations
// are not available on the free plan, so the originals were served at full size
// to phones that display them a few hundred pixels wide.
//
// Cloudflare Pages already serves this app's static assets and its egress is not
// metered by Supabase at all. So the fix is not a Supabase setting — it is to
// put a right-sized copy in `app/public/` where Pages serves it same-origin.
//
// NOTHING IS DELETED. The originals stay exactly where they are, untouched, and
// remain the fallback in `showcaseImageUrl()` and the source of truth for any
// future re-encode. This script only ADDS files. That is deliberate: the bytes
// in that bucket are Shay's business photographs, this session does not delete
// anything (DR-0291 §5), and a localized copy that turns out wrong must always
// be recoverable from the original.
//
// WHY IT RUNS ON A RUNNER, NOT LOCALLY. The cloud sandbox has no network route
// to supabase.co (verified: CONNECT tunnel 403), and while the project is
// restricted every public-object URL answers 402 anyway. A GitHub runner has
// both — the same channel that made site-health possible (DR-0125, DR-0108: the
// agent's reach is not the team's reach). Hence `.github/workflows/
// showcase-localize.yml`, which runs this and opens a PR with the results.
//
// WHY CHROMIUM AND NOT sharp. No image library is in this repo's dependency
// tree, and adding a native binary dependency to the app's package.json for a
// once-in-a-while maintenance script is the wrong trade. Chromium is already
// installed for the layout and highlight probes, and canvas re-encoding in a
// real browser is exactly as good for this job.
//
// Usage:
//   node scripts/showcase-localize.mjs            # fetch, resize, write, report
//   node scripts/showcase-localize.mjs --dry-run  # report the plan, write nothing
//   node scripts/showcase-localize.mjs --selftest # prove the resize actually shrinks
// =============================================================================
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
const OUT_DIR = join(REPO, 'app/public/showcase');
const MANIFEST = join(REPO, 'app/src/lib/showcase-localized.json');

const DRY = process.argv.includes('--dry-run');
const SELFTEST = process.argv.includes('--selftest');

// A phone shows these a few hundred CSS px wide; a laptop gallery tile is
// smaller than this. 1600 leaves room for a 2x retina tile and for the
// full-screen view without keeping a 4000px camera original around.
const MAX_EDGE = 1600;
const QUALITY = 0.82;

// The bucket's objects, and the public base. The object list is generated from
// the live `storage.objects` table rather than typed here — see the workflow.
const BUCKET = 'moore-showcase';

function publicUrl(base, name) {
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/${name}`;
}

/** Re-encode one image in a real browser. Returns {buffer, width, height}. */
async function resizeInBrowser(page, dataUrl, maxEdge, quality) {
  const out = await page.evaluate(async ({ src, maxEdge: m, quality: q }) => {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('decode failed')); img.src = src; });
    const w = img.naturalWidth, h = img.naturalHeight;
    const scale = Math.min(1, m / Math.max(w, h)); // never UPSCALE a small image
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const c = document.createElement('canvas');
    c.width = tw; c.height = th;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, tw, th);
    return { data: c.toDataURL('image/jpeg', q), width: tw, height: th, srcW: w, srcH: h };
  }, { src: dataUrl, maxEdge, quality });
  const b64 = out.data.slice(out.data.indexOf(',') + 1);
  return { buffer: Buffer.from(b64, 'base64'), ...out };
}

async function launch() {
  const opts = process.env.PLAYWRIGHT_CHROMIUM_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH, headless: true }
    : { channel: 'chrome', headless: true };
  try { return await chromium.launch(opts); }
  catch { return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
}

// -----------------------------------------------------------------------------
// SELFTEST — proves the resize genuinely shrinks a large image and never
// upscales a small one, WITHOUT needing the network or the restricted project.
// A "resizer" that returned its input unchanged would pass a naive check and
// save nothing, which is the whole point of this script.
// -----------------------------------------------------------------------------
async function selftest() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  let failures = 0;
  const check = (name, pass, detail) => {
    if (!pass) failures += 1;
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  };

  // A big, noisy image — noise matters, because a flat colour compresses to
  // nothing and would make any resizer look brilliant.
  const bigUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 4000; c.height = 3000;
    const ctx = c.getContext('2d');
    const im = ctx.createImageData(4000, 3000);
    let seed = 12345;
    for (let i = 0; i < im.data.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      im.data[i] = seed % 255; im.data[i + 1] = (seed >> 8) % 255;
      im.data[i + 2] = (seed >> 16) % 255; im.data[i + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL('image/jpeg', 0.95);
  });
  const bigBytes = Buffer.from(bigUrl.slice(bigUrl.indexOf(',') + 1), 'base64').length;
  const big = await resizeInBrowser(page, bigUrl, MAX_EDGE, QUALITY);
  check('a 4000px original is read at full size', big.srcW === 4000, `${big.srcW}x${big.srcH}`);
  check('the long edge is capped at MAX_EDGE', Math.max(big.width, big.height) === MAX_EDGE,
    `${big.width}x${big.height}`);
  check('aspect ratio is preserved', Math.abs((big.width / big.height) - (4000 / 3000)) < 0.01,
    `${(big.width / big.height).toFixed(3)} vs ${(4000 / 3000).toFixed(3)}`);
  check('THE OUTPUT IS ACTUALLY SMALLER', big.buffer.length < bigBytes,
    `${(bigBytes / 1024 / 1024).toFixed(2)} MB -> ${(big.buffer.length / 1024 / 1024).toFixed(2)} MB`);

  // A small image must be left alone rather than blown up.
  const smallUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 300;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#B85838'; ctx.fillRect(0, 0, 400, 300);
    return c.toDataURL('image/jpeg', 0.95);
  });
  const small = await resizeInBrowser(page, smallUrl, MAX_EDGE, QUALITY);
  check('a small image is NEVER upscaled', small.width === 400 && small.height === 300,
    `${small.width}x${small.height}`);

  await browser.close();
  console.log(`\n${failures === 0 ? 'SELFTEST OK' : 'SELFTEST FAILED'} — ${failures} failure(s)`);
  process.exit(failures === 0 ? 0 : 1);
}

async function main() {
  if (SELFTEST) return selftest();

  const base = process.env.SB_URL || process.env.VITE_SUPABASE_URL || '';
  if (!base) {
    console.error('showcase-localize: SB_URL / VITE_SUPABASE_URL is required to reach the bucket.');
    process.exit(2);
  }
  const listPath = join(HERE, 'showcase-objects.json');
  if (!existsSync(listPath)) {
    console.error(`showcase-localize: ${listPath} not found — the object list is generated from storage.objects.`);
    process.exit(2);
  }
  const objects = JSON.parse(readFileSync(listPath, 'utf8'));

  const browser = await launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');

  if (!DRY) mkdirSync(join(OUT_DIR, 'moore-divahs'), { recursive: true });

  const localized = {};
  let before = 0, after = 0, failed = 0;

  for (const obj of objects) {
    const url = publicUrl(base, obj.name);
    let dataUrl;
    try {
      // Fetch INSIDE the browser so one code path handles bytes and decode.
      dataUrl = await page.evaluate(async (u) => {
        const r = await fetch(u);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const blob = await r.blob();
        return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
      }, url);
    } catch (e) {
      failed += 1;
      console.error(`SKIP  ${obj.name} — ${String(e.message || e).slice(0, 120)}`);
      continue;
    }

    const res = await resizeInBrowser(page, dataUrl, MAX_EDGE, QUALITY);
    // Never ship a "resized" file that is bigger than the original.
    const originalBytes = Number(obj.bytes) || 0;
    if (originalBytes && res.buffer.length >= originalBytes) {
      console.log(`KEEP  ${obj.name} — already small (${(originalBytes / 1024).toFixed(0)} kB); not localized`);
      continue;
    }

    const outName = `${basename(obj.name).replace(/\.[a-z0-9]+$/i, '')}.jpg`;
    const rel = `moore-divahs/${outName}`;
    if (!DRY) writeFileSync(join(OUT_DIR, rel), res.buffer);
    localized[obj.name] = rel;
    before += originalBytes;
    after += res.buffer.length;
    console.log(`OK    ${obj.name}  ${res.srcW}x${res.srcH} ${(originalBytes / 1024 / 1024).toFixed(2)} MB`
      + ` ->  ${res.width}x${res.height} ${(res.buffer.length / 1024).toFixed(0)} kB`);
  }

  await browser.close();

  if (!DRY) {
    writeFileSync(MANIFEST, `${JSON.stringify(localized, null, 2)}\n`);
  }
  const saved = before - after;
  console.log(`\n${Object.keys(localized).length} localized, ${failed} unreachable.`);
  console.log(`${(before / 1024 / 1024).toFixed(2)} MB -> ${(after / 1024 / 1024).toFixed(2)} MB`
    + `  (${before ? ((saved / before) * 100).toFixed(1) : 0}% less per full gallery view)`);
  console.log('Originals in Supabase are UNTOUCHED and remain the fallback.');
  if (failed && !Object.keys(localized).length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
