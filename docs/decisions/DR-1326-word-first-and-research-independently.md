# DR-1326: Word first, and research independently — the builder brief never said either, and a lesson's whole landing turned out to be backwards

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** B (the brief every lesson builder is handed, two gates, and a third lesson gate corrected; no product code, no schema, no money — but it decides what a lesson is allowed to teach as fact)
**Type:** correction
**Declared by:** Darrell, 2026-11-05 — **"Lessons are Word first and research independently...!!!!!!!! DRs!!!!!!!!"** — correcting the lesson-intake lane mid-build.
**Area:** `docs/templates/builder-brief.md` (two governing blocks added) · `app/src/__tests__/living-lessons-research-integrity.test.js` (+3 cases, DR-0190 §5 gated for the first time) · `app/src/__tests__/no-lesson-gate-claims-a-verse-for-itself.test.js` (+5 cases, reads assertion bodies) · `app/src/__tests__/living-lessons-ll275-peace-and-truth-in-my-days.test.js` (four exclusivity constructs corrected)
**Considered, not built:** none — this record builds no lesson and names no source thread.
**Pairs with:** **DR-0190** (trust but verify — the rule this finally enforces and the rule the brief omitted), **DR-0282 / DR-0127** (Word-first is a gate, not a report), **DR-0100** (the three tiers; under-claiming is also a failure), **DR-1317** (a verse is never spent), **DR-1323** (the same correction, two gates earlier, whose honest limit this closes), DR-1325 (ll281, the lesson that paid for the finding), DR-1316 (the cost shape: a gate failing in a file the new build never touched), DR-0098 (teach the Word, do not debate it), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 provenance and honest uncertainty), DR-0621 (a flag is where the work starts), DR-0111 (do the work)

## Context

Darrell interrupted the lane with one line: **lessons are Word first, and research independently.** Then: **DRs.**

Both halves were already decided, in his own words, years of records deep:

- **DR-0190**, declared by him 2026-07-20: *"Also do our own separate research on the cited research etc... Trust but verify."* Its §1 is explicit — **find the primary source, not the publication that summarized it.** A source's summary is **a lead, never the citation.**
- **DR-0282 / DR-0127**: Word-first is **a gate that fails the build**, not a census that reports.

**The builder brief that every lesson builder in this lane has been handed names neither.** Measured: `grep -niE "0190|0282|0127|word.first|independ|primary source|trust.but.verify" docs/templates/builder-brief.md` returns **one** hit, and it is incidental (an unrelated mention of "an independent sweep"). No DR-0190. No DR-0282. No instruction to find a primary source.

So the ll281 builder (DR-1325), handed a forwarded business digest, wrote this into its own record **as a virtue**:

> *"No road to the publisher was attempted and none was needed... The teaching stands entirely on the forwarded text in hand plus the KJV corpus on disk."*

That is the forwarder's word, declared sufficient. **It is the same failure shape DR-1323 recorded the day before:** builders faithfully following an instruction that was **mine, not Darrell's.**

## What was measured

Two things, in two directions. **Outward:** every load-bearing factual claim ll281 rests on, checked against the primary record — an agency's own published series and five banks' own quarterly filings — rather than against the digest that summarized them. **Inward:** every exclusivity construct still live in the lesson gates after DR-1323, read out of the files themselves rather than remembered. One grep settled the root cause: the builder brief names neither DR-0190 nor DR-0282.

### The independent check, run against primary sources rather than the digest

Four load-bearing claims carry ll281's teaching. **Three do not survive checking**, and the one its landing turns on is **backwards**.

| ll281 / the digest says | the primary record says | tier (DR-0100) |
|---|---|---|
| *"afterward the borrowing reached the highest level ever recorded"* | **FINRA's own margin-statistics table**: Sep-2026 = **$1,480,054M**. The all-time high is **June 2026, $1,502,072M** — *before* the event. **July fell $84,847M (−5.6%), the largest one-month drop in the series.** On the issue's own date the latest published month was **below** the record, directly after a record unwind | **Tier 3, over-claimed.** False as a present-tense claim |
| *"beat a record for equity trading revenue"* | Goldman Q3 equities **$6.44B, +72% YoY but 13% BELOW its own Q2 record of $7.42B**; Bank of America **$2,510M, ~31% below Q2**. **No bank's release calls its Q3 equities line a record.** The real record is **nine-month cumulative**, ~$67B through 2026-09-30, past all of calendar 2025 | **Tier 3 as a quarterly claim; Tier 2 as a record YEAR** |
| *"three of them taking most of it"* | Goldman $6.44B + Morgan Stanley $5,799M + JPMorgan ~$5.0B = **~$17.2B of a ~$21–22B group total, roughly four-fifths** | **Tier 1 — and SHARPER than the digest's "most"** |
| *"one of them was destroyed... with smaller funds hurt alongside it"* | A **near-collapse and forced unwind** of the public book — the fund sought capital and kept brokers; it was not wound up. And the documented July damage sits at **LARGE** multi-strategy platforms and was **mild**: −3.3%, −2.1%, −1.5%, −1.1%, −0.9%. **No documentation of smaller funds specifically** | **Tier 3 on both "destroyed" and "smaller funds"** |
| *"the pain has largely stayed on the hedge funds' side"* | **No lending bank disclosed a loss** — but that absence was searched under blocked primary access, so it is not a verified absence. The affirmative evidence is **a CEO's public statement** ("would've been fine"), which is self-interested. Meanwhile **the SEC subpoenaed the banks**, **one bank severed the prime-brokerage relationship**, and **the Bank of England had warned in July that hedge-fund equity prime-brokerage balances were at record levels, +~40% year-on-year** | **Tier 2, attributed.** Right about *losses*, wrong about *consequences* |

**And the thing that checked out STRONGER than the lesson's hedging (DR-0100 — under-claiming is also a failure): the lenders' financing business hit a RECORD in the very quarter the borrower nearly died.** Goldman's **equities financing +96% to a record $3.37B**; JPMorgan's Equity Markets **+49%**, prime and derivatives named as the drivers. *The house's cut grew while the player was carried out.* That is firmer ground than the claim ll281 was built on, and it must not be hedged.

**A bonus finding on the same issue, both directions.** The "about seventy percent of the web" statistic **does** trace — to W3Techs, **69.1% (Nov 2026), 70.3% (mid-Aug 2026)** — but of *sites whose server-side language is known*, and only **64.2%** of the top million. It is not a phantom statistic; it is a real one missing its denominator. And *"undetected for nearly a decade"* is **understated**: the flaws reach back to **2004**. The vulnerability itself is **Tier 1 established fact** — two CVEs, CVSS v4.0 **9.2**, unauthenticated RCE, patched **2026-10-21**, on CISA's Known Exploited Vulnerabilities list **2026-10-26**, no fix for the end-of-life branches.

**Honest limit, stated rather than hidden (DR-0076 §8).** The egress proxy **refused CONNECT to `www.sec.gov`, `efts.sec.gov`, `www.finra.org`, `www.goldmansachs.com` and `www.jpmorganchase.com`** (403, `connect_rejected`). The figures above are **primary-document-derived** — domain-pinned extraction with each filing's URL captured — **not primary-document-read.** That is a tier above a news summary and far above the newsletter, and it is not the same as opening the filing. **A blocked road must never read as a verified claim.** `re-review: 2026-11-12` to re-read the five 3Q26 filings and the FINRA table directly once those hosts are allowed; the exact dollar figures are re-confirmed before any of them reaches audience-facing text.

### A third and fourth instance of the class DR-1323 removed, and why its guard could not see them

DR-1323 stripped seven exclusivity assertions out of sov64's and sov65's gates and wrote its own honest limit: *"the guard matches case titles... it does not read assertion bodies, so a gate that enforces exclusivity under an innocent title would pass. I did not measure that class."*

It was measured the next day. **`living-lessons-ll275-peace-and-truth-in-my-days.test.js` carried four of them**, and every one evaded the title matcher:

1. **A frozen census:** ten chapters asserted absent from every other lesson of the course, forever, pinned by `toEqual([])`. Title: *"the ten unshared chapters really are untouched by this course at anchor level."*
2. **A prose census pinned by exact set equality** to four verses — asserting no other lesson in the library may ever quote a fifth. Title: *"THE PROSE CENSUS IS RUN AS A MEASUREMENT."*
3. **A second frozen census**, asserting `2 Chronicles 32` stays free of every other anchor in the course.
4. **The spending rule stated in a failure message:** `` `${v} is spent in sov46` ``, refusing seven verses of 2 Kings 20 and Isaiah 39. Title: *"carries NO verse of 2 Kings 20:12-18 or Isaiah 39:2, which sov46 already teaches."*

**It cost, exactly as DR-1316 predicted.** ll281 stands on **Amos 6:3, Zephaniah 1:12 and Jeremiah 48:11** — its MECHANISM movement, the half of the lesson that says *why* watching does not teach — and **ll275's gate went red in two cases, in a file ll281 never touched.** Under DR-1317 that is the library filling, not a fault.

**And the same file contains the RIGHT pattern**, which is what makes it a clean contrast: its just-weight case refuses seven verses and says so explicitly — *"refused on the LANDING rather than on the Scripture: these verses are absent because taking them would pull this lesson onto that message, not because any verse is spent."* That one is untouched.

## Impact

**A lesson could rest its entire teaching on a forwarded publication's factual claims and pass every gate in the house**, as long as it quoted no percentage. DR-0190 has existed since 2026-07-20 with **only §3 enforced** — a bare statistic needs an attributing verb. §1 (find the primary source) and §5 (carry the verification note) were documentation, and **documentation is not a gate** (DR-0282's whole point, made about the other half of the same sentence Darrell spoke today).

**ll281 is the proof it mattered.** Its Word spine is sound — Daniel 5:22, Jeremiah 3:7-8, Ezekiel 23:11, Zephaniah 3:7, Amos 6, and 1 Corinthians 10:11 as Yahweh's own answer for why His book is full of ruined people. Thirteen of its references appear nowhere else in forty-four courses and 723 lessons. **But the real-world case it hung that truth on says the opposite of what the lesson says it says**, and a Word-truth hung on a false example teaches the reader to distrust both.

**The failure was in the brief, not in the builder.** Four lesson builds in this lane received a brief that never mentioned independent research. That is the DR-1323 shape again, and it is the second time in two days that an instruction of mine, not Darrell's, is the root cause of a defect in his lessons.

## Decision

**1. The brief carries both halves of what he said, verbatim-grounded.** `docs/templates/builder-brief.md` gains **WORD FIRST (DR-0127 / DR-0282)** and **RESEARCH INDEPENDENTLY — TRUST BUT VERIFY (DR-0190)**, the latter in six numbered parts: find the primary source; tier every claim; **a lesson may NOT rest its landing on a claim nobody checked**; carry the §5 note; **do not under-claim either**; and if the proxy blocks a primary host, say so and leave a dated re-review rather than letting a blocked road read as verified.

**2. DR-0190 §5 is gated for the first time.** A lesson whose own text declares it was built from a forwarded publication must carry a verification note. **Measured before shipping (DR-0076 §4):** of 277 Living Lessons modules, **5 declare a forwarded external source** and **3 carry no verification language** — ll238, ll236, ll280. Those three are **named in the gate as dated debt** (`re-review: 2026-11-19`), not silently excused: each needs a read to say whether it repeats an external factual claim at all (ll280 refused every figure in its issue, so its note may be one sentence saying so) or whether a real check is owed. The ratchet blocks the next one.

**3. The exclusivity guard reads assertion bodies, not only titles**, closing DR-1323's own stated limit. It matches the **language of spending** (`is spent in`, `reserved for sov…`, `already spent by`, `may not stand on this verse`) — and deliberately does **not** flag a frozen census by shape, because `toEqual([])` over a computed set is ordinary and correct in a hundred honest places and a matcher guessing at intent would cry wolf (P46).

**4. ll275's four constructs are corrected, each in the way that keeps what was true.** The two censuses become **dated measurements that REPORT their drift** (`console.log`, not `expect`) instead of enforcing emptiness forever; the prose census becomes a **floor, never a ceiling** — the four verses Darrell's correction restored must still be carried and still be named with their neighbour's landing, and others may join them freely; the `2 Chronicles 32` case now proves its real methodological point **by computation** (the two censuses must genuinely disagree *somewhere*) rather than by requiring a chapter to stay free; and the sov46 case **keeps its assertion and loses its reason** — it pins this lesson's chosen scope, and no longer tells the next builder that a verse can be spent.

**5. A lesson gate asserting its OWN scope stays legal.** Only the claim on another lesson's ground, and the language of spending, are refused.

## Verification

**Green, run from inside `app/`:** `living-lessons-ll275-peace-and-truth-in-my-days.test.js` **68/68** (the same count as before — nothing was deleted to get green), `no-lesson-gate-claims-a-verse-for-itself.test.js` **10/10**, `living-lessons-research-integrity.test.js` **5/5**, `word-first-coverage.test.js` **7/7**.

**Proven to catch, on the real artifact rather than a reconstruction.** The body scanner was run against `origin/main`'s copy of ll275's gate: it found **67 assertion messages** and **exactly 1 spending-language hit** — `` `${v} is spent in sov46` ``. So the new half of the guard **would have been red on `main`** and is green after the correction. A second case asserts that the same case's *title* matches none of the five title patterns, which is the measurement that justifies reading bodies at all.

**Proven to catch, on ll281 itself.** ll275's gate was run twice in a worktree: with ll281 absent, **68/68** and the census reports `4 of its 39 references are carried somewhere else`; with ll281's module present, **68/68** and the census reports **`7 of its 39`** — `2 Chronicles 32:26, Amos 6:3, Ecclesiastes 8:11, Haggai 1:2, Isaiah 30:8, Jeremiah 48:11, Zephaniah 1:12` — and the once-unshared census prints `3 of its 10 once-unshared chapters are now shared with a later lesson: Amos 6, Zephaniah 1, Jeremiah 48 — expected, DR-1317.` **That is the exact `4 -> 7` the original failure reported, now passing as a measurement instead of failing as a veto.**

**Proven not to over-reach.** The research gate is given a fabricated lesson declaring a forwarded source with no verification language (caught) and one built from a recording (not asked for a note). The exclusivity guard is given five honest messages — including ll275's corrected scope sentence and `'FREE at anchor level'` — and flags none. Every id on the three-lesson excuse list is asserted to be a real module, so a typo cannot silently excuse everything.

**Honest limits.** The research gate triggers on a lesson **declaring** a forwarded source in its own text; a lesson that leans on external claims without saying where they came from is not caught, and nothing machine-checks whether a verification note is *true*. That stays human work under DR-0098 and the Governor's review. The exclusivity body scan covers `expect(x, 'message')` in `app/src/__tests__`; a message built by a helper function, or anything under `lesson_gates.py` / `band_gates.mjs`, is still unread — the limit DR-1323 left open is narrowed, not closed. `re-review: 2026-12-05`.

## What this does not close

**ll281's own text.** The corrections above are to the machinery and the brief. The lesson's claims are fixed on its own branch under DR-1325, which is where the lesson lives. Its PR does not auto-merge until that lands.

**The three named lessons.** ll238, ll236 and ll280 declare a forwarded source and carry no verification note. `re-review: 2026-11-19`.

**The blocked primary hosts.** `www.sec.gov`, `efts.sec.gov` and `www.finra.org` are refused by the egress proxy, so no lesson in this lane can currently read a filing or an agency series directly. Until they are allowed, every financial or statistical claim in a lesson is at best primary-document-*derived*. `re-review: 2026-11-12`.

---
_Generated by [Claude Code](https://claude.ai/code)_
