// =============================================================================
// church-devices — the asset register for church infrastructure (pure core)
// =============================================================================
// Declared by Darrell 2026-06-29. Every church device recorded as a singular,
// identified ASSET (not a consumable count): the NAS, the GPU machine(s), the
// NovaStar VX1000, the LED video wall, network gear, cameras, the sound board,
// media rigs. Each carries type, location, specs, status, steward, and the JOB
// CAPABILITIES it can run. The capabilities array is what feeds the deterministic
// idle-GPU job router (gpu-scheduler.js): the register is the single source of
// which node can take which job.
//
// This module is PURE (no React, no Supabase) so its derivations are proven by
// the gate (Verification Doctrine, DR-0076). The DB-backed CRUD + sync lives in
// church-devices-sync.js; the surface is components/DeviceInventory.jsx.
//
// REALITY-TRACE (DR-0061 / P15): the SEED_DEVICES below are the REAL known COLG
// infrastructure from the research-review (2026-06-29 session note), NOT painted
// numbers. Where a spec is not yet read off the hardware it is marked
// sme_needed:true / confirmed:false so the surface asks Darrell rather than
// fabricating. Once staff add a real church_devices row with the same slug, the
// DB row overrides the seed (mergeSeedAndRows).
// =============================================================================

// --- Taxonomy ----------------------------------------------------------------

// Device types. `icon` is a UiIcon name (never an emoji — consistency-guard).
export const DEVICE_TYPES = [
  { id: 'nas',           label: 'Storage / NAS',        icon: 'tools' },
  { id: 'gpu-node',      label: 'GPU compute node',     icon: 'sliders' },
  { id: 'server',        label: 'Server / host',        icon: 'sliders' },
  { id: 'led-processor', label: 'LED processor',        icon: 'monitor' },
  { id: 'led-wall',      label: 'LED video wall',       icon: 'monitor' },
  { id: 'display',       label: 'Display / screen',     icon: 'monitor' },
  { id: 'network',       label: 'Network gear',         icon: 'globe' },
  { id: 'camera',        label: 'Camera',               icon: 'monitor' },
  { id: 'security',      label: 'Security device',      icon: 'lock' },
  { id: 'audio-console', label: 'Audio console',        icon: 'volume' },
  { id: 'media-rig',     label: 'Media-team rig',       icon: 'sliders' },
  { id: 'other',         label: 'Other',                icon: 'tools' },
];

export const DEVICE_TYPE_IDS = DEVICE_TYPES.map((t) => t.id);

// Operational status. `tone` is a KpiDot tone (idle/good/attention/problem).
export const DEVICE_STATUSES = [
  { id: 'online',      label: 'Online',      tone: 'good' },
  { id: 'assumed',     label: 'Assumed on',  tone: 'idle' }, // seed baseline: believed on, never measured (no heartbeat yet)
  { id: 'standby',     label: 'Standby',     tone: 'idle' },
  { id: 'offline',     label: 'Offline',     tone: 'idle' },
  { id: 'maintenance', label: 'Maintenance', tone: 'attention' },
  { id: 'planned',     label: 'Planned',     tone: 'idle' },
  { id: 'retired',     label: 'Retired',     tone: 'problem' },
];

export const DEVICE_STATUS_IDS = DEVICE_STATUSES.map((s) => s.id);

// Capability tokens. `gpuJob:true` marks a HEAVY COMPUTE capability the idle-GPU
// scheduler can route batch work to (the others are operational, not batch jobs).
// This list is the canonical vocabulary the router (gpu-scheduler.js) matches on.
export const CAPABILITIES = [
  { token: 'llm-inference',    label: 'Local LLM inference', gpuJob: true },
  { token: 'transcription',    label: 'Transcription (Whisper)', gpuJob: true },
  { token: 'voice-clone',      label: 'Voice clone (XTTS)', gpuJob: true },
  { token: 'video-encode',     label: 'Video encode (NDI/CUDA)', gpuJob: true },
  { token: 'build',            label: 'App build node (npm ci + vite build)', gpuJob: false },
  { token: 'storage',          label: 'Storage', gpuJob: false },
  { token: 'presenter-output', label: 'Presenter / program output', gpuJob: false },
  { token: 'display',          label: 'Display surface', gpuJob: false },
  { token: 'audio-mix',        label: 'Audio mixing', gpuJob: false },
  { token: 'networking',       label: 'Networking', gpuJob: false },
  { token: 'capture',          label: 'Capture / recording', gpuJob: false },
];

export const CAPABILITY_TOKENS = CAPABILITIES.map((c) => c.token);
// The subset the idle-GPU router can dispatch batch jobs to.
export const GPU_JOB_CAPABILITIES = CAPABILITIES.filter((c) => c.gpuJob).map((c) => c.token);

export function typeLabel(id) {
  return (DEVICE_TYPES.find((t) => t.id === id) || {}).label || id || 'Other';
}
export function typeIcon(id) {
  return (DEVICE_TYPES.find((t) => t.id === id) || {}).icon || 'tools';
}
export function statusTone(id) {
  return (DEVICE_STATUSES.find((s) => s.id === id) || {}).tone || 'idle';
}
export function statusLabel(id) {
  return (DEVICE_STATUSES.find((s) => s.id === id) || {}).label || id || 'Unknown';
}
export function capabilityLabel(token) {
  return (CAPABILITIES.find((c) => c.token === token) || {}).label || token;
}
export function isGpuJobCapability(token) {
  return GPU_JOB_CAPABILITIES.includes(token);
}

// --- Normalizer --------------------------------------------------------------

let seq = 0;
function nextId(prefix) { seq += 1; return `${prefix}-${seq}`; }

// Normalize a partial device into the full local shape. Defensive: an unknown
// type/status falls back to 'other'/'planned' rather than throwing, so a stray
// DB value never blanks the register.
export function makeDevice(partial = {}) {
  const p = partial || {};
  const device_type = DEVICE_TYPE_IDS.includes(p.deviceType) ? p.deviceType : 'other';
  const status = DEVICE_STATUS_IDS.includes(p.status) ? p.status : 'planned';
  const capabilities = Array.isArray(p.capabilities)
    ? p.capabilities.filter((c) => CAPABILITY_TOKENS.includes(c))
    : [];
  return {
    id:             p.id || nextId('dev'),
    name:           (p.name && String(p.name).trim()) || 'Untitled device',
    deviceType:     device_type,
    location:       p.location ?? null,
    status,
    steward:        p.steward ?? null,
    makeModel:      p.makeModel ?? null,
    serial:         p.serial ?? null,
    ipAddress:      p.ipAddress ?? null,
    specs:          (p.specs && typeof p.specs === 'object') ? p.specs : {},
    capabilities,
    capitalProjectSlug: p.capitalProjectSlug ?? null,
    smeNeeded:      p.smeNeeded === true,
    confirmed:      p.confirmed === true,
    notes:          p.notes ?? null,
    active:         p.active !== false,
    authorPersona:  p.authorPersona ?? null,
    sortOrder:      Number.isFinite(p.sortOrder) ? p.sortOrder : 0,
  };
}

// --- Validation (proven-to-catch gate) ---------------------------------------

export function validateDevice(device) {
  const errors = [];
  if (!device || typeof device !== 'object') return { ok: false, errors: ['device is not an object'] };
  if (!device.name || !String(device.name).trim()) errors.push('name is required');
  if (!DEVICE_TYPE_IDS.includes(device.deviceType)) errors.push(`unknown deviceType "${device.deviceType}"`);
  if (!DEVICE_STATUS_IDS.includes(device.status)) errors.push(`unknown status "${device.status}"`);
  if (!Array.isArray(device.capabilities)) errors.push('capabilities must be an array');
  else {
    for (const c of device.capabilities) {
      if (!CAPABILITY_TOKENS.includes(c)) errors.push(`unknown capability "${c}"`);
    }
  }
  return { ok: errors.length === 0, errors };
}

// --- Derivations (the surface + tests share these) ---------------------------

export function devicesByType(devices) {
  const out = {};
  for (const id of DEVICE_TYPE_IDS) out[id] = [];
  for (const d of devices || []) (out[d.deviceType] || out.other).push(d);
  return out;
}

export function summarizeDevices(devices) {
  const list = (devices || []).filter((d) => d.active !== false);
  const byStatus = {};
  for (const s of DEVICE_STATUS_IDS) byStatus[s] = 0;
  let smeNeeded = 0;
  let confirmed = 0;
  let compute = 0; // devices that can run at least one GPU batch job
  for (const d of list) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    if (d.smeNeeded) smeNeeded += 1;
    if (d.confirmed) confirmed += 1;
    if ((d.capabilities || []).some(isGpuJobCapability)) compute += 1;
  }
  return {
    total: list.length,
    online: byStatus.online || 0,
    byStatus,
    smeNeeded,
    confirmed,
    computeNodes: compute,
  };
}

// capabilityIndex — { capToken: [device,...] } over ACTIVE devices. The router's
// "which node can take which job" view. Empty arrays for unused capabilities are
// omitted so the surface shows only real coverage.
export function capabilityIndex(devices) {
  const idx = {};
  for (const d of (devices || []).filter((x) => x.active !== false)) {
    for (const c of d.capabilities || []) {
      if (!idx[c]) idx[c] = [];
      idx[c].push(d);
    }
  }
  return idx;
}

// devicesForCapability — active devices that advertise a capability (the router
// uses this to find candidate nodes for a job; gpu-scheduler narrows by status).
export function devicesForCapability(devices, capability) {
  return (devices || []).filter(
    (d) => d.active !== false && (d.capabilities || []).includes(capability),
  );
}

export function smeNeededDevices(devices) {
  return (devices || []).filter((d) => d.active !== false && d.smeNeeded);
}

// mergeSeedAndRows — DB rows are authoritative; the seed supplies the baseline
// KNOWN infrastructure so a fresh church instance still shows the real register
// instead of an empty page. A DB row with the same slug REPLACES its seed twin
// (staff confirmed/edited it); DB rows with new slugs append. Seed-only devices
// keep their honest sme_needed/confirmed flags.
export function mergeSeedAndRows(seed, rows) {
  const bySlug = new Map();
  for (const d of seed || []) bySlug.set(d.id, d);
  for (const r of rows || []) bySlug.set(r.id, r); // DB wins on slug collision
  return Array.from(bySlug.values());
}

// --- SEED: the real known COLG infrastructure register -----------------------
// Grounded in the 2026-06-29 research-review. Every spec NOT yet read off the
// hardware is marked sme_needed:true / confirmed:false — the surface asks Darrell,
// it does not invent. Slugs are stable so a confirmed DB row can override a twin.
export const SEED_DEVICES = [
  makeDevice({
    id: 'dev-nas-ds1621xs',
    name: 'PoeTech NAS — DS1621xs',
    deviceType: 'nas',
    makeModel: 'Synology DS1621xs',
    location: 'TO CONFIRM (home / church rack)',
    status: 'assumed',
    steward: 'Darrell',
    ipAddress: '192.168.1.26',
    specs: {
      cores: 8,
      role: 'n8n + sovereign services + sme-pipeline (faster-whisper INT8, local Ollama qwen2.5:14b)',
      storage: '~100 TB raw planned (5x12 TB); usable depends on RAID (SHR/RAID-5 ~48 TB, RAID-6 ~36 TB) — TO CONFIRM',
    },
    capabilities: ['storage', 'transcription', 'llm-inference'],
    notes: 'CPU-only transcription/LLM (slow — batch overnight). The 192.168.1.26 box runs the same-origin /n8n webhooks. Exact RAID config + final location to confirm.',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 10,
  }),
  makeDevice({
    id: 'dev-gpu-node-1',
    name: 'Church GPU node 1 — tlcmediadpt',
    deviceType: 'gpu-node',
    makeModel: 'NVIDIA GeForce RTX 4070 (12 GB) host — GPU VERIFIED; box make/model TO CONFIRM',
    location: 'Church (sanctuary AV / media)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '100.69.19.13',
    specs: {
      hostname: 'TLCMediaDpt',
      tailscaleIp: '100.69.19.13',
      sshUser: 'creed',
      toolchain: 'node 24.18.0, npm 11.16.0, git 2.55.0 (Windows)',
      repoPath: 'C:\\Users\\creed\\Kingdom-PWA-Node',
      gpu: 'NVIDIA GeForce RTX 4070, 12282 MiB (~12 GB), driver 595.95 — VERIFIED 2026-07-08 (nvidia-smi)',
      services: 'Ollama :11434 NOT responding (2026-07-08 probe) — llm-inference UNVERIFIED here. XTTS :8770 / whisper :8771 not probed.',
      note: 'DR-0012: do NOT run inference during live services on the box encoding the stream.',
    },
    // VERIFIED 2026-07-08: `build` proven (SSH + npm ci + vite build PASS) and GPU
    // proven (RTX 4070 12 GB via nvidia-smi). Ollama did NOT answer, so
    // llm-inference is NOT proven here; transcription/voice-clone/video-encode are
    // unprobed intent. smeNeeded flags the unverified services.
    capabilities: ['build', 'llm-inference', 'transcription', 'voice-clone', 'video-encode'],
    notes: 'VERIFIED build node (2026-07-08): SSH as creed@100.69.19.13, npm ci + vite build PASS (Node via winget). GPU VERIFIED: RTX 4070 12 GB. Python 3.12 + torch 2.6.0+cu124 installed 2026-07-08 -> torch.cuda.is_available()=True on the 4070 (GPU proven usable from Python). Sovereign image-gen (FLUX.1-schnell / ComfyUI) stand-up in progress. Ollama :11434 did NOT respond -> llm-inference UNVERIFIED here. transcription/voice-clone/video-encode still unverified.',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 20,
  }),
  makeDevice({
    id: 'dev-gpu-node-2',
    name: 'Church GPU node 2 — livestream-main-pc',
    deviceType: 'gpu-node',
    makeModel: 'Windows 11 Home (build 26200) tower, NVIDIA GeForce RTX 4070 12 GB — GPU VERIFIED (on-site 2026-07-03 + SSH 2026-07-08)',
    location: 'Church (sanctuary AV / media)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '100.72.5.90',
    specs: {
      hostname: 'LiveStream-Main-PC',
      tailscaleIp: '100.72.5.90',
      sshUser: 'itdepartment',
      toolchain: 'node 24.18.0, npm 11.16.0, git 2.55.0 (Windows; Node pre-installed)',
      repoPath: 'C:\\Users\\itdepartment\\Kingdom-PWA-Node',
      gpu: 'NVIDIA GeForce RTX 4070, 12282 MiB (~12 GB), driver 595.95 — VERIFIED 2026-07-08 (nvidia-smi)',
      services: 'Ollama :11434 VERIFIED 2026-07-08 — models: qwen2.5:14b-instruct-q4_K_M, qwen2.5-coder:14b, nomic-embed-text. XTTS :8770 / whisper :8771 not probed. faster-whisper transcription pipeline install in progress (on-site 2026-07-03).',
      driver: '595.95 (WDDM), CUDA 13.2 max',
      resident: 'Claude Code 2.1.200 (Claude Max) + CLAUDE.md role file (on-site 2026-07-03)',
      onSiteVerified: 'ON-SITE 2026-07-03: hostname, GPU, driver, tailnet address read off the machine.',
      rmmAgent: 'SECURITY: a Tactical RMM (remote-management) agent was found on this machine 2026-07-03 — identify who manages it.',
      note: 'This is the livestream / Presenter box AND the Tailscale agent-runner. DR-0012: do NOT run inference during live services on this box while it encodes the stream. Retiring ProPresenter (PoeTech Presenter parity) frees it fully for AI.',
    },
    // VERIFIED 2026-07-08: `build` proven (SSH as itdepartment + npm ci + vite
    // build PASS), GPU proven (RTX 4070 12 GB), AND llm-inference proven (Ollama
    // :11434 live with 3 models). transcription/voice-clone/video-encode unprobed.
    capabilities: ['build', 'llm-inference', 'transcription', 'voice-clone', 'video-encode', 'presenter-output'],
    notes: 'VERIFIED build node (2026-07-08): SSH as itdepartment@100.72.5.90, npm ci + vite build PASS (Node pre-installed). GPU VERIFIED: RTX 4070 12 GB. llm-inference VERIFIED: Ollama live with qwen2.5:14b-instruct, qwen2.5-coder:14b, nomic-embed-text. Doubles as livestream/Presenter box (DR-0012 live-service guard). transcription/voice-clone/video-encode still unverified.',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 30,
  }),
  makeDevice({
    id: 'dev-vx1000',
    name: 'NovaStar VX1000 Pro — LED processor',
    deviceType: 'led-processor',
    makeModel: 'NovaStar VX1000 Pro all-in-one controller (Pro confirmed on unit 2026-07-03)',
    location: 'Sanctuary AV booth',
    status: 'online',
    steward: 'COLG media team',
    specs: {
      capacity: '6.5 Mpx (10240x8192 max)',
      inputs: '2x HDMI 1.4, 2x DVI, 3G-SDI, 2x 10G fiber',
      layers: '3x 4K layers, 1-frame latency, genlock, 10 presets',
      control: 'RJ45/USB + NovaStar API (optional app control — DR-0075 re-review 2026-09-30)',
    },
    capabilities: ['presenter-output'],
    notes: 'COMMISSIONED 2026-07-03: booth laptop on HDMI-3, one layer Full Screen, screen saved to receiving cards, Preset 1 = service state. As built: 8 of 10 ports, one per column, top-entry chained down. Control: NovaLCT 5.9.1 over USB from the booth laptop.',
    confirmed: true,
    sortOrder: 40,
  }),
  makeDevice({
    id: 'dev-led-wall',
    name: 'Sanctuary LED Video Wall',
    deviceType: 'led-wall',
    makeModel: 'LED Nation USA — Mirackle P1.99mm fine-pitch, 48 cabinets (8 x 6)',
    location: 'Main sanctuary (behind stage)',
    status: 'online',
    steward: 'COLG / Bishop',
    specs: {
      pitch: 'P1.99mm (measured on delivered panels)',
      size: '16.8 ft W x 9.45 ft H (8 x 6 cabinets of 640 x 480 mm)',
      resolution: '2560 x 1440 native (320 x 240 px per cabinet, MEASURED via NovaLCT 2026-07-03)',
      vendor: 'LED Nation USA',
    },
    capabilities: ['display'],
    capitalProjectSlug: 'sanctuary-video-wall',
    notes: 'COMMISSIONED 2026-07-03 — first light + live sermon video full-wall the same night. Punch list: a few dark modules (vendor warranty swap, positions photographed); input EDID nicety for 1:1 pixels. See the Video Wall surface for the full record.',
    confirmed: true,
    sortOrder: 50,
  }),
  makeDevice({
    id: 'dev-av-booth-laptop',
    name: 'AV booth laptop — Alienware',
    deviceType: 'media-rig',
    makeModel: 'Alienware (AMD Ryzen) — Windows 11',
    location: 'Sanctuary AV booth (on the VX1000 Pro)',
    status: 'online',
    steward: 'COLG media team',
    specs: {
      role: 'LED wall operator: NovaLCT 5.9.1 over USB to the VX1000 Pro; feeds wall video on HDMI-3',
      software: 'NovaLCT 5.9.1, Proclaim (presentations), ATEM Software Control, Claude Code 2.1.200 (resident)',
      account: 'IT Department Local (shared)',
      backups: 'NovaLCT screen config exported locally; copy to NAS pending',
    },
    capabilities: ['presenter-output'],
    notes: 'VERIFIED on site 2026-07-03 during wall commissioning. This machine + the VX front panel are the wall operator pair; the runbook lives in its CLAUDE.md. Sunday = wall Preset 1.',
    confirmed: true,
    sortOrder: 45,
  }),
  makeDevice({
    id: 'dev-audio-ql',
    name: 'FOH audio console — Yamaha QL',
    deviceType: 'audio-console',
    makeModel: 'Yamaha QL (QL1 vs QL5 TO CONFIRM)',
    location: 'Sanctuary FOH production desk',
    status: 'assumed',
    steward: 'COLG sound team',
    specs: { control: 'Software-controllable; per-voice EQ-assist lane (staged: assistive -> supervised -> autonomous, three-brakes).' },
    capabilities: ['audio-mix'],
    notes: 'Exact model (QL1/QL5) to confirm. Live-mix AI assist is a separate braked roadmap.',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 60,
  }),
  makeDevice({
    id: 'dev-network-core',
    name: 'Church LAN / network gear',
    deviceType: 'network',
    makeModel: 'TO CONFIRM (switches, Cat6 runs, router, Tailscale node)',
    location: 'Church',
    status: 'assumed',
    steward: 'COLG media team',
    specs: {
      note: 'Cat6 runs feed the LED receiving cards; Tailscale overlay links home<->church. Switch make/model + topology to document.',
      tailnet: 'Verified 2026-07-03: livestream-main-pc 100.72.5.90, poetech (NAS) 100.70.190.47, kingdom-home 100.74.53.117, darrells-z-fold7 100.86.238.88, tlcrackstation 100.66.173.22 (offline 23d)',
    },
    capabilities: ['networking'],
    notes: 'Placeholder for the real switch/router inventory — needs a walk-through to enumerate (rack/closet photos pending). Open question: a Tactical RMM agent manages the control-room tower - who operates it?',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 70,
  }),
  makeDevice({
    id: 'dev-cameras',
    name: 'Cameras / capture rig',
    deviceType: 'camera',
    makeModel: 'TO CONFIRM (camera feeds + switcher + streaming PC)',
    location: 'Sanctuary',
    status: 'assumed',
    steward: 'COLG media team',
    specs: { note: 'Booth = switcher + camera feeds + streaming PC + 2 side screens (from Presenter research). Models to confirm.' },
    capabilities: ['capture'],
    notes: 'Camera/switcher/streaming-PC inventory to enumerate on a media-team walk-through.',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 80,
  }),
];
