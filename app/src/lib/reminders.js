// =============================================================================
// reminders — the pure "which reminders are due right now" engine
// =============================================================================
// Extracted from the monolith shell (freeze: bug-fixes only) so the schedule
// logic is TESTABLE and reusable (Darrell 2026-07-18: "extract the reminder
// engine from the monolith shell"). The shell keeps only the thin wiring — a
// setInterval that calls this and fires a browser Notification per result, plus
// the fired-set it passes in. This is the stepping-stone to real BACKGROUND
// reminders: a service worker can call dueReminders() the same way, since it is
// pure (no React, no Notification, no window).
//
// The Calendar review (2026-07-18) found reminders only fire while the tab is
// open (a component setInterval, not a service-worker push). This extraction does
// NOT change that yet — it makes the change POSSIBLE by isolating the pure logic
// the background worker would run. Undated/invalid events NEVER fire (honest —
// no Invalid Date math), matching the blank-date-vanish fix (REV-0108).
// =============================================================================

import { REMINDER_OPTIONS } from './calendar-shared.js';
import { eventDateTime } from './lifecycle-and-flow.js';

// dueReminders — given the events, the current time (ms), and the set of
// firedKeys already delivered, return the reminders whose window is open now
// (reminderTime <= now <= eventTime) and that have not fired. Pure + deterministic
// (now is injected, never read from the clock here) so it is unit-testable. Each
// result carries the firedKey (so the caller records it) and the notification
// title/body/tag. A completed event, an undated/invalid event, or an unknown
// reminder key is skipped — never a spurious or crashing fire.
export function dueReminders(events, nowMs, alreadyFired = new Set()) {
  const out = [];
  for (const event of events || []) {
    if (!event || event.completedAt) continue;
    const eDate = eventDateTime(event);
    const eMs = eDate instanceof Date ? eDate.getTime() : NaN;
    if (!Number.isFinite(eMs)) continue; // undated / invalid date -> never fires
    for (const reminderKey of (event.reminders || [])) {
      const opt = REMINDER_OPTIONS.find((o) => o.key === reminderKey);
      if (!opt) continue;
      const reminderMs = eMs - opt.offsetMinutes * 60000;
      const firedKey = `${event.id}-${reminderKey}`;
      if (nowMs >= reminderMs && nowMs <= eMs && !alreadyFired.has(firedKey)) {
        out.push({
          firedKey,
          tag: firedKey,
          title: `PoeTech reminder: ${event.title}`,
          body: opt.label === 'At event time'
            ? `Happening now · ${event.description || event.category}`
            : `${opt.label} · ${event.description || event.category}`,
        });
      }
    }
  }
  return out;
}
