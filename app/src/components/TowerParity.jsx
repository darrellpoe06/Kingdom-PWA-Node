// =============================================================================
// TowerParity — how close our own towers are to the reference lessons (DR-0671)
// =============================================================================
// Darrell 2026-09-29: "The final goal is to not need any no local model... we
// need to make more workflows that produce the same outcome from claude based
// on the process being used... claude needs to create the specific algorithmic
// fixes for our workflows to work on the towers etc..."
//
// Read LIVE from the four Governor-only tables the NAS parity loop writes
// (migration 0240): each tower writer's parity over time, the gaps still open,
// the fixes Claude was asked to write, the promotion status, and, per lesson,
// every version against every other and what most writers agree on. It sits
// beside the Compare view of the same lessons (DR-0668) under Projects →
// Decisions. His one control is Hold: a ready writer stays 'ready' until he
// releases it. The database is the real gate: a non-Governor reads nothing.
import React, { useCallback, useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import {
  fetchTowerParity, setParityHold, writerSeries, openGapClasses, fixLines, consensusView,
  scoreText, STATUS_LINES,
} from '../lib/tower-parity.js';

const serif = { fontFamily: '"Fraunces", serif' };
const small = 'text-[0.6875rem] text-[#5A5751]';
const head = 'text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold';

function WriterTile({ series, promo, onHold, busy }) {
  const last = series.points.slice(-12);
  const latest = last[last.length - 1];
  const held = !!(promo && promo.held);
  return (
    <li className="border border-[#E8E4DC] bg-white p-3" data-testid="parity-writer" data-writer={series.key}>
      <div className={small} style={serif}>
        <span className="font-semibold text-[#1A1815]">{series.family}</span>{series.model ? ` · ${series.model}` : ''}
      </div>
      <p className="text-2xl text-[#1A1815] mt-1" style={serif} data-testid="parity-latest">
        {latest ? scoreText(latest.score) : '—'}<span className="text-xs text-[#5A5751]"> / 100 latest parity</span>
      </p>
      {promo && (
        <p className="text-xs text-[#1A1815] mt-1" style={serif} data-testid="parity-promotion" data-status={promo.status}>
          {promo.streak} of {promo.required_n} in a row at {scoreText(promo.threshold)} or better. {STATUS_LINES[promo.status] || promo.status}
        </p>
      )}
      <table className="mt-2 w-full text-[0.6875rem]" data-testid="parity-history">
        <caption className="sr-only">Parity of the last {last.length} lessons, oldest first</caption>
        <thead><tr><th scope="col" className="text-left font-normal text-[#5A5751]">Lesson</th><th scope="col" className="text-right font-normal text-[#5A5751]">Parity</th><th scope="col" className="text-right font-normal text-[#5A5751]">Floors</th></tr></thead>
        <tbody>
          {last.map((p, i) => (
            <tr key={`${p.at}-${i}`}>
              <td className="text-[#1A1815]">{p.lesson || '—'}</td>
              <td className="text-right text-[#1A1815]">{scoreText(p.score)}</td>
              <td className="text-right text-[#1A1815]">{p.passed ? 'held' : 'broken'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {promo && promo.tower && (
        <button type="button" disabled={busy} onClick={() => onHold(promo, !held)} data-testid="parity-hold"
          className="mt-2 border border-[#1A1815] text-[#1A1815] px-3 py-2 text-xs uppercase tracking-wider min-h-[36px] disabled:opacity-40">
          {held ? 'Release hold' : 'Hold promotion'}
        </button>
      )}
    </li>
  );
}

function CrossRef({ row }) {
  const c = consensusView(row);
  return (
    <div className="border border-[#E8E4DC] bg-white p-3" data-testid="parity-crossref" data-teaching={row.teaching_row_id}>
      <p className={small} style={serif}><span className="font-semibold text-[#1A1815]">{row.lesson_id || row.teaching_row_id}</span> · {(row.versions || []).map((v) => v.writer).join(', ')}</p>
      <table className="mt-2 w-full text-[0.6875rem]" data-testid="parity-matrix">
        <caption className="sr-only">Agreement between every pair of versions</caption>
        <thead>
          <tr className="text-[#5A5751]">
            <th scope="col" className="text-left font-normal">Pair</th><th scope="col" className="text-right font-normal">Verses</th>
            <th scope="col" className="text-right font-normal">Points</th><th scope="col" className="text-right font-normal">Parts</th>
            <th scope="col" className="text-right font-normal">Gates</th><th scope="col" className="text-right font-normal">Quiz</th>
          </tr>
        </thead>
        <tbody>
          {(row.matrix || []).map((m) => (
            <tr key={`${m.a}-${m.b}`} className="text-[#1A1815]">
              <td>{m.aWriter} · {m.bWriter}</td><td className="text-right">{scoreText(m.verses)}</td>
              <td className="text-right">{scoreText(m.movements)}</td><td className="text-right">{scoreText(m.structure)}</td>
              <td className="text-right">{scoreText(m.gates)}</td><td className="text-right">{scoreText(m.quizAnswers)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-[#1A1815] mt-2" style={serif} data-testid="parity-consensus">
        Most of the {c.eligible} writers cite: {c.versesAgreed.length ? c.versesAgreed.join(', ') : 'no verse in common yet'}.
      </p>
      {c.insights.length > 0 && (
        <p className="text-xs text-[#1A1815] mt-1" style={serif} data-testid="parity-insights">
          Brought by one writer only (candidate insights, not errors): {c.insights.map((i) => `${i.item} (${i.writer})`).join('; ')}.
        </p>
      )}
      {c.excluded.length > 0 && (
        <p className="text-xs text-[#B85838] mt-1" style={serif} data-testid="parity-excluded">
          Left out of the consensus: {c.excluded.map((e) => `${e.writer}, ${e.why}`).join('; ')}.
        </p>
      )}
    </div>
  );
}

export default function TowerParity({ signedIn = false }) {
  const [state, setState] = useState({ loading: true, ok: false, reason: '' });
  const [busy, setBusy] = useState(false);
  const [lessonIx, setLessonIx] = useState(0);
  const load = useCallback(async () => {
    const res = await fetchTowerParity({ supabase });
    setState({ loading: false, ...res });
  }, []);
  useEffect(() => { if (signedIn) load(); else setState({ loading: false, ok: false, reason: 'signed-out' }); }, [signedIn, load]);
  const onHold = async (promo, hold) => {
    setBusy(true);
    const res = await setParityHold({ supabase, family: promo.writer_family, model: promo.model_label, hold });
    setBusy(false);
    if (res.ok) await load(); else setState((s) => ({ ...s, holdError: res.reason }));
  };

  const series = state.ok ? writerSeries(state.parity).filter((s) => s.family !== 'claude') : [];
  const promoOf = (s) => (state.promotions || []).find((p) => `${p.writer_family}/${p.model_label || ''}` === s.key);
  const gaps = state.ok ? openGapClasses(state.parity) : [];
  const fixes = state.ok ? fixLines(state.fixes) : [];
  const xref = state.ok ? state.crossref || [] : [];
  const current = xref[Math.min(lessonIx, Math.max(xref.length - 1, 0))];

  return (
    <section id="tower-parity" className="border-2 border-[#5A6E3D] bg-[#FAF8F4] p-4" aria-labelledby="tower-parity-h" data-testid="tower-parity">
      <h3 id="tower-parity-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">Tower parity</h3>
      <p className="text-xs text-[#5A5751] mt-1" style={serif}>
        The same prompt goes to Claude and to our own towers. Each tower lesson is measured against Claude’s, by code, with no model judging it. When a tower matches on {state.promotions?.[0]?.required_n || 14} lessons in a row, it becomes the primary writer and Claude stays as the reference. Hold stops that from happening.
      </p>
      {state.loading && <p className="text-xs text-[#5A5751] mt-2">Reading the measurements…</p>}
      {!state.loading && !state.ok && (
        <p className="text-xs text-[#5A5751] mt-2" data-testid="tower-parity-closed">
          The measurements did not open ({state.reason}). Only the Governor reads them.
        </p>
      )}
      {state.ok && series.length === 0 && (
        <p className="text-xs text-[#5A5751] mt-2" data-testid="tower-parity-empty">
          No tower lesson has been measured yet. The first lesson the builder writes on both Claude and a tower appears here within fifteen minutes.
        </p>
      )}
      {series.length > 0 && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {series.map((s) => <WriterTile key={s.key} series={s} promo={promoOf(s)} onHold={onHold} busy={busy} />)}
        </ul>
      )}
      {state.holdError && <p role="alert" className="text-[0.75rem] text-[#B85838] mt-1">Hold not saved ({state.holdError}).</p>}
      {gaps.length > 0 && (
        <div className="mt-3" data-testid="parity-gaps">
          <p className={head}>Gaps still open</p>
          <ul className="space-y-0.5">
            {gaps.map((g) => (
              <li key={`${g.family}-${g.gapClass}`} className="text-[0.6875rem] text-[#1A1815]" style={serif} data-gap={g.gapClass}>
                {g.family}: {g.label}, in {g.count} of the last {g.of} lessons
              </li>
            ))}
          </ul>
        </div>
      )}
      {state.ok && (
        <div className="mt-3" data-testid="parity-fixes">
          <p className={head}>Fixes Claude has written</p>
          {fixes.length === 0 ? (
            <p className="text-[0.6875rem] text-[#5A5751]" style={serif}>None yet. A fix is asked for when the same gap shows in 3 of a tower’s last 10 lessons.</p>
          ) : (
            <ul className="space-y-0.5">
              {fixes.map((f) => (
                <li key={f.id} className="text-[0.6875rem] text-[#1A1815]" style={serif} data-status={f.status}>
                  {f.writer_family}: {f.label} — {f.statusLine}{f.detail ? ` (${f.detail})` : ''}{f.pr_url ? ' · ' : ''}
                  {f.pr_url && <a href={f.pr_url} className="underline" target="_blank" rel="noreferrer">the PR</a>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {xref.length > 0 && (
        <div className="mt-3" data-testid="parity-lessons">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={head}>Every version, side by side</p>
            <label className="text-[0.6875rem] text-[#5A5751]">
              <span className="sr-only">Lesson</span>
              <select value={lessonIx} onChange={(e) => setLessonIx(Number(e.target.value))} data-testid="parity-lesson-pick"
                className="border border-[#E8E4DC] bg-white p-1 text-[0.6875rem] min-h-[36px]">
                {xref.map((r, i) => <option key={r.teaching_row_id} value={i}>{r.lesson_id || r.teaching_row_id}</option>)}
              </select>
            </label>
          </div>
          {current && <CrossRef row={current} />}
        </div>
      )}
    </section>
  );
}
