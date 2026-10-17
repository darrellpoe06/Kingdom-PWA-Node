# DR-1084: A document says when it stops being true — on the calendar, with notice, and the person's date always wins

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (family- and church-facing; what the app knows about every stored document)
**Type:** way
**Area:**
- `app/src/lib/document-validity.js` (new — the registry, the validity model, the calendar proposals)
- `app/src/components/DocumentRenewals.jsx` (new — the surface)
- `app/src/components/Legal.jsx` (renders it over its own and the household's documents)
- `app/src/poe-financial-mvp-v28.jsx` (hands the shelf the app's own `addEvent`)
- `app/src/__tests__/document-validity.test.js` (new — 27 cases, proven to catch three harms)

**Grounds:** Darrell, 2026-10-16, in three parts. **"Make sure that when whatever you are doing with users documents they are organized in a deterministic systemic process that works comprehensively and effectively... If and when we upload certain types of documents and dates and renewing documents and insurance etc."** Then: **"Put on calendar and notify users in advance of the needs... based on the documents... editable... by users... deduced from the documents."** Then: **"All integrated..."**
**Principles:** DR-0061 / P15 (reality-trace before building); DR-0076 (unknown is never a yes; §3 proven-to-catch); DR-1073 (a proposal is not a fact — the app proposes, the person decides); DR-1063 (a bare date parsed as a timestamp drifts a day); DR-1072/1075 (the orphan check: a library with no caller is not built)

## Context

He asked for documents to be organized by a process that is *deterministic*,
*systemic* and *comprehensive* — naming the thing that makes those words mean
something: **types, dates, renewals, insurance.** Then he asked for the dates to
reach the calendar with advance notice, deduced from the documents but editable
by the person. Then, in two words, he named the failure mode this session has
hit three times already: *"All integrated."*

## What was measured

The reality-trace, run before anything was written:

| store | type field | date field | **expiry** |
|---|---|---|---|
| `legal_documents` (0180) | `category` + `doc_type` | `date_of` | **none** |
| `property_documents` (0154) | `kind` | `effective_on` | **none** |
| `choir_team_documents` | `doc_type` | `doc_date` | **none** |
| books-intake `DOC_TYPES` | its own vocabulary | — | **none** |

**Four shelves, four vocabularies that do not agree, and not one of them knows
a document can stop being true.** Every `expires_at` in the repository is an
invite token. So an insurance certificate lapses, a registration goes stale, a
certificate of occupancy runs out — and the app has nothing to say about it
until somebody needs the paper and finds it dead.

**The calendar, by contrast, already exists and works.** Events carry
`reminders` keyed to `REMINDER_OPTIONS`, and `dueReminders()` fires them purely
against an injected clock. `addEvent` appends to `data.events`, which is the
list those notices are read from. **Nothing here builds a second calendar.**

## Impact

Every shelf can now say, of any document, whether it is still good — in one
order, by one rule — and a renewal can be put on the calendar the app already
notifies from, with the person's own date overriding anything deduced.

## Decision

**1. A registry of what expires, beside the existing vocabularies, not over
them.** Replacing three working taxonomies would be a large, risky change that
fights code people rely on. `EXPIRING_KINDS` answers the one question none of
them can — does this kind expire, and how long is it good for — matched against
whichever field a shelf happens to use (`doc_type`, `kind`, `label`, `title`,
`category`). Insurance is first-class and first in the list, because it is what
he named and what costs most when it lapses.

**2. Three rules it will not break.**

- **An undated document is never "valid."** It is `undated`, said out loud:
  *"an undated certificate looks filed and is not."*
- **An unknown kind is never assumed permanent.** `unknown-kind` is its own
  answer — guessing "probably doesn't expire" is how a lapsed policy sits
  quietly on a shelf. A date on the row still beats not knowing the kind.
- **The clock belongs to the caller.** Every function takes `today`; dates are
  whole days compared in ISO order, so no timezone can move a renewal across
  midnight (DR-1063's lesson).

**3. A derived date is never passed off as a read one.** Where a document
carries no expiry, the kind's usual term is shown with its provenance in the
sentence: *"12 months from 2026-03-01, which is this kind's usual term — not a
date anyone read off the paper."*

**4. One order, every shelf, every time.** Expired, then expiring soonest, then
**undated**, then unknown-kind, then valid, then permanent. Undated sorts
*above* valid deliberately — and that is the opposite of DR-1063's "dateless
last", on purpose: there a missing date was a gap in a history, here it is a
live risk.

**5. The calendar is proposed to, never written to.** A document proposes an
event in the shape the calendar already stores; the person edits the date and
title before it is added; `applyUserEdit` stamps `source: 'user'` and
`shouldReplaceProposal` then **never** overwrites it. The app's own guess is
kept in `wasDeduced` rather than discarded, so the two can be compared when a
document is replaced. A real expiry date found later *does* replace an earlier
guess — but never a person's decision. This is DR-1073's rule about a matched
donor, applied to a date.

**6. Honest about the notice it cannot give.** The longest lead the calendar
offers is one month; insurance wants sixty days. So the calendar covers the
last month, the shelf's own "expiring soon" covers the rest, and
`noticeGapDays` states the difference on the proposal instead of quietly
under-warning.

**7. Integrated, because he had to say so.** `DocumentRenewals` renders inside
the Legal shelf over its own and the household's documents, and the shell hands
that shelf the app's real `addEvent`. A confirmed renewal becomes an ordinary
calendar event that really notifies. Three times today a library shipped with
no caller (DR-1072, DR-1073, and DR-1075's own measurement); this one is wired
in the same change, and the wiring is asserted.

## Verification

- **27 cases**, weighted at what would mislead someone about a document that
  matters rather than at arithmetic: an undated certificate, an unrecognized
  kind, a derived date presented as read, and an insurance *dispute* being
  mistaken for an insurance *policy* (both are real entries in
  `LEGAL_CATEGORIES`, and only one has a renewal date).
- **Proven to catch, by three mutations** (DR-0076 §3), each the version of
  this feature that would do real harm:
  - an undated document reading as **valid** → 3 cases fail;
  - an unknown kind assumed **permanent** → 2 cases fail;
  - a re-deduction **overwriting the person's own date** → 2 cases fail.
  - File restored byte-identical after each (`git diff --stat` empty); 27/27
    green after restore.
- The proposal's reminder keys are asserted to be keys `REMINDER_OPTIONS`
  actually has — an invented key is silently skipped by `dueReminders()`, so
  nobody would ever be told.
- Leap years and month-end clamping pinned (`2024-01-31 + 1mo = 2024-02-29`;
  `2026-01-31 + 1mo = 2026-02-28`).
- The registry checks itself: every kind's own label must match its own
  pattern, and every kind must get at least one reminder the calendar can fire.
- **The decision number was taken with `claim-decision-number.mjs`** (DR-1079)
  rather than by hand — which is the lesson of DR-1080's postscript, two hours
  old, actually applied.
- 24 gates green by exit code; lint clean; `reminders` and `calendar-extract`
  suites re-run and green.

## What this does not do

- **It adds no column.** Everything is derived from dates the rows already
  carry, plus `expiresOn` where a shelf has one. A real `expires_on` column —
  so a person can record the date they read off the paper and have it persist —
  is the obvious next step and is **not** in this record.
  **`re-review: 2026-10-23`.**
- **It is wired into ONE shelf.** Legal holds the insurance, licences,
  registrations and leases, so it is where this earns its keep first. Property
  documents, team documents and the household shelf each have their own date
  field and would each need their own wiring; none is done, and saying
  otherwise would make four shelves look covered when one is.
- **It does not read a document's contents.** The expiry date comes from the
  row, not from inside the PDF. Reading a date off the paper is a different
  piece of work, and `source: 'stated'` is already the place it would land.
- **It does not notify by itself.** It proposes; `dueReminders()` and the push
  queue do the notifying, exactly as they already do for every other event.
