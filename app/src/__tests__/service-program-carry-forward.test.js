// =============================================================================
// DR-1044 — one live order, carried forward; never a blank start
// =============================================================================
// Darrell on the Fold, 2026-10-15: the Order of Service opened a blank New
// Service form dated that Thursday for a Sunday service, with no sections.
// "We need to edit the last one or update the last one and archive the previous
// ones... We should not have repeated start from scratch situations."
//
// Pinned here: a new order opens on the next day its service meets, in local
// time; the posted times come from the church's own schedule; a new order takes
// the last order's lines (or Bishop Gwin's order when there is none), never
// none; a date that already has an order opens it instead of doubling it; the
// earlier orders are archived by status, never deleted; and the page opens on
// the live order, not an archived one.
import { vi, describe, it, expect, beforeEach } from 'vitest';

const calls = [];
let nextId = 0;
function table(name) {
  const q = {
    insert(rows) { calls.push({ table: name, op: 'insert', rows }); q._ins = rows; return q; },
    update(row) { calls.push({ table: name, op: 'update', row }); return q; },
    in(col, vals) { calls.push({ table: name, op: 'in', col, vals }); return Promise.resolve({ error: null }); },
    eq() { return Promise.resolve({ error: null }); },
    select() { return q; },
    single() { nextId += 1; return Promise.resolve({ data: { id: `new-${nextId}` }, error: null }); },
    then(res) { return Promise.resolve({ error: null }).then(res); },
  };
  return q;
}
vi.mock('../lib/supabase.js', () => ({
  default: {
    from: vi.fn((name) => table(name)),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'u-darrell', email: 'x@test.local', user_metadata: { name: 'Darrell' } } } } })) },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  onAuthChange: vi.fn(() => () => {}),
}));
vi.mock('../lib/church-instance.js', () => ({ churchInstanceId: vi.fn(async () => 'colg-id') }));

const sp = await import('../lib/service-program.js');
const { COLG_DEFAULT_CHURCH } = await import('../lib/default-church.js');

const THURSDAY = new Date(2026, 9, 15, 23, 30); // 11:30 PM local, past midnight UTC in Central
const prog = (id, serviceDate, extra = {}) => ({ id, serviceDate, serviceType: 'sunday', status: 'draft', title: 'Order of Worship', ...extra });
const seg = (id, programId, sortOrder, extra = {}) => ({ id, programId, sortOrder, title: `Line ${id}`, sector: 'worship', plannedMinutes: 5, flexible: true, cues: { media: 'lights' }, personnel: ['Christina'], scriptureRef: 'Psalm 100:1', sermonId: 'sermon-1', songIds: ['song-1'], notes: 'keep', ...extra });

beforeEach(() => { calls.length = 0; nextId = 0; });

describe('the day a new order opens on', () => {
  it('reads the local calendar, never UTC', () => {
    expect(sp.localIsoDate(THURSDAY)).toBe('2026-10-15');
  });
  it('Sunday and Wednesday open on their next day; today counts; special opens today', () => {
    expect(sp.nextServiceDate('sunday', THURSDAY)).toBe('2026-10-18');
    expect(sp.nextServiceDate('wednesday', THURSDAY)).toBe('2026-10-21');
    expect(sp.nextServiceDate('special', THURSDAY)).toBe('2026-10-15');
    expect(sp.nextServiceDate('sunday', new Date(2026, 9, 18, 9, 0))).toBe('2026-10-18');
  });
  it('names a date on the wrong day for its service', () => {
    expect(sp.weekdayOf('2026-10-15')).toBe('Thursday');
    expect(sp.dayMismatch('2026-10-15', 'sunday')).toBe(true);
    expect(sp.dayMismatch('2026-10-18', 'sunday')).toBe(false);
    expect(sp.dayMismatch('2026-10-15', 'special')).toBe(false);
  });
});

describe('the posted times come from the church’s own schedule', () => {
  it('Sunday has one posted time; Wednesday has two, offered, never guessed', () => {
    expect(sp.clockTo24('1:00 PM')).toBe('13:00');
    expect(sp.clockTo24('11:00 AM')).toBe('11:00');
    expect(sp.clockTo24('12:30 AM')).toBe('00:30');
    expect(sp.postedStartTimes('sunday', COLG_DEFAULT_CHURCH.services)).toEqual(['11:00']);
    expect(sp.postedStartTimes('wednesday', COLG_DEFAULT_CHURCH.services)).toEqual(['13:00', '18:00']);
    expect(sp.postedStartTimes('special', COLG_DEFAULT_CHURCH.services)).toEqual([]);
  });
});

describe('one live order', () => {
  const programs = [prog('p3', '2026-10-25', { status: 'archived' }), prog('p2', '2026-10-18'), prog('p1', '2026-10-11')];

  it('the page opens on the newest order that is not archived', () => {
    expect(sp.currentProgram(programs).id).toBe('p2');
    expect(sp.currentProgram(programs, 'p1').id).toBe('p1');
    expect(sp.currentProgram([])).toBe(null);
  });
  it('proven to catch: the old rule (newest of all) would open the archived one', () => {
    expect(programs[0].id).toBe('p3');
    expect(sp.currentProgram(programs).id).not.toBe(programs[0].id);
  });
  it('finds the order already on a date, and the last order before one', () => {
    expect(sp.existingOrderFor(programs, '2026-10-18', 'sunday').id).toBe('p2');
    expect(sp.existingOrderFor(programs, '2026-10-18', 'wednesday')).toBe(null);
    expect(sp.lastOrderOf(programs, 'sunday', '2026-10-20').id).toBe('p2');
    expect(sp.lastOrderOf(programs, 'wednesday', '2026-10-20')).toBe(null);
  });
  it('archives every earlier order not yet archived, never the new one', () => {
    expect(sp.ordersToArchive(programs, '2026-10-25', 'new').sort()).toEqual(['p1', 'p2']);
    expect(sp.ordersToArchive(programs, '2026-10-18', 'p2')).toEqual(['p1']);
  });
});

describe('the lines carry forward', () => {
  it('keeps the lines, people, minutes and cues in order; clears that day’s scripture, sermon and songs', () => {
    const out = sp.carryForwardSegments([seg('b', 'p', 20), seg('a', 'p', 10, { flexible: false })]);
    expect(out.map((s) => s.title)).toEqual(['Line a', 'Line b']);
    expect(out[0]).toMatchObject({ personnel: ['Christina'], plannedMinutes: 5, flexible: false, cues: { media: 'lights' }, notes: 'keep', sortOrder: 10 });
    expect(out[0]).toMatchObject({ scriptureRef: '', sermonId: null, songIds: [] });
    expect(out[0].id).toBeUndefined();
  });
  it('the form says what a new order starts from', () => {
    const programs = [prog('p1', '2026-10-11')];
    expect(sp.startsFromSay(programs, [seg('a', 'p1', 10), seg('b', 'p1', 20)], 'sunday', '2026-10-18'))
      .toMatchObject({ from: 'last', programId: 'p1', lines: 2 });
    expect(sp.startsFromSay([], [], 'sunday', '2026-10-18')).toMatchObject({ from: 'standard', lines: sp.seedDefaultOrder().length });
  });
});

describe('the one road a new order takes', () => {
  const form = { serviceDate: '2026-10-18', serviceType: 'sunday', title: 'Order of Worship', startTime: '11:00', status: 'draft' };
  const inserted = (t) => calls.filter((c) => c.table === t && c.op === 'insert');

  it('carries the last order’s lines into the new one and archives the earlier orders', async () => {
    const programs = [prog('p1', '2026-10-11'), prog('p0', '2026-10-04', { status: 'archived' })];
    const segments = [seg('a', 'p1', 10), seg('b', 'p1', 20), seg('z', 'p0', 10)];
    const res = await sp.startOrder(form, { programs, segments });
    expect(res).toMatchObject({ saved: true, from: 'last', lines: 2, archived: 1 });
    const lines = inserted('church_service_segments')[0].rows;
    expect(lines.map((r) => r.title)).toEqual(['Line a', 'Line b']);
    expect(lines.every((r) => r.program_id === res.id && r.instance_id === 'colg-id')).toBe(true);
    expect(lines[0]).toMatchObject({ scripture_ref: null, sermon_id: null, song_ids: [], personnel: ['Christina'] });
    const archive = calls.find((c) => c.table === 'church_service_programs' && c.op === 'update');
    expect(archive.row.status).toBe('archived');
    expect(calls.find((c) => c.op === 'in').vals).toEqual(['p1']);
  });

  it('with no earlier order it starts from Bishop Gwin’s order, never blank', async () => {
    const res = await sp.startOrder(form, { programs: [], segments: [] });
    expect(res).toMatchObject({ saved: true, from: 'standard', lines: sp.seedDefaultOrder().length, archived: 0 });
    expect(inserted('church_service_segments')[0].rows.length).toBe(sp.seedDefaultOrder().length);
  });

  it('an earlier order with no lines still never yields a blank order', async () => {
    const res = await sp.startOrder(form, { programs: [prog('p1', '2026-10-11')], segments: [] });
    expect(res.from).toBe('standard');
    expect(inserted('church_service_segments')[0].rows.length).toBeGreaterThan(0);
  });

  it('a date that already has an order opens it and writes nothing', async () => {
    const res = await sp.startOrder(form, { programs: [prog('p2', '2026-10-18')], segments: [] });
    expect(res).toEqual({ opened: true, id: 'p2' });
    expect(calls.length).toBe(0);
  });

  it('archiving is a status change, never a delete', async () => {
    await sp.startOrder(form, { programs: [prog('p1', '2026-10-11')], segments: [seg('a', 'p1', 10)] });
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
    expect(sp.summarizeChange('carry-forward', '2026-10-11')).toBe('Carried the order forward from "2026-10-11"');
    expect(sp.summarizeChange('archive-program', null)).toBe('Archived the earlier order');
  });
});
