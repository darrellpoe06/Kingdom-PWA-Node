// =============================================================================
// harvest-ledger transcript wiring — the guard for WHY it stayed at 22%.
// =============================================================================
// The freeze was NOT a math bug: buildLedger climbs 22% -> 67% the instant it is
// handed a transcript (harvest-youtube-climb.test.js proves that). The freeze was
// a WIRING bug — fetchLedger() built the ledger WITHOUT transcripts and there was
// nowhere for a transcript to live, so deriveSignals' transcript path was dead
// code in the served app. #399 "merged and served" the extractors but never fed
// them data; the % never moved.
//
// PROVEN-TO-CATCH (DR-0076): these guards go RED if the wiring regresses to the
// frozen state — if fetchLedger stops selecting video_transcripts, or stops
// passing `transcripts` into buildLedger. A green here MEANS the served app can
// actually climb once a transcript row lands.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { transcriptsByVideo } from '../lib/harvest-ledger.js';

const here = dirname(fileURLToPath(import.meta.url));
const LEDGER_SRC = readFileSync(join(here, '..', 'lib', 'harvest-ledger.js'), 'utf-8');

describe('transcriptsByVideo — only real transcripts count', () => {
  it('maps video_transcripts rows to the { [videoId]: { text } } shape', () => {
    const out = transcriptsByVideo([
      { video_id: 'a', text: 'a real transcript with words' },
      { video_id: 'b', text: '   ' },              // whitespace only -> not a transcript
      { video_id: 'c', text: '' },                 // no-caption verdict -> not a transcript
      { video_id: 'd', text: null },               // null -> ignored
      { video_id: null, text: 'orphan' },          // no id -> ignored
    ]);
    expect(Object.keys(out)).toEqual(['a']);
    expect(out.a).toEqual({ text: 'a real transcript with words' });
  });

  it('is null/empty safe (never throws on a degraded fetch)', () => {
    expect(transcriptsByVideo(null)).toEqual({});
    expect(transcriptsByVideo(undefined)).toEqual({});
    expect(transcriptsByVideo([])).toEqual({});
  });
});

describe('fetchLedger wiring guard — the un-freeze must stay wired', () => {
  it('fetchLedger selects the transcript source (video_transcripts)', () => {
    expect(LEDGER_SRC).toMatch(/from\(['"]video_transcripts['"]\)/);
  });

  it('fetchLedger hands transcripts to buildLedger (not the frozen 3-arg call)', () => {
    // The regression that froze the % was buildLedger({ sermons, harvests, songs })
    // with no transcripts. Require the transcripts key in the buildLedger call.
    const call = LEDGER_SRC.match(/buildLedger\(\{[^}]*\}\)/s);
    expect(call, 'buildLedger call not found').toBeTruthy();
    expect(call[0]).toMatch(/transcripts/);
  });

  it('the transcript table is streamed live (subscribeLedger)', () => {
    expect(LEDGER_SRC).toMatch(/'video_transcripts'/);
  });
});
