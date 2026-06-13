// =============================================================================
// orchestrator-v0 — the tiered-LLM "perpetual fix", advisory edition (DR-0056)
// =============================================================================
// The smallest real taste of the escalation ladder, with a HUMAN in the loop:
//   Tier 0  local (Ollama on the church 4070) tries the task
//   Judge   local rates how completely it solved it (v0: simple self-rating)
//   Tier 1  if it fell short, RECOMMEND the affinity-mapped vendor; the call
//           happens only when you approve it (--escalate)
//   Gate    --private forces local-only; it can NEVER reach a vendor
//
// Advisory + manual = zero autonomous spend, no scheduler, no Cage needed yet.
// This is v0 of DR-0056; v0.5 (bounded auto) and v1 (scheduled, Tier C, three
// brakes) come later. Run it from a machine that can reach the 4070's Ollama.
//
// Usage:
//   node scripts/orchestrator-v0.mjs "your task here" --type=code
//   node scripts/orchestrator-v0.mjs "your task here" --type=code --escalate
//   node scripts/orchestrator-v0.mjs "a private note ..." --private
//
// Env:
//   OLLAMA_URL        default http://localhost:11434  (point at the 4070/NAS)
//   OLLAMA_MODEL      default qwen2.5:14b-instruct-q4_K_M
//   ANTHROPIC_API_KEY for Claude escalation   (env OR a secrets file — below)
//   GEMINI_API_KEY    for Gemini escalation   (env OR a secrets file — below)
//   ORCH_SECRETS_DIR  dir holding {gemini,anthropic}-api-key.txt fallbacks,
//                     read only when the env var is unset (default
//                     /volume1/PoeTech/secrets on the NAS runner)
//   ORCH_THRESHOLD    accept-local bar 0-10, default 7
//   ORCH_DRY_RUN      if set, print the routing plan and exit (no network)
// =============================================================================

import { readFileSync } from 'node:fs';

// Resolve a secret from the environment first; fall back to a file under the
// runner's secrets dir so the key is set ONCE on the box — never re-typed each
// session, never committed, never logged. ORCH_SECRETS_DIR overrides the NAS
// default for a desktop/dev runner. Missing dir/file degrades to undefined.
function secret(envName, fileName) {
  if (process.env[envName]) return process.env[envName];
  const dir = process.env.ORCH_SECRETS_DIR || '/volume1/PoeTech/secrets';
  try { const v = readFileSync(`${dir}/${fileName}`, 'utf8').trim(); return v || undefined; } catch { return undefined; }
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct-q4_K_M';
const THRESHOLD = Number(process.env.ORCH_THRESHOLD || 7);

// Affinity map (starting defaults; the v1 router tunes these from outcomes —
// see 2026-06-13-vendor-llm-routing-strategy.md). Config, not dogma.
const AFFINITY = {
  code: 'claude', refactor: 'claude', agentic: 'claude', writing: 'claude',
  longcontext: 'gemini', multimodal: 'gemini', research: 'gemini',
  default: 'claude',
};
export function pickVendor(type) {
  return AFFINITY[String(type || 'default').toLowerCase()] || AFFINITY.default;
}
// Parse the judge's 0-10 score from free text; default 5 if unreadable.
export function parseScore(text) {
  const m = String(text || '').match(/\b(10|[0-9])\b/);
  return m ? Number(m[1]) : 5;
}

function arg(name) {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}
const hasFlag = (name) => process.argv.includes(`--${name}`);

async function callOllama(prompt) {
  const r = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const j = await r.json();
  return j.response || '';
}

async function callClaude(prompt) {
  const key = secret('ANTHROPIC_API_KEY', 'anthropic-api-key.txt');
  if (!key) throw new Error('ANTHROPIC_API_KEY not set (env or secrets file)');
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`claude ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

async function callGemini(prompt) {
  const key = secret('GEMINI_API_KEY', 'gemini-api-key.txt');
  if (!key) throw new Error('GEMINI_API_KEY not set (env or secrets file)');
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return (((j.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text).join('\n') || '';
}

async function main() {
  const task = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ').trim();
  const type = arg('type') || 'default';
  const isPrivate = hasFlag('private');
  const approvedEscalate = hasFlag('escalate');
  const vendor = pickVendor(type);

  if (!task) { console.error('Provide a task: node scripts/orchestrator-v0.mjs "..." --type=code'); process.exit(1); }

  if (process.env.ORCH_DRY_RUN) {
    console.log(`[dry-run] task-type=${type} -> local(${OLLAMA_MODEL}) first; ` +
      `${isPrivate ? 'PRIVATE: local-only, never escalates' : `if below ${THRESHOLD}/10 -> ${approvedEscalate ? `escalate to ${vendor}` : `recommend ${vendor} (approve with --escalate)`}`}`);
    process.exit(0);
  }

  // Tier 0 — local.
  process.stderr.write(`[local ${OLLAMA_MODEL}] working...\n`);
  const local = await callOllama(task);

  // Judge — local self-rates completeness (v0 heuristic; the v1 judge is a real
  // rubric scored independently — strategy doc §3).
  const rating = await callOllama(`Task:\n${task}\n\nAnswer:\n${local}\n\nRate 0-10 how COMPLETELY the answer solves the task. Reply with only the number.`);
  const score = parseScore(rating);

  console.log(`\n=== LOCAL (${OLLAMA_MODEL}) — self-score ${score}/10 ===\n${local}\n`);

  // Sovereignty gate — private work never leaves the premises (DR-0056).
  if (isPrivate) {
    console.log(`[gate] PRIVATE task: local-only, never escalated. (score ${score}/10; the local floor stands.)`);
    return;
  }
  // Accept local if it cleared the bar — free, private, done.
  if (score >= THRESHOLD) {
    console.log(`[accept] local cleared the bar (${score} >= ${THRESHOLD}). Cost: $0. Done.`);
    return;
  }
  // Below the bar: propose escalation, or escalate if approved.
  if (!approvedEscalate) {
    console.log(`[recommend] local scored ${score}/10 (below ${THRESHOLD}). This one wants ${vendor}. Re-run with --escalate to approve the vendor call.`);
    return;
  }
  process.stderr.write(`[escalate -> ${vendor}] working...\n`);
  const out = vendor === 'gemini' ? await callGemini(task) : await callClaude(task);
  console.log(`\n=== ESCALATED (${vendor}) ===\n${out}\n`);
  console.log(`[done] local ${score}/10 -> escalated to ${vendor}. Terminal: one task, ladder walked once, no loop.`);
}

main().catch(e => { console.error(`[error] ${e.message}`); process.exit(1); });
