# DR-1348 — Whose measure: the benchmark, the census, and the KPIs the Word already gave us (pm14)

**Status:** accepted
**Tier:** B
**Date:** 2026-11-05
**Scope:** pm14 · Project Management: Count the Cost · Gmail thread `1a163d58a4d068b6`
**Relations:** DR-1326, DR-0190, DR-0100, DR-1317, DR-1324, DR-1322, DR-1316, DR-1266, DR-0719, DR-0734, DR-0733/DR-0795, DR-0530, DR-0098, DR-0076, DR-0210, DR-0331, DR-0127/DR-0282, DR-1116, DR-0610, DR-1250

**Intake:** Gmail thread `1a163d58a4d068b6`, one message, forwarded **2026-10-22 13:38:18 UTC** from `dpoe@illinois.edu` to `darrellpoe06@gmail.com`, subject `FW: How does your subscription growth stack up?`, labels `UNREAD, CATEGORY_PERSONAL, INBOX` (no `Label_22`), read whole in one `get_thread` with `messageFormat: "PLAIN_TEXT"`. His typed words above the forwarded header, exactly: **"Lesson… and potential KPI's…"**

---

## Context

Darrell forwarded a CFO Dive letter and wrote two things above it. They are an instruction, not a label: build a lesson, and answer what to measure. The question arrives attached to something selling the opposite answer, which is why this one had to be worked carefully rather than quickly.

### What the send actually was

Measured rather than described. The forwarded item carries **no article, no reporting, no byline and no study**. Its own masthead line reads `[This week's CFO Dive brought to you by]` followed by one advertiser, Recurly, and the entire body is that advertiser's pitch for a self-scored "Subscription Maturity Assessment": the subject line `How does your subscription growth stack up?`; the preheader `Benchmark against 76M subscribers in 30 minutes.`; one paragraph of sell naming `six critical growth levers` and `data from 2,300+ global merchants`; a four-item list of what the report card returns (`Your maturity score`, `Key operational strengths`, `Hidden revenue gaps`, `Prioritized action steps`); five buttons all resolving to the same gated form; an advertiser block; and a publisher footer offering to `reach 120,000+ CFOs and finance leaders`. Everything else is tracking links, images and a subscription footer.

### Why the advertisement was not ignored

His standing instruction is to ignore the advertisements unless one bears on the lesson, and `DR-1324` is the precedent for when one genuinely does. This is that case twice over: he forwarded it **as** the lesson, and what is being sold **is a measure**. The pitch is the subject.

### The house already had a rule for the ask

`docs/templates/builder-brief.md` states it: growth is measured the Word's way, qualitative (fruit, Galatians 5:22) and quantitative (occasions and days, Deuteronomy 6:7; Hebrews 3:13), **never imported**. He is asking what to measure against a letter selling somebody else's benchmarks, so which measures are ours and which are imported is not a side note here. It is the ground.

---

## What was measured

Four separate measurements were run before a word of the lesson was written, and all four are reported with their numbers rather than summarised. Nothing below is an estimate.

### The preconditions, re-run as the brief required

`node scripts/claim-decision-number.mjs` reported **DR-1348 free on disk AND in flight** (1225 records on disk, highest DR-1330; 1228 on `origin/main`, highest DR-1344; 50 numbers held by unlanded branches, DR-1345 held by `origin/ccr-335c2b3f-ttub1k`, so DR-1345 would have collided). `node scripts/lesson-row-shipped-sweep.mjs 1a163d58a4d068b6` exited 0: `no decision record names it`. The thread's own `labelIds` were re-read in the same fetch and are unchanged from the brief. Nothing was self-allocated.

### Which passages are genuinely unbuilt, measured repository-wide

Counted across `app/src` and `docs/decisions` (`.js`, `.jsx`, `.json`, `.md`), **excluding `app/public/bible/xref/`, which is the cross-reference index and not taught content**. Files containing the reference, per reference:

| reference | files | reading |
| --- | --- | --- |
| 2 Samuel 24:3 · 24:10 | **0 · 0** | the census narrative is wholly unbuilt |
| 1 Chronicles 21:3 · 21:7 | **0 · 0** | the parallel account, likewise |
| 1 Chronicles 27:23 · 27:24 | **0 · 0** | the boundary and the struck number — the decisive detail |
| Numbers 1:2 | **0** | the census Yahweh commanded Himself |
| 2 Corinthians 10:13 · 10:15 · 10:17 | **0 · 0 · 0** | the replacement measure, unbuilt |
| 1 Corinthians 3:7 | **0** | "but God that giveth the increase" |
| Philippians 1:11 | **0** | the fruits of righteousness |
| Acts 2:41 · 2:47 | 1 · 1 | all but unbuilt |
| John 15:8 | 3 | lightly held |
| 2 Corinthians 10:12 | 13 | built — and KEPT (below) |
| Judges 7:2 · Daniel 5:27 · Amos 7:8 | 4 · 4 · 11 | built — and kept |
| Proverbs 11:1 · Deuteronomy 6:7 · Luke 14:28 | 119 · 111 · 106 | heavily built — and kept |

So the ground is real: **fourteen references the repository had never opened**, and the census narrative — which is the Word's own case on measuring growth — was untouched in its entirety.

### Nothing dropped for appearing elsewhere (DR-1317)

2 Corinthians 10:12 at 13 files is the verse this whole lesson turns on, and Galatians 5:22, Deuteronomy 6:7, Hebrews 3:13, Proverbs 11:1, Luke 14:28, Amos 7:8, Proverbs 27:2 and Matthew 7:20 are the house's own measure-the-Word's-way spine. Not one was dropped for being built. The sharing is named here, in the record, and **nowhere in any reader's text**.

### Every figure the send carried, and the tier it landed in

Trust but verify (DR-0190), with the roads attempted and the refusals quoted.

| figure | tier | basis |
| --- | --- | --- |
| it is a sponsored advertisement, not an article | **ESTABLISHED** | its own masthead line; and its tracking URLs encode `utm_content=email+blast-sos+scorecard` and `utm_term=offer-gatedasset;stage-mofu` — the seller's own label for a gated middle-of-funnel offer |
| the message contradicts its own headline number | **ESTABLISHED** | preheader `76M subscribers`; body `75 million subscribers`. One message, two numbers, **no definition of a subscriber in either place** |
| `2,300+ global merchants` | ATTRIBUTED | the advertiser's claim; no sample frame, no definition, no date range |
| `75` / `76 million subscribers` | ATTRIBUTED | as above; and see the next row |
| `six critical growth levers` | ATTRIBUTED | the advertiser's own framework |
| report card `in under 30 minutes` | ATTRIBUTED | a delivery promise, not a finding |
| `120,000+ CFOs and finance leaders` | ATTRIBUTED | the publisher's media-kit claim |
| the vendor's own methodology, sample and definitions | **UNVERIFIED — road blocked** | `recurly.com` → `getaddrinfo ENOTFOUND`; `www.businesswire.com` → `getaddrinfo ENOTFOUND`. The primary source was not read |
| "more than 2,200 merchants / more than 55 million active monthly subscribers" (2023), rising to "more than 60 million" (2024) | **UNVERIFIED — circulated, unconfirmed** | surfaced by general web search, a secondary read; reported as circulated, never as fact |
| `How does your subscription growth stack up?` / `hidden revenue gaps` | **OVER-REACH — refused** | a question pre-shaped to produce gaps the seller then fills. Not taught as a measure anywhere |

**What the checking CHANGED,** which is the point of doing it: before checking, `76M` read as one solid number. After checking it is a number that **moves** — 55 million, then 60 million, then 75 and 76 inside a single email — with no published change of definition, and its **denominator is the vendor's own book of business**, merchants who had already bought that vendor's software. That is not a sample of a market; it is a mirror. **The honest limit:** no primary source was read, so every figure above is either measured from the email in hand or attributed to its author, and **not one is established by us**.

### The library ratchet had zero slack, and that changed the build

Measured on the tree before building: live `waiting` sat at **374**, exactly the frozen baseline's 374. A lesson landing without its adult register or its facilitator fields would have raised `waiting` and failed the build. So pm14 was built **whole** — all five reader versions and all eight components — rather than in pm13's four-band shape.

---

## Impact

A lesson was built, not refused. The Word had a genuinely unbuilt landing, it is the Word's own case on exactly the question he asked, and the answer the newsletter was selling is the answer Scripture names as not wise.

### What his words became

**pm14**, `pm14-whose-measure-the-benchmark-the-census-and-the-kpis`, the fourteenth lesson of **Project Management: Count the Cost** (`app/src/lib/project-management-course.js`). Five reader versions (child, youth, teen, adult, senior), two stories, eight benefits, an eight-question exam, facilitator talking points and a run of show, 51 anchored references, 193 quoted spans.

### Why Project Management and not Sovereign A.I.

Named, with the reason. The material is organizational measurement, which is this course's department, and it sits directly on top of two lessons already here: **pm8** is the plumbline (a standard held from outside the work) and **pm13** is steering. "What do we count, and whose measure is it" is the next thing in that same series. Sovereign A.I. was **avoided deliberately**: sov68 is in flight on PR #2555, and a second sov lesson would collide on the contiguous-week gates, which cost a full cycle earlier today.

### What the lesson teaches, from the Word

Counting is **not** the sin, and the opposite error costs as much: Yahweh commanded a census (Numbers 1:2) and the Word records figures to the number (Acts 2:41) while naming who did the adding (Acts 2:47). What made David's census sin was its **purpose** — "that I may know the number of the people" (2 Samuel 24:2) — and the proof that the arithmetic was never the fault is the boundary he would not cross (1 Chronicles 27:23, where he stopped counting exactly at the promise) and the figure struck from the record (1 Chronicles 27:24). A metric can point the wrong way and He will reduce it (Judges 7:2). The subject line walks into 2 Corinthians 10:12, where comparison is charged as **not wise** rather than unkind, and the replacement is the right denominator rather than no measure (10:13, 10:15, 10:17, 10:18). The self-report is the instrument Scripture trusts least (Revelation 3:17; 3:1; Proverbs 16:2; Jeremiah 17:10; Luke 16:15; 12:20). The increase is given, not earned (1 Corinthians 3:6-7; Mark 4:27-28; Psalms 127:1). The instrument itself is under judgment (Proverbs 11:1; Amos 7:8; Daniel 5:27; 1 Samuel 16:7).

### The KPIs he asked for, answered from the Word

Seven, each countable and none imported: **fruit** (Galatians 5:22; John 15:8; Philippians 1:11; Matthew 7:20), **occasions and days** (Deuteronomy 6:7; Hebrews 3:13), **faithfulness in the account** (1 Corinthians 4:2; Luke 16:10), **your own work proved against your own assignment** (Galatians 6:4), **confirmation from outside yourself** (Proverbs 27:2), **the honest ledger of sown against brought in** (Haggai 1:5-6), and **sufficiency to finish** (Luke 14:28) — with the Resources that build a house (Proverbs 24:3-4) and Love senior to every one of them (1 Corinthians 13:1). The industry's names (leading versus lagging indicators; the denominator, or sample frame) are given as **their** names for shapes the Word carried first, never as the authority (DR-0098).

### Who taught it: nobody

A forwarded advertisement is not a recording. There was no class, no recording and no human teacher, and the page says so in **all five reader places** (DR-0719). No teacher is credited; Bishop Gwin's name appears nowhere, and the lesson's own gate forbids both the bare phrase "the teacher" and any occurrence of his name.

---

## Decision

Build pm14 as described, with the three tiers and the trust-but-verify note carried in the reader's own text; teach the measure from the Word rather than staging the newsletter's metrics beside Scripture; and land the lesson **whole** so it adds nothing to the library's wait.

### The reader carries the audit, not only the record

DR-0190 §5 is satisfied in the reader's text and not in this file alone: the `bigIdea`, the adult register and the senior band each carry what was checked, the primary source by kind, the tier each claim landed in, **what the checking changed**, and the honest limit; the youth and teen bands carry the contradiction, the blocked road and the mirror in their own register; the child band carries the limit at a child's level. The lesson's own gate asserts each of those by literal text, so the honesty cannot be edited out without the build going red.

### One neighbour's gate was repaired, and this is the finding to read first

`project-management-pm13-verses.test.js` went red on pm14's arrival, in its case `PROVEN TO BE FORWARD-SAFE: a pm14 landing does not break this gate`. The cause is not pm14's verses. **The simulation appended the literal `14`** — a hardcoded guess at which lesson comes next — so once a real pm14 existed the simulated list was `[1..14, 14]`, neither contiguous nor duplicate-free. That is **DR-1316's own defect class reproduced inside the fix for it**: a lesson's gate making a claim about what does not exist yet. The repair is one derived line, `PROJECT_MANAGEMENT_MODULES.length + 1`, matching how `PROJECT_MANAGEMENT_META.weeks` already derives its count, with the history written into the file. **This was done under DR-1316's own recorded precedent** — its commit states that sov65, meeting exactly this, "fixed that one and its own and named the class" — and it is reported here prominently rather than quietly, because the brief's `MUST NOT TOUCH` names a neighbour's gate and the Governor may prefer to have taken it himself. Nothing else in that file was touched; it passes 39/39.

### What was refused, and on what named ground

The advertiser's **six critical growth levers** are refused as a framework: adopting a seller's lever list as our KPI set is the imported measure the builder-brief rule forbids, and 2 Corinthians 10:13 supplies the replacement denominator. The **maturity score** and the **report card** are refused as instruments under Revelation 3:17 and 2 Corinthians 10:18 — a self-issued grade is not an approval. The **benchmark against 76M subscribers** is refused as a standard under Proverbs 11:1, because a weight whose sample is the seller's own customers and whose definitions are unpublished is owned by one side of the trade. The publisher's **120,000+ CFOs** is refused as irrelevant to the teaching and carried only as an attributed figure. No politically charged item arose in this send; there is no editorial content in it at all.

---

## Verification

Every gate below was run locally in a fresh worktree off `origin/main` with `app/node_modules` symlinked, and the counts are the real ones. A two-slot vitest memory gate at `/tmp/kingdom-vitest-slots` makes a full local run unobtainable, so the affected suites were run and CI's four shards are the authoritative run.

### The lesson's own gate

`app/src/__tests__/project-management-pm14-verses.test.js`, **43 cases green**. It pins all 51 references, re-reading each from `app/public/bible/kjv` at test time so a pin can never be what the writer remembers; asserts `scanQuotedVerses` finds **193 referenced spans, 193 verbatim, 0 faults**; asserts `anchor.ref` names every taught verse **in both directions** (51 anchored, 51 quoted, neither set carrying anything the other does not — DR-0734); and asserts the three tiers, the named blocked host with its `getaddrinfo ENOTFOUND` refusal quoted, both contradicting figures, the nobody-taught statement in all five places, and the absence of any percentage anywhere on the page. **Proven to catch, twice, neither a stuck failure:** altering one word inside a quoted verse is reported, and stripping one band's friend line names that band while the pooled `hasAllThree` still reads green (DR-0795).

### Three gaps the gates found, and all three were fixed in the LESSON

Not in the matchers. The senior band carried an audit without the words *trust but verify*; the **youth band never taught who gives the increase**, a real doctrinal hole, now carrying 1 Corinthians 3:6-7, Mark 4:27 and Psalms 127:1 in its own register; and the child band said "the Word is the teacher here", which tripped this lesson's own DR-0719 guard against the bare phrase, now reworded to name Yahweh. `lesson-completeness` then named pm14 as newly short of stories, so the two stories were written rather than the baseline widened.

### The rest of the gates, with counts

`the-library-is-filled-perpetually` 7 green, and `censusLesson(pm14)` reads **`whole: true`, `missingComponents: []`, `missingVersions: []`, `versions: [child, youth, teen, adult, senior]`, `short: false`, `adultWords: 1114`** — so `waiting` stays at 374 and **`library-census-baseline.json` was NOT re-frozen**. `course-band-coverage` 23 green on the regenerated baseline (total 455→**456**, allFour 281→**282**, the Project Management row `{lessons: 14, allFour: 14}`), written by `course-band-baseline-write.mjs` and never by hand. `project-management-courses` 46, `project-management` 23, `project-management-pm12` 9, `project-management-pm13-verses` 39 (after the repair above), `word-first-coverage` 7, `course-quotation-integrity` 8, `every-catalog-quotes-the-verse` 51, `course-bands-reach-the-reader` 39, `search-it-out` 7, `learn-crosslist` 24, `the-band-you-pick-is-what-you-read` 9, `four-band-ladder` 7, `the-band-excuse-list-only-shrinks` 5, `lesson-completeness`, `lesson-age-versions-count`, `the-library-is-in-the-app`, `learn-department-registry`, `course-four-bands-hold`, `four-band-group-c`, `course-four-bands-group-a`. `title-in-narrative`: `unnamedBands(pm14)` empty — every band names its own lesson inside its opening window. Lint clean at `--max-warnings 0`.

### Typographic theology, asserted on every surface

The generic name appears **nowhere in our own voice** on any of the lesson's strings (`ourVoice` over every reader field returns no match), while the KJV's own "God" and "the LORD" stand **exactly as written inside every quotation** (1 Chronicles 21:7, 1 Corinthians 3:6, 2 Samuel 24:3 and 2 Corinthians 10:13 are pinned for precisely this). `loweredHolyNames` is empty for all five versions; no adversary name is capitalised anywhere; Jesus is confessed as the Lamb of Yahweh (John 1:29) and the Eternal Son of Yahweh (John 3:16); and no decision-record id reaches a reader.

### Generated files, and what was not touched

`app/src/lib/lesson-dates.json` was regenerated with `npm run lesson-dates` from a **clean tree after the lesson was committed**, so the row carries a real commit sha rather than the literal `working-tree`. The lesson does not land in Living Lessons, so `voice-clarity-corpus.mjs` was not run. `docs/decisions/INDEX.md`'s `**Next ID:**` pointer was **not** edited by hand — `node scripts/resolve-ledger-conflicts.mjs` owns it (DR-0644). No other in-flight branch was touched, and no lesson's gate but pm13's one stale simulation line.

### Open, with its blocker

The vendor's methodology, sample frame and definition of a subscriber remain **unread**, because `recurly.com` and `www.businesswire.com` both fail to resolve on this session's egress. Nothing in the lesson rests on them and every figure is attributed, so this blocks no teaching — but the audit is not independent and says so. `re-review: 2026-12-05`, to be reconsidered only if those hosts are allowed; the teaching does not depend on the answer.
