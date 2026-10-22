#!/usr/bin/env node
// =============================================================================
// research-create-text.mjs -- what an answered research item files (DR-1202)
// =============================================================================
// scripts/research-create.sh reads one answered item from the live database
// into files (never a log) and asks this script what to file. The words come
// from app/src/lib/research-create.js -- the SAME module the Research section
// reads -- so what a row is filed with and what the app shows cannot drift.
//
//   node scripts/research-create-text.mjs --id <uuid> --item F --tags F --answer F [--reading F]
//
// Prints one JSON line: { intents: [...], lesson: "<body>"|null, build: "<body>"|null }
// Exits non-zero with the reason on stderr when the inputs cannot be read.
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';
import { researchIntents, lessonRequestBody, buildRequestBody } from '../app/src/lib/research-create.js';
import { parseReading } from '../app/src/lib/research-items.js';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : '';
};
const read = (p) => (p && existsSync(p) ? readFileSync(p, 'utf8') : '');

const id = opt('id');
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
  process.stderr.write('research-create-text: --id must be a uuid\n');
  process.exit(2);
}
let tags = [];
try {
  tags = JSON.parse(read(opt('tags')) || '[]');
} catch {
  process.stderr.write('research-create-text: the tags file is not JSON\n');
  process.exit(2);
}
const itemBody = read(opt('item'));
const answer = read(opt('answer'));
if (!answer.trim()) {
  process.stderr.write('research-create-text: no answer to file from\n');
  process.exit(3);
}
const reading = parseReading(read(opt('reading')));
const intents = researchIntents(itemBody, tags);
const ctx = { itemId: id, itemBody, answer, reading };
process.stdout.write(`${JSON.stringify({
  intents,
  lesson: intents.includes('lesson') ? lessonRequestBody(ctx) : null,
  build: intents.includes('build') ? buildRequestBody(ctx) : null,
})}\n`);
