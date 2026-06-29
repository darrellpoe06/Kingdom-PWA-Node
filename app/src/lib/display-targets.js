// =============================================================================
// display-targets — where the Presenter / NDI output actually renders
// =============================================================================
// Darrell 2026-06-24/29: the new ALTAR/sanctuary LED VIDEO WALL is the PRIMARY
// output target — CONFIRMED on site 2026-06-29 as 8 x 6 = 48 Mirackle P1.99 mm
// cabinets (640x480 mm), 16.8 ft (W) x 9.45 ft (H) = exactly 16:9, driven by a
// NovaStar VX1000 all-in-one video processor + controller. (An earlier estimate
// had it 9 x 12 ft / 4:3 — corrected; see lib/video-wall-spec.js for the cabinet
// grid + power/data math.) Lyrics, Scripture, slides, and especially IMAGES must
// land crisp at the wall's NATIVE resolution — never upscale onto a 1.99 mm wall.
//
// SIGNAL PATH (the important correction): the VX1000 has NO native NDI input. Its
// inputs are 2x HDMI 1.4 (+loop), 2x DVI / "HDMI 4.1" (+loop), 1x 3G-SDI (+loop), and
// 2x 10G optical fiber. So:
//   • The WALL is fed HDMI/DVI FROM the VX1000 — the presenter PC outputs HDMI/DVI
//     directly into a VX1000 input; VX1000 -> wall. NDI does NOT feed the VX1000
//     directly (would need an NDI->HDMI converter to do so).
//   • NDI's role is PRODUCTION-LAN ROUTING: camera/production feeds over IP, and
//     sending the presenter program to the SWITCHER / other screens over the LAN
//     (the #322 path: OBS Browser Source + DistroAV). NDI = LAN transport; the wall =
//     HDMI from the VX1000. Keep these two straight.
//
// This module is PURE DATA + a pure derivation: the targets, the VX1000 facts, the
// corrected signal path, and an honest native-resolution ESTIMATE (the exact pixel map
// comes from the NovaStar screen config / NovaLCT — never claimed exact here, per
// DR-0076). The Presenter output route renders to a target's native res/aspect; the
// authoring rule (use high-res source images) lives here so the surface + docs agree.
// =============================================================================

export const FEET_TO_MM = 304.8;

// Honest native-resolution ESTIMATE from physical size + pitch. The TRUE pixel count
// snaps to the installed LED module/cabinet grid — read the exact map from the
// NovaStar screen configuration (NovaLCT) or the module datasheet. Returns the
// estimate AND its assumptions; `exact:false` always (we never paint a confirmed
// number we did not measure).
export function nativeResEstimate({ widthFt, heightFt, pitchMm } = {}) {
  const pitch = Number(pitchMm) > 0 ? Number(pitchMm) : null;
  if (!pitch) return null;
  const px = (ft) => Math.round((Number(ft) * FEET_TO_MM) / pitch);
  const widthPx = px(widthFt);
  const heightPx = px(heightFt);
  const ratio = widthPx / heightPx;
  return {
    widthPx,
    heightPx,
    megapixels: +((widthPx * heightPx) / 1_000_000).toFixed(2),
    aspectRatio: +ratio.toFixed(4),
    aspectLabel: aspectLabelFor(widthPx, heightPx),
    exact: false,
    assumptions: [
      `Derived from the stated physical size (${widthFt} ft W x ${heightFt} ft H) at ${pitch} mm pitch.`,
      'True pixel count snaps to the installed LED module/cabinet grid — confirm the EXACT map from the NovaStar screen config (NovaLCT) or the module datasheet.',
    ],
  };
}

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }

// A human-useful aspect label. Real LED pixel dims rarely reduce to a clean ratio
// (1925x1444 has gcd 1), so we SNAP to a common ratio when the dims are within ~1%
// of it (honest: the precise number is `aspectRatio`); otherwise the reduced fraction.
function aspectLabelFor(w, h) {
  const ratio = w / h;
  const common = [[16, 9], [4, 3], [16, 10], [3, 2], [1, 1], [21, 9], [5, 4]];
  for (const [a, b] of common) {
    if (Math.abs(ratio - a / b) / (a / b) <= 0.01) return `${a}:${b}`;
  }
  const g = gcd(w, h) || 1;
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

// The NovaStar VX1000 — all-in-one video processor + controller (facts from Darrell's
// provided spec, 2026-06-24). Represented as data so the doc + any control surface
// share one truth.
export const VX1000 = {
  model: 'NovaStar VX1000',
  role: 'All-in-one LED video processor + controller',
  inputs: [
    { type: 'HDMI 1.4', count: 2, loop: true, note: 'tops ~1080p60 / 4K30 — use for 1080-class feeds.' },
    { type: 'DVI / "HDMI 4.1"', count: 2, loop: true, note: 'higher bandwidth — use this for ~1920x1440@60 (the wall is 1440 tall).' },
    { type: '3G-SDI', count: 1, loop: true, note: 'broadcast cameras / switcher program out.' },
    { type: '10G optical fiber', count: 2, note: 'long runs / redundancy.' },
  ],
  hasNdiInput: false, // <- the correction: NDI does NOT feed the VX1000 directly
  capacity: { maxLoadMegapixels: 6.5, maxCanvas: '10240x8192' },
  layers: '4K x 1K @60 input layers; up to 3x 4K layers; stepless scaling.',
  latency: '1 frame (ultra-low) — good for live worship.',
  genlock: true,
  control: {
    rj45: true,                 // PC control over Ethernet
    usb: true,                  // NovaLCT / NovaStar control software
    userPresets: 10,            // recallable scene presets
    api: 'NovaStar PC-control software (NovaLCT) + NovaStar control SDK/API',
  },
};

// The PRIMARY target: the new sanctuary altar LED wall (confirmed 8x6 grid).
const WALL_NATIVE = nativeResEstimate({ widthFt: 16.8, heightFt: 9.45, pitchMm: 1.99 });

export const SANCTUARY_WALL = {
  id: 'sanctuary-wall',
  label: 'Sanctuary altar LED video wall',
  primary: true,
  processor: 'NovaStar VX1000',
  pitchMm: 1.99,
  widthFt: 16.8,
  heightFt: 9.45,
  native: WALL_NATIVE,                 // ~2573x1447, 16:9, ~3.72 Mpx (estimate; confirm via NovaLCT)
  // The clean design canvas the Presenter renders to: the 320x240/cabinet x 8x6
  // grid = 2560x1440 (QHD, 16:9); snap to the confirmed native map at install.
  designCanvas: { width: 2560, height: 1440, aspectLabel: '16:9' },
  withinProcessorCapacity: WALL_NATIVE ? WALL_NATIVE.megapixels <= VX1000.capacity.maxLoadMegapixels : null,
  // HOW it is fed — the VX1000 receives the ATEM PROGRAM (it is NOT a switcher),
  // NOT NDI-direct. Cameras + the Presenter graphics are SOURCES into the ATEM;
  // the ATEM switches them to one program -> VX1000 -> wall. See church-av-devices.
  feed: {
    path: 'cameras + Presenter graphics --> ATEM Production Studio 4K (switch/mix) --> ATEM program out --SDI/HDMI--> NovaStar VX1000 --> wall',
    recommendedInput: 'Feed the VX1000 from the ATEM program out over SDI (or HDMI); the VX1000 maps it to the LED grid. (The VX1000 is a wall processor, not a switcher.)',
    switcher: 'ATEM Production Studio 4K',
    ndiDirect: false,
    ndiNote: 'To put an NDI source on the wall, bridge it first (NDI->SDI/HDMI) into the ATEM (or the VX1000). The VX1000 itself has no NDI input.',
  },
};

// The SECONDARY targets: the two side projection screens + the operator preview. These
// CAN be NDI-fed (the #322 path) since they go through the switcher / screen players.
export const SIDE_SCREENS = {
  id: 'side-screens',
  label: 'Two side projection screens',
  count: 2,
  designCanvas: { width: 1920, height: 1080, aspectLabel: '16:9' },
  feed: { path: 'Presenter -> OBS Browser Source -> DistroAV NDI -> switcher / screen player', ndiDirect: true },
};

export const DISPLAY_TARGETS = [SANCTUARY_WALL, SIDE_SCREENS];

// The corrected end-to-end signal path, as data for the doc + any surface. Two lanes:
// the WALL lane (HDMI/DVI from the VX1000) and the NDI PRODUCTION-LAN lane (IP routing).
export const SIGNAL_PATH = {
  wallLane: {
    title: 'Wall lane (ATEM program -> VX1000 -> wall; NOT NDI-direct)',
    hops: [
      'All cameras + the Presenter graphics (rendered at ~2560x1440, 16:9) feed the ATEM Production Studio 4K as sources (20x 6G-SDI + 1 HDMI; frame sync per input switches ANY source). See lib/church-av-devices.js.',
      'The ATEM switches/mixes them to ONE program; ATEM program out --SDI/HDMI--> a NovaStar VX1000 input. The VX1000 is a wall PROCESSOR, not a switcher — it receives only the finished program.',
      'VX1000 scales/maps to the LED module grid and drives the 16.8x9.45 ft 1.99 mm wall (1-frame latency, genlock).',
    ],
  },
  ndiLane: {
    title: 'NDI production-LAN lane (IP routing)',
    hops: [
      'Cameras / production feeds publish as NDI sources on the church LAN.',
      'Presenter program is published as an NDI source too (OBS Browser Source + DistroAV, #322).',
      'The switcher / streaming PC / side-screen players ingest those NDI sources over IP.',
      'NDI does NOT feed the VX1000 directly — decode (NDI->HDMI) first if the wall must show an NDI source.',
    ],
  },
};

// The authoring rule that makes "images will be amazing" true: on a 1.9 mm wall, the
// pixels are there — feed it HIGH-RES source media. Do NOT upscale a small asset.
export const IMAGE_AUTHORING_RULE = {
  rule: 'Use source images at or above the wall native resolution (~2560x1440). A 1.99 mm wall shows every pixel — a low-res asset upscaled will look soft. Render full-bleed at native res; never scale a small image up to fill the wall.',
  minLongEdgePx: 2560,
  targetPx: '2560x1440 (16:9) for full-bleed; larger is fine (the VX1000 scales down crisply).',
};

// Optional, SECONDARY (explicitly NOT the LHF): the app could manage the VX1000 per
// service/scene from the master Sunday program — brightness/chroma, recall one of the
// 10 user presets, genlock — over the VX1000's RJ45 PC-control / NovaStar API. Spec'd
// as an enhancement; gated, not part of the presenter-replacement critical path.
export const VX1000_CONTROL = {
  status: 'optional-enhancement',
  isLhf: false,
  summary: 'Optionally drive the VX1000 from the app per service/scene: recall a preset, set brightness/chroma, genlock — from the master Sunday program.',
  transport: 'VX1000 RJ45 PC-control / USB (NovaLCT) / NovaStar control SDK-API.',
  capabilities: ['recall 1 of 10 user presets', 'brightness / chroma', 'genlock sync', 'input/layer switch per scene'],
  guardrails: 'A live-production control surface: read-only status first, explicit operator confirm for any change, never auto-switch mid-service (mirror the Cage / three-brakes posture).',
};
