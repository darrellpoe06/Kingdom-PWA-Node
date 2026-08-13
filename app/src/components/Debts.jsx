// Debts · Avalanche / Snowball / Cashflow strategies — extracted from
// monolith (r33) per MODULAR-EXTENSIBILITY.md. Adds inline row edit
// per EDITABLE-EVERYWHERE; was display-only.
import React, { useState, useMemo } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';
import { cardPaymentSuggestions, debtNameFromPayee, looksLikeDebtAccount } from '../lib/debt-payments.js';
import AddDebt from './AddDebt.jsx';
import EditDebtRow from './EditDebtRow.jsx';
import DebtStatementUpload from './DebtStatementUpload.jsx';

// Local helpers.
const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
// Defensive: a debt row missing `rate` (e.g. seed data that used `apr`, or a
// partially-loaded record) must never white-screen the whole tab. Coerce to a
// number and render 0% when absent rather than calling .toFixed on undefined.
const pct = (r) => { const n = Number(r); if (!isFinite(n) || n === 0) return '0%'; return `${n.toFixed(2).replace(/\.00$/, '')}%`; };
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(d, offset) { const x = new Date(d.getFullYear(), d.getMonth() + offset, 1); return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`; }
function yearsAndMonths(months) { const y = Math.floor(months / 12); const m = months % 12; if (y === 0) return `${m}mo`; if (m === 0) return `${y}yr`; return `${y}yr ${m}mo`; }
// Progress already made: how far the balance has come down from this card's
// highest recorded balance. Only shown when the peak is genuinely above today's
// balance — a card sitting at its peak has no progress to report, and claiming
// otherwise would be a painted number.
function paidFromPeak(d) {
  if (d.highestBalance == null || !isFinite(d.highestBalance)) return null;
  const paid = d.highestBalance - d.balance;
  return paid > 0.5 ? paid : null;
}

function Debts({ debts, entities, debtSnowballSort, setDebtSnowballSort, debtSnowballExtra, setDebtSnowballExtra, debtSnowball, debtMinOnly, currentDate, netCashFlow = 0, cashTotal = 0, updateAccount = null, transactions = [], accounts = [], categoryRules = {}, addAccount = null, addAccounts = null, deleteAccount = null, updateRental = null, onImportStatement = null }) {
  // "All credit card and lines companies should be listed on [the Debts] Tab"
  // (Darrell 2026-07-20). deriveDebts can only surface an account that EXISTS as a
  // debt — but a family's other cards are often paid by autopay OUT of checking and
  // were never set up as their own account, so nothing here finds them and the tab
  // reads as empty. This brings the SAME "add as debt" mechanism the Accounts tab
  // has ONTO the Debts tab, where the family actually looks:
  //   · recurring debt-payments the categorizer recognizes but no account tracks yet
  //     (cardPaymentSuggestions) → one-tap "Add as debt", payment pre-filled;
  //   · existing accounts that READ like a card/loan but aren't marked a debt →
  //     one-tap "Treat as debt" (updateAccount).
  const nowMs = currentDate instanceof Date ? currentDate.getTime() : Date.now();
  const debtAcctIds = useMemo(() => new Set(debts.map((d) => d.accountId).filter(Boolean)), [debts]);
  const debtSuggestions = useMemo(
    () => (addAccount ? cardPaymentSuggestions(transactions, accounts, { learned: categoryRules, nowMs }) : []),
    [transactions, accounts, categoryRules, nowMs, addAccount],
  );
  // Accounts that read like a card/LOC/loan by name but aren't yet treated as a debt
  // (and aren't already surfaced) — offer to mark each so it joins this tab.
  const untrackedCards = useMemo(
    () => (updateAccount ? (accounts || []).filter(
      (a) => a && !debtAcctIds.has(a.id) && !a.treatAsDebt && a.type !== 'credit' && a.type !== 'loan' && !a.inLegal && looksLikeDebtAccount(a),
    ) : []),
    [accounts, debtAcctIds, updateAccount],
  );
  const defaultEntityId = (entities[0] && entities[0].id) || null;
  const addSuggestedDebt = (s) => {
    const name = debtNameFromPayee(s.label);
    // ONE-TAP add (Darrell 2026-07-30: the button "not working when you push it").
    // It used to window.prompt() for the owed balance — but prompt() is blocked /
    // no-op inside an installed standalone PWA (his phone), so the tap did nothing
    // visible and the debt was never added. Add it immediately with the monthly
    // payment pre-filled and $0 owed; the owed balance is then set with the
    // existing inline edit on the debt row (EDITABLE-EVERYWHERE) — no dialog.
    addAccount({ name, type: 'credit', treatAsDebt: true, balance: 0, minPayment: s.monthlyPayment, entityId: defaultEntityId });
  };
  const showAddPanel = (addAccount && debtSuggestions.length > 0) || (updateAccount && untrackedCards.length > 0);
  // v28+ All Debts table - excel-style sort by rate / balance / payoff date
  const [allDebtsSort, setAllDebtsSort] = useState('rate');
  // Inline editing of a debt's terms so a timeline can be computed (Darrell
  // 2026-07-20: "have the debt need a total amount of debt owed ... and expected
  // payoff based on the amount of money being paid"; "interest rates ... editable
  // if necessary unless it is already available"). Three editable cells per debt:
  //  · owed    — the total balance owed (only for a manually-declared debt, whose
  //              balance IS the owed amount; a ledger-derived balance stays truthful);
  //  · min     — the monthly payment (drives the payoff timeline when there's no
  //              observed payment history yet);
  //  · rate    — the interest rate, but ONLY when it is NOT derived from the data
  //              (a DERIVED rate is authoritative and locked — no human undermines it).
  // Each writes to the underlying account (updateAccount); the projection recomputes.
  const [edit, setEdit] = useState(null); // { id, field } | null
  const [editVal, setEditVal] = useState('');
  // The full-row editor (Christina 2026-08-10) — every field on the record at
  // once, which the single-cell editors above cannot reach: name, entity,
  // credit limit, highest balance, leave-alone, remove, and a mortgage's terms.
  const [editRowId, setEditRowId] = useState(null);
  const isEditing = (d, field) => !!edit && edit.id === d.id && edit.field === field;
  const startEditCell = (d, field, current) => { setEdit({ id: d.id, field }); setEditVal(current != null && isFinite(current) ? String(current) : ''); };
  const saveCell = (d) => {
    const v = parseFloat(editVal);
    if (isFinite(v) && v >= 0 && d.accountId && updateAccount) {
      // A rate a person actually typed is KNOWN — including a deliberate 0 for a
      // promo or closed card. Stamping rateKnown here is what lets that card
      // project a payoff instead of reading "Add terms" forever (0133).
      if (edit.field === 'rate' && v < 100) {
        const patch = { rate: v, rateKnown: true };
        // Correcting a statement-derived rate is recorded as a deliberate
        // override, so the row can say so and offer a revert (0134).
        if (d.dataRate != null) patch.rateOverridden = Math.abs(v - d.dataRate) > 0.005;
        updateAccount(d.accountId, patch);
      }
      else if (edit.field === 'min') updateAccount(d.accountId, { minPayment: v });
      else if (edit.field === 'owed') updateAccount(d.accountId, { balance: v }); // manual debt: balance = owed
    }
    setEdit(null);
  };
  const cellInput = (d, ariaLabel) => (
    <input type="number" min="0" step="0.01" value={editVal} autoFocus
      onChange={(e) => setEditVal(e.target.value)} onBlur={() => saveCell(d)}
      onKeyDown={(e) => { if (e.key === 'Enter') saveCell(d); if (e.key === 'Escape') setEdit(null); }}
      className="w-20 text-right text-xs px-1 py-0.5 border border-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
      aria-label={ariaLabel} />
  );
  // The expected payoff date the user asked for — from their REAL payments, not a
  // fabricated minimum. On-track: their net paydown clears it by this month. If new
  // charges keep pace with payments the balance isn't going down — say so plainly
  // (never a rosy date). Falls back to the rate-based snowball, then to honest '?'.
  const payoffCell = (d) => {
    // A decades-out truth stays truthful but must READ truthfully: "Nov '90"
    // (2090, at $13/mo net on a $9.8k line) reads as 1990. Ten-plus years out,
    // say the distance in years — the "barely moving" message is the point.
    if (d.estPayoffOnTrack && d.estPayoffMonths > 120) return { text: `~${Math.round(d.estPayoffMonths / 12)} yrs away`, sub: 'at your pace', warn: true };
    if (d.estPayoffOnTrack && d.estPayoffMonths) return { text: monthLabel(currentDate, d.estPayoffMonths), sub: 'at your pace' };
    if (d.growing) return { text: 'not going down', sub: 'charges match payments', warn: true };
    const cleared = debtSnowball.activeDebts.find(p => p.id === d.id);
    if (cleared?.clearedAtMonth) return { text: monthLabel(currentDate, cleared.clearedAtMonth), sub: 'with snowball' };
    if (d.hasPayments === false && !d.leaveAlone) return { text: '—', sub: 'no payments seen' };
    return { text: d.leaveAlone ? '—' : '?', sub: '' };
  };
  // r18 — editable snowball slider max. Default $5000; user can expand to
  // explore what-if scenarios (extra income, war chest, forecasted boost) per
  // founder feedback: "$5000 isn't the only amount; let them brainstorm with a
  // larger pot, but always able to snap back to reality."
  const baselineExtra = Math.max(0, Math.round(Math.max(0, netCashFlow) / 50) * 50);
  const [snowballMax, setSnowballMax] = useState(() => Math.max(5000, baselineExtra * 2));
  const [editingMax, setEditingMax] = useState(false);
  const [maxInput, setMaxInput] = useState(String(snowballMax));
  const applyMaxInput = () => {
    const parsed = parseInt(maxInput, 10);
    if (!isFinite(parsed) || parsed < 500) { setMaxInput(String(snowballMax)); setEditingMax(false); return; }
    const clamped = Math.min(parsed, 1000000);
    setSnowballMax(clamped);
    if (debtSnowballExtra > clamped) setDebtSnowballExtra(clamped);
    setEditingMax(false);
  };
  const snapToBaseline = () => {
    // Auto-fit the max so the baseline lands near the middle of the slider.
    const newMax = Math.max(5000, Math.ceil((baselineExtra * 2) / 1000) * 1000);
    setSnowballMax(newMax);
    setMaxInput(String(newMax));
    setDebtSnowballExtra(baselineExtra);
  };
  const exploreScenario = (multiplier, label) => {
    // What-if mode. Set the slider to baseline × multiplier; bump the max if
    // needed so the slider still has headroom on either side.
    const target = Math.round((baselineExtra * multiplier) / 50) * 50;
    const newMax = Math.max(snowballMax, Math.ceil((target * 1.5) / 1000) * 1000);
    setSnowballMax(newMax);
    setMaxInput(String(newMax));
    setDebtSnowballExtra(target);
  };
  const sorted = useMemo(() => {
    const arr = [...debts];
    arr.sort((a, b) => {
      if (a.leaveAlone !== b.leaveAlone) return a.leaveAlone ? 1 : -1;
      if (allDebtsSort === 'balance') return b.balance - a.balance;
      if (allDebtsSort === 'payoff') {
        const aClear = debtSnowball.activeDebts.find(p => p.id === a.id)?.clearedAtMonth ?? 999;
        const bClear = debtSnowball.activeDebts.find(p => p.id === b.id)?.clearedAtMonth ?? 999;
        return aClear - bClear;
      }
      // default: rate (highest first)
      return b.rate - a.rate;
    });
    return arr;
  }, [debts, allDebtsSort, debtSnowball.activeDebts]);
  const ent = (id) => entities.find(e => e.id === id);
  const debtsWithCleared = debts.filter(d => !d.leaveAlone).map(d => { const cleared = debtSnowball.activeDebts.find(p => p.id === d.id); return { ...d, clearedAtMonth: cleared?.clearedAtMonth, interestPaid: cleared?.interestPaid || 0 }; });
  const orderedByPayoff = debtsWithCleared.filter(d => d.clearedAtMonth).sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const totalDebt = debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.balance, 0);
  const totalMinPayment = debts.filter(d => !d.leaveAlone).reduce((s, d) => s + d.minPayment, 0);
  // Only project a payoff date when EVERY active debt has terms (rate + minimum
  // payment). The Line of Credit has none yet, so we show the real Total Debt
  // but decline a fake "debt-free" date until terms are added — never a painted
  // number (DR-0061). No debts loaded -> nothing to project either.
  const activeDebts = debts.filter(d => !d.leaveAlone);
  const missingTerms = activeDebts.filter(d => d.needsTerms || !(d.minPayment > 0));
  const canProject = activeDebts.length > 0 && missingTerms.length === 0;
  const interestSaved = debtMinOnly.totalInterest - debtSnowball.totalInterest;
  const stuckCount = debtMinOnly.stuckDebts.length;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Debt Snowball Engine</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Same pattern. Smaller numbers. Faster wins.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          The same snowball that pays off 11 rental properties also clears consumer debt — and the math here is even more motivating because the interest rates are much higher. Watch what gets freed up at each payoff.
        </p>
      </section>

      {/* Add a debt by hand, or paste a whole list (Christina 2026-08-10). Every
          other route onto this tab is a SUGGESTION the app makes; this is the
          one that lets a person add a card the app has never seen — a closed
          account, a gas card, a business card with no feed behind it. */}
      {addAccount && (
        <AddDebt entities={entities} addAccount={addAccount} addAccounts={addAccounts} existingDebts={debts} />
      )}

      {/* UPLOAD A STATEMENT WHERE THE CARD LIVES (Darrell 2026-08-11: "focus on
          the books and the import of the credit cards"). Measured before this:
          BooksTransactions.jsx had three file inputs and this tab had ZERO, so a
          person came to Debts to deal with a card, found no way to hand the app
          a statement, and reasonably concluded it could not read one.

          It reuses the SAME proven import path as the Transactions tab rather
          than inventing a second one, and adds the three things a debt needs
          that a register does not: the statement's own header facts (the payment
          DUE DATE above all, without which on-time/late cannot be computed from
          anything we store), a home for the rows (the account and vendor are
          created when the card is new and REUSED when it is not — a duplicate
          would split one card's history in two), and the bank's column layout
          remembered by header signature so the next statement is not re-guessed. */}
      {addAccount && (
        <DebtStatementUpload
          accounts={accounts}
          transactions={transactions}
          onImport={(rows, ctx) => {
            if (ctx && ctx.account && addAccount) addAccount(ctx.account);
            if (typeof onImportStatement === 'function') onImportStatement(rows, ctx);
          }}
        />
      )}

      {/* Get EVERY card + line of credit onto this tab (Darrell 2026-07-20). The
          family's other cards are usually paid by autopay out of checking and were
          never set up as accounts — so nothing above finds them. Add them right here. */}
      {showAddPanel && (
        <section className="bg-[#FAF8F4] border-2 border-[#B85838] p-4 sm:p-5 space-y-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">Cards &amp; lines of credit not on this tab yet</div>
          <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Only accounts set up as debts show above. Your other cards are often paid by autopay and aren't in the feed as accounts — add them here and each one's payoff timeline joins the list.
          </p>
          {debtSuggestions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-medium">Recurring payments that look like debts</div>
              {debtSuggestions.slice(0, 8).map((s) => (
                <div key={s.payeeKey} className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <strong>{debtNameFromPayee(s.label)}</strong> <span className="text-[#5A5751]">· {fmt(s.monthlyPayment)}/mo · {s.cadenceLabel}</span>
                  </span>
                  <button type="button" onClick={() => addSuggestedDebt(s)} className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">Add as debt</button>
                </div>
              ))}
            </div>
          )}
          {untrackedCards.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-medium">Accounts that read like a card or loan</div>
              {untrackedCards.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <strong>{a.name}</strong>{a.institution ? <span className="text-[#5A5751]"> · {a.institution}</span> : null}{a.fragment ? <span className="text-[#5A5751]"> {a.fragment}</span> : null}
                  </span>
                  <button type="button" onClick={() => updateAccount(a.id, { treatAsDebt: true })} className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#B85838] text-[#B85838] font-semibold hover:bg-[#B85838] hover:text-white focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">Treat as debt</button>
                </div>
              ))}
            </div>
          )}
          <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Have a card that isn't listed here at all? Add it on the <strong>Accounts</strong> tab (any account has a one-tap "Treat as debt").
          </p>
        </section>
      )}

      {/* All Debts table — excel-style sort by rate / balance / payoff date */}
      <section>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3 pb-2 border-b border-[#1A1815]">
          <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">All Debts · sorted by {allDebtsSort === 'rate' ? 'rate' : allDebtsSort === 'balance' ? 'balance' : 'payoff date'}</h2>
          <div className="flex gap-1">
            {[['rate','Rate'],['balance','Balance'],['payoff','Payoff date']].map(([id, label]) => (
              <button key={id} onClick={() => setAllDebtsSort(id)} className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border ${allDebtsSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white border border-[#1A1815] overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1815]"><th className="text-left p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Account</th><th className="text-left p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hidden sm:table-cell">Entity</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Rate</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Min</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Balance</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Payoff</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Edit</th></tr></thead>
            <tbody>
              {sorted.map((d) => {
                const po = payoffCell(d);
                // Every rate is now editable. A statement-derived rate keeps its
                // authority by staying visible beside any override (and being
                // revertible), not by locking the family out of the field.
                const canEditRate = d.accountId && updateAccount;
                const rowEditable = (d.accountId && updateAccount) || (d.source === 'rental' && updateRental);
                if (editRowId === d.id && rowEditable) {
                  return (
                    <EditDebtRow
                      key={d.id} debt={d} entities={entities} colSpan={7}
                      onClose={() => setEditRowId(null)}
                      updateAccount={updateAccount} deleteAccount={deleteAccount} updateRental={updateRental}
                    />
                  );
                }
                return (
                  <tr key={d.id} className={`border-b border-[#E8E4DC] ${d.flag ? 'bg-[#FAF8F4]' : ''} ${d.leaveAlone ? 'opacity-60' : ''}`}>
                    <td className="p-3">
                      <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{d.name}</span>
                      {d.flag && <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}
                      {d.leaveAlone && <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-2">Leave alone</span>}
                      {/* The card's own context, shown only where a real figure
                          exists: how much of the limit is used, and the progress
                          already made down from its peak. Both are arithmetic on
                          the family's own numbers — never a guess (DR-0076). */}
                      {(d.utilization != null || paidFromPeak(d) != null) && (
                        <div className="text-[0.5625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                          {d.utilization != null && (
                            <span className={d.utilization > 100 ? 'text-[#B85838] font-medium' : ''}>
                              {Math.round(d.utilization)}% of {fmt(d.creditLimit)} limit{d.utilization > 100 ? ' · over limit' : ''}
                            </span>
                          )}
                          {d.utilization != null && paidFromPeak(d) != null && <span> · </span>}
                          {paidFromPeak(d) != null && (
                            <span className="text-[#5A6E3D]">{fmt(paidFromPeak(d))} paid down from {fmt(d.highestBalance)} peak</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-[#5A5751] hidden sm:table-cell">{ent(d.entityId)?.name.split('(')[0].trim() || '—'}</td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {isEditing(d, 'rate') ? cellInput(d, `Interest rate for ${d.name}`) : (
                        <span className="inline-flex items-center gap-1 justify-end">
                          {/* A confirmed 0% promo card shows "0%" as a real,
                              complete term. A card whose rate nobody has entered
                              yet shows a dash — it is unknown, not zero, and
                              conflating the two is what left every 0% card stuck
                              on "Add terms" forever. */}
                          {d.rateKnown
                            ? (d.rateMin != null ? `${pct(d.rateMin)}–${pct(d.rate)}` : pct(d.rate))
                            : <span className="text-[#5A5751]">—</span>}
                          {d.rateSource === 'derived' && <span className="text-[0.5625rem] text-[#5A6E3D] uppercase tracking-wider" title="Read from this account's own statement interest — the data sets it by default">data</span>}
                          {d.rateSource === 'override' && <span className="text-[0.5625rem] text-[#B85838] uppercase tracking-wider" title={`You set this by hand. The statements say ${d.dataRate}% — open Edit to revert to the data.`}>edited{d.dataRate != null ? ` · data ${pct(d.dataRate)}` : ''}</span>}
                          {d.rateKnown && d.rate === 0 && d.rateSource !== 'derived' && d.rateSource !== 'override' && <span className="text-[0.5625rem] text-[#5A6E3D] uppercase tracking-wider" title="Confirmed 0% — a promotional or closed-account rate, not a missing figure">0% confirmed</span>}
                          {d.rateMin != null && <span className="text-[0.5625rem] text-[#5A5751] uppercase tracking-wider" title="The issuer quotes a range; the payoff is figured at the higher end so the date is never rosier than you can count on">range</span>}
                          {canEditRate && (
                            <button type="button" onClick={() => startEditCell(d, 'rate', d.rate)}
                              className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-1 focus:outline-[#B85838]"
                              title="No interest charge in the data yet — enter the rate">{d.rateKnown ? 'edit' : '+ rate'}</button>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {isEditing(d, 'min') ? cellInput(d, `Monthly payment for ${d.name}`) : (
                        <span className="inline-flex items-center gap-1 justify-end">
                          {fmt(d.minPayment)}
                          {d.accountId && updateAccount && (
                            <button type="button" onClick={() => startEditCell(d, 'min', d.minPayment)}
                              className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-1 focus:outline-[#B85838]"
                              title="Monthly payment — sets the payoff timeline when there's no payment history yet">{d.minPayment > 0 ? 'edit' : '+ pay'}</button>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      {isEditing(d, 'owed') ? cellInput(d, `Amount owed for ${d.name}`) : (
                        <span className="inline-flex items-center gap-1 justify-end">
                          {fmt(d.balance)}
                          {d.accountId && updateAccount && (
                            <button type="button" onClick={() => startEditCell(d, 'owed', d.balance)}
                              className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-1 focus:outline-[#B85838]"
                              title="Total amount owed on this debt — the timeline is figured from this">{d.balance > 0 ? 'edit' : '+ owed'}</button>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                      <div className={po.warn ? 'text-[#B85838]' : ''}>{po.text}</div>
                      {po.sub && <div className="text-[0.5625rem] text-[#5A5751] normal-case" style={{ fontFamily: '"Fraunces", serif' }}>{po.sub}</div>}
                    </td>
                    <td className="p-3 text-right">
                      {rowEditable && (
                        <button type="button" onClick={() => setEditRowId(d.id)}
                          className="text-[0.625rem] uppercase tracking-wider px-2 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                          title={`Edit every field on ${d.name}`}
                          aria-label={`Edit ${d.name}`}>✎ Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top metrics */}
      <section>
        <SectionTitle>Where We Are Today</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
          <MetricCell label="Total debt" value={fmtCompact(totalDebt)} sub={`${debts.filter(d => !d.leaveAlone).length} accounts`} small accent="rust" />
          <MetricCell label="Min payments" value={fmt(totalMinPayment)} sub="/mo" small />
          <MetricCell label="Debt-free" value={canProject ? debtSnowball.allClearedDate : (activeDebts.length ? 'Add terms' : '—')} sub={canProject ? `${debtSnowball.allClearedYears.toFixed(1)}yr` : (activeDebts.length ? `${missingTerms.length} need rate/min` : 'no debts loaded')} small accent="green" />
          <MetricCell label="Interest paid" value={fmt(debtSnowball.totalInterest)} sub="over journey" small accent="rust" />
        </div>
      </section>

      {/* The motivator — interest saved */}
      <section className="bg-white border-2 border-[#5A6E3D] p-4 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A6E3D] font-medium mb-3">Interest Savings vs. Paying Minimums Only</div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
          <div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Minimums only</div>
            <div className="text-lg sm:text-2xl text-[#B85838]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtMinOnly.totalInterest)}</div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] text-[#5A5751]">interest paid{stuckCount > 0 ? ` (${stuckCount} stuck)` : ''}</div>
          </div>
          <div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-wider text-[#5A5751]">With {fmt(debtSnowballExtra)}/mo</div>
            <div className="text-lg sm:text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtSnowball.totalInterest)}</div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] text-[#5A5751]">interest paid</div>
          </div>
          <div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">YOU SAVE</div>
            <div className="text-xl sm:text-3xl text-[#5A6E3D]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt(interestSaved)}</div>
            <div className="text-[0.5625rem] sm:text-[0.625rem] text-[#5A5751]">never paid</div>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          {stuckCount > 0 ? `Note: ${stuckCount} debt(s) at minimum payment don't even cover their interest — they'd grow indefinitely without the snowball.` : 'Every dollar you put toward snowballing is multiplied by the interest you avoid.'}
        </p>
      </section>

      {/* Strategy selector */}
      <section>
        <SectionTitle>Snowball Strategy</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5 space-y-5">
          <div>
            <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Payoff order</div>
            <div className="grid grid-cols-3 gap-1">
              {[['snowball','Snowball','Smallest first'],['avalanche','Avalanche','Highest rate'],['hybrid','Hybrid','Quick wins, then rate']].map(([id, label, sub]) => (
                <button key={id} onClick={() => setDebtSnowballSort(id)} className={`px-2 py-2 text-left border ${debtSnowballSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                  <div className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</div>
                  <div className="text-[0.5625rem] uppercase tracking-wider opacity-75">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">Monthly snowball (extra above minimums)</div>
                <div className="text-[0.625rem] text-[#5A5751] mt-0.5">Total debt: <strong>{fmtCompact(totalDebt)}</strong> across {debts.filter(d => !d.leaveAlone).length} accounts · Min payments: <strong>{fmt(totalMinPayment)}/mo</strong></div>
              </div>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(debtSnowballExtra)}</div>
            </div>
            <input type="range" min="0" max={snowballMax} step="50" value={Math.min(debtSnowballExtra, snowballMax)} onChange={(e) => setDebtSnowballExtra(parseInt(e.target.value))} className="w-full accent-[#B85838]" aria-label={`Monthly snowball extra, 0 to ${fmt(snowballMax)}`} />
            <div className="flex justify-between text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-1">
              <span>$0</span><span>{fmt(Math.round(snowballMax / 2))}</span><span>{fmt(snowballMax)}</span>
            </div>
            {/* r18 — Reality controls. Snap to what's actually possible at
                current net cash flow ("Baseline"), or stretch into what-if
                scenarios (1.5×, 2×, 3×) so the user can brainstorm with a
                bigger pot from new income or a forecasted war chest. */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <button
                type="button"
                onClick={snapToBaseline}
                title={`Set to ${fmt(baselineExtra)}/mo — what your current net cash flow supports`}
                className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                ↺ Baseline · {fmt(baselineExtra)}
              </button>
              <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Explore:</span>
              <button type="button" onClick={() => exploreScenario(1.5, '1.5×')} className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">+50% income</button>
              <button type="button" onClick={() => exploreScenario(2, '2×')} className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">2× pot</button>
              <button type="button" onClick={() => exploreScenario(3, '3×')} className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]">War chest 3×</button>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Slider max:</span>
                {editingMax ? (
                  <>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={maxInput}
                      onChange={(e) => setMaxInput(e.target.value)}
                      onBlur={applyMaxInput}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyMaxInput(); if (e.key === 'Escape') { setMaxInput(String(snowballMax)); setEditingMax(false); } }}
                      autoFocus
                      className="w-24 text-xs px-2 py-1 border border-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      aria-label="Slider maximum (in dollars)"
                    />
                    <button type="button" onClick={applyMaxInput} className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold hover:text-[#1A1815]">✓ Apply</button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMaxInput(String(snowballMax)); setEditingMax(true); }}
                    title="Type any dollar amount as the slider max — explore scenarios beyond default"
                    className="text-[0.625rem] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {fmt(snowballMax)} ✎
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              <strong>Reality check:</strong> at current net cash flow of <strong>{fmt(netCashFlow)}/mo</strong>, you can sustainably commit up to <strong>{fmt(baselineExtra)}/mo</strong>. Cash on hand right now: <strong>{fmt(cashTotal)}</strong>. The Explore buttons show what's possible if you grow income or unlock a war chest.
            </div>
            <details className="mt-2">
              <summary className="text-[0.625rem] uppercase tracking-wider text-[#B85838] cursor-pointer hover:text-[#1A1815]">▸ Show top debts that add up to total</summary>
              <div className="mt-2 space-y-1 text-xs">
                {[...debts].filter(d => !d.leaveAlone).sort((a, b) => b.balance - a.balance).slice(0, 8).map(d => (
                  <div key={d.id} className="flex justify-between border-b border-[#E8E4DC] pb-1">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{d.name} <span className="text-[#5A5751]">· {pct(d.rate)}</span></span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.balance)}</span>
                  </div>
                ))}
                {debts.filter(d => !d.leaveAlone).length > 8 && <div className="text-[0.625rem] text-[#5A5751] italic pt-1">+ {debts.filter(d => !d.leaveAlone).length - 8} more accounts shown in the full table below</div>}
              </div>
            </details>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="All paid in" value={canProject ? yearsAndMonths(debtSnowball.allClearedMonth) : 'Add terms'} sub={canProject ? debtSnowball.allClearedDate : `${missingTerms.length} debt(s) need rate + minimum`} small />
            <MetricCell label="Interest paid" value={fmt(debtSnowball.totalInterest)} small accent="rust" />
            <MetricCell label="Final freed" value={fmt(debtSnowball.finalFreedCashFlow)} sub="/mo" small accent="green" />
          </div>
          <p className="text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            When the last debt clears, <strong>{fmt(debtSnowball.finalFreedCashFlow)}/mo</strong> of freed cash flow becomes available — pivots straight to the rental snowball or family wealth building. The seven-year pattern again.
          </p>
        </div>
      </section>

      {/* Payoff cascade */}
      <section>
        <SectionTitle>Payoff Cascade · What Frees Up When</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {orderedByPayoff.map((d, i) => {
            const freedSoFar = orderedByPayoff.slice(0, i + 1).reduce((s, x) => s + x.minPayment, 0);
            return (
              <div key={d.id} className={`p-4 ${i < orderedByPayoff.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="text-[#B85838] shrink-0 w-8 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{d.name}</span>
                        {d.flag && <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}
                      </div>
                      <div className="text-sm text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{monthLabel(currentDate, d.clearedAtMonth)}</div>
                    </div>
                    <div className="text-xs text-[#5A5751] mt-1">
                      Cleared in {yearsAndMonths(d.clearedAtMonth)} · {fmt(d.balance)} balance · {pct(d.rate)} rate · Frees {fmt(d.minPayment)}/mo
                    </div>
                    <div className="text-xs text-[#5A6E3D] mt-1">
                      Snowball after this clears: <strong>{fmt(debtSnowballExtra + freedSoFar)}/mo</strong> attacking the next debt
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MOVED-FROM-BOTTOM: lighter dead anchor for the future. The visible section is at the top now. */}
      <section style={{ display: 'none' }} aria-hidden>
        <div className="bg-white border border-[#1A1815] overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1815]"><th className="text-left p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Account</th><th className="text-left p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751] hidden sm:table-cell">Entity</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Rate</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Min</th><th className="text-right p-3 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Balance</th></tr></thead>
            <tbody>
              {sorted.map((d) => (
                <tr key={d.id} className={`border-b border-[#E8E4DC] ${d.flag ? 'bg-[#FAF8F4]' : ''} ${d.leaveAlone ? 'opacity-60' : ''}`}>
                  <td className="p-3"><span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{d.name}</span>{d.flag && <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-medium ml-2">⚠ {d.flag}</span>}{d.leaveAlone && <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-2">Leave alone</span>}</td>
                  <td className="p-3 text-xs text-[#5A5751] hidden sm:table-cell">{ent(d.entityId)?.name.split('(')[0].trim() || '—'}</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{d.rate === 0 ? '0%' : `${d.rate.toFixed(2).replace(/\.00$/, '')}%`}</td>
                  <td className="p-3 text-right text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.minPayment)}</td>
                  <td className="p-3 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(d.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export { Debts };
export default Debts;
