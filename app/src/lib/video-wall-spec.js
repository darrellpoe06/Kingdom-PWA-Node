// =============================================================================
// video-wall-spec — the cabinet / grid / POWER / DATA math for the COLG wall
// =============================================================================
// Pure data + pure derivations for the sanctuary LED video wall install. This is
// the single source of truth the install runbook (doc), the in-app Video Wall
// project card, and the proven-to-catch tests all read from, so a number stated
// on a printout, on a screen, and in a test can never silently drift (DR-0076).
//
// PRIVACY (binding; the repo is PUBLIC): this file carries ONLY non-financial
// engineering facts (cabinet specs, pixel/power/data math). NO invoice number,
// NO dollar figure, NO donation amount appears here or anywhere in the bundle —
// the money lives only in the gated DB rows + gitignored seed (video-wall-sync).
//
// SOURCES (cited, per Verification Doctrine — claims carry provenance):
//   - Cabinet:  Mirackle P1.99mm indoor panel, vendor spec page
//               https://mirackle.us/indoor-led/p1-99mm/  (640x480x75 mm, 7 kg,
//               100 W max / 50 W avg, 100-240 V). Vendor = LED Nation USA.
//   - Processor: NovaStar VX1000 All-in-One Controller Specifications (V1.6.0),
//               https://oss.novastar.tech/uploads/2024/07/VX1000-All-in-One-Controller-Specifications-V1.6.0.pdf
//               (6.5 Mpx total load; 650,000 px per Gigabit port; 10 ports).
//
// CONFIRM-ON-SITE flags: any value we could NOT verify from a datasheet is marked
// `confirm:true` with the safe conservative default, so the runbook flags it
// rather than painting a number we did not measure.
// =============================================================================

export const FEET_TO_MM = 304.8;

// --- The cabinet (Mirackle P1.99mm, vendor-confirmed) -------------------------
export const CABINET = {
  vendor: 'LED Nation USA',
  vendorUrl: 'https://lednationusa.com',
  panel: 'Mirackle P1.99mm fine-pitch indoor LED',
  panelUrl: 'https://mirackle.us/indoor-led/p1-99mm/',
  pitchMm: 1.99,
  widthMm: 640,
  heightMm: 480,
  depthMm: 75,
  weightKg: 7,
  weightLb: 15.2,
  // Vendor "maximum / average consumption" per panel = full-white PEAK and
  // typical-content AVERAGE. Size circuits to PEAK, never average.
  peakW: 100,
  avgW: 50,
  voltage: '100-240 V / 50-60 Hz',
  refreshHz: 3840,
  // Pixels per cabinet. The vendor page does not state the module count, so this
  // is the standard P1.99 / 640x480 map (320 x 240 = the clean QHD-tiling map);
  // it is an ESTIMATE until read from the packing list / NovaLCT. confirm:true.
  pxPerCabWidth: 320,
  pxPerCabHeight: 240,
  pxPerCabConfirm: true,
  // Connectors + receiving card were NOT on the vendor page. These are the
  // industry-standard defaults for a fine-pitch indoor panel — CONFIRM on the
  // actual cabinet before trusting the cable amp rating.
  powerConnector: 'Neutrik PowerCon TRUE1 (typical) — power IN + power OUT for daisy-chain',
  powerConnectorAmps: 16, // TRUE1 = 16 A @ 250 V; confirm:true
  dataConnector: 'RJ45 / etherCON Cat5e-Cat6 (typical) — data IN + data OUT',
  receivingCard: 'NovaStar receiving card (model per packing list)',
  connectorsConfirm: true,
  source: 'mirackle.us/indoor-led/p1-99mm (vendor spec page) — verified 2026-06-29',
};

// The NovaStar VX1000 load facts (per-port + total). Full I/O + signal path live
// in display-targets.js; here we keep only what the DATA MAP math needs.
export const VX1000_LOAD = {
  model: 'NovaStar VX1000',
  pxPerPort: 650000,     // single Gigabit port capacity @ 8-bit
  ports: 10,
  maxLoadMegapixels: 6.5,
  source: 'NovaStar VX1000 All-in-One Controller Specifications V1.6.0',
};

// The wall as STATED on site (Darrell, 2026-06-29). The grid math below snaps
// these to the real integer cabinet count.
export const WALL_STATED = { widthFt: 16.9, heightFt: 9.4, aspectClaim: '16:9' };

// --- Derivations (pure; shared by doc + component + tests) --------------------

// Snap the stated physical size to the integer cabinet grid. Returns the count,
// the EXACT physical size that count implies, and the true aspect — so the wall
// dimensions on the runbook are the grid's, not a tape-measure approximation.
export function cabinetGrid(cab = CABINET, wall = WALL_STATED) {
  const wMm = wall.widthFt * FEET_TO_MM;
  const hMm = wall.heightFt * FEET_TO_MM;
  const wide = Math.round(wMm / cab.widthMm);
  const high = Math.round(hMm / cab.heightMm);
  const total = wide * high;
  const actualWidthMm = wide * cab.widthMm;
  const actualHeightMm = high * cab.heightMm;
  const ratio = actualWidthMm / actualHeightMm;
  return {
    wide,
    high,
    total,
    actualWidthMm,
    actualHeightMm,
    actualWidthFt: +(actualWidthMm / FEET_TO_MM).toFixed(2),
    actualHeightFt: +(actualHeightMm / FEET_TO_MM).toFixed(2),
    aspectRatio: +ratio.toFixed(4),
    aspectLabel: Math.abs(ratio - 16 / 9) / (16 / 9) <= 0.01 ? '16:9' : `${ratio.toFixed(2)}:1`,
    totalWeightKg: +(total * cab.weightKg).toFixed(0),
    totalWeightLb: +(total * cab.weightLb).toFixed(0),
  };
}

// Native pixel resolution = px-per-cabinet x the cabinet grid. exact:false — the
// per-cabinet module count is an estimate until read from NovaLCT / packing list.
export function nativeResolution(cab = CABINET, grid = cabinetGrid(cab)) {
  const widthPx = cab.pxPerCabWidth * grid.wide;
  const heightPx = cab.pxPerCabHeight * grid.high;
  const fromPitch = {
    widthPx: Math.round(grid.actualWidthMm / cab.pitchMm),
    heightPx: Math.round(grid.actualHeightMm / cab.pitchMm),
  };
  return {
    widthPx,
    heightPx,
    megapixels: +((widthPx * heightPx) / 1_000_000).toFixed(2),
    aspectLabel: Math.abs(widthPx / heightPx - 16 / 9) / (16 / 9) <= 0.01 ? '16:9' : `${widthPx}:${heightPx}`,
    pxPerCabinet: cab.pxPerCabWidth * cab.pxPerCabHeight,
    exact: false,
    fromPitchEstimate: fromPitch, // sanity cross-check vs the clean module map
    assumptions: [
      `Module map ${cab.pxPerCabWidth} x ${cab.pxPerCabHeight} px per ${cab.widthMm}x${cab.heightMm} mm cabinet (standard P${cab.pitchMm} map) x ${grid.wide} x ${grid.high} cabinets.`,
      'Confirm the EXACT pixel map from the NovaStar screen config (NovaLCT) / the cabinet packing list at install — the true count is the authority.',
    ],
  };
}

// POWER. max cabinets per circuit = (circuit capacity x 0.8) / cabinet PEAK W.
// derate 0.8 = the NEC continuous-load 80% rule (never load a breaker past 80%).
export function circuitCapacity(amps, { volts = 120, derate = 0.8, cab = CABINET } = {}) {
  const circuitW = volts * amps;
  const usableW = circuitW * derate;
  const maxCabinets = Math.floor(usableW / cab.peakW);
  return {
    amps,
    volts,
    derate,
    circuitW,
    usableW,
    maxCabinets,
    note: `${volts} V x ${amps} A = ${circuitW} W; at ${derate * 100}% = ${usableW} W usable; / ${cab.peakW} W peak = ${maxCabinets} cabinets max.`,
  };
}

// A power CHAIN = cabinets daisy-chained off one cord. Verifies a proposed chain
// size against BOTH the connector/cable amp rating AND the breaker 80% rule.
export function powerChain(cabinetsPerChain, { volts = 120, cab = CABINET } = {}) {
  const chainPeakW = cabinetsPerChain * cab.peakW;
  const chainAvgW = cabinetsPerChain * cab.avgW;
  const chainPeakAmps = +(chainPeakW / volts).toFixed(2);
  const connectorLimited = cab.powerConnectorAmps != null && chainPeakAmps > cab.powerConnectorAmps;
  const within15A = chainPeakW <= 120 * 15 * 0.8;
  const within20A = chainPeakW <= 120 * 20 * 0.8;
  return {
    cabinetsPerChain,
    chainPeakW,
    chainAvgW,
    chainPeakAmps,
    connectorAmps: cab.powerConnectorAmps,
    connectorLimited,
    within15A,
    within20A,
    safe: !connectorLimited && within15A, // safe on the most conservative (15 A) circuit
  };
}

// The whole-wall power plan: total peak/avg, and how the 48 cabinets divide into
// chains + circuits for 15 A and 20 A. We chain by the wall's natural unit (one
// row = `grid.wide` cabinets) so power, data, and the physical layout all align.
export function powerPlan(cab = CABINET, grid = cabinetGrid(cab)) {
  const totalPeakW = grid.total * cab.peakW;
  const totalAvgW = grid.total * cab.avgW;
  const chain = powerChain(grid.wide, { cab }); // one chain per row of `wide` cabinets
  const c15 = circuitCapacity(15, { cab });
  const c20 = circuitCapacity(20, { cab });
  // chains per circuit = how many `grid.wide`-cabinet rows fit under the 80% cap
  const rowsPer15A = Math.floor(c15.maxCabinets / grid.wide);
  const rowsPer20A = Math.floor(c20.maxCabinets / grid.wide);
  return {
    totalCabinets: grid.total,
    totalPeakW,
    totalAvgW,
    totalPeakAmps120: +(totalPeakW / 120).toFixed(1),
    chain,
    circuit15A: c15,
    circuit20A: c20,
    rowsPer15A,
    rowsPer20A,
    // circuits needed if you give each row its own 15 A circuit (simplest, safest)
    circuitsIfOneChainPer15A: grid.high,
    // circuits needed packing rows onto 20 A circuits
    circuitsOn20A: Math.ceil(grid.total / (rowsPer20A * grid.wide)),
  };
}

// DATA. cabinets per VX1000 port = floor(port px cap / px-per-cabinet). Ports
// needed = ceil(total cabinets / cabinets-per-port). Also reports the per-row
// pixel load so a "one port per row" map can be checked against the 650k cap.
export function dataMap(cab = CABINET, grid = cabinetGrid(cab), vx = VX1000_LOAD) {
  const pxPerCabinet = cab.pxPerCabWidth * cab.pxPerCabHeight;
  const cabinetsPerPort = Math.floor(vx.pxPerPort / pxPerCabinet);
  const portsNeeded = Math.ceil(grid.total / cabinetsPerPort);
  const rowPx = grid.wide * pxPerCabinet;          // px on one full row of `wide` cabinets
  const rowFitsOnePort = rowPx <= vx.pxPerPort;
  const totalPx = grid.total * pxPerCabinet;
  return {
    pxPerCabinet,
    cabinetsPerPort,
    portsNeeded,
    portsAvailable: vx.ports,
    rowPx,
    rowFitsOnePort,
    rowPortMargin: vx.pxPerPort - rowPx,            // headroom if you map one port per row
    totalPx,
    withinProcessor: totalPx <= vx.maxLoadMegapixels * 1_000_000,
    portCap: vx.pxPerPort,
  };
}

// --- Install sequence + safety (single source: doc + component + tests) --------
export const INSTALL_SEQUENCE = [
  { step: 1, title: 'Level the base', body: 'Set and LEVEL the rolling bases / floor frame first. A fine-pitch wall is unforgiving on flatness — a base out of level multiplies into seam steps up the wall. Lock the casters once positioned.' },
  { step: 2, title: 'Build the bottom row first', body: 'Hang/seat the bottom row of cabinets onto the frame and align them to each other before going up. The bottom row is the reference everything stacks on.' },
  { step: 3, title: 'Lock cabinet-to-cabinet + to the frame', body: 'Engage the cam locks / quick-locks between adjacent cabinets AND fix each cabinet to the support frame. Cabinets pull tight to each other so the seams close; the frame carries the load.' },
  { step: 4, title: 'Stack upward, row by row', body: 'Build up one full row at a time, locking each new cabinet to the one below and beside it. Keep checking the wall stays plumb as it rises.' },
  { step: 5, title: 'Seam + flatness check', body: 'With all cabinets up, walk the face: no proud/recessed tiles, no open seams. Adjust cabinet depth/alignment screws until the face is flat and the seams are tight before any wiring is dressed.' },
  { step: 6, title: 'Wire DATA then POWER', body: 'Run the Cat6 data daisy-chains (VX1000 port -> cabinet data-IN -> next), then the power daisy-chains (one cord -> cabinet power-IN -> next, up to the safe max). Dress cable so power and data are separated; label every chain to its circuit/port.' },
];

export const SAFETY = [
  'Size power for PEAK, not average. The 100 W "maximum" per cabinet is the number that sets the circuit math — not the 50 W average.',
  'Never exceed 80% of a breaker. A 15 A circuit carries 1440 W continuous, a 20 A circuit 1920 W. The math below already applies the 80% rule.',
  'Mind inrush. 48 LED power supplies switching on together draw a large inrush surge that can trip a breaker even when the steady load is fine. Stagger powering the chains on (or use a power sequencer); do not energize the whole wall at one switch.',
  'Ground it properly. Every cabinet chassis and the frame must be bonded to a proper earth ground.',
  'Permanent install = licensed electrician. For a PERMANENT wall, a licensed electrician should confirm dedicated circuits and the feed/panel capacity. This is load + fire safety, and it is real — the math here sizes the load; the electrician signs off the building side.',
];
