// =============================================================================
// sermon-points — BG's numbered teaching outline under each library video.
// =============================================================================
// PROVEN-TO-CATCH (DR-0076): each point must be a REAL sentence from the source
// and each scripture must literally appear near its point — if a change makes
// extraction paint or drop real points, these go red. Mirrors the design bar:
// "list the harvest-extracted POINTS so a user can pick a video by its points."
import { describe, it, expect } from 'vitest';
import {
  extractSermonPoints, pointsFromHarvest, pointsFromPrep, pointsForVideo, pointsSearchText,
} from '../lib/sermon-points.js';

// A compact, realistic caption run in BG's numbered-outline shape (the 5-point
// Elijah message named in the brief; Isaiah 61:7 / 2 Kings 2:9-10).
const TRANSCRIPT = `
>> Amen, hallelujah. Turn with me as we look at the life of Elijah. [Music]
Number one, God will give you a double portion for your trouble. The Bible says in
Isaiah 61:7, instead of your shame you will receive a double portion. That is a promise.
The second thing you must know is that you have to ask for it. In 2 Kings 2:9 Elisha said,
let a double portion of your spirit be upon me. You have to open your mouth and ask.
My third point this morning is that you must keep your eyes on the mantle. 2 Kings 2:10
says if you see me when I am taken you will have it. Watch this, keep watching.
Number four, the mantle falls where the man of God walked. Do not leave your place.
And the fifth thing, God finishes what He starts in you. Amen, can I get a witness?
`;

describe('extractSermonPoints', () => {
  const points = extractSermonPoints(TRANSCRIPT);

  it('pulls BG\'s numbered outline in order', () => {
    expect(points.length).toBeGreaterThanOrEqual(4);
    expect(points.map((p) => p.n)).toEqual([...points.map((p) => p.n)].sort((a, b) => a - b));
    // First point is the double-portion claim, a real sentence from the transcript.
    expect(points[0].text.toLowerCase()).toContain('double portion');
  });

  it('attaches the scripture read under each point', () => {
    const first = points.find((p) => /double portion/i.test(p.text));
    expect(first.scriptures).toContain('Isaiah 61:7');
    const second = points.find((p) => /ask/i.test(p.text));
    expect(second.scriptures.some((s) => s.startsWith('2 Kings 2:9'))).toBe(true);
  });

  it('invents nothing — empty transcript yields no points', () => {
    expect(extractSermonPoints('')).toEqual([]);
    expect(extractSermonPoints('Amen. Hallelujah. Praise God.')).toEqual([]);
  });
});

describe('pointsFromHarvest', () => {
  it('reads recorded lessons refs as ordered points with scriptures', () => {
    const row = { harvests: { lessons: { status: 'partial', refs: [
      'The first thing is God gives a double portion — Isaiah 61:7.',
      'You have to ask for it in 2 Kings 2:9.',
    ] } } };
    const pts = pointsFromHarvest(row);
    expect(pts).toHaveLength(2);
    expect(pts[0].n).toBe(1);
    expect(pts[0].scriptures).toContain('Isaiah 61:7');
  });

  it('is empty when there are no lessons refs', () => {
    expect(pointsFromHarvest(null)).toEqual([]);
    expect(pointsFromHarvest({ harvests: {} })).toEqual([]);
  });
});

// A parsed prep outline (sermon_prep row shape) — BG's own emailed structure.
const PREP = {
  points: [
    { n: 1, text: 'Elijah Is Standing Before Ahab', scriptures: ['1 Kings 17:1'],
      subpoints: [{ label: 'A', text: 'By The Brook Cherith', scriptures: ['1 Kings 17:2-6'] }] },
    { n: 2, text: 'God Sustains Elijah', scriptures: ['1 Kings 18:1-2'], subpoints: [] },
  ],
  scriptures: ['Isaiah 61:7', '2 Kings 2:9-10', '1 Kings 17:1', '1 Kings 17:2-6', '1 Kings 18:1-2'],
  theme: "Don't Allow Any Struggles To Distract You From Your Double!",
};

describe('pointsFromPrep', () => {
  it('reads BG\'s numbered points, their scriptures, and sub-points', () => {
    const pts = pointsFromPrep(PREP);
    expect(pts.map((p) => p.n)).toEqual([1, 2]);
    expect(pts[0].scriptures).toContain('1 Kings 17:1');
    expect(pts[0].subpoints[0].label).toBe('A');
    expect(pts[0].subpoints[0].scriptures).toContain('1 Kings 17:2-6');
  });
  it('is empty for a null / point-less prep', () => {
    expect(pointsFromPrep(null)).toEqual([]);
    expect(pointsFromPrep({ scriptures: ['Matthew 5:13'] })).toEqual([]);
  });
});

describe('pointsForVideo — prep (BG email) wins over everything', () => {
  it('prefers the prep outline over harvest AND transcript', () => {
    const b = pointsForVideo({
      sermon: { title: 'Double', scriptureRef: '2 Kings 2' },
      prep: PREP,
      harvestRow: { harvests: { lessons: { refs: ['some transcript beat — John 3:16'] } } },
      transcript: { text: TRANSCRIPT },
    });
    expect(b.source).toBe('prep');
    expect(b.points.map((p) => p.n)).toEqual([1, 2]);
    // BG's own scripture feed leads the strip (his key text first).
    expect(b.scriptures[0]).toBe('Isaiah 61:7');
    expect(b.scriptures).toContain('1 Kings 17:2-6'); // sub-point ref rolled in
  });

  it('a scriptures-only prep (reading service) supplies the strip and still wins', () => {
    const b = pointsForVideo({
      sermon: { title: 'Are You Salty' },
      prep: { points: [], scriptures: ['Matthew 5:13', 'Matthew 5:14-16'] },
      transcript: { text: TRANSCRIPT }, // must NOT override BG's own (empty) outline
    });
    expect(b.source).toBe('prep');
    expect(b.points).toHaveLength(0);
    expect(b.scriptures).toEqual(['Matthew 5:13', 'Matthew 5:14-16']);
  });

  it('falls through to harvest/transcript when there is no prep', () => {
    const b = pointsForVideo({ sermon: { title: 'Elijah' }, prep: null, transcript: { text: TRANSCRIPT } });
    expect(b.source).toBe('transcript');
  });
});

describe('pointsForVideo — source precedence + graceful fallback', () => {
  it('prefers the harvest lane over the transcript', () => {
    const b = pointsForVideo({
      sermon: { title: 'Elijah', scriptureRef: '2 Kings 2' },
      harvestRow: { harvests: { lessons: { refs: ['God gives a double portion — Isaiah 61:7.'] } } },
      transcript: { text: TRANSCRIPT },
    });
    expect(b.source).toBe('harvest');
    expect(b.count).toBe(1);
  });

  it('derives from the transcript when no harvest row', () => {
    const b = pointsForVideo({ sermon: { title: 'Elijah' }, transcript: { text: TRANSCRIPT } });
    expect(b.source).toBe('transcript');
    expect(b.points.length).toBeGreaterThanOrEqual(4);
  });

  it('falls back to title scriptures — never a broken empty state', () => {
    const b = pointsForVideo({ sermon: { title: 'A word on Psalm 23', scriptureRef: 'Psalm 23:1' } });
    expect(b.points).toHaveLength(0);
    expect(b.source).toBe('title');
    expect(b.scriptures).toContain('Psalm 23:1');
  });

  it('rolls anchor + point scriptures into one deduped strip', () => {
    const b = pointsForVideo({ sermon: { scriptureRef: 'Isaiah 61:7' }, transcript: { text: TRANSCRIPT } });
    // anchor Isaiah 61:7 appears once even though a point also cites it.
    expect(b.scriptures.filter((s) => s === 'Isaiah 61:7')).toHaveLength(1);
  });
});

describe('pointsSearchText — point-based discovery', () => {
  it('folds point text + scriptures into one searchable string', () => {
    const b = pointsForVideo({ sermon: { title: 'Elijah' }, transcript: { text: TRANSCRIPT } });
    const hay = pointsSearchText(b).toLowerCase();
    expect(hay).toContain('double portion'); // "show me the one about double portion"
    expect(hay).toContain('isaiah 61:7');
  });
  it('is a safe empty string for a null bundle', () => {
    expect(pointsSearchText(null)).toBe('');
  });
});
