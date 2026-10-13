# DR-0521 — The plain meaning comes first

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** defect
- **Relates to:** DR-0519 (the simple word beside the title — same instruction, applied to titles rather than prose), DR-0509

## What happened

Darrell, 2026-09-19, reading L175 on his phone, stopped at a word and asked:

> "What is an assay?"

And a moment later:

> "Typo?"

It was not a typo. An **assay** is a metal-shop test: you heat a sample to find out what it actually is, and the assayer's purpose is to establish the content, **never to destroy the material** — which is exactly why 1 Peter 1:7 reaches for fire and gold.

**And the lesson said that.** It said it two sentences *after* he had already met the word cold and had to ask.

## The rule this broke was his own, from the same evening

> "we need to use terms they already understand so words that are to big or not usually used will not be understood unless we **also use them in context** and also use words that are in the current vocabulary"

Using a hard word in context is right, and this house should keep using real words. But **using it and explaining it afterwards is not the same thing**, because a reader who stopped at the word never reached the explanation. The plain meaning comes first, or at the latest in the same sentence — never in the next paragraph.

DR-0519 applied this instruction to course titles. This applies it where he actually hit it: inside the prose.

## How it is checked, and why it is a list rather than a cleverness

There is no reliable way to detect "a gloss" in free prose, and a gate that guesses is a gate that lies (DR-0076 §3). So each hard term in `app/src/lib/plain-before-the-term.js` carries its own **plain cues** — the everyday phrasings that would actually teach it. A lesson using the term must carry one of its cues, and the cue must land **before or within the same sentence** as the term's first use. That is mechanical, it cannot pass by accident, and adding a term costs one line.

Quotations are stripped before the check. We cannot insert a gloss into a KJV quotation and must never try (DR-0210, DR-0459), so a term appearing only inside one is not a fault. What is measured is **our** writing around His words.

**Adding a term is normal. Weakening a term's cues so an existing lesson passes is the thing the file exists to prevent** — the fix is to write the plain meaning into the lesson, which costs one clause.

## What the first measurement cost, recorded because it is the more useful half

The term list initially carried `tribute` and `pledge`. They fired **150** and **22** times, and nearly every hit was the ordinary modern sense — paying tribute to someone, pledging to do a thing. Both are words a reader already owns.

**A check that fires on correct content is a check that will pass on wrong content.** Both came off the list before anything was baselined, and the raw 288 became 116. Deduplication (Living Lessons arrive both directly and through the catalog, so every number was doubled) took it to the true figure.

## Measured, deduped, on 455 mounted modules

**65 faults.** By term: `subconscious` 24 · `neuroplasticity` 18 · `surety` 9 · `collateral` 7 · `usury` 4 · `ephah` 3.

Recorded **shrink-only** in `plain-before-the-term-baseline.json`: the list may only get shorter, and a *new* hard term used before its plain meaning fails the build. `re-review: 2026-09-26`.

## Two terms repaired rather than recorded

`assay` (10 occurrences before dedup) and `kenosis` were **fixed in this same change rather than written down as debt**, which is what proves the baseline responds to a real repair rather than merely holding a number. Both now read zero.

- **L176**, all three bands: *"A metal shop calls that an assay — you heat a sample to find out what it actually is — and a difficult stretch is therefore reclassified."* The plain meaning now arrives in the same breath as the word, in the adult, teen and senior bands alike. The later sentence was rewritten from a second definition into the payoff: *"The fire is the instrument of the test, not the verdict on the metal."*
- **L65**, adult and senior: same treatment.
- **L77** senior read *"The kenosis is stated as self-emptying of reputation"*, which teaches nobody who did not already know. Now: *"He emptied himself — that is what the word kenosis names."*

## Gate

`app/src/__tests__/the-plain-meaning-comes-first.test.js` — **13 checks**. Six break the measure on purpose, including on the exact shape Darrell hit (word first, meaning after), and one proves a term inside a quotation is never counted as ours. Three hold the shrink-only baseline. Three pin the two repaired terms at zero, including that L176 leads with the plain meaning in every band.

## Not closed here

The remaining 65 are real. `subconscious` and `neuroplasticity` account for 42 of them and are the cheapest to fix, because L179 already carries a one-clause plain form of each that can be reused. `re-review: 2026-09-26`.
