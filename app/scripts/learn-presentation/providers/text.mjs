// =============================================================================
// text providers — one interface: complete({ system, user, signal }) -> { text, model, costCents }
// =============================================================================
// Keys come only from the environment. A provider with no key refuses with a
// plain message; nothing falls back to a different paid provider silently.
// `fetchImpl` is injectable so tests never touch the network.
// =============================================================================
import process from 'node:process';
import { ProviderError } from '../lib/limits.mjs';

async function readError(res) {
  let body = '';
  try { body = (await res.text()).slice(0, 400); } catch { /* none */ }
  return new ProviderError(`HTTP ${res.status}: ${body}`, { status: res.status });
}

export function anthropicText({ apiKey = process.env.ANTHROPIC_API_KEY, model = process.env.LEARN_TEXT_MODEL || 'claude-haiku-5-5', maxTokens = 1200, costCents = 1, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) throw new ProviderError('anthropic: ANTHROPIC_API_KEY is not set — refusing to run (no key, no spend).', { retryable: false });
  return {
    name: 'anthropic',
    model,
    async complete({ system, user, signal }) {
      const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      });
      if (!res.ok) throw await readError(res);
      const j = await res.json();
      const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
      return { text, model, costCents };
    },
  };
}

/** Any OpenAI-compatible chat endpoint: Ollama, LM Studio, vLLM on the NAS. */
export function localText({ baseUrl = process.env.LEARN_LOCAL_TEXT_URL, model = process.env.LEARN_LOCAL_TEXT_MODEL || 'llama3.1:8b', apiKey = process.env.LEARN_LOCAL_TEXT_KEY || '', fetchImpl = globalThis.fetch } = {}) {
  if (!baseUrl) throw new ProviderError('local: LEARN_LOCAL_TEXT_URL is not set (e.g. http://nas:11434/v1).', { retryable: false });
  return {
    name: 'local',
    model,
    async complete({ system, user, signal }) {
      const res = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
        body: JSON.stringify({ model, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      if (!res.ok) throw await readError(res);
      const j = await res.json();
      return { text: (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '', model, costCents: 0 };
    },
  };
}

export function textProvider(name, opts = {}) {
  if (name === 'anthropic') return anthropicText(opts);
  if (name === 'local') return localText(opts);
  throw new ProviderError(`unknown text provider "${name}" (anthropic | local)`, { retryable: false });
}
