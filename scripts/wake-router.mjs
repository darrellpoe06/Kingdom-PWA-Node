// =============================================================================
// wake-router.mjs — the live wake / handoff router (host-side, behind the Cage).
// =============================================================================
// Reads a handoff (the wake contract), enforces ALL THREE brakes + the kill-
// switch + the dedicated WAKE_SUMMON flag against the portable bundle's state,
// picks the tiered cheapest-capable vendor, and — ONLY when fully armed and the
// wake is due — summons that vendor with the Charter + lane/task + state pointer.
// Records REAL spend against the budget brake and emits an event for every action.
//
// SHIPS INERT. Default mode is PLAN-ONLY: it validates, schedules, brake-checks,
// and logs exactly what it WOULD do — but calls no vendor. A live summon requires
// BOTH --summon on the CLI AND every brake GO (kill-switch clear, ARMED,
// WAKE_SUMMON set, budget configured + under the daily ceiling). Missing any one
// => it refuses the call and stays in plan-only. This is the June-6 runaway rule:
// the wake fires off a REAL handoff event (DR-0071), never a bare timer loop, and
// never summons unattended.
//
// Why host-side Node (not the alpine container): the portable supervisor is
// dependency-free POSIX sh (the self-contained guarantee) — it schedules and
// gates; it carries no HTTP/vendor stack. The summon runs here, on a runner that
// already reaches Ollama + the vendor APIs (same split as orchestrator-v0.mjs).
//
// Usage:
//   node scripts/wake-router.mjs --handoff path/to/handoff.json        # plan-only
//   node scripts/wake-router.mjs --latest                              # newest in inbox
//   node scripts/wake-router.mjs --latest --summon                     # live (needs all brakes GO)
//   node scripts/wake-router.mjs --latest --now=2026-06-16T22:00:00Z   # test a clock
//
// Env:
//   BUNDLE_DIR    portable bundle root (default infra/ai-orchestrator/portable)
//   ORCH_MODE     vendor-first (default) | local-first   (DR-0073)
//   OLLAMA_URL / OLLAMA_MODEL / ANTHROPIC_* / GEMINI_*    (see lib/vendors.mjs)
//   ORCH_SECRETS_DIR                                      (see lib/vendors.mjs)
// =============================================================================

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateHandoff, isWakeDue, pickVendor } from './lib/handoff.mjs';
import { VENDORS, estimateCostUsd } from './lib/vendors.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE_DIR = process.env.BUNDLE_DIR
  ? (isAbsolute(process.env.BUNDLE_DIR) ? process.env.BUNDLE_DIR : join(repoRoot, process.env.BUNDLE_DIR))
  : join(repoRoot, 'infra/ai-orchestrator/portable');
const STATE_DIR = join(BUNDLE_DIR, 'state');
const EVENTS_LOG = join(BUNDLE_DIR, 'events', 'events.jsonl');
const HANDOFF_INBOX = join(STATE_DIR, 'handoffs');
const MODE = (process.env.ORCH_MODE || 'vendor-first').toLowerCase();

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

// --- Event log (same line shape as the bundle's eventlog.sh) -----------------
function logEvent(event, detail) {
  const ts = new Date(nowMs()).toISOString().replace(/\.\d+Z$/, 'Z');
  const armed = existsSync(join(STATE_DIR, 'ARMED'));
  const kill = existsSync(join(STATE_DIR, 'KILL_SWITCH'));
  const line = JSON.stringify({
    ts,
    node: process.env.NODE_NAME || 'portable-node',
    agent: 'wake-router',
    event,
    armed,
    kill_switch: kill ? 'engaged' : 'clear',
    detail: String(detail || '').replace(/\s+/g, ' ').slice(0, 1000),
  });
  try { writeFileSync(EVENTS_LOG, line + '\n', { flag: 'a' }); } catch { /* events dir optional in dry tests */ }
  process.stderr.write(`[event] ${event}: ${detail}\n`);
}

// --- Clock (injectable for tests / replay; no bare Date.now in pure logic) ---
function nowMs() {
  const override = arg('now');
  if (override) {
    const ms = Date.parse(override);
    if (Number.isFinite(ms)) return ms;
  }
  return Date.parse(new Date().toISOString());
}

// --- .env parse (budgets live here; never committed) -------------------------
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

function spendFile() {
  const day = new Date(nowMs()).toISOString().slice(0, 10);
  return join(STATE_DIR, `spend-${day}.txt`);
}
function spentToday() {
  const f = spendFile();
  if (!existsSync(f)) return 0;
  const v = parseFloat(readFileSync(f, 'utf8').trim());
  return Number.isFinite(v) ? v : 0;
}
function recordSpend(usd) {
  const f = spendFile();
  const next = (spentToday() + Number(usd || 0)).toFixed(4);
  writeFileSync(f, next);
  return Number(next);
}

// --- The brake gate ----------------------------------------------------------
// Returns { go, reasons[], budget:{perTask, daily, spent, remaining} }. GO only
// when every brake is satisfied. Mirrors orchestrator/lib/brakes.sh exactly.
function brakeGate() {
  const reasons = [];
  const env = { ...readEnv(), ...process.env };
  const perTask = Number(env.BUDGET_PER_TASK_USD || 0);
  const daily = Number(env.BUDGET_DAILY_USD || 0);
  const spent = spentToday();

  const killEngaged = existsSync(join(STATE_DIR, 'KILL_SWITCH'));
  const armed = existsSync(join(STATE_DIR, 'ARMED'));
  const wakeSummon = existsSync(join(STATE_DIR, 'WAKE_SUMMON'));
  const budgetOk = perTask > 0 && daily > 0 && spent < daily;

  if (killEngaged) reasons.push('kill-switch engaged');
  if (!armed) reasons.push('disarmed (no ARM flag)');
  if (!wakeSummon) reasons.push('wake-summon not consented (no WAKE_SUMMON flag)');
  if (!(perTask > 0 && daily > 0)) reasons.push('budget brake: per-task or daily ceiling unset (missing brake)');
  else if (!(spent < daily)) reasons.push(`budget brake: daily ceiling reached ($${spent.toFixed(2)} >= $${daily.toFixed(2)})`);

  return {
    go: !killEngaged && armed && wakeSummon && budgetOk,
    reasons,
    budget: { perTask, daily, spent, remaining: Math.max(0, daily - spent) },
  };
}

// --- Load the handoff --------------------------------------------------------
function loadHandoff() {
  const explicit = arg('handoff');
  let path;
  if (explicit) {
    path = isAbsolute(explicit) ? explicit : join(process.cwd(), explicit);
  } else if (hasFlag('latest')) {
    if (!existsSync(HANDOFF_INBOX)) throw new Error(`no handoff inbox at ${HANDOFF_INBOX}`);
    const files = readdirSync(HANDOFF_INBOX)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({ f, m: statSync(join(HANDOFF_INBOX, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (!files.length) throw new Error(`handoff inbox is empty: ${HANDOFF_INBOX}`);
    path = join(HANDOFF_INBOX, files[0].f);
  } else {
    throw new Error('provide --handoff <path> or --latest');
  }
  return { path, handoff: JSON.parse(readFileSync(path, 'utf8')) };
}

// --- Build the resume prompt (Charter + lane/task + state pointer) -----------
function buildPrompt(h) {
  let charter = '';
  const cf = join(BUNDLE_DIR, 'charter', 'charter.yml');
  if (existsSync(cf)) charter = readFileSync(cf, 'utf8');
  const sp = h.state_pointer || {};
  return [
    'You are being resumed by the always-on PoeTech NAS orchestrator after the',
    'previous session went offline. Operate under this Charter (policy as config):',
    '', '--- CHARTER ---', charter.trim(), '--- END CHARTER ---', '',
    `Lane: ${h.lane}`,
    `State pointer: ${sp.kind} -> ${sp.ref}${sp.note ? ` (${sp.note})` : ''}`,
    h.offline_message ? `Prior offline message: ${h.offline_message}` : '',
    '', 'Resume this task now:', h.task,
  ].filter(Boolean).join('\n');
}

// --- The tiered summon (vendor-first / local-first / private) ----------------
async function summon(h, primaryVendor) {
  const prompt = buildPrompt(h);
  // Private => local-only, every mode (sovereignty gate).
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
  // local-first (GPU-era end state): local tries; escalate the hard ones. v1
  // keeps it simple — local then the affinity vendor; the judge loop lands later.
  try {
    const r = await VENDORS.local(prompt);
    return { ...r, vendor: 'local', route: 'local-first' };
  } catch {
    const r = await VENDORS[primaryVendor](prompt);
    return { ...r, vendor: primaryVendor, route: 'local-first-escalated' };
  }
}

async function main() {
  let loaded;
  try { loaded = loadHandoff(); }
  catch (e) { logEvent('wake_error', e.message); process.exit(1); }
  const { path, handoff } = loaded;

  const v = validateHandoff(handoff);
  if (!v.ok) {
    logEvent('wake_invalid', `handoff ${path} invalid: ${v.errors.join('; ')}`);
    console.error(`[refuse] invalid handoff: ${v.errors.join('; ')}`);
    process.exit(1);
  }

  const due = isWakeDue(handoff, nowMs());
  const pick = pickVendor(handoff, { mode: MODE });
  const gate = brakeGate();
  const wantSummon = hasFlag('summon');

  const plan = `lane=${handoff.lane} type=${handoff.work_type || 'default'} private=${!!handoff.private} `
    + `due=${due.due}(${due.reason}) primary=${pick.vendor}(${pick.reason}) mode=${MODE} `
    + `brakes=${gate.go ? 'GO' : 'HOLD:' + gate.reasons.join(',')} `
    + `budget[daily=$${gate.budget.daily} spent=$${gate.budget.spent.toFixed(2)} remaining=$${gate.budget.remaining.toFixed(2)}]`;

  // PLAN-ONLY: not due, or no --summon, or any brake not GO. Log intent, no call.
  if (!due.due) { logEvent('wake_pending', plan); console.log(`[pending] ${plan}`); return; }
  if (!wantSummon) { logEvent('wake_plan', `DUE but plan-only (no --summon): ${plan}`); console.log(`[plan-only] ${plan}\n(add --summon to call, once armed)`); return; }
  if (!gate.go) { logEvent('wake_inert', `DUE + --summon but brakes HOLD: ${plan}`); console.log(`[inert] brakes HOLD: ${gate.reasons.join('; ')}\n${plan}`); return; }

  // ARMED + DUE + --summon + all brakes GO => the one real summon.
  logEvent('wake_summon_start', plan);
  try {
    const res = await summon(handoff, pick.vendor);
    const cost = estimateCostUsd(res.model, res.usage);
    const newSpent = recordSpend(cost.usd);
    logEvent('wake_summon_done',
      `vendor=${res.vendor} route=${res.route} model=${res.model} `
      + `tokens[in=${res.usage.input_tokens} out=${res.usage.output_tokens}] `
      + `cost=${cost.known ? '$' + cost.usd.toFixed(4) : 'unknown-model'} daily_spent=$${newSpent.toFixed(4)}`);
    console.log(`\n=== RESUMED via ${res.vendor.toUpperCase()} (${res.route}) ===\n${res.text}\n`);
    console.log(`[done] cost ${cost.known ? '$' + cost.usd.toFixed(4) : 'unknown'} | daily spend $${newSpent.toFixed(4)} / $${gate.budget.daily} | one task, one summon, no loop.`);
  } catch (e) {
    logEvent('wake_summon_error', `vendor summon failed: ${e.message}`);
    console.error(`[error] summon failed: ${e.message}`);
    process.exit(1);
  }
}

main().catch((e) => { logEvent('wake_error', e.message); console.error(`[error] ${e.message}`); process.exit(1); });
