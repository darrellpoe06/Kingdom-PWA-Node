#!/usr/bin/env node
// tlc-youtube-course-ingest — turn a YouTube teaching video Darrell selects into an
// ATTRIBUTED, copyright-safe DRAFT training course for Christina (LCSW) to review.
// Declared by Darrell 2026-06-29 (deliverable #6).
//
// USES THE EXISTING NO-GPU AUTO-CAPTION PATH: yt-dlp fetches the auto-generated
// captions only (--write-auto-sub --skip-download). NO media is downloaded, no GPU
// is needed (same posture as choir-youtube-backfill.mjs: source, don't download).
// The captions are stripped to plain text and DISTILLED into an original draft via
// lib/tlc-course-ingest.js — which TRANSFORMS (never reproduces verbatim) and runs
// the copyright-safety gate before writing anything.
//
// MANUAL / TRIGGERED ONLY — never an unattended timer (CLAUDE.md three-brakes rule).
// This NEVER touches the database; it writes review artifacts under scripts/out/.
//
// Usage:
//   node scripts/tlc-youtube-course-ingest.mjs <youtube-url> "<Field>" ["Teacher name"]
// e.g.
//   node scripts/tlc-youtube-course-ingest.mjs "https://www.youtube.com/watch?v=XXXX" "Crisis & risk" "Dr. Example"
//
// Requires yt-dlp on PATH (or `python -m yt_dlp`). The chosen <Field> must be one of
// the ten TRAINING_FIELDS; the script prints them if the field is unrecognized.

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { draftCourseFromSource, verifyCopyrightSafe } from '../app/src/lib/tlc-course-ingest.js';
import { TRAINING_FIELDS } from '../app/src/lib/tlc-training-library.js';

const url = process.argv[2];
const field = process.argv[3];
const teacher = process.argv[4] || '';

if (!url || !field) {
  console.error('Usage: node scripts/tlc-youtube-course-ingest.mjs <youtube-url> "<Field>" ["Teacher name"]');
  console.error('Fields:', TRAINING_FIELDS.join(' | '));
  process.exit(1);
}
if (!TRAINING_FIELDS.includes(field)) {
  console.error(`Unrecognized field "${field}". Choose one of:\n  ${TRAINING_FIELDS.join('\n  ')}`);
  process.exit(1);
}

function ytdlp(args) {
  for (const cmd of [['yt-dlp', args], ['python', ['-m', 'yt_dlp', ...args]]]) {
    const r = spawnSync(cmd[0], cmd[1], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status === 0) return r.stdout;
  }
  throw new Error('yt-dlp not found. Install with: pip install --user yt-dlp');
}

// Strip a WebVTT/SRT caption file down to plain, de-duplicated prose. Auto-captions
// repeat lines across cues; we collapse consecutive duplicates and drop timing/markup.
function vttToText(vtt) {
  const lines = String(vtt || '').split(/\r?\n/);
  const out = [];
  let last = '';
  for (const raw of lines) {
    const l = raw.trim();
    if (!l || l === 'WEBVTT' || /^\d+$/.test(l)) continue;
    if (l.includes('-->')) continue;                       // timing line
    if (/^(Kind|Language):/i.test(l)) continue;
    const clean = l.replace(/<[^>]+>/g, '').replace(/\[[^\]]*\]/g, '').trim(); // tags / [Music]
    if (!clean || clean === last) continue;
    out.push(clean);
    last = clean;
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

const outDir = 'scripts/out';
mkdirSync(outDir, { recursive: true });
const tmpl = join(outDir, 'tlc-yt-caption');

// Fetch auto-captions only — no media. en + en-orig, vtt.
console.log(`Fetching auto-captions for: ${url}`);
ytdlp([
  '--skip-download', '--write-auto-sub', '--sub-lang', 'en.*', '--sub-format', 'vtt',
  '--output', tmpl, url,
]);

// Find the written .vtt (yt-dlp appends the lang + extension).
const vttFile = readdirSync(outDir).find((f) => f.startsWith('tlc-yt-caption') && f.endsWith('.vtt'));
let transcript = '';
if (vttFile) {
  transcript = vttToText(readFileSync(join(outDir, vttFile), 'utf8'));
  rmSync(join(outDir, vttFile), { force: true });            // don't keep the raw caption file
}

if (!transcript) {
  console.warn('No captions found (video may have captions disabled). Writing a draft SKELETON instead.');
}

const now = new Date().toISOString();
const course = draftCourseFromSource({ url, field, teacher, transcript, now });

// THE GATE: prove the draft reproduces no long verbatim run before writing it.
const check = verifyCopyrightSafe(course, transcript);
if (!check.safe) {
  console.error('COPYRIGHT GATE FAILED — draft contains verbatim source runs. Not writing.');
  console.error(check.violations.slice(0, 3));
  process.exit(2);
}

const stem = course.id;
writeFileSync(join(outDir, `${stem}.json`), JSON.stringify({ course, source: { url, field, teacher }, check, distilledAt: now }, null, 2));
console.log(`\nDraft course written: ${outDir}/${stem}.json`);
console.log(`  Field:    ${course.field}`);
console.log(`  Modules:  ${course.modules.length} (draft outlines)`);
console.log(`  Copyright gate: PASS (no run > ${check.maxVerbatimWords} verbatim words; ${check.checked} bodies checked)`);
console.log('  Status:   validated:false — import to the library and review under Practice ▸ Learn (Christina Agrees/Disagrees).');
