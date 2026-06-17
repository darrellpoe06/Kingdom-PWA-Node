// =============================================================================
// vendors.mjs — multi-vendor call layer for the wake router (pluggable).
// =============================================================================
// One place the tiered router reaches each mind: local (Ollama), Claude, Gemini.
// Each call returns BOTH the text and the token usage so the router can record
// REAL spend against the budget brake (Verification Doctrine: measure cost, do
// not estimate it). Secrets resolve from env first, then a NAS secrets file —
// never committed, never logged. Mirrors scripts/orchestrator-v0.mjs's call
// shape; this module is the shared, pluggable home so new vendors slot in here.

import { readFileSync } from 'node:fs';

// Resolve a secret from the environment first; fall back to a file under the
// runner's secrets dir so the key is set ONCE on the box. Missing => undefined.
export function secret(envName, fileName) {
  if (process.env[envName]) return process.env[envName];
  const dir = process.env.ORCH_SECRETS_DIR || '/volume1/PoeTech/secrets';
  try {
    const v = readFileSync(`${dir}/${fileName}`, 'utf8').trim();
    return v || undefined;
  } catch { return undefined; }
}

// Published list prices ($ per 1M tokens). STARTING defaults — the router learns
// true cost-per-accepted-outcome from the ledger over time (strategy §5). Update
// deliberately; pricing is data, not behavior.
export const PRICE_PER_MTOK = {
  'claude-sonnet-4-6': { in: 3.0, out: 15.0 },
  'claude-opus-4-8': { in: 15.0, out: 75.0 },
  'gemini-2.0-flash': { in: 0.10, out: 0.40 },
  'gemini-1.5-pro': { in: 1.25, out: 5.0 },
  local: { in: 0, out: 0 },
};

// estimateCostUsd(model, usage) -> dollars. usage = { input_tokens, output_tokens }.
// Unknown model => 0 with a flag the caller can surface (honest: do not fabricate
// a price for a model we have no rate for).
export function estimateCostUsd(model, usage = {}) {
  const rate = PRICE_PER_MTOK[model];
  const inTok = Number(usage.input_tokens || 0);
  const outTok = Number(usage.output_tokens || 0);
  if (!rate) return { usd: 0, known: false };
  const usd = (inTok / 1e6) * rate.in + (outTok / 1e6) * rate.out;
  return { usd, known: true };
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct-q4_K_M';

export async function callOllama(prompt, { fetchImpl = fetch } = {}) {
  const r = await fetchImpl(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const j = await r.json();
  return {
    text: j.response || '',
    model: OLLAMA_MODEL,
    usage: { input_tokens: j.prompt_eval_count || 0, output_tokens: j.eval_count || 0 },
  };
}

export async function callClaude(prompt, { fetchImpl = fetch, model } = {}) {
  const key = secret('ANTHROPIC_API_KEY', 'anthropic-api-key.txt');
  if (!key) throw new Error('ANTHROPIC_API_KEY not set (env or secrets file)');
  const useModel = model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const r = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: useModel, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error(`claude ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return {
    text,
    model: useModel,
    usage: { input_tokens: j.usage?.input_tokens || 0, output_tokens: j.usage?.output_tokens || 0 },
  };
}

export async function callGemini(prompt, { fetchImpl = fetch, model } = {}) {
  const key = secret('GEMINI_API_KEY', 'gemini-api-key.txt');
  if (!key) throw new Error('GEMINI_API_KEY not set (env or secrets file)');
  const useModel = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const r = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = (((j.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text).join('\n') || '';
  const um = j.usageMetadata || {};
  return {
    text,
    model: useModel,
    usage: { input_tokens: um.promptTokenCount || 0, output_tokens: um.candidatesTokenCount || 0 },
  };
}

// Pluggable registry: vendor name -> caller. Add a new vendor by registering it
// here (and a price row above). The router never hard-codes a vendor switch.
export const VENDORS = {
  local: callOllama,
  claude: callClaude,
  gemini: callGemini,
};
