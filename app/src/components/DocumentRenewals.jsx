// =============================================================================
// DocumentRenewals — what the papers say is coming, on the calendar, editable
// =============================================================================
// Darrell, 2026-10-16: "Make sure that when whatever you are doing with users
// documents they are organized in a deterministic systemic process that works
// comprehensively and effectively... If and when we upload certain types of
// documents and dates and renewing documents and insurance etc." Then: "Put on
// calendar and notify users in advance of the needs... based on the
// documents... editable... by users... deduced from the documents." Then:
// "All integrated..."
//
// REALITY-TRACE (DR-0061), done before a line of this was written:
//   · the documents are REAL rows on the shelf this is rendered inside;
//   · the calendar is the one that already exists — `addEvent` appends to
//     `data.events`, which is the very list `dueReminders()` fires notices
//     from, so a renewal added here really does notify;
//   · nothing is invented: every date shown comes from `validityOf`, which
//     reads the document's own dates and says which it used.
//
// THE RULE THIS SURFACE KEEPS. A deduced date is a PROPOSAL and says so on its
// face. The person can change it before it is added, and once added it is an
// ordinary calendar event they own. Nothing here writes to the calendar on its
// own — the app proposes, a person decides (the DR-1073 rule, same as a matched
// donor never being printed unconfirmed).
import React, { useMemo, useState } from 'react';
import {
  sortByUrgency, renewalSummary, proposedCalendarEvent, applyUserEdit,
  STATES, A_PROPOSAL_IS_NOT_A_FACT, UNDATED_IS_NOT_FILED,
} from '../lib/document-validity.js';

const sectionH = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const note = 'text-[0.6875rem] text-[#5A5751] leading-relaxed';
const serif = { fontFamily: '"Fraunces", serif' };
const RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = `w-full text-sm p-1.5 border border-[#1A1815] bg-white ${RING}`;

/** The colour of a state. Red is reserved (DR-0099) — urgency uses coral. */
const TONE = {
  [STATES.expired]: { label: 'Ran out', cls: 'text-[#B85838] font-semibold' },
  [STATES.expiringSoon]: { label: 'Runs out soon', cls: 'text-[#B85838]' },
  [STATES.undated]: { label: 'No date', cls: 'text-[#8A857C]' },
  [STATES.unknownKind]: { label: 'Not watched', cls: 'text-[#8A857C]' },
  [STATES.valid]: { label: 'Good', cls: 'text-[#5A6E3D]' },
  [STATES.permanent]: { label: 'Does not expire', cls: 'text-[#5A5751]' },
};

function Row({ doc, onAdd, today }) {
  const v = doc.validity;
  const tone = TONE[v.state] || TONE[STATES.unknownKind];
  const proposal = useMemo(() => proposedCalendarEvent(doc, today), [doc, today]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({ date: proposal ? proposal.date : '', title: proposal ? proposal.title : '' }));
  const [added, setAdded] = useState(false);

  const confirm = () => {
    if (!proposal) return;
    const edited = applyUserEdit(proposal, draft);
    onAdd({
      title: edited.title,
      date: edited.date,
      category: edited.category,
      reminders: edited.reminders,
      note: edited.note,
    });
    setAdded(true);
    setOpen(false);
  };

  return (
    <div className="px-2.5 py-2 border-b border-[#F2EEE6] last:border-b-0" data-testid="renewal-row">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="text-[0.8125rem] text-[#1A1815]">{doc.label || doc.title || 'Untitled document'}</div>
          <div className={`text-[0.6875rem] ${tone.cls}`} data-testid="renewal-state">
            {tone.label}{v.expiresOn ? ` · ${v.expiresOn}` : ''}
          </div>
          {/* WHY, in the library's own words — never a bare status. */}
          <p className="text-[0.625rem] text-[#8A857C] leading-relaxed" data-testid="renewal-why">{v.why}</p>
        </div>
        {proposal && !added && (
          <button type="button" onClick={() => setOpen((o) => !o)}
            className={`text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#1A1815] shrink-0 ${RING}`}
            data-testid="renewal-open" aria-expanded={open}>
            {open ? 'Close' : 'Put on the calendar'}
          </button>
        )}
        {added && <span className="text-[0.625rem] text-[#5A6E3D] shrink-0" data-testid="renewal-added">On the calendar</span>}
      </div>

      {open && proposal && (
        <div className="mt-2 border border-[#E8E4DC] p-2 space-y-2" data-testid="renewal-editor">
          {/* WHERE THE DATE CAME FROM, said before it is accepted. */}
          <p className="text-[0.625rem] text-[#1A1815] leading-relaxed" style={serif} data-testid="renewal-source">
            {proposal.source === 'stated'
              ? 'This date is the one on the document.'
              : 'Nobody has read an expiry date off this document, so this is how long that kind usually lasts — change it to the real date if you have it.'}
          </p>
          <label className="block">
            <span className={sectionH}>What to call it</span>
            <input className={FIELD} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} data-testid="renewal-title" />
          </label>
          <label className="block">
            <span className={sectionH}>Date</span>
            <input type="date" className={FIELD} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} data-testid="renewal-date" />
          </label>
          <p className="text-[0.625rem] text-[#8A857C] leading-relaxed">
            You will be reminded {proposal.reminders.length} time{proposal.reminders.length === 1 ? '' : 's'} before it.
            {proposal.noticeGapDays > 0 && ` This kind wants about ${proposal.noticeGapDays} more days of warning than the calendar can give, so it also shows on this list from ${proposal.noticeGapDays + 30} days out.`}
          </p>
          <button type="button" onClick={confirm} className={`text-[0.625rem] uppercase tracking-wider border border-[#1A1815] px-2 py-1 ${RING}`} data-testid="renewal-confirm">
            Add to the calendar
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * @param {Array}  documents  rows from any shelf
 * @param {Function} addEvent the app's own calendar add (data.events)
 * @param {string} today      ISO day; the caller owns the clock
 */
export default function DocumentRenewals({ documents = [], addEvent, today }) {
  const day = today || new Date().toISOString().slice(0, 10);
  const ordered = useMemo(() => sortByUrgency(documents, day), [documents, day]);
  const sum = useMemo(() => renewalSummary(documents, day), [documents, day]);

  if (!documents.length) return null;

  // Only the rows that need a person. A valid certificate is not news.
  const needing = ordered.filter((d) => d.validity.state !== STATES.valid && d.validity.state !== STATES.permanent);

  return (
    <section className="border border-[#1A1815] p-3 space-y-2" aria-labelledby="dr-h" data-testid="document-renewals">
      <h4 id="dr-h" className={sectionH}>What the papers say is coming</h4>

      {/* THE COUNT, with the unjudgeable counted SEPARATELY (DR-1075's rule:
          a number that quietly folds rows together is its own kind of lie). */}
      <p className={note} data-testid="renewal-summary">
        {sum.expired} ran out · {sum.expiringSoon} running out · {sum.undated} with no date · {sum.valid} good
        {sum.unknownKind > 0 && ` · ${sum.unknownKind} not watched`}
      </p>

      {needing.length === 0 ? (
        <p className={note + ' italic'}>Nothing needs renewing, and nothing is undated. That is the papers&apos; own answer, not an empty list.</p>
      ) : (
        <div className="border border-[#E8E4DC]">
          {needing.map((d) => (
            <Row key={d.id || d.slug || d.label} doc={d} onAdd={addEvent} today={day} />
          ))}
        </div>
      )}

      <p className="text-[0.625rem] text-[#8A857C] leading-relaxed" style={serif}>{A_PROPOSAL_IS_NOT_A_FACT}</p>
      {sum.undated > 0 && (
        <p className="text-[0.625rem] text-[#8A857C] leading-relaxed" style={serif} data-testid="renewal-undated-note">{UNDATED_IS_NOT_FILED}</p>
      )}
    </section>
  );
}
