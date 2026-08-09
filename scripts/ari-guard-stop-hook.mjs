#!/usr/bin/env node
// =============================================================================
// ari-guard-stop-hook — catch the undermining pattern BEFORE it reaches Darrell
// =============================================================================
// Declared by Darrell 2026-07-14: "All obvious questions and answers another
// claude constraint. Ari note and find a solution to this undermining
// behaviour." The pattern DR-0111 forbids but a doc alone can't ENFORCE:
// re-asking work already directed, either/or menus on authorized work, and an
// un-evidenced "done".
//
// THE SOLUTION (not just a note): a Claude Code Stop hook. When Claude finishes
// a reply, this runs the already-built, deterministic ari-integrity-guard
// (app/src/lib/ari-integrity-guard.js) over that exact reply text. If it
// undermines, the hook BLOCKS the stop with the named reason, so Claude revises
// instead of shipping the question Darrell already answered. This wires the
// guard into Claude's LIVE reply path — the one place it was missing (until now
// it only had a passing unit test and ran nowhere).
//
// FAIL-OPEN, ALWAYS: any error (bad stdin, unreadable transcript, guard won't
// import, no assistant text) exits 0 without blocking. A broken guard must
// never gag Claude. Respects `stop_hook_active` so it can never loop.
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const done = () => process.exit(0);

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

// Pull the last assistant *text* out of the JSONL transcript. Tolerant of the
// two shapes the transcript uses (a bare message, or an event wrapping one).
function lastAssistantText(transcriptPath) {
  let lines;
  try { lines = readFileSync(transcriptPath, 'utf8').trim().split('\n'); }
  catch { return ''; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let ev;
    try { ev = JSON.parse(lines[i]); } catch { continue; }
    const msg = ev && (ev.message || ev);
    if (!msg || msg.role !== 'assistant') continue;
    const c = msg.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      const t = c.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
      if (t.trim()) return t;
    }
  }
  return '';
}

// Pull the last USER text out of the transcript. Without this the guard sees
// only Claude's half of the conversation — which is how, on 2026-08-07, it
// flagged a reply for "re-asking permission" moments after Darrell said "Stop
// hijacking my work," and pushed the agent forward over him (DR-0283).
function lastUserText(transcriptPath) {
  let lines;
  try { lines = readFileSync(transcriptPath, 'utf8').trim().split('\n'); }
  catch { return ''; }
  for (let i = lines.length - 1; i >= 0; i--) {
    let ev;
    try { ev = JSON.parse(lines[i]); } catch { continue; }
    const msg = ev && (ev.message || ev);
    if (!msg || msg.role !== 'user') continue;
    const c = msg.content;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) {
      const t = c.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
      if (t.trim()) return t;
    }
  }
  return '';
}

async function main() {
  let input;
  try { input = JSON.parse(readStdin() || '{}'); } catch { return done(); }
  if (input.stop_hook_active) return done();            // never loop
  if (!input.transcript_path) return done();

  const text = lastAssistantText(input.transcript_path);
  if (!text.trim()) return done();

  let checkAriIntegrity;
  try {
    ({ checkAriIntegrity } = await import(
      join(HERE, '..', 'app', 'src', 'lib', 'ari-integrity-guard.js')
    ));
  } catch { return done(); }

  const userText = lastUserText(input.transcript_path);

  let verdict;
  try { verdict = checkAriIntegrity(text, { lastUserText: userText }); } catch { return done(); }
  if (!verdict || verdict.ok) return done();

  const reason = [
    'ari-integrity-guard (DR-0111 / DR-0076) flagged your reply BEFORE it reached Darrell:',
    ...verdict.problems.map((p) => `  - ${p}`),
    '',
    'Do the work; do not re-ask what is already directed or settled. Revise this reply:',
    'make the decision-first move yourself, or attach the evidence for the "done".',
    '',
    'Proceed AS-IS only if this is a genuine DR-0089 carve-out — a NEW bright line not yet',
    'decided, a value only Darrell holds, or a verified premise conflict — and if so, say so plainly.',
  ].join('\n');

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  return done();
}

main();
