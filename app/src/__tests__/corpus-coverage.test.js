// @vitest-environment node
//
// corpus-coverage — the channel-vs-app wholeness readout (DR-0135). The rules
// it must hold: an ungenerated manifest NEVER reads as full coverage (unknown
// never reads whole — DR-0076/DR-0125), missing videos are NAMED not counted
// away, and the recorded 125-of-335 gap stays visible with provenance until a
// real manifest replaces it.
import { describe, it, expect } from 'vitest';
import { corpusCoverage, corpusManifest, CORPUS_GAP_FOUND } from '../lib/corpus-coverage.js';
import { parseServiceTitle } from '../lib/youtube-title-parse.js';

const LIVE = [{ video_id: 'a' }, { videoId: 'b' }, { video_id: null }];

describe('corpusCoverage — unknown never reads whole', () => {
  it('an ungenerated manifest reads NOT ready and carries the recorded gap, never "whole"', () => {
    const out = corpusCoverage(LIVE, { generatedAt: null, videos: [] });
    expect(out.manifestReady).toBe(false);
    expect(out.expected).toBeNull();
    expect(out.note).toContain('not yet generated');
    expect(out.note).toContain('125');
    expect(out.note).toContain('335');
  });
  it('the shipped placeholder manifest is honestly ungenerated (until the reconcile runs)', () => {
    const m = corpusManifest();
    if (!m.generatedAt) {
      expect(corpusCoverage(LIVE).manifestReady).toBe(false);
    } else {
      expect(m.videos.length).toBeGreaterThan(0); // a generated manifest must carry the list
    }
  });
  it('the recorded gap carries provenance to the artifact that proves it', () => {
    expect(CORPUS_GAP_FOUND.provenance).toContain('0013');
    expect(CORPUS_GAP_FOUND.seedRows).toBe(125);
    expect(CORPUS_GAP_FOUND.channelVideosAtGeneration).toBe(335);
  });
});

describe('corpusCoverage — with a real manifest, missing videos are NAMED', () => {
  const manifest = {
    generatedAt: '2026-07-10',
    videos: [{ videoId: 'a' }, { videoId: 'b' }, { videoId: 'c' }, { videoId: 'd' }],
  };
  it('names each missing video instead of a bare count', () => {
    const out = corpusCoverage(LIVE, manifest);
    expect(out.manifestReady).toBe(true);
    expect(out.expected).toBe(4);
    expect(out.livePresent).toBe(2);
    expect(out.missing.map((v) => v.videoId)).toEqual(['c', 'd']);
    expect(out.note).toContain('MISSING');
  });
  it('reads whole only when every expected video is live', () => {
    const out = corpusCoverage(
      [{ video_id: 'a' }, { video_id: 'b' }, { video_id: 'c' }, { video_id: 'd' }],
      manifest,
    );
    expect(out.missing).toEqual([]);
    expect(out.note).toContain('Whole');
  });
  it('degrades honestly on empty live rows (all expected read missing, not zero)', () => {
    const out = corpusCoverage([], manifest);
    expect(out.missing).toHaveLength(4);
  });
});

describe('youtube-title-parse — the apostrophe regression that truncated real titles', () => {
  it('keeps an apostrophe inside a double-quoted message title', () => {
    const p = parseServiceTitle('5 -13 - 26 Bishop Lloyd E. Gwin Wednesday Bible Study "I’LL TRUST HIM ANYHOW"');
    expect(p.title).toContain('TRUST HIM');
    expect(p.title).not.toBe('I'); // the shipped 0013 truncation
  });
  it('still parses the observed channel shapes (date, type, speaker, quoted title)', () => {
    const p = parseServiceTitle('6 -10 - 2026 Bishop E. Gwin  "LET GO AND LET GOD HELP YOU"');
    expect(p).toMatchObject({ serviceDate: '2026-06-10', serviceType: 'sunday', title: 'LET GO AND LET GOD HELP YOU' });
    const w = parseServiceTitle('6 -3 - 2026 Bishop Lloyd Gwin Wednesday Bible Study "THANK YOU"');
    expect(w.serviceType).toBe('wednesday');
  });
  it('an undated special-event title parses with a null date (it lands, labeled undated — never dropped)', () => {
    const p = parseServiceTitle('Roline Brumfield Homegoing Service');
    expect(p.serviceDate).toBeNull();
    // A homegoing is now correctly labeled a funeral (Darrell 2026-07-14) — not
    // defaulted to 'sunday'. It still LANDS (undated, never dropped).
    expect(p.serviceType).toBe('funeral');
  });
});
