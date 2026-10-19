// =============================================================================
// order-from-document — an Order of Service in Team Docs becomes the editable
// starting point for a service's order (DR-1088).
// =============================================================================
// Darrell, 2026-10-17: "Open Order of Service documents inside the
// space/tab/fields as an editable starting point... as options for users with
// those privileges."
//
// The church office emails the weekly order as a Word file or a PDF, and the
// team-doc import files it on Choir → Team Docs (DR-1085). The Order of Service
// tab already turns pasted text into segments with a preview (order-import.js),
// and only a steward can insert. This module reads a filed order's own words,
// so the steward starts from the document instead of re-typing or pasting it.
// The text lands in the same editable box the paste uses; nothing is written
// until the steward inserts it.
//
// Every failure says why in words (the viewer's reasons), and nothing is
// guessed: a file that cannot be read leaves the box empty.
// =============================================================================
import { documentKind, fetchDocument, readDocx, signStorageDocument } from './document-viewer.js';
import { readPdf } from './books-intake-read.js';
import { TEAM_DOCS_BUCKET } from './choir-sync.js';

/** The filed orders of service, newest first by the date they are for. */
export function orderDocuments(teamDocs = []) {
  return teamDocs
    .filter((d) => d && d.docType === 'order-of-service' && d.documentUrl)
    .sort((a, b) => String(b.docDate || '').localeCompare(String(a.docDate || '')));
}

/** Word blocks -> one line per paragraph or table row, the shape the parser reads. */
export function blocksToText(blocks = []) {
  return blocks
    .flatMap((b) => String(b.text || '').split('\n'))
    .map((line) => line.replace(/\s*\|\s*/g, ' — ').replace(/\t+/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Read a filed order's text. Returns { ok: true, text } or { ok: false, reason }.
 * Reasons are the viewer's: not-on-server, no-access, timeout, network, unknown,
 * plus 'unreadable' for a file with no words in it the app can read.
 */
export async function readOrderText(doc, deps = {}) {
  const {
    sign = (path) => signStorageDocument(TEAM_DOCS_BUCKET, path),
    fetchBytes = fetchDocument,
    docx = readDocx,
    pdf = readPdf,
  } = deps;
  const path = doc && doc.documentUrl;
  if (!path) return { ok: false, reason: 'no-file' };
  // A filed path is signed; an inline upload or a link comes back as itself.
  const signed = await sign(path);
  if (!signed || !signed.ok) return { ok: false, reason: (signed && signed.reason) || 'unknown' };
  const got = await fetchBytes(signed.url);
  if (!got.ok) return { ok: false, reason: got.reason };
  const kind = documentKind({ contentType: got.contentType, name: doc.fileName || path, url: path });
  let text = '';
  try {
    if (kind === 'docx') text = blocksToText(await docx(await got.blob.arrayBuffer()));
    else if (kind === 'pdf') text = (await pdf(got.blob)).text || '';
    else if (kind === 'text') text = await got.blob.text();
  } catch { text = ''; }
  text = String(text).trim();
  return text ? { ok: true, text } : { ok: false, reason: 'unreadable', kind };
}

/** What the steward reads when a filed order cannot become a starting point. */
export function orderReadFailure(reason, kind) {
  switch (reason) {
    case 'not-on-server': return 'This order is listed, but its file is not on the church server, so there is nothing to read yet.';
    case 'no-access': return 'The church server refused this account for that file.';
    case 'timeout': return 'The church server did not answer in time. Try again.';
    case 'network': return 'The connection dropped before the file arrived. Try again.';
    case 'no-file': return 'No file is attached to that entry.';
    case 'unreadable':
      return kind === 'docx' || kind === 'pdf' || kind === 'text'
        ? 'The file opened, but no words could be read from it. Open it from Team Docs and paste the order instead.'
        : 'This kind of file has no words the app can read. Open it from Team Docs and paste the order instead.';
    default: return 'That file could not be read. Nothing was changed.';
  }
}
