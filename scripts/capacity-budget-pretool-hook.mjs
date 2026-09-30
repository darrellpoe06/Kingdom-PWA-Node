#!/usr/bin/env node
// PreToolUse hook on Agent: no builder launches over budget (P65, DR-0697).
// Darrell 2026-09-30: "Make sure we have room for our max and we know our
// budget is good or not first!!!" and "Perpetually". Every Agent launch
// measures this machine first. Over budget = blocked (exit 2) with the
// numbers, so the orchestrator queues it or frees memory. Fails OPEN on any
// error of its own: a broken hook never stops the work.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { budget, readMeminfo } from './capacity-budget.mjs';

try {
  const { availGb } = readMeminfo(fs.readFileSync('/proc/meminfo', 'utf8'));
  const diskFreeGb = Number(execSync("df -Pk /tmp | awk 'NR==2{print $4}'", { encoding: 'utf8' })) / (1024 * 1024);
  const b = budget({ availGb, diskFreeGb, wanted: 1 });
  if (!b.ok) {
    process.stderr.write(`capacity-budget: no room for another builder now — ${availGb.toFixed(1)} GB memory available, ${diskFreeGb.toFixed(1)} GB disk free; one builder costs ~3.1 GB + 1.5 GB (measured 2026-09-30). Queue it until a running builder finishes, or free memory/disk first (node scripts/capacity-budget.mjs). P65.\n`);
    process.exit(2);
  }
} catch { /* fail open */ }
process.exit(0);
