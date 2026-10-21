#!/usr/bin/env node
// =============================================================================
// research-answer-text.mjs -- the research road's JSON answer, as the text a row
// carries (DR-1169)
// =============================================================================
// .github/workflows/research-inbox.yml asks POST /ask on the NAS and gets back
// the forwarder's JSON. This renders it to the plain text the agent_inbox answer
// row holds, in the shape lib/research-items.js parses back: the answer, a blank
// line, `Sources:`, then one URL per line.
//
// IT REFUSES RATHER THAN RENDERING A HALF ANSWER. A non-200, an empty answer, or
// an answer that has stopped saying verified:false exits non-zero with the reason
// on stderr, so the caller records a FAILURE with a why instead of writing a row
// that looks answered (DR-0076: a green check must mean something).
//
// verified:false IS CHECKED HERE TOO. research.js asserts it, research-items.js
// re-asserts it as a constant, and this refuses an answer whose own road stopped
// stamping it -- the same check research-health.yml makes. Three places, because
// presenting a model's answer as established fact is the one failure that would
// matter to a reader.
//
// Only http(s) source URLs survive, so a link a row carries can never be
// javascript: or file:.
// =============================================================================
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  process.stderr.write('usage: research-answer-text.mjs <ask.json>\n');
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
  process.stderr.write(`the road answered ${body.code ?? 'nothing'}${body.error ? `: ${String(body.error).slice(0, 160)}` : ''}\n`);
  process.exit(1);
}

const answer = String(body.answer || '').trim();
if (answer.length < 20) {
  process.stderr.write('the answer came back empty\n');
  process.exit(1);
}

// The road marks every answer unverified. If it ever stops, that is a change to
// how honest the answer is, and it stops here rather than being written down.
if (body.verified !== false) {
  process.stderr.write('the answer stopped saying it is unverified -- refusing to write it\n');
  process.exit(1);
}

const seen = new Set();
const sources = [];
for (const s of Array.isArray(body.sources) ? body.sources : []) {
  const url = String((s && s.url) || '').trim();
  if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
  seen.add(url);
  sources.push(url);
}

const out = sources.length
  ? `${answer}\n\nSources:\n${sources.join('\n')}\n`
  : `${answer}\n`;
process.stdout.write(out);
