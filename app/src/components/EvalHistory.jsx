// =============================================================================
// EvalHistory — History & Markers, the evaluation layer over time (DR-0102)
// =============================================================================
// The Quality & Throughput board (DR-0091) reads the system NOW; this card is
// its time dimension. Two lanes on one shared timeline, split by what we can
// actually control (GOVERNANCE-EXECUTION-ADVISORY — govern what is ours):
//   - PEOPLE (what we observe, to serve): per-day views + active people from
//     the sovereign usage_flow_series aggregate (0078) — counts only, the 0073
//     trust model: each person owns and can delete their own trail; the
//     steward sees aggregates, never a person's rows, and never engagement-
//     farming — behavior is reviewed to guide what we fix and build.
//   - SYSTEM (what we control): per-day ops_commands outcomes (DR-0088) —
//     completed vs failed runs from real rows with real timestamps.
// Under both, the HISTORICAL MARKERS: every Decision Record and LESSONS-
// LEARNED incident dated inside the window, pinned to the same axis — so a
// moved number is read beside the change that moved it, and a number that
// moved with NO marker is the question to chase.
//
// Honesty (DR-0076): an unavailable series says so (never a painted flat
// line); zero days render as real zeros; dateless records are skipped, never
// guessed onto a day. Read-only — watching can never break a loop (DR-0083).
import React, { useCallback, useEffect, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import { fetchUsageSeries } from '../lib/usage-events.js';
import { fetchCommands } from '../lib/ops-commands.js';
import { drIndex, resolveWhy, normalizeLessons } from '../lib/quality-throughput.js';
import {
  windowDayKeys, normalizeUsageSeries, opsDaily, halfWindowDelta,
  buildMarkers, markersByDay, barHeight, seriesMax, fmtDay,
} from '../lib/eval-history.js';

const LESSONS = normalizeLessons(typeof __LESSONS_PRINCIPLES__ !== 'undefined' ? __LESSONS_PRINCIPLES__ : null);
const DR_LEDGER = (typeof __DR_LEDGER__ !== 'undefined') ? __DR_LEDGER__ : { ok: false, count: 0, items: [] };
const DR_BY_ID = drIndex(DR_LEDGER);

const WINDOWS = [30, 60, 90];
const SLOT = 6;   // viewBox units per day: 4-unit bar + 2-unit gap (mark spec)
const BAR = 4;

// One single-series bar lane on the shared day axis. Fills ride currentColor
// inside a themeable text class so the per-[data-theme] remap carries them.
function BarLane({ days, accessor, height, colorClass, tip }) {
  const max = seriesMax(days, accessor);
  return (
    <svg
      viewBox={`0 0 ${days.length * SLOT} ${height}`}
      preserveAspectRatio="none"
      className={`w-full block ${colorClass}`}
      style={{ height: `${height}px` }}
      role="img"
      aria-label={tip('summary')}
    >
      {days.map((d, i) => {
        const h = barHeight(accessor(d), max, height - 2);
        return (
          <g key={d.day}>
            {h > 0 && (
              <rect x={i * SLOT} y={height - h} width={BAR} height={h} fill="currentColor" />
            )}
            {/* full-column hit target so the tooltip is reachable on quiet days */}
            <rect x={i * SLOT} y={0} width={SLOT} height={height} fill="transparent">
              <title>{tip(d)}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

// The ops lane: completed (ink) with failures stacked above in the reserved
// status red — two series, so the legend below the lane names both.
function OpsLane({ days, height }) {
  const max = seriesMax(days, (d) => d.done + d.error + d.other);
  return (
    <svg
      viewBox={`0 0 ${days.length * SLOT} ${height}`}
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height: `${height}px` }}
      role="img"
      aria-label="System runs per day — completed and failed"
    >
      {days.map((d, i) => {
        const doneH = barHeight(d.done + d.other, max, height - 2);
        const errH = barHeight(d.error, max, height - 2);
        return (
          <g key={d.day}>
            {doneH > 0 && (
              <g className="text-[#1A1815]">
                <rect x={i * SLOT} y={height - doneH} width={BAR} height={doneH} fill="currentColor" />
              </g>
            )}
            {errH > 0 && (
              <g className="text-[#DC2626]">
                <rect x={i * SLOT} y={Math.max(0, height - doneH - errH - (doneH > 0 ? 1 : 0))} width={BAR} height={errH} fill="currentColor" />
              </g>
            )}
            <rect x={i * SLOT} y={0} width={SLOT} height={height} fill="transparent">
              <title>{`${fmtDay(d.day)} — ${d.done} completed · ${d.error} failed${d.other ? ` · ${d.other} other` : ''}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

// The marker rail: same axis, one tick per day that carries record(s).
// DR = solid tick (accent), incident = taller tick (status red); shape AND the
// labeled list below carry identity — never color alone.
function MarkerRail({ dayKeys, byDay }) {
  const H = 14;
  return (
    <svg
      viewBox={`0 0 ${dayKeys.length * SLOT} ${H}`}
      preserveAspectRatio="none"
      className="w-full block"
      style={{ height: `${H}px` }}
      role="img"
      aria-label="Historical markers — decisions and incidents on the same timeline"
    >
      {dayKeys.map((k, i) => {
        const ms = byDay[k];
        if (!ms) return null;
        const hasIncident = ms.some((m) => m.kind === 'incident');
        const hasDr = ms.some((m) => m.kind === 'dr');
        const label = `${fmtDay(k)} — ${ms.map((m) => `${m.kind === 'dr' ? m.id : 'incident'}: ${m.title}`.trim()).join(' · ')}`;
        return (
          <g key={k}>
            {hasDr && (
              <g className="text-[#B85838]">
                <rect x={i * SLOT} y={4} width={BAR} height={H - 4} fill="currentColor" />
              </g>
            )}
            {hasIncident && (
              <g className="text-[#DC2626]">
                <rect x={i * SLOT + 1} y={0} width={2} height={H} fill="currentColor" />
              </g>
            )}
            <rect x={i * SLOT} y={0} width={SLOT} height={H} fill="transparent">
              <title>{label}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}

function AxisEnds({ dayKeys }) {
  if (!dayKeys.length) return null;
  return (
    <div className="flex justify-between text-[0.5625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
      <span>{fmtDay(dayKeys[0])}</span>
      <span>{fmtDay(dayKeys[dayKeys.length - 1])}</span>
    </div>
  );
}

function DeltaLine({ delta, unit }) {
  if (!delta.ok) return null;
  const arrow = delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→';
  return (
    <p className="text-[0.6875rem] text-[#1A1815] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
      {arrow} newer half {delta.curr.toLocaleString()} {unit} vs older half {delta.prev.toLocaleString()}
      {delta.pct != null
        ? ` (${delta.pct > 0 ? '+' : ''}${delta.pct}%)`
        : delta.curr > 0 ? ' (older half was quiet — no baseline yet)' : ''}
    </p>
  );
}

// Compact why-refs (same resolver + missing-is-surfaced posture as the board).
function WhyRefs({ metric }) {
  const { note, refs } = resolveWhy(metric, DR_BY_ID, LESSONS);
  if (!note && refs.length === 0) return null;
  return (
    <div className="mt-2">
      {note && <p className="text-[0.625rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>{note}</p>}
      <div className="flex flex-wrap gap-1 mt-1">
        {refs.map((r) => r.found ? (
          <span key={r.id} className="inline-flex items-center gap-1 text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#5A5751] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }} title={r.title}>
            <UiIcon name={r.kind === 'dr' ? 'check' : 'book'} className="w-3 h-3" /> {r.id}
          </span>
        ) : (
          <span key={r.id} className="inline-flex items-center text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#DC2626] text-[#DC2626]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {r.id} — not in the ledger
          </span>
        ))}
      </div>
    </div>
  );
}

export default function EvalHistory() {
  const [windowDays, setWindowDays] = useState(30);
  const [series, setSeries] = useState(undefined);   // undefined=loading, null=unavailable
  const [commands, setCommands] = useState(null);     // null=not arrived, []=arrived empty
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (days) => {
    setLoading(true);
    const [s, cmds] = await Promise.all([
      fetchUsageSeries(days),
      // enough real rows to cover the window; history reads, never subscribes
      fetchCommands(400).catch(() => null),
    ]);
    setSeries(s);
    setCommands(cmds);
    setLoading(false);
  }, []);
  useEffect(() => { load(windowDays); }, [load, windowDays]);

  const dayKeys = windowDayKeys(windowDays, Date.now());
  const people = normalizeUsageSeries(series);
  // Align the RPC's days onto the shared axis (both are UTC day keys).
  const peopleByDay = {};
  for (const d of people.days) peopleByDay[d.day] = d;
  const peopleDays = dayKeys.map((k) => peopleByDay[k] || { day: k, views: 0, users: 0 });
  const ops = opsDaily(commands, dayKeys);
  const viewsDelta = halfWindowDelta(peopleDays, (d) => d.views);
  const markers = buildMarkers(DR_LEDGER, LESSONS, dayKeys);
  const byDay = markersByDay(markers);

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
          <UiIcon name="chart" className="w-3.5 h-3.5" /> History &amp; Markers — the evaluation layer
        </div>
        <div className="flex items-center gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowDays(w)}
              aria-pressed={windowDays === w}
              className={`text-[0.625rem] uppercase tracking-wider px-2 py-1 border min-h-[32px] ${windowDays === w ? 'border-[#1A1815] bg-[#1A1815] text-[#FAF8F4]' : 'border-[#1A1815] hover:bg-[#FAF8F4]'}`}
            >
              {w}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => load(windowDays)}
            disabled={loading}
            className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50 min-h-[32px]"
          >
            {loading ? 'Reading…' : 'Refresh'}
          </button>
        </div>
      </div>
      <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        The board above reads the system now; this reads it over time. Two lanes on one timeline — what people did (observed, to serve) and what the system did (controlled, so it answers for itself) — with every decision and incident dated in the window pinned to the same axis. A number that moved beside a marker has its explanation; a number that moved with no marker is the question to chase.
      </p>

      {/* ----- PEOPLE — what we observe, to serve ----- */}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold border-b border-[#1A1815] pb-1 mb-2">People — what we observe (to serve)</div>
      <div className="border border-[#E8E4DC] p-2.5 mb-3">
        {series === undefined ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Reading the history…</p>
        ) : !people.ok ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
            Series unavailable — the usage_flow_series RPC is governor-gated (sign in with a steward account), or migration 0078 hasn&apos;t reached the database yet. Showing nothing rather than a painted line.
          </p>
        ) : (
          <>
            <div className="text-xs text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              Views per day — {people.totalViews.toLocaleString()} in {windowDays}d · active on {people.activeDays} day{people.activeDays === 1 ? '' : 's'}
            </div>
            <BarLane
              days={peopleDays}
              accessor={(d) => d.views}
              height={44}
              colorClass="text-[#B85838]"
              tip={(d) => d === 'summary' ? 'Views per day' : `${fmtDay(d.day)} — ${d.views} views · ${d.users} ${d.users === 1 ? 'person' : 'people'}`}
            />
            <div className="text-xs text-[#1A1815] mt-2 mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>People per day</div>
            <BarLane
              days={peopleDays}
              accessor={(d) => d.users}
              height={24}
              colorClass="text-[#1A1815]"
              tip={(d) => d === 'summary' ? 'Active people per day' : `${fmtDay(d.day)} — ${d.users} ${d.users === 1 ? 'person' : 'people'}`}
            />
            <AxisEnds dayKeys={dayKeys} />
            <DeltaLine delta={viewsDelta} unit="views" />
          </>
        )}
        <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>measured from usage_flow_series() over usage_events (aggregate-only, 0078)</div>
        <p className="text-[0.625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Counts only, on the family&apos;s own database — each person owns and can delete their own trail; the steward never sees an individual&apos;s rows. Reviewed to guide what we fix and build, never to farm engagement.
        </p>
      </div>

      {/* ----- SYSTEM — what we control ----- */}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold border-b border-[#1A1815] pb-1 mb-2">System — what we control</div>
      <div className="border border-[#E8E4DC] p-2.5 mb-3">
        {!ops.ok ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Ops feed not readable from this account — the history stays empty rather than invented.</p>
        ) : ops.total === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No ops runs dated inside this window.</p>
        ) : (
          <>
            <div className="text-xs text-[#1A1815] mb-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
              Ops runs per day — {ops.total} in {windowDays}d · {ops.failed} failed
            </div>
            <OpsLane days={ops.days} height={44} />
            <AxisEnds dayKeys={dayKeys} />
            <div className="flex items-center gap-3 mt-1 text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block w-2 h-2 bg-[#1A1815]" /> completed</span>
              <span className="inline-flex items-center gap-1"><span aria-hidden="true" className="inline-block w-2 h-2 bg-[#DC2626]" /> failed</span>
            </div>
          </>
        )}
        <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>measured from ops_commands rows with real timestamps (DR-0088)</div>
      </div>

      {/* ----- THE MARKERS — the record pinned to the timeline ----- */}
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#1A1815] font-semibold border-b border-[#1A1815] pb-1 mb-2">Historical markers — what changed, and when</div>
      <div className="border border-[#E8E4DC] p-2.5">
        {markers.length === 0 ? (
          <p className="text-[0.6875rem] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No decisions or incidents dated inside this window.</p>
        ) : (
          <>
            <MarkerRail dayKeys={dayKeys} byDay={byDay} />
            <AxisEnds dayKeys={dayKeys} />
            <ul className="mt-2 space-y-1 max-h-56 overflow-y-auto">
              {[...markers].reverse().map((m, i) => (
                <li key={`${m.day}-${m.kind}-${m.id}-${i}`} className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  <span className={`inline-block align-middle mr-1.5 ${m.kind === 'dr' ? 'w-2 h-2 bg-[#B85838]' : 'w-1 h-3 bg-[#DC2626]'}`} aria-hidden="true" />
                  <strong>{m.day}</strong> · {m.kind === 'dr' ? m.id : 'incident'} — {(m.title || '(untitled)').slice(0, 140)}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="text-[0.5625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>parsed at build from docs/decisions + LESSONS-LEARNED incidents — dateless records are skipped, never guessed</div>
      </div>

      <WhyRefs metric="history" />
    </section>
  );
}
