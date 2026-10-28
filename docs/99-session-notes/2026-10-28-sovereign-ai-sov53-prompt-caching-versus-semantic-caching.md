# 2026-10-28 — Sovereign A.I. week 53: prompt caching versus semantic caching

**Module id:** `sov53-prompt-caching-versus-semantic-caching-the-answer-before-the-question`
**Record:** [DR-1265](../decisions/DR-1265-prompt-caching-versus-semantic-caching-sov53.md)
**Course:** Sovereign A.I., week 53
**Code:** `infra/nas-lesson-builder/lesson_writer.py` (`Api.split_at_standard`, the cached system block, the two usage fields)

## What he sent

Typed into the session: *"LLM Prompt Caching Versus Semantic Caching... lesson and how can we use this in our development systems?"*

## What his word became

A Sovereign A.I. week that takes the two techniques to the Word first. Proverbs 18:13 governs: the matter answered before it is heard is folly and shame, and semantic caching is that verse built as infrastructure. Prompt caching keeps the exact bytes and never changes the answer, the fragments gathered so nothing is lost (John 6:12). The week closes on the One who does not change (Malachi 3:6; Hebrews 13:8; James 1:17), because a prefix can be reused only because it stays the same.

And a change in our own system: the NAS writer's vendor adapter now sends the house STANDARD, identical on every call, as a cached system block, with the text unchanged to the byte and the builder's identical-prompt hash unchanged; the two cache fields the service returns ride into every stored version; a `cache: false` key in the writer's NAS config removes the mark. No semantic cache anywhere near the Word, by decision.

## Measured

| measure | value |
| --- | --- |
| lesson · bands (chars) | 14,565 · 5,199 / 11,224 / 13,241 / 14,285, rising |
| referenced quoted spans / corpus faults | 20 / 11 / 17 / 19 / 25 · **0**; every span carries a reference |
| anchors | 19, all named in the lesson |
| stories · quiz · benefits · talking points · prompts | 2 · 12 · 10 · 10 · 10 |
| builder suite with the cache case | **115 green**; `test_fill_versions` green |
| percentages in the module | 0, by gate |

## Corrections, all mine

- The first draft quoted Proverbs 19:2 with a capital "He" mid-verse; the corpus reads "and he that hasteth with his feet sinneth", and the sweep refused it.
- The first cache split expected exactly two newlines after the STANDARD; the STANDARD ends in its own newline, so the user block began with a blank line and the test caught it. The split now strips the seam's newlines and the test proves no text was lost.
- The two stories first shipped without a `kind`, which the completeness gate counts as no story; they carry `kind` and `tone` now.
- sov52's gate asserted it was the highest week (the DR-1256 defect); defused the same way ll268's was.

## Not built, named

- No semantic cache anywhere. The class tutor is the one surface where one could ever be considered, under three conditions named in the lesson, none built.
- The tower writers take no mark; `keep_alive: 0` unloads the model after each lesson by our choice. Whether to keep it warm between a fill run's two lessons is a measurement to make. `re-review: 2026-11-11` with the first real cache-read counts.
