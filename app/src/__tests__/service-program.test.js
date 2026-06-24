// Tests for lib/service-program.js — the Order of Service derivation + timing.
// Locks the row<->shape mappers, sector routing, the schedule clock math, the
// proportional reflow (sermon stays fixed), and the master->sector derivation
// the surface renders. Pure functions only; no Supabase.
//
// PROVEN-TO-CATCH (DR-0076 anti-theater): the reflow case asserts the FIXED
// sermon segment is NOT compressed when the service is short — the whole point of
// the fixed flag. If reflow ever scales fixed segments, that test fails.
import { describe, it, expect } from 'vitest';
import {
  toProgramShape, toSegmentShape, sectorForRole, sectorLabel, STEWARD,
  parseClock, formatClock, computeSchedule, reflowProgram, deriveSectorView,
  seedDefaultOrder, deriveAccess, summarizeChange, toChangeShape, toFinalizerMemberShape,
} from '../lib/service-program.js';

describe('mappers', () => {
  it('toProgramShape defaults missing fields', () => {
    const p = toProgramShape({ id: 'p1', service_date: '2026-06-28' });
    expect(p).toMatchObject({ id: 'p1', serviceDate: '2026-06-28', serviceType: 'sunday', status: 'draft', title: 'Order of Worship' });
  });
  it('toSegmentShape coerces arrays/objects + flexible default', () => {
    const s = toSegmentShape({ id: 's1', program_id: 'p1', title: 'Sermon', sector: 'pulpit', song_ids: null, cues: null });
    expect(s.songIds).toEqual([]);
    expect(s.cues).toEqual({});
    expect(s.flexible).toBe(true);
    const fixed = toSegmentShape({ id: 's2', program_id: 'p1', title: 'Sermon', flexible: false, song_ids: ['a', 'b'] });
    expect(fixed.flexible).toBe(false);
    expect(fixed.songIds).toEqual(['a', 'b']);
  });
});

describe('sectorForRole', () => {
  it('owner/admin steward the whole master', () => {
    expect(sectorForRole('owner', null)).toBe(STEWARD);
    expect(sectorForRole('admin', 'media')).toBe(STEWARD);
  });
  it('maps choir roles to their sector', () => {
    expect(sectorForRole('member', 'musician')).toBe('music');
    expect(sectorForRole('member', 'sound')).toBe('media');
    expect(sectorForRole('member', 'tech')).toBe('media');
    expect(sectorForRole('member', 'director')).toBe('worship');
    expect(sectorForRole('member', null)).toBe('worship');
  });
  it('labels steward + a sector', () => {
    expect(sectorLabel(STEWARD)).toMatch(/Steward/);
    expect(sectorLabel('pulpit')).toMatch(/Preacher/);
  });
});

describe('clock math', () => {
  it('parseClock parses and rejects', () => {
    expect(parseClock('11:00')).toBe(660);
    expect(parseClock('9:05')).toBe(545);
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('bad')).toBeNull();
  });
  it('formatClock renders 12h', () => {
    expect(formatClock(660)).toBe('11:00 AM');
    expect(formatClock(13 * 60 + 5)).toBe('1:05 PM');
    expect(formatClock(0)).toBe('12:00 AM');
  });
});

describe('computeSchedule', () => {
  const segs = [
    { id: 'b', sortOrder: 20, plannedMinutes: 20 },
    { id: 'a', sortOrder: 10, plannedMinutes: 5 },
    { id: 'c', sortOrder: 30, plannedMinutes: 35 },
  ];
  it('orders by sortOrder and accumulates clocks from start', () => {
    const out = computeSchedule(segs, '11:00');
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(out[0].startClock).toBe('11:00 AM');
    expect(out[1].startClock).toBe('11:05 AM'); // after 5'
    expect(out[2].startClock).toBe('11:25 AM'); // after 5'+20'
  });
  it('no start time -> null clocks but still ordered', () => {
    const out = computeSchedule(segs, null);
    expect(out[0].startClock).toBeNull();
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('reflowProgram', () => {
  const segs = [
    { id: 'praise', sortOrder: 10, plannedMinutes: 20, flexible: true },
    { id: 'sermon', sortOrder: 20, plannedMinutes: 40, flexible: false },
    { id: 'altar', sortOrder: 30, plannedMinutes: 20, flexible: true },
  ];
  it('keeps the fixed sermon and compresses only flexible segments', () => {
    // planned 80; fixed 40; flex 40. Target 60 -> flex budget 20 -> scale 0.5.
    const r = reflowProgram(segs, 60);
    expect(r.plannedTotal).toBe(80);
    expect(r.fixedTotal).toBe(40);
    expect(r.scale).toBeCloseTo(0.5, 5);
    const byId = Object.fromEntries(r.segments.map((s) => [s.id, s.adjustedMinutes]));
    expect(byId.sermon).toBe(40);   // FIXED — never compressed
    expect(byId.praise).toBe(10);   // 20 * 0.5
    expect(byId.altar).toBe(10);    // 20 * 0.5
  });
  it('flags infeasible when fixed alone exceeds the available time', () => {
    const r = reflowProgram(segs, 30); // fixed 40 > 30
    expect(r.feasible).toBe(false);
  });
  it('expands flexible segments when more time is available', () => {
    const r = reflowProgram(segs, 100); // flex budget 60 over flex 40 -> 1.5x
    const byId = Object.fromEntries(r.segments.map((s) => [s.id, s.adjustedMinutes]));
    expect(byId.sermon).toBe(40);
    expect(byId.praise).toBe(30);
  });
});

describe('deriveSectorView', () => {
  const program = { id: 'p1', title: 'Order of Worship', serviceDate: '2026-06-28', startTime: '11:00', status: 'published' };
  const segs = [
    { id: 's1', programId: 'p1', sortOrder: 10, title: 'Praise & Worship', sector: 'worship', plannedMinutes: 20, songIds: ['song1'], cues: { media: 'Lyrics lower-third', music: 'Key of Bb' } },
    { id: 's2', programId: 'p1', sortOrder: 20, title: 'Sermon', sector: 'pulpit', plannedMinutes: 35, flexible: false, sermonId: 'serm1', cues: { media: 'Sermon title slate' } },
    { id: 's3', programId: 'p1', sortOrder: 30, title: 'Welcome', sector: 'general', plannedMinutes: 5 },
  ];
  const songs = [{ id: 'song1', title: 'Goodness of God', scriptureRef: 'Ps 23', notes: 'verse 1 only' }];
  const sermons = [{ id: 'serm1', title: 'The Narrow Way', speaker: 'Bishop Gwin', scriptureRef: 'Matt 7:13-14' }];

  it('worship lens: owns praise, resolves the real song, sees its own cue', () => {
    const v = deriveSectorView(program, segs, 'worship', { songs, sermons });
    expect(v.flow).toHaveLength(3);
    const praise = v.flow.find((f) => f.id === 's1');
    expect(praise.isOwner).toBe(true);
    expect(praise.songs[0].title).toBe('Goodness of God');
    expect(praise.startClock).toBe('11:00 AM');
    // worship does not own the sermon
    expect(v.flow.find((f) => f.id === 's2').isOwner).toBe(false);
    expect(v.mineCount).toBe(1);
  });
  it('music lens reads its cross-cutting cue on a segment it does not own', () => {
    const v = deriveSectorView(program, segs, 'music', { songs, sermons });
    const praise = v.flow.find((f) => f.id === 's1');
    expect(praise.isOwner).toBe(false);     // worship owns it
    expect(praise.myCue).toBe('Key of Bb'); // but music still gets its cue
  });
  it('pulpit lens resolves the real sermon on its slot', () => {
    const v = deriveSectorView(program, segs, 'pulpit', { songs, sermons });
    const sermon = v.flow.find((f) => f.id === 's2');
    expect(sermon.isOwner).toBe(true);
    expect(sermon.sermon.speaker).toBe('Bishop Gwin');
  });
  it('general segment is mine for every sector (all-hands)', () => {
    const v = deriveSectorView(program, segs, 'ushers', { songs, sermons });
    expect(v.flow.find((f) => f.id === 's3').isMine).toBe(true);
  });
  it('steward lens owns nothing specific but sees the whole flow', () => {
    const v = deriveSectorView(program, segs, STEWARD, { songs, sermons });
    expect(v.mineCount).toBe(3);
    expect(v.plannedTotalMinutes).toBe(60);
  });
});

describe('seedDefaultOrder + deriveAccess', () => {
  it('seed is a real ordered run-of-show with a fixed sermon', () => {
    const seed = seedDefaultOrder();
    expect(seed.length).toBeGreaterThanOrEqual(8);
    const sermon = seed.find((s) => s.title === 'Sermon');
    expect(sermon.flexible).toBe(false);
    // strictly increasing sortOrder
    const orders = seed.map((s) => s.sortOrder);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
  it('deriveAccess: owner edits, member sees, outsider neither', () => {
    expect(deriveAccess('owner', false)).toEqual({ canSee: true, canEdit: true });
    expect(deriveAccess(null, true)).toEqual({ canSee: true, canEdit: false });
    expect(deriveAccess(null, false)).toEqual({ canSee: false, canEdit: false });
  });
});

describe('finalizer circle (collaborative master edit)', () => {
  it('a designated finalizer who is NOT an admin can edit the whole master', () => {
    // the keyboardist: choir member (sees), is_finalizer true (edits), role null.
    expect(deriveAccess(null, true, true)).toEqual({ canSee: true, canEdit: true });
  });
  it('owner/admin finalize without the flag (BG / Christina / Darrell)', () => {
    expect(deriveAccess('admin', true, false)).toEqual({ canSee: true, canEdit: true });
    expect(deriveAccess('owner', false, false)).toEqual({ canSee: true, canEdit: true });
  });
  it('a non-finalizer member still only reads (sector view), cannot finalize', () => {
    expect(deriveAccess(null, true, false)).toEqual({ canSee: true, canEdit: false });
  });
  it('finalizer flag without choir membership still grants edit (and thus see)', () => {
    expect(deriveAccess(null, false, true)).toEqual({ canSee: true, canEdit: true });
  });
});

describe('change log (institutional memory)', () => {
  it('summarizeChange renders a readable trail line per action', () => {
    expect(summarizeChange('create-program')).toMatch(/Created/);
    expect(summarizeChange('add-segment', 'Offering')).toBe('Added segment "Offering"');
    expect(summarizeChange('edit-segment', 'Sermon')).toBe('Edited segment "Sermon"');
    expect(summarizeChange('delete-segment', 'Altar Call')).toBe('Removed segment "Altar Call"');
    expect(summarizeChange('seed-order')).toMatch(/standard order/);
  });
  it('toChangeShape maps the row, keeping actor name for the trail', () => {
    const c = toChangeShape({ id: 'c1', program_id: 'p1', segment_id: 's2', actor_name: 'Christina', action: 'edit-segment', summary: 'Edited segment "Sermon"', created_at: '2026-06-24T18:00:00Z' });
    expect(c).toMatchObject({ id: 'c1', programId: 'p1', segmentId: 's2', actorName: 'Christina', action: 'edit-segment' });
  });
  it('toFinalizerMemberShape coerces the is_finalizer flag to a real boolean', () => {
    expect(toFinalizerMemberShape({ id: 'm1', user_id: 'u1', display_name: 'Christian', choir_role: 'musician', is_finalizer: true }).isFinalizer).toBe(true);
    expect(toFinalizerMemberShape({ id: 'm2', user_id: 'u2', display_name: 'Member', choir_role: 'member' }).isFinalizer).toBe(false);
  });
});
