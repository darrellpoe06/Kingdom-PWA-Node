// =============================================================================
// venue-commercial-quote — the commercial rate card + quote engine
// =============================================================================
// Source of every expected number below: the "Commercial Event Facility Rental
// Proposal" from Christina, Director of Ministries for The Love Corner (The
// Church of the Living God, Champaign, Illinois), 2026-08-30 — including her
// two WORKED EXAMPLES (6 hours = $6,000; 12 hours = $12,000), which are pinned
// here verbatim so the app can never quietly quote a different number than the
// document the church hands a promoter.
//
// PROVEN-TO-CATCH (DR-0076 §3) — each of these fails loudly on a real break:
//   1. The refundable deposit must NEVER land in the revenue line. A quote that
//      counted held money as income would overstate church income on a
//      financial surface; the test asserts the exclusion directly.
//   2. A bogus or missing status must NEVER read as 'approved'. Christina's
//      rates are PROPOSED; an approved-looking proposal is a painted number.
//   3. An override must NEVER blank out a rate by omission. Garbage, empty, and
//      out-of-range values all fall through to the committed defaults.
//   4. The signing payment is 50% of the FACILITY RENTAL, not of the whole
//      quote — the single arithmetic detail most likely to be "simplified" wrong.
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COMMERCIAL_RATE_CARD, RATE_CARD_SOURCE, RATE_FIELDS, RATE_CARD_STATUS_IDS,
  DEFAULT_COMMERCIAL_TERMS, DEFAULT_COMMERCIAL_DEFINITION,
  quoteCommercialEvent, mergeRateCard, validateRateCardPatch, staffingNotes,
  finalPaymentDueDate, finalPaymentOverdue, paymentMilestones, quoteInputsFrom,
} from '../lib/venue-commercial-rates.js';
import {
  EVENT_TYPE_IDS, eventTypeLabel, responsibilitiesFor,
  isCommercialBooking, hasQuote, bookingQuote, buildBookingRow, toBookingShape,
} from '../lib/venue-rental.js';

const DEFAULTS = mergeRateCard(null);

describe("the committed card is Christina's document, verbatim", () => {
  it('carries every rate exactly as proposed', () => {
    expect(DEFAULT_COMMERCIAL_RATE_CARD.facilityHourly).toBe(1000);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.soundHourly).toBe(50);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.soundTypicalMin).toBe(2);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.soundTypicalMax).toBe(4);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.securityHourly).toBe(35);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.securityTypicalMin).toBe(5);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.securityTypicalMax).toBe(10);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.cleaningFlat).toBe(500);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.refundableDeposit).toBe(1000);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.signingShare).toBe(0.5);
    expect(DEFAULT_COMMERCIAL_RATE_CARD.finalPaymentDaysBefore).toBe(30);
  });
  it('ships PROPOSED, because her document says "subject to approval"', () => {
    expect(DEFAULT_COMMERCIAL_RATE_CARD.status).toBe('proposed');
    expect(DEFAULTS.status).toBe('proposed');
    expect(RATE_CARD_STATUS_IDS).toEqual(['proposed', 'under-review', 'approved']);
  });
  it('names its author, so the numbers are never anonymous', () => {
    expect(RATE_CARD_SOURCE.author).toContain('Christina');
    expect(RATE_CARD_SOURCE.church).toContain('Living God');
    expect(RATE_CARD_SOURCE.receivedOn).toBe('2026-08-30');
  });
  it('carries all four additional terms and the commercial definition', () => {
    expect(DEFAULT_COMMERCIAL_TERMS.map((t) => t.key)).toEqual(
      ['final-cost', 'insurance', 'additional-time', 'damage-deposit'],
    );
    expect(DEFAULT_COMMERCIAL_DEFINITION).toContain('promoter');
    expect(DEFAULT_COMMERCIAL_DEFINITION).toContain('load-out');
  });
  it('every editable field is registered with a range the form can enforce', () => {
    for (const f of RATE_FIELDS) {
      expect(f.key in DEFAULT_COMMERCIAL_RATE_CARD).toBe(true);
      expect(f.label).toBeTruthy();
      expect(f.max).toBeGreaterThan(f.min);
    }
  });
});

describe("her two worked examples reproduce exactly", () => {
  it('6 hours = $6,000 facility rental', () => {
    expect(quoteCommercialEvent({ hours: 6 }, DEFAULTS).facilityRental).toBe(6000);
  });
  it('12 hours = $12,000 facility rental', () => {
    expect(quoteCommercialEvent({ hours: 12 }, DEFAULTS).facilityRental).toBe(12000);
  });
});

describe('a full commercial quote', () => {
  // 6 hours, 3 sound, 8 security — all working the full reserved window.
  const q = quoteCommercialEvent(
    { hours: 6, soundPeople: 3, securityPeople: 8 }, DEFAULTS,
  );
  it('prices each line from the card', () => {
    expect(q.facilityRental).toBe(6000);        // 6 × $1,000
    expect(q.soundTotal).toBe(900);             // 3 × 6 × $50
    expect(q.securityTotal).toBe(1680);         // 8 × 6 × $35
    expect(q.cleaning).toBe(500);
    expect(q.refundableDeposit).toBe(1000);
  });
  it('EXCLUDES the refundable deposit from the revenue line', () => {
    // Proven-to-catch #1: held money is not income.
    expect(q.eventCharges).toBe(9080);          // 6000 + 900 + 1680 + 500
    expect(q.totalDueBeforeEvent).toBe(10080);  // charges + the $1,000 held
    expect(q.totalDueBeforeEvent - q.eventCharges).toBe(q.refundableDeposit);
  });
  it('splits payment as 50% of the FACILITY RENTAL at signing, balance 30 days out, $0 on the day', () => {
    // Proven-to-catch #4: NOT 50% of the $10,080 total.
    expect(q.schedule.atSigning).toBe(3000);
    expect(q.schedule.atSigning).not.toBe(5040);
    expect(q.schedule.thirtyDaysBefore).toBe(7080);
    expect(q.schedule.eventDay).toBe(0);
    expect(q.schedule.atSigning + q.schedule.thirtyDaysBefore).toBe(q.totalDueBeforeEvent);
  });
  it('marks exactly one line refundable', () => {
    expect(q.lines.filter((l) => l.refundable).map((l) => l.key)).toEqual(['deposit']);
  });
  it('staff hours default to the event hours, and can be set separately', () => {
    const shorter = quoteCommercialEvent({ hours: 6, securityPeople: 8, securityHours: 4 }, DEFAULTS);
    expect(shorter.securityTotal).toBe(1120);   // 8 × 4 × $35
  });
  it('fees can be waived per booking without touching the card', () => {
    const bare = quoteCommercialEvent({ hours: 6, cleaning: false, deposit: false }, DEFAULTS);
    expect(bare.cleaning).toBe(0);
    expect(bare.refundableDeposit).toBe(0);
    expect(bare.eventCharges).toBe(6000);
  });
  it('never throws on junk input — an empty quote is zero, not a crash', () => {
    const empty = quoteCommercialEvent({}, DEFAULTS);
    expect(empty.facilityRental).toBe(0);
    // Junk hours zero out the facility and staffing; the flat cleaning fee is
    // all that remains — and the $1,000 deposit is STILL not in the revenue line.
    const junk = quoteCommercialEvent({ hours: -5, soundPeople: 'x' }, DEFAULTS);
    expect(junk.eventCharges).toBe(500);
    expect(junk.refundableDeposit).toBe(1000);
  });
  it('the payment milestones a surface renders sum to the total due', () => {
    const rows = paymentMilestones(q, '2026-10-15', DEFAULTS);
    expect(rows).toHaveLength(3);
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(q.totalDueBeforeEvent);
    expect(rows[1].when).toContain('2026-09-15');
    expect(rows[2].amount).toBe(0);
  });
});

describe('the balance-due date', () => {
  it('is 30 days before the event', () => {
    expect(finalPaymentDueDate('2026-10-15', DEFAULTS)).toBe('2026-09-15');
    expect(finalPaymentDueDate('2026-03-05', DEFAULTS)).toBe('2026-02-03'); // across a month boundary
  });
  it('is null when there is no usable date (never a guessed one)', () => {
    expect(finalPaymentDueDate('', DEFAULTS)).toBeNull();
    expect(finalPaymentDueDate('someday', DEFAULTS)).toBeNull();
    expect(finalPaymentDueDate(null, DEFAULTS)).toBeNull();
  });
  it('flags a booking taken inside the window as already due', () => {
    expect(finalPaymentOverdue('2026-10-15', DEFAULTS, new Date('2026-08-30T00:00:00Z'))).toBe(false);
    expect(finalPaymentOverdue('2026-09-10', DEFAULTS, new Date('2026-08-30T00:00:00Z'))).toBe(true);
  });
  it('follows the team’s own window when they change it', () => {
    const card = mergeRateCard({ values: { finalPaymentDaysBefore: 45 } });
    expect(finalPaymentDueDate('2026-10-15', card)).toBe('2026-08-31');
  });
});

describe("the team owns the card — Christina's numbers are the SEED", () => {
  it('with no edits, the card is the committed proposal and says so', () => {
    expect(DEFAULTS.isDefault).toBe(true);
    expect(DEFAULTS.changedKeys).toEqual([]);
    expect(DEFAULTS.facilityHourly).toBe(1000);
  });
  it('a team edit wins, and the quote reprices from it', () => {
    const card = mergeRateCard({ values: { facilityHourly: 1200 }, status: 'approved' });
    expect(card.facilityHourly).toBe(1200);
    expect(card.changedKeys).toEqual(['facilityHourly']);
    expect(card.isDefault).toBe(false);
    expect(card.status).toBe('approved');
    expect(quoteCommercialEvent({ hours: 6 }, card).facilityRental).toBe(7200);
    // Untouched fields still fall through to her defaults.
    expect(card.securityHourly).toBe(35);
  });
  it('an override can NEVER blank out a rate by omission or by garbage', () => {
    // Proven-to-catch #3.
    const card = mergeRateCard({ values: { facilityHourly: '', soundHourly: null, securityHourly: 'free', cleaningFlat: -20, refundableDeposit: 9e12 } });
    expect(card.facilityHourly).toBe(1000);
    expect(card.soundHourly).toBe(50);
    expect(card.securityHourly).toBe(35);
    expect(card.cleaningFlat).toBe(500);
    expect(card.refundableDeposit).toBe(1000);   // out of range -> default, not a $9T deposit
    expect(card.isDefault).toBe(true);
  });
  it('a bogus or missing status can NEVER read as approved', () => {
    // Proven-to-catch #2.
    expect(mergeRateCard({ status: 'approved-ish' }).status).toBe('proposed');
    expect(mergeRateCard({ status: undefined }).status).toBe('proposed');
    expect(mergeRateCard({}).status).toBe('proposed');
    expect(mergeRateCard({ status: 'approved' }).status).toBe('approved');
  });
  it('term text and the definition are editable, and flag themselves as edited', () => {
    const card = mergeRateCard({ terms: { insurance: 'Certificate of insurance due 14 days out.', bogus: 'ignored' }, definition: 'Our own wording.' });
    const ins = card.terms.find((t) => t.key === 'insurance');
    expect(ins.text).toBe('Certificate of insurance due 14 days out.');
    expect(ins.edited).toBe(true);
    expect(card.terms.find((t) => t.key === 'final-cost').edited).toBe(false);
    expect(card.terms.map((t) => t.key)).not.toContain('bogus');
    expect(card.definition).toBe('Our own wording.');
    expect(card.isDefault).toBe(false);
  });
});

describe('validation catches a bad edit BEFORE it becomes a price', () => {
  it('accepts a clean patch', () => {
    const r = validateRateCardPatch({ facilityHourly: 1250, securityHourly: 40 });
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ facilityHourly: 1250, securityHourly: 40 });
  });
  it('rejects non-numeric and out-of-range entries with a message per field', () => {
    const r = validateRateCardPatch({ facilityHourly: 'a lot', signingShare: 5 });
    expect(r.ok).toBe(false);
    expect(r.errors.facilityHourly).toBeTruthy();
    expect(r.errors.signingShare).toContain('0 and 1');
  });
  it('rejects a typical-low above its typical-high', () => {
    const r = validateRateCardPatch({ securityTypicalMin: 12, securityTypicalMax: 6 });
    expect(r.ok).toBe(false);
    expect(r.errors.securityTypicalMax).toBeTruthy();
  });
  it('a cleared field is not an error — it falls back to the default', () => {
    const r = validateRateCardPatch({ facilityHourly: '' });
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({});
  });
});

describe('staffing guidance (a prompt, never a block)', () => {
  it('flags counts outside the typical bands', () => {
    const notes = staffingNotes({ hours: 6, soundPeople: 9, securityPeople: 2 }, DEFAULTS);
    expect(notes.join(' ')).toContain('Sound staffing is outside');
    expect(notes.join(' ')).toContain('Security staffing is outside');
  });
  it('says nothing when the counts sit inside the bands', () => {
    expect(staffingNotes({ hours: 6, soundPeople: 3, securityPeople: 7 }, DEFAULTS)).toEqual([]);
  });
  it('reminds staff that commercial events generally need security', () => {
    expect(staffingNotes({ hours: 6, soundPeople: 3, securityPeople: 0 }, DEFAULTS).join(' ')).toContain('generally require 5–10');
  });
});

describe('the booking carries the quote', () => {
  it('commercial is a real event type with its own label', () => {
    expect(EVENT_TYPE_IDS).toContain('commercial');
    expect(eventTypeLabel('commercial')).toContain('Commercial');
  });
  it('its checklist owns the contract, the money, the staffing, and the inspection', () => {
    const keys = responsibilitiesFor('commercial').map((r) => r.key);
    for (const k of ['contract', 'insurance', 'balance', 'deposit', 'sound', 'security', 'cleaning', 'inspection']) {
      expect(keys).toContain(k);
    }
    const byKey = Object.fromEntries(responsibilitiesFor('commercial').map((r) => [r.key, r.team]));
    expect(byKey.security).toBe('Security');
    expect(byKey.sound).toBe('Media Team');
    expect(byKey.contract).toBe('Church Office');
  });
  it('stores only the quote INPUTS, so totals always follow the live card', () => {
    const row = buildBookingRow({
      requesterName: 'Promoter', campus: 'south', spaceId: 'south-whole',
      eventType: 'commercial', eventDate: '2026-10-15',
      quoteDetail: { hours: 6, soundPeople: 3, securityPeople: 8 },
    });
    expect(row.event_type).toBe('commercial');
    expect(row.quote_detail.hours).toBe(6);
    expect(row.quote_detail).not.toHaveProperty('eventCharges'); // no stored totals
    expect(row.quote_detail).not.toHaveProperty('lines');

    const booking = toBookingShape({ ...row, id: 'b1', status: 'reviewing' });
    expect(isCommercialBooking(booking)).toBe(true);
    expect(hasQuote(booking)).toBe(true);
    expect(bookingQuote(booking, DEFAULTS).eventCharges).toBe(9080);
    // The same booking reprices when the team raises the rate — no stale money.
    expect(bookingQuote(booking, mergeRateCard({ values: { facilityHourly: 1200 } })).eventCharges).toBe(10280);
  });
  it('a booking with no quote reports none rather than a zero-dollar quote', () => {
    const booking = toBookingShape({ ...buildBookingRow({ requesterName: 'X', campus: 'north', spaceId: 'north-sanctuary', eventType: 'wedding' }), id: 'b2' });
    expect(hasQuote(booking)).toBe(false);
    expect(bookingQuote(booking, DEFAULTS)).toBeNull();
    expect(isCommercialBooking(booking)).toBe(false);
  });
  it('quoteInputsFrom keeps only the inputs', () => {
    const inputs = quoteInputsFrom(quoteCommercialEvent({ hours: 6, soundPeople: 3, securityPeople: 8 }, DEFAULTS));
    expect(inputs).toEqual({ hours: 6, soundPeople: 3, soundHours: 6, securityPeople: 8, securityHours: 6, cleaning: true, deposit: true });
  });
});
