# DR-0472 — L89 gets its youth band, and a gate that called three bands "full coverage"

- **Status:** accepted
- **Tier:** B (a learner-facing lesson at every age band, on a passage where getting the balance wrong does real pastoral harm)
- **Date:** 2026-09-18
- **Type:** content
- **Scope:** `app/src/lib/living-lessons-class.js` (L89's four bands rewritten, youth created), `app/src/__tests__/living-lessons-l89-verses.test.js` (23 → 29 checks), the three shrink-only baselines (all three SHRANK)
- **Principles:** EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), VERIFICATION-DOCTRINE (DR-0076 §3 proven-to-catch), TEACH-DONT-DEBATE (DR-0098), TYPOGRAPHIC-THEOLOGY + the covenant name (DR-0210), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** DR-0418 (the full-levels pass and its floors), DR-0459 (no ellipsis inside a quotation), DR-0456 (STRICT comparison is whitespace-only), DR-0417 (the child ceiling is a corpus number)

## Why this exists

The full-levels pass works newest-downward through the 89 lessons still carrying a short band. L89 — *The Most-Hated Verse — Wilful Sin, the One Sacrifice, and the Advocate for Those Who Stumble (Hebrews 10:26)* — was the next one, and the worst of them:

| band | before | floor | after |
|---|---|---|---|
| child | 146 words, share **0.25** | 0.50 | 446 words, share **0.774** |
| youth | **absent entirely** | 0.60 | 389 words, share **0.675** |
| teen | 234 words, share **0.41** | 0.60 | 516 words, share **0.896** |
| senior | 257 words, share **0.45** | 0.60 | 465 words, share **0.807** |

It was also an exception in **all three** shrink-only baselines at once — short, reading-inverted, child-over-ceiling, and title-unnamed in three bands. All three now record it as healed.

## The decision

### a. THE BALANCE IS THE WHOLE JOB ON THIS PASSAGE

Hebrews 10:26 is the one verse where a band that loses its balance does harm in a specific direction. Keep the warning and drop the mercy and you have terrified a believer who stumbles. Keep the mercy and drop the warning and you have reassured someone who has made sin the plan. The adult lesson holds both, so every band now holds both in its own register, in the adult's own order:

1. **Frame it first, or you will misread it.** Verse 26 sits inside the best news in the book — one sacrifice, final, sufficient (Hebrews 10:10, 12, 14, 17, 18) — **and He sat down**, which is the proof, because no priest under the old covenant ever sat.
2. **The hinge word.** *Wilfully*: deliberate, eyes open, chosen, kept up. Not the believer who trips.
3. **Why "no more sacrifice"** — not because grace ran out, but because there is only ONE, and wilful sin tramples the very thing it would have to run to (Hebrews 10:29).
4. **Then the mercy, just as plainly.** 1 John 1:8 (no honest believer claims sinlessness), 1:9 (the promise), 2:1 (**the Advocate** — a believer who sins is not thrown out, he is represented).
5. **Not despair — today.** Hebrews 10:35, 10:38, 10:39; 2 Peter 3:9; Hebrews 3:15; James 4:8.

The Advocate is now required in **all four** bands by its own check, because it is the half a warning lesson drops most easily, and a band that kept the warning while losing the Advocate would teach the opposite of the passage.

### b. THREE DEFECTS THIS LESSON WAS ALREADY SHIPPING

Found by reading the bands before rewriting them, which is the only reason they were found at all:

1. **Two ellipses inside quotations** (DR-0459) — the teen and senior bands each carried Hebrews 10:29 with `...` standing in for the middle of His own sentence. **The remedy was never an elision:** the contiguous verbatim span was available the whole time, and both bands now quote it whole.
2. **A decision-record ID recited to the reader.** The senior band opened: *"Teach this verse the way it must be taught — inside its chapter, never alone (DR-0098: let the Word explain the Word)."* The rule is right and the citation is **ours, not theirs** — a reader has no idea what DR-0098 is, and a lesson showing its own internal bookkeeping has stopped speaking to the person in front of it. The rule now travels in plain words, and a check forbids `DR-\d{4}` in any band.
3. **The reading ladder was inverted and the child band was over its ceiling** — child 7.46 against a 7.0 ceiling, and reading *harder* than teen at 4.17. A child band that reads harder than the teen band is not a child band.

## The finding: A GATE THAT CALLED THREE BANDS "FULL COVERAGE"

L89 already had a 23-check gate. It passed the moment the youth band landed, and it would have passed just as happily if the youth band had been garbage or absent — because its describe block read:

```
every age level carries the whole message (child, teen, senior — full coverage)
```

Three bands, called full coverage, in a series whose governing rule is that **every** band is the whole message (DR-0418). The shape check listed `'child:', 'teen:', 'senior:'` and never `'youth:'`. The eighteenth face of the recurring finding, and the second time in two records that a check's NAME promised what no claim asserted.

Extended to four bands throughout, with `youth:` required in the shape check so the band cannot go missing again silently.

### And the break harness earned two more checks

Two pass-1 misses were aimed at our prose while the check they targeted was satisfied by **the quotation** — `toContain('once for all')` and `toContain('wilfully')` both match inside the Hebrews text the band quotes. So a band could quote Hebrews 10:26 verbatim and **never once teach what wilfully means**, and the gate would call it covered.

Quoting a verse is not teaching it. Two new checks read **our prose only**, quotations stripped:

- every band must name *wilfully* outside the quotation AND explain it at least two ways (deliberate / on purpose / chosen / eyes open / kept up / presumptuous);
- every band must say in its own words that the sacrifice is ONE and that it is finished.

## The evidence

- **61 quoted spans across the four bands, every one verbatim** against the local KJV corpus under STRICT comparison (whitespace-only; apostrophes never normalised), **0 unreferenced, 0 ellipses.**
- **Fullness:** 0.774 / 0.675 / 0.896 / 0.807 — `shortBands` for L89 is now `[]`.
- **Reading ladder: 2.87 / 3.56 / 6.49 / 7.07, monotone** (the rule is non-decreasing across every present band, which is stricter once youth exists), child well under the 7.0 ceiling, youth (3.56) below the adult lesson (4.41).
- **My first child draft measured FK 0.77** — technically passing and actually bad, because it was chopped into fragments a reader would stumble over. Fourteen joins brought it to 2.87 as real sentences. Then the senior band, which I had over-split to 6.19, fell *below* teen and inverted the top of the ladder; three constructions restored brought it to 7.07. Both corrections are recorded because "passes the gate" and "reads well" are not the same claim.
- **Covenant name:** Yahweh 3 times in each band's own prose, **zero generic-name uses in our own voice** in any band, every quotation's own "God" and "the LORD" left exactly as the corpus carries it.
- **All four bands name their own lesson** in the opening window.
- **All three shrink-only baselines SHRANK and none gained an entry:** short 89 → 88, inverted 22 → 21, over-ceiling 16 → 15, title-unnamed 155 → 154 (bands 465 → 462). The rebase script refuses to write if an entry would be added.
- **The gate:** 29 checks, green.
- **Proven-to-catch:** 22 breaks in three passes, **17 caught, 0 outstanding.** Pass 1: 13 breaks, 10 caught; all three misses were mine — one lookahead that inserted a character and removed nothing, and two aimed at prose while the check was satisfied by the quotation (which is what earned the two teaching checks). Pass 2: 7 breaks, 5 caught; both misses were redundant-phrasing breaks where the band genuinely still taught the property in other words — thoroughness, not weakness. Pass 3 proved that by removing EVERY phrasing of *finished* (25 sites) and of *one* (26 sites): both caught.

## What is not done here

**The lesson count is unchanged at 29 / 532** — these are bands of an existing lesson, not new lessons, so the crosslist pin is untouched.

**88 lessons still carry a short band.** This pass is incremental by design and continues newest-downward; L88 and L87 are next, and L153 stays excluded at Darrell's word.

**L89's anchor is still `Hebrews 10:26; 1 John 1:9`** while the lesson now references sixteen distinct places. DR-0465's derived-anchor rule was written for new lessons and no gate holds it here, so widening it is not smuggled into this record. **`re-review: 2026-10-24`** — folded into the already-dated review of the per-lesson gates' own pinned fragments, since both concern the same class of older lesson metadata.
