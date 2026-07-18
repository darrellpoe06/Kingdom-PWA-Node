// @vitest-environment node
//
// reminders — the pure "which reminders are due now" engine extracted from the
// monolith shell (Darrell 2026-07-18: "extract the reminder engine"). Pure +
// deterministic (now is injected), so the schedule logic is finally testable —
// which the in-shell setInterval version never was.
import { describe, it, expect } from 'vitest';
import { dueReminders } from '../lib/reminders.js';

// An all-day event anchors to 09:00 LOCAL (eventDateTime). Build a local ms for a
// given wall-clock so the tests are timezone-independent.
const localMs = (y, m, d, hh = 9, mm = 0) => new Date(y, m - 1, d, hh, mm).getTime();
const eventAt = (id, date, reminders) => ({ id, title: `E${id}`, date, allDay: true, category: 'appointment', reminders });

describe('dueReminders', () => {
  it('fires a reminder once its window opens (reminderTime <= now <= eventTime)', () => {
    const ev = eventAt('e1', '2026-04-15', ['1d-before', 'at-time']);
    // 1 day before the 09:00 event = the day before at 09:00.
    const now = localMs(2026, 4, 14, 9, 0);
    const out = dueReminders([ev], now, new Set());
    expect(out.map((r) => r.firedKey)).toContain('e1-1d-before');
    expect(out.find((r) => r.firedKey === 'e1-1d-before').title).toContain('Ee1');
  });
  it('does NOT fire before the reminder window or after the event', () => {
    const ev = eventAt('e1', '2026-04-15', ['1d-before']);
    expect(dueReminders([ev], localMs(2026, 4, 13, 9, 0), new Set())).toHaveLength(0); // too early
    expect(dueReminders([ev], localMs(2026, 4, 15, 10, 0), new Set())).toHaveLength(0); // event passed
  });
  it('does NOT re-fire a reminder already in the fired set (idempotent)', () => {
    const ev = eventAt('e1', '2026-04-15', ['at-time']);
    const now = localMs(2026, 4, 15, 9, 0);
    expect(dueReminders([ev], now, new Set())).toHaveLength(1);
    expect(dueReminders([ev], now, new Set(['e1-at-time']))).toHaveLength(0);
  });
  it('skips completed events and undated/invalid events (no Invalid Date fire)', () => {
    const now = localMs(2026, 4, 15, 9, 0);
    const completed = { ...eventAt('e1', '2026-04-15', ['at-time']), completedAt: '2026-04-14' };
    const undated = { id: 'e2', title: 'no date', reminders: ['at-time'] };
    expect(dueReminders([completed, undated], now, new Set())).toHaveLength(0);
  });
  it('ignores an unknown reminder key', () => {
    const ev = eventAt('e1', '2026-04-15', ['bogus-key']);
    expect(dueReminders([ev], localMs(2026, 4, 15, 9, 0), new Set())).toHaveLength(0);
  });
  it('is safe on empty / null input', () => {
    expect(dueReminders([], localMs(2026, 4, 15), new Set())).toEqual([]);
    expect(dueReminders(null, localMs(2026, 4, 15))).toEqual([]);
  });
});
