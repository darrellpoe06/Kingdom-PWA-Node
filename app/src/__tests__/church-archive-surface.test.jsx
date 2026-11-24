// @vitest-environment jsdom
// =============================================================================
// The church archive surface (DR-1596): months by year, each opening to the
// office's own pictures through signed addresses and full size; what it says
// when nothing is kept or nothing could be read; and the calendar's Remove
// saying "Archive" for an event that has happened, the words and the press
// tested together.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchArchive, { goToArchive, ARCHIVE_ANCHOR } from '../components/lovecorner/ChurchArchive.jsx';
import ChurchCalendar from '../components/lovecorner/ChurchCalendar.jsx';
import ChurchCalendarPlanning from '../components/lovecorner/ChurchCalendarPlanning.jsx';
import { fromOfficeRows } from '../lib/church-calendar.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const qa = (id) => [...host.querySelectorAll(`[data-testid="${id}"]`)];
const tap = (el) => act(async () => el.click());
const flush = () => act(async () => {});

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const ROWS = [
  {
    id: '1',
    kind: 'calendar',
    title: 'November 2026 calendar',
    for_year: 2026,
    for_month: 11,
    storage_path: 'i/1.jpeg',
    first_seen_at: '2026-11-02T10:00:00Z',
  },
  {
    id: '2',
    kind: 'letter',
    title: 'November 2026 Letter from BG',
    for_year: 2026,
    for_month: 11,
    storage_path: 'i/2.jpeg',
    first_seen_at: '2026-11-03T10:00:00Z',
  },
  { id: '3', kind: 'flyer', title: 'Battle Cry', for_year: 2026, for_month: 11, storage_path: 'i/3.jpeg', first_seen_at: '2026-11-04T10:00:00Z' },
  { id: '4', kind: 'flyer', title: 'Thanksgiving', for_year: 2026, for_month: 11, storage_path: 'i/4.jpeg', first_seen_at: '2026-11-05T10:00:00Z' },
  { id: '5', kind: 'flyer', title: 'Veterans', for_year: 2026, for_month: 11, storage_path: 'i/5.jpeg', first_seen_at: '2026-11-06T10:00:00Z' },
  {
    id: '6',
    kind: 'calendar',
    title: 'December 2025 calendar',
    for_year: 2025,
    for_month: 12,
    storage_path: 'i/6.jpeg',
    first_seen_at: '2025-12-02T10:00:00Z',
  },
];
const mount = (props) => act(() => root.render(createElement(ChurchArchive, { status: 'ok', rows: ROWS, ...props })));
// ONE toggle per opening, as a browser gives (DR-1617's CI run found this flaky
// on main, 2 of 6 local runs): jsdom queues its OWN toggle when `open` changes,
// so the old manual dispatch made two, and when jsdom's arrived after the first
// ask settled, the month asked again (3 calls, not 2). Drive only the real
// event; an already-open month is closed first so it can be opened again.
const nextToggle = (el) =>
  new Promise((resolve) => {
    const done = () => { clearTimeout(t); el.removeEventListener('toggle', done); resolve(); };
    const t = setTimeout(() => { el.removeEventListener('toggle', done); el.dispatchEvent(new Event('toggle')); resolve(); }, 1000);
    el.addEventListener('toggle', done);
  });
const openMonth = async (el) =>
  act(async () => {
    if (el.open) {
      const closed = nextToggle(el);
      el.open = false;
      await closed;
    }
    const opened = nextToggle(el);
    el.open = true;
    await opened;
  });

describe('the archive', () => {
  it('lists the years and months, newest first, in words', () => {
    mount();
    expect(qa('church-archive-year').map((y) => y.querySelector('b').textContent)).toEqual(['2026', '2025']);
    expect(qa('church-archive-summary').map((s) => s.textContent)).toEqual([
      'November 2026: the calendar, the letter, 3 flyers',
      'December 2025: the calendar',
    ]);
    expect(host.querySelector(`#${ARCHIVE_ANCHOR}`)).not.toBeNull();
  });
  it('opening a month asks for its pictures once, shows them, and each opens full size', async () => {
    const sign = vi.fn(async (paths) => Object.fromEntries(paths.map((p) => [p, `https://signed/${p}`])));
    mount({ sign });
    const nov = qa('church-archive-month')[0];
    await openMonth(nov);
    await flush();
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign.mock.calls[0][0]).toEqual(['i/1.jpeg', 'i/2.jpeg', 'i/3.jpeg', 'i/4.jpeg', 'i/5.jpeg']);
    const pics = [...nov.querySelectorAll('[data-testid="church-archive-picture"]')];
    expect(pics.map((p) => p.dataset.kind)).toEqual(['calendar', 'letter', 'flyer', 'flyer', 'flyer']);
    expect(pics[0].querySelector('img').getAttribute('src')).toBe('https://signed/i/1.jpeg');
    expect(pics[0].textContent).toMatch(/Calendar: November 2026 calendar · kept/);
    await tap(pics[1].querySelector('button'));
    expect(q('church-office-full')).not.toBeNull();
    expect(q('church-office-full-img').getAttribute('alt')).toBe('Letter from BG: November 2026 Letter from BG');
    await tap(q('church-office-close'));
    expect(q('church-office-full')).toBeNull();
    // A second opening does not ask again when every picture signed.
    await openMonth(qa('church-archive-month')[0]);
    expect(sign).toHaveBeenCalledTimes(1);
  });
  it('a picture that could not be signed says so and is asked for again on the next opening', async () => {
    const sign = vi.fn(async () => ({}));
    mount({ sign });
    const dec = qa('church-archive-month')[1];
    await openMonth(dec);
    await flush();
    expect(dec.querySelector('[data-testid="church-archive-picture-wait"]').textContent).toMatch(
      /could not be opened just now\. Close the month and open it again to retry\./
    );
    await openMonth(qa('church-archive-month')[1]);
    await flush();
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('an event the office archived is listed in its month, saying who took it off and that it is kept', () => {
    const archived = fromOfficeRows([
      { id: 'r1', ministry: 'calendar', title: 'Gospel Fest', week_of: '2026-08-29', archived_at: '2026-11-19T16:00:00Z' },
    ]).archived;
    mount({ rows: [], archivedEvents: archived });
    expect(qa('church-archive-summary').map((s) => s.textContent)).toEqual(['August 2026: 1 archived event']);
    expect(q('church-archive-events').textContent).toMatch(/Gospel Fest.*Taken off the calendar by the church office on .*2026; kept here\./);
  });
  it('never goes blank: nothing kept yet, signed out, and a failed read each say what is true', () => {
    mount({ rows: [] });
    expect(q('church-archive-empty').textContent).toMatch(/Nothing is kept yet\. The app reads the church website once a day/);
    mount({ status: 'signed-out' });
    expect(q('church-archive-status').textContent).toMatch(/Sign in to see/);
    mount({ status: 'unavailable' });
    expect(q('church-archive-status').textContent).toMatch(/could not be read just now\. Nothing in it is lost/);
    expect(q('church-archive-year')).toBeNull();
  });
  it('the past years link scrolls to the archive', async () => {
    mount();
    const el = document.getElementById(ARCHIVE_ANCHOR);
    el.scrollIntoView = vi.fn();
    expect(goToArchive(document)).toBe(true);
    expect(el.scrollIntoView).toHaveBeenCalled();
    expect(goToArchive(null)).toBe(false);
    const onArchive = vi.fn();
    act(() => root.render(createElement(ChurchCalendarPlanning, { events: [], todayKey: '2026-11-19', onArchive })));
    await tap(q('church-calendar-to-archive'));
    expect(onArchive).toHaveBeenCalledTimes(1);
    act(() => root.render(createElement(ChurchCalendarPlanning, { events: [], todayKey: '2026-11-19' })));
    expect(q('church-calendar-to-archive')).toBeNull();
  });
});

describe('the calendar’s Remove on an event that has happened', () => {
  const office = fromOfficeRows([
    { id: 'past', ministry: 'calendar', title: 'Harvest Dinner', week_of: '2026-11-18' },
    { id: 'next', ministry: 'calendar', title: 'Choir Night', week_of: '2026-11-20' },
  ]).events;
  const mountCal = (onRemove) => act(() => root.render(createElement(ChurchCalendar, { events: office, services: [], todayKey: '2026-11-19', onRemove })));
  it('says Archive, confirms it is kept, and the press archives', async () => {
    const onRemove = vi.fn(async () => ({ removed: true, outcome: 'archived' }));
    mountCal(onRemove);
    await tap(q('church-calendar-day-2026-11-18'));
    expect(q('church-calendar-remove').textContent).toBe('Archive');
    await tap(q('church-calendar-remove'));
    expect(q('church-calendar-remove-yes').textContent).toBe('Yes, archive it: off the calendar, kept in the archive');
    await tap(q('church-calendar-remove-yes'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove.mock.calls[0][0].rowId).toBe('past');
  });
  it('a future event still says Remove, for a post made by mistake', async () => {
    mountCal(vi.fn(async () => ({ removed: true, outcome: 'deleted' })));
    await tap(q('church-calendar-day-2026-11-20'));
    expect(q('church-calendar-remove').textContent).toBe('Remove');
    await tap(q('church-calendar-remove'));
    expect(q('church-calendar-remove-yes').textContent).toBe('Yes, remove it for everyone');
  });
  it('an archive that fails says the event is still there', async () => {
    mountCal(async () => ({ skipped: 'refused' }));
    await tap(q('church-calendar-day-2026-11-18'));
    await tap(q('church-calendar-remove'));
    await tap(q('church-calendar-remove-yes'));
    expect(host.textContent).toMatch(/It could not be archived\. It is still on the calendar\./);
  });
});
