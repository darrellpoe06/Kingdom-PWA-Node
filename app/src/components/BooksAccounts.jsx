// =============================================================================
// BooksAccounts — the Books > Accounts surface (account list + balances, buffer
// fund target editing, legal-flag toggle), extracted from the monolith shell
// (hybrid-modular cutover, Stage 3). Fully props-driven: entity rollups, the
// account CRUD handlers, and the buffer target/current all arrive via props.
// Moved verbatim (DR-0076 characterize-before-change); ACCOUNT_TYPES is
// Books-only and travels with it. Depends on core only (fmt), never the shell.
// =============================================================================
import React, { useState, useMemo } from "react";
import { fmt } from "../lib/format.js";
import { cardPaymentSuggestions, debtNameFromPayee } from "../lib/debt-payments.js";

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'loan', 'investment', 'cash', 'other'];

export default function BooksAccounts({ entityRollups, entities, addAccount, updateAccount, deleteAccount, toggleAccountLegal, bufferTarget = 0, bufferCurrent = 0, setBufferCurrent, setBufferTarget, totals = {}, ingestData = null, accountReconciliation = {}, transactions = [], categoryRules = {} }) {
  // v28+ MVP v1.5 round 4 — Buffer target editing is deliberate (modal-style),
  // current balance is slider-driven (continuous, live feedback).
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(bufferTarget);

  // Phase 2B.2 (2026-05-28) — ingestData now comes from the top-level App
  // component so Tx / Accounts / Big Picture all share one network feed.
  // Falls back to empty shape if a parent forgot to pass it.
  const ingestBalances = (ingestData && ingestData.bank_balances) || {};
  const ingestMeta = (ingestData && ingestData.meta) || { loaded: false, error: null };

  // Map an account → its matching institution slug in ingestBalances.
  // QFX filenames embed last-4 of the account number; institution slug is
  // the filename's first segment lowercased (e.g. "chase8168_activity_...").
  // We match an account by extracting digits from a.fragment and finding the
  // first institution slug that contains those digits.
  const balanceFor = (acc) => {
    const last4 = (acc.fragment || '').match(/(\d{4})/)?.[1];
    if (!last4) return null;
    const key = Object.keys(ingestBalances).find(k => k.includes(last4));
    return key ? { inst: key, ...ingestBalances[key] } : null;
  };
  // Suggested target = ~1 month of total rental P&I (covers timing gap for
  // a full month), rounded to nearest $500. Falls back to $5,000.
  const suggestedTarget = (() => {
    const pAndI = (totals && totals.totalRentalPI) ? totals.totalRentalPI : 0;
    if (!pAndI) return 5000;
    return Math.max(1000, Math.round(pAndI / 500) * 500);
  })();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const blank = { name: '', institution: '', type: 'checking', fragment: '', balance: 0, entityId: entities[0]?.id || 'e-personal', notes: '', isPrimary: false };
  const [form, setForm] = useState(blank);

  // Round 9: no scroll-to-top. Form opens above the account list; the toast at
  // the form header makes it obvious. Tapping the edit button on a row no
  // longer hijacks the user's scroll position.
  const startAdd = () => { setForm(blank); setEditingId(null); setShowForm(true); };
  // r20 — Inline edit per IN-PLACE-FIRST.md. Top form for Add only;
  // edit mounts inline under the row the user tapped.
  const startEdit = (a) => { setForm({ name: a.name, institution: a.institution, type: a.type, fragment: a.fragment || '', balance: a.balance, entityId: a.entityId, notes: a.notes || '', isPrimary: !!a.isPrimary }); setEditingId(a.id); setShowForm(false); };
  const cancel = () => { setShowForm(false); setEditingId(null); setForm(blank); };
  const submit = () => {
    if (!form.name || !form.institution) { alert('Account name and institution are required.'); return; }
    if (editingId) updateAccount(editingId, form);
    else addAccount(form);
    cancel();
  };
  const confirmDelete = (a) => { if (confirm(`Delete account "${a.name}"? Transactions referencing it will keep the original accountId reference but will no longer roll up to an entity.`)) deleteAccount(a.id); };

  // v28+ MVP v1.5 round 3 — All Accounts Total + Buffer Fund occupy the
  // formerly-blank space at the top of this view. Buffer lives here because
  // its meaning ("liquid reserve set aside") sits next to the actual liquid
  // balance figure rather than the big-picture summary.
  const allAccounts = entityRollups.flatMap(r => r.accounts || []);
  // 2026-05-24: liquid = cash types AND not in legal. Credit cards and loans
  // no longer surface on this tab; their totals live on the Debts page.
  const liquidAccounts = allAccounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal);
  const liquidTotal = liquidAccounts.reduce((s, a) => s + (a.derivedBalance ?? a.balance ?? 0), 0);

  // Phase 2B — bank-derived totals for the same liquid set. Sums LEDGERBAL
  // for each linked account, plus the manual balance for accounts that
  // haven't been linked yet. This is the "what the bank actually says"
  // number alongside the user's manual record-of-truth.
  let bankLinkedCount = 0;
  let bankDerivedLiquid = 0;
  for (const a of liquidAccounts) {
    const bal = balanceFor(a);
    if (bal && typeof bal.ledger_balance === 'number') {
      bankLinkedCount += 1;
      bankDerivedLiquid += bal.ledger_balance;
    } else {
      bankDerivedLiquid += (a.derivedBalance ?? a.balance ?? 0);
    }
  }
  const bankDerivedDelta = +(bankDerivedLiquid - liquidTotal).toFixed(2);
  // Round 8 — netWorth no longer surfaced in the top card; net-position view
  // moves to the Big Picture dashboard where it belongs alongside debt totals.
  const bufferPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : 0;
  const bufferGap = Math.max(0, bufferTarget - bufferCurrent);

  // "You already PAY these; add them as debts to track the payoff" (Darrell
  // 2026-07-20 follow-through). The credit cards often aren't in the imported feed
  // as accounts — only as recurring autopay payments — so this offers each detected
  // debt-payment as a one-tap addable debt with the observed payment pre-filled.
  const debtSuggestions = useMemo(
    () => cardPaymentSuggestions(transactions, allAccounts, { learned: categoryRules }),
    [transactions, allAccounts, categoryRules],
  );
  const defaultEntityId = (entities[0] && entities[0].id) || null;
  const addSuggestedDebt = (s) => {
    const name = debtNameFromPayee(s.label);
    // ONE-TAP add (Darrell 2026-07-30: the "add as debt" button "not working").
    // window.prompt() is blocked / no-op inside an installed standalone PWA, so
    // the balance prompt made the tap appear dead. Add it immediately with the
    // payment pre-filled and $0 owed; the owed balance is set with the inline
    // edit on the Debts tab row (EDITABLE-EVERYWHERE) — no dialog.
    addAccount({ name, type: 'credit', treatAsDebt: true, balance: 0, minPayment: s.monthlyPayment, entityId: defaultEntityId });
  };

  return (
    <div className="space-y-6">
      {/* Payments that look like debts you don't yet track — add each as a debt
          (payment pre-filled) so its payoff shows on the Debts tab (Darrell 2026-07-20). */}
      {addAccount && debtSuggestions.length > 0 && (
        <section className="bg-[#FAF8F4] border-2 border-[#B85838] p-4 sm:p-5 space-y-2">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">Recurring payments that look like debts</div>
          <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
            Your credit cards may not be in the imported feed as accounts — only as these autopays. Add one as a debt and its payoff timeline shows on the Debts tab.
          </p>
          {debtSuggestions.slice(0, 6).map((s) => (
            <div key={s.payeeKey} className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                <strong>{debtNameFromPayee(s.label)}</strong> <span className="text-[#5A5751]">· {fmt(s.monthlyPayment)}/mo · {s.cadenceLabel}</span>
              </span>
              <button type="button" onClick={() => addSuggestedDebt(s)} className="text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] bg-[#B85838] text-white font-semibold hover:bg-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815] whitespace-nowrap">Add as debt</button>
            </div>
          ))}
        </section>
      )}
      <section className="bg-white border border-[#1A1815] p-5 sm:p-6">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">Accounts · Add · Edit · Delete</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Every account, every entity, every balance.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
          Add the checking, savings, credit, and loan accounts that hold the household's cash flow. Each account belongs to an entity (Personal, Steward Real Estate, Cornerstone Tech, Wellness Practice). Balances feed every rollup, projection, and the funds-available check on upcoming transactions.
        </p>
      </section>

      {/* v28+ MVP v1.5 round 8 — All Accounts Total card now CASH ONLY.
          Credit / loans surface in the per-entity "Credit Cards & Loans"
          group below, plus a dedicated "Debt Accounts · Total" summary
          card that appears right above that group (when any exist).
          The Buffer Fund pairs with the cash total — meaningful side-by-side
          because both are "how much spendable cash is on hand." */}
      <section aria-labelledby="all-accounts-total-h" className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Totals card — cash only, 2/5 of the row */}
        <div className="lg:col-span-2 bg-white border border-[#1A1815] p-4 sm:p-5">
          <h2 id="all-accounts-total-h" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">All Accounts · Total Cash</h2>
          <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>Spendable: checking + savings + cash + investments.</p>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{liquidAccounts.length} cash accounts</div>
            <div className={`text-3xl ${liquidTotal < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>{fmt(liquidTotal)}</div>
          </div>
          {/* Phase 2B — bank-derived total when any account is linked to a
              QFX feed. Uses bank LEDGERBAL where available, manual balance
              elsewhere, so the figure represents one consistent picture. */}
          {bankLinkedCount > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E8E4DC] flex items-baseline justify-between">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]" title="Sum of bank ledger balance for linked accounts plus manual balance for unlinked accounts.">
                bank-derived · {bankLinkedCount} linked
              </div>
              <div className="text-right">
                <div className={`text-lg ${bankDerivedLiquid < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{fmt(bankDerivedLiquid)}</div>
                {Math.abs(bankDerivedDelta) >= 0.5 && (
                  <div className={`text-[0.625rem] uppercase tracking-wider ${bankDerivedDelta < 0 ? 'text-[#B85838]' : 'text-[#D97706]'}`} title="Difference between your manual cash total and what the banks say. Reconcile per-account on the rows below.">
                    Δ {bankDerivedDelta > 0 ? '+' : ''}{fmt(bankDerivedDelta)}
                  </div>
                )}
              </div>
            </div>
          )}
          <p className="text-[0.625rem] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Credit cards and loans live on the <strong>Debts</strong> tab. Accounts under legal hold live in the <strong>Legal</strong> tab. Both are excluded from this cash total.
          </p>
          {ingestMeta.error && (
            <p className="text-[0.5625rem] text-[#B85838] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }} title={ingestMeta.error}>
              Bank balance overlay offline · {ingestMeta.error.length > 60 ? ingestMeta.error.slice(0, 60) + '…' : ingestMeta.error}
            </p>
          )}
        </div>

        {/* Buffer Fund card — slider for current balance (live), target edit is deliberate. */}
        {bufferTarget > 0 && (
          <div className="lg:col-span-3 bg-white border-2 border-[#B85838] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <h3 id="buffer-fund-heading" className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Buffer Fund · Mortgage Protection</h3>
                <p className="text-xs text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>The single highest-ROI move right now. Once funded, mortgage money sits before the 1st — turning "tight" into "covered" without changing income.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{fmt(bufferCurrent)}<span className="text-sm text-[#5A5751]"> / {fmt(bufferTarget)}</span></div>
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{bufferPct}% funded · gap {fmt(bufferGap)}</div>
              </div>
            </div>

            <div className="mt-3" role="progressbar" aria-labelledby="buffer-fund-heading" aria-valuenow={bufferPct} aria-valuemin="0" aria-valuemax="100">
              <div className="w-full bg-[#FAF8F4] h-3 border border-[#E8E4DC]">
                <div className="h-full bg-[#5A6E3D] transition-all" style={{ width: `${bufferPct}%` }} />
              </div>
              <div className="flex justify-between text-[0.5625rem] uppercase tracking-wider text-[#5A5751] mt-1">
                <span>$0</span>
                <span>{fmt(bufferTarget / 2)}</span>
                <span>{fmt(bufferTarget)}</span>
              </div>
            </div>

            {/* Current balance — a REAL, read-only progress bar from live
                savings-account balances (no longer a hand-typed slider). */}
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1">
                <label htmlFor="buffer-current-slider" className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Current balance · from your savings accounts</label>
                <span className="text-xs" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(bufferCurrent)}</span>
              </div>
              <input
                id="buffer-current-slider"
                type="range"
                min="0"
                max={bufferTarget}
                value={Math.min(bufferCurrent, bufferTarget)}
                disabled
                aria-readonly="true"
                aria-valuemin="0"
                aria-valuemax={bufferTarget}
                aria-valuenow={bufferCurrent}
                aria-valuetext={`${fmt(bufferCurrent)} of ${fmt(bufferTarget)} — from your savings balance`}
                className="w-full accent-[#5A6E3D]"
              />
            </div>

            {/* Target — deliberate edit only */}
            <div className="mt-3 flex items-baseline justify-between gap-2 flex-wrap">
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                Target: <strong style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(bufferTarget)}</strong>
                {bufferTarget !== suggestedTarget && <> · suggested {fmt(suggestedTarget)} (~1 mo rental P&amp;I)</>}
              </div>
              {!editingTarget ? (
                <button type="button" onClick={() => { setTargetDraft(bufferTarget); setEditingTarget(true); }} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Edit target</button>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  <label htmlFor="buffer-target-edit" className="sr-only">Target balance</label>
                  <input
                    id="buffer-target-edit"
                    type="number"
                    step="100"
                    min="0"
                    inputMode="decimal"
                    value={targetDraft}
                    onChange={e => setTargetDraft(e.target.value)}
                    className="p-2 border border-[#1A1815] text-sm bg-[#FAF8F4] w-28 focus:outline focus:outline-2 focus:outline-[#B85838]"
                  />
                  <button type="button" onClick={() => { setBufferTarget && setBufferTarget(targetDraft); setEditingTarget(false); }} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 bg-[#1A1815] text-white hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save</button>
                  <button type="button" onClick={() => { setBufferTarget && setBufferTarget(suggestedTarget); setEditingTarget(false); }} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Use the suggested target">Use suggested</button>
                  <button type="button" onClick={() => setEditingTarget(false)} className="text-[0.625rem] uppercase tracking-wider px-3 py-2 text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
              {bufferPct >= 100 ? (
                <span className="text-[#5A6E3D] font-semibold">✓ Buffer fully funded. Keep replenishing as you draw from it for early mortgage timing.</span>
              ) : bufferPct >= 60 ? (
                <span>Close. About <strong>{fmt(bufferGap)}</strong> more closes the timing gap on the 1st.</span>
              ) : (
                <span>First {fmt(bufferTarget)} is the most important dollars in this whole system. Aim ~$500/mo until full.</span>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751]">All Accounts</h2>
          <button type="button" onClick={() => showForm ? cancel() : startAdd()} className="text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showForm ? '× Cancel' : '+ Add account'}</button>
        </div>

        {/* r20 — Top form ONLY for Add. Edit happens inline under the row. */}
        {showForm && !editingId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-medium">New account</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account name</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Chase Personal Checking" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Institution</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Chase, AMEX, UIECU" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Type</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Fragment</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="...8168" value={form.fragment} onChange={e => setForm({ ...form, fragment: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Balance</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })}>
                  {entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}
                </select>
              </div>
            </div>
            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
              <input type="checkbox" checked={!!form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="accent-[#B85838]" />
              <span><strong>Primary bill-pay account</strong> — shown prominently at the top of Transactions so the family can see at a glance what's available to pay bills.</span>
            </label>
            <button type="button" onClick={submit} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingId ? 'Save Changes' : 'Save Account'}</button>
          </div>
        )}
      </section>

      {/* 2026-05-24 reorg per Darrell:
          - Credit cards + loans are removed from this tab entirely. They live on
            the Debts page now (their primary identity is "debt," not "account").
          - The Debt Accounts Total card that used to live here is gone for the
            same reason.
          - Accounts flagged inLegal don't surface here either — they live in
            the Legal tab and are excluded from cash totals.
          - Entity rendering order is personal-first → business-second (handled
            upstream in entityRollups). */}
      {entityRollups.map(r => {
        // Bank accounts only (cash types), and only those NOT in legal status.
        const bankAccounts = r.accounts.filter(a => ['checking','savings','cash','investment'].includes(a.type) && !a.inLegal);
        const bankTotal = bankAccounts.reduce((s, a) => s + (a.derivedBalance ?? a.balance ?? 0), 0);
        const renderRow = (a, i, arr) => {
          // Phase 2B — bank-side balance for this account, if we can match it.
          const bal = balanceFor(a);
          const hasBankBal = bal && typeof bal.ledger_balance === 'number';
          const acctBal = (a.derivedBalance ?? a.balance ?? 0);
          const delta = hasBankBal ? +(bal.ledger_balance - acctBal).toFixed(2) : null;
          const deltaClass = delta === null ? '' :
            Math.abs(delta) < 0.5 ? 'text-[#5A6E3D]' :
            delta < 0 ? 'text-[#B85838]' : 'text-[#D97706]';
          return (
          <div key={a.id} className={`p-3 ${i < arr.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
            <div className="flex justify-between items-baseline gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{a.name}</span>
                <span className="text-xs text-[#5A5751] ml-2">{a.institution} {a.fragment}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] ml-2">{a.type}</span>
                {a.isPrimary && <span className="text-[0.5625rem] uppercase tracking-wider text-[#B85838] font-semibold ml-2">★ primary</span>}
                {bal && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                    style={{ backgroundColor: '#1F6FEB22', color: '#1F6FEB', border: '1px solid #1F6FEB' }}
                    title={`Linked to QFX feed: ${bal.inst}${bal.tx_count ? ' · ' + bal.tx_count + ' transactions' : ''}`}>
                    bank-linked
                  </span>
                )}
                {/* Account-of-record proof (Darrell 2026-07-18): this account's
                    imported rows must form ONE self-consistent bank-balance chain.
                    Reconciles = the register is complete + un-double-counted AND
                    every row genuinely belongs here; a break points to a misfiled,
                    missing, or duplicated transaction. Truthful-or-absent: no badge
                    unless the rows actually carry bank balances to audit. */}
                {(() => {
                  const rec = accountReconciliation[a.id];
                  if (!rec || rec.checked < 2) return null;
                  const nUnmatched = rec.ok ? 0 : ((rec.breaks?.unmatchedBefore?.length || 0) + (rec.breaks?.unmatchedAfter?.length || 0));
                  return (
                    <span className="ml-2 inline-block px-1.5 py-0.5 text-[0.5625rem] uppercase tracking-wider"
                      style={rec.ok
                        ? { backgroundColor: '#16A34A22', color: '#16A34A', border: '1px solid #16A34A' }
                        : { backgroundColor: '#D9770622', color: '#D97706', border: '1px solid #D97706' }}
                      title={rec.ok
                        ? `Register reconciles: ${rec.checked} rows form one continuous bank-balance chain (${fmt(rec.opening)} to ${fmt(rec.closing)}) — complete, not double-counted, all belong to this account.`
                        : `Register has ${nUnmatched} balance break(s) — a transaction may be misfiled to another account, missing, or duplicated. Reset this account and re-import a clean statement.`}>
                      {rec.ok ? 'reconciles' : 'check register'}
                    </span>
                  );
                })()}
              </div>
              <div className="text-right">
                <div className={`${acctBal < 0 ? 'text-[#B85838]' : ''}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(acctBal)}</div>
                {hasBankBal && (
                  <div className="text-[0.625rem] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }} title={bal.balance_as_of ? `Bank ledger balance as of ${bal.balance_as_of}` : 'Bank ledger balance'}>
                    <span className="text-[#5A5751] uppercase tracking-wider mr-1">bank:</span>
                    <span className={bal.ledger_balance < 0 ? 'text-[#B85838]' : 'text-[#1A1815]'}>{fmt(bal.ledger_balance)}</span>
                    {bal.balance_as_of && <span className="text-[#5A5751] ml-1">· {bal.balance_as_of.slice(5)}</span>}
                  </div>
                )}
                {hasBankBal && delta !== null && Math.abs(delta) >= 0.5 && (
                  <div className={`text-[0.5625rem] mt-0.5 uppercase tracking-wider ${deltaClass}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    title="Difference between your manual balance and the bank's ledger balance. Edit your account to reconcile.">
                    Δ {delta > 0 ? '+' : ''}{fmt(delta)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <button type="button" onClick={() => editingId === a.id ? cancel() : startEdit(a)} aria-expanded={editingId === a.id} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingId === a.id ? '× Cancel edit' : '✎ Edit'}</button>
              {toggleAccountLegal && (
                <button type="button" onClick={() => { if (confirm(`Move "${a.name}" to Legal? It will be removed from cash totals and surface in the Legal tab. You can restore it from there.`)) toggleAccountLegal(a.id); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">🔒 Move to Legal</button>
              )}
              {/* Manual debt declaration (Darrell 2026-07-20: "this is a debt account
                  so it will be seen as a debt once chosen or removed"). One tap marks
                  the account a debt — it leaves cash totals and shows on the Debts tab
                  with its payoff from real payments; tap again to remove it. */}
              {updateAccount && (
                <button type="button" onClick={() => updateAccount(a.id, { treatAsDebt: !a.treatAsDebt })}
                  aria-pressed={!!a.treatAsDebt}
                  title={a.treatAsDebt ? 'Currently treated as a debt (shows on the Debts tab). Tap to stop treating it as a debt.' : 'Mark this account as a debt so it appears on the Debts tab with a payoff from your payments.'}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] ${a.treatAsDebt ? 'text-[#B85838] border-[#B85838] bg-[#FAF8F4]' : 'text-[#5A5751] border-transparent hover:text-[#1A1815] hover:border-[#1A1815] hover:bg-[#FAF8F4]'}`}>
                  {a.treatAsDebt ? 'Not a debt' : 'Treat as debt'}
                </button>
              )}
              <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
              <button type="button" onClick={() => confirmDelete(a)} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
            </div>
            {a.notes && <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{a.notes}</p>}
            {/* r20 — Inline edit drop-down per IN-PLACE-FIRST.md. */}
            {editingId === a.id && (
              <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838] space-y-2">
                <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-medium">Quick edit · {a.name}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Account name</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Institution</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Type</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Fragment</label><input className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" placeholder="...8168" value={form.fragment} onChange={e => setForm({ ...form, fragment: e.target.value })} /></div>
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Balance</label><input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></div>
                  <div><label className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Entity</label><select className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" value={form.entityId} onChange={e => setForm({ ...form, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                </div>
                <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white" rows="2" placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ fontFamily: '"Fraunces", serif' }}>
                  <input type="checkbox" checked={!!form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} className="accent-[#B85838]" />
                  <span><strong>Primary bill-pay account</strong></span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={submit} className="flex-1 bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                  <button type="button" onClick={cancel} className="px-4 py-2 border border-[#1A1815] text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                </div>
              </div>
            )}
          </div>
          );
        };
        return (
          <section key={r.entity.id} className="space-y-3">
            <h3 className="text-sm" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.entity.name.split('(')[0].trim()}</h3>

            {/* PRIMARY: Bank Accounts */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <h4 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold">💰 Bank Accounts</h4>
                <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{bankAccounts.length} · {fmt(bankTotal)}</div>
              </div>
              {bankAccounts.length === 0 ? (
                <div className="bg-white border border-[#E8E4DC] p-3 text-xs text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No bank accounts yet.</div>
              ) : (
                <div className="bg-white border-2 border-[#1A1815]">
                  {bankAccounts.map((a, i) => renderRow(a, i, bankAccounts))}
                </div>
              )}
            </div>

            {/* 2026-05-24: Credit Cards & Loans removed from this tab. They
                live on the Debts page now. The Move-to-Legal button on each
                bank-account row sends an account to the Legal tab if it's in
                dispute / probate / frozen / etc. */}
          </section>
        );
      })}
    </div>
  );
}
