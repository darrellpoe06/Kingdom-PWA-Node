// =============================================================================
// The church calendar as a file (DR-1586): the CSV upload reads what a
// spreadsheet writes, rejects a bad row with its line and reason, and the
// office's write path files rows only for its own church.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { splitCsv, readDate, parseEventsCsv, notAlreadyThere, eventsToCsv, CSV_TEMPLATE, MAX_ROWS } from '../lib/church-calendar-file.js';
import { addCalendarEvents, removeCalendarEvent, getCalendarAccess, toCalendarRow, INSERT_CHUNK } from '../lib/church-calendar-sync.js';
import { makeEvent, fromOfficeRows } from '../lib/church-calendar.js';

describe('reading a CSV', () => {
  it('reads quoted cells, doubled quotes, commas and line breaks inside quotes, CRLF and a BOM', () => {
    const { rows, unclosedQuote } = splitCsv('\uFEFFdate,name\r\n2026-11-21,"Dinner, with ""pie"""\r\n2026-11-22,"Two\nlines"\r\n\r\n');
    expect(unclosedQuote).toBe(false);
    expect(rows.map((r) => r.cells)).toEqual([
      ['date', 'name'],
      ['2026-11-21', 'Dinner, with "pie"'],
      ['2026-11-22', 'Two\nlines'],
    ]);
    expect(rows.map((r) => r.line)).toEqual([1, 2, 3]);
  });
  it('reads the two date forms and nothing else', () => {
    expect(readDate('2025-11-27')).toBe('2025-11-27');
    expect(readDate('11/27/2025')).toBe('2025-11-27');
    expect(readDate('7/4/2024')).toBe('2024-07-04');
    for (const bad of ['27/11/2025', '2/30/2025', 'Nov 27', '2025-11', '', '11-27-2025']) expect(readDate(bad)).toBe('');
  });
  it('reads a full file, columns in any order and under the names a spreadsheet might use', () => {
    const got = parseEventsCsv('Title,Start Date,Location,Notes,End Date,Time\nFall Revival,10/12/2025,Sanctuary,Three nights,10/14/2025,7:00 PM\n');
    expect(got.ok).toBe(true);
    expect(got.rejected).toEqual([]);
    expect(got.events).toHaveLength(1);
    expect(got.events[0]).toMatchObject({
      name: 'Fall Revival',
      date: '2025-10-12',
      endDate: '2025-10-14',
      time: '7:00 PM',
      place: 'Sanctuary',
      detail: 'Three nights',
      source: 'office',
    });
  });
  it('rejects each malformed row with its line and the reason, and still reads the good ones', () => {
    const csv = [
      'date,name,end_date',
      '2025-12-24,Christmas Eve service,',
      ',No date here,',
      'someday,Bad date,',
      '2025-12-31,,',
      '2025-12-31,Watch Night,2025-12-30',
      '2025-12-31,Watch Night,13/45/2025',
      '2025-12-24,christmas eve SERVICE,',
    ].join('\n');
    const got = parseEventsCsv(csv);
    expect(got.ok).toBe(true);
    expect(got.events.map((e) => e.name)).toEqual(['Christmas Eve service']);
    expect(got.rejected.map((r) => r.line)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(got.rejected[0].reason).toMatch(/not a date/);
    expect(got.rejected[1].reason).toMatch(/"someday" is not a date/);
    expect(got.rejected[2].reason).toBe('No event name.');
    expect(got.rejected[3].reason).toBe('The end date is before the start date.');
    expect(got.rejected[4].reason).toMatch(/end date "13\/45\/2025"/);
    expect(got.rejected[5].reason).toMatch(/already in this file/);
  });
  it('PROVEN TO CATCH: a bad date is never read as some other day', () => {
    // Break: fall back to new Date(cell) and "2/30/2025" becomes March 2, read as a real event.
    const got = parseEventsCsv('date,name\n2/30/2025,Not a day\n');
    expect(got.events).toEqual([]);
    expect(got.rejected).toHaveLength(1);
  });
  it('refuses the whole file when it cannot be trusted, and reads nothing from it', () => {
    expect(parseEventsCsv('').error).toMatch(/empty/);
    expect(parseEventsCsv('   \n').error).toMatch(/empty/);
    expect(parseEventsCsv('when,what\n2025-01-01,X\n').error).toMatch(/must name the columns/);
    expect(parseEventsCsv('date,name\n2025-01-01,"never closed\n2025-01-02,Y\n')).toMatchObject({ ok: false, events: [] });
    const many = `date,name\n${Array.from({ length: MAX_ROWS + 1 }, (_, i) => `2025-01-01,Event ${i}`).join('\n')}`;
    expect(parseEventsCsv(many).error).toMatch(/takes 1000 at a time/);
    expect(parseEventsCsv(null).ok).toBe(false);
  });
  it('leaves alone what is already on the calendar, whatever the letter case', () => {
    const have = [makeEvent({ name: 'Gospel Fest', date: '2026-08-29' })];
    const inc = [makeEvent({ name: 'GOSPEL FEST', date: '2026-08-29' }), makeEvent({ name: 'Gospel Fest', date: '2025-08-30' })];
    const { fresh, dupes } = notAlreadyThere(inc, have);
    expect(fresh.map((e) => e.date)).toEqual(['2025-08-30']);
    expect(dupes).toHaveLength(1);
  });
  it('a download is the upload’s own format: it reads back to the same events', () => {
    const ev = [
      makeEvent({ name: 'Dinner, with "pie"', date: '2025-11-22', endDate: '2025-11-23', time: '5:00 PM', place: 'Fellowship hall', detail: 'Bring a dish' }),
    ];
    const csv = eventsToCsv(ev);
    expect(csv.split('\r\n')[0]).toBe('date,name,end_date,time,place,note');
    const back = parseEventsCsv(csv);
    expect(back.rejected).toEqual([]);
    expect(back.events[0]).toMatchObject({
      name: ev[0].name,
      date: ev[0].date,
      endDate: ev[0].endDate,
      time: ev[0].time,
      place: ev[0].place,
      detail: ev[0].detail,
    });
  });
  it('a downloaded cell cannot run as a spreadsheet formula', () => {
    expect(eventsToCsv([makeEvent({ name: '=HYPERLINK("x")', date: '2025-01-01' })])).toContain(`"'=HYPERLINK(""x"")"`);
  });
  it('the blank template holds the column names and no event', () => {
    expect(parseEventsCsv(CSV_TEMPLATE)).toMatchObject({ ok: true, events: [], rejected: [] });
  });
});

// ── the office's write path (tenancy, DR-0060) ───────────────────────────────
function fakeClient({
  session = { user: { id: 'u1' } },
  insertError = null,
  rpc = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } },
} = {}) {
  const inserts = [];
  const deletes = [];
  const rpcs = [];
  return {
    inserts,
    deletes,
    rpcs,
    rpc: async (name, args) => (rpcs.push({ name, args }), rpc),
    auth: { getSession: async () => ({ data: { session } }) },
    from: (table) => ({
      insert: async (rows) => {
        inserts.push({ table, rows });
        return { error: insertError };
      },
      delete: () => {
        const filters = [];
        const q = {
          eq: (k, v) => (filters.push([k, v]), q),
          then: (ok) => Promise.resolve({ error: null }).then((r) => (deletes.push({ table, filters }), ok(r))),
        };
        return q;
      },
    }),
  };
}
const church = (value) => async () => ({ ok: true, value });
const EV = makeEvent({ name: 'Harvest Dinner', date: '2026-11-21', time: '5:00 PM', place: 'Fellowship hall' });

describe('the office files events', () => {
  it('every row carries the office’s own church, the calendar ministry, and is visible to members', async () => {
    const client = fakeClient();
    expect(await addCalendarEvents([EV], { client, resolveChurch: church('church-1') })).toEqual({ saved: 1 });
    expect(client.inserts).toHaveLength(1);
    expect(client.inserts[0].table).toBe('ministry_ops');
    expect(client.inserts[0].rows[0]).toEqual({
      instance_id: 'church-1',
      ministry: 'calendar',
      title: 'Harvest Dinner',
      detail: 'Time: 5:00 PM\nPlace: Fellowship hall',
      week_of: '2026-11-21',
      status: 'todo',
      member_visible: true,
      created_by: 'u1',
    });
  });
  it('a filed row reads back as the same event', () => {
    const row = toCalendarRow(makeEvent({ name: 'Revival', date: '2025-10-12', endDate: '2025-10-14', time: '7:00 PM', detail: 'Three nights' }), {
      tenantId: 't',
      userId: 'u',
    });
    expect(fromOfficeRows([{ id: 'r1', ...row }]).events[0]).toMatchObject({
      name: 'Revival',
      date: '2025-10-12',
      endDate: '2025-10-14',
      time: '7:00 PM',
      detail: 'Three nights',
      rowId: 'r1',
    });
  });
  it('PROVEN TO CATCH: with no church resolved, or signed out, nothing is sent', async () => {
    // Break: default the instance (or send without one) and a row lands in no church, or someone else's.
    for (const [opts, why] of [
      [{ client: fakeClient(), resolveChurch: church(null) }, 'no-church'],
      [{ client: fakeClient({ session: null }), resolveChurch: church('church-1') }, 'signed-out'],
      [{ client: fakeClient(), resolveChurch: async () => ({ ok: false }) }, 'unavailable'],
    ]) {
      expect(await addCalendarEvents([EV], opts)).toEqual({ skipped: why, saved: 0 });
      expect(opts.client.inserts).toEqual([]);
    }
  });
  it('refuses an undated or unnamed event before sending anything', async () => {
    const client = fakeClient();
    expect(await addCalendarEvents([EV, { name: 'X', date: '2026-02-30' }], { client, resolveChurch: church('c') })).toEqual({ skipped: 'invalid', saved: 0 });
    expect(await addCalendarEvents([], { client, resolveChurch: church('c') })).toEqual({ skipped: 'empty', saved: 0 });
    expect(client.inserts).toEqual([]);
  });
  it('says refused when the database says no, and how many went in before a stall', async () => {
    expect(await addCalendarEvents([EV], { client: fakeClient({ insertError: { code: '42501' } }), resolveChurch: church('c') })).toEqual({
      skipped: 'refused',
      saved: 0,
    });
    const many = Array.from({ length: INSERT_CHUNK + 1 }, (_, i) => makeEvent({ name: `E${i}`, date: '2025-01-01' }));
    const client = fakeClient();
    let n = 0;
    const from = client.from;
    client.from = (t) => ({ ...from(t), insert: (rows) => ((n += 1), n === 1 ? from(t).insert(rows) : new Promise(() => {})) });
    expect(await addCalendarEvents(many, { client, resolveChurch: church('c'), timeoutMs: 20 })).toEqual({ skipped: 'timeout', saved: INSERT_CHUNK });
  });
  it('a remove asks the database, which archives the past and deletes the future (DR-1596)', async () => {
    const archived = fakeClient({ rpc: { data: 'archived', error: null } });
    expect(await removeCalendarEvent('row-9', { client: archived })).toEqual({ removed: true, outcome: 'archived' });
    expect(archived.rpcs).toEqual([{ name: 'church_calendar_remove', args: { row_in: 'row-9' } }]);
    expect(archived.deletes).toEqual([]);
    const deleted = fakeClient({ rpc: { data: 'deleted', error: null } });
    expect(await removeCalendarEvent('row-9', { client: deleted })).toEqual({ removed: true, outcome: 'deleted' });
    expect(await removeCalendarEvent('row-9', { client: fakeClient({ rpc: { data: null, error: { code: '42501' } } }) })).toEqual({ skipped: 'refused' });
    expect(await removeCalendarEvent('', { client: archived })).toEqual({ skipped: 'invalid' });
  });
  it('before 0342 applies: a future event deletes naming the row AND the calendar ministry; a past one is refused, never lost', async () => {
    const client = fakeClient();
    expect(await removeCalendarEvent('row-9', { client, date: '2026-12-06', todayKey: '2026-11-19' })).toEqual({ removed: true, outcome: 'deleted' });
    expect(client.deletes[0]).toEqual({
      table: 'ministry_ops',
      filters: [
        ['id', 'row-9'],
        ['ministry', 'calendar'],
      ],
    });
    const past = fakeClient();
    expect(await removeCalendarEvent('row-8', { client: past, date: '2026-08-29', todayKey: '2026-11-19' })).toEqual({ skipped: 'refused' });
    expect(past.deletes).toEqual([]);
    // Unknown dates never delete.
    expect(await removeCalendarEvent('row-7', { client: fakeClient() })).toEqual({ skipped: 'refused' });
  });
  it('shows the office’s tools to owner and admin only; an unanswered role is not a yes', async () => {
    const ask = (value, ok = true) => ({ client: fakeClient(), resolveChurch: church('c'), roleOf: async () => ({ ok, value }) });
    expect(await getCalendarAccess(ask('owner'))).toEqual({ canManage: true, units: [], unavailable: false });
    expect(await getCalendarAccess(ask('admin'))).toEqual({ canManage: true, units: [], unavailable: false });
    expect(await getCalendarAccess(ask('member'))).toEqual({ canManage: false, units: [], unavailable: false });
    expect(await getCalendarAccess(ask(null))).toEqual({ canManage: false, units: [], unavailable: false });
    expect(await getCalendarAccess(ask('owner', false))).toEqual({ canManage: false, units: [], unavailable: true });
    expect(await getCalendarAccess({ client: fakeClient({ session: null }), resolveChurch: church('c') })).toEqual({ canManage: false, units: [], unavailable: false });
  });
});
