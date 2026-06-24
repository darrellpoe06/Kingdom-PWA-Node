// =============================================================================
// choir-renditions — "the ways we've sung this" model tests (proven-to-catch).
// A rendition is a real choir_songs row; these lock the per-performance
// expansion, ad-lib normalization/honesty, rendition-level loves, the
// master-program ref, and ad-lib graduation. Pure — deterministic `today`.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  normalizeAdLib, parseAdLibs, visibleAdLibs, setAdLibReview, adLibSummary,
  needsSourceReview, buildRenditions, tallyRenditionLoves, mostLovedRendition,
  renditionRef, resolveProgramRendition, renditionLabel, graduateAdLib,
  AD_LIB_TYPES, SOURCE_REVIEW_CONFIDENCE,
} from '../lib/choir-renditions.js';

const TODAY = '2026-06-24';

// "Total Praise" sung three times (two past, one scheduled) + an archived row
// that must never surface. Each row is a rendition; ad_libs/source vary.
const rows = [
  {
    id: 'r1', title: 'Total Praise', serviceDate: '2026-05-10', serviceType: 'sunday', status: 'active',
    youtubeUrl: 'https://youtu.be/abcdefghijk', startSeconds: 600, songKey: 'Ab', arrangement: 'Choir + solo', soloist: 'Sis. M',
    keyboardistNotes: 'Modulate up a half step into the tag.',
    adLibs: [
      { id: 'a', type: 'vamp', label: 'Extended vamp on the tag', at: 740 },
      { id: 'b', type: 'run', label: 'Soprano run', at: 120, soloist: 'Sis. M' },
    ],
    renditionSource: 'manual',
  },
  {
    id: 'r2', title: 'total praise!', serviceDate: '2026-06-14', serviceType: 'sunday', status: 'active',
    youtubeUrl: null, startSeconds: null, adLibs: [], source: 'archive', videoId: 'vid123', confidence: 'low', needsReview: true,
  },
  {
    id: 'r3', title: 'Total Praise', serviceDate: '2026-07-05', serviceType: 'sunday', status: 'active', adLibs: [],
  },
  {
    id: 'z9', title: 'Total Praise', serviceDate: '2026-01-01', serviceType: 'sunday', status: 'archived', adLibs: [],
  },
];

describe('normalizeAdLib — coerces to shape, never invents', () => {
  it('keeps a curated ad-lib and defaults safely', () => {
    const a = normalizeAdLib({ type: 'vamp', label: 'Big vamp', at: 90 }, 0);
    expect(a).toMatchObject({ type: 'vamp', label: 'Big vamp', at: 90, source: 'curated', review: 'confirmed', confidence: null });
    expect(a.id).toBeTruthy();
  });
  it('a detected ad-lib starts unreviewed and keeps its confidence', () => {
    const a = normalizeAdLib({ type: 'run', label: 'Run', source: 'detected', confidence: 0.8 });
    expect(a.source).toBe('detected');
    expect(a.review).toBe('unreviewed');
    expect(a.confidence).toBe(0.8);
  });
  it('clamps confidence to 0..1', () => {
    expect(normalizeAdLib({ label: 'x', source: 'detected', confidence: 5 }).confidence).toBe(1);
    expect(normalizeAdLib({ label: 'x', source: 'detected', confidence: -2 }).confidence).toBe(0);
  });
  it('PROVEN-TO-CATCH: an empty/typeless entry is dropped (no fabrication)', () => {
    expect(normalizeAdLib({})).toBeNull();
    expect(normalizeAdLib(null)).toBeNull();
    expect(normalizeAdLib('not an object')).toBeNull();
  });
  it('an unknown type falls back to "other", not invented', () => {
    expect(normalizeAdLib({ type: 'zzz', label: 'thing' }).type).toBe('other');
  });
});

describe('parseAdLibs — tolerant of array or JSON string', () => {
  it('parses an array', () => {
    expect(parseAdLibs([{ type: 'vamp', label: 'v' }]).length).toBe(1);
  });
  it('parses a JSON string and never throws on garbage', () => {
    expect(parseAdLibs('[{"type":"run","label":"r"}]').length).toBe(1);
    expect(parseAdLibs('not json')).toEqual([]);
    expect(parseAdLibs(null)).toEqual([]);
    expect(parseAdLibs(42)).toEqual([]);
  });
});

describe('visibleAdLibs — orders by time, drops rejected', () => {
  it('sorts by time-in-song (untimed last)', () => {
    const out = visibleAdLibs(parseAdLibs(rows[0].adLibs));
    expect(out.map((a) => a.id)).toEqual(['b', 'a']); // 120s before 740s
  });
  it('hides rejected unless asked', () => {
    const list = [normalizeAdLib({ id: 'x', type: 'vamp', label: 'v', review: 'rejected' })];
    expect(visibleAdLibs(list)).toHaveLength(0);
    expect(visibleAdLibs(list, { includeRejected: true })).toHaveLength(1);
  });
});

describe('setAdLibReview — flips one, returns a new array', () => {
  it('confirms the named ad-lib only', () => {
    const list = parseAdLibs([{ id: 'a', type: 'vamp', label: 'v', source: 'detected' }, { id: 'b', type: 'run', label: 'r', source: 'detected' }]);
    const next = setAdLibReview(list, 'a', 'confirmed');
    expect(next.find((x) => x.id === 'a').review).toBe('confirmed');
    expect(next.find((x) => x.id === 'b').review).toBe('unreviewed');
    expect(next).not.toBe(list); // new array
  });
});

describe('adLibSummary — short caption', () => {
  it('counts by type', () => {
    expect(adLibSummary(parseAdLibs(rows[0].adLibs))).toBe('Run / riff · Vamp');
  });
  it('pluralizes repeats', () => {
    const two = parseAdLibs([{ type: 'vamp', label: 'a' }, { type: 'vamp', label: 'b' }]);
    expect(adLibSummary(two)).toBe('2× Vamp');
  });
  it('empty when none', () => {
    expect(adLibSummary([])).toBe('');
  });
});

describe('needsSourceReview — honesty about archive matches (reads 0042 columns)', () => {
  it('the seeder\'s explicit needs_review flag wins', () => {
    expect(needsSourceReview({ source: 'archive', needsReview: true })).toBe(true);
  });
  it('a low-confidence archive match flags for review', () => {
    expect(needsSourceReview({ source: 'archive', confidence: SOURCE_REVIEW_CONFIDENCE })).toBe(true);
  });
  it('a high-confidence archive match does not', () => {
    expect(needsSourceReview({ source: 'archive', confidence: 'high' })).toBe(false);
  });
  it('manual/live renditions never need review', () => {
    expect(needsSourceReview({ source: 'manual', confidence: 'low' })).toBe(false);
    expect(needsSourceReview({ source: 'live' })).toBe(false);
  });
});

describe('buildRenditions — expands a song into its performances', () => {
  const list = buildRenditions(rows, { loves: new Map(), today: TODAY });
  it('excludes archived rows', () => {
    expect(list.map((r) => r.id)).not.toContain('z9');
  });
  it('newest performance first', () => {
    expect(list.map((r) => r.id)).toEqual(['r3', 'r2', 'r1']);
  });
  it('carries per-performance detail and flags', () => {
    const r1 = list.find((r) => r.id === 'r1');
    expect(r1.songKey).toBe('Ab');
    expect(r1.keyboardistNotes).toMatch(/half step/);
    expect(r1.adLibCount).toBe(2);
    expect(r1.isPast).toBe(true);
    const r3 = list.find((r) => r.id === 'r3');
    expect(r3.isFuture).toBe(true);
  });
  it('PROVEN-TO-CATCH: a low-confidence archive rendition is flagged', () => {
    const r2 = list.find((r) => r.id === 'r2');
    expect(r2.source).toBe('archive');
    expect(r2.needsSourceReview).toBe(true);
  });
});

describe('rendition-level loves — which VERSION the body loved', () => {
  const loves = [
    { renditionId: 'r1', mine: true }, { renditionId: 'r1', mine: false },
    { renditionId: 'r2', mine: false },
  ];
  const tally = tallyRenditionLoves(loves);
  it('tallies per rendition', () => {
    expect(tally.get('r1')).toEqual({ count: 2, mine: true });
    expect(tally.get('r2')).toEqual({ count: 1, mine: false });
  });
  it('mostLovedRendition picks the top version', () => {
    const list = buildRenditions(rows, { loves: tally, today: TODAY });
    expect(mostLovedRendition(list).id).toBe('r1');
  });
  it('mostLovedRendition is null when nothing is loved', () => {
    const list = buildRenditions(rows, { loves: new Map(), today: TODAY });
    expect(mostLovedRendition(list)).toBeNull();
  });
});

describe('master-program tie-in — stable rendition ref', () => {
  const list = buildRenditions(rows, { loves: new Map(), today: TODAY });
  it('renditionRef carries the row id the program persists', () => {
    const ref = renditionRef(list.find((r) => r.id === 'r1'));
    expect(ref.renditionId).toBe('r1');
    expect(ref.serviceDate).toBe('2026-05-10');
    expect(ref.label).toMatch(/2026-05-10/);
  });
  it('resolveProgramRendition round-trips the id back to the rendition', () => {
    expect(resolveProgramRendition(list, 'r1').id).toBe('r1');
    expect(resolveProgramRendition(list, 'gone')).toBeNull();
  });
  it('renditionLabel summarizes the variations', () => {
    const r1 = list.find((r) => r.id === 'r1');
    expect(renditionLabel(r1)).toContain('Vamp');
  });
});

describe('graduateAdLib — keep a loved ad-lib in the arrangement', () => {
  const adLib = normalizeAdLib({ type: 'vamp', label: 'Extended vamp on the tag' });
  const rendition = { serviceDate: '2026-05-10' };
  it('appends without clobbering existing arrangement', () => {
    const next = graduateAdLib('Choir + solo', adLib, rendition);
    expect(next).toContain('Choir + solo');
    expect(next).toContain('Keep: Vamp — Extended vamp on the tag (2026-05-10)');
  });
  it('is idempotent — graduating twice does not duplicate', () => {
    const once = graduateAdLib('Choir + solo', adLib, rendition);
    const twice = graduateAdLib(once, adLib, rendition);
    expect(twice).toBe(once);
  });
  it('handles an empty starting arrangement', () => {
    expect(graduateAdLib('', adLib, rendition)).toBe('Keep: Vamp — Extended vamp on the tag (2026-05-10)');
  });
});

describe('AD_LIB_TYPES — the variation vocabulary is complete', () => {
  it('covers the ad-lib kinds Darrell named (vamps, runs, soloist, arrangement)', () => {
    for (const k of ['vamp', 'run', 'soloist', 'arrangement']) expect(AD_LIB_TYPES[k]).toBeTruthy();
  });
});
