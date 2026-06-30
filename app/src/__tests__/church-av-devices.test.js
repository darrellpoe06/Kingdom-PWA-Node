// Church AV device inventory + signal chain — proven-to-catch. These guard the
// two load-bearing corrections Darrell confirmed on site:
//   (1) the VX1000 is NOT the switcher — the ATEM is; the chain runs camera ->
//       ATEM -> program out -> VX1000 -> wall;
//   (2) the ATEM switches ANY source (frame sync per input); only remote camera
//       CONTROL + tally is Blackmagic-specific.
// Paint over either and a case here fails.
import { describe, it, expect } from 'vitest';
import {
  ATEM, WALL_PROCESSOR, CAMERA_CONNECTIONS, SOURCE_BRIDGES, SIGNAL_CHAIN,
  AV_DEVICES, cameraIntegration,
} from '../lib/church-av-devices.js';

describe('ATEM Production Studio 4K — the switcher facts', () => {
  it('has 20 SDI + 1 HDMI inputs', () => {
    expect(ATEM.inputs.sdi).toBe(20);
    expect(ATEM.inputs.hdmi).toBe(1);
  });
  it('has a frame synchronizer on every input (switches ANY source)', () => {
    expect(ATEM.frameSyncPerInput).toBe(true);
    expect(ATEM.switchesAnySource).toMatch(/any source/i);
    expect(ATEM.switchesAnySource).toMatch(/FALSE for switching/);
  });
  it('flags camera CONTROL + tally as Blackmagic-specific', () => {
    expect(ATEM.cameraControl).toMatch(/Blackmagic-specific/);
    expect(ATEM.cameraControl).toMatch(/tally/);
  });
});

describe('the VX1000 is the wall PROCESSOR, not the switcher', () => {
  it('is explicitly not a switcher and receives one finished program', () => {
    expect(WALL_PROCESSOR.isSwitcher).toBe(false);
    expect(WALL_PROCESSOR.receives).toMatch(/ONE finished program|ATEM program/i);
  });
});

describe('SIGNAL_CHAIN — camera -> ATEM -> program -> VX1000 -> wall', () => {
  it('puts the ATEM (switch) BEFORE the VX1000 (process)', () => {
    const joined = SIGNAL_CHAIN.hops.join(' ');
    const atemIdx = joined.indexOf('ATEM');
    const vxIdx = joined.indexOf('VX1000');
    expect(atemIdx).toBeGreaterThanOrEqual(0);
    expect(vxIdx).toBeGreaterThan(atemIdx); // ATEM mentioned before VX1000 drives the wall
  });
  it('the camera-control note says switching needs no BMD but control does', () => {
    expect(SIGNAL_CHAIN.cameraControlNote).toMatch(/no Blackmagic camera/i);
    expect(SIGNAL_CHAIN.cameraControlNote).toMatch(/iris\/focus\/color/);
  });
});

describe('cameraIntegration — switches vs needs-BMD-for-control', () => {
  it('a non-BMD SDI camera SWITCHES but needs BMD for control', () => {
    const r = cameraIntegration('sdi-other');
    expect(r.switches).toBe(true);
    expect(r.hasRemoteControl).toBe(false);
    expect(r.needsBmdForControl).toBe(true);
  });
  it('a Blackmagic SDI camera has full switch + control + tally', () => {
    const r = cameraIntegration('sdi-bmd');
    expect(r.switches).toBe(true);
    expect(r.hasRemoteControl).toBe(true);
    expect(r.needsBmdForControl).toBe(false);
  });
  it('an HDMI camera switches + gets control via the bidirectional converter', () => {
    const r = cameraIntegration('hdmi');
    expect(r.switches).toBe(true);
    expect(r.controlViaConverter).toBe(true);
    expect(r.needsBmdForControl).toBe(false); // the converter carries control back
    expect(r.via).toMatch(/converter/i);
  });
  it('every connection type switches (the ATEM takes them all)', () => {
    for (const key of Object.keys(CAMERA_CONNECTIONS)) {
      expect(cameraIntegration(key).switches, key).toBe(true);
    }
  });
  it('returns null for an unknown connection (guards bad input)', () => {
    expect(cameraIntegration('nope')).toBeNull();
  });
});

describe('source bridges + device inventory', () => {
  it('lists the HDMI->SDI converter that carries control back', () => {
    const conv = SOURCE_BRIDGES.find((b) => /SDI\/HDMI micro converter/i.test(b.device));
    expect(conv).toBeTruthy();
    expect(conv.carriesControl).toBe(true);
  });
  it('lists OBS-on-a-tower as a software-switcher bridge', () => {
    const obs = SOURCE_BRIDGES.find((b) => /OBS/i.test(b.device));
    expect(obs).toBeTruthy();
    expect(obs.forSource).toMatch(/USB|NDI|capture/i);
  });
  it('the device inventory carries the ATEM as a switcher with its spec line', () => {
    const atem = AV_DEVICES.find((d) => d.category === 'switcher');
    expect(atem.model).toBe('ATEM Production Studio 4K');
    expect(atem.specLine).toMatch(/20x 6G-SDI \+ 1x HDMI/);
    expect(atem.controlNote).toMatch(/Blackmagic/);
  });
});
