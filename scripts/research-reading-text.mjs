#!/usr/bin/env node
// =============================================================================
// research-reading-text.mjs -- the road's JSON reading, as the text a row carries
// (DR-1199)
// =============================================================================
// .github/workflows/research-inbox.yml asks POST /read on the NAS with the
// words an answer holds and the sender's note, and gets back the forwarder's
// JSON. This renders it to the plain text a `research-reading` child row holds,
// in the shape lib/research-items.js parses back (parseReading):
//
//   Reading:
//   What it is: ...
//   Opportunities:
//   - ...
//   Constraints:
//   - ...
//   Next step: ...
//   Lands: learn
//
// IT REFUSES RATHER THAN RENDERING A HALF READING: a non-200, a reading with no
// "what", or one that has stopped saying verified:false exits non-zero with the
// reason on stderr, so the caller records a failure with a why (DR-0076).
// =============================================================================
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  process.stderr.write('usage: research-reading-text.mjs <read.json>\n');
  process.exit(2);
}
let body;
try {
  body = JSON.parse(readFileSync(path, 'utf8') || '{}');
} catch (e) {
  process.stderr.write(`the road's reply was not JSON: ${String(e.message).slice(0, 120)}\n`);
  process.exit(1);
}
if (Number(body.code) !== 200) {
  process.stderr.write(`the road answered ${body.code ?? 'nothing'}${body.error ? `: ${String(body.error).slice(0, 200)}` : ''}\n`);
  process.exit(1);
}
if (body.verified !== false) {
  process.stderr.write('the reading stopped saying it is unverified -- refusing to write it\n');
  process.exit(1);
}
const r = body.reading && typeof body.reading === 'object' ? body.reading : null;
const what = r ? String(r.what || '').trim() : '';
if (!what) {
  process.stderr.write('the reading came back without saying what the material is\n');
  process.exit(1);
}
const line = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const list = (v) => (Array.isArray(v) ? v.map(line).filter(Boolean).slice(0, 5) : []);
const lands = /^[a-z-]{1,24}$/.test(String(r.lands || '')) ? String(r.lands) : 'unplaced';
const out = [
  'Reading:',
  `What it is: ${line(what)}`,
  'Opportunities:',
  ...list(r.opportunities).map((x) => `- ${x}`),
  'Constraints:',
  ...list(r.constraints).map((x) => `- ${x}`),
  `Next step: ${line(r.next) || 'none named'}`,
  `Lands: ${lands}`,
  ...(body.truncated === true ? ['(The words were longer than the road reads at once; the reading covers their first part.)'] : []),
];
process.stdout.write(`${out.join('\n')}\n`);
