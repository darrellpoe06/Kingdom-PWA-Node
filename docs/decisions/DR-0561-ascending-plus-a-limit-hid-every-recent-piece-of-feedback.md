# DR-0561 — Ascending plus a limit hid every recent piece of feedback

- **Status:** accepted
- **Tier:** B
- **Type:** fix
- **Date:** 2026-09-22
- **Scope:** `app/src/lib/feedback-sync.js` (`FEEDBACK_LIST_LIMIT`, and the order the list query uses)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — a comment is not evidence), REALITY-TRACE (DR-0061), SPEAK-ESTABLISHED-FACT (DR-0100)
- **Grounds:** Darrell 2026-09-22 ("how is the feedback process going?!!!!!! We had a lot I've never seen them...!!!!!!"); the `sovereign-read feedback` probe run the same evening

---

## What he asked, and what the database said

> "how is the feedback process going?!!!!!! **We had a lot I've never seen them**...!!!!!!"

He was right, and the reason was not triage. It was the query.

```
total=963   window=963   confidential_withheld=0   newest=2026-09-22 21:41:32
```

963 rows on the sovereign database, the newest an hour old. The board fetched:

```js
.order('submitted_at', { ascending: true })   // OLDEST first
.limit(FEEDBACK_LIST_LIMIT)                    // 500, then cut
```

**Ascending plus a limit returns the oldest 500 and discards the newest.** Once the table passed 500 rows, roughly **460 of the most recent submissions could not reach the board at all** — silently, and with the bias running exactly the wrong way: the newer a message was, the less likely anyone was to see it.

## The comment was the real failure

The line above that query said:

> *"The board reads newest-first, so the cap drops the oldest items rather than the ones anyone is working. 500 is far above the 119 rows that exist today — this is a ceiling, not a page size."*

Two untruths in one paragraph. The query does **not** read newest-first; it reads oldest-first, which is why the cap dropped precisely "the ones anyone is working". And the table is not at 119 — it is at 963. A comment that describes the opposite of its own code is worse than no comment: it is what stops the next reader from looking.

This is DR-0076 at the smallest possible scale. The claim was right there, in the file, unverified, for as long as it took the table to grow past the cap.

## What shipped

- **`ascending: false`.** A ceiling is only safe when it drops the oldest history and never the newest word.
- **The limit is 2000** against a table at 963 — real headroom, and still a ceiling on cost rather than a page size.
- **The comment now records the measurement**, with the date and the number, so the next person to read it is reading evidence rather than an assertion.

## Verification

Lint clean; the feedback suites re-run green (16 files, 213 checks). The numbers in this record were printed by the probe, not estimated.

## Limits, stated

1. **A person's OWN feedback still comes only from local device storage.** The list query filters `.neq('user_id', myUserId)` to avoid duplicating rows already held locally, so on a new device or a cleared browser a person cannot see what they themselves sent. That is a second, independent reason Darrell has "never seen them", and it is **not** fixed here — merging own rows needs de-duplication by id at the merge point, which this change does not touch. `re-review: 2026-09-29`.
2. **2000 is a bigger ceiling, not an unbounded one.** At the current rate the table will reach it; the durable answer is paging or a server-side window, not a larger number. `re-review: 2026-12-22`.
3. **Most of the 963 are machine-written engagement rows** (`[Learn engagement] band=… signal=started …`), not tester sentences. They are real signal — they are how we know parishioners started courses — but they will crowd out human words in any flat list, and nothing here separates the two streams. `re-review: 2026-10-22`.
