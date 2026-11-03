// =============================================================================
// MoneyComingUp — the nine numbers Christina asked to see first (2026-11-03),
// each one opening to the items that make it up. Reads only what Safe to Spend
// already computed (result.windows, result.lines, result.balanceSources) and
// extraDebtCapacity; it adds no arithmetic of its own, so the Overview card and
// this panel can never disagree.
// =============================================================================
import React, { useState } from 'react';
import { OBLIGATION_TYPE_LABEL } from '../../lib/safe-to-spend.js';
import { entityLabel } from '../../lib/entity-labels.js';

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

function Items({ list, show, entities }) {
  if (!list || !list.length) return <p>Nothing in this window.</p>;
  return (
    <ul className="space-y-1">
      {list.map((it, i) => (
        <li key={`${it.date}-${it.label}-${i}`} className="flex gap-2">
          <span className="w-[5.5rem] shrink-0">{it.overdue ? `overdue${it.dueDate ? ` (due ${it.dueDate})` : ''}` : it.date}</span>
          <span className="flex-1 min-w-0">{it.label}{it.obligationType && it.obligationType !== 'regular' ? ` · ${OBLIGATION_TYPE_LABEL[it.obligationType] || it.obligationType}` : ''}{it.inferred ? ' · guessed from past payments, not confirmed' : ''}{it.assumed ? ' · due day assumed' : ''}{owner(it, entities)}{it.scopeLabel ? ` · counted in ${it.scopeLabel}` : ''}</span>
          <span className="shrink-0 text-[#1A1815]">{show(it.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

// The reserve for the entity in view: its own when set (settings.reserveByEntity),
// else the household reserve. Saved as the whole map, since settings merge
// one level deep.
function ReserveEditor({ result, settings, onSaveReserve }) {
  const id = result.scope && result.scope.id;
  const current = ((settings && settings.reserveByEntity) || {})[id];
  const [v, setV] = useState(current != null ? String(current) : '');
  if (!onSaveReserve || !id || id === 'consolidated') return null;
  const num = v.trim() === '' ? null : Number(v);
  const ok = num === null || (Number.isFinite(num) && num >= 0);
  return (
    <div className="flex flex-wrap items-end gap-2 mt-2" data-testid="coming-up-reserve-editor">
      <label className="text-[0.6875rem]">
        <span className="block uppercase tracking-wider">Reserve for {result.scope.label} only</span>
        <input type="number" inputMode="decimal" min="0" value={v} onChange={(e) => setV(e.target.value)} placeholder="household reserve" aria-label={`Reserve for ${result.scope.label}`} data-testid="coming-up-reserve-input" className="mt-0.5 w-32 min-h-[36px] px-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem]" />
      </label>
      <button type="button" disabled={!ok} onClick={() => onSaveReserve(id, num)} data-testid="coming-up-reserve-save" className="min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#1A1815] text-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Save reserve</button>
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

export default function MoneyComingUp({ result, extra, show, onReview, entities = null, settings = null, onSaveReserve = null }) {
  const W = result.windows || {};
  const L = result.lines;
  const sources = result.balanceSources || [];
  const counted = sources.filter((b) => b.counted !== false);
  const left = sources.filter((b) => b.counted === false);
  const allChecked = counted.length > 0 && counted.every((b) => b.verifiedOn);
  const inferred14 = (W.next14 && W.next14.items || []).filter((i) => i.inferred).length;
  return (
    <section aria-labelledby="coming-up-h" data-testid="money-coming-up" className="bg-white border border-[#E8E4DC] rounded-2xl px-4 py-2 sm:px-5">
      <h2 id="coming-up-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold pt-2">What you have, what is due, what is free{result.scope ? ` · ${result.scope.label}` : ''}</h2>
      {result.byEntity && <EntityTable result={result} show={show} entities={entities} />}
      {/* "Verified" only when every counted account carries a bank check; a
          ledger-calculated figure never wears that word (DR-0076). */}
      <Line id="cash" label={allChecked ? 'Current verified cash' : 'Current cash — not bank-checked'} value={show(L.availableCash)} note={allChecked ? 'checked against the bank' : (counted.some((b) => b.verifiedOn) ? 'not every account is bank-checked yet' : 'from the ledger; enter a bank balance to verify it')}>
        <ul className="space-y-1">
          {counted.map((b) => <li key={b.id}>{b.name}: {show(b.balance)} {b.verifiedOn ? `· bank-checked ${b.verifiedOn}${b.basis ? ` (${b.basis})` : ''}` : '· ledger figure, not bank-checked'}</li>)}
          {left.map((b) => <li key={b.id}>{b.name}: {show(b.balance)} · left out until checked against the bank</li>)}
        </ul>
      </Line>
      <Line id="next7" label="Bills due in the next 7 days" value={show(W.next7 ? W.next7.total : 0)}><Items list={W.next7 && W.next7.items} show={show} entities={entities} /></Line>
      <Line id="next14" label="Bills due in the next 14 days" value={show(W.next14 ? W.next14.total : 0)} note={inferred14 ? `${inferred14} guessed from past payments — confirm them in Bills` : ''}><Items list={W.next14 && W.next14.items} show={show} entities={entities} /></Line>
      <Line id="overdue" label="Overdue" value={show(W.overdue ? W.overdue.total : 0)} tone={W.overdue && W.overdue.total > 0 ? 'text-[#B85838]' : ''}><Items list={W.overdue && W.overdue.items} show={show} entities={entities} /></Line>
      <Line id="arrangements" label="Creditor arrangements (next 14 days)" value={show(W.arrangements ? W.arrangements.total : 0)}><Items list={W.arrangements && W.arrangements.items} show={show} entities={entities} /></Line>
      <Line id="income" label="Expected income (next 14 days)" value={show(W.income14 ? W.income14.total : 0)} note="counted only on the day it arrives"><Items list={W.income14 && W.income14.items} show={show} entities={entities} /></Line>
      <Line id="reserve" label="Protected cash reserve" value={show(L.minCushion)} note={result.byEntity ? 'each entity\u2019s own reserve, added up' : (W.reserveSource === 'entity' ? `${result.scope.label}\u2019s own reserve` : 'the household reserve')}>
        <p>Safe to Spend never lets a projected day drop below this amount. {result.byEntity ? 'Each entity keeps its own; choose one entity to change it.' : 'Set a reserve for this entity alone below, or change the household reserve in Money → Settings.'}</p>
        <ReserveEditor key={result.scope ? result.scope.id : "none"} result={result} settings={settings} onSaveReserve={onSaveReserve} />
      </Line>
      <Line id="safe" label="Safe to Spend" value={show(result.safeToSpendNow)} note={result.period.label}>
        <ol className="list-decimal pl-4 space-y-1">{(result.explanation || []).map((e) => <li key={e}>{e}</li>)}</ol>
      </Line>
      <Line id="extra" label="Available for extra debt payments" value={show(extra.amount)} note="never more than keeps the next 30 days above your reserve">
        <p>The smaller of: Safe to Spend {extra.chosen.label.toLowerCase()} ({show(extra.chosen.safe)}; lowest day {show(extra.chosen.lowest.amount)} on {extra.chosen.lowest.date}) and Safe to Spend for the {extra.month.label.toLowerCase()} ({show(extra.month.safe)}; lowest day {show(extra.month.lowest.amount)} on {extra.month.lowest.date}). Paying more than this toward debt today would put a projected day below your reserve.</p>
      </Line>
      {onReview && <button type="button" onClick={onReview} data-testid="coming-up-review" className="my-2 min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">Review and confirm your bills</button>}
    </section>
  );
}
