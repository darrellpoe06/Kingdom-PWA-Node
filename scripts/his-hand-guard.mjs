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

// NOTE the `[- ]` (fixed 2026-08-14). This read `his hand` / `your hand` with a
// literal space, so it never matched `his-hand` \u2014 which is the HYPHENATED form
// the COMPREHENSIVE-REVIEW-STANDARD itself uses in dimension 5, and the form
// runbooks actually write. The guard was blind to the canonical spelling of its
// own subject: infra/device-availability/RUNBOOK.md said "his-hand, on-site"
// and scanned clean.
const HUMAN_ONLY = /\b(his[- ]hand|your[- ]hand|by[- ]hand|manual(?:ly)? (?:step|paste|run)|needs? darrell|darrell(?:['\u2019]s|s)? (?:hand|keyboard))\b/i;
const LAWFUL_TAIL = /\b(secret(?:[- ]onto[- ]device| value| onto (?:a |the )?(?:physical )?device)|physical device|type[sd]? (?:it |the (?:new )?(?:token|value|secret) )?(?:on|into|onto)|dashboard|console|Studio|github settings|bright line|undecided|value only|ConnectBot|channel[- ]driv|no channel (?:can |drives)|remote[- ]hands)\b/i;
// A line is a live CLASSIFICATION (subject to the rule) only if it carries the
// DR-0240 active-carry marker `re-review:` — that is what marks a forward
// parking decision, as opposed to immutable historical narrative in a dated
// session note. Narrative retellings that merely mention "by hand" are exempt.
const CLASSIFIES = /re-review:/i;
// The rule's OWN definition text names "his hand" to forbid it — exempt lines
// that also cite the guard/standard so this file and the standard don't self-trip.
const RULE_DEFINITION = /\b(his-hand-guard|COMPREHENSIVE-REVIEW-STANDARD|DR-0108 (?:challenge|capability)|fake boundary|dimension 5)\b/i;

// A RUNBOOK is judged at DOCUMENT level, not line level (added 2026-08-14).
//
// The ledger rule above keys on `re-review:` because that is what marks a
// forward parking decision in a review. A runbook never writes `re-review:`
// beside a manual step — it just hands the human a block to paste — so applying
// the line rule to runbooks catches nothing. Widening the file list without
// widening the RULE would have been a green that proves nothing, which is the
// same theater this guard exists to prevent.
//
// The real question for a runbook is document-level: it tells a human to run
// commands by hand, so SOMEWHERE in it, has the DR-0108 challenge been run —
// are the channels named and ruled out, or is the human tail one of the lawful
// kinds (a secret onto a device, a dashboard click, an undecided bright line)?
//
// Born from infra/device-availability/RUNBOOK.md, which shipped six layers of
// paste-ready PowerShell for towers the remote-hands channel can already reach
// over the tailnet — a channel proven twice that same day.
const PASTE_BLOCK = /```(?:powershell|ps1|pwsh|sh|bash|shell)\b/i;

export function findRunbookWithoutChannelChallenge(text, sourceLabel = '') {
  const src = String(text || '');
  // Only runbooks that actually hand over commands AND frame them as human work.
  if (!PASTE_BLOCK.test(src)) return [];
  if (!HUMAN_ONLY.test(src)) return [];
  if (RULE_DEFINITION.test(src)) return [];
  // The challenge counts as run if the doc names a channel or a lawful tail
  // anywhere — this is a "did you think about it at all" gate, deliberately
  // generous, because a noisy gate on every README gets the guard switched off.
  if (LAWFUL_TAIL.test(src)) return [];
  const line = src.split('\n').findIndex((l) => HUMAN_ONLY.test(l)) + 1;
  return [{
    source: sourceLabel,
    line: line || 1,
    text: 'runbook hands over manual commands without running the DR-0108 channel challenge '
      + '(name remote-hands / db-lane / deploy and why none drives it, or build it)',
  }];
}

export function findUnjustifiedHisHand(text, sourceLabel = '') {
  const out = [];
  const lines = String(text || '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!HUMAN_ONLY.test(line)) continue;
    if (!CLASSIFIES.test(line)) continue;      // narrative, not a parking decision
    if (RULE_DEFINITION.test(line)) continue;   // the rule stating itself
    if (LAWFUL_TAIL.test(line)) continue;       // justified against the channels
    // CLOSED HISTORY IS NOT A PARKING DECISION (added 2026-08-14, with the
    // hyphen fix above). The ledger is append-only narrative, and its entries
    // are single enormous markdown lines: REVIEWS.md:103 retells a by-hand
    // classification that was FOUND AND CLOSED in the same breath ("documented
    // as UI-only-by-hand while root-crontab-over-SSH worked... both closed"),
    // and happens to carry a `re-review:` for a different item on the same
    // line. Flagging that is crying wolf on a record of the rule WORKING —
    // and a guard that fails on immutable history gets switched off, which the
    // COMPREHENSIVE-REVIEW-STANDARD names as its own failure mode.
    if (/\b(both closed|now closed|closed:|was closed|now carries|overtaken|fixed this record|correction applied)\b/i.test(line)) continue;
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

  // RUNBOOKS TOO (added 2026-08-14). The ledgers are where a review RECORDS a
  // human-only classification; a runbook is where it gets DELIVERED, and the
  // delivery is what actually costs Darrell an afternoon. This guard read green
  // the same session infra/device-availability/RUNBOOK.md shipped six layers of
  // paste-ready PowerShell marked "his-hand, on-site" — for towers reachable by
  // the remote-hands channel, a channel proven twice that same day. The green
  // was vacuous because infra/ was never in scope.
  //
  // COMPREHENSIVE-REVIEW-STANDARD dimension 5 is explicit: run the DR-0108
  // challenge BEFORE classifying anything as his-hand, and "if a channel CAN
  // drive it, it is BUILDABLE NOW." A gate that only watches where the claim is
  // written, and not where it is handed over, misses the expensive half.
  for (const dir of ['infra', 'docs/00-foundations/_root']) {
    const base = join(ROOT, dir);
    if (!existsSync(base)) continue;
    const walk = (d) => {
      let entries = [];
      try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(d, e.name);
        if (e.isDirectory()) {
          if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
          walk(full);
        } else if (/^(README|RUNBOOK)[^/]*\.md$/i.test(e.name)) {
          files.push(full);
        }
      }
    };
    walk(base);
  }
  return files;
}

function main() {
  const findings = [];
  for (const f of ledgerFiles()) {
    const rel = f.replace(ROOT + '/', '');
    const src = readFileSync(f, 'utf8');
    findings.push(...findUnjustifiedHisHand(src, rel));
    if (/^(infra|docs\/00-foundations)\//.test(rel)) {
      findings.push(...findRunbookWithoutChannelChallenge(src, rel));
    }
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
