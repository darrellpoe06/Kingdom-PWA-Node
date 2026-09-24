// =============================================================================
// MemberLessonQueue — members' lessons, waiting for the Governor (DR-0635)
// =============================================================================
// Darrell 2026-09-24: "Que for me to review..." Every lesson a member sent under
// the Lesson chip that is not yet decided, read LIVE from member_lesson_queue()
// (migration 0237, Governor-only): their words, their name, the date, and the
// three lessons the Speak box showed them (the same deterministic matcher, so
// he sees what they saw). Approve, or decline with a reason the member reads.
// Rendered under Projects → Decisions, behind the same isGovernor gate; the
// database is the real gate (a non-Governor's call is refused, and said so).
import React, { useCallback, useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import { fetchMemberLessonQueue, reviewMemberLesson, validateDecision } from '../lib/member-lesson-review.js';
import { lessonsForSituation } from '../lib/lessons-for-situation.js';

const serif = { fontFamily: '"Fraunces", serif' };

function QueueRow({ row, onDecided }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const matches = lessonsForSituation(row.body);
  const decide = async (decision) => {
    const v = validateDecision(decision, reason);
    if (!v.ok) { setError(v.reason); return; }
    setBusy(true); setError('');
    const res = await reviewMemberLesson({ supabase, id: row.id, decision, reason });
    setBusy(false);
    if (!res.ok) { setError(`Not saved (${res.reason}).`); return; }
    onDecided(row.id, res.tag);
  };
  const when = row.created_at ? new Date(row.created_at).toLocaleString() : '';
  return (
    <li className="border border-[#E8E4DC] bg-white p-3" data-testid="member-lesson-row" data-row-id={row.id}>
      <div className="text-[0.6875rem] text-[#5A5751]" style={serif}>
        <span className="font-semibold text-[#1A1815]" data-testid="member-lesson-sender">{row.sender_name || 'A member'}</span>
        {when ? ` · ${when}` : ''}{row.source ? ` · ${row.source}` : ''}
      </div>
      <p className="text-sm text-[#1A1815] mt-1 whitespace-pre-wrap" style={serif} data-testid="member-lesson-words">{row.body}</p>
      <div className="mt-2 text-[0.6875rem] text-[#5A5751]" style={serif}>
        <span className="uppercase tracking-wider font-semibold text-[#5A6E3D]">They were shown: </span>
        {matches.length
          ? <span data-testid="member-lesson-shown">{matches.map((m) => m.title).join(' · ')}</span>
          : <span data-testid="member-lesson-shown">no lesson close enough</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <button type="button" disabled={busy} onClick={() => decide('approve')} data-testid="member-lesson-approve"
          className="bg-[#5A6E3D] text-white px-3 py-2 text-xs uppercase tracking-wider min-h-[36px] disabled:opacity-40">
          Approve
        </button>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason, if you decline (the member reads it)"
          aria-label="Reason for declining" data-testid="member-lesson-reason"
          className="flex-1 min-w-[180px] p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" />
        <button type="button" disabled={busy} onClick={() => decide('decline')} data-testid="member-lesson-decline"
          className="border border-[#1A1815] text-[#1A1815] px-3 py-2 text-xs uppercase tracking-wider min-h-[36px] disabled:opacity-40">
          Decline
        </button>
      </div>
      {error && <p role="alert" className="text-[0.75rem] text-[#B85838] mt-1" data-testid="member-lesson-error">{error}</p>}
    </li>
  );
}

export default function MemberLessonQueue({ signedIn = false }) {
  const [state, setState] = useState({ loading: true, ok: false, rows: [], reason: '' });
  const [decided, setDecided] = useState([]);
  const load = useCallback(async () => {
    const res = await fetchMemberLessonQueue({ supabase });
    setState({ loading: false, ok: res.ok, rows: res.rows, reason: res.reason });
  }, []);
  useEffect(() => { if (signedIn) load(); else setState({ loading: false, ok: false, rows: [], reason: 'signed-out' }); }, [signedIn, load]);
  const onDecided = (id, tag) => {
    setDecided((d) => [...d, { id, tag }]);
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) }));
  };
  return (
    <section className="border-2 border-[#5A6E3D] bg-[#FAF8F4] p-4" aria-labelledby="member-lessons-h" data-testid="member-lesson-queue">
      <h3 id="member-lessons-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">Members’ lessons to review</h3>
      <p className="text-xs text-[#5A5751] mt-1" style={serif}>
        What members sent under the Lesson chip. Approve and the lesson reader writes it from their situation, with their name never used and personal details changed. Decline and they read your reason beside the lessons they were shown.
      </p>
      {state.loading && <p className="text-xs text-[#5A5751] mt-2">Reading the queue…</p>}
      {!state.loading && !state.ok && (
        <p className="text-xs text-[#5A5751] mt-2" data-testid="member-lesson-queue-closed">
          The queue did not open ({state.reason}). Only the Governor reviews members’ lessons.
        </p>
      )}
      {!state.loading && state.ok && state.rows.length === 0 && (
        <p className="text-xs text-[#5A5751] mt-2" data-testid="member-lesson-queue-empty">Nothing waiting. Every member lesson sent so far has been decided.</p>
      )}
      {state.ok && state.rows.length > 0 && (
        <ul className="mt-3 space-y-3">
          {state.rows.map((r) => <QueueRow key={r.id} row={r} onDecided={onDecided} />)}
        </ul>
      )}
      {decided.length > 0 && (
        <p className="text-[0.6875rem] text-[#5A6E3D] mt-2" data-testid="member-lesson-decided">
          Decided this visit: {decided.filter((d) => d.tag === 'lesson-approved').length} approved, {decided.filter((d) => d.tag === 'lesson-declined').length} declined.
        </p>
      )}
    </section>
  );
}
