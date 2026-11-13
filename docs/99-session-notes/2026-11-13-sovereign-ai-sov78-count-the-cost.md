# Session note — sov78, Count the cost (DR-1468)

**Module id:** `sov78-count-the-cost`
**Course:** Sovereign A.I.: Why We Build Local, week 78
**Decision record:** `docs/decisions/DR-1468-count-the-cost-sov78.md`
**Gmail thread:** `1a17edb6eaedf195` (forwarded 2026-10-27 19:34 UTC, built 2026-11-13)

**Date:** 2026-11-13
**Status:** accepted
**Tier:** A (additive lesson, no production surface change)
**Area:** Sovereign A.I., the lesson lane, verification doctrine
**Principles:** WORD-FIRST, VERIFICATION-DOCTRINE, THREE-TIERS, TEACH-NOT-DEBATE, FOUR-BANDS

---

## Whose word brought this

Darrell forwarded a Morning Brew daily issue out of his university mailbox on **2026-10-27 at
19:34 UTC**, subject `FW: ANT on the march`, and typed **one word** above the forwarded header:
*Lesson*. That word is the commission. The newsletter is the occasion, and the article is not
the foundation of any hour in this course.

**Seventeen days** stood between his word and this build. The record keeps that interval in
every reader place rather than closing it quietly.

### Both witnesses were asked before anything was written (DR-1414 / DR-0610)

| witness | answer |
|---|---|
| the thread's own `labelIds` | `UNREAD, CATEGORY_PERSONAL, INBOX` — no `Lesson-Captured` |
| `scripts/lesson-already-built.mjs --thread 1a17edb6eaedf195` | `verdict: NOTHING FOUND` |

The Gmail search was run with the label **name**, never its id, because `-label:Label_22`
matches nothing and would have produced duplicates. Twenty threads matched; this was the oldest
by date. The subject never says "Lesson" — his sends never do — so the judgment was made on the
body, where his word sits above the forwarded header.

## The Word went first

The hour opens on **Luke 14:28** — *"For which of you, intending to build a tower, sitteth not
down first, and counteth the cost, whether he have sufficient to finish it?"* — and the whole
weight is on one adverb. **First.** Before the ground is broken. The counting is not a report
filed afterward to explain what already happened.

The lesson keeps the ending nobody wants: **Luke 14:32**, the king who sends an ambassage and
desires conditions of peace. An honest count can come back *no*, and that is the count working.
The test for every plan follows from it — if your planning can only ever return *go*, it was a
decision with decoration laid over it.

A prospectus is, in its form, a man sitting down to count out loud. Jesus taught the form before
any exchange on earth required it of anybody. That is why the occasion fits the frame rather
than the frame being bent to the occasion.

### The eight movements

1. **Sitteth not down first, and counteth the cost** — Luke 14:28-32.
2. **The prudent man foreseeth the evil**, and the watchman charged for his silence — Proverbs
   22:3; 27:12; 14:16; Ezekiel 33:6-7; Proverbs 28:13. A company writing down its own danger is
   doing the honorable thing, not the strange thing.
3. **The borrower is servant to the lender** — Proverbs 22:7; 6:1-2; 11:15 — with the
   counterweight kept so it is not a slogan about debt: a vow undertaken is still owed
   (Ecclesiastes 5:5; Deuteronomy 23:21; Psalm 15:4), and Romans 13:8 as the standing aim.
4. **Go to, let us build us a tower** — Genesis 11:4-8, the one project counted well, resourced
   well, skilled and wrong, because the stated aim was a name — against Hebrews 11:10 and
   Psalm 127:1. *In vain* means wasted, not wicked, and it is pointed at this house too.
5. **The ground brought forth plentifully** — Luke 12:16-21; Proverbs 13:11; 1 Timothy 6:9;
   Proverbs 23:5. The accounting was correct; the accountant was audited by another office.
6. **Every way of a man is right in his own eyes** — Deuteronomy 19:15; Proverbs 21:2;
   1 Corinthians 4:4; Isaiah 5:20-21; Jeremiah 17:5. One confident witness establishes nothing.
7. **Who sits as trustee, and who holds the key** — Exodus 18:21; Deuteronomy 16:19;
   Isaiah 22:22; Revelation 3:7; Proverbs 21:1; Daniel 4:35; Daniel 2:21.
8. **Build ye houses, and dwell in them** — Jeremiah 29:5; Micah 4:4; 1 Thessalonians 4:11;
   2 Thessalonians 3:12; Matthew 7:24-27.

A test asserts that **no figure from the newsletter appears above the Word's frame**: the
opening before MOVEMENT ONE is checked against `417`, `16.3`, `fourteen-fold`, `693`, `16.286`,
`100 billion` and `ninety-four`.

## Trust but verify — what was checked, what changed, what was refused

**The primary was NOT read.** `www.sec.gov` refused this session twice, by two different roads:

| road | result |
|---|---|
| `curl` through the egress proxy | `CONNECT tunnel failed, response 403` |
| the fetch tool | `ENOTFOUND www.sec.gov` |

So **not one figure in this lesson rests on a primary-source read**, and that is said in all
five reader places with `re-review: 2026-11-27`. Independent secondary roads were walked
instead. Per the brief, the host was not retried repeatedly and no widening of network access
was requested.

### The five things checking changed

1. **STRONGER, and stated plainly (DR-0100 §5).** The 14-fold rise to about **$16.3 billion** in
   half-year revenue holds by a **second arithmetic road that does not pass through the first**:
   a live account of the filing reports consumption-based revenue of **$13.1 billion as 80% of
   the total**, and 13.1 / 0.80 ≈ **$16.4 billion**. Against the filing's own halves as reported
   elsewhere, **$16.286B against $1.163B**, the multiple is **14.0** exactly. This digest got it
   right — and a *different* digest Darrell forwarded the **same day** under-stated the same rise
   as about 1,200 percent, which this course checked three weeks ago under DR-1457. Under-claiming
   a verified truth is also a failure, so it is said plainly rather than hedged.
2. **BIGGER IN MEANING.** The **$417 billion** is not general vendor debt. Coverage describes it
   as future obligations to pay for **compute** — data centers, the computing equipment inside
   them, and cloud services. The digest's "vendors like data center operators" is true and
   narrower than the thing it names, and compute obligations are far harder to exit.
3. **CORRECTED IN THE DIGEST'S FAVOR.** "Has yet to make a profit" is true and is the careful
   way to say it. The loss figure loose on the internet about the same filing (~$80.7B) is
   almost entirely a **non-cash revaluation** — about $72.39B of it in changed fair value of
   convertible notes and similar instruments, with the **operating loss near $693 million**
   (checked under DR-1457 on this same filing). The digest printed **no loss figure at all**,
   which was the more honest choice, and the lesson says so.
4. **NOT ESTABLISHED.** The **"94 pages"** of risk warnings did **not** survive checking.
   Secondary coverage puts the risk-factor section at roughly **80 to 93 pages** and the sources
   disagree on the total, while one analysis puts the hazard material at nearly a third of the
   whole prospectus. The *shape* holds; the page count does not, and **no page count is taught
   anywhere on the page**. The failed claim is named in every band rather than quietly dropped.
5. **STRONGER, and the finding of the hour.** The self-warning is **real** and more striking
   than the digest's "in an unusual step." Coverage quotes the filing on systems that could
   *take harmful actions independently and at scale*, and on progress running *beyond the
   company's own ability to evaluate and safeguard new models*; one report says the filing allows
   that its safety commitments may come at shareholders' expense. A company wrote its own danger
   into the document whose whole purpose is to attract money. Read through Ezekiel 33:6 that is
   a trumpet blown in the one room where blowing it costs the most — which is why the lesson
   treats the warnings as the honorable part of that document rather than the odd part.

### Tiered, per DR-0100

- **Attributed, never asserted on our own authority:** the up-to-$100-billion raise and the
  comparison to a record listing (the digest itself says *analysts believe* it; a reported
  amended price range conflicts and the original filing left the range blank); the governance
  account (co-founders controlling key decisions, financially disinterested safety trustees
  overseeing board appointments — no direct excerpt was reachable, and one analysis says the
  trust's governing documents are not fully disclosed); and the critics' objection.
- **Not checked at all:** the chatbot-versus-chatbot buy opinion, every market index and share
  price in the issue, and the Microsoft, JetBlue, Brazil, Oxford Street and NBA items. The
  Microsoft buyout share from the same day was checked under DR-1457 at 26.9 percent and is not
  re-litigated here.

**DR-0098 held.** The critics are **named to educate past them by the Word**, never staged as a
co-equal view for the reader to pick between: the lesson says plainly that seating someone with
no financial stake over safety is commended in principle (Exodus 18:21; Deuteronomy 16:19),
whatever a critic urges about shareholder value — and then sets the ceiling over every charter
(Revelation 3:7; Daniel 2:21). Governance is not sovereignty.

## Measurements, not claims

| measure | value | gate |
|---|---|---|
| adult lesson | 3,787 prose words, 29,634 chars, FK 7.81 | — |
| child | 18,316 chars, share **0.540**, FK **1.41** | floor 0.50, ceiling 5.0 |
| youth | 21,232 chars, share **0.651**, FK **2.82** | floor 0.60 |
| teen | 22,020 chars, share **0.628**, FK **5.32** | floor 0.60, ceiling 6.0 |
| senior | 29,362 chars, share **0.949**, FK **8.24** | floor 0.60, ceiling 10.0 |
| ladder | 1.41 < 2.82 < 5.32 < 8.24, monotone | child < youth < teen < senior |
| worst band-pair overlap | **0.094** (youth~teen) | 0.25 near-copy line |
| worst band-to-adult overlap | **0.209** (adult~senior) | 0.25 |
| quoted spans in reader places | **301**, all verbatim, **0 faults** | 23 books of `app/public/bible/kjv` |
| anchor references | **62**, each quoted in a reader place | DR-0734, both directions |
| `fourBandFaults` | `[]` | — |
| catalog | `allFour` 299 → **300**, total 473 → **474**; Sovereign A.I. {77,56} → **{78,57}**; `adultOnly` **0**, `adultRegister` **0** | the debt did not move |

Every verse was **filled from the corpus by `scripts/sov78-fill.mjs`** and none typed. The
generator refuses to splice a module that fails the four-band ladder, so the measurement happens
before the catalog is touched rather than being discovered by a suite afterward.

## The bands failed first, exactly as P60 predicts

The first measured pass:

```
child  share 0.460  fk 1.63   <- under its 0.50 floor
youth  share 0.562  fk 6.96   <- under floor AND harder than teen (ladder inverted)
teen   share 0.547  fk 6.77   <- under floor AND over its 6.0 ceiling
senior share 0.949  fk 8.24
```

Every repair was **authored by hand, never swept by a script on prose (DR-1306)**:

- three new sections written **for** the child, youth and teen readers — the counting exercise,
  the risk page, and what checking made bigger versus what it killed — which raised the shares
  and lowered the reading grades at the same time, because short true sentences do both;
- **28 teen vocabulary swaps**, each read back for sense (`capability advancing past the
  company's own ability` → `what the models can do running past the firm's own means`);
- **59 youth sentences split at their own joints**, each read back and judged to read as prose
  rather than as fragments.

Final: teen landed **5.32**, a **0.68 margin** under its ceiling rather than the 0.04 the first
repair produced — the margin was bought on purpose so a later edit cannot silently flip the
gate.

## My own gate caught five things in my own authored text

Which is the point of a gate. 54 tests, 7 failing on the first run:

1. **A recited `DR-0100` in the youth band.** A decision-record number spoken to a reader.
   Rewritten to *"This house has a name for it. Under-claiming."*
2. **`Revelation` was missing from the swept book list** — the DR-1467 class exactly. Revelation
   3:7 stood quoted in **all five** reader places and was swept by **nothing**. A check narrower
   than its name.
3. The Word-first regex did not allow for the KJV's own `sitteth **not** down first`.
4. The under-claiming check did not allow the senior band's elder register (*"to understate a
   verified truth is as much a failure as to overstate an unverified one"*).
5. `placesMissingDirections` returns **objects**, not strings, so the proven-to-catch case was
   matching against `[object Object]` and would have passed on a broken band. The quiz check
   also read only `q` and `explain`, never the `options` that carry half the teaching.

All five were fixed in the authored text or the gate, and the suite is green at 54/54.

### Four more that CI caught and this file did not — each leaves a gate behind (DR-0239)

The first push was green on `lint + guards` and red on three vitest shards. Every finding was
real and in my own content, and none of them was a flake:

1. **`curriculum gates: FAIL` — `sov78-count-the-cost :: bigIdea :: recites a decision record`.**
   `bigIdea` is read in the app, and it named DR-0100 and DR-1457. My own check for this read
   the adult lesson and the four bands **only** — the same narrowness that left Revelation
   unswept, in the same file, on the same day. Both now say what the record says instead of
   naming it, and the check reads **every string in the module**, with a proven-to-catch case
   that plants a record number in a field that is not a band.
2. **`the-plain-meaning-comes-first` (DR-0521): `surety` used before its plain meaning** in
   `bigIdea`, teen and senior. I had glossed it — *"surety - promising to cover what you do not
   hold"* — and a dash-gloss is not one of the cues the measure accepts, which is correct: the
   cue list holds phrasings a reader genuinely has (`signing for somebody else`, `you owe it
   instead`, `on the hook for`). All four sites, benefit line and quiz question included, now
   carry a real cue **in the same sentence**. The debt counter went 65 → 68 and back to 65.
3. **`lesson-completeness`: `shortOfStories: sovereign-ai: sov78-count-the-cost`.** Both stories
   carried `kind: 'example'`. `storyCount` counts only `parable` and `testimony`, so a lesson
   carrying two written parables measured as carrying **zero**, against `MIN_STORIES` of 2. They
   are `parable` now, and my test asserts the kind **by the census's own rule** rather than by
   counting array entries — "two stories" is only true if the house counts them.
4. **sov66's chapter census recorded `Isaiah 22` as untouched**, and sov78 anchors Isaiah 22:22 —
   the key of the house of David that Revelation 3:7 takes up. Two precedents were in tension
   here. sov66 itself once **moved its own citation** to the Word's other witness rather than
   edit sov65's gate. But sov65's gate claimed every chapter was free, with no way to record a
   share, while **sov66's own gate carries a `SHARED` map for exactly this** — and DR-1317 is
   explicit that a shared foundation is **recorded, never vetoed**, and that no reading is
   dropped for a collision. So Isaiah 22 moved from that file's `FREE` list into its `SHARED`
   map naming `sov78`, with the counts and the test names updated (TWELVE → ELEVEN untouched,
   NINETEEN → TWENTY shared) and the reason written at the line. **Neither lesson's reading was
   thinned, and nothing was skipped or quarantined to get green.**

**What I did differently after that round.** Rather than discover the rest shard by shard at
~12 minutes a round, I ran every suite in the repo that reads the catalog: **68 files importing
`LEARN_CATALOG` (2,119 tests)** and **61 files touching `SOVEREIGN_AI_MODULES` (2,661 tests)**,
all green, plus the curriculum gate, `lesson-dates:check` and the guard chain again. The full
1,921-file suite was deliberately not run locally — CI shards it four ways and that is the gate
that counts.

### Proven to catch, eight ways

- one altered word inside a quoted span;
- the DR-0456 apostrophe class — an ASCII `'` where the corpus has `U+2019`;
- a reordered span of one chapter (Luke 14), which is not contiguous;
- an alteration to **Luke 14:28 scoped to this record** — that verse lives in other lessons, so
  a file-scoped check would pass on somebody else's copy (the DR-1146 lesson in miniature);
- **Yahweh substituted into a quoted verse**, the DR-0076 bright line enforced rather than
  described;
- one band's friend line stripped **alone**, naming that band while `hasAllThree` on the pooled
  module still reads green (DR-0795);
- one teaching thread stripped from one band, failing by name;
- a British spelling in our own prose, while the same word **inside a quote** is left alone.

## Findings left open, with dates

1. **The american-spelling gate gap is wider than it looked.**
   `app/src/__tests__/american-spelling.test.js` reads only `living-lessons-class.js`, so a
   course file's British spelling passes green — the brief warned about this. sov77's own
   version of the check reads **the adult lesson and the four bands only**, and sov77 therefore
   ships **`favourable`** in a story title, in our own voice. This record's check reads **every
   string in the module** — `bigIdea`, `inApp`, `anchor`, `rpe`, `benefits`, `stories`, `quiz`,
   `facilitator` and all five reader places — with quotations removed, so the KJV's `honour`,
   `neighbour`, `favour` and `laboured` are left exactly where the corpus wrote them. sov77's
   prose belongs to another record and a blind sweep of authored prose is forbidden (DR-1306),
   so it is named here rather than changed. **`re-review: 2026-11-27`.**
2. **This clone re-shallowed itself THREE times mid-build.** `.git/shallow` reappeared at
   02:40 and twice more after that, each time making `derive-lesson-dates` report *"this clone
   is shallow, so first commits cannot be seen"* — a false failure that looks exactly like a
   content error. `git fetch --unshallow` restored 2,966 commits each time. Another session is
   sharing this `.git`, which is the likely cause; it is named here because the next builder
   will hit it. **`re-review: 2026-11-27`.**
3. **`one-teaching-one-lesson-guard.mjs` dies on this sandbox's Node 22.23.4** with
   `ERR_IMPORT_ATTRIBUTE_MISSING`, and fails **identically on `origin/main`** at 6765b972d14.
   Confirmed pre-existing, not caused by this branch, and not "fixed" here. It is run under
   `npx vite-node` in CI, where it passes: `OK - 44 courses, 764 lessons, 0 pair(s) found`.
   So the accurate statement is narrower than the brief's: it is broken under plain `node` only,
   and CI never runs it that way.
4. **The blocked primary road.** `www.sec.gov` is unreadable from this session. Every figure
   that depends on it is tiered and dated. **`re-review: 2026-11-27`.**

## What this lesson does not do

It does not tell anybody what to do with a share of stock, and it names no ticker as a
recommendation. The occasion is a filing; the teaching is the count, the obligation, the name
the tower is for, and the foundation no filing can disclose. The close is Jesus — the Lamb of
Yahweh (John 1:29), the Eternal Son of Yahweh whom the Father gave (John 3:16), whose throne is
for ever (Hebrews 1:8), by whom all things consist (Colossians 1:17) — who was counted, paid the
whole cost, and finished it.
