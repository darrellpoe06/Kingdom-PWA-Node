#!/usr/bin/env node
// harvest-from-transcripts — turn YouTube-caption transcripts into harvest records.
// =============================================================================
// Reads the transcripts.json produced by infra/nas-sme-pipeline/youtube-captions.py,
// runs the SAME pure extractors the app uses (video-harvest.js / transcript-
// harvest.js — no drift between what gets recorded and what the % shows), and emits
// an IDEMPOTENT SQL seed that lights the transcript-derived harvests (transcript,
// scripture, lessons, discernment, testimony, trivia) in the existing
// video_harvests table. This is what climbs the Harvest % past 22% (Darrell
// 2026-06-29).
//
// The SQL upserts by (instance_id, video_id) and MERGES the harvests jsonb
// (`harvests || EXCLUDED.harvests`), so re-running refreshes the caption-derived
// types while leaving any steward-recorded types (a manual 'na', etc.) untouched.
// No new migration — video_harvests (0050) is already on main/cloud.
//
// It also appends a coverage SNAPSHOT to scripts/out/harvest-progress.jsonl, which
// scripts/harvest-stall-guard.mjs reads to flag a stalled harvest.
//
// This does NOT touch the database — it writes:
//   scripts/out/video-harvests-from-transcripts.sql  (apply via Studio / db-migrate)
//   scripts/out/harvest-progress.jsonl               (append-only snapshot log)
//
// Usage:
//   node scripts/harvest-from-transcripts.mjs [transcripts.json] [--total N] [--slug colg]
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import {
  harvestMapFor, buildLedger, extractScriptureRefs,
} from '../app/src/lib/video-harvest.js';
import { harvestFromTranscript } from '../app/src/lib/transcript-harvest.js';
import { harvestSnapshot } from '../app/src/lib/harvest-stall.js';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const inPath = argv.find((a) => !a.startsWith('--') && (a.endsWith('.json'))) || 'infra/nas-sme-pipeline/out/transcripts.json';
const slug = flag('--slug', 'colg');
const totalArg = Number(flag('--total', 0)) || 0;

if (!existsSync(inPath)) {
  console.error(`No transcripts file at ${inPath}. Run infra/nas-sme-pipeline/youtube-captions.py first.`);
  process.exit(1);
}
const transcripts = JSON.parse(readFileSync(inPath, 'utf-8'));
const entries = Object.entries(transcripts);
const withText = entries.filter(([, v]) => v && v.text && v.text.trim());

const isoNow = new Date().toISOString();
const sqlEsc = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jsonbEsc = (obj) => `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;

// Build one harvests jsonb (per-type records) from a transcript, using the shared
// extractors. Records carry real refs = the evidence (DR-0076), so evidenced:true.
function recordsFor(text) {
  const sig = harvestFromTranscript(text); // transcript + lessons/discernment/testimony/trivia
  const out = {};
  for (const [k, v] of Object.entries(sig)) {
    out[k] = { ...v, refs: (v.refs || []).slice(0, 12), note: 'youtube-asr', harvested_at: isoNow };
  }
  // Scripture: the full whole-service sweep off the transcript (deriveSignals owns
  // this in-app; mirror it here so the recorded set matches).
  const refs = extractScriptureRefs(text);
  if (refs.length) {
    out.scripture = { status: 'complete', count: refs.length, refs: refs.slice(0, 25), evidenced: true, note: 'youtube-asr', harvested_at: isoNow };
  }
  return out;
}

const CHURCH = `(SELECT id FROM instances WHERE slug = ${sqlEsc(slug)})`;
const sqlLines = [
  '-- video_harvests caption-derived seed (generated from YouTube auto-captions).',
  '-- Idempotent: upsert by (instance_id, video_id), MERGE the harvests jsonb.',
];
for (const [vid, v] of withText) {
  const harvests = recordsFor(v.text);
  sqlLines.push(
    `INSERT INTO video_harvests (instance_id, video_id, source_kind, harvests) ` +
    `VALUES (${CHURCH}, ${sqlEsc(vid)}, 'service', ${jsonbEsc(harvests)}) ` +
    `ON CONFLICT (instance_id, video_id) DO UPDATE SET harvests = video_harvests.harvests || EXCLUDED.harvests, updated_at = now();`,
  );
}
mkdirSync('scripts/out', { recursive: true });
writeFileSync('scripts/out/video-harvests-from-transcripts.sql', sqlLines.join('\n') + '\n');

// Coverage snapshot for the stall guard. To be HONEST about the WHOLE corpus (not
// just the slice transcribed so far), model every video: the transcribed ones WITH
// their transcript (they climb to ~67%), the rest as dated services with no
// transcript yet (they sit at the 22% ceiling). So avgPct reflects what the app
// actually shows corpus-wide, and the guard can see how many transcripts are still
// un-fetched — the real "stalled" signal.
const totalVideos = totalArg || entries.length || withText.length;
const transcribedSermons = withText.map(([vid], i) => ({ videoId: vid, serviceDate: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`, serviceType: 'sunday' }));
const pad = Math.max(0, totalVideos - withText.length);
const padSermons = Array.from({ length: pad }, (_, i) => ({ videoId: `untranscribed-${i}`, serviceDate: `2026-02-${String((i % 28) + 1).padStart(2, '0')}`, serviceType: 'sunday' }));
const tmap = Object.fromEntries(withText.map(([vid, v]) => [vid, { text: v.text }]));
const ledger = buildLedger({ sermons: [...transcribedSermons, ...padSermons], transcripts: tmap });
const snap = harvestSnapshot(
  { ...ledger, byType: { ...ledger.byType, transcript: { complete: withText.length } } },
  isoNow,
);
appendFileSync('scripts/out/harvest-progress.jsonl', JSON.stringify(snap) + '\n');

const sample = harvestMapFor(ledger.rows[0]?.harvests || {});
console.log(`Transcripts: ${withText.length} with text of ${entries.length} total (${entries.length - withText.length} no-caption -> Whisper fallback).`);
console.log(`Wrote scripts/out/video-harvests-from-transcripts.sql (${withText.length} upserts).`);
console.log(`Snapshot appended: avg ${snap.avgPct}% over ${snap.transcribed}/${snap.videos} transcribed.`);
if (ledger.rows[0]) {
  console.log('Sample video harvest:', Object.entries(sample).map(([k, r]) => `${k}:${r.status}`).join(' '));
}
console.log('\nApply the SQL to cloud (Studio / db-migrate), then the Harvest ledger climbs live.');
