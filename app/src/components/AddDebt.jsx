// AddDebt — add a debt by hand, or paste a whole card list at once.
//
// Christina 2026-08-10: "take the following information and add it to the debts
// section ... and also make it so that I can add debts myself manually if
// needed. I don't have all interest rates or monthly payments input yet, but I
// will get them if you can add these and make it so that I can add the rest."
//
// Two things that request needs, and the Debts tab had neither:
//   · a plain ADD form. Every existing route onto this tab is a SUGGESTION —
//     the app spots a recurring payment, or an account that reads like a card,
//     and offers it. A card the app has never seen (a closed account, a gas
//     card, a business card with no feed) could only be added over on the
//     Accounts tab. Nothing let a person simply name a debt they hold.
//   · a way to enter MANY at once. Twenty-seven cards through a one-at-a-time
//     form is not an import, it is an afternoon.
//
// The governing rule in both paths: a field left blank stays UNKNOWN, and is
// never quietly stored as zero (DR-0076). "$0/mo" is a claim; a blank is the
// truth, and the tab's own "+ pay" / "+ rate" editors are how it gets filled in
// later. That is precisely the "add the rest" she asked for.
import React, { useState, useMemo } from 'react';
import { parseDebtList, debtRowToAccount, markDuplicates, summarizeRows } from '../lib/debt-import.js';

const fmt = (n) => (n == null || !isFinite(n) ? '—' : `$${Math.abs(Math.round(n)).toLocaleString()}`);
const fmtExact = (n) => (n == null || !isFinite(n) ? '—' : `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[40px] font-semibold focus:outline focus:outline-2 focus:outline-[#1A1815]';
const PRIMARY = `${BTN} bg-[#B85838] text-white hover:bg-[#1A1815]`;
const GHOST = `${BTN} border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`;
const INPUT = 'w-full text-sm px-2 py-2 min-h-[40px] border border-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1';

const BLANK = {
  name: '', entityId: '', balance: '', rate: '', minPayment: '',
  creditLimit: '', highestBalance: '', institution: '',
};

// A number the person actually typed, or null. '' / '   ' -> null, never 0.
const numOrNull = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/[$,\s]/g, ''));
  return isFinite(n) ? Math.abs(n) : null;
};

function AddDebt({ entities = [], addAccount, addAccounts, existingDebts = [] }) {
  const [mode, setMode] = useState(null); // null | 'one' | 'paste'
  const [form, setForm] = useState(BLANK);
  const [pasteText, setPasteText] = useState('');
  // Per-row overrides only. The DEFAULT is derived from the parse (duplicates
  // start off, everything else starts on), so re-pasting or editing the text
  // never leaves a stale checkbox behind.
  const [overrides, setOverrides] = useState({});
  const [entityFor, setEntityFor] = useState('');
  const [done, setDone] = useState(null);

  const defaultEntityId = (entities[0] && entities[0].id) || '';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // The paste preview recomputes straight from the text — no hidden state, so
  // what the family sees IS what will be added.
  const parsed = useMemo(() => {
    if (!pasteText.trim()) return null;
    const { rows, skipped: ignored } = parseDebtList(pasteText);
    return { rows: markDuplicates(rows, existingDebts), ignored };
  }, [pasteText, existingDebts]);

  // Duplicates start unchecked; everything else starts checked.
  const isChecked = (r) => (r.index in overrides ? overrides[r.index] : !r.duplicate);
  const toggle = (r) => setOverrides((prev) => ({ ...prev, [r.index]: !isChecked(r) }));
  const chosen = useMemo(
    () => (parsed ? parsed.rows.filter((r) => (r.index in overrides ? overrides[r.index] : !r.duplicate)) : []),
    [parsed, overrides],
  );
  const summary = useMemo(() => summarizeRows(chosen), [chosen]);

  const submitOne = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    const rate = numOrNull(form.rate);
    const acct = {
      name, type: 'credit', treatAsDebt: true,
      balance: numOrNull(form.balance) ?? 0,
      entityId: form.entityId || defaultEntityId || null,
    };
    if (form.institution.trim()) acct.institution = form.institution.trim();
    // An explicitly typed rate — including a genuine 0% — is KNOWN. A blank is
    // not, and must not become a confirmed 0%.
    if (rate != null) { acct.rate = rate; acct.rateKnown = true; }
    const min = numOrNull(form.minPayment);
    if (min != null) acct.minPayment = min;
    const lim = numOrNull(form.creditLimit);
    if (lim != null) acct.creditLimit = lim;
    const high = numOrNull(form.highestBalance);
    if (high != null) acct.highestBalance = high;
    addAccount(acct);
    setDone({ count: 1, name });
    setForm(BLANK);
    setMode(null);
  };

  const submitPaste = () => {
    if (!chosen.length) return;
    const entityId = entityFor || defaultEntityId || null;
    const accounts = chosen.map((r) => debtRowToAccount(r, entityId));
    if (addAccounts) addAccounts(accounts);
    else accounts.forEach((a) => addAccount(a));
    setDone({ count: accounts.length, total: summary.totalBalance, missingPayment: summary.missingPayment, missingRate: summary.missingRate });
    setPasteText('');
    setOverrides({});
    setMode(null);
  };

  const entityOptions = (value, onChange, id) => (
    <select id={id} className={INPUT} value={value} onChange={onChange}>
      {!entities.length && <option value="">Personal</option>}
      {entities.map((e) => (
        <option key={e.id} value={e.id}>{String(e.name || '').split('(')[0].trim()}</option>
      ))}
    </select>
  );

  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">Add a debt</div>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>
            Any card, loan, or line of credit — including ones the app has never seen, like a closed account or a gas card.
            Leave anything you don't know yet blank; the tab will show what still needs filling in.
          </p>
        </div>
        {mode === null && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" className={PRIMARY} onClick={() => { setMode('one'); setDone(null); setForm({ ...BLANK, entityId: defaultEntityId }); }}>+ Add one</button>
            <button type="button" className={GHOST} onClick={() => { setMode('paste'); setDone(null); setEntityFor(defaultEntityId); }}>Paste a list</button>
          </div>
        )}
      </div>

      {done && mode === null && (
        <div className="border-2 border-[#5A6E3D] bg-[#F2F4EC] p-3 text-xs" style={serif}>
          <strong className="text-[#5A6E3D]">
            {done.count === 1 ? `Added "${done.name}".` : `Added ${done.count} debts${done.total ? ` · ${fmtExact(done.total)} owed` : ''}.`}
          </strong>
          {done.count > 1 && (done.missingPayment > 0 || done.missingRate > 0) && (
            <span className="text-[#5A5751]">
              {' '}They're on the table below. {done.missingPayment > 0 ? `${done.missingPayment} still need a monthly payment` : ''}
              {done.missingPayment > 0 && done.missingRate > 0 ? ' and ' : ''}
              {done.missingRate > 0 ? `${done.missingRate} still need a rate` : ''} — tap <strong>+ pay</strong> or <strong>+ rate</strong> on any row to fill them in.
            </span>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* One debt, by hand                                                 */}
      {/* ---------------------------------------------------------------- */}
      {mode === 'one' && (
        <form onSubmit={submitOne} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="debt-name">Account name <span className="text-[#B85838]">(required)</span></label>
              <input id="debt-name" className={INPUT} value={form.name} onChange={set('name')} placeholder="Capital One Platinum" autoFocus required />
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-entity">Whose / which entity</label>
              {entityOptions(form.entityId, set('entityId'), 'debt-entity')}
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-balance">Amount owed</label>
              <input id="debt-balance" className={INPUT} style={mono} inputMode="decimal" value={form.balance} onChange={set('balance')} placeholder="1550" />
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-rate">Interest rate %</label>
              <input id="debt-rate" className={INPUT} style={mono} inputMode="decimal" value={form.rate} onChange={set('rate')} placeholder="28.99" />
              <p className="text-[0.5625rem] text-[#5A5751] mt-1" style={serif}>Enter 0 only if it really is a 0% card — leave blank if you don't know it yet.</p>
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-min">Monthly payment</label>
              <input id="debt-min" className={INPUT} style={mono} inputMode="decimal" value={form.minPayment} onChange={set('minPayment')} placeholder="100" />
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-limit">Credit limit</label>
              <input id="debt-limit" className={INPUT} style={mono} inputMode="decimal" value={form.creditLimit} onChange={set('creditLimit')} placeholder="2000" />
            </div>
            <div>
              <label className={LABEL} htmlFor="debt-high">Highest balance</label>
              <input id="debt-high" className={INPUT} style={mono} inputMode="decimal" value={form.highestBalance} onChange={set('highestBalance')} placeholder="2001" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="submit" className={PRIMARY} disabled={!form.name.trim()}>Add debt</button>
            <button type="button" className={GHOST} onClick={() => { setMode(null); setForm(BLANK); }}>Cancel</button>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* A whole list, pasted                                              */}
      {/* ---------------------------------------------------------------- */}
      {mode === 'paste' && (
        <div className="space-y-3 pt-1">
          <div>
            <label className={LABEL} htmlFor="debt-paste">Paste your card list</label>
            <textarea
              id="debt-paste" className={`${INPUT} min-h-[180px]`} style={{ ...mono, fontSize: '0.75rem' }}
              value={pasteText} onChange={(e) => setPasteText(e.target.value)} autoFocus
              placeholder={'1. Capital One Platinum\nBalance: $1,550\nInterest: 28.99%\nAvailable credit: $450\nHighest balance: $2,001\nMonthly payment:\n\n2. CareCredit\nBalance: $863\nInterest: 32.99%\nMonthly payment: $30'}
            />
            <p className="text-[0.625rem] text-[#5A5751] mt-1" style={serif}>
              Numbered cards with labelled lines — Balance, Interest, Credit usage, Available credit, Highest balance, Monthly payment, Credit limit.
              Blank lines are fine and stay blank. Totals and notes are ignored.
            </p>
          </div>

          {parsed && parsed.rows.length === 0 && (
            <div className="border border-[#B85838] bg-[#FAF8F4] p-3 text-xs" style={serif}>
              Nothing recognized as a card yet. Each card needs a numbered name line, like <strong>1. Capital One Platinum</strong>, with its details on the lines below it.
            </div>
          )}

          {parsed && parsed.rows.length > 0 && (
            <>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">
                  Found {parsed.rows.length} · adding {chosen.length}
                </div>
                <div>
                  <label className={`${LABEL} inline mr-2`} htmlFor="paste-entity">Add all to</label>
                  <span className="inline-block w-40 align-middle">{entityOptions(entityFor, (e) => setEntityFor(e.target.value), 'paste-entity')}</span>
                </div>
              </div>

              <div className="border border-[#1A1815] overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-[#1A1815]">
                      <th className="text-left p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Add</th>
                      <th className="text-left p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account</th>
                      <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Owed</th>
                      <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Rate</th>
                      <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Pay</th>
                      <th className="text-right p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.map((r) => {
                      const on = isChecked(r);
                      return (
                        <tr key={r.index} className={`border-b border-[#E8E4DC] ${on ? '' : 'opacity-45'}`}>
                          <td className="p-2">
                            <input
                              type="checkbox" checked={on} onChange={() => toggle(r)}
                              className="w-5 h-5 accent-[#B85838] align-middle"
                              aria-label={`${on ? 'Skip' : 'Add'} ${r.name}`}
                            />
                          </td>
                          <td className="p-2">
                            <span style={{ ...serif, fontWeight: 500 }}>{r.name}</span>
                            {r.alreadyOnTab && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] ml-2">already listed</span>}
                            {r.repeat && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] ml-2">repeat</span>}
                            {r.sameName && <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] ml-2" title="Another card in this list has the same name but a different balance — both will be added">2 cards, same name</span>}
                            {r.overLimit && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] ml-2">over limit {r.statedUsage}%</span>}
                            {r.group && <div className="text-[0.5625rem] text-[#5A5751] normal-case" style={serif}>{r.group.toLowerCase()}</div>}
                          </td>
                          <td className="p-2 text-right" style={mono}>{r.balance == null ? <span className="text-[#B85838]">not given</span> : fmtExact(r.balance)}</td>
                          <td className="p-2 text-right" style={mono}>
                            {r.rate == null ? <span className="text-[#B85838]">—</span>
                              : r.rateMin != null ? `${r.rateMin}–${r.rate}%` : `${r.rate}%`}
                          </td>
                          <td className="p-2 text-right" style={mono}>{r.minPayment == null ? <span className="text-[#B85838]">—</span> : fmt(r.minPayment)}</td>
                          <td className="p-2 text-right" style={mono}>{r.creditLimit == null ? '—' : fmt(r.creditLimit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* The honest headline — what this paste actually contains, and
                  exactly how much of it is still missing. */}
              <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-xs space-y-1" style={serif}>
                <div><strong>{chosen.length} debts</strong> · <strong style={mono}>{fmtExact(summary.totalBalance)}</strong> owed across the {summary.withBalance} with a balance given.</div>
                {summary.missingBalance > 0 && <div className="text-[#5A5751]">{summary.missingBalance} have no balance yet — they'll be added at $0 owed so you can set each one with <strong>+ owed</strong>.</div>}
                {(summary.missingRate > 0 || summary.missingPayment > 0) && (
                  <div className="text-[#5A5751]">
                    {summary.missingRate > 0 ? `${summary.missingRate} still need an interest rate` : ''}
                    {summary.missingRate > 0 && summary.missingPayment > 0 ? '; ' : ''}
                    {summary.missingPayment > 0 ? `${summary.missingPayment} still need a monthly payment` : ''}
                    {' '}— fill them in on any row with <strong>+ rate</strong> and <strong>+ pay</strong>.
                  </div>
                )}
                {summary.knownPayments > 0 && <div className="text-[#5A5751]">Known monthly payments so far: <strong style={mono}>{fmt(summary.knownPayments)}/mo</strong>.</div>}
                {parsed.rows.some((r) => r.duplicate) && (
                  <div className="text-[#B85838]">{parsed.rows.filter((r) => r.duplicate).length} look like cards you already have — unchecked, tick one to add it anyway.</div>
                )}
              </div>

              {parsed.ignored.length > 0 && (
                <details>
                  <summary className="text-[0.625rem] uppercase tracking-wider text-[#B85838] cursor-pointer hover:text-[#1A1815]">
                    ▸ {parsed.ignored.length} lines ignored (totals and notes)
                  </summary>
                  <ul className="mt-2 space-y-1 text-[0.625rem] text-[#5A5751]" style={serif}>
                    {parsed.ignored.map((s, i) => <li key={i} className="truncate">· {s}</li>)}
                  </ul>
                </details>
              )}
            </>
          )}

          <div className="flex gap-2 flex-wrap">
            <button type="button" className={PRIMARY} onClick={submitPaste} disabled={!chosen.length}>
              {chosen.length ? `Add ${chosen.length} debt${chosen.length === 1 ? '' : 's'}` : 'Add debts'}
            </button>
            <button type="button" className={GHOST} onClick={() => { setMode(null); setPasteText(''); setOverrides({}); }}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}

export { AddDebt };
export default AddDebt;
