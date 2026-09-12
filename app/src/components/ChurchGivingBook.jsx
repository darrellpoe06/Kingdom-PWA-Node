// =============================================================================
// ChurchGivingBook -- the steward's contribution book (Church office surface).
// =============================================================================
// THE WORK THIS REPLACES, in the steward's own words from the Love Corner
// planning meeting on 2026-09-11: "the transfer, put it in Excel, then put it
// in my other report, then create the reports for the end of the month."
//
// One Cash App transfer lands in the bank as a single deposit covering many
// people's gifts. The statement already itemises who gave, when, how much, and
// what they wrote on it. Every number she was re-typing was already in a file.
// So: upload the statement, the lump is split back into the gifts it was made
// of, the split is reconciled against what the bank actually shows, and the
// month-end reports fall out of the same rows.
//
// WHAT THIS READS AND WRITES (DR-0061 reality-trace, stated before the code):
//   * reads  -- the steward's OWN uploaded Cash App export (a real file she
//               holds) and church_giving_batches / church_giving_claims /
//               church_giving_aliases (0214), the office's own book.
//   * writes -- those same three tables, and nothing else.
//   * never touches giving_records (0184). That is the GIVER'S private ledger,
//     owner-only, and this surface has no business reading it. The two books
//     are never joined; see 0214's header for why, and
//     church-giving-book-wall.test.js for the gate that keeps it that way.
//   * never renders on, links to, or joins the member record (0209), which
//     refuses to carry a giving amount by construction so that a congregation
//     does not get quietly sorted by what people give.
//
// NOTHING IS WRITTEN UNTIL A PERSON PRESSES THE BUTTON. Reading a file shows
// what was found and changes nothing. This matters more here than on an
// ordinary import: a wrong row in the contribution book becomes a wrong number
// on somebody's giving record.
//
// THE APP NEVER DECIDES WHO SOMEBODY IS. Cash App shows a display name, which
// is frequently not the name on the roll. The matcher PROPOSES and a person
// CONFIRMS -- a wrong guess here would put one member's money on another
// member's record, so there is no confidence level at which it self-applies.
// Ties are shown as ties. "Not yet identified" is a normal, permanent state
// that keeps the giver's name and their money on the books either way.
//
// TOTALS ARE NEVER FORCED TO AGREE. If the gifts do not sum to the deposit the
// bank shows, the difference is displayed with its exact cent value and a
// sentence saying what it probably means. A balanced report that was nudged is
// worse than an honest one that does not balance, because only the second gets
// looked at (DR-0076).
//
// Accessible + theme-safe by construction, like every other church surface:
// themeable classes only (no inline colors, so the per-theme contrast gate
// holds), rem-based text that tracks the global large-print primitive, real
// <table> semantics with scope'd headers, every control keyboard-reachable,
// and each async state announced rather than left to a spinner.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { statementFileToCsv, parseCsvLine } from '../lib/statement-import.js';
import { parseCashAppStatement, findCashAppHeader, giftsOf, payoutsOf } from '../lib/cashapp-statement.js';
import { planGivingBatch, batchGiftsByPayout, reconcileBatch } from '../lib/giving-batch.js';
import { proposeDonorMatches, reviewQueue, normalizeName, BASIS } from '../lib/giving-donor-match.js';
import {
  givingByMonthReport, givingByGiverReport, giverStatement,
  reportToCsv, UNIDENTIFIED_LABEL,
} from '../lib/giving-reports.js';
import { downloadText } from '../lib/report-export.js';
import { listInstanceMembers } from '../lib/member-roles.js';
import {
  fetchBatches, fetchClaims, fetchAliases,
  importBatch, confirmClaimGiver, setDeposit, removeBatch,
} from '../lib/church-giving-book-sync.js';

const money = (cents) => {
  const n = Math.round(Number(cents) || 0);
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  return `${sign}$${(Math.floor(a / 100)).toLocaleString()}.${String(a % 100).padStart(2, '0')}`;
};

const labelCls = 'block text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mb-1';
const fieldCls = 'w-full border border-[#1A1815] bg-white px-2 py-2 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnCls = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[44px] bg-[#1A1815] text-white hover:bg-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnGhost = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[44px] border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]';

// The four honest outcomes the sync layer can return, each said in words a
// steward can act on. 'forbidden' is deliberately NOT "no records yet": being
// told the book is empty when in fact you may not read it is the kind of quiet
// lie the Verification Doctrine exists to prevent.
const REASON_TEXT = {
  'signed-out': 'You are signed out. Sign in with your church account to open the giving book.',
  'no-church': 'This device is not linked to a church yet, so there is no book to open.',
  forbidden: 'The giving book belongs to the church office. Your account does not have office access, so nothing is shown here.',
  error: 'The giving book could not be loaded just now. This is a connection problem, not an empty book — try again in a moment.',
};

// ReportTable -- one rendering for every report model giving-reports.js builds
// (by month, by giver, and one person's own record). They share a column set
// and a group/subtotal/total shape, so they share a renderer: three copies of
// this markup would drift, and a total that renders differently on two pages is
// how a steward loses confidence in both.
//
// The table is real table semantics -- scope'd headers, a caption, a tfoot --
// so somebody reading it with a screen reader hears which column a number is
// in, and it lives in its own overflow-x container so a six-column money table
// can be read on a phone without the whole page sliding sideways.
function ReportTable({ model, onDownload }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{model.title}</h4>
        {onDownload && (
          <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => onDownload(model)}>Download CSV</button>
        )}
      </div>
      <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{model.note}</p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-xs border-collapse">
          <caption className="sr-only">{model.title}</caption>
          <thead>
            <tr>
              {model.columns.map((col) => (
                <th key={col.key} scope="col" className="text-left border-b border-[#1A1815] py-1 pr-2 font-semibold">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.groups.map((g) => (
              <React.Fragment key={g.key || g.label}>
                <tr><th scope="rowgroup" colSpan={model.columns.length} className="text-left pt-2 font-semibold">{g.label}</th></tr>
                {g.rows.map((r, i) => (
                  <tr key={`${g.key || g.label}-${i}`} className="border-b border-[#E8E4DC]">
                    <td className="py-1 pr-2">{r.date}</td>
                    <td className="py-1 pr-2">{r.time}</td>
                    <td className="py-1 pr-2">{r.giver}</td>
                    <td className="py-1 pr-2">{r.note}</td>
                    <td className="py-1 pr-2">{r.method}</td>
                    <td className="py-1 text-right">{money(r.amountCents)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={model.columns.length - 1} className="py-1 text-right font-semibold">Subtotal</td>
                  <td className="py-1 text-right font-semibold">{money(g.subtotal.cents)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={model.columns.length - 1} className="py-1 text-right font-semibold border-t-2 border-[#1A1815]">Total</td>
              <td className="py-1 text-right font-semibold border-t-2 border-[#1A1815]">{money(model.total.cents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{model.provenance}</p>
    </div>
  );
}

export default function ChurchGivingBook({ churchName = '', instanceId = null }) {
  const [view, setView] = useState('import');
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [batches, setBatches] = useState([]);
  const [claims, setClaims] = useState([]);
  const [aliases, setAliases] = useState({});
  const [parishioners, setParishioners] = useState([]);

  // Import staging -- read but NOT saved.
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState('');
  const [readError, setReadError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [depositDraft, setDepositDraft] = useState({});
  const [statementFor, setStatementFor] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, c, a] = await Promise.all([
      fetchBatches(churchName),
      fetchClaims(churchName),
      fetchAliases(churchName),
    ]);
    // Any one refusal is the whole surface's answer: a partial book shown as a
    // whole one would misreport the month's total.
    const bad = [b, c, a].find((r) => !r.ok);
    setReason(bad ? bad.reason : '');
    setBatches(b.ok ? b.batches : []);
    setClaims(c.ok ? c.claims : []);
    setAliases(a.ok ? a.aliases : {});
    setLoading(false);
  }, [churchName]);

  useEffect(() => { load(); }, [load]);

  // The roster the matcher proposes FROM, in its own effect on purpose. If it
  // fails to read, matching degrades to "no member resembles this name" and
  // every gift still shows with its sender and its money -- the book must never
  // go blank because a directory lookup hiccuped.
  //
  // list_instance_members returns userId; proposeDonorMatches wants id. The
  // rename happens here, once, rather than being assumed to line up.
  useEffect(() => {
    let alive = true;
    if (!instanceId) { setParishioners([]); return undefined; }
    listInstanceMembers(instanceId)
      .then((rows) => {
        if (!alive) return;
        setParishioners((rows || []).map((r) => ({
          id: r.userId,
          displayName: r.displayName || r.email || '',
        })).filter((r) => r.id && r.displayName));
      })
      .catch(() => { if (alive) setParishioners([]); });
    return () => { alive = false; };
  }, [instanceId]);

  // Who a confirmed member is, for the reports' giver column.
  const directory = useMemo(
    () => Object.fromEntries(parishioners.map((p) => [p.id, p.displayName])),
    [parishioners],
  );

  // -------------------------------------------------------------------------
  // Reading a file. Changes nothing that is saved.
  // -------------------------------------------------------------------------
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setReadError(''); setParsed(null); setNotice('');
    setFileName(file.name);
    try {
      const text = await statementFileToCsv(file);
      const lines = String(text).split(/\r?\n/).filter((l) => l.trim() !== '').map(parseCsvLine);
      const found = findCashAppHeader(lines);
      if (found.headerRow === -1) {
        setReadError('This file does not have the columns a Cash App statement has — at minimum a date and an amount. Nothing was read.');
        return;
      }
      const p = parseCashAppStatement({ header: found.header, rows: found.rows });
      if (!p.recognized) {
        setReadError(`The statement is missing: ${p.missingRoles.join(', ')}. Nothing was read.`);
        return;
      }
      setParsed(p);
    } catch {
      setReadError('The file could not be opened. If it came from a phone, try exporting it again as CSV.');
    }
  };

  // The plan: gifts grouped under the payout that carried them to the bank.
  const plan = useMemo(() => {
    if (!parsed) return null;
    const gifts = giftsOf(parsed);
    const payouts = payoutsOf(parsed);
    const grouped = batchGiftsByPayout(gifts, payouts);
    const planned = grouped.map((g) => planGivingBatch({ gifts: g.gifts, payout: g.payout }));
    // Who each sender IS is deliberately NOT worked out here. Matching happens
    // against saved claims on the "Who gave" tab, after the steward has chosen
    // to import -- proposing identities for rows that may never be saved would
    // invite confirming a person onto a gift that does not exist yet.
    return { planned, giftCount: gifts.length, payoutCount: payouts.length };
  }, [parsed]);

  const doImport = async (one) => {
    setBusy('import'); setNotice('');
    const res = await importBatch(one, churchName);
    setBusy('');
    if (!res.ok) {
      setNotice(res.reason === 'unreferenced'
        ? `Not imported. ${res.unreferenced} row(s) carry no transaction id, so a re-import could not tell them from new gifts.`
        : `Not imported. ${REASON_TEXT[res.reason] || 'Something went wrong and nothing was saved.'}`);
      return;
    }
    setNotice(res.skipped
      ? `Imported ${res.inserted} gift(s). ${res.skipped} were already in the book from an earlier upload and were not added again.`
      : `Imported ${res.inserted} gift(s).`);
    await load();
  };

  const onConfirm = async (claim, parishionerId, personName) => {
    setBusy(claim.id);
    const res = await confirmClaimGiver(claim.id, parishionerId, churchName, {
      statementName: claim.giverName, personName,
    });
    setBusy('');
    if (!res.ok) { setNotice(REASON_TEXT[res.reason] || 'That could not be saved.'); return; }
    await load();
  };

  // saveDeposit -- the steward types what her BANK actually shows for a
  // transfer. This is deliberately hand-entered and never inferred from the
  // file we just imported: reconciling a statement against itself always
  // balances and proves nothing. The bank is the independent witness.
  const saveDeposit = async (batch) => {
    const raw = String(depositDraft[batch.id] ?? '').trim();
    if (raw === '') return;
    const cents = Math.round(parseFloat(raw.replace(/[$,]/g, '')) * 100);
    if (!Number.isFinite(cents)) { setNotice('That deposit amount could not be read. Enter it as a number, for example 1240.55'); return; }
    setBusy(batch.id);
    const res = await setDeposit(batch.id, cents, churchName);
    setBusy('');
    if (!res.ok) { setNotice(REASON_TEXT[res.reason] || 'That could not be saved.'); return; }
    await load();
  };

  // savedReconciliation -- does a SAVED batch tie to the bank figure the steward
  // entered? Runs the same reconcileBatch primitive the import preview uses, so
  // the number cannot disagree between the two screens. With no bank figure
  // entered yet it says so plainly instead of reporting a tie it has not
  // checked -- an unchecked batch must never read as a balanced one (DR-0076).
  const savedReconciliation = useCallback((b) => {
    if (b.depositCents == null) {
      return { balanced: false, summary: 'Not checked yet — enter what the bank shows for this transfer.' };
    }
    const r = reconcileBatch({
      depositCents: b.depositCents,
      giftsGrossCents: b.grossCents,
      feesCents: b.feesCents,
      giftsNetCents: b.onlineTotalCents,
      claimCount: b.giftCount,
    });
    return {
      balanced: r.balanced,
      summary: r.summary || (r.balanced
        ? 'The gifts tie to the deposit exactly.'
        : 'The gifts do not tie to the deposit.'),
    };
  }, []);

  // -------------------------------------------------------------------------
  // Reports -- derived from the SAVED rows, never from the staged file.
  // -------------------------------------------------------------------------
  const meta = useMemo(() => ({ Church: churchName || 'This church', Prepared: new Date().toLocaleDateString() }), [churchName]);
  const monthReport = useMemo(() => givingByMonthReport(claims, { directory, meta }), [claims, directory, meta]);
  const giverReport = useMemo(() => givingByGiverReport(claims, { directory, meta }), [claims, directory, meta]);
  const unmatched = useMemo(() => claims.filter((c) => !c.parishionerId), [claims]);

  const proposalsForSaved = useMemo(() => {
    const names = [...new Set(unmatched.map((c) => c.giverName).filter(Boolean))];
    return proposeDonorMatches(names, parishioners, aliases);
  }, [unmatched, parishioners, aliases]);

  const proposalsByName = useMemo(
    () => new Map(proposalsForSaved.map((p) => [p.normalized, p])),
    [proposalsForSaved],
  );

  const queue = useMemo(() => reviewQueue(proposalsForSaved), [proposalsForSaved]);

  // One person's record. The selector's value is the giver-report GROUP key,
  // which is 'id:<uuid>' for a confirmed member and 'raw:<name>' for a sender
  // nobody has matched yet -- so an unidentified giver can still be handed
  // their own record, which is precisely who most often asks for one.
  const personStatement = useMemo(() => {
    if (!statementFor) return null;
    const [kind, ...rest] = String(statementFor).split(':');
    const value = rest.join(':');
    return giverStatement(claims, {
      parishionerId: kind === 'id' ? value : null,
      giverName: kind === 'raw' ? value : null,
      directory,
      meta,
    });
  }, [statementFor, claims, directory, meta]);

  const download = useCallback((model) => {
    downloadText(reportToCsv(model), `${model.title.replace(/[^\w]+/g, '-').toLowerCase()}.csv`, 'text/csv;charset=utf-8');
  }, []);

  if (loading) {
    return <p role="status" className="text-sm text-[#5A5751] p-4">Opening the giving book…</p>;
  }

  if (reason) {
    return (
      <section className="bg-white border border-[#1A1815] p-4" aria-labelledby="gb-blocked">
        <h2 id="gb-blocked" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">Giving book</h2>
        <p role="status" className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          {REASON_TEXT[reason] || REASON_TEXT.error}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#B85838] p-4">
        <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">The Giving Book</h2>
        <p className="text-sm leading-relaxed text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          One transfer arrives at the bank carrying many people’s gifts. Upload the Cash App statement and the
          deposit is split back into the gifts it was made of, with the date, the time and the note each giver wrote.
        </p>
        <p className="text-xs text-[#5A5751] mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
          This is the church office’s working record. It is not a member’s own giving history, and it is not a
          church-issued tax statement.
        </p>
      </section>

      <div role="tablist" aria-label="Giving book sections" className="flex gap-2 flex-wrap">
        {[
          ['import', 'Import a statement'],
          ['review', `Who gave${queue.queue.length ? ` (${queue.queue.length})` : ''}`],
          ['reports', 'Reports'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={view === id ? btnCls : btnGhost}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <p role="status" className="text-sm bg-[#FAF8F4] border border-[#B85838] p-3" style={{ fontFamily: '"Fraunces", serif' }}>
          {notice}
        </p>
      )}

      {view === 'import' && (
        <section aria-labelledby="gb-import" className="bg-white border border-[#1A1815] p-4 space-y-3">
          <h3 id="gb-import" className={labelCls}>Import a Cash App statement</h3>
          <input
            ref={fileRef}
            id="gb-file"
            type="file"
            accept=".csv,.txt,.xls,.xlsx"
            onChange={onFile}
            className={fieldCls}
            aria-describedby="gb-file-help"
          />
          <p id="gb-file-help" className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Nothing is saved when you pick a file. You will see exactly what was read, and can then choose to import it.
          </p>

          {readError && <p role="alert" className="text-sm text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{readError}</p>}

          {parsed && plan && (
            <div className="space-y-3">
              <div className="bg-[#FAF8F4] border border-[#1A1815] p-3">
                <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
                  <strong>{fileName}</strong> — {parsed.reconciliation.sourceRows} row(s) read:{' '}
                  {parsed.reconciliation.accepted} understood, {parsed.reconciliation.rejected} not.{' '}
                  {plan.giftCount} gift(s) across {plan.payoutCount} transfer(s).
                </p>
                {/* Every source row is accounted for or the reader says so. A
                    quietly-dropped row is money missing from the book. */}
                <p className="text-xs mt-1 text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {parsed.reconciliation.balanced
                    ? 'Every row in the file is accounted for.'
                    : 'Some rows are not accounted for — do not import until this is understood.'}
                </p>
              </div>

              {plan.planned.map((p, i) => (
                <div key={p.batch.onlineBatchId || i} className="border border-[#1A1815] p-3">
                  <h4 className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
                    Transfer {p.batch.onlineBatchId || '(no id)'} — {p.batch.payoutOn || 'not yet paid out'}
                  </h4>
                  <ul className="text-xs mt-1 space-y-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                    <li>{p.batch.giftCount} gift(s), {money(p.batch.onlineTotalCents)} after fees</li>
                    <li>Fees {money(p.batch.feesCents)}</li>
                    <li>Bank deposit on the statement: {p.batch.depositCents == null ? 'not in this file' : money(p.batch.depositCents)}</li>
                  </ul>
                  <p className={`text-xs mt-2 ${p.reconciliation.balanced ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
                    {p.reconciliation.summary || (p.reconciliation.balanced ? 'The gifts tie to the deposit exactly.' : 'The gifts do not tie to the deposit.')}
                  </p>
                  <button type="button" className={`${btnCls} mt-2`} disabled={busy === 'import'} onClick={() => doImport(p)}>
                    {busy === 'import' ? 'Importing…' : 'Import this transfer'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {batches.length > 0 && (
            <div className="mt-4">
              <h4 className={labelCls}>Already in the book — does it tie to the bank?</h4>
              <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                Enter what your bank statement shows for each transfer. Checking the file against itself would always
                balance and would prove nothing — the bank is the independent witness.
              </p>
              <ul className="space-y-2">
                {batches.map((b) => {
                  const tie = savedReconciliation(b);
                  return (
                    <li key={b.id} className="border border-[#E8E4DC] p-2">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
                          {b.payoutOn || b.serviceDate || 'undated'} · {b.giftCount} gift(s) · {money(b.onlineTotalCents)} after fees
                        </span>
                        <button
                          type="button"
                          className="text-[0.625rem] uppercase tracking-wider text-[#B85838] underline min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                          onClick={async () => { await removeBatch(b.id, churchName); await load(); }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="flex gap-2 items-end flex-wrap mt-2">
                        <div>
                          <label className={labelCls} htmlFor={`dep-${b.id}`}>What the bank shows</label>
                          <input
                            id={`dep-${b.id}`}
                            inputMode="decimal"
                            className={fieldCls}
                            style={{ maxWidth: '10rem' }}
                            placeholder={b.depositCents == null ? '0.00' : undefined}
                            value={depositDraft[b.id] ?? (b.depositCents == null ? '' : (b.depositCents / 100).toFixed(2))}
                            onChange={(e) => setDepositDraft({ ...depositDraft, [b.id]: e.target.value })}
                          />
                        </div>
                        <button type="button" className={`${btnGhost} focus:outline focus:outline-2 focus:outline-[#B85838]`} disabled={busy === b.id} onClick={() => saveDeposit(b)}>
                          {busy === b.id ? 'Saving…' : 'Check it'}
                        </button>
                      </div>
                      <p
                        role="status"
                        className={`text-xs mt-2 ${tie.balanced ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
                        style={{ fontFamily: '"Fraunces", serif' }}
                      >
                        {tie.summary}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {view === 'review' && (
        <section aria-labelledby="gb-review" className="bg-white border border-[#1A1815] p-4">
          <h3 id="gb-review" className={labelCls}>Who gave — {unmatched.length} gift(s) not yet matched to a member</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Cash App shows the name on the sender’s account, which is often not the name on the roll. Nothing is matched
            automatically: a wrong match would put one member’s gift on another member’s record. A gift left unmatched
            still counts, and still shows the name the sender used.
          </p>
          {unmatched.length === 0 && (
            <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>Every gift in the book is matched to a member.</p>
          )}
          <ul className="space-y-2">
            {unmatched.map((c) => {
              // Proposals are keyed by NORMALIZED name, so the lookup must
              // normalize too -- matching on the raw string would miss every
              // name whose spacing or case differs, which is most of them.
              const prop = proposalsByName.get(normalizeName(c.giverName));
              const options = (prop && prop.candidates) || [];
              return (
                <li key={c.id} className="border border-[#E8E4DC] p-2">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{c.giverName || UNIDENTIFIED_LABEL}</span>
                    <span className="text-sm">{money(c.amountClaimedCents)} · {c.givenOn} {c.givenAt}</span>
                  </div>
                  {c.note && <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>“{c.note}”</p>}
                  {options.length > 0 ? (
                    <div className="mt-2">
                      <label className={labelCls} htmlFor={`m-${c.id}`}>
                        {prop.ambiguous ? 'More than one member matches equally — the office decides' : 'Suggested'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <select
                          id={`m-${c.id}`}
                          className={fieldCls}
                          style={{ maxWidth: '18rem' }}
                          defaultValue=""
                          onChange={(e) => {
                            const p = options.find((o) => o.parishionerId === e.target.value);
                            if (p) onConfirm(c, p.parishionerId, p.displayName || '');
                          }}
                        >
                          <option value="">Choose the member…</option>
                          {options.map((o) => (
                            <option key={o.parishionerId} value={o.parishionerId}>
                              {o.displayName}{o.basis === BASIS.ALIAS ? ' — confirmed before' : ` — matched on ${o.basis}`}
                            </option>
                          ))}
                        </select>
                        {busy === c.id && <span role="status" className="text-xs self-center">Saving…</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                      No member on the roll resembles this name. It stays on the books under the sender’s name.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {view === 'reports' && (
        <section aria-labelledby="gb-reports" className="bg-white border border-[#1A1815] p-4 space-y-4">
          <h3 id="gb-reports" className={labelCls}>Reports</h3>
          {claims.length === 0 && (
            <p className="text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
              Nothing has been imported yet, so there is nothing to report.
            </p>
          )}
          {claims.length > 0 && (
            <>
              <div>
                <label className={labelCls} htmlFor="gb-person">One person's record</label>
                <select
                  id="gb-person"
                  className={fieldCls}
                  style={{ maxWidth: '20rem' }}
                  value={statementFor || ''}
                  onChange={(e) => setStatementFor(e.target.value || null)}
                >
                  <option value="">Choose a giver…</option>
                  {giverReport.groups.map((g) => (
                    <option key={g.key} value={g.key}>{g.label}</option>
                  ))}
                </select>
                <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                  Every gift, with the date and the time it arrived and the note the giver wrote on it.
                </p>
              </div>

              {personStatement && <ReportTable model={personStatement} onDownload={download} />}
              <ReportTable model={monthReport} onDownload={download} />
              <ReportTable model={giverReport} onDownload={download} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
