# DR-0395 — How can the Son not know what the Father knows?

- **Date:** 2026-09-14
- **Status:** accepted
- **Tier:** B (teaching content, COLG-facing; a doctrinal question answered Word-first)
- **Type:** word
- **Lesson:** L150 · `ll150-how-can-the-son-not-know-what-the-father-knows`

## What was asked

Darrell, 2026-09-14: **"How can the Son not know what The Father knows? Lesson"** — and, mid-turn, **"After fixing what needs to be done"** (the fix he meant, the rental data-loss clobber, shipped first as DR-0394, then this lesson was built).

It is one of the sharpest questions thrown at the faith, and it is IN the Word because Jesus said it: *"But of that day and that hour knoweth no man, no, not the angels which are in heaven, neither the Son, but the Father"* (Mark 13:32; Matthew 24:36 repeats it). The lesson does not dodge the sentence and does not soften it.

## The decision: answer it Word-first, in seven strands, and stop where the Word stops

This is a doctrinal question, so DR-0098 (teach the Word, do not debate it) and DR-0076 (verify; flag honest uncertainty) govern together. The lesson NAMES the ancient wrong answer once — that the Son did not know because He is a lesser, created being — only to walk the reader past it by the Word (DR-0098's "you may NAME a debate — to educate past it"), never platforming it as a co-equal view. And it goes quiet exactly where Scripture goes quiet on the mechanics, rather than inventing a diagram (DR-0076 §8, honest uncertainty).

The seven strands, each carried by verbatim KJV (DR-0076; the KJV corpus at `app/public/bible/kjv/`):

1. **The question is real and Jesus said it** — Mark 13:32, Matthew 24:36. We face it.
2. **The Son knows all** — *"Lord, thou knowest all things"* (John 21:17), *"Now are we sure that thou knowest all things"* (John 16:30), *"he knew all men"* / *"he knew what was in man"* (John 2:24-25), *"are hid all the treasures of wisdom and knowledge"* (Colossians 2:3), *"no man knoweth the Son, but the Father; neither knoweth any man the Father, save the Son"* (Matthew 11:27). So this is never subordinationism: *"the Word was God"* (John 1:1), *"I and my Father are one"* (John 10:30), *"For in him dwelleth all the fulness of the Godhead bodily"* (Colossians 2:9).
3. **He emptied Himself (the kenosis)** — *"Who, being in the form of God, thought it not robbery to be equal with God: But made himself of no reputation, and took upon him the form of a servant"* (Philippians 2:5-8); *"though he was rich, yet for your sakes he became poor"* (2 Corinthians 8:9). He laid down the free USE, not the deity — He was *"in the form of God"* WHILE He did it.
4. **A real human mind** — *"And Jesus increased in wisdom and stature"* (Luke 2:52), *"learned he obedience by the things which he suffered"* (Hebrews 5:8), *"made like unto his brethren"* (Hebrews 2:17), *"in all points tempted like as we are, yet without sin"* (Hebrews 4:15). That mind held what the hour gave it, and the day was not handed to it.
5. **Order, not rank** — *"The Son can do nothing of himself, but what he seeth the Father do"* (John 5:19, 5:30, 8:28), the timing is what *"the Father hath put in his own power"* (Acts 1:7; Mark 10:40 *"not mine to give"*). *"my Father is greater than I"* (John 14:28) is order and office, not being — because the same Son receives *"My Lord and my God"* (John 20:28) and the Father calls Him *"Thy throne, O God"* (Hebrews 1:8).
6. **Glory laid down and taken up** — *"the glory which I had with thee before the world was"* (John 17:5) is asked BACK (you cannot ask back what you never had), then *"All power is given unto me in heaven and in earth"* (Matthew 28:18), and *"God also hath highly exalted him, and given him a name which is above every name"* (Philippians 2:9-11). Humility and glory are one story.
7. **Who He is, and where we stop** — the Lamb of Yahweh, *"Behold the Lamb of God, which taketh away the sin of the world"* (John 1:29), by whom *"all things consist"* (Colossians 1:16-17), *"Worthy is the Lamb"* (Revelation 5:12). And *"The secret things belong unto the LORD our God"* (Deuteronomy 29:29; Isaiah 55:9) — HOW two natures share one consciousness is not on the page, so the lesson does not manufacture it. It turns personal: *"Let this mind be in you, which was also in Christ Jesus"* (Philippians 2:5), because *"we have the mind of Christ"* (1 Corinthians 2:16).

## Typography and worldview

Per CLAUDE.md: **Yahweh** in our authored voice (never the generic term), the adversary never capitalized, and Jesus confessed as the **Lamb of Yahweh** and the **Eternal Son** (DR-0210). The bright line (DR-0076): every "God"/"the LORD" inside a quotation is fetched verbatim from the KJV and left EXACTLY as written — no God→Yahweh sweep of quoted Scripture. The authored-voice guard (`\bGod\b` must not appear in our prose; "Yahweh" > 10 times) is enforced by the test.

## Proven-to-catch (DR-0076 §3)

`app/src/__tests__/living-lessons-l150-verses.test.js` asserts: every double-quoted span appears letter-for-letter in the KJV corpus (it caught 19 real errors during the build — trailing periods on mid-verse fragments, and three of my own phrases wrongly quoted — before they were fixed); the three load-bearing pins (the not-knowing sentence, the emptying text, the worship the same Son receives) are asserted by hand so a shortening edit cannot silently turn the lesson into the false answer it refuses; the typography guard; and the authored floors (>=10 quiz / benefits / talking points / prompts, >=8 howToRun segments, every age band > 400 chars).

## Result

L150 lands in `living-lessons-class.js`, `weeks` bumped 148 → 149, shipped through the standard lane (lint + full Vitest suite + real build → auto-merge on green → deploy). Records DR-0395.
