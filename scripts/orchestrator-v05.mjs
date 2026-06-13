// =============================================================================
// orchestrator-v05 — bounded auto-escalation (DR-0056 v0.5)
// =============================================================================
// v0 let you FEEL the ladder with a human approving each vendor call. v0.5 adds
// the three things that make it start carrying weight, on ONE task type at a
// time, still human-TRIGGERED (you run it; no scheduler, no unattended spend):
//
//   1. A REAL outcome-judge — a structured rubric (completeness / correctness /
//      instruction-following), scored 0-10 with a reason, not a naive self-rating.
//   2. BOUNDED auto-escalation (--auto) — within a per-run + per-day budget, if
//      local fails the bar it escalates WITHOUT asking, judges the vendor output,
//      and accepts or falls back. No human in the per-call loop, but bounded.
//   3. An AUDIT LEDGER — every run appends to orchestrator-audit.jsonl (the Cage
//      audit seedling): the receipt + the spend/escalation tracker.
//
// Still NOT v1: no scheduler, no Cage egress guard, no unattended runs. v1 (Tier
// C) adds those. The budget here is the seedling of the three-brakes BUDGET.
//
// Usage:
//   node scripts/orchestrator-v05.mjs "task ..." --type=code            # advisory
//   node scripts/orchestrator-v05.mjs "task ..." --type=code --auto     # bounded auto
//   node scripts/orchestrator-v05.mjs "private ..." --private           # local-only
//
// Env: OLLAMA_URL (default http://192.168.1.26:11434), OLLAMA_MODEL
//   (qwen2.5:14b-instruct-q4_K_M), ANTHROPIC_API_KEY / GEMINI_API_KEY (env OR a
//   secrets file under ORCH_SECRETS_DIR, default /volume1/PoeTech/secrets),
//   ORCH_THRESHOLD (7), ORCH_DAILY_MAX_ESCALATIONS (20),
//   ORCH_AUDIT (orchestrator-audit.jsonl), ORCH_DRY_RUN.
// =============================================================================
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.1.26:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct-q4_K_M';
const THRESHOLD = Number(process.env.ORCH_THRESHOLD || 7);
const DAILY_MAX = Number(process.env.ORCH_DAILY_MAX_ESCALATIONS || 20);
const AUDIT = process.env.ORCH_AUDIT || 'orchestrator-audit.jsonl';

// Env-first secret with a secrets-file fallback (set the key once on the runner;
// never re-typed, committed, or logged). ORCH_SECRETS_DIR overrides the NAS
// default. Missing dir/file degrades to undefined.
function secret(envName, fileName) {
  if (process.env[envName]) return process.env[envName];
  const dir = process.env.ORCH_SECRETS_DIR || '/volume1/PoeTech/secrets';
  try { const v = readFileSync(`${dir}/${fileName}`, 'utf8').trim(); return v || undefined; } catch { return undefined; }
}

const AFFINITY = {
  code: 'claude', refactor: 'claude', agentic: 'claude', writing: 'claude',
  longcontext: 'gemini', multimodal: 'gemini', research: 'gemini', default: 'claude',
};
export function pickVendor(type) {
  return AFFINITY[String(type || 'default').toLowerCase()] || AFFINITY.default;
}
// Parse "SCORE: N" (or a bare number) from the judge; default 5 if unreadable.
export function parseScore(text) {
  const m = String(text || '').match(/SCORE:\s*(10|[0-9])/i) || String(text || '').match(/\b(10|[0-9])\b/);
  return m ? Number(m[1]) : 5;
}
// BUDGET BRAKE: count today's escalations in the audit ledger; refuse past the
// daily cap (the rate-bound on harm — DR-0056 sub-budget seedling).
export function escalationsToday(auditText, today) {
  if (!auditText) return 0;
  let n = 0;
  for (const line of auditText.split('\n')) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r.escalated && String(r.ts || '').slice(0, 10) === today) n += 1; } catch { /* skip */ }
  }
  return n;
}

const arg = (name) => { const h = process.argv.find(a => a.startsWith(`--${name}=`)); return h ? h.split('=').slice(1).join('=') : undefined; };
const hasFlag = (name) => process.argv.includes(`--${name}`);

async function callOllama(prompt) {
  const r = await fetch(`${OLLAMA_URL}/api/generate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }) });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  return (await r.json()).response || '';
}
async function callClaude(prompt) {
  const key = secret('ANTHROPIC_API_KEY', 'anthropic-api-key.txt'); if (!key) throw new Error('ANTHROPIC_API_KEY not set (env or secrets file)');
  const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`claude ${r.status}`);
  const j = await r.json(); return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}
async function callGemini(prompt) {
  const key = secret('GEMINI_API_KEY', 'gemini-api-key.txt'); if (!key) throw new Error('GEMINI_API_KEY not set (env or secrets file)');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${key}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  if (!r.ok) throw new Error(`gemini ${r.status}`);
  const j = await r.json(); return (((j.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text).join('\n') || '';
}
const callVendor = (v, p) => (v === 'gemini' ? callGemini(p) : callClaude(p));

// The real judge: a rubric, scored by the local model (cheap), with a reason.
async function judge(task, answer) {
  const out = await callOllama(`You are a strict reviewer. Task:\n${task}\n\nAnswer:\n${answer}\n\nScore 0-10 on completeness, correctness, and instruction-following combined. Reply EXACTLY:\nSCORE: <number>\nREASON: <one line>`);
  return { score: parseScore(out), raw: out.trim() };
}

function audit(rec) {
  try { appendFileSync(AUDIT, JSON.stringify({ ts: new Date().toISOString(), ...rec }) + '\n'); } catch (e) { console.error(`[audit] write failed: ${e.message}`); }
}

async function main() {
  const task = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ').trim();
  const type = arg('type') || 'default';
  const isPrivate = hasFlag('private');
  const auto = hasFlag('auto');
  const vendor = pickVendor(type);
  const today = new Date().toISOString().slice(0, 10);
  if (!task) { console.error('Provide a task. See scripts/README-orchestrator-v0.md'); process.exit(1); }

  const usedToday = escalationsToday(existsSync(AUDIT) ? readFileSync(AUDIT, 'utf8') : '', today);

  if (process.env.ORCH_DRY_RUN) {
    console.log(`[dry-run] type=${type} vendor=${vendor} auto=${auto} private=${isPrivate} escalations-today=${usedToday}/${DAILY_MAX} threshold=${THRESHOLD}`);
    process.exit(0);
  }

  // Tier 0 — local.
  const local = await callOllama(task);
  const lj = await judge(task, local);
  console.log(`\n=== LOCAL (${OLLAMA_MODEL}) — judge ${lj.score}/10 ===\n${local}\n[judge] ${lj.raw}\n`);

  if (isPrivate) {
    audit({ type, escalated: false, local_score: lj.score, accepted: 'local', reason: 'private-gate' });
    console.log(`[gate] PRIVATE: local-only, never escalated. (the local floor stands.)`);
    return;
  }
  if (lj.score >= THRESHOLD) {
    audit({ type, escalated: false, local_score: lj.score, accepted: 'local' });
    console.log(`[accept] local cleared the bar (${lj.score} >= ${THRESHOLD}). Cost: $0. Done.`);
    return;
  }
  // Below the bar. Budget brake: refuse to escalate past the daily cap.
  if (usedToday >= DAILY_MAX) {
    audit({ type, escalated: false, local_score: lj.score, accepted: 'local-best', reason: 'daily-budget-hit' });
    console.log(`[budget] daily escalation cap reached (${usedToday}/${DAILY_MAX}). Keeping local best; not spending. (the brake held.)`);
    return;
  }
  if (!auto) {
    console.log(`[recommend] local ${lj.score}/10 -> this wants ${vendor}. Re-run with --auto (bounded) to let it escalate within budget.`);
    return;
  }
  // Bounded auto-escalation.
  console.log(`[escalate -> ${vendor}] (${usedToday + 1}/${DAILY_MAX} today)`);
  let vendorOut = '', vj = { score: 0, raw: '' };
  try {
    vendorOut = await callVendor(vendor, task);
    vj = await judge(task, vendorOut);
  } catch (e) {
    audit({ type, escalated: true, vendor, local_score: lj.score, accepted: 'local-fallback', reason: `vendor-error:${e.message}` });
    console.log(`\n[fallback] ${vendor} failed (${e.message}). Falling back to local. (perpetual fix: the floor holds.)`);
    return;
  }
  console.log(`\n=== ESCALATED (${vendor}) — judge ${vj.score}/10 ===\n${vendorOut}\n[judge] ${vj.raw}\n`);
  const winner = vj.score >= lj.score ? vendor : 'local';
  audit({ type, escalated: true, vendor, local_score: lj.score, vendor_score: vj.score, accepted: winner });
  console.log(`[done] local ${lj.score} vs ${vendor} ${vj.score} -> kept ${winner}. Terminal: ladder walked once, logged to ${AUDIT}.`);
}

// Only run the CLI when invoked directly — keeps the helpers importable for tests.
if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(`[error] ${e.message}`); process.exit(1); });
}
