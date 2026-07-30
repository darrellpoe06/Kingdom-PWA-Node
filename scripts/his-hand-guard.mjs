#!/usr/bin/env node
// =============================================================================
// his-hand-guard — a review doc cannot call work "his hand" without proving no
// team channel drives it (DR-0108 capability re-sync; COMPREHENSIVE-REVIEW-
// STANDARD dimension 5). The machine check for the 2026-07-30 miss: a NAS
// bearer rotation was dated "(your hand)" while the nas-bootstrap remote-hands
// channel had driven that exact SSH path for weeks. "Latest version" must
// include latest-of-what-we-can-build, not only latest-files.
//
// RULE: in the review ledgers (docs/reviews/REVIEWS.md, docs/99-session-notes/),
// any line that classifies work as human-only — "his hand", "your hand",
// "by hand", "manual step", "needs Darrell" — must, IN THE SAME SENTENCE,
// justify WHY no channel drives it with one of the lawful-tail tokens:
//   secret-onto-device | secret value | physical device | dashboard | console |
//   github settings | bright line | undecided | value only | ConnectBot |
//   channel-drivable (naming that a channel WAS considered)
// A bare "his hand" with no channel justification FAILS — that is the fake
// boundary this guard exists to catch.
//
// PROVEN-TO-CATCH (DR-0076 Section 3): the unit test feeds a bare "your hand"
// line and REQUIRES a finding, and a justified line and requires none.
// Scans only NEW/edited review prose is impractical here, so it scans the
// ledgers whole but only lines that both (a) assert human-only AND (b) carry a
// re-review date or a queue/carry marker — i.e. classification lines, not
// narrative retellings of this very rule.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const HUMAN_ONLY = /\b(his hand|your hand|by hand|manual(?:ly)? (?:step|paste|run)|needs? darrell|darrell(?:['\u2019]s|s)? (?:hand|keyboard))\b/i;
const LAWFUL_TAIL = /\b(secret(?:[- ]onto[- ]device| value| onto (?:a |the )?(?:physical )?device)|physical device|type[sd]? (?:it |the (?:new )?(?:token|value|secret) )?(?:on|into|onto)|dashboard|console|Studio|github settings|bright line|undecided|value only|ConnectBot|channel[- ]driv|no channel (?:can |drives)|remote[- ]hands)\b/i;
// A line is a live CLASSIFICATION (subject to the rule) only if it carries the
// DR-0240 active-carry marker `re-review:` — that is what marks a forward
// parking decision, as opposed to immutable historical narrative in a dated
// session note. Narrative retellings that merely mention "by hand" are exempt.
const CLASSIFIES = /re-review:/i;
// The rule's OWN definition text names "his hand" to forbid it — exempt lines
// that also cite the guard/standard so this file and the standard don't self-trip.
const RULE_DEFINITION = /\b(his-hand-guard|COMPREHENSIVE-REVIEW-STANDARD|DR-0108 (?:challenge|capability)|fake boundary|dimension 5)\b/i;

export function findUnjustifiedHisHand(text, sourceLabel = '') {
  const out = [];
  const lines = String(text || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!HUMAN_ONLY.test(line)) continue;
    if (!CLASSIFIES.test(line)) continue;      // narrative, not a parking decision
    if (RULE_DEFINITION.test(line)) continue;   // the rule stating itself
    if (LAWFUL_TAIL.test(line)) continue;       // justified against the channels
    out.push({ source: sourceLabel, line: i + 1, text: line.trim().slice(0, 160) });
  }
  return out;
}

function ledgerFiles() {
  const files = [];
  const reviews = join(ROOT, 'docs/reviews/REVIEWS.md');
  if (existsSync(reviews)) files.push(reviews);
  const notes = join(ROOT, 'docs/99-session-notes');
  if (existsSync(notes)) for (const f of readdirSync(notes)) if (f.endsWith('.md')) files.push(join(notes, f));
  return files;
}

function main() {
  const findings = [];
  for (const f of ledgerFiles()) {
    findings.push(...findUnjustifiedHisHand(readFileSync(f, 'utf8'), f.replace(ROOT + '/', '')));
  }
  if (findings.length === 0) {
    console.log('his-hand-guard: OK — every human-only classification names why no channel drives it (DR-0108).');
    process.exit(0);
  }
  console.error('his-hand-guard: FAIL — a review line parks work as human-only WITHOUT the DR-0108 channel justification.');
  console.error('Run the DR-0108 challenge: name each channel (remote-hands / db-lane / deploy) and why none drives it,');
  console.error('or BUILD it (channel-drivable = buildable now). Lawful human tail = secret-onto-device / dashboard / bright line.\n');
  for (const x of findings) console.error(`  ${x.source}:${x.line}  ${x.text}`);
  process.exit(1);
}

if (process.argv[1] && process.argv[1].endsWith('his-hand-guard.mjs')) main();
