# DR-1122: Every store of His quoted words — not only the ones shaped like a course, and not only the fields a list happened to name

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (one scanner, two repair tools, one new gate, 69 lines of lesson data; no surface, no schema, no money)
**Type:** bug

**Area:** `scripts/quoted-verse-is-the-verse.mjs`, `scripts/quoted-sources.mjs`, the new `scripts/fix-quote-shout.mjs` and `scripts/fix-quote-abbreviation.mjs`, the new gate `app/src/__tests__/every-store-of-his-words.test.js`, and ten lesson/study data modules.

**Answers the re-review in:** DR-0987, which asked *"whether EVERY store of quoted Scripture in the repository is gated against the corpus is a wider question than one drain, and six live corruptions in the one file I happened to open is not an encouraging sample."*
**Principles:** DR-0076 §3 (proven-to-catch) and §4 (measure, don't claim); DR-0545 (His words are His words on every surface — and its decision not to teach the resolver abbreviations); DR-0210 (our voice only, never quoted Scripture); DR-0621 (a flag is where the work starts); DR-1031 (the open capital question, declined); DR-0100 (under-claiming a truth is as much a failure as over-claiming one).

## Context

DR-0987 built the gate that reads all 42 lesson catalogs instead of two, and
left a re-review asking the wider question. The coverage half of that question
had already been answered inside the gate's own header — `quoted-sources.mjs`
derives the catalog list by walking the tree, so a catalog written tomorrow is
gated the day it lands. The number beside it, 247 faults, dated from 2026-10-15,
so it was re-measured rather than quoted: still 247, all 51 cases green, the pins
still describing the building.

Then the wider question was actually asked, and the answer was **no** — in three
separate ways, each one the same shape as the defect before it: an instrument
pointed at a subset and trusted as though it covered the whole.

## What was measured

**1. File scope.** The catalog gate reads the 42 courses and is right about them.
Quoted Scripture also lives in `scriptures.js`, `godhead-study.js`,
`yahweh-by-century.js`, `world-issues-class.js`, `study-space.js`,
`seeing-study.js`, `eternal-algorithms.js` and nine more modules that are not
courses and never were: **16 modules, 1,850 spans, 95 faults that no instrument
in this repository had ever read.** `scriptures.js` alone held 41.

**2. Field scope.** Inside the gated catalogs, the scan asks each module for a
NAMED set of fields — lesson, bigIdea, inApp, the bands, benefits, the quiz, the
talking points. On `living-lessons-class.js` that list reaches **43,054** spans.
A walk of the module's VALUES reaches **46,556**, and **8 faults live in the
3,500-span difference.** This is DR-0545's own defect recurring on the same
mechanism it named: a scope borrowed for a question it was never drawn for.

**3. Reference form.** `SPAN_WITH_REFERENCE` required `)` immediately after the
verse numbers, so `"..." (Philippians 3:12, ESV)` matched **nothing at all** —
**64 quotations stated their translation and were never compared to anything for
that reason alone.** 26 of them claim KJV, a corpus this repository holds. Six
abbreviated references were hiding behind the tag where no fixer could see them.

**Two measurements that corrected me mid-work, both the same mistake.** A raw
source-text scan reported **11,865 faults in `living-lessons-class.js`** where
that catalog's own gate reports **zero**. The span count was identical both ways
(46,556); every judgement about the words was wrong, because a regex over source
cannot tell a quotation mark inside a JS string from the string's own delimiter —
`lesson: "he said \"Consider your ways\" (Haggai 1:5)"` yields a span ending in a
stray backslash. I had already written a 15,227-fault figure into my own notes
before checking it against a number I knew. The words are now judged by scanning
**values** after import, never source text. Separately, my first probe for the
new gate cited Haggai 1:5 against *"Consider your ways"* on the strength of a
sentence in DR-0545; the corpus says **both** 1:5 and 1:7 carry that phrase, so
it was no fault, and the case was passing on nothing until it was run.

**A decision I began to violate before reading the record.** The abbreviations
were going to be fixed by teaching `bookFile` to resolve a prefix. DR-0545 had
already refused exactly that: *"Teaching bookFile that 'Phil' means Philippians
is a place a wrong book can hide — and 'Phil' is genuinely ambiguous with
Philemon."* The prefix resolver was abandoned and the decided way followed.

## Decision

**A second, wider gate — not a widening of the first.** DR-0545's precedent, on
this same question, is *"a second, wider scope rather than widening the first."*
`every-store-of-his-words.test.js` walks the VALUES of every data module that
holds a quotation beside a reference, with the list DERIVED by
`modulesWithSpans()` rather than kept by hand — because a hand-kept list is what
failed in DR-0545 and again in DR-0987, and twice is a pattern. The catalogs'
field-scoped gate is left as it is; it still answers a question of its own.

**Faults and `uncheckable` are counted apart, and that is the honest part.**
SCRIPTURE-REFERENCE-STANDARD puts ESV first. **38 quotations are tagged ESV** —
faithfully, as far as anything here can tell — and are **not verifiable**,
because the only corpora on disk are `kjv` and `web`. Measuring them against the
KJV and calling the difference a fault would manufacture 38 corruptions out of
sound work; passing them in silence would claim a verification that never
happened. They are pinned as `uncheckable`: named, held to a number, counted as
neither verified nor at fault.

**The shout is restored where the corpus settles it alone, and declined where it
does not.** His text does not shout, so an ALL-CAPS word inside a span quoted as
Scripture is never the text — the same reasoning that closed the apostrophe in
DR-1030. `fix-quote-shout.mjs` restores the verse's own casing at **50 sites**,
and only where that single change leaves the span carried by the cited verse.
**15 are declined by design**: Numbers 1:3 reads *"From twenty years old"*, so
our *"from TWENTY years old"* is a lowered capital as well as a shout, and
rewriting it would swap one fault class for another and report progress that is
not progress.

**Every abbreviation beside a quotation is written out — 55 of them, 26 distinct
forms, all now at zero.** 46 by `fix-quote-abbreviation.mjs`, which rewrites a
book name only when it is the prefix of EXACTLY ONE book the corpus holds and
**refuses to guess otherwise**; 9 settled by reading the quotation, which is the
part a tool is not entitled to do (`Phil 2:6-7` is Philippians by the kenosis
passage it quotes, and Philemon has one chapter).

## Impact

**What this buys.** 16 stores of His quoted words enter the checking for the
first time. The 3,500-span field-scope hole inside the catalogs is closed. 64
translation-tagged quotations become visible to the instrument, of which 26 are
now genuinely checked against a corpus we hold. 50 shouts out of His words, 55
references written out — and an abbreviated reference is not an untidiness, it is
a span that was **never compared to a verse at all**, which is why two of
`sound-board-class.js`'s three pinned faults evaporated the moment its references
could be read: both quotations were the verse exactly.

**The debt, in the open.** The catalog gate's pins fall **247 → 202**. The new
gate pins **322 faults across 58 modules and 60,955 spans**, plus 38
uncheckable. That 322 is larger than 202 because it is measuring more, not
because anything got worse; the two numbers answer different questions and both
are now true. 120 of the 322 are in `made-in-time-course.js` and 41 in
`scriptures.js`.

**What this does not do.**

- **It does not reach a quotation written into a component body.** 8 referenced
  spans live in `.jsx` files (`BusMinistry`, `Messages`, `MinistryOps`,
  `DirectMessages`, one in a `Pulpit` comment); a value walk cannot see a string
  inside a function, and a source scan cannot judge words reliably — the 11,865
  measured above is why. The gate does not pretend to cover them.
  **`re-review: 2026-12-20`** — whether a JSX-aware scan can judge those 8 spans
  without the escaping defect, or whether they should move into data.
- **It does not gate a quotation whose reference sits in a separate element.**
  `Pulpit.jsx` renders Nehemiah 8:8 verbatim with its reference in a `<footer>`;
  no `"..." (Book C:V)` shape exists, so no instrument here sees it. Named, not
  counted as covered.
- **It does not read comments.** 22 referenced spans sit in `//` and block
  comments — a previous session's note beside a half-remembered phrase. No reader
  meets them, and rewriting another session's working note to make a gate green
  is not mine to do.
- **It does not settle the open capital question.** DR-1031 declined it and it
  stays declined; all 36 of `historical-research-course.js` are that one class.
- **It does not acquire an ESV text.** Whether the repository should hold the
  corpus its own standard puts first is a licensing and product question for the
  Governor, not a gate's. **`re-review: 2026-12-20`** — with the 38 uncheckable
  spans as the measured cost of not holding it.
- **It does not decide whether the untagged spans in `eternal-algorithms.js`
  should carry a tag.** 19 of its faults are untagged spans the scanner reads as
  KJV claims because nothing says otherwise, while the file quotes ESV
  throughout. That is an authoring question, surfaced here rather than answered.
- **13 faults are exactly the WEB text at their own reference** — His words
  faithfully, in a translation this repository ships, counted as faults because
  the checker only consults `kjv` unless told otherwise. Teaching it to accept a
  second corpus would change the meaning of 42 existing pins, so it is measured
  here and left for its own record. **`re-review: 2026-12-20`**.

## Verification

`app/src/__tests__/every-store-of-his-words.test.js`, **163 cases**; the three
existing quotation gates still green beside it — **234 passing in total** across
the four. `npm run lint` exit 0. `npm run verify:gates` exit 0.

Measured: 58 modules, 60,955 spans, 322 faults, 38 uncheckable. The derived list
is asserted against what the file imports in both directions, and no pin may
outlive the file it names.

**Proven to catch, and the halves catch separately — a single reverted thing
proving a single red tells you less:**

| reverted | cases that go red |
| --- | --- |
| the DATA only (tools + gate kept) | **13** — 10 in the new gate (the abbreviation zero rule, the shout pin, and the pins for eternal-algorithms, made-in-time, scriptures, seeing-study, sound-board, sovereign-ai, third-witness, world-issues) and 3 in the catalogs' own gate |
| the TAG in the pattern only (data kept) | **8** — the three uncheckable pins, eternal-algorithms' fault pin, the tagged-span-is-seen case, the KJV-tagged-passes case, the ESV-is-uncheckable case, and the tool's keeps-the-tag case |

Seven cases demonstrate the misses rather than describe them. The strongest
asserts **both directions at once**: a fault planted in a field the list does not
name is reported by the value walk AND reported by nothing in the field scan —
the miss this change closes, asserted rather than claimed. One measurement pins
that the value walk genuinely reaches further than the field list, so the
coverage cannot silently collapse back while the gate stays green.

**The two tools' REFUSALS carry their own cases**, because a gate can prove a
repair happened and cannot prove a tool declined one — a tool that quietly
rewrote more than its rule allows would leave every gate green and His words
altered. `fix-quote-shout` is held to leaving Numbers 1:3 alone and to never
touching the KJV's own small caps; `fix-quote-abbreviation` is held to refusing
`Phil` with both candidates named.
