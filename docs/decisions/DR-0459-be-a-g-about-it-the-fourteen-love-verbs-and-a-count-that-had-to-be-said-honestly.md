# DR-0459 — Be a G about it: the fourteen love verbs, and a count that had to be said honestly

- **Status:** accepted
- **Tier:** B (a new lesson in the learner-facing series; content is teaching, and it reconciles a number with an already-shipped lesson)
- **Date:** 2026-09-17
- **Type:** app
- **Scope:** `app/src/lib/living-lessons-class.js` (L167 added; 166 lessons, painted count moved with it), `app/src/__tests__/living-lessons-l167-verses.test.js` (new, 29 checks, 32/32 breaks caught), the three shrink-only baselines re-measured (count only), the crosslist pin moved with its reason
- **Principles:** SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03), VERIFICATION-DOCTRINE (DR-0076), TEACH-NOT-DEBATE (DR-0098), COVENANT-NAME (DR-0210), RENDER-FOR-MEANING (DR-0331), FULL-LEVELS (DR-0418), NOTHING-WAITS (DR-0236)
- **Grounds:** L157 (What Is Love — this lesson's complement, and the source of the count question), DR-0417 (a new lesson's child band is held to 5.0), DR-0456 and DR-0457 (the two tool fixes this lesson's verification depended on)

## Why this exists

Darrell, 2026-09-17, spoken into this channel (rendered for meaning per DR-0331):

> "And be a G about that... be that way whether you high or low... use the 14 love verbs and just execute on them. It ain't about how you feel... The king is the one that brings the balance... without a vision you perish... He's literally said, eat of me... Ask the questions to the word of God and get your answers. Love. In Jesus' name. Amen."

## The decision

**a. "Be a G" is given the Word's own vocabulary, so it reads as immovability rather than swagger.** *Stedfast, unmoveable, always* (1 Corinthians 15:58); *stand fast in the faith, quit you like men, be strong* (1 Corinthians 16:13); and Yahweh issued it as a command long before anyone reduced it to encouragement (Joshua 1:9).

**b. "High or low" is named as the expensive half**, because almost anyone is solid while things are going well. Paul says he had to **learn** it — *instructed* in being abased as well as abounding (Philippians 4:12) — and the assignment never pauses for conditions (2 Timothy 4:2), because the One being followed does not fluctuate (Hebrews 13:8).

**c. THE FOURTEEN ARE NUMBERED so a reader can check them, not admire them.** One suffereth long, two is kind, three envieth not, four vaunteth not itself, five is not puffed up, six doth not behave itself unseemly, seven seeketh not her own, eight is not easily provoked, nine thinketh no evil, ten rejoiceth not in iniquity but rejoiceth in the truth, eleven beareth, twelve believeth, thirteen hopeth, fourteen endureth (1 Corinthians 13:4-7). And then the property that makes them usable at all: **every one is something you do or refuse to do, and not one of them is a feeling.**

**d. THE COUNT IS SAID HONESTLY, IN EVERY BAND, AND THIS IS THE DECISION THAT TOOK THE CARE.** He said fourteen. **L157, already shipped in this same series, says fifteen.** Both are right, and the reason is in the text: 1 Corinthians 13:4-7 gives a run of clauses and **never numbers them**. It is fourteen when *"Rejoiceth not in iniquity, but rejoiceth in the truth"* counts as one item facing two ways, and fifteen when its halves are listed apart. Two failures were available here and both were refused: asserting one number and quietly contradicting a shipped lesson, or staging it as a disagreement for the reader to adjudicate (DR-0098). Instead every band says plainly that the text does not number them, names both counts, says neither is a mistake, and tells the reader to use whichever they can remember and execute all of them. **Three of the gate's checks hold that note per band**, because a band that dropped it would be asserting a number the text does not give.

**e. "It is not about how you feel" is load-bearing, and the enemy case is what settles it.** Obedience as the measure (John 14:15; 1 John 5:3), love forbidden to stop at the tongue (1 John 3:18), the same test applied to faith (James 2:17) — and then *love ye your enemies, and do good, and lend, hoping for nothing again* (Luke 6:35), where every item is a verb and none waits on warmth. He went first at the least sentimental moment there has ever been (Romans 5:8), and you keep executing past the point it visibly pays (Galatians 6:9). A band that listed the verbs and dropped the enemy case would teach a warm feeling with extra steps, so the gate breaks on it.

**f. The king's balance is a job, not a temperament.** He establishes the land or overthrows it by accepting the gift that tilts the scale (Proverbs 29:4); the scale's standard is Yahweh's own and not negotiable (Proverbs 11:1); the throne is held up by mercy and truth together (Proverbs 20:28). **Both failures are named in every band** — mercy without truth becomes indulgence, truth without mercy becomes cruelty — because naming one recommends the other.

**g. Proverbs 29:18 is quoted whole.** The first half goes on posters; the second half is the one that says what a vision is made of — *but he that keepeth the law, happy is he.* The happiness is tied to keeping the law, not to owning a plan.

**h. "Eat of Me" is taken as literally as He said it, and then explained by His own next sentence** — the one most discussions of the passage never reach: *"As the living Father hath sent me, and I live by the Father: so he that eateth me, even he shall live by me."* (John 6:57) He lived BY the Father; you live BY Him. **Which is exactly why the fourteen verbs are executable on a day you feel nothing: you are not running on your feelings, you are running on Him.** That link is checked per band, because it is the hinge between the eating and the executing.

**i. All four bands carry the whole message.** Measured (adult prose 1,245 words, quotations stripped): child 836 (ratio 0.671, floor 0.50), youth 1,166 (0.937), teen 1,324 (1.063), senior 1,521 (1.222). Reading ladder 1.22 / 5.19 / 7.11 / 7.95 — monotone, child well under the 5.0 ceiling a new lesson is held to.

## Verification (DR-0076)

- **32 verses verified BEFORE authoring, in one batch, under the STRICT comparison — 32 of 32 verbatim on the first pass.** The first clean first pass of this pass, and the reason is the two tool fixes the previous two lessons paid for: whitespace-only normalisation (DR-0456) and no leading-numeral rewriting of book names (DR-0457).
- **173 quoted spans in the finished module: 173 verbatim strictly, 173 referenced, 0 unreferenced.**
- **A NEW DEFECT CLASS, found and now gated: AN ELLIPSIS INSIDE A QUOTATION.** Two quiz explanations first shipped as *"...be ye stedfast, unmoveable, always abounding in the work of the Lord..."* and *"But love ye your enemies... hoping for nothing again..."*. An ellipsis inside quotation marks presents a truncation as the Word's own words. The strict audit caught both; the remedy is always to shorten the span to something genuinely verbatim, never to elide inside it, and **the gate now refuses any quoted span containing `...` or `…`**.
- **One alteration I authored myself, caught before it shipped:** *establishes* for *establisheth* in Proverbs 29:4, in the child band.
- **DR-0210 applied FORWARD rather than caught afterwards.** L166's gate found Yahweh named only once per band *after* the fact; here the count was measured before the gate was written, found thin in the same way (1 per band), and corrected in twenty places. Now 5-6 per text, and the gate's floor is three rather than one.
- **29 checks; 32 breaks applied for real, 32 caught, 0 missed, 0 no-ops.** Each break global inside the L167 block, asserting the edit landed first.
- **THE ONE BREAK MISSED ON THE FIRST PASS, and it is this session's recurring finding again.** The check for "the fourteen are numbered" verified that the *items* appear — so a break that turned `One, suffereth long` into `It suffereth long` left it perfectly green while destroying the single property the section exists for. It now matches the ordinals themselves, with their numbering punctuation (a comma in the adult registers, a full stop in the child's, so ordinary uses of "one" cannot satisfy them) and requires their positions to **strictly increase**. Fourth distinct shape of the same lesson: **check the property, never the presence of the words around it.**
- The three shrink-only baselines each changed by exactly one line (the count); no debt entry added. Painted META count 165 → 166; crosslist pin 27 / 505 → 27 / 506 with the reason written in beside it.

## What is still NOT proven

**Whether Darrell counts item ten as one or means a different split entirely.** He said "the 14 love verbs" and the fourteen-count is the only reading of 1 Corinthians 13:4-7 that lands on fourteen, so that is the reading the lesson uses and says so. But it is an inference from a number, not something he spelled out. If he means a different fourteen, the note is the thing to correct and it is written in one place per band.

## Files

- `app/src/lib/living-lessons-class.js` — L167 (166 lessons)
- `app/src/__tests__/living-lessons-l167-verses.test.js` — new, 29 checks
- `app/src/__tests__/learn-crosslist.test.js` — pin moved with its reason
- `app/src/lib/full-levels-baseline.json`, `reading-level-baseline.json`, `title-in-narrative-baseline.json` — re-measured, count only
- `docs/decisions/INDEX.md` — row + pointer
