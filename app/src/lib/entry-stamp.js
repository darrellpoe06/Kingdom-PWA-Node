// =============================================================================
// entry-stamp — every entry carries its own date, so the page reads in order
// =============================================================================
// Darrell, 2026-09-22, over a screenshot of his own working document:
//
//   "Make sure each entry automatically adds a date and time stamp to the
//    document... like Christina is already doing at times... that why it reads
//    chronological... make sense?"
//
// It makes sense, and the evidence is in his own page. Christina types the date
// by hand — `9.22.26`, `8.24.26`, `8.25.26` — and those hand-typed lines are the
// only reason the document has an order at all. Where she typed one, the entries
// beneath it are anchored; where nobody typed one, a block of tasks floats with
// no way to tell when it was written. "Go to DMV for BG" sits between two dated
// groups belonging to neither.
//
// So the format here is HERS, exactly: M.D.YY, no leading zeros. Not ISO, not
// "September 22" — the thing already on the page. A stamp in a different shape
// would split one document into two chronologies and make the problem worse
// rather than better.
//
// TIME IS SEPARATE AND OPTIONAL, because her convention does not include it and
// a task list does not need it. Where a second entry lands on a day that already
// has one, the time is what keeps them apart, so it is available and appended
// with the same middot the app uses everywhere else.
//
// Pure: no DOM, no React, no clock of its own — the caller passes the date, so
// every case here is deterministic.
// =============================================================================

/**
 * Christina's format, exactly as she types it: M.D.YY with no leading zeros.
 * @param {Date} d
 * @param {{ withTime?: boolean }} opts
 */
export function formatEntryStamp(d = new Date(), opts = {}) {
  const date = d instanceof Date && !Number.isNaN(d.getTime()) ? d : new Date();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  const stamp = `${m}.${day}.${yy}`;
  if (!opts.withTime) return stamp;
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${stamp} · ${h}:${mins} ${ampm}`;
}

// A date line in HER shape: 9.22.26 or 12.7.25, on its own, at the start of a
// line. Deliberately NOT a general date matcher — this exists to recognise the
// convention already in the document, not to parse arbitrary dates.
const STAMP_RE = /(?:^|>|\n)\s*(\d{1,2})\.(\d{1,2})\.(\d{2})\b/g;

/**
 * Every stamp already in the document, in the order they appear.
 * @returns {{ month:number, day:number, year:number, raw:string }[]}
 */
export function findEntryStamps(html = '') {
  const out = [];
  const text = String(html || '');
  STAMP_RE.lastIndex = 0;
  let m = STAMP_RE.exec(text);
  while (m) {
    out.push({ month: Number(m[1]), day: Number(m[2]), year: Number(m[3]), raw: `${Number(m[1])}.${Number(m[2])}.${m[3]}` });
    m = STAMP_RE.exec(text);
  }
  return out;
}

/**
 * Does this document still need today's stamp?
 *
 * TRUE when the document carries no stamp for today's date. Deliberately NOT
 * "the LAST stamp is not today": his page is written newest-first at the top,
 * and a rule keyed to the last stamp would re-stamp every time he typed under
 * an older group. Asking whether today appears AT ALL means a day gets one
 * stamp, wherever he chose to put it.
 *
 * An empty document needs one — that is the first entry of the day.
 */
export function needsEntryStamp(html = '', now = new Date()) {
  const d = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const want = { month: d.getMonth() + 1, day: d.getDate(), year: d.getFullYear() % 100 };
  return !findEntryStamps(html).some(
    (s) => s.month === want.month && s.day === want.day && s.year === want.year,
  );
}

/**
 * The HTML a stamp is inserted as. Its own paragraph, so the entry beneath it
 * is visibly under it rather than running on from it — which is how her
 * hand-typed ones read.
 */
export function entryStampHtml(d = new Date(), opts = {}) {
  return `<p data-entry-stamp="1">${formatEntryStamp(d, opts)}</p>`;
}
