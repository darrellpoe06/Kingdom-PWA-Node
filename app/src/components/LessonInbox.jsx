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
// The words go back to the box on the same road Your prompts uses
// (USE_PROMPT_EVENT), to edit or send again: the loop closes (DR-0636).
import { sendPromptToBox } from '../lib/saved-prompts.js';
import supabase from '../lib/supabase.js';

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
              {it.state === 'failed' && it.why && <p className="text-[0.6875rem] text-[#1A1815] mt-0.5" style={SERIF} data-testid="lesson-why">{it.why}</p>}
              {it.state === 'failed' && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>The recording is kept on our own machine and is tried again by itself as soon as a Whisper computer answers.</p>}
              {words && (
                <>
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [it.id]: o[it.id] === false }))} aria-expanded={open[it.id] !== false} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                    {open[it.id] !== false ? 'Hide the words' : 'Read the words Whisper wrote'}
                  </button>
                  {open[it.id] !== false && <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF} data-testid="lesson-words">{words}</p>}
                  <button type="button" data-testid="lesson-words-to-box" onClick={() => sendPromptToBox(words)} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#5A6E3D] text-[#5A6E3D] mt-1 ml-1 focus:outline focus:outline-2 focus:outline-[#B85838]">Put these words in the box</button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
