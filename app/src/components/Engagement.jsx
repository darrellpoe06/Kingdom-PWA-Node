// =============================================================================
// Engagement - the in-app Engagement wedge: a daily Trivia loop + a basic
// two-way message thread, both on the existing Supabase feedback/realtime
// pattern (RLS-scoped per instance; INSERT-streamed via postgres_changes).
//
// Trivia questions are seeded here as NON-SENSITIVE demo content (the DB only
// stores answers, never the prompts). The message thread is bound to
// subscribeMessages() so every signed-in family member sees the same lane live.
//
// Accessibility: white cards / #1A1815 body text (>= 16:1), #5A5751 secondary
// (~7:1), green #166534 + red #991B1B verdicts (>= 6:1), all interactive
// elements keyboard-reachable with a visible #B85838 focus outline, labelled
// inputs, and aria-live regions for the verdict + the live thread.
// =============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { onAuthChange } from '../lib/supabase.js';
import { uploadTriviaAnswer, sendMessage, subscribeMessages } from '../lib/engagement-sync.js';

// -----------------------------------------------------------------------------
// Featured trivia + sermon anchor. This is a FIXED anchor set from a specific
// message (John 18 / I Peter 5), NOT freshly-generated daily content — so the UI
// shows its real date and does not claim "today" (Darrell 2026-06-15: reports must
// be real, never painted freshness). Fresh daily questions begin when the church
// inbox pipeline is connected (BG's weekly message → extract → LIVE BY DEFAULT —
// these are BG's OWN questions, so there is no human-approval gate; only a
// verifiable extraction-fidelity check stands between the message and the card,
// per engagement-sync.checkQuestionFidelity). That pipeline is blocked on
// Christina's one-time Gmail OAuth, the same consent that opens the banking
// import. Until then this anchor set is honest about being an anchor set.
// -----------------------------------------------------------------------------
const ANCHOR_ISO = '2026-06-10';
const TODAY_ISO = ANCHOR_ISO; // kept so the question ids below stay stable

const SERMON_ANCHOR = {
  reference: 'I Peter 5',
  title: 'Let Go and Let God Help You',
};

/** Honest, human-readable date for the trivia anchor (UTC, no "today" claim). */
function fmtAnchor(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Date(t).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Normalize a free-text answer for forgiving comparison. */
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const TRIVIA = [
  {
    id: `john18-${TODAY_ISO}-q1`,
    prompt: 'What was the name of the servant whose ear Peter cut off?',
    scripture: 'John 18:10',
    placeholder: 'Type the name...',
    accept: (n) => n.includes('malchus'),
    answerLabel: 'Malchus (John 18:10).',
  },
  {
    id: `john18-${TODAY_ISO}-q2`,
    prompt: 'What did Jesus tell Peter to do?',
    scripture: 'John 18:11',
    placeholder: 'In your own words...',
    accept: (n) =>
      n.includes('sword') || n.includes('sheath') || (n.includes('put') && n.includes('away')),
    answerLabel:
      'Put the sword away (John 18:11). Jesus then healed the servant’s ear (Luke 22:51).',
  },
];

// -----------------------------------------------------------------------------
// Trivia card
// -----------------------------------------------------------------------------
function TriviaCard({ signedIn }) {
  // answers: { [questionId]: { text, correct } }
  const [answers, setAnswers] = useState({});
  const [drafts, setDrafts] = useState({});

  function setDraft(id, text) {
    setDrafts((d) => ({ ...d, [id]: text }));
  }

  async function submit(q) {
    const text = (drafts[q.id] || '').trim();
    if (!text) return;
    const correct = q.accept(normalize(text));
    setAnswers((a) => ({ ...a, [q.id]: { text, correct } }));
    // Best-effort write; no-ops cleanly when signed out.
    uploadTriviaAnswer({ questionId: q.id, answer: text, isCorrect: correct });
  }

  return (
    <section aria-labelledby="trivia-heading" className="bg-white border border-[#1A1815] p-5 mb-6">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">
        Featured Trivia &middot; {SERMON_ANCHOR.reference}
      </div>
      <h3
        id="trivia-heading"
        className="text-xl mb-1"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
      >
        {SERMON_ANCHOR.title}
      </h3>
      <p className="text-xs text-[#5A5751] mb-1" style={{ fontFamily: '"Fraunces", serif' }}>
        Two questions from the garden arrest &mdash; John 18. Answer below.
      </p>
      <p className="text-[0.6875rem] text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
        From the message of {fmtAnchor(ANCHOR_ISO)}. Fresh questions will follow the
        pastor&rsquo;s weekly message once the church inbox is connected.
      </p>

      <ol className="space-y-5">
        {TRIVIA.map((q, i) => {
          const result = answers[q.id];
          const inputId = `trivia-${q.id}`;
          return (
            <li key={q.id}>
              <label
                htmlFor={inputId}
                className="block text-sm mb-2"
                style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}
              >
                <span className="text-[#5A5751] mr-1">{i + 1}.</span>
                {q.prompt}{' '}
                <span className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
                  ({q.scripture})
                </span>
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(q);
                }}
                className="flex gap-2 flex-wrap"
              >
                <input
                  id={inputId}
                  type="text"
                  value={drafts[q.id] || ''}
                  onChange={(e) => setDraft(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  autoComplete="off"
                  className="flex-grow min-w-[180px] border border-[#1A1815] px-3 py-2 text-sm text-[#1A1815] placeholder-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838]"
                />
                <button
                  type="submit"
                  className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
                >
                  {result ? 'Resubmit' : 'Submit'}
                </button>
              </form>

              {result && (
                <div role="status" className="mt-2 text-sm" style={{ fontFamily: '"Fraunces", serif' }}>
                  {result.correct ? (
                    <p className="text-[#166534] font-semibold">
                      &#10003; Correct &mdash; {q.answerLabel}
                    </p>
                  ) : (
                    <p className="text-[#991B1B] font-semibold">
                      Not quite. The answer is {q.answerLabel}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!signedIn && (
        <p className="mt-4 text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          You can play now &mdash; sign in (top of the page) to save your answers across devices.
        </p>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Live message thread
// -----------------------------------------------------------------------------
function MessageThread({ signedIn }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!signedIn) {
      setMessages([]);
      return undefined;
    }
    const unsubscribe = subscribeMessages((items) => setMessages(items));
    return unsubscribe;
  }, [signedIn]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const result = await sendMessage(text);
    // Clear the draft ONLY on a real upload. The old `|| result?.skipped`
    // branch also cleared on insert-error/no-church, silently swallowing the
    // person's words (2026-07-03 claims audit). A signed-out skip keeps the
    // draft too — the sign-in note below the box already explains why.
    if (result?.uploaded) { setDraft(''); setSendError(null); }
    else setSendError(result?.skipped === 'signed-out'
      ? 'Sign in with your church account to send — your message is still here.'
      : `Could not send (${result?.skipped || 'error'}) — your message is still here.`);
    setSending(false);
  }

  return (
    <section aria-labelledby="thread-heading" className="bg-white border border-[#1A1815] p-5">
      <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">
        Church Family Thread &middot; Live
      </div>
      <h3
        id="thread-heading"
        className="text-xl mb-3"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
      >
        Two-way messages
      </h3>

      {!signedIn ? (
        <p className="text-sm text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Sign in (top of the page) to read and post in the live family thread.
        </p>
      ) : (
        <>
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Message thread"
            className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 mb-3 max-h-72 overflow-y-auto space-y-2"
          >
            {messages.length === 0 ? (
              <p className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
                No messages yet. Say hello &mdash; everyone signed in will see it live.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span
                    className="font-semibold text-[#1A1815]"
                    style={{ fontFamily: '"Fraunces", serif' }}
                  >
                    {m.displayName}
                    {m.mine && (
                      <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-1">
                        (you)
                      </span>
                    )}
                  </span>
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] ml-2">
                    {formatTime(m.createdAt)}
                  </span>
                  <p className="text-[#1A1815] break-words" style={{ fontFamily: '"Fraunces", serif' }}>
                    {m.body}
                  </p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 flex-wrap">
            <label htmlFor="thread-input" className="sr-only">
              Message to the family thread
            </label>
            <input
              id="thread-input"
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message..."
              autoComplete="off"
              disabled={sending}
              className="flex-grow min-w-[180px] border border-[#1A1815] px-3 py-2 text-sm text-[#1A1815] placeholder-[#5A5751] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
          {sendError && (
            <p role="status" className="mt-2 text-[0.6875rem] text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{sendError}</p>
          )}
        </>
      )}
    </section>
  );
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

// -----------------------------------------------------------------------------
// Surface
// -----------------------------------------------------------------------------
export default function Engagement() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);

  return (
    <div className="w-full">
      <SectionTitle eyebrow="Church · daily">Engagement</SectionTitle>
      <TriviaCard signedIn={signedIn} />
      <MessageThread signedIn={signedIn} />
    </div>
  );
}
