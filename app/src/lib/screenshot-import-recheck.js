// =============================================================================
// screenshot-import-recheck — re-read every banking screenshot already added to
// the books with the corrected reader, and list the rows it wrote differently.
// READ ONLY: nothing in the books is changed here (Christina 2026-11-18: "Check
// whether any previously approved imports were affected. Do not silently
// change historical financial records").
//
// Why it is possible: an added screenshot keeps the text OCR read from it
// (doc.read.text, on the device it was uploaded on), and every row it wrote
// carries the screenshot's id (docId, source 'screenshot'). Re-reading that text
// with the same answers the person gave (its day, money in or out) shows what
// the corrected reader takes from the same screen; the difference is the list.
// A screenshot uploaded on another device has no text here: it is counted as
// not checkable on this device, never as fine.
// =============================================================================
import { extractDocument } from './books-intake-extract.js';

const norm = (s) =>
  String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
const same = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

function answersOf(doc) {
  const out = {};
  for (const q of doc.questions || []) if (q && q.status === 'answered') out[q.field] = q.answer;
  return out;
}

/**
 * @param {object[]} docs          stored intake documents (books-intake-store)
 * @param {object[]} transactions  the ledger (data.transactions)
 * @returns {{ checked: number, notCheckable: number, findings: object[] }}
 *   finding: { docId, docName, date, description, kind, written, correct?, runningBalance?, printed? }
 *   kind: 'amount-wrong' | 'amount-unclear'
 */
export function recheckScreenshotImports(docs = [], transactions = []) {
  let checked = 0;
  let notCheckable = 0;
  const findings = [];
  for (const doc of docs || []) {
    if (!doc || doc.status !== 'added') continue;
    const x0 = doc.extraction || {};
    if (x0.doc_type !== 'account-snapshot') continue;
    const written = (transactions || []).filter((t) => t && t.docId === doc.id && String(t.category || '') !== 'balance-checkpoint');
    if (!written.length) continue;
    const text = doc.read && typeof doc.read.text === 'string' ? doc.read.text : '';
    if (!text) {
      notCheckable += 1;
      continue;
    }
    checked += 1;
    const a = answersOf(doc);
    const signs = a.signs === 'out' || a.signs === 'in' ? a.signs : null;
    const asOf = a.as_of || (x0.dates && x0.dates.document) || null;
    const now = extractDocument(doc.read, doc, { forceType: 'account-snapshot', asOf, signs });
    const fresh = (now.preview_items || []).map((r) => ({ ...r, used: false }));
    for (const w of written) {
      const f = fresh.find((r) => !r.used && r.date === String(w.date || '').slice(0, 10) && norm(r.description) === norm(w.description));
      if (!f) continue; // the row's words were edited on review: not compared, never guessed
      f.used = true;
      const base = { docId: doc.id, docName: doc.name || null, date: f.date, description: f.description, written: Number(w.amount) };
      if (f.amountUnclear) findings.push({ ...base, kind: 'amount-unclear', printed: f.printed || [] });
      else if (!same(f.amount, w.amount)) findings.push({ ...base, kind: 'amount-wrong', correct: f.amount, runningBalance: f.runningBalance ?? null });
    }
  }
  return { checked, notCheckable, findings };
}
