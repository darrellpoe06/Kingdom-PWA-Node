// =============================================================================
// cap-resume.mjs — the BOUNDED auto-resume runner (host/NAS-side, behind brakes).
// =============================================================================
// The pragmatic MVP bridge: after a vendor outage/cap, automatically RESUME the
// already-APPROVED, queued work — without waiting on the full local-LLM conductor
// or the GPU box. It is NOT open-ended autonomy. It only continues an explicit,
// human-greenlit queue (selectEligible enforces approved===true), one task per
// queue entry, idempotently, behind the three brakes. It makes no new decisions.
//
// WHERE IT RUNS: the always-on NAS (DS1621xs), which is NOT subject to the desktop
// vendor account cap. The NAS scheduler (cron / systemd timer / n8n) fires this
// AFTER the cap-reset window (default 04:30 America/Chicago + buffer). The clock is
// only a poll; the real gate is the cap window being open + an approved item.
//
// THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"):
//   1. BUDGET    per-task $ + daily $ ceiling (real spend, measured) PLUS a hard
//                per-run task cap and per-day call cap. Unset == missing == inert.
//   2. LOCK      single-flight lockdir (state/resume.lock) + idempotent per-task
//                status: a 'done' item is never resumed twice; a second fire that
//                finds the lock held SKIPS (never stacks/loops on itself).
//   3. KILL-SWITCH  state/KILL_SWITCH present => INERT (panic stop, global). PLUS a
//                dedicated RESUME_ARMED consent flag for THIS lane (ships absent).
//
// SHIPS INERT. Default mode is PLAN-ONLY: it validates, selects, brake-checks, and
// logs exactly what it WOULD resume — but calls no vendor. A live resume requires
// BOTH --run on the CLI AND every brake GO (kill-switch clear, ARMED, RESUME_ARMED,
// budgets + caps configured and under ceilings, cap window open). Missing any one
// => it refuses and stays plan-only. This is the June-6 runaway rule applied to the
// lower-risk bounded class: still inert by default, still armed deliberately.
//
// AUTH: ANTHROPIC_API_KEY resolves from env first, else a NAS secrets file under
// ORCH_SECRETS_DIR (default /volume1/PoeTech/secrets/anthropic-api-key.txt) — never
// in the repo or client bundle (see scripts/lib/vendors.mjs). The resume runs the
// Claude API and bills against the API account (finite, separate from the desktop
// cap) — which is exactly why the budget + cap brakes are mandatory.
//
// Usage (from the deployed bundle's repo checkout on the NAS):
//   node scripts/cap-resume.mjs                       # plan-only over state/approved-queue.json
//   node scripts/cap-resume.mjs --queue=path.json     # explicit queue file
//   node scripts/cap-resume.mjs --now=2026-06-24T11:00:00Z   # inject a clock (test)
//   node scripts/cap-resume.mjs --run                 # LIVE (needs every brake GO)
//
// Env (read from the bundle .env + process env):
//   BUNDLE_DIR              portable bundle root (default infra/ai-orchestrator/portable)
//   BUDGET_PER_TASK_USD / BUDGET_DAILY_USD            ($ budget brake)
//   RESUME_MAX_TASKS_PER_RUN / RESUME_MAX_CALLS_PER_DAY  (count budget brake)
//   CAP_RESET_LOCAL (HH:MM) / CAP_RESET_TZ / CAP_RESET_BUFFER_MIN   (cap window)
//   ORCH_MODE               vendor-first (default) | local-first
//   NTFY_URL / NTFY_TOPIC    observability alert (best-effort; optional)
//   OLLAMA_* / ANTHROPIC_* / GEMINI_* / ORCH_SECRETS_DIR  (see lib/vendors.mjs)
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmdirSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickVendor } from './lib/handoff.mjs';
import { VENDORS, estimateCostUsd } from './lib/vendors.mjs';
import { validateQueue, selectEligible, capCheck, capWindowOpen, localWall } from './lib/resume-queue.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE_DIR = process.env.BUNDLE_DIR
  ? (isAbsolute(process.env.BUNDLE_DIR) ? process.env.BUNDLE_DIR : join(repoRoot, process.env.BUNDLE_DIR))
  : join(repoRoot, 'infra/ai-orchestrator/portable');
const STATE_DIR = join(BUNDLE_DIR, 'state');
const EVENTS_LOG = join(BUNDLE_DIR, 'events', 'events.jsonl');
const LOCK_DIR = join(STATE_DIR, 'resume.lock');
const DEFAULT_QUEUE = join(STATE_DIR, 'approved-queue.json');
const MODE = (process.env.ORCH_MODE || 'vendor-first').toLowerCase();

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

// --- Clock (injectable for tests/replay; no bare Date.now in pure decisions) --
function nowMs() {
  const override = arg('now');
  if (override) {
    const ms = Date.parse(override);
    if (Number.isFinite(ms)) return ms;
  }
  return Date.parse(new Date().toISOString());
}

// --- Event log (same line shape as the bundle's eventlog.sh + wake-router) -----
function logEvent(event, detail) {
  const ts = new Date(nowMs()).toISOString().replace(/\.\d+Z$/, 'Z');
  const line = JSON.stringify({
    ts,
    node: process.env.NODE_NAME || 'portable-node',
    agent: 'cap-resume',
    event,
    armed: existsSync(join(STATE_DIR, 'ARMED')) && existsSync(join(STATE_DIR, 'RESUME_ARMED')),
    kill_switch: existsSync(join(STATE_DIR, 'KILL_SWITCH')) ? 'engaged' : 'clear',
    detail: String(detail || '').replace(/\s+/g, ' ').slice(0, 1000),
  });
  try { writeFileSync(EVENTS_LOG, line + '\n', { flag: 'a' }); } catch { /* events dir optional in dry tests */ }
  process.stderr.write(`[event] ${event}: ${detail}\n`);
}

// --- .env parse (budgets + caps live here; never committed) -------------------
function readEnv() {
  const out = {};
  const f = join(BUNDLE_DIR, '.env');
  if (!existsSync(f)) return out;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(?:#.*)?$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
function cfg() { return { ...readEnv(), ...process.env }; }

// --- Spend + call accounting (per UTC day, mirrors brakes.sh / wake-router) ----
function dayStamp() { return new Date(nowMs()).toISOString().slice(0, 10); }
function spendFile() { return join(STATE_DIR, `spend-${dayStamp()}.txt`); }
function callsFile() { return join(STATE_DIR, `calls-${dayStamp()}.txt`); }
function readNum(f) {
  if (!existsSync(f)) return 0;
  const v = parseFloat(readFileSync(f, 'utf8').trim());
  return Number.isFinite(v) ? v : 0;
}
function spentToday() { return readNum(spendFile()); }
function callsToday() { return Math.floor(readNum(callsFile())); }
function recordSpend(usd) { const n = (spentToday() + Number(usd || 0)).toFixed(4); writeFileSync(spendFile(), n); return Number(n); }
function recordCall() { const n = callsToday() + 1; writeFileSync(callsFile(), String(n)); return n; }

// --- Single-flight lock (atomic mkdir; mirrors brakes.sh acquire_lock) --------
function acquireLock() {
  try { mkdirSync(STATE_DIR, { recursive: true }); } catch { /* exists */ }
  try { mkdirSync(LOCK_DIR); return true; } catch { return false; }
}
function releaseLock() { try { rmdirSync(LOCK_DIR); } catch { /* best effort */ } }

// --- The brake gate (mirrors orchestrator/lib/brakes.sh + the count caps) ------
// GO only when: kill-switch CLEAR, ARMED set, RESUME_ARMED set, $ budgets and
// count caps configured + under ceilings. Lock + cap-window are checked separately
// by the runner (lock at start, window per fire).
function brakeGate(tasksThisRun) {
  const env = cfg();
  const perTask = Number(env.BUDGET_PER_TASK_USD || 0);
  const daily = Number(env.BUDGET_DAILY_USD || 0);
  const maxTasksPerRun = Number(env.RESUME_MAX_TASKS_PER_RUN || 0);
  const maxCallsPerDay = Number(env.RESUME_MAX_CALLS_PER_DAY || 0);
  const spent = spentToday();
  const calls = callsToday();

  const killEngaged = existsSync(join(STATE_DIR, 'KILL_SWITCH'));
  const armed = existsSync(join(STATE_DIR, 'ARMED'));
  const resumeArmed = existsSync(join(STATE_DIR, 'RESUME_ARMED'));
  const dollarOk = perTask > 0 && daily > 0 && spent < daily;
  const caps = capCheck({ callsToday: calls, maxCallsPerDay, tasksThisRun, maxTasksPerRun });

  const reasons = [];
  if (killEngaged) reasons.push('kill-switch engaged');
  if (!armed) reasons.push('disarmed (no ARM flag)');
  if (!resumeArmed) reasons.push('resume not consented (no RESUME_ARMED flag)');
  if (!(perTask > 0 && daily > 0)) reasons.push('budget brake: per-task or daily $ ceiling unset (missing brake)');
  else if (!(spent < daily)) reasons.push(`budget brake: daily $ ceiling reached ($${spent.toFixed(2)} >= $${daily.toFixed(2)})`);
  if (!caps.ok) reasons.push(`cap brake: ${caps.reason}`);

  return {
    go: !killEngaged && armed && resumeArmed && dollarOk && caps.ok,
    reasons,
    budget: { perTask, daily, spent, remaining: Math.max(0, daily - spent) },
    caps: { maxTasksPerRun, maxCallsPerDay, callsToday: calls, tasksThisRun },
  };
}

// --- ntfy alert (best-effort observability; never blocks the run) -------------
async function alert(title, body) {
  const env = cfg();
  const base = env.NTFY_URL;
  const topic = env.NTFY_TOPIC;
  if (!base || !topic) return; // not configured => log-only (already done via logEvent)
  try {
    await fetch(`${base.replace(/\/$/, '')}/${topic}`, {
      method: 'POST',
      headers: { Title: String(title).slice(0, 120) },
      body: String(body).slice(0, 2000),
    });
  } catch (e) { process.stderr.write(`[ntfy failed: ${e.message}]\n`); }
}

// --- Build the resume prompt (Charter + lane/task + state pointer) ------------
function buildPrompt(h) {
  let charter = '';
  const cf = join(BUNDLE_DIR, 'charter', 'charter.yml');
  if (existsSync(cf)) charter = readFileSync(cf, 'utf8');
  const sp = h.state_pointer || {};
  return [
    'You are being auto-resumed by the always-on PoeTech NAS after a vendor cap/outage',
    'reset. This is BOUNDED resume of already-approved work: do exactly the approved task',
    'below and nothing more. Operate under this Charter (policy as config):',
    '', '--- CHARTER ---', charter.trim(), '--- END CHARTER ---', '',
    `Lane: ${h.lane}`,
    `State pointer: ${sp.kind} -> ${sp.ref}${sp.note ? ` (${sp.note})` : ''}`,
    h.offline_message ? `Prior offline message: ${h.offline_message}` : '',
    '', 'Resume this approved task now:', h.task,
  ].filter(Boolean).join('\n');
}

// --- The tiered summon (vendor-first / local-first / private) -----------------
async function summon(h, primaryVendor) {
  const prompt = buildPrompt(h);
  if (h.private === true) {
    const r = await VENDORS.local(prompt);
    return { ...r, vendor: 'local', route: 'private-local-only' };
  }
  if (MODE === 'vendor-first') {
    try {
      const r = await VENDORS[primaryVendor](prompt);
      return { ...r, vendor: primaryVendor, route: 'vendor-first' };
    } catch (e) {
      process.stderr.write(`[${primaryVendor} unavailable: ${e.message}] falling back to local\n`);
      const r = await VENDORS.local(prompt);
      return { ...r, vendor: 'local', route: 'vendor-first-fallback-local' };
    }
  }
  try {
    const r = await VENDORS.local(prompt);
    return { ...r, vendor: 'local', route: 'local-first' };
  } catch {
    const r = await VENDORS[primaryVendor](prompt);
    return { ...r, vendor: primaryVendor, route: 'local-first-escalated' };
  }
}

// --- Load + persist the queue (status write-back is the idempotency record) ----
function queuePath() {
  const explicit = arg('queue');
  if (!explicit) return DEFAULT_QUEUE;
  return isAbsolute(explicit) ? explicit : join(process.cwd(), explicit);
}
function loadQueue(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}
function saveQueue(path, queue) {
  writeFileSync(path, JSON.stringify(queue, null, 2) + '\n');
}
function setStatus(queue, id, status, note) {
  const it = queue.items.find((x) => x.id === id);
  if (it) {
    it.status = status;
    it.last_run_at = new Date(nowMs()).toISOString().replace(/\.\d+Z$/, 'Z');
    if (note) it.last_note = String(note).slice(0, 500);
  }
}

async function main() {
  const wantRun = hasFlag('run');
  const path = queuePath();
  const env = cfg();
  const window = capWindowOpen(nowMs(), {
    tz: env.CAP_RESET_TZ || 'America/Chicago',
    resetHHMM: env.CAP_RESET_LOCAL || '04:30',
    bufferMin: Number(env.CAP_RESET_BUFFER_MIN || 0),
  });

  // No queue file at all = the safe no-op (no approved work = nothing to do).
  const queue = loadQueue(path);
  if (!queue) { logEvent('resume_noop', `no queue file at ${path} (no approved work; no-op)`); console.log(`[noop] no queue at ${path}`); return; }

  const qv = validateQueue(queue);
  if (!qv.ok) { logEvent('resume_invalid', `queue invalid: ${qv.errors.slice(0, 5).join('; ')}`); console.error(`[refuse] invalid queue: ${qv.errors.join('; ')}`); process.exit(1); }

  const { eligible, skipped } = selectEligible(queue, nowMs());
  const gate0 = brakeGate(0);
  const head = `queue=${path} eligible=${eligible.length} skipped=${skipped.length} `
    + `cap_window=${window.open ? 'OPEN' : 'CLOSED'}(${window.reason}) `
    + `brakes=${gate0.go ? 'GO' : 'HOLD:' + gate0.reasons.join(',')} `
    + `budget[daily=$${gate0.budget.daily} spent=$${gate0.budget.spent.toFixed(2)}] `
    + `caps[run=${gate0.caps.maxTasksPerRun} day=${gate0.caps.maxCallsPerDay} usedToday=${gate0.caps.callsToday}]`;

  // --- Plan-only (default): no --run, or window closed, or brakes HOLD ---------
  if (!wantRun) { logEvent('resume_plan', `PLAN-ONLY (no --run): ${head}`); console.log(`[plan-only] ${head}\nEligible: ${eligible.map((e) => e.id).join(', ') || '(none)'}\nSkipped: ${skipped.map((s) => `${s.id}(${s.reason})`).join('; ') || '(none)'}\n(add --run to resume, once armed)`); return; }
  if (!window.open) { logEvent('resume_window_closed', `--run but cap window CLOSED: ${head}`); console.log(`[hold] cap window closed: ${window.reason}`); return; }
  if (!gate0.go) { logEvent('resume_inert', `--run + window open but brakes HOLD: ${head}`); console.log(`[inert] brakes HOLD: ${gate0.reasons.join('; ')}\n${head}`); return; }
  if (!eligible.length) { logEvent('resume_empty', `armed + window open but no eligible items: ${head}`); console.log(`[done] no eligible approved+pending items. ${head}`); return; }

  // --- Single-flight: a second fire that finds the lock held SKIPS -------------
  if (!acquireLock()) { logEvent('resume_locked', `another resume run holds the lock (${LOCK_DIR}); skipping`); console.log('[skip] another resume run is in progress (single-flight lock held)'); return; }

  let ran = 0; let failed = 0;
  const dayKey = window.dayKey;
  try {
    logEvent('resume_run_start', `dayKey=${dayKey} ${head}`);
    for (const item of eligible) {
      // Re-check ALL count/$ brakes BEFORE each task (the ceilings tighten as we spend).
      const g = brakeGate(ran);
      if (!g.go) { logEvent('resume_cap_stop', `stopping mid-run: ${g.reasons.join('; ')}`); console.log(`[stop] ${g.reasons.join('; ')}`); break; }

      const pick = pickVendor(item.handoff, { mode: MODE });
      setStatus(queue, item.id, 'in_progress'); saveQueue(path, queue);
      logEvent('resume_task_start', `id=${item.id} lane=${item.handoff.lane} vendor=${pick.vendor}(${pick.reason})`);
      try {
        const res = await summon(item.handoff, pick.vendor);
        const cost = estimateCostUsd(res.model, res.usage);
        const newSpent = recordSpend(cost.usd);
        const newCalls = recordCall();
        ran += 1;
        setStatus(queue, item.id, 'done', `${res.vendor}/${res.model} ${cost.known ? '$' + cost.usd.toFixed(4) : 'unknown-cost'}`);
        saveQueue(path, queue);
        logEvent('resume_task_done', `id=${item.id} vendor=${res.vendor} route=${res.route} model=${res.model} tokens[in=${res.usage.input_tokens} out=${res.usage.output_tokens}] cost=${cost.known ? '$' + cost.usd.toFixed(4) : 'unknown'} daily_spent=$${newSpent.toFixed(4)} calls_today=${newCalls}`);
        console.log(`\n=== RESUMED ${item.id} via ${res.vendor.toUpperCase()} (${res.route}) ===\n${res.text}\n`);
      } catch (e) {
        failed += 1;
        setStatus(queue, item.id, 'failed', e.message);
        saveQueue(path, queue);
        logEvent('resume_task_error', `id=${item.id} failed: ${e.message}`);
        console.error(`[error] ${item.id}: ${e.message}`);
      }
    }
  } finally {
    releaseLock();
  }

  const summary = `resumed ${ran} task(s), ${failed} failed, daily spend $${spentToday().toFixed(4)} / $${gate0.budget.daily}, calls ${callsToday()}/${gate0.caps.maxCallsPerDay}. dayKey=${dayKey}`;
  logEvent('resume_run_done', summary);
  await alert(`PoeTech cap-resume: ${ran} resumed${failed ? `, ${failed} failed` : ''}`, summary);
  console.log(`\n[done] ${summary}`);
}

main().catch((e) => { logEvent('resume_error', e.message); releaseLock(); console.error(`[error] ${e.message}`); process.exit(1); });
