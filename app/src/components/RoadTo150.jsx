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
import { parseFoodLine, resolveFromLibrary, unknownCount } from '../lib/food-parse.js';
import { fillUnknowns } from '../lib/food-lookup.js';
import { JUICE_RECIPES, juiceServingOptions, juiceServing } from '../lib/juice-recipes.js';
import { PLANNED_WALK, PLANNED_STRENGTH, PROGRAM_PANTRY, pantryWithKnown, plannedVsActual, strengthChecklist } from '../lib/road-to-150-plan.js';
import {
  MEALS, foodForMeal, mealTotals, dayFoodTotals, weekOverWeek,
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
  foodEntries = [],
  foodLibrary = [],
  addFoodEntry = null,
  deleteFoodEntry = null,
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
  // One draft per meal so opening Dinner does not clear a half-typed Lunch item.
  const [draft, setDraft] = useState({});
  const foodDay = useMemo(() => dayFoodTotals(foodEntries, todayKey), [foodEntries, todayKey]);
  // The quick-add sentence and its parsed rows, held until confirmed.
  const [quick, setQuick] = useState({ meal: 'morning', line: '', rows: null });
  const [looking, setLooking] = useState(false);
  const [customJuiceOz, setCustomJuiceOz] = useState('');
  // '' = the default serving; 'custom' opens the ounces box. Mirrors his spec:
  // "6 oz / 8 / 12 / 16 / 18 - DEFAULT / 24 / 36 / Custom Ounces".
  const [juicePick, setJuicePick] = useState({});
  const [doneEx, setDoneEx] = useState({});   // strength checkboxes for today

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
  // ── FOOD ───────────────────────────────────────────────────────────────────
  // ACTUALS ONLY. The planned meal is not here because its source PDF is not in
  // the repo — but what was actually eaten never depended on that plan, so this
  // logs regardless. When the plan lands it renders BESIDE these rows.
  const addFood = (mealId) => {
    const d = draft[mealId] || {};
    const name = (d.name || '').trim();
    if (!addFoodEntry || !name) return;
    addFoodEntry({
      day: todayKey,
      meal: mealId,
      name,
      serving: (d.serving || '').trim(),
      // Blank stays NULL, never 0 — "not recorded" must not read as a real zero.
      calories: d.calories === '' || d.calories == null ? null : Number(d.calories),
      proteinG: d.protein === '' || d.protein == null ? null : Number(d.protein),
      eatenAt: new Date().toISOString(),
    });
    setDraft((prev) => ({ ...prev, [mealId]: {} }));
  };
  const setField = (mealId, field, value) =>
    setDraft((prev) => ({ ...prev, [mealId]: { ...(prev[mealId] || {}), [field]: value } }));

  const num = (v, unit) => (v.recorded === 0 ? '—' : `${round1(v.total)}${unit}${v.complete ? '' : '*'}`);

  // Parse the sentence, fill in what we ALREADY KNOW from the person's own
  // confirmed foods, and show the rest as blanks to complete. Nothing is logged
  // until they press Add — and an unknown stays blank rather than guessing.
  const parseQuick = () => {
    const items = parseFoodLine(quick.line);
    if (!items.length) return;
    setQuick((q) => ({ ...q, rows: resolveFromLibrary(items, foodLibrary) }));
  };
  // Ask the database only for what is still unknown. His own remembered values
  // are never overwritten, and a failed lookup leaves the row blank with a
  // reason rather than filling in something plausible.
  const lookUpUnknowns = async () => {
    if (!quick.rows || looking) return;
    setLooking(true);
    try {
      const filled = await fillUnknowns(quick.rows);
      setQuick((q) => ({ ...q, rows: filled }));
    } finally {
      setLooking(false);
    }
  };
  const setQuickRow = (idx, field, value) =>
    setQuick((q) => ({ ...q, rows: q.rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)) }));
  const addAllQuick = () => {
    if (!addFoodEntry || !quick.rows) return;
    for (const r of quick.rows) {
      if (!r.name) continue;
      addFoodEntry({
        day: todayKey, meal: quick.meal, name: r.name, serving: r.serving || '',
        calories: r.calories === '' || r.calories == null ? null : Number(r.calories),
        proteinG: r.proteinG === '' || r.proteinG == null ? null : Number(r.proteinG),
        source: r.source || 'entered',
        eatenAt: new Date().toISOString(),
      });
    }
    setQuick({ meal: quick.meal, line: '', rows: null });
  };

  // ONE TAP for the usual. The serving's nutrition is computed at the moment of
  // logging and STORED ON THE ENTRY, so editing the recipe later cannot rewrite
  // what was already eaten -- his explicit requirement, held structurally.
  const logJuice = (recipe, oz) => {
    const serving = juiceServing(oz, recipe);
    if (!serving || !addFoodEntry) return;
    addFoodEntry({
      day: todayKey, meal: quick.meal, name: serving.name, serving: serving.serving,
      calories: serving.calories, proteinG: serving.proteinG,
      source: 'recipe', eatenAt: new Date().toISOString(),
    });
  };

  // ── THE WEEK ───────────────────────────────────────────────────────────────
  // One day answers "what did I eat". Only the week answers "am I doing
  // something different" — the question behaviour actually turns on.
  const wow = useMemo(
    () => (p.week ? weekOverWeek(program, { foodEntries, waterEntries, weightEntries }, p.week) : null),
    [program, foodEntries, waterEntries, weightEntries, p.week],
  );

  // A change is only meaningful when BOTH weeks have data; null renders as "—".
  const arrow = (n, unit, betterDown = true) => {
    if (n == null) return <span className="text-[#5A5751]">—</span>;
    if (n === 0) return <span className="text-[#5A5751]">no change</span>;
    const good = betterDown ? n < 0 : n > 0;
    return (
      <span className={good ? 'text-[#15803D]' : 'text-[#B45309]'}>
        {n > 0 ? '+' : ''}{round1(n)}{unit}
      </span>
    );
  };

  const weekTab = () => {
    if (!started || !wow) {
      return (
        <section className="bg-white border-2 border-[#1A1815] p-4">
          <h3 className="text-lg" style={display}>The week</h3>
          <p className="text-sm text-[#5A5751] mt-1" style={serif}>
            Start the program and log a few days — this fills in from what you actually record.
          </p>
        </section>
      );
    }
    const c = wow.current;
    const ch = wow.change;
    const row = (label, value, sub) => (
      <div className="flex items-baseline justify-between gap-3 py-2 border-b border-[#E8E4DC] last:border-0">
        <span className="text-sm text-[#5A5751]" style={serif}>{label}</span>
        <span className="text-sm text-[#1A1815] text-right" style={serif}>
          {value}{sub ? <span className="block text-xs text-[#5A5751]">{sub}</span> : null}
        </span>
      </div>
    );
    const avg = (a, unit) => (a.average == null ? '—' : `${round1(a.average)}${unit}`);
    const logged = (a) => (a.daysLogged ? `${a.daysLogged} of 7 days logged` : 'nothing logged yet');

    return (
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-week-h">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Week {c.week}</div>
          <h3 id="r150-week-h" className="text-xl" style={display}>How this week is going</h3>
          {c.range && (
            <p className="text-xs text-[#5A5751] mt-1" style={serif}>{c.range.from} → {c.range.to}</p>
          )}
          <p className="text-xs text-[#5A5751] mt-2" style={serif}>
            Averages count only the days you logged — never a week divided by seven, which would
            make missing days look like restraint.
          </p>
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-week-food-h">
          <h3 id="r150-week-food-h" className="text-lg mb-1" style={display}>Food and water</h3>
          {row('Average daily calories', avg(c.nutrition.calories, ' cal'), logged(c.nutrition.calories))}
          {row('Average daily protein', avg(c.nutrition.protein, 'g'), logged(c.nutrition.protein))}
          {row('Average daily water', c.water.average == null ? '—' : `${round1(c.water.average)} oz`,
               c.water.goalOz ? `${c.water.daysGoalMet} of 7 days hit ${c.water.goalOz} oz` : null)}
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-week-weight-h">
          <h3 id="r150-week-weight-h" className="text-lg mb-1" style={display}>Weight</h3>
          {row("This week's target", c.weight.targetWeightLb == null ? '—' : `${c.weight.targetWeightLb} lb`)}
          {row('Actual weigh-in', c.weight.actualWeightLb == null ? '— not weighed yet' : `${c.weight.actualWeightLb} lb`,
               c.weight.fromTargetLb == null ? null
                 : `${Math.abs(c.weight.fromTargetLb)} lb from this week's target`)}
          {row('Target running loss', c.weight.targetRunningLossLb == null ? '—' : `${c.weight.targetRunningLossLb} lb`)}
          {row('Actual running loss', c.weight.actualRunningLossLb == null ? '—' : `${c.weight.actualRunningLossLb} lb`)}
          {row('Change this week', c.weight.actualWeeklyChangeLb == null ? '—' : `${round1(c.weight.actualWeeklyChangeLb)} lb`)}
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-week-vs-h">
          <h3 id="r150-week-vs-h" className="text-lg" style={display}>Against last week</h3>
          <p className="text-xs text-[#5A5751] mb-2" style={serif}>
            {wow.previous
              ? 'A dash means one of the two weeks has no data to compare — not that nothing changed.'
              : 'Week 1 has nothing before it to compare against yet.'}
          </p>
          {ch ? (
            <>
              {row('Calories a day', arrow(ch.caloriesPerDay, ' cal'))}
              {row('Protein a day', arrow(ch.proteinPerDay, 'g', false))}
              {row('Water a day', arrow(ch.waterPerDay, ' oz', false))}
              {row('Weight', arrow(ch.weightLb, ' lb'))}
            </>
          ) : null}
        </section>
      </div>
    );
  };

  const foodTab = () => (
    <div className="space-y-4">
      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-food-h">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 id="r150-food-h" className="text-lg" style={display}>What I ate today</h3>
          <div className="text-sm text-[#1A1815]" style={serif}>
            <strong>{num(foodDay.calories, ' cal')}</strong>
            <span className="text-[#5A5751]"> · </span>
            <strong>{num(foodDay.protein, 'g protein')}</strong>
            <span className="text-[#5A5751] text-xs"> · {foodDay.items} item{foodDay.items === 1 ? '' : 's'}</span>
          </div>
        </div>
        <p className="text-xs text-[#5A5751] mt-1" style={serif}>
          These are your ACTUAL entries — nothing here is a target. Calories and protein are
          optional: leave them blank and the item still logs, and the total says how many
          entries carried a number rather than counting a blank as zero.
        </p>
        {!addFoodEntry && (
          <p className="text-xs text-[#B85838] mt-2" style={serif}>Sign in to log food.</p>
        )}
      </section>

      {JUICE_RECIPES.map((recipe) => {
        const opts = juiceServingOptions(recipe);
        const dflt = opts.find((o) => o.isDefault) || opts[0];
        return (
          <section key={recipe.id} className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby={`r150-fav-${recipe.id}`}>
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Favorites</div>
            <h3 id={`r150-fav-${recipe.id}`} className="text-lg" style={display}>{recipe.name}</h3>
            <p className="text-xs text-[#5A5751] mt-1" style={serif}>
              {recipe.estimateNote} Logging to <strong>{(MEALS.find((m) => m.id === quick.meal) || {}).label}</strong>.
            </p>

            {dflt && (
              <button type="button" onClick={() => logJuice(recipe, dflt.oz)} disabled={!addFoodEntry}
                      className="mt-3 w-full px-4 py-3 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
                Add {dflt.oz} oz · {dflt.calories} cal · ~{dflt.proteinG}g
              </button>
            )}

            {/* A real dropdown, as asked: the serving list plus Custom Ounces.
                The one-tap default above stays, so the usual 18 oz is still a
                single tap and anything else is two. */}
            <div className="mt-3">
              <label htmlFor={`r150-juice-size-${recipe.id}`} className="block text-xs uppercase tracking-wider text-[#5A5751] mb-1">
                Or pick a size
              </label>
              <div className="flex gap-2">
                <select id={`r150-juice-size-${recipe.id}`}
                        value={(juicePick[recipe.id] ?? '')}
                        onChange={(e) => setJuicePick((prev) => ({ ...prev, [recipe.id]: e.target.value }))}
                        className="flex-1 border-2 border-[#1A1815] px-3 py-2 text-base bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">
                  {opts.map((o) => (
                    <option key={o.oz} value={String(o.oz)}>
                      {o.oz} oz · {o.calories} cal · ~{o.proteinG}g{o.isDefault ? ' — default' : ''}
                    </option>
                  ))}
                  <option value="custom">Custom ounces…</option>
                </select>
                {(juicePick[recipe.id] ?? '') !== 'custom' && (
                  <button type="button" disabled={!addFoodEntry}
                          onClick={() => logJuice(recipe, Number(juicePick[recipe.id] || recipe.defaultServingOz))}
                          className="px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
                    Add
                  </button>
                )}
              </div>
            </div>

            {(juicePick[recipe.id] ?? '') === 'custom' && (
              <div className="mt-2">
                <div className="flex gap-2">
                  <label htmlFor={`r150-juice-custom-${recipe.id}`} className="sr-only">Custom ounces</label>
                  <input id={`r150-juice-custom-${recipe.id}`} type="number" min="1" step="1" inputMode="numeric"
                         value={customJuiceOz} onChange={(e) => setCustomJuiceOz(e.target.value)}
                         placeholder="How many ounces?"
                         className="flex-1 border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
                  <button type="button" disabled={!addFoodEntry || !juiceServing(customJuiceOz, recipe)}
                          onClick={() => { logJuice(recipe, Number(customJuiceOz)); setCustomJuiceOz(''); }}
                          className="px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
                    Add
                  </button>
                </div>
                {juiceServing(customJuiceOz, recipe) && (
                  <p className="text-xs text-[#5A5751] mt-1" style={serif}>
                    {customJuiceOz} oz ≈ {juiceServing(customJuiceOz, recipe).calories} cal ·
                    ~{juiceServing(customJuiceOz, recipe).proteinG}g protein · same 18.3 cal/oz as every preset
                  </p>
                )}
              </div>
            )}

            <details className="mt-3">
              <summary className="text-xs text-[#5A5751] cursor-pointer focus:outline focus:outline-2 focus:outline-[#B85838]" style={serif}>
                What's in it · {recipe.batchOz} oz batch
              </summary>
              <ul className="mt-2 text-xs text-[#5A5751] list-disc pl-5 space-y-0.5" style={serif}>
                {recipe.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
              </ul>
            </details>
          </section>
        );
      })}

      <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-quick-h">
        <h3 id="r150-quick-h" className="text-lg" style={display}>Say what you ate</h3>
        <p className="text-xs text-[#5A5751] mt-1 mb-3" style={serif}>
          Write it the way you would say it — “a 6 inch turkey sandwich with white bread, mayo
          tomatoes, pickles onions olives hot peppers avocado spread”. Each food becomes its own
          line. Anything you have logged before fills in its own calories and protein; anything
          new stays blank for you to fill once, and is remembered after that. Looked-up
          numbers come from Open Food Facts and are <strong>per 100 g</strong> — check them
          against your actual portion before adding; nothing is scaled to a guessed size.
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {MEALS.map((m) => (
            <button key={m.id} type="button" onClick={() => setQuick((q) => ({ ...q, meal: m.id }))}
                    aria-pressed={quick.meal === m.id}
                    className={`px-3 py-2 border-2 border-[#1A1815] text-sm transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${quick.meal === m.id ? 'bg-[#1A1815] text-white' : 'hover:bg-[#E8E4DC]'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <label htmlFor="r150-quick-line" className="sr-only">What you ate, in your own words</label>
        <textarea id="r150-quick-line" rows={2} value={quick.line}
                  onChange={(e) => setQuick((q) => ({ ...q, line: e.target.value, rows: null }))}
                  placeholder="a 6 inch turkey sandwich with white bread, mayo tomatoes, pickles"
                  className="w-full border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
        <button type="button" onClick={parseQuick} disabled={!quick.line.trim()}
                className="mt-2 w-full px-4 py-2 border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838]">
          Break it into foods
        </button>

        {quick.rows && (
          <div className="mt-4">
            <div className="text-xs text-[#5A5751] mb-2" style={serif}>
              {quick.rows.length} food{quick.rows.length === 1 ? '' : 's'} found
              {unknownCount(quick.rows) > 0
                ? ` · ${unknownCount(quick.rows)} still need a number`
                : ' · all filled in'}
            </div>
            {unknownCount(quick.rows) > 0 && (
              <button type="button" onClick={lookUpUnknowns} disabled={looking}
                      className="w-full mb-2 px-4 py-2 border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838]">
                {looking ? 'Looking up…' : `Look up the ${unknownCount(quick.rows)} I don't know`}
              </button>
            )}
            <ul className="divide-y divide-[#E8E4DC]">
              {quick.rows.map((r, idx) => (
                <li key={`${r.name}-${idx}`} className="py-2">
                  <div className="text-sm text-[#1A1815]" style={serif}>
                    {r.name}
                    {r.serving ? <span className="text-[#5A5751]"> · {r.serving}</span> : null}
                    {r.source && (
                      <span className="ml-2 text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                        {r.source === 'remembered' ? 'remembered' : `${r.source}${r.per ? ` · per ${r.per}` : ''}`}
                      </span>
                    )}
                    {r.lookupFailed && (
                      <span className="ml-2 text-[0.625rem] uppercase tracking-wider text-[#B85838]">
                        not found — type it
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <label htmlFor={`r150-q-cal-${idx}`} className="sr-only">Calories for {r.name}</label>
                    <input id={`r150-q-cal-${idx}`} type="number" min="0" step="1" inputMode="numeric"
                           value={r.calories ?? ''} placeholder="Calories"
                           onChange={(e) => setQuickRow(idx, 'calories', e.target.value)}
                           className="border-2 border-[#1A1815] px-2 py-1 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
                    <label htmlFor={`r150-q-pro-${idx}`} className="sr-only">Protein grams for {r.name}</label>
                    <input id={`r150-q-pro-${idx}`} type="number" min="0" step="0.1" inputMode="decimal"
                           value={r.proteinG ?? ''} placeholder="Protein g"
                           onChange={(e) => setQuickRow(idx, 'proteinG', e.target.value)}
                           className="border-2 border-[#1A1815] px-2 py-1 text-sm focus:outline focus:outline-2 focus:outline-[#B85838]" />
                  </div>
                </li>
              ))}
            </ul>
            <button type="button" onClick={addAllQuick} disabled={!addFoodEntry}
                    className="mt-3 w-full px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
              Add all {quick.rows.length} to {(MEALS.find((m) => m.id === quick.meal) || {}).label}
            </button>
          </div>
        )}
      </section>

      {MEALS.map((m) => {
        const rowsFor = foodForMeal(foodEntries, todayKey, m.id);
        const t = mealTotals(foodEntries, todayKey, m.id);
        const d = draft[m.id] || {};
        return (
          <section key={m.id} className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby={`r150-meal-${m.id}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 id={`r150-meal-${m.id}`} className="text-lg" style={display}>{m.label}</h3>
              <span className="text-xs text-[#5A5751]" style={serif}>
                {rowsFor.length === 0 ? 'nothing logged' : `${num(t.calories, ' cal')} · ${num(t.protein, 'g')}`}
              </span>
            </div>

            {rowsFor.length > 0 && (
              <ul className="divide-y divide-[#E8E4DC] mt-2">
                {rowsFor.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-2 text-sm" style={serif}>
                    <span className="text-[#1A1815]">
                      {e.name}
                      {e.serving ? <span className="text-[#5A5751]"> · {e.serving}</span> : null}
                      <span className="block text-xs text-[#5A5751]">
                        {e.calories == null ? 'calories not recorded' : `${round1(e.calories)} cal`}
                        {' · '}
                        {e.proteinG == null ? 'protein not recorded' : `${round1(e.proteinG)}g protein`}
                      </span>
                    </span>
                    {deleteFoodEntry && (
                      <button type="button"
                              onClick={confirmThen(`Remove ${e.name} from ${m.label.toLowerCase()}?`, () => deleteFoodEntry(e.id))}
                              className="text-[#B85838] underline underline-offset-2 text-xs shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]"
                              aria-label={`Remove ${e.name}`}>
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 gap-2 mt-3">
              <label htmlFor={`r150-${m.id}-name`} className="sr-only">Food eaten at {m.label}</label>
              <input id={`r150-${m.id}-name`} type="text" value={d.name || ''} placeholder="Food"
                     onChange={(e) => setField(m.id, 'name', e.target.value)}
                     className="col-span-2 border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
              <label htmlFor={`r150-${m.id}-serving`} className="sr-only">Serving size</label>
              <input id={`r150-${m.id}-serving`} type="text" value={d.serving || ''} placeholder="Serving (6 oz)"
                     onChange={(e) => setField(m.id, 'serving', e.target.value)}
                     className="col-span-2 border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
              <label htmlFor={`r150-${m.id}-cal`} className="sr-only">Calories (optional)</label>
              <input id={`r150-${m.id}-cal`} type="number" min="0" step="1" inputMode="numeric"
                     value={d.calories || ''} placeholder="Calories"
                     onChange={(e) => setField(m.id, 'calories', e.target.value)}
                     className="border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
              <label htmlFor={`r150-${m.id}-pro`} className="sr-only">Protein in grams (optional)</label>
              <input id={`r150-${m.id}-pro`} type="number" min="0" step="0.1" inputMode="decimal"
                     value={d.protein || ''} placeholder="Protein g"
                     onChange={(e) => setField(m.id, 'protein', e.target.value)}
                     className="border-2 border-[#1A1815] px-3 py-2 text-base focus:outline focus:outline-2 focus:outline-[#B85838]" />
            </div>
            <button type="button" disabled={!addFoodEntry || !(d.name || '').trim()}
                    onClick={() => addFood(m.id)}
                    className="mt-2 w-full px-4 py-2 bg-[#1A1815] text-white border-2 border-[#1A1815] disabled:opacity-40 text-sm uppercase tracking-wider focus:outline focus:outline-2 focus:outline-[#B85838]">
              Add to {m.label}
            </button>
          </section>
        );
      })}

      <p className="text-xs text-[#5A5751]" style={serif}>
        * a total marked with an asterisk is missing at least one item's number — it is the sum
        of what you recorded, not a complete day.
      </p>
    </div>
  );

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
  // ── THE PLAN, from his own document ────────────────────────────────────────
  // Every number below is his: the strength round exercise-for-exercise, the
  // 28-minute walk, the nineteen foods in his order, and the planned daily
  // totals. What he never wrote — per-food nutrition — is still not invented;
  // the pantry names WHAT the program eats and each food's numbers arrive when
  // she confirms them once.
  const plan = () => {
    const vs = plannedVsActual({
      calories: foodDay.calories.recorded ? foodDay.calories.total : null,
      proteinG: foodDay.protein.recorded ? foodDay.protein.total : null,
      waterOz: water.actualOz,
    });
    const pantry = pantryWithKnown(foodLibrary);
    const checklist = strengthChecklist();
    const doneCount = checklist.filter((c) => doneEx[c.id]).length;
    const row = (label, v, unit) => (
      <div className="flex items-baseline justify-between py-1.5 border-b border-[#E8E4DC] text-sm" style={serif}>
        <span className="text-[#5A5751]">{label}</span>
        <span className="text-[#1A1815]">
          <strong>{v.planned}{unit}</strong> planned
          <span className="text-[#5A5751]"> · </span>
          {v.recorded ? <>{v.actual}{unit} actual</> : <span className="text-[#5A5751]">— not recorded</span>}
          {v.recorded && <span className="text-[#5A5751] text-xs"> ({v.gap > 0 ? '+' : ''}{v.gap})</span>}
        </span>
      </div>
    );

    return (
      <div className="space-y-4">
        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-planned-h">
          <h3 id="r150-planned-h" className="text-lg" style={display}>Today: planned vs actual</h3>
          <p className="text-xs text-[#5A5751] mt-1 mb-2" style={serif}>
            Planned figures come from the program and never change when you log. A gap is
            information, not a verdict.
          </p>
          {row('Calories', vs.calories, '')}
          {row('Protein', vs.protein, 'g')}
          {row('Water', vs.water, ' oz')}
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-walk-h">
          <h3 id="r150-walk-h" className="text-lg" style={display}>Walk</h3>
          <p className="text-sm text-[#1A1815] mt-1" style={serif}>
            <strong>{PLANNED_WALK.minutes} minutes</strong> at {PLANNED_WALK.mph} mph
          </p>
          <p className="text-xs text-[#5A5751]" style={serif}>
            Estimated {PLANNED_WALK.estimatedCalories} calories — an estimate, as the plan says.
          </p>
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-strength-h">
          <div className="flex items-center justify-between gap-2">
            <h3 id="r150-strength-h" className="text-lg" style={display}>Strength · {PLANNED_STRENGTH.rounds} rounds</h3>
            <span className="text-xs text-[#5A5751]" style={serif}>{doneCount} of {checklist.length}</span>
          </div>
          {[...Array(PLANNED_STRENGTH.rounds)].map((_, i) => (
            <div key={i} className="mt-3">
              <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751]">Round {i + 1}</div>
              <ul className="mt-1">
                {checklist.filter((c) => c.round === i + 1).map((c) => (
                  <li key={c.id} className="py-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={serif}>
                      <input type="checkbox" checked={!!doneEx[c.id]}
                             onChange={() => setDoneEx((d) => ({ ...d, [c.id]: !d[c.id] }))}
                             className="w-5 h-5 border-2 border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" />
                      <span className={doneEx[c.id] ? 'text-[#5A5751] line-through' : 'text-[#1A1815]'}>{c.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-xs text-[#5A5751] mt-3" style={serif}>
            Ticks are for today's round only — they are not saved yet. Completed workouts get their
            own history next.
          </p>
        </section>

        <section className="bg-white border-2 border-[#1A1815] p-4" aria-labelledby="r150-pantry-h">
          <h3 id="r150-pantry-h" className="text-lg" style={display}>The program's foods</h3>
          <p className="text-xs text-[#5A5751] mt-1 mb-3" style={serif}>
            The {PROGRAM_PANTRY.length} foods from the plan, in its order. Tap one to log it to{' '}
            <strong>{(MEALS.find((m) => m.id === quick.meal) || {}).label}</strong>. A food you have
            confirmed before carries its numbers; a new one logs by name and asks for them once.
          </p>
          <div className="flex flex-wrap gap-2">
            {pantry.map((f) => (
              <button key={f.name} type="button" disabled={!addFoodEntry}
                      onClick={() => addFoodEntry({
                        day: todayKey, meal: quick.meal, name: f.name, serving: f.serving || '',
                        calories: f.calories, proteinG: f.proteinG,
                        source: f.known ? 'remembered' : 'entered', eatenAt: new Date().toISOString(),
                      })}
                      className="px-3 py-2 border-2 border-[#1A1815] text-sm hover:bg-[#1A1815] hover:text-white disabled:opacity-40 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838]"
                      aria-label={`Log ${f.name}`}>
                {f.name}
                {f.known && <span className="ml-1 text-[0.625rem] text-[#5A5751]">{f.calories}</span>}
              </button>
            ))}
          </div>
        </section>

        <p className="text-xs text-[#5A5751]" style={serif}>
          Still not in the plan: a per-food calorie table and a day-by-day 26-week meal
          assignment — those were never written down, so they are not invented here.
        </p>
      </div>
    );
  };

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', render: dashboard },
    { id: 'weight', label: 'Weight', icon: 'chart', render: weight },
    { id: 'water', label: 'Water', icon: 'heart', render: waterTab },
    { id: 'food', label: 'Food', icon: 'chefHat', render: foodTab },
    { id: 'week', label: 'Week', icon: 'calendar', render: weekTab },
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
