---
id: DR-0998
title: Advice with no name on it — ll241, and the next id comes from the tree you build on
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: B
entities: [poetech, colg]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — Darrell forwarded The Daily Upside's "Under the Finfluence" (2026-10-12) into the lesson lane with one word on it, "Lessons"
---

## Context

Darrell forwarded The Daily Upside's letter of 2026-10-12, *"Under the
Finfluence,"* from `dpoe@illinois.edu` with one word written on it:
**"Lessons."** Under the DR-0312 email lane that is the whole instruction.
The duplicate check ran first and came back clean: `finfluencer` and
`Roaring Kitty` appear nowhere in the catalogs, and the one `cost of owning`
hit in `sovereign-ai-class.js` is a single discussion prompt in `sov1`, not a
lesson built from these words.

Placed in **Living Lessons**, not Sovereign A.I. — the subject is money
counsel, haste and honest weights.

## What was measured

**Reported in the letter:** paid Discord rooms at hundreds of dollars a month;
a study of fifteen rooms where members acted within minutes and their own rush
briefly moved the price (an eBay call up ~30% in five to seven minutes); a
median expiry of about three days, with the strongest response to the most
speculative calls; a Legalaes review of 1,700 posts and 692M+ views finding
about two in a hundred advisers qualified and nearly a third of posts
misleading; and one operator's own words — recruitment by screenshots of rare
wins, shortest-dated calls as gimmicks and red flags.

**Not established, and the lesson says so in its own text** (DR-0100 tier 2):
fifteen rooms is a sample with its selection undescribed; "two in a hundred
qualified" counts licences, not honesty, and the letter names a licensed
exception. The honest claim is a shape — mostly unqualified, mostly three-day
bets, often misleading, and sold — not a verdict on every person.

**The twelve verses, fetched from the corpus on disk rather than remembered.**
`Proverbs 21:5` is the proof of why that rule exists: from memory it reads
"tend to plenteousness"; the corpus reads **"tend only to plenteousness."**

## Impact

A lesson teaching against false weights cannot itself misquote the Word, so
every verse is pinned verbatim and every band is checked where a reader
actually meets it. What this lesson deliberately does **not** do is teach that
investing is wrong: `Proverbs 21:5` has the diligent going somewhere and
`Proverbs 13:11` says gathering *increases*. The Word's quarrel here is with
haste and with counsel that cannot be weighed — the facilitator notes say so
explicitly, so a room cannot turn it into a blanket.

## Decision

Six movements, Word-first: counsel is commanded and therefore must be
weighable; look well to your going; **haste is the sin named, not profit**;
the cherry-picked screenshot is a false balance, so a true number can be a
lying weight; the desire is the snare and they pierced *themselves*; the remedy
is gathering rather than vanity with a friend close enough to see your face.
Four bands, each complete at its level, each sending the reader in all three
directions.

**And a working rule, from an error this build made:** derive a new lesson's
number from the tree you are building on, never from another checkout.

## Verification after merge

- `living-lessons-ll241-verses.test.js` — **17 green**: twelve verbatim corpus
  comparisons, every pinned verse actually quoted somewhere, `anchor.ref`
  naming every verse it stands on (DR-0734), and the per-band direction check.
- **Four bands**; `placesMissingDirections` is `[]` on the lesson and all four.
- **Proven-to-catch (DR-0795), the proof the builder brief names:** strip every
  friend-direction sentence from the teen band alone and `hasAllThree` still
  reads green while the per-band check names
  `{place: 'teen', missing: ['friends']}`.
- Generated files regenerated with their own tooling, never by hand:
  `lesson-dates.json` via `npm run lesson-dates`, the course-band baseline via
  `course-band-baseline-write.mjs` (total 409, allFour 235, adultOnly 0).
- **A real error, caught by this lesson's own test and recorded rather than
  quietly fixed:** the next id was computed in the main repository directory,
  which is parked on an older branch, so it answered 239 and the lesson was
  written as `ll240` — colliding with `ll240-he-said-it-and-did-not-do-it…`,
  the Numbers 14 lesson from DR-0981 the same day. The duplicate produced no
  complaint at insert time; the test caught it because `anchor.ref` came back
  full of Numbers 14. Renumbered to `ll241`.
- **The gate that would have caught it, built here** —
  `living-lessons-numbers-are-unique.test.js`. `learn-integration.test.js`
  already asserts id uniqueness, but it compares **whole ids** and only across
  three other courses, so it is structurally blind to this: the two full ids
  differ, a `Set` of ids is the same size either way, and it reads green while
  everything that resolves a lesson by its number prefix silently takes
  whichever comes first. The new check compares **numbers**, and the catalog's
  own entry is the fixture: restoring `ll240-advice-with-no-name` in the live
  file fails it with `{ number: 240, ids: […2] }` while the whole-id assertion
  in the same test passes — the hazard, demonstrated rather than described.
  The number is the lesson's name to a person; two lessons cannot share it.
