// @vitest-environment jsdom
// =============================================================================
// Past years and planning (DR-1587): what past years held at the time of year
// now coming up, the honest empty state when no past year is on record, and a
// suggestion riding the app's existing feedback list.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchCalendarPlanning from '../components/lovecorner/ChurchCalendarPlanning.jsx';
import {
  comingUpFromPastYears,
  upcomingEvents,
  yearsOnRecord,
  suggestionText,
  extractCalendarSuggestions,
  fromAnnounced,
  makeEvent,
  CALENDAR_SUGGESTION_TAG,
} from '../lib/church-calendar.js';
import { COLG_DEFAULT_CHURCH as C } from '../lib/default-church.js';

const THU = '2026-11-19';
const ev = (name, date, extra = {}) => makeEvent({ name, date, ...extra });
// Fixture rows for the logic only: they stand for what an office upload would file. None ships in the app.
const PAST = [
  ev('Fixture A', '2025-12-05'),
  ev('Fixture B', '2024-12-05'),
  ev('Fixture C', '2025-11-18'),
  ev('Fixture D', '2025-01-10'),
  ev('Fixture E', '2025-06-01'),
  ev('Fixture F', '2026-12-01'),
];

describe('this time of year, in past years', () => {
  it('finds past-year events whose same day falls in the next 60 days, soonest first, and says how long ago', () => {
    const got = comingUpFromPastYears(PAST, THU);
    expect(got.map((p) => [p.event.name, p.around, p.yearsAgo])).toEqual([
      ['Fixture A', '2026-12-05', 1],
      ['Fixture B', '2026-12-05', 2],
      ['Fixture D', '2027-01-10', 2],
    ]);
  });
  it('PROVEN TO CATCH: yesterday’s date last year is not "coming up", and this year’s own events are never "past years"', () => {
    // Break: compare month-day without the window (or include the current year) and C or F appear.
    const names = comingUpFromPastYears(PAST, THU).map((p) => p.event.name);
    expect(names).not.toContain('Fixture C');
    expect(names).not.toContain('Fixture F');
    expect(names).not.toContain('Fixture E');
  });
  it('crosses the year end, and a February 29 lands on February 28 in a year without one', () => {
    expect(comingUpFromPastYears([ev('Leap', '2024-02-29')], '2027-02-01').map((p) => p.around)).toEqual(['2027-02-28']);
    expect(comingUpFromPastYears([ev('Leap', '2024-02-29')], '2028-02-01').map((p) => p.around)).toEqual(['2028-02-29']);
    expect(comingUpFromPastYears([ev('NewYear', '2025-01-01')], '2026-12-20').map((p) => [p.around, p.yearsAgo])).toEqual([['2027-01-01', 2]]);
  });
  it('with the church’s real record today (2026 only) there is nothing from past years, and it does not invent any', () => {
    const real = fromAnnounced(C.announcedEvents);
    expect(comingUpFromPastYears(real, THU)).toEqual([]);
    expect(yearsOnRecord(real)).toEqual([{ year: 2026, count: 2 }]);
  });
  it('lists what is still ahead in the next 90 days, a running multi-day event included', () => {
    const list = [ev('Running', '2026-11-18', { endDate: '2026-11-20' }), ev('Over', '2026-11-18'), ev('Soon', '2026-12-24'), ev('Far', '2027-03-01')];
    expect(upcomingEvents(list, THU).map((e) => e.name)).toEqual(['Running', 'Soon']);
    expect(upcomingEvents(list, 'x')).toEqual([]);
  });
});

describe('a suggestion', () => {
  it('is one tagged line; with no words there is nothing to send', () => {
    expect(suggestionText({ about: 'Gospel Fest', text: '  Start earlier  ', from: 'Sis. Jones' })).toBe(
      '[Calendar suggestion] Sis. Jones · About: Gospel Fest · Start earlier'
    );
    expect(suggestionText({ text: 'A fall picnic' })).toBe('[Calendar suggestion] A parishioner · About: A new idea · A fall picnic');
    expect(suggestionText({ about: 'X', text: '   ' })).toBe('');
  });
  it('is pulled back out of a feedback list: only tagged rows, each once, newest first, words intact', () => {
    const items = [
      {
        id: 'f1',
        text: suggestionText({ about: 'Gospel Fest', text: 'Start earlier · and add parking', from: 'Sis. Jones' }),
        createdAt: '2026-11-18T10:00:00Z',
      },
      { id: 'f2', text: 'The app is slow on my phone', createdAt: '2026-11-19T10:00:00Z' },
      { id: 'f1', text: 'dup', createdAt: '2026-11-18T10:00:00Z' },
      { id: 'f3', text: `${CALENDAR_SUGGESTION_TAG} A parishioner · About: A new idea · A fall picnic`, submittedAt: '2026-11-19T12:00:00Z' },
      null,
    ];
    expect(extractCalendarSuggestions(items)).toEqual([
      { id: 'f3', who: 'A parishioner', about: 'A new idea', text: 'A fall picnic', at: '2026-11-19T12:00:00Z' },
      { id: 'f1', who: 'Sis. Jones', about: 'Gospel Fest', text: 'Start earlier · and add parking', at: '2026-11-18T10:00:00Z' },
    ]);
  });
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host;
let root;
const q = (id) => host.querySelector(`[data-testid="${id}"]`);
const tap = (el) => act(async () => el.click());
const type = (el, value) =>
  act(() => {
    const proto =
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
const mount = (props = {}) =>
  act(() => root.render(createElement(ChurchCalendarPlanning, { events: fromAnnounced(C.announcedEvents), todayKey: THU, ...props })));
beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe('ChurchCalendarPlanning', () => {
  it('with only 2026 on record it says there is nothing to compare with and how that gets filled; it lists no example', () => {
    mount();
    expect(q('church-calendar-past')).toBeNull();
    expect(q('church-calendar-past-empty').textContent).toMatch(
      /No events from past years are on record yet.*When the church office uploads past years’ calendars/
    );
    expect(q('church-calendar-years').textContent).toBe('Dated events on record: 2026 (2).');
  });
  it('shows a past-year event with the year it was held, and never says it will happen', () => {
    mount({ events: [...fromAnnounced(C.announcedEvents), ev('Fixture A', '2025-12-05', { place: 'Sanctuary' })] });
    const t = q('church-calendar-past').textContent;
    expect(t).toMatch(/Fixture AHeld Dec 5, 2025 \(last year\) · Sanctuary/);
    expect(t).toMatch(/would be around Saturday, December 5, 2026\. It is not on this year’s calendar unless it is listed above\./);
    expect(t).not.toMatch(/will be|is coming|expect it/i);
    expect(q('church-calendar-years').textContent).toBe('Dated events on record: 2026 (2), 2025 (1).');
  });
  it('past years on record but none this season: it says which years and where to look', () => {
    mount({ events: [ev('Fixture E', '2025-06-01')] });
    expect(q('church-calendar-past-empty').textContent).toMatch(/Nothing from past years falls in the next 60 days\. On record: 2025 \(1\)/);
  });
  it('signed out, there is no form: it says a suggestion would reach no one', () => {
    mount({ signedIn: false, onSuggest: vi.fn() });
    expect(q('church-calendar-suggest')).toBeNull();
    expect(q('church-calendar-suggest-signed-out').textContent).toMatch(/Sign in to send a suggestion/);
  });
  it('signed in, a suggestion goes to the feedback list as one tagged row in the church area, and the words say where it went', async () => {
    const onSuggest = vi.fn(() => ({ id: 'fb-123' }));
    mount({ signedIn: true, onSuggest, events: [ev('Fixture Soon', '2026-12-24')] });
    expect([...q('church-calendar-suggest-about').options].map((o) => o.value)).toEqual(['A new idea', 'Fixture Soon (Dec 24, 2026)']);
    type(q('church-calendar-suggest-about'), 'Fixture Soon (Dec 24, 2026)');
    type(q('church-calendar-suggest-text'), 'Could it start at 5?');
    type(q('church-calendar-suggest-from'), 'Bro. Lee');
    await tap(q('church-calendar-suggest-send'));
    expect(onSuggest).toHaveBeenCalledWith({
      area: 'church',
      category: 'feature-request',
      text: '[Calendar suggestion] Bro. Lee · About: Fixture Soon (Dec 24, 2026) · Could it start at 5?',
    });
    expect(q('church-calendar-suggest-said').textContent).toBe('Sent to the church app’s feedback list (reference fb-123). Thank you for helping plan.');
    expect(q('church-calendar-suggest-text').value).toBe('');
  });
  it('empty words send nothing; a send that fails keeps the words and does not say Sent', async () => {
    const onSuggest = vi.fn(() => null);
    mount({ signedIn: true, onSuggest });
    await tap(q('church-calendar-suggest-send'));
    expect(onSuggest).not.toHaveBeenCalled();
    expect(q('church-calendar-suggest-said').textContent).toBe('Write a few words first.');
    type(q('church-calendar-suggest-text'), 'A fall picnic');
    await tap(q('church-calendar-suggest-send'));
    expect(q('church-calendar-suggest-said').textContent).toMatch(/did not send/);
    expect(q('church-calendar-suggest-text').value).toBe('A fall picnic');
  });
  it('the office sees the suggestions that reached its feedback list; a member does not', () => {
    const feedback = [
      { id: 'f1', text: suggestionText({ about: 'Gospel Fest', text: 'Start earlier', from: 'Sis. Jones' }), createdAt: '2026-11-18T10:00:00Z' },
    ];
    mount({ canManage: false, feedback });
    expect(q('church-calendar-received')).toBeNull();
    mount({ canManage: true, feedback });
    expect(q('church-calendar-received').textContent).toBe('Gospel FestStart earlierSis. Jones · 2026-11-18');
    mount({ canManage: true, feedback: [] });
    expect(q('church-calendar-received-empty')).not.toBeNull();
  });
});
