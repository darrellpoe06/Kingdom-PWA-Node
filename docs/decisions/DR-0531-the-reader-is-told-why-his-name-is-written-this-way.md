# DR-0531 — The reader is told why His Name is written this way, and the rule gets one source

- **Status:** accepted
- **Date:** 2026-09-19
- **Type:** governance
- **Relates to:** DR-0076 (derived beats detected; proven-to-catch), DR-0097 (the Word, the 4th-dimensional frame), DR-0099 (colour theology), DR-0210 (Yahweh in our own voice; quoted Scripture untouched), DR-0530 (L180)

## What Darrell said

Three messages the same evening, which only make sense together:

> *"Still quoting however give an overall we capitalize etc for etc reasons..."*

> *"LORD Yahweh etc should never be lowercase no matter what!!!!!!"*

> *"devil demon etc... always lowercase even if they start a sentence or whatever.... Yahweh and other Word... etc... are always capitalized including Him if talking about the King... follow the instructions..."*

## What was already true, and what was missing

Both halves of the Typographic Theology were **already enforced by machine**: the adversary's names since 2026-09-14 (`adversary-is-never-capitalized.test.js`), and His names since earlier today (the `lowered` check in `quoted-verse-is-the-verse.mjs`).

What was missing was **the reader's side**. A person who meets "satan" in lower case in the middle of a sentence reads a typo. A person who meets "Satan" capitalised inside a King James quotation on the next line reads an inconsistency. Both are deliberate, and neither is visible unless it is said out loud.

## The decision — one source, so the page cannot lie

`app/src/lib/typographic-theology.js` now holds the canonical lists, and **everything reads from it**:

| Reader | What it takes |
|---|---|
| `HowWeWriteHisName.jsx` (a Scripture section) | both lists, the reasons, the exception |
| `scripts/quoted-verse-is-the-verse.mjs` | `HOLY_NAME_WORDS` |
| `adversary-is-never-capitalized.test.js` | `NEVER_CAPITALIZED` |

This is the derive-don't-detect principle applied to a rule rather than to data: adding a name updates the gates **and** the reader's explanation in the same commit, with nobody remembering to update prose. The page does not describe the rule; it renders it.

## What deriving it immediately exposed

Three things, none of which a hand-written copy would ever have surfaced:

1. **The adversary gate had drifted.** It never checked `baal`, which Layer 0 has named since 2026-07-03. Joining the two closed that hole the moment they were joined.

2. **A real violation, shipped, in a lesson title.** L42 read *"Keep the Adversary Out of the Music"*. Its own id was already correct (`ll42-keep-the-adversary-out-of-the-music`) — only the title carried the capital, and the old pattern could not see it because it checked `The Adversary` and never `the Adversary`. Now reads *"Keep the adversary out of the music."*

3. **AN INCONSISTENCY LEFT STANDING, DELIBERATELY.** The old pattern forbade `The devil` at the start of a sentence but allowed `The adversary` — identical shape, opposite treatment. Generating the sentence-start form for every name turned **12 shipped lesson sentences** red, all of them *"The adversary ..."* where the name word is already lower case and only the definite article carries the capital.

   Whether that article is a violation is a judgement about His honour, not a regex question, and CLAUDE.md forbids blind sweeps of content. So the gate enforces **what it always enforced plus the unambiguous additions**, never less, and the question goes to Darrell. Recorded here rather than resolved by machine.

   **CLOSED the same day, by Darrell.** Shown the finding in his own terms — *"The adversary..." where the name itself is already lowercase and only the definite article carries the capital* — he answered: **"Great."**

   So the narrow reading governs: **the definite article is English, and the NAME is what must never carry the capital.** A sentence opening "The adversary" is correct as written, because `adversary` is already lower case. The 12 sentences stand; no sweep. The gate stays exactly where it is — every form it enforced before, plus the unambiguous name-word additions (`baal`, `the Devil`, `the Dragon`, `the Adversary`, `the Accuser`, `the Deceiver`), and nothing that would fire on a capitalised article.

   This is also the rule the reader's page now teaches, and it is the reason L42's title WAS a violation while "The adversary shows you..." is not: L42 capitalised the name itself.

## The exception, stated to the reader as plainly as the rule

The surface says it outright: inside a quotation the Word is left exactly as written. The King James text capitalises the adversary's name (Job 1:6, Matthew 4:10) and writes "God" and "the LORD" throughout, and every quotation is fetched from the text and never edited to match how we write. **When the two disagree on a page, the quotation is right and untouched — that is the rule working, not failing.** We never substitute "Yahweh" into a verse that says "God."

This is the same bright line that governed tonight's 19 quotation repairs: every one was fixed by finding a better genuinely-verbatim span, never by altering a word of His.

## Gates

`how-we-write-his-name.test.jsx` — 7 assertions. It does not merely check the page renders, which would pass on a page that had fallen out of step. It asserts the page is derived: every name and every reason on screen comes from the canonical arrays, the never-capitalised list is itself written in lower case, the strict scan list still excludes the two-sense words (`god`, `lord`), and a name the rule does not carry does not appear.
