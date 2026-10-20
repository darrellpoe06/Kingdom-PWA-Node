// =============================================================================
// ChurchCostToServe — a church's cost to serve, worked out before the offer
// (DR-1128)
// =============================================================================
// Darrell, 2026-10-20: "build in the cost to sustain their support before the
// offer so we are capable and ready for the requirements they give... not ask
// for money afterwards."
//
// The screen read before quoting a church. The price is checked against the
// measured platform share, the support time, compute, storage and a reserve.
// A blank box reads "not entered" and holds back "Ready to offer". Below it, a
// church's workflow request is quoted as one up-front price: the build plus its
// support. The arithmetic lives in lib/church-cost-to-serve.js.
// =============================================================================
import React, { useState } from 'react';
import {
  churchCostToServe, workflowQuote, giftOfMonths, dollars,
  CHURCH_PRICE_CENTS, CHURCH_FLOOR_CENTS, DEFAULT_RESERVE_PCT, MEASURED_PLATFORM_MONTHLY_CENTS,
} from '../lib/church-cost-to-serve.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LABEL = 'block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1';
const FIELD = 'w-full border border-[#E8E4DC] px-2 py-1.5 text-sm bg-white';

// '' stays '' (not entered); a number in dollars becomes cents.
const toCents = (v) => (v === '' ? '' : Math.round(Number(v) * 100));

function Box({ id, label, value, onChange, step = '1', hint }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      <input id={id} type="number" min="0" step={step} inputMode="decimal" className={FIELD}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder="not entered" />
      {hint && <p className="text-[0.625rem] text-[#5A5751] mt-0.5" style={SERIF}>{hint}</p>}
    </div>
  );
}

export default function ChurchCostToServe() {
  const [churches, setChurches] = useState('2');
  const [price, setPrice] = useState(String(CHURCH_PRICE_CENTS / 100));
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('');
  const [compute, setCompute] = useState('');
  const [storage, setStorage] = useState('');
  const [reserve, setReserve] = useState(String(DEFAULT_RESERVE_PCT));
  const [hiring, setHiring] = useState('');
  const [devices, setDevices] = useState('');
  const [devicesMonths, setDevicesMonths] = useState('36');
  const [buildHours, setBuildHours] = useState('');
  const [wfSupport, setWfSupport] = useState('');
  const [months, setMonths] = useState('12');
  const [gift, setGift] = useState('');

  const r = churchCostToServe({
    churches: Number(churches) || 1,
    supportHoursPerMonth: hours,
    hourlyRateCents: toCents(rate),
    computeCentsPerMonth: toCents(compute),
    storageCentsPerMonth: toCents(storage),
    reservePct: reserve === '' ? 0 : Number(reserve),
    priceCents: toCents(price) || 0,
    hiringMonthlyCents: toCents(hiring),
    devicesOneTimeCents: toCents(devices),
    devicesMonths: Number(devicesMonths) || 36,
  });
  const g = giftOfMonths({ months: gift, costToServeCents: r.complete ? r.withReserveCents : null });
  const q = workflowQuote({
    buildHours, hourlyRateCents: toCents(rate), supportHoursPerMonth: wfSupport,
    months, reservePct: reserve === '' ? 0 : Number(reserve),
  });

  return (
    <div className="bg-white border border-[#1A1815] p-5 mb-4" data-testid="church-cost-to-serve">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1">A church · cost to serve, before the offer</div>
      <p className="text-xs text-[#5A5751] mb-3" style={SERIF}>
        Price in what supporting a church really takes before offering it, so we are ready for what they ask and never come back for more. {dollars(CHURCH_FLOOR_CENTS)} is the floor for each church, never the ceiling. The platform share starts from the measured {dollars(MEASURED_PLATFORM_MONTHLY_CENTS)} a month. Every other cost is yours to enter, including hiring and the devices sovereignty needs, and a blank is never counted as zero.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Box id="cts-churches" label="Churches sharing the platform" value={churches} onChange={setChurches} />
        <Box id="cts-price" label="Price a month ($)" value={price} onChange={setPrice} step="5" />
        <Box id="cts-hours" label="Support hours a month" value={hours} onChange={setHours} step="0.5" hint="Questions, fixes, training" />
        <Box id="cts-rate" label="Hourly rate for that time ($)" value={rate} onChange={setRate} step="5" />
        <Box id="cts-compute" label="Compute a month ($)" value={compute} onChange={setCompute} step="1" hint="Lesson building, AI work" />
        <Box id="cts-storage" label="Storage a month ($)" value={storage} onChange={setStorage} step="1" hint="Files, recordings, backups" />
        <Box id="cts-reserve" label="Reserve (%)" value={reserve} onChange={setReserve} step="5" hint="For what we did not foresee" />
        <Box id="cts-hiring" label="Hiring a month, all churches ($)" value={hiring} onChange={setHiring} step="50" hint="Paid support beyond the family" />
        <Box id="cts-devices" label="Devices for sovereignty, once ($)" value={devices} onChange={setDevices} step="50" hint="NAS, disks, GPU, backup" />
        <Box id="cts-devices-months" label="Paid back over (months)" value={devicesMonths} onChange={setDevicesMonths} step="6" />
      </div>

      <table className="w-full text-xs mb-2" style={SERIF}>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.label} className="border-t border-[#F0ECE4]">
              <td className="py-1 pr-2">{l.label}</td>
              <td className={`py-1 text-right tabular-nums ${l.cents === null ? 'text-[#B85838] italic' : ''}`}>{dollars(l.cents)}</td>
            </tr>
          ))}
          <tr className="border-t border-[#1A1815] font-semibold">
            <td className="py-1 pr-2">Cost to serve one church, with the {r.reservePct}% reserve</td>
            <td className="py-1 text-right tabular-nums">{r.complete ? dollars(r.withReserveCents) : 'not yet known'}</td>
          </tr>
          <tr>
            <td className="py-1 pr-2">The least price that covers it</td>
            <td className="py-1 text-right tabular-nums">{dollars(r.minimumPriceCents)}</td>
          </tr>
        </tbody>
      </table>

      <p role="status" className={`text-sm font-semibold ${r.readyToOffer ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} style={SERIF}>
        {r.belowFloor
          ? `Not ready to offer: ${dollars(r.priceCents)} is under the ${dollars(r.floorCents)} floor for a church.`
          : !r.complete
          ? `Not ready to offer: enter ${r.missing.join(', ')}.`
          : r.readyToOffer
            ? `Ready to offer: ${dollars(r.priceCents)} covers the cost to serve with ${dollars(r.marginCents)} a month to spare.`
            : `Not ready to offer: ${dollars(r.priceCents)} is ${dollars(-r.marginCents)} a month short. The least price that covers it is ${dollars(r.minimumPriceCents)}.`}
      </p>

      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1">Months we choose to give</div>
        <p className="text-xs text-[#5A5751] mb-2" style={SERIF}>A gift is a decision we make, never a gap in the price. Each month given costs the full cost to serve, and the agreed price stays the same.</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Box id="gift-months" label="Months given" value={gift} onChange={setGift} step="1" />
        </div>
        <p className="text-sm" style={SERIF} data-testid="gift-cost">
          {gift === ''
            ? <span className="text-[#5A5751]">No gift entered.</span>
            : g.complete
              ? <>A gift of {g.months} {g.months === 1 ? 'month' : 'months'} costs us <strong>{dollars(g.costCents)}</strong>. The price stays {dollars(r.priceCents)} a month.</>
              : <span className="text-[#B85838]">The gift's cost is not known until every cost above is entered.</span>}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
        <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] mb-1">A workflow a church asks for · one price, agreed up front</div>
        <p className="text-xs text-[#5A5751] mb-2" style={SERIF}>The build, plus the support it will need after it ships, priced together before work starts. It uses the hourly rate and reserve above.</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Box id="wf-build" label="Build hours" value={buildHours} onChange={setBuildHours} step="1" />
          <Box id="wf-support" label="Support hours a month after" value={wfSupport} onChange={setWfSupport} step="0.5" />
          <Box id="wf-months" label="Months of support priced in" value={months} onChange={setMonths} step="1" />
        </div>
        <p className="text-sm" style={SERIF} data-testid="workflow-quote">
          {q.complete
            ? <>Quote: <strong>{dollars(q.totalCents)}</strong>, or <strong>{dollars(q.monthlyCents)}</strong> a month for {q.months} months. That is {dollars(q.buildCents)} to build and {dollars(q.supportCents)} of support, with the {q.reservePct}% reserve.</>
            : <span className="text-[#B85838]">No quote yet: enter {q.missing.join(', ')}.</span>}
        </p>
      </div>
    </div>
  );
}
