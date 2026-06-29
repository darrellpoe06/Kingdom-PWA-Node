// =============================================================================
// run.mjs — the BRAKED headless deterministic NAS loop runner (host/NAS-side).
// =============================================================================
// Fired by Synology DSM Task Scheduler (boot-persistent, root-owned, no login,
// survives reboot) once per schedule, this runs ONE named deterministic loop from
// the registry behind the three brakes, then exits. It is the native replacement
// for the timer-driven n8n loops (research-review 2026-06-29): a script that EXITS
// holds no RAM at idle and cannot wedge a shared process — the structural fix for
// the n8n crash/runaway class. Because the loops are deterministic (no LLM, no
// vendor), they keep running headless whether or not Claude/Dispatch is online.
//
// THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"):
//   1. BUDGET     per-run wall-clock TIMEOUT (kills a hung child) + per-day CALL
//                 CAP (state/calls-<loop>-<UTCday>.txt). On reach => no-op/stop.
//   2. LOCK       per-loop single-flight lockdir (state/<loop>.lock via atomic
//                 mkdir). A second fire that finds it held SKIPS — never stacks.
//   3. KILL-SWITCH  state/KILL_SWITCH present => INERT (panic stop, fleet-wide).
//                 PLUS state/LOOPS_ARMED (the deterministic-class arm; ships
//                 ABSENT) — the runner ships inert and is armed once, by hand.
// Plus OBSERVABILITY: one JSONL line per run appended to the event reel (the same
// _reel.jsonl the Dispatch Status surface reads) + the bundle events log; ntfy on
// failure. The decision authority is the PURE core (scripts/lib/nas-loops.mjs),
// unit-tested proven-to-catch; this harness only does I/O around it.
//
// SHIPS INERT. Default is PLAN-ONLY: it loads, brake-checks, and logs exactly what
// it WOULD run — but executes no loop. A live run requires BOTH --run on the CLI
// AND every brake GO (kill-switch clear, LOOPS_ARMED, under the call cap, lock
// free). Missing any one => it refuses and stays plan-only. kind:'ai' loops are
// REFUSED here and pointed at the cap-resume gate (a strict superset of brakes).
//
// Usage (from the NAS repo checkout):
//   node infra/nas-loops/run.mjs --loop=health-check            # plan-only
//   node infra/nas-loops/run.mjs --loop=health-check --run      # LIVE (needs brakes GO)
//   node infra/nas-loops/run.mjs --list                         # show the registry + brake state
//
// Env (read from infra/nas-loops/.env + process env):
//   LOOPS_DIR          runner root (default infra/nas-loops)
//   KILL_SWITCH_FILE   override the kill-switch path (point at the shared bundle
//                      KILL_SWITCH for unified fleet panic; default LOOPS_DIR/state/KILL_SWITCH)
//   NODE_NAME          label in the reel/events (default 'nas-loops')
//   NTFY_URL / NTFY_TOPIC   failure alert (best-effort; optional)
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmdirSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { validateRegistry, findLoop, decideRun, reelLine } from '../../scripts/lib/nas-loops.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const LOOPS_DIR = process.env.LOOPS_DIR
  ? (isAbsolute(process.env.LOOPS_DIR) ? process.env.LOOPS_DIR : join(repoRoot, process.env.LOOPS_DIR))
  : here;
const STATE_DIR = join(LOOPS_DIR, 'state');
const LOOPS_SUBDIR = join(LOOPS_DIR, 'loops');
const REGISTRY = join(LOOPS_DIR, 'registry.json');
const EVENTS_LOG = join(LOOPS_DIR, 'events', 'events.jsonl');
// The event reel: shared sink the Dispatch Status surface reads. Defaults inside
// the runner; on the NAS, point REEL_FILE at /data/poetech-briefing/_reel.jsonl.
const REEL_FILE = process.env.REEL_FILE
  ? (isAbsolute(process.env.REEL_FILE) ? process.env.REEL_FILE : join(repoRoot, process.env.REEL_FILE))
  : join(LOOPS_DIR, 'events', '_reel.jsonl');

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
};
const hasFlag = (name) => process.argv.includes(`--${name}`);

// --- .env parse (caps/overrides live here; never committed) -------------------
function readEnv() {
  const out = {};
  const f = join(LOOPS_DIR, '.env');
  if (!existsSync(f)) return out;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const env = { ...readEnv(), ...process.env };

const KILL_SWITCH_FILE = env.KILL_SWITCH_FILE
  ? (isAbsolute(env.KILL_SWITCH_FILE) ? env.KILL_SWITCH_FILE : join(repoRoot, env.KILL_SWITCH_FILE))
  : join(STATE_DIR, 'KILL_SWITCH');
const NODE_NAME = env.NODE_NAME || 'nas-loops';

function killSwitchEngaged() { return existsSync(KILL_SWITCH_FILE); }
function loopsArmed() { return existsSync(join(STATE_DIR, 'LOOPS_ARMED')); }

// --- Call accounting (per loop, per UTC day) ----------------------------------
function dayStamp() { return new Date().toISOString().slice(0, 10); }
function callsFile(name) { return join(STATE_DIR, `calls-${name}-${dayStamp()}.txt`); }
function callsToday(name) {
  const f = callsFile(name);
  if (!existsSync(f)) return 0;
  const v = parseInt(readFileSync(f, 'utf8').trim(), 10);
  return Number.isFinite(v) ? v : 0;
}
function recordCall(name) {
  try { mkdirSync(STATE_DIR, { recursive: true }); } catch { /* exists */ }
  const n = callsToday(name) + 1;
  writeFileSync(callsFile(name), String(n));
  return n;
}

// --- Single-flight lock (atomic mkdir; mirrors brakes.sh acquire_lock) --------
function lockDir(name) { return join(STATE_DIR, `${name}.lock`); }
function lockHeld(name) { return existsSync(lockDir(name)); }
function acquireLock(name) {
  try { mkdirSync(STATE_DIR, { recursive: true }); } catch { /* exists */ }
  try { mkdirSync(lockDir(name)); return true; } catch { return false; }
}
function releaseLock(name) { try { rmdirSync(lockDir(name)); } catch { /* best effort */ } }

// --- Event log + reel (observability brake) -----------------------------------
function append(file, line) {
  try { mkdirSync(dirname(file), { recursive: true }); } catch { /* exists */ }
  try { writeFileSync(file, line + '\n', { flag: 'a' }); } catch { /* dir optional in dry tests */ }
}
function logEvent(event, detail, extra = {}) {
  const ts = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const line = JSON.stringify({
    ts, node: NODE_NAME, agent: 'nas-loops', event,
    armed: loopsArmed(),
    kill_switch: killSwitchEngaged() ? 'engaged' : 'clear',
    detail: String(detail || '').replace(/\s+/g, ' ').slice(0, 1000),
    ...extra,
  });
  append(EVENTS_LOG, line);
  process.stderr.write(`[event] ${event}: ${detail}\n`);
}
function logReel(rec) { append(REEL_FILE, reelLine({ ...rec, node: NODE_NAME })); }

// --- ntfy alert (best-effort; never blocks/raises) ----------------------------
async function alert(title, body) {
  const base = env.NTFY_URL; const topic = env.NTFY_TOPIC;
  if (!base || !topic) return;
  try {
    await fetch(`${base.replace(/\/$/, '')}/${topic}`, {
      method: 'POST', headers: { Title: String(title).slice(0, 120) }, body: String(body).slice(0, 2000),
    });
  } catch (e) { process.stderr.write(`[ntfy failed: ${e.message}]\n`); }
}

// --- Execute one deterministic loop with a wall-clock timeout (budget brake) ---
// The timeout is a HARD ceiling: at the limit the runner (a) best-effort kills the
// whole child PROCESS GROUP — `kill -pid` on POSIX reaps the shell AND its
// descendants (a bare child.kill on bash would orphan a `sleep`-style grandchild),
// `taskkill /T` on Windows — and (b) resolves IMMEDIATELY so the runner never hangs
// waiting on a wedged child: it records the timeout and frees the single-flight
// lock on schedule. A lingering orphan (if a kill is refused) exits on its own and
// cannot stack, because the lock was already held for this fire.
const IS_WIN = process.platform === 'win32';
function killTree(child) {
  if (!child || child.killed || child.pid == null) return;
  try {
    if (IS_WIN) { spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']); }
    else { process.kill(-child.pid, 'SIGKILL'); } // negative pid => the whole group
  } catch {
    try { child.kill('SIGKILL'); } catch { /* already gone */ }
  }
}
function runScript(scriptPath, timeoutSeconds) {
  return new Promise((resolve) => {
    const started = Date.now();
    let settled = false;
    const done = (r) => { if (!settled) { settled = true; resolve(r); } };
    const child = spawn('bash', [scriptPath], {
      cwd: LOOPS_DIR,
      env: { ...process.env, LOOPS_DIR, STATE_DIR, REPO_ROOT: repoRoot },
      detached: !IS_WIN, // own process group on POSIX so killTree reaps descendants
    });
    let out = ''; let err = '';
    const timer = setTimeout(() => {
      killTree(child);
      done({ ok: false, code: 124, durationMs: Date.now() - started, out: out.trim(), err: err.trim(), timedOut: true });
    }, Math.max(1, Number(timeoutSeconds)) * 1000);
    child.stdout.on('data', (d) => { out += d.toString().slice(0, 8000); });
    child.stderr.on('data', (d) => { err += d.toString().slice(0, 8000); });
    child.on('error', (e) => {
      clearTimeout(timer);
      done({ ok: false, code: -1, durationMs: Date.now() - started, out, err: e.message, timedOut: false });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      done({ ok: code === 0, code, durationMs: Date.now() - started, out: out.trim(), err: err.trim(), timedOut: false });
    });
  });
}

function loadRegistry() {
  if (!existsSync(REGISTRY)) return null;
  return JSON.parse(readFileSync(REGISTRY, 'utf8'));
}

async function main() {
  const reg = loadRegistry();
  if (!reg) { logEvent('loops_noop', `no registry at ${REGISTRY}`); console.log(`[noop] no registry at ${REGISTRY}`); return; }
  const rv = validateRegistry(reg);
  if (!rv.ok) { logEvent('loops_invalid', `registry invalid: ${rv.errors.slice(0, 5).join('; ')}`); console.error(`[refuse] invalid registry: ${rv.errors.join('; ')}`); process.exit(1); }

  // --list: show the registry + live brake state, run nothing.
  if (hasFlag('list')) {
    const ks = killSwitchEngaged() ? 'ENGAGED (inert)' : 'clear';
    const armed = loopsArmed() ? 'ARMED' : 'disarmed (inert)';
    console.log(`[registry] ${reg.loops.length} loop(s) | kill-switch=${ks} | runner=${armed} | kill-switch-file=${KILL_SWITCH_FILE}`);
    for (const l of reg.loops) {
      console.log(`  - ${l.name} [${l.kind}] ${l.enabled ? 'enabled' : 'disabled'} | cap=${l.max_calls_per_day}/day timeout=${l.timeout_seconds}s usedToday=${callsToday(l.name)} | ${l.script}`);
    }
    return;
  }

  const name = arg('loop');
  if (!name) { console.error('[refuse] provide --loop=<name> (or --list)'); process.exit(1); }
  const loop = findLoop(reg, name);
  if (!loop) { logEvent('loops_unknown', `no loop named '${name}'`); console.error(`[refuse] no loop named '${name}' in the registry`); process.exit(1); }

  // Route by kind: the deterministic dispatcher refuses ai loops (delegated).
  if (loop.kind === 'ai') {
    logEvent('loops_delegate', `loop '${name}' is kind 'ai'; delegated to the cap-resume/wake gate`);
    console.log(`[delegate] '${name}' is an AI loop — run it via the cap-resume/wake gate (full brakes: ARMED + RESUME_ARMED + $budget). The deterministic dispatcher does not run AI loops.`);
    return;
  }

  const wantRun = hasFlag('run');
  const used = callsToday(name);
  const decision = decideRun({ loop, killSwitch: killSwitchEngaged(), loopsArmed: loopsArmed(), lockHeld: lockHeld(name), callsToday: used });
  const head = `loop=${name} kind=${loop.kind} cap=${loop.max_calls_per_day}/day usedToday=${used} timeout=${loop.timeout_seconds}s decision=${decision.go ? 'GO' : 'HOLD'}(${decision.reason})`;

  // --- Plan-only (default): no --run, or any brake holds -----------------------
  if (!wantRun) { logEvent('loops_plan', `PLAN-ONLY (no --run): ${head}`); console.log(`[plan-only] ${head}\n(add --run to execute, once armed)`); return; }
  if (!decision.go) { logEvent('loops_inert', `--run but brakes HOLD: ${head}`); console.log(`[inert] ${decision.reason}\n${head}`); return; }

  // --- Single-flight: acquire the lock; a second fire that loses it SKIPS ------
  if (!acquireLock(name)) { logEvent('loops_locked', `lock held for '${name}'; skipping`); console.log(`[skip] another run of '${name}' is in progress (single-flight lock held)`); return; }

  const scriptPath = join(LOOPS_SUBDIR, loop.script);
  if (!existsSync(scriptPath)) {
    releaseLock(name);
    logEvent('loops_missing_script', `script not found: ${scriptPath}`);
    console.error(`[error] loop script not found: ${scriptPath}`);
    process.exit(1);
  }

  logEvent('loop_run_start', head);
  const newCalls = recordCall(name); // count the fire before exec — a crashing loop still consumes its cap slot (anti-runaway)
  let res;
  try {
    res = await runScript(scriptPath, loop.timeout_seconds);
  } finally {
    releaseLock(name);
  }

  const detail = res.timedOut
    ? `TIMEOUT after ${loop.timeout_seconds}s (killed; wall-clock budget brake)`
    : `exit=${res.code} in ${res.durationMs}ms${res.out ? ` | ${res.out.split('\n').slice(-1)[0]}` : ''}`;
  logReel({ ts: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), loop: name, event: res.ok ? 'loop_ok' : 'loop_fail', ok: res.ok, durationMs: res.durationMs, detail });
  logEvent(res.ok ? 'loop_run_done' : 'loop_run_fail', `${head} -> ${detail} calls_today=${newCalls}`);

  if (!res.ok) {
    await alert(`PoeTech loop FAILED: ${name}`, `${detail}\n${res.err ? res.err.slice(0, 500) : ''}`);
    console.error(`[fail] ${name}: ${detail}${res.err ? `\n${res.err}` : ''}`);
    process.exit(1);
  }
  console.log(`[done] ${name}: ${detail} | calls ${newCalls}/${loop.max_calls_per_day}`);
}

main().catch((e) => { logEvent('loops_error', e.message); console.error(`[error] ${e.message}`); process.exit(1); });
