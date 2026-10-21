# DR-1163: A door's paper says when it stops being true, and proposes its renewal to the calendar

**Date:** 2026-10-21
**Status:** accepted
**Tier:** B (a schema column on the door's documents; a family-facing surface over real rows; the calendar is proposed to, never written to)
**Type:** feature

**Area:** `infra/supabase/migrations-auto/0305-a-doors-paper-says-when-it-stops-being-true.sql` (`property_documents.expires_on`), `app/src/lib/document-validity.js` (three door-shelf kinds matched by exact token), `app/src/modules/properties/DocSigning.jsx` (`PapersPanel`: the family's "Expires on" per paper, the validity sentence, `DocumentRenewals` over the door's papers when `addEvent` is in reach), `app/src/modules/properties/PropertiesApp.jsx` (threads `addEvent`), `app/src/poe-financial-mvp-v28.jsx` (hands `addEvent` on the existing mount line; the frozen shell grows by no line), tests in `document-validity.test.js` and `doc-signing.test.jsx`.

**Principles:** DR-1084 (a document says when it stops being true; the calendar is proposed to; undated is never valid; a derived date is marked as one), DR-0936 (papers on the door), DR-0061 (reality-trace), DR-0076, DR-0245 / the monolith budget (no new shell line).
**Declared by:** Darrell, 2026-10-21: *"Also... documents and renewal dates on a calendar with reminders etc..."*

---

## What was measured

- DR-1084 built the registry (`EXPIRING_KINDS`), the state machine (`validityOf`) and the proposal surface (`DocumentRenewals`), and mounted them on the Books → Legal shelf with the shell's real `addEvent`. The door's papers (`property_documents`, 0154: `kind`, `title`, `effective_on`) never met them: the Properties mount handed the module `books` and `onFeedback` and no calendar add; a paper had no column for the day it stops being true; and the door shelf's kinds are exact tokens (`insurance`, `inspection`, `permit`) that the registry's phrase patterns do not match, so a filed policy read as "not watched".
- Reminders fire from `data.events` through `dueReminders` while the app is open (browser notifications); a confirmed renewal is one of those events. The honest limit DR-1084 §6 states stands: the longest lead the calendar offers is a month, and nothing rings a closed app.

## Decision

1. **The paper carries its own expiry** (0305, `expires_on date`, nullable). Null is "not read", never "does not expire". The family types it on the row from the paper; the row's validity sentence says which date it is judging by, the paper's or the kind's usual term.
2. **The door shelf's kinds are watched by their exact token.** `insurance-door`, `inspection-door`, `permit-door` match the whole field between separators, so "Insurance claim dispute" (legal work) and "About the insurance" (correspondence) are still nothing, as DR-1084's own tests require.
3. **The door's papers propose their renewals.** Inside PoeTech the shell's `addEvent` reaches the panel through `PropertiesApp`; the family sees "What the papers say is coming" over the door's own papers, edits each proposal and adds it; it becomes an ordinary calendar event with the kind's reminders. A tenant edits no date and is proposed nothing. Outside PoeTech (the standalone door) the dates are read and written and no proposal is offered, because there is no calendar there.

## What is deferred, and why

- **A reminder that reaches a closed phone.** The engine runs in the open tab; the sovereign push road (`/api/push-send`) has no clock behind it for renewals. The next step is a daily, braked NAS job (budget + lock, DR-0247) that reads every door's `expires_on` and pushes the kind's warning to the family's subscribed phones. `re-review: 2026-11-04`.
- **A portfolio view** (every door's renewals on one page, in the Big Picture) once the first doors carry dates. Same date.

## Verification

- `document-validity.test.js`: the three door tokens are kinds; **proven to catch**: the token is the whole field, so the legal-work and correspondence cases stay null; a date on the paper beats the term.
- `doc-signing.test.jsx`: the family writes an expiry (`patchDocument` called with `expires_on`) and the sentence names the term as a proposal before that; with `addEvent` in reach the proposal section appears, "Runs out soon · 2026-11-15", and a confirmed one is added with reminders; **proven to catch**: the tenant seat has no editor and no proposals; without the calendar the family has the editor and no proposals.
- The frozen shell: `addEvent={addEvent}` rides the existing Properties mount line; `monolith-budget-guard` unchanged.
