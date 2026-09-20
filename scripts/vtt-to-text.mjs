#!/usr/bin/env node
// vtt-to-text — flatten a WebVTT caption track into readable prose.
//
// Why this is not a one-line sed. YouTube's auto-generated captions are a
// ROLLING display: each cue repeats the tail of the previous cue so the words
// scroll on screen. A naive strip of the timestamps therefore produces text
// where most of the talk appears two or three times, which is worse than no
// transcript — a lesson quoting from it would quote a duplicated fragment and
// the duplication would read as emphasis. So de-duplication is the whole job.
//
// What it keeps: a [mm:ss] marker roughly every 30 seconds, so a quotation can
// still be cited to a point in the talk the way the timestamped summaries do.

import { readFileSync } from 'node:fs';

const MARK_EVERY_SEC = 30;

const file = process.argv[2];
if (!file) {
  console.error('usage: vtt-to-text.mjs <file.vtt>');
  process.exit(1);
}

const raw = readFileSync(file, 'utf8');

// "00:01:02.500" or "01:02.500" -> seconds
function toSeconds(stamp) {
  const parts = stamp.split(':').map((p) => parseFloat(p.replace(',', '.')));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

function mmss(total) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

const CUE_TIME = /^(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3})\s+-->\s+/;

// Collect cues as { at, text }.
const cues = [];
let current = null;
for (const line of raw.split(/\r?\n/)) {
  const m = CUE_TIME.exec(line.trim());
  if (m) {
    if (current) cues.push(current);
    current = { at: toSeconds(m[1]), lines: [] };
    continue;
  }
  if (!current) continue;                        // header / NOTE block
  const text = line
    .replace(/<[^>]*>/g, '')                     // inline word-timing tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
  if (text) current.lines.push(text);
}
if (current) cues.push(current);

// De-duplicate the rolling window: append only the part of each cue that is not
// already the tail of what we have. Compared on words, because the repeated
// portion is word-identical but may re-wrap across lines differently.
const out = [];
let words = [];
let nextMark = 0;

for (const cue of cues) {
  const cueWords = cue.lines.join(' ').split(/\s+/).filter(Boolean);
  if (!cueWords.length) continue;

  // Find the longest suffix of `words` that is a prefix of `cueWords`.
  let overlap = 0;
  const max = Math.min(words.length, cueWords.length);
  for (let n = max; n > 0; n -= 1) {
    let same = true;
    for (let i = 0; i < n; i += 1) {
      if (words[words.length - n + i].toLowerCase() !== cueWords[i].toLowerCase()) { same = false; break; }
    }
    if (same) { overlap = n; break; }
  }
  const fresh = cueWords.slice(overlap);
  if (!fresh.length) continue;

  if (cue.at !== null && cue.at >= nextMark) {
    out.push(`\n\n[${mmss(cue.at)}] `);
    nextMark = cue.at + MARK_EVERY_SEC;
  }
  out.push(fresh.join(' ') + ' ');
  words = words.concat(fresh);
  if (words.length > 400) words = words.slice(-400);   // bounded lookback
}

process.stdout.write(
  `# Transcript flattened from ${file.split('/').pop()}\n`
  + `# ${cues.length} cues in, ${words.length ? 'de-duplicated' : 'EMPTY'}; `
  + `timestamp marker every ~${MARK_EVERY_SEC}s.\n`
  + `# Auto-generated captions are a machine's hearing, not the speaker's text:\n`
  + `# verify any wording before quoting a person from it.\n`
  + out.join('').replace(/[ \t]+\n/g, '\n').trim() + '\n',
);
