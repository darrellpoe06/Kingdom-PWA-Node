// =============================================================================
// MoneyComingUp — the nine numbers Christina asked to see first (2026-11-03),
// each one opening to the items that make it up. Reads only what Safe to Spend
// already computed (result.windows, result.lines, result.balanceSources) and
// extraDebtCapacity; it adds no arithmetic of its own, so the Overview card and
// this panel can never disagree.
// =============================================================================
import React, { useState } from 'react';
import { OBLIGATION_TYPE_LABEL, BILL_DUE_STATUS_LABEL } from '../../lib/safe-to-spend.js';
import { balanceTrace } from '../../lib/financial-engineering.js';
import { entityLabel } from '../../lib/entity-labels.js';

// The rows themselves (Christina 2026-11-11: the bank showed Poe Properties 3322
// at $4,479.53 and TLC 8168 at $370.69 while the app showed $2,540 and $38).
// The Trail above says how many rows moved the figure and by how much; this
// lists each one with its day, description and amount, and names the fix: a
// screenshot of today's balance becomes the new bank check and outranks them.
function Trace({ data, asOf, account, show }) {
  if (!data || !account) return null;
  const t = balanceTrace(data, account.id, asOf || new Date());
  if (!t.checkpoint) return <div className="mt-0.5 pl-3 text-[0.6875rem]" data-testid={`trace-${account.id}`}>Ledger arithmetic: {t.anchor != null ? `opening ${show(t.anchor)} + ` : ''}{t.rowsSince.length} cleared row{t.rowsSince.length === 1 ? '' : 's'} = {show(t.balance)}. Upload a screenshot of the bank's balance to verify it.</div>;
  if (!t.rowsSince.length) return <div className="mt-0.5 pl-3 text-[0.6875rem]" data-testid={`trace-${account.id}`}>No rows after the bank check on {t.checkpoint.day}; the balance is the bank's figure.</div>;
  return (
    <details className="mt-0.5 pl-3 text-[0.6875rem]" data-testid={`trace-${account.id}`}>
      <summary className="cursor-pointer">Bank check {show(t.checkpoint.balance)} on {t.checkpoint.day}, then {t.rowsSince.length} row{t.rowsSince.length === 1 ? '' : 's'} dated after it ({t.sumSince < 0 ? '−' : '+'}{show(Math.abs(t.sumSince))}) = {show(t.balance)}. If the bank shows a different figure today, upload today's screenshot: its balance becomes the new bank check.</summary>
      <ul className="mt-1 space-y-0.5">
        {t.rowsSince.map((r) => <li key={r.id || `${r.day}-${r.description}`} className="flex gap-2"><span className="w-[5.5rem] shrink-0">{r.day}</span><span className="flex-1 min-w-0 truncate">{r.description || r.category || 'row'}{r.pending ? ' · pending' : ''}{r.source ? ` · from ${r.source}` : ''}</span><span className="shrink-0">{r.amount < 0 ? '−' : '+'}{show(Math.abs(r.amount))}</span></li>)}
      </ul>
    </details>
  );
}

const ROW = 'border-b border-[#E8E4DC] last:border-b-0';

function Line({ id, label, value, note, children, tone = '' }) {
  return (
    <details className={ROW} data-testid={`coming-up-${id}`}>
      <summary className="flex items-baseline gap-2 py-2.5 cursor-pointer list-none">
        <span className="flex-1 min-w-0 text-[0.8125rem] text-[#1A1815]">{label}{note && <span className="block text-[0.6875rem] text-[#5A5751]">{note}</span>}</span>
        <span className={`shrink-0 text-[0.9375rem] font-semibold ${tone}`} style={{ fontFamily: '"Fraunces", serif' }} data-testid={`coming-up-${id}-value`}>{value}</span>
      </summary>
      <div className="pb-3 text-[0.75rem] text-[#5A5751]">{children}</div>
    </details>
  );
}

// Who owes a bill (its entity) and, when another pocket pays it, where the cash
// leaves; in the combined view, the pocket each line is counted in.
function owner(it, entities) {
  if (!entities || it.entityId === undefined) return '';
  const t = entityLabel(entities, it.entityId);
  const who = ` · ${t.icon} ${t.label}`;
  if (it.paidByEntityId !== undefined && t.kind !== 'review' && it.paidByEntityId !== it.entityId) {
    return `${who}, paid from ${entityLabel(entities, it.paidByEntityId).label.toLowerCase()} cash`;
  }
  return who;
}

// What arrives inside the same window, counted only on the day it lands.
function incomeNote(w, show) {
  if (!w) return '';
  const n = (w.items || []).length;
  return n ? `income expected before these are due: ${show(w.total)}${(w.items || []).some((i) => i.inferred) ? ' (some inferred)' : ''}` : 'no income expected in this window';
}

// The trail behind one account's figure: every bank check on file (newest
// first), the rows since the one in force, and a check dated after today.
function Trail({ b, show }) {
  const cps = b.checkpoints || [];
  const since = b.sinceVerified;
  if (!cps.length && !b.laterCheckpoint) return null;
  return (
    <span className="block text-[0.6875rem] text-[#5A5751]" data-testid={`cash-trail-${b.id}`}>
      {since && since.count > 0 && <span className="block">{since.count} row{since.count === 1 ? '' : 's'} since that check, net {since.net < 0 ? '−' : '+'}{show(Math.abs(since.net))}</span>}
      {b.laterCheckpoint && <span className="block text-[#B85838]">A verified balance of {show(b.laterCheckpoint.balance)} is dated {b.laterCheckpoint.day}, after today, so it is not used yet — if that day is wrong, correct the screenshot's day.</span>}
      {cps.length > 1 && <span className="block">Earlier checks: {cps.slice(1).map((c) => `${show(c.balance)} on ${c.day}`).join(', ')}</span>}
      {cps.length > 0 && cps[0].source && <span className="block">Source: {cps[0].source}</span>}
    </span>
  );
}

function Items({ list, show, entities }) {
  if (!list || !list.length) return <p>Nothing in this window.</p>;
  return (
    <ul className="space-y-1">
      {list.map((it, i) => (
        <li key={`${it.date}-${it.label}-${i}`} className="flex gap-2">
          <span className="w-[5.5rem] shrink-0">{it.overdue ? `overdue${it.dueDate ? ` (due ${it.dueDate})` : ''}` : it.date}</span>
          <span className="flex-1 min-w-0">{it.label}{it.obligationType && it.obligationType !== 'regular' ? ` · ${OBLIGATION_TYPE_LABEL[it.obligationType] || it.obligationType}` : ''}{it.assumed ? ' · due day assumed' : ''}{it.graceState ? ` · ${BILL_DUE_STATUS_LABEL[it.graceState]}${it.graceEndsOn ? ` (ends ${it.graceEndsOn})` : ''}` : ''}{owner(it, entities)}{it.scopeLabel ? ` · counted in ${it.scopeLabel}` : ''}{it.status && it.status !== 'overdue' ? ` · ${it.status === 'pending' ? (it.kind === 'scheduled' ? 'Pending: scheduled in your register' : 'Pending: marked paid, waiting for the bank') : BILL_DUE_STATUS_LABEL[it.status]}` : (it.inferred ? ' · guessed from past payments, not confirmed' : '')}</span>
          <span className="shrink-0 text-[#1A1815]">{show(it.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

// The reserve for the entity in view: its own when set (settings.reserveByEntity),
// else the household reserve. Saved as the whole map, since settings merge
// one level deep.
// In the combined view the headline is Personal money only, so the reserve
// edited there is the Personal reserve (the same 'personal' key the Personal
// view saves), never a combined one.
// THE GOAL AND THE MONEY SET ASIDE ARE TWO RECORDS (Christina 2026-11-11: "The
// $10,000 reserve is my SAVINGS GOAL, not my current reserve balance"). The
// goal is a target; the money set aside is what Safe to Spend protects. Three
// controls: the goal; the figure set aside by hand (the pocket's reserve key,
// kept for the records already saved under it); and "Add to reserve", which
// records a dated designation as funds become available. Nothing here moves
// money between bank accounts: it records a decision, and the cushion rises
// by exactly that amount on the next read.
const BTN = 'min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#1A1815] text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const FIELD = 'mt-0.5 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem]';
function ReservePanel({ result, settings, show, asOf, onSaveReserve, onSaveReserveGoal, onDesignate, onRemoveDesignation }) {
  const inView = result.scope && result.scope.id;
  const id = inView === 'consolidated' || (result.scope && result.scope.kind === 'personal') ? 'personal' : inView;
  const label = id === 'personal' ? 'Personal' : result.scope && result.scope.label;
  const R = (result.lines && result.lines.reserve) || { goal: 0, designated: 0, remaining: 0, designations: [], typed: null };
  const current = ((settings && settings.reserveByEntity) || {})[id];
  const goalSaved = ((settings && settings.reserveGoalByEntity) || {})[id];
  const [v, setV] = useState(current != null ? String(current) : '');
  const [g, setG] = useState(goalSaved != null ? String(goalSaved) : (R.goal ? String(R.goal) : ''));
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const today = asOf instanceof Date ? `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, '0')}-${String(asOf.getDate()).padStart(2, '0')}` : new Date().toISOString().slice(0, 10);
  const [day, setDay] = useState(today);
  if (!id || (!onSaveReserve && !onSaveReserveGoal && !onDesignate)) return null;
  const num = v.trim() === '' ? null : Number(v);
  const ok = num === null || (Number.isFinite(num) && num >= 0);
  const gnum = g.trim() === '' ? null : Number(g);
  const gok = gnum === null || (Number.isFinite(gnum) && gnum >= 0);
  const anum = Number(amt);
  const aok = amt.trim() !== '' && Number.isFinite(anum) && anum !== 0 && /^\d{4}-\d{2}-\d{2}$/.test(day);
  return (
    <div className="mt-2 space-y-3" data-testid="coming-up-reserve-editor">
      <div className="text-[0.75rem]" data-testid="coming-up-reserve-progress">
        <div className="flex items-baseline justify-between gap-2"><span>Set aside so far</span><span className="font-semibold text-[#1A1815]">{show(R.designated)}</span></div>
        <div className="flex items-baseline justify-between gap-2"><span>Goal</span><span>{show(R.goal)}</span></div>
        <div className="flex items-baseline justify-between gap-2"><span>Still to save</span><span data-testid="coming-up-reserve-remaining">{show(R.remaining)}</span></div>
        {R.pct != null && <div className="mt-1 h-1.5 rounded-full bg-[#E8E4DC]" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={R.pct} aria-label={`Reserve progress for ${label}`}><div className="h-1.5 rounded-full bg-[#5A6E3D]" style={{ width: `${R.pct}%` }} /></div>}
      </div>
      {onSaveReserveGoal && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[0.6875rem]">
            <span className="block uppercase tracking-wider">Reserve goal for {label}</span>
            <input type="number" inputMode="decimal" min="0" value={g} onChange={(e) => setG(e.target.value)} placeholder="10000" aria-label={`Reserve goal for ${label}`} data-testid="coming-up-reserve-goal-input" className={`${FIELD} w-32`} />
          </label>
          <button type="button" disabled={!gok} onClick={() => onSaveReserveGoal(id, gnum)} data-testid="coming-up-reserve-goal-save" className={BTN}>Save goal</button>
        </div>
      )}
      {onDesignate && (
        <div className="flex flex-wrap items-end gap-2" data-testid="coming-up-designate">
          <label className="text-[0.6875rem]">
            <span className="block uppercase tracking-wider">Add to reserve</span>
            <input type="number" inputMode="decimal" step="0.01" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="amount" aria-label={`Amount to set aside for ${label}`} data-testid="coming-up-designate-amount" className={`${FIELD} w-28`} />
          </label>
          <label className="text-[0.6875rem]">
            <span className="block uppercase tracking-wider">On</span>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} aria-label="Date set aside" data-testid="coming-up-designate-date" className={`${FIELD} w-36`} />
          </label>
          <label className="text-[0.6875rem] flex-1 min-w-[8rem]">
            <span className="block uppercase tracking-wider">Note</span>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="from this paycheck" aria-label="Note" data-testid="coming-up-designate-note" className={`${FIELD} w-full`} />
          </label>
          <button type="button" disabled={!aok} onClick={() => { onDesignate({ scope: id, date: day, amount: Math.round(anum * 100) / 100, note }); setAmt(''); setNote(''); }} data-testid="coming-up-designate-save" className={BTN}>Set aside</button>
          <span className="block w-full text-[0.6875rem]">A negative amount takes money back out of the reserve. This records a decision; it does not move money between accounts.</span>
        </div>
      )}
      {(R.designations || []).length > 0 && (
        <ul className="space-y-0.5 text-[0.75rem]" data-testid="coming-up-designations">
          {R.typed != null && <li className="flex gap-2"><span className="w-[5.5rem] shrink-0">earlier</span><span className="flex-1 min-w-0">set aside by hand</span><span className="shrink-0">{show(R.typed)}</span></li>}
          {R.designations.map((d) => (
            <li key={d.id || `${d.date}-${d.amount}`} className="flex gap-2 items-baseline">
              <span className="w-[5.5rem] shrink-0">{d.date}</span>
              <span className="flex-1 min-w-0 truncate">{d.note || 'set aside'}</span>
              <span className="shrink-0">{d.amount < 0 ? '−' : '+'}{show(Math.abs(d.amount))}</span>
              {onRemoveDesignation && d.id && <button type="button" onClick={() => onRemoveDesignation(d.id)} aria-label={`Remove the ${d.date} designation`} className="shrink-0 text-[0.6875rem] underline">remove</button>}
            </li>
          ))}
        </ul>
      )}
      {onSaveReserve && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-[0.6875rem]">
            <span className="block uppercase tracking-wider">Reserve for {label} only (set aside by hand)</span>
            <input type="number" inputMode="decimal" min="0" value={v} onChange={(e) => setV(e.target.value)} placeholder="0" aria-label={`Reserve for ${label}`} data-testid="coming-up-reserve-input" className={`${FIELD} w-32`} />
          </label>
          <button type="button" disabled={!ok} onClick={() => onSaveReserve(id, num)} data-testid="coming-up-reserve-save" className={BTN}>Save reserve</button>
          <span className="block w-full text-[0.6875rem]">A figure typed here counts as money already set aside, on top of the designations above. Leave it empty to use the designations alone.</span>
        </div>
      )}
    </div>
  );
}

// The combined view, one row per entity: each pocket's own cash, bills,
// overdue, reserve and Safe to Spend. The total is a picture of the whole,
// never money one pocket may spend from another.
function EntityTable({ result, show, entities }) {
  const rows = result.byEntity || [];
  if (!rows.length) return null;
  const tag = (r) => (r.scope.id === 'unassigned' ? { icon: '⚠️', label: 'NO ENTITY' } : entityLabel(entities || [], r.scope.id));
  return (
    <div className="py-2 border-b border-[#E8E4DC]" data-testid="coming-up-entities">
      <p className="text-[0.75rem] text-[#5A5751] mb-1">Each entity on its own. Business cash is never counted as personal spending money.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.75rem]"><caption className="sr-only">Each entity: cash, bills due in 14 days, overdue, reserve and Safe to Spend</caption>
          <thead><tr className="text-left text-[#5A5751]"><th scope="col" className="font-normal pr-2">Entity</th><th scope="col" className="font-normal pr-2 text-right">Cash</th><th scope="col" className="font-normal pr-2 text-right">Due 14 days</th><th scope="col" className="font-normal pr-2 text-right">Overdue</th><th scope="col" className="font-normal pr-2 text-right">Reserve</th><th scope="col" className="font-normal text-right">Safe to Spend</th></tr></thead>
          <tbody>
            {rows.map((r) => { const t = tag(r); return (
              <tr key={r.scope.id} data-testid={`coming-up-entity-${r.scope.id}`} className="border-t border-[#F0ECE4]">
                <td className="pr-2 py-1 font-semibold whitespace-nowrap"><span aria-hidden="true">{t.icon} </span>{t.label}</td>
                <td className="pr-2 text-right">{show(r.lines.availableCash)}</td>
                <td className="pr-2 text-right">{show(r.windows ? r.windows.next14.total : 0)}</td>
                <td className="pr-2 text-right">{show(r.windows ? r.windows.overdue.total : 0)}</td>
                <td className="pr-2 text-right">{show(r.lines.minCushion)}</td>
                <td className="text-right font-semibold">{show(r.safeToSpendNow)}</td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MoneyComingUp({ result, extra, show, onReview, entities = null, settings = null, onSaveReserve = null, onSaveReserveGoal = null, onDesignate = null, onRemoveDesignation = null, data = null, asOf = null }) {
  const accountOf = (id) => ((data && data.accounts) || []).find((a) => a && a.id === id) || null;
  const W = result.windows || {};
  const L = result.lines;
  const sources = result.balanceSources || [];
  const counted = sources.filter((b) => b.counted !== false);
  const left = sources.filter((b) => b.counted === false);
  const allChecked = counted.length > 0 && counted.every((b) => b.verifiedOn);
  const inferred14 = (W.next14 && W.next14.items || []).filter((i) => i.inferred).length;
  return (
    <section aria-labelledby="coming-up-h" data-testid="money-coming-up" className="bg-white border border-[#E8E4DC] rounded-2xl px-4 py-2 sm:px-5">
      <h2 id="coming-up-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold pt-2">What you have, what is due, what is free{result.scope ? (result.scope.id === 'consolidated' ? ' · Personal money (each entity on its own row)' : ` · ${result.scope.label}`) : ''}</h2>
      {result.byEntity && <EntityTable result={result} show={show} entities={entities} />}
      {/* "Verified" only when every counted account carries a bank check; a
          ledger-calculated figure never wears that word (DR-0076). */}
      <Line id="cash" label={allChecked ? 'Current verified cash' : 'Current cash — not bank-checked'} value={show(L.availableCash)} note={allChecked ? 'checked against the bank' : (counted.some((b) => b.verifiedOn) ? 'not every account is bank-checked yet' : 'from the ledger; enter a bank balance to verify it')}>
        <ul className="space-y-1">
          {counted.map((b) => <li key={b.id} data-testid={`cash-source-${b.id}`}>{b.name}: {show(b.balance)} {b.verifiedOn ? `· bank-checked ${b.verifiedOn}${b.basis ? ` (${b.basis})` : ''}` : (b.provisional ? `· your approximate figure from ${b.provisionalOn}, not bank-checked` : '· ledger figure, not bank-checked')}<Trail b={b} show={show} /><Trace data={data} asOf={asOf} account={accountOf(b.id)} show={show} /></li>)}
          {left.map((b) => <li key={b.id} data-testid={`cash-source-${b.id}`}>{b.name}: {show(b.balance)} · left out until checked against the bank<Trail b={b} show={show} /><Trace data={data} asOf={asOf} account={accountOf(b.id)} show={show} /></li>)}
        </ul>
      </Line>
      <Line id="next7" label="Bills due in the next 7 days" value={show(W.next7 ? W.next7.total : 0)} note={incomeNote(W.income7, show)}><Items list={W.next7 && W.next7.items} show={show} entities={entities} /></Line>
      <Line id="next14" label="Bills due in the next 14 days" value={show(W.next14 ? W.next14.total : 0)} note={[inferred14 ? `${inferred14} guessed from past payments — confirm them in Bills` : '', incomeNote(W.income14, show)].filter(Boolean).join(' · ')}><Items list={W.next14 && W.next14.items} show={show} entities={entities} /></Line>
      <Line id="next30" label="Bills due in the next 30 days" value={show(W.next30 ? W.next30.total : 0)} note={incomeNote(W.income30, show)}><Items list={W.next30 && W.next30.items} show={show} entities={entities} /></Line>
      <Line id="past-due" label="Past-due obligations (apart from regular bills)" value={show(W.pastDue ? W.pastDue.total : 0)} tone={W.pastDue && W.pastDue.total > 0 ? 'text-[#B85838]' : ''} note="missed payments, in or past their grace period, and past-due balances; the due date stays the contract's">
        <Items list={W.pastDue && W.pastDue.items} show={show} entities={entities} />
        {W.regular30 && <p className="mt-2">Regular bills in the next 30 days without these: {show(W.regular30.total)}.</p>}
      </Line>
      <Line id="overdue" label="Overdue" value={show(W.overdue ? W.overdue.total : 0)} tone={W.overdue && W.overdue.total > 0 ? 'text-[#B85838]' : ''}><Items list={W.overdue && W.overdue.items} show={show} entities={entities} /></Line>
      <Line id="cleared" label="Paid and cleared (not subtracted again)" value={show(W.cleared ? W.cleared.total : 0)} note="already out of your bank balance">
        {W.cleared && W.cleared.items.length ? (
          <ul className="space-y-1">{W.cleared.items.map((it, i) => <li key={`${it.date}-${it.label}-${i}`} className="flex gap-2"><span className="w-[5.5rem] shrink-0">{it.date}</span><span className="flex-1 min-w-0">{it.label} · {it.how === 'in-bank-balance' ? `inside your bank balance checked ${it.bankCheckedOn}` : (it.how === 'paid-in-ledger' ? 'payment found in your transactions' : 'marked paid outside these accounts')}</span><span className="shrink-0 text-[#1A1815]">{show(it.amount)}</span></li>)}</ul>
        ) : <p>Nothing in this window.</p>}
      </Line>
      <Line id="duplicates" label="Possible duplicates (counted once)" value={show(W.duplicates ? W.duplicates.total : 0)} note={W.duplicates && W.duplicates.items.length ? 'the same payee and amount projected twice; confirm or dismiss in Bills' : ''}>
        {W.duplicates && W.duplicates.items.length ? (
          <ul className="space-y-1">{W.duplicates.items.map((it, i) => <li key={`${it.date}-${it.label}-${i}`} className="flex gap-2"><span className="w-[5.5rem] shrink-0">{it.date}</span><span className="flex-1 min-w-0">{it.label} · same as {it.duplicateOf.label} on {it.duplicateOf.date}, which is counted</span><span className="shrink-0 text-[#1A1815]">{show(it.amount)}</span></li>)}</ul>
        ) : <p>None found.</p>}
      </Line>
      <Line id="arrangements" label="Creditor arrangements (next 14 days)" value={show(W.arrangements ? W.arrangements.total : 0)}><Items list={W.arrangements && W.arrangements.items} show={show} entities={entities} /></Line>
      <Line id="income" label="Expected income (next 14 days)" value={show(W.income14 ? W.income14.total : 0)} note="counted only on the day it arrives"><Items list={W.income14 && W.income14.items} show={show} entities={entities} /></Line>
      <Line id="reserve" label="Protected cash reserve (money set aside)" value={show(L.minCushion)} note={result.byEntity ? 'each entity\u2019s own set-aside money, added up' : (W.reserveSource === 'designated' ? `${result.scope.label}\u2019s own money set aside` : (W.reserveSource === 'household' ? 'the household cushion from Money \u2192 Settings' : 'nothing set aside yet; the goal is tracked, not subtracted'))}>
        <p>Safe to Spend never lets a projected day drop below this amount. Only money you have actually set aside is protected; the goal is a target you are saving toward. {result.byEntity ? 'Each entity keeps its own; choose one entity to change it.' : ''}</p>
        <ReservePanel key={result.scope ? result.scope.id : "none"} result={result} settings={settings} show={show} asOf={asOf} onSaveReserve={onSaveReserve} onSaveReserveGoal={onSaveReserveGoal} onDesignate={onDesignate} onRemoveDesignation={onRemoveDesignation} />
      </Line>
      <Line id="reserve-goal" label="Emergency reserve goal" value={show(L.reserve ? L.reserve.goal : 0)} note={L.reserve ? `${show(L.reserve.designated)} set aside \u00b7 ${show(L.reserve.remaining)} still to save${L.reserve.goalSource === 'default' ? ' \u00b7 the $10,000 target, until you save another' : ''}` : ''} tone={L.reserve && L.reserve.remaining === 0 && L.reserve.goal > 0 ? 'text-[#5A6E3D]' : ''}>
        <p>You are building this reserve while keeping bills current and paying down debt. Set money aside above as funds become available; each amount raises the protected cushion by exactly that much and lowers what reads as spendable, so nothing is counted twice.</p>
      </Line>
      <Line id="safe" label="Safe to Spend" value={show(result.safeToSpendNow)} note={result.period.label}>
        <ol className="list-decimal pl-4 space-y-1">{(result.explanation || []).map((e) => <li key={e}>{e}</li>)}</ol>
      </Line>
      <Line id="extra" label="Safe to put toward your reserve or extra debt today" value={show(extra.amount)} note={extra.reserve ? `suggested: ${show(extra.reserve.suggested)} to the reserve, ${show(extra.reserve.debtAfter)} to extra debt` : 'never more than keeps the next 30 days above your reserve'}>
        <p>The smaller of: Safe to Spend {extra.chosen.label.toLowerCase()} ({show(extra.chosen.safe)}; lowest day {show(extra.chosen.lowest.amount)} on {extra.chosen.lowest.date}) and Safe to Spend for the {extra.month.label.toLowerCase()} ({show(extra.month.safe)}; lowest day {show(extra.month.lowest.amount)} on {extra.month.lowest.date}). This is one pool: money set aside for the reserve or paid toward debt today beyond it would put a projected day below the cushion. The suggestion fills the reserve goal first ({extra.reserve ? show(extra.reserve.remaining) : show(0)} still to save), then the rest goes to debt; set money aside under Protected cash reserve and this line falls by exactly that amount.</p>
      </Line>
      {onReview && <button type="button" onClick={onReview} data-testid="coming-up-review" className="my-2 min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Review and confirm your bills</button>}
    </section>
  );
}
