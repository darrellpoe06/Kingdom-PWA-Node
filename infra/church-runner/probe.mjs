#!/usr/bin/env node
// =============================================================================
// probe.mjs -- the thin I/O wrapper around the pure church-LAN probe core.
// =============================================================================
// Loads the device registry (lan-targets.json), asks the PURE core for a
// deterministic, read-only probe plan, EXECUTES each step, classifies the
// result honestly, and writes:
//   - state/lan-snapshot.json  (latest snapshot, served over Tailscale)
//   - events/events.jsonl      (append-only audit reel, one JSON object per line)
//
// All decisions live in scripts/lib/church-lan-probe.mjs (pure, unit-tested).
// This file does only I/O. It re-checks isReadOnlyCommand() on every command
// immediately before exec -- defense in depth, so even a hand-edited target can
// never turn the probe into a write.
//
// Invoked by run.sh ONLY after the Cage probe-brakes pass. This script does not
// arm anything, summon any LLM, or dispatch any work -- it LOOKS. Dispatch to the
// GPU towers is a separate, separately-armed path (see the design note).
// =============================================================================
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildProbePlan, classifyProbeResult, shapeSnapshot, isReadOnlyCommand,
} from '../../scripts/lib/church-lan-probe.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.STATE_DIR || join(HERE, 'state');
const EVENTS_DIR = process.env.EVENTS_DIR || join(HERE, 'events');
const TARGETS_FILE = process.env.TARGETS_FILE || join(HERE, 'lan-targets.json');
const TIMEOUT_SEC = Number(process.env.PROBE_TIMEOUT_SEC || 3);
const MAX_STEPS = Number(process.env.PROBE_MAX_STEPS || 0);

function log(event, detail) {
  try {
    mkdirSync(EVENTS_DIR, { recursive: true });
    const line = JSON.stringify({ ts: new Date().toISOString(), runner: 'church-runner', event, ...detail });
    appendFileSync(join(EVENTS_DIR, 'events.jsonl'), line + '\n');
  } catch { /* event log is best-effort; never throw from logging */ }
}

// Run one read-only command. Resolves to {ok, stdout, stderr, code, ms, timedOut}.
// Never rejects -- a failed probe is data, not an exception.
function runStep(command) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = execFile('sh', ['-c', command], { timeout: TIMEOUT_SEC * 1000, maxBuffer: 1 << 20 },
      (err, stdout, stderr) => {
        const ms = Date.now() - started;
        if (err) {
          resolve({ ok: false, stdout, stderr, code: err.code ?? 1, ms, timedOut: err.killed === true });
        } else {
          resolve({ ok: true, stdout, stderr, code: 0, ms, timedOut: false });
        }
      });
    child.on('error', () => resolve({ ok: false, stdout: '', stderr: 'spawn-error', code: 127, ms: Date.now() - started, timedOut: false }));
  });
}

async function main() {
  if (!(MAX_STEPS > 0)) {
    // step budget brake -- mirrors brakes.sh; run.sh should have caught this,
    // but fail closed here too.
    log('probe_inert', { reason: 'PROBE_MAX_STEPS unset (step budget brake)' });
    process.exit(0);
  }

  let registry;
  try {
    registry = JSON.parse(readFileSync(TARGETS_FILE, 'utf8'));
  } catch (e) {
    log('probe_error', { reason: `cannot read targets: ${e.message}` });
    process.exit(1);
  }

  const plan = buildProbePlan(registry.targets || [], { timeoutSec: TIMEOUT_SEC, maxSteps: MAX_STEPS });
  log('probe_start', { steps: plan.length, max: MAX_STEPS });

  const results = [];
  for (const step of plan) {
    if (step.sme || step.command === null) {
      results.push(classifyProbeResult(step, {}));
      continue;
    }
    // Defense in depth: never exec a command the core would not call read-only.
    if (!isReadOnlyCommand(step.command)) {
      log('probe_refused', { device: step.id, command: step.command });
      results.push(classifyProbeResult(step, { ok: false, error: 'refused: not read-only' }));
      continue;
    }
    const raw = await runStep(step.command);
    results.push(classifyProbeResult(step, raw));
  }

  const snapshot = shapeSnapshot(plan, results, new Date().toISOString(),
    { runner: 'church-runner', site: registry.site || 'church' });

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(join(STATE_DIR, 'lan-snapshot.json'), JSON.stringify(snapshot, null, 2));
  log('probe_done', { summary: snapshot.summary, sme_pending: snapshot.sme_pending });
}

main().catch((e) => { log('probe_error', { reason: e.message }); process.exit(1); });
