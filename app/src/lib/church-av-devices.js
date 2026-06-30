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
  role: 'LED wall processor + controller — a SOURCE-level switcher, not a production switcher',
  // Precise: the VX1000 DOES switch — at SOURCE level (pick which whole input shows
  // on the wall), NOT at production level (it does not cut cameras with program/
  // preview, transitions, keyers). That production switching is the ATEM's job.
  isProductionSwitcher: false,
  doesSourceSwitching: true,
  switching: {
    sourceSelection: 'Picks which whole input shows on the wall (e.g. in1 = ATEM program / live service, in2 = ProPresenter / lyrics laptop, in3 = media player / backup). The operator switches the wall between whole sources.',
    backupFailover: 'Primary + backup input: falls to the backup if the main feed drops. Matters for a live Sunday.',
    signalTypes: 'Multiple input signal types (HDMI / SDI / DVI / DP) — connect different device outputs directly.',
    layersPip: 'Composites more than one input at once (program full-screen + a graphic overlay, split, or PIP); inputs feed layers.',
    doesNot: 'Does NOT do multi-camera production switching (program/preview, transitions, keyers, a director cutting cameras). That is the ATEM.',
  },
  receives: 'The finished program(s) from upstream (ATEM program and/or a presentation feed), via HDMI/SDI/DVI/DP -> places it on the LED wall.',
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

// --- The end-to-end signal chain (ordered hops; the precise architecture) ------
export const SIGNAL_CHAIN = {
  title: 'Cameras -> ATEM (produce ONE program) -> NovaStar (place on wall) -> LED wall',
  hops: [
    'All cameras + computer/graphics sources feed the ATEM Production Studio 4K (20x 6G-SDI + 1 HDMI; a frame synchronizer on every input switches ANY source).',
    'The ATEM does the multi-camera PRODUCTION switching (program/preview, transitions, keyers) to produce ONE program.',
    'That program (and/or a presentation feed) -> a NovaStar VX1000 input (HDMI/SDI/DVI/DP).',
    'The VX1000 PLACES it on the wall: selects among whole sources, layers graphics (PIP/overlay), holds a backup input, and maps it onto the LED grid -> the wall.',
  ],
  roleSplit: 'Two switchers, two jobs: the ATEM is the PRODUCTION switcher (cuts cameras, the director’s desk). The VX1000 is a SOURCE-level switcher (picks which whole input the wall shows + layers + failover). The VX1000 does NOT cut cameras; the ATEM does not drive LED cabinets.',
  cameraControlNote: 'Switching needs NO Blackmagic camera (frame sync per input). Remote camera control (iris/focus/color) + tally DOES need a Blackmagic camera over the SDI return — or an HDMI camera via a bidirectional micro converter that carries the control back. Non-BMD cameras switch fine; they just lack the remote control + tally.',
};

// =============================================================================
// LED OUTPUT — how the VX1000's 10 Ethernet OUTPUT ports drive the wall
// =============================================================================
// CRITICAL: these RJ45 ports are NOT network. They carry NovaStar's proprietary
// LED data protocol to the cabinets' RECEIVING CARDS. They must stay OFF the
// church LAN (dedicated LED data lines) and CANNOT pass through a network switch.
export const LED_OUTPUT = {
  ports: 10,
  pxPerPort: 650000,            // Gigabit per-port limit
  totalPxCap: 6500000,          // 10 x 650k
  isNetwork: false,
  flow: [
    'VX1000 scales the input to one canvas (the whole wall image).',
    'It slices that canvas into regions.',
    'Each region is sent out one Ethernet OUTPUT port.',
    'A receiving card inside each cabinet grabs its pixel slice and lights its section.',
  ],
  loadBalance: 'No port over ~650,000 px. Spread cabinets across ports so each port stays under the Gigabit limit; leave a spare port for safety.',
  daisyChain: 'Cabinets daisy-chain off each port in strings: port -> cabinet -> cabinet -> ... Each string is one port’s slice.',
  mapping: 'Map in NovaStar software — NovaLCT (receiving-card config) + the VX1000 menu / Vision Management: define the screen size, then assign which cabinets belong to which port and their physical order/orientation so the sliced regions land correctly. Wrong order/orientation = the section tiles in the wrong place (the same addressing step as the data-cabling sequence).',
  // Capacity check is honest: the exact wall px is SME-pending the real module map.
  wallFits: 'This wall (~3.7M px at the 2560x1440 module map, up to ~4.1M px at a 2710x1508 estimate) sits well under the 6.5M px cap either way — comfortable headroom; likely will not need all 10 ports. Confirm the exact count from NovaLCT.',
  smePending: 'Cabinet COUNT + physical grid (rows x columns) to compute per-port balancing, the mapping layout, and to leave a spare port.',
};

// =============================================================================
// CABLING PLANES — the TWO separate cabling jobs (do not confuse them)
// =============================================================================
export const CABLING_PLANES = {
  // THE rule that prevents a failed install:
  noSwitchRule: 'The VX1000’s 10 OUTPUT ports CANNOT pass through a network switch. They carry NovaStar’s proprietary LED data protocol; a switch only speaks TCP/IP and will NOT pass it. LED output must be POINT-TO-POINT: processor output port -> directly to the wall’s first cabinet -> daisy-chain cabinet-to-cabinet. No switch in the LED-data path, EVER.',
  jobs: [
    {
      name: 'NETWORK (through switches OK)',
      carries: 'Cameras, control, internet, NDI / SDI-over-IP video transport between rooms.',
      throughSwitch: true,
      note: 'A planned 120 ft Cat6 -> upstairs switch -> control-room switch serves THIS. Fine for network/video.',
    },
    {
      name: 'LED DATA (direct only — NO switch)',
      carries: 'NovaStar output ports -> wall cabinets.',
      throughSwitch: false,
      note: 'Shielded Cat6 (STP), <= ~100 m / 330 ft per run, or fiber if longer. Never through a switch. Never the shared 120 ft network run.',
    },
  ],
  implication: 'The NovaStar must be placed where it has a DIRECT cable shot to the wall cabinets. Its video SOURCE can travel over the network/switches (NDI) or a short cable, depending on where the source sits.',
  smePending: 'Physical layout — LED wall vs control room (ATEM/towers) vs "upstairs"; and whether the 120 ft run is intended for LED data (must reroute) or network/video (fine).',
};

// =============================================================================
// WALL PLACEMENT — DECIDED: NovaStar AT the wall, control tower in the control room
// =============================================================================
// Control-plane / data-plane separation. LED pixels stay local + direct; control
// and the video picture both ride the LAN.
export const WALL_PLACEMENT = {
  decision: 'NovaStar AT the wall; the presentation/CUDA tower STAYS in the control room.',
  dataPlane: 'LED pixels: NovaStar at the wall -> short shielded Cat6 DIRECT to the cabinets. Never touches the network. (Short direct runs solve the no-switch constraint best.)',
  controlPlane: 'Brightness / input-select / mapping / on-off / config: the VX1000’s separate control/management Ethernet port -> the LAN -> NovaStar control software (NovaLCT / COEX / Vision Management) on the control-room tower. Control rides the LAN; pixel data does not.',
  videoTransport: {
    note: 'The NovaStar still needs a PHYSICAL VIDEO INPUT (HDMI/SDI) — network control does not feed it a picture. With the tower in the control room, the picture must travel control room -> wall:',
    optionA: {
      name: 'A — NDI decoder at the wall (RECOMMENDED, network-native)',
      how: 'The presentation is already an NDI source on the LAN -> a small NDI DECODER at the wall (hardware box e.g. Birddog / Magewell, or a mini-PC running NDI Studio Monitor) -> HDMI into the NovaStar. Video rides the GB switches + the 120 ft run as IP; no dedicated video cable. Same pattern as the Legion, smaller box.',
      cost: 'One decoder device.',
    },
    optionB: {
      name: 'B — HDBaseT extender (point-to-point)',
      how: 'HDBaseT HDMI-over-Cat6 extender: TX at the tower, RX at the wall, on a dedicated Cat6 (120 ft is well within HDBaseT range) -> HDMI into the NovaStar. No network load, no decoder.',
      cost: 'A TX/RX extender pair + a dedicated Cat6 run.',
    },
    recommended: 'A',
  },
  // The publish-once NDI pattern that keeps wall + livestream in sync:
  publishOnceNdi: 'The presentation tower publishes the presentation ONCE as an NDI source on the LAN. Two subscribers pull it: the wall (via its NDI decoder -> HDMI -> NovaStar) and the livestream/OBS boxes (which composite it into the broadcast as they do today). One source, two destinations; wall + stream stay in sync; the livestream workflow is unchanged.',
  whatTheWallNeeds: 'Wall corner needs only: POWER, the NovaStar, the DIRECT LED cabling to the cabinets, and ONE network drop carrying (a) NovaStar control and (b) the wall-program NDI to the decoder. The only two NON-network things at the wall are the short direct LED run and power.',
};

// =============================================================================
// WALL FEED ARCHITECTURE — wall content = presentation + IMAG; switch UPSTREAM
// =============================================================================
export const WALL_FEED_ARCHITECTURE = {
  recommended: {
    name: 'SINGLE "wall program" feed, switched UPSTREAM in booth software',
    how: 'Build one dedicated "wall program" output in the booth software (OBS / the presentation system / a tower mix) that the operator drives — announcements/images/lyrics by default, cut to the live camera (IMAG) during the sermon, and scripture-text-over-background while preaching. Send that ONE feed as NDI -> ONE decoder at the wall -> NovaStar. The NovaStar does NOT switch; it just displays the wall program.',
    benefits: 'One decoder (not two), booth-controlled, fewer failure points, and it matches how they already composite/switch in software.',
  },
  alternative: {
    name: 'TWO feeds to the NovaStar (presentation + camera program), switch/layer on the VX1000',
    how: 'Both the presentation and the ATEM camera program reach the NovaStar as separate inputs; the operator selects/layers them on the VX1000.',
    cost: 'Needs 2 decoders and makes the NovaStar the wall switcher — switching lives at the wall, not the booth.',
    recommended: false,
  },
  // All produced upstream, on the SAME single wall-program NDI feed; no new hardware.
  contentModes: [
    'Announcements / images',
    'Song lyrics',
    'IMAG (live camera during the message)',
    'Scripture / sermon-point text over a background image (preaching) — just another presentation SCENE',
  ],
  presentationSoftwareNote: 'Scripture-text-over-background is a PRESENTATION-SOFTWARE capability (e.g. ProPresenter, the church standard, has a built-in scripture library + text-over-background templates). It rides the same single wall-program NDI feed — no new hardware, still one decoder, one feed.',
  buyList: 'Confirm ONE NDI decoder for the wall (not two).',
  smePending: 'Confirm the presentation tower software (ProPresenter assumed); then document the wall-program output + the sermon-text/scripture workflow in that tool.',
};

// The INPUT-side vs OUTPUT-side distinction (so it is not confused again).
export const NOVASTAR_IO = {
  outputSide: 'The NovaStar DOES plug into the wall — that is its OUTPUT side: the 10 Ethernet ports drive the cabinets directly (point-to-point shielded Cat6, no switch). The LED wall IS the display.',
  inputSide: 'The INPUT side is separate: the NovaStar takes a video signal IN (HDMI/SDI) from the source (presentation tower / ATEM). It does not generate a picture itself.',
  fullPath: 'source (presentation / cameras) -> HDMI/SDI INTO the NovaStar -> NovaStar -> Ethernet OUT to the cabinets -> wall.',
  monitorNote: 'NO monitor is needed at the wall — the LED wall is the display. A small monitor near the wall or in the booth is OPTIONAL only as a confidence/preview screen for the operator; not required.',
  controlNote: 'Full control from the control room over the LAN: management software on the control-room tower drives the VX1000 control port over the network — brightness, input selection, screen mapping, on/off, config — all remote, nobody at the wall.',
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
    specLine: 'Places the program on the wall: source-select among whole inputs, layer/PIP, hold a backup, 10 LED-data output ports. Not a production switcher.',
    controlNote: 'Switches at SOURCE level (whole inputs) + failover; the ATEM does the multi-camera production switching. Control over the LAN from the control-room tower.',
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
