#!/usr/bin/env node
// =============================================================================
// kids-make-episode — the movie, cut from what is in the kids folder
// =============================================================================
// Darrell, 2026-11-18: "Let's make the movies!!! Why wait?" This cuts a Bible
// Adventure episode with ffmpeg from the files the production brief names,
// whatever has landed so far:
//   • the eight scenes <book>-1..8.png (a landed render, else the interim art
//     the app shows, so the cut is never empty), each held with a slow
//     Ken Burns move and a crossfade into the next;
//   • the narration narration/<book>-pN.m4a under each page when it exists
//     (silence of the page's length where it does not), so the picture runs
//     to the voice, not the voice to a guess;
//   • the KJV verse and the guide's caption burned in as captions, from the
//     storybook registry (the Word word for word, never typed here), and the
//     same cues written out as the episode's WebVTT, timed to the cut;
//   • a poster frame from page 3.
// Output: <out>/<book>.mp4 (1920x1080, H.264 + AAC), <book>-poster.jpg,
// <book>.en.vtt, and a sidecar <book>.cut.json saying what each page was
// made from, so a cut from interim art is never mistaken for the finished
// film. Nothing here publishes anything: drop the outputs into
// app/public/lovecorner/kids/episodes/ (or the NAS road) when they are the
// episode you want children to watch.
//
//   node scripts/kids-make-episode.mjs jonah [outDir] [--seconds 12] [--size 1920x1080]
// =============================================================================
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIDS = join(ROOT, 'app', 'public', 'lovecorner', 'kids');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const FONT_SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf';
const FONT_SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

const args = process.argv.slice(2);
const bookId = args.find((a) => !a.startsWith('--')) || 'jonah';
const outDir = resolve(args.filter((a) => !a.startsWith('--'))[1] || join(ROOT, 'episodes-out'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const PAGE_SECONDS = Number(opt('seconds', 12));
const [W, H] = String(opt('size', '1920x1080'))
  .split('x')
  .map((n) => Number(n));
const FADE = 0.8;

/** The storybook registry, imported as plain ESM (it carries no JSON import). */
async function loadStorybook(id) {
  const mod = await import(pathToFileURL(join(ROOT, 'app', 'src', 'lib', 'kids', 'storybooks.js')).href);
  return mod.storybookById(id);
}

/** A verse (or range) of the in-repo KJV, word for word. */
function verseText(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`unparseable reference ${ref}`);
  const file = m[1].replace(/\s+/g, '');
  const book = JSON.parse(readFileSync(join(KJV, `${file}.json`), 'utf8'));
  const ch = book.chapters[Number(m[2]) - 1];
  const a = Number(m[3]);
  const b = Number(m[4] || a);
  const out = [];
  for (let v = a; v <= b; v += 1) out.push(ch[v - 1]);
  return out.join(' ');
}

/** Seconds of an audio file, by ffprobe. */
function durationOf(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file], { encoding: 'utf8' });
  const d = Number(String(r.stdout).trim());
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/** The picture for a page: its landed render, else the interim art the app shows. */
function sceneFile(book, n) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const f = join(KIDS, `${book.id}-${n}.${ext}`);
    if (existsSync(f)) return { file: f, landed: true };
  }
  return { file: join(KIDS, 'bible-open.png'), landed: false };
}

/** The recording for a page, or null. */
function narrationFile(book, n) {
  for (const ext of ['m4a', 'mp3', 'ogg', 'wav']) {
    const f = join(KIDS, 'narration', `${book.id}-p${n}.${ext}`);
    if (existsSync(f)) return f;
  }
  return null;
}

const ts = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toFixed(3).padStart(6, '0');
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec}`;
};
/** Wrap a line for a drawtext box at this width (about 48 characters a line at 1080p). */
function wrap(text, max = 46) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur = `${cur} ${w}`;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.join('\n');
}
const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/%/g, '\\%');

async function main() {
  if (!existsSync(FONT_SERIF) || !existsSync(FONT_SANS)) throw new Error('DejaVu fonts are not installed; drawtext needs them');
  const book = await loadStorybook(bookId);
  if (!book) throw new Error(`no storybook ${bookId}`);
  mkdirSync(outDir, { recursive: true });
  const work = join(outDir, `.work-${bookId}`);
  mkdirSync(work, { recursive: true });

  // One clip per page: picture with a slow move, the verse and the caption burned in, the narration (or silence) under it.
  const pages = [];
  let t = 0;
  book.pages.forEach((p, i) => {
    const n = i + 1;
    const scene = sceneFile(book, n);
    const audio = narrationFile(book, n);
    const seconds = audio ? Math.max(4, durationOf(audio) + 0.6) : PAGE_SECONDS;
    const verse = verseText(p.ref);
    const clip = join(work, `page-${n}.mp4`);
    const frames = Math.round(seconds * 30);
    const zoom = n % 2 ? 'zoom+0.0006' : 'if(eq(on,1),1.12,zoom-0.0006)';
    const vf = [
      `scale=${W * 1.25}:-2`,
      `zoompan=z='${zoom}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=30`,
      `drawbox=x=0:y=ih-ih*0.34:w=iw:h=ih*0.34:color=black@0.55:t=fill`,
      `drawtext=fontfile=${FONT_SERIF}:text='${esc(wrap(`"${verse}"`, 60))}':fontcolor=white:fontsize=${Math.round(H * 0.037)}:line_spacing=10:x=(w-text_w)/2:y=h*0.68`,
      `drawtext=fontfile=${FONT_SANS}:text='${esc(wrap(p.caption, 64))}':fontcolor=0xFFE08A:fontsize=${Math.round(H * 0.03)}:line_spacing=8:x=(w-text_w)/2:y=h*0.86`,
      `drawtext=fontfile=${FONT_SANS}:text='${esc(`${p.ref} · KJV`)}':fontcolor=0xFFB020:fontsize=${Math.round(H * 0.022)}:x=w*0.04:y=h*0.955`,
      `format=yuv420p`,
    ].join(',');
    const inputs = ['-loop', '1', '-t', String(seconds), '-i', scene.file];
    if (audio) inputs.push('-i', audio);
    else inputs.push('-f', 'lavfi', '-t', String(seconds), '-i', 'anullsrc=r=44100:cl=mono');
    execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      ...inputs,
      '-vf',
      vf,
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '20',
      '-r',
      '30',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-shortest',
      clip,
    ]);
    pages.push({
      n,
      ref: p.ref,
      caption: p.caption,
      verse,
      scene: scene.file.replace(`${KIDS}/`, ''),
      landed: scene.landed,
      narration: audio ? audio.replace(`${KIDS}/`, '') : null,
      seconds,
      start: t,
    });
    t += seconds;
  });

  // Crossfade the pages into one film.
  const list = pages.map((p) => join(work, `page-${p.n}.mp4`));
  const filter = [];
  let offset = 0;
  let last = '[0:v]';
  let lastA = '[0:a]';
  for (let i = 1; i < list.length; i += 1) {
    offset += pages[i - 1].seconds - FADE;
    const v = i === list.length - 1 ? '[v]' : `[v${i}]`;
    const a = i === list.length - 1 ? '[a]' : `[a${i}]`;
    filter.push(`${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}${v}`);
    filter.push(`${lastA}[${i}:a]acrossfade=d=${FADE}${a}`);
    last = v;
    lastA = a;
  }
  const film = join(outDir, `${bookId}.mp4`);
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    ...list.flatMap((f) => ['-i', f]),
    '-filter_complex',
    filter.join(';'),
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '20',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    film,
  ]);

  // The poster: page 3's frame two seconds in.
  const poster = join(outDir, `${bookId}-poster.jpg`);
  const page3Start = pages[2] ? pages[2].start - 2 * FADE + 2 : 2;
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-ss',
    String(Math.max(0, page3Start)),
    '-i',
    film,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    poster,
  ]);

  // The captions, timed to the cut (each page's verse then its caption), and the sidecar.
  const vtt = ['WEBVTT', ''];
  let cue = 0;
  let at = 0;
  for (const p of pages) {
    const half = p.seconds * 0.62;
    cue += 1;
    vtt.push(String(cue), `${ts(at + 0.2)} --> ${ts(at + half)}`, p.verse, '');
    cue += 1;
    vtt.push(String(cue), `${ts(at + half)} --> ${ts(at + p.seconds - 0.2)}`, p.caption, '');
    at += p.seconds - FADE;
  }
  writeFileSync(join(outDir, `${bookId}.en.vtt`), `${vtt.join('\n')}\n`);
  const sidecar = {
    book: bookId,
    title: book.title,
    madeAt: new Date().toISOString(),
    seconds: Number((at + FADE).toFixed(2)),
    landedScenes: pages.filter((p) => p.landed).length,
    narratedPages: pages.filter((p) => p.narration).length,
    pages,
    honest: pages.every((p) => p.landed && p.narration)
      ? 'every page cut from its landed scene and its recording'
      : 'a DRAFT cut: some pages use the interim art and/or silence; not the finished episode',
  };
  writeFileSync(join(outDir, `${bookId}.cut.json`), `${JSON.stringify(sidecar, null, 2)}\n`);
  const size = statSync(film).size;
  console.log(
    `kids-make-episode: ${film} (${(size / 1048576).toFixed(1)} MiB, ${sidecar.seconds}s) · scenes landed ${sidecar.landedScenes}/8 · narrated ${sidecar.narratedPages}/8 · ${sidecar.honest}`
  );
  console.log(`  poster ${poster}\n  captions ${join(outDir, `${bookId}.en.vtt`)}\n  sidecar ${join(outDir, `${bookId}.cut.json`)}`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((e) => {
    console.error(`kids-make-episode: ${e.message}`);
    process.exit(1);
  });
}
