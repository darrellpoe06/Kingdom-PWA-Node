// =============================================================================
// LessonShareLedger — the shares, and whether each link worked
// =============================================================================
// Darrell 2026-09-30: "also keep record of who does what send links etc... so
// we know they work and don't etc..."
//
// Reads the real record (migration 0244, `lesson_share_ledger()`), never a
// painted list: every share with its lesson, how it went out, when, and how
// many times its link was opened, how many opens showed the lesson and how
// many did not, with the last failure's reason. Two places, one component:
//   * Learn → My shares: the signed-in person's own shares.
//   * Admin → Lesson shares (`all`): every share, with who sent it. The
//     database decides who may see all (is_lesson_governor()); the flag only
//     asks.
// An open carries no identity of the person who opened it, so there is none
// to show. DR-0698.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { listLessonShares, ledgerTotals } from '../lib/lesson-share-record.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

function when(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch (_) { return String(ts).slice(0, 16); }
}

export function shareVerdict(row) {
  const opens = Number(row && row.opens) || 0;
  const ok = Number(row && row.ok_opens) || 0;
  const failed = Number(row && row.failed_opens) || 0;
  if (opens === 0) return { tone: 'quiet', text: 'Not opened yet' };
  if (failed === 0) return { tone: 'ok', text: `Worked ${ok} of ${opens}` };
  if (ok === 0) return { tone: 'bad', text: `Failed ${failed} of ${opens}` };
  return { tone: 'mixed', text: `Worked ${ok}, failed ${failed}` };
}

const TONE = {
  quiet: 'text-[#5A5751] border-[#E8E4DC]',
  ok: 'text-[#5A6E3D] border-[#5A6E3D]',
  bad: 'text-[#B85838] border-[#B85838]',
  mixed: 'text-[#1A1815] border-[#B85838]',
};

export default function LessonShareLedger({ all = false, load = listLessonShares }) {
  const [state, setState] = useState({ loading: true, ok: true, rows: [], error: '' });
  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const r = await load({ all });
    setState({ loading: false, ok: r.ok, rows: r.rows || [], error: r.error || '' });
  }, [all, load]);
  useEffect(() => { refresh(); }, [refresh]);

  const t = ledgerTotals(state.rows);
  return (
    <section className="space-y-3" data-testid="lesson-share-ledger">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-[#1A1815] m-0" style={SERIF}>
          {all
            ? 'Every lesson link shared from the app, who sent it, and whether it opened the lesson. Opens are counted with no information about who opened them.'
            : 'The lesson links you have shared, and whether each one opened the lesson for the person you sent it to.'}
        </p>
        <button
          type="button"
          onClick={refresh}
          className="text-[0.625rem] uppercase tracking-wider px-2.5 py-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
        >
          Refresh
        </button>
      </div>

      {state.loading && <p className="text-xs text-[#5A5751]" style={SERIF} aria-live="polite">Reading the record…</p>}
      {!state.loading && !state.ok && (
        <p className="text-xs text-[#B85838]" style={SERIF} role="status">
          The share record could not be read ({state.error}). Nothing is shown rather than a guess.
        </p>
      )}
      {!state.loading && state.ok && state.rows.length === 0 && (
        <p className="text-xs text-[#5A5751]" style={SERIF}>No shares recorded yet. Share a lesson and it appears here.</p>
      )}
      {!state.loading && state.ok && state.rows.length > 0 && (
        <>
          <p className="text-[0.6875rem] text-[#5A5751] m-0" style={MONO} data-testid="lesson-share-totals">
            {t.shares} shared · {t.opens} opened · {t.ok} worked · {t.failed} failed · {t.neverOpened} not opened yet
          </p>
          <ul className="space-y-2">
            {state.rows.map((r) => {
              const v = shareVerdict(r);
              return (
                <li key={r.token} className="border border-[#E8E4DC] p-3 bg-white">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1A1815] break-words" style={SERIF}>{r.lesson_title || r.lesson_id}</div>
                      <div className="text-[0.625rem] text-[#5A5751] break-all" style={MONO}>
                        {r.door === 'tlc' ? 'TLC' : 'The Love Corner'} · {r.course_key}{r.kind === 'section' ? ' · a part of the lesson' : ''}
                      </div>
                    </div>
                    <span className={`text-[0.625rem] uppercase tracking-wider border px-2 py-0.5 whitespace-nowrap ${TONE[v.tone]}`}>{v.text}</span>
                  </div>
                  <div className="mt-1 text-[0.6875rem] text-[#1A1815]" style={SERIF}>
                    {all ? <>Sent by {r.sharer || 'a signed-out reader'} · </> : null}
                    {r.method === 'native' ? 'share sheet' : 'copied'} · {when(r.created_at)}
                    {r.last_opened_at ? <> · last opened {when(r.last_opened_at)}</> : null}
                  </div>
                  {r.last_failure && (
                    <div className="mt-1 text-[0.6875rem] text-[#B85838]" style={SERIF}>Last failure: {r.last_failure}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
