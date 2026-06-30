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
