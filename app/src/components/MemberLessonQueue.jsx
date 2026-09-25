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
//
// MESSAGES (DR-0639): each decision, and later each published lesson, is sent
// to the member as an end-to-end encrypted Message from HIS client (the only
// place the key can be used). A member with no Messages key or no shared space
// is said so on the row; the decision stands either way. Messages still owed
// (a published lesson, or a decision that could not be sent) are sent when he
// next opens the queue.
import React, { useCallback, useEffect, useState } from 'react';
import supabase from '../lib/supabase.js';
import { fetchMemberLessonQueue, reviewMemberLesson, validateDecision, nameChoiceLabel, fetchMemberLessonOutbox, markMemberLessonMessaged } from '../lib/member-lesson-review.js';
import { deliverLessonMessage } from '../lib/lesson-review-messages.js';
import { loadDmContacts, sendDirectMessage } from '../lib/direct-messages-sync.js';

// The live Messages road; a test passes its own.
export const LIVE_MESSAGING = {
  loadDmContacts,
  sendDirectMessage,
  markMessaged: (id, kind) => markMemberLessonMessaged({ supabase, id, kind }),
};
import { lessonNameOf } from '../lib/one-voice-surfaces.js';
import { lessonsForSituation } from '../lib/lessons-for-situation.js';

const serif = { fontFamily: '"Fraunces", serif' };

function QueueRow({ row, onDecided, messaging }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const matches = lessonsForSituation(row.body);
  // DR-0639: the member's own choice about their name, read from the row.
  const offeredName = lessonNameOf(row.tags || []);
  const decide = async (decision) => {
    const v = validateDecision(decision, reason);
    if (!v.ok) { setError(v.reason); return; }
    setBusy(true); setError('');
    const res = await reviewMemberLesson({ supabase, id: row.id, decision, reason });
    setBusy(false);
    if (!res.ok) { setError(`Not saved (${res.reason}).`); return; }
    // The row as it now stands, so the Message says what was decided.
    const extra = decision === 'approve-anonymous' ? ['lesson-approved', 'lesson-anonymous'] : [res.tag];
    const decidedRow = { ...row, tags: [...(row.tags || []), ...extra], review_reason: decision === 'decline' ? reason.trim() : null };
    const delivery = await deliverLessonMessage(decidedRow, messaging, { kind: 'decision' });
    onDecided(row.id, res.tag, delivery, row.sender_name);
  };
  const when = row.created_at ? new Date(row.created_at).toLocaleString() : '';
  return (
    <li className="border border-[#E8E4DC] bg-white p-3" data-testid="member-lesson-row" data-row-id={row.id}>
      <div className="text-[0.6875rem] text-[#5A5751]" style={serif}>
        <span className="font-semibold text-[#1A1815]" data-testid="member-lesson-sender">{row.sender_name || 'A member'}</span>
        {when ? ` · ${when}` : ''}{row.source ? ` · ${row.source}` : ''}
      </div>
      <p className="text-[0.6875rem] mt-0.5 font-semibold text-[#1A1815]" style={serif} data-testid="member-lesson-name-choice">{nameChoiceLabel(row)}</p>
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
          {offeredName ? 'Approve, with their name' : 'Approve'}
        </button>
        {offeredName && (
          <button type="button" disabled={busy} onClick={() => decide('approve-anonymous')} data-testid="member-lesson-approve-anonymous"
            className="border border-[#5A6E3D] text-[#5A6E3D] px-3 py-2 text-xs uppercase tracking-wider min-h-[36px] disabled:opacity-40">
            Approve, but keep it anonymous
          </button>
        )}
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

export default function MemberLessonQueue({ signedIn = false, messaging = LIVE_MESSAGING }) {
  const [state, setState] = useState({ loading: true, ok: false, rows: [], reason: '' });
  const [decided, setDecided] = useState([]);
  const [owed, setOwed] = useState([]); // Messages owed from earlier, delivered this visit
  const load = useCallback(async () => {
    const res = await fetchMemberLessonQueue({ supabase });
    setState({ loading: false, ok: res.ok, rows: res.rows, reason: res.reason });
    if (!res.ok) return;
    // Published lessons, and decisions whose Message could not be sent before.
    const out = await fetchMemberLessonOutbox({ supabase });
    if (!out.ok) return;
    const results = [];
    for (const r of out.rows) {
      const d = await deliverLessonMessage(r, messaging);
      if (d.status !== 'none') results.push({ id: r.id, name: r.sender_name || 'A member', ...d });
    }
    setOwed(results);
  }, [messaging]);
  useEffect(() => { if (signedIn) load(); else setState({ loading: false, ok: false, rows: [], reason: 'signed-out' }); }, [signedIn, load]);
  const onDecided = (id, tag, delivery, name) => {
    setDecided((d) => [...d, { id, tag, delivery, name: name || 'A member' }]);
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.id !== id) }));
  };
  return (
    <section className="border-2 border-[#5A6E3D] bg-[#FAF8F4] p-4" aria-labelledby="member-lessons-h" data-testid="member-lesson-queue">
      <h3 id="member-lessons-h" className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">Members’ lessons to review</h3>
      <p className="text-xs text-[#5A5751] mt-1" style={serif}>
        What members sent under the Lesson chip. Approve and the lesson reader writes it from their situation: with their name only if they offered it and you keep it, and every other personal detail changed. Decline and they read your reason beside the lessons they were shown. Either way they are sent a Message.
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
          {state.rows.map((r) => <QueueRow key={r.id} row={r} onDecided={onDecided} messaging={messaging} />)}
        </ul>
      )}
      {decided.length > 0 && (
        <p className="text-[0.6875rem] text-[#5A6E3D] mt-2" data-testid="member-lesson-decided">
          Decided this visit: {decided.filter((d) => d.tag === 'lesson-approved').length} approved, {decided.filter((d) => d.tag === 'lesson-declined').length} declined.
        </p>
      )}
      {decided.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {decided.map((d) => (
            <li key={d.id} className="text-[0.6875rem] text-[#1A1815]" style={serif} data-testid="member-lesson-delivery" data-row-id={d.id} data-status={d.delivery?.status || 'none'}>
              {d.name}: {d.delivery?.line || 'No Message sent.'}
            </li>
          ))}
        </ul>
      )}
      {owed.length > 0 && (
        <div className="mt-2" data-testid="member-lesson-owed">
          <p className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">Messages owed from earlier</p>
          <ul className="space-y-0.5">
            {owed.map((d) => (
              <li key={`${d.id}-${d.kind}`} className="text-[0.6875rem] text-[#1A1815]" style={serif} data-testid="member-lesson-owed-row" data-row-id={d.id} data-kind={d.kind} data-status={d.status}>
                {d.name} ({d.kind === 'published' ? 'lesson published' : 'decision'}): {d.line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
