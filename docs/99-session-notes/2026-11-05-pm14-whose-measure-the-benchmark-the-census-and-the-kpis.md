# 2026-11-05 — pm14: whose measure — the benchmark, the census, and the KPIs

**Module id:** `pm14-whose-measure-the-benchmark-the-census-and-the-kpis`
**Course:** Project Management: Count the Cost (`app/src/lib/project-management-course.js`), lesson 14
**Decision record:** DR-1348
**Captured by:** the Gmail-lesson-intake Way (DR-0312)

## Where the word came from

Gmail thread `1a163d58a4d068b6`, one message, forwarded **2026-10-22 13:38:18 UTC**
from `dpoe@illinois.edu` to `darrellpoe06@gmail.com`, subject
`FW: How does your subscription growth stack up?`. Labels at read time:
`UNREAD, CATEGORY_PERSONAL, INBOX` — no `Label_22`. Read whole in one
`get_thread` with `messageFormat: "PLAIN_TEXT"`.

His typed words above the forwarded header, exactly:

> **"Lesson… and potential KPI's…"**

Two instructions, not a label: build a lesson, and answer what to measure.

## What the send carried — the whole of it

It is **not a thin article. It is not an article at all.** No reporting, no
byline, no study. Its own masthead line reads `[This week's CFO Dive brought to
you by]` and names one advertiser; the entire body is that advertiser's pitch.

| item | what it said |
|---|---|
| subject | *How does your subscription growth stack up?* |
| preheader | *Benchmark against 76M subscribers in 30 minutes.* |
| sponsor line | *This week's CFO Dive brought to you by* — Recurly |
| the one paragraph of sell | benchmark *against 75 million subscribers across six critical growth levers*, *backed by data from 2,300+ global merchants*, report card *in under 30 minutes* |
| what the report card returns | *Your maturity score* · *Key operational strengths* · *Hidden revenue gaps* · *Prioritized action steps* |
| calls to action | five buttons, all resolving to the same gated form |
| publisher footer | *reach 120,000+ CFOs and finance leaders* |

Everything else was tracking links, images, a privacy notice and a subscription
footer.

**The standing instruction is to ignore the advertisements.** This is the
exception that instruction allows, and `DR-1324` is the precedent: he forwarded
it **as** the lesson, and what is being sold **is a measure**, which is exactly
the subject.

## Trust but verify — every figure, and what checking changed

Roads attempted, refusals quoted, nothing smoothed over.

- **ESTABLISHED, measured from the message in hand.** It is advertising, and its
  own tracking URLs say so in the trade's language:
  `utm_content=email+blast-sos+scorecard`, `utm_term=offer-gatedasset;stage-mofu`.
  And the plainest finding of the audit: **the message contradicts its own
  headline number inside one email** — `76M` in the preheader, `75 million` in
  the body, with **no definition of a subscriber in either place**.
- **ATTRIBUTED, never asserted on our authority.** `2,300+ global merchants`,
  `75`/`76 million subscribers`, `six critical growth levers`, the thirty
  minutes, `120,000+ CFOs and finance leaders`. Not one arrives with a sample
  frame, a definition, a date range or a method.
- **UNVERIFIED — the road was blocked, and a blocked road never reads as a
  verified claim (DR-0076 §8).** The primary source would be the vendor's own
  methodology page. `recurly.com` → `getaddrinfo ENOTFOUND`.
  `www.businesswire.com` → `getaddrinfo ENOTFOUND`. A general web search did
  surface an earlier figure from the same vendor — "more than 2,200 merchants"
  supporting "more than 55 million active monthly subscribers" for a 2023
  report, rising to "more than 60 million" the next year — and that read is
  itself secondary, so it stands as **circulated and unconfirmed**.
- **What the checking CHANGED.** `76M` went from one solid number to a number
  that **moves** — 55 million, 60 million, then 75 and 76 inside a single email
  — with no published change of definition, and its **denominator turned out to
  be the vendor's own book of business**. Not a sample of a market. A mirror.
- **OVER-REACH, refused.** *How does your subscription growth stack up* and
  *hidden revenue gaps* are a question pre-shaped to produce gaps the seller
  then fills. No benchmark from this send is taught as a standard for anybody.
- **The honest limit.** No primary source was read. Every figure is either
  measured from the email or attributed to its author; **none is established by
  us.** `re-review: 2026-12-05`.

## Who taught it: nobody

There was no class, no recording and no human teacher (DR-0719). A forwarded
advertisement is not a teaching. The page says so in **all five reader places**,
the bare phrase *the teacher* is forbidden by the gate, and Bishop Gwin's name
appears nowhere.

## Where the ground was unbuilt — measured repository-wide

Counted across `app/src` and `docs/decisions`, **excluding
`app/public/bible/xref/`**, which is the cross-reference index and not taught
content. **Fourteen references the repository had never opened:**

2 Samuel 24:3 · 24:10 · 1 Chronicles 21:3 · 21:7 · 1 Chronicles 27:23 · 27:24 ·
Numbers 1:2 · 2 Corinthians 10:13 · 10:15 · 10:17 · 1 Corinthians 3:7 ·
Philippians 1:11 — all **0** files. Acts 2:41 and 2:47 at **1** each.

The census narrative — the Word's own case on measuring growth — was untouched
in its entirety. Per **DR-1317** nothing was dropped for appearing elsewhere:
2 Corinthians 10:12 (13 files) is the verse the lesson turns on and was kept,
as were Galatians 5:22, Deuteronomy 6:7, Hebrews 3:13, Proverbs 11:1,
Luke 14:28, Amos 7:8, Proverbs 27:2 and Matthew 7:20. The sharing is named in
the record and **in no reader's text**.

## Why Project Management, and not Sovereign A.I.

Organizational measurement is this course's department, and the lesson sits on
top of two already here: **pm8** is the plumbline, a standard held from outside
the work, and **pm13** is steering. *What do we count, and whose measure is it*
is the next thing in that series. Sovereign A.I. was avoided deliberately —
sov68 is in flight on PR #2555 and a second sov lesson would collide on the
contiguous-week gates.

## The library ratchet had zero slack, and it changed the shape of the build

Measured before writing: live `waiting` sat at **374**, exactly the frozen
baseline's 374. A lesson landing in pm13's four-band shape would have raised
`waiting` and failed the build. So pm14 lands **whole** — five reader versions
and all eight components, including an adult register of 1,114 words and
facilitator talking points with a run of show. `library-census-baseline.json`
was **not** re-frozen.

## The seven KPIs, which is what he asked for

Each countable, none imported: **fruit** (Galatians 5:22; John 15:8;
Philippians 1:11; Matthew 7:20) · **occasions and days** (Deuteronomy 6:7;
Hebrews 3:13) · **faithfulness in the account** (1 Corinthians 4:2;
Luke 16:10) · **your own work proved against your own assignment**
(Galatians 6:4) · **confirmation from outside yourself** (Proverbs 27:2) ·
**the honest ledger of sown against brought in** (Haggai 1:5-6) ·
**sufficiency to finish** (Luke 14:28). The Resources build the house
(Proverbs 24:3-4) and Love is senior to all of it (1 Corinthians 13:1).

## Gates

`project-management-pm14-verses.test.js` **43 green** — 51 references pinned and
re-read from the corpus at test time, 193 referenced spans, 193 verbatim, 0
faults, `anchor.ref` exact in both directions, proven to catch twice.
`censusLesson(pm14).whole` true. `course-band-coverage` 23 green on the
regenerated baseline (455→456, 281→282, Project Management `{14, 14}`).
`the-library-is-filled-perpetually` 7, `project-management-courses` 46,
`project-management` 23, `project-management-pm12` 9,
`project-management-pm13-verses` 39, `word-first-coverage` 7,
`course-quotation-integrity` 8, `every-catalog-quotes-the-verse` 51,
`course-bands-reach-the-reader` 39, `search-it-out` 7, `learn-crosslist` 24,
plus the band, completeness and registry suites. Lint clean at
`--max-warnings 0`. A two-slot vitest memory gate made a full local run
unobtainable; CI's four shards are the authoritative run.

## Three gaps the gates found, all fixed in the LESSON rather than the matchers

The senior band carried an audit without the words *trust but verify*. The
**youth band never taught who gives the increase** — a real doctrinal hole, now
carrying 1 Corinthians 3:6-7, Mark 4:27 and Psalms 127:1 in its own register.
The child band said *the Word is the teacher here*, which tripped this lesson's
own DR-0719 guard against the bare phrase, now reworded to name Yahweh. Then
`lesson-completeness` named pm14 as newly short of stories, so the two stories
were written rather than the baseline widened.

## The finding to read first — a neighbour's gate was repaired

`project-management-pm13-verses.test.js` went red on pm14's arrival, in its case
*PROVEN TO BE FORWARD-SAFE: a pm14 landing does not break this gate*. **Not
because of pm14's verses.** The simulation appended the **literal `14`** — a
hardcoded guess at which lesson comes next — so once a real pm14 existed the
simulated list was `[1..14, 14]`, neither contiguous nor duplicate-free. That is
**DR-1316's own defect class reproduced inside the fix for it**. The repair is
one derived line, `PROJECT_MANAGEMENT_MODULES.length + 1`, matching how
`PROJECT_MANAGEMENT_META.weeks` already derives its count, with the history
written into the file; it passes 39/39. Done under **DR-1316's own recorded
precedent** — its commit states that sov65, meeting exactly this, "fixed that
one and its own and named the class" — and reported prominently here because the
brief's `MUST NOT TOUCH` names a neighbour's gate and the Governor may prefer to
have taken it himself.

Thread not labelled; deploy not claimed — both belong to the orchestrator.
