// =============================================================================
// RoadTo150 — the health program surface (dashboard · weight · water)
// =============================================================================
// Darrell 2026-08-30: turn the paper "Road to 150" plan into an interactive
// digital program, mobile-first, "not a giant spreadsheet."
//
// PHASES PRESENT: 1 (program + data model), 2 (dashboard), 4 (water), 5 (weight
// + target-vs-actual graph). The Today/meal, walking and strength screens are
// phases 3/6/7 and wait on the PDF that is their source of truth — the Plan tab
// says so plainly rather than rendering an empty day that reads like a rest day.
//
// EVERY NUMBER IS DERIVED, NONE PAINTED (DR-0076). The component computes
// nothing itself: it renders what lib/health-program.js returns from the frozen
// program template plus the user's own entries. A reading the user has not
// recorded renders as "--", never 0 and never the planned value standing in for
// a real one.
//
// PLANNED vs ACTUAL is visible in the LAYOUT, not just the data: every pairing
// puts the planned figure and the actual figure side by side with distinct
// labels, so a glance never mistakes a target for an accomplishment.
//
// LANGUAGE: differences from target are worded ONLY by deltaPhrase() — neutral,
// never "behind". Nothing here promises 2 lb a week; the roadmap is labelled
// "target" throughout.
import React, { useState, useMemo } from 'react';
import { KpiDot } from './KpiDot.jsx';
import SectionTabs from './SectionTabs.jsx';
import { confirmThen } from '../lib/confirm-action.js';
import {
  toDayKey, programProgress, deltaPhrase, waterProgress, roadmap, round1, weekForDay,
} from '../lib/health-program.js';
import { ROAD_TO_150, startProgram, pdfPending } from '../lib/road-to-150-program.js';

const serif = { fontFamily: '"Fraunces", serif' };
const display = { fontFamily: '"Fraunces", serif', fontWeight: 600, letterSpacing: '-0.02em' };

/** A value the user has not recorded reads as an em-dash, never 0. */
const show = (v, unit = '') => (v == null ? '—' : `${v}${unit}`);

// ── small presentational pieces ──────────────────────────────────────────────

function Stat({ label, value, unit = '', sub = null, tone = 'ink' }) {
  const color = tone === 'accent' ? 'text-[#B85838]' : 'text-[#1A1815]';
  return (
    <div className="bg-white border-2 border-[#1A1815] p-3 sm:p-4">
      <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">{label}</div>
      <div className={`text-2xl sm:text-3xl ${color} mt-1`} style={display}>{show(value, unit)}</div>
      {sub && <div className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={serif}>{sub}</div>}
    </div>
  );
}

/**
 * The planned/actual pair. One component so the distinction is rendered the
 * same way everywhere and cannot drift into a single ambiguous number.
 */
function PlannedActual({ label, planned, actual, unit = '' }) {
  return (
    <div className="bg-white border-2 border-[#1A1815] p-3 sm:p-4">
      <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">{label}</div>
      <div className="flex items-baseline gap-4 mt-1.5">
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]">Planned</div>
          <div className="text-lg sm:text-xl text-[#5A5751]" style={display}>{show(planned, unit)}</div>
        </div>
        <div className="w-px self-stretch bg-[#E8E4DC]" aria-hidden="true" />
        <div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#B85838]">Actual</div>
          <div className="text-lg sm:text-xl text-[#1A1815]" style={display}>{show(actual, unit)}</div>
        </div>
      </div>
    </div>
  );
}

/** Progress bar from start weight to goal. Renders empty (not full) with no data. */
function ProgressBar({ pct, startLb, goalLb }) {
  const width = pct == null ? 0 : pct;
  return (
    <div>
      <div className="flex justify-between text-[0.625rem] uppercase tracking-wider text-[#5A5751] mb-1">
        <span>{startLb} lb</span>
        <span>{pct == null ? 'No weigh-in yet' : `${pct}% of goal`}</span>
        <span>{goalLb} lb</span>
      </div>
      <div
        className="h-3 bg-[#E8E4DC] border-2 border-[#1A1815] overflow-hidden"
        role="progressbar"
        aria-valuenow={pct == null ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress from ${startLb} to ${goalLb} pounds`}
      >
        <div className="h-full bg-[#B85838] transition-[width] duration-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ── the target-vs-actual graph (inline SVG — the house style) ────────────────

function WeightGraph({ rows, onPickWeek, selectedWeek }) {
  const W = 640; const H = 260;
  const padL = 38; const padR = 12; const padT = 12; const padB = 26;

  const weights = rows.flatMap((r) => [r.targetWeightLb, r.actualWeightLb]).filter((v) => v != null);
  if (!weights.length) return null;
  const lo = Math.floor(Math.min(...weights) - 3);
  const hi = Math.ceil(Math.max(...weights) + 3);
  const x = (week) => padL + ((week - 1) / Math.max(1, rows.length - 1)) * (W - padL - padR);
  const y = (lb) => padT + (1 - (lb - lo) / Math.max(1, hi - lo)) * (H - padT - padB);

  const line = (key) => rows
    .filter((r) => r[key] != null)
    .map((r, i) => `${i === 0 ? 'M' : 'L'}${x(r.week).toFixed(1)},${y(r[key]).toFixed(1)}`)
    .join(' ');

  // The actual line is drawn as SEGMENTS between consecutive recorded weeks, so
  // a missed weigh-in leaves a visible GAP rather than a straight line implying
  // a reading that was never taken.
  const recorded = rows.filter((r) => r.actualWeightLb != null);
  const actualSegments = recorded.slice(1).map((r, i) => {
    const prev = recorded[i];
    return prev.week === r.week - 1
      ? `M${x(prev.week).toFixed(1)},${y(prev.actualWeightLb).toFixed(1)} L${x(r.week).toFixed(1)},${y(r.actualWeightLb).toFixed(1)}`
      : null;
  }).filter(Boolean);

  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px]" role="img"
           aria-label="Target weight line and actual weight line across the program weeks">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#E8E4DC" strokeWidth="1" />
            <text x={4} y={y(t) + 4} fontSize="10" fill="#5A5751">{t}</text>
          </g>
        ))}
        {/* Planned roadmap — dashed, muted: it is the plan, not an achievement. */}
        <path d={line('targetWeightLb')} fill="none" stroke="#5A5751" strokeWidth="2"
              strokeDasharray="5 4" />
        {/* Actual — solid rust, only where a real weigh-in exists. */}
        {actualSegments.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#B85838" strokeWidth="2.5" />
        ))}
        {rows.filter((r) => r.actualWeightLb != null).map((r) => (
          <circle key={r.week} cx={x(r.week)} cy={y(r.actualWeightLb)} r={selectedWeek === r.week ? 5 : 3.5}
                  fill="#B85838" />
        ))}
        {/* Tap targets — one per week, invisible, full height. */}
        {rows.map((r) => (
          <rect
            key={r.week}
            x={x(r.week) - (W - padL - padR) / (rows.length * 2)}
            y={padT}
            width={(W - padL - padR) / rows.length}
            height={H - padT - padB}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => onPickWeek(r.week)}
          >
            <title>{`Week ${r.week}`}</title>
          </rect>
        ))}
        {[1, 7, 14, 20, 26].filter((w) => w <= rows.length).map((w) => (
          <text key={w} x={x(w)} y={H - 8} fontSize="10" fill="#5A5751" textAnchor="middle">{w}</text>
        ))}
      </svg>
      <div className="flex gap-4 text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-1 px-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-[#5A5751]" aria-hidden="true" /> Target
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-[#B85838]" aria-hidden="true" /> Actual
        </span>
      </div>
    </div>
  );
}

// ── the surface ──────────────────────────────────────────────────────────────

export default function RoadTo150({
  program: enrolled = null,
  weightEntries = [],
  waterEntries = [],
  addWeightEntry = null,
  addWaterEntry = null,
  deleteWaterEntry = null,
  today = null,
}) {
  const todayKey = today || toDayKey(new Date());

  // The enrollment carries the real start date; the frozen template carries the
  // plan. An un-started program still renders its roadmap — the plan is known
  // even before day one.
  const program = useMemo(() => {
    if (enrolled && enrolled.startDate) {
      return { ...ROAD_TO_150, ...enrolled, weeklyTargets: enrolled.weeklyTargets?.length ? enrolled.weeklyTargets : ROAD_TO_150.weeklyTargets };
    }
    return startProgram(enrolled?.startDate || null, ROAD_TO_150);
  }, [enrolled]);

  const started = !!program.startDate;
  const p = useMemo(() => programProgress(program, weightEntries, todayKey), [program, weightEntries, todayKey]);
  const water = useMemo(() => waterProgress(program, waterEntries, todayKey), [program, waterEntries, todayKey]);
  const rows = useMemo(() => roadmap(program, weightEntries), [program, weightEntries]);

  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weighIn, setWeighIn] = useState('');
  const [customOz, setCustomOz] = useState('');

  const selected = selectedWeek ? rows.find((r) => r.week === selectedWeek) : null;

  const submitWeighIn = (e) => {
    e.preventDefault();
    const lb = Number(weighIn);
    if (!Number.isFinite(lb) || lb <= 0 || !addWeightEntry) return;
    addWeightEntry({ day: todayKey, weightLb: round1(lb) });
    setWeighIn('');
  };

  const addWater = (oz) => {
    if (!addWaterEntry || !Number.isFinite(oz) || oz <= 0) return;
    addWaterEntry({ day: todayKey, oz, at: new Date().toISOString() });
  };

  // ── dashboard ──────────────────────────────────────────────────────────────
  const dashboard = () => (
    <div className="space-y-4">
      {!started && (
        <div className="bg-[#FAF8F4] border-2 border-[#1A1815] p-4">
          <div className="text-sm text-[#1A1815]" style={serif}>
            The roadmap below is the plan. <strong>Set a start date</strong> to begin tracking days and
            weeks against it — nothing is recorded until you do.
          </div>
        </div>
      )}

      <ProgressBar pct={p.pctComplete} startLb={p.startWeightLb} goalLb={p.goalWeightLb} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Stat label="Current" value={p.currentWeightLb} unit=" lb" tone="accent"
              sub={p.latestWeighInDay ? `weighed ${p.latestWeighInDay}` : 'no weigh-in yet'} />
        <Stat label="Starting" value={p.startWeightLb} unit=" lb" />
        <Stat label="Goal" value={p.goalWeightLb} unit=" lb" />
        <Stat label="Week" value={started && p.inProgram ? p.week : null}
              sub={started ? null : 'not started'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <Stat label="Total lost" value={p.actualRunningLossLb} unit=" lb" tone="accent" />
        <Stat label="Remaining" value={p.remainingLb} unit=" lb" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <PlannedActual label="This week's weight" planned={p.targetWeightLb} actual={p.currentWeightLb} unit=" lb" />
        <PlannedActual label="Running loss" planned={p.targetRunningLossLb} actual={p.actualRunningLossLb} unit=" lb" />
      </div>

      {p.deltaFromTargetLb != null && (
        <div className="bg-white border-2 border-[#1A1815] p-3 text-sm text-[#1A1815]" style={serif}>
          {deltaPhrase(p.deltaFromTargetLb)}
          <span className="text-[#5A5751]"> — the weekly figures are planning targets, not predictions.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <PlannedActual label="Water today" planned={water.goalOz} actual={water.actualOz} unit=" oz" />
        <div className="bg-white border-2 border-[#1A1815] p-3 sm:p-4">
          <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Today's plan</div>
          <div className="text-sm text-[#5A5751] mt-2" style={serif}>
            {pdfPending(program)
              ? 'Meals, walking and strength are not imported yet.'
              : 'See the Plan tab.'}
          </div>
        </div>
      </div>
    </div>
  );

  // ── weight ─────────────────────────────────────────────────────────────────
  const weight = () => (
    <div className="space-y-4">
      <form onSubmit={submitWeighIn} className="bg-white border-2 border-[#1A1815] p-4">
        <label htmlFor="r150-weigh" className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751] font-semibold block">
          Record today's weigh-in ({todayKey})
        </label>
        <div className="flex gap-2 mt-2">
          <input
            id="r150-weigh" type="number" step="0.1" min="1" inputMode="decimal"
            value={weighIn} onChange={(e) => setWeighIn(e.target.value)}
            placeholder="lb"
            className="flex-1 border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]"
          />
          <button type="submit" disabled={!addWeightEntry || !weighIn}
                  className="px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
            Save
          </button>
        </div>
      </form>

      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-graph-h">
        <h3 id="r150-graph-h" className="text-lg mb-2" style={display}>Target and actual</h3>
        <WeightGraph rows={rows} onPickWeek={setSelectedWeek} selectedWeek={selectedWeek} />
        {selected && (
          <div className="mt-3 border-t-2 border-[#E8E4DC] pt-3">
            <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B85838] font-semibold">
              Week {selected.week} · {selected.from} – {selected.to}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm" style={serif}>
              <dt className="text-[#5A5751]">Target weight</dt>
              <dd className="text-[#1A1815] text-right">{show(selected.targetWeightLb, ' lb')}</dd>
              <dt className="text-[#5A5751]">Actual weight</dt>
              <dd className="text-[#1A1815] text-right">{show(selected.actualWeightLb, ' lb')}</dd>
              <dt className="text-[#5A5751]">Weekly change</dt>
              <dd className="text-[#1A1815] text-right">{show(selected.weeklyChangeLb, ' lb')}</dd>
              <dt className="text-[#5A5751]">Total change</dt>
              <dd className="text-[#1A1815] text-right">{show(selected.actualRunningLossLb, ' lb')}</dd>
            </dl>
            {selected.deltaFromTargetLb != null && (
              <p className="text-xs text-[#5A5751] mt-2" style={serif}>{deltaPhrase(selected.deltaFromTargetLb)}</p>
            )}
          </div>
        )}
      </section>

      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-roadmap-h">
        <h3 id="r150-roadmap-h" className="text-lg mb-1" style={display}>The 26-week roadmap</h3>
        <p className="text-xs text-[#5A5751] mb-3" style={serif}>
          Target weights are the plan as enrolled. Recording a weigh-in never changes them.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={serif}>
            <caption className="sr-only">Weekly target weights beside recorded actual weights</caption>
            <thead>
              <tr className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">
                <th scope="col" className="text-left py-1">Week</th>
                <th scope="col" className="text-right py-1">Target</th>
                <th scope="col" className="text-right py-1">Actual</th>
                <th scope="col" className="text-right py-1">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.week} className="border-t border-[#E8E4DC]">
                  <th scope="row" className="text-left py-1.5 font-normal text-[#5A5751]">{r.week}</th>
                  <td className="text-right py-1.5 text-[#5A5751]">{r.targetWeightLb} lb</td>
                  <td className="text-right py-1.5 text-[#1A1815]">{show(r.actualWeightLb, ' lb')}</td>
                  <td className="text-right py-1.5 text-[#5A5751]">{show(r.weeklyChangeLb, ' lb')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );

  // ── water ──────────────────────────────────────────────────────────────────
  const todaysWater = (waterEntries || []).filter((e) => e.day === todayKey);
  const waterTab = () => (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-water-h">
        <div className="flex items-center justify-between gap-2">
          <h3 id="r150-water-h" className="text-lg" style={display}>Water</h3>
          <KpiDot status={water.met ? 'good' : 'attention'}
                  label={`${round1(water.actualOz)} / ${water.goalOz} oz`}
                  className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] shrink-0" />
        </div>
        <div className="mt-3">
          <div className="h-3 bg-[#E8E4DC] border-2 border-[#1A1815] overflow-hidden"
               role="progressbar" aria-valuenow={water.pct ?? 0} aria-valuemin={0} aria-valuemax={100}
               aria-label={`Water: ${water.actualOz} of ${water.goalOz} ounces`}>
            <div className="h-full bg-[#2F5D50] transition-[width] duration-500" style={{ width: `${water.pct ?? 0}%` }} />
          </div>
          <div className="text-xs text-[#5A5751] mt-1" style={serif}>
            {water.met ? 'Goal met for today.' : `${round1(water.remainingOz)} oz to go today.`}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {[8, 12, 16, 20, 24].map((oz) => (
            <button key={oz} type="button" onClick={() => addWater(oz)} disabled={!addWaterEntry}
                    className="px-3 py-2 border-2 border-[#1A1815] text-sm hover:bg-[#1A1815] hover:text-white disabled:opacity-40 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838]">
              +{oz} oz
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <label htmlFor="r150-water-custom" className="sr-only">Custom amount in ounces</label>
          <input id="r150-water-custom" type="number" min="1" step="1" inputMode="numeric"
                 value={customOz} onChange={(e) => setCustomOz(e.target.value)} placeholder="Custom oz"
                 className="flex-1 border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
          <button type="button" disabled={!addWaterEntry || !customOz}
                  onClick={() => { addWater(Number(customOz)); setCustomOz(''); }}
                  className="px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
            Add
          </button>
        </div>
      </section>

      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-water-log-h">
        <h3 id="r150-water-log-h" className="text-lg mb-2" style={display}>Today's entries</h3>
        {todaysWater.length === 0 ? (
          <p className="text-sm text-[#5A5751]" style={serif}>Nothing logged yet today.</p>
        ) : (
          <ul className="divide-y divide-[#E8E4DC]">
            {todaysWater.map((e) => (
              <li key={e.id || e.at} className="flex items-center justify-between py-2 text-sm" style={serif}>
                <span className="text-[#1A1815]">{round1(e.oz)} oz</span>
                <span className="text-[#5A5751] text-xs">
                  {String(e.at || '').slice(11, 16)}
                  {deleteWaterEntry && (
                    <button type="button"
                            onClick={confirmThen(`Remove the ${e.oz} oz entry?`, () => deleteWaterEntry(e.id))}
                            className="ml-3 text-[#B85838] underline underline-offset-2 focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label={`Remove ${e.oz} ounce entry`}>
                      remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[0.6875rem] text-[#5A5751] mt-3" style={serif}>
          Yesterday's entries are kept — the daily total simply counts today.
        </p>
      </section>
    </div>
  );

  // ── plan (phases 3/6/7 — honest about what is not imported) ────────────────
  const plan = () => (
    <div className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <h3 className="text-lg mb-2" style={display}>Meals, walking and strength</h3>
      {pdfPending(program) ? (
        <>
          <p className="text-sm text-[#1A1815]" style={serif}>
            Not imported yet. The daily meal plan, walking schedule and strength schedule come from
            <strong> “Road to 150 - Complete Tracking Plan”</strong>, and that PDF is not in the repository.
          </p>
          <p className="text-sm text-[#5A5751] mt-2" style={serif}>
            Rather than show invented foods, calories, paces or exercises, this screen shows nothing —
            a made-up plan would be worse than an empty one. Add the PDF and this fills in.
          </p>
        </>
      ) : (
        <p className="text-sm text-[#5A5751]" style={serif}>Imported.</p>
      )}
    </div>
  );

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', render: dashboard },
    { id: 'weight', label: 'Weight', icon: 'chart', render: weight },
    { id: 'water', label: 'Water', icon: 'heart', render: waterTab },
    { id: 'plan', label: 'Plan', icon: 'book', render: plan },
  ];

  return (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">
          {program.name}
        </div>
        <h2 className="text-2xl sm:text-3xl mt-1" style={display}>
          {program.startWeightLb} → {program.goalWeightLb} lb
        </h2>
        <p className="text-xs text-[#5A5751] mt-1" style={serif}>
          {program.weeks} weeks · {program.waterGoalOz} oz of water a day · about {program.plannedWeeklyLossLb} lb
          a week as a <strong>planning target</strong>, not a prediction.
        </p>
      </section>

      <SectionTabs sections={sections} ariaLabel="Road to 150 sections" idBase="r150" defaultId="dashboard" />

      <p className="text-[0.625rem] text-[#5A5751] italic" style={serif}>
        Planned figures come from the program; actual figures are yours and are never overwritten by it.
        This is a tracking tool, not medical advice — talk to your physician before changing how you eat or move.
      </p>
    </div>
  );
}

export { weekForDay };
