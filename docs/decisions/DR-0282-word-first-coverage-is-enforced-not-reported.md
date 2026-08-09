# DR-0282 — Word-first coverage is ENFORCED, not reported

**Status:** accepted
**Date:** 2026-08-09
**Tier:** A (every knowledge space in the app)
**Declared by:** Darrell — *"Ai has a hard time keeping the pattern... we have to make it prioritize Yahweh's Perspectives."*
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, PERPETUAL-IMPROVEMENT, DECISION-RECORDS

## The decision

**DR-0127's Word-first rule moves from a census that reports to a gate that fails the build.** Every course in `lib/learn-catalog.js` must resolve a Word-first lead with a real Scripture reference; a declared lead must carry His frame in words and not a bare citation; and a space carrying charged material must **declare** its own lead rather than inherit whichever item happens to sit first.

Enforced by `app/src/__tests__/word-first-coverage.test.js`, which runs in the existing `app — lint + vitest` CI job.

## Why

DR-0127 is binding and was correct. Its enforcement was not: a missing lead was a *reported finding*. Reporting is not blocking.

So the **World Issues** track — the space handling the most charged claims in the app (race, medicine, incarceration, empire) — silently fell through to its first issue's anchor and opened under the **Musk lesson's** frame instead of Yahweh's. Nothing failed. Nothing surfaced it. It took a Ways review going looking, months later.

Darrell's framing is the whole design constraint: **the pattern cannot live in an agent's attention.** An AI reads "Word-first," fully understands it, and still opens a space with a borrowed anchor. A document says what should happen; a gate makes it happen. This is that gate.

## What it checks

1. **`word-first/no-lead`** — a course resolves no lead at all (no declared `meta.wordFirst`, no first-session Scripture anchor).
2. **`word-first/bare-citation`** — a declared lead carries a `ref` with no `frame`. A citation alone is not His perspective; the reader must meet His frame in words.
3. **`word-first/borrowed-anchor`** — a space in `DECLARE_REQUIRED` is coasting on a derived first-item anchor. **World Issues is the founding member, because it is the one that broke.**

The check mirrors the real render path: catalog entries expose rows through `buildScheduleRows()`, so the gate resolves the schedule the same way the app does rather than reading a property that isn't there.

## Proven-to-catch (DR-0076 §3)

The proof lives in the suite as three permanent cases, not behind a flag:

- Stripping the World Issues declared lead → `word-first/borrowed-anchor`.
- A declared lead with a whitespace-only frame → `word-first/bare-citation`.
- A space with neither declared lead nor anchor → `word-first/no-lead`.

**Current state: 21 knowledge spaces, every one opens with the Word.** 7/7 tests pass.

An honest note on the build: a first draft resolved the schedule from a `schedule` property that catalog entries do not have, which produced a **false** finding against *Prophetic Voices*. It was a bug in the gate, not a gap in the content, and it is recorded here because a gate that cries wolf gets switched off — the same reason DR-0281's noisy first draft was discarded.

## Honest limits

This gate enforces that a space **opens** with His frame and that the frame is real text. It cannot judge whether the frame chosen is the *right* one for the material — that stays human work under DR-0098 and the Governor's review. What the machine now guarantees is narrower and real: **no knowledge space can ship, or silently drift, without Yahweh's knowledge opening it.**

## Pairs with

DR-0127 (Word-first opening — the rule this enforces), DR-0129 (the one Learn registry), DR-0076 (verification doctrine — §2 gate-the-class, §3 proven-to-catch), DR-0281 (the Word reviewed for reasoning), DR-0239 (COMPREHENSIVE-REVIEW-STANDARD).
