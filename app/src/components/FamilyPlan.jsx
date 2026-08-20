// FamilyPlan — the written family financial plan, readable in the app.
//
// Christina 2026-08-19, delivering the August workbook + report: "I want
// Darrell to clearly see everything I showed in these spreadsheets so you may
// have to make a new tab that has wording for him to read and the information
// in the spreadsheet."
//
// The CONTENT lives in the family_plans table (jsonb, RLS-gated to the
// family's instance) — never in this public repository or the shipped bundle.
// This component renders whatever the newest plan row carries: her narrative
// first (the wording), then every worksheet as a table. A section the row
// doesn't carry simply doesn't render — the surface shows what IS, and only
// that (DR-0076).
import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

const money = (v) => {
  if (v == null || v === '') return '—';
  if (typeof v === 'string') return v;
  const opts = Number.isInteger(v) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `$${v.toLocaleString(undefined, opts)}`;
};
const pct = (v) => (v == null || v === '' ? '—' : `${v}%`);
const text = (v) => (v == null || v === '' ? '' : String(v));

function Section({ label, children }) {
  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5 space-y-3">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-medium">{label}</div>
      {children}
    </section>
  );
}

// One generic table: columns are [header, key, kind, align]. Kind picks the
// formatter; align defaults right for numbers. Wide tables scroll in place.
//
// totals: when true, a Total row sums every 'money' column across the rows
// that carry NUMBERS — a blank or text cell contributes nothing, and a money
// column with no numeric rows totals '—', never a painted $0 (DR-0076).
// Darrell 2026-08-20, reading the live debt tracker: "where are the total
// amount of money and timelines for each debt?!" — the sums were nowhere and
// the payoff column sat off-screen. The swipe cue names the off-screen part:
// a ≥5-column table on a narrow screen IS wider than the viewport, and
// nothing said so.
function PlanTable({ columns, rows, caption, totals }) {
  if (!rows || !rows.length) return null;
  const fmtFor = (kind) => (kind === 'money' ? money : kind === 'pct' ? pct : text);
  const sums = totals && rows.length > 1
    ? columns.map(([, key, kind]) => {
        if (kind !== 'money') return null;
        let sum = 0, hit = 0;
        for (const r of rows) {
          const v = r[key];
          if (typeof v === 'number' && Number.isFinite(v)) { sum += v; hit += 1; }
        }
        return hit > 0 ? Math.round(sum * 100) / 100 : null;
      })
    : null;
  const showTotals = sums && sums.some((s) => s != null);
  return (
    <div>
      {columns.length >= 5 && (
        <p className="sm:hidden text-[0.625rem] text-[#5A5751] mb-1" style={serif}>
          Wider than the screen — swipe the table sideways for every column →
        </p>
      )}
      <div className="border border-[#1A1815] overflow-x-auto">
        <table className="w-full text-xs">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[#1A1815] bg-[#FAF8F4]">
              {columns.map(([h, , kind]) => (
                <th key={h} scope="col" className={`p-2 text-[0.5625rem] uppercase tracking-wider text-[#5A5751] ${kind === 'text' ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[#E8E4DC]">
                {columns.map(([h, key, kind]) => (
                  <td key={h} className={`p-2 ${kind === 'text' ? 'text-left' : 'text-right'}`} style={kind === 'text' ? serif : mono}>
                    {fmtFor(kind)(r[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot>
              <tr className="border-t-2 border-[#1A1815] bg-[#FAF8F4] font-semibold">
                {columns.map(([h, , kind], ci) => (
                  <td key={h} className={`p-2 ${kind === 'text' ? 'text-left' : 'text-right'}`} style={kind === 'text' ? serif : mono}>
                    {ci === 0 ? 'Total' : kind === 'money' ? (sums[ci] != null ? money(sums[ci]) : '—') : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

function FamilyPlan() {
  const [state, setState] = useState({ loading: true, plan: null, title: '', updatedAt: null, error: null });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // RLS scopes this to the signed-in member's instance; newest plan wins.
        const { data, error } = await supabase
          .from('family_plans')
          .select('title, plan, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!alive) return;
        if (error) throw error;
        const row = data && data[0];
        setState({ loading: false, plan: row ? row.plan : null, title: row ? row.title : '', updatedAt: row ? row.updated_at : null, error: null });
      } catch (e) {
        if (alive) setState({ loading: false, plan: null, title: '', updatedAt: null, error: e.message || 'load failed' });
      }
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) {
    return <div className="text-xs text-[#5A5751] p-4" style={serif}>Loading the family plan…</div>;
  }
  if (state.error) {
    return (
      <Section label="Family plan">
        <p className="text-xs text-[#B85838]" style={serif}>The plan could not be loaded: {state.error}</p>
      </Section>
    );
  }
  if (!state.plan) {
    // Every instance gets this surface (Darrell 2026-08-19: "when other users
    // use their instances they will see it"); RLS means each family only ever
    // sees its own plan. An empty tab INVITES rather than shrugs: it says what
    // a plan is and names the honest path to getting one — assistant-ingested
    // today, in-app upload is the tracked opportunity.
    return (
      <Section label="Family plan">
        <h2 className="text-lg" style={{ ...serif, fontWeight: 600 }}>No plan has been published for this family yet.</h2>
        <p className="text-sm leading-relaxed" style={serif}>
          This is where your family's written financial plan lives — the strategy in your own words first,
          then every worksheet behind it: debts, monthly budget, cash plan, payoff checkpoints, and the bill calendar.
          Only members of your family can see it.
        </p>
        <p className="text-xs text-[#5A5751]" style={serif}>
          To get yours here: share your budget spreadsheet or written plan with the family assistant and ask for it
          to be added to the Plan tab — it will appear for everyone in your family, on every device.
        </p>
      </Section>
    );
  }

  const p = state.plan;
  const n = p.narrative || {};
  const mb = p.monthlyBudget || {};
  const bc = p.billCalendar || {};
  const dash = p.dashboard || {};

  return (
    <div className="space-y-4">
      {/* The wording — her plan, in her words, before any table. */}
      <Section label={`${state.title}${p.preparedBy ? ` · prepared by ${p.preparedBy}` : ''}`}>
        {n.title && <h2 className="text-xl" style={{ ...serif, fontWeight: 600 }}>{n.title}</h2>}
        {n.subtitle && <p className="text-xs text-[#5A5751]" style={serif}>{n.subtitle}</p>}
        {n.whatIsGoingOn && (
          <div>
            <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-3 mb-1">What is going on financially</h3>
            <p className="text-sm leading-relaxed" style={serif}>{n.whatIsGoingOn}</p>
          </div>
        )}
        {Array.isArray(n.monthlyPicture) && n.monthlyPicture.length > 0 && (
          <PlanTable caption="Current monthly picture"
            columns={[['Current item', 'item', 'text'], ['Amount', 'amount', 'money']]}
            rows={n.monthlyPicture} />
        )}
        {Array.isArray(n.goals) && n.goals.length > 0 && (
          <div>
            <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-3 mb-1">What we are trying to accomplish</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm" style={serif}>
              {n.goals.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
        )}
        {n.taxRefund && <p className="text-sm" style={serif}>{n.taxRefund}</p>}
        {n.bottomLine && (
          <div className="border-2 border-[#1A1815] bg-[#FAF8F4] p-3 text-sm" style={serif}>
            <strong>{n.bottomLine}</strong>
          </div>
        )}
        {Array.isArray(n.oneMonthAhead) && n.oneMonthAhead.length > 0 && (
          <div>
            <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-3 mb-1">Becoming one month ahead on the rental mortgages</h3>
            <div className="space-y-2 text-sm leading-relaxed" style={serif}>
              {n.oneMonthAhead.map((para, i) => <p key={i}>{para}</p>)}
            </div>
          </div>
        )}
      </Section>

      {Array.isArray(dash.metrics) && dash.metrics.length > 0 && (
        <Section label="Dashboard">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dash.metrics.map((m, i) => (
              <div key={i} className="border border-[#E8E4DC] p-2">
                <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">{m.metric}</div>
                <div className="text-sm" style={mono}>{money(m.amount)}</div>
              </div>
            ))}
          </div>
          {Array.isArray(dash.reconciled) && dash.reconciled.length > 0 && (
            <PlanTable caption="Reconciled items"
              columns={[['Reconciled item', 'item', 'text'], ['Amount', 'amount', 'money']]}
              rows={dash.reconciled} />
          )}
          {dash.system && <p className="text-xs text-[#5A5751]" style={serif}>{dash.system}</p>}
        </Section>
      )}

      {Array.isArray(p.debtTracker) && p.debtTracker.length > 0 && (
        <Section label="Debt tracker and payoff estimates">
          <p className="text-xs text-[#5A5751]" style={serif}>
            Every debt as the workbook states it — a blank means the workbook does not have that number yet, not that it is zero,
            and the Total row sums only the rows that carry numbers. The payoff column is each debt's timeline.
            The Debts tab's snowball engine is where these become live, editable rows.
          </p>
          <PlanTable caption="Debt tracker" totals
            columns={[['Debt', 'debt', 'text'], ['Balance', 'balance', 'money'], ['Payoff (timeline)', 'payoff', 'text'], ['Planned/mo', 'payment', 'money'], ['APR', 'apr', 'pct'], ['Priority', 'priority', 'text'], ['Notes', 'note', 'text']]}
            rows={p.debtTracker} />
        </Section>
      )}

      {(Array.isArray(mb.income) || Array.isArray(mb.housing) || Array.isArray(mb.debtPayments)) && (
        <Section label="Monthly operating budget">
          {mb.totals && (
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-[#E8E4DC] p-2"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Income (low)</div><div className="text-sm" style={mono}>{money(mb.totals.incomeLow)}</div></div>
              <div className="border border-[#E8E4DC] p-2"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Known outflow</div><div className="text-sm" style={mono}>{money(mb.totals.knownMonthlyOutflow)}</div></div>
              <div className="border border-[#E8E4DC] p-2"><div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Cash left (low)</div><div className="text-sm" style={mono}>{money(mb.totals.cashLeftLow)}</div></div>
            </div>
          )}
          {['income', 'housing', 'debtPayments'].map((k) => (
            Array.isArray(mb[k]) && mb[k].length > 0 ? (
              <div key={k}>
                <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-2 mb-1">
                  {k === 'income' ? 'Income' : k === 'housing' ? 'Housing / operating' : 'Debt payments'}
                </h3>
                <PlanTable caption={k} totals
                  columns={[['Item', 'item', 'text'], ['Amount', 'amount', 'money'], ['Priority', 'priority', 'text'], ['Notes', 'note', 'text']]}
                  rows={mb[k]} />
              </div>
            ) : null
          ))}
          {Array.isArray(mb.reconciledNotDoubleCounted) && mb.reconciledNotDoubleCounted.length > 0 && (
            <div>
              <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-2 mb-1">Reconciled — not double-counted</h3>
              <PlanTable caption="Reconciled items that map to lines above"
                columns={[['Bank schedule name', 'item', 'text'], ['Monthly', 'amount', 'money'], ['Maps to', 'mapsTo', 'text'], ['Treatment', 'treatment', 'text']]}
                rows={mb.reconciledNotDoubleCounted} />
            </div>
          )}
        </Section>
      )}

      {Array.isArray(p.cashPlan) && p.cashPlan.length > 0 && (
        <Section label="Cash reserve, catch-up and school plan">
          <PlanTable caption="Cash plan" totals
            columns={[['Item', 'item', 'text'], ['Amount', 'amount', 'money'], ['Timing', 'timing', 'text'], ['Strategy', 'strategy', 'text'], ['Notes', 'note', 'text']]}
            rows={p.cashPlan} />
        </Section>
      )}

      {Array.isArray(p.payoffSchedule) && p.payoffSchedule.length > 0 && (
        <Section label="Payoff checkpoints — September 2026 to August 2027">
          <PlanTable caption="Payoff schedule"
            columns={[['Month', 'month', 'text'], ['BG payment', 'bgPayment', 'money'], ['BG priority balance', 'bgPriorityBalance', 'money'], ['Chase payment', 'chasePayment', 'money'], ['Chase balance', 'chaseBalance', 'money']]}
            rows={p.payoffSchedule} />
        </Section>
      )}

      {Array.isArray(bc.dated) && bc.dated.length > 0 && (
        <Section label="Recurring monthly bill calendar — reconciled">
          <PlanTable caption="Dated bills"
            columns={[['Day', 'day', 'text'], ['Payee / bill', 'payee', 'text'], ['Amount', 'amount', 'money'], ['Account / note', 'note', 'text']]}
            rows={bc.dated} />
          <div className="grid sm:grid-cols-2 gap-3">
            {Array.isArray(bc.dailyTotals) && bc.dailyTotals.length > 0 && (
              <div>
                <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Totals by day{bc.datedBillsTotal ? ` · dated bills ${money(bc.datedBillsTotal)}` : ''}</h3>
                <PlanTable caption="Daily totals" columns={[['Day', 'day', 'text'], ['Total', 'total', 'money']]} rows={bc.dailyTotals} />
              </div>
            )}
            <div className="space-y-3">
              {Array.isArray(bc.stillToPlace) && bc.stillToPlace.length > 0 && (
                <div>
                  <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Monthly items still to place on exact dates</h3>
                  <PlanTable caption="Still to place" columns={[['Item', 'item', 'text'], ['Amount', 'amount', 'money'], ['Treatment', 'treatment', 'text']]} rows={bc.stillToPlace} />
                </div>
              )}
              {Array.isArray(bc.pastDue) && bc.pastDue.length > 0 && (
                <div>
                  <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Past due / catch-up</h3>
                  <PlanTable caption="Past due" columns={[['Item', 'item', 'text'], ['Amount', 'amount', 'money'], ['Status', 'status', 'text']]} rows={bc.pastDue} />
                </div>
              )}
              {Array.isArray(bc.mortgageTreatment) && bc.mortgageTreatment.length > 0 && (
                <div>
                  <h3 className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Mortgage / housing treatment</h3>
                  <PlanTable caption="Mortgage treatment" columns={[['Item', 'item', 'text'], ['Monthly', 'amount', 'money'], ['Treatment', 'treatment', 'text']]} rows={bc.mortgageTreatment} />
                </div>
              )}
            </div>
          </div>
          {bc.workingMonthlyOutflow && (
            <div className="border-2 border-[#1A1815] bg-[#FAF8F4] p-3 text-sm flex items-baseline justify-between" style={serif}>
              <strong>Current working monthly outflow</strong>
              <span style={mono}>{money(bc.workingMonthlyOutflow)}</span>
            </div>
          )}
        </Section>
      )}

      {state.updatedAt && (
        <p className="text-[0.625rem] text-[#5A5751]" style={serif}>
          Plan last updated {new Date(state.updatedAt).toLocaleString()}{Array.isArray(p.sources) && p.sources.length ? ` · sources: ${p.sources.join('; ')}` : ''}.
        </p>
      )}
    </div>
  );
}

export { FamilyPlan };
export default FamilyPlan;
