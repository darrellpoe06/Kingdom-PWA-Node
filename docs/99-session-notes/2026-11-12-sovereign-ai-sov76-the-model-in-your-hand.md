# 2026-11-12 — sov76, "The model in your hand" (DR-1452)

The narrative behind **DR-1452**. The record is the decision; this is the work.

**Module id:** `sov76-the-model-in-your-hand`
**Course:** Sovereign A.I.: Why We Build Local (76 modules)
**Source:** Gmail thread `1a17e0a2846ca5b7`

## The send, and the one word

A copy of **ByteByteGo** for 2026-10-27 — *How Apple Fits an LLM on Your iPhone* — forwarded out of Darrell's university mailbox at **15:53 UTC** that day, with one word typed above the forwarded header: **`Lesson`**. One word is the whole brief.

The thread holds two messages: the original send to his university address at 15:31 UTC, and his forward to himself at 15:53. Both were read in full before anything was written. Neither carried `Label_22` when this build began, and the thread's own `labelIds` were re-read immediately before the push, because the label is the lock and another session could have written it meanwhile.

**WHO TAUGHT: NOBODY.** A forwarded engineering newsletter is not a recording. No person preached and no teacher is quoted (DR-0719). His typed word is the ask; the article is the occasion only, and all five reader places say so.

**Sixteen days** stood between his word and this build. That is on the record in the big idea, the adult lesson, the teen band and the senior band rather than smoothed, because the lane's own age is part of the honest account of it.

## Word first, and why it is this ground

The brief pointed at *what is near rather than far off* and *a treasure carried rather than borrowed*, and asked for the ground in Scripture's own usage rather than an imported metaphor. It is **Deuteronomy 30:11-14**, and it is not a metaphor at all — Yahweh frames His own word in the language of **distance**, and rules out two distances by name:

> not in heaven, so that none need ascend and bring it down; not beyond the sea, so that none need cross and return with it.

Then He gives the reason, and the reason is the whole hour: **that thou mayest do it.** A word you must send for is a word you cannot obey at the hour obedience is asked. That is why nearness is a design requirement and not a convenience, and it is why the lesson opens there and reaches no engineering figure until the second movement. The gate asserts that order and asserts that no figure from the article appears before the Word does.

The near copy's **keeping place** is named too, and it is a person rather than an archive: Psalm 119:11, Jeremiah 31:33, 2 Corinthians 3:3. The carrying is commanded for the four ordinary places of Deuteronomy 6:6-7.

## The eight movements

1. **Not far off** — Deuteronomy 30:11-14; Jeremiah 23:23; Acts 17:27; Ephesians 2:13; the keeping place (Psalm 119:11; Jeremiah 31:33; 2 Corinthians 3:3; Deuteronomy 11:18; Proverbs 7:3; Deuteronomy 6:6-7; Joshua 1:8; Colossians 3:16).
2. **What the article reported, and what we checked** — the engineering stated fairly, then tiered.
3. **Little upon the earth, but exceeding wise** — Proverbs 30:24-28; Zechariah 4:10; 1 Corinthians 1:27; David refusing unproved armour (1 Samuel 17:39-40); and the loss named on a just weight (Leviticus 19:36).
4. **What hast thou in the house** — 2 Kings 4:2; Exodus 4:2; Mark 6:38.
5. **The bread you do not have to borrow at midnight** — Luke 11:5-8; Proverbs 22:7; Proverbs 10:14; Proverbs 2:1; Matthew 13:52; Matthew 12:35; Matthew 6:21.
6. **One foundation, many gifts** — 1 Corinthians 12:4-6; Ephesians 4:4-6; and the bright line, 1 Corinthians 3:11.
7. **Every small matter they shall judge** — Exodus 18:18, 22, 26; then the boundary (Psalm 139:1-4; 1 Corinthians 2:11; Jeremiah 17:9-10; Psalm 46:1).
8. **Remembrance is an ordinance, and a cache is only its shadow** — Joshua 4:6-7; Deuteronomy 8:2; Psalm 103:2; 2 Peter 1:12-13; John 14:26; 2 Timothy 1:14; Proverbs 4:7.

**Two bright lines are gated in every band, because both comparisons are easy to cheapen.** A shared base model with per-task adapters is the *shape* of 1 Corinthians 12 — but a base model is swapped out next year by the men who made it, and other foundation can no man lay (1 Corinthians 3:11); Jesus is the Lamb of Yahweh and the Eternal Son. And a key-value cache is a faint shadow of a memorial, which is itself a faint shadow of the Comforter — who is a **Person** sent by the Father in the Son's name (John 14:26), not a buffer.

## Trust but verify — the roads, and what the checking CHANGED

**Every primary host refused.** Named exactly, as DR-0076 §8 requires, so a blocked road never reads as a verified claim:

| road | result |
| --- | --- |
| `machinelearning.apple.com` (Apple ML Research) | `getaddrinfo ENOTFOUND` / `curl: (56) CONNECT tunnel failed, response 403` |
| `pr-mlr-shield-prod.apple.com` (its mirror) | `getaddrinfo ENOTFOUND` |
| `arxiv.org` (the 2024 and 2025 tech reports) | `getaddrinfo ENOTFOUND` |
| `9to5mac.com` (secondary coverage) | `getaddrinfo ENOTFOUND` |

`curl -sS "$HTTPS_PROXY/__agentproxy/status"` reported `selective: false`, so this is the session environment's host allow-list rather than a proxy fault. `get_environment` — the first step toward proposing that one read-only host be allowed — was **denied by the user**, so the work was not widened and nothing further was asked. **So no figure in this lesson rests on a primary-source read by this build, and all five reader places say so.** `re-review: 2026-11-26` to walk the Apple roads once the host is reachable.

What remained was an independent search road, which is a different road from the newsletter and was walked on each load-bearing number. The outcome:

**Established, stated plainly (DR-0100 tier 1).** The roughly 3-billion-parameter on-device model. The 2-bit/4-bit mix averaging **3.7 bits per weight** in Apple's 2024 write-up. **2-bit quantization-aware training** with a 4-bit embedding table in the 2025 tech report. A **rank-16, 16-bit adapter** running to tens of megabytes for a 3B model. The June 2026 third generation: a dense ~3B model and a **20-billion sparse** one activating 1 to 4 billion at a time, the whole kept in flash with only the called-for experts loaded. And Private Cloud Compute **extended onto Google Cloud machines with NVIDIA processors**, requirements unchanged, with a published append-only ledger of that hardware.

**What the checking CHANGED — three things.**

1. **The 37.5 per cent was re-framed.** The newsletter reports it as a *result*: "Apple has brought down the KV-cache memory usage by 37.5%." In Apple's own framing it is a **description**: the second block, which is 37.5 per cent of the layers, reuses the first block's keys and values — which is exactly what the article's own 5:3 depth split makes three eighths of. The saving *follows from* the share; it was not separately published as a measurement. The lesson teaches it that way, and the gate asserts both the re-framing and the 5:3 arithmetic.
2. **The gigabyte figures are arithmetic, and were re-derived rather than repeated.** 3e9 × 16 bits = 6e9 bytes ≈ 6 GB. 3e9 × 3.7 bits = 1.3875e9 bytes ≈ 1.39 GB. Both check out; neither is a figure Apple published, and the lesson says so.
3. **Two things the digest dropped were added back (DR-0100: under-claiming is also a failure).** Apple's own 2024 statement that the model goes to **3.5 bits per weight without significant quality loss** — so Apple claimed *more* than the digest passed on. And that the **working notes themselves are held at 8 bits**, a second lever the digest never mentioned.

**Attributed, never asserted on our own authority.** The name **palettization** for the lookup-table scheme, and the **pruning method** behind the sparse model, both of which reach this build only through secondary coverage it could not set against Apple's own pages.

**Not checked at all, and said so.** The Apple Neural Engine performance claims. Any benchmark score. Whether the described cloud boundary holds in practice.

**The publication's own disclaimer is passed on** rather than hidden: it says of itself that it is assembled from publicly shared details and invites correction. That is the right posture, and the lesson carries it.

## Measured, not claimed

Every verse was **filled from `app/public/bible/kjv` by a generator**, never typed (DR-0456). **204 quoted spans** across the five reader places, swept against per-chapter joins of **21 books**, **0 faults**; every double-quoted span anywhere in the module is Scripture, so no person is put in quotation marks (DR-0331).

`fourBandFaults` clean. Adult prose **2,717** words; shares **0.513 / 0.619 / 0.711 / 0.918** against floors 0.50 / 0.60; ladder **child 1.02 < youth 4.76 < teen 5.51 < senior 8.52**, adult 7.29, child under its 5.0 ceiling and teen under 6.0; worst band-pair overlap **0.186** adult~senior against the 0.25 near-copy line.

**The three findings the gates caught, and how each was closed in the prose rather than waived:**

1. **Child share 0.374 and youth share 0.470**, both under their floors on the first draft. Written up by hand — the child band gained the four places of Deuteronomy 6:7, the honest naming of the compression loss on Leviticus 19:36, Jethro's reason, the lay-up-treasure thread and its own what-we-did-not-check paragraph; the youth band gained Acts 17:27, Exodus 18:26, the treasure thread and the flight-mode exercise. No script touched the prose (DR-1306).
2. **The teen band paid the DR-1306 overshoot, from both sides.** First draft **6.85**, over the 6.0 ceiling. The authored splits took it to **3.56** — *below* the youth band at 5.04, inverting the ladder from the other side, which is the fourth build in this course to pay for that exact overshoot. About twenty of those splits were then **rejoined by hand**, each read back and judged to read as prose rather than as fragments, landing **5.51**.
3. **The child band never named his word.** The gate's own provenance check failed by name: `child must name his word`. A child reading only the child band was never told that the whole week came from one typed word. Fixed in the prose, not in the pattern.

## A finding this build did NOT fix, named with its date

**`american-spelling.test.js` scans one file.** The first draft of this lesson carried **34 British spellings** in our own prose — `honors`/`honored` 8, `neighbor` 9, `armor` 6, `center`/`centers` 5, `summarize` and its forms 5, `specializes` 2, `labor` 1 — and the gate passed green on the tree that held them. It passes because `american-spelling.test.js:68` reads exactly one corpus: `app/src/lib/living-lessons-class.js`. Darrell's standard (DR-0530's sibling, 2026-09-20: *"Never use colours... it looks bad from where I'm from looks like spelling errors.... fix it... its on the reader"*) is about **the reader**, and a reader on the Sovereign A.I. course is the same reader.

All 34 were corrected in this lesson's own prose by hand, never in a quoted verse — the KJV's `colours`, `honour`, `neighbour`, `armour` and `saviour` are left exactly as the corpus has them, which is the same bright line the guard's own header gives for not automating the fix (DR-0210). A scan of the final module reports **zero** British forms in our prose, verse text excluded.

**Widening the gate to the other courses is outside this build's one outcome**, so it was not done here rather than done quietly. `re-review: 2026-11-19` — point the scan at the catalog's course files, measure the real count first (DR-0076 §5, characterize before you change), and expect a shrink-only baseline rather than a clean pass.

**Proven to catch** (DR-0076 §3), five ways: one altered word in a quoted span; the DR-0456 U+2019 apostrophe class; a reordered span of the same chapter; a band stripped of one of the seven threads; and — the DR-0795 proof the brief asked for by name — **stripping only the teen band's friend line makes `placesMissingDirections` return exactly `[{place: 'teen', missing: ['friends']}]` while `hasAllThree(module)` still reads `true`**. That is the whole reason the per-band check exists: the pooled check cannot see it.

`TALK ABOUT IT TOGETHER` in the lesson and in all four bands, all three directions, each with the skill and the rhythm (DR-0733 / DR-0795), under the heading the reader's tail folds on (DR-1372).

## Generated, never hand-edited

- `app/src/lib/lesson-dates.json` — `npm run lesson-dates` (926 of 926 dated; the clone had to be un-shallowed first, which the script said plainly rather than writing a wrong date).
- `app/src/lib/course-band-coverage-baseline.json` — `cd app && npx vite-node ../scripts/course-band-baseline-write.mjs`: **total 472, allFour 298, adultOnly 0, adultRegister 0, still pinned 174**. The Sovereign A.I. row reads `{lessons: 76, allFour: 55}`. **The debt did not move.** The pin in `course-band-coverage.test.js` was re-derived from that run, never incremented by hand (DR-0692).
- `infra/nas-voice-lite/fixtures/clarity-corpus.json` — `node scripts/voice-clarity-corpus.mjs --write`.
- `scripts/file-budgets.json` — raised to the **measured** 11,697 lines, the tenth recorded raise on this file. The insertion was done in the file's own native style by a generator writing at the array's indent: **185 insertions, 0 deletions**, never a whole-file prettier run (the DR-1423 finding).

## What this build did not touch

No other lesson, no other course file, no migration, no workflow, the reviewer lens, `scripts/re-review-baseline.json`, `scripts/workflow-budget.json`, and no decision record but DR-1452.
