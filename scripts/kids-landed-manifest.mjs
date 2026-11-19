#!/usr/bin/env node
// =============================================================================
// kids-landed-manifest — what is on disk under app/public/lovecorner/kids/
// =============================================================================
// Darrell, 2026-11-18 (J2 of the Jonah adventure, DR-1527): the storybook
// receives its eight illustrations, the narration its eight recordings and
// the Theater its episode AS FILES, dropped into the kids folder with the
// exact names the production brief gives. Nothing should need a code change
// to take one: the registry reads this manifest, so a scene that is on disk
// is landed, a page whose recording is on disk is narrated, an episode
// whose video is on disk is published, an episode with a poster and no video
// is in production.
//
//   node scripts/kids-landed-manifest.mjs           # write app/src/lib/kids/landed.json
//   node scripts/kids-landed-manifest.mjs --check   # exit 1 when the file is stale
//
// `npm run build` writes it first (prebuild), so the served app always
// matches the folder; kids-landed-manifest.test.js refuses a stale commit.
// The manifest carries names and byte sizes only, never content.
// =============================================================================
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const KIDS_DIR = join(ROOT, 'app', 'public', 'lovecorner', 'kids');
export const MANIFEST = join(ROOT, 'app', 'src', 'lib', 'kids', 'landed.json');
/** The kinds of file the kids folder may carry; anything else is ignored (and named). */
export const KINDS = Object.freeze({
  image: ['png', 'jpg', 'jpeg', 'webp'],
  audio: ['m4a', 'mp3', 'ogg', 'wav'],
  video: ['mp4', 'webm'],
  captions: ['vtt'],
});
const ALL = Object.values(KINDS).flat();

/** 'image' | 'audio' | 'video' | 'captions' | null for a file name. */
export function kindOf(name) {
  const ext = String(name).toLowerCase().split('.').pop();
  for (const [kind, exts] of Object.entries(KINDS)) if (exts.includes(ext)) return kind;
  return null;
}

/** The manifest for a folder: every file of a known kind, by its path under the folder, with its byte size. */
export function scan(dir = KIDS_DIR) {
  const files = {};
  const ignored = [];
  const walk = (d) => {
    for (const name of readdirSync(d).sort()) {
      const full = join(d, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = relative(dir, full).split('\\').join('/');
      const kind = kindOf(name);
      if (!kind || !ALL.includes(name.toLowerCase().split('.').pop())) {
        ignored.push(rel);
        continue;
      }
      files[rel] = { kind, bytes: st.size };
    }
  };
  walk(dir);
  return { folder: 'app/public/lovecorner/kids', files, ignored };
}

export function serialize(manifest) {
  return `${JSON.stringify({ folder: manifest.folder, files: manifest.files }, null, 2)}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  const fresh = serialize(scan());
  let current = '';
  try {
    current = readFileSync(MANIFEST, 'utf8');
  } catch {
    current = '';
  }
  const n = Object.keys(JSON.parse(fresh).files).length;
  if (check) {
    if (current !== fresh) {
      console.error(
        `kids-landed-manifest: STALE — app/src/lib/kids/landed.json does not match the kids folder (${n} file(s) on disk). Run: node scripts/kids-landed-manifest.mjs`
      );
      process.exit(1);
    }
    console.log(`kids-landed-manifest: OK — ${n} file(s), the manifest matches the folder.`);
    return;
  }
  writeFileSync(MANIFEST, fresh);
  console.log(`kids-landed-manifest: wrote ${n} file(s) to app/src/lib/kids/landed.json${current === fresh ? ' (unchanged)' : ''}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
