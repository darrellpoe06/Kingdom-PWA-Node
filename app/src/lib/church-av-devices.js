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
  // Scan-confirmed on the church LAN (2026-07-08). The mDNS advertisement is the
  // load-bearing new fact: the ATEM advertises _blackmagic._tcp and NOT NDI, which
  // confirms it has NO native NDI input — sources reach it over SDI/HDMI, and any
  // NDI source must be bridged to SDI upstream (see CAMERA_CONNECTIONS 'ip-ndi').
  scan: {
    ipAddress: '192.168.0.60',
    mdns: '_blackmagic._tcp',
    nativeNdi: false,
    confirmed: '2026-07-08',
    note: 'Advertises _blackmagic._tcp on the LAN, NOT NDI — confirms the ATEM has NO native NDI input. Cross-ref lib/church-devices.js dev-atem-production-studio-4k (the inventory row).',
  },
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

// =============================================================================
// THREE SCREENS, THREE JOBS — the middle (LED wall) is independent of the sides
// =============================================================================
// Verified on site 2026-07-10 (Darrell). The sanctuary carries THREE display
// surfaces that must NOT be conflated:
//   - The MIDDLE screen  = the LED wall (Mirackle P1.99mm, 48 cabinets).
//   - The TWO SIDE screens = the sanctuary PROJECTORS, fed from Proclaim.
// Today the middle screen is fed by the WALL LAPTOP (the Alienware in the booth,
// hostname TLC-Tech-Team) running NDI Studio Monitor full-screen -> HDMI ->
// NovaStar VX1000 Pro -> the wall. Broadcast is a SEPARATE lane: OBS on the RIGHT
// CUDA (livestream-main-pc), publishing NDI "OBS", multistreamed to YouTube +
// Facebook. The NDI sources on the church LAN the wall can point at are the three
// PTZOptics cameras (Center-1/Left-2/Right-3, 192.168.1.123/.127/.126), NDI
// ProClaim, the iMac (macOS AV Output), and OBS.
//
// RECONCILE WITH SIGNAL_CHAIN (above): SIGNAL_CHAIN / WALL_FEED_ARCHITECTURE
// describe the PLANNED production destination (camera SDI -> ATEM -> VX1000, the
// DR-0082 hybrid). MIDDLE_SCREEN_TOPOLOGY below is the CURRENT deployed reality
// for the middle screen. Both are true: one is where we're going, one is what is
// running today. Neither paints over the other.
// =============================================================================
export const MIDDLE_SCREEN_TOPOLOGY = {
  verifiedOn: '2026-07-10',
  verifiedBy: 'Darrell (on site)',
  screens: [
    { screen: 'middle', is: 'The LED wall', fedBy: 'Wall laptop (TLC-Tech-Team, Alienware) -> NDI Studio Monitor full-screen -> HDMI -> NovaStar VX1000 Pro -> wall.', independent: 'CAN be made independent of both the side screens and the broadcast (see WALL_FEED_OPTIONS).' },
    { screen: 'sides', is: 'The two sanctuary projectors', fedBy: 'Proclaim (presentation software) -> the projectors.', independent: 'Their own lane; the wall does not have to mirror them.' },
    { screen: 'broadcast', is: 'The online stream (not a room screen)', fedBy: 'OBS on the RIGHT CUDA (livestream-main-pc) -> NDI "OBS" -> multistream YouTube + Facebook.', independent: 'A separate program; the wall does not have to mirror it either.' },
  ],
  ndiSourcesOnLan: [
    { name: 'OBS (LIVESTREAM-MAIN)', from: 'livestream-main-pc (right CUDA)', is: 'the switched broadcast program (cameras)' },
    { name: 'NDI ProClaim', from: 'the Proclaim host', is: 'the same words the side screens show' },
    { name: 'PTZOptics Center-1 / Left-2 / Right-3', from: '192.168.1.123 / .127 / .126', is: 'single camera feeds' },
    { name: 'macOS AV Output', from: 'the iMac (TLCs-iMac)', is: 'graphics/output Mac' },
  ],
  principle: 'Different settings allow for various outcomes: what the wall SHOWS is chosen by which NDI source the wall laptop points at. The wall is only as independent as the source it subscribes to.',
};

// The wall laptop is a DUMB ENDPOINT: it points at ONE NDI source once and never
// changes during a service. Set NDI Studio Monitor to auto-start so a reboot lands
// back on the wall feed with no operator touch.
export const WALL_LAPTOP_ENDPOINT = {
  device: 'Wall laptop (TLC-Tech-Team, Alienware) in the booth, on the VX1000 HDMI input',
  role: 'Runs NDI Studio Monitor full-screen; its HDMI out is the VX1000 input for the wall.',
  setOnce: 'Point NDI Studio Monitor at the ONE chosen NDI source (recommended: "WALL"), full-screen it, and leave it. It never switches mid-service.',
  autoStart: 'NDI Studio Monitor -> Settings -> Application -> Run at Windows Start, so a reboot returns to the wall feed unattended.',
  why: 'A dumb, unchanging endpoint means the wall has one job and one failure mode; all the "what shows" logic lives upstream in the chosen source, not in a person clicking at the wall.',
};

// The enumerated wall configurations. Each is a real NDI source the wall laptop
// can point at; each PRODUCES a different outcome with its own opportunities and
// constraints. `independentOfSides` / `independentOfBroadcast` classify how much
// separation each buys. The RECOMMENDED option is the only one independent of BOTH.
export const WALL_FEED_OPTIONS = [
  {
    key: 'obs-mirror',
    name: 'Wall points at OBS NDI',
    produces: 'The wall MIRRORS the broadcast program (the switched cameras / IMAG).',
    independentOfSides: true,   // not tied to Proclaim
    independentOfBroadcast: false,
    recommended: false,
    opportunities: [
      'Zero new software: OBS already runs the broadcast on the right CUDA.',
      'The room sees exactly what the online audience sees — good for IMAG of the speaker.',
    ],
    constraints: [
      'The wall is CHAINED to the broadcast: whatever the stream cuts to, the wall shows — you cannot put words on the wall while the stream shows a camera.',
      'NDI + software adds latency; camera IMAG on the wall lags the room slightly.',
      'If OBS dies, the wall feed dies with it (unless a safety source is held).',
    ],
  },
  {
    key: 'proclaim-mirror',
    name: 'Wall points at NDI ProClaim',
    produces: 'The wall shows the SAME words/lyrics as the two side screens.',
    independentOfSides: false,
    independentOfBroadcast: true,
    recommended: false,
    opportunities: [
      'Simplest path to words on the wall — Proclaim is already driving the sides.',
      'One operator, one presentation; the wall and sides never disagree.',
    ],
    constraints: [
      'The wall is CHAINED to Proclaim: it is a third copy of the side screens, not its own surface.',
      'Requires Proclaim to publish an NDI output (a Proclaim plan/setting to confirm on the machine).',
    ],
  },
  {
    key: 'single-camera',
    name: 'Wall points at a camera',
    produces: 'A single-camera wall (one PTZOptics feed full-wall).',
    independentOfSides: true,
    independentOfBroadcast: true,
    recommended: false,
    opportunities: [
      'Dead simple; useful for a fixed wide shot or an overflow room.',
    ],
    constraints: [
      'No switching, no words, no graphics — just one camera. Rarely what a service wants on the main wall.',
    ],
  },
  {
    key: 'wall-obs',
    name: 'Wall points at a dedicated "WALL" NDI feed from a SECOND OBS ("WALL OBS")',
    produces: 'The wall carries ITS OWN program — WORDS ONLY by default (Scripture, sermon points, lyrics, announcements), separate from the cameras AND from Proclaim.',
    independentOfSides: true,
    independentOfBroadcast: true,
    recommended: true,
    intent: "Darrell's stated intent: the wall carries WORDS ONLY, separate from cameras AND separate from Proclaim.",
    how: 'A SECOND OBS instance ("WALL OBS") on the LEFT CUDA (tlcmediadpt), launched with `--portable --multi --websocket_port 4466`, with its own words/graphics sources, publishing an NDI output named "WALL". The wall laptop points at "WALL". Ari drives its scenes remotely (with the AV guardrails).',
    launchFlags: '--portable --multi --websocket_port 4466',
    obsInstance: 'WALL OBS',
    ndiName: 'WALL',
    runsOn: 'left-cuda',        // tlcmediadpt (dev-gpu-node-1)
    built: false,              // NOT YET BUILT — honest until the second OBS exists
    opportunities: [
      'The middle screen becomes independent of BOTH the side screens (Proclaim) AND the broadcast/cameras — its own words-only surface.',
      'Ari can drive the wall program (next slide, next point, a passage) without touching the broadcast or Proclaim.',
      'The broadcast OBS on the right CUDA is untouched — the two OBS instances never collide (separate box, separate websocket port).',
    ],
    constraints: [
      'NOT YET BUILT: the second OBS instance + the "WALL" NDI output + its word/graphics sources do not exist yet. Until they do, the wall cannot use this option.',
      'Runs on the LEFT CUDA (tlcmediadpt) so it never competes with the live broadcast encode on the right CUDA (DR-0012).',
      'Ari driving it is gated by the AV guardrails (humans keep the live cut; preview-then-execute; writes held while an operator is live).',
    ],
  },
];

// =============================================================================
// TODAY'S AV FIXES (2026-07-10) — grounded facts, each with why it mattered
// =============================================================================
// The NDI discovery fix — the big one. OBS's NDI output was INVISIBLE to the wall
// for two compounding reasons, both fixed on the box.
export const NDI_DISCOVERY_FIX = {
  date: '2026-07-10',
  symptom: 'The wall (NDI Studio Monitor) could not SEE OBS\'s NDI output ("LIVESTREAM-MAIN (OBS)") on the LAN, so the wall could not point at the broadcast.',
  rootCauses: [
    'DUAL-HOMED NIC: livestream-main-pc has BOTH network adapters live on overlapping /23 ranges (wired 192.168.1.73 + Wi-Fi 192.168.0.44); NDI auto-picked the Wi-Fi adapter, advertising on the wrong side.',
    'DISCOVERY SERVER OVERRIDE: an NDI Discovery Server was set ("discovery":"192.168.0.11"), which SUPPRESSES the normal mDNS broadcast — so nothing on the LAN could auto-discover the source.',
  ],
  fixFile: 'C:\\ProgramData\\NDI\\ndi-config.v1.json',
  fixFileNote: 'Note: C:\\ProgramData\\NewTek\\NDI is a JUNCTION to the same file — editing either edits both.',
  fix: [
    'Set "adapters":{"allowed":["192.168.1.73"]} — pin NDI to the wired church-LAN NIC.',
    'Set "discovery":"" — clear the Discovery Server override so mDNS broadcast resumes.',
    'FULL OBS RESTART — a Main-Output toggle alone was NOT enough; the config is read at process start.',
  ],
  result: '"LIVESTREAM-MAIN (OBS)" became visible on the LAN and the wall could point at it.',
  openRootCause: 'The two NICs should NOT both be on a /23; the overlapping masks are the underlying defect. Fix the subnet masks in a calm (non-service) moment. re-review: 2026-07-24',
  opportunities: [
    'The broadcast is now a selectable wall source (option obs-mirror).',
    'The same adapters/discovery hygiene unblocks every future NDI source on this box.',
  ],
  constraints: [
    'The dual-homed /23 NIC misconfiguration remains until the masks are fixed — a latent source of NDI/network flakiness.',
    'Pinning "adapters.allowed" to the wired IP means a change to the wired IP needs this file updated.',
  ],
};

// OBS remote control — proven, with the resting-state security posture named.
export const OBS_REMOTE_CONTROL = {
  date: '2026-07-10',
  proven: 'obs-websocket v5 on port 4455 — Ari can READ scenes and SWITCH the program on livestream-main-pc.',
  port: 4455,
  authStateNow: 'Auth is currently OFF (open on the LAN) — proven-out state only.',
  restingState: 'Resting state MUST re-enable auth, with the password read LOCALLY on the box and NEVER pasted into chat. re-review: 2026-07-17',
  guardrail: 'Humans keep the live cut. Ari uses preview-then-execute; writes are held while an operator is at the board (see AV_GUARDRAILS).',
  opportunities: [
    'Ari can assist the operator (surface the right scene, prep a lower third) without taking the cut.',
    'The same websocket drives the future "WALL OBS" program on port 4466 (a separate instance, separate auth).',
  ],
  constraints: [
    'Auth-off is not a shippable resting state — it must be re-enabled before this is trusted unattended.',
    'A second OBS instance needs its OWN websocket port (4466) so the two never cross.',
  ],
};

// LED wall live over the network — the VX1000 has NO network video input, so
// exactly one HDMI hop is required. And the feedback-loop warning.
export const LED_WALL_OVER_NETWORK = {
  path: 'OBS NDI Main Output -> wall laptop NDI Studio Monitor -> HDMI -> NovaStar VX1000 -> wall.',
  vx1000NoNetworkVideo: 'The VX1000 has NO network video input — video reaches it only as a physical signal (HDMI/SDI). The wall laptop IS that one HDMI hop; it cannot be removed.',
  feedbackLoopWarning: 'NEVER feed OBS\'s OWN NDI output back into an OBS scene. An OBS output captured as an OBS input is a video feedback loop (the hall-of-mirrors) that spikes latency and can hang the encode.',
  opportunities: [
    'The wall runs live off the LAN with owned gear — no dedicated NDI decoder box needed while the wall laptop is the endpoint.',
  ],
  constraints: [
    'The one HDMI hop (wall laptop) is a single point of failure for the wall; auto-start (WALL_LAPTOP_ENDPOINT) is the mitigation, not a second box.',
  ],
};

// The durable AV guardrails — extracted as the Way. These ride EVERY step where
// Ari or automation touches the live AV chain.
export const AV_GUARDRAILS = [
  { key: 'humans-keep-the-cut', rule: 'Humans keep the live cut. Ari never takes the program cut during a service.' },
  { key: 'preview-then-execute', rule: 'Preview-then-execute: Ari proposes/previews a change; a human confirms before it goes to program.' },
  { key: 'hold-while-operator-live', rule: 'Writes are HELD while an operator is at the board. Ari does not write to a surface a human is actively driving.' },
  { key: 'kill-switch', rule: 'A kill-switch / dead-man pause exists on any automation that touches AV; on overrun or a missed heartbeat it PAUSES, never auto-continues (three-brakes).' },
  { key: 'no-inference-on-live-encode', rule: 'No AI/inference load on the box encoding the live stream during a service (DR-0012). The WALL OBS runs on the LEFT CUDA for exactly this reason.' },
  { key: 'no-ndi-feedback-loop', rule: "Never feed OBS's own NDI output back into an OBS scene (video feedback loop)." },
];

// The NDI gotchas the discovery fix taught — durable, for the Ways.
export const NDI_GOTCHAS = [
  { key: 'multi-homed-nic', gotcha: 'A multi-homed (dual-NIC) box lets NDI auto-pick the WRONG adapter. Pin it: "adapters":{"allowed":["<wired-LAN-ip>"]}.' },
  { key: 'discovery-server-suppresses-mdns', gotcha: 'An NDI Discovery Server override ("discovery":"<ip>") SUPPRESSES mDNS broadcast, so sources vanish from auto-discovery. Clear it ("discovery":"") to restore mDNS.' },
  { key: 'config-read-at-start', gotcha: 'ndi-config.v1.json is read at PROCESS START — a full app restart is required; a Main-Output toggle is not enough. (C:\\ProgramData\\NewTek\\NDI is a junction to the same file.)' },
];

// =============================================================================
// DERIVED READINESS (proven-to-catch) — status comes from the device rows, not
// a painted green. NO fake-green: an option whose required program is NOT built
// reads 'not-built'; an option needing an unconfirmed node reads 'unverified'.
// =============================================================================
// Given the live device rows (church-devices SEED_DEVICES merged with DB rows),
// classify each WALL_FEED_OPTION: is its source node PRESENT + online, and is the
// option actually usable today? The recommended WALL OBS option is `built:false`
// in the data, so it can only ever return 'not-built' until a real WALL-OBS node
// exists — the honesty gate the render leans on.
export function avIndependenceReadiness(devices) {
  const list = Array.isArray(devices) ? devices.filter((d) => d && d.active !== false) : [];
  const byId = (id) => list.find((d) => d.id === id) || null;
  const online = (d) => !!d && d.status === 'online';

  const rightCuda = byId('dev-gpu-node-2');   // OBS broadcast box
  const leftCuda = byId('dev-gpu-node-1');    // where WALL OBS would run
  const wallLaptop = byId('dev-av-booth-laptop');
  const proclaimHost = byId('dev-imac-tlcs');
  const anyCamera = list.find((d) => d.deviceType === 'camera' && online(d)) || null;
  // The endpoint the wall depends on for EVERY option is the wall laptop.
  const endpointReady = online(wallLaptop);

  return WALL_FEED_OPTIONS.map((opt) => {
    let sourcePresent = false;
    let node = null;
    if (opt.key === 'obs-mirror') { node = rightCuda; sourcePresent = online(rightCuda); }
    else if (opt.key === 'proclaim-mirror') { node = proclaimHost; sourcePresent = online(proclaimHost); }
    else if (opt.key === 'single-camera') { node = anyCamera; sourcePresent = !!anyCamera; }
    else if (opt.key === 'wall-obs') { node = leftCuda; sourcePresent = online(leftCuda); }

    // The recommended second-OBS program is not built until the data says so.
    const notBuilt = opt.built === false;
    let status;
    if (notBuilt) status = 'not-built';               // never green while unbuilt
    else if (!endpointReady) status = 'unverified';   // wall laptop not confirmed online
    else if (!sourcePresent) status = 'unverified';   // source node absent/unconfirmed
    else status = 'available';

    return {
      key: opt.key,
      name: opt.name,
      recommended: opt.recommended === true,
      independentOfSides: opt.independentOfSides === true,
      independentOfBroadcast: opt.independentOfBroadcast === true,
      independentOfBoth: opt.independentOfSides === true && opt.independentOfBroadcast === true,
      produces: opt.produces,
      status,                                         // 'available' | 'unverified' | 'not-built'
      sourceNode: node ? (node.name || node.id) : null,
      endpointReady,
      // The feasibility of BUILDING the recommended option (its node exists) is
      // separate from whether it is built. Feasible-but-unbuilt is the true state.
      feasible: opt.key === 'wall-obs' ? online(leftCuda) : sourcePresent,
    };
  });
}

// Ari's AV capabilities, DERIVED + HONEST. Each capability carries a real state:
// 'enabled-guarded' (proven, rides the guardrails), 'not-built' (the surface does
// not exist yet), or 'unverified' (a required node is unconfirmed). NO capability
// defaults to a pass — the state is computed from today's fixes + the device rows.
export function ariAvCapabilities(devices) {
  const readiness = avIndependenceReadiness(devices);
  const wallObs = readiness.find((r) => r.key === 'wall-obs');
  const list = Array.isArray(devices) ? devices.filter((d) => d && d.active !== false) : [];
  const deviceCount = list.length;
  return [
    {
      key: 'obs-scenes',
      capability: 'Read OBS scenes and switch the program on the broadcast box',
      state: 'enabled-guarded',
      basis: `Proven ${OBS_REMOTE_CONTROL.date}: obs-websocket v5 on :${OBS_REMOTE_CONTROL.port}.`,
      guardrail: 'Humans keep the live cut; preview-then-execute; writes held while an operator is live.',
    },
    {
      key: 'wall-program',
      capability: 'Drive the WALL program (words-only middle screen)',
      state: wallObs && wallObs.status === 'available' ? 'enabled-guarded' : 'not-built',
      basis: 'Requires the second "WALL OBS" instance on the left CUDA (WALL_FEED_OPTIONS.wall-obs).',
      guardrail: 'Same AV guardrails; runs on the left CUDA, never the live-encode box.',
    },
    {
      key: 'device-inventory',
      capability: 'Read the church device inventory / capability register',
      state: deviceCount > 0 ? 'enabled-guarded' : 'unverified',
      basis: `Derived from ${deviceCount} device rows (church-devices).`,
      guardrail: 'Read-only; the register is the source of which node can take which job.',
    },
  ];
}
