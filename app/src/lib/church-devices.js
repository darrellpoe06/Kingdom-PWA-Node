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
  { id: 'switcher',      label: 'Production switcher',   icon: 'sliders' },
  { id: 'network',       label: 'Network gear',         icon: 'globe' },
  { id: 'camera',        label: 'Camera',               icon: 'monitor' },
  { id: 'security',      label: 'Security device',      icon: 'lock' },
  { id: 'audio-console', label: 'Audio console',        icon: 'volume' },
  { id: 'media-rig',     label: 'Media-team rig',       icon: 'sliders' },
  { id: 'printer',       label: 'Printer / MFP',        icon: 'tools' },
  { id: 'iot',           label: 'IoT / smart device',   icon: 'globe' },
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
    // provenance — WHERE this record's facts came from + at what confidence, so the
    // register never presents a scan reading and a hand-wavy guess as equally sure
    // (Verification Doctrine, DR-0076). Convention: 'scan-confirmed 2026-07-08' for a
    // reading off a real network scan, 'needs-eyes-on' for a device the scan could
    // not positively identify, or an on-site/research-review provenance for the rest.
    // Local/seed enrichment only — deviceToRow does not persist it (no DB column yet).
    provenance:     (p.provenance && String(p.provenance).trim()) || null,
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
    provenance: 'research-review 2026-06-29',
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
    ipAddress: '192.168.1.75',
    specs: {
      hostname: 'TLCMediaDpt',
      lanIp: '192.168.1.75 (church LAN, wired) — scan-confirmed 2026-07-08',
      tailscaleIp: '100.69.19.13',
      sshUser: 'creed',
      toolchain: 'node 24.18.0, npm 11.16.0, git 2.55.0 (Windows)',
      repoPath: 'C:\\Users\\creed\\Kingdom-PWA-Node',
      gpu: 'NVIDIA GeForce RTX 4070, 12282 MiB (~12 GB), driver 595.95 — VERIFIED 2026-07-08 (nvidia-smi)',
      peripherals: 'Blackmagic HDMI device attached (scan-confirmed 2026-07-08) — capture/output into the AV chain.',
      services: 'Ollama :11434 NOT responding (2026-07-08 probe) — llm-inference UNVERIFIED here. XTTS :8770 / whisper :8771 not probed.',
      note: 'DR-0012: do NOT run inference during live services on the box encoding the stream. This is the LEFT CUDA tower.',
    },
    // VERIFIED 2026-07-08: `build` proven (SSH + npm ci + vite build PASS) and GPU
    // proven (RTX 4070 12 GB via nvidia-smi). Ollama did NOT answer, so
    // llm-inference is NOT proven here; transcription/voice-clone/video-encode are
    // unprobed intent. smeNeeded flags the unverified services.
    capabilities: ['build', 'llm-inference', 'transcription', 'voice-clone', 'video-encode'],
    notes: 'VERIFIED build node (2026-07-08): SSH as creed@100.69.19.13, npm ci + vite build PASS (Node via winget). GPU VERIFIED: RTX 4070 12 GB. Python 3.12 + torch 2.6.0+cu124 installed 2026-07-08 -> torch.cuda.is_available()=True on the 4070 (GPU proven usable from Python). Sovereign image-gen (FLUX.1-schnell / ComfyUI) stand-up in progress. Ollama :11434 did NOT respond -> llm-inference UNVERIFIED here. transcription/voice-clone/video-encode still unverified. LAN IP 192.168.1.75 + attached Blackmagic HDMI device scan-confirmed 2026-07-08.',
    provenance: 'scan-confirmed 2026-07-08',
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
      lanIpWired: '192.168.1.73 (church LAN, wired) — scan-confirmed 2026-07-08',
      lanIpWifi: '192.168.0.44 (church LAN, Wi-Fi) — scan-confirmed 2026-07-08',
      tailscaleIp: '100.72.5.90',
      sshUser: 'itdepartment',
      toolchain: 'node 24.18.0, npm 11.16.0, git 2.55.0 (Windows; Node pre-installed)',
      repoPath: 'C:\\Users\\itdepartment\\Kingdom-PWA-Node',
      gpu: 'NVIDIA GeForce RTX 4070, 12282 MiB (~12 GB), driver 595.95 — VERIFIED 2026-07-08 (nvidia-smi)',
      peripherals: 'Elgato Stream Deck attached (scan-confirmed 2026-07-08) — the livestream operator control surface.',
      services: 'Ollama :11434 VERIFIED 2026-07-08 — models: qwen2.5:14b-instruct-q4_K_M, qwen2.5-coder:14b, nomic-embed-text. XTTS :8770 / whisper :8771 not probed. faster-whisper transcription pipeline install in progress (on-site 2026-07-03).',
      obsWebsocket: 'obs-websocket v5 on :4455 — Ari can read scenes + switch program (proven 2026-07-10). Auth currently OFF; resting state re-enables auth with the password read locally on the box (re-review 2026-07-17).',
      ndiConfig: 'NDI discovery fix (2026-07-10): DUAL-HOMED /23 NIC (wired 192.168.1.73 + Wi-Fi 192.168.0.44) had NDI auto-picking Wi-Fi, and a Discovery Server override suppressed mDNS. Fixed in C:\\ProgramData\\NDI\\ndi-config.v1.json -> adapters.allowed=["192.168.1.73"], discovery="", + FULL OBS restart -> "LIVESTREAM-MAIN (OBS)" visible. OPEN: the two NICs should not both be /23 (re-review 2026-07-24).',
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
    notes: 'VERIFIED build node (2026-07-08): SSH as itdepartment@100.72.5.90, npm ci + vite build PASS (Node pre-installed). GPU VERIFIED: RTX 4070 12 GB. llm-inference VERIFIED: Ollama live with qwen2.5:14b-instruct, qwen2.5-coder:14b, nomic-embed-text. Doubles as livestream/Presenter box (DR-0012 live-service guard). transcription/voice-clone/video-encode still unverified. LAN IPs 192.168.1.73 (wired) + 192.168.0.44 (Wi-Fi) + attached Elgato Stream Deck scan-confirmed 2026-07-08.',
    provenance: 'scan-confirmed 2026-07-08',
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
      managementIp: 'NOT FOUND on the 2026-07-08 LAN scan — the VX1000 Pro management/control IP did not answer. Currently driven by NovaLCT over USB from the booth laptop, so a LAN management IP may be unconfigured. NEEDS EYES-ON to read/assign it.',
    },
    capabilities: ['presenter-output'],
    notes: 'COMMISSIONED 2026-07-03: booth laptop on HDMI-3, one layer Full Screen, screen saved to receiving cards, Preset 1 = service state. As built: 8 of 10 ports, one per column, top-entry chained down. Control: NovaLCT 5.9.1 over USB from the booth laptop. Management IP NOT found on the 2026-07-08 scan — eyes-on needed.',
    provenance: 'on-site 2026-07-03 (unit); management IP needs-eyes-on (not on 2026-07-08 scan)',
    smeNeeded: true,
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
    provenance: 'on-site 2026-07-03',
    confirmed: true,
    sortOrder: 50,
  }),
  makeDevice({
    id: 'dev-av-booth-laptop',
    name: 'Wall laptop — Alienware (TLC-Tech-Team)',
    deviceType: 'media-rig',
    makeModel: 'Alienware (AMD Ryzen) — Windows 11',
    location: 'Sanctuary AV booth (on the VX1000 Pro)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '100.92.143.124',
    specs: {
      hostname: 'TLC-Tech-Team',
      tailscaleIp: '100.92.143.124 (verified 2026-07-10)',
      role: 'THE MIDDLE-SCREEN ENDPOINT: runs NDI Studio Monitor full-screen -> HDMI -> VX1000 Pro -> LED wall. Also the LED wall operator: NovaLCT 5.9.1 over USB to the VX1000 Pro (wall video on HDMI-3).',
      software: 'NDI 6 Tools (Studio Monitor, Screen Capture), NovaLCT 5.9.1, Proclaim (presentations), ATEM Software Control, Claude Code 2.1.200 (resident)',
      powerpointToNdi: 'PowerPoint -> NDI via NDI Screen Capture (GUI-only — no headless/CLI path).',
      account: 'IT Department Local (shared) — user "it department local" (has spaces)',
      autoStart: 'Wall-endpoint hygiene: NDI Studio Monitor -> Settings -> Application -> Run at Windows Start (points at the "WALL" source once, never switches mid-service).',
      backups: 'NovaLCT screen config exported locally; copy to NAS pending',
    },
    capabilities: ['presenter-output'],
    notes: 'CONSOLIDATED 2026-07-10: the booth Alienware IS the wall laptop, hostname TLC-Tech-Team (tailscale 100.92.143.124, user "it department local", NDI 6 Tools installed) — one machine, not two. It is the middle-screen NDI Studio Monitor endpoint AND the VX1000 NovaLCT operator. Verified on site 2026-07-03 (commissioning) + 2026-07-10 (wall endpoint + hostname). Sunday = wall Preset 1. See lib/church-av-devices.js MIDDLE_SCREEN_TOPOLOGY + WALL_LAPTOP_ENDPOINT.',
    provenance: 'on-site 2026-07-03 (commissioning); wall endpoint + hostname verified 2026-07-10',
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
    specs: {
      control: 'Software-controllable; per-voice EQ-assist lane (staged: assistive -> supervised -> autonomous, three-brakes).',
      scanIp: 'A Yamaha device answered at 192.168.0.155 on the 2026-07-08 scan (POSSIBLE QL console) — NOT positively identified. Also note led-wall-golive.js records a Yamaha TF5 at the FOH desk; QL vs TF5 is unresolved. NEEDS EYES-ON to confirm which console + its IP.',
    },
    capabilities: ['audio-mix'],
    notes: 'Exact model (QL1/QL5 vs TF5) to confirm. Scan saw a Yamaha device at 192.168.0.155 (possible QL) — needs eyes-on. Live-mix AI assist is a separate braked roadmap.',
    provenance: 'needs-eyes-on (Yamaha device at 192.168.0.155 seen on 2026-07-08 scan, not identified)',
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
      subnets: 'Two LAN subnets seen on the 2026-07-08 scan: 192.168.0.0/24 and 192.168.1.0/24 (both live). Gateway/DHCP is the pfSense at 192.168.0.1 (its own inventory row).',
      tailnet: 'Verified 2026-07-03: livestream-main-pc 100.72.5.90, poetech (NAS) 100.70.190.47, kingdom-home 100.74.53.117, darrells-z-fold7 100.86.238.88. CORRECTED 2026-07-08: tlcrackstation is LIVE on the church LAN at 192.168.0.100 (the earlier "tailnet 100.66.173.22 offline 23d" reading did NOT mean the box was down — it is up on the LAN; see its own inventory row).',
      unconfirmedGear: 'NEEDS EYES-ON: Netgear network gear at 192.168.0.136 / 192.168.0.137, and possible UniFi APs at 192.168.0.245 / 192.168.1.200 — seen on the scan, models not positively identified (see their own inventory rows).',
    },
    capabilities: ['networking'],
    notes: 'Switch/router inventory partially enumerated from the 2026-07-08 LAN scan (pfSense gateway, Netgear + possible UniFi gear as separate rows); full rack/closet walk-through still pending for make/model + topology. Open question: a Tactical RMM agent manages the control-room tower - who operates it?',
    provenance: 'scan-confirmed 2026-07-08 (subnets + gateway); switch topology needs-eyes-on',
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
    specs: { note: 'Booth = switcher + camera feeds + streaming PC + 2 side screens (from Presenter research). The three stage cameras are now enumerated as their own rows (PTZOptics Center-1/Right-3/Left-2, scan-confirmed 2026-07-08); the ATEM switcher + streaming PCs likewise have their own rows.' },
    capabilities: ['capture'],
    notes: 'Superseded in part by the enumerated PTZOptics camera rows + ATEM switcher row (2026-07-08 scan). Kept as the rig-level umbrella; remaining side-screen/converter details to enumerate on a media-team walk-through.',
    provenance: 'needs-eyes-on (rig-level umbrella; per-camera rows now scan-confirmed)',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 80,
  }),

  // ---------------------------------------------------------------------------
  // 2026-07-08 CHURCH LAN SCAN — the confirmed + needs-eyes-on rows below were
  // read off a real network scan of the church LAN (nmap/mDNS/SSDP; two subnets
  // 192.168.0.0/24 + 192.168.1.0/24). Each carries provenance:'scan-confirmed
  // 2026-07-08' (a real reading) or 'needs-eyes-on' (seen but not identified).
  // Models are left UNSURE where the scan could not determine them — not invented
  // (Verification Doctrine, DR-0076). See docs/99-session-notes/
  // 2026-07-08-church-lan-device-inventory.md for the method + full table.
  // ---------------------------------------------------------------------------

  // --- NDI stage cameras (CORRECTS the old ~.125/.126 guess) ------------------
  makeDevice({
    id: 'dev-ptz-center-1',
    name: 'PTZOptics 4K — Center-1 camera',
    deviceType: 'camera',
    makeModel: 'PTZOptics 4K PTZ camera (exact model UNSURE)',
    location: 'Sanctuary stage (center)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.1.123',
    specs: {
      protocol: 'NDI + SDI; SSH-enabled',
      control: 'Browser PTZ page (Zoom/Focus/Snap Focus, Presets 1-9).',
      note: 'CORRECTS the earlier ~192.168.1.125/.126 control-IP guess (led-wall-golive.js) — the three PTZOptics cameras are 192.168.1.123/.126/.127, scan-confirmed 2026-07-08.',
    },
    capabilities: ['capture'],
    notes: 'Feeds the ATEM (SDI) and the LAN as NDI. SSH reachable. Exact PTZOptics model to read off the unit.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 90,
  }),
  makeDevice({
    id: 'dev-ptz-right-3',
    name: 'PTZOptics 4K — Right-3 camera',
    deviceType: 'camera',
    makeModel: 'PTZOptics 4K PTZ camera (exact model UNSURE)',
    location: 'Sanctuary stage (right)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.1.126',
    specs: { protocol: 'NDI + SDI; SSH-enabled', control: 'Browser PTZ page (Presets 1-9).' },
    capabilities: ['capture'],
    notes: 'Feeds the ATEM (SDI) and the LAN as NDI. SSH reachable. Exact PTZOptics model to read off the unit.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 91,
  }),
  makeDevice({
    id: 'dev-ptz-left-2',
    name: 'PTZOptics 4K — Left-2 camera',
    deviceType: 'camera',
    makeModel: 'PTZOptics 4K PTZ camera (exact model UNSURE)',
    location: 'Sanctuary stage (left)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.1.127',
    specs: { protocol: 'NDI + SDI; SSH-enabled', control: 'Browser PTZ page (Presets 1-9).' },
    capabilities: ['capture'],
    notes: 'Feeds the ATEM (SDI) and the LAN as NDI. SSH reachable. Exact PTZOptics model to read off the unit.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 92,
  }),

  // --- Production switcher -----------------------------------------------------
  makeDevice({
    id: 'dev-atem-production-studio-4k',
    name: 'ATEM Production Studio 4K — switcher',
    deviceType: 'switcher',
    makeModel: 'Blackmagic Design ATEM Production Studio 4K',
    location: 'Sanctuary AV / control room',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.60',
    specs: {
      role: 'Production switcher: switch/mix all camera + computer sources to ONE program (see lib/church-av-devices.js for the full signal chain).',
      mdns: 'Advertises _blackmagic._tcp on the LAN — NOT NDI.',
      noNativeNdi: 'The ATEM does NOT advertise NDI and has NO native NDI input (scan-confirmed 2026-07-08). Sources reach it via SDI/HDMI; NDI is bridged to SDI upstream.',
      control: 'ATEM Software Control (currently on a CUDA tower; noted not-working in led-wall-golive.js — troubleshoot after service).',
    },
    capabilities: ['presenter-output'],
    notes: 'The load-bearing switcher (camera -> ATEM -> program out -> NovaStar VX1000 -> wall). Confirms the "no native NDI input" fact: it advertises _blackmagic._tcp, not NDI. Full architecture in church-av-devices.js.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 100,
  }),

  // --- Machines ----------------------------------------------------------------
  makeDevice({
    id: 'dev-imac-tlcs',
    name: 'iMac — TLCs-iMac (graphics / output Mac)',
    deviceType: 'media-rig',
    makeModel: 'Apple iMac (exact model / year UNSURE)',
    location: 'Sanctuary AV / booth',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.1.102',
    specs: {
      secondaryIp: '192.168.1.155 (same host, second address) — scan-confirmed 2026-07-08',
      ndi: 'Publishes an NDI source "macOS AV Output" on the LAN (graphics/output Mac).',
      role: 'Proclaim host (presentation) + graphics/output Mac.',
    },
    capabilities: ['presenter-output'],
    notes: 'Apple host publishing NDI "macOS AV Output"; runs Proclaim. Two LAN addresses (192.168.1.102 + .155). Exact iMac model/year to read off the machine.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 110,
  }),
  makeDevice({
    id: 'dev-synology-rackstation',
    name: 'Synology RackStation — tlcrackstation',
    deviceType: 'nas',
    makeModel: 'Synology RackStation (exact model UNSURE)',
    location: 'Church rack',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.100',
    specs: {
      hostname: 'tlcrackstation',
      liveNote: 'LIVE on the church LAN at 192.168.0.100 (scan-confirmed 2026-07-08). CORRECTS the earlier "tlcrackstation ... offline 23d" tailnet reading — the box is up; only its Tailscale presence had lapsed.',
    },
    capabilities: ['storage'],
    notes: 'Second Synology on the church LAN (distinct from the DS1621xs). Up and reachable at 192.168.0.100. Exact RackStation model + volume/RAID to read off the unit.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 120,
  }),

  // --- Infra: firewall / gateway ----------------------------------------------
  makeDevice({
    id: 'dev-pfsense-gateway',
    name: 'pfSense firewall / gateway / DHCP',
    deviceType: 'network',
    makeModel: 'pfSense (appliance hardware UNSURE)',
    location: 'Church network closet',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.1',
    specs: { role: 'Firewall + gateway + DHCP for the church LAN (both 192.168.0.0/24 and 192.168.1.0/24).' },
    capabilities: ['networking'],
    notes: 'The church LAN gateway/DHCP. pfSense software confirmed; the physical appliance make/model to read off the box.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 130,
  }),

  // --- Infra: IP security cameras (PSIA/CGI) ----------------------------------
  makeDevice({
    id: 'dev-ipcam-1',
    name: 'IP security camera 1 (PSIA/CGI)',
    deviceType: 'security',
    makeModel: 'IP camera, PSIA/CGI (make/model UNSURE)',
    location: 'Church (position TBD)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.1.18',
    specs: { protocol: 'Answers PSIA / CGI (IP security camera).' },
    capabilities: ['capture'],
    notes: 'IP security camera speaking PSIA/CGI. Make/model + mounting position to confirm on a walk-through.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 140,
  }),
  makeDevice({
    id: 'dev-ipcam-2',
    name: 'IP security camera 2 (PSIA/CGI)',
    deviceType: 'security',
    makeModel: 'IP camera, PSIA/CGI (make/model UNSURE)',
    location: 'Church (position TBD)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.133',
    specs: { protocol: 'Answers PSIA / CGI (IP security camera).' },
    capabilities: ['capture'],
    notes: 'IP security camera speaking PSIA/CGI. Make/model + mounting position to confirm on a walk-through.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 141,
  }),

  // --- Infra: printers / MFPs --------------------------------------------------
  makeDevice({
    id: 'dev-printer-1',
    name: 'Printer / MFP 1',
    deviceType: 'printer',
    makeModel: 'Network printer / MFP (make/model UNSURE)',
    location: 'Church office',
    status: 'online',
    steward: 'COLG staff',
    ipAddress: '192.168.0.200',
    specs: {},
    capabilities: [],
    notes: 'Network printer/MFP on the LAN. Make/model to read off the device.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 150,
  }),
  makeDevice({
    id: 'dev-printer-2',
    name: 'Printer / MFP 2',
    deviceType: 'printer',
    makeModel: 'Network printer / MFP (make/model UNSURE)',
    location: 'Church office',
    status: 'online',
    steward: 'COLG staff',
    ipAddress: '192.168.0.205',
    specs: {},
    capabilities: [],
    notes: 'Network printer/MFP on the LAN. Make/model to read off the device.',
    provenance: 'scan-confirmed 2026-07-08',
    smeNeeded: true,
    confirmed: true,
    sortOrder: 151,
  }),

  // --- Infra: smart speakers / voice assistants -------------------------------
  makeDevice({
    id: 'dev-echo-alexa',
    name: 'Amazon Echo / Alexa devices (2)',
    deviceType: 'iot',
    makeModel: 'Amazon Echo / Alexa (exact models UNSURE)',
    location: 'Church (rooms TBD)',
    status: 'online',
    steward: 'COLG staff',
    ipAddress: '192.168.0.54',
    specs: { ips: '192.168.0.54, 192.168.1.192 (two Alexa/Echo endpoints)' },
    capabilities: [],
    notes: 'Two Amazon Echo / Alexa endpoints on the LAN (192.168.0.54, 192.168.1.192). Exact models + rooms to confirm.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 160,
  }),
  makeDevice({
    id: 'dev-airplay-spotify-speakers',
    name: 'AirPlay / Spotify speakers (3)',
    deviceType: 'iot',
    makeModel: 'AirPlay / Spotify Connect speakers (exact models UNSURE)',
    location: 'Church (rooms TBD)',
    status: 'online',
    steward: 'COLG staff',
    ipAddress: '192.168.1.4',
    specs: { ips: '192.168.1.4, 192.168.0.57, 192.168.1.178 (three AirPlay/Spotify speaker endpoints)' },
    capabilities: [],
    notes: 'Three AirPlay / Spotify Connect speaker endpoints on the LAN. Exact models + rooms to confirm.',
    provenance: 'scan-confirmed 2026-07-08',
    confirmed: true,
    sortOrder: 161,
  }),

  // --- NEEDS-EYES-ON: network gear seen but not positively identified ----------
  makeDevice({
    id: 'dev-netgear-gear',
    name: 'Netgear network gear (unconfirmed)',
    deviceType: 'network',
    makeModel: 'Netgear (model UNSURE — NEEDS EYES-ON)',
    location: 'Church network closet (TBD)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.136',
    specs: { ips: '192.168.0.136, 192.168.0.137 (two Netgear endpoints)', unconfirmed: 'Vendor reads as Netgear; role (switch / AP / router) NOT confirmed.' },
    capabilities: ['networking'],
    notes: 'Two Netgear network endpoints (192.168.0.136/.137). Role + model NOT confirmed — needs eyes-on at the closet.',
    provenance: 'needs-eyes-on',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 170,
  }),
  makeDevice({
    id: 'dev-unifi-aps',
    name: 'Possible UniFi access points (unconfirmed)',
    deviceType: 'network',
    makeModel: 'Possibly Ubiquiti UniFi APs (UNSURE — NEEDS EYES-ON)',
    location: 'Church (TBD)',
    status: 'online',
    steward: 'COLG media team',
    ipAddress: '192.168.0.245',
    specs: { ips: '192.168.0.245, 192.168.1.200 (two endpoints)', unconfirmed: 'Look like UniFi APs but NOT confirmed.' },
    capabilities: ['networking'],
    notes: 'Two endpoints that look like UniFi access points (192.168.0.245, 192.168.1.200) — NOT confirmed. Needs eyes-on.',
    provenance: 'needs-eyes-on',
    smeNeeded: true,
    confirmed: false,
    sortOrder: 171,
  }),
];
