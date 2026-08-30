// =============================================================================
// EventManagement — Church > Venues: COMMUNITY use of the two campuses
// =============================================================================
// DISTINCT from Conference (the church's OWN event). This houses the data +
// responsibilities + revenue for OUTSIDE community use of both campuses (North,
// the main church; South, the Event Center at 1109 N 4th St) — funerals, weddings,
// gatherings, which the community requests often.
//
// TWO AUDIENCES, ONE surface:
//   - Community (anyone): a friendly "request a space" front door — the catalog of
//     campuses/spaces (NO prices; pricing is never public) + the shared
//     VenueRequestForm. Same form as the standalone ?request-space=1 page.
//   - Staff (owner/admin via isChurchStaff): the back office — requests inbox, the
//     booking calendar with a real NO-DOUBLE-BOOKING guard, the per-event-type
//     responsibilities checklist tied to teams, and the REVENUE line (real
//     staff-entered quoted prices). RLS is the true enforcement; this only gates UI.
//
// Real data: venue_bookings (migration 0030), live via subscribeBookings. No painted
// numbers — revenue sums REAL quoted prices on scheduled/completed bookings only.
import React, { useEffect, useMemo, useState } from 'react';
import KpiDot from './KpiDot.jsx';
import SectionTabs from './SectionTabs.jsx';
import VenueRequestForm from './VenueRequestForm.jsx';
import {
  CAMPUSES, eventTypeLabel, findCampus, findSpace,
  responsibilitiesFor, responsibilityProgress, bookingConflicts,
  revenueSummary, formatPrice, mediaExpectedLabels, hasCueSheet,
  subscribeBookings, updateBooking, toggleResponsibility, deleteBooking,
  fetchBookingMessages, sendBookingMessage, fetchMyVenueRequests,
  subscribeRateCard, isCommercialBooking, bookingQuote,
} from '../lib/venue-rental.js';
import { mergeRateCard, finalPaymentDueDate, finalPaymentOverdue } from '../lib/venue-commercial-rates.js';
import { RateCardPanel, CommercialQuoteBuilder, usd } from './CommercialRateCard.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const STATUS_LABEL = {
  requested: 'Requested', reviewing: 'Reviewing', scheduled: 'Scheduled',
  declined: 'Declined', completed: 'Completed', cancelled: 'Cancelled',
};
const STATUS_TONE = {
  requested: 'attention', reviewing: 'attention', scheduled: 'good',
  completed: 'good', declined: 'idle', cancelled: 'idle',
};
const OPEN_STATUSES = new Set(['requested', 'reviewing']);

function formatDate(d) {
  if (!d) return 'Date TBD';
  try {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}
function formatTimeRange(s, e) {
  if (!s && !e) return 'All day';
  return `${s || '?'}–${e || '?'}`;
}

// --- The read-only campus catalog (shown to everyone; NO prices) --------------
function CampusCatalog() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
      {CAMPUSES.map((c) => (
        <div key={c.id} className="bg-white border border-[#E8E4DC] p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold text-[#1A1815]" style={serif}>{c.name}</h3>
            <span className="text-[0.625rem] uppercase tracking-wider text-[#B85838] font-semibold">{c.tier} rate</span>
          </div>
          <p className="text-xs text-[#5A5751] mt-0.5" style={serif}>{c.address}</p>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>{c.blurb}</p>
          <ul className="text-xs text-[#1A1815] mt-2 space-y-0.5" style={serif}>
            {c.spaces.map((s) => (
              <li key={s.id}>• {s.name}{Number.isFinite(s.capacity) ? <span className="text-[#5A5751]"> (up to {s.capacity})</span> : null}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// --- One responsibility checklist (staff) ------------------------------------
function Responsibilities({ booking, onToggle }) {
  const template = responsibilitiesFor(booking.eventType);
  const state = booking.responsibilities || {};
  return (
    <ul className="mt-2 space-y-1">
      {template.map((r) => {
        const done = state[r.key] === true;
        return (
          <li key={r.key}>
            <label className="flex items-center gap-2 text-xs text-[#1A1815] cursor-pointer min-h-[28px]" style={serif}>
              <input
                type="checkbox"
                checked={done}
                onChange={() => onToggle(booking, r.key)}
                className="w-4 h-4 accent-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              />
              <span className={done ? 'line-through text-[#5A5751]' : ''}>{r.label}</span>
              <span className="text-[0.625rem] uppercase tracking-wide text-[#5A5751]">· {r.team}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

// --- Booking correspondence (0148): the thread the team can carry ------------
// Shared by the staff card and the requester's "My requests" view. Direct
// Messages are E2E-encrypted between two people by design, so the TEAM-visible
// history lives here, on the booking — append-only, so when someone is out the
// next person has the whole thread and can contact the parties.
function CorrespondenceThread({ bookingId, viewerIsStaff }) {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendState, setSendState] = useState('idle'); // idle | sending | error

  const load = async () => {
    const { ok, rows } = await fetchBookingMessages(bookingId);
    if (ok) setMessages(rows);
    setLoaded(true);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sendState === 'sending') return;
    setSendState('sending');
    const res = await sendBookingMessage(bookingId, text);
    if (res.ok) { setDraft(''); setSendState('idle'); await load(); }
    else setSendState('error');
  };

  const who = (m) => {
    if (viewerIsStaff) return m.fromStaff ? (m.authorEmail || 'Team') : 'Requester';
    return m.fromStaff ? 'The Love Corner team' : 'You';
  };

  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Correspondence</p>
      <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={serif}>
        Shared with the church’s event and media team — so someone can always pick it up. It can’t be edited or deleted.
      </p>
      {!loaded && <p className="text-xs text-[#5A5751] mt-2" style={serif}>Loading…</p>}
      {loaded && messages.length === 0 && <p className="text-xs text-[#5A5751] mt-2" style={serif}>No messages yet.</p>}
      {messages.length > 0 && (
        <ul className="mt-2 space-y-2">
          {messages.map((m) => (
            <li key={m.id} className="text-xs" style={serif}>
              <span className="font-semibold text-[#1A1815]">{who(m)}</span>
              <span className="text-[#5A5751]"> · {m.createdAt ? new Date(m.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</span>
              <p className="text-[#1A1815] mt-0.5 whitespace-pre-wrap break-words">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder="Write a message…"
          aria-label="Write a correspondence message"
          className="flex-1 border border-[#1A1815] px-3 py-2 min-h-[40px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
        />
        <button type="button" onClick={send} disabled={sendState === 'sending' || !draft.trim()} className="text-[0.6875rem] uppercase tracking-wider px-3 py-2 min-h-[40px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]">
          Send
        </button>
      </div>
      {sendState === 'error' && <p className="text-xs text-[#7A1F1F] mt-1" aria-live="assertive" style={serif}>That message did NOT send — please try again.</p>}
    </div>
  );
}

// --- One booking card (staff) ------------------------------------------------
function BookingCard({ booking, allBookings, onUpdate, onToggle, onDelete, rateCard }) {
  const [priceDraft, setPriceDraft] = useState(booking.quotedPrice ?? '');
  const [open, setOpen] = useState(OPEN_STATUSES.has(booking.status));
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPriceDraft(booking.quotedPrice ?? ''); }, [booking.quotedPrice]);

  const conflicts = useMemo(() => bookingConflicts(allBookings, booking), [allBookings, booking]);
  const prog = responsibilityProgress(booking);
  const space = findSpace(booking.spaceId);
  const campus = findCampus(booking.campus);
  // A commercial booking is priced by the team's rate card, never by hand. The
  // quote is RECOMPUTED here on every render, so a rate the team changes
  // reprices the booking instead of leaving a stale number on the screen.
  const commercial = isCommercialBooking(booking);
  const quote = commercial ? bookingQuote(booking, rateCard) : null;
  const balanceDue = commercial ? finalPaymentDueDate(booking.eventDate, rateCard) : null;
  const balanceOverdue = commercial && OPEN_STATUSES.has(booking.status)
    && finalPaymentOverdue(booking.eventDate, rateCard);

  const act = async (patch) => {
    setBusy(true);
    await onUpdate(booking.id, patch);
    setBusy(false);
  };
  const savePrice = async () => {
    if (String(priceDraft) === String(booking.quotedPrice ?? '')) return;
    await act({ quotedPrice: priceDraft });
  };
  // No-double-booking guard: scheduling is blocked while a real conflict exists.
  const canSchedule = booking.status !== 'scheduled' && conflicts.length === 0;

  return (
    <div className="bg-white border border-[#E8E4DC] p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[#1A1815]" style={serif}>{eventTypeLabel(booking.eventType)}</span>
            {booking.eventTitle && <span className="text-sm text-[#5A5751]" style={serif}>— {booking.eventTitle}</span>}
            <KpiDot status={STATUS_TONE[booking.status] || 'idle'} label={STATUS_LABEL[booking.status] || booking.status} className="text-[0.6875rem]" />
          </div>
          <p className="text-xs text-[#5A5751] mt-1" style={serif}>
            {campus?.name || booking.campus} · {space?.name || booking.spaceName || booking.spaceId}
          </p>
          <p className="text-xs text-[#1A1815] mt-0.5" style={serif}>
            {formatDate(booking.eventDate)} · {formatTimeRange(booking.startTime, booking.endTime)}
            {Number.isFinite(booking.expectedAttendance) ? ` · ~${booking.expectedAttendance} people` : ''}
          </p>
          <p className="text-xs text-[#5A5751] mt-0.5" style={serif}>
            {booking.requesterName}
            {booking.organization ? ` · ${booking.organization}` : ''}
            {booking.requesterPhone ? ` · ${booking.requesterPhone}` : ''}
            {booking.requesterEmail ? ` · ${booking.requesterEmail}` : ''}
          </p>
          {/* 0147: they submitted signed-in, so the app itself is a follow-up
              channel — Messages first, email/phone still an option. */}
          {booking.requesterUser && (
            <p className="text-[0.6875rem] text-[#1A1815] mt-0.5" style={serif}>
              <span className="uppercase tracking-wide font-semibold text-[#B85838]">App member</span> — you can follow up in Messages; email/phone stay optional.
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <KpiDot status={prog.tone} label={`${prog.done}/${prog.total} ready`} title="Responsibilities assigned" className="text-[0.6875rem]" />
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mt-2 border-l-4 border-[#7A1F1F] bg-[#FBF2F2] px-3 py-2" role="alert">
          <p className="text-xs text-[#7A1F1F] font-semibold" style={serif}>
            Double-booking conflict — this space is already taken at this time:
          </p>
          <ul className="text-[0.6875rem] text-[#7A1F1F] mt-0.5" style={serif}>
            {conflicts.map((c) => (
              <li key={c.id}>• {STATUS_LABEL[c.status] || c.status}: {eventTypeLabel(c.eventType)}{c.eventTitle ? ` (${c.eventTitle})` : ''} · {formatTimeRange(c.startTime, c.endTime)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Commercial bookings carry money and a clock, so both are visible without
          opening the card: what the church earns, what it is only holding, and
          when the balance is due. */}
      {commercial && quote && (
        <div className="mt-2 border-l-4 border-[#1A1815] bg-[#FAF8F4] px-3 py-2">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">
            Commercial quote{rateCard.status !== 'approved' ? ' · proposed rates' : ''}
          </p>
          <p className="text-xs text-[#1A1815] mt-0.5" style={serif}>
            {usd(quote.eventCharges)} event charges · {quote.hours} hr · {quote.soundPeople} sound · {quote.securityPeople} security
            {quote.refundableDeposit > 0 && <span className="text-[#5A5751]"> · {usd(quote.refundableDeposit)} deposit held (not income)</span>}
          </p>
          <p className={`text-[0.6875rem] mt-0.5 ${balanceOverdue ? 'text-[#7A1F1F] font-semibold' : 'text-[#5A5751]'}`} style={serif}>
            {usd(quote.schedule.atSigning)} at signing · {usd(quote.schedule.thirtyDaysBefore)} {balanceDue ? `by ${balanceDue}` : 'before the event'}
            {balanceOverdue ? ' — that date has passed: the balance is due in full now.' : ''}
          </p>
        </div>
      )}
      {commercial && !quote && (
        <p className="text-[0.6875rem] text-[#B85838] mt-2 font-semibold" style={serif}>
          Commercial event — not quoted yet. Open Manage to price it from the team’s rate card.
        </p>
      )}

      {booking.notes && <p className="text-xs text-[#5A5751] mt-2 italic" style={serif}>“{booking.notes}”</p>}

      {/* The media cue sheet (Bro Clifton Reed's intake, merged 0146): what the
          requester says the media team should expect. Files travel the media
          team's channel until in-app upload lands (DR-0307). */}
      {hasCueSheet(booking) && (
        <div className="mt-2 border-l-4 border-[#1A1815] bg-[#FAF8F4] px-3 py-2">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Media cue sheet · Media Team</p>
          {mediaExpectedLabels(booking).length > 0 && (
            <p className="text-xs text-[#1A1815] mt-0.5" style={serif}>Expecting: {mediaExpectedLabels(booking).join(' · ')}</p>
          )}
          {booking.musicLink && (
            <p className="text-xs text-[#1A1815] mt-0.5" style={serif}>
              {/* Public-form input: only an http(s) URL becomes clickable —
                  anything else renders as inert text (no javascript: hrefs). */}
              Music: {/^https?:\/\//i.test(booking.musicLink)
                ? <a href={booking.musicLink} target="_blank" rel="noopener noreferrer" className="text-[#B85838] underline underline-offset-2 break-all focus:outline focus:outline-2 focus:outline-[#B85838]">{booking.musicLink}</a>
                : <span className="break-all">{booking.musicLink}</span>}
            </p>
          )}
          {booking.mediaNotes && <p className="text-xs text-[#5A5751] mt-0.5 italic" style={serif}>“{booking.mediaNotes}”</p>}
        </div>
      )}

      <button type="button" onClick={() => setOpen((o) => !o)} className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] mt-2 underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]">
        {open ? 'Hide details' : 'Manage'}
      </button>

      {open && (
        <div className="mt-3 border-t border-[#E8E4DC] pt-3 space-y-3">
          {/* Responsibilities — so nothing is dropped */}
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Responsibilities</p>
            <Responsibilities booking={booking} onToggle={onToggle} />
          </div>

          {/* Correspondence — the team-visible history (0148) */}
          <CorrespondenceThread bookingId={booking.id} viewerIsStaff={true} />

          {/* Status actions — Schedule is guarded by the conflict check */}
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-1">Status</p>
            <div className="flex flex-wrap gap-2">
              {booking.status !== 'reviewing' && booking.status !== 'scheduled' && (
                <button type="button" disabled={busy} onClick={() => act({ status: 'reviewing' })} className="text-[0.6875rem] px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">Mark reviewing</button>
              )}
              <button
                type="button"
                disabled={busy || !canSchedule}
                onClick={() => act({ status: 'scheduled' })}
                title={conflicts.length ? 'Resolve the double-booking conflict before scheduling' : 'Confirm + schedule this booking'}
                className="text-[0.6875rem] px-3 py-2 min-h-[36px] border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#3a352f] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {conflicts.length ? 'Schedule (blocked — conflict)' : 'Schedule'}
              </button>
              {booking.status === 'scheduled' && (
                <button type="button" disabled={busy} onClick={() => act({ status: 'completed' })} className="text-[0.6875rem] px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">Mark completed</button>
              )}
              {booking.status !== 'declined' && (
                <button type="button" disabled={busy} onClick={() => act({ status: 'declined' })} className="text-[0.6875rem] px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] hover:bg-[#5A5751] hover:text-white disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]">Decline</button>
              )}
            </div>
          </div>

          {/* Revenue line. A COMMERCIAL booking is priced by the team's rate card
              (the builder writes both the quote inputs and the event charges);
              every other event type keeps the hand-entered price it always had,
              because a funeral or a church gathering has no rate card. */}
          {commercial ? (
            <CommercialQuoteBuilder
              booking={booking}
              card={rateCard}
              onSave={(patch) => onUpdate(booking.id, patch)}
            />
          ) : (
          <div>
            <label htmlFor={`price-${booking.id}`} className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold block mb-1">Quoted price ({campus?.tier || 'standard'} rate)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#1A1815]" style={serif}>$</span>
              <input
                id={`price-${booking.id}`}
                type="number" min="0" inputMode="decimal"
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                onBlur={savePrice}
                placeholder="set the agreed amount"
                className="w-40 border border-[#1A1815] px-3 py-2 min-h-[40px] text-sm text-[#1A1815] bg-white focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              />
              <span className="text-[0.6875rem] text-[#5A5751]">counts as income once scheduled</span>
            </div>
          </div>
          )}

          <div>
            <button type="button" disabled={busy} onClick={() => { if (typeof window !== 'undefined' && window.confirm('Delete this booking? This cannot be undone.')) onDelete(booking.id); }} className="text-[0.6875rem] text-[#7A1F1F] underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- The staff back office ---------------------------------------------------
function StaffConsole() {
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // The team's live rate card (0162). Before it loads — and for a staff member
  // whose instance has never edited it — this is Christina's committed proposal,
  // merged, so the surface always has a complete card and says which it is.
  const [rateCard, setRateCard] = useState(() => mergeRateCard(null));

  useEffect(() => {
    const unsub = subscribeBookings((rows) => { setBookings(rows); setLoaded(true); });
    return unsub;
  }, []);
  useEffect(() => subscribeRateCard((card) => setRateCard(card)), []);

  const onUpdate = async (id, patch) => { await updateBooking(id, patch); };
  const onToggle = async (booking, key) => { await toggleResponsibility(booking, key); };
  const onDelete = async (id) => { await deleteBooking(id); };

  const revenue = useMemo(() => revenueSummary(bookings), [bookings]);
  const open = useMemo(() => bookings.filter((b) => OPEN_STATUSES.has(b.status)), [bookings]);
  const scheduled = useMemo(
    () => bookings.filter((b) => b.status === 'scheduled' || b.status === 'completed')
      .sort((a, b) => String(a.eventDate || '').localeCompare(String(b.eventDate || '')) || String(a.startTime || '').localeCompare(String(b.startTime || ''))),
    [bookings],
  );
  const closed = useMemo(() => bookings.filter((b) => b.status === 'declined' || b.status === 'cancelled'), [bookings]);
  const totalConflicts = useMemo(
    () => scheduled.filter((b) => bookingConflicts(bookings, b).length > 0).length,
    [scheduled, bookings],
  );

  return (
    <div>
      {/* Revenue + health summary — real numbers only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-[#E8E4DC] p-4">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Booked revenue</p>
          <p className="text-2xl text-[#1A1815] mt-1" style={{ ...serif, fontWeight: 600 }}>{formatPrice(revenue.total)}</p>
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={serif}>
            North {formatPrice(revenue.byCampus.north)} · South {formatPrice(revenue.byCampus.south)}
          </p>
        </div>
        <div className="bg-white border border-[#E8E4DC] p-4">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Requests to review</p>
          <p className="text-2xl text-[#1A1815] mt-1" style={{ ...serif, fontWeight: 600 }}>{open.length}</p>
          <KpiDot status={open.length ? 'attention' : 'good'} label={open.length ? 'needs review' : 'all clear'} className="text-[0.6875rem] mt-1" />
        </div>
        <div className="bg-white border border-[#E8E4DC] p-4">
          <p className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751] font-semibold">Schedule health</p>
          <p className="text-2xl text-[#1A1815] mt-1" style={{ ...serif, fontWeight: 600 }}>{scheduled.length}</p>
          <KpiDot status={totalConflicts ? 'problem' : 'good'} label={totalConflicts ? `${totalConflicts} conflict${totalConflicts === 1 ? '' : 's'}` : 'no double-bookings'} className="text-[0.6875rem] mt-1" />
        </div>
      </div>

      {!loaded && <p className="text-sm text-[#5A5751]" style={serif}>Loading bookings…</p>}

      {/* The back office flows as SectionTabs ("sliding tabs instead of a long
          scroll", Darrell 2026-07-04): the revenue/health KPI strip stays PINNED
          above the strip (always visible — "no more down scrolling to see KPIs"),
          and the long booking lists move behind section tabs. Requests and
          Declined/cancelled are data-conditional sections — they appear only when
          real rows exist; the pinned KPIs still say "all clear" when they don't.
          Mounted once bookings have loaded so the default tab opens on real data. */}
      {loaded && (
        <SectionTabs
          ariaLabel="Venue back-office sections"
          idBase="venues-staff"
          defaultId="requests"
          sections={[
            open.length > 0 ? {
              id: 'requests',
              label: `Requests to review (${open.length})`,
              icon: 'mail',
              render: () => (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-[#1A1815] mb-2" style={serif}>Requests to review</h3>
                  <div className="space-y-3">
                    {open.map((b) => <BookingCard key={b.id} booking={b} allBookings={bookings} onUpdate={onUpdate} onToggle={onToggle} onDelete={onDelete} rateCard={rateCard} />)}
                  </div>
                </section>
              ),
            } : null,
            {
              id: 'calendar',
              label: 'Booking calendar',
              icon: 'calendar',
              render: () => (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-[#1A1815] mb-2" style={serif}>Booking calendar</h3>
                  {scheduled.length === 0
                    ? <p className="text-sm text-[#5A5751]" style={serif}>No scheduled bookings yet. Approve a request from the Requests tab, or log one from the Log-a-booking tab.</p>
                    : <div className="space-y-3">{scheduled.map((b) => <BookingCard key={b.id} booking={b} allBookings={bookings} onUpdate={onUpdate} onToggle={onToggle} onDelete={onDelete} rateCard={rateCard} />)}</div>}
                </section>
              ),
            },
            closed.length > 0 ? {
              id: 'closed',
              label: `Declined / cancelled (${closed.length})`,
              render: () => (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-[#5A5751] mb-2" style={serif}>Declined / cancelled ({closed.length})</h3>
                  <div className="space-y-3">{closed.map((b) => <BookingCard key={b.id} booking={b} allBookings={bookings} onUpdate={onUpdate} onToggle={onToggle} onDelete={onDelete} rateCard={rateCard} />)}</div>
                </section>
              ),
            } : null,
            {
              id: 'rate-card',
              label: rateCard.status === 'approved' ? 'Rate card' : 'Rate card (proposed)',
              icon: 'pencil',
              // Christina 2026-08-30: the rates are DEFAULTS for the team to work,
              // and the app is where that discussion belongs.
              render: () => (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-[#1A1815] mb-1" style={serif}>Commercial event rate card</h3>
                  <p className="text-xs text-[#5A5751] mb-3" style={serif}>
                    What the church charges when someone rents a space to make money. Staff only — no requester ever sees a price here.
                  </p>
                  <RateCardPanel card={rateCard} />
                </section>
              ),
            },
            {
              id: 'log',
              label: 'Log a booking',
              icon: 'pencil',
              // Staff: log a booking directly (creates a request they then schedule).
              render: () => (
                <section className="mt-2">
                  <button type="button" onClick={() => setShowAdd((s) => !s)} className="text-xs uppercase tracking-wider px-4 py-2.5 min-h-[44px] border-2 border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
                    {showAdd ? 'Close' : '+ Log a booking'}
                  </button>
                  {showAdd && (
                    <div className="bg-white border border-[#E8E4DC] p-4 mt-3">
                      <p className="text-xs text-[#5A5751] mb-3" style={serif}>Logs a request you can then schedule and price from the Booking calendar tab.</p>
                      <VenueRequestForm source="staff" onDone={() => setShowAdd(false)} />
                    </div>
                  )}
                </section>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}

// --- My requests (0148): the signed-in requester's own loop -------------------
// "Create an account... and we will get back to you directly." A signed-in
// requester sees their own requests (the SAFE server shape — no pricing) and
// the correspondence thread on each. Signed-out visitors see nothing here —
// the RPC refuses without an account, and that is rendered as absence, not
// as an error.
function MyVenueRequests() {
  const [rows, setRows] = useState(null); // null = not loaded / not signed in
  useEffect(() => {
    let alive = true;
    fetchMyVenueRequests().then(({ ok, rows: r }) => { if (alive && ok) setRows(r); });
    return () => { alive = false; };
  }, []);
  const [openId, setOpenId] = useState(null);
  if (!rows || rows.length === 0) return null;
  return (
    <div className="bg-white border border-[#E8E4DC] p-5 mb-4">
      <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={serif}>My requests</h3>
      <p className="text-sm text-[#5A5751] mb-3" style={serif}>
        We get back to you right here in the app — open a request to read and reply.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="border border-[#E8E4DC] p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#1A1815]" style={serif}>{eventTypeLabel(r.eventType)}</span>
              {r.eventTitle && <span className="text-sm text-[#5A5751]" style={serif}>— {r.eventTitle}</span>}
              <KpiDot status={STATUS_TONE[r.status] || 'idle'} label={STATUS_LABEL[r.status] || r.status} className="text-[0.6875rem]" />
            </div>
            <p className="text-xs text-[#5A5751] mt-0.5" style={serif}>
              {findCampus(r.campus)?.name || r.campus}{r.spaceName ? ` · ${r.spaceName}` : ''} · {formatDate(r.eventDate)} · {formatTimeRange(r.startTime, r.endTime)}
            </p>
            <button type="button" onClick={() => setOpenId((v) => (v === r.id ? null : r.id))} className="text-[0.6875rem] uppercase tracking-wider text-[#B85838] mt-1 underline-offset-2 hover:underline focus:outline focus:outline-2 focus:outline-[#B85838]">
              {openId === r.id ? 'Hide messages' : 'Messages'}
            </button>
            {openId === r.id && (
              <div className="mt-2 border-t border-[#E8E4DC] pt-2">
                <CorrespondenceThread bookingId={r.id} viewerIsStaff={false} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Public front door (everyone) --------------------------------------------
function CommunityFrontDoor() {
  return (
    <div>
      <CampusCatalog />
      <MyVenueRequests />
      <div className="bg-white border border-[#E8E4DC] p-5">
        <h3 className="text-base font-semibold text-[#1A1815] mb-1" style={serif}>Request a space</h3>
        <p className="text-sm text-[#5A5751] mb-4" style={serif}>
          Tell us what you’re planning and a church leader will reach out to confirm availability and details. No account needed — and if you create a free account first, we can get back to you directly in the app.
        </p>
        <VenueRequestForm source="in-app" />
      </div>
    </div>
  );
}

export default function EventManagement({ isChurchStaff = false }) {
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Venues</div>
        <h2 className="text-xl sm:text-2xl text-[#1A1815] mt-0.5" style={{ ...serif, fontWeight: 600, letterSpacing: '-0.01em' }}>Community Event Management</h2>
        <p className="text-sm text-[#5A5751] mt-1" style={serif}>
          The church’s two campuses, open to the community for funerals, weddings, and gatherings — across {CAMPUSES.map((c) => c.name).join(' and ')}.
        </p>
      </div>
      {isChurchStaff ? <StaffConsole /> : <CommunityFrontDoor />}
    </div>
  );
}
