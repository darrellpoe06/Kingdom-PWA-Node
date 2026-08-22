// =============================================================================
// DirectMessages — reusable 1:1 messaging panel (choir, bus, app-wide).
// =============================================================================
// Declared by Darrell 2026-07-12: users speak INDIVIDUALLY, inside a ministry
// and across the app. This panel renders MY threads (an inbox) + the open
// conversation + a compose box, and lets me start a new 1:1 with anyone on a
// roster I'm handed. The privacy MODEL is server-enforced (RLS + users_can_dm);
// a blocked send simply surfaces "couldn't send" — the panel never decides who
// may talk to whom.
//
// Word-first: 1:1 is the Word's own pattern — "go and tell him his fault between
// thee and him alone" (Matthew 18:15) — and every message is held to Ephesians
// 4:29 ("that which is good to the use of edifying").
//
// A11y: white cards, #1A1815 body / #5A5751 secondary, labelled inputs, visible
// #B85838 focus outline, aria-live on the thread.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthChange } from '../lib/supabase.js';
import {
  subscribeDirectMessages, sendDirectMessage, markThreadRead,
  groupDmThreads, threadMessages, isSendableBody, markThreadReadLocal,
} from '../lib/direct-messages-sync.js';
import { useVoiceDictation } from '../lib/voice-dictation.js';
import UiIcon from './UiIcon.jsx';

// Long inputs grow with the writer (Darrell 2026-07-27: "also long inputs"):
// the composer rises with its content up to a screen-friendly cap, then
// scrolls inside itself — a paragraph is as welcome as a sentence. The DB
// body is unbounded text, so the only limit was the two-row box.
const COMPOSER_MAX_PX = 320;
export function autoGrow(el, cap = COMPOSER_MAX_PX) {
  if (!el || !el.style) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight || 0, cap)}px`;
}

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
};

// `roster` is an optional list of { userId, displayName, instanceId } I may
// start a DM with (e.g. the bus drivers, the choir members). `invited` is an
// optional list of { inviteId, email } — people whose invite is out but who
// have not signed in yet, shown as visible-but-pending (0124), never hidden.
// `title` labels the panel.
export default function DirectMessages({ roster = [], invited = [], displayName = '', title = 'Direct messages' }) {
  const [signedIn, setSignedIn] = useState(false);
  const [rows, setRows] = useState([]);
  const [openWith, setOpenWith] = useState(null); // otherUserId
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const taRef = useRef(null);

  // Speak instead of type (Darrell 2026-07-27) — the one shared dictation
  // primitive (lib/voice-dictation.js: push-to-end through pauses, 5-minute
  // brake, honest type-instead fallback), finally adopted by Messages.
  const mic = useVoiceDictation({
    onTranscript: (t) => setDraft((d) => (d ? `${d} ${t}` : t)),
  });
  useEffect(() => { autoGrow(taRef.current); }, [draft]);

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  // The subscription handle carries .refresh() — pulled the instant the user
  // acts (open, send) so the thread never waits on the realtime stream or the
  // heartbeat (measured 2026-08-22: both readers had to leave and re-enter to
  // see new messages while the sovereign realtime leg was sick).
  const subRef = useRef(null);
  useEffect(() => {
    if (!signedIn) { setRows([]); return undefined; }
    const sub = subscribeDirectMessages(setRows);
    subRef.current = sub;
    return () => { subRef.current = null; sub(); };
  }, [signedIn]);

  const threads = useMemo(() => groupDmThreads(rows), [rows]);

  // Roster people I don't yet have a thread with — so I can start fresh.
  const startable = useMemo(() => {
    const known = new Set(threads.map((t) => t.otherUserId));
    return (roster || []).filter((p) => p && p.userId && !known.has(p.userId));
  }, [roster, threads]);

  const nameFor = (otherUserId) => {
    const t = threads.find((x) => x.otherUserId === otherUserId);
    if (t && t.otherName) return t.otherName;
    const r = (roster || []).find((p) => p.userId === otherUserId);
    return r?.displayName || 'Member';
  };

  const openThread = (otherUserId) => {
    setOpenWith(otherUserId);
    setErr('');
    // Viewed = read, INSTANTLY: clear the badge locally the moment the reader
    // looks (Darrell 2026-08-22: "once I view the message I should not have it
    // look like I didn't view it yet"), persist server-side, and pull fresh.
    setRows((prev) => markThreadReadLocal(prev, otherUserId));
    markThreadRead(otherUserId).then(() => subRef.current?.refresh?.());
  };

  const convo = useMemo(() => (openWith ? threadMessages(rows, openWith) : []), [rows, openWith]);
  useEffect(() => { try { endRef.current?.scrollIntoView({ block: 'end' }); } catch { /* noop */ } }, [convo.length, openWith]);

  // A message that arrives WHILE the thread is open is read the moment it
  // renders — never a stale badge for a conversation the reader is inside.
  useEffect(() => {
    if (!openWith) return;
    if (convo.some((m) => m && !m.mine && !m.readAt)) {
      setRows((prev) => markThreadReadLocal(prev, openWith));
      markThreadRead(openWith);
    }
  }, [convo, openWith]);

  const send = async () => {
    if (!isSendableBody(draft) || !openWith) return;
    const text = draft;
    setBusy(true);
    const contact = (roster || []).find((p) => p && p.userId === openWith);
    const r = await sendDirectMessage(openWith, text, displayName, contact?.instanceId);
    setBusy(false);
    if (r?.sent) {
      setDraft('');
      setErr('');
      // The message shows in the thread IMMEDIATELY (optimistic row), then the
      // refresh replaces it with the server's truth — no waiting on realtime.
      const nowIso = new Date().toISOString();
      setRows((prev) => [...prev, {
        id: `local-${nowIso}`, otherUserId: openWith, mine: true, body: text,
        createdAt: nowIso, readAt: null, encrypted: !!r.encrypted, locked: false, senderName: displayName || '',
      }]);
      markThreadRead(openWith);
      subRef.current?.refresh?.();
      try { taRef.current?.focus(); } catch { /* noop */ }
    } else {
      setErr(r?.skipped === 'send-blocked'
        ? 'Message not sent — you may not have a shared ministry with this person.'
        : `Message not sent (${r?.skipped || 'error'}). Your words are still in the box — try again.`);
    }
  };

  if (!signedIn) {
    return <p className="text-sm text-[#5A5751]">Sign in to send a direct message.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-sm font-medium text-[#1A1815]">{title}</h4>
        {openWith && <button type="button" onClick={() => setOpenWith(null)} className={`${BTN} text-[#5A5751] hover:text-[#1A1815]`}>← Inbox</button>}
      </div>

      {err && <p className="text-xs text-[#991B1B]" role="alert">{err}</p>}

      {!openWith ? (
        <div className="space-y-2">
          {threads.length === 0 && startable.length === 0 && (
            <p className="text-sm text-[#5A5751]">
              {invited.length > 0
                ? 'No conversations yet — your invited people appear below and become startable the first time they sign in.'
                : 'No conversations yet. People you can message appear here once you share a space — add someone below with their email.'}
            </p>
          )}
          {threads.map((t) => (
            <button
              key={t.otherUserId}
              type="button"
              onClick={() => openThread(t.otherUserId)}
              className="w-full text-left border border-[#E8E4DC] bg-white p-3 hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-[#1A1815]">{nameFor(t.otherUserId)}</span>
                <span className="text-[0.625rem] text-[#5A5751]">{fmtTime(t.lastAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#5A5751] truncate">{t.last?.body || ''}</span>
                {t.unread > 0 && <span className="text-[0.625rem] px-1.5 py-0.5 bg-[#B85838] text-white rounded-full">{t.unread}</span>}
              </div>
            </button>
          ))}
          {startable.length > 0 && (
            <div className="pt-2">
              <span className={LABEL}>Start a message</span>
              <div className="flex flex-wrap gap-1.5">
                {startable.map((p) => (
                  <button key={p.userId} type="button" onClick={() => openThread(p.userId)} className={`${BTN} border border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815] hover:border-[#1A1815]`}>
                    {p.displayName}
                  </button>
                ))}
              </div>
            </div>
          )}
          {invited.length > 0 && (
            <div className="pt-2">
              <span className={LABEL}>Invited — waiting for their first sign-in</span>
              <div className="flex flex-wrap gap-1.5">
                {invited.map((p) => (
                  <span key={p.inviteId} title="Their invite is out. They become messageable the first time they sign in with this email." className={`${BTN} border border-dashed border-[#C9BFA8] text-[#5A5751] cursor-default inline-flex items-center`}>
                    {p.email} · pending
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-3 max-h-72 overflow-y-auto space-y-2" aria-live="polite">
            {convo.length === 0 && <p className="text-xs text-[#5A5751]">No messages yet — say hello.</p>}
            {convo.map((m) => (
              <div key={m.id} className={`text-sm ${m.mine ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-1.5 max-w-[85%] ${m.locked ? 'italic text-[#5A5751] bg-white border border-dashed border-[#C9BFA8]' : m.mine ? 'bg-[#1A1815] text-white' : 'bg-white border border-[#E8E4DC] text-[#1A1815]'}`}>
                  {m.body}
                </div>
                <div className="text-[0.5625rem] text-[#5A5751] mt-0.5">
                  {fmtTime(m.createdAt)}
                  {/* Honest per-message state: sealed end-to-end vs legacy plaintext. */}
                  {m.encrypted ? ' · encrypted' : ''}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <p className="text-[0.625rem] text-[#5A5751]">
            Sealed end-to-end once both of you have signed in on a device —
            keys live on your devices, never on the server.
          </p>
          <label className="block">
            <span className={LABEL}>Message {nameFor(openWith)}</span>
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // The messenger feel (Darrell 2026-08-22: "make it flow better"):
                // Enter sends, Shift+Enter makes a new line — long-form still
                // welcome via Shift+Enter or Speak.
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              rows={2}
              className={`${FIELD} overflow-y-auto`}
              placeholder="Words that edify (Ephesians 4:29)… Enter sends · Shift+Enter for a new line"
            />
          </label>
          {mic.error && <p className="text-[0.625rem] text-[#B85838]" role="status">{mic.error}</p>}
          <div className="flex items-center justify-between gap-2">
            {mic.supported ? (
              <button
                type="button"
                onClick={mic.toggle}
                aria-pressed={mic.listening}
                aria-label={mic.listening ? 'Stop voice input' : 'Speak your message instead of typing'}
                className={`${BTN} border-2 ${mic.listening ? 'bg-[#B85838] text-white border-[#B85838]' : 'border-[#1A1815] text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white'}`}
              >
                {mic.listening ? <><UiIcon name="stop" /> Stop</> : <><UiIcon name="mic" /> Speak</>}
              </button>
            ) : <span />}
            <button type="button" disabled={busy || !isSendableBody(draft)} onClick={send} className={`${BTN} bg-[#B85838] text-white disabled:opacity-50`}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
