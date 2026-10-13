# DR-0360 — The day's post, and the child who sorts it

**Date:** 2026-09-11 · **Status:** accepted · **Tier:** B · **Area:** money · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, DETERMINISTIC-FIRST, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-11)

> *"people can review their documents that came in that day and sort them to their respective products and locations for users to see a now or later whenever they want"*

And, answering the open question DR-0358 left about whether a child may do it:

> *"Yes. We want our children to learn the process and a system helps them to learn how we work"*

## The tension this record resolves

Three things were all true at once, and two of them pulled against the third:

1. **Darrell wants the children learning the process.** Stated plainly, twice.
2. **DR-0094 reserves to the guardian what a child sees.**
3. **The books wall (0082/0100, kept by 0202 and 0203) keeps a child out of the ledger entirely** — no obligations, no settlements, no mortgage line items, no bank rows.

Under 0202 alone, `document_route`'s rule was "the person who filed it, or an owner or admin". A child is neither, so a child could sort nothing and — because 0201's shelf is private until shared — could not even *see* a document someone else filed. Handing a child the shelf to fix that would have broken (2) and, for any document that is a bill, leaked exactly what (3) exists to prevent.

## Decisions

1. **A guardian releases ONE document at a time into the tray** (`document_release_for_sorting`, owner or admin only). Releasing is the guardian's judgement — the decision DR-0094 already reserved to them, now *written down* with their name and the moment instead of left implied. The refusal says so in words: *"only a guardian decides what a child sees."*
2. **The shelf gains exactly one narrow door.** 0201's read rule (yours, or shared with the household) keeps both of its cases; 0204 adds a third — *a document a guardian released for sorting*. One release opens one document. The smoke proves it: after releasing one of three, the child counts exactly **1**, and **0** of the other two.
3. **The file's bytes are untouched.** The storage policies still require the document to be the reader's own or shared with the household, so releasing it for sorting does **not** hand a child the PDF. A child sorts *what the household calls it*, not what is inside it.
4. **Sorting widens by exactly one case.** `document_route` keeps every refusal 0202 had and adds: released, and a member of this household. A person outside the household is still nobody here.
5. **A release is whole or absent.** A database CHECK makes `sorting_released_at` and `sorting_released_by` live or die together — a timestamp with nobody's name on it is a decision with no one accountable for it.
6. **The tray is not the books, and the smoke says so out loud.** After a child sorts a released document, the same child reads **zero** `obligations`, **zero** `obligation_lines`, and **zero** `transactions`. That assertion is the point of the whole file.
7. **Unsorted is a real state.** Nothing files itself and nothing nags, because Darrell's *"a now or later whenever they want"* only works if the pile supports being left alone. The surface says this in as many words.
8. **A sort says what it is AND where it goes, and is reversible.** Clearing both undoes it; clearing only the meaning is refused, because a document that "belongs to Properties" while being nothing in particular is half a fact.
9. **The chore is described truthfully, not simplified.** `THE_CHORE` tells a child what the job is, why it matters (*"the first step of how money is handled here"*) and what stays the grown-ups': *"You will not see amounts or the books."* Telling a child the boundary is part of teaching the process, not a caveat bolted on.

## Proof — measured, not asserted

- **Run against the LIVE schema in a rolled-back transaction before pushing** (DR-0076 §7): a child saw **0** documents before any release; a child was **refused** the release; the owner released one; the child then saw exactly **1** and sorted it; the child still read **0** obligations; withdrawing it returned the child to **0**. The rollback was then verified — the column, the function and the fixture all confirmed absent from production afterward.
- `0204-the-days-post-smoke.sql` on the `product-forms` isolation leg carries the full matrix, including a member refused, another household refused, a withdrawn document refused, and a release with no releaser refused by the constraint.
- `days-post.test.js` (17) · `obligations-render.test.jsx` (8).
- **Proven-to-catch, twice, on the two boundaries that matter:** letting a *member* release fails the guardian-only test; widening the read policy to the whole household fails the narrow-door test. Both restored.
- The **`migration-replay-order` guard caught two real reverts** while this was written — 0204 redefines both `family_documents_read` (from 0201) and `document_route` (from 0202), and the isolation leg replaying those would have silently undone it. The guard failed the build and named both.

## What this deliberately did NOT do

- **No auto-filing and no suggestions.** A rule that guesses "this looks like a bill" would be a painted number in a different costume. A person decides. *re-review: when there is enough real post to learn from — not before.*
- **No child-facing door of its own.** The tray lives inside Books → Owed, which a child cannot reach. Giving a child their own way in is a real surface decision and is not smuggled in here.
- **No tie between a sorted bill and an obligation yet.** Sorting says what a document is; attaching it to the thing it proves is `obligation_attach_document` (0202) and is still a guardian's action.
