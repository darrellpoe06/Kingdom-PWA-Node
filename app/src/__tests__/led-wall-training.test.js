// LED-wall training — proven-to-catch. Guards the verified on-site sequence, the
// canonical panel spec, the 8-port column connection map, the final config + the
// REAL apply procedure, tomorrow's activation, and the embed-ready media slots.
import { describe, it, expect } from 'vitest';
import {
  mediaUrl, MEDIA_BASE_KEY,
  NOVALCT_SETUP_STEPS, PANEL_SPEC, SCREEN_CONNECTION_MAP, FINAL_CONFIG,
  TOMORROW_ACTIVATION, INSTALL_GALLERY,
} from '../lib/led-wall-training.js';

describe('mediaUrl — embed-ready slot resolver', () => {
  it('returns null with no base or no photo (renders the labeled slot)', () => {
    expect(mediaUrl('x.jpg', '')).toBeNull();
    expect(mediaUrl(null, 'https://host/')).toBeNull();
  });
  it('joins base + filename once the base is set', () => {
    expect(mediaUrl('a.jpg', 'https://h/m')).toBe('https://h/m/a.jpg');
    expect(mediaUrl('a.jpg', 'https://h/m/')).toBe('https://h/m/a.jpg');
  });
  it('the media base key exists for the later serving wire-up', () => {
    expect(MEDIA_BASE_KEY).toMatch(/church-media/);
  });
});

describe('NOVALCT_SETUP_STEPS — the verified 9-step sequence', () => {
  it('is 9 ordered steps, each with action + a screenshot slot', () => {
    expect(NOVALCT_SETUP_STEPS).toHaveLength(9);
    NOVALCT_SETUP_STEPS.forEach((s, i) => {
      expect(s.n).toBe(i + 1);
      expect(s.action).toBeTruthy();
      expect(s.slot).toMatch(/screenshot|photo/i);
    });
  });
  it('step 1 flags the SOFTWARE-category common miss', () => {
    expect(NOVALCT_SETUP_STEPS[0].action).toMatch(/SOFTWARE category/);
    expect(NOVALCT_SETUP_STEPS[0].action).toMatch(/NOT Processors/i);
  });
  it('step 2 requires the CP210x driver', () => {
    expect(NOVALCT_SETUP_STEPS[1].action).toMatch(/CP210x/);
  });
  it('step 7 says READBACK, not blind-Send/Smart-Set', () => {
    const s7 = NOVALCT_SETUP_STEPS[6];
    expect(s7.action).toMatch(/READBACK/i);
    expect(s7.action).toMatch(/do NOT blind-Send|Smart-Set/i);
    expect(s7.detail).toMatch(/1\/8 scan|74HC138/);
  });
});

describe('PANEL_SPEC — canonical, confirmed on-site', () => {
  it('records the LED Nation/Miracle P1.99 MRV412-N panel + 320x240 cabinet', () => {
    expect(PANEL_SPEC.vendor).toMatch(/LED Nation|Miracle/i);
    expect(PANEL_SPEC.panelModel).toBe('MRV412-N');
    expect(PANEL_SPEC.cabinetPx).toMatch(/320 x 240/);
    expect(PANEL_SPEC.nativePx).toMatch(/2560 x 1440/);
    expect(PANEL_SPEC.receivingCardSize).toMatch(/320.*240/);
    expect(PANEL_SPEC.perPortLoad).toMatch(/461k|460,800/);
  });
});

describe('SCREEN_CONNECTION_MAP — 8-port column map + the select-port-first mechanic', () => {
  it('has 8 ports, Port 1 leftmost -> Port 8 rightmost', () => {
    expect(SCREEN_CONNECTION_MAP.ports).toHaveLength(8);
    expect(SCREEN_CONNECTION_MAP.ports[0].column).toMatch(/leftmost/i);
    expect(SCREEN_CONNECTION_MAP.ports[7].column).toMatch(/rightmost/i);
  });
  it('teaches select-port-first, top-to-bottom, no crossing', () => {
    expect(SCREEN_CONNECTION_MAP.mechanic).toMatch(/SELECT the Ethernet port FIRST/i);
    expect(SCREEN_CONNECTION_MAP.rule).toMatch(/NO crossing|independent vertical/i);
  });
  it('flags the default 128x128 to confirm + Save/NAS/Send-to-HW', () => {
    expect(SCREEN_CONNECTION_MAP.receivingCardSizeNote).toMatch(/128 x 128/);
    expect(SCREEN_CONNECTION_MAP.save).toMatch(/NAS/);
    expect(SCREEN_CONNECTION_MAP.save).toMatch(/Send to HW/i);
  });
});

describe('FINAL_CONFIG — verified complete + the REAL apply procedure', () => {
  it('is marked complete with all 48 at 320x240', () => {
    expect(FINAL_CONFIG.status).toMatch(/COMPLETE/);
    expect(FINAL_CONFIG.status).toMatch(/320 x 240/);
  });
  it('documents that there is NO Apply-to-Entire-Screen button (per-column x8)', () => {
    expect(FINAL_CONFIG.realProcedure).toMatch(/NO "Apply to Entire Screen"/i);
    expect(FINAL_CONFIG.realProcedure).toMatch(/Apply to Entire Column/);
    expect(FINAL_CONFIG.realProcedure).toMatch(/all 8 columns/i);
  });
});

describe('TOMORROW_ACTIVATION — the remaining push-to-HW step', () => {
  it('names the symptom + cause + the Send-to-HW activation steps', () => {
    expect(TOMORROW_ACTIVATION.symptom).toMatch(/SEPARATE CABINETS/i);
    expect(TOMORROW_ACTIVATION.cause).toMatch(/not been pushed to the hardware/i);
    const steps = TOMORROW_ACTIVATION.steps.join(' ');
    expect(steps).toMatch(/Quantity of Screens = 1/);
    expect(steps).toMatch(/Send to HW/i);
    expect(steps).toMatch(/2560 x 1440/);
  });
});

describe('INSTALL_GALLERY — labeled photo slots (embed-ready)', () => {
  it('has subject-labeled slots, all currently unpopulated (labeled fallback)', () => {
    expect(INSTALL_GALLERY.length).toBeGreaterThanOrEqual(10);
    for (const g of INSTALL_GALLERY) {
      expect(g.id).toBeTruthy();
      expect(g.label).toBeTruthy();
      expect(g.photo).toBeNull(); // pending serving; slots render until attached
    }
  });
});
