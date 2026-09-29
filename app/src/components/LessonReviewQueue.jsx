// =============================================================================
// LessonReviewQueue — every lesson with more than one version, waiting for the
// Governor's decision (DR-0672); rendered in Projects → Decisions
// =============================================================================
// Read live from lesson_versions (DR-0669) and lesson_decisions (0241), the
// Governor only (the database's is_lesson_governor() is the real gate; the
// client refuses before any read too). A lesson waits here until he decides;
// a gate that fails on the final lesson brings it back with the failure named.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import { fetchReviewQueue } from '../lib/lesson-decisions.js';
import LessonVersionsCompare from './LessonVersionsCompare.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LIVE = { supabase };

export default function LessonReviewQueue({ deps = LIVE }) {
  const [who, setWho] = useState({ uid: '', email: '' });
  const [q, setQ] = useState({ state: 'loading', teachings: [], reason: '' });
  const [open, setOpen] = useState({});
  const load = useCallback(async () => {
    const { data } = await deps.supabase.auth.getSession();
    const user = data && data.session && data.session.user;
    const me = { uid: (user && user.id) || '', email: (user && user.email) || '' };
    setWho(me);
    setQ(await fetchReviewQueue({ supabase: deps.supabase, ...me }));
  }, [deps]);
  useEffect(() => { load(); }, [load]);

  if (q.state === 'refused' || q.state === 'loading') return null;
  const waiting = q.teachings.filter((t) => t.state === 'awaiting' || t.state === 'gate-failed');
  const inFlight = q.teachings.filter((t) => t.state === 'pending' || t.state === 'building');
  return (
    <section className="bg-white border border-[#E8E4DC] p-3" data-testid="lesson-review-queue">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Lessons to decide · {waiting.length}</h2>
        <button type="button" onClick={load} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#E8E4DC] text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">Refresh</button>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] italic" style={SERIF}>
        Every lesson more than one writer wrote from the same prompt. Choose one, merge them part by part, or take the best part of each. Nothing ships until you decide.
      </p>
      {q.state === 'not-yet' && <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF} data-testid="review-queue-none">No versions yet. The lesson builder has not stored any on this database.</p>}
      {q.state === 'error' && <p className="text-[0.6875rem] text-[#B85838] mt-1" style={SERIF}>The queue could not be read ({q.reason}).</p>}
      {q.state === 'ok' && waiting.length === 0 && <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF} data-testid="review-queue-empty">Nothing waiting for you{inFlight.length ? `; ${inFlight.length} decided and with the builder` : ''}.</p>}
      <ul className="mt-2 space-y-2">
        {waiting.map((t) => (
          <li key={t.teachingRowId} className="border border-[#E8E4DC] p-2" data-testid="review-queue-item" data-state={t.state}>
            <p className="text-xs font-semibold text-[#1A1815] break-words" style={SERIF}>
              {(t.versions.find((v) => v.title) || {}).title || 'Untitled lesson'}
              <span className="text-[#5A5751] font-normal"> · {t.versions.length} versions{t.state === 'gate-failed' ? ' · a gate failed' : ''}</span>
            </p>
            <button type="button" aria-expanded={!!open[t.teachingRowId]} onClick={() => setOpen((o) => ({ ...o, [t.teachingRowId]: !o[t.teachingRowId] }))}
              className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#2A5A8E] text-[#2A5A8E] mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
              {open[t.teachingRowId] ? 'Close' : 'Review and decide'}
            </button>
            {open[t.teachingRowId] && (
              <LessonVersionsCompare
                versions={t.versions}
                decide={{ teachingRowId: t.teachingRowId, buildId: (t.versions[0] || {}).buildId || null, review: t, deps: { supabase: deps.supabase, ...who }, onPublished: load }}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
