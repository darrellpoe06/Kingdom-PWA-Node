// =============================================================================
// Forecast — the financial-engineering / forward-projection surface
// =============================================================================
// "Future financial situations should be clear" (Darrell, 2026-06-25). This is
// where the future financial picture is made plain: a dynamic, tracked forecast
// derived entirely from the family's real data (accounts + cleared transactions
// + recurring obligations + debts + rentals + salaries). It complements — does
// NOT replace — the short-horizon 30/60/90 cash forecast in Books.
//
// Three tabs, all over the SAME real data:
//   OUTLOOK    — "where will we be" per business / family / consolidated, with
//                the anxiety-clarity answer (what / when / why / how).
//   SCENARIOS  — what-if "engineering": best/base/worst + add a property / a
//                subscription tier / a capital purchase (the LED wall). Explicit,
//                editable assumptions. Side-by-side ending cash + the spread.
//   TRACK      — recorded projections scored against what really happened once
//                the horizon passes (institutional memory; accuracy over time).
//
// BINDING (CLAUDE.md): a MODELING tool on the owner's own data — PROJECTIONS,
// NOT PROMISES. No investment advice, no buy/sell, no money movement. Honest
// empty states; nothing painted. The math is unit-tested (financial-engineering
// + financial-scenarios test suites); this file only renders it.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SectionBoundary from './SectionBoundary.jsx';
import {
  buildProjection, snapshotFromProjection, actualVsProjected, monthLabelFrom,
} from '../lib/financial-engineering.js';
import {
  SCENARIO_PRESETS, compareScenarios,
  scenarioAddProperty, scenarioAddSubscriptionTier, scenarioCapitalPurchase,
} from '../lib/financial-scenarios.js';
import { forecastSync } from '../lib/forecast-sync.js';

// Shared tokens — identical to the other family surfaces (already contrast-gated).
const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const sectionH = 'text-[10px] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const HORIZONS = [12, 24, 36];

const money = (n) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(Number(n) || 0)).toLocaleString()}`;

function localId() {
  // No Math.random() needed for uniqueness here; a short suffix from the count
  // of existing snapshots + the base date keeps ids stable + collision-free.
  return `snap-${Date.now()}`;
}

function ClarityLine({ q, children }) {
  return (
    <div className="flex gap-2 text-xs leading-relaxed">
      <span className="text-[#B85838] font-semibold shrink-0 w-12">{q}</span>
      <span className="text-[#1A1815]">{children}</span>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const color = tone === 'bad' ? '#9B2C2C' : tone === 'good' ? '#2F6B3A' : '#1A1815';
  return (
    <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
      <div className={labelCls}>{label}</div>
      <div className="text-lg font-semibold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

// A dependency-free bar strip of the ending-cash trajectory. Text values carry
// the data (the bars are decorative), so it reads with or without color/vision.
function CashTrajectory({ timeline }) {
  if (!timeline || !timeline.length) return null;
  const vals = timeline.map((r) => r.endCash);
  const max = Math.max(...vals, 0);
  const min = Math.min(...vals, 0);
  const span = max - min || 1;
  const zeroFrac = (0 - min) / span;
  return (
    <div>
      <div className="flex items-end gap-[2px] h-24" role="img" aria-label="Projected ending cash by month">
        {timeline.map((r) => {
          const frac = (r.endCash - min) / span;
          const isNeg = r.endCash < 0;
          return (
            <div key={r.monthOffset} className="flex-1 flex flex-col justify-end h-full" title={`${r.label}: ${money(r.endCash)}`}>
              <div
                className="w-full"
                style={{ height: `${Math.max(2, frac * 100)}%`, background: isNeg ? '#9B2C2C' : '#B85838' }}
              />
            </div>
          );
        })}
      </div>
      {min < 0 && (
        <div className="relative h-px bg-[#9B2C2C] -mt-12 mb-12" style={{ marginTop: `${-(1 - zeroFrac) * 96}px` }} aria-hidden="true" />
      )}
      <div className="flex justify-between text-[9px] text-[#5A5751] mt-1">
        <span>{timeline[0].label}</span>
        <span>{timeline[timeline.length - 1].label}</span>
      </div>
    </div>
  );
}

function Outlook({ data, currentDate, scopeOptions, scope, setScope, months, setMonths, onRecord, recording }) {
  const p = useMemo(
    () => buildProjection(data, { currentDate, months, scope }),
    [data, currentDate, months, scope],
  );
  const scopeLabel = (scopeOptions.find((s) => s.id === scope) || {}).label || scope;
  const endTone = p.endingCash < p.startingCash ? (p.endingCash < 0 ? 'bad' : 'neutral') : 'good';
  const upcomingLumps = p.timeline.flatMap((r) => r.lumps.map((l) => ({ ...l, label2: r.label }))).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* scope + horizon pickers */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className={sectionH}>View</span>
        {scopeOptions.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`px-3 py-1.5 text-xs border min-h-[36px] ${scope === s.id ? 'bg-[#1A1815] text-[#FAF8F4] border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#D8D0C2]'}`}
          >
            {s.label}
          </button>
        ))}
        <span className="mx-1 text-[#D8D0C2]">|</span>
        {HORIZONS.map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={`px-3 py-1.5 text-xs border min-h-[36px] ${months === m ? 'bg-[#B85838] text-white border-[#B85838]' : 'bg-white text-[#1A1815] border-[#D8D0C2]'}`}
          >
            {m} mo
          </button>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{scopeLabel} · {months}-month outlook</h3>
          <span className="text-[9px] uppercase tracking-wider text-[#5A5751] border border-[#D8D0C2] px-1.5 py-0.5">Projection, not a promise</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Metric label="Cash today" value={money(p.startingCash)} />
          <Metric label="Net / month" value={`${p.netMonthly >= 0 ? '+' : ''}${money(p.netMonthly)}`} tone={p.netMonthly < 0 ? 'bad' : 'good'} />
          <Metric label={`Cash by ${monthLabelFrom(currentDate, months)}`} value={money(p.endingCash)} tone={endTone} />
          <Metric
            label="Runway"
            value={p.runwayMonths == null ? 'No cliff' : `${p.runwayMonths} mo`}
            tone={p.runwayMonths == null ? 'good' : 'bad'}
          />
        </div>

        <CashTrajectory timeline={p.timeline} />

        {/* anxiety-clarity: what / when / why / how */}
        <div className="mt-4 space-y-1.5 border-t border-[#E3DDD2] pt-3">
          <ClarityLine q="What">
            On today’s real numbers, {scopeLabel.toLowerCase()} cash goes from {money(p.startingCash)} to <strong>{money(p.endingCash)}</strong>.
          </ClarityLine>
          <ClarityLine q="When">
            By {monthLabelFrom(currentDate, months)}. {p.runwayMonths == null
              ? 'Cash stays positive the whole way.'
              : <strong> Cash runs out around {p.runwayDate} unless something changes.</strong>}
          </ClarityLine>
          <ClarityLine q="Why">
            {p.netMonthly >= 0 ? 'Income covers outflow' : 'Outflow exceeds income'} by {money(Math.abs(p.netMonthly))}/mo
            {p.inputs.lumpCount > 0 ? `, plus ${p.inputs.lumpCount} non-monthly bill${p.inputs.lumpCount === 1 ? '' : 's'} landing across the horizon.` : '.'}
            {' '}Low point: {money(p.lowest.endCash)} in {p.lowest.label}.
          </ClarityLine>
          <ClarityLine q="How">
            {p.netMonthly < 0
              ? `Close the gap by raising income or cutting outflow by ${money(Math.abs(p.netMonthly))}/mo — model it in Scenarios.`
              : 'Hold the line; test a property, a tier, or a purchase in Scenarios before committing.'}
          </ClarityLine>
        </div>

        {upcomingLumps.length > 0 && (
          <div className="mt-3 border-t border-[#E3DDD2] pt-3">
            <div className={labelCls}>Non-monthly items in this horizon</div>
            <ul className="mt-1 space-y-0.5">
              {upcomingLumps.map((l, i) => (
                <li key={i} className="text-xs text-[#1A1815] flex justify-between">
                  <span>{l.label} <span className="text-[#5A5751]">· {l.label2}</span></span>
                  <span className="tabular-nums" style={{ color: l.amount < 0 ? '#9B2C2C' : '#2F6B3A' }}>{money(l.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => onRecord(p)}
            disabled={recording}
            className="px-4 py-2 text-xs font-semibold bg-[#1A1815] text-[#FAF8F4] border border-[#1A1815] min-h-[40px] disabled:opacity-50"
          >
            {recording ? 'Recording…' : 'Record this projection'}
          </button>
          <span className="text-[10px] text-[#5A5751] leading-snug">Freezes today’s prediction so it can be scored against what really happens — tracked under Track.</span>
        </div>
      </div>
    </div>
  );
}

function Scenarios({ data, currentDate, scope, months }) {
  // The three named engineering moves carry editable assumptions in local state.
  const [property, setProperty] = useState({ rent: 1400, mortgagePI: 700, escrow: 220, downPayment: 0 });
  const [tier, setTier] = useState({ subscribers: 50, pricePerMonth: 29 });
  const [capital, setCapital] = useState({ label: 'Sanctuary LED wall', amount: 12000, monthOffset: 3 });

  const scenarios = useMemo(() => [
    ...SCENARIO_PRESETS,
    scenarioAddProperty({ ...property, name: 'rental door' }),
    scenarioAddSubscriptionTier({ ...tier, name: 'subscription tier' }),
    scenarioCapitalPurchase(capital),
  ], [property, tier, capital]);

  const cmp = useMemo(
    () => compareScenarios(data, scenarios, { currentDate, months, scope }),
    [data, scenarios, currentDate, months, scope],
  );
  const baseEnding = (cmp.results.find((r) => r.scenario.id === 'base') || {}).endingCash || 0;

  const numInput = (val, on) => (
    <input
      type="number"
      value={val}
      onChange={(e) => on(Number(e.target.value))}
      className="w-20 px-2 py-1 text-xs border border-[#D8D0C2] bg-white text-[#1A1815] tabular-nums"
    />
  );

  return (
    <div className="space-y-4">
      <div className={card}>
        <h3 className="text-sm font-semibold text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>What-if comparison · {months} months</h3>
        <p className="text-[11px] text-[#5A5751] mb-3">
          The future ranges from <strong style={{ color: '#9B2C2C' }}>{cmp.worst ? money(cmp.worst.endingCash) : '—'}</strong> (worst) to
          {' '}<strong style={{ color: '#2F6B3A' }}>{cmp.best ? money(cmp.best.endingCash) : '—'}</strong> (best) — a spread of {money(cmp.spread)}. Assumptions are explicit and editable below.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[#5A5751] border-b border-[#E3DDD2]">
                <th className="py-1.5 pr-2 font-medium">Scenario</th>
                <th className="py-1.5 px-2 font-medium">Assumptions</th>
                <th className="py-1.5 px-2 font-medium text-right">Cash by {monthLabelFrom(currentDate, months)}</th>
                <th className="py-1.5 px-2 font-medium text-right">vs Base</th>
                <th className="py-1.5 pl-2 font-medium text-right">Runway</th>
              </tr>
            </thead>
            <tbody>
              {cmp.results.map((r) => {
                const delta = r.endingCash - baseEnding;
                return (
                  <tr key={r.scenario.id} className="border-b border-[#F0EBE1] align-top">
                    <td className="py-2 pr-2 font-semibold text-[#1A1815]">{r.scenario.name}</td>
                    <td className="py-2 px-2 text-[#5A5751] max-w-[16rem]">{r.scenario.summary}</td>
                    <td className="py-2 px-2 text-right tabular-nums font-semibold" style={{ color: r.endingCash < 0 ? '#9B2C2C' : '#1A1815' }}>{money(r.endingCash)}</td>
                    <td className="py-2 px-2 text-right tabular-nums" style={{ color: delta > 0 ? '#2F6B3A' : delta < 0 ? '#9B2C2C' : '#5A5751' }}>
                      {r.scenario.id === 'base' ? '—' : `${delta >= 0 ? '+' : ''}${money(delta)}`}
                    </td>
                    <td className="py-2 pl-2 text-right text-[#5A5751]">{r.runwayMonths == null ? 'no cliff' : `${r.runwayMonths} mo`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* editable assumptions for the three engineering moves */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className={card}>
          <div className={sectionH}>Add a rental door</div>
          <div className="mt-2 space-y-1.5 text-xs text-[#1A1815]">
            <label className="flex justify-between items-center">Rent/mo {numInput(property.rent, (v) => setProperty({ ...property, rent: v }))}</label>
            <label className="flex justify-between items-center">P&amp;I/mo {numInput(property.mortgagePI, (v) => setProperty({ ...property, mortgagePI: v }))}</label>
            <label className="flex justify-between items-center">Escrow/mo {numInput(property.escrow, (v) => setProperty({ ...property, escrow: v }))}</label>
            <label className="flex justify-between items-center">Down pmt {numInput(property.downPayment, (v) => setProperty({ ...property, downPayment: v }))}</label>
          </div>
        </div>
        <div className={card}>
          <div className={sectionH}>Add a subscription tier</div>
          <div className="mt-2 space-y-1.5 text-xs text-[#1A1815]">
            <label className="flex justify-between items-center">Subscribers {numInput(tier.subscribers, (v) => setTier({ ...tier, subscribers: v }))}</label>
            <label className="flex justify-between items-center">$ / month {numInput(tier.pricePerMonth, (v) => setTier({ ...tier, pricePerMonth: v }))}</label>
          </div>
        </div>
        <div className={card}>
          <div className={sectionH}>Capital purchase</div>
          <div className="mt-2 space-y-1.5 text-xs text-[#1A1815]">
            <input
              type="text"
              value={capital.label}
              onChange={(e) => setCapital({ ...capital, label: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-[#D8D0C2] bg-white text-[#1A1815]"
            />
            <label className="flex justify-between items-center">Amount {numInput(capital.amount, (v) => setCapital({ ...capital, amount: v }))}</label>
            <label className="flex justify-between items-center">In month {numInput(capital.monthOffset, (v) => setCapital({ ...capital, monthOffset: v }))}</label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Track({ data, currentDate, snapshots, scopeOptions }) {
  if (!snapshots.length) {
    return (
      <div className={`${card} text-center`}>
        <p className="text-sm text-[#1A1815] font-semibold">No forecasts recorded yet.</p>
        <p className="text-xs text-[#5A5751] mt-1">Record one from the Outlook tab. Once its horizon date passes, it gets scored against the real cash on that date — so the forecast gets more grounded every cycle.</p>
      </div>
    );
  }
  const scopeName = (id) => (scopeOptions.find((s) => s.id === id) || {}).label || id;
  const sorted = [...snapshots].sort((a, b) => (b.baseDate || '').localeCompare(a.baseDate || ''));
  return (
    <div className="space-y-2">
      {sorted.map((s) => {
        const v = actualVsProjected(s, data, currentDate);
        const tone = !v.reached ? '#5A5751'
          : v.accuracyLabel === 'on-target' ? '#2F6B3A'
            : v.accuracyLabel === 'close' ? '#946A00' : '#9B2C2C';
        return (
          <div key={s.id} className={card}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="text-sm font-semibold text-[#1A1815]">{scopeName(s.scope)} · {s.horizonMonths}-mo</div>
                <div className="text-[10px] text-[#5A5751]">Recorded {s.baseDate} → horizon {s.horizonDate}</div>
              </div>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 border" style={{ color: tone, borderColor: tone }}>
                {v.reached ? v.accuracyLabel : 'pending'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div>
                <div className={labelCls}>Projected</div>
                <div className="tabular-nums font-semibold text-[#1A1815]">{money(s.projectedEndCash)}</div>
              </div>
              <div>
                <div className={labelCls}>Actual</div>
                <div className="tabular-nums font-semibold" style={{ color: tone }}>{v.reached ? money(v.actualEndCash) : '—'}</div>
              </div>
              <div>
                <div className={labelCls}>Variance</div>
                <div className="tabular-nums font-semibold" style={{ color: tone }}>
                  {v.reached ? `${v.variance >= 0 ? '+' : ''}${money(v.variance)}${v.variancePct != null ? ` (${v.variancePct}%)` : ''}` : '—'}
                </div>
              </div>
            </div>
            {s.assumptions && s.assumptions.scenarioId && (
              <div className="text-[10px] text-[#5A5751] mt-2">Basis: {s.assumptions.scenarioId}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Forecast({ data, currentDate, isOwner = false }) {
  const [tab, setTab] = useState('outlook');
  const [scope, setScope] = useState('consolidated');
  const [months, setMonths] = useState(12);
  const [snapshots, setSnapshots] = useState([]);
  const [recording, setRecording] = useState(false);
  const cd = useMemo(() => (currentDate instanceof Date ? currentDate : new Date()), [currentDate]);

  const scopeOptions = useMemo(() => ([
    { id: 'consolidated', label: 'Everything' },
    ...(data?.entities || []).map((e) => ({ id: e.id, label: e.name })),
  ]), [data?.entities]);

  // Own the snapshot subscription (self-contained, like the other family surfaces).
  useEffect(() => {
    const unsub = forecastSync.subscribe((items) => setSnapshots(items || []));
    return () => { try { unsub(); } catch (e) { /* noop */ } };
  }, []);

  const onRecord = useCallback(async (projection) => {
    setRecording(true);
    try {
      const snap = snapshotFromProjection(projection, {
        scope,
        currentDate: cd,
        assumptions: { scenarioId: 'base', horizonMonths: months },
        label: `${scope} · ${months}mo`,
      });
      const withId = { ...snap, id: localId() };
      setSnapshots((prev) => [withId, ...prev]); // optimistic
      await forecastSync.upload(withId);
      setTab('track');
    } finally {
      setRecording(false);
    }
  }, [scope, months, cd]);

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-[#1A1815] p-6 mt-6 text-center" style={{ fontFamily: '"Fraunces", serif' }}>
        <div className="text-2xl mb-1" aria-hidden="true">🔒</div>
        <p className="text-sm text-[#1A1815] font-semibold">Forecast is a stewardship space.</p>
        <p className="text-xs text-[#5A5751] mt-1.5 leading-relaxed">The financial-engineering views model the family’s real money. Sign in with a family/governor account to open them.</p>
      </div>
    );
  }

  return (
    <SectionBoundary name="Forecast">
      <div className="max-w-4xl mx-auto mt-4 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Forecast — financial engineering</h2>
          <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed">
            Where the money goes from here — projected forward from your real accounts, transactions, obligations, debts, and rentals.
            It updates as your data changes. <em>Projections, not promises:</em> a model of your own numbers, never investment advice.
          </p>
        </div>

        <div className="flex gap-1">
          {[['outlook', 'Outlook'], ['scenarios', 'Scenarios'], ['track', 'Track']].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 min-h-[40px] ${tab === id ? 'border-[#B85838] text-[#1A1815]' : 'border-transparent text-[#5A5751]'}`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {tab === 'outlook' && (
          <Outlook
            data={data} currentDate={cd}
            scopeOptions={scopeOptions} scope={scope} setScope={setScope}
            months={months} setMonths={setMonths}
            onRecord={onRecord} recording={recording}
          />
        )}
        {tab === 'scenarios' && <Scenarios data={data} currentDate={cd} scope={scope} months={months} />}
        {tab === 'track' && <Track data={data} currentDate={cd} snapshots={snapshots} scopeOptions={scopeOptions} />}
      </div>
    </SectionBoundary>
  );
}
