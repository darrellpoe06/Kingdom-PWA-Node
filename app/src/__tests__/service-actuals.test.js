// Locks the ACTUAL-side learning loop: reconcile math (planned vs actual,
// dispositions, skipped/added), the recap summary, and the blueprint derivation
// that seeds the next service. Pure functions, no Supabase (DR-0076: measure,
// don't claim — a green run proves the loop the surface depends on).
import { describe, it, expect } from 'vitest';
import {
  DISPOSITIONS, SKIPPED, dispositionLabel,
  actualFromPlanned, reconcileService, summarizeReconcile,
  blueprintFromActual, pickBlueprintProgram, toActualShape, summarizeActualChange,
  harvestActualsForService, mmss,
} from '../lib/service-actuals.js';

// A small planned order: praise (flexible 20), sermon (FIXED 35), altar (flexible 8).
const planned = [
  { id: 'p1', sortOrder: 10, title: 'Praise & Worship', sector: 'worship', plannedMinutes: 20, flexible: true, songIds: ['s1'], sermonId: null, cues: { media: 'lyrics up' }, notes: '' },
  { id: 'p2', sortOrder: 20, title: 'Sermon', sector: 'pulpit', plannedMinutes: 35, flexible: false, songIds: [], sermonId: 'serm1', cues: {}, notes: 'BG' },
  { id: 'p3', sortOrder: 30, title: 'Altar Call', sector: 'pastoral', plannedMinutes: 8, flexible: true, songIds: [], sermonId: null, cues: {}, notes: '' },
];

describe('actualFromPlanned (quick-reconcile seed)', () => {
  it('pre-fills an actual that mirrors the plan exactly', () => {
    const a = actualFromPlanned(planned[0]);
    expect(a).toMatchObject({ plannedSegmentId: 'p1', disposition: 'as-planned', title: 'Praise & Worship', actualMinutes: 20, actualOrder: 10, source: 'manual' });
    expect(a.id).toBeUndefined(); // a template — no DB id
  });
});

describe('reconcileService', () => {
  it('before reconcile: nothing is skipped, no totals delta', () => {
    const r = reconcileService(planned, [], { reconciled: false });
    expect(r.skippedCount).toBe(0);
    expect(r.deltaMinutes).toBeNull();
    expect(r.rows).toHaveLength(0); // no actuals captured yet
  });

  it('as-planned when minutes match within tolerance', () => {
    const actuals = planned.map((p, i) => ({ id: `a${i}`, plannedSegmentId: p.id, actualOrder: p.sortOrder, actualMinutes: p.plannedMinutes, title: p.title, sector: p.sector }));
    const r = reconcileService(planned, actuals, { reconciled: true });
    expect(r.occurredCount).toBe(3);
    expect(r.counts.asPlanned).toBe(3);
    expect(r.deltaMinutes).toBe(0);
    expect(r.totalsVariance.direction).toBe('on-target');
  });

  it('derives ran-long / ran-short from the minutes drift', () => {
    const actuals = [
      { id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 28 }, // +8 long
      { id: 'a2', plannedSegmentId: 'p2', actualOrder: 20, actualMinutes: 35 }, // exact
      { id: 'a3', plannedSegmentId: 'p3', actualOrder: 30, actualMinutes: 3 },  // -5 short
    ];
    const r = reconcileService(planned, actuals, { reconciled: true });
    const byId = Object.fromEntries(r.occurred.map((x) => [x.plannedSegmentId, x]));
    expect(byId.p1.disposition).toBe('ran-long');
    expect(byId.p1.deltaMinutes).toBe(8);
    expect(byId.p3.disposition).toBe('ran-short');
    expect(r.actualTotalMinutes).toBe(66);
    expect(r.deltaMinutes).toBe(66 - 63);
  });

  it('a planned segment with no actual reads as SKIPPED once reconciled', () => {
    const actuals = [
      { id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 20 },
      { id: 'a2', plannedSegmentId: 'p2', actualOrder: 20, actualMinutes: 35 },
      // p3 (Altar Call) never happened
    ];
    const r = reconcileService(planned, actuals, { reconciled: true });
    expect(r.skippedCount).toBe(1);
    const skipped = r.skipped[0];
    expect(skipped.plannedSegmentId).toBe('p3');
    expect(skipped.disposition).toBe(SKIPPED);
  });

  it('an actual with no planned segment is ADDED (unplanned)', () => {
    const actuals = [
      { id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 20 },
      { id: 'a2', plannedSegmentId: null, actualOrder: 15, actualMinutes: 6, title: 'I Need You To Survive', sector: 'worship' },
      { id: 'a3', plannedSegmentId: 'p2', actualOrder: 20, actualMinutes: 35 },
    ];
    const r = reconcileService(planned, actuals, { reconciled: true });
    expect(r.addedCount).toBe(1);
    const added = r.occurred.find((x) => x.disposition === 'added');
    expect(added.title).toBe('I Need You To Survive');
    expect(added.plannedMinutes).toBeNull();
  });

  it('detects a reorder when actual order differs from planned order', () => {
    const actuals = [
      { id: 'a2', plannedSegmentId: 'p2', actualOrder: 10, actualMinutes: 35 }, // sermon first
      { id: 'a1', plannedSegmentId: 'p1', actualOrder: 20, actualMinutes: 20 }, // praise second
    ];
    const r = reconcileService(planned, actuals, { reconciled: true });
    const reordered = r.occurred.filter((x) => x.reordered);
    expect(reordered.length).toBeGreaterThan(0);
    expect(r.counts.reordered).toBeGreaterThan(0);
  });

  it('respects an explicit tolerance', () => {
    const actuals = [{ id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 21 }]; // +1
    expect(reconcileService(planned, actuals, { reconciled: true, tolMinutes: 0 }).occurred[0].disposition).toBe('ran-long');
    expect(reconcileService(planned, actuals, { reconciled: true, tolMinutes: 2 }).occurred[0].disposition).toBe('as-planned');
  });
});

describe('summarizeReconcile', () => {
  it('gives a gentle nothing-yet line before reconcile', () => {
    expect(summarizeReconcile(reconcileService(planned, [], { reconciled: false }))).toMatch(/not reconciled/i);
  });
  it('reports over-run + the disposition tallies', () => {
    const actuals = [
      { id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 28 },
      { id: 'a2', plannedSegmentId: 'p2', actualOrder: 20, actualMinutes: 40 },
      { id: 'a3', plannedSegmentId: null, actualOrder: 25, actualMinutes: 5, title: 'Testimony' },
    ];
    const line = summarizeReconcile(reconcileService(planned, actuals, { reconciled: true }));
    expect(line).toMatch(/over plan/);
    expect(line).toMatch(/added/);
    expect(line).toMatch(/skipped/); // p3 altar never happened
  });
});

describe('blueprintFromActual (the next-service seed)', () => {
  const actuals = [
    { id: 'a1', plannedSegmentId: 'p1', actualOrder: 10, actualMinutes: 26, title: 'Praise & Worship', sector: 'worship' }, // ran long
    { id: 'a2', plannedSegmentId: null, actualOrder: 15, actualMinutes: 5, title: 'Spontaneous Testimony', sector: 'general' }, // added
    { id: 'a3', plannedSegmentId: 'p2', actualOrder: 20, actualMinutes: 35, title: 'Sermon', sector: 'pulpit' }, // as planned
    // p3 Altar Call skipped
  ];
  const program = { id: 'prog1', serviceDate: '2026-06-21', serviceType: 'sunday' };

  it('carries actual timing forward (reality becomes the new plan)', () => {
    const bp = blueprintFromActual(program, planned, actuals);
    const praise = bp.segments.find((s) => s.title === 'Praise & Worship');
    expect(praise.plannedMinutes).toBe(26); // the real 26', not the planned 20'
  });

  it('drops skipped segments and brings added ones along', () => {
    const bp = blueprintFromActual(program, planned, actuals);
    expect(bp.segments.map((s) => s.title)).toContain('Spontaneous Testimony');
    expect(bp.segments.map((s) => s.title)).not.toContain('Altar Call');
    expect(bp.droppedSkipped).toBe(1);
    expect(bp.broughtAdded).toBe(1);
  });

  it('keeps the run-of-show structure but drops date-specific content + flags it descriptively', () => {
    const bp = blueprintFromActual(program, planned, actuals);
    const sermon = bp.segments.find((s) => s.title === 'Sermon');
    expect(sermon.flexible).toBe(false);      // the sermon stays FIXED — reusable structure
    expect(sermon.sermonId).toBeNull();        // that sermon belonged to that date
    expect(sermon.songIds).toEqual([]);        // songs chosen fresh
    const praise = bp.segments.find((s) => s.title === 'Praise & Worship');
    expect(praise.cues).toEqual({ media: 'lyrics up' }); // cues are reusable run-of-show
    expect(praise.notes).toMatch(/last time/i);          // descriptive breadcrumb, never a rule
    expect(bp.segments[0].sortOrder).toBe(10);           // re-sequenced from 1
  });

  it('produces seedDefaultOrder-shaped templates (no ids)', () => {
    const bp = blueprintFromActual(program, planned, actuals);
    bp.segments.forEach((s) => {
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('plannedMinutes');
      expect(s).toHaveProperty('flexible');
      expect(s).toHaveProperty('sortOrder');
      expect(s.id).toBeUndefined();
    });
  });
});

describe('pickBlueprintProgram', () => {
  const programs = [
    { id: 'sun-a', serviceType: 'sunday', serviceDate: '2026-06-07', reconciledAt: '2026-06-07T15:00:00Z' },
    { id: 'sun-b', serviceType: 'sunday', serviceDate: '2026-06-14', reconciledAt: '2026-06-14T15:00:00Z' },
    { id: 'sun-draft', serviceType: 'sunday', serviceDate: '2026-06-18', reconciledAt: null }, // not reconciled
    { id: 'wed-a', serviceType: 'wednesday', serviceDate: '2026-06-10', reconciledAt: '2026-06-10T21:00:00Z' },
  ];
  it('picks the most recent RECONCILED service of the same type', () => {
    const pick = pickBlueprintProgram(programs, { serviceType: 'sunday' });
    expect(pick.id).toBe('sun-b');
  });
  it('keeps the lanes separate: Sunday seeds Sunday, Wednesday seeds Wednesday', () => {
    expect(pickBlueprintProgram(programs, { serviceType: 'wednesday' }).id).toBe('wed-a');
  });
  it('ignores unreconciled programs and the one being built', () => {
    const pick = pickBlueprintProgram(programs, { serviceType: 'sunday', beforeDate: '2026-06-14', excludeId: 'sun-b' });
    expect(pick.id).toBe('sun-a');
  });
  it('returns null when nothing of that type has been reconciled', () => {
    expect(pickBlueprintProgram(programs, { serviceType: 'special' })).toBeNull();
  });
});

describe('toActualShape + plumbing', () => {
  it('maps a DB row to the client shape with safe defaults', () => {
    const s = toActualShape({ id: 'x', program_id: 'prog1', planned_segment_id: null, source: 'harvest', needs_review: true, actual_songs: null, actual_minutes: 6 });
    expect(s).toMatchObject({ id: 'x', programId: 'prog1', source: 'harvest', needsReview: true, actualSongs: [], actualMinutes: 6 });
  });
  it('every disposition has a label', () => {
    Object.keys(DISPOSITIONS).forEach((k) => expect(dispositionLabel(k)).toBeTruthy());
    expect(dispositionLabel(SKIPPED)).toBe('Skipped');
  });
  it('change-log summaries are human-readable', () => {
    expect(summarizeActualChange('reconcile')).toMatch(/reconciled/i);
    expect(summarizeActualChange('blueprint-seed')).toMatch(/blueprint/i);
  });
});

describe('harvestActualsForService (the ACTUAL from the YouTube recording)', () => {
  // Same source as the full-harvest pipeline: already-ingested choir_songs +
  // choir_sermons for the service date (no re-fetch).
  const program = { id: 'prog1', serviceDate: '2026-06-21', serviceType: 'sunday' };
  // p1 Praise references song s1; p2 Sermon references sermon serm1.
  const harvestPlanned = [
    { id: 'p1', sortOrder: 10, title: 'Praise & Worship', sector: 'worship', plannedMinutes: 20, flexible: true, songIds: ['s1'], sermonId: null, cues: {}, notes: '' },
    { id: 'p2', sortOrder: 20, title: 'Sermon', sector: 'pulpit', plannedMinutes: 35, flexible: false, songIds: [], sermonId: 'serm1', cues: {}, notes: '' },
  ];
  const songs = [
    { id: 's1', title: 'Total Praise', serviceDate: '2026-06-21', serviceType: 'sunday', status: 'active', startSeconds: 600, videoId: 'VID9', confidence: 'high' },
    { id: 's2', title: 'I Need You To Survive', serviceDate: '2026-06-21', serviceType: 'sunday', status: 'active', startSeconds: 1500, videoId: 'VID9', confidence: 'low' },
    { id: 's-other', title: 'Old Song', serviceDate: '2026-06-14', serviceType: 'sunday', status: 'active', startSeconds: 100, videoId: 'VID1' },
  ];
  const sermons = [
    { id: 'serm1', title: 'Let Go And Let God', serviceDate: '2026-06-21', serviceType: 'sunday', status: 'active', startSeconds: 3000, videoId: 'VID9', speaker: 'Bishop Gwin' },
  ];

  it('derives the actual run only from rows on THIS service date (reuse, no re-fetch)', () => {
    const { items, scope } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    expect(scope.songs).toBe(2);   // s1 + s2, not s-other (different date)
    expect(scope.sermon).toBe(1);
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.source === 'harvest' && i.needsReview)).toBe(true); // never auto-trusted
  });

  it('orders by the video timestamp and estimates minutes from the gap', () => {
    const { items } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    expect(items.map((i) => i.title)).toEqual(['Total Praise', 'I Need You To Survive', 'Let Go And Let God']);
    expect(items[0].actualMinutes).toBe(15); // (1500-600)/60
    expect(items[2].actualMinutes).toBeNull(); // last event — unknown end
    expect(items[0].atSeconds).toBe(600);
  });

  it('auto-attributes to the planned segment that references the song/sermon', () => {
    const { items, scope } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    const total = items.find((i) => i.title === 'Total Praise');
    expect(total.plannedSegmentId).toBe('p1'); // p1.songIds includes s1
    const sermon = items.find((i) => i.title === 'Let Go And Let God');
    expect(sermon.plannedSegmentId).toBe('p2'); // p2.sermonId === serm1
    expect(scope.matched).toBeGreaterThanOrEqual(2);
  });

  it('keeps an unmatched song honest as an added (unplanned) item', () => {
    const { items } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    const extra = items.find((i) => i.title === 'I Need You To Survive');
    // s2 not referenced by any plan; the one worship slot (p1) is taken by s1.
    expect(extra.disposition).toBe('added');
    expect(extra.plannedSegmentId).toBeNull();
  });

  it('returns empty + honest when the service video has not been harvested yet', () => {
    const none = harvestActualsForService({ id: 'p9', serviceDate: '2030-01-01', serviceType: 'sunday' }, harvestPlanned, { songs, sermons });
    expect(none.items).toHaveLength(0);
    expect(none.scope.hasVideo).toBe(false);
  });

  it('carries the real video id as provenance', () => {
    const { items, scope } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    expect(scope.videoId).toBe('VID9');
    expect(items[0].videoId).toBe('VID9');
  });

  it('end-to-end: harvested actual reconciles + blueprints', () => {
    const { items } = harvestActualsForService(program, harvestPlanned, { songs, sermons });
    const withIds = items.map((it, i) => ({ ...it, id: `h${i}` }));
    const r = reconcileService(harvestPlanned, withIds, { reconciled: true });
    expect(r.occurredCount).toBe(3);
    const bp = blueprintFromActual(program, harvestPlanned, withIds);
    expect(bp.segments.length).toBe(3); // structure carried into the next service
  });
});

describe('mmss', () => {
  it('formats seconds into a video timestamp', () => {
    expect(mmss(90)).toBe('1:30');
    expect(mmss(3690)).toBe('1:01:30');
    expect(mmss(null)).toBeNull();
  });
});
