# DR-1073: The church can actually issue the statement — and a proposed match is not a fact

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (a tax document handed to a member, issued from the office's own book)
**Type:** word
**Area:**
- `app/src/lib/giving-statement-source.js` (new — the bridge, and the text document)
- `app/src/components/ContributionStatement.jsx` (new — where a steward issues one)
- `app/src/components/ChurchGivingBook.jsx` (the chip's home, under the person selector)
- `app/src/poe-financial-mvp-v28.jsx` (the church record reaches the book)
- `app/src/lib/church-profile.js` (`legalName` and `ein` — the two facts a tax statement needs)
- `app/src/__tests__/giving-statement-source.test.js`, `app/src/__tests__/contribution-statement-surface.test.jsx` (new)

**Grounds:** Darrell, 2026-10-16: **"The church has will need to have recorded records for giving for tax purposes..."** and **"make sure people know the tax benefits of their church tithe."** DR-1064 built the statement that morning and shipped it with no caller; DR-1072, that afternoon, found the same orphan pattern in DR-1070's funnel and closed it. This is the second of the two.
**Principles:** DR-1064 (Pub 1771 — the statement's own rules); DR-0061 / P15 (a surface is a live view of real state); DR-0076 (no claim without evidence; §3 proven-to-catch); DR-1063 (when it happened vs when it was written down); DR-0329 (say what is not built)

## Context

Darrell asked for giving records for tax purposes. DR-1064 answered with
`giving-statement.js`: the IRS Pub 1771 rules as code — the $250 written-
acknowledgment threshold, the $75 quid-pro-quo disclosure, non-cash gifts
described and never valued, the anonymous carve-out, and a refusal rather than
a $0 statement that reads like a denial.

**And it had no caller.** Meanwhile the church's record of what it received had
existed since migration 0214 — `church_giving_batches` and
`church_giving_claims`, "the office keeps its own book of what the church
received." The church held both halves and could not issue one statement.

That is the third orphan found in a day (DR-1070's funnel, DR-1064's statement,
and the covenant's own advertiser clause nobody re-read). The pattern is now the
thing to check, not a coincidence.

## What was measured

| | |
|---|---|
| `grep -rln giving-statement app/src` | its own module and its own test. No caller. |
| `church_giving_claims` (0214) | exists, populated, with gross / fee / net, `parishioner_user_id`, `match_basis` and `match_confirmed_by` |
| `giverStatement` in `giving-reports.js` | already renders ONE PERSON'S RECORD as a CSV report — the office's own read, not a tax document |
| the church's legal name / EIN | **nowhere in the app.** `checkIssuer` refuses without a legal name and address, and warns without an EIN |

So the gap was a bridge, a surface, and two profile fields — all buildable now
(DR-0236). The one thing I cannot supply is the EIN itself, which is a value the
church holds.

**And the book's own words named the hazard.** 0214 describes `match_basis` as
*"how the link was proposed (provenance, not proof)"* and `match_confirmed_by`
as *"a HUMAN confirmed it; NULL means nobody did."* A claim carries
`parishioner_user_id` as soon as the matcher **proposes** a member. Feeding
those rows to a statement would print one person's money on another person's tax
document — the single worst thing this feature could do, and it would happen
silently, to the people whose names resemble each other.

## Impact

The office can issue a member's annual contribution statement from the gifts it
actually received, and the three decisions that could harm a giver are made
explicitly, in one pure file, with a test apiece.

## Decision

**A bridge with three rules, each one a way a well-meaning office does real
damage:**

1. **Only a human-confirmed attribution may be printed for a named member.**
   An unconfirmed proposal is excluded, **counted, and said out loud** — on the
   screen *and* on the downloaded document — because a member who gave $900 and
   is handed $500 will find the difference against their own bank and should not
   have to phone the office to learn why. Silently dropping it is the version
   that erodes trust.
2. **The deduction is what the giver gave, not what arrived.** A claim holds
   gross, fee and net. The processor's fee is the **church's** cost of accepting
   the gift, not a reduction of the gift, so the statement is built from
   `grossCents`. Using net would understate every electronic giver's year, and
   it is the mistake a reasonable person makes because net is what hit the bank.
3. **A refund is shown, not hidden.** A reversed gift is a negative claim; it
   stays on the statement as a negative line so the total is what the person
   actually gave and the arithmetic can be followed. Dropping it would overstate
   the year — the dangerous direction, because the member files on it.

**A surface at Church → Giving book → Reports**, under the person selector that
already exists, because *"one person's record"* and *"one person's tax
statement"* are the same question asked twice. The tax year is chosen
explicitly from the years the book actually holds — deriving it from today's
date would issue last year's statement in January and this year's in December
without anyone saying which they meant. The issue date is stamped by the
component (the one clock in the feature; both libraries stay pure) so
`contemporaneousCheck` can say whether it is in time for the filing due date.

**Every refusal is words on the page**: an empty year, a church with no legal
name or address on file (named precisely — *"legal name and address are not on
file"*), and no download button at all when there is nothing to stand behind.

**Two profile fields, `legalName` and `ein`.** `checkIssuer` already prefers the
legal name and already warns on a missing EIN; these are what turn a warned
statement into a clean one. Neither is required to run a church; both are
required to hand somebody a tax document. The profile is a form, not a migration
(0297), so this is two entries in `PROFILE_FIELDS` and two keys in
`mergeChurchRecord` — no schema change.

## Verification

- **27 cases** across the two new suites, weighted at harm to a giver rather
  than at arithmetic (DR-1064's 34 cases already pin the statement's own rules).
- **Proven to catch, by four mutations** (DR-0076 §3), each the plausible version
  of the mistake:
  - net instead of gross → the RULE 2 case **fails**;
  - trusting an unconfirmed proposal → the RULE 1 case **and** the refusal case
    **fail** (two cases, because the worst version is a member whose only gifts
    are proposals being told "no gifts are recorded");
  - silently dropping a refund → the RULE 3 case **fails**;
  - issuing a $0 statement instead of refusing → two cases **fail**.
  - Files restored byte-identical after each (`git diff --stat` empty).
- **ONE MUTATION OF MINE DID NOT MUTATE, AND THAT IS WORTH RECORDING.** Testing
  the "say why the number is short *before* showing the number" assertion, my
  first attempt moved the notice block to just after the fragment opener — which
  is still above the figure, so the suite stayed green and I nearly recorded
  that assertion as unproven. Moving the block below `</dl>` **fails** it
  correctly. A mutation that does not change behaviour proves nothing about the
  test; it only proves the mutation was wrong.
- **The wiring is asserted**, in both directions: the book imports and renders
  the component, accepts a `church` prop, and the shell hands it
  `data.church` — because an orphaned component is the exact failure this record
  closes, for the second time today.
- **The document's required elements are asserted on the rendered text**, not
  the object: the church's name, the giver's name, each gift's date and amount,
  non-cash gifts described with **no `$` anywhere in that block**, the
  goods-or-services statement, the EIN, the issue date, the $250 flag, the
  held-back total, and the tax teaching — with the standard-deduction figure
  asserted **absent**, since a stale number on a tax document is a liability.
- 10 suites re-run around the change (`church-giving-book`,
  `church-giving-book-render`, `cashapp-giving`, `church-profile`,
  `church-door-profile-render`, `giving-statement`, `report-export`,
  `finance-reports`, plus the two new): **244 tests green**.
- 23 gates green by exit code — **after the citation guard caught me citing
  DR-1073 from three places before this file existed**, which is the gate
  working as designed. Lint clean; build green.

## What this does not do

- **It does not send anything.** Nothing is emailed or posted; a steward
  downloads the statement and hands it over. Sending it is a separate decision
  about a member's address and consent, and it is not made here.
- **It cannot supply the church's EIN or legal name.** Those are values the
  church holds, and until they are entered the surface refuses and names them.
  **For Darrell:** Church → the church's own details now has *"Legal name (for
  tax statements)"* and *"EIN (for tax statements)"*. With them on file, every
  statement issues clean; without them, nothing is issued at all.
- **It does not let a member print their own statement.** `MyGivingRecord` shows
  what they entered themselves; the official statement comes from the office's
  book, which is what `STATEMENT_PROVENANCE` has said all along. A member-facing
  copy would need the office's claims under RLS for one person, which does not
  exist yet. **`re-review: 2026-10-26`.**
- **It does not confirm a single match.** The review queue in the giving book is
  where a person does that, and this surface deliberately makes the cost of not
  doing it visible — a held-back total on the member's own document.
- **It is not tax advice**, and the document says so in the church's own words.
