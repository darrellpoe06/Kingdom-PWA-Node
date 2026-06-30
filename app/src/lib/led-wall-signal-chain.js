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
  note: 'Arrange the 8 x 6 cabinets in NovaStar Vision Management (over the control connection) so the image tiles correctly. Wrong order/orientation = the section tiles in the wrong place.',
  software: 'NovaStar Vision Management (+ NovaLCT for receiving-card config).',
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
  { id: 'mapping', group: 'Mapping', label: 'Map the 8 x 6 cabinets in NovaStar Vision Management', detail: 'Over the control connection; arrange columns/rows + orientation so the image tiles correctly.' },
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
