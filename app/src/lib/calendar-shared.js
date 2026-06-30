// =============================================================================
// calendar-shared — core helpers/config shared by the shell and the Calendar
// feature module (hybrid-modular cutover, Stage 3: peel trapped shared helpers
// into a core lib so a feature need not import the shell — module-boundary law,
// DR-0078 / module-boundary-guard invariant 3). Moved verbatim from the monolith
// (DR-0076 characterize-before-change).
//
//   • relativeWhen      — human "in 3d" / "2h ago" label for an event Date. Used
//     by BigPictureDashboard (still inline) and the Calendar module.
//   • REMINDER_OPTIONS  — the event-reminder offset choices. Used by the shell's
//     reminder lookup and by the Calendar event form.
//   • EVENT_CATEGORIES  — the event category list (Calendar event form). Kept
//     here alongside the other calendar config for one source of truth.
// =============================================================================

export function relativeWhen(eventDate) {
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < -60 * 24) return `${Math.abs(Math.round(diffMin / 1440))}d ago`;
  if (diffMin < 0) return `${Math.abs(Math.round(diffMin / 60))}h ago`;
  if (diffMin < 60) return `in ${diffMin}m`;
  if (diffMin < 1440) return `in ${Math.round(diffMin / 60)}h`;
  if (diffMin < 1440 * 30) return `in ${Math.round(diffMin / 1440)}d`;
  return `in ${Math.round(diffMin / 43200)}mo`;
}

export const REMINDER_OPTIONS = [
  { key: 'at-time',       label: 'At event time',  offsetMinutes: 0 },
  { key: '30m-before',    label: '30 minutes before', offsetMinutes: 30 },
  { key: '1h-before',     label: '1 hour before',  offsetMinutes: 60 },
  { key: '4h-before',     label: '4 hours before', offsetMinutes: 240 },
  { key: '1d-before',     label: '1 day before',   offsetMinutes: 1440 },
  { key: '3d-before',     label: '3 days before',  offsetMinutes: 4320 },
  { key: '1w-before',     label: '1 week before',  offsetMinutes: 10080 },
  { key: '2w-before',     label: '2 weeks before', offsetMinutes: 20160 },
  { key: '1mo-before',    label: '1 month before', offsetMinutes: 43200 },
];

export const EVENT_CATEGORIES = [
  'appointment', 'deadline', 'payment due', 'meeting', 'inspection',
  'family', 'medical', 'school', 'church', 'business', 'milestone',
  'birthday', 'anniversary', 'travel', 'tech-repair', 'tech-incident', 'other'
];
