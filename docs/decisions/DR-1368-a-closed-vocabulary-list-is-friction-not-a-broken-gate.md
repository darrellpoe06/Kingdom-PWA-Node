# DR-1368: A closed vocabulary list is friction, not a broken gate

**Date:** 2026-11-06
**Status:** Accepted
**Tier:** A (one one-character link fix; the gate is deliberately NOT changed)
**Type:** non-improvement, recorded with a date (DR-0075)
**Declared by:** DR-0075 (a justified non-improvement is a recorded decision WITH a re-review date) after measuring a finding the spm12 builder reported.
**Area:** `app/src/__tests__/project-management-courses.test.js` (unchanged) · `docs/99-session-notes/2026-10-17-ll255-all-things-work-together.md`
**Found by:** the spm12 builder, whose senior band was refused by a neighbour's gate; it moved its own prose rather than touch the gate, and reported it with the measurement.
**Narrative:** [docs/99-session-notes/2026-11-06-a-closed-list-is-not-a-broken-gate.md](../99-session-notes/2026-11-06-a-closed-list-is-not-a-broken-gate.md)
**Considered, not built:** replacing the vocabulary list with a naming-phrase requirement — refused; see "What was measured", it would refuse seven landed lessons.
**Pairs with:** DR-0075 (the why-plus-date rule this record obeys), DR-0076 (§3 proven-to-catch, §4 measure don't claim), DR-1317 (name a shared thing rather than drop it), DR-1366 (spm12, where it surfaced)

## Context

`project-management-courses.test.js` asserts every lesson "names an industry term", matched as `the industry calls | <a fixed list of terms>`. spm12's senior band named six real terms — total cost of ownership, run rate, operational readiness, service-level objective, on-call rotation, capacity plan — none on the list, with no naming phrase, and was refused.

## What was measured

**Two intermediate conclusions of mine were wrong, and measuring is what caught them.**

1. *"The spm list is nearly vacuous — it contains bare `incident` and `problem` matched against the whole module JSON."* **False.** Measured: **0 of 11** spm modules pass only via those two words. Every one carries a genuine term from the specific part of the list. Had I asserted that, it would have been a false claim about someone else's gate.
2. *"Replace the list with a naming-phrase requirement."* **Worse.** Measured: a phrase-only gate refuses **7 landed lessons** — pm8 and six spm modules (spm2, spm4, spm5, spm6, spm7, spm8). The fix would break correct, shipped content.

**Coverage as it actually stands:** pm 14 modules — 10 carry both, 2 phrase-only, 2 list-only, 0 neither. spm 11 modules — all pass, none by the weak path.

**So the gate is doing what it says.** It is an OR, and both halves of the builder's observation are literally true of an OR; but the half that refused it is the gate working: the course's thesis is that each lesson names what the industry calls it, and the phrase is the cheap way to satisfy that.

## Impact

The real cost is friction, not falsehood: a lesson whose vocabulary is real but unlisted must either extend the list with a reason or use the naming phrase. That is a small tax on new terminology, paid by the author who introduces it.

## Decision

**1. The gate is NOT changed.** Loosening it toward a phrase-only check buys vacuity; adding six terms for one lesson treats a shared list as a per-lesson scratchpad. The builder took the right path — it moved its prose into the course's own idiom, which is how its other eleven senior bands already read.

**2. This is recorded so the next builder does not re-litigate it.** The friction is real and the measurement above is the answer: extend the list with a stated reason, or use the naming phrase. `re-review: 2026-12-06` — if three more lessons hit it, the list's closedness is the thing to change, not the lesson.

**3. One broken link fixed, one left standing and named.** Probing after the builder found its own record citing a DR not on disk: 1653 files, **1307** markdown links, **2** genuinely broken. `2026-10-17-ll255-all-things-work-together.md` linked `...-ll254.md` where the file ends `-ll255.md` — one character, the note is about ll255, fixed. `2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md` links `2026-06-16-research-review-off-vercel-hosting.md`, which **has never existed in any ref** (`git log --all --diff-filter=A` finds nothing). No target was invented for it; a dangling reference to a document nobody wrote is a fact, and inventing one would be worse than leaving it.

## Verification

**The gate's own suite still passes untouched**, which is the point: nothing was changed in it.

**My first link probe under-counted by thirty times** — 43 links against the real 1307 — because its regex only matched `./` and `../` forms while **1265 of the links are bare filenames**. Caught by widening the probe before reporting the number. That is the fourth narrow read today that nearly became a claim, and the reason the figure above is 1307 and not 43.

**Not built:** a broken-link gate. 1307 links and 1 genuine break is a low enough rate that the measurement above is cheaper than the machinery, and the one break cannot be fixed by a gate anyway — it needs a document written. `re-review: 2026-12-06`.

---
_Generated by [Claude Code](https://claude.ai/code)_
