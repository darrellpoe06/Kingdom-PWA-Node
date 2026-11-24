// @vitest-environment jsdom
// =============================================================================
// Every event lives on its day, perpetually (DR-1628): where a row came from,
// the day showing it (and its flyer), "Use again" a year on, a unit leader
// sending in an event for their unit only, and the office's two hands (unit
// leaders; upload a picture from before). Copy and behavior are tested
// together: each prompt's button is pressed and what it did is checked.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchCalendar from '../components/lovecorner/ChurchCalendar.jsx';
import ChurchCalendarTools from '../components/lovecorner/ChurchCalendarTools.jsx';
import ChurchCalendarOffice from '../components/lovecorner/ChurchCalendarOffice.jsx';
import { fromOfficeRows, originOf, originLine, againDraft, dayOfWeek } from '../lib/church-calendar.js';
import { getCalendarAccess, postCalendarEvent, readCalendarRows } from '../lib/church-calendar-sync.js';
import { uploadPicture, cleanUnit } from '../lib/church-calendar-office.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const INST = '10000000-0000-4000-b000-000000000343';
const PIC = `${INST}/${'f'.repeat(64)}.jpeg`;
const ROWS = [
  {
    id: 'r1',
    ministry: 'calendar',
    title: 'Battle Cry Sunday',
    detail: 'Time: 11:00 AM',
    week_of: '2026-11-15',
    read_from: `flyer:${'f'.repeat(64)}`,
    picture_path: PIC,
  },
  { id: 'r2', ministry: 'calendar', title: 'NA Meeting', detail: 'Time: 9:00 AM\nPlace: Café', week_of: '2026-11-24', read_from: `calendar:${'c'.repeat(64)}` },
  { id: 'r3', ministry: 'calendar', title: 'Choir rehearsal', week_of: '2026-11-24', sent_by_unit: 'Choir' },
  { id: 'r4', ministry: 'calendar', title: 'Bad source', week_of: '2026-11-24', read_from: 'evil', picture_path: '../etc/passwd' },
];

describe('where a calendar row came from', () => {
  const { events } = fromOfficeRows(ROWS);
  const by = (n) => events.find((e) => e.name === n);
  it('says it in words: the office calendar, the office flyer, a unit', () => {
    expect(originLine(by('Battle Cry Sunday'))).toBe('From the office’s flyer');
    expect(originLine(by('NA Meeting'))).toBe('From the office’s calendar');
    expect(originLine(by('Choir rehearsal'))).toBe('Sent in by Choir leadership');
    expect(by('Battle Cry Sunday').picturePath).toBe(PIC);
  });
  it('PROVEN TO CATCH: a malformed source or picture path is not trusted', () => {
    expect(originOf(ROWS[3])).toEqual({ readFrom: '', picturePath: '', sentBy: '', reusedFrom: null });
    expect(originLine(by('Bad source'))).toBe('');
  });
});

describe('Use again', () => {
  it('lands 52 weeks on, on the same weekday, with every detail and the link to the past event', () => {
    const ev = fromOfficeRows(ROWS).events.find((e) => e.name === 'Battle Cry Sunday');
    const d = againDraft(ev);
    expect(d).toMatchObject({ name: 'Battle Cry Sunday', date: '2027-11-14', time: '11:00 AM', reusedFrom: 'r1', fromLabel: 'Sunday, November 15, 2026' });
    expect(dayOfWeek(d.date)).toBe(dayOfWeek(ev.date));
  });
  it('keeps a multi-day event the same length', () => {
    expect(againDraft({ name: 'Revival', date: '2026-08-03', endDate: '2026-08-05', rowId: 'x' })).toMatchObject({ date: '2027-08-02', endDate: '2027-08-04' });
  });
});

let host;
let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const qa = (id) => [...host.querySelectorAll(`[data-testid="${id}"]`)];
const tap = (el) => act(async () => el.click());
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
const type = (el, value) =>
  act(() => {
    const proto =
      el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
const submit = (form) => act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('the day', () => {
  const { events } = fromOfficeRows(ROWS);
  const mount = (props) => act(() => root.render(createElement(ChurchCalendar, { events, services: [], todayKey: '2026-11-15', ...props })));
  it('shows a flyer event with where it came from, and "See the flyer" opens that picture', async () => {
    const onSeePicture = vi.fn();
    mount({ onSeePicture });
    expect(q('church-calendar-agenda').textContent).toContain('Battle Cry Sunday');
    expect(q('church-calendar-origin').textContent).toBe('From the office’s flyer');
    await tap(q('church-calendar-see-picture'));
    expect(onSeePicture).toHaveBeenCalledWith(expect.objectContaining({ name: 'Battle Cry Sunday', picturePath: PIC }));
  });
  it('Use again shows only for someone who may add, and hands over the event', async () => {
    mount({});
    expect(q('church-calendar-use-again')).toBeNull();
    const onUseAgain = vi.fn();
    mount({ onUseAgain });
    await tap(q('church-calendar-use-again'));
    expect(onUseAgain.mock.calls[0][0]).toMatchObject({ name: 'Battle Cry Sunday', rowId: 'r1' });
  });
  it('a day with a calendar event and a unit event lists both, each with its source', async () => {
    mount({ todayKey: '2026-11-24' });
    expect(
      qa('church-calendar-origin')
        .map((e) => e.textContent)
        .sort()
    ).toEqual(['From the office’s calendar', 'Sent in by Choir leadership']);
  });
});

describe('a unit leader sends in an event', () => {
  it('sees "Send in an event" (no CSV upload), and the event goes in for their unit', async () => {
    const onPost = vi.fn(async () => ({ saved: 1 }));
    act(() => root.render(createElement(ChurchCalendarTools, { events: [], canManage: false, units: ['Choir'], onPost, onAdd: vi.fn(), download: vi.fn() })));
    expect(q('church-calendar-upload-open')).toBeNull();
    expect(q('church-calendar-add-open').textContent).toBe('Send in an event');
    await tap(q('church-calendar-add-open'));
    expect(q('church-calendar-add-unit').value).toBe('Choir');
    await type(q('church-calendar-add-name'), 'Choir rehearsal');
    await type(q('church-calendar-add-date'), '2026-12-05');
    await submit(q('church-calendar-add-form'));
    expect(onPost).toHaveBeenCalledWith(expect.objectContaining({ name: 'Choir rehearsal', date: '2026-12-05' }), { unit: 'Choir', reusedFrom: null });
    expect(q('church-calendar-said').textContent).toBe('Added: Choir rehearsal, Saturday, December 5, 2026.');
  });
  it('a member who leads nothing sees no way to add', () => {
    act(() => root.render(createElement(ChurchCalendarTools, { events: [], canManage: false, units: [], download: vi.fn() })));
    expect(q('church-calendar-add-open')).toBeNull();
  });
  it('Use again opens the form filled a year on, says so, and files with the link', async () => {
    const onPost = vi.fn(async () => ({ saved: 1 }));
    const draft = againDraft(fromOfficeRows(ROWS).events.find((e) => e.name === 'Battle Cry Sunday'));
    act(() => root.render(createElement(ChurchCalendarTools, { events: [], canManage: true, onPost, onAdd: vi.fn(), draft, download: vi.fn() })));
    await flush();
    expect(q('church-calendar-reuse-note').textContent).toContain('Sunday, November 15, 2026');
    expect(q('church-calendar-add-name').value).toBe('Battle Cry Sunday');
    expect(q('church-calendar-add-date').value).toBe('2027-11-14');
    await type(q('church-calendar-add-time'), '10:30 AM');
    await submit(q('church-calendar-add-form'));
    expect(onPost).toHaveBeenCalledWith(expect.objectContaining({ date: '2027-11-14', time: '10:30 AM' }), { unit: '', reusedFrom: 'r1' });
  });
});

describe('the office: unit leaders', () => {
  const api = (over = {}) => ({
    readLeads: vi.fn(async () => ({ status: 'ok', leads: [], members: [{ userId: 'u-lead', name: 'Sister Lee' }] })),
    addLead: vi.fn(async () => ({ saved: true })),
    removeLead: vi.fn(async () => ({ removed: true })),
    uploadPicture: vi.fn(async () => ({ kept: 'kept' })),
    ...over,
  });
  const open = async (a, which = 'church-calendar-leads-open') => {
    act(() => root.render(createElement(ChurchCalendarOffice, { canManage: true, todayKey: '2026-11-24', api: a })));
    await tap(q(which));
    await flush();
  };
  it('is not there for anyone but the office', () => {
    act(() => root.render(createElement(ChurchCalendarOffice, { canManage: false, api: api() })));
    expect(q('church-calendar-office')).toBeNull();
  });
  it('none named says so; naming one files it and says what it allows', async () => {
    const a = api();
    await open(a);
    expect(q('church-calendar-leads-none').textContent).toContain('only the office adds');
    await type(q('church-calendar-leads-who'), 'u-lead');
    await type(q('church-calendar-leads-unit'), '  Choir  ');
    await submit(q('church-calendar-leads-add'));
    expect(a.addLead).toHaveBeenCalledWith('u-lead', 'Choir');
    expect(q('church-calendar-leads-said').textContent).toBe('Sister Lee can now send in events for Choir.');
  });
  it('a refused naming says it was refused, not that it worked', async () => {
    const a = api({ addLead: vi.fn(async () => ({ skipped: 'already' })) });
    await open(a);
    await type(q('church-calendar-leads-who'), 'u-lead');
    await type(q('church-calendar-leads-unit'), 'Choir');
    await submit(q('church-calendar-leads-add'));
    expect(q('church-calendar-leads-said').textContent).toBe('That person already leads that unit.');
  });
  it('a list that could not be read says so instead of looking empty', async () => {
    await open(api({ readLeads: vi.fn(async () => ({ status: 'unavailable', leads: [], members: [] })) }));
    expect(q('church-calendar-leads-unavailable')).not.toBeNull();
    expect(q('church-calendar-leads-none')).toBeNull();
  });
  it('Take off removes the leader and says their past events stay', async () => {
    const a = api({
      readLeads: vi.fn(async () => ({ status: 'ok', leads: [{ id: 'l1', userId: 'u-lead', unit: 'Choir', name: 'Sister Lee' }], members: [] })),
    });
    await open(a);
    await tap(q('church-calendar-leads-remove'));
    expect(a.removeLead).toHaveBeenCalledWith('l1');
    expect(q('church-calendar-leads-said').textContent).toContain('What they already sent stays on the calendar.');
  });
});

describe('the office: a flyer or calendar from before', () => {
  it('asks for the picture first, then keeps it for the month chosen and says what happens next', async () => {
    const a = { readLeads: vi.fn(), addLead: vi.fn(), removeLead: vi.fn(), uploadPicture: vi.fn(async () => ({ kept: 'kept' })) };
    act(() => root.render(createElement(ChurchCalendarOffice, { canManage: true, todayKey: '2026-11-24', api: a })));
    await tap(q('church-calendar-picture-open'));
    await submit(q('church-calendar-upload-picture'));
    expect(q('church-calendar-upload-said').textContent).toBe('Choose the picture first.');
    expect(a.uploadPicture).not.toHaveBeenCalled();
    const input = q('church-calendar-upload-file');
    const file = { name: 'battle-cry-2025.jpg', size: 2000 };
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    await type(q('church-calendar-upload-year'), '2025');
    await type(q('church-calendar-upload-title'), 'Battle Cry Sunday');
    await submit(q('church-calendar-upload-picture'));
    expect(a.uploadPicture).toHaveBeenCalledWith(file, { kind: 'flyer', year: 2025, month: 11, title: 'Battle Cry Sunday' });
    expect(q('church-calendar-upload-said').textContent).toBe(
      'Kept: the flyer for November 2025. It is in the archive, and the next daily reading puts its events on their days.'
    );
  });
});

// ── the data layer ───────────────────────────────────────────────────────────
function fakeClient({ rpc = {}, session = { user: { id: 'u1' } }, uploadError = null, selectErrorFor = [] } = {}) {
  const calls = { rpcs: [], inserts: [], uploads: [], selects: [] };
  return {
    calls,
    auth: { getSession: async () => ({ data: { session } }) },
    rpc: async (name, args) => {
      calls.rpcs.push({ name, args });
      return rpc[name] || { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
    },
    from: (table) => ({
      insert: async (rows) => (calls.inserts.push({ table, rows }), { error: null }),
      select: (cols) => {
        calls.selects.push(cols);
        const bad = selectErrorFor.some((c) => cols.includes(c));
        const chain = {
          eq: () => chain,
          order: () => chain,
          then: (ok) => Promise.resolve(bad ? { error: { message: 'no column' } } : { data: ROWS, error: null }).then(ok),
        };
        return chain;
      },
    }),
    storage: { from: () => ({ upload: async (path, bytes, opts) => (calls.uploads.push({ path, opts }), { error: uploadError }) }) },
  };
}
const church = async () => ({ ok: true, value: INST });

describe('who may add (church_calendar_can_post)', () => {
  it('a named leader is told their units, and is not the office', async () => {
    const client = fakeClient({ rpc: { church_calendar_can_post: { data: { office: false, units: ['Choir'] }, error: null } } });
    expect(await getCalendarAccess({ client, resolveChurch: church })).toEqual({ canManage: false, units: ['Choir'], unavailable: false });
    expect(client.calls.rpcs[0]).toEqual({ name: 'church_calendar_can_post', args: { instance_in: INST } });
  });
  it('before 0343 is on the database, the role answers (the office, no units)', async () => {
    const client = fakeClient();
    const a = await getCalendarAccess({ client, resolveChurch: church, roleOf: async () => ({ ok: true, value: 'admin' }) });
    expect(a).toEqual({ canManage: true, units: [], unavailable: false });
  });
  it('PROVEN TO CATCH: an answer that is an error is not a yes', async () => {
    const client = fakeClient({ rpc: { church_calendar_can_post: { data: null, error: { code: '42501', message: 'denied' } } } });
    expect(await getCalendarAccess({ client, resolveChurch: church, roleOf: async () => ({ ok: true, value: 'admin' }) })).toEqual({
      canManage: false,
      units: [],
      unavailable: true,
    });
  });
});

describe('posting one event (church_calendar_post)', () => {
  const ev = { name: 'Choir rehearsal', date: '2026-12-05', time: '10:00 AM', place: 'Sanctuary' };
  it('sends the unit, the words and the Use again link', async () => {
    const client = fakeClient({ rpc: { church_calendar_post: { data: 'new-id', error: null } } });
    expect(await postCalendarEvent(ev, { unit: 'Choir', reusedFrom: 'r3', client, resolveChurch: church })).toEqual({ saved: 1, id: 'new-id' });
    expect(client.calls.rpcs[0].args).toEqual({
      instance_in: INST,
      title_in: 'Choir rehearsal',
      date_in: '2026-12-05',
      detail_in: 'Time: 10:00 AM\nPlace: Sanctuary',
      unit_in: 'Choir',
      reused_from_in: 'r3',
    });
  });
  it('before 0343, the office still adds (the old insert); a leader is refused, never filed as the office', async () => {
    const office = fakeClient();
    expect(await postCalendarEvent(ev, { client: office, resolveChurch: church })).toEqual({ saved: 1 });
    expect(office.calls.inserts).toHaveLength(1);
    const lead = fakeClient();
    expect(await postCalendarEvent(ev, { unit: 'Choir', client: lead, resolveChurch: church })).toEqual({ skipped: 'refused', saved: 0 });
    expect(lead.calls.inserts).toHaveLength(0);
  });
});

describe('reading the rows', () => {
  it('asks for where each row came from, and still reads before 0343 is applied', async () => {
    const client = fakeClient({ selectErrorFor: ['read_from'] });
    const r = await readCalendarRows({ client, resolveChurch: church });
    expect(r.status).toBe('ok');
    expect(client.calls.selects[0]).toContain('read_from, picture_path, sent_by_unit, reused_from');
    expect(client.calls.selects[1]).not.toContain('read_from');
  });
});

describe('uploading a picture', () => {
  const file = (bytes) => ({ size: bytes.length, arrayBuffer: async () => new Uint8Array(bytes).buffer });
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
  it('a file that is not a picture is refused before anything is sent', async () => {
    const client = fakeClient();
    expect(await uploadPicture(file([1, 2, 3, 4]), { kind: 'flyer', year: 2025, month: 11 }, { client, resolveChurch: church })).toEqual({
      skipped: 'not-a-picture',
    });
    expect(client.calls.uploads).toHaveLength(0);
  });
  it('puts the bytes at <church>/<their sha256>.png, then files the row for the month', async () => {
    const client = fakeClient({ rpc: { church_site_archive_upload: { data: 'kept', error: null } } });
    expect(await uploadPicture(file(PNG), { kind: 'flyer', year: 2025, month: 11, title: 'Battle Cry' }, { client, resolveChurch: church })).toEqual({
      kept: 'kept',
    });
    const { createHash } = await import('node:crypto');
    const sha = createHash('sha256').update(Buffer.from(PNG)).digest('hex');
    expect(client.calls.uploads[0]).toEqual({ path: `${INST}/${sha}.png`, opts: { contentType: 'image/png', upsert: false } });
    expect(client.calls.rpcs[0]).toEqual({
      name: 'church_site_archive_upload',
      args: {
        instance_in: INST,
        kind_in: 'flyer',
        sha_in: sha,
        bytes_in: PNG.length,
        content_type_in: 'image/png',
        year_in: 2025,
        month_in: 11,
        title_in: 'Battle Cry',
      },
    });
  });
  it('the same picture already in the bucket is not an error', async () => {
    const client = fakeClient({
      uploadError: { statusCode: '409', message: 'The resource already exists' },
      rpc: { church_site_archive_upload: { data: 'seen', error: null } },
    });
    expect(await uploadPicture(file(PNG), { kind: 'calendar', year: 2024, month: 3 }, { client, resolveChurch: church })).toEqual({ kept: 'seen' });
  });
  it('a unit name is tidied, and an empty or too-long one is refused', () => {
    expect(cleanUnit('  Bus   Ministry ')).toBe('Bus Ministry');
    expect(cleanUnit('   ')).toBe('');
    expect(cleanUnit('x'.repeat(81))).toBe('');
  });
});
