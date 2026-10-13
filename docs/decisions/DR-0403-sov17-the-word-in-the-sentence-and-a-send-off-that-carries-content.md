# DR-0403 — sov17: the Word in the sentence, and a send-off that carries content

- **Status:** accepted
- **Tier:** B (COLG/family-facing lesson content)
- **Date:** 2026-09-14
- **Principles:** WORD-FIRST, DR-0391 (a list of references is not a sentence), DR-0402 (the Word belongs in the sentence, not the margin), DR-0111 (do the work), DR-0076 (proven-to-catch)
- **Concurrency:** minted as DR-0403 while a concurrent lane holds DR-0402 (PR #1582, the app-wide render fix); renumber-on-merge per DR-0052 if they collide.

## Directive

Darrell, 2026-09-14, on the freshly-shipped sov17 lesson (week 17 of the Sovereign A.I. class, "The Judge and the Just Weight"):

> "That lesson still has list of scripture references instead of what I asked for.... send off have content!!!!!! All the context of the lesson was in the send off!!!!!!!!"

This is the same standard the concurrent lane recorded as DR-0402 ("Show the Word in the sentences not in the margins... not any lists inside at the beginning of the lessons without context... one or two with points and the full scripture they are discussing in context") and that DR-0391 first named. sov17 shipped violating it in two places.

## The two defects (traced in the code, not memory)

1. **The margin list.** `anchor.theme` ended with `The spine of this week: Genesis 18:25; James 4:12; …` — a bare 24-reference dump. `lesson-flow.js` renders `anchor.theme` as the Open page's audience text, so the learner met a bibliography, not a sentence. Nine sov modules carry this pattern; sov17 is fixed here, the rest tracked below.
2. **The empty send-off.** `lesson-flow.js` renders the Send-off (`send`) page's audience side from `module.benefits`. sov17 shipped with **no `benefits`**, so its final page — the one Darrell says must carry the whole context — was empty.

## Decision

- **anchor.theme** now quotes only the two anchor verses **in context, with their point** (John 7:24 and Proverbs 11:1), and the bare reference run is removed — DR-0402's "one or two with points and the full scripture in context."
- **benefits** added: six real takeaways that carry the lesson's spine into the learner's hands on the Send-off page (judge substance not surface; a mind is not a calculator; the rubric is a just weight; kill the favoritism; no mind certifies itself; health is proven by fruit — closing with the carry-it-out task).
- Every verse quoted in `benefits` is verbatim KJV, reusing spans already verified against the repo corpus, and pinned letter-for-letter in `sovereign-ai-verse-integrity.test.js` — a drift fails the build.

## Proven-to-catch

The new test asserts (a) `anchor.theme` carries no `spine of this week` dump and at most two bare references, and (b) `benefits` exists, is substantive, and quotes the Word verbatim. Both assertions FAIL on the shipped sov17 (which had the list and no benefits) and pass on this change.

## Limit / follow-up

Only **sov17** is fixed here. The same two data defects (spine-list in `anchor.theme`, absent `benefits`) exist across **sov9–sov16** and are the class-wide pattern DR-0402's render fix does not reach (the list lives in the theme text, not the ref field). **re-review: 2026-09-21** — sweep the remaining Sovereign A.I. modules to the same standard.
