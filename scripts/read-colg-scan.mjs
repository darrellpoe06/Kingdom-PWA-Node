#!/usr/bin/env node
// =============================================================================
// read-colg-scan.mjs - reconcile a COLG network scan against the device register
// =============================================================================
// Usage:
//   node scripts/read-colg-scan.mjs [path-to-scan.json]
// With no argument it reads the NEWEST scan in docs/99-session-notes/scans/.
//
// Prints the four answers a scan exists to give: who is here that we never
// recorded, what the gear we could not name actually is, what we recorded that is
// not here, and what every host is actually serving. All derivation lives in
// app/src/lib/church-scan-ingest.js, so this file is a reader and nothing more.
// =============================================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scanDir = join(here, '..', 'docs', '99-session-notes', 'scans');

const { reconcileScan } = await import(join(here, '..', 'app', 'src', 'lib', 'church-scan-ingest.js'));
const { SEED_DEVICES } = await import(join(here, '..', 'app', 'src', 'lib', 'church-devices.js'));

let file = process.argv[2];
if (!file) {
  if (!existsSync(scanDir)) {
    console.error(`No scan directory at ${scanDir}. Run scripts/colg-network-scan.ps1 on a machine on the church LAN first.`);
    process.exit(1);
  }
  const files = readdirSync(scanDir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error('No scan files found. Run scripts/colg-network-scan.ps1 first.');
    process.exit(1);
  }
  file = join(scanDir, files[files.length - 1]);
}

// PowerShell writes ASCII, but Out-File can leave a BOM on some hosts - strip it
// rather than dying on a byte nobody can see.
const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
let scan;
try {
  scan = JSON.parse(raw);
} catch (err) {
  console.error(`Could not parse ${file}: ${err.message}`);
  process.exit(1);
}

const r = reconcileScan(scan, SEED_DEVICES);
if (!r.ok) {
  console.error('SCAN REJECTED (this is a failed scan, not an empty network):');
  for (const e of r.errors) console.error('  - ' + e);
  process.exit(1);
}

const line = (s) => console.log(s);
line('');
line('='.repeat(78));
line(`COLG NETWORK SCAN - reconciled against the device register`);
line(`Scanned at: ${r.scannedAt}`);
line(`Source:     ${file}`);
line('='.repeat(78));
line('');
line(`Live hosts answering:        ${r.summary.liveHosts}`);
line(`Already on the register:     ${r.summary.registeredHosts}`);
line(`NOT on the register:         ${r.summary.unregisteredHosts}`);
line(`Register rows that were silent: ${r.summary.silentRows}`);
line(`Register coverage of the live network: ${r.summary.coverage}%`);
line('');

if (r.unregistered.length > 0) {
  line('-'.repeat(78));
  line(`UNREGISTERED HOSTS (${r.unregistered.length}) - live on the church LAN, absent from the register`);
  line('-'.repeat(78));
  for (const h of r.unregistered) {
    const vendor = h.vendor ? h.vendor : `unknown vendor (${h.macConfidence})`;
    line(`  ${h.ip.padEnd(16)} ${String(h.mac || 'no ARP entry').padEnd(19)} ${vendor}`);
    if (h.openPorts.length > 0) {
      line(`      serving: ${h.services.map((s) => `${s.port}/${s.service}`).join(', ')}`);
    }
    for (const b of h.banners) {
      if (b.title || b.server) line(`      banner:  ${[b.server, b.title].filter(Boolean).join(' | ')}`);
    }
  }
  line('');
}

if (r.identifications.length > 0) {
  line('-'.repeat(78));
  line(`IDENTIFICATIONS (${r.identifications.length}) - MAC vendor for rows we could not name`);
  line('  NOTE: an OUI names the MAKER only. Model and role still need eyes-on.');
  line('-'.repeat(78));
  for (const id of r.identifications) {
    line(`  ${id.deviceName}`);
    line(`      ${id.ip}  ${id.mac}  ->  ${id.vendor}  (oui-derived)`);
  }
  line('');
}

if (r.exposures.length > 0) {
  line('-'.repeat(78));
  line(`EXPOSURES (${r.exposures.length}) - from what is actually listening right now`);
  line('-'.repeat(78));
  for (const e of r.exposures) {
    line(`  [${e.severity.toUpperCase()}] ${e.ip}:${e.port} ${e.service}  (${e.knownAs})`);
    line(`      ${e.note}`);
  }
  line('');
}

if (r.silent.length > 0) {
  line('-'.repeat(78));
  line(`SILENT REGISTER ROWS (${r.silent.length}) - recorded, did not answer this scan`);
  line('  These are QUESTIONS, not retirements. Off, asleep, or refusing ICMP.');
  line('-'.repeat(78));
  for (const s of r.silent) line(`  ${s.name} (${s.addresses.join(', ')})`);
  line('');
}

line('='.repeat(78));
line(`${r.summary.criticalExposures} critical / ${r.summary.highExposures} high exposure(s) from live services.`);
line('This reads addresses and open ports. It does not read traffic, logs or');
line('authentication attempts - it shows where the network is open, never whether');
line('anyone walked through.');
line('='.repeat(78));
