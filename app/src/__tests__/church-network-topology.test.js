// @vitest-environment node
//
// church-network-topology — the derived COLG (Love Corner) network map.
// Verification Doctrine (DR-0076): these gates are PROVEN-TO-CATCH. Each one was
// shown to fail against the break it guards before it was kept:
//   - the prose-harvest regression (reading `specs.subnets` / `specs.tailnet` as
//     host addresses) put a documentation row on both segments, made it the
//     gateway, and manufactured NINE phantom address collisions. Caught here.
//   - the group-row regression (calling a row that covers three AirPlay speakers
//     "dual-homed") invents a second NIC on hardware that has one. Caught here.
//   - a CIDR written into an address field becoming a host (.0 / .255). Caught here.
import { describe, it, expect } from 'vitest';
import {
  parseIpv4, isPrivateIp, isTailnetIp, subnetCidr, hostOctet, isHostAddress,
  isAddressField, isListField, expectsAddress, extractEndpoints, buildTopology,
  eyesOnQueue, RECORDED_SUBNETS, RECORDED_GATEWAY_IP, TAILNET_CIDR,
} from '../lib/church-network-topology.js';
import { SEED_DEVICES, makeDevice } from '../lib/church-devices.js';

describe('address primitives', () => {
  it('parses a real dotted quad and rejects everything that is not one', () => {
    expect(parseIpv4('192.168.1.75').ok).toBe(true);
    expect(parseIpv4('192.168.1.75').octets).toEqual([192, 168, 1, 75]);
    expect(parseIpv4('192.168.1.256').ok).toBe(false); // octet out of range
    expect(parseIpv4('192.168.01.1').ok).toBe(false);  // ambiguous leading zero
    expect(parseIpv4('192.168.1').ok).toBe(false);     // truncated
    expect(parseIpv4('2.6.0').ok).toBe(false);         // a version string, not a host
    expect(parseIpv4(null).ok).toBe(false);
  });
  it('separates RFC1918 LAN space from the Tailscale CGNAT overlay', () => {
    expect(isPrivateIp('192.168.0.1')).toBe(true);
    expect(isPrivateIp('10.4.4.4')).toBe(true);
    expect(isPrivateIp('172.16.0.9')).toBe(true);
    expect(isPrivateIp('172.32.0.9')).toBe(false);
    // 100.64.0.0/10 is the tailnet, NOT a church segment.
    expect(isTailnetIp('100.72.5.90')).toBe(true);
    expect(isTailnetIp('100.69.19.13')).toBe(true);
    expect(isTailnetIp('100.128.0.1')).toBe(false); // outside the /10
    expect(isPrivateIp('100.72.5.90')).toBe(false);
  });
  it('derives the /24 and the host octet', () => {
    expect(subnetCidr('192.168.1.123')).toBe('192.168.1.0/24');
    expect(hostOctet('192.168.1.123')).toBe(123);
  });
  it('PROVEN-TO-CATCH: a network or broadcast address is never a host', () => {
    // "192.168.0.0/24" written into an address field must not become a device.
    expect(isHostAddress('192.168.0.0')).toBe(false);
    expect(isHostAddress('192.168.0.255')).toBe(false);
    expect(isHostAddress('192.168.0.1')).toBe(true);
  });
});

describe('address fields vs prose — the rule that keeps the map honest', () => {
  it('recognises the register\'s real address-field convention', () => {
    for (const k of ['ip', 'ips', 'lanIp', 'lanIpWired', 'lanIpWifi', 'tailscaleIp', 'secondaryIp', 'scanIp']) {
      expect(isAddressField(k)).toBe(true);
    }
  });
  it('PROVEN-TO-CATCH: prose keys are NOT address fields', () => {
    // These keys on dev-network-core quote NINE other devices' addresses. Reading
    // them as interfaces is the regression that broke the first build of this map.
    for (const k of ['subnets', 'tailnet', 'unconfirmedGear', 'note', 'liveNote', 'role', 'hostname', 'gpu']) {
      expect(isAddressField(k)).toBe(false);
    }
  });
  it('distinguishes a list field (several units) from a singular one (one NIC)', () => {
    expect(isListField('ips')).toBe(true);
    expect(isListField('lanIp')).toBe(false);
  });
  it('extracts addresses from address fields only', () => {
    const d = makeDevice({
      id: 'x', name: 'x', deviceType: 'network',
      ipAddress: '192.168.0.9',
      specs: {
        lanIp: '192.168.1.9 (wired)',
        note: 'talks to 192.168.0.200 and 10.9.9.9',   // prose — must be ignored
        subnets: '192.168.0.0/24 and 192.168.1.0/24',  // prose — must be ignored
      },
    });
    expect(extractEndpoints(d).map((e) => e.ip).sort()).toEqual(['192.168.0.9', '192.168.1.9']);
  });
});

describe('expectsAddress — a gap in the map vs a property of the hardware', () => {
  it('treats IP-managed types as expecting an address', () => {
    expect(expectsAddress('led-processor')).toBe(true);
    expect(expectsAddress('media-rig')).toBe(true);
    expect(expectsAddress('camera')).toBe(true);
  });
  it('does not nag about devices that are not IP hosts', () => {
    // The LED wall is driven by receiving cards over Cat6 from the VX1000.
    expect(expectsAddress('led-wall')).toBe(false);
    expect(expectsAddress('display')).toBe(false);
  });
});

describe('buildTopology — against the REAL COLG register', () => {
  const topology = buildTopology(SEED_DEVICES);

  it('derives exactly the two scan-recorded church segments', () => {
    expect(topology.subnets.map((s) => s.cidr)).toEqual(['192.168.0.0/24', '192.168.1.0/24']);
    for (const s of topology.subnets) expect(s.maskAssumed).toBe(false); // both masks were READ
    expect(RECORDED_SUBNETS.map((s) => s.cidr)).toEqual(['192.168.0.0/24', '192.168.1.0/24']);
  });

  it('seats the pfSense as the gateway of the subnet it actually holds', () => {
    const zero = topology.subnets.find((s) => s.cidr === '192.168.0.0/24');
    expect(zero.gateway).toBeTruthy();
    expect(zero.gateway.id).toBe('dev-pfsense-gateway');
    expect(topology.routing.routerIp).toBe(RECORDED_GATEWAY_IP);
  });

  it('reports the router interface on the 1-subnet as UNRECORDED rather than inventing one', () => {
    // The scan says the pfSense gateways BOTH subnets, but its interface address on
    // 192.168.1.0/24 was never read. The map must say so, not paint a .1.
    const one = topology.subnets.find((s) => s.cidr === '192.168.1.0/24');
    expect(one.gateway).toBeNull();
    expect(topology.routing.interfacesUnrecorded).toContain('192.168.1.0/24');
    expect(topology.findings.some((f) => f.kind === 'gateway-interface-unrecorded')).toBe(true);
  });

  it('PROVEN-TO-CATCH: the real register has ZERO address collisions', () => {
    // Nine phantom collisions appeared the moment prose was harvested. If this ever
    // goes non-zero, either a real duplicate was recorded or the extractor regressed.
    expect(topology.summary.conflicts).toBe(0);
    expect(topology.findings.filter((f) => f.kind === 'ip-collision')).toHaveLength(0);
  });

  it('PROVEN-TO-CATCH: the documentation umbrella row is not a host', () => {
    // dev-network-core carries NO address field — its subnets/tailnet keys are prose
    // about other devices. It must not appear on a segment, and must never be the gateway.
    for (const s of topology.subnets) {
      expect(s.members.some((m) => m.node.id === 'dev-network-core')).toBe(false);
      if (s.gateway) expect(s.gateway.id).not.toBe('dev-network-core');
    }
    expect(topology.unaddressed.some((n) => n.id === 'dev-network-core')).toBe(true);
  });

  it('finds the one genuine bridge host and does not invent others', () => {
    // livestream-main-pc is wired on 192.168.1.73 and on Wi-Fi at 192.168.0.44 —
    // one machine with a foot on each segment. That is the only true dual-homed host.
    expect(topology.dualHomed).toHaveLength(1);
    expect(topology.dualHomed[0].node.id).toBe('dev-gpu-node-2');
    expect(topology.dualHomed[0].subnets.sort()).toEqual(['192.168.0.0/24', '192.168.1.0/24']);
  });

  it('PROVEN-TO-CATCH: group rows are NOT reported as dual-homed hosts', () => {
    // Three AirPlay speakers on one row spread across two segments is a spread of
    // units, not a machine with two NICs. Claiming otherwise fabricates hardware.
    const groupIds = topology.groupRows.map((g) => g.node.id);
    expect(groupIds).toContain('dev-airplay-spotify-speakers');
    expect(groupIds).toContain('dev-echo-alexa');
    for (const id of groupIds) {
      expect(topology.dualHomed.some((d) => d.node.id === id)).toBe(false);
    }
  });

  it('places the NDI cameras and the ATEM on OPPOSITE segments (the routed-hop fact)', () => {
    const one = topology.subnets.find((s) => s.cidr === '192.168.1.0/24');
    const zero = topology.subnets.find((s) => s.cidr === '192.168.0.0/24');
    for (const cam of ['dev-ptz-center-1', 'dev-ptz-right-3', 'dev-ptz-left-2']) {
      expect(one.members.some((m) => m.node.id === cam)).toBe(true);
    }
    expect(zero.members.some((m) => m.node.id === 'dev-atem-production-studio-4k')).toBe(true);
  });

  it('keeps the tailnet on its own plane, never as a church segment', () => {
    expect(topology.overlay.cidr).toBe(TAILNET_CIDR);
    expect(topology.overlay.nodes.length).toBeGreaterThan(0);
    for (const s of topology.subnets) expect(isTailnetIp(`${s.cidr.split('/')[0]}`)).toBe(false);
    // No overlay address may be placed on a LAN segment.
    for (const s of topology.subnets) {
      for (const m of s.members) for (const e of m.ips) expect(isTailnetIp(e.ip)).toBe(false);
    }
  });

  it('separates "address never read" from "not an IP host by design"', () => {
    const vx = topology.unaddressed.find((n) => n.id === 'dev-vx1000');
    const wall = topology.unaddressed.find((n) => n.id === 'dev-led-wall');
    expect(vx.expectsAddress).toBe(true);   // the scan could not find its mgmt IP — a real gap
    expect(wall.expectsAddress).toBe(false); // receiving cards over Cat6 — no address expected
    expect(topology.findings.some((f) => f.id === 'unaddressed-dev-vx1000')).toBe(true);
    expect(topology.findings.some((f) => f.id === 'off-network-dev-led-wall')).toBe(true);
  });

  it('states its own limit: the map is layer-3, cabling is not known', () => {
    expect(topology.wiringKnown).toBe(false);
    expect(topology.layer).toBe('layer-3 address map');
    expect(topology.findings.some((f) => f.kind === 'unidentified-network-gear')).toBe(true);
  });

  it('every placed device traces back to a real register row', () => {
    const ids = new Set(SEED_DEVICES.map((d) => d.id));
    for (const s of topology.subnets) {
      for (const m of s.members) expect(ids.has(m.node.id)).toBe(true);
    }
  });
});

describe('findings + the eyes-on queue', () => {
  it('PROVEN-TO-CATCH: a real duplicate address is reported as a conflict', () => {
    const devices = [
      makeDevice({ id: 'a', name: 'A', deviceType: 'camera', ipAddress: '192.168.1.50' }),
      makeDevice({ id: 'b', name: 'B', deviceType: 'printer', ipAddress: '192.168.1.50' }),
    ];
    const t = buildTopology(devices);
    const collision = t.findings.find((f) => f.kind === 'ip-collision');
    expect(collision).toBeTruthy();
    expect(collision.severity).toBe('problem');
    expect(t.summary.conflicts).toBe(1);
  });
  it('ranks conflicts above gaps above structural notes', () => {
    const t = buildTopology(SEED_DEVICES);
    const order = t.findings.map((f) => f.severity);
    const rank = { problem: 0, attention: 1, idle: 2 };
    for (let i = 1; i < order.length; i += 1) {
      expect(rank[order[i]]).toBeGreaterThanOrEqual(rank[order[i - 1]]);
    }
  });
  it('the eyes-on queue carries the real work and drops the informational notes', () => {
    const t = buildTopology(SEED_DEVICES);
    const q = eyesOnQueue(t);
    expect(q.length).toBeGreaterThan(0);
    expect(q.every((item) => item.ask && item.why)).toBe(true);
    // Structural notes (dual-homed, group rows) are not tasks for the closet walk.
    expect(q.some((item) => item.kind === 'dual-homed')).toBe(false);
  });
  it('an empty register yields an empty map, not a crash', () => {
    const t = buildTopology([]);
    expect(t.subnets).toEqual([]);
    expect(t.summary.placedDevices).toBe(0);
    expect(eyesOnQueue(t)).toEqual([]);
  });
  it('ignores retired/inactive rows', () => {
    const t = buildTopology([
      makeDevice({ id: 'gone', name: 'Gone', deviceType: 'camera', ipAddress: '192.168.9.9', active: false }),
    ]);
    expect(t.subnets).toEqual([]);
  });
});
