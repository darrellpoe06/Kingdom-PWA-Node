// =============================================================================
// church-av-devices — the COLG sanctuary AV device inventory + signal chain
// =============================================================================
// Pure data: every device in the sanctuary AV chain, its ROLE, the key I/O facts,
// and — critically — WHERE remote camera control needs a Blackmagic camera vs.
// where a converter bridges a non-SDI source. Single source of truth the runbook
// doc, the in-app AV card, and the proven-to-catch tests all read from (DR-0076).
//
// THE LOAD-BEARING CORRECTION (confirmed on site 2026-06-29):
//   The NovaStar VX1000 is the LED WALL PROCESSOR, *not* a switcher. The switcher
//   is the ATEM Production Studio 4K. The chain is:
//       all cameras + sources -> ATEM (switch/mix to ONE program)
//       -> ATEM program out -> NovaStar VX1000 input -> LED wall
//   The VX1000 only ever receives the single finished program feed.
//
// THE OTHER CORRECTION (the "only Blackmagic cameras" belief is wrong for SWITCHING):
//   The ATEM Production Studio 4K has a FRAME SYNCHRONIZER on EVERY input, so it
//   switches ANY source — Blackmagic or not, non-genlock cameras, or computer
//   outputs. What IS Blackmagic-specific is remote camera CONTROL (iris / focus /
//   color) + tally over the SDI return; non-BMD cameras switch fine but lack that.
//
// SOURCE: Blackmagic Design ATEM Production Studio 4K specifications
//   (blackmagicdesign.com). NovaStar facts cross-ref lib/display-targets.js.
// =============================================================================

// --- The production switcher (the new fact to document) -----------------------
export const ATEM = {
  id: 'atem-production-studio-4k',
  vendor: 'Blackmagic Design',
  vendorUrl: 'https://www.blackmagicdesign.com',
  model: 'ATEM Production Studio 4K',
  role: 'Production switcher (switch/mix all camera + computer sources to ONE program)',
  inputs: { sdi: 20, hdmi: 1, note: '20x 6G-SDI + 1x HDMI = 21 video inputs.' },
  frameSyncPerInput: true, // EVERY input has a frame synchronizer
  // The two facts that correct the common beliefs:
  switchesAnySource: 'Frame sync on every input -> switches ANY source: Blackmagic or not, non-genlock cameras, or computer outputs. The "only Blackmagic cameras" belief is FALSE for switching.',
  cameraControl: 'Remote camera control (iris / focus / color) + tally is Blackmagic-specific, carried over the SDI return. Non-BMD cameras switch fine but lack this remote control + tally integration.',
  programOut: 'ATEM program out -> NovaStar VX1000 input (the wall shows the single finished program).',
  source: 'Blackmagic Design ATEM Production Studio 4K specs (blackmagicdesign.com)',
};

// --- The wall processor (NOT a switcher) — cross-ref display-targets.js --------
export const WALL_PROCESSOR = {
  id: 'novastar-vx1000',
  vendor: 'NovaStar',
  model: 'VX1000',
  role: 'LED wall processor + controller — NOT a switcher',
  isSwitcher: false,
  receives: 'ONE finished program feed (the ATEM program out), via SDI/HDMI -> drives the LED wall.',
  crossRef: 'lib/display-targets.js (VX1000 full I/O + load) + lib/video-wall-spec.js (the wall).',
};

// --- Camera connection integration matrix -------------------------------------
// For each way a camera/source reaches the ATEM: does it SWITCH? does it get
// remote CONTROL + tally? and via what bridge. This is the answer to "do we need
// Blackmagic cameras?" — no for switching, yes (or a converter) for control.
export const CAMERA_CONNECTIONS = {
  'sdi-bmd': {
    label: 'Blackmagic SDI camera (direct to ATEM SDI)',
    switches: true, remoteControl: true, tally: true,
    via: 'Direct 6G-SDI into an ATEM SDI input.',
    note: 'Full integration: switches + iris/focus/color control + tally over the SDI return.',
  },
  'sdi-other': {
    label: 'Non-Blackmagic SDI camera (direct to ATEM SDI)',
    switches: true, remoteControl: false, tally: false,
    via: 'Direct 6G-SDI into an ATEM SDI input.',
    note: 'Switches perfectly (frame sync per input). No remote iris/focus/color or tally — those are BMD-specific.',
  },
  'hdmi': {
    label: 'HDMI camera / source',
    switches: true, remoteControl: 'via-converter', tally: 'via-converter',
    via: 'Bidirectional SDI/HDMI micro converter -> ATEM SDI (the converter also carries control back).',
    note: 'HDMI cameras come in through a bidirectional micro converter, which carries the control return too.',
  },
  'ip-ndi': {
    label: 'IP / NDI camera',
    switches: true, remoteControl: false, tally: false,
    via: 'NDI -> SDI converter -> ATEM SDI (or ingest via OBS on a tower).',
    note: 'IP cameras bridge to SDI via an NDI converter; switching only, no ATEM camera control.',
  },
  'usb-obs': {
    label: 'USB / NDI / capture source via OBS (software switcher)',
    switches: true, remoteControl: false, tally: false,
    via: 'OBS on a church tower ingests USB/NDI/capture -> OBS out -> NovaStar VX1000 (alternative to the ATEM lane).',
    note: 'OBS already lives on the production box (towers are livestream-primary). It can act as a software switcher for sources the ATEM cannot take directly.',
  },
};

// The bridges ("other devices") that get a non-SDI source into the chain.
export const SOURCE_BRIDGES = [
  { device: 'Bidirectional SDI/HDMI micro converter', forSource: 'HDMI cameras / computer HDMI', carriesControl: true, note: 'Two-way: video in to the ATEM, control/return back to the camera.' },
  { device: 'NDI -> SDI converter', forSource: 'IP / NDI cameras', carriesControl: false, note: 'Bridges an IP camera onto an ATEM SDI input.' },
  { device: 'OBS on a church tower (software switcher)', forSource: 'USB / NDI / capture cards', carriesControl: false, note: 'Ingests sources the ATEM cannot take directly; OBS out can feed the VX1000. Ties the towers’ livestream-primary role.' },
];

// --- The end-to-end signal chain (ordered hops; the corrected architecture) ----
export const SIGNAL_CHAIN = {
  title: 'Camera -> switcher -> wall (the VX1000 is NOT the switcher)',
  hops: [
    'All cameras + computer/graphics sources feed the ATEM Production Studio 4K (20x 6G-SDI + 1 HDMI; a frame synchronizer on every input switches ANY source).',
    'The ATEM switches/mixes everything to ONE program.',
    'ATEM program out -> a NovaStar VX1000 input (SDI/HDMI).',
    'The VX1000 (a wall processor, NOT a switcher) maps that single program onto the LED grid and drives the wall.',
  ],
  cameraControlNote: 'Switching needs NO Blackmagic camera (frame sync per input). Remote camera control (iris/focus/color) + tally DOES need a Blackmagic camera over the SDI return — or an HDMI camera via a bidirectional micro converter that carries the control back. Non-BMD cameras switch fine; they just lack the remote control + tally.',
};

// All AV devices, as one inventory list (for the church device inventory surface).
export const AV_DEVICES = [
  {
    ...ATEM,
    category: 'switcher',
    specLine: `${ATEM.inputs.sdi}x 6G-SDI + ${ATEM.inputs.hdmi}x HDMI, frame sync per input`,
    controlNote: 'Remote camera control + tally needs Blackmagic cameras (or a converter for HDMI cameras).',
  },
  {
    ...WALL_PROCESSOR,
    category: 'processor',
    specLine: 'Receives ONE program from the ATEM; drives the LED wall. Not a switcher.',
    controlNote: 'No camera control — it only processes the finished program for the wall.',
  },
  {
    id: 'colg-led-wall',
    vendor: 'LED Nation USA',
    model: 'Mirackle P1.99mm LED video wall',
    role: 'Sanctuary display (8x6 = 48 cabinets, 16:9)',
    category: 'display',
    specLine: '48 cabinets, ~2560x1440, fed by the VX1000.',
    controlNote: 'See lib/video-wall-spec.js for the cabinet/power/data math.',
  },
];

// --- Pure derivation (proven-to-catch): resolve a connection's integration -----
export function cameraIntegration(connectionKey) {
  const c = CAMERA_CONNECTIONS[connectionKey];
  if (!c) return null;
  return {
    connection: connectionKey,
    label: c.label,
    switches: c.switches === true,
    // remoteControl/tally may be true | false | 'via-converter'
    hasRemoteControl: c.remoteControl === true,
    controlViaConverter: c.remoteControl === 'via-converter',
    needsBmdForControl: c.switches === true && c.remoteControl !== true && c.remoteControl !== 'via-converter',
    via: c.via,
  };
}
