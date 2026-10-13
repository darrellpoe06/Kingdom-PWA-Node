# DR-0845 — The ledger pointer is a value, not a citation: a guard that fires on correct work spends the same trust as one that misses

**Date:** 2026-10-09
**Status:** Accepted
**Principle:** DR-0076 (verification doctrine) · DR-0250 (machinery over memory) · DR-0075 (perpetual improvement)

## Context

The `cited-but-unread` guard exists because of a real failure: an agent wrote `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` into a file header having read only CLAUDE.md's summary of it, and reading the document later changed the design. An unearned citation makes unreviewed work look reviewed, and it is invisible in review precisely because it looks right. The guard checks the claim against the transcript, which records every file a session opened.

On 2026-10-09, shipping lesson L223, the guard blocked a reply that was true. The reply reported the ledger's own pointer, `**Next ID:** DR-0835`, as the evidence that the lesson's ledger row had landed cleanly. The guard read that number as a citation of a decision record and found no read of it.

It was right that nothing had been read, and wrong about what the number was. The `Next ID` pointer names the next **unclaimed** record. No file exists for it, and none can be read. The check was firing on a correct statement, and every future report that proves a ledger claim by quoting the pointer would hit the same wall.

That matters beyond the nuisance. A guard that cries wolf gets switched off, and a switched-off guard protects nothing — the guard's own header says so. A false positive on correct work spends the same trust the original incident spent, only from the other direction.

## What was measured

Traced in `app/src/lib/cited-but-unread.js` and `scripts/ari-guard-stop-hook.mjs` before changing anything:

- `DR_RE = /\bDR-(\d{4})\b/g` matches every four-digit id in the reply text, with no notion of whether a record for it exists.
- Foundation docs were already handled precisely: the hook passes the real filenames from `docs/00-foundations/_root` as `knownDocs`, so only actual documents count as citations. Decision records had no equivalent.
- The repo ledger at the time of the fix: **781 record files, 781 INDEX rows**, pointer `DR-0839`. Rows and files match exactly — there are no file-less rows.

A wider fix was then built, measured, and **rejected**: treat an id below the pointer with no file as a wrong or invented number. Measured against the real ledger that is false. **57 ids below the pointer have no file and are legitimately citable:**

- **DR-0017 through DR-0049** (33 of them) are the pre-file-convention era — real binding decisions recorded in `docs/99-session-notes/**` rather than their own files. `docs/reviews/REVIEWS.md:263` confirms the range by measurement.
- **DR-0655** and others are claimed by branches still in flight (PR #1817 among them).
- The rest are numbers abandoned mid-claim.

Those ids are cited across `docs/`, `app/` and `scripts/` today. The wider rule would have blocked correct work on all 57. "No file" proves nothing about a number below the pointer, so the fix stops at the pointer.

End-to-end against the real ledger, driving the hook with real transcript fixtures:

| Reply cites | Before | After |
|---|---|---|
| the pointer, `DR-0839` | **blocked** (false positive) | passes |
| `DR-0060`, a real record, never opened | blocked | **blocked** (unchanged) |
| `DR-0017`, pre-convention, not read | blocked | blocked (unchanged; a read of the session note clears it) |

## Impact

The guard keeps catching the failure it was built for and stops firing on a true statement. One rule, no wider: **an id at or above the ledger's `Next ID` is unclaimed by definition, so it cannot be required reading.** Everything below the pointer is policed exactly as before.

Supply no pointer and behaviour is byte-identical to before. A caller that cannot read the ledger must never quietly relax the gate, so the fail-open path stays strict rather than permissive.

## Decision

1. `checkCitedButUnread` accepts `nextDrId`, the ledger's `Next ID` pointer. A cited `DR-NNNN` at or above it is not treated as a citation of required reading.
2. `scripts/ari-guard-stop-hook.mjs` reads that pointer out of `docs/decisions/INDEX.md` and passes it. If the read fails the pointer is null and the check behaves as it did before.
3. The rule stops at the pointer. A file-less id **below** the pointer stays an ordinary citation, because the ledger's 57 such ids are real decisions in session notes, in-flight claims, or abandoned numbers.
4. Nothing is loosened for foundation docs. They remain judged against the real filenames in `docs/00-foundations/_root`.

## Verification

- `app/src/__tests__/cited-but-unread.test.js` — 26 cases, proven-to-catch in both directions:
  - the pointer and a forward id pass;
  - an unread record below the pointer still blocks;
  - the pointer does not excuse the id immediately below it;
  - a file-less pre-convention id is still an ordinary citation, cleared by a real read;
  - with no pointer, or junk in its place, every id is policed as before.
- End-to-end hook runs against the live ledger, the table above, driving `ari-guard-stop-hook.mjs` with real transcript fixtures rather than unit stubs.
- Lint clean. Full Vitest suite green.

## Found, not fixed

Citing a pre-convention record (`DR-0017`–`DR-0049`) still blocks unless the session happens to open the session note that holds it, because the guard looks for a path carrying the id and no such file exists. That is a pre-existing false positive of the same family, left untouched here rather than widened into, since closing it means teaching the guard where those decisions actually live. Not silently dropped: `re-review: 2026-11-07`.
