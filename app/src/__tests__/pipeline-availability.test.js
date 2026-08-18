// @vitest-environment node
//
// pipeline-availability — PROVEN-TO-CATCH tests (DR-0076 §3)
//
// Darrell 2026-08-14: "we need to come up with obstacles to turning off anything
// or device we use for this pipeline..."
//
// The witness has two ways to be worthless, and both are tested here:
//   * it never notices a node going dark (then the obstacles are unverifiable)
//   * it screams about a node that is ALLOWED to be dark (then it gets muted,
//     and a muted gate protects nothing)
//
// The second is the subtle one. livestream-main-pc feeds the NovaStar -> wall.
// DR-0012 §3 gives live/creative work absolute priority over AI jobs, so an
// operator powering that box down is CORRECT. A witness that files an incident
// for it teaches the team to ignore the witness.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assessFleet, classifyNode, declaredNodes, normalizeProbeState, formatFleetReport,
} from '../lib/pipeline-availability.js';
import {
  peersFromTailscaleStatus, probesFromPeers,
} from '../../../scripts/pipeline-availability-probe.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(readFileSync(
  join(HERE, '../../../infra/device-availability/pipeline-nodes.json'), 'utf8',
));

const alwaysOn = { slug: 'nas', role: 'nas', required: true, expectedAlwaysOn: true };
const mayBeOff = { slug: 'presenter', role: 'gpu-presenter', required: false, expectedAlwaysOn: false };

describe('proven-to-catch — a node that should be up and is not', () => {
  it('FILES AN INCIDENT for a declared always-on node measured down', () => {
    const r = classifyNode(alwaysOn, 'down');
    expect(r.verdict).toBe('incident');
    expect(r.reason).toMatch(/degraded/);
  });

  it('catches it through the whole-fleet path too', () => {
    const a = assessFleet({ nodes: [{ slug: 'nas', required: true, expected_always_on: true }] }, { nas: 'down' });
    expect(a.healthy).toBe(false);
    expect(a.incidents.map((i) => i.slug)).toEqual(['nas']);
  });

  it('a declared node with NO probe entry is unverified, never assumed up', () => {
    const a = assessFleet({ nodes: [{ slug: 'nas', required: true, expected_always_on: true }] }, {});
    expect(a.totals.up).toBe(0);
    expect(a.unverified.map((u) => u.slug)).toEqual(['nas']);
  });
});

describe('it must not cry wolf — the failure that gets a witness muted', () => {
  it('a dark gpu-presenter is NORMAL and cites why (DR-0012)', () => {
    const r = classifyNode(mayBeOff, 'down');
    expect(r.verdict).toBe('normal');
    expect(r.reason).toMatch(/DR-0012/);
  });

  it('a fleet whose only dark node is allowed to be dark stays healthy', () => {
    const a = assessFleet(MANIFEST, {
      poetech: 'up',
      tlcmediadpt: 'up',
      'livestream-main-pc': 'down',
      'tlc-tech-team': 'up',
      tlcrackstation: 'down',
      'kingdom-home': 'up',
    });
    expect(a.healthy).toBe(true);
    expect(a.totals.incidents).toBe(0);
  });

  it('unverified is loud in the report but does NOT fail the witness', () => {
    const a = assessFleet(MANIFEST, {});
    expect(a.totals.unknown).toBeGreaterThan(0);
    expect(a.healthy).toBe(true); // a runner that could not join is not a device fault
  });
});

describe('unknown never reads as up (DR-0076)', () => {
  it('coerces junk probe states to unknown rather than guessing', () => {
    for (const bad of [undefined, null, '', 'UP!', 42, {}, 'online']) {
      expect(normalizeProbeState(bad)).toBe('unknown');
    }
  });

  it('accepts the three real states case-insensitively', () => {
    expect(normalizeProbeState('UP')).toBe('up');
    expect(normalizeProbeState(' Down ')).toBe('down');
    expect(normalizeProbeState('unknown')).toBe('unknown');
  });

  it('an unknown reading is never an incident and never healthy-counted', () => {
    const r = classifyNode(alwaysOn, 'garbage');
    expect(r.verdict).toBe('unverified');
    expect(r.reason).toMatch(/DR-0076/);
  });
});

describe('a box that joins quietly gets noticed', () => {
  it('reports an undeclared slug instead of folding it into the healthy count', () => {
    const a = assessFleet({ nodes: [{ slug: 'nas', expected_always_on: true }] }, { nas: 'up', mystery: 'up' });
    expect(a.undeclared.map((u) => u.slug)).toEqual(['mystery']);
    expect(a.totals.declared).toBe(1);
  });
});

describe('the real manifest is coherent', () => {
  it('declares the fleet, not nothing', () => {
    const nodes = declaredNodes(MANIFEST);
    expect(nodes.length).toBeGreaterThanOrEqual(6);
    expect(nodes.map((n) => n.slug)).toContain('tlcmediadpt');
    expect(nodes.map((n) => n.slug)).toContain('poetech');
  });

  it('every declared node carries a tailnet address to probe', () => {
    for (const n of declaredNodes(MANIFEST)) {
      expect(n.tailnetIp, `${n.slug} has no tailnet_ip`).toMatch(/^100\.\d+\.\d+\.\d+$/);
    }
  });

  it('the NAS and the AI worker are the always-on pair', () => {
    const alwaysOnSlugs = declaredNodes(MANIFEST).filter((n) => n.expectedAlwaysOn).map((n) => n.slug);
    expect(alwaysOnSlugs).toEqual(['poetech', 'tlcmediadpt']);
  });

  it('the presenter box is deliberately NOT required — DR-0012 outranks uptime', () => {
    const presenter = declaredNodes(MANIFEST).find((n) => n.slug === 'livestream-main-pc');
    expect(presenter.expectedAlwaysOn).toBe(false);
    expect(presenter.required).toBe(false);
  });

  it('malformed manifests degrade to empty rather than throwing', () => {
    for (const bad of [undefined, null, {}, { nodes: 'x' }, { nodes: [null, { slug: '' }] }]) {
      expect(() => declaredNodes(bad)).not.toThrow();
      expect(declaredNodes(bad)).toEqual([]);
    }
  });
});

describe('reading the tailnet — the probe maps peers to the declared fleet', () => {
  // The EXACT state Darrell's Tailscale view showed 2026-08-14, reduced to the
  // fields `tailscale status --json` actually emits.
  const LIVE = {
    Self: { HostName: 'github-runner', TailscaleIPs: ['100.99.99.99'] },
    Peer: {
      k2: { HostName: 'kingdom-home', TailscaleIPs: ['100.74.53.117'], Online: true },
      k3: { HostName: 'livestream-main-pc', TailscaleIPs: ['100.72.5.90'], Online: false },
      k4: { HostName: 'poetech', TailscaleIPs: ['100.70.190.47'], Online: true },
      k5: { HostName: 'tlc-tech-team', TailscaleIPs: ['100.92.143.124'], Online: true },
      k6: { HostName: 'tlcmediadpt', TailscaleIPs: ['100.69.19.13'], Online: true },
      k7: { HostName: 'tlcrackstation', TailscaleIPs: ['100.66.173.22'], Online: false },
    },
  };

  it('reproduces the live 2026-08-14 reading: 4 up, 2 dark, NO incident', () => {
    const a = assessFleet(MANIFEST, probesFromPeers(MANIFEST, peersFromTailscaleStatus(LIVE)));
    expect(a.totals.up).toBe(4);
    expect(a.totals.down).toBe(2);
    expect(a.healthy).toBe(true);
  });

  it('PROVEN-TO-CATCH: the same reading with the AI worker dark IS an incident', () => {
    const dark = { ...LIVE, Peer: { ...LIVE.Peer, k6: { ...LIVE.Peer.k6, Online: false } } };
    const a = assessFleet(MANIFEST, probesFromPeers(MANIFEST, peersFromTailscaleStatus(dark)));
    expect(a.healthy).toBe(false);
    expect(a.incidents.map((i) => i.slug)).toEqual(['tlcmediadpt']);
  });

  it('discriminates: presenter dark is normal in the SAME run the worker is dark', () => {
    const dark = { ...LIVE, Peer: { ...LIVE.Peer, k6: { ...LIVE.Peer.k6, Online: false } } };
    const a = assessFleet(MANIFEST, probesFromPeers(MANIFEST, peersFromTailscaleStatus(dark)));
    const presenter = a.results.find((r) => r.slug === 'livestream-main-pc');
    expect(presenter.probe).toBe('down');
    expect(presenter.verdict).toBe('normal');
  });

  it('matches a RENAMED host by its tailnet IP', () => {
    const renamed = {
      ...LIVE,
      Peer: { ...LIVE.Peer, k6: { HostName: 'media-dept-new', TailscaleIPs: ['100.69.19.13'], Online: true } },
    };
    expect(probesFromPeers(MANIFEST, peersFromTailscaleStatus(renamed)).tlcmediadpt).toBe('up');
  });

  it('a node ABSENT from the tailnet is unknown, not down — removal is not a power-off', () => {
    const gone = { ...LIVE, Peer: { ...LIVE.Peer } };
    delete gone.Peer.k6;
    const probes = probesFromPeers(MANIFEST, peersFromTailscaleStatus(gone));
    expect(probes.tlcmediadpt).toBe('unknown');
    expect(assessFleet(MANIFEST, probes).healthy).toBe(true);
  });

  it('never throws on a malformed status blob', () => {
    for (const bad of [undefined, null, {}, { Peer: 'x' }, { Peer: { a: null } }]) {
      expect(() => peersFromTailscaleStatus(bad)).not.toThrow();
    }
  });
});

describe('the report is readable by a human', () => {
  it('names every node and ends with the totals line', () => {
    const out = formatFleetReport(assessFleet(MANIFEST, { poetech: 'up', tlcmediadpt: 'down' }));
    expect(out).toMatch(/tlcmediadpt/);
    expect(out).toMatch(/DARK/);
    expect(out).toMatch(/declared 6 \| up 1/);
  });

  it('never throws on a junk assessment', () => {
    for (const bad of [undefined, null, {}, 42]) expect(() => formatFleetReport(bad)).not.toThrow();
  });
});
