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
//   (KILL-SWITCH REMOVED — DR-0248: the manual override is gone from this
//                 deterministic class; stop-paths are registry enabled:false,
//                 deleting ARMED-BY-RECORD, or the DSM toggle — all through
//                 deterministic logic. Rebuild tracked in DR-0248.)
//                 PLUS the arm (env/.env LOOPS_ARMED, legacy state file, or the
//                 COMMITTED ARMED-BY-RECORD — DR-0247). Arming was formerly a
//                 single parameter, not a ceremony (DR-0096).
// Plus OBSERVABILITY: one JSONL line per run appended to the event reel (the same
// _reel.jsonl the Dispatch Status surface reads) + the bundle events log; ntfy on
// failure. The decision authority is the PURE core (scripts/lib/nas-loops.mjs),
// unit-tested proven-to-catch; this harness only does I/O around it.
//
// SHIPS INERT, GOVERNED BY PARAMETERS (DR-0096, Darrell 2026-07-04: "governance in
// the code and humans... we don't need two stops just the parameters"). Governance
// is the CODED PARAMETERS (the registry: enabled + caps + timeouts) PLUS the humans
// we have (who review the registry and hold the kill-switch) — not a manual double-
// ceremony. There is ONE arm: the LOOPS_ARMED parameter (env or infra/nas-loops/.env),
// which ships UNSET so the runner is inert on deploy. Once armed, invoking a loop
// RUNS it, bounded by the three brakes (cap, lock, kill-switch + wall-clock timeout).
// There is NO separate --run gate; --dry-run previews the decision and runs nothing.
// Disarmed (LOOPS_ARMED unset) => decideRun HOLDs, so a bare invocation can never
// run by accident. The three brakes are unchanged; only the redundant --run gate is
// removed. kind:'ai' loops are REFUSED here and pointed at the cap-resume gate.
//
// Usage (from the NAS repo checkout):
//   LOOPS_ARMED=1 node infra/nas-loops/run.mjs --loop=health-check   # LIVE (armed; brakes govern)
//   node infra/nas-loops/run.mjs --loop=health-check --dry-run       # preview the decision, run nothing
//   node infra/nas-loops/run.mjs --list                              # show the registry + brake state
// Persistent arm for scheduling: put LOOPS_ARMED=1 in infra/nas-loops/.env (gitignored).
//
// Env (read from infra/nas-loops/.env + process env):
//   LOOPS_DIR          runner root (default infra/nas-loops)
//   (KILL_SWITCH_FILE removed — DR-0248)
//   NODE_NAME          label in the reel/events (default 'nas-loops')
//   NTFY_URL / NTFY_TOPIC   failure alert (best-effort; optional)
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmdirSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { validateRegistry, findLoop, decideRun, reelLine, resolveArmed } from '../../scripts/lib/nas-loops.mjs';

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

// KILL-SWITCH REMOVED (DR-0248): no manual override in this class; the
// deterministic gates + the lane are the protection and the stop-paths.
const NODE_NAME = env.NODE_NAME || 'nas-loops';

// The single ARM (DR-0096): the LOOPS_ARMED parameter (env or infra/nas-loops/.env),
// truthy => armed. Ships UNSET => inert. The legacy state/LOOPS_ARMED file is still
// honored so an existing hand-armed NAS keeps working — one arm, parameter-first.
// DR-0247 amendment (Darrell 2026-07-29: "I always want everything started not
// waiting for a human especially after we agree"): the COMMITTED arm record
// (ARMED-BY-RECORD, beside this file) arms the fleet by merge — agreed work
// starts itself through the lane; the Governor's hand is the BRAKE (the hold
// label, the lane's stop-paths), never the starter (DR-0247/DR-0248).
function loopsArmed() {
  return resolveArmed({
    envValue: env.LOOPS_ARMED,
    legacyFileExists: existsSync(join(STATE_DIR, 'LOOPS_ARMED')),
    armRecordExists: existsSync(join(LOOPS_DIR, 'ARMED-BY-RECORD')),
  });
}

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
// A lock older than the loop's own wall-clock budget cannot be a live run:
// the runner kills the child at timeout_seconds and releases in finally, so
// only a crashed or kill -9'd harness leaves one behind (2026-08-16: a dpoe
// one-shot died on EACCES at the call counter between acquire and the
// try/finally, and every root cycle after it skipped on "single-flight lock
// held" -- the brake was holding a ghost). Past timeout + 120s grace the
// lock is cleared as stale, with its own event line so the reel shows it.
function lockHeld(name, timeoutSeconds) {
  const dir = lockDir(name);
  if (!existsSync(dir)) return false;
  if (timeoutSeconds) {
    try {
      const ageMs = Date.now() - statSync(dir).mtimeMs;
      const staleMs = (Number(timeoutSeconds) + 120) * 1000;
      if (ageMs > staleMs) {
        try { rmdirSync(dir); } catch { /* raced or perms -- fall through to held */ }
        if (!existsSync(dir)) {
          logEvent('loops_lock_stale_cleared', `lock for '${name}' was ${Math.round(ageMs / 1000)}s old (budget ${timeoutSeconds}s + 120s grace) -- cleared as a crashed run's ghost`);
          return false;
        }
      }
    } catch { /* stat failed -- treat as held */ }
  }
  return true;
}
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
    const armed = loopsArmed() ? 'ARMED' : 'disarmed (inert)';
    console.log(`[registry] ${reg.loops.length} loop(s) | runner=${armed} | kill-switch=REMOVED (DR-0248; stop-paths: registry/record/DSM)`);
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

  const dryRun = hasFlag('dry-run') || hasFlag('plan');
  const used = callsToday(name);
  const decision = decideRun({ loop, loopsArmed: loopsArmed(), lockHeld: lockHeld(name, loop.timeout_seconds), callsToday: used });
  const head = `loop=${name} kind=${loop.kind} cap=${loop.max_calls_per_day}/day usedToday=${used} timeout=${loop.timeout_seconds}s decision=${decision.go ? 'GO' : 'HOLD'}(${decision.reason})`;

  // Governance = the PARAMETERS (registry caps + LOOPS_ARMED) plus the human kill-
  // switch; no separate --run ceremony (DR-0096). --dry-run previews and runs
  // nothing; otherwise the decision governs. Disarmed (LOOPS_ARMED unset) makes
  // decision.go false, so a bare invocation can never run by accident.
  if (dryRun) { logEvent('loops_plan', `DRY-RUN (preview only): ${head}`); console.log(`[dry-run] ${head}\n(remove --dry-run to execute; arm with LOOPS_ARMED=1)`); return; }
  if (!decision.go) { logEvent('loops_inert', `brakes HOLD: ${head}`); console.log(`[inert] ${decision.reason}\n${head}`); return; }

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
  // recordCall lives INSIDE the finally-protected region: on 2026-08-16 its
  // EACCES (root-owned counter, dpoe hand) escaped between acquire and the
  // old try, exiting without release -- the orphaned lock wedged every later
  // cycle. Counted before exec as ever: a crashing loop still consumes its
  // cap slot (anti-runaway).
  let newCalls;
  let res;
  try {
    newCalls = recordCall(name);
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
