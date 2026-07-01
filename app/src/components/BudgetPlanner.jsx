// =============================================================================
// BudgetPlanner — the goal-driven, forward-looking budget engine surface
// =============================================================================
// Mounted as the "Goals" tab inside Forecast (same real data, same family gate).
// This is where the family SETS financial goals and the deterministic engine
// (lib/budget-engine.js) plans from their real income + obligations + categorized
// ledger to answer: what to set aside per period, on/off track, projected finish,
// and the proactive spend / hold / covered guidance — each signal carrying its
// REASON. Every number traces to a real record (DR-0076); nothing is painted.
//
// BINDING (CLAUDE.md): a budgeting / cash-flow PLANNING tool on the owner's own
// goals + data — PROJECTIONS, not promises; NOT investment advice; NO money
// movement, NO trades. When the ledger is thin/uncategorized the engine SAYS SO
// (a confidence banner) instead of faking precision. All math is unit-tested in
// __tests__/budget-engine.test.js; this file only captures goals + renders.
//
// THEME-SAFE (contrast + legibility guards, DR-0076): colors go through the
// midnight-remapped Tailwind CLASS tokens only — never inline color styles and
// never an un-remapped hex — so every surface reads AA on the dark theme too.
// Fonts use rem, not fixed px (consistency guard).
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import HelpButton from './HelpButton.jsx';
import { deriveDebts } from '../lib/financial-engineering.js';
import { buildGuidance, freeMonthlyForScope } from '../lib/budget-engine.js';
import { goalsSync } from '../lib/goals-sync.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(Number(n) || 0)).toLocaleString()}`;

// Semantic color CLASSES — every hex here is midnight-remapped (bright on dark),
// so status color never regresses to dark-on-dark. Text + border pairs.
const GOOD = 'text-[#15803D] border-[#15803D]';
const WARN = 'text-[#B45309] border-[#B45309]';
const BAD = 'text-[#991B1B] border-[#991B1B]';
const MUTED = 'text-[#5A5751] border-[#5A5751]';

// Severity → { text/border class, label }. Dots + chips read on both themes.
const SEV = {
  alert: { cls: BAD, txt: 'text-[#991B1B]', label: 'Act now' },
  watch: { cls: WARN, txt: 'text-[#B45309]', label: 'Heads-up' },
  info: { cls: GOOD, txt: 'text-[#15803D]', label: 'Good news' },
};

function statusPair(status) {
  if (status === 'on-track' || status === 'achieved') return GOOD;
  if (status === 'behind' || status === 'no-date') return WARN;
  if (status === 'at-risk') return BAD;
  return MUTED;
}
// Covered bg tokens only for the funded-bar fill (#5A6E3D / #B85838 both remap).
function barFill(status) {
  return (status === 'on-track' || status === 'achieved') ? 'bg-[#5A6E3D]' : 'bg-[#B85838]';
}
const toneTxt = (ok) => (ok ? 'text-[#15803D]' : 'text-[#991B1B]');

function localId() { return `goal-${Date.now()}`; }

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Add-a-goal capture (clean, wired, self-explaining) ─────────────────────
function GoalForm({ debts, scope, currentDate, onAdd, onCancel }) {
  const [goalType, setGoalType] = useState('save');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [linkedDebtId, setLinkedDebtId] = useState(debts[0]?.id || '');

  const linked = debts.find((d) => d.id === linkedDebtId);
  const effectiveTarget = goalType === 'payoff' && linked ? linked.balance : Number(targetAmount) || 0;
  const valid = name.trim() && effectiveTarget > 0 && targetDate;

  const input = 'w-full px-2.5 py-2 text-sm border border-[#D8D0C2] bg-white text-[#1A1815] min-h-[40px]';

  const submit = () => {
    if (!valid) return;
    onAdd({
      id: localId(),
      name: name.trim(),
      goalType,
      scope,
      targetAmount: effectiveTarget,
      targetDate,
      startDate: currentDate.toISOString().slice(0, 10),
      currentAmount: goalType === 'save' ? (Number(currentAmount) || 0) : 0,
      linkedDebtId: goalType === 'payoff' ? (linkedDebtId || null) : null,
      priority: 0,
      note: '',
      archived: false,
    });
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>New goal</h3>
        <div className="flex gap-1">
          {[['save', 'Save toward'], ['payoff', 'Pay off']].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setGoalType(id)}
              className={`px-3 py-1.5 text-xs border min-h-[36px] ${goalType === id ? 'bg-[#1A1815] text-[#FAF8F4] border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#D8D0C2]'}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={labelCls}>{goalType === 'payoff' ? 'What are you paying off?' : 'What are you saving for?'}</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder={goalType === 'payoff' ? 'e.g. Chase card' : 'e.g. 6-month buffer'} />
        </label>

        {goalType === 'payoff' ? (
          <label className="block">
            <span className={labelCls}>Which debt (live balance)</span>
            {debts.length ? (
              <select className={input} value={linkedDebtId} onChange={(e) => setLinkedDebtId(e.target.value)}>
                {debts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {money(d.balance)}</option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-[#5A5751] py-2">No debts on record for this view. Add one in Books, or use a “Save toward” goal.</div>
            )}
          </label>
        ) : (
          <label className="block">
            <span className={labelCls}>Target amount</span>
            <input className={input} type="number" inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="6000" />
          </label>
        )}

        <label className="block">
          <span className={labelCls}>By when</span>
          <input className={input} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>

        {goalType === 'save' && (
          <label className="block">
            <span className={labelCls}>Already set aside (optional)</span>
            <input className={input} type="number" inputMode="decimal" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} placeholder="0" />
          </label>
        )}
      </div>

      {goalType === 'payoff' && linked && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-2">Target is the <strong>live balance</strong> of {linked.name} ({money(linked.balance)}) — it moves as payments post to the ledger, so you never re-enter it.</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button onClick={submit} disabled={!valid} className="px-4 py-2 text-xs font-semibold bg-[#1A1815] text-[#FAF8F4] border border-[#1A1815] min-h-[40px] disabled:opacity-40">Add goal</button>
        <button onClick={onCancel} className="px-3 py-2 text-xs text-[#5A5751] border border-[#D8D0C2] min-h-[40px]">Cancel</button>
        {!valid && <span className="text-[0.625rem] text-[#5A5751]">Name, amount, and a date are required.</span>}
      </div>
    </div>
  );
}

// ── One goal's plan card ───────────────────────────────────────────────────
function GoalCard({ plan, onUpdateSaved, onDelete }) {
  const g = plan.goal;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(g.currentAmount || 0);
  const pair = statusPair(plan.status);
  const statusLabel = {
    'on-track': 'On track', behind: 'Behind plan', 'at-risk': 'At risk',
    achieved: 'Reached', 'no-date': 'No deadline',
  }[plan.status] || plan.status;

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">{g.name}</div>
          <div className="text-[0.625rem] text-[#5A5751]">
            {g.goalType === 'payoff' ? 'Pay off' : 'Save'} {money(g.targetAmount)} by {fmtDate(g.targetDate)}
            {plan.basis === 'live-debt' && <span> · live balance</span>}
          </div>
        </div>
        <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border shrink-0 ${pair}`}>{statusLabel}</span>
      </div>

      {/* funded bar — text carries the number so it reads without color */}
      <div className="mt-3">
        <div className="flex justify-between text-[0.625rem] text-[#5A5751] mb-1">
          <span>{plan.pctFunded}% funded</span>
          <span>{money(plan.remaining)} to go</span>
        </div>
        <div className="h-2 bg-[#E8E4DC]" role="img" aria-label={`${plan.pctFunded} percent funded`}>
          <div className={`h-full ${barFill(plan.status)}`} style={{ width: `${plan.pctFunded}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div>
          <div className={labelCls}>Set aside / mo</div>
          <div className="tabular-nums font-semibold text-[#1A1815]">{money(plan.requiredMonthly)}</div>
        </div>
        <div>
          <div className={labelCls}>Getting / mo</div>
          <div className={`tabular-nums font-semibold ${toneTxt(plan.allocated >= plan.requiredMonthly)}`}>{money(plan.allocated ?? 0)}</div>
        </div>
        <div>
          <div className={labelCls}>Lands</div>
          <div className="tabular-nums font-semibold text-[#1A1815]">{plan.projectedDate ? fmtDate(plan.projectedDate) : '—'}</div>
        </div>
      </div>

      {plan.status === 'behind' && plan.shortfallMonthly > 0 && (
        <p className="text-[0.6875rem] mt-2 text-[#B45309]">Free up {money(plan.shortfallMonthly)}/mo more, or move the date, to stay on plan.</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        {g.goalType === 'save' && !editing && (
          <button onClick={() => { setEditing(true); setSaved(g.currentAmount || 0); }} className="px-3 py-1.5 text-[0.6875rem] border border-[#D8D0C2] text-[#1A1815] min-h-[36px]">Update saved</button>
        )}
        {g.goalType === 'save' && editing && (
          <>
            <input type="number" inputMode="decimal" value={saved} onChange={(e) => setSaved(e.target.value)} className="w-24 px-2 py-1.5 text-xs border border-[#D8D0C2] bg-white text-[#1A1815] tabular-nums min-h-[36px]" />
            <button onClick={() => { onUpdateSaved(g.id, Number(saved) || 0); setEditing(false); }} className="px-3 py-1.5 text-[0.6875rem] bg-[#1A1815] text-[#FAF8F4] min-h-[36px]">Save</button>
            <button onClick={() => setEditing(false)} className="px-2 py-1.5 text-[0.6875rem] text-[#5A5751] min-h-[36px]">Cancel</button>
          </>
        )}
        <button onClick={() => onDelete(g.id)} className="px-3 py-1.5 text-[0.6875rem] text-[#991B1B] border border-[#E8E4DC] min-h-[36px] ml-auto">Delete</button>
      </div>
    </div>
  );
}

// ── Guidance signal row ────────────────────────────────────────────────────
function SignalRow({ s }) {
  const sev = SEV[s.severity] || SEV.info;
  return (
    <div className="flex gap-2.5 py-2.5 border-b border-[#F0EBE1] last:border-0">
      <span className={`text-sm leading-5 shrink-0 ${sev.txt}`} aria-hidden="true">●</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#1A1815] flex items-center gap-2">
          {s.title}
          <span className={`text-[0.5rem] uppercase tracking-wider px-1 py-0.5 border ${sev.cls}`}>{sev.label}</span>
        </div>
        <div className="text-xs text-[#5A5751] leading-relaxed mt-0.5">{s.reason}</div>
      </div>
    </div>
  );
}

const CONF = {
  high: { pair: GOOD, label: 'High confidence' },
  medium: { pair: WARN, label: 'Medium confidence' },
  low: { pair: BAD, label: 'Low confidence' },
  none: { pair: MUTED, label: 'No data yet' },
};

export default function BudgetPlanner({ data, currentDate, scope = 'consolidated', months = 12 }) {
  const [goals, setGoals] = useState([]);
  const [adding, setAdding] = useState(false);
  const [threshold, setThreshold] = useState(0.15); // sensitivity the user controls
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);

  // Own the goals subscription (self-contained, like Forecast owns forecastSync).
  useEffect(() => {
    const unsub = goalsSync.subscribe((items) => setGoals(items || []));
    return () => { try { unsub(); } catch (e) { /* noop */ } };
  }, []);

  const debts = useMemo(() => deriveDebts(data, cd), [data, cd]);

  const guidance = useMemo(
    () => buildGuidance(data, goals, { currentDate: cd, scope, months, threshold }),
    [data, goals, cd, scope, months, threshold],
  );
  const freeMonthly = useMemo(() => freeMonthlyForScope(data, scope), [data, scope]);

  const scopedGoals = goals.filter((g) => (g.scope || 'consolidated') === scope && !g.archived);
  const plansByGoal = useMemo(() => {
    const m = {};
    for (const p of guidance.allocation.plans) m[p.goal.id] = p;
    return m;
  }, [guidance]);

  const addGoal = useCallback(async (goal) => {
    setGoals((prev) => [goal, ...prev]); // optimistic
    setAdding(false);
    try { await goalsSync.upload(goal); } catch (e) { /* localStorage still holds it */ }
  }, []);

  // updateRow/deleteRow key on the DB uuid (remoteUuid), not the local slug —
  // the same pattern every monolith sync uses. When a goal was just created and
  // hasn't round-tripped yet it has no remoteUuid; the local edit still applies
  // and the realtime refetch reconciles it (localStorage-only when signed out).
  const updateSaved = useCallback(async (id, amount) => {
    const g = goals.find((x) => x.id === id);
    setGoals((prev) => prev.map((x) => (x.id === id ? { ...x, currentAmount: amount } : x)));
    if (g?.remoteUuid) { try { await goalsSync.updateRow(g.remoteUuid, { current_amount: amount }); } catch (e) { /* noop */ } }
  }, [goals]);

  const deleteGoal = useCallback(async (id) => {
    const g = goals.find((x) => x.id === id);
    setGoals((prev) => prev.filter((x) => x.id !== id));
    if (g?.remoteUuid) { try { await goalsSync.deleteRow(g.remoteUuid); } catch (e) { /* noop */ } }
  }, [goals]);

  const conf = CONF[guidance.confidence.level] || CONF.none;
  const catAttention = guidance.categoryRows.filter((r) => r.status === 'over' || r.status === 'hot');

  return (
    <div className="space-y-4">
      {/* Intro + confidence — self-explaining, honest about data quality */}
      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1815] flex items-center gap-2" style={{ fontFamily: '"Fraunces", serif' }}>
              Goals & guidance
              <HelpButton variant="inline" topic="budget" />
            </h3>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 leading-relaxed">
              Set a target; the engine plans it from your real income and upcoming bills, and warns before you overspend.
              Planning guidance on your own data — <em>not investment advice, no money moves here.</em>
            </p>
          </div>
          <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border shrink-0 ${conf.pair}`}>{conf.label}</span>
        </div>
        {(guidance.confidence.level === 'low' || guidance.confidence.level === 'medium' || guidance.confidence.level === 'none') && (
          <p className={`text-[0.6875rem] mt-2 leading-relaxed ${conf.pair.split(' ')[0]}`}>
            {guidance.confidence.message} Guidance below is directional until the ledger is complete and categorized.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2">
            <div className={labelCls}>Free / month</div>
            <div className={`text-lg font-semibold tabular-nums ${toneTxt(freeMonthly >= 0)}`}>{money(freeMonthly)}</div>
          </div>
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2">
            <div className={labelCls}>Goals need / mo</div>
            <div className="text-lg font-semibold tabular-nums text-[#1A1815]">{money(guidance.allocation.totalRequired)}</div>
          </div>
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2">
            <div className={labelCls}>Left over / mo</div>
            <div className={`text-lg font-semibold tabular-nums ${toneTxt(guidance.allocation.surplus >= 0)}`}>{money(guidance.allocation.surplus)}</div>
          </div>
        </div>
      </div>

      {/* PROACTIVE GUIDANCE — the point: signals with reasons, worst-first */}
      <div className={card}>
        <div className="flex items-center justify-between mb-1">
          <div className={sectionH}>Proactive guidance</div>
          <div className="text-[0.625rem] text-[#5A5751]">
            {guidance.counts.alert > 0 && <span className="text-[#991B1B]">{guidance.counts.alert} act-now</span>}
            {guidance.counts.alert > 0 && (guidance.counts.watch > 0 || guidance.counts.info > 0) && ' · '}
            {guidance.counts.watch > 0 && <span className="text-[#B45309]">{guidance.counts.watch} heads-up</span>}
          </div>
        </div>
        {guidance.signals.length ? (
          <div>{guidance.signals.map((s) => <SignalRow key={s.id} s={s} />)}</div>
        ) : (
          <p className="text-xs text-[#5A5751] py-2">No signals yet. Add a goal, or once a month of categorized spending is in, overspend and hold-for-what's-coming warnings show here — each with its reason.</p>
        )}
      </div>

      {/* GOALS */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className={sectionH}>Your goals</div>
          {!adding && <button onClick={() => setAdding(true)} className="px-3 py-1.5 text-xs font-semibold bg-[#B85838] text-white border border-[#B85838] min-h-[36px]">+ Add a goal</button>}
        </div>
        {adding && <GoalForm debts={debts} scope={scope} currentDate={cd} onAdd={addGoal} onCancel={() => setAdding(false)} />}
        <div className="space-y-3 mt-3">
          {scopedGoals.length === 0 && !adding && (
            <div className={`${card} text-center`}>
              <p className="text-sm text-[#1A1815] font-semibold">No goals here yet.</p>
              <p className="text-xs text-[#5A5751] mt-1">Add one — "save $6,000 by December" or "pay off the card" — and the engine shows the monthly set-aside, whether you're on track, and when it lands.</p>
            </div>
          )}
          {scopedGoals.map((g) => {
            const plan = plansByGoal[g.id];
            if (!plan) {
              // Achieved/zero-remaining goals aren't in the allocation; show a simple reached card.
              return (
                <div key={g.id} className={card}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#1A1815]">{g.name}</div>
                    <span className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border ${GOOD}`}>Reached</span>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="mt-2 px-3 py-1.5 text-[0.6875rem] text-[#991B1B] border border-[#E8E4DC] min-h-[36px]">Delete</button>
                </div>
              );
            }
            return <GoalCard key={g.id} plan={plan} onUpdateSaved={updateSaved} onDelete={deleteGoal} />;
          })}
        </div>
      </div>

      {/* CATEGORY vs PLAN */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className={sectionH}>Category spending vs plan</div>
          <label className="flex items-center gap-2 text-[0.625rem] text-[#5A5751]">
            Warn when over by
            <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="px-2 py-1 text-xs border border-[#D8D0C2] bg-white text-[#1A1815]">
              <option value={0.10}>10%</option>
              <option value={0.15}>15%</option>
              <option value={0.25}>25%</option>
            </select>
          </label>
        </div>
        <p className="text-[0.6875rem] text-[#5A5751] mb-2">Plans are derived from your last 3 months of real spending. This month, paced to today.</p>
        {guidance.categoryRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[#5A5751] border-b border-[#E8E4DC]">
                  <th className="py-1.5 pr-2 font-medium">Category</th>
                  <th className="py-1.5 px-2 font-medium text-right">Spent</th>
                  <th className="py-1.5 px-2 font-medium text-right">Plan</th>
                  <th className="py-1.5 px-2 font-medium text-right">On pace for</th>
                  <th className="py-1.5 pl-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {guidance.categoryRows.map((r) => {
                  const st = r.status === 'over' ? { c: 'text-[#991B1B]', t: 'Over' }
                    : r.status === 'hot' ? { c: 'text-[#B45309]', t: 'Hot' }
                      : r.status === 'under' ? { c: 'text-[#15803D]', t: 'Under' }
                        : { c: 'text-[#5A5751]', t: 'On plan' };
                  return (
                    <tr key={r.category} className="border-b border-[#F0EBE1]">
                      <td className="py-2 pr-2 font-semibold text-[#1A1815] capitalize">{r.category}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-[#1A1815]">{money(r.spent)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-[#5A5751]">{money(r.plan)}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${st.c}`}>{money(r.projected)}</td>
                      <td className="py-2 pl-2 text-right"><span className={`text-[0.5625rem] uppercase tracking-wider ${st.c}`}>{st.t}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {catAttention.length === 0 && <p className="text-[0.6875rem] text-[#15803D] mt-2">Every category is tracking within plan this month.</p>}
          </div>
        ) : (
          <p className="text-xs text-[#5A5751] py-2">Once there's a few months of categorized spending, per-category plans and pacing show here.</p>
        )}
      </div>

      {/* PIPELINE — what's coming */}
      <div className={card}>
        <div className={sectionH}>Down the pipeline</div>
        <p className="text-[0.6875rem] text-[#5A5751] mt-0.5 mb-2">Non-monthly bills coming up, with cash left after each lands — so you can save ahead.</p>
        {guidance.pipeline.length ? (
          <ul className="space-y-1">
            {guidance.pipeline.slice(0, 8).map((o, i) => (
              <li key={i} className="flex items-center justify-between text-xs border-b border-[#F0EBE1] last:border-0 py-1.5">
                <span className="text-[#1A1815]">{o.label} <span className="text-[#5A5751]">· ~{o.dueMonth}</span></span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-[#991B1B]">{money(o.amount)}</span>
                  <span className={`tabular-nums text-[0.625rem] ${o.cashAfter < 0 ? 'text-[#991B1B]' : 'text-[#5A5751]'}`}>cash after: {money(o.cashAfter)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#5A5751] py-1">No non-monthly bills in the next {months} months on record. Add recurring obligations in Books to see them here.</p>
        )}
      </div>
    </div>
  );
}
