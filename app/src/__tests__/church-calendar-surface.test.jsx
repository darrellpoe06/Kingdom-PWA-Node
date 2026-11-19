// @vitest-environment jsdom
// =============================================================================
// The church calendar surface (DR-1585): the This-week strip is seven real
// buttons, a tapped day shows that day, the month view moves by month and
// year, an empty day says so, and + Calendar hands the event to the saver.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchCalendar from '../components/lovecorner/ChurchCalendar.jsx';
import { fromAnnounced, makeEvent } from '../lib/church-calendar.js';
import { COLG_DEFAULT_CHURCH as C } from '../lib/default-church.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const THU = '2026-11-19';
let host;
let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const tap = (el) => act(() => el.click());
function mount(props = {}) {
  act(() => root.render(createElement(ChurchCalendar, { events: fromAnnounced(C.announcedEvents), services: C.services, todayKey: THU, ...props })));
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

describe('ChurchCalendar', () => {
  it('draws seven day buttons, Sunday to Saturday, each labelled in words, today pressed', () => {
    mount();
    const days = [...q('church-calendar-week').querySelectorAll('button')];
    expect(days).toHaveLength(7);
    expect(days.map((b) => b.textContent.slice(0, 3))).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(days[4].getAttribute('aria-pressed')).toBe('true');
    expect(days[4].getAttribute('aria-label')).toBe('Thursday, November 19, 2026, today, 0 items');
    expect(days[0].getAttribute('aria-label')).toBe('Sunday, November 15, 2026, 1 item');
  });
  it('today with nothing on it says so; it does not go blank', () => {
    mount();
    expect(q('church-calendar-empty').textContent).toMatch(/Nothing is on the church calendar for this day/);
    expect(q('church-calendar-agenda')).toBeNull();
  });
  it('tapping Wednesday shows that Wednesday: both Bible studies, as text', () => {
    mount();
    tap(q('church-calendar-day-2026-11-18'));
    expect(q('church-calendar-picked').textContent).toBe('Wednesday, November 18, 2026');
    const items = [...host.querySelectorAll('[data-testid="church-calendar-item"]')];
    expect(items.map((li) => li.textContent)).toEqual(['Bible Study1:00 PMIn person and live online', 'Bible Study6:00 PMIn person and live online']);
    expect(q('church-calendar-day-2026-11-18').getAttribute('aria-pressed')).toBe('true');
    expect(q('church-calendar-day-2026-11-19').getAttribute('aria-pressed')).toBe('false');
  });
  it('the month button opens the month; it moves by month and by year and comes back', () => {
    mount();
    expect(q('church-calendar-month')).toBeNull();
    tap(q('church-calendar-view'));
    const label = () => q('church-calendar-month-label').textContent;
    expect(label()).toBe('November 2026');
    expect(q('church-calendar-month-empty').textContent).toMatch(/No dated events are on record for November 2026/);
    tap(q('church-calendar-next-month'));
    tap(q('church-calendar-next-month'));
    expect(label()).toBe('January 2027');
    tap(q('church-calendar-prev-year'));
    expect(label()).toBe('January 2026');
    tap(q('church-calendar-this-month'));
    expect(label()).toBe('November 2026');
    expect(q('church-calendar-this-month')).toBeNull();
  });
  it('July 2026 lists the Assembly from the church record, and tapping the 15th shows it', () => {
    mount();
    tap(q('church-calendar-view'));
    for (let i = 0; i < 4; i += 1) tap(q('church-calendar-prev-month'));
    expect(q('church-calendar-month-label').textContent).toBe('July 2026');
    expect(q('church-calendar-month-events').textContent).toMatch(/77th National Assembly.*Jul 14 – 16/);
    tap(q('church-calendar-cell-2026-07-15'));
    expect(q('church-calendar-picked').textContent).toBe('Wednesday, July 15, 2026');
    expect(q('church-calendar-agenda').textContent).toMatch(/77th National Assembly/);
  });
  it('+ Calendar hands the event to the saver; a weekly service has no such button; a saved one reads saved', () => {
    const onSave = vi.fn();
    const ev = makeEvent({ id: 'office-a', name: 'Harvest Dinner', date: THU, time: '5:00 PM', place: 'Fellowship hall' });
    mount({ events: [ev], onSave });
    const btn = q('church-calendar-agenda').querySelector('button');
    expect(btn.getAttribute('aria-label')).toBe('Add Harvest Dinner to my calendar');
    tap(btn);
    expect(onSave).toHaveBeenCalledWith(ev);
    mount({ events: [ev], onSave, savedIds: ['office-a'] });
    expect(q('church-calendar-agenda').querySelector('button').disabled).toBe(true);
    tap(q('church-calendar-day-2026-11-18'));
    expect(q('church-calendar-agenda').querySelector('button')).toBeNull();
  });
  it('says why the office’s events are missing instead of looking complete', () => {
    mount({ status: 'signed-out' });
    expect(q('church-calendar-note').textContent).toMatch(/Sign in to see the events your church office has added/);
    mount({ status: 'unavailable' });
    expect(q('church-calendar-note').textContent).toMatch(/could not be read just now/);
    mount({ status: 'ok' });
    expect(q('church-calendar-note')).toBeNull();
  });
  it('with no date from the device it says so rather than drawing a wrong week', () => {
    mount({ todayKey: '' });
    expect(q('church-calendar-undated')).not.toBeNull();
    expect(q('church-calendar-week')).toBeNull();
  });
});
