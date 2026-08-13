// =============================================================================
// DebtStatementUpload — upload a card statement where the CARD lives
// =============================================================================
// Darrell 2026-08-11, repeatedly: "uploader for the credit card statements",
// "can users upload credit card statements etc?", and finally "focus on the
// books and the import of the credit cards!!!!!!!!!!!!"
//
// Measured before this existed: BooksTransactions.jsx had 3 file inputs and
// Debts.jsx had ZERO. The import pipeline was real and proven — statementFileToCsv
// handles CSV, OFX and spreadsheets; planBulkImport dedupes against what is
// already stored — but it lived on the Transactions tab. A person dealing with a
// credit card goes to Debts, finds no way to give the app a statement, and
// concludes the app cannot read statements at all.
//
// So this is deliberately NOT a new import path. It reuses the proven one and
// adds the three things a DEBT needs that a transaction register does not:
//
//   1. THE HEADER FACTS. parseStatementSummary reads the statement's own block —
//      new balance, minimum due, PAYMENT DUE DATE, APR. The due date is the
//      field nothing in this codebase captured, and without it "how many did I
//      pay on time" is not computable from any data we hold.
//   2. A HOME FOR THE ROWS. provisionFromStatement creates the account and
//      vendor when the card has never been seen, and REUSES the existing account
//      when it has — a duplicate would silently split one card's history in two.
//   3. THE FORMAT, REMEMBERED. The bank's column layout is learned once and
//      recalled by header signature, and a changed header is re-learned rather
//      than forced through a stale map.
//
// Nothing is written until the person presses Import: the panel shows what it
// read, what it will create, and how many rows are new vs already present.
import React, { useRef, useState } from 'react';
import { statementFileToCsv, parseDelimitedToRows, findStatementHeader } from '../lib/statement-import.js';
import { planAccountImport } from '../lib/bulk-statement-import.js';
import { parseStatementSummary } from '../lib/debt-history.js';
import { fingerprintStatement, recallFormat, rememberFormat, provisionFromStatement } from '../lib/bank-formats.js';

const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const money = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

export default function DebtStatementUpload({
  debt = null,
  accounts = [],
  transactions = [],
  onImport = null,      // (rows, { accountId, account, vendor, summary }) => void
  storage = (typeof window !== 'undefined' ? window.localStorage : null),
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [read, setRead] = useState(null);

  const onFiles = async (files) => {
    const file = (files || [])[0];
    if (!file) return;
    setBusy(`Reading ${file.name}…`); setError(''); setRead(null);
    try {
      const text = await statementFileToCsv(file);
      const parsed = parseDelimitedToRows(text);
      const header = findStatementHeader(String(text).split(/\r?\n/)) || {};
      const fp = fingerprintStatement({ headerCells: header.cells || [], text });
      const summary = parseStatementSummary(text);
      const recall = recallFormat(fp, storage);
      const targetId = (debt && debt.accountId) || null;
      const prov = provisionFromStatement(fp, { accounts, summary, entityId: debt ? debt.entityId : null });
      const accountId = targetId || prov.existingAccountId || null;
      const plan = accountId
        ? planAccountImport(parsed.rows || [], accountId, transactions || [])
        : { toAdd: parsed.rows || [], duplicates: [] };
      setRead({ file: file.name, rows: parsed.rows || [], fp, summary, recall, prov, plan, accountId });
    } catch (e) {
      setError(`Could not read that file: ${(e && e.message) || 'unknown error'}`);
    } finally { setBusy(''); }
  };

  const commit = () => {
    if (!read || !onImport) return;
    rememberFormat(read.fp, storage, Date.now());
    onImport(read.plan.toAdd || [], {
      accountId: read.accountId,
      account: read.prov.account,
      vendor: read.prov.vendor,
      summary: read.summary,
    });
    setRead(null);
  };

  const s = read && read.summary;
  const newRows = read ? (read.plan.toAdd || []).length : 0;
  const dupes = read ? (read.plan.duplicates || []).length : 0;

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mt-2" data-testid="debt-statement-upload">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[0.6875rem] uppercase tracking-wider text-[#1A1815] font-semibold">
          Upload a statement
        </span>
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt,.ofx,.qfx,.xls,.xlsx"
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      <p className="text-[0.625rem] text-[#5A5751] mt-1">
        CSV, OFX/QFX or a spreadsheet, straight from the card&rsquo;s website. Nothing is saved until you press Import.
      </p>

      {busy && <p className="text-[0.6875rem] text-[#5A5751] mt-2" aria-live="polite">{busy}</p>}
      {error && <p className="text-[0.6875rem] text-[#7A1F1F] mt-2" role="alert">{error}</p>}

      {read && (
        <div className="mt-3 border-t border-[#E8E4DC] pt-2 space-y-2">
          <p className="text-[0.6875rem] text-[#1A1815]">
            <span className="font-semibold">{read.file}</span> · {read.rows.length} rows read
            {read.fp.bankLabel ? ` · ${read.fp.bankLabel}` : ''}
            {read.fp.fragment ? ` ••${read.fp.fragment}` : ''}
          </p>

          {/* What the statement's own header block said. Absent fields stay
              absent — a statement we could not read yields nothing rather than
              a guess, and the panel says which fields were found. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.6875rem]" style={MONO}>
            <span className="text-[#5A5751]">Statement balance</span><span className="text-[#1A1815]">{money(s && s.statementBalance)}</span>
            <span className="text-[#5A5751]">Minimum due</span><span className="text-[#1A1815]">{money(s && s.minimumPayment)}</span>
            <span className="text-[#5A5751]">Payment due</span>
            <span className="text-[#1A1815]">{s && s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '—'}</span>
            <span className="text-[#5A5751]">APR</span><span className="text-[#1A1815]">{s && s.apr != null ? `${s.apr}%` : '—'}</span>
          </div>
          {s && !s.dueDate && (
            <p className="text-[0.625rem] text-[#8B6F47]">
              No payment due date in this file — on-time / late cannot be counted until one is known.
            </p>
          )}

          {read.recall.status === 'remembered' && (
            <p className="text-[0.625rem] text-[#5A6E3D]">Known layout — this bank has been read before.</p>
          )}
          {read.recall.status === 'changed' && (
            <p className="text-[0.625rem] text-[#8B6F47]">
              This bank&rsquo;s column layout changed since last time. Re-reading it fresh rather than trusting the old map.
            </p>
          )}

          {read.prov.account && (
            <p className="text-[0.6875rem] text-[#1A1815]">
              Will create <span className="font-semibold">{read.prov.account.name}</span> and its vendor — this card has not been seen before.
            </p>
          )}

          <p className="text-[0.6875rem] text-[#1A1815]">
            <span className="font-semibold">{newRows}</span> new
            {dupes > 0 ? <> · <span className="text-[#5A5751]">{dupes} already imported</span></> : null}
          </p>

          <button
            type="button"
            onClick={commit}
            disabled={newRows === 0 && !read.prov.account}
            className="text-[0.6875rem] uppercase tracking-wider px-4 py-2 min-h-[40px] border-2 border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-40 disabled:hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            Import {newRows} transaction{newRows === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </div>
  );
}
