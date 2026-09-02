# DR-0320 — "What makes having you better?" is a covenant question, not a contract one

- **Status:** accepted
- **Tier:** A — additive lesson content in an existing series, riding the existing Learn engine; no schema, no new surface, no external-facing identity change
- **Scope:** `app/src/lib/living-lessons-class.js` (L114 module + `LIVING_LESSONS_META.weeks` 112 → 113), `app/src/__tests__/living-lessons-l114-verses.test.js`
- **Date:** 2026-09-02
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT, WORD-FIRST (DR-0098), THREE-TIER-HONESTY (DR-0100), VERIFICATION-DOCTRINE (DR-0076), TRUST-BUT-VERIFY (DR-0190), APP-IS-PRIMARY (DR-0065), RELIGION-AND-RELATIONSHIP

## Directive

Darrell, 2026-09-02, pasting a recorded exchange (Darwynn McPherson, shared from
Facebook) with a single word:

> *"lesson."*

Under the CLAUDE.md rule **Spoken Teachings Are Build Input — Always Add It**, a
teaching he brings into this channel is capture-and-ship, not commentary. This DR
records what it became.

## The material

Two men argue about a household. It opens on *if I pay every bill, why would I
cook and clean*, moves through government assistance, chores, outsourcing, and
leverage, and ends somewhere the opening never predicted: **if she can already
survive without your paycheck, what makes having you in her life better?**

## The decision, in five parts

### 1. The frame is corrected before anything else is answered

Every question in the clip — who paid what, who did what, is it fifty-fifty — is a
**contract** question. Scripture does not frame a marriage that way once. It is a
covenant with a Witness (Malachi 2:14) between one flesh (Genesis 2:24), and a
covenant does not invoice itself. Teaching the chore question without fixing the
frame would have made the lesson pick a side in a market argument. Movement 2
fixes it, and the other nine movements follow from it.

### 2. Both money tiers are stated in one breath (DR-0100)

**Tier 1, plainly:** provision is commanded, heavy and honourable — 1 Timothy 5:8,
Genesis 3:19, and James 2:15-16, which refuses to bless a sentiment that pays for
nothing. The lesson says in our own voice that anyone telling a man his earning is
nothing is lying to him. **Tier 3, the over-reach corrected:** 1 Timothy 5:8 does
not repeal 1 Peter 3:7 — a man may not use the one command he keeps to excuse the
four he does not. The **reverse** over-reach ("money does not matter, presence is
everything") dies on the same page. Under-claiming a true thing is as much a
failure of truth as over-claiming an unverified one.

**Tier 2, flagged narrowly:** the clip's causal claim — that women became
independent because assistance replaced men — is genuinely contested history. The
lesson says so in one clause and says why it does not need settling: a wrong
diagnosis of why the world changed never licenses skipping the commands. That is
the whole of the political content, and it is deliberately the whole of it.

### 3. The chores question is settled by the Example, not by culture

The strongest thing in the clip is its own argument: a man living alone sweeps,
washes and cooks without becoming less, and the same tasks are relabelled feminine
only when a woman enters the house. The Word settles it harder — John 13:4-5,14-15
(the towel, then made binding) and Mark 10:43-45 (greatness defined as
ministering). If serving in a house had unmanned anyone, it would have unmanned
Him. Headship is named as responsibility **for** the house, never exemption from
it (1 Peter 5:3) — so the lesson does not swing from one error into the world's
scorekeeping either: Philippians 2:3-4 and Galatians 6:2 replace the ledger with
*am I making her life easier*.

### 4. Leverage is named as treachery, and an earning wife as Proverbs 31

The clip's sharpest observation — that a person who needs your money may tolerate
what they would never tolerate if they could leave — gets its biblical name:
Malachi 2:14-16 (the Witness, and violence covered with a garment) and Ephesians
6:9 (authority may not run on threat). Stated without softening: a man whose only
hold is that she cannot afford to leave has a hostage, not a covenant. Which
reframes her independence as **exposure, not theft** — and Proverbs 31:11,16,23,28
is taught so no one in the room can call a capable, earning wife a modern problem.

### 5. Mutual, or it is a talking point rather than the Word

A lesson aimed only at husbands would fail the Religion AND Relationship test and
would not be believed by the wives either. 1 Corinthians 7:3-4, Proverbs 14:1,
Proverbs 31:12,27 and Ephesians 5:33 put the same question both ways, and the
close is Genesis 2:18 with Ecclesiastes 4:9-12: the first problem was **alone**,
and the answer to alone is the measure of what having you is worth.

## Verification (DR-0076)

- **Every quoted span is verbatim KJV from the in-repo corpus.** The whole-span
  gate from L112/L113 rides again: 79 double-quoted spans, all matched
  letter-for-letter against `app/public/bible/kjv/*.json`, plus 49 named fragment
  pins that are themselves asserted to exist in the corpus before being asserted
  in the lesson.
- **The gate is proven-to-catch on this lesson's real defects.** Authoring L114
  produced **one genuine in-quote alteration** — a comma pulled inside *"the wife
  of thy covenant,"* (Malachi 2:14 ends the clause with a period) — and **sixteen**
  places where the CLIP's words or our own prose were wearing Scripture's
  quotation marks. All seventeen were caught by the sweep and fixed, so in this
  lesson **a double quote means Scripture and nothing else**; the non-Scripture
  phrasing is set without quotation marks. Six of those exact strings are asserted
  absent from the corpus in the test, so the gate cannot become decorative.
- **A real content gap was caught by the gate, not by re-reading.** The first cut
  of the SENIOR level carried the frame, both money tiers, the towel and the
  leverage warning, but never carried movement 7 — the end of the ledger. The
  per-band assertion failed, and the fix was to the lesson, not the test.
- **Attribution, not assertion (DR-0190).** The clip is named as the *occasion* and
  explicitly not as the authority, in the lesson and in the facilitator notes.
- **Voice.** Zero generic "God" outside quoted Scripture (21 uses of Yahweh in our
  authored voice); no capitalized adversary name; KJV "God"/"the LORD" inside every
  quotation left untouched (DR-0076 §the bright line).
- **Run:** `npm run lint` clean; `vitest run` — **796 files, 10,435 passing, 1
  skipped**, including the 67 assertions of the new L114 gate, the series-wide
  age-appropriateness ratchet (child/teen/senior all authored; the child level
  carries the towel and the answer to alone with none of the adult weight, and is
  asserted to carry no leverage/divorce/treachery/paycheck language), and the
  research-integrity gate. `npm run build` clean.

## Carried

- The `weeks:` comment in `living-lessons-class.js` enumerates lessons only through
  L98 and has been stale since; the count itself is correct and gated
  (`LIVING_LESSONS_META.weeks === LIVING_LESSONS_MODULES.length`). Backfilling
  L99-L114 into that comment is cosmetic and was not done in this delivery —
  **re-review: 2026-10-02** (DR-0075: a non-improvement carries a why and a date).
