# DR-1328: The step marker is seen whole and heard short — the reader said "~5 min · Child pace" fifty-two times in one lesson

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** A (one span in the read-along branch and a gate; no data, no schema, no money, no identity surface)
**Type:** fix
**Area:** `app/src/components/ChurchLearn.jsx` (the read-along step marker), `app/src/__tests__/the-step-marker-is-said-once.test.jsx` (new, 5 cases)
**Declared by:** Darrell, 2026-11-05 — *"After finding the reader the voice is overreacting..."* — the second half of the same sentence DR-1327 answered.
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** **DR-1327** (the stall, found and fixed first; it measured this and left it dated as his call), DR-0734 (`data-read-skip`, the mechanism used here), DR-0633 (follow along, never yank), DR-0076 (§3 proven-to-catch, §4 measure don't claim), DR-0075 (perpetual improvement — feel and flow), DR-0111 (do the work)

## Context

Darrell reported the reader "overreacting" on a 52-step CHILD-pace lesson. DR-1327 found the larger fault — a follow map built once, never rebuilt, so following died on a re-render and the TEXT tap did nothing at all — and fixed it.

In doing so it measured a second thing and correctly left it alone, because `ChurchLearn.jsx` states **in writing** that the behaviour is deliberate: *"In read-along the whole core renders in order, with its step markers kept so the listener still hears where they are."* A deliberate decision is not a defect, so that builder dated it rather than changing someone's stated intent. This record is the decision it was waiting for.

## What was measured

**In read-along, every step renders** — that is the whole point of the branch, and it is what his screenshot shows (steps 45 through 49 in one scroll). So the reader walks all of them, and the marker is not said once. It is said once **per step**:

> "Step 1 of 52 · ~5 min · Child pace" · "Step 2 of 52 · ~5 min · Child pace" · … fifty-two times

Measured with the app's own `buildFollowMap` over a 52-step read-along render: **52 occurrences of `Child pace` and 52 of `~5 min`** in the spoken text, interleaved with the teaching.

**The step number earns its place; the tail does not.** A listener who is not looking at the screen genuinely needs to know where they are — "Step 46 of 52" is orientation. The minutes and the pace are **identical on every step of the lesson**. Saying them again fifty-one times is drone laid over the thing he came to hear, and it is a plausible share of what "overreacting" names.

## Impact

On the one surface built for someone who is **not reading the screen**, roughly a fifth of the marker text spoken across a long lesson carried no information after its first utterance. On a 52-step lesson that is 51 needless recitations of the same five words, each one landing between two sentences of the teaching.

## Decision

**The tail is skipped by the READER and kept on the SCREEN.** `· ~{segmentMinutes} min · {band.label} pace` moves into a span carrying `data-read-skip` — the mechanism this app already has, already honoured by `SKIP_SELECTOR` in `read-follow.js`. The eye gets the whole marker exactly as before; the ear gets "Step 46 of 52".

**The single-step stepper is untouched.** Outside read-along a listener meets that marker once, so there is nothing to thin and shortening it there would be a loss.

**Deliberately NOT `aria-hidden`.** That would take the pace and the minutes away from someone using a screen reader, who has no other route to them. Dropping a repetition from *our own* read-aloud is a different thing from hiding information from assistive technology, and the second would be a real loss. Written into the component beside the change so the next builder does not "tidy" it into one.

## Verification

**5 cases green**, run from inside `app/`, plus **47 green across 8 reader and lesson-render suites** (`the-reader-follows-a-re-render`, `follow-along-reader`, `read-one-full-lesson`, `the-lit-sentence-is-the-one-heard`, `member-surfaces-every-control-acts`, `the-level-is-chosen-inside-the-lesson`, `lesson-flow-sessions-render`). `eslint` clean on both changed files.

**Proven to catch, by measurement rather than assertion (DR-0076 §3/§4).** One case builds the marker **without** the skip — the shape on `main` before this change — runs the real `buildFollowMap` over it, and asserts the spoken text contains **exactly 52** `Child pace` and **52** `~5 min`. If that ever reads 0 the gate is decorative and says so in its own failure message. The sibling case asserts the fixed shape speaks **52 step numbers and zero** pace repetitions, so both directions rest on a measurement of real spoken text.

**Two cases guard the edges:** the page still contains the whole marker for a reader's eye (nothing was deleted), and the single-step stepper still carries its full text. A fifth asserts the span is **not** `aria-hidden`, so a later tidy-up cannot quietly cost a screen-reader user the pace.

**Honest limit.** The gate builds the marker's DOM shape rather than rendering `CourseView`, which needs a signed-in host; what is under test is *which part of the marker reaches the reader*, and that is decided by the attribute, which a fourth case reads out of the real component source. A full end-to-end render of the course view at CHILD pace with speech is not covered here — headless Chromium has no voices (DR-1327 hit the same wall). `re-review: 2026-12-05`.

---
_Generated by [Claude Code](https://claude.ai/code)_
