// LED-wall go-live (2026-07-05) — proven-to-catch. Guards the first-live-service
// record: the observed booth layout, the Blackmagic switcher-software resolution
// (right vs wrong packages), and the lower-thirds OPEN item with its two gating
// questions. Paint over the honest state (claim lower-thirds "done", drop the
// open questions, mislabel the software) and a case fails (DR-0076).
import { describe, it, expect } from 'vitest';
import {
  LIVE_SERVICE, BOOTH_AS_BUILT, SWITCHER_SOFTWARE, LOWER_THIRDS, BOOTH_RESIDENT,
} from '../lib/led-wall-golive.js';

describe('LIVE_SERVICE — first full live service on the wall', () => {
  it('is dated 2026-07-05 and cites on-site observation', () => {
    expect(LIVE_SERVICE.observedOn).toBe('2026-07-05');
    expect(LIVE_SERVICE.source).toMatch(/on-site|observation|photos/i);
  });
  it('records the milestone: wall IMAG + side screens + dual stream', () => {
    expect(LIVE_SERVICE.milestone).toMatch(/IMAG/);
    const c = LIVE_SERVICE.confirmed.join(' ');
    expect(c).toMatch(/YouTube/);
    expect(c).toMatch(/Facebook/);
    expect(c).toMatch(/Proclaim/);
  });
});

describe('BOOTH_AS_BUILT — the observed device layout', () => {
  it('every device has id, role, detail and a confirm flag', () => {
    for (const d of BOOTH_AS_BUILT.devices) {
      expect(d.id).toBeTruthy();
      expect(d.device).toBeTruthy();
      expect(d.role).toBeTruthy();
      expect(d.detail).toBeTruthy();
      expect(typeof d.confirm).toBe('boolean');
    }
  });
  it('carries the core booth gear (switcher, Proclaim, PTZ, both towers, ATEM, audio)', () => {
    const ids = BOOTH_AS_BUILT.devices.map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['switcher-sw', 'proclaim', 'ptz', 'cuda-4070', 'legion', 'atem-hw', 'audio']));
  });
  it('flags that devices were MOVED to support the wall (the open "what moved" item)', () => {
    expect(BOOTH_AS_BUILT.note).toMatch(/moved/i);
  });
});

describe('SWITCHER_SOFTWARE — right vs wrong Blackmagic packages', () => {
  it('names the need (ATEM Software Control) and what got installed (8.1.1)', () => {
    expect(SWITCHER_SOFTWARE.need).toMatch(/ATEM Software Control/);
    expect(SWITCHER_SOFTWARE.installed).toMatch(/8\.1\.1/);
  });
  it('records BOTH wrong packages that were grabbed first (Camera + SDK)', () => {
    const names = SWITCHER_SOFTWARE.wrongPackages.map((w) => w.name).join(' ');
    expect(names).toMatch(/Camera/);
    expect(names).toMatch(/SDK/);
  });
  it('keeps the reusable three-second rule (Camera/SDK/too-small = wrong)', () => {
    expect(SWITCHER_SOFTWARE.threeSecondRule).toMatch(/SDK/);
    expect(SWITCHER_SOFTWARE.threeSecondRule).toMatch(/Camera/);
    expect(SWITCHER_SOFTWARE.threeSecondRule).toMatch(/Production Studio Switchers Manual/);
  });
  it('explains why the older 8.1.1 is a correct match for the legacy Production Studio 4K', () => {
    expect(SWITCHER_SOFTWARE.versionNote).toMatch(/legacy/i);
    expect(SWITCHER_SOFTWARE.versionNote).toMatch(/10\.2\.1/);
  });
  it('is official-download-only (no third-party mirror)', () => {
    expect(SWITCHER_SOFTWARE.officialOnly).toMatch(/blackmagicdesign\.com/);
    expect(SWITCHER_SOFTWARE.officialOnly).toMatch(/third-party|never/i);
  });
});

describe('LOWER_THIRDS — the OPEN item, honestly held', () => {
  it('is marked OPEN / deferred, never "done"', () => {
    expect(LOWER_THIRDS.status).toMatch(/open/i);
    expect(LOWER_THIRDS.status).not.toMatch(/done|complete|shipped/i);
  });
  it('states the principle: keyed overlay on PROGRAM, NOT the wall', () => {
    expect(LOWER_THIRDS.principle).toMatch(/keyed overlay/i);
    expect(LOWER_THIRDS.principle).toMatch(/NOT go on the LED wall|does NOT go/i);
  });
  it('keeps the TWO gating questions (what switches Program, what moved where)', () => {
    expect(LOWER_THIRDS.openQuestions).toHaveLength(2);
    const q = LOWER_THIRDS.openQuestions.join(' ');
    expect(q).toMatch(/Program cut/i);
    expect(q).toMatch(/moved/i);
    expect(q).toMatch(/OBS \+ DistroAV|DistroAV/);
  });
  it('offers all three paths incl. the sovereign PoeTech route', () => {
    const names = LOWER_THIRDS.paths.map((p) => p.name).join(' ');
    expect(names).toMatch(/software switcher/i);
    expect(names).toMatch(/ATEM/);
    expect(names).toMatch(/PoeTech|sovereign/i);
    const poe = LOWER_THIRDS.paths.find((p) => /PoeTech|sovereign/i.test(p.name));
    expect(poe.how).toMatch(/kind=lower-third/);
    expect(poe.how).toMatch(/POETECH \(Lower-Third\)/);
  });
});

describe('BOOTH_RESIDENT — Claude on the booth box, with the guardrail', () => {
  it('records the native install + the no-autonomous-load-on-live-switcher guardrail', () => {
    expect(BOOTH_RESIDENT.installed).toMatch(/install\.ps1/);
    expect(BOOTH_RESIDENT.guardrail).toMatch(/DR-0012|three-brakes/);
    expect(BOOTH_RESIDENT.guardrail).toMatch(/no autonomous/i);
  });
});
