# DR-0483 — The order is the teaching, and a gate that only read five fields

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, on how love is tested)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L175 authored whole — four bands, adult lesson, 15 benefits, 15 quiz questions, 10 talking points, 15 anchor references), `app/src/__tests__/living-lessons-l175-verses.test.js` (new, 82 checks), `app/src/__tests__/learn-crosslist.test.js` (533 → 534 lessons, course count unchanged)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §1 §3 §4), COVENANT-NAME-IN-OUR-VOICE (DR-0210), WORD-FIRST (DR-0097), NO-ELISION-IN-A-QUOTATION (DR-0459), SPOKEN-TEACHINGS-ARE-BUILD-INPUT (2026-07-03)
- **Grounds:** DR-0481 (the ratchet-scope finding this record extends), DR-0475 (movements a reader never saw), DR-0476 / DR-0478 / DR-0479 / DR-0480 / DR-0482 (the check-writing rules)

## Why this exists

Darrell, 2026-09-18, in four compressed statements: *"True love starts with a acts of kindness and sound mindedness. Feelings come after testing. If before you're playing yourself."* Then *"Test are for truth"*, then *"Not I gotcha"*, then *"Just clarification on what's what"*.

**What this lesson adds that the house did not already have.** L157 counts the fifteen love verbs and maps their range; L167 says they are executed however you feel; L165 handles gratitude and suffering. **None of them says WHEN the feeling is legitimate.** This one does, and the ORDER is the teaching: an act of kindness, aimed by a sound mind, a test whose object is truth, and *then* the feeling.

**The pairing is textual rather than clever.** *"For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind"* (2 Timothy 1:7) — power, love AND a sound mind in one gift, one hand, one breath. So loving well and thinking clearly were never rivals, and the fear that would crowd out both is named as the thing NOT given. The sound mind does not restrain the kindness; it **aims** it.

**The object of the test is named twice.** TRUE is the FIRST filter of the Test (Philippians 4:8, quoted whole rather than elided), and love's own rejoicing has the same object — *"Rejoiceth not in iniquity, but rejoiceth in the truth"* (1 Corinthians 13:6). So the feeling is not banished; it is given a correct object.

**And the posture is his correction.** Taking pleasure in the fault you found IS rejoicing in iniquity, so the test has changed jobs and is assembling evidence for a verdict already held. Where it does surface something real, *"restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted"* (Galatians 6:1) — restore rather than expose, in meekness, with the examiner standing in the same weather as the examined.

**Why a premature feeling is self-deception rather than merely premature.** It has nothing under it, so trusting it means trusting its own report about itself with no second witness in the room. *"He that trusteth in his own heart is a fool"* (Proverbs 28:26), and the reason: *"The heart is deceitful above all things, and desperately wicked: who can know it?"* (Jeremiah 17:9). The question is not who can repair the heart. It is who can **read** it — which is exactly why the test must originate outside the feeling.

## THE FINDING: A GATE THAT ONLY READ FIVE FIELDS

The break harness ran 72 breaks against the first gate. 69 were caught. **Two left it GREEN, and both were real.**

Corrupting *"Charity suffereth long, and is kind"* to *"and is gentle"* did not fail. Stripping the reference off a span did not fail. The cause is the same in both: the verbatim check and the orphan check read **only** the adult lesson and the four bands.

Measured rather than assumed: **this module carries 107 referenced spans, and only 79 live in those five texts.** The other **28** sit in `benefits`, `quiz.options`, `quiz.explain` and `facilitator.talkingPoints` — every one of which a **learner reads** — and nothing verified a single one of them. All 107 happened to be verbatim, so no corruption shipped; but nothing was watching, which is the part that matters.

**This is DR-0481 one turn later.** That record found an elided quotation in a field the ratchet never read, and installed a whole-module walk — **for elisions only**. I did not extend the same widening to verbatim-ness, so the identical blind spot survived inside a different check in the very next lesson. Recording a finding is not installing it, and installing it in one check is not installing it in the others that share the same scope.

Two checks now walk **every string in the module**: every referenced span is verbatim, and every quoted span carries a reference. Both are proven-to-catch — corrupting a quotation in a benefit, in a quiz explanation and in a talking point, and stripping a reference in a benefit, all four fail the gate now. Two spans genuinely lacked a reference when the second check was written (*"Rejoiceth not in iniquity"* in a quiz question and in a talking point) and both now carry 1 Corinthians 13:6.

## THE SECOND FINDING: HALF THE LESSON WAS INVISIBLE TO THE RENDERER

The first draft rendered **three numbered sections against six movements**, with every other gate green. `lesson-format.js:78` accepts a standalone caps heading of **2–9 words in plain caps**; four of the headings ran to 11–12 words or carried an em dash, so the renderer never saw them. Worse, the four-word caps **emphasis** `WHO CAN KNOW IT.` was promoted *into* a numbered section — a heading the author never wrote.

Both are pinned. The section count is asserted at **exactly six**, not "at least five", because an at-least would have passed the broken draft; and a separate check fails if that emphasis is ever promoted again. This is the DR-0475 class caught before shipping rather than after.

## THE THIRD FINDING: THE COVENANT NAME WAS MISSING FROM THREE FIELDS

The adult lesson, `bigIdea` and `inApp` never said Yahweh at all. The four bands did. It surfaced only because the check reads **our prose with quotations stripped** — the quoted *"for love is of God"* would have masked it in any check that read the raw field. Fixed in the text, not waived.

## AND HIS WORDS WERE WEARING SCRIPTURE'S QUOTATION MARKS

The field checker refused two strings where *playing yourself* — Darrell's phrase, not the Word's — sat inside double quotes. In this corpus a double-quoted span **means Scripture**, so his words in those marks would have diluted the strongest guarantee the gate makes. His phrases run unquoted, and a check now fails if *playing yourself*, *I-gotcha* or *clarification on what is what* ever appear inside quotation marks anywhere in the module.

## On the fourteen first-run failures

Two were genuinely missing claims: the child band never named the thing NOT given in 2 Timothy 1:7. **Fixed the text.** The other twelve were my regexes narrower than the bands' own words — *"have not changed"* against *"has not changed"*, *"rather than exposure"* against *"rather than expose"*, *"converts feelings into the adversary"* against *"converts the affections into"*. **Widened the check, never the prose**, because rewriting good prose to satisfy a narrow regex is how a gate starts shaping the lesson instead of guarding it.

## Measurements

| band | words | share of adult prose | floor | FK |
|---|---|---|---|---|
| child | 1,012 | **0.70** | 0.50 | **1.89** |
| youth | 1,392 | **0.97** | 0.60 | 6.07 |
| teen | 1,488 | **1.04** | 0.60 | 8.48 |
| senior | 1,559 | **1.09** | 0.60 | 10.71 |

Ladder monotone; child under the **5.0 ceiling a NEW lesson is held to** rather than the corpus 7.0. **107 referenced spans across the whole module**, every one verbatim under strict comparison, **zero unreferenced anywhere**, **zero ellipses anywhere** — and Philippians 4:8 is quoted **entire**, which matters because it is the most-elided verse in this corpus (17 spans across 6 lessons still owed that repair, `re-review: 2026-09-25`). All six movements render as numbered sections in all five texts. All four shrink-only baselines gained no entry. Catalog pin 533 → 534 lessons, course count unchanged at 29; `META.weeks` 173 → 174.

Gate **82 checks**. Break harness **72 breaks, 69 caught first time**; of the three misses, one was harness under-power and **two were real gate gaps**, both now closed and each proven-to-catch.

## Consequences

- The whole-module verbatim and reference checks exist **only in L175's gate**, exactly as DR-0481's elision walk existed only in L81's. Widening them corpus-wide is a separate change with its own proof, and it will surface real debt in older lessons rather than none. `re-review: 2026-09-25`, beside the ratchet-scope correction it belongs with.
- The heading-window constraint (2–9 words, plain caps) is now known and should be applied at authoring time for every future lesson rather than discovered by a section count.
- L176 (faith as substance and evidence) and L177 (terms change, not the need) are owed from the same conversation, and the Real Estate department of 22 courses is queued behind them.
