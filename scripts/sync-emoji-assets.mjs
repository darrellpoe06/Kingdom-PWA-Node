#!/usr/bin/env node
// =============================================================================
// sync-emoji-assets — materialize the curated emoji set into app/public/emoji/
// =============================================================================
// Copies every emoji named in app/src/lib/emoji.js (CURATED_EMOJI) from the
// pinned @twemoji/svg package into app/public/emoji/, where the app serves it
// self-hosted (no CDN at runtime — sovereignty). Twemoji graphics are
// CC-BY 4.0 (credited in the app's About).
//
// PROVEN-TO-CATCH (DR-0076): a curated emoji whose asset does not exist in the
// package (a typo, a wrong filename rule, a Twemoji version gap) HARD-FAILS
// this script — a broken image can never ship silently. Run after editing the
// curated list:  node scripts/sync-emoji-assets.mjs
// =============================================================================
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app/node_modules/@twemoji/svg');
const DEST = join(ROOT, 'app/public/emoji');

const { CURATED_EMOJI, emojiToName } = await import(join(ROOT, 'app/src/lib/emoji.js'));

if (!existsSync(SRC)) {
  console.error('sync-emoji-assets: @twemoji/svg not installed — run npm install in app/ first.');
  process.exit(1);
}
mkdirSync(DEST, { recursive: true });

const names = [...new Set(CURATED_EMOJI.map(emojiToName).filter(Boolean))];
const missing = [];
let copied = 0;
for (const name of names) {
  const from = join(SRC, `${name}.svg`);
  if (!existsSync(from)) { missing.push(name); continue; }
  copyFileSync(from, join(DEST, `${name}.svg`));
  copied += 1;
}

if (missing.length) {
  console.error(`sync-emoji-assets: ${missing.length} curated emoji have NO asset in @twemoji/svg — fix the character or the filename rule:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const onDisk = readdirSync(DEST).filter((f) => f.endsWith('.svg')).length;
console.log(`sync-emoji-assets: OK — ${copied} curated emoji materialized (${onDisk} svg files in app/public/emoji/).`);
