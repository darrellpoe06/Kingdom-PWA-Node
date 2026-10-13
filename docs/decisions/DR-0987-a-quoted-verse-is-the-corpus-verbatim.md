---
id: DR-0987
title: A quoted verse is the corpus, verbatim — seven had drifted, and our own capitalization did it
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0076, DR-0210]
tier: B
entities: [poetech]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, SCRIPTURE-REFERENCE-STANDARD, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — found while attempting the first DR-0986 drain (PR #1217), by verifying the file being merged rather than trusting it
---

## Context

DR-0986 decided the open-PR backlog is drained oldest-first, one at a time, and
the first drain was **PR #1217** (2026-08-09, a Godhead Study teaching —
*"Ignorance lowers the stripes, never the guilt"*), green but `dirty` for two
months. Resolving it meant touching `godhead-study-verses.json`, so I checked
every entry against the KJV corpus on disk rather than trusting the file. Seven
had drifted. **Six were already live in the app**; one arrived with #1217
itself.

**This record ships the six. PR #1217 does NOT land here** — the drain hit a
measured contradiction in a different gate, written up under "What was
measured" below, and the Scripture corruption was too important to hold behind
it. The teaching is not abandoned; it is blocked on a named mechanism problem
with a date.

CLAUDE.md states the bright line in as many words:

> *"this governs ONLY our authored voice, NEVER quoted Scripture. The KJV's
> 'God'/'the LORD' inside any quotation is fetched verbatim and left EXACTLY as
> written — we never substitute 'Yahweh' into a Bible quote, and a blind
> God→Yahweh sweep of existing content is forbidden (it would corrupt the
> text)."*

Nothing enforced it on this file. The rule anticipated a *sweep*; the damage
arrived one verse at a time, by habit, which no one was watching for.

## What was measured

Every entry compared against `app/public/bible/kjv/*.json` — the repository's
declared source of truth, *"every verse verbatim from the KJV corpus on disk"*.

**One cause, three rules broken:**

| ref | was | corpus | rule |
|---|---|---|---|
| Matthew 4:10 | "Get thee hence, **Satan**" | `satan` | lowercase adversary |
| Job 1:6 | "and **Satan** came also" | `satan` | lowercase adversary |
| Acts 5:3 | "why hath **Satan** filled" | `satan` | lowercase adversary |
| 1 Corinthians 15:31 | "Christ Jesus our **LORD**" | "our Lord" | verbatim quote |
| 2 Corinthians 3:18 | "Spirit of the **LORD**" | "Spirit of the Lord" | verbatim quote |
| Nehemiah 8:10 | "holy unto our **LORD**" | "holy unto our Lord" | verbatim quote |
| Deuteronomy 32:8-9 | "the **Most High** divided" | "the most High divided" | verbatim quote |

| | |
|---|---|
| verses checked | 347 (297 on `main` + 50 from #1217) |
| drifted | 7 |
| already on `main` | **6 — these ship** |
| new with PR #1217 | 1 (2 Corinthians 3:18 — withdrawn with #1217's content) |
| after correction | **297 of 297 verbatim**, 0 duplicate keys |

**AND THE DRAIN IS BLOCKED BY A SECOND, UNRELATED GATE — measured, not
predicted.** #1217's 7 Godhead cards surface as *lessons*, and DR-0687 requires
every mounted lesson to carry the day it was created: *"a new lesson cannot join
without one."* Running the generator (`npm run lesson-dates`) produced the real
days from git — 2026-08-09 and 2026-08-10, when Darrell's teaching actually
landed — and 802 of 802 lessons dated. But `derive-lesson-dates.mjs` reads
`git log … HEAD` and checks `rev-list HEAD`, and the lane **squash**-merges:

| | |
|---|---|
| on the PR head (unsquashed) | generator derives **2026-08-09** |
| on `main` after squash | #1217's commits unreachable; derives **2026-10-13** |
| `SQUASH_GRACE_DAYS` | 14; the gap is **65 days** |
| simulated squash onto `main`, then `lesson-dates:check` | **exit 1** — *"lesson-dates.json is not what the script derives"* |

The same file cannot satisfy both sides. So **any** drain of an old PR that
carries new lessons reddens this gate on one side or the other — the second
structural finding from DR-0986's first drain, and one DR-0986 did not
anticipate.

**AND THE SAME ROOT BIT FROM THE OPPOSITE DIRECTION — measured on a real red
check, after the Scripture fix had already been split out.** With #1217's files
all reverted, the fix still failed `app — lint + guards` on PR #2140:

```
eternal-prophets/ea-gh-credit-vs-worship:  recorded commit 2cdde764 is not
                                           the first commit that defined it (90bee84d)
eternal-gospels/ea-gh-glory-refused-or-taken:   (same)
eternal-revelation/ea-gh-yahweh-gets-both:      (same)
derive-lesson-dates --check FAILED: 3 entries git does not support
```

`main`'s own CI was green on `2ea1f723`, so this was mine. The cause is the
MERGE, not the files: `90bee84d` (2026-08-09) is an ancestor of #1217's branch
and **not** of `main` — the branch's own earlier commit for three cards whose
content later reached `main` as `2cdde764`. Merging that branch made the older
commit reachable, so the generator correctly reported a first-defining commit
that is true on the branch and false on `main`.

So: a **squash** hides an old branch's commits and the day reads too late; a
**merge** exposes them and the commit reads too early. One root — "when was this
first defined" is answered relative to whatever history you are standing in —
and a drain moves you between them.

The fix here needed none of that history, because every one of #1217's files was
reverted: the branch was rebuilt off `origin/main` carrying only the four-file
Scripture diff, `90bee84d` is unreachable again, and `lesson-dates:check` passes
— **795 of 795 lessons dated, 0 undated**. The lesson for the next drain is in
DR-0988: carry an old branch's history only when its content is actually
landing.

**The adversary cases are not a different problem.** CLAUDE.md's lowercase rule
says explicitly it *"applies to file content, commit messages, responses to the
user, summaries, code comments, and every other artifact"* — and the corpus on
disk already prints `satan`. So the file had **capitalized** him back, against
the rule, inside a quotation. Same habit, opposite direction.

**Nehemiah 8:10 is why this survived.** That verse carries BOTH forms — *"holy
unto our Lord"* and *"the joy of the LORD"*. Only the first had drifted. Read
quickly, the verse looks right because the famous half IS right.

**It is not cosmetic.** The KJV prints LORD for the Tetragrammaton and Lord for
Adonai/Kyrios. *"The Spirit of the LORD"* in 2 Corinthians 3:18 and *"Christ
Jesus our LORD"* in 1 Corinthians 15:31 assert a different underlying word than
the Greek has. DR-0210 reserves "Yahweh" for our own voice precisely so the
reader is never left guessing which word is meant; writing LORD into a quote
destroys that distinction in the one place it is load-bearing.

## Impact

Six corrupted quotations were being served to readers of the Godhead Study —
the surface whose entire claim is that the Word is quoted exactly. A platform
built to remove debate and deception (DR-0098) cannot be the thing that alters
the text, and a reader who checks one verse against their own Bible and finds it
changed has no reason to trust the other 346.

Reversible and now reverted: seven string corrections, no schema, no API, no
row written.

## Decision

1. **The six live corruptions are corrected to the corpus text, and ship on
   their own.** Leaving known-corrupted Scripture in the app while I had the
   file open would be indefensible; DR-0075's default is improve and there is no
   why for declining. The seventh (2 Corinthians 3:18) was #1217's and goes back
   with it — it was never live.
2. **The class is gated** —
   `app/src/__tests__/a-quoted-verse-is-the-corpus-verbatim.test.js`, one
   assertion **per verse** so a failure names the verse rather than a count, plus
   a raw-text duplicate-key check (`JSON.parse` swallows a duplicate silently).
   306 tests.
3. **PR #1217 is NOT merged here, and the conflict resolution is kept rather
   than thrown away.** The resolution itself was sound and is recorded for
   whoever finishes it: both conflicts were purely additive — main appended
   verses and cards, #1217 appended different ones at the same point — so both
   sides were kept, two byte-identical JSON keys deduplicated, and the one `},`
   neither side carried supplied, because the closing brace after the conflict
   was shared and a naive keep-both is a syntax error. 18 cards from main + 7
   from the PR, no colliding ids, 157 unique ids. What blocks it is the dates
   contradiction above, not the merge. `re-review: 2026-10-16`.
4. **The dates contradiction is named, NOT patched tonight.** The candidate
   fixes each touch the provenance gate: raise `SQUASH_GRACE_DAYS` from 14 to
   something that admits a two-month-old branch (weakening it for everything),
   extend the `RECORDED_ELSEWHERE` mechanism — which already lets a hand-recorded
   day beat git for `living-lessons`, and the generator's own log shows it
   working — to the Eternal Algorithms course, or merge such a PR without
   squashing. Choosing among those is a decision about how the platform records
   when a teaching was given, which is Darrell's, and it is not a 4am change to
   a gate that protects provenance. `re-review: 2026-10-16`.
5. **NOT changed: the corpus.** It is the authority here, and it was right in
   all seven cases. The file was wrong.
6. **NOT verified: the other authored-content stores.** This gate covers
   `godhead-study-verses.json` only. The lesson catalogs have their own
   per-lesson verse tests, but whether EVERY store of quoted Scripture in the
   repository is gated against the corpus is a wider question than one drain,
   and six live corruptions in the one file I happened to open is not an
   encouraging sample. `re-review: 2026-10-20`.

## Verification

- **Every verse measured against the corpus, both before and after**: 7 drifted
  → 0 across the merged tree, and **297 of 297** matching in what actually
  ships, with no duplicate keys. Whitespace-normalized comparison, so the
  finding is substance and not formatting.
- **The dates blocker was SIMULATED, not argued.** A worktree off `main`,
  `git merge --squash` of the drain, then `lesson-dates:check`: the original
  commits read unreachable (`merge-base --is-ancestor` → false) and the check
  exits 1. I had predicted that and the prediction was right this time — but it
  was still run, because I predicted a fourth masked smoke failure earlier
  tonight and was wrong.
- **I got the classification WRONG first and corrected it on measurement.** My
  initial read called all seven a `Lord`→`LORD` substitution and told the
  governor so, naming Matthew 4:10 and Job 1:6 as examples. Both are actually
  `Satan`→`satan`; Matthew 4:10's *"worship the Lord thy God"* was already
  correct, and Job 1:6's *"before the LORD"* is correct in both. I also had
  Nehemiah 8:10 backwards — the drift was in *"holy unto our LORD"*, not in
  *"the joy of the LORD"*. The difflib opcodes said `'S'→'s'` and I read a
  pattern into them instead of reading the text. Corrected in the record, in the
  gate's header, and in its proven-to-catch fixtures, which had been built on
  the wrong premise.
- **PROVEN TO CATCH on the REAL before-texts**, verbatim as they stood — one per
  rule broken (Matthew 4:10, 1 Corinthians 15:31, Deuteronomy 32:8-9,
  Nehemiah 8:10) — not on invented input. Each asserts the old text differs from
  the corpus AND that the shipped text matches it.
- **The theological claim is asserted against the corpus, not stated**: the gate
  checks that the corpus prints "Spirit of the Lord", "Christ Jesus our Lord",
  "holy unto our Lord", "the most High divided", and both "before the LORD" and
  "the joy of the LORD" — so the Lord/LORD distinction is pinned by the text
  itself.
- **The merge resolution is verified structurally**: 18 cards from main + 7 from
  #1217, **no colliding card ids**, 157 unique ids across the file, and the two
  deduplicated JSON keys confirmed byte-identical before either was dropped (the
  resolver aborts if they differ).
- **The gate's own first floor was a census pretending to be a guard.** It
  asserted `refs.length > 300`, written when the merged tree held 347; with
  #1217 withdrawn the real file has 297 and my own gate failed. An exact count
  there would need editing on every verse added, which teaches people to bump
  numbers until tests pass — it is now a truncation floor with that reasoning in
  a comment, and the real assertions are per-verse.
- `verify:gates` green; `godhead-study`, `scripture-provenance`,
  `adversary-is-never-capitalized`, `lesson-dates`, `learn-sort-every-option`
  and `lesson-age-versions-count` all green — the last three being the eight
  failures the withdrawal resolved.
- **Not verified:** that the Godhead Study renders these cards correctly on the
  live build. The gate proves the text, not the screen; the live-review pass
  (DR-0104) is where the surface is read as a user meets it.

## Links

[DR-0986] (the stale-but-real PR has no lane — the decision that produced this
drain), [DR-0076] (verification doctrine, and the bright line this breached),
[DR-0210] (Yahweh in our voice, never in a quote — the distinction LORD-in-a-quote
destroys), [DR-0098] (teach the Word, do not debate it — why altering the text is
the gravest version of this), [DR-0621] (hold the hand of the process: a flag is
where the work starts), `SCRIPTURE-REFERENCE-STANDARD.md`, PR #1217 (the teaching
merged forward with it).
