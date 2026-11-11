// =============================================================================
// MortgageCalculator — our own loan calculator, filled from our own records
// =============================================================================
// Darrell, 2026-11-10: "We need our own mortgage calculator inside our PoeTech
// App where it makes sense... easy population of our actual numbers... based
// on a drop down for each asset... and debt to get rid of it... easy to see...
// not disturbing what we need already." (DR-1413) Then, the same evening:
// properties we are looking to buy, kept by name (DR-1414); and, from his own
// screen, "I don't see any mortgage in the list... we really want to know how
// assets are paid down and the benefits of that... keep using our subtab
// procedures so scrolling is minimal" (DR-1415).
//
// One component, mounted closed in Money → Debt Freedom and in Real Estate.
// The drop-down lists every property first, then every other debt
// (lib/mortgage-sources.js); the answer sits directly under it; and everything
// else is ONE row of sub-tabs (SectionTabs, the app's own pattern), one panel
// at a time: Loan, Costs, Extra, then Asset, Summary, Schedule, Chart.
//
// WHAT IT WRITES, and only on a named button: a property being weighed is kept
// in its own list (lib/purchase-prospects.js), and the balance, rate and
// payment typed for a property can be saved to that property's own record,
// the same three fields the home-mortgage card already edits. Nothing else:
// no debt, no plan, no total is touched by looking.
//
// Colors are the app's own classes so every theme remaps them; no figure is
// marked in red (DR-0099). Grids are sized by their text (DR-1412).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import SectionTabs from './SectionTabs.jsx';
import { calculate, assetView } from '../lib/mortgage-calc.js';
import { findLoan } from '../lib/mortgage-sources.js';
import { FIGURE_KEYS, missingForSave, toProspect } from '../lib/purchase-prospects.js';
import { AssetView, BalanceChart, SplitBar, Schedule, Rows, GRID, money, monthName, span } from './MortgageCalculatorViews.jsx';

// Declared here, not imported: the UI-standards gate reads a button's focus ring from this file.
const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

const INPUT = `w-full min-h-[44px] px-2.5 rounded-lg border border-[#E8E4DC] bg-white text-[#1A1815] text-[0.875rem] ${FOCUS}`;
const BTN = `min-h-[44px] px-4 py-2 text-[0.8125rem] font-semibold rounded-full border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] ${FOCUS}`;
const BTN_QUIET = `min-h-[44px] px-4 text-[0.8125rem] font-semibold rounded-full border border-[#1A1815] bg-white text-[#1A1815] ${FOCUS}`;
const LABEL = 'block text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1';
const NOTE = 'text-[0.75rem] text-[#5A5751]';

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
  rent: '',
  xMonthly: '',
  xMonthlyStart: '1',
  xSemi: '',
  xSemiStart: '1',
  xAnnual: '',
  xAnnualStart: '1',
  xOnce: '',
  xOnceMonth: '1',
};

function Field({ id, label, value, onChange, type = 'text', hint, numeric = true }) {
  return (
    <label htmlFor={id}>
      <span className={LABEL}>{label}</span>
      <input
        id={id}
        data-testid={id}
        className={INPUT}
        type={type}
        inputMode={type === 'month' || !numeric ? undefined : 'decimal'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="block text-[0.6875rem] text-[#5A5751] mt-0.5">{hint}</span>}
    </label>
  );
}

/**
 * @param {object} props
 * @param {{groups: object[], count: number, propertiesWithoutMortgage?: number}} props.sources  lib/mortgage-sources.js loanGroups()
 * @param {Date} [props.currentDate]
 * @param {string} [props.title]
 * @param {string} [props.lead]   one sentence saying what this mount lists
 * @param {boolean} [props.defaultOpen]
 * @param {string} [props.idBase]  the sub-tab row's id prefix; unique per mount
 * @param {object[]} [props.entities]  offered as "who would hold it" on a property being weighed
 * @param {(prospect: object) => void} [props.onSaveProspect]  when given, a new loan can be named and kept
 * @param {(id: string) => void} [props.onRemoveProspect]
 * @param {(rentalId: string, patch: object) => void} [props.onSaveRecord]  when given, the balance, rate and
 *   payment entered for a property can be saved to that property's record (the shell's updateRental)
 */
export default function MortgageCalculator({
  sources,
  currentDate,
  title = 'Mortgage and loan calculator',
  lead = '',
  defaultOpen = false,
  idBase = 'mc',
  entities = null,
  onSaveProspect = null,
  onRemoveProspect = null,
  onSaveRecord = null,
}) {
  const groups = (sources && sources.groups) || [];
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);
  const [open, setOpen] = useState(defaultOpen);
  const [pick, setPick] = useState('');
  const [f, setF] = useState(() => ({ ...BLANK, start: nextMonth(cd) }));
  const [tab, setTab] = useState('loan');
  const [keep, setKeep] = useState({ name: '', entityId: '' });
  const [note, setNote] = useState('');
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  // The row of sub-tabs scrolls on a phone; the open one is always brought into view.
  useEffect(() => {
    const chip = typeof document !== 'undefined' ? document.getElementById(`${idBase}-tab-${tab}`) : null;
    if (chip && typeof chip.scrollIntoView === 'function') chip.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tab, idBase]);
  const picked = pick ? findLoan(groups, pick) : null;
  // A property being weighed is a new loan with a name: not a record on the books.
  const weighing = !picked || picked.kind === 'prospect';
  const isProperty = !!picked && picked.kind === 'property';

  const choose = (id) => {
    setPick(id);
    setNote('');
    const o = id ? findLoan(groups, id) : null;
    if (!o) {
      setF((x) => ({ ...BLANK, start: x.start }));
      setKeep({ name: '', entityId: '' });
      return;
    }
    if (o.kind === 'prospect') {
      setF((x) => ({ ...BLANK, start: x.start, ...o.figures, principal: o.figures.principal || str(o.principal) }));
      setKeep({ name: o.name, entityId: o.entityId || '' });
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
      rent: str(o.rent),
    }));
    // Straight to the answer when the record is whole; to the Loan tab when a figure is missing.
    setTab(o.missing.length ? 'loan' : o.kind === 'property' ? 'asset' : 'summary');
  };
  // A new loan: the amount borrowed follows the price and the down payment.
  const setPrice = (k) => (v) =>
    setF((x) => {
      const next = { ...x, [k]: v };
      if (weighing && n(next.value) > 0) next.principal = String(Math.max(0, Math.round((n(next.value) - n(next.down)) * 100) / 100));
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
  const asset = useMemo(() => assetView(result, { propertyValue: n(f.value), rent: n(f.rent) }), [result, f.value, f.rent]);

  const saveBlockers = missingForSave({ name: keep.name, figures: f });
  const saveProspect = () => {
    if (!onSaveProspect || saveBlockers.length) return;
    const id = picked && picked.kind === 'prospect' ? picked.prospectId : `p-${Date.now().toString(36)}`;
    const figures = {};
    for (const k of FIGURE_KEYS) figures[k] = f[k];
    onSaveProspect(toProspect({ id, name: keep.name, entityId: keep.entityId || null, figures }));
    setPick(`prospect:${id}`);
    setNote('Saved with this household\u2019s records. Choose it from the list any time to pick up where you left off.');
  };
  const removeProspect = () => {
    if (!onRemoveProspect || !picked || picked.kind !== 'prospect') return;
    onRemoveProspect(picked.prospectId);
    choose('');
    setNote('Removed from the list.');
  };
  // The three figures the property record keeps, as they stand in the calculator.
  const forRecord = { balance: n(f.principal), rate: n(f.rate), monthlyPI: result.ok ? result.payment : 0 };
  const recordReady = isProperty && forRecord.balance > 0 && forRecord.rate > 0 && forRecord.monthlyPI > 0;
  const recordSame = isProperty && forRecord.balance === picked.principal && forRecord.rate === picked.ratePct && forRecord.monthlyPI === picked.payment;
  const saveRecord = () => {
    if (!onSaveRecord || !recordReady || recordSame) return;
    onSaveRecord(picked.rentalId, { mortgage: { ...(picked.record || {}), ...forRecord, estimated: false } });
    setNote(`Saved to the record for ${picked.name}.`);
  };

  const leftFromRent = result.ok && n(f.rent) > 0 ? Math.round((n(f.rent) - result.totalMonthly) * 100) / 100 : null;
  const started = n(f.principal) > 0 || n(f.rate) > 0;
  const facts = result.ok
    ? [
        ['Monthly payment', money(result.payment), result.monthlyExpenses > 0 ? `${money(result.totalMonthly)} with costs` : 'principal and interest'],
        ['Paid off', monthName(result.plan.endYm), `${span(result.plan.months)}${result.hasExtra ? `, ${span(result.monthsSaved)} sooner` : ''}`],
        ['Interest', money(result.plan.totalInterest), result.hasExtra ? `${money(result.interestSaved)} saved` : 'over the life of the loan'],
        ...(leftFromRent == null
          ? []
          : [[leftFromRent >= 0 ? 'Left from the rent' : 'Short of the rent', `${money(Math.abs(leftFromRent))} a month`, 'before repairs and vacancy']]),
      ]
    : [];

  const needAnswer = (
    <p data-testid="mc-need-answer" className={NOTE}>
      {started ? result.reason : 'Choose a loan above or enter the figures on the Loan tab first.'}
    </p>
  );
  const sections = [
    {
      id: 'loan',
      label: 'Loan',
      render: () => (
        <div style={GRID}>
          <Field id="mc-value" label="Property value (optional)" value={f.value} onChange={setPrice('value')} />
          {weighing && <Field id="mc-down" label="Down payment" value={f.down} onChange={setPrice('down')} />}
          <Field id="mc-principal" label={weighing ? 'Amount borrowed' : 'Balance owed'} value={f.principal} onChange={set('principal')} />
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
      ),
    },
    {
      id: 'costs',
      label: 'Costs',
      render: () => (
        <div style={GRID}>
          <Field id="mc-insurance" label="Insurance per year" value={f.insurance} onChange={set('insurance')} />
          <Field id="mc-tax" label="Property tax per year" value={f.tax} onChange={set('tax')} />
          <Field
            id="mc-monthly-cost"
            label="Escrow or other, per month"
            value={f.monthlyCost}
            onChange={set('monthlyCost')}
            hint={isProperty && picked.escrowMonthly > 0 ? 'the escrow on the record' : undefined}
          />
          <Field
            id="mc-rent"
            label={weighing ? 'Expected rent per month' : 'Rent per month'}
            value={f.rent}
            onChange={set('rent')}
            hint={isProperty && picked.rent > 0 ? 'the rent on the record' : undefined}
          />
        </div>
      ),
    },
    {
      id: 'extra',
      label: 'Extra',
      render: () => (
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
      ),
    },
    {
      id: 'asset',
      label: 'Asset',
      render: () => (result.ok ? <AssetView asset={asset} hasExtra={result.hasExtra} name={picked ? picked.name : keep.name} /> : needAnswer),
    },
    {
      id: 'summary',
      label: 'Summary',
      render: () =>
        result.ok ? (
          <Rows
            testid="mc-summary"
            rows={[
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
              [
                'With monthly costs',
                money(result.totalMonthly),
                result.monthlyExpenses > 0 ? `${money(result.monthlyExpenses)} of insurance, tax and other costs` : 'no costs entered',
              ],
            ]}
          />
        ) : (
          needAnswer
        ),
    },
    { id: 'schedule', label: 'Schedule', render: () => (result.ok ? <Schedule plan={result.plan} /> : needAnswer) },
    {
      id: 'chart',
      label: 'Chart',
      render: () =>
        result.ok ? (
          <div className="space-y-3">
            <BalanceChart base={result.base} plan={result.plan} hasExtra={result.hasExtra} />
            <SplitBar split={result.split} />
          </div>
        ) : (
          needAnswer
        ),
    },
    weighing && onSaveProspect
      ? {
          id: 'keep',
          label: 'Keep',
          render: () => (
            <div data-testid="mc-keep" className="space-y-2">
              <p className={NOTE}>
                Name a property you are weighing and it stays in the list above with these figures. It is not added to your properties, your debts or any total.
              </p>
              <div style={GRID}>
                <Field id="mc-keep-name" label="Name or address" value={keep.name} onChange={(v) => setKeep((k) => ({ ...k, name: v }))} numeric={false} />
                {entities && entities.length > 0 && (
                  <label htmlFor="mc-keep-entity">
                    <span className={LABEL}>Who would hold it</span>
                    <select
                      id="mc-keep-entity"
                      data-testid="mc-keep-entity"
                      className={INPUT}
                      value={keep.entityId}
                      onChange={(e) => setKeep((k) => ({ ...k, entityId: e.target.value }))}
                    >
                      <option value="">Not decided</option>
                      {entities.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button type="button" data-testid="mc-keep-save" className={BTN} onClick={saveProspect} aria-disabled={saveBlockers.length > 0}>
                  {picked ? 'Save the changes' : 'Save this property'}
                </button>
                {picked && onRemoveProspect && (
                  <button type="button" data-testid="mc-keep-remove" onClick={removeProspect} className={BTN_QUIET}>
                    Remove from the list
                  </button>
                )}
              </div>
              {saveBlockers.length > 0 && (keep.name || started) && (
                <p data-testid="mc-keep-needs" className="text-[0.75rem] text-[#B45309]">
                  To save it, enter {saveBlockers.join(' and ')}.
                </p>
              )}
            </div>
          ),
        }
      : null,
    isProperty && onSaveRecord
      ? {
          id: 'record',
          label: 'Save',
          render: () => (
            <div data-testid="mc-record" className="space-y-2">
              <p className={NOTE}>
                The record for {picked.name} keeps three mortgage figures. Save what is entered here and it fills in everywhere the app reads that mortgage:
                Real Estate, Debts and Bills Due.
              </p>
              <Rows
                testid="mc-record-rows"
                rows={[
                  ['Balance', money(forRecord.balance), `on the record: ${picked.principal > 0 ? money(picked.principal) : 'not entered'}`],
                  [
                    'Interest rate',
                    forRecord.rate > 0 ? `${forRecord.rate}%` : '—',
                    `on the record: ${picked.ratePct > 0 ? `${picked.ratePct}%` : 'not entered'}`,
                  ],
                  ['Principal and interest', money(forRecord.monthlyPI), `on the record: ${picked.payment > 0 ? money(picked.payment) : 'not entered'}`],
                ]}
              />
              <button type="button" data-testid="mc-record-save" className={BTN} onClick={saveRecord} aria-disabled={!recordReady || recordSame}>
                Save these figures to the property record
              </button>
              {!recordReady && (
                <p data-testid="mc-record-needs" className="text-[0.75rem] text-[#B45309]">
                  Enter the balance, the rate, and the payment or the term on the Loan tab first.
                </p>
              )}
              {recordReady && recordSame && <p className={NOTE}>These match the record already.</p>}
            </div>
          ),
        }
      : null,
  ];

  return (
    <section data-testid="mortgage-calculator" aria-label={title} className="bg-white border border-[#E8E4DC] rounded-2xl p-4 space-y-3">
      <div>
        <h3 className="text-[0.875rem] font-semibold text-[#1A1815]">{title}</h3>
        <p className={NOTE}>
          {lead || 'Choose a property or a debt on file to fill in its figures, or enter a new one.'} Looking changes nothing; it saves only when you press a
          save button.
        </p>
      </div>
      <button type="button" data-testid="mc-toggle" aria-expanded={open} onClick={() => setOpen(!open)} className={BTN}>
        {open ? 'Close the calculator' : 'Open the calculator'}
      </button>
      {open && (
        <div className="space-y-3">
          <label htmlFor="mc-pick">
            <span className={LABEL}>Which property or debt</span>
            <select id="mc-pick" data-testid="mc-pick" className={INPUT} value={pick} onChange={(e) => choose(e.target.value)}>
              <option value="">A new loan, or a property we are weighing</option>
              {groups.map((g) => (
                <optgroup key={g.key || String(g.entityId)} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                      {o.principal > 0 ? ` · ${money(o.principal)}` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          {groups.length === 0 && (
            <p data-testid="mc-none" className={NOTE}>
              No property or debt is on file yet, so there is nothing to choose. A new loan can still be worked out below.
            </p>
          )}
          {picked && picked.kind !== 'prospect' && (
            <p data-testid="mc-filled" className="text-[0.75rem] text-[#1A1815]">
              {picked.principal > 0 ? (
                <>
                  Filled from the record: {money(picked.principal)} owed
                  {picked.ratePct > 0 ? ` at ${picked.ratePct}%${picked.estimated ? ' (estimated on the record)' : ''}` : ''}
                  {picked.payment > 0 ? `, ${money(picked.payment)} a month` : ''}.
                </>
              ) : (
                <>No mortgage has been entered for {picked.name} yet.</>
              )}
              {picked.missing.length > 0 && (
                <span className="text-[#B45309]" data-testid="mc-missing">
                  {' '}
                  Not on the record yet: {picked.missing.join(', ')}. Enter it on the Loan tab
                  {isProperty && onSaveRecord ? ', then the Save tab keeps it' : ''}.
                </span>
              )}
            </p>
          )}

          {result.ok ? (
            <dl
              data-testid="mc-result"
              className="rounded-xl bg-[#1F3A2E] text-[#F6F1E7] p-3"
              style={{ ...GRID, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 8em), 1fr))' }}
            >
              {facts.map(([label, value, sub]) => (
                <div key={label} className="min-w-0" style={{ overflowWrap: 'anywhere' }}>
                  <dt className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#C9A227] font-semibold">{label}</dt>
                  <dd className="text-base font-semibold leading-tight text-[#F6F1E7]">
                    {value}
                    <span className="block mt-0.5 text-[0.6875rem] font-normal text-[#F6F1E7] opacity-80">{sub}</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            started && (
              <p data-testid="mc-reason" role="status" className="text-[0.8125rem] text-[#B45309]">
                {result.reason}
              </p>
            )
          )}
          {note && (
            <p data-testid="mc-note" role="status" className="text-[0.75rem] text-[#1F3A2E]">
              {note}
            </p>
          )}

          <SectionTabs
            variant="sub"
            idBase={idBase}
            ariaLabel="Calculator sections"
            sections={sections}
            activeId={tab}
            onActiveChange={setTab}
            chipClassName="min-h-[44px]"
          />
          <p className="text-[0.6875rem] text-[#5A5751]">
            A projection: it assumes the rate stays the same, every payment is made in its month, and extra goes straight to principal. A lender that rounds
            interest each month can differ by a few cents. Pay extra only from what Safe to Spend shows as available.
          </p>
        </div>
      )}
    </section>
  );
}
