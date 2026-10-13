// =============================================================================
// ProvingOurWays — are our ways producing His will, and has anyone tried them
// =============================================================================
// Darrell 2026-10-08: "Where inside the PoeTech App is the reports and
// historical information and framework for our culturally responsive
// evaluation and assessments to make sure we are producing His Will with our
// ways and tools? Comprehensive module/s" — and, in the same breath, "metrics
// for my family... to see if they are testing and using evaluating the
// functions based on the use so we can streamline our process for testing".
//
// This is the surface for both halves. The framework is rendered here so it is
// read where the work is (DR-0065, the app is the primary artifact; DR-0195,
// teach through the system). The tried-or-not report reads real rows from
// feature_use_metrics (migration 0253) and says NOT TRIED where there are none.
//
// HONEST BY CONSTRUCTION (DR-0076). A snapshot that could not be read is never
// rendered as "nothing has been tried": the line says it could not be read.
// There is no painted number anywhere on this page, and the page is held to the
// very standard it prints.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PROVING_DIMENSIONS, SHIPPED_FUNCTIONS, tryStatus, provingSummary, provingLine,
  assessmentHistory, assessmentDirection,
} from '../lib/proving-our-ways.js';
import { fetchFeatureUse } from '../lib/usage-events.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const labelCls = 'text-[0.625rem] uppercase tracking-wider text-[#5A5751]';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';

const HISTORY_KEY = 'poetech.proving.history.v1';
const DAYS = 90;

function loadHistory() {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(HISTORY_KEY);
    const j = raw ? JSON.parse(raw) : [];
    return Array.isArray(j) ? j : [];
  } catch { return []; }
}

function saveHistory(list) {
  try {
    globalThis.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 60)));
    return true;
  } catch { return false; }
}

/** One assessment a day, kept so the steward can see the direction (DR-0075). */
export function foldToday(history, entry) {
  const rest = (Array.isArray(history) ? history : []).filter((e) => e && e.at !== entry.at);
  return [entry, ...rest];
}

function Tile({ label, value, sub }) {
  return (
    <div className="border border-[#E3DDD2] bg-[#FAF8F4] px-3 py-2">
      <div className={labelCls}>{label}</div>
      <div className="text-lg font-semibold tabular-nums text-[#1A1815]">{value}</div>
      {sub ? <div className="text-[0.625rem] text-[#5A5751]">{sub}</div> : null}
    </div>
  );
}

export default function ProvingOurWays() {
  const [snap, setSnap] = useState({ phase: 'loading', data: null });
  const [history, setHistory] = useState(() => loadHistory());

  const load = useCallback(async () => {
    setSnap({ phase: 'loading', data: null });
    const data = await fetchFeatureUse(DAYS);
    setSnap({ phase: data ? 'ready' : 'unreadable', data });
  }, []);

  useEffect(() => { load(); }, [load]);

  const status = useMemo(
    () => tryStatus(snap.data && snap.data.features, Date.now()),
    [snap.data],
  );
  const summary = useMemo(() => provingSummary(status), [status]);
  const ok = snap.phase === 'ready';

  // Record today's assessment once a real snapshot has been read. A day with no
  // readable snapshot records NOTHING rather than a zero (DR-0076).
  useEffect(() => {
    if (!ok) return;
    const at = new Date().toISOString().slice(0, 10);
    setHistory((h) => {
      const next = foldToday(h, { at, tried: summary.tried, shipped: summary.shipped });
      saveHistory(next);
      return next;
    });
  }, [ok, summary.tried, summary.shipped]);

  const rows = useMemo(() => assessmentHistory(history), [history]);
  const direction = useMemo(() => assessmentDirection(rows), [rows]);

  return (
    <div className="space-y-4" data-testid="proving-our-ways">
      <section className={card}>
        <h3 className={sectionH}>Proving our ways</h3>
        <p className="mt-2 text-[0.875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
          Two questions, kept together on purpose: has anyone actually used what we
          shipped, and are the ways themselves producing His will.
        </p>
        <p className={`${note} mt-2`}>
          The standard below is Living Lessons L219 (DR-0818), the Word Darrell spoke
          when he asked for this. The report under it reads real rows and says
          plainly where there are none.
        </p>
      </section>

      <section className={card}>
        <h3 className={sectionH}>Has it been tried</h3>
        <p className="mt-2 text-[0.8125rem] text-[#1A1815]" data-testid="proving-line">
          {provingLine(summary, ok)}
        </p>
        {snap.phase === 'loading' ? <p className={`${note} mt-1`}>Reading the last {DAYS} days…</p> : null}
        {snap.phase === 'unreadable' ? (
          <p className={`${note} mt-1`} data-testid="proving-unreadable">
            The usage snapshot could not be read from here. That is not the same as
            nothing having been used, and nothing below is a measurement until it can
            be read. <button type="button" onClick={load} className="underline focus:outline focus:outline-2 focus:outline-[#B85838]">Try again</button>
          </p>
        ) : null}

        {ok ? (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tile label="Registered" value={summary.shipped} sub="functions a person uses" />
            <Tile label="Tried" value={summary.tried} sub={`in the last ${DAYS} days`} />
            <Tile label="Not tried" value={summary.untried} sub="nobody has exercised it" />
            <Tile label="People" value={summary.people} sub="most on any one function" />
          </div>
        ) : null}

        <table className="mt-3 w-full text-left text-[0.75rem]" data-testid="proving-table">
          <caption className="sr-only">Every registered function, where it lives, the day it shipped, how many people have used it and whether it has been tried</caption>
          <thead>
            <tr className={labelCls}>
              <th scope="col" className="py-1 pr-2 font-semibold">Function</th>
              <th scope="col" className="py-1 pr-2 font-semibold">Where</th>
              <th scope="col" className="py-1 pr-2 font-semibold">Shipped</th>
              <th scope="col" className="py-1 pr-2 font-semibold text-right">People</th>
              <th scope="col" className="py-1 font-semibold">State</th>
            </tr>
          </thead>
          <tbody>
            {status.map((f) => (
              <tr key={f.event} className="border-t border-[#E3DDD2]" data-proving-row={f.event}>
                <td className="py-1 pr-2 text-[#1A1815]">{f.label}</td>
                <td className="py-1 pr-2 text-[#5A5751]">{f.where}</td>
                <td className="py-1 pr-2 text-[#5A5751] tabular-nums">{f.shipped} · {f.dr}</td>
                <td className="py-1 pr-2 text-right tabular-nums text-[#1A1815]">{ok ? f.people : '—'}</td>
                <td className="py-1">
                  {!ok ? <span className="text-[#5A5751]">not read</span>
                    : f.tried
                      ? <span className="text-[#5A6E3D] font-semibold">tried · {f.uses}</span>
                      : <span className="text-[#B85838] font-semibold">not tried</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={`${note} mt-2`}>
          Counts and distinct-people counts only. This report never names a person:
          per-person usage has its own decided road for a steward of a space
          (migration 0145), and the question here is about the function, not the
          person. Every row records the same way for everyone, which is the
          Proverbs 20:10 line below.
        </p>
      </section>

      <section className={card}>
        <h3 className={sectionH}>The standard we assess against</h3>
        <p className={`${note} mt-1`}>
          Culturally responsive means the assessment meets each person in their own
          language, age, pace and circumstance, and it is grounded rather than
          borrowed: the same message reaches child, youth, teen and elder with
          nothing reduced for any of them, the rhythm is a family&apos;s ordinary day,
          and the measure itself does not change depending on whose work is on it.
          Responsive to the person, fixed in the standard.
        </p>
        <ol className="mt-3 space-y-3">
          {PROVING_DIMENSIONS.map((d, i) => (
            <li key={d.key} data-proving-dimension={d.key}>
              <div className="text-[0.8125rem] font-semibold text-[#1A1815]">{i + 1}. {d.title}</div>
              <div className="text-[0.75rem] text-[#1A1815] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                &ldquo;{d.text}&rdquo; ({d.verse})
              </div>
              <div className={`${note} mt-0.5`}>{d.asks}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className={card}>
        <h3 className={sectionH}>The record over time</h3>
        <p className="mt-1 text-[0.8125rem] text-[#1A1815]" data-testid="proving-direction">{direction.word}</p>
        {rows.length ? (
          <table className="mt-2 w-full text-left text-[0.75rem]" data-testid="proving-history">
            <caption className="sr-only">One assessment a day: how many registered functions had been tried, out of how many</caption>
            <thead>
              <tr className={labelCls}>
                <th scope="col" className="py-1 pr-2 font-semibold">Day</th>
                <th scope="col" className="py-1 pr-2 font-semibold text-right">Tried</th>
                <th scope="col" className="py-1 pr-2 font-semibold text-right">Registered</th>
                <th scope="col" className="py-1 font-semibold text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 14).map((r) => (
                <tr key={r.at} className="border-t border-[#E3DDD2]">
                  <td className="py-1 pr-2 tabular-nums text-[#1A1815]">{r.at}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{r.tried}</td>
                  <td className="py-1 pr-2 text-right tabular-nums">{r.shipped}</td>
                  <td className="py-1 text-right tabular-nums font-semibold">{r.share}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={`${note} mt-1`}>No assessment has been recorded on this device yet.</p>}
        <p className={`${note} mt-2`}>
          One assessment a day, kept on this device, written only when a real
          snapshot was read. A day the snapshot could not be read records nothing at
          all rather than a zero, because an unread day and an unused day are not the
          same sentence.
        </p>
      </section>

      <section className={card}>
        <h3 className={sectionH}>What this does not yet measure</h3>
        <ul className={`${note} mt-1 list-disc pl-4 space-y-1`}>
          <li>Only the {SHIPPED_FUNCTIONS.length} functions registered above are counted. A function
            that is shipped and never registered here is invisible to this report, so the
            registry is the honest limit of the claim.</li>
          <li>It measures whether a function was exercised, not whether it served the
            person well. That is what the standard&apos;s other seven questions are for, and
            they are answered by people, not by a count.</li>
          <li>It says nothing about anyone outside this family&apos;s own space.</li>
        </ul>
      </section>
    </div>
  );
}
