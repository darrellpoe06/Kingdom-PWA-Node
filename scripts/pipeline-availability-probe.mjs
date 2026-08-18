#!/usr/bin/env node
// =============================================================================
// pipeline-availability-probe — read the tailnet's own view of the fleet
// =============================================================================
// Darrell 2026-08-14: "we need to come up with obstacles to turning off anything
// or device we use for this pipeline..."
//
// Every obstacle in infra/device-availability/RUNBOOK.md is a claim until
// something watches. This is the watching, and it is deliberately CHEAP: one
// `tailscale status --json` gives the coordination server's own online/offline
// view of every peer — the same view Darrell reads on his phone. No per-node
// traffic, no SSH, no credential on any church device, nothing that could wake
// or disturb a box during a service.
//
// Reads that JSON on stdin, matches peers to the declared fleet
// (infra/device-availability/pipeline-nodes.json) by hostname AND tailnet IP,
// and runs the pure classifier in app/src/lib/pipeline-availability.js.
//
// EXIT CODES
//   0 — no incident (includes "dark but allowed to be dark", and includes
//       unverified: a runner that could not join the tailnet is a RUNNER fault,
//       not a church-device fault, and conflating them earns the mute that
//       kills a gate — see the test file).
//   1 — at least one node declared always-on was measured DOWN.
//   2 — the input was unusable (bad/empty JSON). Loud, and never silently 0.
//
// Usage:
//   tailscale status --json | node scripts/pipeline-availability-probe.mjs
//   node scripts/pipeline-availability-probe.mjs --file status.json
// =============================================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assessFleet, declaredNodes, formatFleetReport } from '../app/src/lib/pipeline-availability.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const MANIFEST_PATH = join(ROOT, 'infra', 'device-availability', 'pipeline-nodes.json');

/** Read every peer (and Self) out of `tailscale status --json`. */
export function peersFromTailscaleStatus(status) {
  const out = [];
  const push = (p) => {
    if (!p || typeof p !== 'object') return;
    const host = String(p.HostName || p.DNSName || '').split('.')[0].toLowerCase();
    const ips = Array.isArray(p.TailscaleIPs) ? p.TailscaleIPs.map(String) : [];
    // `Online` is the coordination server's view. Self has no Online field —
    // if we are reading its status at all, it is up.
    const online = p.Online === true;
    out.push({ host, ips, online });
  };
  if (status && status.Self) push({ ...status.Self, Online: true });
  const peers = status && status.Peer && typeof status.Peer === 'object' ? Object.values(status.Peer) : [];
  for (const p of peers) push(p);
  return out;
}

/**
 * Map the declared fleet onto the peers.
 * A node matches by hostname OR by tailnet IP — hostnames get renamed, and
 * matching on only one key is how a renamed box silently reads as "missing"
 * (which would then read as unverified forever, a quiet blind spot).
 */
export function probesFromPeers(manifest, peers) {
  const probes = {};
  for (const n of declaredNodes(manifest)) {
    const hit = peers.find((p) => p.host === n.slug.toLowerCase())
      || peers.find((p) => n.tailnetIp && p.ips.includes(n.tailnetIp));
    // Absent from the tailnet entirely is NOT the same as reported-offline:
    // a device removed from the tailnet is a different event from one powered
    // down, and calling it 'down' would misattribute an admin action to a
    // person flipping a switch. Left unknown, which the classifier reports as
    // unverified rather than folding into either bucket.
    probes[n.slug] = hit ? (hit.online ? 'up' : 'down') : 'unknown';
  }
  return probes;
}

// ----------------------------------------------------------------------------- CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const fileArg = process.argv.indexOf('--file');
  let raw = '';
  try {
    raw = fileArg >= 0
      ? readFileSync(process.argv[fileArg + 1], 'utf8')
      : readFileSync(0, 'utf8');
  } catch (e) {
    console.error(`pipeline-availability-probe: could not read input — ${e.message}`);
    process.exit(2);
  }

  let status;
  try {
    status = JSON.parse(raw);
  } catch {
    console.error('pipeline-availability-probe: input was not valid JSON. Unknown never reads as up (DR-0076).');
    process.exit(2);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const peers = peersFromTailscaleStatus(status);
  if (!peers.length) {
    console.error('pipeline-availability-probe: the tailnet status held no peers — the runner almost certainly failed to join.');
    process.exit(2);
  }

  const assessment = assessFleet(manifest, probesFromPeers(manifest, peers));
  console.log('# PIPELINE DEVICE AVAILABILITY (the tailnet\'s own view)\n');
  console.log(formatFleetReport(assessment));
  console.log('');

  if (assessment.unverified.length) {
    console.log(`NOTE: ${assessment.unverified.length} node(s) unverified — reported, but not treated as a device fault.`);
  }
  if (assessment.undeclared.length) {
    console.log(`NOTE: ${assessment.undeclared.length} tailnet peer(s) are not declared in pipeline-nodes.json.`);
  }
  if (!assessment.healthy) {
    console.log('\nINCIDENT — a node declared always-on is dark:');
    for (const i of assessment.incidents) console.log(`  ${i.slug}: ${i.reason}`);
    console.log('\nRunbook: infra/device-availability/RUNBOOK.md');
    process.exit(1);
  }
  console.log('pipeline-availability-probe: OK — every always-on node is reachable.');
  process.exit(0);
}
