// =============================================================================
// image providers — one interface: generate({ prompt, signal }) -> { bytes, ext, model, costCents }
// =============================================================================
// bfl     FLUX 1.1 [pro] Ultra — submit, then poll the returned polling_url.
// openai  GPT Image — /v1/images/generations, base64 response.
// gemini  Google image model — generateContent with an IMAGE response.
// local   ComfyUI on the NAS — POST /prompt, poll /history, fetch /view.
//
// Keys come only from the environment; no key -> refuse, never a silent
// fallback to another paid provider. Every request carries the caller's
// AbortSignal; poll loops are bounded by count AND by that signal.
// =============================================================================
import process from 'node:process';
import { setTimeout, clearTimeout } from 'node:timers';
/* global AbortController */
import { Buffer } from 'node:buffer';
import { URLSearchParams } from 'node:url';
import { readFileSync } from 'node:fs';
import { ProviderError, realSleep } from '../lib/limits.mjs';

async function readError(res, who) {
  let body = '';
  try {
    body = (await res.text()).slice(0, 400);
  } catch {
    /* none */
  }
  return new ProviderError(`${who}: HTTP ${res.status}: ${body}`, { status: res.status });
}
const need = (v, msg) => {
  if (!v) throw new ProviderError(msg, { retryable: false });
  return v;
};
const toBuf = async (res) => Buffer.from(await res.arrayBuffer());
const extOf = (ct, fallback = 'jpg') => (/png/.test(ct || '') ? 'png' : /webp/.test(ct || '') ? 'webp' : /jpe?g/.test(ct || '') ? 'jpg' : fallback);

export function bflImage({
  apiKey = process.env.BFL_API_KEY,
  model = 'flux-pro-1.1-ultra',
  raw = process.env.LEARN_BFL_RAW === '1',
  costCents = 6,
  pollMs = 1500,
  maxPolls = 200,
  fetchImpl = globalThis.fetch,
  sleep = realSleep,
} = {}) {
  need(apiKey, 'bfl: BFL_API_KEY is not set — refusing to run (no key, no spend).');
  return {
    name: 'bfl',
    model,
    costCents,
    async generate({ prompt, signal }) {
      const sub = await fetchImpl(`https://api.bfl.ai/v1/${model}`, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', accept: 'application/json', 'x-key': apiKey },
        body: JSON.stringify({ prompt, aspect_ratio: '16:9', raw, output_format: 'jpeg', safety_tolerance: 2 }),
      });
      if (!sub.ok) {
        // A refused submit was never processed, so it was never billed (batch 1,
        // 2026-11-24: 44x 402 "Insufficient credits", 23x 429 "credit balance is low").
        const err = await readError(sub, 'bfl submit');
        err.billed = false;
        if (sub.status === 402) {
          err.outOfCredit = true;
          err.retryable = false;
        }
        throw err;
      }
      const { polling_url: pollUrl } = await sub.json();
      need(pollUrl, 'bfl: no polling_url in response');
      for (let i = 0; i < maxPolls; i += 1) {
        if (signal && signal.aborted) throw new ProviderError('bfl: aborted while polling', { retryable: true });
        await sleep(pollMs);
        const r = await fetchImpl(pollUrl, { signal, headers: { accept: 'application/json', 'x-key': apiKey } });
        if (!r.ok) throw await readError(r, 'bfl poll');
        const j = await r.json();
        if (j.status === 'Ready') {
          const img = await fetchImpl(j.result.sample, { signal });
          if (!img.ok) throw await readError(img, 'bfl download');
          return { bytes: await toBuf(img), ext: extOf(img.headers.get('content-type')), model, costCents };
        }
        if (/moderated/i.test(j.status || '')) throw new ProviderError(`bfl: ${j.status}`, { retryable: false });
        if (j.status === 'Error' || j.status === 'Failed') throw new ProviderError(`bfl: ${j.status}`, { retryable: true });
      }
      throw new ProviderError('bfl: polling limit reached', { retryable: true });
    },
  };
}

/**
 * The BFL account's credit balance: GET https://api.bfl.ai/v1/credits with the
 * x-key header -> { credits }. Read only; never spends. The price of one picture
 * in credits is MEASURED by the CLI (balance before and after one picture),
 * not assumed from documentation this pipeline cannot read.
 */
export async function bflCredits({ apiKey = process.env.BFL_API_KEY, fetchImpl = globalThis.fetch, timeoutMs = 30000 } = {}) {
  need(apiKey, 'bfl: BFL_API_KEY is not set');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl('https://api.bfl.ai/v1/credits', { signal: ctl.signal, headers: { accept: 'application/json', 'x-key': apiKey } });
    if (!res.ok) throw await readError(res, 'bfl credits');
    const j = await res.json();
    const c = Number(j && j.credits);
    if (!Number.isFinite(c)) throw new ProviderError('bfl credits: no numeric "credits" in the answer', { retryable: false });
    return c;
  } finally {
    clearTimeout(timer);
  }
}

export function openaiImage({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.LEARN_OPENAI_IMAGE_MODEL || 'gpt-image-1.5',
  quality = process.env.LEARN_OPENAI_QUALITY || 'high',
  costCents = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  need(apiKey, 'openai: OPENAI_API_KEY is not set — refusing to run (no key, no spend).');
  const cents = costCents != null ? costCents : quality === 'high' ? 20 : quality === 'medium' ? 5 : 1.3;
  return {
    name: 'openai',
    model,
    costCents: cents,
    async generate({ prompt, signal }) {
      const res = await fetchImpl('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, prompt, size: '1536x1024', quality, n: 1 }),
      });
      if (!res.ok) throw await readError(res, 'openai');
      const j = await res.json();
      const b64 = j.data && j.data[0] && j.data[0].b64_json;
      need(b64, 'openai: no image in response');
      return { bytes: Buffer.from(b64, 'base64'), ext: 'png', model, costCents: cents };
    },
  };
}

export function geminiImage({
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.LEARN_GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
  costCents = 5,
  fetchImpl = globalThis.fetch,
} = {}) {
  need(apiKey, 'gemini: GEMINI_API_KEY is not set — refusing to run (no key, no spend).');
  return {
    name: 'gemini',
    model,
    costCents,
    async generate({ prompt, signal }) {
      const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
        }),
      });
      if (!res.ok) throw await readError(res, 'gemini');
      const j = await res.json();
      const parts = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [];
      const inline = parts.map((p) => p.inlineData || p.inline_data).find(Boolean);
      need(inline && inline.data, 'gemini: no image in response');
      return { bytes: Buffer.from(inline.data, 'base64'), ext: extOf(inline.mimeType || inline.mime_type, 'png'), model, costCents };
    },
  };
}

/**
 * ComfyUI: LEARN_COMFY_WORKFLOW is an API-format workflow JSON file in which
 * the positive prompt text is the literal string "%PROMPT%" and the seed is
 * "%SEED%" (number). Output is the first image the workflow saves.
 */
export function comfyImage({
  baseUrl = process.env.LEARN_COMFY_URL,
  workflowPath = process.env.LEARN_COMFY_WORKFLOW,
  pollMs = 2000,
  maxPolls = 300,
  fetchImpl = globalThis.fetch,
  sleep = realSleep,
  random = Math.random,
} = {}) {
  need(baseUrl, 'local: LEARN_COMFY_URL is not set (e.g. http://nas:8188).');
  const template = readFileSync(need(workflowPath, 'local: LEARN_COMFY_WORKFLOW (workflow JSON path) is not set.'), 'utf8');
  const base = baseUrl.replace(/\/$/, '');
  return {
    name: 'local',
    model: 'comfyui',
    costCents: 0,
    async generate({ prompt, signal }) {
      const seed = Math.floor(random() * 2 ** 31);
      const wf = JSON.parse(template.replace('"%PROMPT%"', JSON.stringify(prompt)).replace('"%SEED%"', String(seed)));
      const sub = await fetchImpl(`${base}/prompt`, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: wf }),
      });
      if (!sub.ok) throw await readError(sub, 'comfy submit');
      const { prompt_id: id } = await sub.json();
      for (let i = 0; i < maxPolls; i += 1) {
        if (signal && signal.aborted) throw new ProviderError('comfy: aborted while polling', { retryable: true });
        await sleep(pollMs);
        const r = await fetchImpl(`${base}/history/${id}`, { signal });
        if (!r.ok) throw await readError(r, 'comfy poll');
        const h = (await r.json())[id];
        if (!h || !h.outputs) continue;
        const img = Object.values(h.outputs).flatMap((o) => o.images || [])[0];
        if (!img) continue;
        const q = new URLSearchParams({ filename: img.filename, subfolder: img.subfolder || '', type: img.type || 'output' });
        const v = await fetchImpl(`${base}/view?${q}`, { signal });
        if (!v.ok) throw await readError(v, 'comfy view');
        return { bytes: await toBuf(v), ext: extOf(v.headers.get('content-type'), 'png'), model: 'comfyui', costCents: 0 };
      }
      throw new ProviderError('comfy: polling limit reached', { retryable: true });
    },
  };
}

export function imageProvider(name, opts = {}) {
  if (name === 'bfl') return bflImage(opts);
  if (name === 'openai') return openaiImage(opts);
  if (name === 'gemini') return geminiImage(opts);
  if (name === 'local') return comfyImage(opts);
  throw new ProviderError(`unknown image provider "${name}" (bfl | openai | gemini | local)`, { retryable: false });
}
