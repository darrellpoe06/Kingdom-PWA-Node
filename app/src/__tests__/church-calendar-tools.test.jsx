// @vitest-environment jsdom
// =============================================================================
// The office's calendar tools (DR-1586): members get the download and no
// form; the office adds one event, and an upload shows what was read and
// files nothing until the button naming the count is pressed. Cancel adds
// nothing. Copy and behavior are tested together (DR-0691).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchCalendarTools from '../components/lovecorner/ChurchCalendarTools.jsx';
import ChurchCalendar from '../components/lovecorner/ChurchCalendar.jsx';
import { fromAnnounced, fromOfficeRows } from '../lib/church-calendar.js';
import { COLG_DEFAULT_CHURCH as C } from '../lib/default-church.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const tap = (el) => act(async () => el.click());
const type = (el, value) =>
  act(() => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
const choose = (text, name = 'events.csv') =>
  act(async () => {
    const input = q('church-calendar-file');
    const file = { name, size: text.length, text: async () => text };
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await Promise.resolve();
  });
const EVENTS = fromAnnounced(C.announcedEvents);
function mount(props = {}) {
  act(() => root.render(createElement(ChurchCalendarTools, { events: EVENTS, download: vi.fn(), ...props })));
}
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('ChurchCalendarTools', () => {
  it('a member sees the download and neither Add nor Upload', () => {
    mount({ canManage: false });
    expect(q('church-calendar-add-open')).toBeNull();
    expect(q('church-calendar-upload-open')).toBeNull();
    expect(q('church-calendar-download').textContent).toBe('Download 2 events (CSV)');
  });
  it('the download hands over the real events in the upload’s own columns', async () => {
    const download = vi.fn();
    mount({ download });
    await tap(q('church-calendar-download'));
    const [name, text] = download.mock.calls[0];
    expect(name).toBe('church-calendar.csv');
    expect(text.split('\r\n').slice(0, 3)).toEqual([
      'date,name,end_date,time,place,note',
      '2026-07-14,77th National Assembly — Positioned for Purpose,2026-07-16,,,"E-MEG Christian Center (South Campus), 1109 N. Fourth St, Champaign"',
      '2026-08-29,Gospel Fest,,,,Featuring Leandrea Johnson',
    ]);
  });
  it('with nothing dated, the download says so and is off', () => {
    mount({ events: [] });
    expect(q('church-calendar-download').disabled).toBe(true);
    expect(q('church-calendar-download').textContent).toBe('No dated events to download');
  });
  it('the office adds one event: the saver gets the record, the calendar is told, the words name it', async () => {
    const onAdd = vi.fn(async () => ({ saved: 1 }));
    const onChanged = vi.fn();
    mount({ canManage: true, onAdd, onChanged });
    await tap(q('church-calendar-add-open'));
    type(q('church-calendar-add-name'), 'Harvest Dinner');
    type(q('church-calendar-add-date'), '2026-11-21');
    type(q('church-calendar-add-time'), '5:00 PM');
    type(q('church-calendar-add-place'), 'Fellowship hall');
    await tap(q('church-calendar-add-submit'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0][0]).toMatchObject({
      name: 'Harvest Dinner',
      date: '2026-11-21',
      time: '5:00 PM',
      place: 'Fellowship hall',
      source: 'office',
    });
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(q('church-calendar-said').textContent).toBe('Added: Harvest Dinner, Saturday, November 21, 2026.');
    expect(q('church-calendar-add-name').value).toBe('');
  });
  it('an event already on the calendar that day is not added twice', async () => {
    const onAdd = vi.fn();
    mount({ canManage: true, onAdd });
    await tap(q('church-calendar-add-open'));
    type(q('church-calendar-add-name'), 'gospel fest');
    type(q('church-calendar-add-date'), '2026-08-29');
    await tap(q('church-calendar-add-submit'));
    expect(onAdd).not.toHaveBeenCalled();
    expect(q('church-calendar-said').textContent).toMatch(/already on the calendar for Saturday, August 29, 2026/);
  });
  it('when the records refuse, it says so, keeps what was typed, and does not claim it was added', async () => {
    const onChanged = vi.fn();
    mount({ canManage: true, onAdd: async () => ({ skipped: 'refused', saved: 0 }), onChanged });
    await tap(q('church-calendar-add-open'));
    type(q('church-calendar-add-name'), 'Harvest Dinner');
    type(q('church-calendar-add-date'), '2026-11-21');
    await tap(q('church-calendar-add-submit'));
    expect(q('church-calendar-said').textContent).toMatch(/Only the church office can add/);
    expect(q('church-calendar-said').getAttribute('role')).toBe('alert');
    expect(q('church-calendar-add-name').value).toBe('Harvest Dinner');
    expect(onChanged).not.toHaveBeenCalled();
  });
  it('choosing a file adds NOTHING; it shows what was read, with each bad line and why', async () => {
    const onAdd = vi.fn(async (list) => ({ saved: list.length }));
    mount({ canManage: true, onAdd });
    await tap(q('church-calendar-upload-open'));
    await choose('date,name\n2025-08-30,Gospel Fest\n2026-08-29,Gospel Fest\nsomeday,Bad row\n10/12/2025,Fall Revival\n');
    expect(onAdd).not.toHaveBeenCalled();
    expect(q('church-calendar-file-read').textContent).toMatch(/events\.csv: 2 ready to add, 1 already on the calendar \(left alone\), 1 not read\./);
    expect(q('church-calendar-file-rejected').textContent).toMatch(/Line 4: "someday" is not a date/);
    expect(q('church-calendar-file-add').textContent).toBe('Add 2 events to the church calendar');
    await tap(q('church-calendar-file-add'));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].map((e) => `${e.date} ${e.name}`)).toEqual(['2025-08-30 Gospel Fest', '2025-10-12 Fall Revival']);
    expect(q('church-calendar-said').textContent).toBe('Added 2 events to the church calendar.');
    expect(q('church-calendar-file-read')).toBeNull();
  });
  it('"Cancel, add nothing" adds nothing', async () => {
    const onAdd = vi.fn();
    mount({ canManage: true, onAdd });
    await tap(q('church-calendar-upload-open'));
    await choose('date,name\n2025-08-30,Gospel Fest\n');
    await tap(q('church-calendar-file-cancel'));
    expect(onAdd).not.toHaveBeenCalled();
    expect(q('church-calendar-file-read')).toBeNull();
  });
  it('a file that cannot be trusted says why and offers no Add button', async () => {
    mount({ canManage: true, onAdd: vi.fn() });
    await tap(q('church-calendar-upload-open'));
    await choose('when,what\n2025-01-01,X\n', 'wrong.csv');
    expect(q('church-calendar-file-error').textContent).toMatch(/wrong\.csv: The first row must name the columns.*Nothing was added\./);
    expect(q('church-calendar-file-add')).toBeNull();
  });
  it('a partial upload says how many went in before it stopped', async () => {
    const onChanged = vi.fn();
    mount({ canManage: true, onAdd: async () => ({ skipped: 'timeout', saved: 1 }), onChanged });
    await tap(q('church-calendar-upload-open'));
    await choose('date,name\n2025-08-30,Gospel Fest\n2025-10-12,Fall Revival\n');
    await tap(q('church-calendar-file-add'));
    expect(q('church-calendar-said').textContent).toMatch(/^1 of 2 were added, then: The church’s records took too long/);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
});

describe('removing an office event', () => {
  const office = fromOfficeRows([{ id: 'r1', ministry: 'calendar', title: 'Harvest Dinner', week_of: '2026-11-19' }]).events;
  const mountCal = (props) =>
    act(() =>
      root.render(
        createElement(ChurchCalendar, {
          events: [...EVENTS, ...office],
          services: [],
          todayKey: '2026-11-19',
          ...props,
          key: (props && props.todayKey) || 'thu',
        })
      )
    );
  it('takes two presses; "Keep it" keeps it; only the second press removes', async () => {
    const onRemove = vi.fn(async () => ({ removed: true }));
    mountCal({ onRemove });
    await tap(q('church-calendar-remove'));
    expect(onRemove).not.toHaveBeenCalled();
    await tap(q('church-calendar-remove-no'));
    expect(onRemove).not.toHaveBeenCalled();
    await tap(q('church-calendar-remove'));
    await tap(q('church-calendar-remove-yes'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove.mock.calls[0][0].rowId).toBe('r1');
  });
  it('a member has no Remove, and the church record’s own events never have one', async () => {
    mountCal({ onRemove: null });
    expect(q('church-calendar-remove')).toBeNull();
    mountCal({ onRemove: vi.fn(), todayKey: '2026-08-29' });
    expect(q('church-calendar-agenda').textContent).toMatch(/Gospel Fest/);
    expect(q('church-calendar-remove')).toBeNull();
  });
  it('a remove that fails says the event is still there', async () => {
    mountCal({ onRemove: async () => ({ skipped: 'refused' }) });
    await tap(q('church-calendar-remove'));
    await tap(q('church-calendar-remove-yes'));
    expect(host.textContent).toMatch(/It could not be removed\. It is still on the calendar\./);
  });
});
