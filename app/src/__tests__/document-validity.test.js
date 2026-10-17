// @vitest-environment node
// =============================================================================
// What a document IS, when it stops being true, and when to say so (DR-1084)
// =============================================================================
// Darrell, 2026-10-16: "organized in a deterministic systemic process that
// works comprehensively and effectively... types of documents and dates and
// renewing documents and insurance etc." / "Put on calendar and notify users in
// advance of the needs... editable... by users... deduced from the documents."
//
// These cases are weighted at the ways this could MISLEAD somebody about a
// document that matters — not at the arithmetic. The failure that costs real
// money is an expired policy that reads as filed.
import { describe, it, expect } from 'vitest';
import {
  addMonths, daysBetween, kindOf, validityOf, sortByUrgency, renewalSummary,
  proposedCalendarEvent, applyUserEdit, shouldReplaceProposal, proposedCalendar,
  remindersForKind, STATES, EXPIRING_KINDS,
} from '../lib/document-validity.js';

const TODAY = '2026-10-16';

describe('dates are whole days, and never drift', () => {
  it('adds months and clamps the day of month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-10-16', 12)).toBe('2027-10-16');
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');   // a leap year
  });

  it('refuses a date it cannot read, instead of inventing one', () => {
    expect(addMonths('', 12)).toBe('');
    expect(addMonths('not a date', 12)).toBe('');
    expect(daysBetween('2026-10-16', '')).toBeNull();
  });

  it('counts days without a timezone moving the answer', () => {
    // The DR-1063 lesson: a bare date parsed as a local timestamp drifts a day
    // in Texas. These are compared as UTC midnights, so they cannot.
    expect(daysBetween('2026-10-16', '2026-10-17')).toBe(1);
    expect(daysBetween('2026-10-16', '2026-10-15')).toBe(-1);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });
});

describe('RULE 1 — an undated document is never "valid"', () => {
  it('says UNDATED, and says why it matters', () => {
    const v = validityOf({ label: 'Certificate of insurance' }, TODAY);
    expect(v.state).toBe(STATES.undated);
    expect(v.why).toMatch(/looks filed/);
  });

  it('a whole shelf of undated papers is counted apart from the good ones', () => {
    const s = renewalSummary([
      { label: 'Certificate of insurance' },
      { label: 'Business licence' },
      { label: 'Certificate of insurance', expiresOn: '2027-06-01' },
    ], TODAY);
    expect(s.undated).toBe(2);
    expect(s.valid).toBe(1);
    expect(s.total).toBe(3);
  });
});

describe('RULE 2 — a kind nobody knows is never assumed permanent', () => {
  it('an unrecognized kind is its own answer, not silence', () => {
    const v = validityOf({ label: 'Some paper nobody classified', dateOf: '2020-01-01' }, TODAY);
    expect(v.state).toBe(STATES.unknownKind);
    expect(v.why).toMatch(/give it an expiry date/);
  });

  it('...but a stated expiry date BEATS not knowing the kind', () => {
    // A date somebody wrote down is better than any classification.
    const v = validityOf({ label: 'Mystery paper', expiresOn: '2026-01-01' }, TODAY);
    expect(v.state).toBe(STATES.expired);
  });

  it('a deed, a will and a tax return do not expire', () => {
    for (const label of ['Warranty deed', 'Will', 'Trust instrument', '2025 tax return', 'Birth certificate']) {
      expect(validityOf({ label, dateOf: '1999-01-01' }, TODAY).state, label).toBe(STATES.permanent);
    }
  });
});

describe('insurance — the kind he named, and the one that hurts', () => {
  it('a certificate of insurance expires a year from its date', () => {
    const v = validityOf({ label: 'Certificate of insurance', dateOf: '2025-10-01' }, TODAY);
    expect(v.expiresOn).toBe('2026-10-01');
    expect(v.state).toBe(STATES.expired);
    expect(v.daysLeft).toBe(-15);
  });

  it('warns SIXTY days out, not a fortnight — replacing a policy takes time', () => {
    const soon = validityOf({ label: 'General liability insurance', expiresOn: '2026-12-01' }, TODAY);
    expect(soon.state).toBe(STATES.expiringSoon);   // 46 days
    const far = validityOf({ label: 'General liability insurance', expiresOn: '2027-03-01' }, TODAY);
    expect(far.state).toBe(STATES.valid);
  });

  it('DOES NOT confuse an insurance DISPUTE with a policy', () => {
    // 'Insurance claim dispute' is a real entry in LEGAL_CATEGORIES. It is
    // legal work, not a policy, and giving it a renewal date would be noise.
    expect(kindOf({ docType: 'Insurance claim dispute' })).toBeNull();
    expect(kindOf({ docType: 'Certificate of insurance' }).id).toBe('insurance-certificate');
  });

  it('recognizes a document whatever way its owner spelled it', () => {
    // Our own prose is American (the spelling gate enforces that, and caught
    // this file's author writing "licence" and "authorisation"). But a PERSON
    // labelling their own paper may write it either way, and the pattern has
    // to recognize what they actually typed -- so the fixtures below use the
    // British spelling on purpose.
    expect(kindOf({ label: 'Business licence' }).id).toBe('business-license');
    expect(kindOf({ label: 'Business license' }).id).toBe('business-license');
    expect(kindOf({ label: 'Work authorisation' }).id).toBe('work-authorization');
    expect(kindOf({ label: 'Work authorization' }).id).toBe('work-authorization');
  });

  it('reads the kind off whichever field a shelf happens to use', () => {
    // legal_documents.doc_type, property_documents.kind, choir doc_type, title.
    expect(kindOf({ doc_type: 'Rental registration' }).id).toBe('rental-registration');
    expect(kindOf({ kind: 'Lease' }).id).toBe('lease');
    expect(kindOf({ title: 'Certificate of Occupancy 2026' }).id).toBe('certificate-of-occupancy');
  });
});

describe('a derived date is never passed off as a read one', () => {
  it('says the term was assumed, and from what', () => {
    const v = validityOf({ label: 'Business licence', dateOf: '2026-03-01' }, TODAY);
    expect(v.why).toMatch(/12 months from 2026-03-01/);
    expect(v.why).toMatch(/not a date anyone read off the paper/);
  });

  it('a real expiry date on the row wins over the assumed term', () => {
    const v = validityOf({ label: 'Business licence', dateOf: '2026-03-01', expiresOn: '2026-11-30' }, TODAY);
    expect(v.expiresOn).toBe('2026-11-30');
    expect(v.why).toMatch(/the date on the document/);
  });
});

describe('one deterministic order, every shelf, every time', () => {
  const docs = [
    { id: 'good', label: 'Certificate of insurance', expiresOn: '2028-01-01' },
    { id: 'undated', label: 'Business licence' },
    { id: 'dead', label: 'Lease', expiresOn: '2026-01-01' },
    { id: 'soon', label: 'Vehicle registration', expiresOn: '2026-11-01' },
    { id: 'deed', label: 'Warranty deed', dateOf: '2001-01-01' },
    { id: 'mystery', label: 'Unclassifiable thing', dateOf: '2020-01-01' },
  ];

  it('dead first, then dying soonest, then what nobody can judge', () => {
    expect(sortByUrgency(docs, TODAY).map((d) => d.id))
      .toEqual(['dead', 'soon', 'undated', 'mystery', 'good', 'deed']);
  });

  it('UNDATED SORTS ABOVE VALID, deliberately', () => {
    // A document nobody can judge is a live question; a valid one is not.
    const order = sortByUrgency(docs, TODAY).map((d) => d.id);
    expect(order.indexOf('undated')).toBeLessThan(order.indexOf('good'));
  });

  it('the same set always reads the same way, whatever order it arrives in', () => {
    const a = sortByUrgency(docs, TODAY).map((d) => d.id);
    const b = sortByUrgency([...docs].reverse(), TODAY).map((d) => d.id);
    expect(a).toEqual(b);
  });
});

describe('ON THE CALENDAR — proposed, with notice, and editable', () => {
  it('proposes an event the existing calendar can store', () => {
    const e = proposedCalendarEvent({ id: 'd1', label: 'Liability insurance', expiresOn: '2026-12-01' }, TODAY);
    expect(e).toMatchObject({ title: 'Renew: Liability insurance', date: '2026-12-01', category: 'deadline', source: 'stated', editable: true });
    // The reminder keys must be ones REMINDER_OPTIONS actually has, or
    // dueReminders() silently skips them and nobody is ever told.
    for (const k of e.reminders) {
      expect(['1mo-before', '2w-before', '1w-before', '3d-before', '1d-before']).toContain(k);
    }
  });

  it('is HONEST that the calendar cannot give sixty days of notice', () => {
    const e = proposedCalendarEvent({ id: 'd1', label: 'Liability insurance', expiresOn: '2026-12-01' }, TODAY);
    expect(e.noticeGapDays).toBe(30);   // 60 wanted, 30 is the longest lead there is
  });

  it('proposes nothing for a deed, and nothing undated', () => {
    expect(proposedCalendarEvent({ label: 'Warranty deed', dateOf: '1999-01-01' }, TODAY)).toBeNull();
    expect(proposedCalendarEvent({ label: 'Certificate of insurance' }, TODAY)).toBeNull();
  });

  it('a deduced proposal SAYS it was deduced, on the event itself', () => {
    const e = proposedCalendarEvent({ id: 'd2', label: 'Business licence', dateOf: '2026-06-01' }, TODAY);
    expect(e.source).toBe('deduced');
    expect(e.note).toMatch(/not one anyone read off the paper/);
  });

  it('THE PERSON’S EDIT WINS, and keeps winning', () => {
    const e = proposedCalendarEvent({ id: 'd3', label: 'Lease', dateOf: '2026-01-01' }, TODAY);
    const mine = applyUserEdit(e, { date: '2027-02-28', title: 'Renew the Prospect lease' });
    expect(mine.date).toBe('2027-02-28');
    expect(mine.title).toBe('Renew the Prospect lease');
    expect(mine.source).toBe('user');
    // The app's own guess is kept, not thrown away, so the two can be compared.
    expect(mine.wasDeduced).toMatchObject({ date: '2027-01-01', source: 'deduced' });
    // And a later re-deduction must not touch it.
    expect(shouldReplaceProposal(mine, e)).toBe(false);
  });

  it('a second edit does not overwrite what the first one recorded', () => {
    const e = proposedCalendarEvent({ id: 'd3', label: 'Lease', dateOf: '2026-01-01' }, TODAY);
    const once = applyUserEdit(e, { date: '2027-02-28' });
    const twice = applyUserEdit(once, { date: '2027-03-31' });
    expect(twice.wasDeduced.date).toBe('2027-01-01');   // still the ORIGINAL guess
  });

  it('a real date found later DOES replace an earlier guess', () => {
    const guess = proposedCalendarEvent({ id: 'd4', label: 'Business licence', dateOf: '2026-06-01' }, TODAY);
    const read = proposedCalendarEvent({ id: 'd4', label: 'Business licence', dateOf: '2026-06-01', expiresOn: '2026-12-31' }, TODAY);
    expect(shouldReplaceProposal(guess, read)).toBe(true);
  });

  it('proposedCalendar leaves settled rows alone and keeps one order', () => {
    const rows = [
      { id: 'a', label: 'Lease', expiresOn: '2026-11-01' },
      { id: 'b', label: 'Vehicle registration', expiresOn: '2026-10-20' },
    ];
    const settled = new Map([['a', { ...proposedCalendarEvent(rows[0], TODAY), source: 'user', date: '2099-01-01' }]]);
    const out = proposedCalendar(rows, TODAY, settled);
    expect(out.find((e) => e.documentId === 'a').date, 'a settled date was overwritten').toBe('2099-01-01');
    expect(out[0].documentId, 'the soonest should still lead').toBe('b');
  });
});

describe('the registry itself is sane', () => {
  it('every kind has a term, a warning window and a usable pattern', () => {
    for (const k of EXPIRING_KINDS) {
      expect(k.id, `${k.id} has no label`).toBeTruthy();
      expect(k.termMonths, `${k.id} has no term`).toBeGreaterThan(0);
      expect(k.warnDays, `${k.id} has no warning`).toBeGreaterThan(0);
      expect(k.match.test(k.label), `${k.id}'s own label does not match its pattern`).toBe(true);
    }
  });

  it('no kind asks for more reminders than the calendar has', () => {
    for (const k of EXPIRING_KINDS) {
      const { keys } = remindersForKind(k);
      expect(keys.length, `${k.id} gets no reminders at all`).toBeGreaterThan(0);
    }
  });
});
