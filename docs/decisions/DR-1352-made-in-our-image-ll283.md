# DR-1352: Made In Our Image (ll283) — the title is backwards, the Word reached for CONSIDER first, and the ten perspectives are named and not reproduced

**Date:** 2026-11-05 · **Status:** Accepted · **Type:** curriculum · **Tier:** A (one new Living Lesson with its own pinned gate, all four bands from the first commit, no new source row, no schema, no money, no surface change)
**Area:** Learn · Living Lessons from the Word (`app/src/lib/living-lessons-class.js`, `…/living-lessons-dates.js`), one new gate
**Sent in by:** Darrell, Gmail thread `1a164aff48fa13de` — "FW: A letter from our CEO", Big Think Members, forwarded 2026-10-22 17:36:20 UTC from his university address. Above the forwarded header he typed exactly one word: `Lesson`.
**Who taught it:** NOBODY (DR-0719). There is no recording and no identified speaker. A forwarded publisher's letter is a lead, never a pulpit, and all five reader places say so.
**Session note** (narrative, the measurements, the full trust-but-verify trace, what the checking changed): [`99-session-notes/2026-11-05-made-in-our-image-ll283.md`](../99-session-notes/2026-11-05-made-in-our-image-ll283.md)
**Pairs with:** DR-0098 (teach the Word, do not debate it — the spine), DR-0100 (speak established fact; the three tiers), DR-0127 / DR-0282 (Word first), DR-0190 / DR-1326 (trust but verify, and the measured cost of skipping it), DR-1324 (the ad-as-material exception), DR-0719 (who taught), DR-1317 / DR-1323 (a verse is never spent; no gate claims one), DR-1123 / DR-0811 (a true story names whose life it was), DR-0733 / DR-0795 (all three directions in every band), DR-0734 (`anchor.ref` names every verse), DR-0210 / DR-0076 bright line (Yahweh in our voice, never inside a quotation), DR-0692 / DR-0697 (all four bands on new work), DR-0610 (one teaching is one lesson), DR-1339 / DR-1343 / DR-1347 (the bloat, format and ledger ratchets), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 provenance and honest uncertainty)

## Context

A media company announced a printed special issue titled **"Made in Our Image"** — a title one word out of position from Genesis 1:26-27 — and its CEO's letter describes, as a virtue, the exact posture two Layer 0 rules exist to remove. In his own words: *"the goal is too often confirmation rather than consideration"*, *"I hope you read it, argue with it, and then argue about it with someone else"*, and the issue's lead feature is sold as *"10 perspectives that divide the AI world."* That is DR-0098's both-sides-for-ratings posture and DR-0100's false skepticism, described from the inside by a man who believes they are a service. The occasion is a letter; the authority is the Word (DR-0127).

## What was measured, before a word was written

**Not already shipped.** `lesson-row-shipped-sweep.mjs --subject` on the letter's subject and on the issue title: no record shares enough distinctive words with either. The thread id appears nowhere in `docs/decisions/` or `app/src`.

**Not a duplicate teaching.** The two nearest neighbours were read, not guessed at. **ll67** ("Made in His Image, We Make — and Why AI Is Not a Soul") lands on the maker's ontology: build wonders, never bow to them. **sov58** (DR-1295) lands on *a rehearsal is not the world*. This lesson's landing is in neither: the **inversion of the title**, and the **debate posture sold with it**. `one-teaching-is-one-lesson` is green at every threshold from 6 to 12.

**Twelve references the repo had never opened**, counted across `app/src` and `docs/decisions` on `origin/main` `3e9efd896`, excluding `app/public/bible/xref/`: Isaiah 44:9, 44:10, 44:13, 44:14, 44:16, 44:18, **44:19**, Isaiah 46:5, Psalms 135:15, 135:17, 135:18, and 2 Timothy 2:14. Isaiah 44:19 — *"And none considereth in his heart"* — is the hinge of the lesson and the repo had never taught it.

**Shared ground declared, nothing dropped** (DR-1317). With ll67: Genesis 1:27, Genesis 2:7, Psalms 115:4, 115:8, Romans 1:25, Colossians 1:17. With sov58: Isaiah 44:17, 44:20, Jeremiah 10:14. Not one verse was declined for appearing elsewhere, and the gate claims no verse for itself.

## Decision

Ship **ll283** as the 283rd Living Lesson, Word-first, on the inversion of its own source's title. Yahweh's frame opens it — *"Let us make man in our image, after our likeness"* (Genesis 1:26) — and the hinge is that **the Word reached for the letter's own word first**: Isaiah's craftsman burns half a tree for bread and kneels to the rest, and the indictment is not that nobody argued but that *"none considereth in his heart"* (Isaiah 44:19), closing on *"Is there not a lie in my right hand?"* (Isaiah 44:20). So the two cures part: the letter prescribes more argument at more dinner tables; the Word prescribes one man examining his own hand.

**The lesson NAMES the ten-perspectives split and refuses to reproduce it.** DR-0098 permits naming a debate to educate past it and forbids staging views co-equally so a reader picks a side. Reproducing the ten *is* the thing being taught about, so the refusal is stated in words in all five reader places and gated: no reader text may number two or more positions or name a camp, proven against a planted enumeration.

Anchor on all **56** references, every one fetched from `app/public/bible/kjv` and pinned verbatim. Both stories are **parables** — no real person lived either, so neither wears a testimony's clothes (DR-1123), and the unsourced-testimony pin stays at 88.

## The three tiers, applied (DR-0100)

**Established, stated plainly:** everything the letter says, because the message is its own primary document and every attributed phrase was taken character for character. **Attributed, never asserted:** the print cadence (the publisher's own description of its programme, reached only as a search result), and every claim the letter makes about AI or about discourse. **Not taught at all, and said so:** a third-party detector advertisement, unrelated to the subject (DR-1324 does not reach it — the exception covers the pitch *inside* the CEO's own frame, which is named as a frame being sold with the price left untaught); and the issue's chatbot-harm assertion, for which no primary study was reachable.

**What the checking changed, and the limit it opened.** The letter's "this quarter's special issue" is explained by the publisher's own monthly-with-every-third-printed cadence — a real finding, attributed. And the one third-party reference reached calls a man of that name a writer and director serving as a *creative director*, truncated before naming the organization, so **CEO rests on the letter's signature line alone and was not independently confirmed.** `re-review: 2026-11-12`.

## Impact and honest limits

`bigthink.com` and `en.wikipedia.org` **would not resolve from this session's egress**, so no page of the publisher's was read and **the read was not independent**. That is named in the lesson, not smoothed over: a blocked road never reads as a verified claim (DR-0076 §8). An environment change was not proposed for it, because the letter is the primary document for everything the lesson actually teaches.

**Measured, not claimed:** bands at 1947 / 2077 / 2119 / 2308 authored prose words against a 2433-word adult lesson (shares 0.80 / 0.85 / 0.87 / 0.95, floors 0.5 / 0.6 / 0.6 / 0.6); reading grades 1.7 / 5.3 / 9.1 / 12.8, a strict ladder with the child band under its 5.0 ceiling; 290 referenced quoted spans, **zero verbatim faults**; 62 cases in the lesson's own gate, five of them proven-to-catch.

## Verification

Every number above was read off the real artifact rather than estimated, and the gate was run against its own author before it was trusted.

- **62/62** on `living-lessons-ll283-made-in-our-image.test.js`, and **re-run after `format-guard --fix`** rather than assumed prettier-safe; the reformat is line-breaks only, confirmed by a whitespace-normalised comparison.
- **510/510** across the 13 library gates that judge a new lesson: full-levels, reading-level, band-differentiation, the library census ratchet, the coloring-page fit, course-band coverage, lesson-completeness, every-anchor-is-named, a-quoted-verse-is-the-corpus-verbatim, and the four quoted-span ratchets. **No baseline needed re-freezing** — Living Lessons sits outside the course-band scan, and re-running `course-band-baseline-write.mjs` on the merged tree produced a zero diff.
- **125/125** on word-first-coverage, research-integrity, a-true-story-names-whose-life-it-was (pin holds at 88), living-lessons-order, talk-together, one-teaching-is-one-lesson (green at every threshold 6–12), no-lesson-gate-claims-a-verse-for-itself, and the two id-uniqueness gates.
- `record-length-guard` green: the record is 42 lines, its INDEX row 688 characters.
- **The gate failed its author first, which is the evidence it is not decorative.** The first draft passed 50 of 62. Nine reds were one defect — the child band had been simplified past the point of honesty and had dropped the trust-but-verify note, the blocked hosts and the pitch naming; a child is a reader place and DR-0190 §5 has no junior tier. Two more were clipped or softened spans. **Two were defects in the gate itself**, found by running it: a regex whose alternation ate a space could never match the phrase it described, and the enumeration proof bridged across a full stop so the planted enumeration it existed to catch slipped through. Both fixed in the gate; the full trace is in the session note.
- **Not done by me, and reported instead** (brief): the deploy proof on the merge SHA, and the Gmail labelling of thread `1a164aff48fa13de`. `re-review: 2026-11-12` on the signer's unconfirmed corporate title.
