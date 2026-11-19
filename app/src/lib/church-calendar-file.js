// =============================================================================
// church-calendar-file — a set of church events as one plain file (DR-1586)
// =============================================================================
// Darrell 2026-11-18: "Calendar that is there made as an upload/events to add
// to". The office keeps its calendar in a spreadsheet or a document; the
// simplest honest file every spreadsheet writes is CSV, so that is the upload,
// and the same file is the download (DATA-AS-EMPOWERMENT commitment 3:
// exportable always, in a standard format).
//
// THE FILE: a header row, then one event per row.
//   date, name                     required
//   end_date, time, place, note    optional
// A date is YYYY-MM-DD or M/D/YYYY (what a US spreadsheet writes). Columns may
// come in any order; the header names them.
//
// Pure. A row that cannot be read is REJECTED WITH ITS LINE NUMBER AND THE
// REASON, never repaired by guessing and never silently skipped (DR-0076):
// the office sees exactly which rows did not come in and why.
// =============================================================================
import { makeEvent, isDateKey, dateKey } from './church-calendar.js';

export const CSV_COLUMNS = ['date', 'name', 'end_date', 'time', 'place', 'note'];
export const MAX_ROWS = 1000;
export const MAX_FILE_BYTES = 512 * 1024;
const ALIASES = {
  date: 'date',
  start: 'date',
  'start date': 'date',
  start_date: 'date',
  name: 'name',
  event: 'name',
  title: 'name',
  end_date: 'end_date',
  'end date': 'end_date',
  end: 'end_date',
  through: 'end_date',
  time: 'time',
  place: 'place',
  location: 'place',
  where: 'place',
  note: 'note',
  notes: 'note',
  detail: 'note',
  details: 'note',
  description: 'note',
};

/** Split CSV text into rows of cells: quoted cells, doubled quotes, commas and line breaks inside quotes, CRLF, a leading BOM. */
export function splitCsv(text) {
  const src = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;
  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    rows.push({ cells: row, line: rowLine });
    row = [];
  };
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else {
        if (ch === '\n') line += 1;
        cell += ch;
      }
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') endCell();
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      endRow();
      line += 1;
      rowLine = line;
    } else cell += ch;
  }
  if (cell !== '' || row.length) endRow();
  return { rows: rows.filter((r) => r.cells.some((c) => c.trim() !== '')), unclosedQuote: quoted };
}

/** A date cell as YYYY-MM-DD, or '' when it is not a real day in a form this reader knows. */
export function readDate(cell) {
  const s = String(cell || '').trim();
  if (isDateKey(s)) return s;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (us) {
    const key = dateKey(+us[3], +us[1], +us[2]);
    return isDateKey(key) ? key : '';
  }
  return '';
}

/**
 * Events from CSV text: { ok, events, rejected: [{ line, reason }], error }.
 * `error` is set (and nothing is read) when the file as a whole cannot be
 * trusted: no header naming date and name, too many rows, an unclosed quote.
 */
export function parseEventsCsv(text) {
  const fail = (error) => ({ ok: false, events: [], rejected: [], error });
  if (typeof text !== 'string' || !text.trim()) return fail('The file is empty.');
  if (text.length > MAX_FILE_BYTES) return fail('The file is larger than this reader takes (512 KB). Split it by year.');
  const { rows, unclosedQuote } = splitCsv(text);
  if (unclosedQuote) return fail('A quotation mark in the file is never closed, so the rows after it cannot be told apart.');
  if (!rows.length) return fail('The file is empty.');
  const header = rows[0].cells.map((c) => ALIASES[c.trim().toLowerCase()] || '');
  const col = (name) => header.indexOf(name);
  if (col('date') < 0 || col('name') < 0) return fail('The first row must name the columns, and at least "date" and "name".');
  const body = rows.slice(1);
  if (body.length > MAX_ROWS) return fail(`The file has ${body.length} events; this reader takes ${MAX_ROWS} at a time. Split it by year.`);
  const events = [];
  const rejected = [];
  const seen = new Set();
  for (const { cells, line } of body) {
    const get = (name) => (col(name) >= 0 ? String(cells[col(name)] ?? '').trim() : '');
    const name = get('name');
    const date = readDate(get('date'));
    const endRaw = get('end_date');
    const end = endRaw ? readDate(endRaw) : '';
    if (!name) rejected.push({ line, reason: 'No event name.' });
    else if (!date) rejected.push({ line, reason: `"${get('date')}" is not a date this reader knows (use 2026-11-21 or 11/21/2026).` });
    else if (endRaw && !end) rejected.push({ line, reason: `The end date "${endRaw}" is not a date this reader knows.` });
    else if (end && end < date) rejected.push({ line, reason: 'The end date is before the start date.' });
    else {
      const ev = makeEvent({ name, date, endDate: end, time: get('time'), place: get('place'), detail: get('note'), source: 'office' });
      const key = `${ev.date}|${ev.name.toLowerCase()}`;
      if (seen.has(key)) rejected.push({ line, reason: 'The same event on the same day is already in this file.' });
      else {
        seen.add(key);
        events.push(ev);
      }
    }
  }
  return { ok: true, events, rejected, error: '' };
}

/** The events of `incoming` that are not already on the calendar (same day, same name, any letter case). */
export function notAlreadyThere(incoming, existing) {
  const have = new Set((Array.isArray(existing) ? existing : []).map((e) => `${e.date}|${e.name.toLowerCase()}`));
  const fresh = [];
  const dupes = [];
  for (const e of Array.isArray(incoming) ? incoming : []) (have.has(`${e.date}|${e.name.toLowerCase()}`) ? dupes : fresh).push(e);
  return { fresh, dupes };
}

// A cell a spreadsheet would run as a formula is written as text (leading apostrophe), so a downloaded calendar cannot carry one.
const cellOut = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Events as CSV text in the upload's own columns, so a download can be edited and uploaded back. */
export function eventsToCsv(events) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const e of Array.isArray(events) ? events : []) lines.push([e.date, e.name, e.endDate || '', e.time, e.place, e.detail].map(cellOut).join(','));
  return `${lines.join('\r\n')}\r\n`;
}

// The header alone: a template with no event in it, so nothing made up can be uploaded by accident.
export const CSV_TEMPLATE = `${CSV_COLUMNS.join(',')}\r\n`;
