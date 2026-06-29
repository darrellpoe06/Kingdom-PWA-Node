// =============================================================================
// interconnect-manifest test — the interconnection-loop proof is REAL and the
// regression guard PROVABLY catches a loop going static (DR-0076 proven-to-catch).
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  buildInterconnectManifest, verifyLoop, INTERCONNECT_REGISTRY,
} from '../../../scripts/interconnect-manifest.mjs';
import {
  normalizeInterconnect, loopRowStatus, interconnectHeadline,
} from '../lib/interconnect-loops.js';

describe('interconnect manifest — real, file-verified', () => {
  const m = buildInterconnectManifest();

  it('every loop declared LIVE is actually wired on disk (no painted green)', () => {
    const broken = m.loops.filter((l) => l.broken);
    expect(broken, broken.map((b) => `${b.name}: ${b.missing.join(', ')}`).join(' | ')).toHaveLength(0);
    expect(m.summary.allLiveWired).toBe(true);
    expect(m.summary.liveWired).toBe(m.summary.live);
  });

  it('covers the flagship interconnections', () => {
    const ids = m.loops.map((l) => l.id);
    for (const id of ['theword', 'choir-songbook', 'scripture-appearances', 'crm-federation', 'inventory-onhand', 'feedback-concerns']) {
      expect(ids).toContain(id);
    }
  });

  it('the fixed loops are LIVE (scripture appearances + CRM federation)', () => {
    const byId = Object.fromEntries(m.loops.map((l) => [l.id, l]));
    expect(byId['scripture-appearances'].wired).toBe(true);
    expect(byId['scripture-appearances'].broken).toBe(false);
    expect(byId['crm-federation'].wired).toBe(true);
    expect(byId['crm-federation'].broken).toBe(false);
  });

  it('building loops are honestly declared, never painted green', () => {
    const building = m.loops.filter((l) => l.status === 'building');
    expect(building.length).toBeGreaterThan(0);
    for (const l of building) {
      expect(l.awaiting).toBeTruthy(); // an honest why
      const rs = loopRowStatus(l);
      expect(rs.status).not.toBe('good'); // never green while still building
    }
  });
});

describe('proven-to-catch — the guard fails when a loop goes static', () => {
  it('flags a live loop whose SOURCE token vanished', () => {
    const v = verifyLoop({
      id: 'x', name: 'x', status: 'live',
      source: { file: 'app/src/lib/loop-health.js', token: '__TOKEN_THAT_DOES_NOT_EXIST__' },
      links: [],
    });
    expect(v.wired).toBe(false);
    expect(v.broken).toBe(true);
    expect(v.missing.length).toBeGreaterThan(0);
  });

  it('flags a live loop whose DESTINATION stopped reading the source (link token removed)', () => {
    const v = verifyLoop({
      id: 'y', name: 'y', status: 'live',
      source: { file: 'app/src/lib/feedback-sync.js', token: 'feedback' }, // real
      links: [{ file: 'app/src/components/ConcernsBoard.jsx', token: '__DESTINATION_NO_LONGER_WIRED__' }],
    });
    expect(v.broken).toBe(true); // a destination going static is caught
  });

  it('a real, fully-wired loop verifies clean', () => {
    const real = INTERCONNECT_REGISTRY.find((l) => l.id === 'feedback-concerns');
    const v = verifyLoop(real);
    expect(v.broken).toBe(false);
    expect(v.wired).toBe(true);
  });
});

describe('interconnect-loops render normalize — null-safe, honest', () => {
  it('degrades to an honest empty list when the define is missing', () => {
    const n = normalizeInterconnect(null);
    expect(n.ok).toBe(false);
    expect(n.loops).toEqual([]);
  });

  it('loopRowStatus: broken wins, live+wired is the only green, building is slate', () => {
    expect(loopRowStatus({ broken: true, status: 'live', wired: true }).status).toBe('problem');
    expect(loopRowStatus({ status: 'live', wired: true }).status).toBe('good');
    expect(loopRowStatus({ status: 'building' }).status).toBe('idle');
  });

  it('headline reports the live/building split and a regression honestly', () => {
    expect(interconnectHeadline({ live: 9, liveWired: 9, building: 3, broken: 0 })).toMatch(/9\/9/);
    expect(interconnectHeadline({ live: 9, liveWired: 8, building: 3, broken: 1 })).toMatch(/went static/);
  });
});
