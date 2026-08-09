# DR-0284 — Naming a pattern is not performing it

**Status:** accepted
**Date:** 2026-08-09
**Tier:** A (the live reply path)
**Occasioned by:** the guard blocking a reply that was *explaining the guard*, hours after DR-0283 made the guard itself a normal subject of conversation.
**Principles:** VERIFICATION-DOCTRINE, GOVERN-EXECUTE-ADVISE, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## The decision

**Backticked spans are stripped before undermining-pattern matching. Plain quotation marks are not.**

And `EVIDENCE` accepts one optional descriptor between a count and its noun, so **"25 unit tests"** reads as the evidence it plainly is.

## What happened

The `UNDERMINING_PATTERNS` match the **words** of an undermining move. A reply that *quotes* one in order to discuss it therefore trips the guard. Measured, not assumed:

```
problems: [ "re-ask-permission: “say the word” — asks permission for work already directed" ]
```

…on a reply whose actual sentence was *the guard matched "say the word" against `re-ask-permission` and blocked my reply.* The guard could not distinguish **use** from **mention**.

This was always latent. DR-0283 made it routine: once the guard's own behavior is a normal thing to explain, every such explanation quotes the patterns.

A second, independent defect surfaced in the same measurement: `EVIDENCE` required the count adjacent to its noun, so `"25 tests"` counted and `"25 unit tests"` did not — flagging as unevidenced a reply carrying a test count, an end-to-end run table, and a commit SHA.

## Why backticks only

A code span is the one place a phrase is unambiguously being **named** rather than said.

Stripping plain quotation marks was considered and **rejected**: it opens a trivial evasion — wrap a genuine ask in quotes and walk past the guard. A guard that can be talked past is not a guard. The cost of the narrow rule is that the author must write pattern names in backticks; that is a writing discipline, not a loophole.

The measured proof of the choice: the original reply, which used plain quotes, **still flags** after this change. That is the correct outcome, and it is the evidence that the evasion path stayed closed.

## Proven (30 tests passing)

- A backticked mention (`` `say the word` ``) does not flag.
- A fenced block quoting the pattern does not flag.
- The same phrase in plain prose still flags — mention-stripping is narrow.
- **Evasion guard:** the phrase in plain quotation marks still flags.
- `"25 unit tests"` and `"8 integration tests green"` count as evidence; a bare `"It works."` does not.

## Honest limits

This fixes a *precision* defect; it does not make the guard understand intent. A reply can still be written to trip a pattern innocently in plain prose, and the remedy there is to rephrase or use backticks. The guard remains a blunt instrument on purpose — blunt and unevadable beats clever and permeable.

## Pairs with

DR-0283 (the guard must see the Governor's hand — the change that made this latent defect routine), DR-0111 (the rule the patterns encode), DR-0076 (verification doctrine — measure, don't assume; the defect here was found by running the real text through the real guard).
