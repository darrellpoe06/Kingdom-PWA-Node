// =============================================================================
// UsageCalendar — when, and by whom, the apps are used (DR-0843)
// =============================================================================
// Who has done the evaluating (uses first, opens beside, share of the whole),
// the weekdays the apps are used most, and a calendar of the last twelve
// weeks for everyone or for one person. Read from usage_calendar_metrics; the
// names come from the signups list the governor already sees and the
// viewer's own contacts (DR-0825). Counts only; never a view name.
import React, { useEffect, useMemo, useState } from 'react';
import { fetchUsageCalendar } from '../lib/usage-calendar-sync.js';
import { fetchSignupMetrics, ownNameOf } from '../lib/signup-metrics.js';
import { loadContactIndex, labelFor, emptyIndex } from '../lib/contact-names.js';
import { leaderboard, weekdayTotals, calendarGrid, calendarLine, WEEKDAY_SHORT } from '../lib/usage-calendar.js';

const serif = { fontFamily: '"Fraunces", serif' };
const WINDOW = 90;

export default function UsageCalendar() {
  const [rows, setRows] = useState(undefined);      // undefined loading, null refused/unreachable
  const [signups, setSignups] = useState([]);
  const [contacts, setContacts] = useState(emptyIndex);
  const [who, setWho] = useState('');               // '' everyone, else a user id
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchUsageCalendar(WINDOW),
      fetchSignupMetrics().catch(() => ({ data: null })),
      loadContactIndex().catch(() => emptyIndex()),
    ]).then(([r, s, c]) => { if (!alive) return; setRows(r); setSignups((s && s.data && s.data.signups) || []); setContacts(c || emptyIndex()); });
    return () => { alive = false; };
  }, []);
  const nameOf = useMemo(() => {
    const byId = new Map(signups.map((s) => [s.user_id, s]));
    return (userId) => {
      const s = byId.get(userId);
      if (!s) return null;
      const w = labelFor(contacts, { ownName: ownNameOf(s.display_name, s.email), email: s.email });
      return w.shown || s.email || null;
    };
  }, [signups, contacts]);
  const board = useMemo(() => (rows ? leaderboard(rows, nameOf) : []), [rows, nameOf]);
  const week = useMemo(() => (rows ? weekdayTotals(rows) : null), [rows]);
  const grid = useMemo(() => (rows ? calendarGrid(rows, { weeks: 12, userId: who || null }) : null), [rows, who]);

  return (
    <div className="mb-5" data-testid="usage-calendar">
      <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold">When, and by whom — the last {WINDOW} days</div>
      {rows === undefined ? <p className="text-xs mt-1 text-[#5A5751] italic" style={serif}>Reading the calendar…</p> : null}
      {rows === null ? <p className="text-xs mt-1 text-[#5A5751] italic" style={serif} data-testid="usage-calendar-refused">The calendar could not be read: it is for the family governors, and the server did not answer this device as one.</p> : null}
      {rows ? (
        <>
          <p className="text-xs mt-1 text-[#1A1815]" style={serif} data-testid="usage-calendar-line">{calendarLine(rows, { windowDays: WINDOW })}</p>
          <p className="text-[0.625rem] mt-0.5 text-[#5A5751]" style={serif}>Opens are tabs opened; uses are functions exercised (a camera window, a dispatch, a post), which is the work of evaluating. Counts only; which tab is under What&rsquo;s used and the person&rsquo;s Usage fold.</p>

          <div className="mt-3 text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751]">Who has done the evaluating</div>
          {board.length === 0 ? <p className="text-xs text-[#5A5751] italic" style={serif}>Nobody yet.</p> : (
            <div className="border border-[#E8E4DC] mt-1">
              {board.map((p, i) => (
                <div key={p.userId} className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 border-b border-[#F2EEE6] last:border-b-0" data-testid="usage-person">
                  <span className="text-[0.625rem] text-[#8A867E] w-4">{i + 1}.</span>
                  <button type="button" onClick={() => setWho((cur) => (cur === p.userId ? '' : p.userId))} aria-pressed={who === p.userId} data-testid="usage-person-name"
                    className={`basis-full sm:basis-auto sm:flex-1 min-w-0 break-words text-left text-[0.8125rem] focus:outline focus:outline-2 focus:outline-[#B85838] ${who === p.userId ? 'text-[#B85838] font-semibold' : 'text-[#1A1815]'}`}>
                    {p.name || `account ${String(p.userId).slice(0, 8)}`}
                  </button>
                  <span className="text-[0.6875rem] text-[#5A5751] tabular-nums" data-testid="usage-person-counts">
                    {p.uses} used · {p.opens} opened · {p.activeDays} {p.activeDays === 1 ? 'day' : 'days'} · {Math.round(p.shareUses * 100)}% of the using, {Math.round(p.shareAll * 100)}% of all
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751]">Which days of the week</div>
          {week && week.total > 0 ? (
            <div className="flex items-end gap-1 mt-1" data-testid="usage-weekdays" aria-label="Opens and uses by weekday">
              {week.days.map((d) => (
                <div key={d.weekday} className="flex-1 min-w-0 text-center">
                  <div className="mx-auto w-full bg-[#5A6E3D]/20 border border-[#5A6E3D]/40" style={{ height: `${Math.max(2, Math.round(d.share * 72))}px` }} title={`${d.label}: ${d.n}`} />
                  <div className={`text-[0.5625rem] mt-0.5 ${week.busiest && week.busiest.weekday === d.weekday ? 'text-[#B85838] font-semibold' : 'text-[#5A5751]'}`}>{d.short}<br />{d.n}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-[#5A5751] italic" style={serif}>No day has anything yet.</p>}

          <div className="mt-3 text-[0.5625rem] uppercase tracking-wider font-semibold text-[#5A5751]">
            Calendar, last 12 weeks · {who ? (nameOf(who) || 'one person') : 'everyone'}{who ? <button type="button" onClick={() => setWho('')} className="ml-2 underline normal-case tracking-normal">everyone</button> : null}
          </div>
          {grid ? (
            <div className="mt-1 overflow-x-auto" data-testid="usage-grid">
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, minmax(1.25rem, 1fr))' }}>
                {WEEKDAY_SHORT.map((s) => <div key={s} className="text-[0.5rem] text-center text-[#8A867E]">{s}</div>)}
                {grid.weeks.flat().map((c) => {
                  const level = grid.max ? c.n / grid.max : 0;
                  const bg = c.future ? 'transparent' : (c.n === 0 ? '#F2EEE6' : `rgba(90,110,61,${0.25 + 0.75 * level})`);
                  return <div key={c.day} className="h-5 border border-[#E8E4DC] text-[0.5rem] text-center leading-5 text-[#1A1815]" style={{ background: bg }} title={`${c.day}: ${c.n}`} data-day={c.day} data-n={c.n}>{c.n > 0 ? c.n : ''}</div>;
                })}
              </div>
              <div className="text-[0.5625rem] text-[#8A867E] mt-0.5">{grid.start} to {grid.end} · the darker the day, the more it was used · a number is that day&rsquo;s count</div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
