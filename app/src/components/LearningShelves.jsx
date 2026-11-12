// =============================================================================
// LearningShelves — the Bookstore's two other shelves: the self-paced video
// courses and the in-person workshop seats; and the Governor's measured
// "books from the courses" (DR-1447)
// =============================================================================
// Real data only (DR-0061): the course shelf is derived from the live Learn
// registry; its video coverage is measured from the lessons' own video field;
// the workshop shelf reads workshop_events rows the house has opened (RLS,
// migration 0322) and the seat count from the database's own function. An
// empty shelf says so (P15); a control that cannot act says what it waits for
// (UX-PATTERNS 2f.3); every button shows focus and clears the 36px floor
// (2g). Themed classes, never inline hex (library-theme-classes).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { catalogProductLines, AWAITING_SOURCES } from '../lib/learning-products.js';
import { bookCount, FITNESS_LABEL } from '../lib/course-book-fitness.js';
import { listOpenWorkshops, mySeats, startSeatCheckout, saySeatError, whenLabel, buyable, eventRowFrom, openWorkshopEvent } from '../lib/workshops.js';
import { recommendSeatPrice, explainPrice, KNOWLEDGE_TYPES, LOCATION_TIERS, FORMATS } from '../lib/workshop-pricing.js';
import { formatPrice } from '../lib/commerce.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { PLUS_LABEL } from '../lib/poetech-plus.js';
import PoeTechPlusButton from './PoeTechPlusButton.jsx';

const btn =
  'inline-flex items-center text-xs px-3 py-1.5 min-h-[36px] border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60';
const eyebrow = 'text-[0.6875rem] uppercase tracking-wider font-semibold text-[#B85838] mb-1';
const SHOWN_FIRST = 8;

/** The self-paced video courses, derived from the live registry. */
export function CoursesShelf({ lines = null, client = supabase, fetchImpl }) {
  const list = useMemo(() => lines || catalogProductLines(), [lines]);
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? list : list.slice(0, SHOWN_FIRST);
  return (
    <section className="mt-6" data-testid="courses-shelf" data-count={list.length}>
      <div className={eyebrow}>Courses · self-paced, with a walk-through of each section</div>
      <p className="text-xs text-[#5A5751] mb-2">
        Every course is read in the app. A spiritual course is free at every level; the deeper levels of a PoeTech subject open with {PLUS_LABEL}. Each section
        carries its walk-through video as it is recorded.
      </p>
      <PoeTechPlusButton client={client} fetchImpl={fetchImpl} />
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {shown.map((l) => {
          const c = l.course;
          const href = lessonUrl({ courseKey: c.key, course: { meta: { category: c.department } } });
          return (
            <li key={c.id} className="border bg-white p-3 border-[#E8E4DC]" data-testid="course-product" data-key={c.key} data-requires={c.requires}>
              <div className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                {c.title}
              </div>
              <div className="text-[0.6875rem] text-[#5A5751]">
                {c.department} · {c.lessons} lessons in {c.sections.length} sections
              </div>
              <div className="text-[0.6875rem] mt-1 text-[#1A1815]" data-testid="course-video-coverage" data-recorded={c.coverage.recorded}>
                Walk-throughs recorded: {c.coverage.recorded} of {c.coverage.lessons}
                {c.coverage.recorded ? ` (${c.coverage.pct}%)` : ''}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[0.6875rem] font-semibold text-[#B85838]">{c.free ? 'Free' : PLUS_LABEL}</span>
                {href && (
                  <a href={href} className={`${btn} border-[#1A1815] text-[#1A1815]`}>
                    Open course
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {list.length > SHOWN_FIRST && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className={`${btn} mt-2 border-[#E8E4DC] text-[#5A5751]`} aria-expanded={showAll}>
          {showAll ? 'Fewer' : `All ${list.length} courses`}
        </button>
      )}
    </section>
  );
}

/** The in-person seats the house has opened. */
export function WorkshopsShelf({ client = supabase, fetchImpl, nowIso }) {
  const [state, setState] = useState({ ok: null, events: [] });
  const [mine, setMine] = useState([]);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    let alive = true;
    listOpenWorkshops(client, nowIso).then((r) => alive && setState(r));
    Promise.resolve(client && client.auth ? client.auth.getSession() : { data: null })
      .then(({ data }) => {
        const t = (data && data.session && data.session.access_token) || '';
        if (!alive) return;
        setToken(t);
        if (t) mySeats(client).then((r) => alive && r.ok && setMine(r.eventIds));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [client, nowIso]);
  const open = useMemo(() => buyable(state.events, nowIso), [state.events, nowIso]);
  const seat = async (ev) => {
    setBusy(ev.id);
    setNote('');
    const loc = typeof window !== 'undefined' ? window.location : {};
    const r = await startSeatCheckout({ token, eventId: ev.id, pathname: loc.pathname, search: loc.search, fetchImpl });
    if (r.url) {
      try {
        window.location.assign(r.url);
      } catch {
        /* the note below tells the truth */
      }
      return;
    }
    setBusy('');
    setNote(saySeatError(r.error));
  };
  return (
    <section className="mt-6" data-testid="workshops-shelf" data-state={state.ok === null ? 'loading' : state.ok ? 'read' : 'unreachable'}>
      <div className={eyebrow}>Workshops · in person, by the seat</div>
      <p className="text-xs text-[#5A5751] mb-2">
        A day in the room with the teaching, priced for the place it is held. A seat is yours once it is paid; the Word's own workshops are an offering.
      </p>
      {state.ok === false && (
        <p className="text-xs text-[#5A5751]" data-testid="workshops-unreachable">
          The workshop list could not be read right now. Nothing is for sale until it can be.
        </p>
      )}
      {state.ok && !state.events.length && (
        <p className="text-xs text-[#5A5751]" data-testid="workshops-none">
          No workshop is open for seats yet. When the house opens one, it appears here with its date, place and price.
        </p>
      )}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {state.events.map((ev) => {
          const held = mine.includes(ev.id);
          const canBuy = open.some((o) => o.id === ev.id);
          return (
            <li key={ev.id} className="border bg-white p-3 border-[#E8E4DC]" data-testid="workshop-event" data-status={ev.status}>
              <div className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                {ev.title}
              </div>
              <div className="text-[0.6875rem] text-[#5A5751]">
                {whenLabel(ev.startsAt)} · {ev.location}
              </div>
              <div className="text-[0.6875rem] text-[#1A1815] mt-1" data-testid="workshop-price">
                {ev.priceCents > 0 ? `${formatPrice(ev.priceCents)} a seat` : 'An offering (free seat)'}
                {ev.seatsLeft !== null ? ` · ${ev.seatsLeft} of ${ev.capacity} seats left` : ''}
              </div>
              {ev.goingRateNote && <div className="text-[0.625rem] text-[#5A5751] mt-1">{ev.goingRateNote}</div>}
              <div className="mt-2">
                {held ? (
                  <span className="text-[0.6875rem] font-semibold text-[#216E39]" data-testid="seat-held">
                    Your seat is held
                  </span>
                ) : !canBuy ? (
                  <span className="text-[0.6875rem] text-[#5A5751]">
                    {ev.status === 'sold-out' || ev.seatsLeft === 0 ? 'Every seat is taken' : 'Not open for seats'}
                  </span>
                ) : !token ? (
                  <span className="text-[0.6875rem] text-[#5A5751]" data-testid="seat-sign-in">
                    Sign in to take a seat, so it is yours on every device.
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy === ev.id}
                    onClick={() => seat(ev)}
                    className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}
                    data-testid="take-a-seat"
                  >
                    {busy === ev.id ? 'Opening checkout…' : 'Take a seat'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {note && (
        <p className="text-xs text-[#5A5751] mt-2" role="status">
          {note}
        </p>
      )}
    </section>
  );
}

/** Governor: which courses are a book's worth, measured; the seat price calculator; and the opener that posts a workshop for seats. */
export function GovernorLearningLedger({ lines = null, client = supabase, instanceId = '' }) {
  const list = useMemo(() => lines || catalogProductLines(), [lines]);
  const count = useMemo(() => bookCount(list.map((l) => l.measured)), [list]);
  const [pick, setPick] = useState({ key: list[0] ? list[0].key : '', location: 'city', format: 'day', requested: '', capacity: '' });
  const chosen = list.find((l) => l.key === pick.key) || list[0];
  const rec = chosen
    ? recommendSeatPrice({
        department: chosen.department,
        location: pick.location,
        format: pick.format,
        requested: pick.requested === '' ? undefined : Number(pick.requested),
        capacity: pick.capacity === '' ? undefined : Number(pick.capacity),
      })
    : null;
  // The opener: a draft the Governor fills, the recommended price prefilled
  // until they type their own, every missing piece named before the button
  // can act (UX-PATTERNS 2f.3), and the row written under owner-scoped RLS.
  const [draft, setDraft] = useState({ title: '', location: '', startsAt: '', capacity: '', priceDollars: '', note: '' });
  const [priceTouched, setPriceTouched] = useState(false);
  const [opened, setOpened] = useState(null);
  const [opening, setOpening] = useState(false);
  const priceDollars = priceTouched ? draft.priceDollars : rec ? (rec.cents / 100).toFixed(2) : '';
  const eventDraft = {
    courseKey: chosen ? chosen.key : '',
    title: draft.title || (chosen ? `${chosen.title}: a workshop` : ''),
    location: draft.location,
    locationTier: pick.location,
    format: pick.format,
    startsAt: draft.startsAt,
    capacity: draft.capacity === '' ? NaN : Number(draft.capacity),
    priceCents: priceDollars === '' ? NaN : Math.round(Number(priceDollars) * 100),
    goingRateNote: draft.note,
  };
  const built = eventRowFrom(eventDraft, instanceId || 'pending');
  const openIt = async () => {
    setOpening(true);
    setOpened(null);
    const r = await openWorkshopEvent(client, eventDraft, { instanceId: instanceId || undefined });
    setOpening(false);
    setOpened(r);
  };
  const field = 'text-xs border px-1 py-1 min-h-[36px] border-[#E8E4DC] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
  return (
    <section
      className="mt-6 border p-3 border-[#B85838] bg-[#FAF8F4]"
      data-testid="governor-learning-ledger"
      data-titles={count.titles}
      data-volumes={count.volumes}
    >
      <div className={eyebrow}>Books from the courses (Governor) · measured on the live registry</div>
      <p className="text-xs text-[#1A1815]" data-testid="book-count-line">
        {count.courses} courses measure to <strong>{count.titles} book titles</strong> ({count.volumes} volumes): {count.standalone.length} courses are a book
        on their own and {count.compilations.length} departments gather into one each; {count.remainder.length} chapter-sized courses stay with their department
        for now.
      </p>
      <details className="mt-2">
        <summary className="text-xs cursor-pointer min-h-[36px] flex items-center text-[#1A1815]">
          Every course, by the words a reader's book would hold
        </summary>
        <table className="mt-2 text-[0.6875rem] w-full text-[#1A1815]" data-testid="book-fitness-table">
          <caption className="text-left text-[#5A5751] mb-1">Every course, measured by the words a reader's book would hold, largest first</caption>
          <thead>
            <tr className="text-left text-[#5A5751]">
              <th scope="col">Course</th>
              <th scope="col">Department</th>
              <th scope="col" className="text-right">
                Lessons
              </th>
              <th scope="col" className="text-right">
                Words
              </th>
              <th scope="col">Size</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.key} data-fitness={l.measured.fitness}>
                <td>{l.title}</td>
                <td>{l.department}</td>
                <td className="text-right">{l.measured.lessons}</td>
                <td className="text-right">{l.measured.words.toLocaleString()}</td>
                <td>
                  {FITNESS_LABEL[l.measured.fitness]}
                  {l.measured.volumes > 1 ? ` · ${l.measured.volumes} volumes` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {count.compilations.length > 0 && (
          <ul className="mt-2 text-[0.6875rem] text-[#1A1815]" data-testid="book-compilations">
            {count.compilations.map((c) => (
              <li key={c.department}>
                <strong>{c.department}</strong>: {c.courses.length} courses, {c.words.toLocaleString()} words, {FITNESS_LABEL[c.fitness]}
              </li>
            ))}
          </ul>
        )}
      </details>

      <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
        <div className={eyebrow}>Workshop seat price (a recommendation; the event row's price is what is charged)</div>
        <div className="flex flex-wrap gap-2 items-end text-[0.6875rem] text-[#5A5751]">
          <label>
            Course{' '}
            <select className={field} value={chosen ? chosen.key : ''} onChange={(e) => setPick({ ...pick, key: e.target.value })}>
              {list.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Place{' '}
            <select className={field} value={pick.location} onChange={(e) => setPick({ ...pick, location: e.target.value })}>
              {Object.entries(LOCATION_TIERS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Format{' '}
            <select className={field} value={pick.format} onChange={(e) => setPick({ ...pick, format: e.target.value })}>
              {Object.entries(FORMATS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Last time: asked{' '}
            <input
              className={`${field} w-14`}
              inputMode="numeric"
              aria-label="Seats asked for last time"
              value={pick.requested}
              onChange={(e) => setPick({ ...pick, requested: e.target.value })}
            />
          </label>
          <label>
            of{' '}
            <input
              className={`${field} w-14`}
              inputMode="numeric"
              aria-label="Seats held last time"
              value={pick.capacity}
              onChange={(e) => setPick({ ...pick, capacity: e.target.value })}
            />{' '}
            seats
          </label>
        </div>
        {rec && (
          <p className="text-xs mt-2 text-[#1A1815]" data-testid="seat-price" data-cents={rec.cents}>
            <strong>{rec.offering ? 'An offering' : `${formatPrice(rec.cents)} a seat`}</strong>. {explainPrice(rec)}
            {!rec.offering && <span className="text-[#5A5751]"> ({KNOWLEDGE_TYPES[rec.parts.type].label}.)</span>}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-[#E8E4DC]" data-testid="workshop-opener">
        <div className={eyebrow}>Open this workshop for seats</div>
        <div className="flex flex-wrap gap-2 items-end text-[0.6875rem] text-[#5A5751]">
          <label>
            Title{' '}
            <input
              className={`${field} w-56`}
              value={draft.title}
              placeholder={chosen ? `${chosen.title}: a workshop` : ''}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Place{' '}
            <input
              className={`${field} w-40`}
              value={draft.location}
              placeholder="Champaign, IL"
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            />
          </label>
          <label>
            When <input className={field} type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
          </label>
          <label>
            Seats{' '}
            <input className={`${field} w-14`} inputMode="numeric" value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} />
          </label>
          <label>
            Price ${' '}
            <input
              className={`${field} w-20`}
              inputMode="decimal"
              value={priceDollars}
              onChange={(e) => {
                setPriceTouched(true);
                setDraft({ ...draft, priceDollars: e.target.value });
              }}
            />
          </label>
          <label>
            Going-rate note{' '}
            <input
              className={`${field} w-64`}
              value={draft.note}
              placeholder="What a day runs for here, and where you read it"
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <button
            type="button"
            disabled={!!built.errors || opening}
            onClick={openIt}
            className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}
            data-testid="open-workshop"
          >
            {opening ? 'Opening…' : 'Open for seats'}
          </button>
          {built.errors && (
            <span className="text-[0.6875rem] text-[#5A5751]" data-testid="opener-waits-for">
              {built.errors[0]}
            </span>
          )}
        </div>
        {opened && (
          <p className="text-xs mt-1 text-[#1A1815]" role="status" data-testid="opener-result" data-ok={opened.ok ? 'yes' : 'no'}>
            {opened.ok
              ? 'Open. It is on the workshop shelf now, with its seats.'
              : opened.errors
                ? opened.errors.join(' ')
                : `Not opened (${opened.error}). Nothing was posted.`}
          </p>
        )}
      </div>

      {AWAITING_SOURCES.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E8E4DC]" data-testid="awaiting-sources">
          <div className={eyebrow}>Named sources not yet in the app</div>
          {AWAITING_SOURCES.map((s) => (
            <p key={s.id} className="text-[0.6875rem] text-[#1A1815]">
              <strong>{s.title}</strong>. {s.why}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
