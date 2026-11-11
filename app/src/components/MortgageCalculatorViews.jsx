// =============================================================================
// MortgageCalculatorViews — what the calculator shows once it has an answer
// =============================================================================
// The asset view (what paying the loan down does for the property behind it),
// the schedule, the balance chart and the split of every dollar paid. Pure
// display over lib/mortgage-calc.js; split from MortgageCalculator.jsx so each
// file stays small (DR-1339). Theme classes only; no figure is marked in red
// (DR-0099). DR-1413, DR-1415.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { annualRows } from '../lib/mortgage-calc.js';

export const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
export const GRID = { display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 9em), 1fr))' };
export const money = (n) => (n == null || !Number.isFinite(n) ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
export const monthName = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
export const span = (n) => (n == null ? '—' : `${Math.floor(n / 12)} yr ${n % 12} mo`);

export function Rows({ rows, testid }) {
  return (
    <dl data-testid={testid} className="text-[0.8125rem]">
      {rows.map(([k, v, sub]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-[#F0ECE4] py-1.5">
          <dt className="text-[#5A5751]">{k}</dt>
          <dd className="text-[#1A1815] text-right">
            {v}
            {sub && <span className="block text-[0.6875rem] text-[#5A5751]">{sub}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// What paying it down does for the asset: what is owned now, what the next
// year of payments adds, and what is freed the month it is paid off.
export function AssetView({ asset, hasExtra, name }) {
  if (!asset) return null;
  const a = asset;
  const rows = [
    ...(a.value != null
      ? [
          ['Value on file', money(a.value)],
          ['Owed today', money(a.owedNow)],
          ['Owned today', money(a.equityNow), `${a.ownedPctNow}% of the value`],
          [`Owned after ${a.monthsCounted} more payments`, money(a.equityIn12), `${money(a.paidDownIn12)} more of it yours`],
        ]
      : [
          ['Owed today', money(a.owedNow)],
          [`Paid down in ${a.monthsCounted} payments`, money(a.paidDownIn12)],
        ]),
    ['Owned outright', monthName(a.paidOffYm)],
    ['Freed every month after that', money(a.freedPerMonth), 'the payment no longer owed'],
    ...(hasExtra
      ? [
          ['Owned outright sooner by', span(a.monthsSaved), 'because of the extra principal'],
          ['Payments never made', money(a.keptBySooner), 'the payment times the months saved'],
          ['Interest never paid', money(a.interestSaved)],
        ]
      : []),
    ...(a.rentAfterPayoff != null
      ? [['Rent kept once it is paid off', `${money(a.rentAfterPayoff)} a month`, 'the rent less insurance, tax and other costs, with no mortgage payment']]
      : []),
  ];
  return (
    <div data-testid="mc-asset" className="space-y-2">
      <p className="text-[0.75rem] text-[#5A5751]">
        {name ? `${name}: what` : 'What'} paying this loan down does for the asset behind it.
        {a.value == null ? ' Enter the property value on the Loan tab to see what is owned.' : ' Equity is at the value on file, held still.'}
        {!hasExtra && ' Add extra principal on the Extra tab to see what it frees sooner.'}
      </p>
      <Rows rows={rows} testid="mc-asset-rows" />
    </div>
  );
}

// The balance over time: the loan as written, and under the extra payments.
export function BalanceChart({ base, plan, hasExtra }) {
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
export function SplitBar({ split }) {
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

export function Schedule({ plan }) {
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
