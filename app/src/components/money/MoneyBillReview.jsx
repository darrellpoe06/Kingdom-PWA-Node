// =============================================================================
// MoneyBillReview — one screen to review, correct and confirm every obligation
// (Christina, 2026-11-03: "I want to review and correct the information
// directly inside Family Operating Systems rather than repeatedly sending long
// messages").
// =============================================================================
// Suggested rows come from the ledger (lib/bill-review.js) and are NEVER stored
// or counted until "Confirm" — which needs an amount and the ACTUAL due date,
// the one thing a bank export cannot say. Saved rows are the existing
// recurringObligations; editing one changes only that row. "Not a bill" hides a
// suggestion on this device's plan (moneyPlan.billReview.dismissed); nothing in
// the ledger is touched by anything on this screen.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { BILL_GROUPS, REVIEW_FREQUENCIES, reviewRows, missingForConfirm, toObligation, arrangementPayoff } from '../../lib/bill-review.js';
import { patchMoneyPlan } from '../../lib/money-plan.js';
import { fmt } from '../../lib/format.js';
import { isPrimaryHome } from '../../lib/mortgage-payoff.js';
import { ENTITY_KINDS, NEEDS_REVIEW, TLC_KINDS, TLC_KIND_LABEL, entityLabel } from '../../lib/entity-labels.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-3 sm:p-4';
const INPUT = `w-full min-h-[36px] px-2.5 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.8125rem] ${FOCUS}`;
const BTN = `min-h-[36px] px-3 py-1.5 text-[0.75rem] font-semibold rounded-full border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838] disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS}`;
const BTN_QUIET = `min-h-[36px] px-3 py-1.5 text-[0.75rem] rounded-full border border-[#E8E4DC] bg-white text-[#5A5751] hover:text-[#1A1815] ${FOCUS}`;
const LABEL = 'block text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1';

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'sm:col-span-2' : ''}><span className={LABEL}>{label}</span>{children}</label>;
}

// The entity chip, readable at a glance on a phone: icon + words, never color
// alone. Tints are kept clear of true red (Color Theology, DR-0099).
const CHIP_TONE = {
  personal: 'bg-[#F0F4EA] border-[#1F3A2E] text-[#1F3A2E]',
  poe: 'bg-white border-[#2A5A8E] text-[#2A5A8E]',
  tlc: 'bg-white border-[#7A5A8E] text-[#7A5A8E]',
  poetech: 'bg-white border-[#8A6510] text-[#8A6510]',
  other: 'bg-[#F0ECE4] border-[#5A5751] text-[#5A5751]',
  review: 'bg-[#FBF7EC] border-[#B45309] text-[#B45309]',
};
export function EntityChip({ tag, testId }) {
  return (
    <span data-testid={testId} data-kind={tag.kind} className={`inline-flex items-center gap-1 text-[0.6875rem] font-bold tracking-wider px-2 py-0.5 rounded-full border ${CHIP_TONE[tag.kind] || CHIP_TONE.other}`}>
      <span aria-hidden="true">{tag.icon}</span>{tag.label}
    </span>
  );
}

function Row({ row, accounts, entities, homes, rentals, onSave, onDismiss, onPause }) {
  const [d, setD] = useState(() => ({
    name: row.name || '', group: row.group || 'household', amount: row.amount ?? '', nextDue: row.nextDue || '', payOn: row.payOn || '',
    frequency: row.frequency || 'monthly', balance: row.balance ?? '', pastDue: row.pastDue ?? '', accountId: row.accountId || '', entityId: row.entityId ?? '',
    linkedMortgageId: row.linkedMortgageId || (homes[0] ? homes[0].id : ''),
    originalCreditor: row.originalCreditor || '', accountLast4: row.accountLast4 || '',
    alsoPaidAs: row.alsoPaidAs || [], rentalId: row.rentalId || '', tlcKind: row.tlcKind || '',
  }));
  const similar = row.similarTo || [];
  const collection = ['arrangement', 'past-due'].includes(d.group);
  const payoff = collection ? arrangementPayoff(d) : null;
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));
  const suggested = row.source === 'suggested';
  const miss = missingForConfirm(d, entities);
  const id = row.key.replace(/[^a-z0-9]/gi, '-');
  const verified = !suggested && row.verified;
  const tag = entityLabel(entities, d.entityId);
  const payer = accounts.find((a) => a.id === d.accountId);
  const payerTag = payer ? entityLabel(entities, payer.entityId) : null;
  const crossPaid = payerTag && tag.kind !== 'review' && payerTag.entityId !== tag.entityId;
  const entityRentals = rentals.filter((r) => r.entityId === d.entityId);
  return (
    <li data-testid={`bill-review-row-${id}`} className={CARD}>
      {/* The summary line: who owes it, what, how much, when — readable while
          scrolling, without opening anything. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2" data-testid={`bill-review-summary-${id}`}>
        <EntityChip tag={tag} testId={`bill-review-entity-chip-${id}`} />
        <span className="font-semibold text-[0.8125rem] text-[#1A1815] min-w-0 break-words">{d.name || 'Bill'}</span>
        <span className="text-[0.75rem] text-[#5A5751]">{Number(d.amount) > 0 ? fmt(Number(d.amount)) : 'amount ?'}{d.nextDue ? ` · due ${d.nextDue}` : ''}</span>
        {tag.kind === 'poe' && d.rentalId && <span className="text-[0.6875rem] text-[#2A5A8E]">· {(rentals.find((r) => r.id === d.rentalId) || {}).name}</span>}
        {tag.kind === 'tlc' && d.tlcKind && <span className="text-[0.6875rem] text-[#7A5A8E]">· {TLC_KIND_LABEL[d.tlcKind]}</span>}
      </div>
      {crossPaid && <p className="text-[0.6875rem] text-[#5A5751] mb-2" data-testid={`bill-review-crosspaid-${id}`}>Paid from {payer.name} ({payerTag.label.toLowerCase()}) for {tag.label.toLowerCase()} — the cash leaves {payer.name}; the bill belongs to {tag.label.toLowerCase()}.</p>}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-[0.6875rem] px-2 py-0.5 rounded-full border ${verified ? 'text-[#5A6E3D] border-[#5A6E3D]' : 'text-[#B45309] border-[#B45309]'}`} data-testid={`bill-review-status-${id}`}>
          {verified ? 'Verified' : 'Needs confirmation'}
        </span>
        {suggested && <span className="text-[0.6875rem] text-[#5A5751]">Suggested from your records — not counted until you confirm</span>}
        {!suggested && row.enabled === false && <span className="text-[0.6875rem] text-[#5A5751]">Paused — not counted</span>}
      </div>
      {suggested && row.evidence && (
        <p className="text-[0.75rem] text-[#5A5751] mb-2" data-testid={`bill-review-evidence-${id}`}>
          Your records show {row.evidence.payments} payment{row.evidence.payments === 1 ? '' : 's'} in {row.evidence.months} month{row.evidence.months === 1 ? '' : 's'} ({fmt(row.evidence.total)} in all), usually paid around the {row.evidence.usualDay}{['th', 'st', 'nd', 'rd'][(row.evidence.usualDay % 10 > 3 || [11, 12, 13].includes(row.evidence.usualDay)) ? 0 : row.evidence.usualDay % 10]}, last on {row.evidence.lastPaid}. A payment day is not a due date — enter the real one.
        </p>
      )}
      {suggested && similar.length > 0 && (
        <fieldset className="mb-2 p-2 rounded-lg border border-[#B45309] text-[0.75rem]" data-testid={`bill-review-similar-${id}`}>
          <legend className="px-1 text-[#B45309] font-semibold">Similar name — same account or a different one?</legend>
          <p className="text-[#5A5751] mb-1">Kept separate until you decide. Each payment counts once, under the name the bank used. Tick a name only if it is the SAME account as this one.</p>
          {similar.map((n) => (
            <label key={n} className="flex items-center gap-2 min-h-[36px]">
              <input type="checkbox" checked={d.alsoPaidAs.includes(n)} onChange={(e) => setD((x) => ({ ...x, alsoPaidAs: e.target.checked ? [...x.alsoPaidAs, n] : x.alsoPaidAs.filter((m) => m !== n) }))} data-testid={`bill-review-same-${id}`} />
              <span>“{n}” is the same account</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="Bill or creditor" wide><input className={INPUT} value={d.name} onChange={set('name')} data-testid={`bill-review-name-${id}`} /></Field>
        <Field label="What kind" wide>
          <select className={INPUT} value={d.group} onChange={set('group')} data-testid={`bill-review-group-${id}`}>
            {BILL_GROUPS.map(([g, label]) => <option key={g} value={g}>{label}</option>)}
          </select>
        </Field>
        {d.group === 'home-mortgage' && (
          <Field label="Which home (your primary residence)" wide>
            <select className={INPUT} value={d.linkedMortgageId} onChange={set('linkedMortgageId')} data-testid={`bill-review-home-${id}`}>
              {homes.length ? homes.map((h) => <option key={h.id} value={h.id}>{h.name || h.address}</option>) : <option value="">No property is marked as your primary residence</option>}
            </select>
          </Field>
        )}
        {collection && (
          <>
            <Field label="Original creditor"><input className={INPUT} value={d.originalCreditor} onChange={set('originalCreditor')} data-testid={`bill-review-creditor-${id}`} /></Field>
            <Field label="Account or case number (last 4 kept)"><input className={INPUT} value={d.accountLast4} onChange={set('accountLast4')} autoComplete="off" data-testid={`bill-review-last4-${id}`} /></Field>
          </>
        )}
        <Field label={d.group === 'home-mortgage' ? 'Required monthly payment (P&I + escrow)' : 'Normal payment'}><input className={INPUT} inputMode="decimal" value={d.amount} onChange={set('amount')} data-testid={`bill-review-amount-${id}`} /></Field>
        <Field label="How often">
          <select className={INPUT} value={d.frequency} onChange={set('frequency')} data-testid={`bill-review-frequency-${id}`}>
            {REVIEW_FREQUENCIES.map(([f, label]) => <option key={f} value={f}>{label}</option>)}
          </select>
        </Field>
        <Field label="Actual due date"><input type="date" className={INPUT} value={d.nextDue} onChange={set('nextDue')} data-testid={`bill-review-due-${id}`} /></Field>
        <Field label="Next payment date (if different)"><input type="date" className={INPUT} value={d.payOn} onChange={set('payOn')} data-testid={`bill-review-payon-${id}`} /></Field>
        <Field label="Remaining balance (if any)"><input className={INPUT} inputMode="decimal" value={d.balance} onChange={set('balance')} data-testid={`bill-review-balance-${id}`} /></Field>
        <Field label="Past-due amount (if any)"><input className={INPUT} inputMode="decimal" value={d.pastDue} onChange={set('pastDue')} data-testid={`bill-review-pastdue-${id}`} /></Field>
        <Field label="Paid from">
          <select className={INPUT} value={d.accountId} onChange={set('accountId')} data-testid={`bill-review-account-${id}`}>
            <option value="">Not set</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="Belongs to (who owes it — not who paid)">
          <select className={INPUT} value={d.entityId ?? ''} onChange={(e) => setD((x) => ({ ...x, entityId: e.target.value, rentalId: '', tlcKind: '' }))} data-testid={`bill-review-entity-${id}`}>
            <option value="">⚠️ Needs review — not chosen</option>
            {entities.map((e) => { const t = entityLabel(entities, e.id); return <option key={e.id} value={e.id}>{t.icon} {t.kind === 'other' ? e.name : `${t.label} (${e.name})`}</option>; })}
          </select>
        </Field>
        {tag.kind === 'poe' && (
          <Field label="Which property (Poe Properties)">
            <select className={INPUT} value={d.rentalId} onChange={set('rentalId')} data-testid={`bill-review-rental-${id}`}>
              <option value="">Not tied to one property</option>
              {entityRentals.map((r) => <option key={r.id} value={r.id}>{r.name || r.address}</option>)}
            </select>
          </Field>
        )}
        {tag.kind === 'tlc' && (
          <Field label="TLC expense type">
            <select className={INPUT} value={d.tlcKind} onChange={set('tlcKind')} data-testid={`bill-review-tlckind-${id}`}>
              <option value="">Choose one</option>
              {TLC_KINDS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </Field>
        )}
      </div>
      {payoff && <p className="text-[0.75rem] text-[#5A5751] mt-2" data-testid={`bill-review-payoff-${id}`}>At this payment: {payoff.payments} more payments, paid off around {payoff.payoffMonth}.</p>}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button type="button" className={BTN} disabled={miss.length > 0} onClick={() => onSave(row, d)} data-testid={`bill-review-save-${id}`}>
          {suggested ? 'Confirm and add' : (verified ? 'Save changes' : 'Confirm')}
        </button>
        {suggested && <button type="button" className={BTN_QUIET} onClick={() => onDismiss(row)} data-testid={`bill-review-dismiss-${id}`}>Not a bill</button>}
        {!suggested && <button type="button" className={BTN_QUIET} onClick={() => onPause(row)} data-testid={`bill-review-pause-${id}`}>{row.enabled === false ? 'Count it again' : 'Pause (stop counting)'}</button>}
        {miss.length > 0 && <span className="text-[0.75rem] text-[#B45309]" data-testid={`bill-review-missing-${id}`}>Needs: {miss.join(' and ')}</span>}
      </div>
    </li>
  );
}

export default function MoneyBillReview({ money }) {
  const { data = {}, setData, currentDate, addRecurring, updateRecurring } = money || {};
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const dismissed = useMemo(() => (data.moneyPlan && data.moneyPlan.billReview && data.moneyPlan.billReview.dismissed) || {}, [data.moneyPlan]);
  const { saved, suggested } = useMemo(() => reviewRows(data, cd, dismissed), [data, cd, dismissed]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const accounts = (data.accounts || []).filter((a) => a && ['checking', 'savings', 'cash', 'credit'].includes(a.type));
  const entities = data.entities || [];
  const rentals = ((data.inflows && data.inflows.rentals) || []).filter(Boolean);
  const homes = rentals.filter(isPrimaryHome);

  const onSave = (row, draft) => {
    const ob = toObligation({ ...row, ...draft }, new Date());
    if (row.source === 'suggested') { if (addRecurring) addRecurring(ob); }
    else if (updateRecurring) updateRecurring(row.id, { ...ob, enabled: row.enabled === false ? false : true });
  };
  const onDismiss = (row) => setData && setData((d) => ({ ...d, moneyPlan: patchMoneyPlan(d.moneyPlan, { billReview: { dismissed: { ...(((d.moneyPlan || {}).billReview || {}).dismissed || {}), [row.key]: new Date().toISOString() } } }) }));
  const onPause = (row) => updateRecurring && updateRecurring(row.id, { enabled: row.enabled === false });
  const kindOf = (r) => entityLabel(entities, r.entityId).kind;
  const show = (rows) => rows
    .filter((r) => groupFilter === 'all' || r.group === groupFilter)
    .filter((r) => entityFilter === 'all' || kindOf(r) === entityFilter);
  const verifiedCount = saved.filter((r) => r.verified && r.enabled !== false).length;
  const all = [...saved, ...suggested];
  const entityTabs = [{ id: 'all', icon: '', label: 'ALL' }, ...ENTITY_KINDS, NEEDS_REVIEW]
    .map((t) => ({ ...t, count: t.id === 'all' ? all.length : all.filter((r) => kindOf(r) === t.id).length }));

  return (
    <section data-testid="money-bill-review" className="space-y-3">
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] rounded-2xl p-3 sm:p-4 text-[0.8125rem] text-[#1A1815]">
        <p className="font-semibold mb-1">Review your bills</p>
        <p className="text-[#5A5751]">
          {verifiedCount} confirmed · {saved.length - verifiedCount} saved but not confirmed · {suggested.length} suggested from your records.
          Only confirmed, active bills count in Safe to Spend. Suggestions are never added on their own.
          The account that paid a bill does not decide who owes it; a bill with no owner chosen says NEEDS REVIEW.
        </p>
        <div role="group" aria-label="Whose bills" className="flex flex-wrap gap-1.5 mt-2" data-testid="bill-review-entity-filter">
          {entityTabs.map((t) => (
            <button key={t.id} type="button" aria-pressed={entityFilter === t.id} onClick={() => setEntityFilter(t.id)} data-testid={`bill-review-entity-tab-${t.id}`}
              className={`min-h-[36px] px-2.5 py-1 rounded-full border text-[0.6875rem] font-bold tracking-wider ${FOCUS} ${entityFilter === t.id ? 'bg-[#1A1815] border-[#1A1815] text-white' : 'bg-white border-[#E8E4DC] text-[#1A1815]'}`}>
              {t.icon && <span aria-hidden="true">{t.icon} </span>}{t.label} <span className="font-normal">({t.count})</span>
            </button>
          ))}
        </div>
        <label className="block mt-2 max-w-sm">
          <span className={LABEL}>Show</span>
          <select className={INPUT} value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} data-testid="bill-review-filter">
            <option value="all">Everything</option>
            {BILL_GROUPS.map(([g, label]) => <option key={g} value={g}>{label}</option>)}
          </select>
        </label>
      </div>
      {show(saved).length > 0 && (
        <div>
          <h3 className="text-[0.75rem] uppercase tracking-wider text-[#5A5751] mb-2">Saved bills</h3>
          <ul className="space-y-2">{show(saved).map((r) => <Row key={r.key} row={r} accounts={accounts} entities={entities} homes={homes} rentals={rentals} onSave={onSave} onDismiss={onDismiss} onPause={onPause} />)}</ul>
        </div>
      )}
      {show(suggested).length > 0 && (
        <div>
          <h3 className="text-[0.75rem] uppercase tracking-wider text-[#5A5751] mb-2">Suggested from your records — please confirm or correct</h3>
          <ul className="space-y-2">{show(suggested).map((r) => <Row key={r.key} row={r} accounts={accounts} entities={entities} homes={homes} rentals={rentals} onSave={onSave} onDismiss={onDismiss} onPause={onPause} />)}</ul>
        </div>
      )}
      {!saved.length && !suggested.length && <p className="text-[0.8125rem] text-[#5A5751]">No bills saved and nothing in your records looks like a repeating bill yet.</p>}
    </section>
  );
}
