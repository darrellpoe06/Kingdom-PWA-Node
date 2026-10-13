// LED-wall go-live (2026-07-05) — proven-to-catch. Guards the CORRECTED ground
// truth: the wall was FROZEN on a holding graphic (not live IMAG), the online
// broadcast was live, the booth CUDA roles (Proclaim left / broadcast right), the
// Blackmagic software status (moved to the right tower, then stopped working), and
// the lower-thirds OPEN item. Re-introduce the "wall showed live IMAG" over-claim
// and a case fails (DR-0076: correct the record to reality, never paint it).
import { describe, it, expect } from 'vitest';
import {
  LIVE_SERVICE, BOOTH_AS_BUILT, SWITCHER_SOFTWARE, LOWER_THIRDS, BOOTH_RESIDENT,
} from '../lib/led-wall-golive.js';

describe('LIVE_SERVICE — corrected ground truth (wall frozen, stream live)', () => {
  it('is dated 2026-07-05 and cites Darrell\'s on-site correction as the source', () => {
    expect(LIVE_SERVICE.observedOn).toBe('2026-07-05');
    expect(LIVE_SERVICE.source).toMatch(/ground truth|corrected/i);
  });
  it('the milestone says the WALL was FROZEN (not driven live), stream was online', () => {
    expect(LIVE_SERVICE.milestone).toMatch(/FROZEN/);
    expect(LIVE_SERVICE.milestone).toMatch(/NOT driven live/i);
    expect(LIVE_SERVICE.milestone).toMatch(/YouTube/);
    expect(LIVE_SERVICE.milestone).toMatch(/Facebook/);
  });
  it('does NOT claim the wall showed live IMAG — IMAG was on the side screens', () => {
    const wallLine = LIVE_SERVICE.confirmed.find((c) => /LED wall/i.test(c));
    expect(wallLine).toMatch(/FROZEN|Freeze/);
    expect(wallLine).not.toMatch(/live IMAG/i);
    const imagLine = LIVE_SERVICE.confirmed.find((c) => /IMAG/.test(c));
    expect(imagLine).toMatch(/side/i);
  });
  it('keeps the correction visible as the record', () => {
    expect(LIVE_SERVICE.corrected).toMatch(/frozen|holding graphic/i);
  });
});

describe('BOOTH_AS_BUILT — corrected CUDA roles (Proclaim left / broadcast right)', () => {
  it('every device has id, role, detail and a confirm flag', () => {
    for (const d of BOOTH_AS_BUILT.devices) {
      expect(d.id).toBeTruthy();
      expect(d.device).toBeTruthy();
      expect(d.role).toBeTruthy();
      expect(d.detail).toBeTruthy();
      expect(typeof d.confirm).toBe('boolean');
    }
  });
  it('splits left CUDA (Proclaim) from right CUDA (online broadcast)', () => {
    const ids = BOOTH_AS_BUILT.devices.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['left-cuda', 'right-cuda', 'wall-feed', 'atem-hw', 'ptz', 'audio']));
    const left = BOOTH_AS_BUILT.devices.find((d) => d.id === 'left-cuda');
    const right = BOOTH_AS_BUILT.devices.find((d) => d.id === 'right-cuda');
    expect(left.detail).toMatch(/Proclaim/);
    expect(left.detail).toMatch(/NOT the local|NOT the LED wall|ONLINE BROADCAST ONLY/i);
    expect(right.detail).toMatch(/broadcast/i);
    expect(right.detail).toMatch(/STOPPED WORKING/);
  });
  it('the wall feed is a laptop -> NovaStar held on FREEZE, pending network control', () => {
    const w = BOOTH_AS_BUILT.devices.find((d) => d.id === 'wall-feed');
    expect(w.detail).toMatch(/FREEZE/);
    expect(w.detail).toMatch(/control room|network/i);
  });
});

describe('SWITCHER_SOFTWARE — right vs wrong packages + current status', () => {
  it('names the need + records the current DOWN state (moved to right tower, stopped)', () => {
    expect(SWITCHER_SOFTWARE.need).toMatch(/ATEM Software Control/);
    expect(SWITCHER_SOFTWARE.currentState).toMatch(/STOPPED WORKING|not functioning/i);
    expect(SWITCHER_SOFTWARE.currentState).toMatch(/right CUDA/i);
  });
  it('records BOTH wrong packages that were grabbed first (Camera + SDK)', () => {
    const names = SWITCHER_SOFTWARE.wrongPackages.map((w) => w.name).join(' ');
    expect(names).toMatch(/Camera/);
    expect(names).toMatch(/SDK/);
  });
  it('keeps the reusable three-second rule', () => {
    expect(SWITCHER_SOFTWARE.threeSecondRule).toMatch(/SDK/);
    expect(SWITCHER_SOFTWARE.threeSecondRule).toMatch(/Production Studio Switchers Manual/);
  });
  it('is official-download-only', () => {
    expect(SWITCHER_SOFTWARE.officialOnly).toMatch(/blackmagicdesign\.com/);
  });
});

describe('LOWER_THIRDS — OPEN, keyed on the online-broadcast path (right tower)', () => {
  it('is marked OPEN, never "done"', () => {
    expect(LOWER_THIRDS.status).toMatch(/open/i);
    expect(LOWER_THIRDS.status).not.toMatch(/done|complete|shipped/i);
  });
  it('states the principle: keyed overlay on PROGRAM, NOT the wall', () => {
    expect(LOWER_THIRDS.principle).toMatch(/keyed overlay/i);
    expect(LOWER_THIRDS.principle).toMatch(/does NOT|NOT go on the LED wall/i);
  });
  it('offers the sovereign PoeTech route with the real output params', () => {
    const poe = LOWER_THIRDS.paths.find((p) => /PoeTech|sovereign/i.test(p.name));
    expect(poe.how).toMatch(/kind=lower-third/);
    expect(poe.how).toMatch(/POETECH \(Lower-Third\)/);
  });
});

describe('BOOTH_RESIDENT — Claude on the booth box, with the guardrail', () => {
  it('records the native install + the no-autonomous-load guardrail', () => {
    expect(BOOTH_RESIDENT.installed).toMatch(/install\.ps1/);
    expect(BOOTH_RESIDENT.guardrail).toMatch(/DR-0012|three-brakes/);
    expect(BOOTH_RESIDENT.guardrail).toMatch(/no autonomous/i);
  });
});
