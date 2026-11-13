# DR-1486 — How beautiful are the feet: sov82 from one word over ByteByteGo

**Date:** 2026-11-13 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 82; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1486` and `refs/heads/reserve/sov82` on origin, before a word was written.

## Context

Darrell forwarded ByteByteGo's *Data Movement Strategies In System Design* (sent 2026-10-29 15:31 UTC) from his university mailbox at **18:38 UTC, 1:38 PM CDT**, with **one word** above the header: *Lesson*. Gmail thread `1a1885689c5c2ffc`. The intake lane fell behind; built from the backlog on 2026-11-13. `lesson-already-built.mjs --thread 1a1885689c5c2ffc` returned MAYBE on the source name only (sov39, sov59, sov70 are ByteByteGo) and nothing on the thread. The email was a **preview** of a paid article: four paragraphs and nine topic headings (source/consumer/trigger, pull, polling, push, long polling, SSE and WebSockets, message queues, change data capture, choosing). The sponsor block is left out on purpose.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| What each strategy is | ESTABLISHED, stated plainly (DR-0100) | standard engineering; taught as such, never attributed to the article |
| The article's benefits and choosing advice | NOT READ, not reported | `blog.bytebytego.com`, `bytebytego.substack.com`: `curl: (56) CONNECT tunnel failed, response 403` |
| Our own data movement | MEASURED on `origin/main` b0a8e87fe5f | below, each pinned in the lesson's test against its source |

- 37 files under `app/src` (tests excluded) subscribe to `postgres_changes`; `Messages.jsx:84-86`; `direct-messages-sync.js:244-256` treats each notice as a signal and re-reads the record, heartbeat `DM_HEARTBEAT_MS = 15000` (`:221`), skipped while hidden (`:252-253`).
- The realtime client in `app/node_modules/@supabase/realtime-js` (2.118.0) opens a WebSocket; no EventSource and no long polling in `app/src` or `app/functions`.
- `Inbound.jsx:124` polls every 5 min; `site-health.yml:51-63` requests `*/10`, measured ~67 min (38-154, 28 runs).
- `schema-v2.14-realtime-publication.sql:4-8`: ten tables subscribed to and never published, a silent no-op.
- `0220-...-the-outbox.sql:10-24, 33-44`: `push_outbox` written in the same step; `push-outbox-drain.yml:29,42` drains `*/15` only when `PUSH_OUTBOX_DRAIN_ENABLED`. The 0215/0216 order-form failure is told without naming any person.

The ladder failed the first draft (child 0.344, youth 0.465, teen 0.384, senior 0.519; teen read easier than youth). The adult lesson was trimmed and every band extended or rewritten by hand (DR-1306). Landed: child 1.10 < youth 3.55 < teen 4.85 < senior 7.14 (adult 7.40); shares 0.514 / 0.609 / 0.635 / 0.620; worst overlap 0.147.

## Impact

Word first on Romans 10:14-15 (hearer, carrier, sending) and Proverbs 25:13 (the faithful messenger), quoted ahead of the newsletter in every teaching place; then Deuteronomy 32:7 (pull); Isaiah 21:11-12 and 1 Kings 18:43-44 (polling); 2 Samuel 18 (push, and Ahimaaz with no tidings ready, set beside our signal-then-read design); Habakkuk 2:1, 3, Psalm 19:2, Malachi 3:16 (long polling, SSE, WebSockets); Esther 8:8-14 (queues; a sent message is not recalled, a correction is a new one); Esther 6:1-3 (change data capture, and the record nobody acted on); Ecclesiastes 3:1, Proverbs 15:23, 13:17, 26:6, 27:1 (choosing); Hebrews 1:1-2, John 1:1, 14, Jesus the Lamb and the Eternal Son of Yahweh. 161 quoted spans, 15 books, 43 anchor references, all filled from `app/public/bible/kjv` by `scripts/sov82-fill.mjs`.

Third-pile GAP 35 -> 36 by the second remedy (the unread article is named; no row). Course-band baseline 304 -> 305, debt unmoved.

## Decision

1. sov82 is placed in Sovereign A.I. (week 82), as prior ByteByteGo forwards were (INTAKE-AND-FIT: a household that runs its own systems must know how its own news travels).
2. A preview is never told as the article: nothing is attributed to ByteByteGo beyond its nine headings, gated. `re-review: 2026-11-27`: try both hosts from a runner; if the article reads back, compare it with what the lesson teaches and lower the GAP pin.
3. FOUND, NOT CHANGED: whether `PUSH_OUTBOX_DRAIN_ENABLED` is set is a repository variable this session cannot read, so the lesson says only that the drain runs when switched on. `re-review: 2026-11-27`.

## Verification

`app/src/__tests__/sovereign-ai-sov82-verses.test.js` (43 cases: quotations verbatim, only Scripture in double quotes, anchor exact, frame before the newsletter, nothing attributed to the article, every house figure read back from its source file, no person named, TALK close per band, the ladder; proven-to-catch for a drifted verse, a wrong verse, a quoted person, a planted attribution, a stripped date, an EventSource, a drifted figure and a stripped friend line). Catalog suites, `course-band-coverage`, `the-third-pile-is-a-worklist`, `decision-chain`, `unfilled-verse-token-guard`, `the-author-never-types-a-verse`, eslint and format-guard run on this tree.
