// =============================================================================
// church-network-topology — the COLG (Love Corner) network topology, DERIVED
// =============================================================================
// The asset register (church-devices.js) is a flat list by device TYPE. It answers
// "what do we own." It does not answer "how is it connected." This module answers
// the second question by DERIVING the topology from the addresses already recorded
// on the register — it invents nothing and hand-draws nothing.
//
// PURE (no React, no Supabase, no network calls) so every derivation is proven by
// the gate without a DB (Verification Doctrine, DR-0076). The surface is the
// Topology section of components/DeviceInventory.jsx.
//
// REALITY-TRACE (DR-0061 / P15):
//   Real data  — SEED_DEVICES (church-devices.js) merged with live church_devices
//                rows. Every IP here was READ OFF the real 2026-07-08 church LAN
//                scan (docs/99-session-notes/2026-07-08-church-lan-device-inventory.md).
//   Real screen— Church > Devices (surfaces.js 'devices', staff-gated).
//   Mask     — READ, never assumed. The 2026-09-18 scan captured the scanning
//                host's own adapter: 192.168.1.73 with prefix /23, DHCP-assigned.
//                A /23 there spans 192.168.0.0 - 192.168.1.255, so what earlier
//                notes called "two /24 subnets" is ONE layer-2 network. Any address
//                outside a network with a READ mask is grouped by /24 and flagged
//                maskAssumed:true, so an assumption can never again be presented as
//                a reading (see CORRECTION below).
//
// THE HONEST LIMIT, stated up front and carried in the returned object:
//   This is a LAYER-3 ADDRESS MAP, not a LAYER-1 WIRING MAP. The register holds no
//   switch-port, VLAN or cable data, and the two Netgear endpoints plus the two
//   possible UniFi APs are still `needs-eyes-on`. So the topology can say WHICH
//   SEGMENT a device sits on and WHAT ROUTES BETWEEN SEGMENTS; it cannot say which
//   port a device is patched into. `topology.wiringKnown` is false until that walk
//   happens, and `findings` names exactly what would close it.
// =============================================================================

// --- Recorded facts (never inferred) -----------------------------------------

// CORRECTION, 2026-09-18. This module previously carried two /24 networks marked
// maskAssumed:false — "scan-confirmed 2026-07-08". That was WRONG, and the error is
// worth recording rather than quietly deleting: the 2026-07-08 note observed
// addresses in two ranges and wrote "two subnets 192.168.0.0/24 and 192.168.1.0/24".
// NO NETMASK WAS EVER READ. This module then inherited that assumption and stamped
// it as a reading, which is exactly the failure DR-0076 exists to prevent — an
// assumption wearing a measurement's provenance.
//
// The 2026-09-18 scan captured the scanning host's own adapter configuration:
//   LIVESTREAM-MAIN, Ethernet, 192.168.1.73, prefix 23, origin DHCP
// A /23 at that address is 192.168.0.0 - 192.168.1.255. Its route table carries a
// single default route via 192.168.0.1 and NO inter-subnet route, which is what a
// single flat network looks like from inside.
//
// So 192.168.0.x and 192.168.1.x are ONE broadcast domain, not two segments, and
// the pfSense is NOT routing between them — there is nothing to route.
export const CHURCH_NETWORK = {
  cidr: '192.168.0.0/23',
  label: 'Church LAN — one flat /23',
  note: 'A single layer-2 broadcast domain spanning 192.168.0.0-192.168.1.255. Everything on it reaches everything else without crossing the firewall.',
  provenance: 'dhcp-observed 2026-09-18 (192.168.1.73/23 on LIVESTREAM-MAIN, origin Dhcp) + a route table with one default route and no inter-subnet route',
  maskObserved: true,
};

// Kept as a list so a future scan that finds a genuinely separate network can add
// one without reshaping the module.
export const RECORDED_SUBNETS = [CHURCH_NETWORK];

// The Tailscale overlay. 100.64.0.0/10 is the CGNAT range Tailscale assigns; it is
// NOT a church LAN segment — it is a WireGuard mesh riding on top of whatever the
// device's physical path is, which is exactly why it gets its own plane here.
export const TAILNET_CIDR = '100.64.0.0/10';
export const TAILNET_LABEL = 'Tailscale tailnet (overlay)';

// The device the scan recorded as gateway/DHCP for BOTH subnets.
export const RECORDED_GATEWAY_IP = '192.168.0.1';

// --- Address primitives ------------------------------------------------------

// parseIpv4 — strict dotted-quad. Rejects anything that is not four 0-255 octets
// (so a version string, a build number, or a truncated read never becomes a host).
export function parseIpv4(value) {
  if (typeof value !== 'string') return { ok: false, ip: null, octets: null };
  const m = value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return { ok: false, ip: null, octets: null };
  const octets = m.slice(1).map((n) => Number(n));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return { ok: false, ip: null, octets: null };
  }
  // Reject leading zeros ("192.168.01.1") — an ambiguous read, not a fact.
  if (m.slice(1).some((s) => s.length > 1 && s.startsWith('0'))) {
    return { ok: false, ip: null, octets: null };
  }
  return { ok: true, ip: octets.join('.'), octets };
}

// RFC1918 private space — the only space a church LAN segment may be built from.
export function isPrivateIp(ip) {
  const { ok, octets } = parseIpv4(ip);
  if (!ok) return false;
  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

// Tailscale CGNAT space (100.64.0.0/10) — overlay, not LAN.
export function isTailnetIp(ip) {
  const { ok, octets } = parseIpv4(ip);
  if (!ok) return false;
  const [a, b] = octets;
  return a === 100 && b >= 64 && b <= 127;
}

// --- Network membership, from a READ mask where one exists --------------------

export function ipToInt(ip) {
  const { ok, octets } = parseIpv4(ip);
  if (!ok) return null;
  return ((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
}

// networkContains — is `ip` inside `cidr`? Pure integer math, no dependency.
export function networkContains(cidr, ip) {
  if (typeof cidr !== 'string') return false;
  const [base, lenRaw] = cidr.split('/');
  const len = Number(lenRaw);
  if (!Number.isInteger(len) || len < 0 || len > 32) return false;
  const baseInt = ipToInt(base);
  const ipInt = ipToInt(ip);
  if (baseInt === null || ipInt === null) return false;
  // A /0 mask would shift by 32, which is a no-op in JS — handle it explicitly.
  const mask = len === 0 ? 0 : (0xFFFFFFFF << (32 - len)) >>> 0;
  return (baseInt & mask) === (ipInt & mask);
}

// networkForIp — the network an address belongs to, preferring a READ mask.
// Returns { cidr, maskObserved }. An address inside a network whose mask was
// actually read gets that network; anything else falls back to a /24 and is
// HONESTLY FLAGGED as assumed, because no mask was ever read for it.
export function networkForIp(ip) {
  const { ok, octets } = parseIpv4(ip);
  if (!ok) return null;
  for (const net of RECORDED_SUBNETS) {
    if (networkContains(net.cidr, ip)) {
      return { cidr: net.cidr, maskObserved: net.maskObserved === true };
    }
  }
  return { cidr: `${octets[0]}.${octets[1]}.${octets[2]}.0/24`, maskObserved: false };
}

// subnetCidr — the network an address belongs to, as a CIDR string.
// Kept as the module's grouping key. It is NO LONGER "the /24": it resolves
// through networkForIp so a read /23 keeps its hosts in ONE bucket instead of
// splitting them into two segments that do not exist.
export function subnetCidr(ip) {
  const n = networkForIp(ip);
  return n ? n.cidr : null;
}

export function hostOctet(ip) {
  const { ok, octets } = parseIpv4(ip);
  return ok ? octets[3] : null;
}

export function isRecordedSubnet(cidr) {
  return RECORDED_SUBNETS.some((s) => s.cidr === cidr);
}

// --- Endpoint extraction -----------------------------------------------------
// A device's addresses do not all live in `ipAddress`. The 2026-07-08 scan wrote
// secondary readings into dedicated `specs` ADDRESS FIELDS (lanIp, lanIpWired,
// lanIpWifi, tailscaleIp, secondaryIp, scanIp, ips). Those are real readings about
// THIS device, so the topology reads them too.
//
// It reads ONLY those fields. Prose keys on the same rows (`subnets`, `tailnet`,
// `unconfirmedGear`, `note`, `liveNote`, `role`) quote OTHER devices' addresses —
// `dev-network-core` alone names nine of them. Harvesting prose made that one
// documentation row appear as a host on both segments AND as the gateway, and
// manufactured nine phantom address collisions. A documentation note is not a
// network interface. The address-field rule is what keeps the map honest.

// A spec key is an ADDRESS field when it is `ip`/`ips`, or ends in `Ip` with an
// optional interface qualifier (lanIpWired, lanIpWifi, ipv4...). Anything else is
// prose and is never read for hosts.
const ADDRESS_KEY = /(^|[a-z])ips?(wired|wifi|v4|v6|addr|address)?$/i;

export function isAddressField(key) {
  return typeof key === 'string' && ADDRESS_KEY.test(key);
}

// A list field holds SEVERAL endpoints for one register row (the Echo pair, the
// three AirPlay speakers, the two Netgear endpoints). That distinction matters:
// two addresses from two singular fields is one DUAL-HOMED host; two addresses
// from a list field is one row covering several PHYSICAL UNITS. Calling the
// second "dual-homed" would be a fabricated claim about the hardware.
export function isListField(key) {
  return typeof key === 'string' && /ips$/i.test(key);
}

const IPV4_IN_TEXT = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

// A /24's .0 is the network address and .255 the broadcast address — neither is a
// host. They appear in prose as "192.168.0.0/24"; rejecting them here means a CIDR
// written into an address field can never become a device.
export function isHostAddress(ip) {
  const h = hostOctet(ip);
  return h !== null && h !== 0 && h !== 255;
}

export function extractEndpoints(device) {
  const found = [];
  const seen = new Set();
  const push = (raw, field, list) => {
    const { ok, ip } = parseIpv4(raw);
    if (!ok || seen.has(ip) || !isHostAddress(ip)) return;
    seen.add(ip);
    found.push({
      ip,
      field,
      fromList: list === true,
      plane: isTailnetIp(ip) ? 'overlay' : (isPrivateIp(ip) ? 'lan' : 'other'),
      primary: field === 'ipAddress',
    });
  };

  if (device && typeof device.ipAddress === 'string') push(device.ipAddress, 'ipAddress', false);

  const specs = (device && device.specs && typeof device.specs === 'object') ? device.specs : {};
  for (const [key, value] of Object.entries(specs)) {
    if (typeof value !== 'string' || !isAddressField(key)) continue;
    const matches = value.match(IPV4_IN_TEXT) || [];
    const list = isListField(key);
    for (const candidate of matches) push(candidate, `specs.${key}`, list);
  }
  return found;
}

// --- The topology ------------------------------------------------------------

// expectsAddress — whether a device of this type is an IP host at all. The LED
// wall is driven by RECEIVING CARDS over Cat6 from the VX1000 (church-devices.js
// records the Cat6 runs feeding the cards); receiving cards are not IP hosts, and
// a passive display is not either. Every other type on the register is managed
// over IP, so a missing address there is a GAP IN THE MAP, not a property of the
// hardware. Keeping the two apart stops the findings list from nagging about
// devices that will never have an address.
const NON_IP_TYPES = ['led-wall', 'display', 'other'];
export function expectsAddress(deviceType) {
  return !NON_IP_TYPES.includes(deviceType);
}

function blankNode(device, endpoints) {
  return {
    id: device.id,
    name: device.name,
    deviceType: device.deviceType,
    status: device.status,
    location: device.location ?? null,
    provenance: device.provenance ?? null,
    confirmed: device.confirmed === true,
    smeNeeded: device.smeNeeded === true,
    endpoints,
  };
}

// buildTopology — the whole derivation. Returns the planes, the routing story, and
// the findings. `devices` is the merged register (seed + DB rows).
export function buildTopology(devices) {
  const list = (devices || []).filter((d) => d && d.active !== false);

  const nodes = list.map((d) => blankNode(d, extractEndpoints(d)));

  // --- LAN planes (one per /24 actually observed) ---
  const bySubnet = new Map();
  const overlayNodes = [];
  const unaddressed = [];
  const otherIps = [];

  for (const node of nodes) {
    const lan = node.endpoints.filter((e) => e.plane === 'lan');
    const overlay = node.endpoints.filter((e) => e.plane === 'overlay');
    for (const e of node.endpoints.filter((x) => x.plane === 'other')) {
      otherIps.push({ nodeId: node.id, name: node.name, ip: e.ip, field: e.field });
    }

    for (const e of lan) {
      const cidr = subnetCidr(e.ip);
      if (!bySubnet.has(cidr)) bySubnet.set(cidr, new Map());
      const members = bySubnet.get(cidr);
      // One entry per device per subnet; a device with two addresses on the same
      // subnet (the iMac's .102/.155) keeps both under one member.
      if (!members.has(node.id)) members.set(node.id, { node, ips: [] });
      members.get(node.id).ips.push(e);
    }

    if (overlay.length > 0) {
      overlayNodes.push({ node, ips: overlay });
    }
    if (node.endpoints.length === 0) unaddressed.push({ ...node, expectsAddress: expectsAddress(node.deviceType) });
  }

  const subnets = Array.from(bySubnet.entries())
    .map(([cidr, members]) => {
      const recorded = RECORDED_SUBNETS.find((s) => s.cidr === cidr) || null;
      const memberList = Array.from(members.values())
        .sort((a, b) => (hostOctet(a.ips[0].ip) || 0) - (hostOctet(b.ips[0].ip) || 0));
      // A gateway ROW on this subnet: a network-type device holding the .1 host.
      const gateway = memberList.find(
        (m) => m.node.deviceType === 'network' && m.ips.some((e) => hostOctet(e.ip) === 1),
      ) || null;
      return {
        cidr,
        label: recorded ? recorded.label : `Segment ${cidr}`,
        note: recorded ? recorded.note : null,
        provenance: recorded ? recorded.provenance : 'derived from a recorded host address',
        // maskAssumed is the inverse of an ACTUAL netmask reading — never merely
        // "is this cidr in our list". That conflation is what let an assumed /24
        // ship as a measurement (see CORRECTION at the top of this file).
        maskAssumed: !(recorded && recorded.maskObserved === true),
        gateway: gateway ? gateway.node : null,
        members: memberList,
        deviceCount: memberList.length,
      };
    })
    .sort((a, b) => a.cidr.localeCompare(b.cidr));

  // --- Routing: what carries traffic BETWEEN the segments ---
  const gatewayNode = nodes.find((n) => n.endpoints.some((e) => e.ip === RECORDED_GATEWAY_IP)) || null;
  const routing = {
    // Everything crossing a segment boundary transits this device. That is the
    // single most load-bearing fact in the whole topology: an NDI camera on the
    // 1-subnet reaching the ATEM on the 0-subnet is a ROUTED hop, not a switched one.
    router: gatewayNode,
    routerIp: gatewayNode ? RECORDED_GATEWAY_IP : null,
    routedSubnets: subnets.map((s) => s.cidr),
    // The router's interface address on each non-gateway subnet was never read.
    interfacesUnrecorded: subnets
      .filter((s) => !s.gateway)
      .map((s) => s.cidr),
  };

  // --- Multi-segment rows, split into the two things they actually are ---
  // dualHomed  — ONE unit with interfaces on two segments (its addresses come from
  //              distinct singular fields: lanIpWired + lanIpWifi). A real bridge.
  // groupRows  — ONE register row covering SEVERAL physical units (its addresses
  //              come from a list field). Calling these "dual-homed" would invent a
  //              second NIC on hardware that has one.
  const multiSegment = nodes
    .map((node) => {
      const lan = node.endpoints.filter((e) => e.plane === 'lan');
      const lanCidrs = Array.from(new Set(lan.map((e) => subnetCidr(e.ip))));
      return { node, subnets: lanCidrs, fromList: lan.some((e) => e.fromList) };
    })
    .filter((x) => x.subnets.length > 1);
  const dualHomed = multiSegment.filter((x) => !x.fromList);
  const groupRows = multiSegment.filter((x) => x.fromList);

  // --- Overlay-only: reachable on the tailnet, no LAN address on the register ---
  const overlayOnly = overlayNodes.filter(
    (o) => o.node.endpoints.every((e) => e.plane !== 'lan'),
  );

  const topology = {
    subnets,
    overlay: {
      cidr: TAILNET_CIDR,
      label: TAILNET_LABEL,
      note: 'A WireGuard mesh riding over the LAN and the internet edge — not a church segment. It is how home and church reach each other without opening a port.',
      nodes: overlayNodes,
      overlayOnly,
    },
    routing,
    dualHomed,
    groupRows,
    unaddressed,
    otherIps,
    // The standing honest limit: addresses are known, cabling is not.
    wiringKnown: false,
    layer: 'layer-3 address map',
  };

  topology.findings = topologyFindings(topology, nodes);
  topology.summary = summarizeTopology(topology, nodes);
  return topology;
}

// --- Findings (the work the topology surfaces) -------------------------------
// Each finding is a real defect or a real unknown in the MAP, never a guess about
// the hardware. Severity: 'problem' = an actual conflict, 'attention' = a gap that
// blocks the map from being complete, 'idle' = informational structure.

export function topologyFindings(topology, nodes) {
  const findings = [];

  // 1. Address collision — the same IP recorded on two different devices.
  const byIp = new Map();
  for (const n of nodes || []) {
    for (const e of n.endpoints) {
      if (!byIp.has(e.ip)) byIp.set(e.ip, []);
      byIp.get(e.ip).push(n);
    }
  }
  for (const [ip, holders] of byIp.entries()) {
    const distinct = Array.from(new Set(holders.map((h) => h.id)));
    if (distinct.length > 1) {
      findings.push({
        id: `ip-collision-${ip}`,
        kind: 'ip-collision',
        severity: 'problem',
        title: `${ip} is recorded on ${distinct.length} devices`,
        detail: `${holders.map((h) => h.name).join(' · ')} — two rows cannot hold one address. One reading is stale.`,
      });
    }
  }

  // 2. A segment with no gateway ROW — the router interface was never read.
  for (const cidr of topology.routing.interfacesUnrecorded) {
    findings.push({
      id: `gateway-interface-${cidr}`,
      kind: 'gateway-interface-unrecorded',
      severity: 'attention',
      title: `No router interface recorded on ${cidr}`,
      detail: `The scan records the pfSense at ${RECORDED_GATEWAY_IP} as gateway/DHCP for both subnets, but its interface address ON ${cidr} was never read. Eyes-on at the firewall closes it.`,
    });
  }

  // 3. Unidentified network gear — the exact rows that keep wiring unknown.
  const unknownGear = (nodes || []).filter(
    (n) => n.deviceType === 'network' && n.smeNeeded && !n.confirmed,
  );
  for (const n of unknownGear) {
    findings.push({
      id: `unidentified-gear-${n.id}`,
      kind: 'unidentified-network-gear',
      severity: 'attention',
      title: `${n.name} — role not confirmed`,
      detail: `Seen on the scan at ${n.endpoints.map((e) => e.ip).join(', ') || 'no recorded address'}, but switch / AP / router is NOT established. Until this is identified the map stays layer-3: we know the addresses, not the cabling.`,
    });
  }

  // 4. Register rows carrying no address. Split by whether the type is an IP host
  //    at all: a missing management address is a GAP; a passive LED wall is not.
  for (const n of topology.unaddressed) {
    if (n.expectsAddress) {
      findings.push({
        id: `unaddressed-${n.id}`,
        kind: 'unaddressed-device',
        severity: 'attention',
        title: `${n.name} has no recorded address`,
        detail: 'An IP-managed device with no address on its row — the management address was never read, so the topology cannot place it on a segment.',
      });
    } else {
      findings.push({
        id: `off-network-${n.id}`,
        kind: 'off-network-by-design',
        severity: 'idle',
        title: `${n.name} is not an IP host`,
        detail: 'Driven over its own signal path (Cat6 to the receiving cards / a direct video feed), not addressed on the LAN. Correctly absent from the segments.',
      });
    }
  }

  // 5. Dual-homed hosts — structure worth knowing, not a defect.
  for (const d of topology.dualHomed) {
    findings.push({
      id: `dual-homed-${d.node.id}`,
      kind: 'dual-homed',
      severity: 'idle',
      title: `${d.node.name} bridges ${d.subnets.length} segments`,
      detail: `${d.subnets.join(' + ')} — one host with an interface on each. Traffic can reach it on either segment WITHOUT crossing the router, so a firewall rule written on one segment does not contain it. Worth knowing before anyone segments this network.`,
    });
  }

  // 5b. Group rows — one register row, several physical units.
  for (const g of topology.groupRows) {
    findings.push({
      id: `group-row-${g.node.id}`,
      kind: 'group-row',
      severity: 'idle',
      title: `${g.node.name} covers units on ${g.subnets.length} segments`,
      detail: `${g.subnets.join(' + ')} — one register row standing for several physical units, so this is a spread across segments, NOT a dual-homed host. Splitting it into per-unit rows would sharpen the map.`,
    });
  }

  // 6. A primary address field holding an OVERLAY address. Not wrong, but it means
  //    the row's headline address is a mesh address and the LAN truth is in specs.
  for (const n of nodes || []) {
    const primary = n.endpoints.find((e) => e.primary);
    if (primary && primary.plane === 'overlay' && n.endpoints.some((e) => e.plane === 'lan')) {
      findings.push({
        id: `overlay-as-primary-${n.id}`,
        kind: 'overlay-as-primary',
        severity: 'idle',
        title: `${n.name} leads with its tailnet address`,
        detail: `Its primary address is ${primary.ip} (overlay) while its LAN addresses sit in specs. The register reads mesh-first for this host.`,
      });
    }
  }

  // 7. Overlay-only hosts — no LAN address on the register.
  for (const o of topology.overlay.overlayOnly) {
    findings.push({
      id: `overlay-only-${o.node.id}`,
      kind: 'overlay-only',
      severity: 'idle',
      title: `${o.node.name} is mapped on the tailnet only`,
      detail: `Recorded at ${o.ips.map((e) => e.ip).join(', ')} with no LAN address on its row. Reachable over the mesh; its physical segment is not recorded here.`,
    });
  }

  const rank = { problem: 0, attention: 1, idle: 2 };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function summarizeTopology(topology, nodes) {
  const placed = new Set();
  for (const s of topology.subnets) for (const m of s.members) placed.add(m.node.id);
  const problems = topology.findings ? topology.findings.filter((f) => f.severity === 'problem').length : 0;
  return {
    segments: topology.subnets.length,
    recordedSegments: topology.subnets.filter((s) => !s.maskAssumed).length,
    placedDevices: placed.size,
    unplacedDevices: topology.unaddressed.filter((n) => n.expectsAddress).length,
    offNetworkByDesign: topology.unaddressed.filter((n) => !n.expectsAddress).length,
    overlayNodes: topology.overlay.nodes.length,
    dualHomed: topology.dualHomed.length,
    groupRows: topology.groupRows.length,
    totalDevices: (nodes || []).length,
    conflicts: problems,
    wiringKnown: topology.wiringKnown,
  };
}

// --- The eyes-on list --------------------------------------------------------
// What a single walk of the network closet would close, in the order it closes it.
// Derived from the findings, so it shrinks by itself as the register is corrected —
// it is never a hand-kept checklist that drifts from the data.
export function eyesOnQueue(topology) {
  return (topology.findings || [])
    .filter((f) => f.severity !== 'idle')
    .map((f) => ({ id: f.id, kind: f.kind, ask: f.title, why: f.detail }));
}
