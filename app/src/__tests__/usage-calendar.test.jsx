// =============================================================================
// When, and by whom, the apps are used (DR-0843)
// =============================================================================
// Darrell 2026-10-09: "How many times have users used the apps?... my son has
// done 90% of the work of evaluation... How many times a day and days
// specifically... on a calendar for most used days Saturday or Mondays."
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { cleanRows, perPerson, leaderboard, weekdayTotals, calendarGrid, calendarLine } from '../lib/usage-calendar.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ rows: null, signups: [] }));
vi.mock('../lib/usage-calendar-sync.js', () => ({ fetchUsageCalendar: async () => H.rows }));
vi.mock('../lib/signup-metrics.js', async (orig) => ({ ...(await orig()), fetchSignupMetrics: async () => ({ status: 'ready', data: { signups: H.signups } }) }));
vi.mock('../lib/contact-names.js', async (orig) => ({ ...(await orig()), loadContactIndex: async () => (await orig()).emptyIndex() }));

import UsageCalendar from '../components/UsageCalendar.jsx';

// 2026-10-03 is a Saturday, 2026-10-05 a Monday, 2026-10-06 a Tuesday.
const ROWS = [
  { user_id: 'u-son', day: '2026-10-03', kind: 'view', n: 12 },
  { user_id: 'u-son', day: '2026-10-03', kind: 'use', n: 7 },
  { user_id: 'u-son', day: '2026-10-05', kind: 'view', n: 4 },
  { user_id: 'u-son', day: '2026-10-06', kind: 'use', n: 2 },
  { user_id: 'u-dad', day: '2026-10-05', kind: 'view', n: 5 },
  { user_id: 'u-dad', day: '2026-10-06', kind: 'use', n: 1 },
  { user_id: '', day: '2026-10-06', kind: 'use', n: 9 },
  { user_id: 'u-x', day: 'nonsense', kind: 'view', n: 9 },
];

describe('the calendar, counted (pure)', () => {
  it('cleans the rows and counts each person: opens, uses, days, weekdays', () => {
    expect(cleanRows(ROWS).length).toBe(6);
    const son = perPerson(ROWS).get('u-son');
    expect(son).toMatchObject({ opens: 16, uses: 9, total: 25, activeDays: 3, firstDay: '2026-10-03', lastDay: '2026-10-06' });
    expect(son.byWeekday).toEqual([0, 4, 2, 0, 0, 0, 19]);
  });
  it('the leaderboard is by uses then opens, with each share of the using and of all', () => {
    const b = leaderboard(ROWS, (id) => ({ 'u-son': 'Darrell Jr', 'u-dad': 'Darrell' }[id]));
    expect(b.map((p) => [p.name, p.uses, p.opens, Math.round(p.shareUses * 100), Math.round(p.shareAll * 100)])).toEqual([['Darrell Jr', 9, 16, 90, 81], ['Darrell', 1, 5, 10, 19]]);
  });
  it('the weekdays together, the busiest named; the grid of the last weeks for everyone or one person', () => {
    const w = weekdayTotals(ROWS);
    expect(w.days.map((d) => d.n)).toEqual([0, 9, 3, 0, 0, 0, 19]);
    expect(w.busiest).toMatchObject({ label: 'Saturday', n: 19 });
    const g = calendarGrid(ROWS, { weeks: 2, today: '2026-10-09' });
    expect(g.start).toBe('2026-09-27');
    expect(g.end).toBe('2026-10-10');
    expect(g.weeks.length).toBe(2);
    const sat = g.weeks[0][6];
    expect(sat).toEqual({ day: '2026-10-03', n: 19, future: false });
    expect(g.weeks[1][6]).toEqual({ day: '2026-10-10', n: 0, future: true });
    expect(g.max).toBe(19);
    expect(calendarGrid(ROWS, { weeks: 2, today: '2026-10-09', userId: 'u-dad' }).weeks[1][1].n).toBe(5);
    expect(calendarLine(ROWS, { windowDays: 90 })).toBe('21 tab opens and 10 functions used by 2 people on 3 of the last 90 days · busiest weekday Saturday (19).');
    expect(calendarLine([], { windowDays: 90 })).toBe('Nothing opened or used in the last 90 days.');
    expect(weekdayTotals([]).busiest).toBeNull();
  });
});

describe('the section, rendered', () => {
  let container; let root;
  afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; H.rows = null; H.signups = []; });
  async function mount() {
    container = document.createElement('div'); document.body.appendChild(container);
    await act(async () => { root = createRoot(container); root.render(createElement(UsageCalendar)); });
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
  }
  it('names who has done the evaluating with their share, the busiest weekday, and a calendar that narrows to one person', async () => {
    H.rows = ROWS;
    H.signups = [{ user_id: 'u-son', display_name: 'Darrell Jr', email: 'jr@example.org' }, { user_id: 'u-dad', display_name: null, email: 'dad@example.org' }];
    await mount();
    expect(container.querySelector('[data-testid="usage-calendar-line"]').textContent).toContain('busiest weekday Saturday (19)');
    const people = Array.from(container.querySelectorAll('[data-testid="usage-person"]'));
    expect(people.map((p) => p.querySelector('[data-testid="usage-person-name"]').textContent)).toEqual(['Darrell Jr', 'dad@example.org']);
    expect(people[0].querySelector('[data-testid="usage-person-counts"]').textContent).toBe('9 used · 16 opened · 3 days · 90% of the using, 81% of all');
    expect(container.querySelector('[data-testid="usage-weekdays"]').textContent).toContain('Sat19');
    const cells = Array.from(container.querySelectorAll('[data-testid="usage-grid"] [data-day]'));
    expect(cells.length).toBe(84);
    expect(cells.find((c) => c.getAttribute('data-day') === '2026-10-05').getAttribute('data-n')).toBe('9');
    await act(async () => { people[1].querySelector('[data-testid="usage-person-name"]').click(); });
    const cells2 = Array.from(container.querySelectorAll('[data-testid="usage-grid"] [data-day]'));
    expect(cells2.find((c) => c.getAttribute('data-day') === '2026-10-05').getAttribute('data-n')).toBe('5');
    expect(container.textContent).toContain('Calendar, last 12 weeks · dad@example.org');
  });
  it('says plainly when the server refused the read', async () => {
    H.rows = null;
    await mount();
    expect(container.querySelector('[data-testid="usage-calendar-refused"]').textContent).toContain('for the family governors');
  });
});
