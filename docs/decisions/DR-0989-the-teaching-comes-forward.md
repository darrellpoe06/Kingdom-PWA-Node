---
id: DR-0989
title: The teaching comes forward — PR #1217 re-landed through the declaration, and the drain is proven end to end
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0986, DR-0988]
tier: B
entities: [poetech]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, HOLD-THE-HAND-OF-THE-PROCESS, PERPETUAL-IMPROVEMENT]
source: 2026-10-13 — closing DR-0988's unverified item and DR-0986's first drain
---

## Context

DR-0986 decided the 52-PR backlog is drained oldest-first. DR-0987 found six
corrupted Scripture quotations while attempting the first drain and shipped them
separately. DR-0988 built the mechanism the drain needed and closed with one
honest gap:

> *"Not verified: that the declaration path works end-to-end on a real squash
> merge. These tests exercise `judgeEntry` directly with the blocker's exact
> values; the end-to-end proof is #1217 re-landing green on both sides."*

This is that proof, and the teaching itself. PR #1217 (2026-08-09, a Godhead
Study teaching — *"Ignorance lowers the stripes, never the guilt"*) carries
seven cards across the Eternal Algorithms courses. It had sat green and
unmergeable for two months.

## What was measured

**The declaration path, on the real generator — not a unit test:**

| | |
|---|---|
| all seven declared | `lesson-dates:check` **exit 0**, 802 of 802 dated, 0 undated |
| the seven days kept | 2026-08-09 ×5, 2026-08-10 ×2 — their **real** authoring days |
| **one** declaration removed | **exit 1**, naming only that lesson |
| the refusal's text | *"recorded 2026-08-09 is 65 days before it first reached history (2026-10-13); more than 14 is not a squash — if a drain squashed its branch away, declare 'ea-gh-keep-yourself-by-the-word' in SQUASHED_AWAY with its day, pr and why"* |

So the mechanism admits exactly what is declared, refuses what is not, and the
refusal names its own remedy — measured on the live path, not asserted.

**The days came from the PR's own history, not from my notes.** Each card's
first-defining commit was read out of `refs/remotes/pr/1217` with
`git log -p --unified=0`, taking the earliest commit that added its `id:` line:
`6600e1bc` (2026-08-09, ×4), `bb5cb192` (2026-08-10, ×2), `82b05402`
(2026-08-09). They matched the figures I had written down earlier, which is why
they were re-measured rather than trusted.

**The content came as a patch, not a merge — on purpose.** DR-0987 recorded that
merging #1217's branch made `90bee84d` reachable and broke `app — lint + guards`
on three unrelated cards. So this branch carries **none** of that history: the
PR's own contribution was extracted as `git diff $(merge-base) pr/1217 -- <paths>`
and applied to current `main`. `90bee84d` stays unreachable, and the dates
mechanism handles the consequence by declaration rather than by accident.

**Resolving the conflicts surfaced the corruption trying to come back.** The
patch produced three hunks, and the first was `Matthew 4:10`:

```
ours   (main):  "Get thee hence, satan: …"     <- DR-0987's correction
theirs (#1217): "Get thee hence, Satan: …"     <- the old text
```

Taking "theirs" wholesale would have re-introduced a corruption fixed hours
earlier. And #1217's `2 Corinthians 3:18` arrived as *"the Spirit of the LORD"*,
which DR-0987's gate forbids. Both were caught:

| | |
|---|---|
| hunks resolved | 3 (2 in the verses JSON, 1 in the cards) |
| `Matthew 4:10` | **ours** kept — the corpus-corrected text |
| `2 Corinthians 3:18` | corpus-corrected **on the way in** |
| duplicate keys dropped | 3 (`Psalms 51:10`, `Matthew 24:35`, `Isaiah 40:8`) |
| verses after | **347**, 0 mismatched against the corpus, 0 duplicate keys |
| cards | 18 from main + **7** from #1217, 157 unique ids, no collisions |

## Impact

A teaching Darrell gave on 2026-08-09 is in the app, in the four Eternal
Algorithms courses, carrying **the day he gave it** rather than the day it
happened to merge. That is what DR-0687 is for, and it is the first time the
platform has recovered a two-month-old teaching without losing its date.

It also proves DR-0986's decision is executable: the backlog can be drained
without either rewriting provenance or weakening a gate.

## Decision

1. **PR #1217's seven cards land**, with their real days declared in
   `SQUASHED_AWAY` and their provenance written into each declaration.
2. **The content was taken as a patch, never a merge.** Carrying an old
   branch's history is now the exception, not the default — it changes the
   answer to "when was this first defined" for lessons already on `main`
   (DR-0987). A drain takes the contribution and declares the dates.
3. **Conflicts resolve by rule, and `ours` wins a corrected quotation.** Where
   both sides define the same verse, `main`'s corpus-corrected text is kept;
   where the sides are additive, both are kept and duplicate keys are dropped
   only after their text is confirmed byte-identical. Every verse is checked
   against the corpus **on the way in**, so a stale quotation cannot ride a
   drain back into the app.
4. **DR-0988's `SQUASHED_AWAY` is no longer empty, and its test changed to
   match.** The assertion *"ships empty"* was correct for the mechanism alone
   and wrong once content used it; it now asserts the map holds exactly these
   seven, each `pr: 1217` with an August day, and nothing else.
5. **NOT changed: `SQUASH_GRACE_DAYS`, still 14.** The whole point of DR-0988
   was to admit one accounted-for drain without loosening the question for every
   lesson, and this change exercises that without touching it.
6. **NOT verified: how the seven cards read on the live build.** The gates prove
   the text, the dates and the placement; DR-0104's live-review pass is where a
   surface is read as a user meets it. `re-review: 2026-10-20`.

## Verification

- **The end-to-end proof DR-0988 asked for, both directions**: exit 0 with all
  seven declared (802/802 dated), exit 1 with one removed, naming that lesson
  and quoting the remedy. On the real generator over real history.
- **The days were re-measured from `pr/1217` rather than recalled**, and the
  measurement agreed with the earlier run — which is the only reason to trust
  either.
- **Every verse checked against `app/public/bible/kjv/` after the resolution**:
  347 of 347 verbatim, 0 duplicate keys. The two quotations #1217 would have
  damaged are named above with their before-texts.
- **The card merge is verified structurally**: 18 + 7, no colliding ids, 157
  unique ids, and the one `},` that neither side of the conflict carried
  supplied — the same trap DR-0987 recorded, met again and handled.
- **A real leak in my own test was found and fixed.** DR-0988's `withDeclared`
  helper `delete`d the injected key in `finally`; once `ea-gh-knowledge-and-sin`
  became a live declaration, that silently removed it for every later assertion
  in the file. It now saves and restores. Two other tests in that file were
  asserting the default refusal using an id that is now declared — they would
  have been testing the exception while claiming to test the rule, so they use
  an undeclared id.
- `verify:gates` green. 403 tests across the five affected files green,
  including the three that originally blocked this drain
  (`lesson-dates`, `learn-sort-every-option`, `lesson-age-versions-count`) and
  #1217's own `authored-content-reaches-its-surface`.
- **Not verified:** whether the remaining drains need declarations too. Only a
  PR that adds a *lesson* hits this; most of the backlog does not. Named rather
  than assumed.

## Links

[DR-0988] (the declaration mechanism — this closes its unverified item),
[DR-0987] (six corrupted quotations, the gate that caught #1217's two, and the
merge-history finding that made this a patch), [DR-0986] (the decision to drain
oldest-first — first drain complete), [DR-0687] (every lesson carries the real
day it was created), [DR-0610] (one teaching, one lesson), PR #1217 (the
teaching, authored 2026-08-09).
