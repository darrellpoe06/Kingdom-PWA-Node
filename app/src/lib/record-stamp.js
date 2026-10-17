// =============================================================================
// record-stamp — when it happened, when it was recorded, and which one you may
// correct (DR-1063)
// =============================================================================
// Darrell, 2026-10-16, with Choir → Resources on screen showing "TLC Song List"
// and nothing else at all:
//
//   "We need to have dates and time stamps... so we can sort out the dates and
//    events over time historical accuracy... make sense?... even system logs...
//    to make sure it can be corrected... make sense?"
//
// HE HAS ASKED FOR THIS BEFORE, and that is the finding. On 2026-09-22, over a
// screenshot of his own working document, he said: *"Make sure each entry
// automatically adds a date and time stamp to the document... that why it reads
// chronological."* That produced `entry-stamp.js` — correct, tested, and scoped
// to ONE surface. The ask was never only about that document. So he is asking a
// second time, which is the most expensive way for this repository to learn
// something, and the reason this one is a shared primitive with a gate on it.
//
// WHAT WAS MEASURED BEFORE ANY OF THIS WAS WRITTEN:
//
//   1. THE DATA WAS ALREADY THERE. choir_resources, choir_team_documents,
//      choir_schedule, messages, absences and sermons all carry created_at, and
//      every toXShape already maps it to `createdAt`. The surfaces simply threw
//      it away — Resources and Team Docs render no stamp at all.
//   2. EIGHTEEN HAND-ROLLED FORMATTERS. `fmtDate` / `fmtWhen` are defined
//      separately in 18 components, each slightly different.
//   3. TEN OF THEM DROP THE YEAR. ChoirSongWorkshop renders "Added by mrspoe06
//      · Sep 6" — which Sep 6? A list that cannot distinguish last year from
//      this one cannot be sorted "over time" at all, and that is precisely the
//      historical accuracy he is asking for. A stamp without a year is not a
//      smaller stamp; on a record older than a year it is a WRONG one.
//
// THE DISTINCTION THIS FILE EXISTS TO HOLD — and it is the heart of his second
// sentence, *"even system logs... to make sure it can be corrected":*
//
//   WHEN IT HAPPENED  (the service date, the document's date, the date on the
//                      paper) is a CLAIM A PERSON MADE, and a person can be
//                      wrong. It is correctable. That is the correction.
//   WHEN IT WAS RECORDED (created_at) is the WITNESS — the system's own log of
//                      when the row arrived. It is NEVER correctable. Editing
//                      it would destroy the only independent account of what
//                      happened when, which is the thing that makes a
//                      correction trustworthy in the first place.
//
// So a corrected record shows BOTH, and says it was corrected. Nothing is
// overwritten and nothing is hidden: "dated Oct 12 · corrected Oct 16 · logged
// Oct 14". That is how a record survives being wrong — the way a ledger is kept
// rather than the way a document is edited.
//
// Pure: no DOM, no React, and no clock of its own except where a caller asks
// for "relative to now" and passes the now it wants. Every case is
// deterministic.

/** Parse anything we store as a moment: an ISO instant, or a bare YYYY-MM-DD. */
export function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return null;
  // A bare date is a CALENDAR day, not midnight UTC. Parsing "2026-10-12" with
  // the Date constructor gives UTC midnight, which renders as Oct 11 for anyone
  // west of Greenwich — a stamp that is off by a day on a church in Texas.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Pure. Is this value a bare calendar day rather than an instant? */
export const isDayOnly = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

/**
 * THE stamp. Always carries the year, because a stamp that cannot be placed in
 * a year cannot be sorted over time — which is the whole request.
 *
 * @param {string|Date} value
 * @param {{withTime?: boolean, weekday?: boolean}} opts
 *   withTime defaults to TRUE for an instant and FALSE for a bare calendar day,
 *   because a day has no time to show and inventing 12:00 AM is a small lie.
 */
export function stamp(value, opts = {}) {
  const d = toDate(value);
  if (!d) return '';
  const withTime = opts.withTime === undefined ? !isDayOnly(value) : !!opts.withTime;
  const date = d.toLocaleDateString(undefined, {
    ...(opts.weekday ? { weekday: 'short' } : {}),
    month: 'short',
    day: 'numeric',
    year: 'numeric',          // NEVER optional. See the header.
  });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

/**
 * The full instant, for a `title=` so the exact time is one press away without
 * crowding the row. ISO, because an exact stamp that is ambiguous is not exact.
 */
export function exactStamp(value) {
  const d = toDate(value);
  return d ? d.toISOString() : '';
}

/** Pure. "3 days ago" / "in 2 days" — companionable, never INSTEAD of the stamp. */
export function relativeStamp(value, now = new Date()) {
  const d = toDate(value);
  const n = toDate(now);
  if (!d || !n) return '';
  const days = Math.round((d.getTime() - n.getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === -1) return 'yesterday';
  if (days === 1) return 'tomorrow';
  if (days < 0) return days > -30 ? `${-days} days ago` : '';
  return days < 30 ? `in ${days} days` : '';
}

// ---------------------------------------------------------------------------
// The two kinds of "when", and the rule that only one of them may be corrected
// ---------------------------------------------------------------------------

/** Field names, in precedence order, that mean "when the thing itself happened". */
const HAPPENED_KEYS = ['happenedOn', 'docDate', 'serviceDate', 'dateOf', 'eventDate', 'occurredOn', 'datedOn'];
/** Field names that mean "when the system wrote this down". NEVER edited. */
const RECORDED_KEYS = ['createdAt', 'created_at', 'recordedAt', 'loggedAt'];

const pick = (row, keys) => {
  if (!row) return null;
  for (const k of keys) if (row[k]) return row[k];
  return null;
};

/** The person's claim about when it happened. Correctable. May be absent. */
export const happenedOn = (row) => pick(row, HAPPENED_KEYS);
/** The system's own witness. Not correctable, by design. */
export const recordedAt = (row) => pick(row, RECORDED_KEYS);
/** Whether the event date was corrected after the fact, and when. */
export const correctedAt = (row) => (row && (row.dateCorrectedAt || row.date_corrected_at)) || null;

/**
 * Pure. The whole "when" of a record, as the parts a surface renders.
 *
 * Returns BOTH, always, and never collapses them — a record whose event date
 * was corrected must still show what the log says, or the correction cannot be
 * checked by anyone.
 *
 * @returns {{happened: string, recorded: string, corrected: string,
 *            line: string, exact: string, sortKey: number}}
 */
export function whenOf(row, opts = {}) {
  const h = happenedOn(row);
  const r = recordedAt(row);
  const c = correctedAt(row);
  const parts = [];
  if (h) parts.push(`${opts.happenedLabel || 'dated'} ${stamp(h, { withTime: false })}`);
  if (c) parts.push(`corrected ${stamp(c, { withTime: false })}`);
  // The log is shown SECOND and always, including when it agrees with the event
  // date — a stamp that appears only when something is wrong teaches people to
  // read its presence as an accusation.
  if (r) parts.push(`${opts.recordedLabel || 'logged'} ${stamp(r)}`);
  return {
    happened: h ? stamp(h, { withTime: false }) : '',
    recorded: r ? stamp(r) : '',
    corrected: c ? stamp(c, { withTime: false }) : '',
    line: parts.join(' · '),
    exact: exactStamp(r || h),
    sortKey: sortKeyOf(row),
  };
}

/**
 * Pure. One number for ordering: the event date when a record has one, else the
 * log. A record with NO date at all sorts last rather than first, because a
 * missing date read as 1970 would put the unknown at the head of the history.
 */
export function sortKeyOf(row) {
  const d = toDate(happenedOn(row)) || toDate(recordedAt(row));
  return d ? d.getTime() : Number.NEGATIVE_INFINITY;
}

/**
 * Pure, STABLE, newest first by default. The tiebreak is the log, then the id,
 * so two records on the same calendar day never swap places between renders.
 */
export function sortByWhen(rows = [], { oldestFirst = false } = {}) {
  const dir = oldestFirst ? 1 : -1;
  return [...rows].sort((a, b) => {
    const d = sortKeyOf(a) - sortKeyOf(b);
    if (d) return dir * d;
    const ra = toDate(recordedAt(a)); const rb = toDate(recordedAt(b));
    const rd = (ra ? ra.getTime() : 0) - (rb ? rb.getTime() : 0);
    if (rd) return dir * rd;
    return String(a && a.id || '').localeCompare(String(b && b.id || ''));
  });
}

/**
 * Pure. Validate a correction to an event date BEFORE it is written.
 *
 * The one rule that is not a matter of taste: **a thing cannot have happened
 * after it was written down.** A date later than the log is either a typo or a
 * misunderstanding of what this field means, and accepting it silently would
 * put the history out of order in a way nothing downstream could detect.
 *
 * @returns {{ok: true, value: string} | {ok: false, reason: string, message: string}}
 */
export function validateCorrection(row, nextDate) {
  const s = typeof nextDate === 'string' ? nextDate.trim() : '';
  if (!s) return { ok: false, reason: 'empty', message: 'Pick the date this actually happened.' };
  const d = toDate(s);
  if (!d) return { ok: false, reason: 'unreadable', message: 'That is not a date this can read. Use the date picker.' };
  const rec = toDate(recordedAt(row));
  if (rec && d.getTime() > rec.getTime() + 86400000) {
    return {
      ok: false,
      reason: 'after-the-log',
      message: `This was written down on ${stamp(recordedAt(row), { withTime: false })}, so it cannot have happened after that. Check the date.`,
    };
  }
  if (d.getFullYear() < 1900) {
    return { ok: false, reason: 'implausible', message: 'That year looks like a typo. Check it.' };
  }
  return { ok: true, value: isDayOnly(s) ? s : d.toISOString().slice(0, 10) };
}

/** Pure. The sentence a surface shows beside a correction control. */
export const CORRECTION_HELP =
  'You can correct the date this happened. The log of when it was written down never changes — that is what makes the correction checkable.';
