#!/usr/bin/env node
// captions-json-to-text — render the NAS caption fetcher's JSON into readable text.
//
// SHAPE, read off the real producer (infra/nas-sme-pipeline/youtube-captions.py
// lines 135/139) rather than assumed:
//   { "<videoId>": { text, source, lang, words } }          on success
//   { "<videoId>": { text: "", error: "...", source } }     when captions are absent
//
// Note what this path does NOT give us, so a lesson never implies otherwise:
// youtube-captions.py joins the segments into one string (fetch_one, line 75),
// so the text is exact words with NO timestamps. The VTT route
// (scripts/vtt-to-text.mjs) keeps timestamps but is IP-blocked from CI. A
// quotation taken from this file can be attributed to the speaker; it cannot be
// cited to a minute mark. The header says so in the file itself, because the
// person reading it months from now will not remember which route produced it.
//
// It also does not de-duplicate, and does not need to: the rolling-window
// repetition that vtt-to-text.mjs exists to strip is an artifact of the VTT
// display format, not of the segment API. Asserted in the test rather than
// assumed, so nobody "fixes" this by adding a de-duplicator it does not need.

import { readFileSync } from 'node:fs';

const [file, videoId] = process.argv.slice(2);
if (!file || !videoId) {
  console.error('usage: captions-json-to-text.mjs <captions.json> <videoId>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error(`Could not parse ${file}: ${err.message}`);
  process.exit(1);
}

const row = data && typeof data === 'object' ? data[videoId] : null;
if (!row) {
  console.error(`No entry for ${videoId} in ${file}. Keys present: ${Object.keys(data || {}).join(', ') || '(none)'}`);
  process.exit(1);
}

const text = String(row.text || '').trim();
if (!text) {
  // An error row is a real answer, not a crash — print WHAT the NAS said so the
  // caller can tell an IP ceiling from a video that has no captions at all.
  console.error(`No caption text for ${videoId}. The fetcher recorded: ${row.error || 'no-captions'}`);
  process.exit(1);
}

// Wrap to a readable width without touching a single word.
const words = text.split(/\s+/).filter(Boolean);
const lines = [];
let line = '';
for (const w of words) {
  if (line && (line.length + 1 + w.length) > 96) { lines.push(line); line = w; }
  else line = line ? `${line} ${w}` : w;
}
if (line) lines.push(line);

process.stdout.write(
  `# Transcript of YouTube video ${videoId}\n`
  + `# Fetched on the NAS from its residential IP (the CI path is YouTube-IP-blocked;\n`
  + `# infra/nas-loops/services.json transcript-trickle records that measurement).\n`
  + `# Source: ${row.source || 'youtube-asr'}, language ${row.lang || 'en'}, ${words.length} words.\n`
  + `# NO TIMESTAMPS on this route: the fetcher joins the caption segments, so a\n`
  + `# quotation here can be attributed to the speaker but NOT cited to a minute mark.\n`
  + `# These are auto-generated captions - a machine's hearing, not the speaker's own\n`
  + `# text. Verify any wording before quoting a person from it.\n\n`
  + lines.join('\n') + '\n',
);
