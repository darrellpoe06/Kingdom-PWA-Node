# DR-1300: They called long life a problem — the oldest unbuilt lesson send was a newsletter that filed a nation's hundred-year-olds under old news (L273)

**Date:** 2026-11-03
**Status:** Accepted
**Tier:** B (a reader-facing lesson in a COLG-facing course; no data, no schema, no money)
**Type:** teaching
**Area:** `app/src/lib/living-lessons-class.js`, `app/src/lib/living-lessons-dates.js`, `app/src/__tests__/living-lessons-ll273-they-called-long-life-a-problem.test.js`
**Intake:** Gmail lesson-intake lane (DR-0312). Thread `1a0aab01a0b1746e`, sent 2026-09-16 14:47:38 UTC from dpoe@illinois.edu to darrellpoe06@gmail.com, subject `FW: ☕️ Problematic age gap`. Darrell typed above the forwarded mail: `Lessons.` and then `Ignore ads of course unless they are related to the lessons.`
**Pairs with:** DR-0610 (one teaching, one lesson), DR-1250 / DR-1288 (the sweep asks the ledger twice), DR-0076 (§4 measure don't claim, §8 provenance and honest uncertainty), DR-0100 (speak established fact — and the three tiers), DR-0210 (Yahweh in our voice), DR-0733 / DR-0795 (three directions in every band), DR-0734 (the anchor names every verse), DR-1294 (the previous two lessons in this course)

## Context

The Gmail intake lane was asked for the **oldest genuinely-unbuilt lesson send**, judged by the body and never by the subject, because Darrell forwards a newsletter and types his intake word at the top while the subject stays whatever he forwarded.

Fifty-nine threads matched `{from:darrellpoe06@gmail.com from:dpoe@illinois.edu} Lesson -label:Lesson-Captured newer_than:365d`. Narrowing by date found **eight** threads older than 2026-10-06 and only **two** older than 2026-09-20, which are the two oldest sends in the lane. Both were sent on 2026-09-16 within 41 seconds of each other:

| thread | sent (UTC) | body's intake word | sweep by id | built? |
|---|---|---|---|---|
| `1a0aaaf7d6952b4b` | 14:46:57 | `Lessons.` / `Research first.` | **SHIPPED → DR-1272** | already built |
| `1a0aab01a0b1746e` | 14:47:38 | `Lessons.` / `Ignore ads of course unless they are related to the lessons.` | `unknown` | **this record** |

So the oldest real send is the second by 41 seconds, and it is genuinely unbuilt. Eight further threads were swept by id in the same pass; five more came back `SHIPPED` (DR-1242, DR-1243, DR-1246/DR-1285, DR-1273/DR-1288, DR-1274, DR-1278), which is DR-1250's instrument doing exactly the work it was built for.

**The item that carried a teaching.** The issue held seven or eight pieces and most of them carry none: a Federal Reserve rate decision, a run of world headlines, a Canadian investment pitch, a cybersecurity share-price note, a business-school trivia game. One item did. Under a section heading that read `OLD NEWS`, beneath a title calling the situation a `problematic age gap`, the digest reported that Japan has passed a hundred thousand people over the age of a hundred for the first time in its history — and then wrote that **the surge of centenarians is straining the country's resources.** A nation reached the one outcome every earlier generation prayed for, that its mothers and fathers would live long, and the write-up filed the arrival as a problem. *That framing* is the teaching; the arithmetic is not.

## What was measured

- **The three required clearance probes, all three clear** before a word was written:
  1. `node scripts/lesson-row-shipped-sweep.mjs 1a0aab01a0b1746e` → `unknown  1a0aab01a0b1746e  ->  no decision record names it`, exit 0.
  2. The **DR-1288 subject probe**, `--subject "FW: Problematic age gap"` → `problematic -> 0 record(s), worth 0`; **no record at or above the 0.2 bar**, exit 0.
  3. `get_thread` with `METADATA_ONLY` → `labelIds: ["UNREAD","CATEGORY_PERSONAL","INBOX"]`. **No `Label_22`.** The label on the thread is the lock; the search is only a hint.
- **The source could not be read, and the failure is quoted rather than paraphrased.** Every link in the forwarded mail is a Morning Brew tracking redirect inside a `urldefense.com` wrapper. Two roads were tried: `WebFetch` returned **`getaddrinfo ENOTFOUND links.morningbrew.com`**, and `curl` returned **`HTTP/1.1 403 Forbidden`** with `curl: (56) CONNECT tunnel failed, response 403`. So the only readable text in the whole exercise was the forwarded body. Every figure is carried as the newsletter's own claim, said in the lesson and in **all four bands** to be unchecked, and nothing taught stands on one. (`links.morningbrew.com` would have to be allowed in the session's network settings for a future build to read the article itself.)
- **Anchor ground, measured rather than guessed.** Across the **269** Living Lessons on `origin/main` the department already uses **706 distinct anchor chapters**, so the obvious honour-the-aged corpus is largely spent: measured **SPENT** were Leviticus 19 (5 lessons), Proverbs 16 (19), Proverbs 20 (16), Proverbs 23 (13), Proverbs 17 (4), Psalms 127 (6), Psalms 128, Psalms 92, Ephesians 6 (15), Exodus 20 (11), Mark 7, Matthew 15, 1 Timothy 5, Job 12, Deuteronomy 28, Deuteronomy 32, Titus 2, Malachi 4 (10), Ruth 4, Isaiah 46, Psalms 90, Genesis 1, Genesis 9, Luke 2, Joel 2, Proverbs 31, 1 Samuel 2, John 19, John 1, Hebrews 1. **Seventeen chapters were measured FREE and are the whole spine:** Zechariah 8 (free at verse level for 8:3-8:6; only 8:2, 8:16 and 8:23 are used, in ll151 and ll213), Job 5, Psalms 71, Psalms 113, Deuteronomy 5, 1 Kings 12, 2 Chronicles 10, Numbers 8, Numbers 11, Genesis 47, Genesis 48, Luke 13, Ezekiel 22, Isaiah 3, Lamentations 5, Judges 2, 1 Samuel 12. No existing lesson title in the course teaches this subject; the nearest, ll159 (*We Are All Children of Yahweh — No Matter How Old*), teaches our standing before Him, not the pricing of a long life.
- **The four bands, measured not claimed.** Adult prose **2,590** words; child **1,686** (share 0.65, floor 0.50), youth **1,894** (0.73, floor 0.60), teen **2,400** (0.93), senior **2,687** (1.04). `shortBands` → `[]`. Reading ladder, quotations excluded as the gate does: child **0.6**, youth **4.0**, teen **4.6**, senior **7.3**, adult 5.4 — monotone, and child is well under the 5.0 new-lesson ceiling. Band differentiation worst pair **0.13** against a 0.50 ceiling. `unnamedBands` → `[]`; every band opens on the whole title.
- **Every verse is the corpus on disk.** **221** referenced quoted spans across every string of the module, **0** verbatim faults; 20 numbered movements, contiguous from 1.

## Impact

The oldest real send in the lane sat for **about seven weeks** and is now built as **L273**, in **Living Lessons** (devotional, Word-first), which is where this teaching belongs; it is not a Sovereign A.I. item despite arriving in a tech digest. Two measurement habits are worth carrying forward from it. First, the department is now dense enough that *the obvious anchors are gone* — a builder who assumes a chapter is free will be wrong most of the time, and the chapter census is now cheap to run. Second, a lesson built on a source that cannot be opened is still buildable **if** the limit is stated in every band rather than in a footnote, and if the teaching rests on the framing (which is readable and certain) instead of on figures (which are not).

## Decision

**The lesson is built on the framing and says so.** `ll273-they-called-long-life-a-problem`, titled *They Called Long Life a Problem — the Grey Head, the Empty Cradle, and the City Yahweh Measures by Both*. Its hinge is the one passage in the Word that rates a restored city by who is standing in its streets, and it counts nothing financial: *"Thus saith the LORD of hosts; There shall yet old men and old women dwell in the streets of Jerusalem, and every man with his staff in his hand for very age."* (Zechariah 8:4), and then *"And the streets of the city shall be full of boys and girls playing in the streets thereof."* (Zechariah 8:5). The two counts the digest read as strain are the two Yahweh offers as evidence of health, and He answered the objection about the arithmetic Himself (Zechariah 8:6). The staff in the hand is named as the reason the old man is outside, not a reason to shut him in — and the lesson and every band say that in their own words.

**Twenty movements, every one on free ground:** a long life as a harvest arriving in season (Job 5:26); the assignment inside old age, where a greyheaded man asks to be kept not comfortable but *until* he has handed something over (Psalms 71:18); honour whose stated wage lands on the honourer (Deuteronomy 5:16); a king who forsook the old men and lost ten tribes the same day (1 Kings 12:7-16, with 2 Chronicles 10:7-8 recording the identical turn); seventy elders appointed because a burden was too heavy for one man (Numbers 11:16-17, 25); a retirement at fifty that refuses to stop at the dismissal and keeps the man on the charge (Numbers 8:24-26); a son who nourished his father while running an empire (Genesis 47:7-12); eyes too dim to see that still blessed the grandsons (Genesis 48:10-16); Jesus, the Lamb of Yahweh and the Eternal Son of Yahweh, calling a woman bowed together eighteen years a daughter of Abraham while the ruler of the synagogue reduced her to a question about the day of the week (Luke 13:11-17); a house that sets light by father and mother (Ezekiel 22:7); the symptoms when honour drains out (Isaiah 3:4-5; Lamentations 5:12, 14); the generation that *knew not*, because the handover never happened (Judges 2:7, 10); and the other figure the digest mentioned in passing, a record-low birth rate, set against Psalms 113:9.

**DR-0100's three tiers are held apart in every band, and the gate requires it.** The working half is real — a nation with more pensioners than workers has authentic arithmetic, the Word puts that work on the family first and the house of faith next, and recruiting carers from abroad is honest provision the Word has no quarrel with. The figures are unchecked and labelled unchecked. Only the framing is corrected. **Under-claiming the real cost would be its own failure of truth**, so the correction never becomes a denial of arithmetic.

**Two scopes were deliberately narrowed, and both are corrections to the usual pin rather than exceptions to a rule.** The adversary-capitalisation check and the doubled-word check scan **our authored voice only**, outside double quotes — because Luke 13:16 in `app/public/bible/kjv` reads *"whom satan hath bound"* in lowercase (so the quotation agrees with CLAUDE.md rather than needing an exception) and Job 5:26 genuinely reads *"cometh in in his season"*. CLAUDE.md's bright line is that a quotation is never altered; scoping the checks to our voice is what lets both rules stay strict where they apply.

## Verification

- `app/src/__tests__/living-lessons-ll273-they-called-long-life-a-problem.test.js` — **41 tests, 41 passed**, including anti-vacuity (the sweep asserts at least 200 referenced spans across the module and 180 across the five reader places, so an empty scan cannot read as a pass).
- **A standing gate caught a real defect in this lesson and the lesson was changed, not the baseline.** The full suite's `the-plain-meaning-comes-first` shrink-only check failed on `ll273...senior: actuarial` — the senior band used *actuarial science* without giving its plain meaning first, and the recorded debt would have risen from 65 to 66. The sentence now reads that the image *comes off a farm rather than out of an insurer’s table of costs*, which says the same thing in words a reader already owns. Debt back at 65, the check green, and the senior band's grade moved 7.4 → 7.3. This is the whole point of a shrink-only ratchet: it is not a formality, it found something a human reader would have stumbled on.
- `npm run lint` clean and the **full vitest suite** green, run from inside `app/` in the four disjoint shards CI uses (running vitest from the repo root with `--root app` mis-resolves paths and manufactures failures).
- **Proven to catch — seven breaks, each made on the live strings, run, and restored byte-identical (`cmp` clean after every one):**

  | break | sites | result |
  |---|---|---|
  | one word changed inside a quotation (`staff` → `cane`, Zechariah 8:4) | 6 | **4 failed**, 37 passed |
  | a mid-verse span capitalised at its start (Isaiah 3:5) | 5 | **3 failed**, 38 passed |
  | the youth band's `unchecked` replaced with `confirmed` | 1 | **2 failed**, 39 passed — the per-band check names **youth and only youth** |
  | the senior band's friend line stripped | 1 | **2 failed**, 39 passed — `placesMissingDirections` names **senior and only senior** while the pooled `hasAllThree` still reads green (the DR-0795 shape) |
  | the child band's `A daughter of Abraham` turned back into a category | 1 | **2 failed**, 39 passed |
  | `Yahweh` substituted into a quotation (`Thus saith the LORD of hosts` → `Thus saith Yahweh of hosts`) | 1 | **2 failed**, 39 passed — the bright-line pin and the verbatim sweep both fire |
  | `Proverbs 16:31` added to the anchor, a chapter measured SPENT in 19 lessons | 1 | **2 failed**, 39 passed — the free-ground pin fires |

  Restored: **41 passed** after each.
- The ladder, the shares, the differentiation and the title-in-narrative numbers above are read from the live module by `measureFullness`, `measureLesson`, `measureDifferentiation` and `unnamedBands`, not estimated.
- **Not verified, and stated rather than smoothed over:** the newsletter's figures themselves. The article could not be opened from this environment (`getaddrinfo ENOTFOUND links.morningbrew.com`; `403 Forbidden`), so the count of centenarians, the share who are women, the fifty-six-year run and the quarter-of-a-budget-request are the digest's claims, carried as claims. `re-review: 2026-12-01` — if `links.morningbrew.com` is allowed in the session's network settings by then, read the source and either confirm the figures in this record or strike them from the lesson's prose; the teaching stands either way, because it rests on the framing.
- **The loop closes on the instrument that opened it.** Re-run after this record landed on disk, `node scripts/lesson-row-shipped-sweep.mjs 1a0aab01a0b1746e` reports `SHIPPED  ->  DR-1300` and exits 1, because this record names its thread id in its own Intake line. That is DR-1288’s repair honoured rather than restated: the id question has no hole for this thread, so the next builder handed it is stopped by the strong signal and not left to the subject probe.
- **Not verified:** whether the Gmail thread has been labelled `Lesson-Captured`. `label_thread` needs approval in the session that built this, so the thread id is reported to the coordinator for tagging after the push rather than claimed as done here.

## Note on this record's number — the merge subject on `main` cites the wrong one

**`git log` on `main` is wrong about this work, permanently, and this section is the only place that says so.** The squash commit that landed it reads:

```
L273: they called long life a problem, and the Word measures the city by both ends (DR-1299) (#2507)
```

This record is **DR-1300**, not DR-1299. DR-1299 is *the timeline lives in the Bible* — a different change, by a different builder, landed the same day. The wrong citation came from a mid-build number collision: the commit subject was written before `claim-decision-number.mjs` was re-run, the number moved, and the record was renumbered while the subject was not.

A squashed subject on `main` cannot be corrected without rewriting published history, which is not done here. So the correction lives where a reader can find it. Anyone tracing this lesson back from `git log` lands on `(DR-1299)`, looks up a record about Bible timelines, and is misdirected. **The commit is #2507; the record is DR-1300; the lesson is `ll273-they-called-long-life-a-problem`.** The INDEX row carries the same note.

This is recorded rather than shrugged off, because it is the same class of fault as DR-1302 one layer down: a surface stating something it did not measure, in the ledger's own history. There is no `re-review:` date — it is a permanent residue, and naming it where a reader will meet it is the whole fix.
