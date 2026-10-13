// =============================================================================
// csv — a tiny, dependency-free, RFC-4180-ish CSV encoder + parser
// =============================================================================
// Export/import is "low-hanging fruit" a data surface should have (Darrell
// 2026-07-14): back the Referral DB up to a spreadsheet, or bulk-add contacts
// from one. Pure + unit-tested (DR-0076) so a malformed cell can't silently
// corrupt a real record. Handles the three things a naive split(',') gets wrong:
// quoted commas, quoted newlines, and escaped ("") quotes.
// =============================================================================

const asStr = (v) => (v === null || v === undefined ? '' : String(v));

// Quote a single field only when it must be (comma, quote, CR or LF); double any
// inner quotes. Keeps clean values unquoted so the file stays human-readable.
function encodeField(v) {
  const s = asStr(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// toCsv(headers, rows): headers is an array of column keys; each row is an object
// keyed by those headers. Returns a CRLF-joined CSV string with a header line.
export function toCsv(headers, rows) {
  const head = (Array.isArray(headers) ? headers : []).map(encodeField).join(',');
  const body = (Array.isArray(rows) ? rows : []).map((row) =>
    headers.map((h) => encodeField(row ? row[h] : '')).join(',')).join('\r\n');
  return body ? `${head}\r\n${body}` : head;
}

// parseCsv(text): returns { headers, rows } where rows are objects keyed by the
// header line. A full-document state machine, so quoted commas/newlines survive.
// Blank trailing lines are ignored; a row with fewer cells fills '' for the rest.
export function parseCsv(text) {
  const src = asStr(text).replace(/^\uFEFF/, ''); // strip a BOM if present
  const records = [];
  let field = '';
  let record = [];
  let inQuotes = false;
  let i = 0;
  const pushField = () => { record.push(field); field = ''; };
  const pushRecord = () => { records.push(record); record = []; };
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }
    if (c === '"') { inQuotes = true; i += 1; continue; }
    if (c === ',') { pushField(); i += 1; continue; }
    if (c === '\r') { i += 1; continue; } // CRLF: swallow CR, act on LF
    if (c === '\n') { pushField(); pushRecord(); i += 1; continue; }
    field += c; i += 1;
  }
  // flush the final field/record if the file didn't end with a newline
  if (field !== '' || record.length > 0) { pushField(); pushRecord(); }
  // drop fully-empty records (e.g. a trailing blank line)
  const nonEmpty = records.filter((r) => !(r.length === 1 && r[0] === ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };
  const headers = nonEmpty[0].map((h) => asStr(h).trim());
  const rows = nonEmpty.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = idx < cells.length ? cells[idx] : ''; });
    return obj;
  });
  return { headers, rows };
}
