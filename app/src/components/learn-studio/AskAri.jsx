// =============================================================================
// AskAri -- Ari, the church's own A.I. tutor, inside the new lesson screen (DR-1674)
// =============================================================================
// Darrell 2026-11-26: "I'm finding everything... where's the Ai's!!!!!! Ari...
// claude..." The classic lesson guide (ChurchLearn TutorPanel) has carried "Ask
// Ari about this lesson" since the class tutor shipped; the new lesson screen
// never did. This is the same tutor, not a new one: the same askTutor
// (lib/class-tutor.js, the family NAS's own model on the same-origin /llm path,
// no vendor from the client), the same "test what it tells you" line, and the
// same honest fallback when the NAS is not reachable -- never a made-up answer.
// =============================================================================
import React, { useRef, useState } from 'react';
import { askTutor } from '../../lib/class-tutor.js';
import { ARI } from '../../lib/ari.js';

const RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function AskAri({ lesson, ask = askTutor }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const live = useRef(null);
  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setOffline(false);
    const res = await ask(lesson, next, {});
    setBusy(false);
    if (res && res.ok) setMessages((m) => [...m, { role: 'assistant', content: res.reply, source: res.source }]);
    else setOffline(true);
  };
  const id = `le-ari-${lesson.id}`;
  return (
    <div className="le-ari" data-read-skip="" data-testid="le-ask-ari">
      {messages.length > 0 && (
        <div className="le-ari-thread" aria-live="polite" ref={live}>
          {messages.map((m, i) => (
            <p key={i} className={`le-ari-msg le-ari-msg--${m.role}`}>
              {m.content}
              {m.role === 'assistant' && <span className="le-ari-tag">{ARI.name} · the church's own tutor · test what it tells you</span>}
            </p>
          ))}
        </div>
      )}
      {offline && (
        <p className="le-ari-offline" aria-live="polite" data-testid="le-ari-offline">
          {ARI.name} isn't connected right now. You can still work this lesson on your own: the Scripture Focus, Key Takeaways and Reflection Questions below
          are all here. Try {ARI.name} again in a little while.
        </p>
      )}
      <label htmlFor={id} className="le-notes-label">
        Ask {ARI.name} anything about this lesson
      </label>
      <div className="le-ari-row">
        <textarea
          id={id}
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={`Ask ${ARI.name} about this lesson…`}
          className={`le-notes ${RING}`}
        />
        <button type="button" className={`le-ari-send ${RING}`} onClick={send} disabled={busy || !draft.trim()} data-testid="le-ari-send">
          {busy ? '…' : 'Ask'}
        </button>
      </div>
      <p className="le-ari-honesty">{ARI.honesty}</p>
    </div>
  );
}
