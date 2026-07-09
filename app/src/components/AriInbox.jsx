// =============================================================================
// AriInbox — Talk to Ari: start a thread in the app, on the bus, Ari answers
// =============================================================================
// The human <-> Ari channel Darrell asked for (2026-07-08). HONEST by design
// (surface-premise-conflicts): this is NOT a live pipe to a Claude session — it is
// a thread on the DR-0088 bus that the router answers (local qwen default, Claude
// when earned). Every thread carries its OPPORTUNITIES + CONSTRAINTS (Darrell's
// standing instruction). Ari's responsibilities are shown where you meet him.
//
// This pass ships the real PROCESS surface + compose flow. The LIVE persistence
// (Supabase ari_threads/ari_messages) + Ari's router reply are the DR-0088
// executor (next pass) — so a composed thread shows "awaiting the live bus" rather
// than faking a persisted conversation or a canned reply (no static data).
// =============================================================================
import React, { useState } from 'react';
import { KpiDot } from './KpiDot.jsx';
import UiIcon from './UiIcon.jsx';
import { ARI } from '../lib/ari.js';
import {
  ROUTE_TARGETS, ARI_RESPONSIBILITIES,
  makeThread, makeMessage, validateThread, validateMessage,
  routeLabel, statusTone, statusLabel,
} from '../lib/ari-inbox.js';

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };
const chip = 'inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] border border-[#C9C2B6] bg-[#FAF8F4] text-[#1A1815]';
const inputCls = 'w-full border border-[#C9C2B6] bg-[#FAF8F4] px-2.5 py-1.5 text-sm text-[#1A1815]';

// Parse "one per line" text into a trimmed list (opportunities / constraints).
function lines(text) {
  return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
}

export default function AriInbox() {
  const [subject, setSubject] = useState('');
  const [route, setRoute] = useState('auto');
  const [body, setBody] = useState('');
  const [opps, setOpps] = useState('');
  const [cons, setCons] = useState('');
  const [threads, setThreads] = useState([]); // pre-live: composed this session, honestly flagged
  const [err, setErr] = useState('');

  function start() {
    const thread = makeThread({
      subject, routeTarget: route,
      opportunities: lines(opps).map((t) => ({ text: t })),
      constraints: lines(cons).map((t) => ({ text: t })),
    });
    const msg = makeMessage({ from: 'you', body });
    const tv = validateThread(thread);
    const mv = validateMessage(msg);
    if (!tv.ok || !mv.ok) { setErr([...tv.errors, ...mv.errors].join(' · ')); return; }
    setErr('');
    setThreads((prev) => [{ thread, message: msg }, ...prev]);
    setSubject(''); setBody(''); setOpps(''); setCons(''); setRoute('auto');
  }

  return (
    <div className="space-y-5">
      {/* Who you are talking to */}
      <header className={card}>
        <div className="flex items-center gap-2">
          <span className="text-[#B85838]" aria-hidden="true"><UiIcon name="volume" /></span>
          <h2 className="text-lg sm:text-xl text-[#1A1815]" style={serif}>Talk to {ARI.name}</h2>
        </div>
        <p className="mt-1 text-sm text-[#5A5751]">{ARI.oneLine}</p>
        <p className="mt-2 text-[0.75rem] text-[#B85838]">{ARI.honesty}</p>
        <p className="mt-2 text-[0.75rem] text-[#5A5751]">
          Start a thread here and it goes on the bus — {ARI.name} answers via the router (sovereign local A.I. by
          default; Claude only when the task earns it). This is a durable channel to the A.I., not a live pipe to one
          session. Live persistence + {ARI.name}'s reply are being wired (DR-0088) — a thread you start now is held as a
          draft, not yet answered.
        </p>
      </header>

      {/* Ari's responsibility — stated where you meet him */}
      <section className={card}>
        <div className={labelCls}>{ARI.name}'s responsibility on this channel</div>
        <ul className="mt-2 space-y-1 text-[0.75rem] text-[#5A5751]">
          {ARI_RESPONSIBILITIES.map((r) => (
            <li key={r} className="flex gap-2"><span className="text-[#B85838]" aria-hidden="true">·</span>{r}</li>
          ))}
        </ul>
      </section>

      {/* Start a thread */}
      <section className={card}>
        <h3 className="text-sm text-[#1A1815]" style={serif}>Start a thread</h3>
        <div className="mt-3 space-y-3">
          <div>
            <label className={labelCls} htmlFor="ari-subject">Subject</label>
            <input id="ari-subject" className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What do you want to talk through?" />
          </div>
          <div>
            <label className={labelCls} htmlFor="ari-route">Who answers</label>
            <select id="ari-route" className={inputCls} value={route} onChange={(e) => setRoute(e.target.value)}>
              {ROUTE_TARGETS.map((r) => <option key={r.id} value={r.id}>{r.label} — {r.hint}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="ari-body">Your message</label>
            <textarea id="ari-body" className={inputCls} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ari-opps">Opportunities (one per line)</label>
              <textarea id="ari-opps" className={inputCls} rows={3} value={opps} onChange={(e) => setOpps(e.target.value)} placeholder="What could this unlock?" />
            </div>
            <div>
              <label className={labelCls} htmlFor="ari-cons">Constraints (one per line)</label>
              <textarea id="ari-cons" className={inputCls} rows={3} value={cons} onChange={(e) => setCons(e.target.value)} placeholder="What limits or risks apply?" />
            </div>
          </div>
          {err && <p className="text-[0.75rem] text-[#B85838]">{err}</p>}
          <button type="button" onClick={start} className="border border-[#1A1815] bg-[#1A1815] text-white px-4 py-1.5 text-sm">
            Send to {ARI.name}
          </button>
        </div>
      </section>

      {/* Threads composed this session — honestly flagged pre-live */}
      {threads.length > 0 && (
        <section className={card}>
          <div className={labelCls}>Your threads (awaiting the live bus)</div>
          <div className="mt-2 space-y-2">
            {threads.map(({ thread, message }) => (
              <div key={thread.id} className="border border-[#E8E4DC] p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-[#1A1815]" style={serif}>{thread.subject}</span>
                  <span className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
                    <KpiDot status={statusTone(thread.status)} /> {statusLabel(thread.status)}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] text-[#1A1815]">{message.body}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={chip}>routes to: {routeLabel(thread.routeTarget)}</span>
                  {thread.opportunities.length > 0 && <span className={chip}>{thread.opportunities.length} opportunity(ies)</span>}
                  {thread.constraints.length > 0 && <span className={chip}>{thread.constraints.length} constraint(s)</span>}
                </div>
                <p className="mt-2 text-[0.6875rem] text-[#B85838]">Awaiting {ARI.name} — the router reply lands here once the live loop (DR-0088) is armed.</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
