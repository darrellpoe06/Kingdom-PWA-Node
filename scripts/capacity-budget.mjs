#!/usr/bin/env node
// capacity-budget.mjs — is there room for the work we are about to launch? (P65, DR-0697)
//
// Darrell 2026-09-30: "Make sure we have room for our max and we know our
// budget is good or not first!!!" Run this BEFORE launching builders. It
// measures this machine now (never assumes) and answers, in numbers:
//   - memory total / available, disk free
//   - what the running test runs and builds are holding
//   - how many MORE builders fit, at the measured cost of one builder
// Exit 0 = the requested number fits; exit 1 = over budget (launch fewer,
// or wait); the printed lines say by how much.
//
// USAGE: node scripts/capacity-budget.mjs [builders-wanted]
// The per-builder cost is MEASURED on 2026-09-30 in this container: a capped
// local vitest run (vitest.local-slot.js: parent ~1.2 GB + 2 workers ~0.7 GB)
// plus a vite build (~0.7 GB) that can overlap it, plus ~0.5 GB for the
// session itself. Override with BUILDER_GB when a new measurement says so.
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const GB = 1024 * 1024; // /proc values are kB
const BUILDER_GB = Number(process.env.BUILDER_GB || 3.1);
const RESERVE_GB = Number(process.env.RESERVE_GB || 1.5); // never plan into the last 1.5 GB
const DISK_PER_BUILDER_GB = Number(process.env.DISK_PER_BUILDER_GB || 1.5);

export function readMeminfo(text) {
  const get = (k) => Number((text.match(new RegExp(`^${k}:\\s+(\\d+)`, 'm')) || [])[1] || 0) / GB;
  return { totalGb: get('MemTotal'), availGb: get('MemAvailable') };
}

export function budget({ availGb, diskFreeGb, wanted, builderGb = BUILDER_GB, reserveGb = RESERVE_GB, diskPerBuilderGb = DISK_PER_BUILDER_GB }) {
  const byMem = Math.max(0, Math.floor((availGb - reserveGb) / builderGb));
  const byDisk = Math.max(0, Math.floor((diskFreeGb - 2) / diskPerBuilderGb));
  const fits = Math.min(byMem, byDisk);
  return { byMem, byDisk, fits, ok: wanted <= fits };
}

function heldBy() {
  let out = '';
  try { out = execSync('ps -eo rss,cmd', { encoding: 'utf8' }); } catch { return { vitest: 0, builds: 0 }; }
  let vitest = 0; let builds = 0;
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(.*)$/);
    if (!m) continue;
    const kb = Number(m[1]);
    if (/node \(vitest( \d+)?\)$/.test(m[2])) vitest += kb;
    else if (/vite build/.test(m[2])) builds += kb;
  }
  return { vitest: vitest / GB, builds: builds / GB };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wanted = Number(process.argv[2] || 1);
  const { totalGb, availGb } = readMeminfo(fs.readFileSync('/proc/meminfo', 'utf8'));
  let diskFreeGb = 0;
  try { diskFreeGb = Number(execSync("df -Pk /tmp | awk 'NR==2{print $4}'", { encoding: 'utf8' })) / GB; } catch { /* unknown stays 0: never reads as room */ }
  const held = heldBy();
  const b = budget({ availGb, diskFreeGb, wanted });
  const f = (n) => n.toFixed(1);
  console.log(`memory: ${f(availGb)} GB available of ${f(totalGb)} GB (reserve ${RESERVE_GB} GB kept free)`);
  console.log(`disk:   ${f(diskFreeGb)} GB free in /tmp`);
  console.log(`held:   test runs ${f(held.vitest)} GB, builds ${f(held.builds)} GB`);
  console.log(`cost:   ${BUILDER_GB} GB memory + ${DISK_PER_BUILDER_GB} GB disk per builder (measured 2026-09-30)`);
  console.log(`room:   ${b.fits} more builder(s) (memory allows ${b.byMem}, disk allows ${b.byDisk}); wanted ${wanted}`);
  console.log(b.ok ? 'BUDGET OK' : `OVER BUDGET by ${wanted - b.fits}: launch ${b.fits} now and queue the rest, or free memory/disk first`);
  process.exit(b.ok ? 0 : 1);
}
