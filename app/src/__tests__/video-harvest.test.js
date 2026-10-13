// Tests for the one-source-many-harvests model + coverage ledger math
// (Darrell 2026-06-25: "No video should be lost to that Sunday or Wednesday").
// Locks the harvest-type registry, per-video coverage, the real-state signal
// bridge (anti-painted-number), orphan detection, and the corpus roll-up that
// MEASURES no-video-lost. Pure module -> no mocks. Pairs with RELEASE-TIERS
// (tests ship with the feature) + DR-0076 (verified, not claimed).
import { describe, it, expect } from 'vitest';
import {
  HARVEST_TYPES, HARVEST_KEYS, harvestType, STATUS,
  normalizeHarvest, harvestMapFor, videoCoverage,
  deriveSignals, mergeHarvests, flagVideo, sortForProcessing,
  harvestLedgerSummary, buildLedger, ledgerBanner,
} from '../lib/video-harvest.js';

describe('harvest-type registry', () => {
  it('has the full fan-out set including the foundation transcript', () => {
    expect(HARVEST_KEYS).toEqual(expect.arrayContaining([
      'transcript', 'sermon', 'scripture', 'songs', 'lessons',
      'discernment', 'testimony', 'trivia', 'events',
    ]));
    expect(harvestType('transcript').foundation).toBe(true);
    expect(harvestType('nope')).toBeNull();
  });
  it('marks every non-foundation harvest as derived from the transcript (reuse, not re-fetch)', () => {
    for (const t of HARVEST_TYPES) {
      if (!t.foundation) expect(t.derived).toBe('transcript');
    }
  });
});

describe('normalizeHarvest', () => {
  it('defaults unknown/missing to an honest none', () => {
    const n = normalizeHarvest(undefined);
    expect(n.status).toBe('none');
    expect(n.count).toBe(0);
    expect(n.refs).toEqual([]);
    expect(n.evidenced).toBe(false);
  });
  it('reads snake_case jsonb keys straight off a row', () => {
    const n = normalizeHarvest({ status: 'complete', count: 3, harvested_at: 'x', harvested_by: 'u', refs: ['John 3:16'] });
    expect(n).toMatchObject({ status: 'complete', count: 3, harvestedAt: 'x', harvestedBy: 'u', refs: ['John 3:16'] });
  });
  it('rejects a bad status and negative counts', () => {
    expect(normalizeHarvest({ status: 'bogus' }).status).toBe('none');
    expect(normalizeHarvest({ status: 'partial', count: -5 }).count).toBe(0);
  });
});

describe('videoCoverage', () => {
  it('an empty map is 0% and fully untouched', () => {
    const c = videoCoverage({});
    expect(c.pct).toBe(0);
    expect(c.started).toBe(false);
    expect(c.fullyHarvested).toBe(false);
    expect(c.untouchedTypes.length).toBe(HARVEST_KEYS.length);
  });
  it('all-complete reads as fully harvested at 100%', () => {
    const map = Object.fromEntries(HARVEST_KEYS.map((k) => [k, { status: 'complete' }]));
    const c = videoCoverage(map);
    expect(c.pct).toBe(100);
    expect(c.fullyHarvested).toBe(true);
    expect(c.untouchedTypes).toEqual([]);
  });
  it("'na' types drop out of the denominator (a Bible study with no song still hits 100%)", () => {
    const map = Object.fromEntries(HARVEST_KEYS.map((k) => [k, { status: k === 'songs' ? 'na' : 'complete' }]));
    const c = videoCoverage(map);
    expect(c.na).toBe(1);
    expect(c.total).toBe(HARVEST_KEYS.length - 1);
    expect(c.fullyHarvested).toBe(true);
  });
  it('partial counts as half and keeps the video out of fully-harvested', () => {
    const map = { transcript: { status: 'complete' }, sermon: { status: 'partial' } };
    const c = videoCoverage(map);
    expect(c.partial).toBe(1);
    expect(c.fullyHarvested).toBe(false);
    // 1 complete + 0.5 partial over all applicable types
    expect(c.ratio).toBeCloseTo(1.5 / HARVEST_KEYS.length, 5);
  });
});

describe('deriveSignals (real-state, anti-painted-number)', () => {
  it('a sermon row evidences the message; a scripture ref evidences scripture', () => {
    const sig = deriveSignals({ sermon: { scriptureRef: 'Romans 8:28' } });
    expect(sig.sermon).toMatchObject({ status: 'complete', evidenced: true });
    expect(sig.scripture).toMatchObject({ status: 'partial', refs: ['Romans 8:28'], evidenced: true });
  });
  it('linked songs evidence the songs harvest by real count', () => {
    const sig = deriveSignals({ songs: [{ id: 1 }, { id: 2 }] });
    expect(sig.songs).toMatchObject({ status: 'partial', count: 2, evidenced: true });
  });
  it('no sermon + no songs yields no signals (honest absence)', () => {
    expect(deriveSignals({})).toEqual({});
  });
});

describe('mergeHarvests', () => {
  it('real evidence strengthens an untouched type and marks it evidenced', () => {
    const merged = mergeHarvests({}, deriveSignals({ sermon: {} }));
    expect(merged.sermon.status).toBe('complete');
    expect(merged.sermon.evidenced).toBe(true);
  });
  it('never downgrades a recorded complete', () => {
    const merged = mergeHarvests({ songs: { status: 'complete', count: 4 } }, { songs: { status: 'partial', count: 1 } });
    expect(merged.songs.status).toBe('complete');
    expect(merged.songs.count).toBe(4);
  });
  it("a steward 'na' is not flipped back on by evidence", () => {
    const merged = mergeHarvests({ songs: { status: 'na' } }, { songs: { status: 'partial', count: 2 } });
    expect(merged.songs.status).toBe('na');
  });
});

describe('flagVideo + sortForProcessing', () => {
  it('flags an ingested-but-unmined video as an orphan', () => {
    expect(flagVideo({ videoId: 'a', harvests: {} }).flag).toBe('orphan');
  });
  it('flags a started-but-incomplete video as partial', () => {
    expect(flagVideo({ videoId: 'a', harvests: { sermon: { status: 'complete' } } }).flag).toBe('partial');
  });
  it('flags a fully-harvested video as ok', () => {
    const full = Object.fromEntries(HARVEST_KEYS.map((k) => [k, { status: 'complete' }]));
    expect(flagVideo({ videoId: 'a', harvests: full }).flag).toBe('ok');
  });
  it('surfaces under-harvested first: orphan, then partial, then ok', () => {
    const full = Object.fromEntries(HARVEST_KEYS.map((k) => [k, { status: 'complete' }]));
    const rows = [
      flagVideo({ videoId: 'ok', serviceDate: '2026-06-01', harvests: full }),
      flagVideo({ videoId: 'orphan', serviceDate: '2026-06-02', harvests: {} }),
      flagVideo({ videoId: 'partial', serviceDate: '2026-06-03', harvests: { sermon: { status: 'complete' } } }),
    ];
    expect(sortForProcessing(rows).map((r) => r.videoId)).toEqual(['orphan', 'partial', 'ok']);
  });
});

describe('harvestLedgerSummary', () => {
  it('an empty corpus is vacuously no-video-lost but shows zero videos for the empty state', () => {
    const s = harvestLedgerSummary([]);
    expect(s.videos).toBe(0);
    expect(s.noVideoLost).toBe(true);
    expect(s.avgPct).toBe(0);
  });
  it('one orphan trips no-video-lost to false', () => {
    const s = harvestLedgerSummary([{ videoId: 'a', harvests: {} }]);
    expect(s.orphans).toBe(1);
    expect(s.noVideoLost).toBe(false);
  });
  it('byType counts complete/partial/none/evidenced across the corpus', () => {
    const s = harvestLedgerSummary([
      { videoId: 'a', harvests: { sermon: { status: 'complete', evidenced: true } } },
      { videoId: 'b', harvests: { sermon: { status: 'partial' } } },
    ]);
    expect(s.byType.sermon.complete).toBe(1);
    expect(s.byType.sermon.partial).toBe(1);
    expect(s.byType.sermon.evidenced).toBe(1);
    expect(s.byType.lessons.none).toBe(2);
  });
});

describe('buildLedger — the honest corpus bridge', () => {
  const sermon = { videoId: 'vid1', title: 'Let Go', serviceDate: '2026-06-08', serviceType: 'sunday', scriptureRef: 'Psalm 46:10' };

  it('an ingested sermon with no ledger row is an orphan... but scripture+message are evidenced from the row', () => {
    const s = buildLedger({ sermons: [sermon], harvests: [], songs: [] });
    expect(s.videos).toBe(1);
    const row = s.rows[0];
    // message + scripture come straight off the real sermon row...
    expect(row.harvests.sermon.evidenced).toBe(true);
    expect(row.harvests.scripture.evidenced).toBe(true);
    // ...but the rest are untouched, so it's still partial (started), not lost.
    expect(row.flag).toBe('partial');
    expect(s.noVideoLost).toBe(true);
  });

  it('a manual sermon with no videoId is not counted as a harvestable video', () => {
    const s = buildLedger({ sermons: [{ title: 'manual', videoId: null }], harvests: [], songs: [] });
    expect(s.videos).toBe(0);
  });

  it('songs linked by source_video_id evidence the songs harvest', () => {
    const s = buildLedger({
      sermons: [sermon],
      harvests: [],
      songs: [{ id: 's1', sourceVideoId: 'vid1' }, { id: 's2', sourceVideoId: 'vid1' }, { id: 's3', sourceVideoId: 'other' }],
    });
    const row = s.rows.find((r) => r.videoId === 'vid1');
    expect(row.harvests.songs.status).toBe('partial');
    expect(row.harvests.songs.count).toBe(2);
    expect(row.harvests.songs.evidenced).toBe(true);
  });

  it('recorded off-app harvests (lessons/discernment) merge with real signals', () => {
    const s = buildLedger({
      sermons: [sermon],
      harvests: [{ videoId: 'vid1', harvests: { lessons: { status: 'complete' }, discernment: { status: 'partial' } } }],
      songs: [],
    });
    const row = s.rows[0];
    expect(row.harvests.lessons.status).toBe('complete');
    expect(row.harvests.discernment.status).toBe('partial');
    expect(row.harvests.sermon.evidenced).toBe(true); // still cross-checked against the row
  });

  it('a lesson-recording harvest row with no matching sermon is still included', () => {
    const s = buildLedger({
      sermons: [],
      harvests: [{ videoId: 'lesson1', sourceKind: 'lesson', title: 'Keyboard 101', harvests: { lessons: { status: 'complete' } } }],
      songs: [],
    });
    expect(s.videos).toBe(1);
    expect(s.rows[0].sourceKind).toBe('lesson');
  });

  it('a fully-mined video reports ok and keeps no-video-lost true', () => {
    const full = Object.fromEntries(HARVEST_KEYS.map((k) => [k, { status: 'complete' }]));
    const s = buildLedger({ sermons: [sermon], harvests: [{ videoId: 'vid1', harvests: full }], songs: [] });
    expect(s.rows[0].flag).toBe('ok');
    expect(s.fullyHarvested).toBe(1);
    expect(s.noVideoLost).toBe(true);
  });

  it('STATUS enum is the contract the writer uses', () => {
    expect(STATUS).toMatchObject({ NONE: 'none', PARTIAL: 'partial', COMPLETE: 'complete', NA: 'na' });
    expect(harvestMapFor(null).transcript.status).toBe('none');
  });
});

// Surface-says-truth pin (DR-0239 review 2026-08-05): the pinned banner may
// only read green when the corpus is ACTUALLY fully mined. The prior two-state
// banner showed success-green "every ingested recording has been mined" over a
// 0/858-fully-harvested, avg-26% corpus — teaching the steward the work was
// done while the transcript pipeline sat stalled for a month.
describe('ledgerBanner — three honest states, green only when truly done', () => {
  it('orphans present -> lost (red), with the count', () => {
    const b = ledgerBanner({ videos: 10, orphans: 3, fullyHarvested: 0 });
    expect(b.state).toBe('lost');
    expect(b.text).toContain('3 recordings not yet mined');
  });
  it('no orphans but harvests still owed -> mining (amber), NEVER a done claim', () => {
    const b = ledgerBanner({ videos: 858, orphans: 0, fullyHarvested: 0 });
    expect(b.state).toBe('mining');
    expect(b.text).toContain('858 still owe');
    expect(b.text).not.toMatch(/has been mined|fully mined/);
  });
  it('every video fully harvested -> done (the only green)', () => {
    const b = ledgerBanner({ videos: 5, orphans: 0, fullyHarvested: 5 });
    expect(b.state).toBe('done');
    expect(b.text).toContain('fully mined');
  });
  it('empty corpus never claims done', () => {
    expect(ledgerBanner({ videos: 0, orphans: 0, fullyHarvested: 0 }).state).toBe('mining');
  });
});
