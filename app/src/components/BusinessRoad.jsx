// =============================================================================
// BusinessRoad — a business's own road to full time, under its card in
// Books -> Entities (DR-1138)
// =============================================================================
// Darrell, 2026-10-20: "Road to full time for who? Is this a feature for
// everyone?" Then: "Their road to full-time?"
//
// Every business the books carry gets this beneath its card. It reads the
// business's own transactions and projects, and asks only what the app does
// not record: each owner's full-time pay and hours, the employer costs, the
// reserve, the next hire, and how much of the recorded costs is already the
// owner's pay. A blank reads "not entered" and nothing is claimed until it is
// filled. The arithmetic lives in lib/business-road.js.
// =============================================================================
import React, { useState } from 'react';
import { entityMonthsFromRecords, entityWorkHours, businessRoad, DEFAULT_MONTHS } from '../lib/business-road.js';
import { HIRE_AT_LOAD_PCT } from '../lib/full-time-path.js';
import { dollars, DEFAULT_RESERVE_PCT } from '../lib/church-cost-to-serve.js';
import { baselineMonthLabel } from '../lib/monthly-baseline.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LABEL = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1';
const FIELD = 'w-full border border-[#E8E4DC] px-2 py-1.5 text-sm bg-white';

const toCents = (v) => (v === '' ? '' : Math.round(Number(v) * 100));

function Box({ id, label, value, onChange, step = '1', hint, type = 'number' }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      <input id={id} type={type} min="0" step={step} inputMode={type === 'number' ? 'decimal' : undefined} className={FIELD}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder="not entered" />
      {hint && <p className="text-[0.625rem] text-[#5A5751] mt-0.5" style={SERIF}>{hint}</p>}
    </div>
  );
}

export default function BusinessRoad({ entity, data, now }) {
  const id = entity.id;
  const recorded = entityMonthsFromRecords({ transactions: data.transactions, accounts: data.accounts, entityId: id, now: now ?? Date.now() });
  const work = entityWorkHours({ projects: data.projects, entityId: id });

  const [people, setPeople] = useState([{ role: 'Owner', pay: '', hours: '' }]);
  const [inCosts, setInCosts] = useState('');
  const [employer, setEmployer] = useState('');
  const [reserve, setReserve] = useState(String(DEFAULT_RESERVE_PCT));
  const [hireKind, setHireKind] = useState('1099');
  const [hirePay, setHirePay] = useState('');
  const [hireHours, setHireHours] = useState('');

  const setPerson = (i, key) => (v) => setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, [key]: v } : p)));
  const pid = (s) => `br-${id}-${s}`;

  const r = businessRoad({
    incomeCents: recorded.avgInCents,
    costCents: recorded.avgOutCents,
    monthsMeasured: recorded.monthsMeasured,
    workHoursPerMonth: work.hoursPerMonth,
    ownerPayInCostsCents: toCents(inCosts),
    employerCostPct: employer,
    reservePct: reserve === '' ? 0 : Number(reserve),
    people: people.map((p) => ({ role: p.role.trim() || undefined, monthlyPayCents: toCents(p.pay), hoursPerMonth: p.hours })),
    nextHire: { kind: hireKind, monthlyPayCents: toCents(hirePay), hoursPerMonth: hireHours },
  });
  const who = (p, i) => p.role.trim() || `Owner ${i + 1}`;

  return (
    <details className="mt-4 pt-3 border-t border-[#E8E4DC]" data-testid={`business-road-${id}`}>
      <summary className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] cursor-pointer min-h-[36px] flex items-center">Road to full time · {entity.name.split('(')[0].trim()}</summary>
      <p className="text-xs text-[#5A5751] my-2" style={SERIF}>
        When this business pays its owners full time, and when it can hire, from its own records. Income and costs are the average of its last {DEFAULT_MONTHS} complete months with transactions; transfers between your own accounts are left out. The work is the hours a week on its active projects.
      </p>

      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">From the records</div>
      {recorded.monthsMeasured === 0 ? (
        <p className="text-sm text-[#B85838] mb-3" style={SERIF} data-testid={`br-${id}-norecords`}>
          No complete month of transactions for this business yet{recorded.transactionCount ? ` (${recorded.transactionCount} this month or older than a year)` : ''}. Link its accounts in Books → Accounts, or set the business on a transaction, and the road fills in.
        </p>
      ) : (
        <table className="w-full text-xs mb-2" style={SERIF} data-testid={`br-${id}-months`}>
          <caption className="sr-only">Money in and out by month, from this business's transactions</caption>
          <thead>
            <tr className="text-[#5A5751]"><th scope="col" className="text-left font-normal py-1">Month</th><th scope="col" className="text-right font-normal">In</th><th scope="col" className="text-right font-normal">Out</th></tr>
          </thead>
          <tbody>
            {recorded.months.map((m) => (
              <tr key={m.month} className="border-t border-[#F0ECE4]">
                <td className="py-1">{baselineMonthLabel(m.month)}</td>
                <td className="text-right tabular-nums">{dollars(m.inCents)}</td>
                <td className="text-right tabular-nums">{dollars(m.outCents)}</td>
              </tr>
            ))}
            <tr className="border-t border-[#1A1815] font-semibold">
              <td className="py-1">Average of {recorded.monthsMeasured} {recorded.monthsMeasured === 1 ? 'month' : 'months'}</td>
              <td className="text-right tabular-nums">{dollars(recorded.avgInCents)}</td>
              <td className="text-right tabular-nums">{dollars(recorded.avgOutCents)}</td>
            </tr>
          </tbody>
        </table>
      )}
      <p className="text-xs mb-3" style={SERIF} data-testid={`br-${id}-work`}>
        {work.activeCount
          ? <>The work: {work.hoursPerMonth.toLocaleString()} hours a month across {work.activeCount} active {work.activeCount === 1 ? 'project' : 'projects'}{work.unhoured ? `, ${work.unhoured} with no hours set` : ''}.</>
          : <span className="text-[#5A5751]">No active projects for this business, so the work is not measured yet. Add its projects with hours a week to see when it needs a hire.</span>}
      </p>

      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">What only you know</div>
      <div className="space-y-2 mb-2">
        {people.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <Box id={pid(`role-${i}`)} label="Who" value={p.role} onChange={setPerson(i, 'role')} type="text" />
            <Box id={pid(`pay-${i}`)} label="Full-time pay a month ($)" value={p.pay} onChange={setPerson(i, 'pay')} step="100" />
            <Box id={pid(`hours-${i}`)} label="Hours a month" value={p.hours} onChange={setPerson(i, 'hours')} step="10" />
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" className="text-xs border border-[#E8E4DC] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" onClick={() => setPeople((ps) => [...ps, { role: '', pay: '', hours: '' }])}>+ Another owner</button>
          {people.length > 1 && (
            <button type="button" className="text-xs border border-[#E8E4DC] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" onClick={() => setPeople((ps) => ps.slice(0, -1))}>Remove the last</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
        <Box id={pid('incosts')} label="Owner pay already in the costs ($)" value={inCosts} onChange={setInCosts} step="100" hint="What you already pay yourselves from these accounts; 0 if none" />
        <Box id={pid('employer')} label="Employer costs (%)" value={employer} onChange={setEmployer} step="0.5" hint="On owner pay and a W-2 hire; owners on a draw may enter 0" />
        <Box id={pid('reserve')} label="Reserve (%)" value={reserve} onChange={setReserve} step="5" hint="Kept back from revenue" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <label className={LABEL} htmlFor={pid('hire-kind')}>The next hire</label>
          <select id={pid('hire-kind')} className={FIELD} value={hireKind} onChange={(e) => setHireKind(e.target.value)}>
            <option value="1099">1099 contractor</option>
            <option value="w2">W-2 employee</option>
          </select>
        </div>
        <Box id={pid('hire-pay')} label="Pay a month ($)" value={hirePay} onChange={setHirePay} step="100" />
        <Box id={pid('hire-hours')} label="Hours a month" value={hireHours} onChange={setHireHours} step="10" />
      </div>

      {!r.complete ? (
        <p role="status" className="text-sm font-semibold text-[#B85838]" style={SERIF}>Not yet known: enter {r.missing.join(', ')}.</p>
      ) : (
        <div className="space-y-2 text-sm" style={SERIF}>
          <p role="status" className={`font-semibold ${r.allCovered ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
            {r.allCovered
              ? `Today this business can pay everyone listed full time, with ${dollars(r.leftOverCents)} a month left over.`
              : `Today it can pay ${r.fullTimeCovered} of ${people.length} full time; the pay is ${dollars(r.shortCents)} a month short (${r.firstFullTimePct}% of the way to the first).`}
          </p>
          <p data-testid={pid('month')}>
            {dollars(r.incomeCents)} comes in, {dollars(r.runCents)} runs the business, {dollars(r.reserveCents)} is kept in reserve, and {dollars(r.forPeopleCents)} is left for the owners. Their full-time pay with employer costs is {dollars(r.payrollCents)}.
          </p>
          <ul className="list-disc pl-5" data-testid={pid('milestones')}>
            {people.map((p, i) => (
              <li key={i}>{who(p, i)} full time at {dollars(r.eachFullTimeAtCents[i])} a month coming in</li>
            ))}
          </ul>
          <p data-testid={pid('hire')} className={r.hireGapCents > 0 ? 'text-[#B85838]' : ''}>
            {r.hireNeededAtCents === null
              ? `The next hire is paid for at ${dollars(r.hireAffordableAtCents)} a month coming in. When it is needed is not known until the business's projects carry hours.`
              : `The next hire is needed at ${dollars(r.hireNeededAtCents)} a month coming in (the work past ${HIRE_AT_LOAD_PCT}% of the owners' hours) and paid for at ${dollars(r.hireAffordableAtCents)}.`}
            {r.hireGapCents > 0 && ` For ${dollars(r.hireGapCents)} of revenue the work outruns the money: raise the prices, slow what you take on, or fund the hire before the work arrives.`}
          </p>
          <p className="text-[0.625rem] text-[#5A5751]">Taken as given: the costs stay where they are as revenue grows, and the work grows in step with it.</p>
        </div>
      )}
    </details>
  );
}
