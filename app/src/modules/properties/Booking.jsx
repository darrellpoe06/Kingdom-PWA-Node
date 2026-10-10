// =============================================================================
// Booking — book a stay on a short-stay door, and the family's Stays desk
// (DR-0930, migration 0269)
// =============================================================================
// Darrell, 2026-10-10: "Calendar for booking the apartment?", "With blackout
// dates for already booked...", "Short term rentals need another form...",
// "users keep their accounts and historical information so they can rebook",
// "we like getting emails and other connections data for clarity on users
// preferences... may end up offering products inside the apartment".
//
// BookAStay is the guest's short form (no account): a calendar with every
// taken night blacked out (the reason never shown), the nights and the total,
// name and a phone or email, the two attestations the research set (lead
// guest 21+, house rules), what would make the stay better, and an UNTICKED
// "send me offers for my next stay" by email. It asks; the family confirms.
//
// StayDesk is the family's: asks to confirm or decline, what is coming and
// what has been, black out nights, and enter a stay themselves (any length:
// the 29-night cap is the guest default, not the owner's limit).
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { boundedRead } from '../../lib/bounded-read.js';
import { loadBookedNights, requestAStay, loadDoorStays, addDoorStay, decideStay } from './cloud.js';
import {
  GUEST_MAX_NIGHTS, HOUSE_RULES, addDays, iso, monthGrid, nightsBetween, takenNights, checkStayAsk, stayBook,
} from './booking.js';

const serif = { fontFamily: '"Fraunces", serif' };
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50]';
const btn = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40';
const READ_MS = 8000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** One month, every taken night blacked out; tap the arrival night, then the day you leave. */
export function MonthCalendar({ year, month, taken, today, checkIn, checkOut, onPick }) {
  const weeks = monthGrid(year, month);
  return (
    <table className="text-center text-xs" data-testid="month-calendar" aria-label={`${MONTHS[month]} ${year}`}>
      <caption className="text-[0.6875rem] uppercase tracking-wider text-[#2F5D50] font-semibold pb-1">{MONTHS[month]} {year}</caption>
      <thead><tr>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <th key={i} scope="col" className="w-9 font-normal text-[#5A5751]">{d}</th>)}</tr></thead>
      <tbody>
        {weeks.map((w, wi) => (
          <tr key={wi}>
            {w.map((d, di) => {
              if (!d) return <td key={di} />;
              const isTaken = taken.has(d);
              const past = d < today;
              const chosen = checkIn && (d === checkIn || (checkOut && d >= checkIn && d < checkOut));
              const cls = isTaken ? 'bg-[#1A1815] text-[#FAF8F4] line-through'
                : past ? 'text-[#B9B4AA]'
                  : chosen ? 'bg-[#2F5D50] text-white'
                    : 'text-[#1A1815] hover:bg-[#F0EDE6]';
              return (
                <td key={di} className="p-0">
                  <button type="button" disabled={past} onClick={() => onPick(d)}
                    className={`w-9 h-9 focus:outline focus:outline-2 focus:outline-[#B85838] ${cls}`}
                    aria-label={`${d}${isTaken ? ' taken' : ''}`} data-taken={isTaken ? 'yes' : undefined}>
                    {Number(d.slice(8))}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The guest's short form. `today` is injectable for tests. */
export function BookAStay({ rentalId, placeName = 'this place', rate = null, today = iso(new Date()), onDone = null }) {
  const [ranges, setRanges] = useState(null);
  const [view, setView] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [f, setF] = useState({ checkIn: '', checkOut: '', guests: 1, name: '', phone: '', email: '', is21: false, rules: false, wishes: '', offers: false, note: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    let live = true;
    boundedRead(loadBookedNights(rentalId, today, addDays(today, 400)), READ_MS, { ok: false })
      .then((r) => { if (live) setRanges(r.ok ? r.ranges : []); });
    return () => { live = false; };
  }, [rentalId, today]);
  const taken = useMemo(() => takenNights(ranges || []), [ranges]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));

  const pick = (d) => {
    setF((x) => {
      if (!x.checkIn || (x.checkIn && x.checkOut) || d <= x.checkIn) return { ...x, checkIn: d, checkOut: '' };
      return { ...x, checkOut: d };
    });
  };
  const nextMonth = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const second = new Date(view.y, view.m + 1, 1);
  const check = checkStayAsk({ ...f, taken, today, rate });

  const send = async () => {
    setErrors(check.errors);
    if (!check.ok) return;
    setBusy(true);
    const r = await requestAStay({ rentalId, ...f });
    setBusy(false);
    if (!r.ok) { setErrors({ send: `Not sent: ${r.reason}` }); return; }
    setDone({ ...f, nights: check.nights, total: check.total });
    if (onDone) onDone();
  };

  if (done) {
    return (
      <section className="border border-[#E8E4DC] bg-white p-3 mt-2" data-testid="book-a-stay-done">
        <h4 className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold text-[#2F5D50]">Asked</h4>
        <p className="text-sm text-[#1A1815]" style={serif}>
          {done.nights} night{done.nights === 1 ? '' : 's'} at {placeName}, {done.checkIn} to {done.checkOut}{done.total ? `, about $${done.total.toFixed(2)}` : ''}.
          We confirm by {done.phone ? 'text' : 'email'} and send the address and check-in steps then.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-[#E8E4DC] bg-white p-3 mt-2" data-testid="book-a-stay">
      <h4 className="text-[0.625rem] uppercase tracking-[0.2em] font-semibold text-[#2F5D50] mb-1">Book a stay — no account needed</h4>
      <p className="text-xs text-[#5A5751] mb-2" style={serif}>
        Tap the night you arrive, then the day you leave. Dark nights are taken. Up to {GUEST_MAX_NIGHTS} nights here; for longer, apply for a lease.
      </p>
      {ranges === null ? <p className="text-xs text-[#5A5751]">Reading the calendar…</p> : (
        <>
          <div className="flex items-center justify-between mb-1">
            <button type="button" className={`${btn} bg-white border-[#E8E4DC]`} onClick={() => nextMonth(-1)} aria-label="Earlier month">‹</button>
            <button type="button" className={`${btn} bg-white border-[#E8E4DC]`} onClick={() => nextMonth(1)} aria-label="Later month">›</button>
          </div>
          <div className="flex flex-wrap gap-4">
            <MonthCalendar year={view.y} month={view.m} taken={taken} today={today} checkIn={f.checkIn} checkOut={f.checkOut} onPick={pick} />
            <MonthCalendar year={second.getFullYear()} month={second.getMonth()} taken={taken} today={today} checkIn={f.checkIn} checkOut={f.checkOut} onPick={pick} />
          </div>
        </>
      )}
      <p className="text-sm text-[#1A1815] mt-2" style={serif} data-testid="stay-summary">
        {f.checkIn && f.checkOut ? `${f.checkIn} to ${f.checkOut}: ${nightsBetween(f.checkIn, f.checkOut)} night${nightsBetween(f.checkIn, f.checkOut) === 1 ? '' : 's'}${check.total ? `, about $${check.total.toFixed(2)}` : ''}` : f.checkIn ? `Arriving ${f.checkIn}: now tap the day you leave.` : 'No nights picked yet.'}
      </p>
      {errors.dates && <p className="text-xs text-[#B85838]">{errors.dates}</p>}
      <div className="grid sm:grid-cols-2 gap-2 mt-2">
        <label className="text-xs text-[#5A5751]">Your name (as on your ID)<input value={f.name} onChange={set('name')} aria-label="Your name" className={`${field} block w-full`} style={serif} /></label>
        <label className="text-xs text-[#5A5751]">How many people<input type="number" min={1} max={20} value={f.guests} onChange={set('guests')} aria-label="How many people" className={`${field} block w-24`} /></label>
        <label className="text-xs text-[#5A5751]">Cell phone<input value={f.phone} onChange={set('phone')} inputMode="tel" aria-label="Cell phone" className={`${field} block w-full`} /></label>
        <label className="text-xs text-[#5A5751]">Email<input value={f.email} onChange={set('email')} inputMode="email" aria-label="Email" className={`${field} block w-full`} /></label>
      </div>
      {(errors.name || errors.contact || errors.guests) && <p className="text-xs text-[#B85838]">{errors.name || errors.contact || errors.guests}</p>}
      <label className="block text-xs text-[#5A5751] mt-2">What would make your stay better? (optional)
        <input value={f.wishes} onChange={set('wishes')} maxLength={500} placeholder="Coffee, an early check-in, a crib…" aria-label="What would make your stay better" className={`${field} block w-full`} style={serif} />
      </label>
      <details className="mt-2"><summary className="text-xs text-[#2F5D50] cursor-pointer">The house rules</summary>
        <ul className="list-disc pl-5 text-xs text-[#1A1815] mt-1" style={serif}>{HOUSE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      </details>
      <label className="flex items-start gap-2 text-xs text-[#1A1815] mt-2"><input type="checkbox" checked={f.is21} onChange={set('is21')} aria-label="I am 21 or older" /> I am 21 or older and will show a photo ID at check-in.</label>
      <label className="flex items-start gap-2 text-xs text-[#1A1815] mt-1"><input type="checkbox" checked={f.rules} onChange={set('rules')} aria-label="I accept the house rules" /> I accept the house rules.</label>
      <label className="flex items-start gap-2 text-xs text-[#1A1815] mt-1"><input type="checkbox" checked={f.offers} onChange={set('offers')} aria-label="Send me offers by email" /> Send me offers for my next stay by email (you can unsubscribe anytime).</label>
      {(errors.is21 || errors.rules) && <p className="text-xs text-[#B85838]">{errors.is21 || errors.rules}</p>}
      <button type="button" onClick={send} disabled={busy} className={`${btn} mt-2 bg-[#2F5D50] text-white border-[#2F5D50]`} data-testid="book-a-stay-send">Ask for these nights</button>
      {errors.send && <p className="text-xs text-[#B85838] mt-1" role="alert">{errors.send}</p>}
      <p className="text-[0.6875rem] text-[#5A5751] mt-2" style={serif}>Nothing is charged here. The family confirms, then sends the address, check-in steps and how to pay.</p>
    </section>
  );
}

/** The family's calendar for one door. */
export function StayDesk({ instanceId, rentalId, today = iso(new Date()) }) {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState('');
  const [blk, setBlk] = useState({ from: '', to: '', reason: '' });
  const [own, setOwn] = useState({ from: '', to: '', name: '', phone: '' });

  const reload = useCallback(async () => {
    const r = await boundedRead(loadDoorStays(rentalId), READ_MS, { ok: false });
    setRows(r.ok ? r.rows : []);
  }, [rentalId]);
  useEffect(() => { reload(); }, [reload]);
  const book = stayBook(rows || [], today);

  const act = async (p, ok) => { const r = await p; setMsg(r.ok ? ok : `Not done: ${r.reason}`); reload(); };

  if (!rentalId) return <p className="text-xs text-[#5A5751]" style={serif}>Pick a door first.</p>;
  const line = (r) => `${r.check_in} to ${r.check_out} (${nightsBetween(r.check_in, r.check_out)} nights)${r.kind === 'block' ? ` · blacked out${r.block_reason ? `: ${r.block_reason}` : ''}` : ` · ${r.guest_name}${r.guests ? `, ${r.guests} guest${r.guests === 1 ? '' : 's'}` : ''}`}`;
  const contact = (r) => [r.guest_phone, r.guest_email].filter(Boolean).join(' · ');

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="stay-desk">
      <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-2">Stays</h3>
      {rows === null ? <p className="text-xs text-[#5A5751]">Reading the calendar…</p> : (
        <>
          <h4 className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50] mt-1">Asks waiting ({book.asks.length})</h4>
          {book.asks.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>Nobody is waiting.</p> : book.asks.map((r) => (
            <div key={r.id} className="border-b border-[#F0EDE6] py-2" data-testid="stay-ask">
              <p className="text-sm text-[#1A1815]" style={serif}>{line(r)}</p>
              <p className="text-xs text-[#5A5751]" style={serif}>
                {contact(r)}{r.stay_wishes ? ` · wishes: "${r.stay_wishes}"` : ''}{r.offers_by_email ? ' · yes to offers by email' : ''}{r.note ? ` · "${r.note}"` : ''}
              </p>
              <div className="flex gap-2 mt-1">
                <button type="button" className={`${btn} bg-[#2F5D50] text-white border-[#2F5D50]`} onClick={() => act(decideStay(r.id, 'confirmed'), `Confirmed ${r.guest_name}. Send them the address and check-in steps.`)}>Confirm</button>
                <button type="button" className={`${btn} bg-white border-[#E8E4DC]`} onClick={() => act(decideStay(r.id, 'declined'), `Declined ${r.guest_name}.`)}>Decline</button>
              </div>
            </div>
          ))}
          <h4 className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50] mt-3">Coming up ({book.upcoming.length})</h4>
          {book.upcoming.length === 0 ? <p className="text-xs text-[#5A5751]" style={serif}>Nothing booked or blacked out ahead.</p> : book.upcoming.map((r) => (
            <div key={r.id} className="border-b border-[#F0EDE6] py-1.5 flex flex-wrap items-center justify-between gap-2" data-testid="stay-upcoming">
              <span className="text-sm text-[#1A1815]" style={serif}>{line(r)}{r.kind === 'stay' && contact(r) ? ` · ${contact(r)}` : ''}</span>
              <button type="button" className={`${btn} bg-white border-[#B85838] text-[#B85838]`} onClick={() => act(decideStay(r.id, 'cancelled'), 'Cancelled; those nights are open again.')}>Cancel</button>
            </div>
          ))}
          <h4 className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50] mt-3">Black out nights</h4>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-[#5A5751]">From<input type="date" value={blk.from} onChange={(e) => setBlk((b) => ({ ...b, from: e.target.value }))} aria-label="Blackout from" className={`${field} block`} /></label>
            <label className="text-xs text-[#5A5751]">To (open again)<input type="date" value={blk.to} onChange={(e) => setBlk((b) => ({ ...b, to: e.target.value }))} aria-label="Blackout to" className={`${field} block`} /></label>
            <label className="text-xs text-[#5A5751]">Why (only you see it)<input value={blk.reason} onChange={(e) => setBlk((b) => ({ ...b, reason: e.target.value }))} maxLength={300} aria-label="Blackout reason" className={`${field} block`} style={serif} /></label>
            <button type="button" className={`${btn} bg-[#1A1815] text-white border-[#1A1815]`} disabled={!blk.from || !blk.to}
              onClick={() => act(addDoorStay({ instance_id: instanceId, rental_id: rentalId, kind: 'block', status: 'confirmed', check_in: blk.from, check_out: blk.to, block_reason: blk.reason || null }), 'Blacked out.')}>Black out</button>
          </div>
          <h4 className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50] mt-3">Enter a stay yourself</h4>
          <p className="text-xs text-[#5A5751]" style={serif}>Any length: the {GUEST_MAX_NIGHTS}-night limit is for guests booking themselves. Over 29 nights, consider the lease (tax and tenancy rules change at 30).</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-[#5A5751]">Arrives<input type="date" value={own.from} onChange={(e) => setOwn((b) => ({ ...b, from: e.target.value }))} aria-label="Stay arrives" className={`${field} block`} /></label>
            <label className="text-xs text-[#5A5751]">Leaves<input type="date" value={own.to} onChange={(e) => setOwn((b) => ({ ...b, to: e.target.value }))} aria-label="Stay leaves" className={`${field} block`} /></label>
            <label className="text-xs text-[#5A5751]">Guest<input value={own.name} onChange={(e) => setOwn((b) => ({ ...b, name: e.target.value }))} aria-label="Stay guest name" className={`${field} block`} style={serif} /></label>
            <label className="text-xs text-[#5A5751]">Their phone<input value={own.phone} onChange={(e) => setOwn((b) => ({ ...b, phone: e.target.value }))} inputMode="tel" aria-label="Stay guest phone" className={`${field} block`} /></label>
            <button type="button" className={`${btn} bg-[#2F5D50] text-white border-[#2F5D50]`} disabled={!own.from || !own.to || !own.name || !own.phone}
              onClick={() => act(addDoorStay({ instance_id: instanceId, rental_id: rentalId, kind: 'stay', status: 'confirmed', check_in: own.from, check_out: own.to, guest_name: own.name, guest_phone: own.phone }), 'Booked.')}>Book it</button>
          </div>
          {book.past.length > 0 && (
            <details className="mt-3"><summary className="text-xs text-[#5A5751] cursor-pointer">Past stays ({book.past.length})</summary>
              {book.past.map((r) => <p key={r.id} className="text-xs text-[#5A5751] py-0.5" style={serif}>{line(r)}{r.stay_wishes ? ` · wished: "${r.stay_wishes}"` : ''}</p>)}
            </details>
          )}
        </>
      )}
      {msg && <p className="text-xs text-[#2F5D50] mt-2" role="status" data-testid="stay-desk-msg">{msg}</p>}
    </section>
  );
}
