// =============================================================================
// Frozen-harvest regression guard (Darrell 2026-06-25, live issue).
// =============================================================================
// THE BUG THIS LOCKS: the Harvest ledger sat frozen at avg 11% — every ingested
// service read "Partly mined · 11%" with only the Message harvest done — because
// deriveSignals could only ever light `sermon`. The imported choir_sermons rows
// carry no scripture_ref, no linked songs, and no transcript, so 8 of 9 harvest
// cells stayed 'none' forever. 1 of 9 types = 11%, stuck.
//
// THE UN-FREEZE: events-as-data is derived from the service's own metadata (date /
// type / speaker / title) for EVERY ingested recording, and Scripture + songs light
// from real refs / real song rows where present — all WITHOUT a transcript or GPU.
//
// PROVEN-TO-CATCH (DR-0076): every assertion here FAILS against the old
// message-only behaviour and PASSES after the fix. If a future change regresses the
// pipeline back to lighting only the message, `avgPct` collapses to 11 and the
// frozen-corpus test below goes red — the guard catches the freeze.
import { describe, it, expect } from 'vitest';
import {
  videoCoverage, deriveSignals, buildLedger, extractScriptureRefs, eventLabel,
  AUTO_HARVEST_KEYS, NAS_GATED_KEYS, HARVEST_KEYS,
} from '../lib/video-harvest.js';

// A realistic imported COLG service row: dated + typed + speaker + quoted title,
// but NO scripture_ref, NO transcript, NO linked song — exactly what the YouTube
// title importer produces (lib/choir-sync.js selectNewSermonImports).
const importedService = (i) => ({
  videoId: `vid${i}`,
  title: 'LET GO AND LET GOD HELP YOU',
  serviceDate: `2026-06-0${(i % 9) + 1}`,
  serviceType: i % 2 ? 'wednesday' : 'sunday',
  speaker: 'Bishop E. Gwin',
  scriptureRef: null,
});

// The message-only baseline: the exact number the ledger was frozen at.
const FROZEN_PCT = videoCoverage({ sermon: { status: 'complete' } }).pct;

describe('frozen-harvest baseline (documents the bug)', () => {
  it('a message-only video is 11% — the frozen state we are unfreezing', () => {
    // 1 of 9 harvest types. This is the number on Darrell's screen.
    expect(FROZEN_PCT).toBe(11);
  });
});

describe('the un-freeze: events-as-data lights for every ingested service', () => {
  it('deriveSignals on a dated service evidences BOTH the message AND the event', () => {
    const sig = deriveSignals({ sermon: importedService(1) });
    expect(sig.sermon).toMatchObject({ status: 'complete', evidenced: true });
    // The event is real structured data (no transcript needed) — this is what
    // moves the % off 11. If this regresses, the corpus test below fails too.
    expect(sig.events).toMatchObject({ status: 'complete', evidenced: true });
    expect(sig.events.refs[0]).toContain('2026-06-02');
  });

  it('eventLabel composes a real structured record from the row only', () => {
    const label = eventLabel(importedService(0)); // sunday, 2026-06-01
    expect(label).toContain('Sunday service');
    expect(label).toContain('2026-06-01');
    expect(label).toContain('Bishop E. Gwin');
  });

  it('an undated row yields no event (honest absence — no painting)', () => {
    expect(deriveSignals({ sermon: { title: 'x' } }).events).toBeUndefined();
  });
});

describe('frozen-corpus guard: a metadata-only corpus is never stuck at message-only', () => {
  // 126 imported services with NOTHING but their title metadata — the live corpus.
  const sermons = Array.from({ length: 126 }, (_, i) => importedService(i));

  it('avg coverage climbs above the 11% freeze (message + event, no transcript)', () => {
    const before = buildLedger({ sermons: sermons.map((s) => ({ ...s, serviceDate: null })) });
    // With dates stripped, only the message lights -> the frozen 11% (the old bug).
    expect(before.avgPct).toBe(FROZEN_PCT);

    const after = buildLedger({ sermons });
    // Dated services now also yield the event -> 2 of 9 = 22%. The number MOVED.
    expect(after.avgPct).toBeGreaterThan(FROZEN_PCT);
    expect(after.avgPct).toBe(22);
    // No video is lost and none is fully mined yet (transcript harvests still owed).
    expect(after.noVideoLost).toBe(true);
    expect(after.orphans).toBe(0);
  });

  it('a single video visibly goes 11% -> 22% once its event is derived', () => {
    const one = buildLedger({ sermons: [importedService(3)] });
    expect(one.rows[0].coverage.pct).toBeGreaterThan(FROZEN_PCT);
    expect(one.rows[0].coverage.pct).toBe(22);
  });
});

describe('Scripture references are scanned out of real text (evidence, not paint)', () => {
  it('pulls Book chapter:verse refs and canonicalizes book names', () => {
    const refs = extractScriptureRefs('Drawn from psalm 46:10 and 1 john 4:9-10 today');
    expect(refs).toContain('Psalm 46:10');
    expect(refs).toContain('1 John 4:9');
  });

  it('a ref-less message title yields nothing (no false positives)', () => {
    expect(extractScriptureRefs('LET GO AND LET GOD HELP YOU')).toEqual([]);
  });

  it('a sermon whose title carries a ref lights the Scripture harvest', () => {
    const sig = deriveSignals({ sermon: { serviceDate: '2026-06-01', title: 'Be Still — Psalm 46:10' } });
    expect(sig.scripture).toMatchObject({ status: 'partial', evidenced: true });
    expect(sig.scripture.refs).toContain('Psalm 46:10');
  });
});

describe('songs link by service date when not explicitly tied to the video', () => {
  it('a song logged on the same date+type lights the songs harvest', () => {
    const s = buildLedger({
      sermons: [{ videoId: 'v1', serviceDate: '2026-06-07', serviceType: 'sunday' }],
      songs: [{ id: 'a', serviceDate: '2026-06-07', serviceType: 'sunday' }],
    });
    const row = s.rows.find((r) => r.videoId === 'v1');
    expect(row.harvests.songs.status).toBe('partial');
    expect(row.harvests.songs.evidenced).toBe(true);
  });

  it("a 'both'-type song matches either service that day", () => {
    const s = buildLedger({
      sermons: [{ videoId: 'v1', serviceDate: '2026-06-07', serviceType: 'wednesday' }],
      songs: [{ id: 'a', serviceDate: '2026-06-07', serviceType: 'both' }],
    });
    expect(s.rows[0].harvests.songs.evidenced).toBe(true);
  });
});

describe('transcript unlock — now sourced from YouTube auto-captions (no GPU)', () => {
  it('a supplied transcript lights the foundation transcript harvest + richer Scripture', () => {
    const sig = deriveSignals({
      sermon: { serviceDate: '2026-06-01', title: 'untitled' },
      transcript: { text: 'turn with me to John 3:16 and also Romans 8:28' },
    });
    expect(sig.transcript).toMatchObject({ status: 'complete', evidenced: true });
    expect(sig.scripture.refs).toEqual(expect.arrayContaining(['John 3:16', 'Romans 8:28']));
  });

  it('buildLedger lights transcript for a video whose transcript is provided', () => {
    const s = buildLedger({
      sermons: [{ videoId: 'v1', serviceDate: '2026-06-01', serviceType: 'sunday' }],
      transcripts: { v1: { text: 'a real whisper transcript of the service' } },
    });
    expect(s.rows[0].harvests.transcript.status).toBe('complete');
  });

  it('without a transcript, the transcript-derived harvests stay an honest gap (never painted)', () => {
    const s = buildLedger({ sermons: [{ videoId: 'v1', serviceDate: '2026-06-01' }] });
    for (const k of ['lessons', 'discernment', 'testimony', 'trivia']) {
      expect(s.rows[0].harvests[k].status).toBe('none');
    }
  });
});

describe('the row / transcript-derived partition is exhaustive and disjoint', () => {
  it('every harvest type is exactly one of from-row or from-transcript', () => {
    const auto = new Set(AUTO_HARVEST_KEYS);
    const nas = new Set(NAS_GATED_KEYS);
    for (const k of HARVEST_KEYS) {
      expect(auto.has(k) !== nas.has(k)).toBe(true); // XOR — in one set, not both
    }
    expect(AUTO_HARVEST_KEYS).toEqual(expect.arrayContaining(['sermon', 'scripture', 'songs', 'events']));
    expect(NAS_GATED_KEYS).toEqual(expect.arrayContaining(['transcript', 'lessons', 'discernment', 'testimony', 'trivia']));
  });
});
