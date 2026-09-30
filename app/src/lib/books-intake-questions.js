// =============================================================================
// books-intake-questions — ask what we are unsure of, WITHOUT slowing anything
// (DR-0707, the one Books upload)
// =============================================================================
// Darrell 2026-09-30: "At times we may not have time to answer all questions
// about what is what however we want it to be stored to be processed by us when
// we can.... Don't want to slow up any process however we want truth and
// clarity."
//
// So every uncertainty becomes a plain question with suggested answers, and the
// questions live in a STORED queue:
//   - nothing waits on them: the document is already stored, and every other
//     document keeps moving;
//   - a person may skip or leave any question; the document stays pending and
//     processed as far as it can go;
//   - nothing uncertain is written into the books as fact until it is answered
//     (a BLOCKING question holds the write; a non-blocking one only enriches).
//
// And the system LEARNS: an answer is remembered against the document's layout
// (the institution + the shape of the page), so the next document that looks
// the same asks nothing.
// =============================================================================
import { DOC_TYPE_LABEL, DOC_TYPES } from './books-intake-extract.js';
import { TAB_HINTS } from './books-intake-extract.js';

export const QUESTION_STATUS = Object.freeze(['open', 'answered', 'skipped']);

const money = (n) => `$${Math.abs(Number(n) || 0).toFixed(2)}`;

function q(docId, field, prompt, suggestions, { blocking = true, why = '' } = {}) {
  return { id: `${docId}:${field}`, docId, field, prompt, why, suggestions, blocking, status: 'open', answer: null, answeredAt: null };
}

/**
 * Build the questions a document still needs. `matched` is matchDocument's
 * result; `recon` is reconcileExtraction's. Remembered answers are applied by
 * the caller BEFORE this runs, so a learned layout produces no questions.
 */
export function questionsFor(doc, { extraction: x, matched = {}, recon = null, hint = null, accounts = [], entities = [], readError = null } = {}) {
  const id = doc.id;
  const out = [];
  if (readError) {
    out.push(q(id, 'unreadable', `We stored "${doc.name}" but could not read it yet (${readError}). What would you like to do?`,
      [{ value: 'keep', label: 'Keep it stored; we will read it later' }, { value: 'retry', label: 'Try reading it again' }],
      { blocking: true, why: 'Nothing was read, so nothing can be added.' }));
    return out;
  }
  if (!x) return out;

  if (x.uncertain.includes('doc_type')) {
    const ranked = (x.ranked || []).filter((t) => t !== 'unknown');
    const hinted = (hint && TAB_HINTS[hint]) || [];
    const order = [...new Set([...ranked.slice(0, 3), ...hinted, ...DOC_TYPES.filter((t) => t !== 'unknown')])].slice(0, 6);
    out.push(q(id, 'doc_type', 'What kind of document is this?',
      [...order.map((t) => ({ value: t, label: DOC_TYPE_LABEL[t] })), { value: 'unknown', label: 'Something else — teach the system later' }],
      { why: x.doc_type === 'unknown' ? 'We read it but could not tell what kind of document it is.'
        : `We read it and think it is a ${DOC_TYPE_LABEL[x.doc_type].toLowerCase()}, but only ${Math.round(x.confidence * 100)}% sure.` }));
    return out; // what it IS decides every other question
  }

  const needsAccount = ['transactions-export', 'card-statement', 'bank-statement', 'loan-statement'].includes(x.doc_type);
  if (needsAccount && matched.account && !matched.account.accountId) {
    const cands = (matched.account.candidates || []).map((c) => ({ value: `account:${c.id}`, label: `${c.name} (${c.reason === 'last-4' ? 'same last 4' : 'same bank'})` }));
    const rest = (accounts || []).filter((a) => a && a.id && !cands.some((c) => c.value === `account:${a.id}`)).slice(0, 6)
      .map((a) => ({ value: `account:${a.id}`, label: a.name }));
    const create = matched.proposedAccount ? [{ value: 'create', label: `Create a new account: ${matched.proposedAccount.name}` }] : [];
    out.push(q(id, 'account', `Which account is this${x.account_hint.last4 ? ` (ending ${x.account_hint.last4})` : ''}?`,
      [...cands, ...create, ...rest],
      { why: x.account_hint.last4 ? 'No account on file ends in those four digits.' : 'The document does not show which account it is.' }));
  }

  if (x.doc_type === 'tax-form') {
    if (!x.tax_year) {
      const y = new Date().getFullYear();
      out.push(q(id, 'tax_year', 'Which tax year is this for?', [y - 1, y, y - 2].map((v) => ({ value: String(v), label: String(v) }))));
    }
    if (!matched.entity || !matched.entity.entityId) {
      out.push(q(id, 'entity', 'Whose taxes are these?', (entities || []).map((e) => ({ value: `entity:${e.id}`, label: e.name })),
        { why: 'A tax paper is filed under one person or business.' }));
    }
  } else if ((entities || []).length > 1 && matched.entity && !matched.entity.entityId && ['bill', 'invoice', 'receipt', 'pay-stub'].includes(x.doc_type)) {
    out.push(q(id, 'entity', 'Whose books does this belong to?', (matched.entity.candidates || entities).map((e) => ({ value: `entity:${e.id}`, label: e.name })),
      { blocking: false, why: 'Stored either way; this only files it under the right name.' }));
  }

  if (recon && recon.status === 'mismatch') {
    out.push(q(id, 'reconcile', `${recon.note} It stays stored but will not be added as fact. What should we do?`,
      [{ value: 'hold', label: 'Hold it; I will check the paper' }, { value: 'reread', label: 'Read it again (a clearer copy may help)' }],
      { why: 'Truth first: numbers that do not add up are never written into the books.' }));
  }

  if (x.doc_type === 'bank-statement' && x.line_items.length) {
    out.push(q(id, 'rows_source', 'A bank statement PDF does not say for sure which lines are deposits and which are withdrawals. How should its lines be handled?',
      [{ value: 'summary-only', label: 'Keep the balance and dates only; I will upload the CSV for the lines' }],
      { blocking: false, why: 'The balance and period are recorded now; the lines wait for a download that carries their signs.' }));
  }
  return out;
}

/** Answer (or skip) one question in a list. Returns a new list. */
export function answerQuestion(questions = [], questionId, value, at = new Date().toISOString()) {
  return questions.map((qq) => (qq.id !== questionId ? qq
    : value === null ? { ...qq, status: 'skipped', answer: null, answeredAt: at }
      : { ...qq, status: 'answered', answer: value, answeredAt: at }));
}

/** Open or skipped blocking questions hold the write; answered ones release it. */
export function blockingOpen(questions = []) {
  return (questions || []).filter((qq) => qq.blocking && qq.status !== 'answered');
}

/** Everything still waiting on a person, across all documents, with counts. */
export function queueSummary(docs = []) {
  let open = 0; let skipped = 0; let documents = 0;
  for (const d of docs || []) {
    const waiting = (d.questions || []).filter((qq) => qq.status !== 'answered');
    if (waiting.length) documents += 1;
    open += waiting.filter((qq) => qq.status === 'open').length;
    skipped += waiting.filter((qq) => qq.status === 'skipped').length;
  }
  return { open, skipped, waiting: open + skipped, documents };
}

// ---------------------------------------------------------------------------
// Learned layouts — the next document that looks like this one asks nothing.
// ---------------------------------------------------------------------------
const LEARNABLE = ['doc_type', 'account', 'entity', 'tax_year_offset'];

/** What to remember from a document's answered questions. */
export function lessonFrom(doc) {
  const lesson = {};
  for (const qq of doc.questions || []) {
    if (qq.status !== 'answered') continue;
    if (qq.field === 'doc_type') lesson.doc_type = qq.answer;
    if (qq.field === 'account' && String(qq.answer).startsWith('account:')) lesson.account = qq.answer;
    if (qq.field === 'account' && qq.answer === 'create' && doc.createdAccountId) lesson.account = `account:${doc.createdAccountId}`;
    if (qq.field === 'entity') lesson.entity = qq.answer;
  }
  return Object.keys(lesson).length ? lesson : null;
}

/**
 * Apply a remembered lesson to a fresh document. The account is reused only
 * when the new document does not contradict it (a different last-4 on the page
 * means a different card, whatever the layout says).
 */
export function applyLesson(lesson, { extraction: x, accounts = [] }) {
  const answers = {};
  if (!lesson) return answers;
  if (lesson.doc_type && x && x.uncertain.includes('doc_type')) answers.doc_type = lesson.doc_type;
  if (lesson.account) {
    const id = String(lesson.account).slice('account:'.length);
    const acc = (accounts || []).find((a) => a.id === id);
    const l4 = String((acc && acc.fragment) || '').replace(/\D/g, '').slice(-4);
    const pageL4 = x && x.account_hint && x.account_hint.last4;
    if (acc && (!pageL4 || !l4 || pageL4 === l4)) answers.account = lesson.account;
  }
  if (lesson.entity) answers.entity = lesson.entity;
  return answers;
}

export { LEARNABLE, money as formatMoney };
