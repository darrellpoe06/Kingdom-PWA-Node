// =============================================================================
// church-network-security — exposure assessment for the Love Corner network
// =============================================================================
// DERIVED from the device register + the derived topology. Every finding below
// points at REAL recorded devices and REAL recorded addresses; none is a generic
// checklist item, and none is padding.
//
// WHAT THIS IS, said plainly (DR-0076 / DR-0100):
//   These are EXPOSURES — the ways in that the recorded topology leaves open.
//   NOTHING here is evidence that the church has been breached. No intrusion is
//   recorded, and this module cannot detect one: it reads an asset register, not
//   traffic, not logs, not authentication attempts. Under-claiming a real exposure
//   would be as false as over-claiming a breach, so each finding states its
//   severity plainly AND states whether it is established from the record or still
//   needs an on-LAN check to confirm.
//
// THE GOVERNING DECISIONS this assessment is measured against:
//   DR-0003 — the church is ISO-2: doctrine-gated, Cage substrate as the floor.
//             Its NAS carries Church Plus + member data + monthly financial reports.
//   DR-0050 — decided data isolation AT THE VOLUME LEVEL (surveillance on its own
//             volume, separate from financial/member volumes) and kept the camera
//             backbone sovereign ONVIF PoE, with cloud-tied Wyze units SUPPLEMENTARY
//             only, to avoid vendor dependency.
//   The conformance gap this module exists to surface: those decisions isolate
//   STORAGE and keep the camera BACKBONE sovereign. Neither isolates the NETWORK.
//   On a flat segment, volume-level isolation does not stop lateral movement — an
//   attacker on the same L2 reaches the NAS's front door regardless of which
//   volume the data sits on.
//
// PURE (no React, no Supabase, no probes). The surface is the Network section of
// <ChurchInfraPlan /> — Projects > Church > Infra Plan, the Love Corner project
// section where the network/devices/media-AI-node plan already lives.
// =============================================================================

import { buildTopology } from './church-network-topology.js';

// Severity ladder. `tone` is a KpiDot tone.
export const SEVERITIES = [
  { id: 'critical', label: 'Critical', tone: 'problem',   rank: 0 },
  { id: 'high',     label: 'High',     tone: 'problem',   rank: 1 },
  { id: 'moderate', label: 'Moderate', tone: 'attention', rank: 2 },
  { id: 'watch',    label: 'Watch',    tone: 'idle',      rank: 3 },
];
export const SEVERITY_IDS = SEVERITIES.map((s) => s.id);
export function severityTone(id) {
  return (SEVERITIES.find((s) => s.id === id) || {}).tone || 'idle';
}
export function severityRank(id) {
  const s = SEVERITIES.find((x) => x.id === id);
  return s ? s.rank : 99;
}
export function severityLabel(id) {
  return (SEVERITIES.find((s) => s.id === id) || {}).label || id;
}

// Device classes that ship with well-known vendor defaults and unauthenticated
// admin surfaces often enough that their PRESENCE on a flat segment is itself the
// exposure. This is an established fact about the device class, not a claim about
// these specific units — which is exactly why each finding says what to verify.
const DEFAULT_CRED_TYPES = ['printer', 'security', 'camera'];

function named(nodes) {
  return nodes.map((n) => n.name).join(' · ');
}
function addressesOf(member) {
  return member.ips.map((e) => e.ip).join(', ');
}

// assessNetworkSecurity — the whole derivation. Pass the merged register; the
// topology is derived internally (or supplied, to avoid rebuilding it).
export function assessNetworkSecurity(devices, topologyIn) {
  const topology = topologyIn || buildTopology(devices);
  const findings = [];

  const allMembers = [];
  for (const sub of topology.subnets) {
    for (const m of sub.members) allMembers.push({ ...m, cidr: sub.cidr });
  }
  const typeOn = (cidr, types) => allMembers.filter(
    (m) => m.cidr === cidr && types.includes(m.node.deviceType),
  );

  // --- 1. The data estate shares a segment with consumer IoT --------------------
  // The decisive one. DR-0050 put surveillance on its own VOLUME; that does nothing
  // about an Echo and a NAS full of member and financial records answering on the
  // same broadcast domain.
  for (const sub of topology.subnets) {
    const dataHosts = typeOn(sub.cidr, ['nas', 'server']);
    const iotHosts = typeOn(sub.cidr, ['iot']);
    if (dataHosts.length > 0 && iotHosts.length > 0) {
      findings.push({
        id: `flat-data-iot-${sub.cidr}`,
        class: 'flat-segment-data-and-iot',
        severity: 'critical',
        title: `Member/financial storage shares ${sub.cidr} with consumer cloud IoT`,
        evidence: `Storage: ${named(dataHosts.map((m) => m.node))}. Consumer IoT on the same segment: ${named(iotHosts.map((m) => m.node))}.`,
        why: 'The church NAS carries Church Plus, member records and monthly financial reports (DR-0050). Cloud-tied consumer devices are the least patchable, least auditable class on the network and phone home by design. On one flat segment, any one of them that is compromised has an unfiltered L2 path to the storage front door — volume-level isolation never sees that traffic.',
        fix: 'Put the data estate on its own VLAN and let nothing reach it but the hosts that must. IoT belongs on an isolated guest/IoT VLAN with no route to storage.',
        governs: 'DR-0003 (ISO-2) · DR-0050 (isolation decided at the volume, not the network)',
        established: true,
      });
    }
  }

  // --- 2. A dual-homed host bridges the two segments ---------------------------
  // Whatever the firewall enforces BETWEEN segments, a host with a foot on each
  // simply carries traffic across. This is the single most under-appreciated fact
  // on the map, and the topology derives it from two recorded addresses.
  for (const d of topology.dualHomed) {
    findings.push({
      id: `bridge-${d.node.id}`,
      class: 'segmentation-bypass',
      severity: 'high',
      title: `${d.node.name} bridges ${d.subnets.join(' and ')}`,
      evidence: `One host with an interface on each segment (${d.node.endpoints.filter((e) => e.plane === 'lan').map((e) => e.ip).join(' + ')}).`,
      why: 'Every firewall rule the gateway enforces between these two segments is bypassed by this one machine. Compromise it and the attacker is on both segments at once, having crossed nothing. It is also a livestream host — internet-facing software, running during services, with a foot in both halves of the church network.',
      fix: 'Decide which segment this host belongs on and disable the other interface (typically: keep the wired link, turn off Wi-Fi). If both are genuinely needed, the host must be treated as a firewall and hardened as one.',
      governs: 'DR-0003 (Cage floor) · DR-0012 (this is a live-production node)',
      established: true,
    });
  }

  // --- 3. Cloud-tied always-listening devices in the building -------------------
  const iotAll = allMembers.filter((m) => m.node.deviceType === 'iot');
  if (iotAll.length > 0) {
    findings.push({
      id: 'cloud-iot-present',
      class: 'cloud-tied-always-on',
      severity: 'high',
      title: `${iotAll.length} consumer cloud device row(s) on the church LAN`,
      evidence: iotAll.map((m) => `${m.node.name} (${m.cidr})`).join(' · '),
      why: 'These are always-on, vendor-controlled endpoints — several with microphones — inside the building, updating on the vendor\'s schedule and reachable by the vendor at will. That is the exact dependency the sovereign-first posture exists to remove, and it sits beside the production and data estate.',
      fix: 'Isolated IoT VLAN with egress-only rules, or remove them from the sanctuary and office segments entirely. Sanctuary microphones in particular deserve a deliberate decision, not an inherited one.',
      governs: 'DR-0050 (cloud-tied units stay SUPPLEMENTARY to keep the backbone sovereign)',
      established: true,
    });
  }

  // --- 4. Unidentified network gear = unmeasurable attack surface --------------
  // A group row (the possible UniFi pair) holds addresses on BOTH segments, so it
  // appears once per segment in allMembers. Collapse to ONE finding per DEVICE that
  // names every segment it touches — a duplicate finding is noise, and a duplicate
  // React key silently drops a render. Caught by the infra-plan render test.
  const unknownGearByDevice = new Map();
  for (const m of allMembers) {
    const n = m.node;
    if (!(n.deviceType === 'network' && n.smeNeeded && !n.confirmed)) continue;
    if (!unknownGearByDevice.has(n.id)) unknownGearByDevice.set(n.id, { node: n, places: [] });
    unknownGearByDevice.get(n.id).places.push({ cidr: m.cidr, ips: addressesOf(m) });
  }
  for (const g of unknownGearByDevice.values()) {
    const m = { node: g.node };
    const spans = g.places.length > 1;
    findings.push({
      id: `unknown-gear-${m.node.id}`,
      class: 'unidentified-infrastructure',
      severity: spans ? 'critical' : 'high',
      title: spans
        ? `${m.node.name} — unidentified gear on BOTH segments`
        : `${m.node.name} — unidentified gear carrying traffic`,
      evidence: `Answering at ${g.places.map((p) => `${p.ips} (${p.cidr})`).join(' and ')}; role (switch / access point / router) never confirmed.`,
      why: spans
        ? 'Unidentified gear answering on BOTH segments is the worst case: whatever it is, it already spans the boundary the firewall is supposed to enforce. If it is an access point it may be bridging the two segments over the air AND extending this network past the walls on defaults nobody has ever read — which would silently undo any segmentation built above it. Its admin interface, firmware age and credentials are all unknown.'
        : 'Unidentified gear cannot be patched, credentialed or trusted. If it is an access point, it may be extending this network into the parking lot on defaults nobody has ever read. Its admin interface, firmware age and credentials are all unknown.',
      fix: 'Physically identify each unit at the closet, read its model and firmware, change its admin credentials, and confirm whether it bridges segments or broadcasts an SSID.',
      governs: 'DR-0076 (no claim without evidence — this gear is pure unknown)',
      established: true,
    });
  }

  // --- 5. Device classes that ship on vendor defaults ---------------------------
  const defaultCredHosts = allMembers.filter((m) => DEFAULT_CRED_TYPES.includes(m.node.deviceType));
  if (defaultCredHosts.length > 0) {
    const unsure = defaultCredHosts.filter(
      (m) => typeof m.node.name === 'string' && !m.node.confirmed,
    );
    findings.push({
      id: 'default-credential-classes',
      class: 'vendor-default-credentials',
      severity: 'high',
      title: `${defaultCredHosts.length} camera / printer / security endpoint(s) exposed on the LAN`,
      evidence: defaultCredHosts.map((m) => `${m.node.name} (${addressesOf(m)})`).join(' · '),
      why: 'IP cameras answering PSIA/CGI, PTZ cameras with SSH enabled, and network MFPs are the three classes most reliably found on factory credentials with unauthenticated web admin. A printer is a quiet foothold — it is never patched, rarely monitored, and speaks to everything. A camera on defaults hands over the sanctuary\'s video.',
      fix: 'Read the admin credentials on every one of these endpoints, change any that are factory, disable SSH on the PTZ cameras unless it is genuinely used, and put the whole camera estate on its own VLAN with no outbound internet.',
      governs: 'DR-0050 (sovereign ONVIF backbone) · DR-0003 (Cage floor)',
      established: false, // the CLASS risk is established; these units need an on-LAN credential check
      verify: `Credential and firmware check required on: ${unsure.map((m) => m.node.name).join(', ') || 'all listed endpoints'}.`,
    });
  }

  // --- 6. Cross-site overlay: the blast radius spans two buildings --------------
  if (topology.overlay.nodes.length > 0) {
    findings.push({
      id: 'cross-site-overlay',
      class: 'cross-site-blast-radius',
      severity: 'moderate',
      title: 'The tailnet joins the church and the home network',
      evidence: `${topology.overlay.nodes.length} church host(s) on ${topology.overlay.cidr}: ${named(topology.overlay.nodes.map((o) => o.node))}.`,
      why: 'The overlay is the right call for sovereignty — it links the sites without opening a single inbound port. But it also means a compromise on either side is a compromise of both unless the mesh itself is restricted. By default a tailnet is flat: every node can reach every other node.',
      fix: 'Write tailnet ACLs so each node reaches only what it must (the build node does not need the church cameras; a phone does not need the NAS admin port), and confirm key expiry is enforced rather than disabled.',
      governs: 'DR-0003 (three entities, three isolation tiers — the mesh must not flatten them)',
      established: true,
    });
  }

  // --- 7. An unmanaged control path to the sanctuary wall -----------------------
  const unmanagedProcessors = topology.unaddressed.filter(
    (n) => n.deviceType === 'led-processor' && n.expectsAddress,
  );
  for (const n of unmanagedProcessors) {
    findings.push({
      id: `unmanaged-control-${n.id}`,
      class: 'unmanaged-control-path',
      severity: 'moderate',
      title: `${n.name} is driven over USB from the booth laptop, with no management address`,
      evidence: 'No management IP was found for this processor on the LAN scan; control is via NovaLCT over USB from the booth machine.',
      why: 'The whole sanctuary wall depends on one laptop and one cable. That is a single point of failure mid-service, and it makes the booth laptop the sole control path to what the congregation sees — with no network-side audit of who changed what.',
      fix: 'Read or assign the processor\'s LAN management address, then put it on the production VLAN with access restricted to the booth. Keep USB as the documented fallback.',
      governs: 'DR-0076 (the address was never read — the gap is recorded, not guessed)',
      established: true,
    });
  }

  // --- 8. Firmware/model unknowns across the estate -----------------------------
  const unsureModels = allMembers.filter(
    (m) => typeof m.node.name === 'string' && m.node.smeNeeded && m.node.deviceType !== 'network',
  );
  if (unsureModels.length > 0) {
    findings.push({
      id: 'firmware-unknown-estate',
      class: 'unknown-firmware-posture',
      severity: 'watch',
      title: `${unsureModels.length} placed device(s) carry an unread make/model`,
      evidence: named(unsureModels.map((m) => m.node)),
      why: 'An unread model is also an unread firmware version. Nobody can say whether any of these carry a known published vulnerability, because nobody has recorded what they are. This is not an alarm; it is the reason an alarm could never be raised.',
      fix: 'Record make, model and firmware for each on the same closet walk that identifies the network gear. The register already flags every one of them honestly.',
      governs: 'DR-0076 (honest SME-pending beats a fabricated spec)',
      established: true,
    });
  }

  findings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  return {
    findings,
    summary: summarizeExposure(findings),
    // Said once, prominently, so the surface can never imply more than it knows.
    scope: {
      isIntrusionEvidence: false,
      statement: 'This reads the asset register and the derived topology. It does not read traffic, logs or authentication attempts, so it can show where the network is OPEN — it cannot show whether anyone has walked through. No intrusion is recorded.',
      needsOnLan: findings.filter((f) => f.established === false).map((f) => f.id),
    },
  };
}

export function summarizeExposure(findings) {
  const bySeverity = {};
  for (const id of SEVERITY_IDS) bySeverity[id] = 0;
  for (const f of findings || []) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  return {
    total: (findings || []).length,
    bySeverity,
    critical: bySeverity.critical || 0,
    high: bySeverity.high || 0,
    // The headline: how many need someone standing on the LAN to confirm.
    needsOnLanCheck: (findings || []).filter((f) => f.established === false).length,
  };
}

// The one structural change that closes the most findings at once. Derived, so it
// only claims what the findings actually support.
export function topRemediation(assessment) {
  const classes = new Set((assessment.findings || []).map((f) => f.class));
  const steps = [];
  if (classes.has('flat-segment-data-and-iot') || classes.has('cloud-tied-always-on')) {
    steps.push({
      step: 'Segment the network into VLANs',
      closes: 'flat data+IoT exposure, cloud-IoT adjacency, and most camera/printer lateral movement',
      detail: 'Four zones on the pfSense: DATA (NAS, records), PRODUCTION (AV, GPU nodes, wall, cameras), OFFICE (workstations, printers), IOT/GUEST (consumer devices, Wi-Fi). Default-deny between zones; open only the specific flows production actually needs.',
    });
  }
  if (classes.has('segmentation-bypass')) {
    steps.push({
      step: 'Close the bridge host',
      closes: 'the segmentation bypass that would defeat the VLANs above',
      detail: 'Disable the second interface on the dual-homed livestream host. Doing the VLAN work while this host still bridges both segments buys nothing.',
    });
  }
  if (classes.has('unidentified-infrastructure')) {
    steps.push({
      step: 'Identify every unit in the closet',
      closes: 'the unmeasurable attack surface and any rogue access point',
      detail: 'Model, firmware, admin credentials, and whether it broadcasts an SSID or bridges segments — for each unidentified unit.',
    });
  }
  if (classes.has('vendor-default-credentials')) {
    steps.push({
      step: 'Credential sweep on cameras, printers and security endpoints',
      closes: 'the vendor-default foothold class',
      detail: 'Change every factory credential; disable SSH on the PTZ cameras unless it is in real use.',
    });
  }
  return steps;
}
