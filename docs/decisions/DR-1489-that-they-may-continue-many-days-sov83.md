# DR-1489 — That they may continue many days: sov83 from one word over Level Up Coding's ACID

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 83; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1489` and `refs/heads/reserve/sov83` on origin, before a word was written.

## Context

Level Up Coding (Nikki Siapno) sent *ACID Clearly Explained* on 2026-10-30 at 12:38 UTC. Darrell forwarded it from his university mailbox at **12:54 UTC (7:54 AM Central)** with **one word** above the header: *Lesson*. Gmail thread `1a18cd240a3a03eb`. The intake fell behind; built 2026-11-13. The whole article was in the email (no teaser); the sponsor block (a retrieval guide) is left out. Placement: Sovereign A.I., as earlier Level Up Coding forwards were (sov45, sov50, sov69).

Week 82 was claimed by a sibling build as `reserve/sov82` (14:51:19 UTC) one second after this build pushed `reserve/sov-82` (14:51:18 UTC). The empty-lease referee (`scripts/lib/reserve-ref.mjs:11-14`, `:183`) compares exact ref names, and `KINDS` (`:29`) knows only `dr` and `ll`, so the two spellings were two names and neither push was refused. This build yielded and took 83. Deleting the stale `reserve/sov-82` was refused by the proxy (HTTP 403); it holds no work.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| The four guarantees; PostgreSQL uses MVCC + a write-ahead log | ESTABLISHED, stated plainly (DR-0100) | `www.postgresql.org` answered `curl: (56) CONNECT tunnel failed, response 403` and ENOTFOUND via the fetch tool, so stated as engineering, not a page read back |
| $5,000 transfer; last item in stock | ILLUSTRATION | the newsletter's own teaching examples |
| Payments ledger rules | MEASURED | `infra/supabase/migrations-auto/0116-payments-ledger.sql:37` CHECK `amount_cents >= 0`, `:46` UNIQUE `(provider, provider_event_id)`, `:14` append-only |
| Payment then grant: two requests, not atomic | MEASURED | `app/functions/api/stripe-webhook.js:342-357` ledger insert (ignore-duplicates), `:360-371` entitlement RPC, `:379` seat upsert, `:389-409` membership; a failed second write answers 500 so the processor retries |
| Workshop seat counted at checkout only | MEASURED (latent) | `app/functions/api/checkout.js:161` reads seats left; `stripe-webhook.js:379` writes the seat with no recount; `0323-a-workshop-is-sold-by-the-seat.sql:34` knows only `capacity > 0`, `:96-106` counts for display |
| Exam rule moved into the wall | MEASURED | `0313-every-exam-attempt-is-kept-and-the-best-score-stands.sql:58`, `:82-86`; the erasure fix `app/src/lib/learner-records-sync.js:80-92` |
| Learner record left the phone | MEASURED | `0250-a-learners-record-reaches-the-governor.sql:9-21`, `:47` PK, `:52` pct 0..100 |
| Live counts | NOT MEASURED | the live tables are on the NAS; the hosted project the Supabase tooling reaches is the mirror (`infra/nas-supabase/REPOINT-ARMED`), so its zero rows were NOT taught as live |

Ladder, first draft: child 0.488 and youth 0.539 under their floors; about 100 and 270 words authored by hand in each band's register (DR-1306). Landed: child 1.23 < youth 4.40 < teen 5.91 < senior 7.74 (adult 6.49); shares 0.524 / 0.639 / 0.617 / 0.666; worst overlap 0.086.

## Impact

Word first on Matthew 5:37 and Jeremiah 32:14 in every teaching place, ahead of the word database: atomicity (Joshua 11:15; Luke 14:28-30; Acts 5:1-4; Ecclesiastes 5:5), consistency (Leviticus 19:35-36; Proverbs 16:11; Hebrews 8:10), isolation (Genesis 27:30-38; Genesis 13:6-9; Proverbs 20:10), durability (Jeremiah 32:10; Numbers 30:2; Psalm 15:4; Esther 8:8; Malachi 3:16), the cost (Exodus 18:22), and the finished work (John 19:30; Matthew 5:17; Hebrews 7:25, 10:14; John 1:29; John 3:16; Hebrews 1:8; Colossians 1:17). 158 quoted spans, 19 books, 40 anchor references, filled by `scripts/sov83-fill.mjs`, none typed. Course-band baseline 304 -> 305, debt unmoved. Third-pile GAP unmoved (no admission phrase; gated).

## Decision

1. sov83 lands in Sovereign A.I. week 83; `HELD_IN_FLIGHT = [82]` in `sovereign-ai-class.test.js` until the sibling's 82 merges, then deleted on the merged tree.
2. FOUND, NOT CHANGED — the workshop seat can be oversold under concurrency (two buyers both pass `checkout.js:161`). The fix (a row lock on the event with a recount inside the seat write, or a capacity trigger) is a money path and needs the Governor's decision on what the second buyer gets (waitlist or refund). `re-review: 2026-11-27`.
3. FOUND, NOT CHANGED — `reserve-ref.mjs` has no `sov` kind, so course numbers are hand-spelled and two spellings defeat the referee; `sweep-reservations.mjs` also does not clear them. Giving the course one owned spelling is the fix. `re-review: 2026-11-27`.
4. `re-review: 2026-11-27`: read the PostgreSQL manual from a runner and cite it if it reads back.

## Verification

`app/src/__tests__/sovereign-ai-sov83-verses.test.js` (36 cases: every quotation verbatim, every double-quoted span Scripture, anchor exact, frame before the database, the three tiers, no claimed double sale, no disclosure phrase, no model identifier, no generic name in our voice, TALK close per band, the ladder; the house claims pinned to the code that makes them true, so a fix to the seat or the referee turns them red and forces the lesson to be rewritten; proven-to-catch cases for a drifted verse, a wrong verse, a newsletter phrase put in quotation marks, a planted generic name, a claimed double sale, a disclosure phrase and a stripped friend line).
