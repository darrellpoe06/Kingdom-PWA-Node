// =============================================================================
// compose — one TEXT-FREE cinematic master in, every thumbnail asset out
// (Learn redesign: the reusable thumbnail composition system)
// =============================================================================
// The image provider is always asked for a picture WITH NO TEXT. Typography is
// ours, composed here, so every headline is spelled right, on brand, and the
// same face and weight across 994 lessons. In the app, LearnStudio overlays
// the headline live in CSS on the text-free derivatives; the composed OG/share
// image carries the same typography baked in for link previews and exports.
//
//   composeLesson({ image, courseKey, lessonId, thumbHeadline, layout, department, outDir })
//     → <outDir>/<courseKey>/<lessonId>/
//         master.<ext>            the provider's original bytes, untouched
//         w1920|w1280|w640|w320 .avif/.webp   text-free 16:9 derivatives
//         og.jpg                  1280×720 with the headline composed
//         manifest.json           { image:{src,srcSet,lqip}, sizes, width,
//                                   height, sha256, dhash, ogPath, ... }
//
// Atomic: everything is written to a temp directory, then swapped into place
// with rename. A corrupt picture or a timeout leaves the previous output (if
// any) exactly as it was and throws a ComposeError with a stable `code`.
// =============================================================================
import { Buffer } from 'node:buffer';
import { setTimeout, clearTimeout } from 'node:timers';
import process from 'node:process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, rm, rename, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const FONT_DIR = join(HERE, 'fonts');
export const FONT_FILE = join(FONT_DIR, 'Anton-Regular.ttf');
// Deterministic fonts: librsvg resolves families through fontconfig, which reads
// this variable once, lazily — so it is set BEFORE sharp is first loaded.
// Written with ABSOLUTE paths at load so the result never depends on the working
// directory, and listing ONLY our font folder so a missing Anton fails the font
// check loudly instead of falling back to a system face.
if (!process.env.FONTCONFIG_FILE) {
  const conf = join(tmpdir(), 'learn-thumbs-fonts.conf');
  writeFileSync(conf, `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${FONT_DIR}</dir>\n  <cachedir>${join(tmpdir(), 'learn-thumbs-fc-cache')}</cachedir>\n</fontconfig>\n`);
  process.env.FONTCONFIG_FILE = conf;
}
const { default: sharp } = await import('sharp');
const { dHash } = await import('./dhash.mjs');
const { gradeImage } = await import('./grade.mjs');

// Love Corner palette (app/src/lib/lovecorner-palette.js).
export const COLORS = Object.freeze({ white: '#FFFFFF', gold: '#CFA63C', black: '#1A1012', red: '#C03222' });
export const OG = Object.freeze({ width: 1280, height: 720 });
export const WIDTHS = Object.freeze([1920, 1280, 640, 320]);
export const SKEW_DEG = -8;
const TEXT_SHARE = 0.58;  // headline block never wider than 58% of the frame
const TEXT_HEIGHT = 0.70; // nor taller than 70%
const LINE_HEIGHT = 0.95;

export class ComposeError extends Error {
  constructor(code, message, cause) { super(message); this.name = 'ComposeError'; this.code = code; if (cause) this.cause = cause; }
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new ComposeError('timeout', `${label} timed out after ${ms}ms`)), ms); }),
  ]).finally(() => clearTimeout(timer));
}

/** Identical to LearnStudio's stackLines: 2–3 balanced lines. */
export function stackLines(text, maxLines = 3) {
  const w = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (w.length <= 2) return w;
  const lines = Math.min(maxLines, w.length <= 4 ? 2 : 3);
  const per = Math.ceil(w.length / lines);
  const out = [];
  for (let i = 0; i < w.length; i += per) out.push(w.slice(i, i + per).join(' '));
  return out;
}

/**
 * The composed thumbnail's lines: LearnStudio's stackLines, except that a short
 * headline left on ONE line too small to read at thumbnail size (under 140px)
 * is broken onto two, the way a designer would stack "NOBODY'S / WATCHING".
 */
export async function thumbLines(text) {
  const lines = stackLines(text, 3);
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (lines.length === 1 && words.length >= 2 && (await fitHeadline(lines)) < 140) {
    const half = Math.ceil(words.length / 2);
    return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
  }
  return lines;
}

// Same rule as LearnStudio's <Headline>: the last line is gold, every line above it white.
export function lineColor(i, count) { return count > 1 && i === count - 1 ? COLORS.gold : COLORS.white; }

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// Width of one line in Anton at 100px, measured by Pango from the font FILE
// (independent of fontconfig) — the yardstick for the fit loop and for the
// "is the SVG really rendering Anton?" check.
const widthCache = new Map();
export async function measureAt100(line, { timeoutMs = 10000 } = {}) {
  const key = line;
  if (widthCache.has(key)) return widthCache.get(key);
  const job = sharp({ text: { text: xmlEscape(line), fontfile: FONT_FILE, font: 'Anton 100', dpi: 72 } }).png().toBuffer({ resolveWithObject: true });
  const { info } = await withTimeout(job, timeoutMs, 'measure');
  widthCache.set(key, info.width);
  return info.width;
}

/** The font size (px) at which the stacked headline fits its block. */
export async function fitHeadline(lines, { width = OG.width, height = OG.height } = {}) {
  const maxW = width * TEXT_SHARE;
  const maxH = height * TEXT_HEIGHT;
  const widest = Math.max(...(await Promise.all(lines.map((l) => measureAt100(l)))));
  const skewPad = Math.tan(Math.abs(SKEW_DEG) * Math.PI / 180); // the skew leans the block by this × its height
  for (let size = 190; size >= 40; size -= 2) {
    const blockH = lines.length * size * LINE_HEIGHT;
    const blockW = (widest * size) / 100 + blockH * skewPad;
    if (blockW <= maxW && blockH <= maxH) return size;
  }
  return 40;
}

/** SVG overlay: legibility gradient, brand line, and the stacked italic headline. */
export function overlaySvg({ lines, size, layout = 'left', department = '', width = OG.width, height = OG.height }) {
  const left = layout !== 'right';
  const margin = Math.round(width * 0.055);
  const lh = size * LINE_HEIGHT;
  const blockH = lines.length * lh;
  const top = Math.round((height - blockH) / 2) + size * 0.82; // first baseline
  const anchor = left ? 'start' : 'end';
  const x = left ? margin : width - margin;
  const tan = Math.tan(SKEW_DEG * Math.PI / 180);
  // skewX shifts x by y·tan; compensate so the block's visual edge sits on the margin.
  const midY = top - size * 0.82 + blockH / 2;
  const tx = -tan * midY;
  const text = lines.map((l, i) => `<text x="${x}" y="${(top + i * lh).toFixed(1)}" fill="${lineColor(i, lines.length)}" text-anchor="${anchor}">${xmlEscape(l.toUpperCase())}</text>`).join('');
  const g0 = left ? '0' : '1';
  const g1 = left ? '0.6' : '0.4'; // a light, text-side scrim; the picture stays bright (2026-11-24)
  const brandX = left ? margin : width - margin;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="side" x1="${g0}" y1="0" x2="${g1}" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="1" x2="0" y2="0.82">
      <stop offset="0" stop-color="#000" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.max(3, size * 0.035).toFixed(1)}" stdDeviation="0" flood-color="#000" flood-opacity="0.6"/>
      <feDropShadow dx="0" dy="${(size * 0.06).toFixed(1)}" stdDeviation="${(size * 0.09).toFixed(1)}" flood-color="#000" flood-opacity="0.75"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#side)"/>
  <rect width="${width}" height="${height}" fill="url(#foot)"/>
  <g font-family="Anton" font-size="${size}" letter-spacing="${(size * 0.005).toFixed(2)}" filter="url(#shadow)" transform="translate(${tx.toFixed(1)} 0) skewX(${SKEW_DEG})">${text}</g>
  <rect x="${left ? brandX : brandX - 64}" y="${height - 58}" width="64" height="6" rx="3" fill="${COLORS.gold}"/>
  <text x="${brandX}" y="${height - 26}" font-family="Anton" font-size="22" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.92" text-anchor="${anchor}">${xmlEscape(['THE LOVE CORNER', department ? String(department).toUpperCase() : 'LEARN'].join('  ·  '))}</text>
</svg>`;
}

/** Renders a headline SVG and confirms the glyphs really are Anton (not a fallback face). */
export async function assertAntonRenders({ timeoutMs = 10000 } = {}) {
  const probe = 'WHO GETS RICH';
  const expected = await measureAt100(probe);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="200"><text x="10" y="140" font-family="Anton" font-size="100" fill="#000">${probe}</text></svg>`;
  const job = sharp(Buffer.from(svg)).flatten({ background: '#fff' }).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
  const { info } = await withTimeout(job, timeoutMs, 'font check');
  const ratio = info.width / expected;
  if (ratio < 0.9 || ratio > 1.1) {
    throw new ComposeError('font-fallback', `headline rendered ${info.width}px wide where Anton measures ${expected}px (ratio ${ratio.toFixed(2)}): fontconfig is not resolving Anton. FONTCONFIG_FILE=${process.env.FONTCONFIG_FILE}`);
  }
  return { svgWidth: info.width, antonWidth: expected, ratio };
}

let fontChecked = null;

async function exists(p) { try { await access(p); return true; } catch { return false; } }

/**
 * Compose one lesson's thumbnail assets. `image` is a Buffer or a file path to
 * the text-free master. Returns the manifest.
 */
export async function composeLesson({
  image, courseKey, lessonId, thumbHeadline, layout = 'left', department = '',
  outDir, publicBase = '/learn-thumbs', timeoutMs = 60000, look = null,
}) {
  if (!courseKey || !lessonId) throw new ComposeError('bad-input', 'courseKey and lessonId are required');
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(courseKey) || !/^[a-z0-9][a-z0-9-]*$/i.test(lessonId)) throw new ComposeError('bad-input', 'courseKey and lessonId must be slug-safe');
  if (!String(thumbHeadline || '').trim()) throw new ComposeError('bad-input', 'thumbHeadline is required');
  if (layout !== 'left' && layout !== 'right') throw new ComposeError('bad-input', 'layout must be "left" or "right"');
  if (!outDir) throw new ComposeError('bad-input', 'outDir is required');

  let master;
  try {
    master = Buffer.isBuffer(image) ? image : await withTimeout(import('node:fs/promises').then((fs) => fs.readFile(image)), 10000, 'read master');
  } catch (e) { throw new ComposeError(e.code === 'timeout' ? 'timeout' : 'read-failed', `could not read master image: ${e.message}`, e); }

  let meta;
  try {
    meta = await withTimeout(sharp(master, { failOn: 'error' }).metadata(), 10000, 'decode');
    if (!meta.width || !meta.height) throw new Error('no dimensions');
    await withTimeout(sharp(master, { failOn: 'error' }).resize(8, 8).raw().toBuffer(), 10000, 'decode pixels');
  } catch (e) {
    throw new ComposeError(e.code === 'timeout' ? 'timeout' : 'corrupt-image', `master image for ${courseKey}/${lessonId} is not a readable picture: ${e.message}`, e);
  }

  if (!fontChecked) fontChecked = assertAntonRenders();
  await fontChecked;

  const finalDir = resolve(outDir, courseKey, lessonId);
  const tmpDir = resolve(outDir, courseKey, `.${lessonId}.tmp-${randomBytes(4).toString('hex')}`);
  await mkdir(tmpDir, { recursive: true });
  try {
    const sec = Math.ceil(timeoutMs / 1000);
    // The grade pass (grade.mjs): bars cropped, exposure and color corrected.
    // master.<ext> stays the provider's bytes; every derivative is made from the graded picture.
    let graded = null;
    if (look) graded = await withTimeout(gradeImage(master, { look }), timeoutMs, 'grade');
    const source = graded ? graded.buffer : master;
    const srcMeta = graded ? { width: graded.width } : meta;
    const base = () => sharp(source, { failOn: 'error' }).timeout({ seconds: sec }).rotate();
    const ext = (meta.format === 'jpeg' ? 'jpg' : meta.format) || 'bin';
    await writeFile(join(tmpDir, `master.${ext}`), master);

    // Text-free 16:9 derivatives. Never enlarged past the master.
    const srcW = srcMeta.width;
    const files = [];
    for (const w of WIDTHS) {
      const target = Math.min(w, srcW);
      const h = Math.round((target * 9) / 16);
      const pipe = base().resize(target, h, { fit: 'cover', position: 'attention', withoutEnlargement: false });
      const avif = `w${w}.avif`;
      const webp = `w${w}.webp`;
      await withTimeout(pipe.clone().avif({ quality: 50, effort: 4 }).toFile(join(tmpDir, avif)), timeoutMs, `avif ${w}`);
      await withTimeout(pipe.clone().webp({ quality: 78 }).toFile(join(tmpDir, webp)), timeoutMs, `webp ${w}`);
      files.push({ w, width: target, height: h, avif, webp });
    }
    const lqipBuf = await withTimeout(base().resize(24, 14, { fit: 'cover', position: 'attention' }).blur(1.2).webp({ quality: 40 }).toBuffer(), timeoutMs, 'lqip');

    // The composed share image: cover-crop to 1280×720, then our typography.
    const lines = await thumbLines(thumbHeadline);
    const size = await fitHeadline(lines);
    const svg = overlaySvg({ lines, size, layout, department });
    const bg = await withTimeout(base().resize(OG.width, OG.height, { fit: 'cover', position: 'attention' }).toBuffer(), timeoutMs, 'og background');
    await withTimeout(
      sharp(bg).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 86, mozjpeg: true }).toFile(join(tmpDir, 'og.jpg')),
      timeoutMs, 'og compose',
    );

    const url = (f) => `${publicBase}/${courseKey}/${lessonId}/${f}`;
    const big = files.find((f) => f.w === 1280) || files[0];
    const manifest = {
      schema: 'learn-thumbs/v1',
      courseKey, lessonId, thumbHeadline, layout, department,
      composedAt: new Date().toISOString(),
      master: { file: `master.${ext}`, format: meta.format, width: meta.width, height: meta.height, bytes: master.length },
      sha256: createHash('sha256').update(master).digest('hex'),
      dhash: await dHash(master),
      width: big.width,
      height: big.height,
      image: {
        src: url(big.webp),
        srcSet: {
          avif: files.map((f) => `${url(f.avif)} ${f.width}w`).join(', '),
          webp: files.map((f) => `${url(f.webp)} ${f.width}w`).join(', '),
        },
        lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
      },
      sizes: files.map(({ w, width, height, avif, webp }) => ({ w, width, height, avif, webp })),
      ogPath: url('og.jpg'),
      headline: { lines, fontSize: size, font: 'Anton' },
      ...(graded ? { grade: { look: graded.look, crop: graded.crop, before: graded.before, after: graded.after, params: graded.params } } : {}),
    };
    await writeFile(join(tmpDir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);

    // Swap into place: old → backup, tmp → final, drop backup.
    const backup = `${finalDir}.old-${randomBytes(3).toString('hex')}`;
    const hadOld = await exists(finalDir);
    if (hadOld) await rename(finalDir, backup);
    try { await rename(tmpDir, finalDir); } catch (e) { if (hadOld) await rename(backup, finalDir); throw e; }
    if (hadOld) await rm(backup, { recursive: true, force: true });
    return manifest;
  } catch (e) {
    await rm(tmpDir, { recursive: true, force: true });
    if (e instanceof ComposeError) throw e;
    throw new ComposeError('compose-failed', `composing ${courseKey}/${lessonId} failed: ${e.message}`, e);
  }
}

// ---------------------------------------------------------------------------
// CLI: node compose.mjs --image master.png --course living-lessons
//        --lesson ll338-not-with-eyeservice --headline "NOBODY'S WATCHING"
//        [--layout left|right] [--department "Living Lessons"] --out ./out
// ---------------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
  composeLesson({
    image: args.image, courseKey: args.course, lessonId: args.lesson, thumbHeadline: args.headline,
    layout: args.layout || 'left', department: args.department || '', outDir: args.out, publicBase: args['public-base'] || '/learn-thumbs',
  }).then((m) => { process.stdout.write(`${JSON.stringify({ ok: true, dir: join(args.out, args.course, args.lesson), og: m.ogPath, dhash: m.dhash })}\n`); })
    .catch((e) => { process.stderr.write(`${JSON.stringify({ ok: false, code: e.code || 'error', message: e.message })}\n`); process.exitCode = 1; });
}
