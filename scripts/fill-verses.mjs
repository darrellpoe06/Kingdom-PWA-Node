#!/usr/bin/env node
// =============================================================================
// fill-verses — the author writes a token, the corpus writes the verse (DR-1468)
// =============================================================================
// A lesson file carries tokens where Scripture is quoted:
//
//   {{kjv:Romans 2:14-15}}                   -> "For when the Gentiles, ... one another;)" (Romans 2:14-15)
//   {{kjv:Joel 2:28|your old men shall dream dreams}}
//                                            -> "your old men shall dream dreams" (Joel 2:28)
//
// The second form quotes PART of a verse; the part is checked against the verse
// and refused unless it is there word for word (only its first letter may
// change case, to open or sit inside our sentence -- the same allowance the
// catalog's verse gate makes). The output is the house form the Living Lessons
// already use: the words in double quotes, then the reference in parentheses.
//
//   node scripts/fill-verses.mjs app/src/lib/living-lessons/ll302-x.js [more ...]
//   node scripts/fill-verses.mjs --check <file ...>   # exit 1 if any token would change
//   node scripts/fill-verses.mjs --no-format <file ...>  # fill, leave the layout alone
//
// A filled file that main does not hold yet is then Prettier-formatted, the way
// format-guard checks every file added since main (DR-1477): filling changes
// line lengths and quoting, which used to cost a hand `format-guard --fix`. A
// file main already holds is never reformatted (DR-1343's ratchet).
//
// The text is escaped for the string it lands in ('...', "..." or `...`), so a
// filled file still parses. A token that is not inside a string or a comment is
// refused, and nothing in that file is written. After filling, the catalog's
// own gate (scripts/quoted-verse-is-the-verse.mjs via its test) still reads
// every quotation against the verse it names; this tool makes the first draft
// right, the gate keeps it right.
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseRef, formatRef, kjvText } from './lib/kjv.mjs';
import { formatFiles } from './lib/prettier-write.mjs';

export const TOKEN = /\{\{kjv:([^}|]+?)(?:\|([^}]*))?\}\}/g;

/** Pure. For each offset in `src`, the string context it sits in. */
export function contextAt(src, offset) {
  let state = 'code';
  for (let i = 0; i < offset; i += 1) {
    const c = src[i];
    const n = src[i + 1];
    if (state === 'code') {
      if (c === '/' && n === '/') {
        state = 'line';
        i += 1;
      } else if (c === '/' && n === '*') {
        state = 'block';
        i += 1;
      } else if (c === "'" || c === '"' || c === '`') state = c;
    } else if (state === 'line') {
      if (c === '\n') state = 'code';
    } else if (state === 'block') {
      if (c === '*' && n === '/') {
        state = 'code';
        i += 1;
      }
    } else if (c === '\\') {
      i += 1;
    } else if (c === state) {
      state = 'code';
    }
  }
  return state;
}

/** Pure. Escape text for the context it is written into. */
export function escapeFor(ctx, text) {
  if (ctx === "'") return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  if (ctx === '"') return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (ctx === '`') return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return text; // a comment: written as is
}

/** The quotation one token stands for, or throws with the reason. */
export function quotationFor(refText, fragment) {
  const r = parseRef(refText);
  const verse = kjvText(r);
  let words = verse;
  if (fragment !== undefined) {
    const want = fragment.trim();
    if (!want) throw new Error(`{{kjv:${refText}|}} names an empty part`);
    const at = verse.indexOf(want);
    const flipped = want[0] === want[0].toUpperCase() ? want[0].toLowerCase() + want.slice(1) : want[0].toUpperCase() + want.slice(1);
    if (at >= 0) words = want;
    else if (verse.indexOf(flipped) >= 0)
      words = want; // only the opening letter differs
    else throw new Error(`"${want}" is not in ${formatRef(r)}, which reads: ${verse}`);
  }
  return `"${words}" (${formatRef(r)})`;
}

/** Pure apart from reading the corpus. Returns { text, filled, errors }. */
export function fillVerses(src) {
  const errors = [];
  let filled = 0;
  const text = String(src).replace(TOKEN, (whole, ref, fragment, offset) => {
    const ctx = contextAt(src, offset);
    if (ctx === 'code') {
      errors.push(`${whole}: sits outside any string or comment`);
      return whole;
    }
    try {
      const q = quotationFor(ref.trim(), fragment);
      filled += 1;
      return escapeFor(ctx === 'line' || ctx === 'block' ? null : ctx, q);
    } catch (err) {
      errors.push(`${whole}: ${err.message}`);
      return whole;
    }
  });
  return { text, filled, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const noFormat = process.argv.includes('--no-format');
  const files = process.argv.slice(2).filter((a) => a !== '--check' && a !== '--no-format');
  const written = [];
  if (!files.length) {
    console.error('usage: node scripts/fill-verses.mjs [--check] <lesson file> ...');
    process.exit(2);
  }
  let bad = 0;
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    const { text, filled, errors } = fillVerses(src);
    if (errors.length) {
      bad += 1;
      console.error(`fill-verses: ${file} — ${errors.length} token(s) refused, nothing written:`);
      for (const e of errors) console.error(`  ${e}`);
      continue;
    }
    if (check) {
      if (filled) {
        bad += 1;
        console.error(`fill-verses --check: ${file} still holds ${filled} unfilled token(s)`);
      }
      continue;
    }
    if (filled) {
      writeFileSync(file, text);
      written.push(file);
    }
    console.log(`fill-verses: ${file} — ${filled} verse(s) filled from app/public/bible/kjv`);
  }
  if (written.length && !noFormat) {
    const fmt = formatFiles(written);
    if (fmt.formatted.length) console.log(`fill-verses: formatted ${fmt.formatted.length} new file(s) with the repo Prettier`);
    if (fmt.skipped.length) console.log(`fill-verses: left the layout of ${fmt.skipped.length} file(s) main already holds`);
    if (!fmt.ok) {
      bad += 1;
      console.error(`fill-verses: the verses are filled but the file is NOT formatted — ${fmt.reason}`);
    }
  }
  process.exit(bad ? 1 : 0);
}
