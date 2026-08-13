---
id: DR-0297
title: The demo must never become real data — a URL rewrite was lifting the write-suppression, and two lists that must agree now have a mechanism instead of a comment
date: 2026-08-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0296]
tier: A
entities: [all]
grounds: [VERIFICATION-DOCTRINE, DATA-AS-EMPOWERMENT, MACHINERY-OVER-MEMORY, REALITY-TRACE, PERPETUAL-IMPROVEMENT]
source: 2026-08-13 session — found while auditing the honest remainder DR-0296 recorded against itself, rather than waiting for its 2026-08-20 re-review date.
---

## Context

DR-0296 closed the shared-lesson-link bug and recorded one honest remainder:
`VALID_VIEWS` in `nav-history.js` was a shorter list than the shell's own, and
that was parked with a `re-review: 2026-08-20`.

DR-0236 says "later" is not a scheduling tool, so it was audited the same
session. The measurement was worse than the note: **15 of the shell's 30 views
were missing** — `tlc`, `voice`, `scribe`, `library`, `recipes`, `games`,
`tvtime`, `advocacy`, `databack`, `messages`, `relationships`, `inventory`,
`forecast`, `cohorts`, `tlc-assistant`. Exactly half the app's tabs were unknown
to the parser whose comment says it "mirrors" them.

Chasing what that actually breaks led somewhere else, and worse.

## The finding: demo data could be written into a user's real storage

Three facts, each measured against the source rather than recalled:

1. `getDemoPersona()` reads `window.location.search`, and the shell calls it
   **on every render** — `const demoPersona = getDemoPersona();`, a bare call in
   the component body, not a `useState` initializer. The demo identity is not
   captured; it is re-derived from the URL continuously.
2. `isAnyDemoMode = !!demoPersona` is the single flag guarding persistence. The
   save effect opens with `if (isAnyDemoMode || reviewerMode) return;` — the
   comment beside it reads *"Demo + picker + reviewer never write to
   localStorage (or push snapshots)."*
3. `useBrowserHistoryNav`'s push effect rewrites the URL through `urlFor()` on
   every view change, and `urlFor` keeps only `view`/`sub` plus
   `PRESERVED_PARAMS` — which did **not** include `demo`.

Composed: open the app at `?demo=family-of-4`, tap any tab, and the URL loses
`demo`. The next render finds no persona, `isAnyDemoMode` flips false, and the
only thing standing between the sample household and real storage stops
returning early. The demo data already in state is then written to localStorage
and pushed as a snapshot.

**One tap.** The Reeves-family sample balances landing in someone's real books —
on a platform whose whole claim is that the numbers on the screen are true.

This was reproduced in a live render harness with the real hook **before** a line
was changed: 4 failures, including the tab-tap walk itself. Not inferred from
reading the code.

## Decision

1. **`demo` joins `PRESERVED_PARAMS`.** A demo session survives navigation, so
   the write-suppression the app promises stays true for the whole session.

2. **`join` deliberately stays out.** It is a one-time claim token, read once
   into state by `ClaimInviteBanner` (`useState(() => readClaimTokenFromUrl())`),
   so preserving it buys nothing and would leave an invite token sitting in every
   screenshot and forwarded link. Not an oversight — a decision.

3. **`VALID_VIEWS` is completed to all 30 views**, closing DR-0296's remainder
   ahead of its date. Widening the parser can only make the seed comparison and
   the popstate fallback *more* correct; it is what stopped the arrival-time
   param strip for the other half of the app.

4. **The drift is guarded by machinery, not by a comment.**
   `nav-history.test.jsx` now derives the shell's `VALID` list from source and
   fails in **both** directions — a view the shell routes that parseNav would
   drop to `overview`, and a view parseNav claims that the shell cannot render.
   It also walks the seed's own `sameUrl` expression across every tab. The
   comment saying the lists mirror each other had been wrong for long enough to
   ship; a sentence is not a mechanism.

## Proven-to-catch (DR-0076 §3)

`demo-param-survives-nav.test.jsx` was written and run **before** the fix: **4
failures**, in a real `createRoot` render driving the real
`useBrowserHistoryNav`, including the plain "open at `?demo=family-of-4`, tap
Books, read the URL" walk. After the fix: 7 green. The file also pins the two
source facts that make the strip dangerous rather than cosmetic — the
every-render re-derivation and the save effect's guard — so if either changes,
the reason this test exists is re-examined instead of silently invalidated.

The two-lists guard was likewise verified against the drift it was written for:
it reports the missing views by name in its failure message.

## Consequences

- A demo or picker session keeps its persona across every tab, and the
  never-writes promise holds for the whole session rather than until the first
  tap.
- Half the app's tabs stopped having their URL rewritten on arrival, so any
  query param on those views survives the boot.
- 11 new pins; suite **7,704 green** (671 files, 1 skipped); lint clean; build
  clean.
- DR-0296's `re-review: 2026-08-20` is **closed early** — the audit it asked for
  ran the same session and found a live data-integrity defect underneath it.

## What this says about the method

DR-0296's remainder was written honestly and dated conservatively, and the date
would have been wrong: the thing waiting behind it was not a tidy-up, it was
demo data reachable in real storage. The lesson is not "date things sooner" —
it is that **an honest remainder is a lead, and leads are worked, not
scheduled.** DR-0236 already says this; this is the case that shows the cost of
the alternative.

Both defects also share one shape with the bug DR-0296 fixed: **two places that
must agree, kept in agreement by a comment.** Three in one day
(`getInitialChurchView` vs `parseNav`, `VALID_VIEWS` vs the shell's `VALID`,
`PRESERVED_PARAMS` vs what the app actually reads from the URL). Each is now a
derived check. The standing question this leaves for any future pair: *what
fails if these drift, and what fails the build when they do?*

## Honest remainder

- `PRESERVED_PARAMS` is now correct for every param the app reads at render
  time, verified by inventorying every `.get('…')` call across `src/` — `view`,
  `sub`, `lovecorner`, `biz`, `demo`, `key`, `join`. But it is still a **hand-kept
  list checked against a hand-run inventory**, which is the same disease one more
  level down. A derived guard (every URL param read anywhere in `src/` is either
  preserved or explicitly declared consumed-once) is the real close.
  **re-review: 2026-08-27.**
- An invitee who taps a tab loses `?join=` from their address bar; the claim
  still works because the token was already read into state, but a reload at that
  point loses it. Accepted for now — the token must not persist in the URL — and
  named here rather than left implicit.
