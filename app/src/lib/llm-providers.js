// =============================================================================
// llm-providers — the provider-agnostic register of routable "brains" (pure core)
// =============================================================================
// Declared by Darrell 2026-07-08: "I want to give the local LLMs specs to add to
// the build and project pipeline with or without Claude, and give work to Gemini,
// Claude, or any vendor LLM." This is the single source of WHICH backend can take
// WHICH kind of work — the LLM sibling of church-devices.js (the device register)
// and the thing the deterministic router (llm-router.js) matches specs against,
// exactly like gpu-scheduler.js matches GPU jobs against the device register.
//
// TWO KINDS of provider:
//   - 'local'  : a sovereign Ollama model on a church GPU node (verified tonight;
//                $0, no vendor, no data leaves the mesh). Called SERVER-SIDE only.
//   - 'vendor' : a hosted API (Claude / Gemini / OpenAI / ...). Needs a key that
//                lives SERVER-SIDE (the self-orchestrating BOX AGENT's env / a
//                secrets store the box reads — NOT n8n; see DR-0088) and is NEVER
//                inlined into the PWA client bundle (the VITE_ vars are
//                public-by-design — a vendor key there would leak). keyPresent
//                reflects server config, defaulting false until Darrell provides it.
//
// PURE (no React, no network, no fs) so the gate proves its derivations
// (Verification Doctrine, DR-0076). Availability is HONEST: 'available' only where
// tonight's probe proved it; 'degraded'/'unconfigured'/'offline' otherwise. The
// register never claims a backend is ready without evidence.
//
// SAFETY MODEL (why "without Claude" is safe): a provider only ever PROPOSES work
// (a PR / a board task); the build pipeline's deterministic GATES dispose (ci.yml,
// auto-merge.yml green-required, tests, monolith budget, contrast/legibility
// guards). The router trusts the gates, not the model. The autonomous runner that
// drives this without a Claude session is the self-orchestrating box agent polling
// the Supabase bus (DR-0088 — NOT n8n's fragile inbound path); it is Tier C and
// ships INERT (three brakes). That lives in llm-router.js, not here; this file
// only DESCRIBES the backends.
// =============================================================================

// --- Taxonomy ----------------------------------------------------------------

export const PROVIDER_KINDS = ['local', 'vendor'];

// LLM task capabilities — the vocabulary the router matches a spec against.
// Kept deliberately coarse; a spec declares ONE required capability.
export const LLM_CAPABILITIES = [
  { token: 'reasoning',      label: 'Deep reasoning / architecture / judgment' },
  { token: 'code-gen',       label: 'Code generation' },
  { token: 'code-review',    label: 'Code review' },
  { token: 'content-draft',  label: 'Content / copy drafting' },
  { token: 'classification', label: 'Classification / triage' },
  { token: 'long-context',   label: 'Long-context synthesis' },
  { token: 'vision',         label: 'Vision / image understanding' },
  { token: 'transcription',  label: 'Speech-to-text (Whisper)' },
  { token: 'embedding',      label: 'Embeddings / RAG' },
  { token: 'image-gen',      label: 'Image generation (diffusion)' },
  { token: 'video-gen',      label: 'Video generation (diffusion)' },
];
export const CAPABILITY_TOKENS = LLM_CAPABILITIES.map((c) => c.token);

// Operational status. `tone` is a KpiDot tone (good/idle/attention/problem).
export const PROVIDER_STATUSES = [
  { id: 'available',    label: 'Available',    tone: 'good' },      // proven reachable + ready
  { id: 'degraded',     label: 'Degraded',     tone: 'attention' }, // reachable but not production-ready
  { id: 'unconfigured', label: 'Unconfigured', tone: 'idle' },      // needs a key / a pull / persistence
  { id: 'offline',      label: 'Offline',      tone: 'problem' },   // not reachable
];
export const PROVIDER_STATUS_IDS = PROVIDER_STATUSES.map((s) => s.id);

// Cost tiers — the router prefers cheaper/sovereign when a capability is matched
// by more than one provider. Lower rank = preferred.
export const COST_TIERS = [
  { id: 'free-local', label: 'Free (sovereign, on-mesh)', rank: 0 },
  { id: 'low',        label: 'Low',  rank: 1 },
  { id: 'med',        label: 'Medium', rank: 2 },
  { id: 'high',       label: 'High',  rank: 3 },
];
export function costRank(id) {
  const t = COST_TIERS.find((c) => c.id === id);
  return t ? t.rank : 99;
}

export function capabilityLabel(token) {
  return (LLM_CAPABILITIES.find((c) => c.token === token) || {}).label || token;
}
export function statusTone(id) {
  return (PROVIDER_STATUSES.find((s) => s.id === id) || {}).tone || 'idle';
}
export function statusLabel(id) {
  return (PROVIDER_STATUSES.find((s) => s.id === id) || {}).label || id || 'Unknown';
}

// --- Normalizer --------------------------------------------------------------

let seq = 0;
function nextId() { seq += 1; return `llm-${seq}`; }

// Normalize a partial provider into the full local shape. Defensive: unknown
// kind/status/cost fall back rather than throwing, so a stray config value never
// blanks the register.
export function makeProvider(partial = {}) {
  const p = partial || {};
  const kind = PROVIDER_KINDS.includes(p.kind) ? p.kind : 'vendor';
  const status = PROVIDER_STATUS_IDS.includes(p.status) ? p.status : 'unconfigured';
  const costTier = COST_TIERS.some((c) => c.id === p.costTier) ? p.costTier : (kind === 'local' ? 'free-local' : 'high');
  const capabilities = Array.isArray(p.capabilities)
    ? p.capabilities.filter((c) => CAPABILITY_TOKENS.includes(c))
    : [];
  return {
    id:          p.id || nextId(),
    name:        (p.name && String(p.name).trim()) || 'Untitled provider',
    kind,
    // local: which church_devices slug + Ollama model + server-side endpoint.
    deviceSlug:  p.deviceSlug ?? null,
    ollamaModel: p.ollamaModel ?? null,
    runtime:     p.runtime ?? (p.ollamaModel ? 'ollama' : null), // 'ollama' | 'comfyui' | 'diffusers' | null (vendor)
    endpoint:    p.endpoint ?? null,          // server-side reachable URL (box agent over Supabase bus), never the browser
    // vendor: which API + model + the SERVER-SIDE env var holding the key.
    apiId:       p.apiId ?? null,
    model:       p.model ?? null,             // null = set via server config (do not fabricate)
    keyEnv:      p.keyEnv ?? null,
    keyRequired: p.keyRequired === true,
    keyPresent:  p.keyPresent === true,       // reflects SERVER config; default false
    capabilities,
    costTier,
    status,
    sovereign:   p.sovereign === true,        // true = on-mesh, no data leaves
    confirmed:   p.confirmed === true,        // an availability actually proven by a probe
    notes:       p.notes ?? null,
    active:      p.active !== false,
    sortOrder:   Number.isFinite(p.sortOrder) ? p.sortOrder : 0,
  };
}

// --- Validation (proven-to-catch gate) ---------------------------------------

export function validateProvider(provider) {
  const errors = [];
  if (!provider || typeof provider !== 'object') return { ok: false, errors: ['provider is not an object'] };
  if (!provider.name || !String(provider.name).trim()) errors.push('name is required');
  if (!PROVIDER_KINDS.includes(provider.kind)) errors.push(`unknown kind "${provider.kind}"`);
  if (!PROVIDER_STATUS_IDS.includes(provider.status)) errors.push(`unknown status "${provider.status}"`);
  if (!Array.isArray(provider.capabilities)) errors.push('capabilities must be an array');
  else for (const c of provider.capabilities) {
    if (!CAPABILITY_TOKENS.includes(c)) errors.push(`unknown capability "${c}"`);
  }
  if (provider.kind === 'local' && !provider.ollamaModel && !provider.model) errors.push('local provider needs a model (ollamaModel for LLM, or model for a diffusion runtime)');
  if (provider.kind === 'vendor' && provider.keyRequired && !provider.keyEnv) errors.push('vendor provider needs a keyEnv (server-side key name)');
  // Honesty gate: a provider cannot be 'available' if it still needs a key.
  if (provider.status === 'available' && provider.keyRequired && !provider.keyPresent) {
    errors.push('cannot be "available" while keyRequired and key absent');
  }
  return { ok: errors.length === 0, errors };
}

// --- Derivations (the surface + router + tests share these) ------------------

// A provider is dispatchable RIGHT NOW only when active, status 'available', and
// (if a vendor) its key is present. This is the honest "can it take work now" gate.
export function isDispatchable(provider) {
  if (!provider || provider.active === false) return false;
  if (provider.status !== 'available') return false;
  if (provider.keyRequired && !provider.keyPresent) return false;
  return true;
}

// providersForCapability — active providers advertising a capability, ordered by
// cost rank (sovereign/free first), then sortOrder. The router's candidate list.
export function providersForCapability(providers, capability, { dispatchableOnly = false } = {}) {
  return (providers || [])
    .filter((p) => p.active !== false && (p.capabilities || []).includes(capability))
    .filter((p) => (dispatchableOnly ? isDispatchable(p) : true))
    .sort((a, b) => (costRank(a.costTier) - costRank(b.costTier)) || (a.sortOrder - b.sortOrder) || String(a.id).localeCompare(String(b.id)));
}

export function summarizeProviders(providers) {
  const list = (providers || []).filter((p) => p.active !== false);
  const byStatus = {};
  for (const s of PROVIDER_STATUS_IDS) byStatus[s] = 0;
  let local = 0; let vendor = 0; let dispatchable = 0; let sovereign = 0;
  for (const p of list) {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    if (p.kind === 'local') local += 1; else vendor += 1;
    if (isDispatchable(p)) dispatchable += 1;
    if (p.sovereign) sovereign += 1;
  }
  return { total: list.length, local, vendor, dispatchable, sovereign, byStatus };
}

// mergeSeedAndRows — DB/config rows are authoritative; the seed supplies the known
// baseline so a fresh instance still shows the real register. Same contract as
// church-devices.mergeSeedAndRows (DB row with same id REPLACES its seed twin).
export function mergeSeedAndRows(seed, rows) {
  const byId = new Map();
  for (const p of seed || []) byId.set(p.id, p);
  for (const r of rows || []) byId.set(r.id, r);
  return Array.from(byId.values());
}

// --- SEED: the real known backends, grounded in the 2026-07-08 verification -----
// Availability is HONEST per tonight's probes (see
// docs/99-session-notes/2026-07-08-church-cuda-orchestration-positions.md).
export const SEED_PROVIDERS = [
  // --- Local sovereign (church GPU mesh) -------------------------------------
  makeProvider({
    id: 'local-qwen-livestream',
    name: 'Local qwen2.5:14b — livestream-main-pc (RIGHT)',
    kind: 'local',
    deviceSlug: 'dev-gpu-node-2',
    ollamaModel: 'qwen2.5:14b-instruct-q4_K_M',
    endpoint: 'http://100.72.5.90:11434',
    capabilities: ['code-gen', 'code-review', 'content-draft', 'classification'],
    costTier: 'free-local',
    status: 'available',
    sovereign: true,
    confirmed: true,
    notes: 'VERIFIED 2026-07-08: 45 tok/s warm, 100% GPU (RTX 4070). DR-0012: do NOT dispatch during live services — this box encodes the stream. Endpoint reached by the box agent over the Supabase bus (DR-0088) — not n8n, not the browser.',
    sortOrder: 10,
  }),
  makeProvider({
    id: 'local-qwen-coder-livestream',
    name: 'Local qwen2.5-coder:14b — livestream-main-pc (RIGHT)',
    kind: 'local',
    deviceSlug: 'dev-gpu-node-2',
    ollamaModel: 'qwen2.5-coder:14b',
    endpoint: 'http://100.72.5.90:11434',
    capabilities: ['code-gen', 'code-review'],
    costTier: 'free-local',
    status: 'available',
    sovereign: true,
    confirmed: true,
    notes: 'VERIFIED present 2026-07-08 (ollama /api/tags). Coder model — first choice for code-gen/review offload. DR-0012 live-service guard applies.',
    sortOrder: 20,
  }),
  makeProvider({
    id: 'local-embed-livestream',
    name: 'Local nomic-embed-text — livestream-main-pc (RIGHT)',
    kind: 'local',
    deviceSlug: 'dev-gpu-node-2',
    ollamaModel: 'nomic-embed-text:latest',
    endpoint: 'http://100.72.5.90:11434',
    capabilities: ['embedding'],
    costTier: 'free-local',
    status: 'available',
    sovereign: true,
    confirmed: true,
    notes: 'VERIFIED present 2026-07-08. Embeddings for RAG.',
    sortOrder: 30,
  }),
  makeProvider({
    id: 'local-qwen-tlcmedia',
    name: 'Local qwen2.5:14b — tlcmediadpt (LEFT, dedicated AI tower)',
    kind: 'local',
    deviceSlug: 'dev-gpu-node-1',
    ollamaModel: 'qwen2.5:14b-instruct-q4_K_M',
    endpoint: 'http://100.69.19.13:11434',
    capabilities: ['code-gen', 'code-review', 'content-draft', 'classification'],
    costTier: 'free-local',
    status: 'unconfigured',
    sovereign: true,
    confirmed: false,
    notes: 'Ollama installed 2026-07-08; qwen2.5:14b pulled (9 GB). This is the dedicated AI tower (no DR-0012 livestream conflict) — becomes the preferred local node once headless persistence lands. Not dispatchable until status flips to available.',
    sortOrder: 40,
  }),
  // --- Local sovereign image generation (Flux) — the $0, on-mesh media path -----
  makeProvider({
    id: 'local-flux-tlcmedia',
    name: 'Local Flux image-gen — tlcmediadpt (LEFT, dedicated AI tower)',
    kind: 'local',
    deviceSlug: 'dev-gpu-node-1',
    runtime: 'comfyui',
    model: 'flux.1-schnell',
    endpoint: 'http://100.69.19.13:8188', // ComfyUI default; TBD when stood up
    capabilities: ['image-gen'],
    costTier: 'free-local',
    status: 'unconfigured',
    sovereign: true,
    confirmed: false,
    notes: 'The sovereign, $0 image path (AI-MEDIA-PRODUCTION vision; DR-0088 keeps it off vendor rails). LICENSING VERIFIED 2026-07-08 (deep-research): FLUX.1-schnell is Apache-2.0 — unrestricted COMMERCIAL use of weights AND outputs, no revenue cap; ~7 GB via Q4 GGUF fits the 4070 in ComfyUI. Verified fully-open alternatives if we want higher quality on-mesh: Qwen-Image (7B) and Z-Image-Turbo (6B), both Apache-2.0, 4070-fit. (FLUX.2 [dev] is better quality but Non-Commercial weights + needs >12 GB — do NOT self-host it as a business without a paid BFL license.) UNVERIFIED: the LEFT box has NO Python/torch/ComfyUI yet (probed). Path to arm: install Python + ComfyUI + FLUX.1-schnell Q4 GGUF. Not dispatchable until status flips to available.',
    sortOrder: 45,
  }),
  // --- Vendor (hosted APIs) — keyless until Darrell provides a SERVER-SIDE key --
  makeProvider({
    id: 'vendor-claude',
    name: 'Anthropic Claude (Opus 4.8 / Sonnet 5 / Haiku 4.5)',
    kind: 'vendor',
    apiId: 'anthropic',
    model: 'claude-opus-4-8', // default tier; Sonnet 5 = claude-sonnet-5, Haiku 4.5 = claude-haiku-4-5-20251001
    keyEnv: 'ANTHROPIC_API_KEY',
    keyRequired: true,
    keyPresent: false,
    capabilities: ['reasoning', 'code-gen', 'code-review', 'content-draft', 'long-context', 'vision'],
    costTier: 'high',
    status: 'unconfigured',
    sovereign: false,
    notes: 'The reasoning tier. Key lives SERVER-SIDE (NAS n8n creds / box agent env), NEVER in the PWA bundle. Reserve for work the local tier cannot do well (architecture, judgment) to preserve the weekly budget.',
    sortOrder: 50,
  }),
  makeProvider({
    id: 'vendor-gemini',
    name: 'Google Gemini',
    kind: 'vendor',
    apiId: 'google',
    model: null, // set via server config — model id NOT fabricated here
    keyEnv: 'GEMINI_API_KEY',
    keyRequired: true,
    keyPresent: false,
    capabilities: ['reasoning', 'long-context', 'vision', 'content-draft'],
    costTier: 'med',
    status: 'unconfigured',
    sovereign: false,
    notes: 'Alternative vendor for long-context / vision. Model id + key set server-side. Not fabricating a model id — configure it when the key is added.',
    sortOrder: 60,
  }),
  makeProvider({
    id: 'vendor-openai',
    name: 'OpenAI',
    kind: 'vendor',
    apiId: 'openai',
    model: null, // set via server config
    keyEnv: 'OPENAI_API_KEY',
    keyRequired: true,
    keyPresent: false,
    capabilities: ['reasoning', 'code-gen', 'content-draft', 'vision'],
    costTier: 'high',
    status: 'unconfigured',
    sovereign: false,
    notes: 'Optional third vendor slot. Model id + key server-side. Included so the router is genuinely vendor-agnostic, not Claude-only.',
    sortOrder: 70,
  }),
];
