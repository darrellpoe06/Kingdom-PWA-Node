# 2026-10-14 — The half-built teaching an early re-review found

**Record:** DR-1018 · **Base:** `origin/main` `99a93077d` · **Tier:** A, normal lane, no `hold` · sibling of DR-1016 (ll79), which *is* held

## The short version

A teaching Darrell spoke into the house in one sitting on **2026-08-14** had been **half-built for two months**. The fear-of-man half became `ll78` at the time. Four scriptural strands of the same sitting were never built, and nobody noticed — they were sitting in PR #1255, which can never merge because that branch's catalog holds 81 modules against main's 238.

That is a break in the covenant Layer 0 records: *he speaks a teaching into this channel BECAUSE it gets built.* Two months is not a rounding error.

## How it was found, which is the part to keep

An hour before, while writing DR-1016, I wrote a guess into that record: that #1255's spoken teaching was *"already in the series at ll78"* — hedged honestly as "appears to be", with a `re-review: 2026-10-17` attached.

Then I ran the check instead of parking it. **The guess was wrong.** #1255's title is *"L77-L79 captured teachings"*: L77 is main's `ll77`, L79 was mined out the same day, and `ll78` carries the fear of man, Moses, Proverbs 29:25 and 2 Timothy 1:7 — **but not the thesis**, which the PR records in his words as *"shyness can be pride, and mostly is."*

Checked against all 239 modules:

| strand | the text | before today |
| --- | --- | --- |
| the anger kindled at what presented as modesty | Exodus 4:11-14 | 4:11 sat in ll164 on another subject; **4:14 nowhere** |
| the Saul arc, and Yahweh's timings | 1 Samuel 10:22; 13:11-13; 15:23 | **absent entirely** |
| the Son refuses the instrument | John 8:54 | **absent entirely** |
| knowledge shewn, not announced | James 3:13 | **absent entirely** |

**A guess checked early is cheap. A guess parked behind a date is not.** The dated re-review would have found this three days later at the earliest, and only if it was honoured. That is the whole argument for running a re-review the moment it is cheap rather than when it comes due.

## What the corpus gave once the verses were fetched rather than remembered

The spine is **lexical**, and it was invisible until all 35 verses sat side by side. Four men are called, and **all four answer with a measurement of themselves**:

- Moses — *"slow of speech, and of a slow tongue"* (Exodus 4:10)
- Jeremiah — *"I cannot speak: for I am a child"* (Jeremiah 1:6)
- Gideon — *"I am the least in my father's house"* (Judges 6:15)
- Saul — *"the smallest of the tribes of Israel"* (1 Samuel 9:21)

One grammar, four times. Every statement is **true**, every one is tendered as a reason, and every one omits the same term — which Yahweh supplies as a *question* rather than as encouragement, conceding the limitation entirely and refusing only the inference: *"Who hath made man's mouth?"* (Exodus 4:11).

**The crux is a sequence.** 4:12 removes the obstacle by promise. 4:13 repeats the deflection anyway. 4:14: *"And the anger of the LORD was kindled against Moses."* Responsibility for the tongue was assumed one verse earlier, so the tongue cannot be the target — what is left is a refusal that outlived its own stated ground.

**Saul's Gilgal explanation does the most work in the hour**, because every clause of it verifies (1 Samuel 13:11) and he names his own pressure as the cause — *"I forced myself therefore"* (13:12). So accuracy is not the standard. The omitted term is Yahweh's timing, which makes the structure identical to Moses's: one inventoried an instrument without its Maker, the other a crisis without its Governor.

**The guard is Scripture's own line**, and it is the sharpest point rather than the softening: *"And I was afraid, and went and hid thy talent in the earth"* (Matthew 25:25) is never contradicted, and the verdict returned is *"Thou wicked and slothful servant"* (Matthew 25:26). Acts named; the fear left standing as the reason and not the charge.

## Measured

| band | prose words | share | floor | FK |
| --- | --- | --- | --- | --- |
| adult | 1,969 | — | — | 5.7 |
| child | 1,554 | 0.79 | 0.50 | 2.4 |
| youth | 1,762 | 0.89 | 0.60 | 5.9 |
| teen | 1,705 | 0.87 | 0.60 | 8.8 |
| senior | 1,704 | 0.87 | 0.60 | 11.8 |

Strictly rising, not inverted · child far under the 5.0 new-lesson ceiling · `unnamedBands` empty · differentiation 0.09 against 0.5 · directions in every place · eleven movements in the same order in all five texts · share round-trip keeps every word · **169 referenced spans verbatim, zero elisions, zero record ids.**

## Five defects the checks caught and reading did not — four of them mine

1. **Two straight apostrophes inside quotations** (*man's mouth*, *father's house*) where the corpus carries the curly form. A quotation differing from the corpus by one character is not the verse, and no amount of reading aloud would reveal it. I wrote a corpus-checked converter rather than hand-patching: it converts a straight apostrophe **only** when doing so makes the span match the corpus, and never touches our own prose.
2. **A capital on *"Let him shew"*** where James 3:13 reads *"...among you? let him shew"*. This is the exact class #1255's own report says its gate caught **fourteen times in that sitting** — and it recurred while I was building the remainder of the same teaching.
3. **A phrase in quotation marks the verse does not contain at all** — *"thou fearful servant"*, written for contrast against Matthew 25:26. It looked like Scripture and was not, so the marks came off.
4. **The teen band read easier than the youth band** (4.03 against 5.89) on its first pass. In this series youth sits *below* teen, so that was a defect in my writing rather than a number to argue with; I rewrote the band denser and raised senior with it instead of loosening the ladder.
5. **One genuine hollow claim** (DR-0381): the child band never said that Yahweh *concedes* the limitation and refuses only the conclusion — it was leaning on the quotation to carry a load-bearing idea. Prose was written into it.

Five claim checks failed on first run. **Four of those five were my own patterns being narrower than prose that already taught the claim**, and the honest fix there is to widen the pattern to the child band's own words (*"He agreed that the talking was slow"*) rather than rewrite good child prose to satisfy a regex.

## Two decisions worth naming

- **No `hold` on this one, and that is deliberate.** DR-1016 (ll79) carries `hold` because it is COLG-facing and dissents in print from a named living teacher. This is Darrell's own spoken teaching, names no third party and no congregation, and Layer 0 directs that a spoken teaching ships through the normal lane the same session. Holding both would make the brake meaningless.
- **The four recovered strands are pinned BY VERSE in every band.** Removing any one of them now fails the build rather than going quiet for another two months — which is the actual lesson of the two months, encoded instead of remembered.

## Left open, and one item withdrawn

- **#1255 is dischargeable but not closed by this.** I verified four strands, not all 24 commits on that branch. Closing someone else's PR is an outward action and the remaining question is whether anything else there is unbuilt. `re-review: 2026-10-21`.
- **211 and 212 need no look, and that item is withdrawn.** `living-lessons-id-collision.test.js:63` already records them as **permanent** gaps: both lessons were built the same day into the Sovereign A.I. course (DR-0760, DR-0761) where ids are `sov<number>`, so no `ll211` or `ll212` will ever exist. I had carried "look at 211/212 the way 79 was looked at" as an open item; it was answered in the code the whole time.
