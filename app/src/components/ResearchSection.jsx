// =============================================================================
// ResearchSection — the Research section of the app (DR-1169)
// =============================================================================
// Darrell sent a video link on 2026-10-21 and I said I would read it in a
// sandbox. He answered: "Research section of the app?!!!!!!" and "Make that
// automation from my prompts...". Until this file the ONLY place the research
// road surfaced was a one-question ask box buried inside "Open-source tools,
// weighed" on the Infra Plan (OpenSourceCandidates.jsx:137) — a panel a person
// reaches through Church > Infra Plan, behind the church-staff gate. That is
// what the six exclamation marks were about.
//
// WHAT IT READS AND WRITES, all real rows (DR-0061):
//   WRITES  agent_inbox, one row tagged `research`, via relayThought (the same
//           writer the lessons use) — that insert IS the send; nothing else is
//           asked of him.
//   READS   his own agent_inbox rows tagged research / research-answer /
//           research-failed, paired by lib/research-items.js, newest first.
//   READS   /research/health, live, for whether the road can answer at all —
//           never a painted status (lib/research.js).
//
// EVERY ITEM SAYS IT IS UNVERIFIED, IN WORDS. Not a badge, not a color: the
// sentence is printed on every answered item and the item's `verified` is a
// constant false in research-items.js, so no row and no later edit can present
// a research answer as established fact (DR-0076, DR-1101).
//
// AND IT SAYS SO ABOUT ITSELF: a row that has not been answered reads "Waiting
// to be looked into", never a spinner that could pass for progress. A read that
// FAILS says it failed; it never draws an empty list that reads like "you have
// sent nothing" (DR-0076 — unknown is not a no).
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { fetchMyResearch, UNVERIFIED_NOTE } from '../lib/research-items.js';
import { researchHealth } from '../lib/research.js';
import { relayThought } from '../lib/agent-inbox-sync.js';
import { supabase } from '../lib/supabase.js';
import ResearchTry from './ResearchTry.jsx';

const card = 'bg-white border border-[#E8E4DC] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const serif = { fontFamily: '"Fraunces", serif' };

// THE UNVERIFIED SENTENCE IS INK, AND RUST IS ONLY THE RULE BESIDE IT.
// MEASURED 2026-10-21: #B85838 is 4.68 on pure white but 4.19-4.41 on the
// themed card backgrounds (heritage/cream #FAF8F4, apple white, slate,
// sapphire, rose) -- below AA for normal text, which is why contrast-guard
// carries it as a dated allowlist entry rather than a pass. The most important
// sentence on this surface must not ride a sub-AA color, so it is ink
// (#1A1815: 15.88-17.72 on those same backgrounds) and the rust earns its
// prominence as a left RULE instead. The same move the TLC palette made with
// champagne: a rule and a fill, never text.
// (DR-0099: true red is the Blood of Jesus and marks nothing else. Rust is not
// red, and nothing here is marked sacred.)
const noteCls = 'border-l-2 border-[#B85838] pl-2 text-[0.6875rem] text-[#1A1815]';

// The state words carry a color, and none of them is true red.
const STATE_COLOR = Object.freeze({
  waiting: 'text-[#5A5751]',
  working: 'text-[#1A1815]',
  answered: 'text-[#1A1815]',
  failed: 'text-[#1A1815]',
});

function Item({ item }) {
  return (
    <li className="border border-[#E8E4DC] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={`${labelCls} ${STATE_COLOR[item.state]}`}>{item.label}</span>
        <span className="text-[0.6875rem] text-[#5A5751]">
          {item.kind === 'link' ? 'A link you sent' : 'A question you asked'}
          {item.createdAt ? ` · ${String(item.createdAt).slice(0, 16).replace('T', ' ')}` : ''}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-[0.8125rem] text-[#1A1815]">{item.body}</p>
      {item.state === 'answered' && (
        <div className="mt-2 border-t border-[#E8E4DC] pt-2">
          {/* The sentence, on every answered item. Never only a badge. */}
          <p className={noteCls}>{item.note}</p>
          <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-[#1A1815]">{item.answer}</p>
          <div className={`${labelCls} mt-2`}>Sources ({item.sources.length})</div>
          {item.sources.length === 0
            ? <p className={`mt-1 ${noteCls}`}>No source link came back with this answer, so there is nothing to check it against.</p>
            : (
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[0.75rem]">
                {item.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all underline text-[#1A1815]">{s.title}</a>
                  </li>
                ))}
              </ol>
            )}
        </div>
      )}
      {item.state === 'failed' && (
        <p role="alert" className={`mt-2 ${noteCls}`}>
          {item.why || 'The road did not say why. That is itself worth reporting.'}
        </p>
      )}
      {item.state === 'waiting' && (
        <p className="mt-2 text-[0.75rem] text-[#5A5751]">
          Nothing has looked into this yet. It stays here, unanswered, until something does.
        </p>
      )}
    </li>
  );
}

export default function ResearchSection({ fetchImpl, client = supabase, send = relayThought }) {
  const [health, setHealth] = useState({ state: 'checking' });
  const [read, setRead] = useState({ state: 'loading', items: [], reason: '' });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const load = useCallback(async () => {
    const r = await fetchMyResearch({ supabase: client });
    setRead(r.ok ? { state: 'ok', items: r.items, reason: '' } : { state: 'error', items: [], reason: r.reason });
  }, [client]);

  useEffect(() => {
    let live = true;
    researchHealth(fetchImpl ? { fetchImpl } : undefined).then((h) => { if (live) setHealth(h); });
    load();
    return () => { live = false; };
  }, [fetchImpl, load]);

  async function onSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setSent(null);
    const r = await send({ body, tags: ['research'], source: 'research-section' });
    setBusy(false);
    if (r && r.ok) {
      setDraft('');
      setSent({ ok: true });
      await load();
    } else {
      setSent({ ok: false, reason: (r && r.reason) || 'unknown' });
    }
  }

  const items = read.items;
  const waiting = items.filter((i) => i.state === 'waiting').length;
  const answered = items.filter((i) => i.state === 'answered').length;

  return (
    <div className="space-y-4">
      <section className={card} aria-labelledby="research-section-title">
        <h2 id="research-section-title" className="text-lg sm:text-xl text-[#1A1815]" style={serif}>Research</h2>
        <p className="mt-1 text-sm text-[#5A5751]">
          Send a link or a question here and it is kept as an item until something looks into it.
          Nothing in this section is checked: every answer comes from a web search and our own
          model, and each one says so on its face.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[0.6875rem]">
          <span className="border border-[#C9C2B6] px-2 py-0.5 text-[#1A1815]">
            {read.state === 'ok' ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'items not read'}
          </span>
          {read.state === 'ok' && <span className="border border-[#C9C2B6] px-2 py-0.5 text-[#1A1815]">{waiting} waiting</span>}
          {read.state === 'ok' && <span className="border border-[#C9C2B6] px-2 py-0.5 text-[#1A1815]">{answered} answered</span>}
          <span role="status" className="px-2 py-0.5 text-[#5A5751]">
            {health.state === 'checking' && 'Checking the research road…'}
            {/* A 200 IS NOT A RING (DR-1110). `/health` 200 proves the road
                answered and can name its model; it does NOT prove a question
                finishes. MEASURED 2026-10-21: health has been 200 with both
                models named while `/ask` answers 504 "no answer within 180s"
                since 2026-10-19 (incident #2255, open). The old wording on the
                Infra Plan — "Live on the NAS · answering with X" — reads as a
                promise the road is not keeping, so this says the narrower true
                thing instead. */}
            {health.state === 'live' && `The road is reachable on the NAS and names its model (${health.chat}). Reachable is not answering — a question can still time out.`}
            {health.state === 'dark' && `The road is not ready: ${health.reason}`}
            {health.state === 'unreachable' && health.reason}
          </span>
        </div>
      </section>

      <section className={card} aria-labelledby="research-send-title">
        <h3 id="research-send-title" className="text-base text-[#1A1815]" style={serif}>Send something to look into</h3>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">
          A link is fetched on our own machine at home — the only one of ours that video sites
          answer. A question is searched and answered on the research road. Either way it lands
          here as an item you can come back to.
        </p>
        <form onSubmit={onSend} className="mt-2">
          <label htmlFor="research-send" className={labelCls}>A link, or a question</label>
          <textarea
            id="research-send"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="mt-1 w-full border border-[#C9C2B6] bg-white p-2 text-[0.8125rem] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]"
            placeholder="https://youtu.be/… — or: which of these options can we actually run ourselves?"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              className="min-h-[44px] border border-[#1A1815] bg-[#1A1815] px-4 text-[0.6875rem] uppercase tracking-wider text-white disabled:border-[#C9C2B6] disabled:bg-white disabled:text-[#5A5751] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#1A1815]"
            >
              {busy ? 'Sending…' : 'Send it'}
            </button>
            {sent && sent.ok && <span role="status" className="text-[0.6875rem] text-[#1A1815]">Kept. It is in the list below, waiting.</span>}
            {sent && !sent.ok && (
              <span role="alert" className={noteCls}>
                {sent.reason === 'signed-out' ? 'Sign in first — an item is kept against your own account.' : `Not kept: ${sent.reason}`}
              </span>
            )}
          </div>
        </form>
      </section>

      <section className={card} aria-labelledby="research-items-title">
        <h3 id="research-items-title" className="text-base text-[#1A1815]" style={serif}>What you have sent</h3>
        <p className={`mt-1 ${noteCls}`}>{UNVERIFIED_NOTE}</p>
        {read.state === 'loading' && <p className="mt-2 text-[0.8125rem] text-[#5A5751]">Reading your items…</p>}
        {/* A FAILED READ IS SAID, NOT DRAWN AS EMPTY (DR-0076). */}
        {read.state === 'error' && (
          <p role="alert" className={`mt-2 ${noteCls}`}>
            {read.reason === 'signed-out'
              ? 'Sign in to see the items you have sent.'
              : `Your items could not be read, so this list is not empty — it is unknown. The reason given: ${read.reason}`}
          </p>
        )}
        {read.state === 'ok' && items.length === 0 && (
          <p className="mt-2 text-[0.8125rem] text-[#5A5751]">You have not sent anything to look into yet.</p>
        )}
        {read.state === 'ok' && items.length > 0 && (
          <ul className="mt-2 space-y-2">{items.map((i) => <Item key={i.id} item={i} />)}</ul>
        )}
      </section>

      <section className={card} aria-labelledby="research-ask-title">
        <h3 id="research-ask-title" className="text-base text-[#1A1815]" style={serif}>Ask the road one question now</h3>
        <p className="mt-1 text-[0.75rem] text-[#5A5751]">
          For an answer while you wait, rather than an item to come back to. This is the same ask
          box that has only ever been on the Infra Plan; it keeps working there too.
        </p>
        <ResearchTry {...(fetchImpl ? { fetchImpl } : {})} client={client} />
      </section>
    </div>
  );
}
