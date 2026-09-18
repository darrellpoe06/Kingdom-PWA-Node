# DR-0484 — Four age versions, or one repeated four times?

- **Status:** accepted
- **Tier:** B (a new machine gate over the whole lesson corpus)
- **Date:** 2026-09-18
- **Type:** gate
- **Scope:** `scripts/band-differentiation.mjs` (new measure), `app/src/lib/band-differentiation-baseline.json` (new shrink-only baseline), `app/src/__tests__/band-differentiation-gate.test.js` (new, 13 checks)
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 §2 §3 §4), EVERY-BAND-IS-THE-WHOLE-MESSAGE (DR-0418), A-PROXY-MEASURES-WHAT-IT-CLAIMS (DR-0332)
- **Grounds:** DR-0481 and DR-0483 (the two checks-that-never-look found earlier the same day)

## Why this exists

Darrell, 2026-09-18: *"Last lessons don't have diversity of lessons for all reading levels... why not? Fill up the lessons and don't stop."*

He was right, and **nothing in the house could have told him so.** The `full-levels` gate measures each band's word-count **share** of the adult lesson. The `reading-level` gate measures **FK grade and monotonicity**. Neither of them ever compares the bands **to each other**.

So `ll173-humility-is-the-strength` passes every check in the repository — shares 0.97 / 1.00 / 1.08 / 1.26, ladder 3.2 / 7.1 / 7.2, monotone — while **its youth and teen bands are the same text.** One band wearing four labels, fully green.

This is the **third** instance of the same class in a single day: a verbatim check that read only five of a module's fields (DR-0483), a renderer window that silently dropped four of six movement headings (DR-0483), and now gates that never compared the things they were named after. A check that never looks passes for ever, and the only instrument that finds this class is a deliberate break.

## The measure, and the choice that makes it honest

Overlap is the share of **8-word phrases** the smaller band shares with the larger — long enough that ordinary English collocations do not register, short enough that a reworded sentence still does. Divided by the **smaller** set rather than the union, because a short child band wholly contained in the senior band is fully duplicated whatever the lengths are, and a union denominator would score that as roughly half-different and pass it.

**Measured on authored prose with quotations removed, and that choice changed the answer.** My first pass ran on raw band text and reported **35 lessons at or above 0.50 with a median of 0.44**. That overstated the debt, because every band quotes the **same verses** — it is the same lesson — so shared Scripture was being counted as duplication. On authored prose the figures are:

| threshold | lessons |
|---|---|
| worst pair ≥ 0.90 | **2** |
| ≥ 0.75 | 7 |
| ≥ 0.60 | 16 |
| **≥ 0.50 (recorded debt)** | **20** |
| median worst pair | **0.15** |

The real offenders are unmoved — ll173 and ll172 stay at 0.99, because their defect was never the quotations. What changed is that well-differentiated lessons stopped being punished for carrying the Word in all four versions: ll174 went 0.42 → 0.20 and ll175 0.31 → 0.17. That is DR-0332 doing its job: a proxy must measure what it claims to.

## The ceiling is a decision, not a finding

Median 0.15; the best in the corpus run 0.03 to 0.07; the offenders run 0.73 to 0.99. **0.50** is set for a new lesson — more than three times the median, so it condemns nothing merely economical, and nowhere near the cluster that is the actual debt. A lesson under the ceiling may still be thin; the author's eye is still the judge. A lesson over it is certainly repeating itself.

## Proven-to-catch, on the real corpus and not only on fixtures

A gate that always passes is itself a lie (DR-0076 §3), so this one was broken on purpose before it counted:

1. Identical bands score **1.00** on every pair.
2. Four genuinely different passages score **below the ceiling**.
3. A short band **wholly contained** in a longer one scores 1.00 — the check that justifies the smaller-set denominator.
4. Four bands carrying the **same quotation** stay below the ceiling — the check that justifies stripping quotations.
5. On the **real corpus with a clean baseline**: 0 fresh.
6. **Remove ll173 from the baseline** and the ratchet reports it — so the ratchet is reading the lesson whose defect prompted the gate.
7. **Clone ll174's teen band into its youth band** and the ratchet reports ll174 as a fresh offender — so a regression introduced tomorrow fails the build.

Checks 6 and 7 are the ones that matter. A synthetic fixture proves arithmetic; only the real corpus proves the gate is wired to the thing it is supposed to guard.

## What the data says about how the damage happened

`youth~teen` is the dominant failing pair in almost every offender, while `child~youth` and `child~senior` sit near zero throughout. The youth band was added later (DR-0418), and in these lessons it was **cloned from teen rather than written**. The child band was always authored fresh. So the repair is mostly a youth-band job rather than a whole-lesson rewrite — which is worth knowing before 20 lessons are opened.

## Consequences

- 20 lessons are recorded in the baseline, worst-first with every pair named. Entries may only be removed. **ll173 and ll172 are first** — effectively single-band lessons wearing four labels, and the newest, which is exactly why he noticed them.
- The re-authoring is task #63. **Differentiation is never abbreviation**: the full-levels floor, the FK ladder and this ceiling all hold at once, and a band trimmed to look different trades one defect for a worse one.
- It overlaps the drain pass (task #21). A lesson opened for coverage should be authored for differentiation **in the same pass** rather than touched twice — ll81 and ll82 were drained earlier today and are both on this list, which is the case in point.
- Genuine differentiation means different **entry points and worked examples** reaching the same doctrine, not a change of register. Re-registering the same prose is what produced the 0.73–0.99 signature in the first place. `ll127` (0.07) and `ll154` (0.03) are the models to read.
