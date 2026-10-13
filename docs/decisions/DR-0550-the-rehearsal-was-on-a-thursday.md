# DR-0550 — The rehearsal was on a Thursday

- **Status:** accepted
- **Date:** 2026-09-20
- **Type:** correction
- **Relates to:** DR-0533 (L181, the lesson corrected here), DR-0331 (his spoken word captured for meaning), DR-0076 (verification doctrine), DR-0100 (state established fact plainly)

## What he caught

Darrell, from his phone, reading L181 at step 5 of 12 with the word highlighted on screen:

> *"Choir rehearsal was on Thursday today is Saturday... fix the lesson..."*

The lesson said **Tuesday**, in four places.

## Why this is worth a record and not just an edit

It is a small fact and it is the wrong kind of small. L181 is built out of a real evening: his wife at a real choir rehearsal, a real lyric she would not sing, a real conversation, and the real morning afterwards when she walked a mile and finished her notes against how she felt. The lesson's whole claim on a reader is that **this actually happened** — "what this lesson adds is not the doctrine, it is watching the method run" on an ordinary day.

A lesson that gets a checkable fact wrong about the week it happened in invites a reader to doubt everything else in it, and rightly. He was there. I was not. When his account and the lesson disagree, his account is the source.

## What changed

Four occurrences, in four different fields — and only one of them was the lesson body, which is why a fix aimed at the visible sentence would have left three behind:

| Field | Was | Now |
|---|---|---|
| `lesson` | "watching the method run on a real Tuesday" | "…on a real **Friday morning**" |
| `lesson` | "until it survives a Tuesday" | "A good conversation at **Thursday** rehearsal is just a good conversation until it survives a **Friday**" |
| `benefits` | "Watching it run on a Tuesday" | "Watching it run on a **Thursday night and the Friday morning after**" |
| `facilitator.talkingPoints` | "Close on the Tuesday morning, not the rehearsal" | "Close on the **Friday** morning, not the **Thursday** rehearsal" |

The rehearsal is **Thursday**; the morning that proved it — the walk and the notes, which the text calls "THE NEXT MORNING" — is **Friday**.

**The idiomatic "on a Monday" in the benefits is untouched** ("stated plainly enough that a child can hold it and an adult can use it on a Monday"). That is a figure of speech for ordinary life, not a claim about this week, and sweeping it would have been the mechanical find-replace this house forbids.

## Scoped by measurement, not by assumption

22 lessons in the series contain the word Tuesday. Before editing anything, every one was read in context to see whether it dated **this** rehearsal. None did — they are idiomatic ("an ordinary Tuesday", "a flat Tuesday", "what you do on a Tuesday") or belong to other parables with their own characters, including **ll42**, which does contain the words *choir* and *rehearsal* but is a separate story about a loft and a man named Deshawn. **ll181 was the only lesson making the factual claim, and it is the only one changed.**

## The guard

Two tests, in `living-lessons-l181-verses.test.js`:

1. The real days are named — `/Thursday rehearsal/` and `/Friday morning/`.
2. **Proven-to-catch:** a walk over the WHOLE module — bands, benefits, quiz, talking points, not just the adult prose — failing on any of `Tuesday|Wednesday|Saturday|Sunday`. It walks everything because the wrong day was in four fields and three of them were not the lesson body.

Proven rather than asserted: putting the old day back into a single field fails **two** tests; restored, all 16 pass.

## The honest remainder

This class of error — a real detail about a real event, recorded wrongly, with nothing in the house able to check it — has no general gate and cannot have one. No test can know what day a rehearsal was. **The only instrument is the person who was there**, which is exactly how it was caught. **re-review: 2026-10-20** — sweep the lessons built from his lived accounts for other checkable details (days, counts, names, places) and put each one in front of him rather than in front of a gate.
