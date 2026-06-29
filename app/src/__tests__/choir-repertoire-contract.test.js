// =============================================================================
// choir-repertoire contract — the pipeline producer ↔ app consumer handshake.
// =============================================================================
// The choir Songbook was empty because nothing PRODUCED its data. The producer is
// infra/nas-sme-pipeline/service-to-repertoire.sh + repertoire-json-prompt.md
// (a service recording → faster-whisper → local LLM → repertoire.json). This test
// pins the CONTRACT between that producer's output and the app's consumer chain
// (parseRepertoireJson → archiveRowToInsert → a choir_songs row). If either side
// drifts, the pipeline's output would stop populating the Songbook — and this
// fails before it ships. (The transcription runs on the NAS; the FORMAT is what's
// verifiable in CI, so the format is what we guard.)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { parseRepertoireJson } from '../lib/choir-archive.js';
import { archiveRowToInsert } from '../lib/choir-songbook-sync.js';

// A repertoire.json EXACTLY as repertoire-json-prompt.md is specified to emit.
const repertoire = {
  source: { channel: '@thelovecorner', kind: 'service-recording' },
  songs: [
    {
      title: 'Total Praise', video_id: 'abcdefghijk',
      youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk',
      start_seconds: 612, service_date: '2026-05-10', service_type: 'sunday',
      scripture_ref: 'Psalm 121', confidence: 'high',
      source_quote: 'Lord, I will lift mine eyes to the hills',
    },
    {
      title: 'Way Maker', video_id: 'abcdefghijk', youtube_url: null,
      start_seconds: 0, service_date: '2026-05-10', service_type: 'sunday',
      scripture_ref: null, confidence: 'med',
      source_quote: 'You are way maker, miracle worker',
    },
  ],
  unclear: ['a fast praise break around 30:00 — could not catch the title'],
};

describe('repertoire.json (pipeline output) → Songbook rows (app consumer)', () => {
  it('parses every anchored song and preserves the unclear list for the team', () => {
    const { rows, unclear } = parseRepertoireJson(repertoire);
    expect(rows.map((r) => r.title)).toEqual(['Total Praise', 'Way Maker']);
    expect(unclear).toEqual(['a fast praise break around 30:00 — could not catch the title']);
  });

  it('maps a HIGH-confidence song into a trusted, fully-shaped choir_songs insert', () => {
    const { rows } = parseRepertoireJson(repertoire);
    const ctx = { tenantId: 'inst-1', userId: 'user-1' };
    const row = archiveRowToInsert(ctx, rows[0]);
    expect(row).toMatchObject({
      instance_id: 'inst-1', created_by: 'user-1',
      title: 'Total Praise', youtube_url: 'https://www.youtube.com/watch?v=abcdefghijk',
      video_id: 'abcdefghijk', start_seconds: 612, service_date: '2026-05-10',
      service_type: 'sunday', scripture_ref: 'Psalm 121',
      source: 'archive', confidence: 'high', needs_review: false, status: 'active',
    });
  });

  it('FAITHFUL: anything below HIGH confidence imports flagged needs_review', () => {
    const { rows } = parseRepertoireJson(repertoire);
    const ctx = { tenantId: 'inst-1', userId: 'user-1' };
    expect(archiveRowToInsert(ctx, rows[1]).needs_review).toBe(true);
  });

  it('PROVEN-TO-CATCH: a song with no anchor/title is never seeded', () => {
    const { rows } = parseRepertoireJson({ songs: [{ video_id: 'x', confidence: 'low' }] });
    expect(rows).toHaveLength(0);
  });
});
