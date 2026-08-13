---
id: DR-0296
title: The shell routes the link, or the lesson never opens — one URL parser for boot and Back, and the test walks the routing it used to skip
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0290]
tier: A
entities: [church, poetech]
grounds: [VERIFICATION-DOCTRINE, REALITY-TRACE, APP-IS-PRIMARY, COMMUNITY-FIRST, MACHINERY-OVER-MEMORY]
source: 2026-08-13 session — Darrell, opening a link this app produced: "Sucks... doesnt even take the user to the actual lessons.... !!!!!!!!!!! Only to the live stream tab with the player open for nothing!!!!!!! Is this tested before? what is going on with claude!!!!!!!??!!!!"
---

## Context

DR-0286 built the share blocks. DR-0290 opened the door so a shared link needs no
login. This session added the native share sheet, the whole-course share, and the
learner's own time-fit. Every one of those shipped green.

And the link did not work.

Darrell opened one on his phone and landed on the Church tab's **Worship**
sub-tab — the live-stream player, mounted over nothing, no lesson anywhere on the
screen. Everything upstream of that moment was correct. The link was correct. The
door was open. The lesson reader was correct. The app simply never routed him to
the tab that holds lessons.

## What was actually wrong

Every share link this app builds is:

```
?view=church&sub=learn&course=<key>&lesson=<id>
```

Two functions in the shell decide where that URL boots:

- `getInitialView()` read `view` → `'church'`. Correct.
- `getInitialChurchView()` read **`view` and only `view`** —
  `['engagement','choir','pulpit','learn','events',…].includes('church')` is
  `false`, so it fell through to its default, `'home'`. The Worship tab.

It never read `sub` at all. `lib/nav-history.js`'s `parseNav` — the parser used
for Back/Forward and for the history seed — **has always read `sub` correctly**.
The boot path and the history path were two different readers of the same URL,
and only one of them was right.

The damage was not limited to the sub-tab. Because the seed's `sameUrl` check
compared `navKey(parseNav(search))` (church|learn) against the booted location
(church|home), they disagreed, so the seed **rewrote the URL** through
`urlFor()` — which carries only `view`/`sub` plus the door params. The `course`
and `lesson` params were stripped from the address bar on arrival. Even a reader
who found the Learn tab by hand had lost the lesson by then.

This is the exact shape `initialBooksView` was written to fix for Books, and its
own comment says it was "restoring the parity that view (getInitialView) and
churchView (getInitialChurchView) already had." That sentence was wrong when it
was written. churchView never had the parity.

## Why the suite was green

`learn-deep-link.test.jsx` is titled "A shared link really opens that lesson — in
the real Learn render," and it does prove that — by mounting `ChurchLearn`
**directly** with the query string set.

The shell decides whether `ChurchLearn` mounts at all, and nothing in the 7,678
tests standing before this change ever asked it. The component under test was never the surface the user meets.
That is LESSONS **P16** word for word — *confirm the surface the user actually
uses, by observing, not by assumption* — and it landed anyway, because "observe
the running app" was read as a step for building a NEW surface rather than a
standing property of every test that claims a user journey.

A test that walks a journey must walk **every** step of it, including the ones
that live in code it would rather not import.

## Decision

1. **One parser for the URL.** `initialChurchView(search)` joins
   `initialBooksView` in `lib/nav-history.js`, resolving through `parseNav`. The
   shell's `getInitialChurchView` delegates to it and holds no list of its own.
   Boot and Back can no longer disagree about what a URL means.

2. **`VALID_CHURCH_SUBS` is validated against the shell's own render branches.**
   A deep-link must resolve to a branch that renders something — the "blank tab"
   class DR-0061 named. The test derives the branch list from the shell source
   (DR-0121, derived not typed), so the two cannot drift into a link that opens
   nothing. The staff-only subs are routable on purpose: their branches exist and
   do their own gating, so a link lands on the gate rather than on a blank page.

3. **Every legacy alias stays a working link.** `?view=learn`, `?view=scripture`,
   `?view=bus`, `?view=harvest`, `?view=conference`, `?view=program` are links
   already in the wild; `CHURCH_ALIASES` is now a superset of everything the
   shell ever honoured, pinned one-by-one. Widening the shared parser must never
   narrow what already worked.

4. **The routing decision is tested, and the journey test walks it.**
   `shell-church-deep-link.test.js` asserts the resolution on the exact URL
   `lessonQuery` emits, keeps the old `view`-only read alive as a regression
   witness so the passing assertion is demonstrably not a tautology, and pins the
   shell to the delegation in source. `learn-deep-link.test.jsx` gains a walk that
   asks the resolver first and mounts Learn **only if** the answer is `'learn'` —
   so a routing regression stops the mount and fails the journey no matter how
   correct `ChurchLearn` stays.

5. **Proven-to-catch (DR-0076 §3), not asserted.** The old body was restored into
   the shell and the suite was run: 2 failures. Restored the fix: 11 green. A
   gate that was never shown to catch the break is theatre.

## What this cost, stated plainly

The share work of 2026-08-10 through 2026-08-13 — the share sheet, the
whole-course share, the login-free door, the time-fit — was all real and all
reachable only through a link that opened the wrong tab. Darrell found it by
opening one on his phone. No gate did.

The honest reading is not "one function had a bug." It is that a green suite
reported a journey working while the first step of that journey was never
executed, and the person who found it was the principal, on his own product, in
front of whoever he had just sent the link to.

## Consequences

- Shared lesson and course links open the lesson.
- `course` / `lesson` survive the history seed, because boot and `parseNav` now
  agree and the URL is preserved rather than rewritten.
- Six church sub-tabs that were never deep-linkable (`eternal-algorithms`,
  `projects`, `videowall`, `devices`, `infra-plan`, `observe`) now are.
- 13 new pins; suite **7,690 green** (1 skipped, 670 files); lint clean; build
  clean; monolith held at its frozen budget of 5,326 lines — the explanation
  lives in `nav-history.js`, which is where it belongs.

## Honest remainder

- `VALID_VIEWS` in `nav-history.js` is a **shorter list than the shell's own**
  `getInitialView` VALID list — `tlc`, `notes`, `voice`, `scribe`, `library`,
  `recipes`, `games`, `tvtime`, `advocacy`, `databack`, `messages`, `inventory`,
  `forecast`, `cohorts`, `relationships`, `practice`, `rentals`, `inbound` and
  others are missing from it. Boot still resolves those (the shell's own list is
  used for the top-level view), but `parseNav` does not, so a **popstate that
  falls back to parsing the URL** can drop such a view to `overview`. This is the
  same two-lists disease one level up, found while fixing this one, and it is not
  fixed here — the top-level list is load-bearing for every tab and deserves its
  own change with its own proof. **re-review: 2026-08-20.**
- The share-sheet and time-fit work merged before this fix was in place, which
  means the window in which those links were live and broken is real and is not
  being minimised.
