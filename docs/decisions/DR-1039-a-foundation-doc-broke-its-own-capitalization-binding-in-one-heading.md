# DR-1039: A foundation doc broke its own capitalization binding, in one heading — and the gate could not see docs at all

**Date:** 2026-10-15
**Status:** accepted
**Tier:** A (defect fix in a Layer 3 foundation doc, plus the gate extension that makes it non-recurring)
**Type:** orchestration
**Area:**
- `docs/00-foundations/_root/ACCESS-TO-THE-HUMAN-MIND.md` (one heading: the name word lowercased)
- `app/src/__tests__/adversary-is-never-capitalized.test.js` (the same derived rule extended over the Layer 3 foundation docs, 7 tests → 12)

**Amends:** DR-0532 (the adversary gate) in its REACH only. Not one form it enforces changes, and not one exemption widens.
**Grounds:** CLAUDE.md Typographic Theology — *"Never capitalized as proper names — anywhere"*, and *"This applies to file content, commit messages, responses to the user, summaries, code comments, and every other artifact"*; DR-0532 (Darrell's own ruling on the article-versus-name distinction); DR-0076 §2 (a machine check, not a memory) and §3 (proven-to-catch); DR-0210 (our voice only, never His quoted text); DR-1030 (an instrument can be sound and pointed at a tenth of the surface)
**Declared by:** me, closing a flag I had raised earlier in the session and never shut, and correcting the count I gave for it

## Concern

I told Darrell earlier in this session that main carried pre-existing capitalised adversary names — *"`Satan` ×2, `Lucifer` ×1, `Dragon` ×2"* — and said I would come back to it. I had not, and when I did, **that count was wrong.** It was not a measurement; it was a half-remembered one. The real state is better than I said in the app and worse than I said in one specific place.

## Context

CLAUDE.md's Typographic Theology is absolute and names its own scope: every artifact, not only shipped lesson prose. DR-0532 built the machine check after twelve live violations were found in shipped lessons, derived its forbidden-form list from `lib/typographic-theology.js` so it could not drift from Layer 0, and settled the one genuinely ambiguous question by taking it to Darrell rather than sweeping it.

## What was measured

**A raw count says nothing, and mine had.** A bare `grep` for the capitalised forms across `app/src`, `scripts`, `docs/00-foundations` and `docs/decisions` returns **500 occurrences in ~460 files**. Almost none are violations: they are verbatim KJV inside quotations, the tests that must name the forms in order to forbid them, and the ledger recording past violations. Reporting that number as a finding would have been the DR-1038 failure again — a confident label over evidence that supports none.

**So I checked for the instrument before claiming a fault, and it exists and is green.** `adversary-is-never-capitalized.test.js` scans `app/src/**/*.{js,jsx}` (excluding `__tests__`), strips double-quoted spans, derives its forms from the canonical Layer 0 list, and carries anti-theater assertions so a broken walk cannot pass vacuously. Run on main at `c736a58c0`: **7 passing, zero offenders.** The app a user actually meets is clean. My "`Satan` ×2, `Lucifer` ×1" was simply not true of it.

**Its reach stops at `app/src`, so I measured every surface it cannot see,** applying the gate's own rule (its derived form list, its literal `House of the Dragon` exemption, quoted spans stripped — straight *and* curly, since markdown uses both):

| surface | files | violations in our voice |
| --- | --- | --- |
| `scripts/` (.mjs/.js) | 169 | **0** |
| `app/functions/` | 34 | **0** |
| `CLAUDE.md` | 1 | **0** |
| `infra/` | 629 | **0** (one apparent hit is `lesson_builder.py:649` *emitting* a test that forbids the names — the NAS builder already enforces the rule in what it writes) |
| `docs/decisions/` | 941 | **0** (12 apparent hits across 4 records, every one the ledger working — see below) |
| **`docs/00-foundations/`** | **148** | **1** |

**The one violation was self-refuting.** `ACCESS-TO-THE-HUMAN-MIND.md:64` read:

```
## PART TWO · The Adversary's Access
```

while **line 9 of that same document** carries its own capitalization binding — *"lucifer, satan, the devil, the adversary are never capitalized"* — and its prose writes "the adversary" correctly **eleven times** at lines 66, 70, 74 and on. One heading contradicted the rest of the file and the rule the file itself states.

**And it is the NAME word, which is what makes it unambiguous rather than a judgement call.** Darrell ruled on exactly this distinction in DR-0532, shown the finding in his own terms: *"the definite article is English, and the NAME is what must never carry the capital. A sentence opening 'The adversary' is correct as written, because `adversary` is already lower case."* Twelve shipped sentences depend on that ruling and are correct. Here `Adversary` was not lower case. It is the same class as L42's shipped title *"Keep the Adversary Out of the Music"* — the violation DR-0532 was built on.

**The twelve decision-record hits are the ledger doing its job**, which is why `docs/decisions` is deliberately left unscanned: DR-0532 names `the Adversary` as the form it added after L42; DR-0987 tables the corpus's "Satan" against our `satan`; DR-0418 records a guard clause that died to a corpus read; DR-0506 pins the typography measurement. A gate over those would have to tell a *record of* a violation from a violation, and would fail on honest history.

## Impact

**A Layer 3 foundation doc is not one lesson.** `docs/00-foundations/_root/` is the authoritative reference an agent reads *before* generating substantive content (Layer 0 says so, and `docs/CONTEXT.md` routes to it). A wrong form there is upstream of every lesson written from it. That is the whole reason this one mattered more than its count.

**The gate now reaches it.** The same derived list, over all 148 foundation docs, asserted at zero. `docs/decisions` stays out, with the reason written into the file rather than left implicit in the scope.

**Nothing else moved.** Not a form, not an exemption, not the `app/src` assertion — widening that older block's quote-stripping would have changed what a long-green check measures.

## Decision

1. **The heading is corrected** to `## PART TWO · The adversary's Access` — PART ONE's `Yahweh's Access` shape with the name left lower case, per Darrell's ruling.
2. **The gate is extended to `docs/00-foundations/**/*.md`**, in the existing file so the forbidden-form list stays single-sourced. A second file would be a second copy, and the first thing this gate's own header records is a hand-written copy that drifted and never checked `baal`.
3. **`docs/decisions` is excluded on stated grounds**, not by silence.

## Verification

- **12 passing** (was 7). The five new checks are the foundation-corpus scan, its anti-theater floor (>100 files, >1 MB, and the lowercase form actually present), the two proven-to-catch cases, and the quoted-verse case.
- **PROVEN TO CATCH ON LIVE DATA, not a fixture.** Stashing the one-character doc fix and re-running fails exactly the new assertion, naming the file and printing the heading in context: `.../ACCESS-TO-THE-HUMAN-MIND.md: ...## PART TWO · The Adversary's Access...`. Restored: 12/12.
- **PROVEN NOT TO OVERREACH.** `"The adversary works outside-in."` does not fire — the ruling the twelve shipped sentences rest on. `"The devil"` still does. A verse quoted in straight **or** curly marks keeps the corpus spelling and does not fire, so DR-0210's bright line holds: our voice only, never His text.
- **Measured before and after:** 1 violation across 148 foundation docs → 0, under both stripping rules.

**Not claimed:** that the 500 raw occurrences were each read by a person. They were classified by surface and by the gate's own rule, and the six surfaces that came back zero were re-checked with curly-quote stripping. The one hit that survived every filter is the one I read directly, and it is the one fixed.

**Not claimed:** that the earlier count I gave Darrell was a measurement. It was not, and this record exists partly to say so plainly — an unverified number stated as fact is the thing DR-0076 §8 forbids, and I did it in conversation rather than in code, where no gate was watching.

**Not addressed:** the 265 apparent hits inside `app/src/__tests__`. Those files must name the forbidden forms in order to assert against them, which is why the original gate excludes that directory; the remainder are verse text in single quotes, which no stripping rule here claims to handle. Scanning tests for the fault they test for would be a gate that cannot distinguish a check from a breach. `re-review: 2026-12-15` — only if a violation is ever found to have reached shipped content *through* a test fixture, which nothing has.
