// =============================================================================
// led-wall-signal-chain — the GROUNDED, confirmed COLG LED-wall signal chain
// =============================================================================
// Darrell confirmed this chain on site (2026-06-30) with the gear the church
// already OWNS. This module is the single source of truth for three Projects-tab
// deliverables rendered on the LED-wall capital-project record (ChurchVideoWall):
//   (a) DOCUMENTATION he can return to,
//   (b) a TEACHING card for staff / volunteers,
//   (c) a FINISH CHECKLIST he works down to drive the project to done.
// Pure data + small derivations; proven-to-catch tests guard the load-bearing
// numbers (8 LED lines, ~510k px/line under the ~650k limit, 2 spare ports).
//
// Recorded EXACTLY as confirmed. Figures that are still SME-pending the real
// NovaLCT map are marked `smePending`, not painted as final.
// =============================================================================

// The wall as confirmed (8 columns x 6 rows). The native px here is Darrell's
// grounded figure; the video-wall-spec module carries the ~2560x1440 module-map
// estimate — both resolve to the same wall once NovaLCT reads the exact count.
export const WALL_GRID = {
  cabinets: 48,
  columns: 8,
  rows: 6,
  nativeWidthPx: 2710,   // ~ confirmed estimate
  nativeHeightPx: 1508,  // ~ confirmed estimate
  approxTotalPx: 4100000, // ~4.1M px
  pxPerCabinet: 85000,    // ~85k px/cabinet
  smePending: 'Exact pixel map from NovaLCT / the packing list confirms the per-cabinet count (~85k) and the native res (~2710x1508).',
};

// VIDEO IN — the owned KEQINX 1x8 HDMI-over-Cat6 path (REPLACES the NDI decoder
// for the wall's video). One source fans out to the wall + other screens.
export const VIDEO_IN = {
  ownedGear: 'KEQINX 1x8 HDMI-over-Cat6 splitter + a single HDMI extender + a plain 1x4 HDMI splitter for short runs — the church already owns these.',
  replacesNdiDecoder: true,
  path: [
    'Program source (ATEM program / presentation tower) outputs HDMI.',
    'HDMI -> KEQINX 1x8 HDMI-over-Cat6 splitter (HDMI IN).',
    'CAT OUT 1 -> Cat6 (<= 70 m / 230 ft) -> receiver at the wall.',
    'Receiver -> HDMI -> NovaStar VX1000 HDMI input.',
  ],
  otherOutputs: 'CAT OUT 2-8 feed the stage TV / confidence monitors / lobby from the SAME source.',
  maxRunM: 70,
  maxRunFt: 230,
};

// CONTROL — NovaStar control port over the network (settings, not pixels).
export const CONTROL = {
  path: 'NovaStar control port -> Cat6 -> server-room network switch (network control).',
  carries: 'Brightness, input selection, screen mapping, on/off, config — over the LAN.',
  throughSwitch: true, // control IS network; it MAY go through a switch
};

// LED DATA — NovaStar -> wall, DIRECT, never through a switch. ONE line per
// COLUMN: 8 lines, each feeds the top cabinet of its column then daisy-chains
// down all 6. This is the confirmed wiring (supersedes the generic per-row
// illustration in the capacity math).
export const LED_DATA = {
  linesPerColumn: true,
  lines: 8,              // one per column
  cabinetsPerLine: 6,    // the 6 rows of that column, daisy-chained
  pxPerLine: 510000,     // 6 x ~85k
  portLimitPx: 650000,   // Gigabit per-port limit
  totalPorts: 10,
  sparePorts: 2,         // 10 - 8
  path: 'Each of the 8 LED-out ports -> the TOP cabinet of one column -> daisy-chain DOWN its 6 cabinets.',
  rule: 'DIRECT, point-to-point, NEVER through a network switch (proprietary LED data protocol).',
  shieldedCat6: true,
};

// POWER + MAP (the last two finish steps).
export const POWER = {
  note: 'NovaStar + cabinets on rated circuits; STAGGER power-on (inrush). See the power/circuit math (lib/video-wall-spec.js).',
};
export const MAP = {
  note: 'Arrange the 8 x 6 cabinets in NovaLCT (over the control connection) so the image tiles correctly. Wrong order/orientation = the section tiles in the wrong place.',
  software: 'NovaLCT (receiving-card config + screen connection). Confirm the exact tool/version with the vendor — a COEX-class unit would use VMP instead.',
};

// =============================================================================
// FIRST LIGHT — fresh-out-of-box: a proof-of-life test tonight, then the one-time
// NovaLCT map. A brand-new VX1000 has NO screen config, so a source lights the
// tiles but does NOT show a coherent picture until it is mapped once.
// =============================================================================
export const FIRST_LIGHT = {
  usbMyth: 'The VX1000 Pro is a processor/controller, NOT a media player — its USB port is for setup/firmware (NovaLCT), not for playing video files. To show a video you feed it an HDMI source (a laptop in VLC full-screen is easiest).',
  // Tonight: confirm power + data + source are alive. Not a clean picture.
  proofOfLife: [
    'Play the video on a laptop in VLC, full-screen + loop (or a phone via a USB-C -> HDMI adapter).',
    'HDMI from that source into a VX1000 Pro HDMI input.',
    'On the VX1000 front panel, select that HDMI input.',
    'Expect the wall to LIGHT — likely scrambled / repeated across cabinets / partial, because it is not mapped yet. That is normal and is a WIN: it proves power + LED data + source are all live.',
    'Nudge brightness down on the panel if it is blinding. Snap a photo.',
  ],
  proofOfLifeNote: 'Fresh out of the box there is no coherent picture without the map — do not chase one tonight.',
  // Requirements for the real map (a daylight job).
  mappingRequires: [
    'A Windows laptop with NovaLCT (free from NovaStar).',
    'USB or Cat6 from the laptop to the VX1000 control port.',
    'The cabinet config: either the receiving cards are PRE-LOADED (turnkey walls often are — then only Screen Connection is left), OR a config file (.rcfgx) from LED Nation, OR Smart Settings with Mirackle module parameters.',
  ],
  // The one-time NovaLCT sequence (order matters). Menu labels vary by version;
  // the vendor .rcfgx is the reliable path — flagged, not fabricated.
  novalctSteps: [
    { step: 1, title: 'Connect', body: 'Laptop -> VX1000 control port (USB/Cat6). Open NovaLCT; confirm it detects the controller (comm port green). Set the input to HDMI.' },
    { step: 2, title: 'Advanced login', body: 'User -> Advanced Synchronous System User Login (password is version-specific — commonly "admin" or "666"; confirm).' },
    { step: 3, title: 'Receiving-card config', body: 'Screen Configuration -> Receiving Card: Load the vendor .rcfgx -> Send to Receiving Card (all) -> Save to receiving cards (persists on power-cycle). If no file, run Smart Settings with Mirackle module parameters.' },
    { step: 4, title: 'Screen Connection (the map)', body: 'Screen Configuration -> Screen Connection: set columns = 8, rows = 6; for each output port (1-8) click the cabinets in the ORDER the cable physically runs (one port per column, entered from the end nearest the processor). Match the wiring exactly. Send to hardware.' },
    { step: 5, title: 'Save / solidify', body: 'Save the system configuration so the map persists on the receiving cards + controller after power-off.' },
    { step: 6, title: 'Brightness + source', body: 'Set brightness/gamma to ~50-70%. Feed the HDMI source (laptop VLC full-screen) -> the wall now shows the mapped, coherent image.' },
    { step: 7, title: 'Verify tiling', body: 'Walk the face: no cabinet out of order/rotated. If a section is wrong, fix that cabinet in Screen Connection and re-send.' },
  ],
  recommendation: 'Do the proof-of-life test tonight (lit tiles = success), then MAP it tomorrow with a Windows laptop + NovaLCT in the light. Do not build the map at the end of a long install day.',
};

// A ready-to-send message to LED Nation — unblocks tomorrow's map. Keep the wall
// facts accurate; ask the two things that decide how fast the map goes.
export const VENDOR_MESSAGE = {
  to: 'LED Nation USA',
  subject: 'COLG P1.99 wall — receiving-card config + screen file before we map',
  body: [
    'Hi — we have finished assembling and cabling the Mirackle P1.99 wall (8 columns x 6 rows, 48 cabinets) and it is powering up on the VX1000 Pro.',
    'Before we map it, two questions:',
    '1) Are the receiving cards already PRE-LOADED with the cabinet/module configuration, or do we need to run Smart Settings?',
    '2) Please send the NovaLCT screen configuration file (.rcfgx / saved project) for this wall, plus the receiving-card model + module parameters.',
    'Also: if you pre-mapped it, what is the output-port -> cabinet layout, and which software/version should we use (NovaLCT)?',
    'Thanks!',
  ],
};

// --- Derivation (proven-to-catch): the LED-line math from the grid ------------
export function ledLineMath(grid = WALL_GRID, led = LED_DATA) {
  const pxPerLine = grid.rows * grid.pxPerCabinet; // 6 x 85k
  const lines = grid.columns;                      // one per column
  return {
    lines,
    cabinetsPerLine: grid.rows,
    pxPerLine,
    underLimit: pxPerLine <= led.portLimitPx,
    portsUsed: lines,
    sparePorts: led.totalPorts - lines,
    totalPx: pxPerLine * lines,
  };
}

// =============================================================================
// TEACHING CARD — plain language for staff / volunteers
// =============================================================================
export const TEACHING_CARD = {
  title: 'How the LED wall is wired (the 3 jobs + power)',
  intro: 'Three different cables do three different jobs. Keep them straight and the wall just works.',
  planes: [
    { name: '1. VIDEO (the picture)', plain: 'The image starts at a source (the ATEM program or the presentation tower). It travels over an HDMI-over-Cat6 splitter to a receiver at the wall, then HDMI into the NovaStar. The NovaStar does not make a picture — it receives one.' },
    { name: '2. CONTROL (the settings)', plain: 'A separate network cable lets us control the NovaStar from the server room — brightness, which input shows, the screen map. This rides the normal network through a switch. Pixels do NOT.' },
    { name: '3. LED DATA (the pixels)', plain: 'Eight cables go straight from the NovaStar to the wall — one per column — and feed the cabinets. This is a special LED signal: it must go DIRECT to the cabinets and can NEVER pass through a network switch.' },
    { name: '4. POWER', plain: 'The NovaStar and the cabinets plug into rated circuits. Turn the wall on in stages (not all at once) so the surge does not trip a breaker.' },
  ],
  oneLiner: 'Source -> (video) -> NovaStar -> (8 direct LED lines) -> wall. Control rides the network; pixels never do.',
};

// =============================================================================
// FINISH CHECKLIST — the steps Darrell works down from the Projects tab
// =============================================================================
export const FINISH_CHECKLIST = [
  { id: 'led-lines', group: 'Cabling — LED data', label: 'Run the 8 LED lines (one per column)', detail: 'NovaStar LED-out port -> top cabinet of each column -> daisy-chain down its 6. ~510k px/line, under the 650k limit. DIRECT shielded Cat6, NO switch. 2 ports spare.' },
  { id: 'control-line', group: 'Cabling — control', label: 'Run 1 control line', detail: 'NovaStar control port -> Cat6 -> server-room network switch.' },
  { id: 'video-in', group: 'Cabling — video in', label: 'Run 1 video-in line', detail: 'Program source HDMI -> KEQINX 1x8 (HDMI IN) -> CAT OUT 1 -> Cat6 (<=70 m) -> receiver -> HDMI -> NovaStar HDMI in. (CAT OUT 2-8 feed the other screens.)' },
  { id: 'power', group: 'Power', label: 'Power the NovaStar + cabinets on rated circuits', detail: 'Stagger power-on (inrush). See the power/circuit math.' },
  { id: 'mapping', group: 'Mapping', label: 'Map the 8 x 6 cabinets in NovaLCT', detail: 'Over the control connection; receiving-card config (vendor .rcfgx or Smart Settings) -> Screen Connection (assign port->column order) -> Save. See "First light" for the full NovaLCT sequence.' },
  { id: 'test-light', group: 'Test', label: 'Test-light with any HDMI source', detail: 'Feed any HDMI source into the NovaStar; confirm the wall lights and the image tiles correctly across all 48 cabinets.' },
];

// The chain as simple diagram NODES + EDGES (rendered as inline SVG in the card).
export const CHAIN_DIAGRAM = {
  nodes: [
    { id: 'source', label: 'Program source', sub: 'ATEM / presentation tower' },
    { id: 'keqinx', label: 'KEQINX 1x8', sub: 'HDMI-over-Cat6 splitter' },
    { id: 'receiver', label: 'Receiver', sub: 'at the wall' },
    { id: 'vx1000', label: 'NovaStar VX1000', sub: 'wall processor' },
    { id: 'wall', label: 'LED wall', sub: '8 x 6 = 48 cabinets' },
  ],
  videoEdges: [
    { from: 'source', to: 'keqinx', label: 'HDMI' },
    { from: 'keqinx', to: 'receiver', label: 'Cat6 <=70m' },
    { from: 'receiver', to: 'vx1000', label: 'HDMI' },
  ],
  ledEdge: { from: 'vx1000', to: 'wall', label: '8 direct LED lines (no switch)' },
  controlNote: 'CONTROL: NovaStar control port -> Cat6 -> server-room switch (network).',
};

// =============================================================================
// VX1000 SOFTWARE — the NovaStar program stack (confirmed 2026-07-01)
// =============================================================================
// The three programs that run the VX1000, what each is for, WHEN it's used, and
// WHICH control-room machine it installs on. Plus the on-site first-setup steps.
// Copy-friendly on the in-app card so Darrell can follow it from his phone.
export const VX1000_SOFTWARE = {
  controller: 'NovaStar VX1000',
  // CORRECTED 2026-07-01 (the old /downloads/ page was a dead end). This is the
  // working NovaStar downloads page; NovaLCT is under the "Software" category tab,
  // latest V5.9.1, Windows. Official NovaStar only — never a third-party installer.
  downloadUrl: 'https://www.novastar.tech/download/download.html?catid=7',
  downloadNav: 'On that page, open the "Software" category tab -> NovaLCT (latest V5.9.1, Windows).',
  downloadSearchUrl: 'https://www.novastar.tech/downloads/search.html',
  downloadSearchNav: 'Or search "NovaLCT" here.',
  novalctVersion: 'V5.9.1 (Windows)',
  officialOnly: 'Download from novastar.tech ONLY — do not use third-party installer sites (security).',
  programs: [
    {
      name: 'NovaLCT',
      role: 'Main configuration tool',
      does: 'Screen layout, Ethernet-port -> cabinet mapping, brightness/chroma calibration, firmware, RCFG cabinet-file import.',
      when: 'Setup + recalibration',
      machine: 'Control-room CONFIG laptop (Windows)',
    },
    {
      name: 'V-Can',
      role: 'Live on-site control (after config)',
      does: 'Input switching, layers, presets during service.',
      when: 'Live / every service',
      machine: 'Control-room OPERATOR machine (Windows)',
    },
    {
      name: 'VICP',
      role: 'Cloud monitoring (optional)',
      does: 'Remote status / monitoring of the processor.',
      when: 'Optional / ongoing',
      machine: 'Any admin machine (optional)',
      optional: true,
    },
  ],
  // On-site first-setup order (uses the CONFIRMED default advanced password).
  steps: [
    'Connect the VX1000 to the config laptop via USB Type-B for first setup (more stable than Ethernet).',
    'Open NovaLCT; log in as the Advanced / Synchronous user (default password "admin").',
    'Screen Configuration -> map the 8 x 6 = 48-cabinet grid across the VX1000 output ports.',
    'Load the panel maker’s RCFG cabinet file if provided (Receiving Card -> load/import).',
    'Switch to V-Can for live control (input switching, layers, presets).',
  ],
  // Which software on which machine (record + confirm the real machines on site).
  machinePlan: [
    { machine: 'Control-room config laptop (Windows)', install: 'NovaLCT', note: 'The setup + calibration machine; USB Type-B to the VX1000 for first config.' },
    { machine: 'Control-room operator machine (Windows)', install: 'V-Can', note: 'Runs live during service; can be the same laptop or the presentation/build tower.' },
    { machine: 'Any admin machine (optional)', install: 'VICP', note: 'Optional cloud monitoring; not required to run the wall.' },
  ],
  machinePlanConfirm: 'Confirm the actual control-room machines on site + record who has each (NovaLCT config vs V-Can operator).',
  usbNote: 'USB Type-B is for FIRST setup (most stable). After config, the control port -> LAN carries control (NovaLCT/V-Can over the network).',
};

// =============================================================================
// TOOL CACHE — a sovereign, known-good copy of the VX1000 tools on the NAS
// =============================================================================
// So any control PC pulls ONE vetted copy without re-hunting NovaStar's JS-gated
// site. The NAS folder + README exist; the actual files are dropped in once by a
// human who VETS them (an installer download is not auto-fetched). Files not yet
// dropped are marked to-populate, not claimed as present.
export const TOOL_CACHE = {
  purpose: 'A sovereign, known-good copy of the VX1000 tools on the NAS, so any control PC pulls one vetted copy without re-hunting NovaStar\'s JS-gated download site.',
  nasPath: '/volume1/PoeTech/tool-cache/novastar/',
  smbPath: '\\\\192.168.1.26\\PoeTech\\tool-cache\\novastar\\',
  contents: [
    { file: 'NovaLCT V5.9.1 (Windows) installer zip', status: 'to-populate', note: 'Vetted from novastar.tech "Software" tab.' },
    { file: 'VX1000 Synchronous Control System manual (PDF)', status: 'to-populate' },
    { file: 'RCFG cabinet file (8x6 receiving-card config)', status: 'to-populate', note: 'SME-pending from LED Nation.' },
  ],
  howToPull: 'From any control PC on the LAN or Tailscale: SMB \\\\192.168.1.26\\PoeTech\\tool-cache\\novastar\\, or scp dpoe@192.168.1.26:/volume1/PoeTech/tool-cache/novastar/*.',
  populateOnce: 'Drop the vetted files into the NAS path once (owner/tech). After that the cache is the one known-good source.',
  officialSource: 'https://www.novastar.tech/download/download.html?catid=7',
};

// =============================================================================
// CONTROL FROM ANYWHERE — remote NovaLCT / browser control of the VX1000
// =============================================================================
// NovaLCT is a Windows app that talks to the VX1000 over the CONTROL network, so
// "remote" = a PC that can REACH the VX1000 control port (LAN or Tailscale mesh).
export const CONTROL_FROM_ANYWHERE = {
  summary: 'NovaLCT is a Windows app that talks to the VX1000 over the CONTROL network — so "remote control" means a PC that can REACH the VX1000 control port.',
  options: [
    {
      name: 'NovaLCT on a networked PC (sovereign — recommended)',
      how: 'Install NovaLCT (from the NAS cache) on a PC that has network reach to the VX1000 control port. Reach it over the Tailscale mesh from home / other nodes — no cloud.',
      use: 'Full config: screen mapping, calibration, firmware, presets.',
    },
    {
      name: 'VX1000 Pro built-in web page + VICP',
      how: 'Browser-based control via the VX1000 Pro\'s built-in web page, plus VICP for quick adjustments.',
      use: 'Quick adjustments (brightness, input select, presets) from a browser — no install.',
    },
  ],
  guardrails: [
    'Keep the VX1000 control port on the LAN / tailnet ONLY — never exposed to the public internet.',
    'ONE operator pushes config at a time — do not run two NovaLCT sessions writing at once (conflicts).',
  ],
};
