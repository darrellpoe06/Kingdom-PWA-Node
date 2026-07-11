// @vitest-environment node
//
// church-devices — the asset register pure core (Verification Doctrine, DR-0076).
// Proves the taxonomy, normalizer, validation, derivations, seed integrity, and
// the seed<->DB merge. The seed is the REAL known COLG infrastructure; these
// gates fail loudly if a capability vocabulary drifts or the LED-wall link breaks.
import { describe, it, expect } from 'vitest';
import {
  DEVICE_TYPES, DEVICE_TYPE_IDS, DEVICE_STATUS_IDS, CAPABILITY_TOKENS,
  GPU_JOB_CAPABILITIES, makeDevice, validateDevice, devicesByType,
  summarizeDevices, capabilityIndex, devicesForCapability, smeNeededDevices,
  mergeSeedAndRows, SEED_DEVICES, isGpuJobCapability,
} from '../lib/church-devices.js';

describe('taxonomy', () => {
  it('exposes a non-trivial type / status / capability vocabulary', () => {
    expect(DEVICE_TYPE_IDS).toContain('nas');
    expect(DEVICE_TYPE_IDS).toContain('gpu-node');
    expect(DEVICE_TYPE_IDS).toContain('led-wall');
    expect(DEVICE_STATUS_IDS).toContain('online');
    expect(CAPABILITY_TOKENS).toContain('llm-inference');
  });
  it('includes the switcher / printer / iot types the 2026-07-08 scan added', () => {
    expect(DEVICE_TYPE_IDS).toContain('switcher');
    expect(DEVICE_TYPE_IDS).toContain('printer');
    expect(DEVICE_TYPE_IDS).toContain('iot');
  });
  it('every type has a UiIcon name (never an emoji — consistency-guard)', () => {
    for (const t of DEVICE_TYPES) expect(typeof t.icon).toBe('string');
  });
  it('GPU job capabilities are the dispatchable subset', () => {
    expect(GPU_JOB_CAPABILITIES).toContain('voice-clone');
    expect(GPU_JOB_CAPABILITIES).toContain('transcription');
    expect(GPU_JOB_CAPABILITIES).toContain('llm-inference');
    expect(isGpuJobCapability('display')).toBe(false);
    expect(isGpuJobCapability('llm-inference')).toBe(true);
  });
});

describe('makeDevice — defensive normalizer', () => {
  it('falls back to other/planned on unknown type/status (never throws)', () => {
    const d = makeDevice({ name: 'X', deviceType: 'bogus', status: 'nope' });
    expect(d.deviceType).toBe('other');
    expect(d.status).toBe('planned');
  });
  it('drops unknown capability tokens', () => {
    const d = makeDevice({ name: 'X', capabilities: ['llm-inference', 'made-up'] });
    expect(d.capabilities).toEqual(['llm-inference']);
  });
  it('carries a provenance field (null when unset, trimmed string when set)', () => {
    expect(makeDevice({ name: 'X' }).provenance).toBeNull();
    expect(makeDevice({ name: 'X', provenance: '  scan-confirmed 2026-07-08 ' }).provenance)
      .toBe('scan-confirmed 2026-07-08');
  });
});

describe('validateDevice — proven-to-catch', () => {
  it('CATCHES a missing name (on raw, pre-normalized input)', () => {
    // validateDevice guards raw input; makeDevice would default the name, so a
    // realistic "bad row" is validated directly.
    expect(validateDevice({ name: '', deviceType: 'nas', status: 'online', capabilities: [] }).ok).toBe(false);
  });
  it('CATCHES an unknown capability', () => {
    const bad = { ...makeDevice({ name: 'X' }), capabilities: ['ghost'] };
    const r = validateDevice(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/ghost/);
  });
  it('PASSES a well-formed device', () => {
    expect(validateDevice(makeDevice({ name: 'NAS', deviceType: 'nas', capabilities: ['storage'] })).ok).toBe(true);
  });
});

describe('derivations', () => {
  const devices = [
    makeDevice({ id: 'a', name: 'A', deviceType: 'gpu-node', status: 'online', capabilities: ['llm-inference', 'transcription'] }),
    makeDevice({ id: 'b', name: 'B', deviceType: 'nas', status: 'online', capabilities: ['storage'], smeNeeded: true }),
    makeDevice({ id: 'c', name: 'C', deviceType: 'display', status: 'offline', capabilities: ['display'], active: false }),
  ];
  it('summarizeDevices ignores retired/inactive and counts compute nodes', () => {
    const s = summarizeDevices(devices);
    expect(s.total).toBe(2);            // c is inactive
    expect(s.online).toBe(2);
    expect(s.computeNodes).toBe(1);     // only A advertises a GPU job capability
    expect(s.smeNeeded).toBe(1);
  });
  it('capabilityIndex maps capability -> active devices', () => {
    const idx = capabilityIndex(devices);
    expect(idx['llm-inference'].map((d) => d.id)).toEqual(['a']);
    expect(idx['display']).toBeUndefined();   // c is inactive -> omitted
  });
  it('devicesForCapability excludes inactive devices', () => {
    expect(devicesForCapability(devices, 'display')).toHaveLength(0);
  });
  it('devicesByType buckets by type', () => {
    expect(devicesByType(devices)['gpu-node'].map((d) => d.id)).toEqual(['a']);
  });
  it('smeNeededDevices surfaces the unconfirmed ones', () => {
    expect(smeNeededDevices(devices).map((d) => d.id)).toEqual(['b']);
  });
});

describe('mergeSeedAndRows — DB wins on slug collision', () => {
  it('a confirmed DB row replaces its seed twin', () => {
    const seed = [makeDevice({ id: 'dev-x', name: 'Seed X', confirmed: false, smeNeeded: true })];
    const rows = [makeDevice({ id: 'dev-x', name: 'Confirmed X', confirmed: true, smeNeeded: false })];
    const merged = mergeSeedAndRows(seed, rows);
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe('Confirmed X');
    expect(merged[0].confirmed).toBe(true);
  });
  it('new DB rows append; seed-only devices survive', () => {
    const seed = [makeDevice({ id: 'dev-x', name: 'Seed X' })];
    const rows = [makeDevice({ id: 'dev-y', name: 'New Y' })];
    expect(mergeSeedAndRows(seed, rows).map((d) => d.id).sort()).toEqual(['dev-x', 'dev-y']);
  });
});

describe('SEED_DEVICES — the real COLG register (Reality-Trace)', () => {
  it('is non-empty and every device validates', () => {
    expect(SEED_DEVICES.length).toBeGreaterThan(5);
    for (const d of SEED_DEVICES) expect(validateDevice(d).ok, `${d.name}: ${validateDevice(d).errors.join('; ')}`).toBe(true);
  });
  it('records the named hardware: NAS, both GPU nodes, VX1000, LED wall', () => {
    const names = SEED_DEVICES.map((d) => d.name).join(' | ');
    expect(names).toMatch(/DS1621xs/);
    expect(names).toMatch(/VX1000/);
    expect(SEED_DEVICES.filter((d) => d.deviceType === 'gpu-node')).toHaveLength(2);
  });
  it('the LED wall links the sanctuary-video-wall capital project (no duplicate)', () => {
    const wall = SEED_DEVICES.find((d) => d.deviceType === 'led-wall');
    expect(wall.capitalProjectSlug).toBe('sanctuary-video-wall');
  });
  it('the GPU nodes can run the heavy jobs the router dispatches', () => {
    const gpu = SEED_DEVICES.filter((d) => d.deviceType === 'gpu-node');
    for (const g of gpu) {
      expect(g.capabilities.some(isGpuJobCapability)).toBe(true);
    }
  });
  it('unconfirmed specs are flagged sme_needed, not fabricated', () => {
    for (const d of SEED_DEVICES) {
      if (!d.confirmed) expect(d.smeNeeded).toBe(true);
    }
  });
});

describe('2026-07-08 church LAN scan — provenance + confirmed IP corrections', () => {
  const bySlug = (id) => SEED_DEVICES.find((d) => d.id === id);

  it('every seed device carries a non-empty provenance string (source/confidence)', () => {
    for (const d of SEED_DEVICES) {
      expect(typeof d.provenance, `${d.name} missing provenance`).toBe('string');
      expect(d.provenance.length, `${d.name} empty provenance`).toBeGreaterThan(0);
    }
  });

  it('provenance is only ever scan-confirmed 2026-07-08 or needs-eyes-on for the scan rows', () => {
    // Every device whose provenance mentions the scan must use the exact tokens —
    // no ad-hoc "scan-ish 2026" drift (Verification Doctrine, DR-0076).
    for (const d of SEED_DEVICES) {
      if (/scan/i.test(d.provenance)) {
        expect(/scan-confirmed 2026-07-08|needs-eyes-on/.test(d.provenance), `${d.name}: ${d.provenance}`).toBe(true);
      }
    }
  });

  it('the three PTZOptics cameras carry the CORRECTED scan IPs (.123/.126/.127, not ~.125/.126)', () => {
    expect(bySlug('dev-ptz-center-1').ipAddress).toBe('192.168.1.123');
    expect(bySlug('dev-ptz-right-3').ipAddress).toBe('192.168.1.126');
    expect(bySlug('dev-ptz-left-2').ipAddress).toBe('192.168.1.127');
    for (const id of ['dev-ptz-center-1', 'dev-ptz-right-3', 'dev-ptz-left-2']) {
      const cam = bySlug(id);
      expect(cam.deviceType).toBe('camera');
      expect(cam.provenance).toBe('scan-confirmed 2026-07-08');
      expect(cam.confirmed).toBe(true);
    }
  });

  it('the ATEM switcher is an inventory row at 192.168.0.60 (no native NDI)', () => {
    const atem = bySlug('dev-atem-production-studio-4k');
    expect(atem.deviceType).toBe('switcher');
    expect(atem.ipAddress).toBe('192.168.0.60');
    expect(atem.provenance).toBe('scan-confirmed 2026-07-08');
    expect(JSON.stringify(atem.specs)).toMatch(/_blackmagic\._tcp/);
    expect(JSON.stringify(atem.specs)).toMatch(/NO native NDI/i);
  });

  it('the RackStation is LIVE on the church LAN at 192.168.0.100 (not offline)', () => {
    const rs = bySlug('dev-synology-rackstation');
    expect(rs.deviceType).toBe('nas');
    expect(rs.ipAddress).toBe('192.168.0.100');
    expect(rs.status).toBe('online');
    expect(rs.provenance).toBe('scan-confirmed 2026-07-08');
  });

  it('the GPU nodes now carry their scan-confirmed LAN IPs + peripherals', () => {
    const left = bySlug('dev-gpu-node-1');
    const right = bySlug('dev-gpu-node-2');
    expect(left.ipAddress).toBe('192.168.1.75');
    expect(JSON.stringify(left.specs)).toMatch(/Blackmagic HDMI/i);
    expect(JSON.stringify(right.specs)).toMatch(/192\.168\.1\.73/);
    expect(JSON.stringify(right.specs)).toMatch(/Stream Deck/i);
    expect(left.provenance).toBe('scan-confirmed 2026-07-08');
    expect(right.provenance).toBe('scan-confirmed 2026-07-08');
  });

  it('the unconfirmed gear is flagged needs-eyes-on (not passed off as confirmed)', () => {
    for (const id of ['dev-netgear-gear', 'dev-unifi-aps']) {
      const d = bySlug(id);
      expect(d.provenance).toBe('needs-eyes-on');
      expect(d.confirmed).toBe(false);
      expect(d.smeNeeded).toBe(true);
    }
  });

  it('the booth Alienware is consolidated as the wall laptop (TLC-Tech-Team), not duplicated', () => {
    // DR-0166: one machine — the booth NovaLCT laptop IS the wall NDI Studio
    // Monitor endpoint. It must NOT spawn a second row.
    const laptops = SEED_DEVICES.filter((d) => /Alienware/i.test(d.makeModel || ''));
    expect(laptops).toHaveLength(1);
    const wall = bySlug('dev-av-booth-laptop');
    expect(wall.ipAddress).toBe('100.92.143.124');
    expect(JSON.stringify(wall.specs)).toMatch(/TLC-Tech-Team/);
    expect(JSON.stringify(wall.specs)).toMatch(/NDI Studio Monitor/);
    expect(JSON.stringify(wall.specs)).toMatch(/NDI 6 Tools/);
  });

  it('livestream-main-pc carries the 2026-07-10 NDI discovery fix + obs-websocket :4455', () => {
    const right = bySlug('dev-gpu-node-2');
    expect(JSON.stringify(right.specs)).toMatch(/obs-websocket v5 on :4455/);
    expect(JSON.stringify(right.specs)).toMatch(/adapters\.allowed/);
    expect(JSON.stringify(right.specs)).toMatch(/discovery/);
  });

  it('does not fabricate model numbers where the scan was UNSURE', () => {
    // The unsure rows explicitly say UNSURE rather than inventing a model string.
    for (const id of ['dev-imac-tlcs', 'dev-synology-rackstation', 'dev-ipcam-1', 'dev-printer-1', 'dev-netgear-gear', 'dev-unifi-aps']) {
      expect(bySlug(id).makeModel).toMatch(/UNSURE/);
    }
  });
});
