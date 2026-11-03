// =============================================================================
// MoneyOverview — the first screen of Money: "How much can I safely spend
// or put toward debt after everything I need to pay?"
// =============================================================================
// Christina, 2026-10-28 (Phase 2, refined after her review of the preview):
// the PHONE is the priority. The amount, its reliability label and a SIMPLE
// breakdown must be understandable before any scrolling; the detailed lines
// and the explanation stay one tap away; the entity selector is one compact
// control on a phone; Bills, Budget and Debt Freedom are one tap below the card.
//
// THE SIMPLE BREAKDOWN RECONCILES WITH THE ENGINE, it does not simplify it
// (Christina: "Do not change the financial calculation merely to make the
// display simpler"). Its lines are the walk's own terms through the lowest
// day (lib/safe-to-spend.js `lines.toLowest`):
//   available cash + income received by then − bills and payments due by then
//   − reserves set aside by then = the lowest projected balance;
//   lowest − minimum cushion (floored at $0) = Safe to Spend Now.
// The identity holds to the cent by construction and is tested
// (safe-to-spend.test.js, "the simple breakdown reconciles with the walk").
//
// Every figure names its SOURCE and its RELIABILITY:
//   · "ledger" — derived from the real transaction ledger (never called a bank
//     balance: the bank feed is a retired overlay, so the card says
//     "Ledger-calculated (bank balance unavailable)" with the ledger's as-of date);
//   · "projected" — the engine's day-by-day walk;
//   · "entered" — the monthly figures typed into the books.
// The card never shows a negative spendable amount, never calls an estimate
// verified, and says UNAVAILABLE rather than $0 when no spendable account
// exists (P15). It writes only data.moneyPlan.settings (scope, period, privacy).
// COLORS ARE CLASSES with midnight twins (lib/theme-css.js). True red is never
// used for a shortfall (DR-0099): rust marks a shortfall, amber a caution.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import HelpButton from '../HelpButton.jsx';
import { buildSafeToSpend, PERIODS } from '../../lib/safe-to-spend.js';
import { moneySettings, patchMoneyPlan, setupSteps, syncStatus, balanceSource } from '../../lib/money-plan.js';
import { goalsSync } from '../../lib/goals-sync.js';
import { loadRecurringDecisions } from '../../lib/recurring-decisions.js';
import { totalPaidDownFromPeaks } from '../../lib/debt-outcomes.js';
import { fmt } from '../../lib/format.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5';
const EYEBROW = 'text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold';
const SERIF = { fontFamily: '"Fraunces", serif' };
const ON_CARD = `min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border transition-colors ${FOCUS}`;
const ON_CARD_ON = 'poe-selected bg-[#F6F1E7] text-[#1F3A2E] border-[#F6F1E7]';
const ON_CARD_OFF = 'bg-[#1F3A2E] text-[#F6F1E7] border-[#C9A227] hover:bg-[#2B2F2D]';

const STATUS_WORDS = {
  verified: { label: 'Ledger-verified projection', cls: 'text-[#5A6E3D] border-[#5A6E3D]', icon: 'check' },
  estimate: { label: 'Estimate', cls: 'text-[#B45309] border-[#B45309]', icon: 'alert' },
  unavailable: { label: 'Unavailable', cls: 'text-[#B85838] border-[#B85838]', icon: 'alert' },
};

function readMarker() { try { return localStorage.getItem('poe-snapshot-marker'); } catch (_) { return null; } }

export default function MoneyOverview({ money }) {
  const { data = {}, setData, currentDate, derivedDebts = [], totals = {}, bufferCurrent = 0, visibleEntities = null, setBooksView, setView, cloud = false, debtSnowball = null } = money || {};
  const settings = moneySettings(data);
  const [goals, setGoals] = useState([]);
  useEffect(() => {
    let unsub = null;
    try { unsub = goalsSync.subscribe((items) => setGoals(items || [])); } catch (_) { /* signed out: no goals */ }
    return () => { try { if (unsub) unsub(); } catch (_) { /* noop */ } };
  }, []);
  const decisions = useMemo(() => loadRecurringDecisions(), []);
  const [customEnd, setCustomEnd] = useState(settings.customEnd || '');

  const save = (patch) => setData && setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { settings: patch }) }));
  const scope = settings.scope || 'personal';
  const period = settings.defaultPeriod || 'next-paycheck';
  const privacy = !!settings.privacy;

  const result = useMemo(() => buildSafeToSpend(data, {
    currentDate, period, scope, customEnd: customEnd || settings.customEnd, settings, visibleEntities, goals, recurringDecisions: decisions, goalMeta: data.moneyPlan && data.moneyPlan.goalMeta,
  }), [data, currentDate, period, scope, customEnd, settings, visibleEntities, goals, decisions]);

  const setup = useMemo(() => setupSteps(data, { debts: derivedDebts }), [data, derivedDebts]);
  const sync = syncStatus({ cloud, marker: readMarker(), updatedAt: data.moneyPlan && data.moneyPlan.updatedAt });
  const source = balanceSource({ ledgerAsOf: result.freshness && result.freshness.ledgerAsOf });

  const show = (n) => (privacy ? '••••' : fmt(n));
  const status = STATUS_WORDS[result.status] || STATUS_WORDS.estimate;
  const entities = useMemo(() => visibleEntities || data.entities || [], [visibleEntities, data.entities]);
  const L = result.lines;
  const T = L.toLowest || {};
  const unavailable = result.status === 'unavailable';

  const debtTotal = derivedDebts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const paidDown = totalPaidDownFromPeaks(derivedDebts);
  const bufferTarget = Number(data.meta && data.meta.bufferTarget) || 0;
  const savingsPct = bufferTarget > 0 ? Math.min(100, Math.round((bufferCurrent / bufferTarget) * 100)) : null;
  const recent = useMemo(() => {
    const accounts = new Map((data.accounts || []).map((a) => [a.id, a]));
    const ok = (t) => { const a = accounts.get(t.accountId); return a && (!entities.length || entities.some((e) => e.id === a.entityId) || a.entityId == null); };
    return [...(data.transactions || [])].filter((t) => t && t.date && ok(t)).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8)
      .map((t) => ({ ...t, accountName: (accounts.get(t.accountId) || {}).name || '' }));
  }, [data.transactions, data.accounts, entities]);

  const go = (sub) => setBooksView && setBooksView(sub);
  const scopeOptions = [
    { id: 'personal', label: 'Personal' },
    ...entities.filter((e) => e.type && e.type !== 'personal' && e.type !== 'joint').map((e) => ({ id: e.id, label: e.name })),
    { id: 'consolidated', label: 'All entities' },
  ];
  const simple = [
    { key: 'cash', label: 'Available cash now', value: L.availableCash, sign: '', kind: source.kind === 'bank' ? 'bank' : 'ledger' },
    { key: 'income', label: `Income received by ${T.date || 'the low point'}`, value: T.income || 0, sign: '+', kind: 'projected' },
    { key: 'obligations', label: 'Bills and payments due by then', value: T.obligations || 0, sign: '−', kind: 'projected' },
    { key: 'reserves', label: 'Reserves set aside by then (taxes, savings, living)', value: T.reserves || 0, sign: '−', kind: 'projected' },
    { key: 'lowest', label: `Lowest projected balance${T.date ? ` · ${T.date}` : ''}`, value: L.projectedLowest.amount, sign: '=', kind: 'projected', strong: true },
    { key: 'cushion', label: 'Minimum cash cushion kept', value: L.minCushion, sign: '−', kind: 'entered' },
  ];

  return (
    <div data-testid="money-overview" className="space-y-3 sm:space-y-4">
      {/* THE CARD — first on every width; on a phone the amount owns the row */}
      <section aria-labelledby="sts-h" data-testid="safe-to-spend-card" className="bg-[#1F3A2E] text-[#F6F1E7] rounded-2xl p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <h2 id="sts-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#C9A227] font-semibold flex items-center gap-2">
            Safe to spend now
            <HelpButton variant="inline" topic="books:overview" />
          </h2>
          <button
            type="button"
            data-testid="money-privacy-toggle"
            onClick={() => save({ privacy: !privacy })}
            aria-pressed={privacy}
            aria-label={privacy ? 'Show amounts' : 'Hide amounts while others are nearby'}
            title={privacy ? 'Show amounts' : 'Hide amounts'}
            className={`${ON_CARD} inline-flex items-center gap-1.5 shrink-0 ${privacy ? ON_CARD_ON : ON_CARD_OFF}`}
          >
            <span aria-hidden="true"><UiIcon name="eye" /></span><span className="hidden sm:inline">{privacy ? 'Amounts hidden' : 'Hide amounts'}</span>
          </button>
        </div>
        <div data-testid="sts-amount" className="mt-1 text-5xl sm:text-6xl leading-none text-[#F6F1E7] break-words" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {unavailable ? 'Unavailable' : show(result.safeToSpendNow)}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.75rem]">
          <span data-testid="sts-status" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-[#F6F1E7] ${status.cls}`}>
            <span aria-hidden="true"><UiIcon name={status.icon} /></span>{status.label}
          </span>
          <span className="text-[#F6F1E7]">{result.period.label} <span aria-hidden="true">·</span> {result.scope.label}</span>
        </div>
        <div data-testid="sts-source" className="mt-1.5 text-[0.6875rem] text-[#F6F1E7]">
          {source.label} <span aria-hidden="true">·</span> ledger as of <strong>{result.freshness && result.freshness.ledgerAsOf ? result.freshness.ledgerAsOf : 'no entries yet'}</strong>
        </div>
        {result.shortfall > 0 && (
          <p data-testid="sts-shortfall" className="mt-2 text-[0.8125rem] text-[#F6F1E7]">
            Projected shortfall of <strong>{show(result.shortfall)}</strong> below your cash cushion{result.overdraftDate ? `, with the balance going negative on ${result.overdraftDate}` : ''}. Nothing is safely spendable today.
          </p>
        )}
        {result.confidence.reasons.length > 0 && result.status !== 'verified' && (
          <ul data-testid="sts-reasons" className="mt-2 text-[0.75rem] text-[#F6F1E7] list-disc pl-4 space-y-0.5">
            {result.confidence.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}

        {/* THE SIMPLE BREAKDOWN — the walk's own terms; reconciles to the cent */}
        {!unavailable && (
          <dl data-testid="sts-simple" className="mt-4 rounded-xl bg-[#F6F1E7] text-[#1F3A2E] p-3 text-[0.8125rem] divide-y divide-[#E8E4DC]">
            {simple.map((row) => (
              <div key={row.key} data-testid={`sts-simple-${row.key}`} className={`flex items-center gap-2 py-1.5 ${row.strong ? 'font-semibold' : ''}`}>
                <dt className="flex-1 min-w-0">{row.label}<span className="block text-[0.625rem] text-[#5A5751] font-normal">{row.kind}</span></dt>
                <dd className="shrink-0 tabular-nums" style={SERIF}>{row.sign && <span className="text-[#5A5751] mr-1">{row.sign}</span>}{show(row.value)}</dd>
              </div>
            ))}
            <div data-testid="sts-simple-safe" className="flex items-center gap-2 py-2 font-semibold text-base">
              <dt className="flex-1 min-w-0">Safe to spend now<span className="block text-[0.625rem] text-[#5A5751] font-normal">lowest minus cushion, never below zero</span></dt>
              <dd className="shrink-0 tabular-nums" style={SERIF}><span className="text-[#5A5751] mr-1">=</span>{show(result.safeToSpendNow)}</dd>
            </div>
          </dl>
        )}

        {/* Controls below the breakdown: scope (one control on a phone), then the period */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="lg:hidden flex-1 text-[0.625rem] text-[#C9A227] uppercase tracking-[0.18em] font-semibold">Whose money
            <select data-testid="money-scope-select" value={scope} onChange={(e) => save({ scope: e.target.value })} aria-label="Whose money" className="block mt-0.5 w-full min-h-[36px] px-2 rounded-lg border border-[#C9A227] bg-[#F6F1E7] text-[#1F3A2E] text-[0.8125rem] normal-case tracking-normal font-normal">
              {scopeOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Whose money" className="hidden lg:flex flex-wrap items-center gap-1.5">
            {scopeOptions.map((o) => (
              <button key={o.id} type="button" data-testid={`money-scope-${o.id}`} onClick={() => save({ scope: o.id })} aria-pressed={scope === o.id} className={`${ON_CARD} ${scope === o.id ? ON_CARD_ON : ON_CARD_OFF}`}>{o.label}</button>
            ))}
          </div>
        </div>
        <div role="group" aria-label="Planning period" className="mt-2 flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" data-testid={`money-period-${p.id}`} onClick={() => save({ defaultPeriod: p.id })} aria-pressed={period === p.id}
              className={`${ON_CARD} ${period === p.id ? ON_CARD_ON : ON_CARD_OFF}`}>{p.label}</button>
          ))}
          {period === 'custom' && (
            <label className="inline-flex items-center gap-2 text-[0.75rem]">
              <span>Until</span>
              <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); save({ customEnd: e.target.value }); }} aria-label="Custom end date" className="min-h-[36px] px-2 rounded-lg border border-[#C9A227] bg-[#F6F1E7] text-[#1F3A2E]" />
            </label>
          )}
        </div>

        {/* The detail — in place, one tap: every line, the projected cash line, how it was figured */}
        <details data-testid="sts-explain" className="mt-3 rounded-xl bg-[#F6F1E7] text-[#1F3A2E] p-3">
          <summary className={`cursor-pointer text-[0.75rem] font-semibold min-h-[36px] inline-flex items-center ${FOCUS}`}>Every line, and how this was figured</summary>
          <dl data-testid="sts-lines" className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 text-[0.75rem]">
            {[
              ['Current available cash', L.availableCash, source.kind === 'bank' ? 'bank' : 'ledger'],
              ['Bills due', L.billsDue, 'projected'],
              ['Minimum debt payments', L.debtMinimums, 'projected'],
              ['Living expenses reserved', L.livingExpenses, 'entered'],
              ['Taxes reserved', L.taxesReserved, 'projected'],
              ['Savings reserved', L.savingsReserved, 'entered'],
              ['Minimum cash cushion', L.minCushion, 'entered'],
              ['Other commitments', L.otherCommitments, 'projected'],
              ['Expected income (on its day)', L.expectedIncome, 'projected'],
              ['Projected lowest balance', L.projectedLowest.amount, 'projected', L.projectedLowest.date],
            ].map(([label, value, kind, note]) => (
              <div key={label}>
                <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751] font-semibold">{label}</dt>
                <dd className="text-base" style={SERIF}>{show(value)}<span className="block text-[0.625rem] text-[#5A5751]">{kind}{note ? ` · ${note}` : ''}</span></dd>
              </div>
            ))}
            <div>
              <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751] font-semibold">Next expected income</dt>
              <dd className="text-base" style={SERIF}>{L.nextIncome ? L.nextIncome.date : 'Not known'}<span className="block text-[0.625rem] text-[#5A5751]">{L.nextIncome ? `${show(L.nextIncome.amount)} · ${L.nextIncome.inferred ? 'inferred' : 'entered'}` : 'add a pay schedule in Settings'}</span></dd>
            </div>
            <div>
              <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751] font-semibold">Potential extra debt payment</dt>
              <dd className="text-base" style={SERIF}>{unavailable ? '—' : show(L.potentialDebtPayment)}<span className="block text-[0.625rem] text-[#5A5751]">projected · same as safe to spend</span></dd>
            </div>
          </dl>
          <ProjectedCashLine timeline={result.timeline} cushion={L.minCushion} privacy={privacy} />
          <ol className="mt-3 text-[0.75rem] leading-relaxed list-decimal pl-4 space-y-1">
            {result.explanation.map((line) => <li key={line}>{line}</li>)}
          </ol>
          {result.assumptions.length > 0 && (
            <div className="mt-3">
              <div className="text-[0.5625rem] uppercase tracking-[0.18em] font-semibold">Assumptions and missing information</div>
              <ul className="mt-1 text-[0.75rem] list-disc pl-4 space-y-0.5">{result.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}
          {result.items.length > 0 && (
            <div className="mt-3">
              <div className="text-[0.5625rem] uppercase tracking-[0.18em] font-semibold">Dated items in this period</div>
              <ul className="mt-1 text-[0.75rem] space-y-0.5 max-h-48 overflow-y-auto">
                {result.items.map((it, i) => (
                  <li key={`${it.refId || it.label}-${it.date}-${i}`} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{it.date} <span aria-hidden="true">·</span> {it.label}{it.assumed ? ' (assumed timing)' : ''}{it.source === 'inferred' ? ' (inferred)' : ''}</span>
                    <span className="shrink-0" style={SERIF}>{it.amount > 0 ? '+' : ''}{show(it.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-2 text-[0.6875rem]">Books last updated {data.meta && data.meta.lastUpdated ? data.meta.lastUpdated : '—'}.</div>
        </details>
      </section>

      {/* Shortcuts — one tap to the three Christina named */}
      <nav aria-label="Money shortcuts" data-testid="money-shortcuts" className="grid grid-cols-3 gap-2">
        {[['bills', 'Bills', 'calendar'], ['budget', 'Budget', 'sliders'], ['debt-freedom', 'Debt Freedom', 'shield']].map(([id, label, icon]) => (
          <button key={id} type="button" data-testid={`money-shortcut-${id}`} onClick={() => go(id)} className={`${CARD} min-h-[44px] flex items-center justify-center gap-2 text-[0.8125rem] font-semibold text-[#1A1815] hover:bg-[#FAF8F4] ${FOCUS}`}>
            <span aria-hidden="true" className="text-[#B85838]"><UiIcon name={icon} /></span>{label}
          </button>
        ))}
      </nav>

      {/* Missing information → the guided setup */}
      {!setup.complete && (
        <div data-testid="money-setup-banner" className="bg-[#FBF7EC] border border-[#C9A227] rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-[#B45309]"><UiIcon name="alert" /></span>
          <div className="flex-1 min-w-0 text-[0.8125rem] text-[#1A1815]">
            <strong>{setup.done} of {setup.applicable}</strong> setup steps entered{setup.essentialsComplete ? ' (the essentials are complete)' : ''}. Missing: {setup.steps.filter((s) => s.applies && !s.done).map((s) => `${s.label}${s.required ? '' : ' (optional)'}`).join(', ')}. Nothing is invented for a missing value.
          </div>
          <button type="button" data-testid="money-setup-link" onClick={() => go('settings')} className={`min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`}>Open guided setup</button>
        </div>
      )}

      {/* The rest of the dashboard */}
      <section aria-labelledby="money-grid-h" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <h2 id="money-grid-h" className="sr-only">This month at a glance</h2>
        <Tile label="Monthly income" value={show(totals.totalInflow)} note="entered monthly figures" onClick={() => go('accounts')} />
        <Tile label="Monthly expenses" value={show(totals.totalOutflow)} note="entered monthly figures" onClick={() => go('budget')} />
        <Tile label="Net cash flow" value={`${(totals.netCashFlow || 0) >= 0 ? '+' : ''}${show(totals.netCashFlow)}`} note="entered · per month" tone={(totals.netCashFlow || 0) >= 0 ? 'good' : 'warn'} onClick={() => go('budget')} />
        <Tile label="Upcoming bills" value={show(L.billsDue + L.debtMinimums)} note={`projected · ${result.period.label.toLowerCase()}`} onClick={() => go('bills')} />
        <Tile label="Total outstanding debt" value={show(debtTotal)} note={`ledger · ${derivedDebts.length} debt${derivedDebts.length === 1 ? '' : 's'}`} onClick={() => go('debt-freedom')} />
        <Tile label="Savings progress" value={savingsPct == null ? show(bufferCurrent) : `${savingsPct}%`} note={savingsPct == null ? 'ledger · savings accounts · no target set' : `ledger · ${show(bufferCurrent)} of ${show(bufferTarget)} buffer`} bar={savingsPct} onClick={() => go('goals')} />
        <Tile label="Debt payoff progress" value={show(paidDown.total)} note={debtSnowball && debtSnowball.allClearedDate ? `paid down from peaks · legacy projection debt-free ${debtSnowball.allClearedDate}` : 'paid down from recorded peaks'} onClick={() => go('debt-freedom')} />
        <div className={`${CARD} flex flex-col`}>
          <div className={EYEBROW}>Settings sync</div>
          <div data-testid="money-sync-status" data-state={sync.state} className="mt-1 text-sm text-[#1A1815]" style={SERIF}>{sync.label}</div>
          <div className="text-[0.625rem] text-[#5A5751] mt-0.5">{sync.detail}</div>
        </div>
      </section>

      <section aria-labelledby="recent-h" className={CARD}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 id="recent-h" className={EYEBROW}>Recent transactions</h2>
          <button type="button" onClick={() => go('transactions')} className={`min-h-[36px] px-3 text-[0.75rem] text-[#5A5751] hover:text-[#1A1815] ${FOCUS}`}>All transactions</button>
        </div>
        {recent.length === 0 ? (
          <p className="text-[0.8125rem] text-[#5A5751]">No transactions on these accounts yet. Add one on Transactions, or drop a statement on Upload (top right).</p>
        ) : (
          <ul data-testid="money-recent" className="divide-y divide-[#E8E4DC]">
            {recent.map((t) => (
              <li key={t.id} className="py-2 flex items-center gap-3 text-[0.8125rem]">
                <span className="text-[#5A5751] shrink-0 w-[5.5rem]">{String(t.date).slice(0, 10)}</span>
                <span className="min-w-0 flex-1 truncate text-[#1A1815]">{t.description || t.payee || 'Transaction'}<span className="block text-[0.625rem] text-[#5A5751]">{t.category || 'uncategorized'} <span aria-hidden="true">·</span> {t.accountName}</span></span>
                <span className={`shrink-0 ${Number(t.amount) < 0 ? 'text-[#1A1815]' : 'text-[#5A6E3D]'}`} style={SERIF}>{Number(t.amount) > 0 ? '+' : ''}{show(Number(t.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {setView && (
        <p className="text-[0.6875rem] text-[#5A5751]">Projections, not promises — a model of your own numbers, never investment advice. The longer view lives on Forecast.</p>
      )}
    </div>
  );
}

function Tile({ label, value, note, tone = null, bar = null, onClick }) {
  const toneCls = tone === 'good' ? 'text-[#5A6E3D]' : tone === 'warn' ? 'text-[#B85838]' : 'text-[#1A1815]';
  return (
    <button type="button" onClick={onClick} className={`${CARD} text-left hover:bg-[#FAF8F4] ${FOCUS}`}>
      <div className={EYEBROW}>{label}</div>
      <div className={`mt-1 text-xl ${toneCls}`} style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{value}</div>
      {bar != null && (
        <div className="mt-2 h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bar} aria-label={label}>
          <div className="h-full bg-[#5A6E3D]" style={{ width: `${bar}%` }} />
        </div>
      )}
      <div className="text-[0.625rem] text-[#5A5751] mt-1">{note}</div>
    </button>
  );
}

// One series (projected cash, day by day) — the title names it, so no legend;
// the cushion is a dashed reference. Hover shows the day and the figure.
function ProjectedCashLine({ timeline = [], cushion = 0, privacy = false }) {
  const [hover, setHover] = useState(null);
  if (!timeline.length || timeline.length < 2) return null;
  const W = 600; const H = 120; const PAD = 8;
  const vals = timeline.map((t) => t.cash);
  const lo = Math.min(0, cushion, ...vals); const hi = Math.max(cushion, ...vals, lo + 1);
  const x = (i) => PAD + (i / (timeline.length - 1)) * (W - PAD * 2);
  const y = (v) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const path = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const h = hover != null ? timeline[hover] : null;
  return (
    <figure data-testid="sts-chart" className="mt-4" aria-label="Projected cash balance, day by day, with the cash cushion as a dashed line">
      <figcaption className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#5A5751] font-semibold">Projected cash, day by day</figcaption>
      <div className="relative text-[#1F3A2E]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[7.5rem] mt-1" role="img" aria-hidden="false">
          <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
          <g className="text-[#8A6510]"><line x1={PAD} x2={W - PAD} y1={y(cushion)} y2={y(cushion)} stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" /></g>
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {h && <circle cx={x(hover)} cy={y(h.cash)} r="4" fill="currentColor" />}
          {timeline.map((t, i) => (
            <rect key={t.date} x={x(i) - (W / timeline.length) / 2} y={0} width={W / timeline.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={-1}>
              <title>{`${t.date}: ${privacy ? 'hidden' : fmt(t.cash)}`}</title>
            </rect>
          ))}
        </svg>
        {h && (
          <div className="absolute top-0 right-0 text-[0.6875rem] bg-white text-[#1A1815] border border-[#E8E4DC] rounded px-2 py-1" role="status">{h.date} <span aria-hidden="true">·</span> {privacy ? '••••' : fmt(h.cash)}</div>
        )}
      </div>
      <div className="text-[0.625rem] text-[#5A5751] mt-1">Dashed line: the cash cushion. Lowest point {timeline.reduce((m, t) => (t.cash < m.cash ? t : m), timeline[0]).date}.</div>
    </figure>
  );
}
