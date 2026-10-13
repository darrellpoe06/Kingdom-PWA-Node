# ll79 is a hole in the catalog, and #1255 does not say what it does (2026-10-13)

A drain triage of the oldest open drain, **#1255** (opened 2026-08-14, 110 files,
+4,088 / −6,855), measured rather than assumed. Three findings, all verified
against the branch and against main's tip `83d06328b`.

## 1. There is a real hole at ll79, and nothing on main fills it

Living Lessons on main run **ll1 through ll241** with exactly three unclaimed
numbers: **79, 211 and 212**.

```
ll75-the-greater-yeshua
ll76-the-sky-the-speculation-and-the-test-that-works
ll77-the-king-over-the-children-of-pride
ll78-the-snare-of-the-fear-of-man
   (nothing)
ll80-the-four-warnings-of-a-hardening-heart
```

`#1255` carries the lesson that was meant to fill it:
**`ll79-justice-and-righteousness-travel-together`** — *"A Gospel With a Hole In
It — Why Justice and Righteousness Travel Together"*, anchored on
`Jeremiah 22:16; Matthew 23:23`, with `bigIdea`, `inApp`, `anchor`, `benefits`,
`lesson`, `levels`, `quiz` and `facilitator` all authored.

The existing duplicate check (`living-lessons-numbers-are-unique.test.js`,
written 2026-10-13) catches a number claimed **twice**. It does not catch a
number claimed **never**, which is why this sat unseen: a gap is silent where a
collision is loud.

## 2. #1255 cannot be merged as a file, only mined as a module

Its `living-lessons-class.js` holds **81 modules**; main's holds **238**. The
branch predates two months of catalog growth, so merging the file would delete
157 lessons. The one salvageable unit is the `ll79` module object, carried
forward by hand onto main.

## 3. #1255's description does not match its diff — verified, not suspected

The PR body describes a rich spoken teaching: *"shyness can be pride, and mostly
is"*, Moses in Exodus 4, Saul who *"hid himself among the stuff"*, Babel's
*"let us make us a name"*, James 3:13's *"meekness of wisdom"*. I checked
whether that teaching is in the branch. It is not:

| phrase from the PR body | where it actually appears in the branch |
|---|---|
| `shyness can be pride` | **nowhere in the branch at all** |
| `hid himself among the stuff` | `app/public/bible/kjv/1Samuel.json` only — the corpus, not a lesson |
| `meekness of wisdom` | `app/public/bible/kjv/James.json` only — the corpus, not a lesson |
| `If I honour myself` | nowhere |

So the body describes work the diff does not carry. Whatever that spoken sitting
produced, **this branch is not where it lives**, and draining #1255 would not
capture it. Under the spoken-teachings rule that is the more serious half of
this finding: a teaching described in a pull request body and absent from its
code is a teaching that may never have been built anywhere. It needs its own
search before it can be called captured or lost — and the PR body is the only
record of it that has been found so far.

## What ll79 needs before it can ship, measured

Carrying the module forward is not a copy. Its bands are a third of what today's
floors require, and the youth band does not exist — it predates the four-band
requirement (P60).

| band | words | share of its 4,347-word adult lesson | floor | state |
|---|---|---|---|---|
| child | 763 | 0.176 | 0.50 | short |
| youth | — | — | 0.60 | **absent** |
| teen | 1,542 | 0.355 | 0.60 | short |
| senior | 1,547 | 0.356 | 0.60 | short |

So the work is: author a youth band and raise three others to the floors — on
the order of 2,600 words per band against this lesson's length — then the usual
verse pinning, headings in all five places, three-directions, a proven-to-catch
suite and a decision record.

## Decision and re-review (DR-0075)

**Not shipped in this sitting, and the why is the size, not the merit:** ll79 is
a four-band authoring build comparable to sov39, and this session has already
carried three merges to green (#2135, #2154, #2157). Starting it here risks a
half-authored lesson in the lane rather than a finished one, and a lesson shipped
thin is the exact failure the band floors exist to prevent.

**`re-review: 2026-10-16`** — ll79 authored to the floors and shipped, which also
closes the oldest open drain. The finding in §3 is tracked with it: the spoken
teaching #1255 describes is searched for across the catalogs before #1255 is
closed, so a teaching is never dropped on the strength of a PR body alone.

Two related facts recorded so they are not rediscovered: **65 of 238 Living
Lessons carry three bands rather than four** (child/senior/teen, no youth) —
that is the recorded, shrink-only band debt the coverage gate pays down lesson
by lesson, not a new break; and **ll211 and ll212 are unclaimed** on the same
evidence as ll79, and want the same look.
