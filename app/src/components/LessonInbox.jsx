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
import { fetchMyLessons, transcriptWords, speakerLines, transcriptSpeakers } from '../lib/lesson-inbox.js';
// The words go back to the box on the same road Your prompts uses
// (USE_PROMPT_EVENT), to edit or send again: the loop closes (DR-0636).
import { sendPromptToBox } from '../lib/saved-prompts.js';
import supabase from '../lib/supabase.js';
import LessonsForSituation from './LessonsForSituation.jsx';
import { lessonsForSituation } from '../lib/lessons-for-situation.js';
// DR-0672: each lesson's road, arrival to live, and (for the Governor) every
// writer's version side by side. PR state reuses the OpsBoard's GitHub reads.
import { deriveLessonPipeline, fetchLessonPrs, lessonPrOf, buildLessonNumberOf, branchPrefixForLesson } from '../lib/lesson-pipeline.js';
import { fetchOps, fetchDeliveryRecord, fetchPull } from '../lib/github-ops.js';
import { mayCompareVersions } from '../lib/lesson-versions.js';
import { fetchReviewQueue } from '../lib/lesson-decisions.js';
import LessonRoad from './LessonRoad.jsx';
import LessonVersionsCompare from './LessonVersionsCompare.jsx';
// DR-0728: opening this screen is looking. Every lesson arrival (ready, decided,
// published) is marked seen here, so the icon and the bell drop their number.
import { markArrivalsSeen, SCREEN_KINDS } from '../lib/arrivals.js';

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
const LIVE = {
  supabase,
  github: { fetchOps, fetchDeliveryRecord, getPull: (n) => fetchPull(n) },
};

// WHO SPOKE (DR-0712): a transcript marked by voice reads as turns, the
// label in bold beside each; an unmarked one reads as the words, as before.
export function TranscriptWords({ words, speakers }) {
  const turns = speakerLines(words);
  if (!turns) return <p className="text-sm text-[#1A1815] whitespace-pre-wrap break-words mt-1" style={SERIF} data-testid="lesson-words">{words}</p>;
  return (
    <div className="mt-1" data-testid="lesson-words">
      {speakers && <p className="text-[0.625rem] text-[#5A5751]" style={MONO} data-testid="lesson-speakers">{speakers}</p>}
      {turns.map((t, i) => (
        <p key={i} className="text-sm text-[#1A1815] break-words mt-0.5" style={SERIF} data-testid="lesson-turn">
          <b className="text-[#2A5A8E]" style={MONO}>{t.who}</b> {t.text}
        </p>
      ))}
    </div>
  );
}

function when(iso) {
  const t = Date.parse(iso || '');
  return Number.isFinite(t) ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export default function LessonInbox({ deps = LIVE, refreshKey = 0 }) {
  const [state, setState] = useState({ ok: false, items: [], reason: 'loading' });
  const [open, setOpen] = useState({});
  const [prs, setPrs] = useState({ prs: {}, read: 'ok' });
  const [versions, setVersions] = useState({ state: 'idle', teachings: [], reason: '' });
  const [comparing, setComparing] = useState({});
  const load = useCallback(() => {
    fetchMyLessons(deps).then((res) => {
      setState(res);
      if (!res.ok) return;
      markArrivalsSeen(SCREEN_KINDS['your-lessons']);
      // GitHub is read only when a lesson names its PR (the 60/hr budget).
      const numbers = res.items.map((it) => lessonPrOf(it.progressTags || [])).filter(Boolean);
      // The NAS builder names its lesson number; its branch is claude/lesson-l<n>-<slug> (DR-0669).
      const branchPrefixes = res.items.map((it) => buildLessonNumberOf(it.progressTags || [])).filter(Boolean).map(branchPrefixForLesson);
      if ((numbers.length || branchPrefixes.length) && deps.github) fetchLessonPrs(numbers, { ...deps.github, branchPrefixes }).then(setPrs);
      if (mayCompareVersions({ uid: res.uid, email: res.email })) {
        fetchReviewQueue({ supabase: deps.supabase, uid: res.uid, email: res.email }).then(setVersions);
      }
    });
  }, [deps]);
  useEffect(() => { load(); }, [load, refreshKey]);
  const governor = state.ok && mayCompareVersions({ uid: state.uid, email: state.email });

  if (!state.ok && state.reason === 'signed-out') return null;
  return (
    <section id="your-lessons" className="bg-white border border-[#E8E4DC] p-3 sm:p-4" data-testid="lesson-inbox">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold">Your lessons · {state.items.length}</h2>
        <button type="button" onClick={load} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#E8E4DC] text-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]">Refresh</button>
      </div>
      <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>
        Every lesson you sent from the app, from arrival to live: when it arrived, when its words came, when it was built, its PR, and when it went live, with how long each step took. A step nothing has reported yet says so.
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
          const road = deriveLessonPipeline(it, { prs: prs.prs, prRead: prs.read, owner: !!state.owner });
          const teaching = governor ? (versions.teachings || []).find((t) => t.teachingRowId === it.id || (it.transcriptId && t.teachingRowId === it.transcriptId)) : null;
          const mine = teaching ? teaching.versions : [];
          return (
            <li key={it.id} data-testid="lesson-row" className="border border-[#E8E4DC] p-2">
              <p className="text-[0.625rem] text-[#5A5751]" style={MONO}>
                {when(it.createdAt)} · {it.spoken ? 'spoken' : 'typed'}
                {it.withReader ? ' · with the lesson reader' : ''}
              </p>
              <p className={`text-xs font-semibold ${TONE[it.state] || 'text-[#5A5751]'}`} style={SERIF} data-testid="lesson-state">{it.label}</p>
              <LessonRoad road={road} />
              {/* COMPARE (DR-0672 over DR-0669): every writer's version of this
                  lesson from the same prompt. The Governor only. */}
              {governor && versions.state !== 'idle' && (
                <>
                  <button type="button" data-testid="lesson-compare-toggle" aria-expanded={!!comparing[it.id]} onClick={() => setComparing((c) => ({ ...c, [it.id]: !c[it.id] }))} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#2A5A8E] text-[#2A5A8E] mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                    {comparing[it.id] ? 'Hide the versions' : `Compare versions${mine.length ? ` · ${mine.length}` : ''}`}
                  </button>
                  {comparing[it.id] && (
                    <LessonVersionsCompare
                      versions={mine}
                      state={versions.state}
                      reason={versions.reason}
                      decide={teaching && mine.length > 1 ? { review: teaching, deps: { supabase: deps.supabase, uid: state.uid, email: state.email }, onPublished: load } : null}
                    />
                  )}
                </>
              )}
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
              {it.state === 'failed' && it.why && <p className="text-[0.6875rem] text-[#1A1815] mt-0.5" style={SERIF} data-testid="lesson-why">{it.why}</p>}
              {it.state === 'failed' && <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={SERIF}>The recording is kept on our own machine and is tried again by itself as soon as a Whisper computer answers.</p>}
              {words && (
                <>
                  <button type="button" onClick={() => setOpen((o) => ({ ...o, [it.id]: o[it.id] === false }))} aria-expanded={open[it.id] !== false} className="text-[0.625rem] uppercase tracking-wider px-2 min-h-[44px] border border-[#1A1815] text-[#1A1815] mt-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
                    {open[it.id] !== false ? 'Hide the words' : 'Read the words Whisper wrote'}
                  </button>
                  {open[it.id] !== false && <TranscriptWords words={words} speakers={transcriptSpeakers(it.words)} />}
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
