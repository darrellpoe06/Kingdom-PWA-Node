// =============================================================================
// books-intake-pipeline — ONE pipeline, identical for every file
// (DR-0709, the one Books upload)
// =============================================================================
// Darrell 2026-09-30: "Give one upload process that works for all
// possibilities? Especially since this is finance money and timelines... all
// can be added and will make it need clarification if needed then we adjust our
// systems to get it."
//
//   1. STORE   the original first, with its received time (never rejected)
//   2. READ    text / table / PDF / OCR          (books-intake-read)
//   3. SHAPE   classify + extract, one shape     (books-intake-extract)
//   4. MATCH   accounts, entities, vendors...    (books-intake-match)
//   5. CHECK   the math, and the timeline        (books-intake-reconcile)
//   6. ASK     stored questions, never blocking  (books-intake-questions)
//   7. WRITE   on confirm, through the EXISTING proven paths only
//   8. LEARN   answers remembered by layout; unknown kinds to "teach the system"
//
// Status a person sees, per document:
//   received -> read -> needs-answer -> ready -> added   (and 'stored' for a kind
//   we keep and propose but do not yet post anywhere)
//
// The write step is a PLAN plus injected sinks, so demo mode and tests can
// prove that nothing is written: in demo the sinks are never called.
// =============================================================================
import { readAnyFile } from './books-intake-read.js';
import { extractDocument } from './books-intake-extract.js';
import { matchDocument, newRowsFor, proposedAccount, ledgerRows } from './books-intake-match.js';
import { reconcileExtraction } from './books-intake-reconcile.js';
import { questionsFor, answerQuestion, blockingOpen, lessonFrom, applyLesson } from './books-intake-questions.js';
import { receiptShape } from './receipts.js';
import { planAccountImport } from './bulk-statement-import.js';

export const STATUS_LABEL = Object.freeze({
  received: 'Received', read: 'Read', 'needs-answer': 'Needs your answer', ready: 'Ready to confirm', added: 'Added', stored: 'Stored',
});

const newId = () => `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Step 1. The original, kept before anything else happens. */
export async function receive(file, { store, now = () => new Date().toISOString(), cloudKeep = null, demo = false } = {}) {
  const doc = {
    id: newId(), receivedAt: now(), name: (file && file.name) || 'document', size: (file && file.size) || 0,
    type: (file && file.type) || '', blob: file, status: 'received', questions: [], links: [], cloud: null,
  };
  await store.putDoc(doc);
  if (cloudKeep && !demo) {
    const cloud = await cloudKeep(file, doc).catch(() => ({ ok: false, reason: 'error' }));
    doc.cloud = cloud;
    await store.putDoc(doc);
  }
  return doc;
}

function answersOf(doc) {
  const out = {};
  for (const q of doc.questions || []) if (q.status === 'answered') out[q.field] = q.answer;
  return out;
}

/**
 * Steps 2-6 for a stored document. Re-runnable: answering a question calls it
 * again with the answers applied. Never throws; a failure is a question.
 */
export async function processDoc(doc, ctx) {
  const { store, known = {}, hint = null, reader = readAnyFile, readerDeps = {}, today } = ctx;
  let read = doc.read || null;
  let readError = null;
  if (!read) {
    try { read = await reader(doc.blob, readerDeps); } catch (e) { readError = (e && e.message) || 'unreadable'; }
  }
  if (readError) {
    const questions = mergeQuestions(doc.questions, questionsFor(doc, { readError }));
    const next = { ...doc, status: 'needs-answer', read: null, readError, questions };
    await store.putDoc(next);
    return next;
  }

  // Learned layout: remembered answers fill in before any question is asked.
  const firstPass = extractDocument(read, doc, { hint });
  const lesson = await store.getLayout(firstPass.layout_key);
  const remembered = applyLesson(lesson && lesson.answers, { extraction: firstPass, accounts: known.accounts });
  const given = { ...remembered, ...answersOf(doc) };

  const x = given.doc_type && given.doc_type !== 'unknown'
    ? extractDocument(read, doc, { hint, forceType: given.doc_type })
    : firstPass;
  if (given.doc_type) x.uncertain = x.uncertain.filter((u) => u !== 'doc_type');
  if (given.tax_year) x.tax_year = Number(given.tax_year);
  x.rowReconciliation = read.rowReconciliation || null;

  const matched = matchDocument(x, known, { text: read.text });
  if (given.account && String(given.account).startsWith('account:')) {
    matched.account = { accountId: String(given.account).slice(8), certain: true, candidates: [] };
    matched.proposedAccount = null;
  }
  if (given.entity && String(given.entity).startsWith('entity:')) matched.entity = { entityId: String(given.entity).slice(7), certain: true };
  const recon = reconcileExtraction(x);

  let questions = questionsFor(doc, { extraction: x, matched, recon, hint, accounts: known.accounts, entities: known.entities });
  // Remembered answers are recorded as answered (so the person sees WHY no
  // question was asked), never re-asked.
  questions = questions.map((q) => (remembered[q.field] != null ? { ...q, status: 'answered', answer: remembered[q.field], answeredAt: 'remembered' } : q));
  questions = mergeQuestions(doc.questions, questions);

  const unknownKind = x.doc_type === 'unknown' && given.doc_type === 'unknown';
  if (unknownKind && ctx.teach !== false && !doc.taught) {
    await store.bumpTeach(x.layout_key, { name: doc.name, at: doc.receivedAt, docId: doc.id });
  }

  const next = {
    ...doc, read, readError: null, extraction: x, matched, recon, questions,
    remembered: Object.keys(remembered).length ? remembered : null, taught: doc.taught || unknownKind,
  };
  next.plan = planWrite(next, { known, today });
  next.status = statusOf(next);
  await store.putDoc(next);
  return next;
}

// Keep a person's earlier answers/skips when a document is re-processed.
function mergeQuestions(prev = [], fresh = []) {
  const byId = new Map((prev || []).map((q) => [q.id, q]));
  return fresh.map((q) => {
    const old = byId.get(q.id);
    return old && old.status !== 'open' && q.status === 'open' ? { ...q, status: old.status, answer: old.answer, answeredAt: old.answeredAt } : q;
  });
}

/** What may be written, and through which proven path. Pure. */
export function planWrite(doc, { known = {} } = {}) {
  const x = doc.extraction;
  if (!x) return { kind: 'none', reason: 'not read yet' };
  if (doc.recon && doc.recon.status === 'mismatch') return { kind: 'none', reason: 'the numbers do not add up; never written as fact' };
  const blocking = blockingOpen(doc.questions);
  if (blocking.length) return { kind: 'none', reason: `${blocking.length} question${blocking.length === 1 ? '' : 's'} still open` };
  const m = doc.matched || {};
  const accountId = m.account && m.account.accountId;
  const createAccount = !accountId && (doc.questions || []).some((q) => q.field === 'account' && q.answer === 'create')
    ? proposedAccount(x) : null;

  switch (x.doc_type) {
    case 'transactions-export':
    case 'card-statement':
    case 'loan-statement': {
      const rows = accountId ? newRowsFor(x, accountId, known.transactions) : { txns: ledgerRows(x), duplicates: 0 };
      return {
        kind: 'transactions', accountId: accountId || null, createAccount, rows: rows.txns, duplicates: rows.duplicates,
        summary: x.summary, due: x.dates.due, statement: x.doc_type !== 'transactions-export',
      };
    }
    case 'bank-statement':
      return { kind: 'statement-facts', accountId: accountId || null, createAccount, summary: x.summary, period: [x.dates.period_start, x.dates.period_end] };
    case 'tax-form':
      return { kind: 'tax', year: x.tax_year, entityId: m.entity && m.entity.entityId, taxKind: x.summary.taxKind || 'other', pdf: /pdf$/i.test(doc.type) || /\.pdf$/i.test(doc.name) };
    case 'receipt': {
      const total = (x.amounts.find((a) => a.label === 'total') || {}).value;
      return { kind: 'receipt', receipt: { amount: total, merchant: (x.parties[0] || {}).name || null, capturedAt: x.dates.document || undefined } };
    }
    default:
      // Pay stubs, bills, invoices and anything else: kept, dated, proposed.
      return { kind: 'stored', reason: 'kept with its dates and amounts; no ledger posting for this kind yet' };
  }
}

export function statusOf(doc) {
  if (doc.status === 'added') return 'added';
  if (!doc.extraction) return doc.readError ? 'needs-answer' : 'received';
  if ((doc.questions || []).some((q) => q.status !== 'answered')) return 'needs-answer';
  if (doc.recon && doc.recon.status === 'mismatch') return 'needs-answer';
  if (doc.plan && doc.plan.kind === 'stored') return 'stored';
  if (doc.plan && doc.plan.kind !== 'none') return 'ready';
  return 'read';
}

/** Whether this document may be written into the books as fact right now. */
export function canWrite(doc, { demo = false } = {}) {
  if (demo) return false;
  if (!doc || !doc.plan || doc.plan.kind === 'none' || doc.plan.kind === 'stored') return false;
  if (doc.recon && doc.recon.status === 'mismatch') return false;
  return blockingOpen(doc.questions).length === 0;
}

/**
 * Step 7. Confirm, then write through the EXISTING paths only. sinks:
 *   addAccount(item) -> seeded account (books-accounts-crud)
 *   commitImportedRows(rows) -> summary (the verified bulk commit)
 *   updateAccount(id, patch)
 *   uploadTax({ file, entityId, year, kind }) -> NAS ONLY (lib/tax-upload.js)
 *   addReceipt(receiptShape) (lib/receipts.js pending pool)
 * Returns the updated document with `links` naming what it became.
 */
export async function commitDoc(doc, { store, sinks = {}, known = {}, demo = false, now = () => new Date().toISOString() } = {}) {
  if (demo) return { ...doc, commitResult: { written: false, reason: 'demo mode writes nothing' } };
  if (!canWrite(doc)) return { ...doc, commitResult: { written: false, reason: (doc.plan && doc.plan.reason) || 'not ready' } };
  const p = doc.plan;
  const links = [];
  let createdAccountId = null;
  if ((p.kind === 'transactions' || p.kind === 'statement-facts') && p.createAccount && sinks.addAccount) {
    const acc = sinks.addAccount({ ...p.createAccount, entityId: doc.matched && doc.matched.entity ? doc.matched.entity.entityId : null });
    createdAccountId = acc && acc.id;
    if (createdAccountId) links.push({ kind: 'account', id: createdAccountId, label: p.createAccount.name });
  }
  const accountId = p.accountId || createdAccountId;
  if (p.kind === 'transactions' && accountId && sinks.commitImportedRows) {
    // Re-plan against the ledger as it is NOW, so a second tap adds nothing.
    const fresh = planAccountImport(ledgerRows(doc.extraction), accountId, known.transactions || []);
    const summary = fresh.txns.length ? await sinks.commitImportedRows(fresh.txns) : { total: 0, saved: 0 };
    links.push({ kind: 'transactions', accountId, count: fresh.txns.length, duplicates: fresh.duplicates, summary });
    if (p.statement && sinks.updateAccount && (p.due || (p.summary && p.summary.minimumPayment != null))) {
      const patch = {};
      if (p.due) patch.dueDay = Number(p.due.slice(8, 10));
      if (p.summary && p.summary.minimumPayment != null) patch.minPayment = p.summary.minimumPayment;
      if (p.summary && p.summary.apr != null) patch.rate = p.summary.apr;
      sinks.updateAccount(accountId, patch);
    }
  } else if (p.kind === 'statement-facts') {
    links.push({ kind: 'statement', accountId, period: p.period });
  } else if (p.kind === 'tax') {
    if (!p.pdf) return { ...doc, commitResult: { written: false, reason: 'tax papers go to the NAS archive as PDFs; this one stays stored here' } };
    const res = sinks.uploadTax ? await sinks.uploadTax({ file: doc.blob, entityId: p.entityId, year: p.year, kind: p.taxKind }) : { ok: false };
    if (!res || !res.ok) return { ...doc, commitResult: { written: false, reason: 'the NAS tax archive did not take it yet', detail: res } };
    links.push({ kind: 'tax', year: p.year, entityId: p.entityId, where: 'nas' });
  } else if (p.kind === 'receipt' && sinks.addReceipt) {
    const r = await sinks.addReceipt(receiptShape(p.receipt), doc);
    links.push({ kind: 'receipt', id: r && r.id });
  }
  const next = { ...doc, status: 'added', addedAt: now(), links, createdAccountId, commitResult: { written: true } };
  if (store) {
    await store.putDoc(next);
    const answers = lessonFrom(next);
    if (answers && next.extraction) await store.putLayout(next.extraction.layout_key, { answers, learnedAt: now(), from: next.id });
  }
  return next;
}

/** Answer or skip a question, then re-run the pipeline. Skipping never blocks others. */
export async function answer(doc, questionId, value, ctx) {
  const questions = answerQuestion(doc.questions, questionId, value);
  const q = questions.find((qq) => qq.id === questionId);
  let next = { ...doc, questions };
  if (q && q.field === 'unreadable' && value === 'retry') next = { ...next, read: null, questions: [] };
  if (q && q.field === 'reconcile' && value === 'reread') next = { ...next, read: null, questions: questions.filter((qq) => qq.field !== 'reconcile') };
  // Remember a layout as soon as a person answers, not only on write, so the
  // NEXT upload of the same layout asks nothing even if this one is held.
  if (value !== null && next.extraction && ctx.store) {
    const answers = lessonFrom(next);
    if (answers) await ctx.store.putLayout(next.extraction.layout_key, { answers, learnedAt: new Date().toISOString(), from: next.id });
  }
  return processDoc(next, ctx);
}

/** Take any batch of files: every one stored first, then each processed on its own. */
export async function intakeFiles(files, ctx) {
  const stored = [];
  for (const f of files || []) stored.push(await receive(f, ctx));
  const out = [];
  for (const d of stored) {
    // One document's trouble never stops the next.
    try { out.push(await processDoc(d, ctx)); } catch (e) { out.push({ ...d, status: 'needs-answer', readError: (e && e.message) || 'error' }); }
  }
  return out;
}
