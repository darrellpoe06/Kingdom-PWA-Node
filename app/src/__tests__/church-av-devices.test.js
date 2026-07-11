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
  MIDDLE_SCREEN_TOPOLOGY, WALL_LAPTOP_ENDPOINT, WALL_FEED_OPTIONS,
  NDI_DISCOVERY_FIX, OBS_REMOTE_CONTROL, LED_WALL_OVER_NETWORK,
  AV_GUARDRAILS, NDI_GOTCHAS, avIndependenceReadiness, ariAvCapabilities,
} from '../lib/church-av-devices.js';
import { SEED_DEVICES } from '../lib/church-devices.js';

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

// =============================================================================
// DR-0166 — the middle screen is independent of the side screens; no fake-green.
// =============================================================================
describe('MIDDLE_SCREEN_TOPOLOGY — three screens, three jobs (verified 2026-07-10)', () => {
  it('names the middle=LED wall (NDI Studio Monitor -> VX1000), sides=Proclaim, broadcast=OBS', () => {
    expect(MIDDLE_SCREEN_TOPOLOGY.verifiedOn).toBe('2026-07-10');
    const mid = MIDDLE_SCREEN_TOPOLOGY.screens.find((s) => s.screen === 'middle');
    const sides = MIDDLE_SCREEN_TOPOLOGY.screens.find((s) => s.screen === 'sides');
    const bc = MIDDLE_SCREEN_TOPOLOGY.screens.find((s) => s.screen === 'broadcast');
    expect(mid.fedBy).toMatch(/NDI Studio Monitor.*VX1000/);
    expect(sides.fedBy).toMatch(/Proclaim/);
    expect(bc.fedBy).toMatch(/OBS.*RIGHT CUDA/i);
  });
  it('the wall laptop is a dumb endpoint that auto-starts NDI Studio Monitor', () => {
    expect(WALL_LAPTOP_ENDPOINT.autoStart).toMatch(/Run at Windows Start/i);
    expect(WALL_LAPTOP_ENDPOINT.setOnce).toMatch(/never switches|once/i);
  });
});

describe('WALL_FEED_OPTIONS — what each setting produces + independence', () => {
  it('has exactly ONE recommended option and it is the WALL OBS words-only path', () => {
    const rec = WALL_FEED_OPTIONS.filter((o) => o.recommended);
    expect(rec).toHaveLength(1);
    expect(rec[0].key).toBe('wall-obs');
    expect(rec[0].produces).toMatch(/WORDS ONLY/i);
    expect(rec[0].launchFlags).toMatch(/--portable --multi --websocket_port 4466/);
  });
  it('ONLY the recommended option is independent of BOTH sides and broadcast', () => {
    for (const o of WALL_FEED_OPTIONS) {
      const both = o.independentOfSides && o.independentOfBroadcast;
      if (o.recommended) expect(both, o.key).toBe(true);
    }
    // obs-mirror is tied to broadcast; proclaim-mirror is tied to sides
    expect(WALL_FEED_OPTIONS.find((o) => o.key === 'obs-mirror').independentOfBroadcast).toBe(false);
    expect(WALL_FEED_OPTIONS.find((o) => o.key === 'proclaim-mirror').independentOfSides).toBe(false);
  });
  it('every option carries opportunities AND constraints', () => {
    for (const o of WALL_FEED_OPTIONS) {
      expect(o.opportunities.length, `${o.key} opportunities`).toBeGreaterThan(0);
      expect(o.constraints.length, `${o.key} constraints`).toBeGreaterThan(0);
    }
  });
  it('the recommended WALL OBS is built:false (honest — not yet built)', () => {
    expect(WALL_FEED_OPTIONS.find((o) => o.key === 'wall-obs').built).toBe(false);
  });
});

describe('today\'s AV fixes (2026-07-10) — grounded facts', () => {
  it('NDI discovery fix pins the wired adapter, clears discovery, and requires a full restart', () => {
    const joinedCauses = NDI_DISCOVERY_FIX.rootCauses.join(' ');
    expect(joinedCauses).toMatch(/DUAL-HOMED/i);
    expect(joinedCauses).toMatch(/Discovery Server/i);
    const joinedFix = NDI_DISCOVERY_FIX.fix.join(' ');
    expect(joinedFix).toMatch(/adapters.*allowed.*192\.168\.1\.73/);
    expect(joinedFix).toMatch(/discovery.*""/);
    expect(joinedFix).toMatch(/FULL OBS restart/i);
    expect(NDI_DISCOVERY_FIX.fixFileNote).toMatch(/JUNCTION/i);
    expect(NDI_DISCOVERY_FIX.openRootCause).toMatch(/re-review: 2026-07-24/);
  });
  it('OBS remote control is obs-websocket v5 on 4455 with an auth re-enable resting state', () => {
    expect(OBS_REMOTE_CONTROL.port).toBe(4455);
    expect(OBS_REMOTE_CONTROL.restingState).toMatch(/re-enable auth/i);
    expect(OBS_REMOTE_CONTROL.restingState).toMatch(/never/i);
  });
  it('LED wall over the network needs one HDMI hop and forbids the OBS feedback loop', () => {
    expect(LED_WALL_OVER_NETWORK.vx1000NoNetworkVideo).toMatch(/NO network video input/i);
    expect(LED_WALL_OVER_NETWORK.feedbackLoopWarning).toMatch(/NEVER feed OBS.*own NDI output back/i);
  });
});

describe('AV_GUARDRAILS + NDI_GOTCHAS — the durable Ways', () => {
  it('the guardrails hold the live cut, preview-then-execute, and forbid the feedback loop', () => {
    const keys = AV_GUARDRAILS.map((g) => g.key);
    expect(keys).toContain('humans-keep-the-cut');
    expect(keys).toContain('preview-then-execute');
    expect(keys).toContain('kill-switch');
    expect(keys).toContain('no-ndi-feedback-loop');
  });
  it('the NDI gotchas name the multi-homed NIC and the discovery-server mDNS suppression', () => {
    const keys = NDI_GOTCHAS.map((g) => g.key);
    expect(keys).toContain('multi-homed-nic');
    expect(keys).toContain('discovery-server-suppresses-mdns');
  });
});

describe('avIndependenceReadiness — DERIVED status, never a painted pass', () => {
  it('the recommended WALL OBS is not-built over the REAL register (never green)', () => {
    const readiness = avIndependenceReadiness(SEED_DEVICES);
    const wall = readiness.find((r) => r.key === 'wall-obs');
    expect(wall.status).toBe('not-built');
    expect(wall.recommended).toBe(true);
    expect(wall.independentOfBoth).toBe(true);
    // its node exists (left CUDA) so it is FEASIBLE, just not built
    expect(wall.feasible).toBe(true);
  });
  it('an option with an offline source reads unverified, not available', () => {
    // drop every device offline -> the endpoint is not ready -> nothing is available
    const offline = SEED_DEVICES.map((d) => ({ ...d, status: 'offline' }));
    for (const r of avIndependenceReadiness(offline)) {
      expect(r.status === 'not-built' || r.status === 'unverified', r.key).toBe(true);
      expect(r.status).not.toBe('available');
    }
  });
  it('obs-mirror is available when the broadcast box + wall laptop are online', () => {
    const obs = avIndependenceReadiness(SEED_DEVICES).find((r) => r.key === 'obs-mirror');
    // right CUDA (dev-gpu-node-2) and the wall laptop (dev-av-booth-laptop) are online in the seed
    expect(obs.status).toBe('available');
    expect(obs.independentOfBroadcast).toBe(false);
  });
  it('degrades honestly on empty/garbage input', () => {
    expect(avIndependenceReadiness(null).every((r) => r.status !== 'available')).toBe(true);
    expect(avIndependenceReadiness([]).length).toBe(WALL_FEED_OPTIONS.length);
  });
});

describe('ariAvCapabilities — honest derived states', () => {
  it('OBS scene control is enabled-guarded; the WALL program is not-built', () => {
    const caps = ariAvCapabilities(SEED_DEVICES);
    const obs = caps.find((c) => c.key === 'obs-scenes');
    const wall = caps.find((c) => c.key === 'wall-program');
    expect(obs.state).toBe('enabled-guarded');
    expect(obs.guardrail).toMatch(/live cut/i);
    expect(wall.state).toBe('not-built');
  });
  it('device-inventory read is unverified only when there are no rows', () => {
    expect(ariAvCapabilities([]).find((c) => c.key === 'device-inventory').state).toBe('unverified');
    expect(ariAvCapabilities(SEED_DEVICES).find((c) => c.key === 'device-inventory').state).toBe('enabled-guarded');
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
