// =============================================================================
// PortfolioTab — every door at once, the latest of everything (DR-1530)
// =============================================================================
// Darrell, 2026-11-18: "I need to see all at the same time in a list... maybe
// a list of each property with the latest everything... like messages... work
// orders... etc... another view."
//
// Three views over ONE read (loadPortfolioPulse, under the reader's RLS):
//   By door     — one row per door: open work, the latest message (and
//                 whether it waits on a reply), payments to confirm, the last
//                 thing that happened. Sortable by what needs him.
//   Open work   — every open work order across every door, most pressing first.
//   Latest      — the newest messages and work-order moves, every door mixed.
// Tapping anything opens that door on the tab that holds it, so acting stays
// where it already works (the board, the thread, rent).
//
// HONEST STATES (DR-0076): while reading it says so; a read that did not come
// back says which part, and a part that failed never reads as "nothing here".
// The read is BOUNDED (boundedRead) so a stalled road can never freeze the tab.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { loadPortfolioPulse } from './portfolio-cloud.js';
import { boundedRead, READ_TIMEOUT_MS } from '../../lib/bounded-read.js';
import {
  portfolioRows, sortPortfolio, activeOnly, portfolioTotals, allOpenWork, latestFeed, agoLabel, SORTS, UNTIED,
} from './portfolio.js';

const serif = { fontFamily: '"Fraunces", serif' };
const VIEWS = Object.freeze([
  Object.freeze({ id: 'doors', label: 'By door' }),
  Object.freeze({ id: 'work', label: 'Open work' }),
  Object.freeze({ id: 'latest', label: 'Latest' }),
]);
const WHO = { tenant: 'Tenant', household: 'Household', worker: 'Worker', manager: 'Manager', landlord: 'You' };
const clip = (s, n = 110) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const money = (n) => (Number.isFinite(Number(n)) ? `$${Number(n).toLocaleString()}` : '');

const Chip = ({ children, tone = 'plain', testid }) => (
  <span data-testid={testid}
    className={`inline-block text-[0.625rem] uppercase tracking-wider px-2 py-1 border mr-1 mb-1 ${
      tone === 'hot' ? 'border-[#8A6510] text-[#8A6510] font-semibold'
        : tone === 'wait' ? 'border-[#2F5D50] text-[#2F5D50] font-semibold'
          : 'border-[#E8E4DC] text-[#5A5751]'}`}
  >{children}</span>
);

const Pill = ({ active, onClick, children, testid }) => (
  <button type="button" onClick={onClick} aria-pressed={active} data-testid={testid}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border mr-1 mb-1 focus:outline focus:outline-2 focus:outline-[#2F5D50] ${
      active ? 'bg-[#2F5D50] text-white border-[#2F5D50]' : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
  >{children}</button>
);

export default function PortfolioTab({ rentals = [], tenancies = [], strict = false, onOpen, load = loadPortfolioPulse, now = null, timeoutMs = READ_TIMEOUT_MS * 2 }) {
  const [state, setState] = useState({ status: 'loading', requests: [], messages: [], rent: [], unreadable: [], reason: '' });
  const [view, setView] = useState('doors');
  const [sort, setSort] = useState('attention');
  const [onlyActive, setOnlyActive] = useState(false);

  const read = useCallback(async () => {
    setState((s) => ({ ...s, status: s.status === 'ready' ? 'refreshing' : 'loading' }));
    const r = await boundedRead(Promise.resolve().then(() => load()), timeoutMs);
    if (!r || !r.ok) {
      setState({ status: 'failed', requests: [], messages: [], rent: [], unreadable: [], reason: (r && r.reason) || 'not-reached' });
      return;
    }
    setState({ status: 'ready', requests: r.requests || [], messages: r.messages || [], rent: r.rent || [], unreadable: r.unreadable || [], reason: '' });
  }, [load, timeoutMs]);
  useEffect(() => { read(); }, [read]);

  const clock = now ?? Date.now();
  const rows = useMemo(() => portfolioRows({ rentals, tenancies, requests: state.requests, messages: state.messages, rent: state.rent, now: clock, strict }),
    // clock is read once per data change on purpose; ages need not tick live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rentals, tenancies, state.requests, state.messages, state.rent, strict]);
  const totals = useMemo(() => portfolioTotals(rows), [rows]);
  const shown = useMemo(() => sortPortfolio(onlyActive ? activeOnly(rows) : rows, sort), [rows, sort, onlyActive]);
  const openWork = useMemo(() => allOpenWork(rows), [rows]);
  const feed = useMemo(() => latestFeed({ rentals, tenancies, requests: state.requests, messages: state.messages, strict }, 40),
    [rentals, tenancies, state.requests, state.messages, strict]);

  const go = (doorId, tab) => { if (onOpen && doorId && doorId !== UNTIED) onOpen(doorId, tab); };
  const unread = state.unreadable.length ? `Could not read: ${state.unreadable.join(', ')}. Those counts below are not zero, they are unknown.` : '';

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="portfolio-tab">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">Every door at once</h3>
        <button type="button" onClick={read} data-testid="portfolio-refresh"
          className="text-[0.625rem] uppercase tracking-wider underline text-[#5A5751]">
          {state.status === 'refreshing' || state.status === 'loading' ? 'Reading…' : 'Refresh'}
        </button>
      </div>

      {state.status === 'loading' && <p className="text-xs text-[#5A5751]" style={serif} data-testid="portfolio-loading">Reading every door&rsquo;s work orders, messages and payments&hellip;</p>}
      {state.status === 'failed' && (
        <p className="text-xs text-[#1A1815]" style={serif} role="status" data-testid="portfolio-failed">
          The work orders, messages and payments did not come back ({state.reason}). Nothing below is a count of zero. <button type="button" className="underline" onClick={read}>Try again</button>
        </p>
      )}
      {unread && <p className="text-xs text-[#8A6510] mb-2" style={serif} role="status" data-testid="portfolio-unread">{unread}</p>}

      {(state.status === 'ready' || state.status === 'refreshing') && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3" data-testid="portfolio-kpis">
            {[
              ['Doors', `${totals.doors}`, `${totals.occupied} lived in`],
              ['Open work', `${totals.open}`, `${totals.urgent} urgent or high`],
              ['Waiting on you', `${totals.awaiting}`, 'last word was theirs'],
              ['To confirm', `${totals.toConfirm}`, 'payments reported'],
              ['Messages read', `${state.messages.length}`, 'newest across doors'],
            ].map(([k, v, s]) => (
              <div key={k} className="border border-[#E8E4DC] p-2">
                <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{k}</div>
                <div className="text-xl text-[#1A1815]" style={serif}>{v}</div>
                <div className="text-[0.625rem] text-[#5A5751]">{s}</div>
              </div>
            ))}
          </div>

          <div className="mb-2" role="group" aria-label="View">
            {VIEWS.map((v) => <Pill key={v.id} active={view === v.id} onClick={() => setView(v.id)} testid={`portfolio-view-${v.id}`}>{v.label}</Pill>)}
          </div>

          {view === 'doors' && (
            <>
              <div className="mb-2 flex flex-wrap items-center" role="group" aria-label="Sort">
                <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] mr-2">Sort</span>
                {SORTS.map((s) => <Pill key={s.id} active={sort === s.id} onClick={() => setSort(s.id)} testid={`portfolio-sort-${s.id}`}>{s.label}</Pill>)}
                <label className="text-xs text-[#1A1815] ml-1 inline-flex items-center gap-1" style={serif}>
                  <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} data-testid="portfolio-only-active" />
                  Only doors with something open
                </label>
              </div>
              {shown.length === 0 ? (
                <p className="text-xs text-[#5A5751]" style={serif}>{rows.length ? 'Nothing open on any door.' : 'No doors yet.'}</p>
              ) : (
                <ul data-testid="portfolio-rows">
                  {shown.map((r) => (
                    <li key={r.id} className="border-b border-[#F0EDE6] py-2" data-testid="portfolio-row">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <button type="button" disabled={r.untied} onClick={() => go(r.id, r.openCount ? 'board' : 'history')}
                          className="text-sm text-left text-[#1A1815] underline decoration-[#E8E4DC] underline-offset-4 disabled:no-underline" style={serif}>
                          {r.label}
                        </button>
                        <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                          {r.lastActivityAt ? `Last activity ${agoLabel(r.lastActivityAt, clock)}` : 'No activity recorded'}
                        </span>
                      </div>
                      {(r.tenant || r.address) && (
                        <div className="text-xs text-[#5A5751]" style={serif}>{[r.tenant, r.address].filter(Boolean).join(' · ')}</div>
                      )}
                      <div className="mt-1">
                        {r.urgentCount > 0 && <Chip tone="hot">{r.urgentCount} urgent</Chip>}
                        <Chip tone={r.openCount ? 'wait' : 'plain'} testid="portfolio-row-open">{r.openCount ? `${r.openCount} open work` : 'no open work'}</Chip>
                        {r.oldestOpenDays !== null && <Chip>oldest {r.oldestOpenDays}d</Chip>}
                        {r.awaitingReply && <Chip tone="wait" testid="portfolio-row-awaiting">waiting on your reply</Chip>}
                        {r.toConfirm > 0 && <Chip tone="wait">{r.toConfirm} payment{r.toConfirm === 1 ? '' : 's'} to confirm</Chip>}
                      </div>
                      {r.open[0] && (
                        <button type="button" disabled={r.untied} onClick={() => go(r.id, 'board')} className="block w-full text-left text-xs text-[#1A1815] mt-1" style={serif}>
                          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Top work · {r.open[0].status} · </span>
                          {clip(r.open[0].title)}
                        </button>
                      )}
                      {r.latestMessage && (
                        <button type="button" disabled={r.untied} onClick={() => go(r.id, 'thread')} className="block w-full text-left text-xs text-[#1A1815] mt-1" style={serif} data-testid="portfolio-row-message">
                          <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                            {WHO[r.latestMessage.from_role] || r.latestMessage.from_role} · {agoLabel(r.latestMessage.sent_at, clock)} ·{' '}
                          </span>
                          {clip(r.latestMessage.body)}
                        </button>
                      )}
                      {r.lastPayment && (
                        <button type="button" disabled={r.untied} onClick={() => go(r.id, 'rent')} className="block w-full text-left text-xs text-[#5A5751] mt-1" style={serif}>
                          Last payment {money(r.lastPayment.amount)} · {r.lastPayment.status} · {agoLabel(r.lastPayment.paid_on || r.lastPayment.reported_at, clock)}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {view === 'work' && (
            openWork.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>No open work orders on any door.</p> : (
              <ul data-testid="portfolio-open-work">
                {openWork.map((w) => (
                  <li key={w.id} className="border-b border-[#F0EDE6] py-2">
                    <button type="button" disabled={w.doorId === UNTIED} onClick={() => go(w.doorId, 'board')} className="block w-full text-left" style={serif}>
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                        {w.doorLabel} · {w.priority || 'normal'} · {w.status} · in {agoLabel(w.created_at, clock)}{w.assigned_to_label ? ` · ${w.assigned_to_label}` : ''}
                      </div>
                      <div className={`text-sm ${w.priority === 'urgent' || w.priority === 'high' ? 'text-[#8A6510] font-semibold' : 'text-[#1A1815]'}`}>{clip(w.title, 140)}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}

          {view === 'latest' && (
            feed.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>Nothing has happened on any door yet.</p> : (
              <ul data-testid="portfolio-feed">
                {feed.map((i) => (
                  <li key={i.id} className="border-b border-[#F0EDE6] py-2">
                    <button type="button" disabled={i.doorId === UNTIED} onClick={() => go(i.doorId, i.kind === 'message' ? 'thread' : 'board')} className="block w-full text-left" style={serif}>
                      <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                        {i.doorLabel} · {i.kind === 'message' ? `Message from ${WHO[i.who] || i.who}` : `Work order · ${i.status}`} · {agoLabel(i.at, clock)}
                      </div>
                      <div className="text-sm text-[#1A1815]">{clip(i.text, 140)}</div>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </section>
  );
}
