# DR-0324 — Know your own post: the true part said plainly, the contempt refused, and the beam out first

- **Status:** accepted
- **Tier:** A — additive lesson content in an existing series, riding the existing Learn engine; no schema, no new surface, no external-facing identity change
- **Scope:** `app/src/lib/living-lessons-class.js` (L119 module + `LIVING_LESSONS_META.weeks` bumped with the module — 117 → 120 in the delivery that carries all three), `app/src/__tests__/living-lessons-l119-verses.test.js`
- **Date:** 2026-09-02
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT, WORD-FIRST (DR-0098), THREE-TIER-HONESTY (DR-0100), VERIFICATION-DOCTRINE (DR-0076), TRUST-BUT-VERIFY (DR-0190), RELIGION-AND-RELATIONSHIP, APP-IS-PRIMARY (DR-0065)

## Directive

Darrell, 2026-09-02, bringing in a second spoken clip hours after the one that
became L114 (DR-0320). Its argument, in his paste: women can recite a man's
duties *"from top to bottom, inside out and backwards"* while not knowing *"the
first duty of a woman"* — that she too is to provide and to protect — and it
closes by pricing a woman who falls short at nothing.

Under the CLAUDE.md rule **Spoken Teachings Are Build Input — Always Add It**,
that is build input. This DR records what it became and, more importantly, *how
it was handled*, because this clip is the harder class: mostly true, delivered
with contempt, and committing the exact fault it names.

## The decision, in five parts

### 1. The true part is stated plainly, and proved outside the one chapter

DR-0100's first tier: established truth gets said, not hedged. The Word gives a
woman a real post, and the longest description of a woman in it is an inventory
of labour and judgement, not manner — Proverbs 31:14,15,17,18,20,21,25,26,27,
with Proverbs 14:1 making her the decisive builder or wrecker of the house.

Critically, it is proved **outside Proverbs 31** so no room can file it as an
unreachable ideal: women funded the Lord's ministry out of their own substance
(Luke 8:3); Dorcas clothed a town's widows, with the garments held up as evidence
(Acts 9:36,39); the Shunammite planned and built (2 Kings 4:10); Abigail moved a
supply train without waiting and was blessed by name for the massacre she
prevented (1 Samuel 25:18-19,33); the midwives protected life against a king's
direct order (Exodus 1:17). Her provision and her guard are literal. A house that
has been handing her a decorative role has been giving her less than Yahweh does.

### 2. The peace claim is weighed with both hands

Proverbs 21:9 (the brawling woman) is taught **beside** Proverbs 29:22 and 22:24
(the angry man), because quoting one and not the other is *selection* — which is
the very failure this lesson teaches against. Peace is commanded to everyone in
the room (Matthew 5:9; Romans 12:18; Ephesians 5:21).

The guard rail rides in the same breath, never deferred: **keeping peace never
means concealing harm**, and Proverbs 31:26 gives her a mouth that OPENS,
governed by the law of kindness. This teaching genre is used as a weapon in real
houses; the facilitator notes make the rail mandatory rather than optional.

### 3. The contempt is refused without discarding the true point

This is the hinge, and the common failure is doing one or the other. Calling a
person worthless curses someone made in Yahweh's image — Genesis 1:27 (male *and*
female), James 3:9-10 (blessing and cursing from the same mouth, "these things
ought not so to be"). You may describe a failure and name an unkept duty; you may
not price a person at nothing.

Ephesians 4:29 supplies the test the room can use tomorrow: not *was it true* but
did it **EDIFY** — did the hearer get built. That is also the practical reason
contempt is self-defeating: a true point delivered with it gets discarded along
with the truth inside it.

### 4. The beam is an ORDER of operations, never a cancellation

The clip complains that people become experts in the other side's duties — and is
a man spending his whole breath on the woman's duties. Matthew 7:3-5 names it,
Romans 2:1 closes the escape, 2 Corinthians 10:12 names the measuring itself.

But the lesson pins the distinction explicitly, because failing in the *opposite*
direction was the live risk: **Jesus never says the mote is imaginary.** The
other person's fault may be entirely real and the beam still disqualifies the
surgeon until it comes out. A lesson that used the beam to dismiss the man would
have been the same error wearing better clothes.

### 5. It pairs with L114, so the series is symmetrical

L114 put the account-of-your-own-post question to the husband; L119 puts it to
the wife *and* to the man doing the pointing, and both land on the floor nobody
is exempt from (Micah 6:8). Taught singly, either one reads as a side being
taken. The lesson says the pairing out loud and the facilitator notes require it.

## Numbering — L119 and DR-0324: seven collisions in one night

Four sessions shipped Living Lessons within the same hour, and this record was
renumbered **twice** before it landed. Both moves follow DR-0052: a number is
provisional until merge, and the branch that lands second renumbers.

- **The lesson.** PR #1428 authored a different lesson as L114 while DR-0320's
  L114 was in flight. L114 merged first, so this lesson was authored as **L116**
  with **L115 deliberately left free** for #1428's renumber — which #1428 then
  took. Then PR #1429, whose title still read L114, merged as **L116** — the slot
  this one was using. So this lesson is **L119**, rebuilt onto the merged main
  with every cross-reference in its own prose, its gate, and the two lessons that
  cite it updated in the same pass. The gate asserts no duplicate lesson id
  exists anywhere in the series, which is what makes a third collision loud
  instead of silent.
- **Third move: a yield that was WRONG, and the gate said so.** PR #1432 was
  found holding `ll117-ninety-seven-percent`, a live collision with this
  lesson's `ll117`. Rather than let a red gate discover it, this branch moved
  itself to a contiguous L121-L122, leaving L119 uncontested. That reasoning was
  wrong, and `living-lessons-id-collision.test.js` — written by another session
  the same night, from the same incident — caught it: **skipping a free number
  is the same race as duplicating one**, just a different symptom, and its
  KNOWN_MISSING ratchet exists so a new gap fails the build rather than being
  absorbed. The fix was to take the correction, not to record three new gaps in
  a list that may only shrink. These lessons are **L119, L120 and L121**,
  contiguous from main's L116. If #1432 lands first the duplicate is real and
  this branch renumbers to L120-L121, which stays contiguous either way.

  Worth keeping: the tempting move was to add 117/118/119 to KNOWN_MISSING and
  go green. That would have been weakening a gate to fit a choice it had just
  correctly rejected — the exact anti-pattern DR-0076 §3 names.
- **Fourth move, and the convention simply worked.** PR #1435 merged as
  **L117** ("No Two Children Grow Up in the Same House") — a third session, a
  different PR from #1432, taking the number this branch had just returned to.
  Landing second, this branch renumbered, and this time CONTIGUOUSLY rather than
  by skipping: **L119, L120, L121**, cascading 119→120, 118→119, 117→118 in that
  order so no rename could collide mid-flight. The id-collision gate passes with
  gaps back to the recorded `[79]`.
- **Sixth and seventh moves, same night.** PR #1432 merged as **L118**
  ("ninety-seven percent"), the number this branch had just cascaded to, and
  main took **DR-0323** (#1436) in the same window. Landing second again, this
  branch cascaded once more — contiguously, replacing in DESCENDING order so no
  rename could collide mid-flight — to **L119, L120, L121** and **DR-0324,
  DR-0325, DR-0326**.
- **The record, twice.** This DR was written as DR-0321; main landed its own
  DR-0321 (principles-travel-with-the-money) first, so it became DR-0322 — and
  then main landed its own **DR-0322** (the docker-PATH fix, #1434) while this
  branch was still in flight, so the three records in this delivery are
  **DR-0324, DR-0325 and DR-0326**. Both moves are DR-0052 applied without
  argument: read `Next ID` from live `origin/main`, and renumber if someone
  lands first.

  The pattern is the finding, not the inconvenience. Six sessions shipped into
  one repository within about ninety minutes, and every shared counter they
  touched — the lesson number, the DR number, `LIVING_LESSONS_META.weeks` — is
  allocated by reading a value and writing it back, which races by construction.
  The convention absorbed all four collisions without a single lost delivery,
  and the duplicate-id gate makes the lesson half loud instead of silent. That
  is the convention working; it is also a standing argument for a
  collision-proof allocator if the parallel-session pace continues.
- **Superseded numbering note.** Earlier text in this file referred to this
  record as DR-0321 and then DR-0322; main landed its own DR-0321
  (principles-travel-with-the-money) first, so per DR-0052 it is **DR-0324**.

A numbering gap costs nothing — the series' ids were already non-contiguous with
its count. A collision costs another session's whole delivery, which is why the
free-slot reservation was made deliberately rather than by racing.

## Verification (DR-0076)

- **Every quoted span is verbatim KJV from the in-repo corpus** — 69 spans, all
  matched letter-for-letter, plus 46 named fragment pins that are asserted to
  exist in the corpus *before* being asserted in the lesson.
- **Zero in-quote alterations on the first sweep.** The L114 discipline — a
  double quote means Scripture and nothing else; the clip's own words and our
  prose carry none — was applied from the first draft rather than retrofitted.
  L114 needed seventeen fixes; L119 needed none. The discipline is the fix.
- **The gate caught two defects in ITSELF, and both were fixed in the test:**
  1. The proven-to-catch pin asserted `'follow thou me.'` was absent from the
     corpus, on the assumption that a trailing period always belongs to our
     sentence. **John 21:22 ends at that period**, so the corpus contains it and
     the assertion failed. Replaced with a capitalisation alteration
     (`'…? Follow thou me'`) that is genuinely absent.
  2. The child-level content screen banned `hypocrite` and flagged the child
     level — but "Thou hypocrite" is inside the verbatim Matthew 7:5 quotation.
     A screen that would have had me edit Scripture to pass it is the exact
     alteration this file exists to prevent. The screen now strips quoted spans
     and tests the child level's **own prose** for the marital-argument frame,
     and additionally asserts the child level still teaches the rule against
     calling anyone worthless.
- **Voice.** Zero generic "God" outside quoted Scripture (20 uses of Yahweh in
  our authored voice); no capitalized adversary name; KJV "God"/"the LORD" inside
  every quotation untouched.
- **Attribution, not assertion (DR-0190).** The clip is named as the *occasion*
  and explicitly not as the authority, in the lesson and the facilitator notes.
- **Run:** `npm run lint` clean (exit 0); `vitest run` — **797 files, 10,499
  passing, 1 skipped**; `npm run build` clean (exit 0); all twelve CI guard
  scripts green.

## Carried

- The `weeks:` enumeration comment in `living-lessons-class.js` remains stale
  from L99 on; the count itself is gated. Same carry as DR-0320 —
  **re-review: 2026-10-02**.
