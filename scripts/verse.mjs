#!/usr/bin/env node
// =============================================================================
// verse — print the exact KJV text of a reference, from the corpus on disk
// =============================================================================
// The author never types a verse (DR-1468). Ask the corpus:
//
//   node scripts/verse.mjs "Romans 2:14-15"
//   node scripts/verse.mjs "Psalm 23:1" "Song of Solomon 2:4"
//   node scripts/verse.mjs --quote "Joel 2:28"   # the house quotation form
//
// Exit 1, and nothing printed to stdout, for a reference the corpus does not
// hold: a verse that cannot be read is never guessed.
// =============================================================================
import { fileURLToPath } from 'node:url';
import { parseRef, formatRef, kjvText } from './lib/kjv.mjs';

/** The house quotation form the Living Lessons use: "text" (Ref). */
export function quoteOf(ref) {
  const r = parseRef(ref);
  return `"${kjvText(r)}" (${formatRef(r)})`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const quote = args.includes('--quote');
  const refs = args.filter((a) => a !== '--quote');
  if (!refs.length) {
    console.error('usage: node scripts/verse.mjs [--quote] "Book C:V[-V]" ...');
    process.exit(2);
  }
  let failed = 0;
  for (const ref of refs) {
    try {
      console.log(quote ? quoteOf(ref) : kjvText(ref));
    } catch (err) {
      console.error(`verse: ${err.message}`);
      failed += 1;
    }
  }
  process.exit(failed ? 1 : 0);
}
