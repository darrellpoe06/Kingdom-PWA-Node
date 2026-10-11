#!/usr/bin/env node
// Thin shell around judgeDoorsAgainstShelf (DR-0973). Reads the pipe-separated
// rows live-sql.sh printed, applies the tested rules, exits 1 on a finding.
// The decision lives in public-shelf-rules.mjs so it is proven without a
// database; this only reads a file and prints.
import { readFileSync } from 'node:fs';
import { judgeDoorsAgainstShelf, parseDoorRows } from './public-shelf-rules.mjs';

const path = process.argv[2] || '/tmp/doors.txt';
const rows = parseDoorRows(readFileSync(path, 'utf8'));
const r = judgeDoorsAgainstShelf(rows);
for (const w of r.warnings) console.log(`::warning::${w}`);
for (const f of r.findings) console.log(`::error::${f}`);
console.log(`shared doors checked: ${r.checked}`);
if (r.findings.length) process.exit(1);
console.log('the shelf agrees with what the doors are called.');
