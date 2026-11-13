#!/usr/bin/env node
// =============================================================================
// unfilled-verse-token-guard — no lesson ships holding a token (DR-1468)
// =============================================================================
// scripts/new-lesson.mjs writes a lesson skeleton with two kinds of token:
//   {{kjv:Ref}} / {{kjv:Ref|part}}  a quotation scripts/fill-verses.mjs fills
//                                   from app/public/bible/kjv;
//   {{write:...}}                   prose the author has not written yet.
// Either one reaching a reader is a hollow lesson: a brace pair where the Word
// or the teaching should be. This guard reads every source file under app/src
// (tests aside, where tokens are fixtures) and fails on any token left.
// Wired into `verify:gates` and ci.yml's guards leg.
// =============================================================================
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'app', 'src');
export const UNFILLED = /\{\{(kjv|write):[^}]*\}\}/g;

/** Pure. Every token left in a source text, with its line number. */
export function unfilledTokens(src) {
  const out = [];
  const text = String(src || '');
  UNFILLED.lastIndex = 0;
  for (let m = UNFILLED.exec(text); m; m = UNFILLED.exec(text)) {
    out.push({ line: text.slice(0, m.index).split('\n').length, token: m[0].slice(0, 80), kind: m[1] });
  }
  return out;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {
      if (e !== '__tests__' && e !== 'node_modules') walk(p, out);
    } else if (/\.(js|jsx|mjs|json)$/.test(e) && !/\.test\./.test(e)) out.push(p);
  }
  return out;
}

/** Every unfilled token under app/src, as "file:line token". */
export function scan(root = SRC) {
  const found = [];
  for (const f of walk(root)) {
    for (const t of unfilledTokens(readFileSync(f, 'utf8'))) found.push(`${relative(ROOT, f)}:${t.line} ${t.token}`);
  }
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const found = scan();
  if (found.length) {
    console.error(`unfilled-verse-token-guard: ${found.length} token(s) left in shipped source:`);
    for (const f of found) console.error(`  ${f}`);
    console.error('Fill {{kjv:...}} with `node scripts/fill-verses.mjs <file>`; write the {{write:...}} prose by hand.');
    process.exit(1);
  }
  console.log('unfilled-verse-token-guard: OK — no {{kjv:}} or {{write:}} token left under app/src.');
}
