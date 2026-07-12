// =============================================================================
// RecordGiving — the steward's "Record Giving" surface (church, staff-only)
// =============================================================================
// DP 2026-07-12: "easy add cash money to a user's records" + "bulk add excel
// records" + "Givelify and other money records are added together... clean
// records for transparency and stewardship." Three jobs on ONE ledger:
//   1. Add ONE cash gift fast (the Sunday plate).
//   2. Bulk-import a spreadsheet (Givelify/Zelle/Cash App/PayPal/check exports),
//      DEDUPED so a re-upload can never double-count.
//   3. See the year-to-date total by fund + method (real rows, never painted).
//
// All logic is the tested pure engine (lib/giving-records.js); this is the UI +
// the SheetJS parse. Persists through givingRecords (doc-rail, steward-only RLS,
// migration 0096). RECORDS gifts already received — the app never processes
// payments. Staff-gated at the mount (isChurchStaff) AND by RLS (owner/admin).
// =============================================================================
import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import TabHelp from './TabHelp.jsx';
import {
  normalizeGift, planGivingImport, guessGivingColumns, mapSheetRows, GIFT_METHODS,
  monthlyGivingReport, givingMonthsAvailable,
} from '../lib/giving-records.js';

// The short walkthrough for this tab (per-tab-tutorial-way). Kept next to the
// surface it describes, so it moves when the surface moves. 5 steps, plain words.
const HELP_STEPS = [
  'Add one gift fast: type the giver’s name and amount, pick the date and method (cash is the default), and tap "Record gift."',
  'Bring in a spreadsheet: tap "choose a file" and pick a Givelify, Zelle, Cash App, PayPal, or check export (.xlsx or .csv). The giver, amount, and date columns are matched for you.',
  'Before it saves, you see "N new · M already recorded · K need a fix" — anything already in the ledger is skipped, so importing the same file twice never double-counts.',
  'The "This year" box and the "Monthly report" fill themselves from the gifts — no adding up by hand.',
  'For the trustees: pick the month and tap "Print." The report is figured from the ledger, so the total is always right.',
];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const INK = '#1A1815';
const CREAM = '#FAF8F4';
const RUST = '#B85838';
const OLIVE = '#5A6E3D';
const MUTE = '#5A5751';
const money = (n) => `$${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const field = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const label = 'text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1 block';

export default function RecordGiving({ records = [], addRecord, deleteRecord }) {
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({ member: '', amount: '', date: todayIso, method: 'cash', fund: 'General' });
  const [formError, setFormError] = useState('');
  const [plan, setPlan] = useState(null);      // { valid, invalid, duplicates, totalNew, fileName }
  const [importError, setImportError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const thisYear = useMemo(() => new Date().getFullYear(), []);
  const ytd = useMemo(() => {
    const rows = (records || []).filter((r) => Number(r.taxYear) === thisYear);
    const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const byFund = {}; const byMethod = {};
    for (const r of rows) {
      byFund[r.fund || 'General'] = (byFund[r.fund || 'General'] || 0) + (Number(r.amount) || 0);
      byMethod[r.method || 'cash'] = (byMethod[r.method || 'cash'] || 0) + (Number(r.amount) || 0);
    }
    return { count: rows.length, total, byFund, byMethod };
  }, [records, thisYear]);

  const recent = useMemo(
    () => [...(records || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 25),
    [records],
  );

  // The monthly report — computed, never hand-compiled. Default to the newest
  // month that actually has gifts (givingMonthsAvailable), else this month.
  const months = useMemo(() => givingMonthsAvailable(records), [records]);
  const [reportYm, setReportYm] = useState('');
  const activeYm = reportYm || months[0] || new Date().toISOString().slice(0, 7);
  const report = useMemo(() => {
    const [y, m] = activeYm.split('-').map(Number);
    return monthlyGivingReport(records, { year: y, month: m });
  }, [records, activeYm]);
  const reportLabel = (() => { const [y, m] = activeYm.split('-').map(Number); return `${MONTH_NAMES[(m || 1) - 1]} ${y}`; })();

  function submitOne(e) {
    e.preventDefault();
    const r = normalizeGift(form);
    if (!r.ok) { setFormError(r.errors.join(' · ')); return; }
    setFormError('');
    if (addRecord) addRecord(r.gift);
    setForm({ member: '', amount: '', date: form.date, method: form.method, fund: form.fund });
  }

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true); setImportError(''); setPlan(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!rows.length) { setImportError('That sheet has no rows.'); setBusy(false); return; }
      const colMap = guessGivingColumns(Object.keys(rows[0]));
      if (!colMap.member || !colMap.amount || !colMap.date) {
        setImportError(`Could not find giver / amount / date columns. Headers seen: ${Object.keys(rows[0]).join(', ')}`);
        setBusy(false); return;
      }
      const p = planGivingImport(mapSheetRows(rows, colMap), records);
      setPlan({ ...p, fileName: file.name });
    } catch (err) {
      setImportError(`Could not read that file: ${err && err.message ? err.message : 'unknown error'}`);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function commitImport() {
    if (!plan || !addRecord) return;
    for (const g of plan.valid) addRecord(g);
    setPlan(null);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8" style={{ color: INK }}>
      <header>
        <div className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold" style={{ color: RUST }}>Stewardship · Steward only</div>
        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Record Giving</h2>
        <p className="text-sm mt-1" style={{ color: MUTE }}>
          One clean ledger — cash, check, and online (Givelify, Zelle, Cash App, PayPal) together. This records gifts already received; no money is processed here.
        </p>
      </header>

      <TabHelp title="How to use Record Giving" steps={HELP_STEPS} />

      {/* YEAR TO DATE — real rows, never painted */}
      <section aria-labelledby="ytd-h" className="border p-4" style={{ borderColor: INK, background: CREAM }}>
        <h3 id="ytd-h" className="text-[0.625rem] uppercase tracking-[0.25em] mb-2" style={{ color: MUTE }}>{thisYear} year to date</h3>
        {ytd.count === 0 ? (
          <p className="text-sm" style={{ color: MUTE }}>No gifts recorded yet this year. Add one below, or import a spreadsheet.</p>
        ) : (
          <>
            <div className="text-3xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{money(ytd.total)}</div>
            <div className="text-xs mb-2" style={{ color: MUTE }}>{ytd.count} gift{ytd.count === 1 ? '' : 's'} recorded</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ytd.byMethod).map(([m, v]) => (
                <span key={m} className="px-2 py-0.5 text-[0.6875rem] border" style={{ borderColor: '#C9C2B6', color: INK }}>{m}: {money(v)}</span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* MONTHLY REPORT — computed for the trustees, never hand-compiled */}
      <section aria-labelledby="rep-h" className="border p-4 print:border-0" style={{ borderColor: INK }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h3 id="rep-h" className="text-[0.625rem] uppercase tracking-[0.25em]" style={{ color: MUTE }}>Monthly report · for the trustees</h3>
          <div className="flex items-center gap-2 print:hidden">
            {months.length > 0 && (
              <select aria-label="Report month" className="p-1.5 border border-[#E8E4DC] text-sm bg-white" value={activeYm} onChange={(e) => setReportYm(e.target.value)}>
                {months.map((ym) => { const [y, m] = ym.split('-').map(Number); return <option key={ym} value={ym}>{MONTH_NAMES[m - 1]} {y}</option>; })}
              </select>
            )}
            <button type="button" onClick={() => window.print()} disabled={report.count === 0} className="min-h-[40px] px-3 text-xs uppercase tracking-wider border disabled:opacity-50 focus:outline focus:outline-2" style={{ borderColor: INK, color: INK, outlineColor: RUST }}>Print</button>
          </div>
        </div>
        <div className="text-lg" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>The Church of the Living God — Giving, {reportLabel}</div>
        {report.count === 0 ? (
          <p className="text-sm mt-1" style={{ color: MUTE }}>No gifts recorded for this month yet — the report fills itself as gifts are recorded or imported.</p>
        ) : (
          <>
            <div className="text-3xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{money(report.total)}</div>
            <div className="text-xs mb-3" style={{ color: MUTE }}>{report.count} gift{report.count === 1 ? '' : 's'} · totals below are computed from the ledger, not compiled by hand</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: MUTE }}>By fund</div>
                <ul className="text-sm">
                  {Object.entries(report.byFund).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b py-1" style={{ borderColor: '#E8E4DC' }}><span>{k}</span><span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{money(v)}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: MUTE }}>By method</div>
                <ul className="text-sm">
                  {Object.entries(report.byMethod).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <li key={k} className="flex justify-between border-b py-1" style={{ borderColor: '#E8E4DC' }}><span>{k}</span><span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{money(v)}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      {/* EASY ADD — one cash gift, fast */}
      <section aria-labelledby="add-h">
        <h3 id="add-h" className="text-[0.625rem] uppercase tracking-[0.25em] mb-2 pb-2 border-b" style={{ color: MUTE, borderColor: INK }}>Add a gift</h3>
        <form onSubmit={submitOne} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="g-member">Giver name</label>
            <input id="g-member" className={field} value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} placeholder="e.g. DP, or Sister Mary" />
          </div>
          <div>
            <label className={label} htmlFor="g-amount">Amount</label>
            <input id="g-amount" className={field} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="$0.00" />
          </div>
          <div>
            <label className={label} htmlFor="g-date">Gift date</label>
            <input id="g-date" type="date" className={field} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="g-method">Method</label>
            <select id="g-method" className={field} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {GIFT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="g-fund">Fund</label>
            <input id="g-fund" className={field} value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })} placeholder="General" />
          </div>
          {formError && <p className="sm:col-span-2 text-sm" style={{ color: RUST }} role="alert">{formError}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className="min-h-[48px] px-5 text-sm uppercase tracking-wider font-semibold text-white focus:outline focus:outline-2" style={{ background: OLIVE, outlineColor: INK }}>Record gift</button>
          </div>
        </form>
      </section>

      {/* BULK IMPORT — Givelify/Zelle/Cash App/PayPal/check exports, deduped */}
      <section aria-labelledby="imp-h">
        <h3 id="imp-h" className="text-[0.625rem] uppercase tracking-[0.25em] mb-2 pb-2 border-b" style={{ color: MUTE, borderColor: INK }}>Bulk import a spreadsheet</h3>
        <p className="text-xs mb-2" style={{ color: MUTE }}>
          Drop a Givelify / Zelle / Cash App / PayPal / check export (.xlsx or .csv). Rows are matched to giver / amount / date automatically, and any gift already in the ledger is skipped — a re-import can never double-count.
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} aria-label="Choose a giving spreadsheet to import" className="text-sm" />
        {busy && <p className="text-sm mt-2" role="status" style={{ color: MUTE }}>Reading the sheet…</p>}
        {importError && <p className="text-sm mt-2" role="alert" style={{ color: RUST }}>{importError}</p>}
        {plan && (
          <div className="mt-3 border p-3" style={{ borderColor: INK, background: CREAM }}>
            <div className="text-sm font-semibold mb-1">{plan.fileName}</div>
            <div className="flex flex-wrap gap-2 text-[0.6875rem]">
              <span className="px-2 py-0.5 border" style={{ borderColor: OLIVE, color: INK }}>{plan.totalNew} new</span>
              <span className="px-2 py-0.5 border" style={{ borderColor: '#C9C2B6', color: MUTE }}>{plan.duplicates.length} already recorded (skipped)</span>
              <span className="px-2 py-0.5 border" style={{ borderColor: plan.invalid.length ? RUST : '#C9C2B6', color: plan.invalid.length ? RUST : MUTE }}>{plan.invalid.length} need a fix</span>
            </div>
            {plan.invalid.length > 0 && (
              <ul className="mt-2 text-[0.6875rem] list-disc pl-4" style={{ color: RUST }}>
                {plan.invalid.slice(0, 5).map((iv) => <li key={iv.index}>Row {iv.index + 2}: {iv.errors.join(', ')}</li>)}
                {plan.invalid.length > 5 && <li>…and {plan.invalid.length - 5} more</li>}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={commitImport} disabled={plan.totalNew === 0} className="min-h-[44px] px-4 text-sm uppercase tracking-wider font-semibold text-white disabled:opacity-50 focus:outline focus:outline-2" style={{ background: OLIVE, outlineColor: INK }}>Import {plan.totalNew} gift{plan.totalNew === 1 ? '' : 's'}</button>
              <button type="button" onClick={() => setPlan(null)} className="min-h-[44px] px-4 text-sm uppercase tracking-wider" style={{ color: MUTE }}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      {/* RECENT — the real rows */}
      {recent.length > 0 && (
        <section aria-labelledby="rec-h">
          <h3 id="rec-h" className="text-[0.625rem] uppercase tracking-[0.25em] mb-2 pb-2 border-b" style={{ color: MUTE, borderColor: INK }}>Recent gifts</h3>
          <ul className="divide-y" style={{ borderColor: '#E8E4DC' }}>
            {recent.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm border-b" style={{ borderColor: '#E8E4DC' }}>
                <span className="min-w-0">
                  <span className="font-semibold">{r.member}</span>
                  <span style={{ color: MUTE }}> · {r.date} · {r.method} · {r.fund}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{money(r.amount)}</span>
                  {deleteRecord && <button type="button" onClick={() => deleteRecord(r.id)} aria-label={`Remove the ${money(r.amount)} gift from ${r.member}`} className="text-[0.625rem] uppercase tracking-wider focus:outline focus:outline-2" style={{ color: RUST, outlineColor: RUST }}>Remove</button>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
