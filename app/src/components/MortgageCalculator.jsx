// =============================================================================
// MortgageCalculator — our own loan calculator, filled from our own records
// =============================================================================
// Darrell, 2026-11-10: "We need our own mortgage calculator inside our PoeTech
// App where it makes sense... easy population of our actual numbers... based
// on a drop down for each asset... and debt to get rid of it... easy to see...
// not disturbing what we need already." (DR-1413)
//
// One component, mounted closed in two places: Money → Debt Freedom (every
// property mortgage and every debt, by entity) and Real Estate (the property
// mortgages). The drop-down copies a record's balance, rate and payment in
// (lib/mortgage-sources.js); every figure can then be changed to try a what-if.
// NOTHING IS WRITTEN BACK: the property record, the debt and the debt-freedom
// plan are untouched, and the screen says so. The arithmetic is
// lib/mortgage-calc.js, pinned to the cent against the reference calculator.
//
// Colors are the app's own classes so every theme remaps them; no figure on
// this surface is marked in red (DR-0099). Grids are sized by their text so
// Big Print wraps instead of overlapping (DR-1412).
// =============================================================================
import React, { useMemo, useState } from 'react';
import { calculate, annualRows } from '../lib/mortgage-calc.js';
import { findLoan } from '../lib/mortgage-sources.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const INPUT = `w-full min-h-[44px] px-2.5 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.875rem] ${FOCUS}`;
const BTN = `min-h-[44px] px-4 py-2 text-[0.8125rem] font-semibold rounded-full border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`;
const LABEL = 'block text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1';
const GRID = { display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 9em), 1fr))' };
const H4 = 'text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold mt-3 mb-1';

const money = (n) => (n == null || !Number.isFinite(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const monthName = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
const span = (n) => (n == null ? '—' : `${Math.floor(n / 12)} yr ${n % 12} mo`);
const n = (x) => (x === '' || x == null || !Number.isFinite(Number(x)) ? 0 : Number(x));
const str = (x) => (x > 0 ? String(x) : '');
const nextMonth = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
};

const BLANK = {
  value: '',
  down: '',
  principal: '',
  rate: '',
  mode: 'term',
  years: '30',
  payment: '',
  insurance: '',
  tax: '',
  monthlyCost: '',
  xMonthly: '',
  xMonthlyStart: '1',
  xSemi: '',
  xSemiStart: '1',
  xAnnual: '',
  xAnnualStart: '1',
  xOnce: '',
  xOnceMonth: '1',
};

function Field({ id, label, value, onChange, type = 'text', hint }) {
  return (
    <label htmlFor={id}>
      <span className={LABEL}>{label}</span>
      <input
        id={id}
        data-testid={id}
        className={INPUT}
        type={type}
        inputMode={type === 'month' ? undefined : 'decimal'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="block text-[0.6875rem] text-[#5A5751] mt-0.5">{hint}</span>}
    </label>
  );
}

// The balance over time: the loan as written, and under the extra payments.
function BalanceChart({ base, plan, hasExtra }) {
  const W = 320;
  const H = 150;
  const months = base.months;
  const top = base.rows.length ? base.rows[0].balance + base.rows[0].principal : 1;
  const path = (rows) => `M0,0 ${rows.map((r) => `L${((r.n / months) * W).toFixed(1)},${(H - (r.balance / top) * H).toFixed(1)}`).join(' ')}`;
  return (
    <figure data-testid="mc-balance-chart" className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={
          hasExtra
            ? `Balance over time. As written it reaches zero in ${monthName(base.endYm)}; with the extra payments, in ${monthName(plan.endYm)}.`
            : `Balance over time, reaching zero in ${monthName(base.endYm)}.`
        }
        className="w-full h-auto border-l border-b border-[#E8E4DC]"
        preserveAspectRatio="none"
        style={{ maxHeight: '14rem' }}
      >
        <g className="text-[#5A5751]">
          <path
            d={path(base.rows)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={hasExtra ? '5 4' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        </g>
        {hasExtra && (
          <g className="text-[#1F3A2E]">
            <path d={path(plan.rows)} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </svg>
      <figcaption className="text-[0.75rem] text-[#5A5751] mt-1">
        {monthName(base.rows[0].ym)} to {monthName(base.endYm)}.{' '}
        {hasExtra ? (
          <>
            Dashed: as written. <strong className="text-[#1F3A2E]">Solid: with the extra payments</strong>, ending {monthName(plan.endYm)}.
          </>
        ) : (
          'Add an extra payment above to see the second line.'
        )}
      </figcaption>
    </figure>
  );
}

// Of every dollar paid: interest, scheduled principal, extra principal.
function SplitBar({ split }) {
  const total = split.interest + split.principal + split.extra;
  if (!(total > 0)) return null;
  const parts = [
    ['Interest', split.interest, 'text-[#B85838]'],
    ['Principal', split.principal, 'text-[#5A5751]'],
    ['Extra principal', split.extra, 'text-[#1F3A2E]'],
  ].filter((p) => p[1] > 0);
  const pct = (v) => Math.round((v / total) * 1000) / 10;
  return (
    <div data-testid="mc-split">
      <div
        className="flex w-full h-4 rounded-full overflow-hidden border border-[#E8E4DC]"
        role="img"
        aria-label={`Of everything paid: ${parts.map(([l, v]) => `${l} ${pct(v)}%`).join(', ')}.`}
      >
        {parts.map(([l, v, c]) => (
          <span key={l} className={`bg-current ${c}`} style={{ width: `${pct(v)}%` }} />
        ))}
      </div>
      <ul className="mt-1 text-[0.75rem] text-[#1A1815]" style={{ ...GRID, gap: '0.25rem' }}>
        {parts.map(([l, v, c]) => (
          <li key={l} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block w-3 h-3 rounded-sm bg-current shrink-0 ${c}`} />
            <span className="text-[#1A1815]">
              {l}: {pct(v)}% · {money(v)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Schedule({ plan }) {
  const years = useMemo(() => annualRows(plan.rows), [plan.rows]);
  const [open, setOpen] = useState(null);
  const showLtv = plan.rows.length > 0 && plan.rows[0].ltv != null;
  return (
    <div data-testid="mc-schedule" className="overflow-x-auto">
      <table className="w-full text-[0.75rem] text-[#1A1815]">
        <caption className="sr-only">
          The schedule by year: interest, principal paid with any extra, and the balance at the end of the year. Choose a year to see its months.
        </caption>
        <thead>
          <tr className="text-left text-[#5A5751]">
            <th scope="col" className="py-1">
              Year
            </th>
            <th scope="col" className="text-right">
              Interest
            </th>
            <th scope="col" className="text-right">
              Principal
            </th>
            {showLtv && (
              <th scope="col" className="text-right">
                Owed of value
              </th>
            )}
            <th scope="col" className="text-right">
              Balance
            </th>
          </tr>
        </thead>
        <tbody>
          {years.map((y) => (
            <React.Fragment key={y.year}>
              <tr className="border-t border-[#F0ECE4]">
                <th scope="row" className="py-0.5 text-left font-normal">
                  <button
                    type="button"
                    data-testid={`mc-year-${y.year}`}
                    aria-expanded={open === y.year}
                    onClick={() => setOpen(open === y.year ? null : y.year)}
                    className={`min-h-[44px] pr-2 underline text-[#1A1815] ${FOCUS}`}
                  >
                    {y.year}
                  </button>
                </th>
                <td className="text-right">{money(y.interest)}</td>
                <td className="text-right">{money(y.principal)}</td>
                {showLtv && <td className="text-right">{y.ltv}%</td>}
                <td className="text-right">{money(y.balance)}</td>
              </tr>
              {open === y.year &&
                plan.rows
                  .filter((r) => r.ym.startsWith(y.year))
                  .map((r) => (
                    <tr key={r.ym} className="bg-[#FAF8F4] text-[#5A5751]" data-testid={`mc-month-${r.ym}`}>
                      <th scope="row" className="py-1 pl-3 text-left font-normal">
                        {monthName(r.ym).split(' ')[0].slice(0, 3)} · #{r.n}
                      </th>
                      <td className="text-right">{money(r.interest)}</td>
                      <td className="text-right">
                        {money(r.principal + r.extra)}
                        {r.extra > 0 ? ` (${money(r.extra)} extra)` : ''}
                      </td>
                      {showLtv && <td className="text-right">{r.ltv}%</td>}
                      <td className="text-right">{money(r.balance)}</td>
                    </tr>
                  ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {object} props
 * @param {{groups: object[], count: number, propertiesWithoutMortgage?: number}} props.sources  lib/mortgage-sources.js loanGroups()
 * @param {Date} [props.currentDate]
 * @param {string} [props.title]
 * @param {string} [props.lead]   one sentence saying what this mount lists
 * @param {boolean} [props.defaultOpen]
 */
export default function MortgageCalculator({ sources, currentDate, title = 'Mortgage and loan calculator', lead = '', defaultOpen = false }) {
  const groups = (sources && sources.groups) || [];
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const [open, setOpen] = useState(defaultOpen);
  const [pick, setPick] = useState('');
  const [f, setF] = useState(() => ({ ...BLANK, start: nextMonth(cd) }));
  const [tab, setTab] = useState('summary');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const picked = pick ? findLoan(groups, pick) : null;

  const choose = (id) => {
    setPick(id);
    const o = id ? findLoan(groups, id) : null;
    if (!o) {
      setF((x) => ({ ...BLANK, start: x.start }));
      return;
    }
    setF((x) => ({
      ...BLANK,
      start: x.start,
      value: str(o.propertyValue),
      principal: str(o.principal),
      rate: str(o.ratePct),
      mode: 'payment',
      payment: str(o.payment),
      years: '',
      monthlyCost: str(o.escrowMonthly),
    }));
  };
  // A new loan: the amount borrowed follows the price and the down payment.
  const setPrice = (k) => (v) =>
    setF((x) => {
      const next = { ...x, [k]: v };
      if (!pick && n(next.value) > 0) next.principal = String(Math.max(0, Math.round((n(next.value) - n(next.down)) * 100) / 100));
      return next;
    });

  const result = useMemo(
    () =>
      calculate(
        {
          principal: n(f.principal),
          ratePct: n(f.rate),
          years: f.mode === 'term' ? n(f.years) : 0,
          payment: f.mode === 'payment' ? n(f.payment) : 0,
          startYm: /^\d{4}-\d{2}$/.test(f.start) ? f.start : nextMonth(cd),
          propertyValue: n(f.value),
          prepay: {
            monthly: { amount: n(f.xMonthly), startMonth: n(f.xMonthlyStart) || 1 },
            semiAnnual: { amount: n(f.xSemi), startMonth: n(f.xSemiStart) || 1 },
            annual: { amount: n(f.xAnnual), startMonth: n(f.xAnnualStart) || 1 },
            oneTime: { amount: n(f.xOnce), month: n(f.xOnceMonth) || 1 },
          },
        },
        { annualInsurance: n(f.insurance), annualTax: n(f.tax), monthly: n(f.monthlyCost) }
      ),
    [f, cd]
  );

  const started = n(f.principal) > 0 || n(f.rate) > 0;
  const facts = result.ok
    ? [
        ['Monthly payment', money(result.payment), f.mode === 'term' ? 'principal and interest, worked out' : 'principal and interest, as entered'],
        [
          'With monthly costs',
          money(result.totalMonthly),
          result.monthlyExpenses > 0 ? `${money(result.monthlyExpenses)} of insurance, tax and other costs` : 'no costs entered',
        ],
        ['Paid off', monthName(result.plan.endYm), `${span(result.plan.months)}${result.hasExtra ? `, ${span(result.monthsSaved)} sooner` : ''}`],
        ['Interest', money(result.plan.totalInterest), result.hasExtra ? `${money(result.interestSaved)} less than as written` : 'over the life of the loan'],
      ]
    : [];

  return (
    <section data-testid="mortgage-calculator" aria-label={title} className="bg-white border border-[#E8E4DC] rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="text-[0.875rem] font-semibold text-[#1A1815]">{title}</h3>
        <p className="text-[0.75rem] text-[#5A5751]">
          {lead || 'Choose a loan on file to fill in its figures, or enter a new one.'} A calculator only: it changes no record and no plan.
        </p>
      </div>
      <button type="button" data-testid="mc-toggle" aria-expanded={open} onClick={() => setOpen(!open)} className={BTN}>
        {open ? 'Close the calculator' : 'Open the calculator'}
      </button>
      {open && (
        <div className="space-y-3">
          <label htmlFor="mc-pick">
            <span className={LABEL}>Which loan</span>
            <select id="mc-pick" data-testid="mc-pick" className={INPUT} value={pick} onChange={(e) => choose(e.target.value)}>
              <option value="">A new loan — enter the figures</option>
              {groups.map((g) => (
                <optgroup key={String(g.entityId)} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label} · {money(o.principal)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {groups.length === 0 && (
            <p data-testid="mc-none" className="text-[0.75rem] text-[#5A5751]">
              No mortgage or debt with a balance is on file yet, so there is nothing to choose. A new loan can still be worked out below.
            </p>
          )}
          {picked && (
            <p data-testid="mc-filled" className="text-[0.75rem] text-[#1A1815]">
              Filled from the record: {picked.principal > 0 ? money(picked.principal) : 'no balance'} owed
              {picked.ratePct > 0 ? ` at ${picked.ratePct}%${picked.estimated ? ' (estimated on the record)' : ''}` : ''}
              {picked.payment > 0 ? `, ${money(picked.payment)} a month` : ''}.
              {picked.missing.length > 0 && (
                <span className="text-[#B45309]" data-testid="mc-missing">
                  {' '}
                  Not on the record yet: {picked.missing.join(', ')}. Enter it here to see the result.
                </span>
              )}
            </p>
          )}

          <div style={GRID}>
            <Field id="mc-value" label="Property value (optional)" value={f.value} onChange={setPrice('value')} />
            {!pick && <Field id="mc-down" label="Down payment" value={f.down} onChange={setPrice('down')} />}
            <Field id="mc-principal" label={pick ? 'Balance owed' : 'Amount borrowed'} value={f.principal} onChange={set('principal')} />
            <Field id="mc-rate" label="Interest rate (%)" value={f.rate} onChange={set('rate')} />
            <label htmlFor="mc-mode">
              <span className={LABEL}>I know the</span>
              <select id="mc-mode" data-testid="mc-mode" className={INPUT} value={f.mode} onChange={(e) => set('mode')(e.target.value)}>
                <option value="term">term in years</option>
                <option value="payment">monthly payment</option>
              </select>
            </label>
            {f.mode === 'term' ? (
              <Field id="mc-years" label="Years" value={f.years} onChange={set('years')} />
            ) : (
              <Field id="mc-payment" label="Principal and interest per month" value={f.payment} onChange={set('payment')} />
            )}
            <Field id="mc-start" label="First payment" type="month" value={f.start} onChange={set('start')} />
          </div>

          <h4 className={H4}>Costs beside the payment</h4>
          <div style={GRID}>
            <Field id="mc-insurance" label="Insurance per year" value={f.insurance} onChange={set('insurance')} />
            <Field id="mc-tax" label="Property tax per year" value={f.tax} onChange={set('tax')} />
            <Field
              id="mc-monthly-cost"
              label="Escrow or other, per month"
              value={f.monthlyCost}
              onChange={set('monthlyCost')}
              hint={picked && picked.escrowMonthly > 0 ? 'the escrow on the record' : undefined}
            />
          </div>

          <h4 className={H4}>Extra toward principal</h4>
          <div style={GRID}>
            <Field id="mc-x-monthly" label="Every month" value={f.xMonthly} onChange={set('xMonthly')} />
            <Field id="mc-x-monthly-start" label="Starting at payment #" value={f.xMonthlyStart} onChange={set('xMonthlyStart')} />
            <Field id="mc-x-semi" label="Twice a year" value={f.xSemi} onChange={set('xSemi')} />
            <Field id="mc-x-semi-start" label="Starting at payment #" value={f.xSemiStart} onChange={set('xSemiStart')} />
            <Field id="mc-x-annual" label="Once a year" value={f.xAnnual} onChange={set('xAnnual')} />
            <Field id="mc-x-annual-start" label="Starting at payment #" value={f.xAnnualStart} onChange={set('xAnnualStart')} />
            <Field id="mc-x-once" label="One time" value={f.xOnce} onChange={set('xOnce')} />
            <Field id="mc-x-once-month" label="At payment #" value={f.xOnceMonth} onChange={set('xOnceMonth')} />
          </div>

          {!result.ok && started && (
            <p data-testid="mc-reason" role="status" className="text-[0.8125rem] text-[#B45309]">
              {result.reason}
            </p>
          )}
          {result.ok && (
            <div data-testid="mc-result" className="space-y-3">
              <dl className="rounded-xl bg-[#1F3A2E] text-[#F6F1E7] p-3" style={{ ...GRID, gap: '0.75rem' }}>
                {facts.map(([label, value, sub]) => (
                  <div key={label} className="min-w-0" style={{ overflowWrap: 'anywhere' }}>
                    <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">{label}</dt>
                    <dd className="text-xl leading-tight text-[#F6F1E7]">
                      {value}
                      <span className="block mt-0.5 text-[0.6875rem] text-[#F6F1E7] opacity-80">{sub}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <div role="tablist" aria-label="Calculator views" className="flex flex-wrap gap-2">
                {[
                  ['summary', 'Summary'],
                  ['schedule', 'Schedule'],
                  ['chart', 'Chart'],
                ].map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    data-testid={`mc-tab-${k}`}
                    onClick={() => setTab(k)}
                    className={`min-h-[44px] px-4 text-[0.8125rem] font-semibold rounded-full border border-[#1A1815] ${tab === k ? 'bg-[#1A1815] text-white underline underline-offset-4' : 'bg-white text-[#1A1815]'} ${FOCUS}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === 'summary' && (
                <dl data-testid="mc-summary" className="text-[0.8125rem]" style={{ ...GRID, columnGap: '1rem', rowGap: 0 }}>
                  {[
                    ['First payment', monthName(result.plan.rows[0].ym)],
                    ['Last payment', monthName(result.plan.endYm)],
                    ['Time to pay off', span(result.plan.months)],
                    ['As written', `${span(result.base.months)}, to ${monthName(result.base.endYm)}`],
                    ['Total interest', money(result.plan.totalInterest)],
                    ['Interest as written', money(result.base.totalInterest)],
                    ['Total of all payments', money(result.plan.totalPaid)],
                    ['Extra payments', money(result.plan.totalExtra)],
                    ['Interest saved', money(result.interestSaved)],
                    ['Paid off sooner by', span(result.monthsSaved)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-[#F0ECE4] py-1">
                      <dt className="text-[#5A5751]">{k}</dt>
                      <dd className="text-[#1A1815] text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === 'schedule' && <Schedule plan={result.plan} />}
              {tab === 'chart' && (
                <div className="space-y-3">
                  <BalanceChart base={result.base} plan={result.plan} hasExtra={result.hasExtra} />
                  <SplitBar split={result.split} />
                </div>
              )}
              <p className="text-[0.6875rem] text-[#5A5751]">
                A projection: it assumes the rate stays the same, every payment is made in its month, and extra goes straight to principal. A lender that rounds
                interest each month can differ by a few cents. Pay extra only from what Safe to Spend shows as available.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
