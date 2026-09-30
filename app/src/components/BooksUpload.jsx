// =============================================================================
// BooksUpload — the one upload panel for everything financial (DR-0707)
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
import { intakeFiles, processDoc, answer as answerDoc, commitDoc, canWrite, STATUS_LABEL } from '../lib/books-intake-pipeline.js';
import { queueSummary } from '../lib/books-intake-questions.js';
import { DOC_TYPE_LABEL, TAB_HINTS } from '../lib/books-intake-extract.js';
import { buildTimeline } from '../lib/books-intake-reconcile.js';
import { reportBooksUploadCount } from './BooksUploadButton.jsx';
import { resolveBridgeBearer } from '../lib/bridge-auth.js';

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

function DocCard({ doc, onAnswer, onConfirm, busy, demo, today, acctName }) {
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
          {x.summary && x.summary.newBalance != null && (<><span className="text-[#5A5751]">Balance</span><span className="text-[#1A1815]">{money(x.summary.newBalance)}</span></>)}
          {x.amounts.map((a) => (<React.Fragment key={a.label}><span className="text-[#5A5751] capitalize">{a.label}</span><span className="text-[#1A1815]">{money(a.value)}</span></React.Fragment>))}
          {x.tax_year && (<><span className="text-[#5A5751]">Tax year</span><span className="text-[#1A1815]">{x.tax_year}</span></>)}
          {x.line_items.length > 0 && (<><span className="text-[#5A5751]">Lines</span><span className="text-[#1A1815]">{x.line_items.length}{doc.plan && doc.plan.duplicates ? ` · ${doc.plan.duplicates} already in the books` : ''}</span></>)}
        </div>
      )}
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
            </li>
          ))}
        </ul>
      )}
      {doc.commitResult && !doc.commitResult.written && doc.status !== 'added' && <p className="text-[0.6875rem] text-[#8B6F47]">Not added: {doc.commitResult.reason}.</p>}
      {ready && doc.status !== 'added' && (
        <button type="button" disabled={busy || demo} onClick={() => onConfirm(doc)}
          className="text-xs uppercase tracking-wider px-4 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-40">
          {demo ? 'Demo — nothing is added' : `Add to the books${doc.plan && doc.plan.rows ? ` (${doc.plan.rows.length} new)` : ''}`}
        </button>
      )}
    </li>
  );
}

export default function BooksUpload({ hint = null, data = {}, debts = [], demo = false, commitImportedRows, addAccount, updateAccount, onClose }) {
  const store = useMemo(() => intakeStore({ demoMode: demo }), [demo]);
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [teach, setTeach] = useState([]);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const known = useMemo(() => ({
    accounts: data.accounts || [], entities: data.entities || [], transactions: data.transactions || [],
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
      await commitDoc(fresh, { store, sinks, known, demo });
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
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={!!busy}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-4 min-h-[44px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-50">
              <UiIcon name="upload" /> Choose files
            </button>
            <button type="button" onClick={() => cameraRef.current && cameraRef.current.click()} disabled={!!busy}
              className="text-xs uppercase tracking-wider px-4 min-h-[44px] border border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#FAF8F4] disabled:opacity-50">
              Take a photo
            </button>
            <input ref={inputRef} type="file" multiple className="sr-only" aria-label="Choose financial documents" data-testid="books-upload-input" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="sr-only" aria-label="Take a photo of a document" onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
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
                {shown.map((d) => <DocCard key={d.id} doc={d} onAnswer={onAnswer} onConfirm={onConfirm} busy={!!busy} demo={demo} today={today} acctName={acctName} />)}
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
