// =============================================================================
// run.mjs -- the braked runner for one OpenClaw role on the tower (DR-0670)
// =============================================================================
// Runs INSIDE the pinned OpenClaw image on tlcmediadpt (Node 24), fired by the
// openclaw-tower lane over ssh:
//
//   docker compose run --rm --no-deps -e POETECH_OPENCLAW_ROLE=report \
//     --entrypoint node openclaw-gateway \
//     /home/node/.openclaw/poetech/run.mjs --role=chat-ops-report \
//     --lane=/home/node/.openclaw/poetech/lane.json [--streaming-hold]
//
// It decides with the pure brakes (brakes.mjs), then -- only on a go -- runs ONE
// `openclaw agent exec` turn against report.json (every tool group denied, gate
// plugin loaded in role 'report'), bounded three ways:
//   BUDGET  --timeout <timeout_seconds> on the CLI, a hard wall-clock kill at
//           timeout + 30 s here, max_turns / max_tool_calls judged after, and
//           max_runs_per_day counted per UTC day.
//   LOCK    an atomic lockdir; a second fire that finds it held SKIPS.
//   KILL    registry enabled:false / ARMED-BY-RECORD absent (read from the
//           copy the lane just shipped from main), and an auto-pause on overrun
//           or repeated failure that only a PR raising arm_epoch lifts.
// Every fire, go or no-go, writes state/status.json for the witness to read.
// =============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { validateRegistry, findRole, decideRun, judgeRun, pauseAfter } from './brakes.mjs';
import { buildReportPrompt } from './lane.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE = process.env.POETECH_OPENCLAW_STATE || join(dirname(HERE), 'poetech-state');
const OPENCLAW = (process.env.POETECH_OPENCLAW_BIN || 'node dist/index.js').split(' ');

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const flag = (name) => process.argv.includes(`--${name}`);
const readJson = (p, fallback) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
};
const day = () => new Date().toISOString().slice(0, 10);

function writeStatus(obj) {
  mkdirSync(STATE, { recursive: true });
  writeFileSync(join(STATE, 'status.json'), `${JSON.stringify({ ...obj, at: new Date().toISOString() }, null, 2)}\n`);
}

async function main() {
  const name = arg('role') || 'chat-ops-report';
  mkdirSync(STATE, { recursive: true });
  const reg = readJson(join(HERE, 'registry.json'), null);
  const registryErrors = validateRegistry(reg);
  const entry = findRole(reg, name);
  const armedByRecord = existsSync(join(HERE, 'ARMED-BY-RECORD'));
  const paused = readJson(join(STATE, `paused-${name}.json`), null);
  const lockDir = join(STATE, `${name}.lock`);
  let lock = { held: false, ageSeconds: 0 };
  if (existsSync(lockDir)) lock = { held: true, ageSeconds: Math.round((Date.now() - statSync(lockDir).mtimeMs) / 1000) };
  const countFile = join(STATE, `runs-${name}-${day()}.txt`);
  const runsToday = Number((existsSync(countFile) && readFileSync(countFile, 'utf8').trim()) || 0);

  // READ-ONLY: what the witness reports. Changes nothing, runs nothing.
  if (flag('status')) {
    console.log(JSON.stringify({ status: readJson(join(STATE, 'status.json'), null), lock, paused, runsToday, registryErrors }));
    return 0;
  }

  const d = decideRun({ entry, armedByRecord, paused, lock, runsToday, streamingHold: flag('streaming-hold'), registryErrors });
  if (!d.go) {
    writeStatus({ loop: name, verdict: 'no-go', ok: null, brake: d.brake, reason: d.reason, paused, runsToday });
    console.log(`openclaw-tower ${name}: NO-GO (${d.brake}) -- ${d.reason}`);
    return 0;
  }
  if (entry.role !== 'report') {
    writeStatus({ loop: name, verdict: 'no-go', ok: null, brake: 'role', reason: 'only the report role has a scripted run; the act role runs when a person talks to it' });
    return 0;
  }

  // LOCK: take it atomically (a stale lock was already judged reclaimable).
  if (lock.held) rmSync(lockDir, { recursive: true, force: true });
  try { mkdirSync(lockDir); } catch {
    writeStatus({ loop: name, verdict: 'no-go', ok: null, brake: 'lock', reason: 'lost the race for the lock -- skipping' });
    return 0;
  }
  writeFileSync(countFile, String(runsToday + 1));

  const lane = readJson(arg('lane') || join(HERE, 'lane.json'), null);
  const prompt = buildReportPrompt(lane);
  const started = Date.now();
  let out = '';
  let killedAtWallClock = false;
  const exitCode = await new Promise((resolve) => {
    const [bin, ...pre] = OPENCLAW;
    const child = spawn(bin, [
      ...pre, 'agent', 'exec',
      '--config', join(HERE, 'report.json'),
      '--model', 'ollama/qwen3:8b',
      '--timeout', String(entry.timeout_seconds),
      '--json',
      '--message-file', '-',
    ], { env: { ...process.env, POETECH_OPENCLAW_ROLE: 'report', POETECH_OPENCLAW_MAX_TOOL_CALLS: String(entry.max_tool_calls) }, stdio: ['pipe', 'pipe', 'inherit'] });
    const wall = setTimeout(() => { killedAtWallClock = true; child.kill('SIGKILL'); }, (entry.timeout_seconds + 30) * 1000);
    child.stdout.on('data', (b) => { out += b; if (out.length > 200000) out = out.slice(-200000); });
    child.on('close', (code) => { clearTimeout(wall); resolve(code === null ? 137 : code); });
    child.on('error', () => { clearTimeout(wall); resolve(127); });
    child.stdin.end(prompt);
  });
  let envelope = null;
  try { envelope = JSON.parse(out.trim().split('\n').filter(Boolean).pop() || 'null'); } catch { envelope = null; }
  const judged = judgeRun({ exitCode, envelope, killedAtWallClock }, entry);

  const failFile = join(STATE, `failures-${name}.txt`);
  const prior = Number((existsSync(failFile) && readFileSync(failFile, 'utf8').trim()) || 0);
  const failures = judged.ok ? 0 : prior + 1;
  writeFileSync(failFile, String(failures));
  const pause = pauseAfter({ judged, consecutiveFailures: failures, entry });
  if (pause) writeFileSync(join(STATE, `paused-${name}.json`), `${JSON.stringify({ ...pause, at: new Date().toISOString() })}\n`);
  rmSync(lockDir, { recursive: true, force: true });

  writeStatus({
    loop: name,
    verdict: judged.ok ? 'ran' : 'failed',
    ok: judged.ok,
    reason: judged.reason,
    turns: judged.turns,
    toolCalls: judged.calls,
    elapsedMs: Date.now() - started,
    exitCode,
    report: envelope && typeof envelope.final === 'string' ? envelope.final.slice(0, 1500) : null,
    model: envelope && envelope.model ? `${envelope.provider || ''}/${envelope.model}` : null,
    paused: pause || null,
    runsToday: runsToday + 1,
  });
  console.log(`openclaw-tower ${name}: ${judged.ok ? 'RAN' : 'FAILED'} -- ${judged.reason}${pause ? ` -- AUTO-PAUSED (${pause.reason})` : ''}`);
  return judged.ok ? 0 : 1;
}

main().then((code) => process.exit(code), (e) => {
  try { writeStatus({ loop: arg('role') || 'chat-ops-report', verdict: 'failed', ok: false, reason: `runner error: ${e && e.message}` }); } catch { /* the status write is best-effort */ }
  console.error(e);
  process.exit(1);
});
