// =============================================================================
// infrastructure-sops — the POV Sequence / SOP Library for the build team
// =============================================================================
// The Infrastructure course's counterpart to broadcast-sops.js. Each real build/
// operate procedure on BOTH stacks (the home sovereign stack + the church/COLG
// stack) gets recorded first-person with the smart glasses and paired with a
// written step-checklist — so the next builder can run with it, and so a 10-year-old
// (Christian) can watch the real thing being done.
//
// REUSE (not duplication): the capture/processing pipeline + the consent line + the
// Markdown exporter are the SAME ones the broadcast course uses (broadcast-sops.js).
// This file only authors the infrastructure SEQUENCES. The glasses, the sovereign
// NAS ingest, the local-LLM transcription, and the no-congregation consent bright
// line are identical.
//
// REALITY-TRACE (DR-0076): the clips do NOT exist yet — every clip is
// status:'pending-capture' with no fake media URL. What IS real today is the
// authored checklist (the real procedure) and the reserved one-clip-per-sequence
// structure. When a real clip lands on the sovereign store, set clip.status and src.
// =============================================================================
import { SOP_CAPTURE_PIPELINE, sopLibraryMarkdown } from './broadcast-sops.js';

// Re-export so the host wires ONE import for the infrastructure course too.
export { SOP_CAPTURE_PIPELINE, sopLibraryMarkdown };

const pendingClip = (note = '') => ({
  status: 'pending-capture',
  src: null,
  capturedAt: null,
  transcriptIndexed: false,
  note: note || 'POV clip not captured yet — pending the smart-glasses capture.',
});

export const INFRA_SOP_SEQUENCES = [
  {
    id: 'inf-sop-nas-powerup',
    station: 'Home NAS',
    owner: 'Darrell (with Christian)',
    title: 'Powering up and health-checking the Synology NAS',
    why: 'The NAS is the brain and the barn of the home stack — services and the family’s data live on it. Capture the calm, correct power-up and health check so a newcomer (or Christian) can confirm it’s healthy without guessing.',
    steps: [
      'Confirm power and network are connected before pressing the power button.',
      'Power on; watch the front status light come up healthy (not amber/red).',
      'Sign in to DSM and check System Health: storage, temperature, and that no drive shows a warning.',
      'Confirm the key services are running (n8n, Ollama, Drive/Chat/Photos).',
      'Note anything off for follow-up. Never pull a drive while it is running.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-raid-drive-swap',
    station: 'Storage / RAID',
    owner: 'Darrell (with a parent supervising any child)',
    title: 'Replacing a failed drive without losing data',
    why: 'Disks fail; RAID is what lets the family NOT lose data when one does. Capture the exact, careful swap so a degraded array gets repaired right — the highest-stakes routine on the box.',
    steps: [
      'In DSM Storage Manager, confirm WHICH bay is degraded before touching anything.',
      'Verify a current backup exists (ISO-2 offsite) before starting — never rely on the array alone mid-repair.',
      'Remove ONLY the identified failed drive; insert the matching replacement firmly into that bay.',
      'Start the repair/rebuild and let it finish completely — do not power-cycle during a rebuild.',
      'Confirm the array returns to Healthy and the backup job still runs green.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-gateway-vlan',
    station: 'Network gateway',
    owner: 'Darrell',
    title: 'Bringing up the UniFi UCG-Max and its VLAN walls',
    why: 'The gateway is the front door AND the interior walls of the whole network. Capture how the VLAN segments (family, COLG, TLC, Poe Properties, PoeTech) are set so each stays walled off from the others.',
    steps: [
      'Confirm the WAN (internet) cable in and the LAN cables out, and that the gateway is adopted in UniFi.',
      'Verify each VLAN exists and is mapped to its purpose (family / COLG / TLC / Properties / PoeTech).',
      'Confirm devices land on the RIGHT VLAN and cannot reach a VLAN they shouldn’t.',
      'Check the reverse-proxy / friendly DNS names resolve to the NAS services.',
      'Document any change; a wall you can’t explain is a wall you can’t trust.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-remote-access',
    station: 'Remote access',
    owner: 'Darrell (with Christian)',
    title: 'Onboarding a device to remote access (Tailscale / WireGuard)',
    why: 'Reaching the stack from anywhere — safely — is what makes it usable on the road without exposing the front door to the world. Capture how a new device is added and verified.',
    steps: [
      'Install the access client and sign in with the correct identity.',
      'Confirm the device appears as an online node and can reach the NAS over the private path.',
      'Verify it canNOT reach anything it shouldn’t (least access for the role).',
      'For a client/contractor/tenant, use the WireGuard path, NOT the family tailnet.',
      'Remove the device cleanly when access is no longer needed.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-local-model',
    station: 'Local A.I.',
    owner: 'Darrell',
    title: 'Pulling and running a local model on the NAS (Ollama)',
    why: 'The local A.I. is sovereign — the family’s and church’s content never goes to a vendor cloud. Capture how a model is pulled and served, and how to confirm it’s actually answering locally.',
    steps: [
      'Confirm the box has the RAM headroom for the model size you’re pulling (CPU-only ceiling).',
      'Pull the open-weights model with Ollama and confirm it loaded.',
      'Send a test prompt and confirm the reply comes from the LOCAL model, not a vendor.',
      'Confirm any automation that uses it has its three brakes (budget, single-instance lock, kill-switch).',
      'Watch resource use; never leave a model pinned/looping unattended.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-backup-verify',
    station: 'Backups',
    owner: 'Darrell',
    title: 'Verifying the offsite (ISO-2) encrypted backup',
    why: 'A backup you’ve never restored is a hope, not a backup. Capture the routine that proves the encrypted offsite copy on the church NAS is real, current, and restorable.',
    steps: [
      'Confirm the backup job ran on schedule and reported success (not just "configured").',
      'Confirm the offsite copy on the church NAS is the encrypted sealed blob (isolation walls hold both ways).',
      'Do a test restore of a small file and confirm it comes back intact.',
      'Confirm the 3-2-1 shape still holds (3 copies, 2 media, 1 offsite).',
      'Log the verification date so the next check knows the last good restore.',
    ],
    clip: pendingClip(),
  },
  {
    id: 'inf-sop-church-nas-build',
    station: 'Church (COLG) NAS',
    owner: 'The build team',
    founding: true,
    title: 'The COLG sovereign NAS build',
    why: 'COLG is the first community we serve. Its sovereign box doesn’t fully exist yet — capturing the build as it happens turns a one-time effort into a repeatable SOP for the next church in the same situation.',
    steps: [
      'Health-check the church NAS hardware and confirm it’s powered, networked, and reachable.',
      'Stand up the sovereign services the church needs (storage, the local services spine).',
      'Wire the encrypted backup relationship with the home stack (ISO-2, sealed blob only).',
      'Confirm member/financial data stays staff-gated and walled per the isolation rules.',
      'Document every step so another church’s build is a checklist, not a mystery.',
    ],
    clip: pendingClip('A founding sequence for the church stack — captured so the next church can follow it. Pending the smart-glasses capture.'),
  },
  {
    id: 'inf-sop-videowall-machines',
    station: 'Church video wall machines',
    owner: 'The build team',
    title: 'Bringing up the church’s RTX 4070 wall machines',
    why: 'The left and right RTX 4070 machines drive the Sanctuary video wall and are the church’s real GPU capacity. Capture the power-up + verification order so the wall comes up correctly and the GPUs are doing the work.',
    steps: [
      'Power up in order: displays, then the left and right machines, then the signal source.',
      'Confirm each machine outputs to its screen and the GPU (not just the CPU) carries the display.',
      'Confirm the broadcast feed reaches the wall and matches what the room sees (ties to The Broadcast course).',
      'Check network (Cat6) and storage (NVMe) are healthy before relying on the wall live.',
      'Note these GPUs as the church’s candidate for future local A.I. work when the wall is idle.',
    ],
    clip: pendingClip(),
  },
];

// Live summary of the infra library (real counts, not painted).
export function infraSopSummary(sequences = INFRA_SOP_SEQUENCES) {
  const total = sequences.length;
  const captured = sequences.filter((s) => s.clip && s.clip.status === 'captured').length;
  return { total, captured, pending: total - captured };
}
