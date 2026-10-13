#!/usr/bin/env node
// =============================================================================
// propose-register-rows.mjs - turn unregistered scan hosts into register rows
// =============================================================================
// Usage:
//   node scripts/propose-register-rows.mjs [path-to-scan.json]
//
// The scan finds hosts the register has never heard of. This writes them as
// makeDevice(...) blocks, ready to paste into SEED_DEVICES in
// app/src/lib/church-devices.js.
//
// IT PROPOSES; IT DOES NOT APPLY. The register is the church's asset record and a
// generator must not edit it unreviewed. Output goes to stdout for a human to read
// before anything is pasted.
//
// EVERY GENERATED ROW IS HONEST (DR-0076):
//   - provenance: 'scan-confirmed <date>' for the address (a real reading)
//   - confirmed: false and smeNeeded: true - a scan proves a host ANSWERED at an
//     address; it does not prove what the box IS
//   - makeModel carries the OUI vendor where known, explicitly marked oui-derived
//     and UNSURE, or 'UNKNOWN' where the MAC gave nothing. No model is invented.
//   - deviceType is inferred from services ONLY where the inference is strong, and
//     falls back to 'other' rather than guessing. The inference is printed beside
//     each row so a human can overrule it.
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
  if (!existsSync(scanDir)) { console.error(`No scans at ${scanDir}`); process.exit(1); }
  const files = readdirSync(scanDir).filter((f) => f.endsWith('.json')).sort();
  if (!files.length) { console.error('No scan files found.'); process.exit(1); }
  file = join(scanDir, files[files.length - 1]);
}

const scan = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
const r = reconcileScan(scan, SEED_DEVICES);
if (!r.ok) { console.error('SCAN REJECTED:'); r.errors.forEach((e) => console.error('  - ' + e)); process.exit(1); }

// --- Type inference. Deliberately conservative: only strong signals classify. ---
// Each rule states the evidence it needs. Anything weaker falls to 'other', which
// is an honest "we do not know" rather than a plausible-sounding wrong answer.
function inferType(host) {
  const ports = new Set(host.openPorts || []);
  const vendor = (host.vendor || '').toLowerCase();
  const banner = (host.banners || []).map((b) => `${b.server || ''} ${b.title || ''}`).join(' ').toLowerCase();

  if (vendor === 'synology' || ports.has(5000) || ports.has(5001)) return ['nas', 'Synology DSM ports or a Synology OUI'];
  if (vendor === 'netgear' || vendor === 'ubiquiti' || vendor === 'tp-link') return ['network', `${host.vendor} OUI - network gear`];
  if (ports.has(554)) return ['camera', 'RTSP (554) - a video source'];
  if (vendor === 'hikvision' || vendor === 'dahua' || vendor === 'axis') return ['security', `${host.vendor} OUI - IP camera vendor`];
  if (vendor === 'hewlett-packard' || vendor === 'canon' || vendor === 'brother') return ['printer', `${host.vendor} OUI - printer vendor`];
  if (vendor === 'amazon' || vendor === 'sonos' || vendor === 'google' || vendor === 'roku' || vendor === 'wyze') return ['iot', `${host.vendor} OUI - consumer device`];
  if (vendor === 'yamaha') return ['audio-console', 'Yamaha OUI - audio console'];
  if (vendor === 'blackmagic design') return ['switcher', 'Blackmagic OUI - production switcher'];
  if (ports.has(11434)) return ['gpu-node', 'Ollama (11434) - an inference host'];
  if (ports.has(3389)) return ['server', 'RDP (3389) - a Windows host'];
  if (vendor === 'apple') return ['media-rig', 'Apple OUI - likely a media/presentation Mac'];
  return ['other', 'No strong signal - classify on eyes-on rather than guess'];
}

function slugFor(host, type) {
  const last = host.ip.split('.').slice(2).join('-');
  return `dev-scan-${type}-${last}`;
}

const stamp = String(r.scannedAt).slice(0, 10);
const out = [];
out.push('// ' + '='.repeat(74));
out.push(`// PROPOSED ROWS from the ${stamp} church LAN scan.`);
out.push(`// ${r.unregistered.length} host(s) were live and absent from the register.`);
out.push('// Every row is confirmed:false / smeNeeded:true - a scan proves a host');
out.push('// ANSWERED at an address, never what the box IS. Review before pasting.');
out.push('// ' + '='.repeat(74));
out.push('');

for (const h of r.unregistered) {
  const [type, reason] = inferType(h);
  const vendorText = h.vendor
    ? `${h.vendor} (oui-derived; model UNSURE - NEEDS EYES-ON)`
    : (h.mac ? 'UNKNOWN (MAC gave no vendor - NEEDS EYES-ON)' : 'UNKNOWN (no MAC captured - NEEDS EYES-ON)');
  const nameText = h.vendor ? `${h.vendor} device at ${h.ip}` : `Unidentified host at ${h.ip}`;
  const services = h.services.map((s) => `${s.port}/${s.service}`).join(', ') || 'no TCP services answered';
  const bannerText = (h.banners || [])
    .map((b) => [b.server, b.title].filter(Boolean).join(' | '))
    .filter(Boolean).join(' ; ');

  out.push(`  // TYPE INFERENCE: ${type} <- ${reason}`);
  out.push('  makeDevice({');
  out.push(`    id: '${slugFor(h, type)}',`);
  out.push(`    name: '${nameText.replace(/'/g, "\\'")}',`);
  out.push(`    deviceType: '${type}',`);
  out.push(`    makeModel: '${vendorText.replace(/'/g, "\\'")}',`);
  out.push(`    location: 'Church (TBD - locate on the closet walk)',`);
  out.push(`    status: 'online',`);
  out.push(`    steward: 'COLG media team',`);
  out.push(`    ipAddress: '${h.ip}',`);
  out.push('    specs: {');
  if (h.mac) out.push(`      mac: '${h.mac}',`);
  out.push(`      services: '${services.replace(/'/g, "\\'")}',`);
  if (bannerText) out.push(`      banner: '${bannerText.replace(/'/g, "\\'").slice(0, 160)}',`);
  out.push(`      discovered: 'Found live on the ${stamp} church LAN scan; absent from the register before it.',`);
  out.push('    },');
  out.push(`    capabilities: [],`);
  out.push(`    notes: 'Discovered by the ${stamp} scan. Type inferred from ${reason}. Make/model/role NOT confirmed - identify on the closet walk.',`);
  out.push(`    provenance: 'scan-confirmed ${stamp} (address); oui-derived (vendor); needs-eyes-on (model + role)',`);
  out.push('    smeNeeded: true,');
  out.push('    confirmed: false,');
  out.push('  }),');
  out.push('');
}

if (r.unregistered.length === 0) {
  out.push('  // Nothing to propose - every live host is already on the register.');
}

console.log(out.join('\n'));
console.error('');
console.error(`Proposed ${r.unregistered.length} row(s) from ${file}.`);
console.error('NOTHING WAS WRITTEN. Review the output, then paste into SEED_DEVICES.');
