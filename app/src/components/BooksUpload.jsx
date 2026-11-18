// =============================================================================
// BooksUpload — the one upload panel for everything financial (DR-0709)
// =============================================================================
// Darrell 2026-09-30: "Give one upload process that works for all
// possibilities" ... "we want it to be stored to be processed by us when we
// can.... Don't want to slow up any process however we want truth and clarity."
//
// Every file takes the SAME road (lib/books-intake-pipeline.js): stored first,
// read, shaped, matched, checked, asked about, and only then written through
// the paths the Books tabs already trust. This panel is only the window onto
// that road. What it promises the person, and keeps:
//   - any file is accepted; nothing is refused, nothing is lost
//   - each document shows where it is: Received -> Read -> Needs your answer
//     -> Ready to confirm -> Added (and what it became)
//   - questions can be answered now, later, or skipped; nothing else waits
//   - nothing uncertain is added to the books until it is answered
//   - in demo mode nothing is written anywhere
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import Modal from './Modal.jsx';
import { intakeStore } from '../lib/books-intake-store.js';
import { intakeFiles, processDoc, answer as answerDoc, decideRows, commitDoc, canWrite, STATUS_LABEL } from '../lib/books-intake-pipeline.js';
import { TX_CATEGORIES, categoryLabel } from '../lib/categorize.js';
import { queueSummary } from '../lib/books-intake-questions.js';
import { DOC_TYPE_LABEL, TAB_HINTS } from '../lib/books-intake-extract.js';
import { buildTimeline } from '../lib/books-intake-reconcile.js';
import { reportBooksUploadCount } from './BooksUploadButton.jsx';
import { resolveBridgeBearer } from '../lib/bridge-auth.js';
import { getLedgerEditor, learnImportRules } from '../lib/ledger-edit.js';
import { recheckScreenshotImports } from '../lib/screenshot-import-recheck.js';

const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const SERIF = { fontFamily: '"Fraunces", serif' };
const money = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const STEPS = ['received', 'read', 'needs-answer', 'ready', 'added'];
const TAB_NAME = { debts: 'Debts', accounts: 'Accounts', transactions: 'Tx', imported: 'Imported', taxes: 'Taxes', k1099: '1099s', cart: 'Cart', calendar: 'Calendar', owed: 'Owed', plan: 'Plan', entities: 'Entities', legal: 'Legal' };

function StatusTrail({ status, asked }) {
  const at = status === 'stored' ? 1 : STEPS.indexOf(status);
  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-0.5 text-[0.625rem] uppercase tracking-wider" aria-label={`Status: ${STATUS_LABEL[status] || status}`}>
      {STEPS.map((s, i) => (
        <li key={s} className={i === at ? 'text-[#1A1815] font-semibold' : (i < at && (s !== 'needs-answer' || asked) ? 'text-[#5A6E3D]' : 'text-[#8A857C]')}>
          {i > 0 && <span aria-hidden="true" className="mr-1">›</span>}{STATUS_LABEL[s]}
        </li>
      ))}
      {status === 'stored' && <li className="text-[#1A1815] font-semibold">· Stored and proposed</li>}
    </ol>
  );
}

function Question({ q, onAnswer, busy }) {
  return (
    <div className="border border-[#E8E4DC] bg-white p-2.5 space-y-2" data-testid="intake-question">
      <p className="text-sm text-[#1A1815]" style={SERIF}>{q.prompt}</p>
      {q.why && <p className="text-[0.6875rem] text-[#5A5751]">{q.why}</p>}
      <div className="flex flex-wrap gap-1.5">
        {q.suggestions.map((s) => (
          <button key={s.value} type="button" disabled={busy} onClick={() => onAnswer(q.id, s.value)}
            className={`text-xs px-2.5 min-h-[40px] border ${q.answer === s.value ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4]'} disabled:opacity-50`}>
            {s.label}
          </button>
        ))}
        <button type="button" disabled={busy} onClick={() => onAnswer(q.id, null)}
          className="text-xs px-2.5 min-h-[40px] text-[#5A5751] underline disabled:opacity-50">
          {q.status === 'skipped' ? 'Skipped — answer any time' : 'Skip for now'}
        </button>
      </div>
      {q.answeredAt === 'remembered' && <p className="text-[0.625rem] text-[#5A6E3D]">Answered from last time — this layout has been seen before.</p>}
    </div>
  );
}

function DocCard({ doc, onAnswer, onConfirm, onDecide, busy, demo, today, acctName }) {
  const x = doc.extraction;
  const waiting = (doc.questions || []).filter((q) => q.status !== 'answered');
  const ready = canWrite(doc);
  const due = x && x.dates.due;
  const overdue = due && !x.dates.paid && due < today;
  return (
    <li className="border border-[#1A1815] bg-[#FAF8F4] p-3 space-y-2" data-testid="intake-doc">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1A1815] break-words">{doc.name}</p>
          <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>Received {new Date(doc.receivedAt).toLocaleString()}</p>
        </div>
      </div>
      <StatusTrail status={doc.status} asked={(doc.questions || []).some((q) => q.answeredAt !== 'remembered')} />
      {x && (
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[0.6875rem]" style={MONO}>
          <span className="text-[#5A5751]">Kind</span><span className="text-[#1A1815]">{x.doc_type === 'unknown' ? 'Not sure yet' : `${DOC_TYPE_LABEL[x.doc_type]} · ${Math.round(x.confidence * 100)}% sure`}</span>
          {doc.matched && doc.matched.account && doc.matched.account.accountId && (<><span className="text-[#5A5751]">Account</span><span className="text-[#1A1815]">{acctName(doc.matched.account.accountId)}</span></>)}
          {(x.dates.period_start || x.dates.period_end) && (<><span className="text-[#5A5751]">Period</span><span className="text-[#1A1815]">{x.dates.period_start || '?'} → {x.dates.period_end || '?'}</span></>)}
          {due && (<><span className="text-[#5A5751]">Due</span><span className={overdue ? 'text-[#7A1F1F] font-semibold' : 'text-[#1A1815]'}>{due}{overdue ? ' · overdue' : ''}</span></>)}
          {x.summary && x.summary.newBalance != null && x.doc_type !== 'account-snapshot' && (<><span className="text-[#5A5751]">Balance</span><span className="text-[#1A1815]">{money(x.summary.newBalance)}</span></>)}
          {doc.plan && doc.plan.kind === 'snapshot' && doc.plan.checkpoint && (<><span className="text-[#5A5751]">Verified balance</span><span className="text-[#1A1815]" data-testid="intake-snapshot-checkpoint">{money(doc.plan.checkpoint.balance)} as of {doc.plan.checkpoint.day} ({doc.plan.checkpoint.basis}){doc.plan.checkpointAlreadyRecorded ? ' · already recorded' : ' · will be recorded on approval'}</span></>)}
          {doc.plan && doc.plan.kind === 'snapshot' && !doc.plan.checkpoint && x.summary && x.summary.rowsOnly && (<><span className="text-[#5A5751]">Verified balance</span><span className="text-[#8B6F47]">none — transactions only</span></>)}
          {x.amounts.map((a) => (<React.Fragment key={a.label}><span className="text-[#5A5751] capitalize">{a.label}</span><span className="text-[#1A1815]">{money(a.value)}</span></React.Fragment>))}
          {x.tax_year && (<><span className="text-[#5A5751]">Tax year</span><span className="text-[#1A1815]">{x.tax_year}</span></>)}
          {x.line_items.length > 0 && (<><span className="text-[#5A5751]">Lines</span><span className="text-[#1A1815]">{x.line_items.length}{doc.plan && doc.plan.duplicates ? ` · ${doc.plan.duplicates} already in the books` : ''}</span></>)}
        </div>
      )}
      {x && x.doc_type === 'account-snapshot' && <SnapshotRows doc={doc} x={x} onDecide={onDecide} busy={busy || demo} />}
      {doc.plan && doc.plan.held && <p className="text-[0.6875rem] text-[#8B6F47]" data-testid="intake-held">Held: {doc.plan.reason}.</p>}
      {doc.recon && x && x.doc_type !== 'unknown' && (
        <p className={`text-[0.6875rem] ${doc.recon.status === 'mismatch' ? 'text-[#7A1F1F]' : doc.recon.status === 'reconciled' ? 'text-[#5A6E3D]' : 'text-[#8B6F47]'}`}>{doc.recon.note}</p>
      )}
      {doc.cloud && !doc.cloud.ok && doc.cloud.message && <p className="text-[0.625rem] text-[#8B6F47]">{doc.cloud.message}</p>}
      {doc.cloud && doc.cloud.ok && <p className="text-[0.625rem] text-[#5A6E3D]">A copy of the original is on the household shelf (The money).</p>}
      {waiting.length > 0 && (
        <div className="space-y-2">
          {waiting.map((q) => <Question key={q.id} q={q} onAnswer={(id, v) => onAnswer(doc, id, v)} busy={busy} />)}
        </div>
      )}
      {doc.status === 'stored' && doc.plan && <p className="text-[0.6875rem] text-[#5A5751]">Kept with its dates and amounts. {doc.plan.reason}.</p>}
      {doc.status === 'added' && (
        <ul className="text-[0.6875rem] text-[#5A6E3D] list-disc pl-4">
          {(doc.links || []).map((l, i) => (
            <li key={i}>
              {l.kind === 'transactions' && `${l.count} transaction${l.count === 1 ? '' : 's'} added to the books${l.duplicates ? ` (${l.duplicates} were already there)` : ''}`}
              {l.kind === 'account' && `New account created: ${l.label}`}
              {l.kind === 'tax' && `Filed in the NAS tax archive for ${l.year}`}
              {l.kind === 'receipt' && 'Added to the receipts waiting to be matched (Tx tab)'}
              {l.kind === 'statement' && 'Statement balance and period recorded'}
              {l.kind === 'checkpoint' && (l.alreadyRecorded ? `Bank-verified balance ${money(l.balance)} as of ${l.day} was already recorded` : `Bank-verified balance ${money(l.balance)} recorded as of ${l.day} (${l.basis})`)}
            </li>
          ))}
        </ul>
      )}
      {doc.commitResult && !doc.commitResult.written && doc.status !== 'added' && <p className="text-[0.6875rem] text-[#8B6F47]">Not added: {doc.commitResult.reason}.</p>}
      {ready && doc.status !== 'added' && (
        <button type="button" disabled={busy || demo} onClick={() => onConfirm(doc)}
          className="text-xs uppercase tracking-wider px-4 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-40">
          {demo ? 'Demo — nothing is added' : (doc.plan && doc.plan.kind === 'snapshot'
            ? `Approve: ${doc.plan.checkpoint && !doc.plan.checkpointAlreadyRecorded ? 'verified balance' : 'no new balance'}${doc.plan.rows ? ` + ${doc.plan.rows.length} new row${doc.plan.rows.length === 1 ? '' : 's'}` : ''}`
            : `Add to the books${doc.plan && doc.plan.rows ? ` (${doc.plan.rows.length} new)` : ''}`)}
        </button>
      )}
    </li>
  );
}

// THE ROWS THEMSELVES, not a count (Christina 2026-11-16: "Present extracted
// transactions for my approval before importing. Allow individual and bulk
// transaction approval, editing, categorization, and rejection"). While a
// question is open: every row the screen showed, with what is still missing
// (its day, or whether it is money in or out). Once ready: every row with a
// box to add it or leave it out, its category (suggested from your own rules
// first, then the built-in ones; yours to change), and rows already in the
// books marked so. Approve adds exactly the boxed rows, as categorized.
function SnapshotRows({ doc, x, onDecide, busy }) {
  const statuses = doc.plan && doc.plan.kind === 'snapshot' ? doc.plan.rowStatuses || null : null;
  if (!statuses) {
    const list = x.preview_items || [];
    if (!list.length) return null;
    return (
      <details open className="text-[0.6875rem]" data-testid="intake-snapshot-rows">
        <summary className="cursor-pointer text-[#5A5751]">{`${list.length} row${list.length === 1 ? '' : 's'} read from the screen (not added yet)`}</summary>
        <ul className="mt-1 space-y-0.5" style={MONO}>
          {list.map((r, i) => (
            <li key={`${r.date || r.openDate}-${r.description}-${i}`} className="flex gap-2" data-testid="intake-snapshot-row">
              <span className="w-[5.5rem] shrink-0 text-[#5A5751]">{r.date || (r.openDate ? `${r.openDate} · day needed` : 'day needed')}</span>
              <span className="flex-1 min-w-0 break-words text-[#1A1815]">{r.description}{r.pending ? ' · pending' : ''}{r.category === 'transfer' ? ' · transfer' : r.category === 'debt-payment' ? ' · debt payment' : ''}</span>
              <span className={`shrink-0 ${r.signUnknown || r.amountUnclear ? 'text-[#8B6F47]' : 'text-[#1A1815]'}`}>{r.amountUnclear ? 'amount unclear' : r.signUnknown ? `${money(Math.abs(r.amount))} · in or out?` : `${r.amount < 0 ? '\u2212' : '+'}${money(Math.abs(r.amount))}`}</span>
              <RowFigures r={r} />
            </li>
          ))}
        </ul>
      </details>
    );
  }
  const adding = statuses.filter((s) => s.status === 'new').length;
  const can = !!onDecide && !busy;
  const all = (exclude) => onDecide(doc, Object.fromEntries(statuses.filter((s) => s.status !== 'duplicate').map((s) => [s.index, exclude ? { exclude: true } : {}])));
  return (
    <div className="text-[0.6875rem]" data-testid="intake-snapshot-rows">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[#5A5751]" data-testid="intake-rows-summary">{adding} of {statuses.length} row{statuses.length === 1 ? '' : 's'} will be added{doc.plan.duplicates ? ` · ${doc.plan.duplicates} already in the books` : ''}</span>
        {onDecide && <button type="button" disabled={!can} onClick={() => all(false)} data-testid="intake-rows-all" className="min-h-[36px] px-2.5 border border-[#1A1815] text-[#1A1815] disabled:opacity-40">Add all</button>}
        {onDecide && <button type="button" disabled={!can} onClick={() => all(true)} data-testid="intake-rows-none" className="min-h-[36px] px-2.5 border border-[#1A1815] text-[#1A1815] disabled:opacity-40">Add none</button>}
      </div>
      <ul className="mt-1 space-y-1" style={MONO}>
        {statuses.map((s) => {
          const r = s.row;
          const dup = s.status === 'duplicate';
          return (
            <li key={s.index} className={`flex flex-wrap items-center gap-2 ${s.status === 'excluded' ? 'opacity-60' : ''}`} data-testid="intake-snapshot-row" data-status={s.status}>
              <label className="flex items-center gap-1 min-h-[36px]">
                <input type="checkbox" checked={s.status === 'new'} disabled={!can || dup} onChange={(e) => onDecide(doc, { [s.index]: e.target.checked ? { exclude: false, category: (doc.rowDecisions || {})[s.index]?.category } : { exclude: true } })} aria-label={`Add ${r.description}`} data-testid={`intake-row-add-${s.index}`} />
                <span className="w-[5.5rem] shrink-0 text-[#5A5751]">{r.date}</span>
              </label>
              <span className="flex-1 min-w-[8rem] break-words text-[#1A1815]">{r.description}{r.pending ? ' \u00b7 pending' : ''}{dup ? ' \u00b7 already in the books' : ''}</span>
              <span className="shrink-0 text-[#1A1815]">{`${r.amount < 0 ? '\u2212' : '+'}${money(Math.abs(r.amount))}`}</span>
              <RowFigures r={r} />
              <label className="w-full flex items-center gap-1 pl-6 text-[#5A5751]">
                <span>Category</span>
                <select value={r.category || 'other'} disabled={!can || dup || s.status === 'excluded'} onChange={(e) => onDecide(doc, { [s.index]: { category: e.target.value } })} aria-label={`Category for ${r.description}`} data-testid={`intake-row-category-${s.index}`} className="min-h-[36px] px-1 border border-[#E8E4DC] bg-white text-[#1A1815]">
                  {TX_CATEGORIES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
                {r.categorySource && <span data-testid={`intake-row-category-source-${s.index}`}>{r.categorySource === 'you' ? 'your choice' : r.categorySource === 'your rule' ? 'from your rule' : 'suggested'}</span>}
              </label>
            </li>
          );
        })}
      </ul>
      <UnclearRows list={x.preview_items} />
    </div>
  );
}

// What the screen printed for a row, beside the amount taken: the bank's
// running balance after it, and where the sign came from. A running balance
// read as the amount (Christina 2026-11-18, Chase 7206) is visible here.
function RowFigures({ r }) {
  if (r.runningBalance == null && !r.amountUnclear) return null;
  const printed = (r.printed || []).map((v) => `${v < 0 ? '\u2212' : ''}${money(Math.abs(v))}`).join(' and ');
  return (
    <span className="w-full pl-6 text-[0.625rem] text-[#5A5751]" data-testid="intake-row-figures">
      {r.amountUnclear
        ? `The screen printed ${printed || 'no clear amount'}; which is the amount could not be told from the balance. Not added; enter it by hand or upload a clearer copy.`
        : `Bank balance after: ${money(r.runningBalance)}${r.signFrom === 'balance' ? ' \u00b7 in or out read from the balance' : ''}`}
    </span>
  );
}

// Rows the screen showed but whose amount was not clear: listed, never added.
function UnclearRows({ list }) {
  const unclear = (list || []).filter((r) => r && r.amountUnclear);
  if (!unclear.length) return null;
  return (
    <ul className="mt-1 space-y-1" style={MONO} data-testid="intake-unclear-rows">
      {unclear.map((r, i) => (
        <li key={`${r.description}-${i}`} className="flex flex-wrap gap-2 text-[#8B6F47]" data-testid="intake-unclear-row">
          <span className="w-[5.5rem] shrink-0">{r.date || r.openDate || 'day needed'}</span>
          <span className="flex-1 min-w-[8rem] break-words">{r.description}{" \u00b7 not added: amount unclear"}</span>
          <RowFigures r={r} />
        </li>
      ))}
    </ul>
  );
}

// Screenshots already added, re-read with the corrected reader (2026-11-18:
// Chase running balances were read as amounts). Lists what differs; changes
// nothing. A correction is made by the person, row by row, in Transactions.
function PastScreenshotCheck({ docs, transactions }) {
  const res = useMemo(() => recheckScreenshotImports(docs, transactions), [docs, transactions]);
  if (!res.findings.length && !res.notCheckable) return null;
  const sign = (n) => (n == null ? '\u2014' : `${n < 0 ? '\u2212' : '+'}${money(Math.abs(n))}`);
  return (
    <div className="border border-[#B85838] bg-[#FAF8F4] p-2 text-[0.6875rem] text-[#1A1815]" role="status" data-testid="past-screenshot-check">
      <p className="font-medium">
        {res.findings.length
          ? `${res.findings.length} row${res.findings.length === 1 ? '' : 's'} from screenshots already added ${res.findings.length === 1 ? 'reads' : 'read'} differently with the corrected reader. Nothing has been changed.`
          : 'No differences found in the screenshots this device can re-read.'}
      </p>
      {res.findings.length > 0 && (
        <ul className="mt-1 space-y-0.5" style={MONO}>
          {res.findings.map((f, i) => (
            <li key={`${f.docId}-${i}`} data-testid="past-screenshot-finding" data-kind={f.kind}>
              {`${f.date} \u00b7 ${f.description}: in the books ${sign(f.written)}; `}
              {f.kind === 'amount-wrong'
                ? `the screen says ${sign(f.correct)}${f.runningBalance != null ? ` (bank balance after: ${money(f.runningBalance)})` : ''}`
                : `the screen's amount is not clear (printed ${(f.printed || []).map((v) => money(Math.abs(v))).join(' and ') || 'nothing clear'})`}
            </li>
          ))}
        </ul>
      )}
      {res.notCheckable > 0 && <p className="mt-1 text-[#5A5751]">{`${res.notCheckable} screenshot${res.notCheckable === 1 ? ' was' : 's were'} added on another device and cannot be re-read here; open this on that device to check ${res.notCheckable === 1 ? 'it' : 'them'}.`}</p>}
      {res.findings.length > 0 && <p className="mt-1 text-[#5A5751]">Correct each row in Transactions (edit its amount) or remove it there. Nothing changes until you do.</p>}
    </div>
  );
}

export default function BooksUpload({ hint = null, data = {}, debts = [], demo = false, commitImportedRows, addAccount, updateAccount, onClose }) {
  const store = useMemo(() => intakeStore({ demoMode: demo }), [demo]);
  const inputRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [teach, setTeach] = useState([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const known = useMemo(() => ({
    accounts: data.accounts || [], entities: data.entities || [], transactions: data.transactions || [], categoryRules: data.categoryRules || null,
    rentals: (data.inflows && data.inflows.rentals) || [], subscriptions: data.subscriptions || [],
    contractors: data.contractors1099 || [], debts: debts || [], projects: data.projects || [],
  }), [data, debts]);

  const readerDeps = useMemo(() => ({
    get token() { try { return resolveBridgeBearer(window); } catch { return null; } },
  }), []);

  const ctx = useMemo(() => ({
    store, known, hint, demo, readerDeps,
    cloudKeep: demo ? null : async (file, doc) => (await import('../lib/books-intake-cloud.js')).keepOriginalInCloud(file, doc),
  }), [store, known, hint, demo, readerDeps]);

  const refresh = useCallback(async () => {
    const list = await store.listDocs().catch(() => []);
    setDocs(list);
    setTeach(await store.listTeach().catch(() => []));
    reportBooksUploadCount(queueSummary(list).waiting);
  }, [store]);

  useEffect(() => { refresh(); }, [refresh]);

  const onFiles = async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setBusy(`Keeping ${files.length} file${files.length === 1 ? '' : 's'} safe, then reading…`);
    try { await intakeFiles(files, ctx); } finally { setBusy(''); await refresh(); }
  };

  const onAnswer = async (doc, qid, value) => {
    setBusy('Updating…');
    try { await answerDoc(doc, qid, value, ctx); } finally { setBusy(''); await refresh(); }
  };

  const onDecide = async (doc, decisions) => {
    setBusy('Updating\u2026');
    try { await decideRows(doc, decisions, ctx); } finally { setBusy(''); await refresh(); }
  };

  const sinks = useMemo(() => ({
    commitImportedRows, addAccount, updateAccount,
    uploadTax: async (req) => {
      const [{ uploadTaxDoc }, { resolveBridgeBearer }, { hasBridgeToken }, { provisionBridgeToken }, { supabase }] = await Promise.all([
        import('../lib/tax-upload.js'), import('../lib/bridge-auth.js'), import('../lib/nas-photos.js'), import('../lib/bridge-provision.js'), import('../lib/supabase.js'),
      ]);
      if (!hasBridgeToken()) await provisionBridgeToken(supabase).catch(() => null);
      const token = (() => { try { return resolveBridgeBearer(window); } catch { return null; } })();
      return uploadTaxDoc(req, { token });
    },
    addReceipt: async (receipt, doc) => {
      const [{ addPending }, { compressImageFile, isLikelyImageFile }] = await Promise.all([import('../lib/receipts.js'), import('../lib/image.js')]);
      let src = '';
      if (doc && doc.blob && isLikelyImageFile(doc.blob)) src = await compressImageFile(doc.blob, 1280, 0.6).catch(() => '');
      const res = addPending({ ...receipt, src });
      return res && res.added ? receipt : null;
    },
  }), [commitImportedRows, addAccount, updateAccount]);

  const onConfirm = async (doc) => {
    setBusy('Adding to the books…');
    try {
      const fresh = await processDoc(doc, ctx);
      const out = await commitDoc(fresh, { store, sinks, known, demo });
      if (out && out.status === 'added' && !demo) learnImportRules(getLedgerEditor(), fresh); // categories you chose become rules; no past row changes
    } finally { setBusy(''); await refresh(); }
  };

  const summary = queueSummary(docs);
  const timeline = useMemo(() => buildTimeline(docs.map((d) => ({ ...d, accountId: d.matched && d.matched.account ? d.matched.account.accountId : null })), today), [docs, today]);
  const shown = filter === 'waiting' ? docs.filter((d) => (d.questions || []).some((q) => q.status !== 'answered')) : docs;
  const hinted = hint && (TAB_HINTS[hint] || []).length ? `Opened from ${TAB_NAME[hint] || hint}: we look for ${(TAB_HINTS[hint] || []).map((t) => DOC_TYPE_LABEL[t].toLowerCase()).join(' or ')} first, but the document decides where it goes.` : null;
  const acctName = (key) => {
    const a = (known.accounts || []).find((r) => r.id === key);
    return a ? a.name : String(key || '').replace(/^last4:/, 'ending ');
  };

  return (
    <Modal open onClose={onClose} labelledBy="books-upload-title" closeLabel="Close the upload" maxWidthClass="max-w-2xl">
      <div data-testid="books-upload-panel">
        <h2 id="books-upload-title" className="text-lg text-[#1A1815] pr-12" style={SERIF}>Upload anything financial</h2>
        <div className="pt-3 space-y-3">
          {demo && <p className="text-xs border border-[#8B6F47] bg-[#FAF8F4] p-2 text-[#1A1815]" role="status">Demo: you can try every step, and nothing is saved or added anywhere.</p>}
          <p className="text-sm text-[#1A1815]" style={SERIF}>
            Statements, downloads, bills, receipts, pay stubs, tax papers, a photo of any of them. Every file is kept the moment you choose it. What we are sure of moves on; what we are not sure of waits for your answer, and nothing unsure is added to the books.
          </p>
          {hinted && <p className="text-[0.6875rem] text-[#5A5751]">{hinted}</p>}
          <PastScreenshotCheck docs={docs} transactions={known.transactions} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={!!busy}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-4 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-50">
              <UiIcon name="upload" /> Choose files or take a photo
            </button>
            <input ref={inputRef} type="file" multiple className="sr-only" aria-label="Choose financial documents" data-testid="books-upload-input" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          </div>
          {busy && <p className="text-xs text-[#5A5751]" role="status" aria-live="polite">{busy}</p>}

          <div className="flex flex-wrap gap-1 border-b border-[#E8E4DC]" role="tablist" aria-label="Upload views">
            {[['all', `All (${docs.length})`], ['waiting', `Needs your answer (${summary.waiting})`], ['timeline', 'Timeline'], ['teach', `Teach the system (${teach.reduce((n, t) => n + t.count, 0)})`]].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                className={`text-xs px-2.5 min-h-[40px] border-b-2 ${filter === id ? 'border-[#1A1815] text-[#1A1815] font-semibold' : 'border-transparent text-[#5A5751]'}`}>{label}</button>
            ))}
          </div>

          {(filter === 'all' || filter === 'waiting') && (
            shown.length ? (
              <ul className="space-y-3">
                {shown.map((d) => <DocCard key={d.id} doc={d} onAnswer={onAnswer} onConfirm={onConfirm} onDecide={onDecide} busy={!!busy} demo={demo} today={today} acctName={acctName} />)}
              </ul>
            ) : (
              <p className="text-sm text-[#5A5751]">{filter === 'waiting' ? 'Nothing is waiting on you.' : 'Nothing uploaded yet.'}</p>
            )
          )}

          {filter === 'timeline' && (
            <div className="space-y-2 text-[0.6875rem]" style={MONO}>
              {timeline.gaps.map((g) => (
                <p key={g.accountKey} className="text-[#8B6F47]">Missing for {acctName(g.accountKey)}: {g.missing.join(', ')}</p>
              ))}
              {timeline.entries.length ? (
                <ul className="space-y-1">
                  {timeline.entries.map((e) => (
                    <li key={e.docId} className="flex flex-wrap gap-x-2">
                      <span className="text-[#1A1815]">{e.period_end || e.due || '—'}</span>
                      <span className="text-[#5A5751]">{DOC_TYPE_LABEL[e.doc_type]}</span>
                      {e.accountKey && <span className="text-[#5A5751]">{acctName(e.accountKey)}</span>}
                      {e.due && <span className={e.dueStatus === 'overdue' ? 'text-[#7A1F1F] font-semibold' : 'text-[#5A5751]'}>due {e.due}{e.dueStatus === 'overdue' ? ' · overdue' : ''}</span>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-[#5A5751]">The timeline fills in as documents are read.</p>}
            </div>
          )}

          {filter === 'teach' && (
            teach.length ? (
              <ul className="space-y-1 text-xs">
                {teach.map((t) => (
                  <li key={t.key} className="border border-[#E8E4DC] p-2">
                    <span className="font-semibold">{t.count}×</span> a kind we do not know yet — {(t.samples || []).map((s) => s.name).join(', ')}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[#5A5751]">No unknown kinds yet. When a document is answered as &ldquo;something else,&rdquo; it is counted here so the system can be taught to read it.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
