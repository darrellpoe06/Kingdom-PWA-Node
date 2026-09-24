// =============================================================================
// LessonInbox — "Your lessons": every lesson you sent from the app, where it
// stands, and the words Whisper wrote down (DR-0622)
// =============================================================================
// The loop the speaker could not see: a spoken lesson was "Sent" and then
// vanished into the NAS. Its transcript, its failure, and its hand-off to the
// lesson reader were all real rows (DR-0611 / DR-0614) that no screen read.
// This is that screen: the person's own rows only, each state read from the
// row's own tags, nothing inferred (lib/lesson-inbox.js).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { fetchMyLessons, transcriptWords } from '../lib/lesson-inbox.js';
import supabase from '../lib/supabase.js';
import LessonsForSituation from './LessonsForSituation.jsx';
import { lessonsForSituation } from '../lib/lessons-for-situation.js';

// A decline points to the lessons that already speak to it; when none is close
// enough, the pointer is dropped rather than said falsely.
function reviewLine(it) {
  if (it.review.state !== 'declined') return it.review.line;
  const words = it.spoken ? transcriptWords(it.words) : it.body;
  return lessonsForSituation(words).length ? it.review.line : it.review.line.replace(/ These lessons from the Word already speak to it\.$/, '');
}

const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };
const TONE = {
  waiting: 'text-[#8B6F47]',
  written: 'text-[#5A6E3D]',
  failed: 'text-[#B85838]',
  sent: 'text-[#2A5A8E]',
};
const LIVE = { supabase };

function when(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function LessonInbox({ deps = LIVE, refreshKey = 0 }) {
  const [state, setState] = useState({ ok: false, items: [], reason: 'loading' });
  const [open, setOpen] = useState({});
  const load = useCallback(() => { fetchMyLessons(deps).then(setState); }, [deps]);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (!state.ok && state.reason === 'signed-out') return null;
  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4" data-testid="lesson-inbox">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your lessons · {state.items.length}</h2>
        <button type="button" onClick={load} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#E8E4DC] text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">Refresh</button>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>
        Every lesson you sent from the app: when it arrived, whether Whisper has written a spoken one down, and the words it wrote. Each one is handed to the lesson reader, who builds it into the class.
      </p>
      {!state.ok && state.reason !== 'loading' && (
        <p className="text-[0.6875rem] text-[#B85838] mt-2" style={SERIF} data-testid="lesson-inbox-unavailable">Your lessons could not be read ({state.reason}).</p>
      )}
      {state.ok && state.items.length === 0 && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={SERIF}>No lesson sent from the app yet. Choose Lesson above, then speak or type it.</p>
      )}
      <ul className="mt-2 space-y-2">
        {state.items.map((it) => {
          const words = transcriptWords(it.words);
          return (
            <li key={it.id} data-testid="lesson-row" className="border border-[#E8E4DC] p-2">
              <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
                {when(it.createdAt)} · {it.spoken ? 'spoken' : 'typed'}
                {it.withReader ? ' · with the lesson reader' : ''}
              </p>
              <p className={`text-xs font-semibold ${TONE[it.state] || 'text-[#5A5751]'}`} style={SERIF} data-testid="lesson-state">{it.label}</p>
              {!it.spoken && <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words" style={SERIF}>{it.body.replace(/^Lesson\.\s*/, '')}</p>}
              {/* THE GOVERNOR'S REVIEW, SAID TO THE MEMBER (DR-0635). His own
                  lessons are read straight into the class; a member's waits for
                  his word, and the outcome is on their own row. */}
              {!state.owner && it.review && (
                <p className={`text-[0.75rem] mt-0.5 ${it.review.state === 'approved' ? 'text-[#5A6E3D] font-semibold' : 'text-[#1A1815]'}`} style={SERIF} data-testid="lesson-review">{reviewLine(it)}</p>
              )}
              {it.published && (
                /* PUBLISHED (DR-0639): the lesson written from their situation. */
                <p className="text-[0.75rem] mt-0.5 font-semibold text-[#5A6E3D]" style={SERIF} data-testid="lesson-published">
                  Published: {[it.published.number, it.published.title].filter(Boolean).join(' ') || it.published.lessonId}{' '}
                  <a href={it.published.href} className="underline text-[#B85838] hover:text-[#1A1815]" data-testid="lesson-published-link">→ open it</a>
                </p>
              )}
              {!state.owner && it.review && it.review.state === 'declined' && (
                <LessonsForSituation words={it.spoken ? transcriptWords(it.words) : it.body} />
              )}
              {it.state === 'failed' && it.why && <p className="text-[0.6875rem] text-[#1A1815] mt-0.5" style={SERIF}>{it.why}</p>}
              {words && (
                <>
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))} aria-expanded={!!open[it.id]} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                    {open[it.id] ? 'Hide the words' : 'Read the words Whisper wrote'}
                  </button>
                  {open[it.id] && <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF} data-testid="lesson-words">{words}</p>}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
