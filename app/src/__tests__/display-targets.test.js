// Tests for lib/display-targets.js + the full-bleed IMAGE output path. The primary
// target is the new COLG altar LED wall: 9ft x 12ft, 1.9mm, NovaStar VX1000.
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the load-bearing facts these guard are
//   (1) the wall is HDMI/DVI-fed from the VX1000, NOT NDI-direct (the signal-path
//       correction) — paint over it and a case fails;
//   (2) the native-res estimate is honest (~2573x1447, 16:9, within VX1000 capacity)
//       and NEVER marked exact (it comes from NovaLCT);
//   (3) an image cue maps to a full-bleed image payload end-to-end (set list -> cue ->
//       imageProgram), so high-res media lands on the wall.
import { describe, it, expect } from 'vitest';
import {
  nativeResEstimate, SANCTUARY_WALL, SIDE_SCREENS, VX1000, SIGNAL_PATH,
  IMAGE_AUTHORING_RULE, VX1000_CONTROL, DISPLAY_TARGETS,
} from '../lib/display-targets.js';
import { imageProgram, parseOutputParams } from '../lib/ndi-output.js';
import { imageItem, buildCues, cueToProgram, masterProgramToSetList } from '../lib/worship-presenter.js';

describe('nativeResEstimate — honest, never claimed exact', () => {
  it('derives ~2573x1447, 16:9, ~3.72 Mpx for the 16.8x9.45ft 1.99mm wall', () => {
    const r = nativeResEstimate({ widthFt: 16.8, heightFt: 9.45, pitchMm: 1.99 });
    expect(r.widthPx).toBe(2573);
    expect(r.heightPx).toBe(1447);
    expect(r.aspectLabel).toBe('16:9');
    expect(r.megapixels).toBeCloseTo(3.72, 1);
    expect(r.exact).toBe(false);                 // exact comes from NovaLCT, never painted
    expect(r.assumptions.join(' ')).toMatch(/NovaLCT|module/i);
  });
  it('returns null for a missing/zero pitch (never divides by zero)', () => {
    expect(nativeResEstimate({ widthFt: 12, heightFt: 9, pitchMm: 0 })).toBeNull();
  });
});

describe('the wall is HDMI/DVI from the VX1000 — NOT NDI-direct', () => {
  it('VX1000 has no NDI input; the wall feed is not NDI-direct', () => {
    expect(VX1000.hasNdiInput).toBe(false);
    expect(SANCTUARY_WALL.feed.ndiDirect).toBe(false);
    expect(SANCTUARY_WALL.feed.path).toMatch(/HDMI\/DVI.*VX1000/);
    expect(SANCTUARY_WALL.processor).toBe('NovaStar VX1000');
  });
  it('the wall fits within the VX1000 load capacity (6.5 Mpx)', () => {
    expect(SANCTUARY_WALL.withinProcessorCapacity).toBe(true);
    expect(SANCTUARY_WALL.native.megapixels).toBeLessThanOrEqual(VX1000.capacity.maxLoadMegapixels);
  });
  it('side screens CAN be NDI-fed (the #322 path), unlike the wall', () => {
    expect(SIDE_SCREENS.feed.ndiDirect).toBe(true);
  });
  it('signal path documents both lanes: wall (HDMI) + NDI production-LAN', () => {
    expect(SIGNAL_PATH.wallLane.hops.join(' ')).toMatch(/HDMI\/DVI/);
    expect(SIGNAL_PATH.ndiLane.hops.join(' ')).toMatch(/NDI does NOT feed the VX1000/);
    expect(DISPLAY_TARGETS).toContain(SANCTUARY_WALL);
  });
});

describe('VX1000 control is an OPTIONAL enhancement, not the LHF', () => {
  it('is flagged optional + not-LHF, with live-production guardrails', () => {
    expect(VX1000_CONTROL.status).toBe('optional-enhancement');
    expect(VX1000_CONTROL.isLhf).toBe(false);
    expect(VX1000_CONTROL.capabilities).toContain('recall 1 of 10 user presets');
    expect(VX1000_CONTROL.guardrails).toMatch(/confirm|never auto-switch/i);
  });
});

describe('image authoring rule + full-bleed image output path', () => {
  it('the authoring rule forbids upscaling low-res assets onto the wall', () => {
    expect(IMAGE_AUTHORING_RULE.rule).toMatch(/high-res|never.*upscale|upscaled/i);
    expect(IMAGE_AUTHORING_RULE.minLongEdgePx).toBeGreaterThanOrEqual(1920);
  });
  it('imageProgram defaults to contain (no crop) and carries src/caption', () => {
    const p = imageProgram({ src: '/media/cross.jpg', caption: 'He is risen' });
    expect(p.kind).toBe('image');
    expect(p.fit).toBe('contain');
    expect(p.src).toBe('/media/cross.jpg');
    expect(imageProgram({ src: 'x', fit: 'cover' }).fit).toBe('cover');
  });
  it('parseOutputParams maps kind=image (standalone Browser-Source URL)', () => {
    const p = parseOutputParams(new URLSearchParams({ kind: 'image', src: '/m/a.png', fit: 'cover', caption: 'Worship' }));
    expect(p.kind).toBe('image');
    expect(p.fit).toBe('cover');
    expect(p.caption).toBe('Worship');
  });
  it('end-to-end: an image cue maps to a full-bleed image payload', () => {
    const cues = buildCues([imageItem({ src: '/media/sermon.jpg', caption: 'Grace' })]);
    expect(cues[0].itemKind).toBe('image');
    const program = cueToProgram(cues[0]);
    expect(program.kind).toBe('image');
    expect(program.src).toBe('/media/sermon.jpg');
  });
  it('the master-program adapter maps an image row', () => {
    const set = masterProgramToSetList([{ type: 'image', src: '/m/bg.jpg', caption: 'Call to worship' }]);
    expect(set[0].kind).toBe('image');
    expect(set[0].src).toBe('/m/bg.jpg');
  });
});
