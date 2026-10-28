// =============================================================================
// MoneyOverview — the first screen of Money: "How much can I safely spend
// or put toward debt after everything I need to pay?"
// =============================================================================
// Christina, 2026-10-28. The Safe-to-Spend card is the headline; everything else
// on this page serves it. Every figure names its SOURCE and its RELIABILITY:
//
//   · "Ledger-calculated" — derived from the real transaction ledger
//     (deriveAccountBalances, lib/financial-engineering.js). It is never called
//     a bank balance: the bank feed (ingestData) is a retired overlay, so a
//     bank-reported available balance is unavailable today and the card says so
//     with the ledger's own as-of date (lib/money-plan.js balanceSource).
//   · "Projected" — the engine's day-by-day walk (lib/safe-to-spend.js). Labeled
//     projected on every line it touches, with the explanation one tap away.
//   · "Entered" — the monthly income/expense figures typed into the books
//     (data.inflows / data.outflows), the same ones Big Picture reads.
//
// The card never shows a negative spendable amount, never calls an estimate
// verified, and says UNAVAILABLE rather than $0 when no spendable account
// exists (P15: a surface says what it sees, what is missing, and how to fix it —
// the missing-setup banner routes to Money → Settings, the guided setup).
//
// Amounts can be hidden when others are nearby (the eye toggle); the choice is
// part of the family's Money settings so it follows the snapshot.
//
// Pure render over the engine + the shell's own derivations; it writes only
// data.moneyPlan.settings through the shell's setData (scope, period, privacy).
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
const CHIP = `min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border transition-colors ${FOCUS}`;
const CHIP_ON = 'poe-selected bg-[#1A1815] text-white border-[#1A1815]';
const CHIP_OFF = 'bg-white text-[#5A5751] border-[#E8E4DC] hover:bg-[#FAF8F4] hover:text-[#1A1815]';

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

  return (
    <div data-testid="money-overview" className="space-y-4">
      {/* Controls: scope · period · privacy */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Whose money" className="flex flex-wrap items-center gap-1.5">
          <button type="button" data-testid="money-scope-personal" onClick={() => save({ scope: 'personal' })} aria-pressed={scope === 'personal'} className={`${CHIP} ${scope === 'personal' ? CHIP_ON : CHIP_OFF}`}>Personal</button>
          {entities.filter((e) => e.type && e.type !== 'personal' && e.type !== 'joint').map((e) => (
            <button key={e.id} type="button" data-testid={`money-scope-${e.id}`} onClick={() => save({ scope: e.id })} aria-pressed={scope === e.id} className={`${CHIP} ${scope === e.id ? CHIP_ON : CHIP_OFF}`}>{e.name}</button>
          ))}
          <button type="button" data-testid="money-scope-consolidated" onClick={() => save({ scope: 'consolidated' })} aria-pressed={scope === 'consolidated'} className={`${CHIP} ${scope === 'consolidated' ? CHIP_ON : CHIP_OFF}`}>All entities</button>
        </div>
        <span className="flex-1" />
        <button
          type="button"
          data-testid="money-privacy-toggle"
          onClick={() => save({ privacy: !privacy })}
          aria-pressed={privacy}
          aria-label={privacy ? 'Show amounts' : 'Hide amounts while others are nearby'}
          title={privacy ? 'Show amounts' : 'Hide amounts'}
          className={`${CHIP} inline-flex items-center gap-1.5 ${privacy ? CHIP_ON : CHIP_OFF}`}
        >
          <span aria-hidden="true"><UiIcon name="eye" /></span>{privacy ? 'Amounts hidden' : 'Hide amounts'}
        </button>
      </div>

      {/* THE CARD */}
      <section aria-labelledby="sts-h" data-testid="safe-to-spend-card" className="bg-[#1F3A2E] text-[#F6F1E7] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 id="sts-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#C9A227] font-semibold flex items-center gap-2">
              Safe to spend now
              <HelpButton variant="inline" topic="books:overview" />
            </h2>
            <div data-testid="sts-amount" className="mt-1 text-4xl sm:text-5xl leading-none text-[#F6F1E7]" style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.02em' }}>
              {result.status === 'unavailable' ? 'Unavailable' : show(result.safeToSpendNow)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.75rem]">
              <span data-testid="sts-status" className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-[#F6F1E7] ${status.cls}`}>
                <span aria-hidden="true"><UiIcon name={status.icon} /></span>{status.label}
              </span>
              <span className="text-[#F6F1E7]">{result.period.label} <span aria-hidden="true">·</span> {result.scope.label}</span>
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
          </div>
          <div className="shrink-0 text-[0.6875rem] text-[#F6F1E7] sm:text-right space-y-0.5">
            <div data-testid="sts-source">{source.label}</div>
            <div>Ledger as of <strong>{result.freshness && result.freshness.ledgerAsOf ? result.freshness.ledgerAsOf : 'no entries yet'}</strong></div>
            <div>Books last updated {data.meta && data.meta.lastUpdated ? data.meta.lastUpdated : '—'}</div>
          </div>
        </div>

        {/* Period */}
        <div role="group" aria-label="Planning period" className="mt-4 flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" data-testid={`money-period-${p.id}`} onClick={() => save({ defaultPeriod: p.id })} aria-pressed={period === p.id}
              className={`${CHIP} ${period === p.id ? 'poe-selected bg-[#F6F1E7] text-[#1F3A2E] border-[#F6F1E7]' : 'bg-[#1F3A2E] text-[#F6F1E7] border-[#C9A227] hover:bg-[#2B2F2D]'}`}>{p.label}</button>
          ))}
          {period === 'custom' && (
            <label className="inline-flex items-center gap-2 text-[0.75rem]">
              <span>Until</span>
              <input type="date" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); save({ customEnd: e.target.value }); }} aria-label="Custom end date" className="min-h-[36px] px-2 rounded-lg border border-[#C9A227] bg-[#F6F1E7] text-[#1F3A2E]" />
            </label>
          )}
        </div>

        {/* The breakdown */}
        <dl data-testid="sts-lines" className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-3 text-[0.75rem]">
          {[
            ['Current available cash', L.availableCash, 'ledger'],
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
              <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">{label}</dt>
              <dd className="text-base text-[#F6F1E7]" style={SERIF}>{show(value)}<span className="block text-[0.625rem] text-[#F6F1E7] opacity-80">{kind}{note ? ` · ${note}` : ''}</span></dd>
            </div>
          ))}
          <div>
            <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">Next expected income</dt>
            <dd className="text-base text-[#F6F1E7]" style={SERIF}>{L.nextIncome ? L.nextIncome.date : 'Not known'}<span className="block text-[0.625rem] text-[#F6F1E7] opacity-80">{L.nextIncome ? `${show(L.nextIncome.amount)} · ${L.nextIncome.inferred ? 'inferred' : 'entered'}` : 'add a pay schedule in Settings'}</span></dd>
          </div>
          <div>
            <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">Potential extra debt payment</dt>
            <dd className="text-base text-[#F6F1E7]" style={SERIF}>{result.status === 'unavailable' ? '—' : show(L.potentialDebtPayment)}<span className="block text-[0.625rem] text-[#F6F1E7] opacity-80">projected · same as safe to spend</span></dd>
          </div>
        </dl>

        <ProjectedCashLine timeline={result.timeline} cushion={L.minCushion} privacy={privacy} />

        {/* How it was figured — in place, one tap */}
        <details data-testid="sts-explain" className="mt-4 rounded-xl bg-[#F6F1E7] text-[#1F3A2E] p-3">
          <summary className={`cursor-pointer text-[0.75rem] font-semibold min-h-[36px] inline-flex items-center ${FOCUS}`}>How this was figured</summary>
          <ol className="mt-2 text-[0.75rem] leading-relaxed list-decimal pl-4 space-y-1">
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
        </details>
      </section>

      {/* Missing information → the guided setup */}
      {!setup.complete && (
        <div data-testid="money-setup-banner" className="bg-[#FBF7EC] border border-[#C9A227] rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="text-[#B45309]"><UiIcon name="alert" /></span>
          <div className="flex-1 min-w-0 text-[0.8125rem] text-[#1A1815]">
            <strong>{setup.done} of {setup.applicable}</strong> setup steps entered. Missing: {setup.steps.filter((s) => s.applies && !s.done).map((s) => s.label).join(', ')}. Nothing is invented for a missing value — the figures above say what they are missing.
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
        <Tile label="Debt payoff progress" value={show(paidDown.total)} note={debtSnowball && debtSnowball.allClearedDate ? `paid down from peaks · projected debt-free ${debtSnowball.allClearedDate}` : 'paid down from recorded peaks'} onClick={() => go('debt-freedom')} />
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
      <figcaption className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">Projected cash, day by day</figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[7.5rem] mt-1" role="img" aria-hidden="false">
          <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
          <g className="text-[#C9A227]"><line x1={PAD} x2={W - PAD} y1={y(cushion)} y2={y(cushion)} stroke="currentColor" strokeDasharray="4 4" strokeWidth="1.5" /></g>
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {h && <circle cx={x(hover)} cy={y(h.cash)} r="4" fill="currentColor" />}
          {timeline.map((t, i) => (
            <rect key={t.date} x={x(i) - (W / timeline.length) / 2} y={0} width={W / timeline.length} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={-1}>
              <title>{`${t.date}: ${privacy ? 'hidden' : fmt(t.cash)}`}</title>
            </rect>
          ))}
        </svg>
        {h && (
          <div className="absolute top-0 right-0 text-[0.6875rem] bg-[#F6F1E7] text-[#1F3A2E] rounded px-2 py-1" role="status">{h.date} <span aria-hidden="true">·</span> {privacy ? '••••' : fmt(h.cash)}</div>
        )}
      </div>
      <div className="text-[0.625rem] text-[#F6F1E7] opacity-80 mt-1">Dashed line: the cash cushion. Lowest point {timeline.reduce((m, t) => (t.cash < m.cash ? t : m), timeline[0]).date}.</div>
    </figure>
  );
}
