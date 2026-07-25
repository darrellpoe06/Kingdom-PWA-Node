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
  groupDmThreads, threadMessages, isSendableBody,
} from '../lib/direct-messages-sync.js';

const BTN = 'text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';

const fmtTime = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
};

// `roster` is an optional list of { userId, displayName } I may start a DM with
// (e.g. the bus drivers, the choir members). `title` labels the panel.
export default function DirectMessages({ roster = [], displayName = '', title = 'Direct messages' }) {
  const [signedIn, setSignedIn] = useState(false);
  const [rows, setRows] = useState([]);
  const [openWith, setOpenWith] = useState(null); // otherUserId
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => onAuthChange((s) => setSignedIn(!!s)), []);
  useEffect(() => {
    if (!signedIn) { setRows([]); return undefined; }
    return subscribeDirectMessages(setRows);
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
    markThreadRead(otherUserId);
  };

  const convo = useMemo(() => (openWith ? threadMessages(rows, openWith) : []), [rows, openWith]);
  useEffect(() => { try { endRef.current?.scrollIntoView({ block: 'end' }); } catch { /* noop */ } }, [convo.length, openWith]);

  const send = async () => {
    if (!isSendableBody(draft) || !openWith) return;
    setBusy(true);
    const r = await sendDirectMessage(openWith, draft, displayName);
    setBusy(false);
    if (r?.sent) { setDraft(''); setErr(''); markThreadRead(openWith); }
    else setErr(r?.skipped === 'send-blocked'
      ? 'Message not sent — you may not have a shared ministry with this person.'
      : `Message not sent (${r?.skipped || 'error'}). Try again.`);
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
            <p className="text-sm text-[#5A5751]">No conversations yet. Start one with someone on the roster below.</p>
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
            Sealed end-to-end once both of you have opened Messages on a device
            — keys live on your devices, never on the server.
          </p>
          <label className="block">
            <span className={LABEL}>Message {nameFor(openWith)}</span>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className={FIELD}
              placeholder="Words that edify (Ephesians 4:29)…"
            />
          </label>
          <div className="flex justify-end">
            <button type="button" disabled={busy || !isSendableBody(draft)} onClick={send} className={`${BTN} bg-[#B85838] text-white disabled:opacity-50`}>
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
