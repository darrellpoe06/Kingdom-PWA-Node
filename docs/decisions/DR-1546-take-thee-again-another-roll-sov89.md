# DR-1546 — Take thee again another roll: sov89 from one word over a Redis vs Memcached newsletter

**Date:** 2026-11-18 · **Status:** accepted · **Tier:** A · **Area:** Sovereign A.I. week 89; the lesson lane
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS, DECISION-RECORDS
**Reserved:** `refs/heads/reserve/dr-1546` and `refs/heads/reserve/sov89` on origin (empty-value lease), before a word was written.

## Context

Level Up Coding, *Redis vs Memcached* (dated Monday 2026-11-16), forwarded by Darrell into the lesson lane with **one word** above it: *Lesson*. Gmail thread `1a1e43310d023259`. Built 2026-11-18. One teaching, one lesson (DR-0610): `app/src/lib` and `docs/decisions` held no lesson on caching, Redis or Memcached (searched before building). A technical forward, so a Sovereign A.I. week by sov88's route (`scripts/sovNN-fill.mjs`), not a per-file Living Lesson. Left out: the sponsor block (capacity planning with agents) and the share lines. The forwarded source is trusted but verified: its figures are REPORTED; redis.io, memcached.org, valkey.io and docs.immich.app were outside the session network (`ENOTFOUND`), so no manual was opened.

## What was measured

| claim | tier | how |
| --- | --- | --- |
| A cache is a near copy, never the record; cache-aside; both tools real | ESTABLISHED (DR-0100) | stated plainly |
| Key/value limits, segmented LRU, Redis `noeviction` default, async replication, meta-protocol miss coordination | REPORTED (the newsletter) | taught as given, unranked |
| App and our own NAS services run no Redis/Memcached | MEASURED | `grep -ri 'redis\|memcache\|valkey'` over `infra/` code (vendor excluded) and `app/package.json`: none |
| The one Redis-family store: Valkey 9 in the Immich stack, no maxmemory, no policy, no volume | MEASURED | `infra/nas-immich/docker-compose.yml:53-56`, `REDIS_HOSTNAME` `:34`; photos are files `:17-20` |
| SearXNG limiter off for want of a Valkey | MEASURED | `infra/nas-research/searxng.seed.yml:17-19` |
| Service worker: one store per build, the rest deleted on activate save `poetech-keep-*` | MEASURED | `app/public/sw.js:19`, `:150-161` |
| Clip store: IndexedDB cache-aside, least recently played over 300 MB, downloads held, two in flight | MEASURED | `app/src/lib/clip-cache.js:13-19`, `:27`, `:50-57`, `:247`, `:323-329` |
| What Immich keeps in its Valkey; Valkey's own defaults | NOT VERIFIED | documentation hosts refused the session network |
| That store's memory use on the NAS | NOT MEASURED | the sandbox has no route to the NAS; no number taught, a gate refuses one |

Ladder: first draft left child/youth/teen under their floors, youth above teen and senior at 10.07; the adult was cut by ~115 words, youth split into shorter sentences, teen given ~250 words in longer sentences, senior's three longest split, all by hand (DR-1306). Landed: child 1.36 < youth 3.44 < teen 5.87 < senior 9.63 (adult 7.44); shares 0.524 / 0.622 / 0.664 / 0.668; worst overlap 0.077. 134 strings, 122 quotations across 13 books, 30 anchor references.

## Impact

Word first on Genesis 41:35-36 (the store laid up in the cities) and Jeremiah 36:28 (the roll burned and written again from the source) in every teaching place, before the word cache: locality (Genesis 41:48), the lost update (Proverbs 27:23; 1 Corinthians 4:2), expiry and eviction in the manna (Exodus 16:19-24), bigger barns and the counted cost (Luke 12:18; 14:28), the stampede and order at the storehouse (Genesis 41:56-57), the durable record (Exodus 16:32-33), the Word that does not pass (Matthew 24:35; Isaiah 40:8). Jesus confessed as the Lamb and the Eternal Son of Yahweh. Our house taught plainly: no Redis, no Memcached; one Valkey that came with Immich, on defaults; every app cache a rebuildable copy.

## Decision

1. sov89 lands as week 89. Course-band baseline 313 -> 314 (debt unmoved, adultOnly 0); file budget for the catalog 14212 -> 14434; third pile unmoved (no disclosure phrase).
2. FOUND, NOT CHANGED — Immich's Valkey runs with no memory limit, so under pressure it grows rather than evicts or refuses. Whether to cap it is an Immich-operations call, not a lesson's; read what Immich stores there and its memory on the NAS from a runner first. `re-review: 2026-12-18`.
3. `re-review: 2026-12-18`: open the Redis, Memcached and Valkey manuals from a runner and confirm or correct each REPORTED line.

## Verification

`app/src/__tests__/sovereign-ai-sov89-verses.test.js` (25 cases: every quotation verbatim, every double-quoted span Scripture, anchor exact, frame before the cache and the application, both tools and the manna/stampede/record in every teaching place, sponsor left out, no ranking, no model id, no DR at a reader, Yahweh in our voice, adversary lowercase, tiers and re-review, no number on the Valkey's memory, no disclosure phrase, house pins on the compose file, SearXNG seed, service worker and clip cache, talk-together whole, four-band ladder). PROVEN-TO-CATCH: a `command: valkey-server --maxmemory 256mb` line planted in the real compose file turned the Valkey pin red, then reverted. Suites: sovereign-ai-class, course-band-coverage, the-third-pile, quoted-verse-is-the-verse, sov88 green. On merge: PR, squash SHA, deploy run on that SHA, `site-health.yml`.
