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
  LED_OUTPUT, CABLING_PLANES, WALL_PLACEMENT, WALL_FEED_ARCHITECTURE, NOVASTAR_IO,
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
  it('carries the 2026-07-08 scan facts: LAN IP + advertises _blackmagic._tcp, NOT NDI', () => {
    expect(ATEM.scan.ipAddress).toBe('192.168.0.60');
    expect(ATEM.scan.mdns).toBe('_blackmagic._tcp');
    expect(ATEM.scan.nativeNdi).toBe(false);
    expect(ATEM.scan.confirmed).toBe('2026-07-08');
    expect(ATEM.scan.note).toMatch(/NO native NDI/i);
  });
});

describe('the VX1000 switches at SOURCE level, NOT production level (precise)', () => {
  it('does source-level switching but is NOT a production switcher', () => {
    expect(WALL_PROCESSOR.doesSourceSwitching).toBe(true);
    expect(WALL_PROCESSOR.isProductionSwitcher).toBe(false);
  });
  it('documents source-select, backup/failover, signal types, and layers/PIP', () => {
    expect(WALL_PROCESSOR.switching.sourceSelection).toMatch(/whole input/i);
    expect(WALL_PROCESSOR.switching.backupFailover).toMatch(/backup/i);
    expect(WALL_PROCESSOR.switching.signalTypes).toMatch(/HDMI.*SDI.*DVI.*DP/);
    expect(WALL_PROCESSOR.switching.layersPip).toMatch(/PIP|overlay|layer/i);
  });
  it('does NOT do multi-camera production switching (that is the ATEM)', () => {
    expect(WALL_PROCESSOR.switching.doesNot).toMatch(/production switching/i);
    expect(WALL_PROCESSOR.switching.doesNot).toMatch(/ATEM/);
  });
});

describe('LED OUTPUT — the 10 Ethernet ports are NOT network', () => {
  it('10 ports x 650k px = 6.5M cap; ports are not network', () => {
    expect(LED_OUTPUT.ports).toBe(10);
    expect(LED_OUTPUT.pxPerPort).toBe(650000);
    expect(LED_OUTPUT.totalPxCap).toBe(6500000);
    expect(LED_OUTPUT.isNetwork).toBe(false);
  });
  it('describes scale -> slice canvas -> region per port -> receiving card', () => {
    const flow = LED_OUTPUT.flow.join(' ');
    expect(flow).toMatch(/canvas/i);
    expect(flow).toMatch(/slice/i);
    expect(flow).toMatch(/receiving card/i);
  });
  it('load-balances under 650k/port and maps in NovaLCT', () => {
    expect(LED_OUTPUT.loadBalance).toMatch(/650,000|650k/);
    expect(LED_OUTPUT.mapping).toMatch(/NovaLCT/);
  });
});

describe('CABLING PLANES — LED data must never cross a switch', () => {
  it('states the no-switch rule for the LED output ports', () => {
    expect(CABLING_PLANES.noSwitchRule).toMatch(/CANNOT pass through a network switch/i);
    expect(CABLING_PLANES.noSwitchRule).toMatch(/POINT-TO-POINT/);
  });
  it('separates the network job (switches OK) from the LED-data job (direct only)', () => {
    const net = CABLING_PLANES.jobs.find((j) => /NETWORK/.test(j.name));
    const led = CABLING_PLANES.jobs.find((j) => /LED DATA/.test(j.name));
    expect(net.throughSwitch).toBe(true);
    expect(led.throughSwitch).toBe(false);
    expect(led.note).toMatch(/shielded Cat6|fiber/i);
  });
});

describe('WALL PLACEMENT — NovaStar at wall, tower in control room', () => {
  it('separates the data plane (direct LED) from the control plane (LAN)', () => {
    expect(WALL_PLACEMENT.dataPlane).toMatch(/DIRECT/i);
    expect(WALL_PLACEMENT.controlPlane).toMatch(/LAN/);
  });
  it('recommends the NDI decoder (option A) for video transport', () => {
    expect(WALL_PLACEMENT.videoTransport.recommended).toBe('A');
    expect(WALL_PLACEMENT.videoTransport.optionA.name).toMatch(/NDI decoder/i);
    expect(WALL_PLACEMENT.videoTransport.optionB.name).toMatch(/HDBaseT/i);
  });
  it('publish-once NDI keeps wall + livestream in sync from one source', () => {
    expect(WALL_PLACEMENT.publishOnceNdi).toMatch(/one source, two destinations|One source/i);
    expect(WALL_PLACEMENT.publishOnceNdi).toMatch(/livestream/i);
  });
});

describe('WALL FEED — single wall program, switched upstream (recommended)', () => {
  it('recommends ONE feed switched upstream, not switching on the VX1000', () => {
    expect(WALL_FEED_ARCHITECTURE.recommended.name).toMatch(/SINGLE/);
    expect(WALL_FEED_ARCHITECTURE.recommended.how).toMatch(/ONE feed|ONE decoder/);
    expect(WALL_FEED_ARCHITECTURE.alternative.recommended).toBe(false);
  });
  it('lists all wall content modes incl. scripture-text-over-background', () => {
    const modes = WALL_FEED_ARCHITECTURE.contentModes.join(' ');
    expect(modes).toMatch(/IMAG/);
    expect(modes).toMatch(/Scripture|sermon-point/i);
    expect(modes).toMatch(/lyrics/i);
  });
  it('the buy-list is ONE decoder', () => {
    expect(WALL_FEED_ARCHITECTURE.buyList).toMatch(/ONE NDI decoder/i);
  });
});

describe('NOVASTAR_IO — input side vs output side, no monitor needed', () => {
  it('output side plugs into the wall; input side takes a video signal', () => {
    expect(NOVASTAR_IO.outputSide).toMatch(/plug into the wall|OUTPUT side/i);
    expect(NOVASTAR_IO.inputSide).toMatch(/HDMI\/SDI|video signal/i);
  });
  it('no monitor required at the wall (the LED wall is the display)', () => {
    expect(NOVASTAR_IO.monitorNote).toMatch(/NO monitor/i);
    expect(NOVASTAR_IO.monitorNote).toMatch(/OPTIONAL/);
  });
  it('full control over the LAN from the control room', () => {
    expect(NOVASTAR_IO.controlNote).toMatch(/control room over the LAN/i);
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
