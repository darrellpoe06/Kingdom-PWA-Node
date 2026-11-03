// =============================================================================
// MoneyComingUp — the nine numbers Christina asked to see first (2026-11-03),
// each one opening to the items that make it up. Reads only what Safe to Spend
// already computed (result.windows, result.lines, result.balanceSources) and
// extraDebtCapacity; it adds no arithmetic of its own, so the Overview card and
// this panel can never disagree.
// =============================================================================
import React from 'react';
import { OBLIGATION_TYPE_LABEL } from '../../lib/safe-to-spend.js';

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

function Items({ list, show }) {
  if (!list || !list.length) return <p>Nothing in this window.</p>;
  return (
    <ul className="space-y-1">
      {list.map((it, i) => (
        <li key={`${it.date}-${it.label}-${i}`} className="flex gap-2">
          <span className="w-[5.5rem] shrink-0">{it.overdue ? `overdue${it.dueDate ? ` (due ${it.dueDate})` : ''}` : it.date}</span>
          <span className="flex-1 min-w-0">{it.label}{it.obligationType && it.obligationType !== 'regular' ? ` · ${OBLIGATION_TYPE_LABEL[it.obligationType] || it.obligationType}` : ''}{it.inferred ? ' · guessed from past payments, not confirmed' : ''}{it.assumed ? ' · due day assumed' : ''}</span>
          <span className="shrink-0 text-[#1A1815]">{show(it.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MoneyComingUp({ result, extra, show, onReview }) {
  const W = result.windows || {};
  const L = result.lines;
  const sources = result.balanceSources || [];
  const counted = sources.filter((b) => b.counted !== false);
  const left = sources.filter((b) => b.counted === false);
  const inferred14 = (W.next14 && W.next14.items || []).filter((i) => i.inferred).length;
  return (
    <section aria-labelledby="coming-up-h" data-testid="money-coming-up" className="bg-white border border-[#E8E4DC] rounded-2xl px-4 py-2 sm:px-5">
      <h2 id="coming-up-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold pt-2">What you have, what is due, what is free</h2>
      <Line id="cash" label="Current verified cash" value={show(L.availableCash)} note={counted.every((b) => b.verifiedOn) && counted.length ? 'checked against the bank' : 'not every account is bank-checked yet'}>
        <ul className="space-y-1">
          {counted.map((b) => <li key={b.id}>{b.name}: {show(b.balance)} {b.verifiedOn ? `· bank-checked ${b.verifiedOn}${b.basis ? ` (${b.basis})` : ''}` : '· ledger figure, not bank-checked'}</li>)}
          {left.map((b) => <li key={b.id}>{b.name}: {show(b.balance)} · left out until checked against the bank</li>)}
        </ul>
      </Line>
      <Line id="next7" label="Bills due in the next 7 days" value={show(W.next7 ? W.next7.total : 0)}><Items list={W.next7 && W.next7.items} show={show} /></Line>
      <Line id="next14" label="Bills due in the next 14 days" value={show(W.next14 ? W.next14.total : 0)} note={inferred14 ? `${inferred14} guessed from past payments — confirm them in Bills` : ''}><Items list={W.next14 && W.next14.items} show={show} /></Line>
      <Line id="overdue" label="Overdue" value={show(W.overdue ? W.overdue.total : 0)} tone={W.overdue && W.overdue.total > 0 ? 'text-[#B85838]' : ''}><Items list={W.overdue && W.overdue.items} show={show} /></Line>
      <Line id="arrangements" label="Creditor arrangements (next 14 days)" value={show(W.arrangements ? W.arrangements.total : 0)}><Items list={W.arrangements && W.arrangements.items} show={show} /></Line>
      <Line id="income" label="Expected income (next 14 days)" value={show(W.income14 ? W.income14.total : 0)} note="counted only on the day it arrives"><Items list={W.income14 && W.income14.items} show={show} /></Line>
      <Line id="reserve" label="Protected cash reserve" value={show(L.minCushion)}><p>Safe to Spend never lets a projected day drop below this amount. Change it in Money → Settings.</p></Line>
      <Line id="safe" label="Safe to Spend" value={show(result.safeToSpendNow)} note={result.period.label}>
        <ol className="list-decimal pl-4 space-y-1">{(result.explanation || []).map((e) => <li key={e}>{e}</li>)}</ol>
      </Line>
      <Line id="extra" label="Available for extra debt payments" value={show(extra.amount)} note="never more than keeps the next 30 days above your reserve">
        <p>The smaller of: Safe to Spend {extra.chosen.label.toLowerCase()} ({show(extra.chosen.safe)}; lowest day {show(extra.chosen.lowest.amount)} on {extra.chosen.lowest.date}) and Safe to Spend for the {extra.month.label.toLowerCase()} ({show(extra.month.safe)}; lowest day {show(extra.month.lowest.amount)} on {extra.month.lowest.date}). Paying more than this toward debt today would put a projected day below your reserve.</p>
      </Line>
      {onReview && <button type="button" onClick={onReview} data-testid="coming-up-review" className="my-2 min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4]">Review and confirm your bills</button>}
    </section>
  );
}
