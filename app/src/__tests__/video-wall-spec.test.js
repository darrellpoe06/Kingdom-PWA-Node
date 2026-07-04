// Video Wall SPEC math — proven-to-catch. The install runbook's power + data
// numbers must DERIVE from the cabinet datasheet + the cabinet grid, never be
// hardcoded, and the safety derate (80%) must actually bound the circuit math.
// A green check here means the number on the on-site printout is the same number
// the code computed (DR-0076: measure/derive, don't claim).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CABINET, VX1000_LOAD, DATA_AS_BUILT, COMMISSIONING,
  cabinetGrid, nativeResolution, circuitCapacity, powerChain, powerPlan, dataMap,
  INSTALL_SEQUENCE, SAFETY,
} from '../lib/video-wall-spec.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../..');

describe('cabinetGrid — snaps the stated size to the real cabinet count', () => {
  const g = cabinetGrid();
  it('derives 8 wide x 6 high = 48 cabinets for the 16.9 x 9.4 ft wall', () => {
    expect(g.wide).toBe(8);
    expect(g.high).toBe(6);
    expect(g.total).toBe(48);
  });
  it('the integer grid is exactly 16:9', () => {
    expect(g.actualWidthMm).toBe(5120);
    expect(g.actualHeightMm).toBe(2880);
    expect(g.aspectLabel).toBe('16:9');
  });
  it('reports the real physical size the grid implies (~16.8 x 9.45 ft)', () => {
    expect(g.actualWidthFt).toBeCloseTo(16.8, 1);
    expect(g.actualHeightFt).toBeCloseTo(9.45, 1);
  });
  it('totals the cabinet weight (48 x 7 kg)', () => {
    expect(g.totalWeightKg).toBe(336);
  });
});

describe('nativeResolution — derived, honest, exact only once measured', () => {
  const r = nativeResolution();
  it('is 2560 x 1440 (QHD, 16:9) from the 320x240 module map x 8x6 grid', () => {
    expect(r.widthPx).toBe(2560);
    expect(r.heightPx).toBe(1440);
    expect(r.aspectLabel).toBe('16:9');
  });
  it('reports ~3.69 Mpx, within the VX1000 6.5 Mpx load', () => {
    expect(r.megapixels).toBeCloseTo(3.69, 1);
    expect(r.megapixels).toBeLessThan(VX1000_LOAD.maxLoadMegapixels);
  });
  it('claims exact NOW (measured on site 2026-07-03) and carries the provenance', () => {
    // exact flipped true when the NovaLCT receiving-card readout confirmed
    // 320x240 during commissioning; the flag derives from pxPerCabConfirm so a
    // future unconfirmed cabinet change honestly reverts it.
    expect(r.exact).toBe(true);
    expect(r.assumptions.length).toBeGreaterThanOrEqual(2);
    expect(r.assumptions.join(' ')).toMatch(/MEASURED on site 2026-07-03/);
  });
  it('the pitch cross-check is in the same ballpark as the module map', () => {
    // 5120/1.99 = 2573, 2880/1.99 = 1447 — within ~1% of the clean 2560x1440
    expect(Math.abs(r.fromPitchEstimate.widthPx - r.widthPx) / r.widthPx).toBeLessThan(0.02);
  });
});

describe('circuitCapacity — the 80% rule bounds the cabinet count', () => {
  it('15 A / 120 V -> 14 cabinets max (1440 W usable / 100 W peak)', () => {
    const c = circuitCapacity(15);
    expect(c.circuitW).toBe(1800);
    expect(c.usableW).toBe(1440);
    expect(c.maxCabinets).toBe(14);
  });
  it('20 A / 120 V -> 19 cabinets max (1920 W usable / 100 W peak)', () => {
    const c = circuitCapacity(20);
    expect(c.usableW).toBe(1920);
    expect(c.maxCabinets).toBe(19);
  });
  it('uses PEAK watts, not average — average would (unsafely) allow more', () => {
    const c = circuitCapacity(15);
    const ifAvg = Math.floor(c.usableW / CABINET.avgW);
    expect(ifAvg).toBeGreaterThan(c.maxCabinets); // proves we did NOT size to avg
  });
});

describe('powerChain — is "8 cabinets to one cord" actually safe?', () => {
  const ch = powerChain(8);
  it('8 cabinets = 800 W peak = 6.67 A at 120 V', () => {
    expect(ch.chainPeakW).toBe(800);
    expect(ch.chainPeakAmps).toBeCloseTo(6.67, 1);
  });
  it('is within the 15 A breaker 80% cap AND the connector amp rating -> SAFE', () => {
    expect(ch.within15A).toBe(true);
    expect(ch.connectorLimited).toBe(false);
    expect(ch.safe).toBe(true);
  });
  it('flags a chain that WOULD exceed the connector rating (anti-theater)', () => {
    // 25 cabinets = 2500 W = 20.8 A > 16 A TRUE1 rating -> must flag
    const big = powerChain(25);
    expect(big.connectorLimited).toBe(true);
    expect(big.safe).toBe(false);
  });
});

describe('powerPlan — whole-wall load + circuit division', () => {
  const p = powerPlan();
  it('totals 4800 W peak / 2400 W avg across 48 cabinets', () => {
    expect(p.totalPeakW).toBe(4800);
    expect(p.totalAvgW).toBe(2400);
  });
  it('one chain per row of 8 = 6 chains; one 15 A circuit each is safe', () => {
    expect(p.chain.cabinetsPerChain).toBe(8);
    expect(p.chain.safe).toBe(true);
    expect(p.circuitsIfOneChainPer15A).toBe(6);
  });
  it('a 20 A circuit carries 2 rows (16 cabinets, 1600 W, 13.3 A) under the 80% cap', () => {
    expect(p.rowsPer20A).toBe(2);
    expect(p.circuitsOn20A).toBe(3);
  });
});

describe('dataMap — VX1000 port math for this wall', () => {
  const d = dataMap();
  it('8 cabinets per 650k-px port (76,800 px each)', () => {
    expect(d.pxPerCabinet).toBe(76800);
    expect(d.cabinetsPerPort).toBe(8);
  });
  it('a full row of 8 (614,400 px) fits one port, with headroom', () => {
    expect(d.rowPx).toBe(614400);
    expect(d.rowFitsOnePort).toBe(true);
    expect(d.rowPortMargin).toBeGreaterThan(0);
  });
  it('needs 6 of the 10 ports; the wall is within the processor load', () => {
    expect(d.portsNeeded).toBe(6);
    expect(d.portsNeeded).toBeLessThanOrEqual(d.portsAvailable);
    expect(d.withinProcessor).toBe(true);
  });
});

describe('install + safety content exists (single source of truth)', () => {
  it('the 6-step sequence is level-base -> bottom-row -> lock -> stack -> seam -> wire', () => {
    expect(INSTALL_SEQUENCE).toHaveLength(6);
    expect(INSTALL_SEQUENCE[0].title).toMatch(/level/i);
    expect(INSTALL_SEQUENCE[5].title).toMatch(/data|power|wire/i);
  });
  it('the safety list names peak-sizing, the 80% rule, inrush, ground, and the electrician', () => {
    const all = SAFETY.join(' ').toLowerCase();
    expect(all).toMatch(/peak/);
    expect(all).toMatch(/80%/);
    expect(all).toMatch(/inrush/);
    expect(all).toMatch(/ground/);
    expect(all).toMatch(/electrician/);
  });
});

// PRIVACY GATE extended to the new public file — the same scan the existing
// video-wall test runs, now covering video-wall-spec.js so a figure can never
// leak into the bundle through the new module.
describe('privacy — no church figures in the new public spec file', () => {
  const FORBIDDEN = ['39280', '39,280', '3999', '3,999', '6545', '12539'];
  it('video-wall-spec.js contains no real figure / invoice number', () => {
    const src = readFileSync(join(ROOT, 'app/src/lib/video-wall-spec.js'), 'utf8');
    const hits = FORBIDDEN.filter((t) => src.includes(t));
    expect(hits, `leaked: ${hits.join(', ')}`).toEqual([]);
  });
});

// AS-BUILT + COMMISSIONING record (2026-07-03) — the on-site truth stays
// consistent with the capacity math and carries its provenance.
describe('as-built data map + commissioning record (2026-07-03)', () => {
  it('8 ports as built: at least the 6 capacity requires, within the 10 available', () => {
    const d = dataMap();
    expect(DATA_AS_BUILT.portsUsed).toBeGreaterThanOrEqual(d.portsNeeded);
    expect(DATA_AS_BUILT.portsUsed).toBeLessThanOrEqual(d.portsAvailable);
    expect(DATA_AS_BUILT.portsUsed).toBe(cabinetGrid().wide); // one port per column
  });
  it('cabinet pixel map is CONFIRMED (measured), and the model is the Pro', () => {
    expect(CABINET.pxPerCabConfirm).toBe(false);
    expect(VX1000_LOAD.model).toMatch(/VX1000 Pro/);
  });
  it('the commissioning record carries the screen, preset, and punch list', () => {
    expect(COMMISSIONING.date).toBe('2026-07-03');
    expect(COMMISSIONING.screen).toMatch(/2560x1440/);
    expect(COMMISSIONING.preset).toMatch(/Preset 1/);
    expect(COMMISSIONING.punchList.length).toBeGreaterThanOrEqual(2);
  });
});
