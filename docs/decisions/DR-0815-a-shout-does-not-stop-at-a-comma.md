# DR-0815 — A shout does not stop at a comma

**Date:** 2026-10-08
**Status:** accepted
**Area:** the reader's voice (text handed to the speech engine)
**Principle:** DR-0076 (measure, do not claim; proven-to-catch), DR-0381 (the shaping pass), DR-0621 (hold the hand of the process), DR-0065 (the app is the primary artifact)

## Context

Darrell, reading lesson L218 on the TV, with the reader speaking:

> "At this exact spot in this lesson... the voice keeps failing and it sounds
> garbled... can't distinguish the words... why? It's happening in multiple
> places in most lessons... a paragraph or a few that don't work well and is
> incoherent... fix it."

`speech-shape.js` has lowered shouted text for the voice since 2026-09-13,
because several engines hand an ALL-CAPS run back letter by letter — "THE
DIRECTIVE." read as "T-H-E D-I-R-E-C-T-I-V-E". The module's own header says so.
It was lowering less than it looked like it was.

## What was measured

Probing the real L218 module through the real pipeline, segment by segment,
found the exact spot he was listening to:

```
@426  len=24
  RAW   : "FIRST, DO NOT SWITCH UP."
  SPOKEN: "FIRST, Do not switch up."
```

`FIRST` was handed to the engine still shouting. One character explains it. The
run pattern was

```
/\b[A-Z][A-Z'’-]*(?:\s+[A-Z][A-Z'’-]*)+\b/g
```

— two or more capitalised words separated by **whitespace**. The comma ended the
run, so a shouted word standing next to punctuation never matched at all, and
neither did a shouted word standing alone.

**The whole catalog, through `toSpokenForm`, before the fix:**

| | |
|---|---|
| modules scanned | 215 |
| modules still handing the engine a shouted word | **214** |
| places (a lesson string or a band) | **3,676** |
| distinct shouted tokens | 1,950 |
| total occurrences | **13,557** |

That is his "multiple places in most lessons," counted. The leaders were `BC`
x465, `ONE` x395, `AND` x368, `DR` x301, `IS` x287, `NOT` x278, `FIRST` x276,
`SECOND` x192, `OCCASION` x172.

The measurement also decided the fix rather than a guess about it. Splitting the
1,950 survivors by length showed the line falls at four letters: the four-plus
survivors were almost entirely prose being shouted (`FIRST`, `OCCASION`,
`NOTICE`, `CAPTURE`, `REDIRECT`), with a short, nameable set of real ones
(`ITIL`, `USSC`, `EEOC`, `HOLC`, `JCPP`, `AAPA`, `AABA`, `TGAB`, `IKEA`,
`YHWH`); the two- and three-letter survivors were a genuine mix of real
initialisms (`BC`, `AD`, `DR`, `CFO`, `TSH`, `SME`) and real words (`AND`,
`ONE`, `IS`, `NOT`, `DO`), which no length rule can separate. Every token in
both groups was read **in context** before it was placed. `SI` turned out to be
"Spiritual intelligence (SI)" from the Godhead lessons, and went to the
protected list rather than the softened one.

**After the fix, same measurement, same pipeline: 0 modules, 0 places, 0
occurrences.**

## Impact

- **The garble is gone where he heard it.** `"FIRST, DO NOT SWITCH UP."` now
  reads `"First, do not switch up."`
- **13,557 occurrences across 214 of 215 modules become words instead of
  letters.** This is not one lesson; it was nearly the whole catalog, in every
  lesson's shouted lead clauses.
- **The screen is untouched.** This changes only the string handed to the
  engine. Every capital the house style writes is still on the page, every
  binding capital in CLAUDE.md is still displayed exactly as written, and a test
  asserts the word sequence is identical before and after shaping. Nothing is
  added, removed or reordered.
- **Quoted Scripture is unaffected in substance.** The shaping pass lowers case
  for the utterance only; the quoted text itself is never rewritten, stored or
  shared in the lowered form (DR-0076 bright line).
- **A real initialism still reads as letters,** alone and inside a softened run:
  "In 586 BC, and in AD 70", "the ESV, KJV and NIV", "logged to DR-0076 and the
  ledger", "The NAS is sovereign".
- **A stray mid-line capital is gone too.** A softened run keeps a capital only
  where a sentence actually opens, so "the Spirit AND the Word" reads back as
  "the Spirit and the Word" rather than "the Spirit And the Word".

**Named, not fixed here:** a short shouted word that is neither a listed word
nor a known initialism is still read as written — the safe direction, but it
means a new two- or three-letter shout in future content stays as it is until it
is measured and placed. The sweep is a few seconds of work against the real
catalog and is the mechanism for keeping that at zero. **re-review:
2026-11-08.**

## Decision

Three changes in `app/src/lib/speech-shape.js`, all in the speech path only:

1. **A run crosses the marks a speaker pauses on** — comma, semicolon, colon,
   em- and en-dash — because a shout crosses them too. It does NOT cross `.`,
   `!` or `?`, so a sentence boundary is still a boundary. The split captures
   its separators and the join re-emits them **verbatim**; the old body did
   `split(/\s+/)` + `join(' ')`, which was safe only while whitespace was the
   only separator and would have deleted every comma inside a run.
2. **A lone shouted token is softened at four letters or more**, with the real
   four-plus initialisms named in `KEEP_CAPS`.
3. **Below four letters, length decides nothing, so a measured list decides by
   name.** `SHOUT_WORDS` holds the short words the house style actually shouts,
   every one read in context first. A short token on neither list is left
   exactly as written.

`KEEP_CAPS` grew from 22 entries to 81 with the measured initialisms, and it now
carries real weight: it is what protects `BC`, `DR`, `CFO` and the rest when a
run widens across a comma.

## Verification

- `app/src/__tests__/speech-shape.test.js` **27/27 green**, 10 of them new: the
  exact L218 utterance; a run crossing comma, semicolon, colon and dash; a whole
  shouted sentence crossing its own commas; separators returned byte-for-byte;
  a lone four-plus word softened; a lone short word softened by name; an
  initialism surviving alone and in-run; an unlisted short token left alone; a
  capital kept only where a sentence opens; and the word sequence unchanged
  across all of it.
- `speech-text.test.js` 20/20 green — the reference expansion still runs before
  the softening, so `HEBREWS 2:14` is still read "Hebrews chapter 2 verse 14".
- **Proven to catch (DR-0076 §3), four separate breaks, each restored after:**
  - separator back to whitespace only → *"a whole shouted sentence crosses its
    own commas"* fails (and the catalog sweep goes from 0 to 5 survivors:
    `SEA`, `SUN`, `SKY`, `EGO`, `LO`, each stranded mid-shout by a comma);
  - `LONE_SHOUT_MIN` raised out of reach → *"a lone shouted word of four letters
    or more is softened"* fails;
  - `SHOUT_WORDS` emptied → *"a lone shouted SHORT word is softened when it is a
    word, by name"* fails;
  - the join collapsed back to spaces → **5 tests** fail, including the L218
    utterance itself.
- The catalog sweep is the end-to-end evidence: 13,557 occurrences across 214 of
  215 modules before, **0** after, measured through `toSpokenForm` on the real
  `LIVING_LESSONS_MODULES`, not on a sample.
- Not verified from here: how a specific engine voices the result on Darrell's
  Firestick. The fault was in the text we hand the engine and the text is now
  measured clean; the live listen on the deployed build is the next step, and
  the reader is where he will hear it.
