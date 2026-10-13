// =============================================================================
// church-network-remediation - the ordered plan to PATCH the Love Corner network
// =============================================================================
// Darrell, 2026-09-18: "learn all the devices that we have on our network, see
// what's not connected, see what potential security breaches are, and then patch
// everything so everything's working just fine."
//
// This is the fourth step. The assessment says what is wrong; this says what to do
// about it, IN AN ORDER THAT CANNOT BREAK A SERVICE.
//
// THE ORDERING RULE, which is the whole point of this module:
//   A church network is not a lab. The livestream runs on it, the sanctuary wall is
//   driven across it, and the congregation is in the room on Sunday and Wednesday.
//   A VLAN applied in the wrong order takes the stream down mid-service - which is
//   a worse outcome than the exposure it was fixing (the DR-0107 principle: a down
//   surface outranks the improvement that took it down).
//   So every step carries:
//     - reversibility  : can this be undone in seconds, or is it a re-cable?
//     - blastRadius    : what stops working if it goes wrong?
//     - window         : anytime / off-service / maintenance-window-only
//     - dependsOn      : steps that MUST land first or this one accomplishes nothing
//     - rollback       : the exact way back
//     - verifies       : what PROVES it worked (never "it should be fine")
//   and the plan is sorted so that zero-risk reads come first, reversible changes
//   next, and anything that can interrupt a service last and inside a window.
//
// PURE. Derived from the assessment, so the plan shrinks as findings are closed and
// can never list work for an exposure that no longer exists.
// =============================================================================

import { assessNetworkSecurity } from './church-network-security.js';
import { buildTopology } from './church-network-topology.js';

export const WINDOWS = [
  { id: 'anytime',    label: 'Any time',                 note: 'No service impact. A read, or a change contained to one non-production device.' },
  { id: 'off-service', label: 'Outside service hours',   note: 'Brief interruption possible. Never during Sunday or Wednesday service, and never while the stream is live (DR-0012).' },
  { id: 'maintenance', label: 'Planned maintenance window', note: 'Will interrupt the network. Schedule it, tell the media team, and have the rollback open before starting.' },
];

export const REVERSIBILITY = [
  { id: 'read-only',  label: 'Read only',        note: 'Changes nothing. Cannot break anything.' },
  { id: 'instant',    label: 'Reversible in seconds', note: 'One setting; undo is the same setting back.' },
  { id: 'config',     label: 'Reversible from a saved config', note: 'Export the running config FIRST; restore is a file upload.' },
  { id: 'physical',   label: 'Requires hands on the hardware', note: 'A re-cable or a port move. Reversing it means going back to the closet.' },
];

function step(p) {
  return {
    id: p.id,
    title: p.title,
    why: p.why,
    closes: p.closes || [],
    window: p.window,
    reversibility: p.reversibility,
    blastRadius: p.blastRadius,
    dependsOn: p.dependsOn || [],
    actions: p.actions || [],
    rollback: p.rollback,
    verifies: p.verifies,
    order: p.order,
  };
}

// buildRemediationPlan - every step is generated ONLY if the finding that justifies
// it is actually present. No generic hardening checklist.
export function buildRemediationPlan(devices, assessmentIn, topologyIn) {
  const topology = topologyIn || buildTopology(devices);
  const assessment = assessmentIn || assessNetworkSecurity(devices, topology);
  const classes = new Set(assessment.findings.map((f) => f.class));
  const steps = [];

  // --- PHASE 1: READ. Nothing changes; everything becomes knowable. -----------
  if (classes.has('unidentified-infrastructure')) {
    steps.push(step({
      id: 'identify-gear',
      order: 10,
      title: 'Identify every unnamed device in the network closet',
      why: 'Nothing else can be planned safely while gear carrying traffic is unidentified. A VLAN design drawn over an unknown switch is a guess, and an unknown access point can undo the whole design over the air.',
      closes: ['unidentified-infrastructure', 'unknown-firmware-posture'],
      window: 'anytime',
      reversibility: 'read-only',
      blastRadius: 'None. Reading labels and admin pages changes nothing.',
      actions: [
        'Match each unidentified address to a physical unit using its MAC vendor prefix from the scan.',
        'Read the model number off the label and the firmware version off its admin page.',
        'Establish for each: is it a switch, an access point, or a router? Does it broadcast an SSID? Does it carry both subnets?',
        'Record each answer on its register row so the map stops guessing.',
      ],
      rollback: 'Not applicable - nothing is changed.',
      verifies: 'Every network-type row on the register carries a real make, model and role, and no row is left at needs-eyes-on.',
    }));
  }

  if (classes.has('unmanaged-control-path')) {
    steps.push(step({
      id: 'read-processor-address',
      order: 20,
      title: 'Read or assign the LED processor management address',
      why: 'The sanctuary wall currently depends on one laptop and one USB cable, with no network-side control or audit. That is a single point of failure in front of the congregation.',
      closes: ['unmanaged-control-path'],
      window: 'off-service',
      reversibility: 'instant',
      blastRadius: 'The wall. Do this with the wall idle, never mid-service.',
      actions: [
        'Read the VX1000 management address from its front panel or NovaLCT.',
        'If none is configured, assign a static address on the production segment and record it.',
        'Keep the USB path as the documented fallback - it is the proven one.',
      ],
      rollback: 'Clear the assigned address; USB control is unaffected throughout.',
      verifies: 'The processor answers on its management address from the booth, AND the USB path still drives the wall.',
    }));
  }

  // --- PHASE 2: CONTAIN. Reversible changes that shrink the blast radius. -----
  if (classes.has('vendor-default-credentials')) {
    steps.push(step({
      id: 'credential-sweep',
      order: 30,
      title: 'Credential sweep on every camera, printer and security endpoint',
      why: 'These are the classes most reliably found on factory credentials. This is the highest value per minute of any step here, and it needs no topology change at all.',
      closes: ['vendor-default-credentials'],
      window: 'off-service',
      reversibility: 'instant',
      blastRadius: 'One device at a time. A wrong password locks out an admin, not the congregation. Record each new credential BEFORE applying it.',
      dependsOn: [],
      actions: [
        'For each endpoint: attempt the vendor default. If it works, that device was open - change it immediately and note it.',
        'Set a unique credential per device, stored in the church password record, never a shared one.',
        'Disable SSH on the PTZ cameras unless the media team actually uses it.',
        'Disable any plaintext admin (telnet, HTTP) where the device also offers HTTPS.',
      ],
      rollback: 'Restore the previous credential from the record. Keep the record open during the sweep.',
      verifies: 'No endpoint accepts a vendor default, and every device is still reachable by its intended operator.',
    }));
  }

  if (classes.has('segmentation-bypass')) {
    const bridges = topology.dualHomed.map((d) => d.node.name).join(', ');
    steps.push(step({
      id: 'close-bridge',
      order: 40,
      title: `Close the segment bridge (${bridges || 'dual-homed host'})`,
      why: 'This must land BEFORE segmentation, not after. A host with a foot on each segment carries traffic across whatever the firewall enforces - so building VLANs while it still bridges buys nothing.',
      closes: ['segmentation-bypass'],
      window: 'off-service',
      reversibility: 'instant',
      blastRadius: 'The livestream host loses one of two paths. Confirm the remaining path carries the stream BEFORE the next service.',
      dependsOn: ['identify-gear'],
      actions: [
        'Decide which interface this host should keep - normally the wired one, for stream stability.',
        'Disable the other interface (typically Wi-Fi) in the adapter settings.',
        'Confirm the streaming software, the NDI sources and the NAS are all still reachable on the remaining path.',
      ],
      rollback: 'Re-enable the disabled adapter. Seconds, and entirely local to that machine.',
      verifies: 'The host answers on exactly one segment, and a full stream rehearsal succeeds on the remaining interface.',
    }));
  }

  // --- PHASE 3: SEGMENT. The structural fix, and the one that can hurt. -------
  if (classes.has('flat-segment-data-and-iot') || classes.has('cloud-tied-always-on')) {
    steps.push(step({
      id: 'segment-vlans',
      order: 50,
      title: 'Segment the network into four zones on the pfSense',
      why: 'This is the structural fix that closes the most exposure at once. It is also the one that can take the church off the air, which is why it lands only after the gear is identified and the bridge is closed.',
      closes: ['flat-segment-data-and-iot', 'cloud-tied-always-on'],
      window: 'maintenance',
      reversibility: 'config',
      blastRadius: 'EVERYTHING. A wrong rule can drop the stream, the wall, the NAS, or the office at once. Export the pfSense config FIRST, and keep console access to the firewall.',
      dependsOn: ['identify-gear', 'close-bridge'],
      actions: [
        'Export the running pfSense configuration and verify the file before touching anything.',
        'Define four zones: DATA (NAS, member and financial records) · PRODUCTION (AV, GPU nodes, wall, stage cameras) · OFFICE (workstations, printers) · IOT-GUEST (consumer devices, guest Wi-Fi).',
        'Default-deny between zones. Then open ONLY the flows production actually needs - enumerate them from the signal chain before writing a single allow rule.',
        'Give IOT-GUEST egress only, with no route to DATA or PRODUCTION.',
        'Move one zone at a time, verifying after each. Never all four in one change.',
        'Do a full stream rehearsal before the first service on the new layout.',
      ],
      rollback: 'Restore the exported configuration. This is why the export is step one and not an afterthought.',
      verifies: 'A host on IOT-GUEST cannot reach the NAS. The stream, the wall and the stage cameras all work in a full rehearsal. Every zone move was verified before the next began.',
    }));
  }

  if (classes.has('cross-site-blast-radius')) {
    steps.push(step({
      id: 'tailnet-acls',
      order: 60,
      title: 'Write tailnet ACLs so the mesh stops being flat',
      why: 'The overlay is the right call for sovereignty - it links the sites with no inbound port open. But a default tailnet lets every node reach every other node, so a compromise on either side is a compromise of both.',
      closes: ['cross-site-blast-radius'],
      window: 'anytime',
      reversibility: 'instant',
      blastRadius: 'Remote access only. A wrong ACL locks out remote administration; it cannot affect anything in the building. Keep local access available while editing.',
      actions: [
        'Write an ACL granting each node only what it must reach - a build node does not need the church cameras; a phone does not need the NAS admin port.',
        'Confirm key expiry is enforced rather than disabled.',
        'Test from each node after applying, before relying on it.',
      ],
      rollback: 'Restore the previous ACL document. It is a single versioned file.',
      verifies: 'Each node reaches exactly what its ACL grants and nothing more, proven by testing from the node itself, not by reading the policy.',
    }));
  }

  steps.sort((a, b) => a.order - b.order);

  return {
    steps,
    summary: {
      total: steps.length,
      anytime: steps.filter((s) => s.window === 'anytime').length,
      offService: steps.filter((s) => s.window === 'off-service').length,
      maintenance: steps.filter((s) => s.window === 'maintenance').length,
      readOnly: steps.filter((s) => s.reversibility === 'read-only').length,
      startHere: steps.length > 0 ? steps[0].id : null,
    },
    // Said once, at the top, because it governs the whole plan.
    principle: 'Ordered so nothing that can interrupt a service runs before the reads and reversible changes that make it safe. A dark sanctuary is a worse outcome than the exposure the change was closing.',
  };
}

// Dependency integrity: a plan that lists a step before something it depends on is
// a broken plan, and would be followed straight into an outage.
export function validatePlan(plan) {
  const errors = [];
  const seen = new Set();
  for (const s of plan.steps || []) {
    for (const dep of s.dependsOn || []) {
      if (!seen.has(dep)) {
        const present = (plan.steps || []).some((x) => x.id === dep);
        if (present) errors.push(`"${s.id}" is ordered before its dependency "${dep}"`);
      }
    }
    seen.add(s.id);
  }
  for (const s of plan.steps || []) {
    if (!s.rollback) errors.push(`"${s.id}" has no rollback`);
    if (!s.verifies) errors.push(`"${s.id}" has no verification`);
    if (!WINDOWS.some((w) => w.id === s.window)) errors.push(`"${s.id}" has an unknown window`);
    if (!REVERSIBILITY.some((r) => r.id === s.reversibility)) errors.push(`"${s.id}" has an unknown reversibility`);
  }
  return { ok: errors.length === 0, errors };
}
