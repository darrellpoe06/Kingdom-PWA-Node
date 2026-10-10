// =============================================================================
// A SHORT-STAY DOOR HAS A BOOKING CALENDAR (DR-0907, migration 0269)
// =============================================================================
// Darrell, 2026-10-10: "Calendar for booking the apartment?", "With blackout
// dates for already booked...", "Short term rentals need another form...",
// "Not 29 day cap?... why?", "we like getting emails and other connections
// data for clarity on users preferences". The database half is
// infra/supabase/tests/0269-booking-calendar-smoke.sql.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { nightsBetween, takenNights, monthGrid, checkStayAsk, stayBook, GUEST_MAX_NIGHTS, addDays } from '../modules/properties/booking.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const H = vi.hoisted(() => ({ ranges: [], rows: [], asked: [], decided: [], added: [] }));
vi.mock('../modules/properties/cloud.js', () => ({
  loadBookedNights: async () => ({ ok: true, ranges: H.ranges }),
  requestAStay: async (a) => { H.asked.push(a); return { ok: true, id: 's1' }; },
  loadDoorStays: async () => ({ ok: true, rows: H.rows }),
  addDoorStay: async (row) => { H.added.push(row); return { ok: true }; },
  decideStay: async (id, status) => { H.decided.push([id, status]); return { ok: true }; },
}));
vi.mock('../lib/bounded-read.js', () => ({ boundedRead: (p) => p }));
import { BookAStay, StayDesk } from '../modules/properties/Booking.jsx';

const TODAY = '2026-10-10';
let container; let root;
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; Object.assign(H, { ranges: [], rows: [], asked: [], decided: [], added: [] }); });
async function mount(el) {
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(el); });
  for (let i = 0; i < 6; i += 1) await act(async () => { await Promise.resolve(); });
}
const day = (d) => container.querySelector(`button[aria-label^="${d}"]`);
async function tap(el) { await act(async () => { el.click(); }); for (let i = 0; i < 4; i += 1) await act(async () => { await Promise.resolve(); }); }
async function type(label, value) {
  const input = container.querySelector(`input[aria-label="${label}"]`);
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  await act(async () => { setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function tick(label) { await tap(container.querySelector(`input[aria-label="${label}"]`)); }

describe('the nights (pure)', () => {
  it('a night is the date you sleep there; the day you leave is free for the next guest', () => {
    expect(nightsBetween('2026-10-20', '2026-10-23')).toBe(3);
    expect([...takenNights([{ taken_from: '2026-10-20', taken_to: '2026-10-23' }])]).toEqual(['2026-10-20', '2026-10-21', '2026-10-22']);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
  it('a month is laid out in weeks starting Sunday', () => {
    const w = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(w[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(w.flat().filter(Boolean)).toHaveLength(31);
  });
  it('PROVEN-TO-CATCH: an ask over a taken night, past, over the guest limit, or without both attestations is refused here first', () => {
    const base = { taken: takenNights([{ taken_from: '2026-10-20', taken_to: '2026-10-23' }]), today: TODAY, guests: 2, name: 'Ana', phone: '217', is21: true, rules: true, rate: 150 };
    expect(checkStayAsk({ ...base, checkIn: '2026-10-18', checkOut: '2026-10-21' }).errors.dates).toMatch(/2026-10-20 is already taken/);
    expect(checkStayAsk({ ...base, checkIn: '2026-10-01', checkOut: '2026-10-03' }).errors.dates).toMatch(/passed/);
    expect(checkStayAsk({ ...base, checkIn: '2026-11-01', checkOut: addDays('2026-11-01', GUEST_MAX_NIGHTS + 1) }).errors.dates).toMatch(/up to 29 nights/);
    expect(checkStayAsk({ ...base, checkIn: '2026-10-24', checkOut: '2026-10-27', is21: false }).errors.is21).toBeTruthy();
    expect(checkStayAsk({ ...base, checkIn: '2026-10-24', checkOut: '2026-10-27', rules: false }).errors.rules).toBeTruthy();
    const ok = checkStayAsk({ ...base, checkIn: '2026-10-23', checkOut: '2026-10-26' });
    expect(ok).toMatchObject({ ok: true, nights: 3, total: 450 });
  });
  it('the family\'s desk sorts asks, what is coming, and what has been', () => {
    const b = stayBook([
      { id: 'a', kind: 'stay', status: 'requested', check_in: '2026-11-02', check_out: '2026-11-04' },
      { id: 'u', kind: 'block', status: 'confirmed', check_in: '2026-10-20', check_out: '2026-10-23' },
      { id: 'p', kind: 'stay', status: 'confirmed', check_in: '2026-09-01', check_out: '2026-09-03' },
      { id: 'x', kind: 'stay', status: 'cancelled', check_in: '2026-12-01', check_out: '2026-12-03' },
    ], TODAY);
    expect([b.asks.map((r) => r.id), b.upcoming.map((r) => r.id), b.past.map((r) => r.id), b.closed.map((r) => r.id)]).toEqual([['a'], ['u'], ['p'], ['x']]);
  });
});

describe('a guest books — the short form, no account', () => {
  it('taken nights are dark; tap in, tap out; the ask carries both attestations, wishes, and only a yes the guest ticked', async () => {
    H.ranges = [{ taken_from: '2026-10-20', taken_to: '2026-10-23' }];
    await mount(createElement(BookAStay, { rentalId: 'r-apt2', placeName: '1-bed in Champaign', rate: 150, today: TODAY }));
    expect(day('2026-10-21').getAttribute('data-taken')).toBe('yes');
    expect(day('2026-10-23').getAttribute('data-taken')).toBeNull();
    expect(container.querySelector('input[aria-label="Send me offers by email"]').checked).toBe(false);
    await tap(day('2026-10-23'));
    await tap(day('2026-10-26'));
    expect(container.querySelector('[data-testid="stay-summary"]').textContent).toBe('2026-10-23 to 2026-10-26: 3 nights, about $450.00');
    await type('Your name', 'Ana Guest');
    await type('Cell phone', '217-555-0100');
    await type('What would make your stay better', 'Coffee and oat milk');
    await tap(container.querySelector('[data-testid="book-a-stay-send"]'));
    expect(H.asked).toEqual([]);   // not 21+ / rules yet
    await tick('I am 21 or older');
    await tick('I accept the house rules');
    await tap(container.querySelector('[data-testid="book-a-stay-send"]'));
    expect(H.asked).toHaveLength(1);
    expect(H.asked[0]).toMatchObject({ rentalId: 'r-apt2', checkIn: '2026-10-23', checkOut: '2026-10-26', name: 'Ana Guest', is21: true, rules: true, wishes: 'Coffee and oat milk', offers: false });
    expect(container.textContent).toContain('3 nights at 1-bed in Champaign');
  });

  it('a range that runs over a taken night is refused before it is sent', async () => {
    H.ranges = [{ taken_from: '2026-10-20', taken_to: '2026-10-23' }];
    await mount(createElement(BookAStay, { rentalId: 'r-apt2', today: TODAY }));
    await tap(day('2026-10-18'));
    await tap(day('2026-10-21'));
    await type('Your name', 'Ana'); await type('Cell phone', '217');
    await tick('I am 21 or older'); await tick('I accept the house rules');
    await tap(container.querySelector('[data-testid="book-a-stay-send"]'));
    expect(H.asked).toEqual([]);
    expect(container.textContent).toContain('The night of 2026-10-20 is already taken.');
  });
});

describe('the family\'s Stays desk', () => {
  it('confirms or declines an ask, cancels, blacks out nights, and enters a stay of any length', async () => {
    H.rows = [
      { id: 'a1', kind: 'stay', status: 'requested', check_in: '2026-11-02', check_out: '2026-11-04', guest_name: 'Ana Guest', guests: 2, guest_phone: '217-555-0100', stay_wishes: 'Coffee', offers_by_email: true },
      { id: 'c1', kind: 'stay', status: 'confirmed', check_in: '2026-10-24', check_out: '2026-10-26', guest_name: 'Ben' },
    ];
    await mount(createElement(StayDesk, { instanceId: 'i1', rentalId: 'r-apt2', today: TODAY }));
    expect(container.querySelector('[data-testid="stay-ask"]').textContent).toContain('wishes: "Coffee" · yes to offers by email');
    const buttons = () => [...container.querySelectorAll('button')];
    await tap(buttons().find((b) => b.textContent === 'Confirm'));
    await tap(buttons().find((b) => b.textContent === 'Cancel'));
    expect(H.decided).toEqual([['a1', 'confirmed'], ['c1', 'cancelled']]);
    await type('Blackout from', '2026-12-20'); await type('Blackout to', '2026-12-27'); await type('Blackout reason', 'Family visiting');
    await tap(buttons().find((b) => b.textContent === 'Black out'));
    await type('Stay arrives', '2027-01-05'); await type('Stay leaves', '2027-03-05'); await type('Stay guest name', 'Visiting professor'); await type('Stay guest phone', '217-555-0199');
    await tap(buttons().find((b) => b.textContent === 'Book it'));
    expect(H.added).toEqual([
      { instance_id: 'i1', rental_id: 'r-apt2', kind: 'block', status: 'confirmed', check_in: '2026-12-20', check_out: '2026-12-27', block_reason: 'Family visiting' },
      { instance_id: 'i1', rental_id: 'r-apt2', kind: 'stay', status: 'confirmed', check_in: '2027-01-05', check_out: '2027-03-05', guest_name: 'Visiting professor', guest_phone: '217-555-0199' },
    ]);
  });
});
