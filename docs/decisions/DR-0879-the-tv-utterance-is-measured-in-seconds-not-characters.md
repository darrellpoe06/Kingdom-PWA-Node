# DR-0879 — The TV utterance is measured in seconds, not characters (correcting DR-0874)

- **Status:** accepted
- **Tier:** B (the reading voice; corrects a change that shipped the same day)
- **Date:** 2026-10-10
- **Type:** product (defect — self-inflicted, corrected)
- **Scope:** `app/src/lib/tts.js` (`utteranceSpan` budget), `app/src/__tests__/the-reader-does-not-stall-on-a-television.test.js`
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — including §4, measure rather than claim), PERPETUAL-IMPROVEMENT (DR-0075)
- **Grounds:** **DR-0874**, which this corrects

## The word, as spoken

Darrell, 2026-10-10, within the hour of DR-0874 reaching the live site:

> "Words keep slurring not articulate or even decernable... we need other
> strategies for making the reader read appropriately....!!!!!!!!!!
> Opportunities and constraints!!!!!!!!!"

## What was measured

DR-0874 gave a television a flat **540-character** utterance budget. That
number was invented, and the reasoning behind the number it replaced was not
read carefully enough.

The paced budget is not really about characters:

```
budget = SPAN_CHARS_PER_RATE (180) × rate
```

At roughly **15 characters of speech per second**, `180 × rate` characters
spoken at `rate` is a **constant ~12 seconds of audio at every pace.** The
character count is how a time budget is expressed. It exists because **Chrome
silently truncates an utterance past about 15 seconds** — one of the two
cross-browser bugs that segmenting exists to dodge in the first place, named
in this file's own header.

| budget | chars | seconds of audio at 1x |
| --- | --- | --- |
| paced (as designed) | 180 | **12** |
| DR-0874's TV floor | 540 | **~36** |

Three times over, and well past the cutoff. A truncated utterance is heard
exactly as a sentence degrading — which is what Darrell reported, immediately
after it shipped.

**The correct TV change was never a bigger budget.** It was only to stop the
RATE from gating the behaviour at all: at 1x the paced 180 characters already
holds two typical clauses (~70 characters each), so a television halves its
onsets and stays inside the twelve seconds. One gate removed, no number
invented. DR-0874 removed the gate correctly and then added a number that
undid the protection the gate sat next to.

## Impact

This is an error I shipped, and it reached the live site before he reported
it. Recording it plainly rather than amending DR-0874 quietly: a decision
record that edits away its own mistake is worth less than one that carries it.

What this does NOT claim: that correcting the budget cures the slurring. It
removes a cause I introduced. The underlying articulation of Fire OS's own
speech engine is a separate constraint, and the opportunities against it are
written up for him separately rather than guessed at here.

## The decision

A television uses the **same paced budget** as everything else. `tv` now
affects one thing only — whether the rate gates spanning at all:

```js
if (r < RATE_SPAN_FROM && !tv) return 1;
const budget = Math.min(MAX_SPAN_CHARS, Math.round(SPAN_CHARS_PER_RATE * r));
```

`TV_SPAN_CHARS` stays exported but unused, so a stale import cannot throw.

## Outcome

**11 green.** The replacement case is proven-to-catch and measures the thing
that actually matters: it converts the chosen span to SECONDS of audio at 1x,
1.5x, 2x and 3x and requires every one to be under the 15-second cutoff. It
fails against the 540 version at 1x (~36s), which is the whole point — the
previous case asserted "three clauses or more", which the bad budget
satisfied, so it could not have caught this.

The lesson, for the next person sizing a buffer here: **this budget is a
duration wearing a character count.** Changing the characters without
converting back to seconds silently changes the duration.
