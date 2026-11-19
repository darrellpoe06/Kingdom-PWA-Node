// =============================================================================
// ChurchCalendar — the church calendar as words you can tap (DR-1585)
// =============================================================================
// Darrell 2026-11-18/19: "Larger text doesn't enlarge the fonts on the
// images" and "Calendar connects the week days when clicked shows that day
// this week or a button to see the month year". The office's picture of the
// month stays below this (ChurchOfficeBoard); THIS is the same calendar as
// event records: a This-week strip of seven day buttons, the tapped day's
// services and events as text, and a month view that moves by month and year.
//
// Every size here is rem, so the text-size setting (lib/text-size.js) scales
// all of it. Every record shown is real (lib/church-calendar.js names each
// source); a day with nothing says so, and a calendar that could not be read
// says that instead of looking empty (P15: a surface never goes blank).
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  dayAgenda,
  weekDays,
  monthGrid,
  eventsInMonth,
  shiftMonth,
  shiftYear,
  monthLabel,
  longDate,
  partsOf,
  whenLine,
  isDateKey,
  DAY_NAMES,
} from '../../lib/church-calendar.js';

const SOURCE_NOTE = {
  'signed-out': 'Sign in to see the events your church office has added.',
  unavailable: 'The office’s added events could not be read just now. What shows here is the church’s standing record.',
  loading: 'Reading the office’s events…',
};

function EventLine({ ev, onSave, saved, onRemove }) {
  // Removing is two presses on purpose: the first asks, the second does it (no browser prompt).
  const [asking, setAsking] = useState(false);
  const [gone, setGone] = useState('');
  const remove = async () => {
    setGone('working');
    let r;
    try {
      r = await onRemove(ev);
    } catch {
      r = null;
    }
    if (!r || !r.removed) {
      setGone('failed');
      setAsking(false);
    }
  };
  return (
    <li className="cc-item" data-testid="church-calendar-item" data-source={ev.source}>
      <div className="cc-item-main">
        <b className="cc-item-name">{ev.name}</b>
        <span className="cc-item-meta">{[ev.endDate ? whenLine(ev) : '', ev.time, ev.place].filter(Boolean).join(' · ')}</span>
        {ev.detail && <span className="cc-item-detail">{ev.detail}</span>}
      </div>
      {onSave && ev.source !== 'service' && (
        <button
          type="button"
          className="cc-btn cc-btn-quiet"
          onClick={() => onSave(ev)}
          disabled={saved}
          aria-label={saved ? `${ev.name} is on your calendar` : `Add ${ev.name} to my calendar`}
        >
          {saved ? '✓ On your calendar' : '+ Calendar'}
        </button>
      )}
      {onRemove && ev.source === 'office' && ev.rowId && (
        <span className="cc-remove">
          {!asking ? (
            <button type="button" className="cc-btn" onClick={() => setAsking(true)} aria-label={`Remove ${ev.name} from the church calendar`} data-testid="church-calendar-remove">
              Remove
            </button>
          ) : (
            <>
              <button type="button" className="cc-btn cc-btn-solid" onClick={remove} disabled={gone === 'working'} data-testid="church-calendar-remove-yes">
                {gone === 'working' ? 'Removing…' : 'Yes, remove it for everyone'}
              </button>
              <button type="button" className="cc-btn" onClick={() => setAsking(false)} disabled={gone === 'working'} data-testid="church-calendar-remove-no">
                Keep it
              </button>
            </>
          )}
          {gone === 'failed' && (
            <span className="cc-said is-bad" role="alert">
              It could not be removed. It is still on the calendar.
            </span>
          )}
        </span>
      )}
    </li>
  );
}

export default function ChurchCalendar({ events = [], services = [], todayKey, status = 'ok', onSave = null, savedIds = [], onRemove = null, children = null }) {
  const dated = isDateKey(todayKey);
  const [picked, setPicked] = useState(todayKey);
  const [view, setView] = useState('week');
  const [ym, setYm] = useState(() => {
    const p = dated ? partsOf(todayKey) : { year: 2000, month: 1 };
    return { year: p.year, month: p.month };
  });
  const source = useMemo(() => ({ events, services }), [events, services]);
  const week = useMemo(() => weekDays(source, todayKey), [source, todayKey]);
  const agenda = useMemo(() => dayAgenda(source, picked), [source, picked]);
  const grid = useMemo(() => monthGrid(ym), [ym]);
  const monthEvents = useMemo(() => eventsInMonth(events, ym), [events, ym]);
  if (!dated) {
    return (
      <section className="cc" aria-labelledby="cc-h" data-testid="church-calendar">
        <h3 id="cc-h" className="cc-h">
          Church calendar
        </h3>
        <p className="cc-empty" data-testid="church-calendar-undated">
          This device did not give today’s date, so the week cannot be drawn. The service times below are still right.
        </p>
      </section>
    );
  }
  const today = partsOf(todayKey);
  const note = SOURCE_NOTE[status] || '';

  return (
    <section className="cc" aria-labelledby="cc-h" data-testid="church-calendar">
      <div className="cc-head">
        <h3 id="cc-h" className="cc-h">
          Church calendar
        </h3>
        <button
          type="button"
          className="cc-btn"
          aria-pressed={view === 'month'}
          onClick={() => setView(view === 'month' ? 'week' : 'month')}
          data-testid="church-calendar-view"
        >
          {view === 'month' ? 'This week' : 'Month and year'}
        </button>
      </div>

      {view === 'week' && (
        <div className="cc-week" role="group" aria-label="This week" data-testid="church-calendar-week">
          {week.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`cc-day${d.key === picked ? ' is-picked' : ''}${d.isToday ? ' is-today' : ''}`}
              aria-pressed={d.key === picked}
              aria-label={`${longDate(d.key)}${d.isToday ? ', today' : ''}, ${d.count} ${d.count === 1 ? 'item' : 'items'}`}
              onClick={() => setPicked(d.key)}
              data-testid={`church-calendar-day-${d.key}`}
            >
              <span className="cc-day-name">{d.short}</span>
              <span className="cc-day-num">{d.dayOfMonth}</span>
              <span className="cc-day-dot" aria-hidden="true">
                {d.count > 0 ? '•' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {view === 'month' && (
        <div className="cc-month" data-testid="church-calendar-month">
          <div className="cc-nav">
            <button
              type="button"
              className="cc-btn"
              onClick={() => setYm(shiftYear(ym, -1))}
              aria-label={`Previous year, ${ym.year - 1}`}
              data-testid="church-calendar-prev-year"
            >
              « Year
            </button>
            <button
              type="button"
              className="cc-btn"
              onClick={() => setYm(shiftMonth(ym, -1))}
              aria-label={`Previous month, ${monthLabel(shiftMonth(ym, -1))}`}
              data-testid="church-calendar-prev-month"
            >
              ‹ Month
            </button>
            <b className="cc-nav-label" aria-live="polite" data-testid="church-calendar-month-label">
              {monthLabel(ym)}
            </b>
            <button
              type="button"
              className="cc-btn"
              onClick={() => setYm(shiftMonth(ym, 1))}
              aria-label={`Next month, ${monthLabel(shiftMonth(ym, 1))}`}
              data-testid="church-calendar-next-month"
            >
              Month ›
            </button>
            <button
              type="button"
              className="cc-btn"
              onClick={() => setYm(shiftYear(ym, 1))}
              aria-label={`Next year, ${ym.year + 1}`}
              data-testid="church-calendar-next-year"
            >
              Year »
            </button>
          </div>
          {(ym.year !== today.year || ym.month !== today.month) && (
            <button
              type="button"
              className="cc-btn cc-btn-quiet"
              onClick={() => setYm({ year: today.year, month: today.month })}
              data-testid="church-calendar-this-month"
            >
              Back to this month
            </button>
          )}
          <div className="cc-grid" role="group" aria-label={monthLabel(ym)}>
            {DAY_NAMES.map((n) => (
              <span key={n} className="cc-grid-h" aria-hidden="true">
                {n.slice(0, 3)}
              </span>
            ))}
            {grid.flat().map((key, i) => {
              if (!key) return <span key={`pad-${i}`} className="cc-cell cc-cell-pad" aria-hidden="true" />;
              const count = dayAgenda(source, key).length;
              return (
                <button
                  key={key}
                  type="button"
                  className={`cc-cell${key === picked ? ' is-picked' : ''}${key === todayKey ? ' is-today' : ''}`}
                  aria-pressed={key === picked}
                  aria-label={`${longDate(key)}${key === todayKey ? ', today' : ''}, ${count} ${count === 1 ? 'item' : 'items'}`}
                  onClick={() => setPicked(key)}
                  data-testid={`church-calendar-cell-${key}`}
                >
                  <span>{partsOf(key).day}</span>
                  <span className="cc-day-dot" aria-hidden="true">
                    {count > 0 ? '•' : ''}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="cc-list-h">Events in {monthLabel(ym)}</div>
          {monthEvents.length > 0 ? (
            <ul className="cc-list" data-testid="church-calendar-month-events">
              {monthEvents.map((ev) => (
                <li key={ev.id} className="cc-item">
                  <div className="cc-item-main">
                    <b className="cc-item-name">{ev.name}</b>
                    <span className="cc-item-meta">{[whenLine(ev), ev.time, ev.place].filter(Boolean).join(' · ')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cc-empty" data-testid="church-calendar-month-empty">
              No dated events are on record for {monthLabel(ym)}. The weekly services still meet; tap a day to see them.
            </p>
          )}
        </div>
      )}

      <div className="cc-list-h" aria-live="polite" data-testid="church-calendar-picked">
        {longDate(picked)}
        {picked === todayKey ? ' · today' : ''}
      </div>
      {agenda.length > 0 ? (
        <ul className="cc-list" data-testid="church-calendar-agenda">
          {agenda.map((ev) => (
            <EventLine key={ev.id} ev={ev} onSave={onSave} saved={savedIds.includes(ev.id)} onRemove={onRemove} />
          ))}
        </ul>
      ) : (
        <p className="cc-empty" data-testid="church-calendar-empty">
          Nothing is on the church calendar for this day.
        </p>
      )}
      {note && (
        <p className="cc-note" data-testid="church-calendar-note">
          {note}
        </p>
      )}
      {children}
    </section>
  );
}
