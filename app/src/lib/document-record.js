// =============================================================================
// document-record — every document carries its own record: what it is, where
// it came from, when, and where it lives (DR-1085)
// =============================================================================
// Darrell, 2026-10-17, on Choir → Team Docs, over "06 JUNE 2026 CALENDAR is
// listed, but the file itself is not on the church server": "We also need the
// apps documents or documentation to be presented in the system with all
// relevant information and details that matter. The data in the location and a
// screenshot or visual of where it came from and a timestamps for obvious
// reasons... Like add them as an archive in the current system we built based
// on those documents."
//
// WHAT THIS IS. A pure builder. Each shelf hands it the row it already holds,
// and it returns the record the viewer shows beside the document:
//
//   WHAT IT IS        — title, type, file name, size
//   WHERE IT CAME FROM — the source the row records (an email, an upload, a
//                        paper kept somewhere, typed in by hand), and for an
//                        email the envelope the import read
//   WHEN              — the date ON the document, when it was filed here,
//                        when it was last changed
//   WHERE IT LIVES    — the church server, the shelf, the stored path
//
// NOTHING PAINTED (DR-0061 / DR-0076). Every row comes from a column the shelf
// actually loaded. A field the row does not carry is left out, never filled
// with a guess, and an absent date is "not recorded", never a zero. The one
// derived fact — that a file filed before 2026-08-19 has its original on the
// old hosted server — is DR-0317's measured repoint date, stated as such.
//
// The email sender is not a column; it is the import's own constant:
// scripts/sermon-import/import-team.mjs reads ONLY bg@thechurchofthelivinggod.com
// and is the one writer of document_source = 'email' on choir_team_documents.
// The card says that is where the fact comes from.
//
// WHO SEES WHAT (Darrell, 2026-10-17: "Only certain information should be
// available to different types of users... Administrative procedures are for
// certain personnel"). Two layers, and this module is only the second:
//   1. Whether a person can open the document AT ALL is the database's call —
//      each shelf's row-level security (creator-only legal papers, the church
//      office's roll, the household's members). Nothing here widens that.
//   2. Of what they can open, the ADMINISTRATIVE details — where the bytes are
//      stored, and the email's Message-ID — are shown only to `admin` viewers:
//      the office, or the person who filed it. Everyone else sees what it is,
//      where it came from, and when. The default is NOT admin: a shelf that
//      forgets to say gets the narrower record, never the wider one.
//
// PURE: no browser APIs except the optional fingerprint, which takes a Blob
// and uses SubtleCrypto when present.
// =============================================================================

// DR-0317: the day the app moved to the church server. Rows moved; files in
// private buckets did not, so a file filed before this day has its original on
// the old hosted project until the copy job brings it across.
export const REPOINT_DAY = '2026-08-19';

// The one writer of emailed team documents, and the address it reads.
export const TEAM_IMPORT_SENDER = 'bg@thechurchofthelivinggod.com';
export const TEAM_IMPORT_SCRIPT = 'scripts/sermon-import/import-team.mjs';

const TEAM_TYPE_LABEL = {
  'order-of-service': 'Order of Service',
  announcements: 'Announcements',
  calendar: 'Calendar',
  other: 'Other',
};

const day = (v) => {
  if (!v) return '';
  const s = String(v);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
};

// "2026-06-14 21:01 UTC" from an ISO timestamp; '' when absent or unreadable.
export function stamp(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function sizeLabel(n) {
  const b = Number(n);
  if (n == null || n === '' || !Number.isFinite(b) || b <= 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const fileNameOf = (path) => {
  const last = String(path || '').split(/[?#]/)[0].split('/').pop() || '';
  try { return decodeURIComponent(last); } catch { return last; }
};

// Rows are [label, value]; empty values are dropped so nothing reads as blank.
const rows = (pairs) => pairs.filter(([, v]) => v !== '' && v != null && v !== false);

/** True when the row was filed before the repoint, so its original sits on the old server. */
export function filedBeforeRepoint(createdAt) {
  const d = day(createdAt);
  return !!d && d < REPOINT_DAY;
}

// Labels only the office (or the filer) sees. Everything else is for anyone
// the database already lets open the document.
export const ADMIN_ONLY = ['Stored at', 'Message-ID'];

function shape({ shelf, what, from, card = null, when, where, createdAt }, { admin = false } = {}) {
  const keep = (list) => rows(list).filter(([k]) => admin || !ADMIN_ONLY.includes(k));
  const shownCard = card ? { ...card, messageId: admin ? card.messageId : '' } : null;
  return {
    shelf,
    admin: admin === true,
    sections: [
      { id: 'what', heading: 'What it is', rows: keep(what) },
      { id: 'from', heading: 'Where it came from', rows: keep(from), card: shownCard },
      { id: 'when', heading: 'When', rows: keep(when) },
      { id: 'where', heading: 'Where it lives', rows: keep(where) },
    ].filter((s) => s.rows.length || s.card),
    beforeRepoint: filedBeforeRepoint(createdAt),
  };
}

const sourceLabel = (src) => ({
  email: 'An email',
  upload: 'Uploaded in the app',
  manual: 'Typed in by hand in the app',
}[src] || '');

/** Choir → Team Docs (choir_team_documents, 0022). */
export function teamDocRecord(d = {}, opts = {}) {
  const path = d.documentUrl || '';
  const isData = /^data:/i.test(path);
  const isLink = /^https?:\/\//i.test(path);
  const card = d.documentSource === 'email' ? {
    kind: 'email',
    from: TEAM_IMPORT_SENDER,
    subject: d.title || '',
    messageId: d.emailId || '',
    readBy: TEAM_IMPORT_SCRIPT,
  } : null;
  return shape({
    shelf: 'Choir → Team Docs',
    createdAt: d.createdAt,
    what: [
      ['Title', d.title || ''],
      ['Type', TEAM_TYPE_LABEL[d.docType] || d.docType || ''],
      ['File', d.fileName || (isData || isLink ? '' : fileNameOf(path))],
    ],
    from: [
      ['Source', sourceLabel(d.documentSource)],
      ['Message-ID', d.documentSource === 'email' ? (d.emailId || '') : ''],
    ],
    card,
    when: [
      ['Dated', day(d.docDate) || 'not recorded'],
      ['Filed here', stamp(d.createdAt) || 'not recorded'],
      ['Last changed', stamp(d.updatedAt)],
    ],
    where: [
      ['Shelf', 'Choir → Team Docs'],
      ['Server', isLink ? 'Another website' : isData ? 'Inside the record itself (uploaded before files had a vault)' : 'The church server, team documents'],
      ['Stored at', isData ? '' : path],
    ],
  }, opts);
}

/** Books → Legal (legal_documents, 0180). */
export function legalDocRecord(d = {}, opts = {}) {
  const pointer = !d.storagePath;
  return shape({
    shelf: 'Books → Legal',
    createdAt: d.createdAt,
    what: [
      ['Title', d.label || ''],
      ['Type', d.docType || ''],
      ['Privileged', d.privileged === true ? 'Yes' : d.privileged === false ? 'No' : ''],
      ['File', d.fileName || ''],
      ['Size', sizeLabel(d.fileSize)],
    ],
    from: [
      ['Source', pointer ? 'A paper kept outside the app' : 'Uploaded in the app'],
      ['Shared by', d.fromHousehold ? (d.sharedBy || 'A member of your household') : ''],
    ],
    when: [
      ['Dated', day(d.dateOf) || 'not recorded'],
      ['Filed here', stamp(d.createdAt) || 'not recorded'],
      ['Last changed', stamp(d.updatedAt)],
    ],
    where: [
      ['Shelf', 'Books → Legal'],
      ['Server', pointer ? 'No file in the app' : 'The church server, the private legal vault'],
      ['Stored at', d.storagePath || ''],
      ['Paper kept at', pointer ? (d.whereFiled || '') : ''],
    ],
  }, opts);
}

/** Church → My Record shelf (church_documents, 0209). */
export function memberDocRecord(d = {}, opts = {}) {
  return shape({
    shelf: 'Church → My Record',
    createdAt: d.createdAt,
    what: [
      ['Title', d.title || ''],
      ['Type', d.kindLabel || d.kind || ''],
      ['File', fileNameOf(d.storagePath)],
    ],
    from: [
      ['Source', d.storagePath ? 'Uploaded in the app' : 'A paper kept outside the app'],
      ['Shared with the office', d.sharedWithOffice ? 'Yes' : 'No'],
    ],
    when: [
      ['Filed here', stamp(d.createdAt) || 'not recorded'],
      ['Last changed', stamp(d.updatedAt)],
    ],
    where: [
      ['Shelf', 'Church → My Record'],
      ['Server', d.storagePath ? 'The church server, church documents' : 'No file in the app'],
      ['Stored at', d.storagePath || ''],
      ['Paper kept at', d.storagePath ? '' : (d.paperLocation || '')],
    ],
  }, opts);
}

/** The household shelf (family documents). */
export function householdDocRecord(d = {}, opts = {}) {
  return shape({
    shelf: 'Household',
    createdAt: d.createdAt,
    what: [
      ['Title', d.label || ''],
      ['Type', d.categoryLabel || d.category || ''],
      ['File', d.fileName || ''],
      ['Size', sizeLabel(d.fileSize)],
    ],
    from: [
      ['Source', d.storagePath ? 'Uploaded in the app' : 'A paper kept outside the app'],
    ],
    when: [
      ['Dated', day(d.dateOf) || 'not recorded'],
      ['Expires', day(d.expiresOn)],
      ['Filed here', stamp(d.createdAt) || 'not recorded'],
    ],
    where: [
      ['Shelf', 'Household'],
      ['Server', d.storagePath ? 'The church server, family documents' : 'No file in the app'],
      ['Stored at', d.storagePath || ''],
      ['Paper kept at', d.storagePath ? '' : (d.whereFiled || '')],
    ],
  }, opts);
}

/** The Word → a sermon's document (choir_sermon_documents). */
export function sermonDocRecord(d = {}, opts = {}) {
  const path = d.documentUrl || '';
  const isLink = /^https?:\/\//i.test(path);
  return shape({
    shelf: 'The Word',
    createdAt: d.createdAt,
    what: [
      ['Title', d.title || ''],
      ['File', isLink ? '' : fileNameOf(path)],
    ],
    from: [['Source', sourceLabel(d.documentSource)]],
    when: [
      ['Preached', day(d.serviceDate)],
      ['Filed here', stamp(d.createdAt)],
    ],
    where: [
      ['Shelf', 'The Word'],
      ['Server', isLink ? 'Another website' : 'The church server, sermon documents'],
      ['Stored at', isLink ? '' : path],
    ],
  }, opts);
}

/**
 * The file's present state, said in words, from the viewer's own result.
 * `phase`/`reason` are DocumentViewer's; `fingerprint` is computed from the bytes.
 */
export function presenceLine({ phase, reason }, record) {
  if (phase === 'loading') return 'Checking the church server…';
  if (phase === 'shown') return 'On the church server — opened just now.';
  if (reason === 'not-on-server') {
    return record && record.beforeRepoint
      ? `Listed, but the file is not on the church server yet. It was filed before the move on ${REPOINT_DAY}, so the original is on the old hosted server and comes across when the file copy runs.`
      : 'Listed, but the file is not on the church server.';
  }
  if (reason === 'no-access') return 'The church server refused this account.';
  if (reason === 'timeout') return 'The church server did not answer in time.';
  if (reason === 'network') return 'The connection dropped before the server answered.';
  return '';
}

/** SHA-256 of the file's bytes, as hex; '' where the browser cannot compute it. */
export async function fingerprintOf(blob, subtle = (globalThis.crypto && globalThis.crypto.subtle) || null) {
  if (!blob || !subtle || typeof blob.arrayBuffer !== 'function') return '';
  try {
    const buf = await subtle.digest('SHA-256', await blob.arrayBuffer());
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}

/** The record as plain text, for "Save this record" — the archive copy. */
export function recordText(record, { title = 'Document', presence = '', fingerprint = '', at = new Date().toISOString() } = {}) {
  if (!record) return '';
  const lines = [`DOCUMENT RECORD — ${title}`, `Recorded ${stamp(at) || at} from PoeTech`, ''];
  for (const s of record.sections) {
    lines.push(s.heading.toUpperCase());
    for (const [k, v] of s.rows) lines.push(`  ${k}: ${v}`);
    if (s.card && s.card.kind === 'email') {
      lines.push(`  From: ${s.card.from}`);
      if (s.card.subject) lines.push(`  Subject: ${s.card.subject}`);
      if (s.card.messageId) lines.push(`  Message-ID: ${s.card.messageId}`);
      lines.push(`  (sender as read by ${s.card.readBy})`);
    }
    lines.push('');
  }
  if (presence) lines.push('FILE NOW', `  ${presence}`, '');
  if (fingerprint) lines.push('FINGERPRINT (SHA-256 of the file as opened)', `  ${fingerprint}`, '');
  return lines.join('\n');
}
