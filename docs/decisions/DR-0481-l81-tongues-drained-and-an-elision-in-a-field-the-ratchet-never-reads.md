# DR-0481 — L81's tongues study drained, and an elision in a field the ratchet never reads

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, on a doctrinally sensitive subject)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L81's four bands rewritten, youth created, five elisions healed including one in a quiz option, 1 Corinthians 14:23 restored to all four bands, six generic uses of the name corrected, an unmarked-to-verbatim upgrade of Acts 2:8), `app/src/__tests__/living-lessons-l80-l81-verses.test.js` (4 → 38 checks), all four shrink-only baselines (all four shrank)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3, §4), TEACH-DONT-DEBATE (DR-0098), COVENANT-NAME-IN-OUR-VOICE (DR-0210), WORD-FIRST (DR-0097)
- **Grounds:** DR-0473 (the quotation ratchet whose scope this corrects), DR-0476, DR-0478, DR-0479, DR-0480 (the check-writing rules)

## Why this exists

| band | before | floor | after |
|---|---|---|---|
| child | 171 words, **0.30**, **FK 8.28** | 0.50 / ≤7.0 | 767 words, **1.31**, FK 3.80 |
| youth | **absent entirely** | 0.60 | 667 words, **1.14** |
| teen | 282 words, **0.49** | 0.60 | 678 words, **1.16** |
| senior | 446 words, 0.77, **FK 13.84** | 0.60 | 761 words, **1.30**, FK 8.04 |

**L81 was the first lesson in this pass carrying both reading defects at once:** the child band was over the 7.0 ceiling *and* above the teen band, so the ladder was inverted at the bottom — a child reading the "child" version was handed harder prose than a teenager. Ladder now **3.80 / 5.75 / 6.70 / 8.04**, monotone.

This is also why **`inverted` and `childOverCeiling` moved for the first time in this run** — 19 → 18 and 14 → 13. Every earlier lesson tonight was short without being inverted or over ceiling.

## The finding

### AN ELISION IN A FIELD THE RATCHET NEVER READS — AND 281 MORE LIKE IT

Four elisions were found where the measure looks. A **fifth** turned up only because the insert script's belt-and-braces check scans the whole lesson block rather than the ratchet's field list. It was in a **quiz option**:

> they heard "in his own language... our own tongue... our tongues" (Acts 2:6, 8, 11)

Two things are wrong there. It is an ellipsis chain across **three different verses**, so no longer span could ever have been contiguous — the fix is three quotations with three references, which is what the answer was claiming all along. And it was **invisible to the DR-0473 ratchet**, whose `READER_FIELDS` are `lesson`, `bigIdea`, `inApp` plus the bands and `anchor.theme`.

So the obvious question was measured rather than guessed (DR-0076 §4). Walking every string in every module and excluding the ratchet's own scope:

**281 elided quotations, across 88 lessons, in fields the ratchet does not read.**

| field | spans | lessons |
|---|---|---|
| `benefits[]` | 78 | 37 |
| `quiz.questions[].options[]` | 71 | 50 |
| `facilitator.talkingPoints[]` | 69 | 36 |
| `quiz.questions[].explain` | 31 | 25 |
| `facilitator.discussionPrompts[]` | 24 | 20 |
| `stories[].body` | 3 | 2 |
| `quiz.questions[].q` | 3 | 3 |
| `facilitator.howToRun` | 1 | 1 |
| `stories[].verse` | 1 | 1 |

**This is a scope failure in the measure, not new debt.** The ratchet has been reporting a shrinking number — 113 lessons down to 105 tonight — while 281 spans in 88 lessons sat outside what it counts. A gate that never reads a field passes on it forever; DR-0076 §3 calls that anti-theater, and this is the same thing one level up: **not a check that always passes, but a check that never looks.**

`facilitator` was excluded on purpose when the ratchet was written. `benefits`, `quiz` and `stories` were not considered, and quiz options and explanations are read by the **learner**, not a facilitator.

**Not corrected in the measure tonight, and the reason is structural rather than convenience.** Widening the scope legitimately ADDS entries to a baseline whose whole contract is shrink-only, and whose rebase script refuses on additions by design. That is a deliberate, documented baseline expansion plus 281 judgement calls, and bundling it into a lesson commit would both bury it and defeat the guard that protects the file. **re-review: 2026-09-25**, alongside the DR-0479 Philippians sub-pass, as its own reviewed change.

**The local installation of the finding shipped tonight:** L81's gate now walks every string in the module and fails on an elided quotation *anywhere* — benefits, quiz, stories, facilitator included — so the property is enforced here in full while the corpus-wide measure catches up.

## The decision

### a. 1 CORINTHIANS 14:23 RESTORED, BECAUSE A STALE PIN SAID SO

The gate's existing pin list included `will they not say that ye are mad` and my rewrite had dropped that verse from every band. The stale-pin check caught it. That was the right catch for the right reason: 14:23 is the **person** Paul has in view when he commands intelligibility — the outsider who walks in and concludes the room is mad. It is the reason the rule exists, and the rewrite had kept the rule while losing its reason. All four bands now carry it, with the scene drawn in each register.

### b. THE CHILD BAND'S PARAPHRASE BECAME HIS ACTUAL WORDS

The old child band rendered Acts 2:8 as *"How can we each hear about God in our OWN language?"* with *"(paraphrasing Acts 2:8)"* attached. Marking a paraphrase is honest and the standing rule permits it — but this verse is short and plain enough for a child to read, so the band now carries *"And how hear we every man in our own tongue, wherein we were born?"* verbatim. A check requires the verbatim form and forbids the word "paraphras" in that band.

### c. SIX GENERIC USES, AND THE TEACH-DONT-DEBATE OBLIGATION KEPT

The old child band used the generic name six times in our own voice. Zero now, with Yahweh eight times in its own prose, and 1 Corinthians 14:33's *"For God is not the author of confusion"* pinned letter-for-letter in every band.

On DR-0098: this lesson names a real disagreement among sincere believers (the tongues of angels) and the checks require **both halves** in every band — that the difference is named, *and* that it is disarmed by showing the verse cuts identically either way. Naming a disagreement to educate past it is the rule; staging a both-sides contest is what the rule forbids, and a band that did the first without the second would fail here.

## And a check that was simply missing

36 breaks ran; 32 caught first time. One of the misses was not a weak check but **an absent one**: appending "Satan is." to the child band left the gate green, because I wrote the paraphrase check in place of the adversary-capitalisation check and never wrote the latter at all. Every other lesson's suite tonight has it; L81's did not.

That is a different failure from the ones DR-0476 through DR-0480 record. Those were checks that could not fail. This was a **property with no check**, and no amount of care in writing the checks I *did* write would have surfaced it. The harness did, by trying the break anyway. **A gate is only as complete as its list of properties, and the break harness is what proves the list is complete rather than merely plausible.**

The other three misses were mine: two harness expected-strings not matching test names, and one break aimed at text that was not a marker.

## Evidence

- Fullness: `shortBands` returns `[]`; shares 1.31 / 1.14 / 1.16 / 1.30.
- Reading: ladder 3.80 / 5.75 / 6.70 / 8.04, monotone; child down from **8.28 to 3.80**, under the 7.0 ceiling; senior down from 13.84.
- Quotations: **63 quoted spans across the four bands, every one verbatim under strict comparison, 0 unreferenced, 0 ellipses**; the ratchet reports L81 clean, and so does the whole-module walk.
- The covenant name: Yahweh in every band's own prose (8 / 3 / 3 / 3), 0 generic uses in our own voice in any reader field.
- Sections: all four bands render `[1,2,3,4,5]`, no chunk over the 420-character wall limit.
- Break harness: **36 / 36 caught** after the fixes (32 first time, 4 on re-run).
- Baselines: **all four shrank** — short **81 → 80**, inverted **19 → 18**, child-over-ceiling **14 → 13**, title-unnamed **147 → 146** (bands 443 → 440), quotation **106 → 105** lessons, 0 fresh and 3 healed. None gained an entry.
- Gate: 38 checks, up from 4.

## Consequences

- The full-levels pass has **80** lessons left carrying a short band. Next is L80, whose gate shares this file.
- **Two sub-passes now stand dated, both bounded and counted rather than vague:** the DR-0479 Philippians 4:8 elisions (17 spans / 6 lessons) and this record's ratchet-scope correction (281 spans / 88 lessons). Both **re-review: 2026-09-25**.
