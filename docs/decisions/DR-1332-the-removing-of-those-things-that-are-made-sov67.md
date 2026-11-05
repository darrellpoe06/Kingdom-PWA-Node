# DR-1332: The removing of those things that are made — what cannot be patched is taken away, and the part nobody can lend you (sov67)

**Date:** 2026-11-05
**Status:** Accepted
**Tier:** B (a reader-facing lesson in a COLG-facing course; no data, no schema, no money)
**Type:** teaching
**Declared by:** Darrell, by the forward and his one word above the header.
**Area:** `app/src/lib/sovereign-ai-class.js` · `app/src/__tests__/sovereign-ai-sov67-verses.test.js` (new, 55 cases) · `app/src/__tests__/course-band-coverage.test.js` (the shared all-four ratchet, 280 → 281) · `app/src/lib/course-band-coverage-baseline.json` · `app/src/lib/lesson-dates.json` (both generated, never hand-edited)
**Intake:** Gmail lesson-intake lane (DR-0312). Thread `1a164afce3d5ed0b`, one message, forwarded **2026-10-22 17:36:42 UTC** from `dpoe@illinois.edu` to `darrellpoe06@gmail.com`, subject `FW: [Illinois StatusHub] - cPanel: Emergency PHP maintenance, extended - Maintenance Updated`. **His word above the forwarded `From:` header is `Lesson`** — singular, and that word is what this build is judged by rather than the subject line. Read whole in one `get_thread` with `messageFormat: "PLAIN_TEXT"`; nothing summarized, nothing skipped. Labels on intake `UNREAD, CATEGORY_PERSONAL, INBOX` — **no `Label_22`**, so the thread was not yet captured. **WHO TAUGHT (DR-0719): NOBODY.** An institutional maintenance notice is not a recording; no teacher is identified in it, and all five reader places say so.
**Considered, not built:** none — this record builds one lesson from one thread and names no other source thread.
**Pairs with:** **DR-1326** (Word first, and research independently — the correction that governs this build), **DR-0190** (trust but verify: the primary source, the tier, the attribution, §5's note), **DR-1317** (a verse is never spent; overlap is how lessons connect; every lesson stands alone and whole), DR-0610 as DR-1317 fixed its meaning (one teaching is decided by where a lesson LANDS), **DR-1322** (sov66 — the same real-world defect, a different landing), DR-1329 (ll282 — landed mid-build from another session and was read before this landing was settled), DR-0098 (teach the Word, do not debate it), DR-0100 (the three tiers; under-claiming is also a failure), DR-1273 / DR-1311 (the apostrophe and the fabricated-quotation class), DR-0719 (who taught), DR-0733 / DR-0795 (three directions in every band), DR-0734 (the anchor names every verse), DR-0402 (the verse readable without leaving the lesson), DR-1266 (the library ratchet), DR-0692 (the band baseline is regenerated, never hand-merged), DR-0687 (lesson dates), DR-1021 / DR-0644 (the decision-number collision and the ledger resolver), DR-0108 (a refused road is quoted, not paraphrased), DR-0210 (Yahweh in our voice; Jesus the Lamb and Eternal Son), DR-0281 (the Word quoted AND reasoned), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §7 independent verification, §8 provenance and honest uncertainty), DR-0621 (hold the hand of the process)

## Context

A maintenance notice is the dullest document a person receives, and this one carried a teaching four paragraphs below its own headline. The forward is his own university's IT status notice about emergency maintenance to a programming runtime, extended; the headline is the emergency and the repair, and the headline is **not** what was built. What was built is the half of the notice no news digest carried.

**This record's number collided TWICE, which is itself the finding, and the machinery caught both.** DR-1021 is the record that predicted it: it measures the cost of a session moving onto a number another session holds — four renumbers by hand, each one invalidating an already-verified tree — and says plainly that the cause is a single shared pointer line, which is a Governor's call rather than a tooling change.

1. **DR-1329, before a word was written.** The brief assigned it as "confirmed free." Re-running `scripts/claim-decision-number.mjs` first showed it had landed on `origin/main` at **2026-11-05 15:34:21 UTC** (`8ebafe55`, PR #2550, ll282 "The Greater Work") — minutes before the brief was written. **Nothing was written and nothing was self-allocated:** the collision was reported and the number reassigned after an independent re-check. The in-flight check only sees *pushed* branches, so a sibling holding a number without having pushed is invisible, which is exactly why a builder must not self-allocate.
2. **DR-1330, after the whole lesson was built, verified and pushed.** `bba533d56` (PR #2551, a Ways review) landed on DR-1330 during the build. The push succeeded and then `mergeable_state` read `dirty`. **`resolve-ledger-conflicts.mjs` refused by name** — *"two different decisions claim DR-1330 … folding them would delete one decision from the ledger"* — which is DR-0644's refusal doing precisely the job it was given after folding silently deleted a real decision twice on 2026-10-06.
3. **And the refusal's own suggested target was also wrong, which it warned about in the same breath.** It proposed DR-1331 while telling the operator to check that number first, because *"disk cannot see a branch still in flight."* `claim-decision-number.mjs` then reported DR-1331 **held by `origin/ccr-335c2b3f-ttub1k`** and named **DR-1332** as free on disk *and* in flight. The tool's warning was correct and the tool's number was not; the tool that measures in-flight work is the one to obey.

The renumber was then performed by **`scripts/renumber-decision-record.mjs 1330 1332`** rather than by hand — the fix DR-1021 built for this exact friction — which renamed the file and rewrote all four citing files (`INDEX.md`, this course file, this lesson's gate, and the shared band-coverage comment). The pointer was left alone for the resolver, which owns it. Three numbers were consumed to land one record, and the cost DR-1021 named was paid again: a verified tree had to be re-verified after the rename.

### The three sentences the week rests on

The notice's own words, verbatim, and all three are quoted in the lesson:

1. The versions whose support had ended **"will not be getting updates to patch"** the defect **"and therefore cannot be made safe to run."** So they would be **removed**, not mended.
2. There was **"a strong chance that we will remove unsupported"** versions **"today ahead of schedule and with less communication than is desirable."**
3. **"making changes to your code or installed applications is outside of our scope, but we can help troubleshoot to point you in the right direction."**

A window announced for the morning hours ran from 09:00 to 22:00 CDT. And in the middle of it, while no repair yet existed anywhere, they blocked file uploads across both platforms on purpose, then wrote that they had removed the restrictions previously applied.

### Why this is not sov66, proven from where each lands

sov66 (DR-1322) teaches **the same real-world defect**, from a different source — a business digest, thread `1a163a78c1d14d84`, forwarded five hours earlier the same day. So the refusal question was live and was settled the only way DR-1317 permits: by reading where each lesson **lands**, not by comparing verses or headlines.

| | sov66 (DR-1322) | sov67 (this record) |
|---|---|---|
| **its question** | is my protection priced? | what am I standing on that nobody will repair any more? |
| **its finding** | a risk graded low because the ENEMY was judged weak was never graded at all | a thing can be removed because it is OLD, with nobody at fault |
| **its landing** | a **REPRICING** and a **HAND** — unpriced protection, honest grade "not yet measured," repair it yourself this week | an **ENDED SUPPORT** and a **PART THAT CANNOT BE LENT** — removal rather than repair, a published DATE rather than an estimate |
| **its in-app step** | three rows of protections, one repaired by your own hand | three rows of **end-of-support DATES**, one **migrated**, and the thing nobody promised to rewrite for you |

Repair is sov66's remedy. **Here repair is the thing that does not exist.** That is a different teaching, and the automated measure agrees: `one-teaching-one-lesson-guard` reports **0 pairs** across 44 courses and 726 lessons with sov67 present.

**ll282 (DR-1329) was read before this landing was settled**, not assumed distant from its title, because that assumption is exactly what DR-1313 got wrong. It lands on vocation and legacy — the flock at home before the job title, job stress at the threshold. Far from this. It does share three references, and that sharing is recorded rather than removed (below).

## What was measured

Every figure below was read off the tree that holds the lesson, at `origin/main` **`8ebafe55d`** in a fresh worktree, because the first measurement attempt was run in a tree **18 records behind main** and understated the built ground. That error was caught and the measurement redone.

### The clearance probes, both re-run in the fresh tree before a word was written

- `node scripts/lesson-row-shipped-sweep.mjs 1a164afce3d5ed0b` → `unknown 1a164afce3d5ed0b -> no decision record names it`, exit 0.
- `node scripts/claim-decision-number.mjs` → `next free decision number: DR-1332`, **1224 records on disk and 1224 on origin/main, highest DR-1329**, 40 numbers held by unlanded branches, **0 of them at or above DR-1332**.

### The ground, measured across the WHOLE repository

Scope: taught ground only — `app/src/lib` (the lessons) and `docs/decisions` (the records). A reader can reproduce these with `grep -rlF`.

| reference | lessons | records |
|---|---|---|
| **Haggai 2:6**, **Haggai 2:21** | **0** | **0** |
| **Ezra 3:11**, **Ezra 3:12**, **Ezra 3:13** | **0** | **0** |
| **Exodus 12:22**, **Exodus 12:23** | **0** | **0** |
| **Hebrews 12:29** | **0** | — |
| Hebrews 12:26, Hebrews 12:27 | 1 | 1 |
| Matthew 25:8, Matthew 25:9 | 1 | 0 |
| Hebrews 8:13 | 5 | 2 |
| Isaiah 30:13, Isaiah 30:14, Jeremiah 8:20 | 1 | 1 |

**A correction to a claim that would have been wrong.** `git grep` reports Haggai 2:6 in **14** files tree-wide, which looks like built ground and is not: **every one of the fourteen is `app/public/bible/xref/`**, the cross-reference index. Checked rather than assumed, because the unqualified number would have been a false statement in this record.

**Hebrews 12:27 is the hinge, and it earns the place from the source's own words.** *"And this word, Yet once more, signifieth the removing of those things that are shaken, as of things that are made, that those things which cannot be shaken may remain."* The removed category is things that are **MADE** — and the purpose clause makes it a sorting rather than a disaster. Beside it Hebrews 8:13 names the mechanism with no accusation in the sentence: *"Now that which decayeth and waxeth old is ready to vanish away."* Not wicked, not broken. **Old.** And Matthew 25:9 carries the scope limit in the mouths of the people Yahweh calls **wise**: *"Not so; lest there be not enough for us and you: but go ye rather to them that sell, and buy for yourselves."* The oil does not divide, and the honest helper **points** — which is precisely what the notice did.

### Nothing was dropped for a collision, and two readings were refused on the LANDING

**Four shared readings are carried in FULL** and the gate asserts both halves — that they are present and quoted here, and that they really are carried elsewhere — so the overlap is a measurement, never a veto:

| verse | also carried by | what it does HERE |
|---|---|---|
| **Hebrews 8:13** | 5 lessons | the mechanism of the whole week: removal by AGE, with nobody at fault |
| **Isaiah 30:13-14** | ll275 (DR-1315), which lands on deferring a cost onto the next generation | the two speeds — a bulge visible for years, a break "suddenly at an instant" |
| **Jeremiah 8:20** | ll275 | the sentence a household must be able to say: the season closed while we assumed it was open |

**And two readings were refused on the LANDING rather than on the Scripture, which is the distinction DR-1326 praised and DR-1317 exists to protect.** **James 1:22-25** (a repair published is not a repair applied) and **Proverbs 22:3** (the prudent man foreseeth) are absent **because taking them would pull this lesson onto sov66's message**, where both are load-bearing — **not** because either verse is spent. Either is free for any later lesson. The gate asserts the absence *and* asserts that both are load-bearing for sov66, so the reason is machine-readable.

**The sov67/ll282 overlap is three references and is recorded rather than removed:** `Hebrews 12:28`, `Hebrews 1:8`, `John 1:29`. Two are the course's standing DR-0210 confession, which the catalog is supposed to repeat; the third is the unshakable-kingdom verse this lesson closes on. None is either lesson's landing. **The gate originally asserted the two shared nothing — that assertion was wrong, and it was corrected into the measured list rather than the lesson being thinned to satisfy it.**

### Every verse fetched, and the corpus corrected a fabricated quotation four times

Every verse was fetched from `app/public/bible/kjv` by script before it was written, never from memory. **42 anchor references, every one resolving, every one quoted in the adult lesson with its reference beside it** (DR-0402/DR-0734). **289 quoted spans** across every string of the module at any depth; **0** that are neither verbatim corpus text nor one of **15 declared source/refusal spans** listed exhaustively in the gate; **0** unpaired double quotes; **0** occurrences of U+201C or U+201D; **0** occurrences of Yahweh inside a quotation; **0** generic `God`/`GOD`/`LORD` in our own voice; **0** British spellings in our prose in any string; **0** term faults.

**THE CORPUS CAUGHT FOUR FABRICATED QUOTATIONS ON THE FIRST DRAFT**, every one a punctuation substitution that memory supplies and the KJV does not — the DR-1273 / DR-1311 class exactly, and the reason every verse is fetched:

1. **Matthew 25:9** — written `...for us and you."` The corpus reads **`for us and you:`**. The period was fabricated.
2. **Luke 13:8** — written `...and dung it."` The corpus reads **`and dung it:`**.
3. **Ezra 3:13** — truncated at `...the noise of the weeping."` The corpus reads **`the noise of the weeping of the people:`**.
4. **Matthew 25:9** — a span closed early at `go ye rather to them that sell.`, where the verse runs **`go ye rather to them that sell, and buy for yourselves.`**

And **Isaiah 30:14 carries the KJV's own curly apostrophe** — `potters’ vessel`, U+2019 — which is pinned, with the straight-apostrophe form asserted absent from the corpus so a later "tidy-up" cannot pass.

### The four bands, measured and not claimed

Adult prose **3,839 words**, grade **7.28**. Shares: child **0.571** (floor 0.50), youth **0.667**, teen **0.736**, senior **0.980** (floor 0.60). Reading ladder, quotations excluded as the gate does: child **-0.14** < youth **3.02** < teen **4.58** < senior **6.15**, strictly ascending; child far under its 5.0 ceiling, teen under 6.0, senior under 10.0. Worst band-pair overlap **0.183** (senior~adult) against the 0.25 near-copy line. `fourBandFaults` → `[]`; `unnamedBands` → `[]`; `shortBands` → `[]`; `placesMissingDirections` → `[]`. **Twelve numbered movements, contiguous from ONE and in order, in all five reader places.**

**The ladder broke twice and both breaks are recorded rather than smoothed over.** The teen band's first draft came in at **6.29**, over its 6.0 ceiling. The simplification pass then overshot and pushed teen to **4.58**, *below* youth's 4.64 — breaking the ladder from the other side, which is the failure mode sov66's own note warned about. Youth was lowered to **3.02** rather than teen raised back toward its ceiling, because a teen band pressed against its limit is the fragile choice. A separate pass was needed on teen's four tail sections when teen~youth overlap reached **0.248**, a hair under the 0.25 line.

### The gates, and the one shared ratchet that moved

`censusLesson(sov67)` reports **`whole: true`, `missingComponents: []`, `missingVersions: []`** — run before the push. All eight components real: lesson, anchor, bigIdea, quiz (**12** questions), benefits (**15**), talkingPoints (**15**), howToRun (a seventy-five-minute run of show), inApp. **Two declared parables, no testimony.** `quotesTheWord` **true**.

The shared all-four ratchet in `course-band-coverage.test.js` moved **280 → 281**, and `course-band-coverage-baseline.json` was **regenerated with `scripts/course-band-baseline-write.mjs`** (DR-0692: never hand-merged), which reported `total 455 allFour 281 adultOnly 0 still pinned 174`. The movement is **upward only** — total 454→455, allFour 280→281, the sovereign-ai row 66→67 lessons and 45→46 allFour. **No debt grew and the four-band allowlist gained nothing.** `lesson-dates.json` was regenerated with `npm run lesson-dates`: `890 of 890 lessons dated, 0 undated`.

### The independent check, and what it changed

**The forward is a LEAD, never the citation (DR-0190 §1).** The facts were pursued away from it. **Three roads to the primary documents were REFUSED, and the refusals are quoted rather than paraphrased (DR-0108):** `curl https://www.cisa.gov/known-exploited-vulnerabilities-catalog` and `curl https://www.php.net/ChangeLog-8.php` each returned **`curl: (56) CONNECT tunnel failed, response 403`**, as did `w3techs.com`; `WebFetch` on the agency advisory returned **`getaddrinfo ENOTFOUND www.cisa.gov`**. The fourth road, `WebSearch`, opened and returned many independent accounts in agreement — DR-0076 §7.

**Tier 1, DOCUMENTED, and therefore stated plainly rather than hedged:** two numbered defects, **CVE-2026-109618** and **CVE-2026-109619** ("PHP2Shell"), **CVSS v4.0 9.2** — the top band — permitting **unauthenticated remote code execution**; fixed **2026-10-21** in **8.5.12 / 8.4.27 / 8.3.36 / 8.2.35**; added to CISA's **Known Exploited Vulnerabilities** catalog **2026-10-26**; details leaked **2026-10-20** ahead of the coordinated release. **And the fact this lesson turns on: NO fix for 8.1 and earlier, whose support had ended.** That one was checked hardest, because the lesson is false if it is false, and it **held from three independent directions** — the prior session's domain-pinned findings, this session's own independent search (*"PHP 8.1 and older have no official release"*), and the notice's own words that those versions *"cannot be made safe to run."*

**Tier 2, ATTRIBUTED, and it carries its denominator or it is not taught:** the "~70% of the web" figure traces to **W3Techs** and means *sites whose server-side programming language is known* — **69.1%** (Nov 2026), **70.3%** (mid-Aug 2026), and only **64.2%** among the top 1,000,000 sites. Unqualified, "seven in ten of the web" is Tier 3 and **is not taught**. The gate enforces this: any reader-place occurrence of the figure must carry its denominator within its own window.

**WHAT THE CHECKING CHANGED — and it changed UPWARD (DR-0100 §5, under-claiming is also a failure):** the coverage said the flaw went unnoticed for *nearly a decade*. The record reaches back **more than two decades, to PHP 5 in 2004**. The lesson states the corrected age, not the one it was handed.

**Tier 3, UNCHECKED and named so it cannot hide:** this session's search surfaced a third identifier, **CVE-2026-115560**, said to be still unfixed upstream. **It appeared in exactly one source and nothing here rests on it.**

**THE HONEST LIMIT (DR-0076 §8).** The primary hosts were refused from this container, so these facts are **corroborated from several independent hands rather than read off the primary page**, and the lesson says so in its own words in all five reader places. The earlier session's note also records `www.sec.gov`, `efts.sec.gov` and `www.finra.org` refused; none of those bears on any claim here. **`re-review: 2026-11-12`** — re-read the vendor advisory and the agency catalog directly once those hosts are allowed, and re-confirm the end-of-life claim against the maintainers' own changelog.

## Impact

A teaching Darrell sent on **2026-10-22** sat for **14 days** and is now **sov67** in **Sovereign A.I.**, contiguous after sov66. The placement was measured rather than assumed: a programming runtime whose support has ended, and the migration that follows, is squarely this course's subject — *why we build local* — and not devotional, health or project ground.

**The teaching is that what cannot be patched is REMOVED, on a day you did not choose; that the removal is by AGE rather than fault, so nobody is the villain; and that the one who keeps your foundation will patch the foundation but will not rewrite what you built on top of it — that part cannot be lent, and it is due now.** The Word runs the mechanism end to end and frames it as mercy before it frames it as loss: the shaking is *"the removing of those things that are shaken, as of things that are made, **that those things which cannot be shaken may remain**"* (Hebrews 12:27), and the promise it quotes ends not in ruin but in a house **filled with glory** (Haggai 2:7).

**The pastoral center is Ezra 3:11-13, and it is the most honest picture of a migration in Scripture.** The shout at the laying of the second foundation and the weeping of *"ancient men, that had seen the first house"* were so loud together that *"the people could not discern the noise of the shout of joy from the noise of the weeping of the people"* (Ezra 3:13). Yahweh had it written down that way on purpose. The men weeping obstruct nothing and are rebuked by nobody. So the lesson gives both permissions in the same breath: the younger one holding the new plan may not despise the weeping, and the older one at the edge of the hole may **grieve the first house without defending a foundation that cannot carry what is coming**. Grieve it and do not defend it — two separate acts, and most readers have never been told they are allowed both.

**And the close is a Person, not a principle.** Our own house was not merely old, it was ruined, and no patch was ever going to be written for it either. *He did not mail us a notice and point us toward a shop.* He came down the road Himself and did the work in His own body — the Lamb of Yahweh (John 1:29), the Eternal Son of Yahweh (John 3:16; Hebrews 1:8), *"by him all things consist"* (Colossians 1:17). Every version number in the world reaches its appointed end. He does not.

## Decision

**1. The lesson ships as sov67 in Sovereign A.I.**, with 42 anchor references, twelve movements, four authored bands and the facilitator's run of show, and it teaches the ENDED SUPPORT and the PART THAT CANNOT BE LENT rather than sov66's repricing.

**2. The obvious reading was refused and the refusal is recorded.** Read as *an old hole nobody patched*, this notice is sov66's ground, and sov44's and sov47's before it. What is unbuilt is that **repair was never on offer** — and that the notice's own scope sentence draws the Galatians 6:2 / 6:5 line in one breath.

**3. Nothing was dropped for a collision, and the two refusals are on the LANDING.** Hebrews 8:13, Isaiah 30:13-14 and Jeremiah 8:20 are carried in full with their other holders named here. James 1:22-25 and Proverbs 22:3 are refused because they belong to sov66's message, explicitly **not** because a verse can be spent.

**4. No name and no figure reaches the reader.** No school, office, company, product, runtime, agency or survey firm is named in any reader text; the gate measures the absence over every string at any depth, with the single exception of the quoted resolver refusal, which is a verbatim refused road under DR-0108. The primary sources are named **by kind**.

**5. The verification note is a section of the lesson, in all five reader places** — the DR-0190 §5 note, carrying the lead-not-a-citation line, the source by kind, the three tiers held apart, what the checking changed, the quoted refusals and the literal `re-review: 2026-11-12`.

**6. The shared all-four ratchet is bumped from a regenerated baseline, never by hand**, and its comment records both ladder breaks so the next builder inherits the measurement rather than the result.

## Verification

Every number here was read off a run on the tree that holds the lesson; nothing is estimated and nothing is remembered. **Which runs were obtained locally and which are left to CI is stated plainly rather than implied.**

**Green, run from inside `app/`:**

- `sovereign-ai-sov67-verses.test.js` — **55/55**, the new gate.
- `sovereign-ai-sov66-verses.test.js`, `living-lessons-ll275-peace-and-truth-in-my-days.test.js`, `living-lessons-ll282-the-greater-work.test.js` — **188 passed** together with the band-coverage suite. **The neighbour whose verses this lesson shares did NOT go red**, which was the specific risk this build carried.
- `the-library-is-filled-perpetually.test.js`, `living-lessons-research-integrity.test.js`, `word-first-coverage.test.js` — **41 passed** (with the band-coverage failure that the regenerated baseline then resolved).
- `course-band-coverage.test.js` **23/23** and `no-lesson-gate-claims-a-verse-for-itself.test.js` **10/10** after the ratchet bump.
- `talk-together.test.js`, `reading-level-gate.test.js`, `band-differentiation-gate.test.js`, `title-in-narrative-gate.test.js`, `american-spelling.test.js` — **90 passed**.
- `node scripts/lessons-gate-coverage.mjs` → `OK — no new uncited lesson; the baseline holds (shrink-only).`
- `npx vite-node ../scripts/one-teaching-one-lesson-guard.mjs` → **`OK — 44 courses, 726 lessons, 0 pair(s) found, 0 recorded, 0 new.`** This is the independent check that sov67 is not sov66 built twice.
- `npm run lint` — clean.

**NOT run locally, and left to CI's four shards, stated rather than claimed:** the full Vitest suite. The suites above were selected as the ones this change can reach; CI is authoritative for the rest, and **no full local pass is claimed.**

**Proven to catch, on the real artifact rather than a reconstruction.** The gate plants the failure and requires it to be found: a changed word in the hinge (`removing` → `removal`) must not be in the corpus; the hinge smoothed to what memory expects (`as of the things that are made`) must not be in the corpus; a straightened apostrophe (`one another's`) must be absent while the curly form is present; a contiguous claim straddling a chapter break must fail; a band replaced by a reworded sibling must trip the near-copy line; a cross-reference planted in one band alone must be found **and only in that band**; stripping one band's friend line must name that band **while the pooled check stays green** (which is the measurement that justifies DR-0795 counting per band); and every one of nine load-bearing lines is asserted present in all five places and then broken at every site to confirm the guard holding it would fail.

**Proven not to over-reach.** The verbatim sweep declares its 15 non-Scripture spans exhaustively, so it is total rather than selective — anything quoted that is neither corpus nor declared fails. An anti-vacuity case requires the sweep to see **more than 200** quoted spans (289 measured), so an empty scan can never read as a pass, and a second requires the comparison set to hold **more than 60** other lessons.

**Three gate assertions were wrong and were corrected rather than worked around.** `lessonCreatedDay` takes `(courseKey, lessonId)` and was called with one argument, so a null read as a missing date. The ll282 no-shared-verse assertion was false — the two share three references — and became the measured list above. And a bare-share-claim sweep run over *every* string flagged the quiz question that deliberately poses the unqualified figure in order to refuse it; it is now scoped to the five reader places, where the claim would actually reach somebody.

**Three reader-text gaps the gate found, fixed in the lesson rather than by loosening the check:** the child band did not say the notice was **forwarded**, did not carry the corrected age (**2004**), and the senior band's opening carried too few of the title's words to satisfy `namesItsLesson`. All three were real reader-facing defects.

**Honest limits.** The primary advisory hosts are refused from this container, so the Tier 1 facts are corroborated rather than primary-read (`re-review: 2026-11-12`). The gate cannot judge whether a verification note is *true*, only that it is present and carries its parts; that stays human work under DR-0098 and the Governor's review. And `node_modules` is symlinked from the primary checkout, so the local runs above used that tree's installed dependencies rather than a clean install.

---
_Generated by [Claude Code](https://claude.ai/code)_
