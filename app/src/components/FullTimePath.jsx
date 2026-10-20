// =============================================================================
// FullTimePath — the road to working full time inside PoeTech, and to the next
// hire (DR-1129)
// =============================================================================
// Darrell, 2026-10-20: "The goal would be to have we able to work full-time
// inside PoeTech.... based on workloads and revenue... and to be able to keep
// hiring." Then: "Not church only.... the PoeTech App allowed me to build the
// other apps... so making apps for businesses and churches etc..."
//
// Sits in Dev/Ops under the church cost to serve. Revenue is entered as lines
// (churches, business plans, family plans, apps built for others), each with a
// count, a price, a running cost and the hours it takes. Every pay, hour and
// cost is entered by the family; a blank reads "not entered" and nothing is
// claimed until it is filled. Prices start from the published ones ($200 a
// church, DR-1128; $249 Business on the front door); everything else is blank.
// The arithmetic lives in lib/full-time-path.js.
// =============================================================================
import React, { useState } from 'react';
import { fullTimePath, HIRE_AT_LOAD_PCT, MAX_ADDED } from '../lib/full-time-path.js';
import { dollars, CHURCH_PRICE_CENTS } from '../lib/church-cost-to-serve.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LABEL = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1';
const FIELD = 'w-full border border-[#E8E4DC] px-2 py-1.5 text-sm bg-white';

const toCents = (v) => (v === '' ? '' : Math.round(Number(v) * 100));

const START_LINES = [
  { name: 'Churches', count: '', price: String(CHURCH_PRICE_CENTS / 100), cost: '', hours: '' },
  { name: 'Business plans', count: '', price: '249', cost: '', hours: '' },
  { name: 'Family plans', count: '', price: '', cost: '', hours: '' },
  { name: 'Apps built for others', count: '', price: '', cost: '', hours: '' },
];

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

export default function FullTimePath() {
  const [lines, setLines] = useState(START_LINES);
  const [grow, setGrow] = useState('0');
  const [employer, setEmployer] = useState('');
  const [reserve, setReserve] = useState('20');
  const [people, setPeople] = useState([
    { role: 'Darrell', pay: '', hours: '' },
    { role: 'Christina', pay: '', hours: '' },
  ]);
  const [hirePay, setHirePay] = useState('');
  const [hireHours, setHireHours] = useState('');

  const setLine = (i, key) => (v) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [key]: v } : l)));
  const setPerson = (i, key) => (v) => setPeople((ps) => ps.map((p, j) => (j === i ? { ...p, [key]: v } : p)));

  const r = fullTimePath({
    lines: lines.map((l) => ({ name: l.name.trim() || undefined, count: l.count, priceCents: toCents(l.price), costCents: toCents(l.cost), hoursEach: l.hours })),
    growLine: Number(grow),
    employerCostPct: employer,
    reservePct: reserve === '' ? 0 : Number(reserve),
    people: people.map((p) => ({ role: p.role.trim() || undefined, monthlyPayCents: toCents(p.pay), hoursPerMonth: p.hours })),
    nextHire: { monthlyPayCents: toCents(hirePay), hoursPerMonth: hireHours },
  });
  const more = (k) => (k === null
    ? `not reachable within ${MAX_ADDED.toLocaleString()} more at these numbers`
    : k === 0 ? 'now' : `after ${k.toLocaleString()} more ${r.growName.toLowerCase()}`);

  return (
    <div className="bg-white border border-[#1A1815] p-5 mb-4" data-testid="full-time-path">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1">The road to full time · and the next hire</div>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF}>
        Everything PoeTech earns, from churches, businesses, families and the apps it builds for others, against the full-time pay of the people doing the work and the hours that work takes. People are paid in the order listed. A hire is needed when the hours pass {HIRE_AT_LOAD_PCT}% of the hours on the payroll, and paid for when the revenue covers that pay too.
      </p>

      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Revenue lines · each a month</div>
      <div className="space-y-2 mb-3">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Box id={`ftp-line-${i}`} label="Line" value={l.name} onChange={setLine(i, 'name')} type="text" />
            <Box id={`ftp-count-${i}`} label="How many" value={l.count} onChange={setLine(i, 'count')} />
            <Box id={`ftp-price-${i}`} label="Price each ($)" value={l.price} onChange={setLine(i, 'price')} step="5" />
            <Box id={`ftp-cost-${i}`} label="Running cost each ($)" value={l.cost} onChange={setLine(i, 'cost')} step="1" />
            <Box id={`ftp-hrs-${i}`} label="Hours each" value={l.hours} onChange={setLine(i, 'hours')} step="0.5" />
          </div>
        ))}
        <p className="text-[0.625rem] text-[#5A5751]" style={SERIF}>An app built for someone counts as its monthly price and the hours it takes each month, build and support together (the workflow quote above gives both).</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div>
          <label className={LABEL} htmlFor="ftp-grow">Grow which line</label>
          <select id="ftp-grow" className={FIELD} value={grow} onChange={(e) => setGrow(e.target.value)}>
            {lines.map((l, i) => <option key={i} value={String(i)}>{l.name.trim() || `Line ${i + 1}`}</option>)}
          </select>
        </div>
        <Box id="ftp-employer" label="Employer costs (%)" value={employer} onChange={setEmployer} step="0.5" hint="Social Security + Medicare alone are 7.65%" />
        <Box id="ftp-reserve" label="Reserve (%)" value={reserve} onChange={setReserve} step="5" hint="Kept back from revenue" />
      </div>

      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">Full time, in order</div>
      <div className="space-y-2 mb-3">
        {people.map((p, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <Box id={`ftp-role-${i}`} label="Who" value={p.role} onChange={setPerson(i, 'role')} type="text" />
            <Box id={`ftp-pay-${i}`} label="Full-time pay a month ($)" value={p.pay} onChange={setPerson(i, 'pay')} step="100" />
            <Box id={`ftp-hours-${i}`} label="Hours a month" value={p.hours} onChange={setPerson(i, 'hours')} step="10" />
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-xs self-end pb-2" style={SERIF}>The next hire</div>
          <Box id="ftp-hire-pay" label="Pay a month ($)" value={hirePay} onChange={setHirePay} step="100" />
          <Box id="ftp-hire-hours" label="Hours a month" value={hireHours} onChange={setHireHours} step="10" />
        </div>
      </div>

      {!r.complete ? (
        <p role="status" className="text-sm font-semibold text-[#B85838]" style={SERIF}>Not yet known: enter {r.missing.join(', ')}.</p>
      ) : (
        <div className="space-y-2 text-sm" style={SERIF}>
          <p role="status" className={`font-semibold ${r.allCovered ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>
            {r.allCovered
              ? `Today everyone listed can be paid full time, with ${dollars(r.forPeopleCents - r.payrollCents)} a month left over.`
              : `Today ${r.fullTimeCovered} of ${people.length} can be paid full time; the payroll is ${dollars(r.shortCents)} a month short.`}
          </p>
          <p data-testid="ftp-month">
            {dollars(r.revenueCents)} comes in, {dollars(r.runCents)} runs the platform and the lines, {dollars(r.reserveCents)} is kept in reserve, and {dollars(r.forPeopleCents)} is left for people. Full-time pay with employer costs is {dollars(r.payrollCents)}.
          </p>
          <ul data-testid="ftp-milestones" className="list-disc pl-5">
            {people.map((p, i) => (
              <li key={i}>{p.role.trim() || `Person ${i + 1}`} full time {more(r.eachFullTimeAt[i])}</li>
            ))}
          </ul>
          <p data-testid="ftp-workload">
            The work takes {r.workloadHours.toLocaleString()} hours a month; the payroll has {r.capacityHours.toLocaleString()} ({Number.isFinite(r.loadPct) ? `${r.loadPct}%` : 'no hours entered'}).
          </p>
          <p data-testid="ftp-hire" className={r.hireGap !== 0 ? 'text-[#B85838]' : ''}>
            The next hire is needed {more(r.hireNeededAt)} and paid for {more(r.hireAffordableAt)}.{' '}
            {r.hireGap === null
              ? 'The work will need the hire before these numbers can ever pay for it: the prices or the costs must change.'
              : r.hireGap > 0
                ? `For ${r.hireGap.toLocaleString()} of those the work outruns the money: raise the price, slow the onboarding, or fund the hire before the work arrives.`
                : r.hireNeededAt !== null && r.hireAffordableAt !== null
                  ? 'The money arrives first, so hire when the work does.'
                  : ''}
          </p>
        </div>
      )}
    </div>
  );
}
