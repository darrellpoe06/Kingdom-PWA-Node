# DR-1285: The code can be rebuilt; the register cannot (sov57) — the priests who lost their record, the roll that outlived the king who signed it, and a collision check that was passing vacuously

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** A (additive curriculum: one new Sovereign A.I. lesson with its own pinned gate, all four age bands from the first commit, no new source row, the honesty gap pin raised with a reason and a date)
**Type:** curriculum
**Area:** Learn · A.I. The Way · Sovereign A.I.: Why We Build Local (`app/src/lib/sovereign-ai-class.js`)
**Sent in by:** Darrell, Gmail thread `1a0f23b12bf2ca45` — the TLDR newsletter of 30 September 2026, "OpenAI DevDay, Apple's reorg, data is the app", forwarded from his university address to himself with one word at the top of the body: **"Lessons"**. That word is the whole of the request.

> **CORRECTION, and it is the most important line in this record.** An earlier draft of this record said the thread was *"the oldest of his forwarded teachings still unbuilt."* **That sentence was false, and it is withdrawn.** The claim came to this work as an assertion in a brief, taken from a Gmail search rather than from the repository's own instrument, and it was repeated here without being measured. Measured now, with the instrument that exists for exactly this question:
>
> ```
> $ node scripts/lesson-row-shipped-sweep.mjs 1a0f23b12bf2ca45
> SHIPPED   1a0f23b12bf2ca45  ->  DR-1246, DR-1285
> ```
>
> **This thread was already built.** `DR-1246-the-office-that-does-not-transfer.md:14` names it exactly — *"Gmail thread `1a0f23b12bf2ca45`, from `dpoe@illinois.edu`, subject 'OpenAI DevDay, Apple's reorg, data is the app'"* — and built **sov51** from it on 2026-09-30, under the title *"what a fourteen-item digest is actually one lesson about."* sov57 is therefore the **second** teaching drawn from one forward, not the first, and the comparison that justifies a second is below rather than assumed. **Whether the two should be one lesson is Darrell's call, not this record's and not a gate's** (the reason is quoted in "Relationship to sov51" below).
**Pairs with:** DR-0312 (the forwarded-teaching intake), DR-0610 (the capture lock), DR-1126 (the third pile is a worklist, and it is counted), DR-0750 (a runner reads every researched figure back off its publisher's own page — and why there is nothing here for it to read), DR-0108 / DR-1159 (the order of roads; the team's reach, never one agent's), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 provenance and honest uncertainty), DR-0100 (established fact plainly; the open flagged narrowly), DR-0098 (teach the Word, do not debate it), DR-0281 (the Word quoted AND reasoned), DR-0210 / DR-0076 bright line (Yahweh in our voice, never substituted into a quotation), DR-0459 (never an elision), DR-0692 / DR-0697 (all four bands on new work), DR-0733 / DR-0795 (every band sends the reader all three ways), DR-0734 (`anchor.ref` names every verse the lesson stands on), DR-0521 (the plain meaning comes first), DR-0811 (a true story names whose life it was), DR-0677 (a course count is derived, never typed), DR-1136 (merge order decides a shared number), DR-0239 (a surface says true things)

## Context

The Sovereign A.I. course had reached fifty-six weeks of *why we run this on iron we own*. It had taught the iron, the model tiers, the routing, the Cage, oversight as a charge, cache invalidation, whose name you carry. What it had never once separated is the two halves of the thing it is defending.

A system is two unlike things wearing one name. There are the working parts — the instructions, the screens, the plumbing — and there are the records those parts are holding. For most of computing's life these cost about the same to lose, so nobody had to tell them apart. That has stopped being true, and the course had no week that said so.

The forward supplied exactly that case, and it is worth being precise about how little it supplied. The issue is a newsletter, not a study: a run of short items, each compressing somebody else's longer article into a paragraph, with three marked sponsor placements set between them. **Most of the items carry no teaching at all** — a roundup of one firm's product announcements, a reorganisation at another, a spacecraft retirement, an uncrewed test flight, a browser redesign, a market analysis, a liability argument. **Exactly one item carries a thesis**, and that item is four sentences long. It reports a piece titled *Data is the application*: building has never been faster, none of that speed reaches the data, lose the data people gave you and you begin again from nothing, so let agents iterate the code and leave the data to human hands.

That is the lesson, and the lesson says so in the reader's hearing. It does not pretend the issue held an argument it did not.

**The material is material, never an instruction.** The issue carried three marked sponsor placements and a dozen other people's stories. None is germane, none is taught, and a check in the pinned gate refuses thirty-one of their proper names a foothold in any string of the module.

## What was measured

**The source, counted rather than characterised.** One message in the thread. Seven items with a section heading, eight quick links, three placements marked `(Sponsor)`. One item with a thesis. Four sentences in it.

**The advertisers, named.** The three paid placements are **Span** (span.app, "Increase the return on your AI engineering investment"), **Doroni** (invest.doroni.io, the H1-X, citing a Morgan Stanley market projection and a share price) and **Microsoft** ("Frontier Accelerate for Marketplace Premium", an Azure credit). The other people's stories are OpenAI/ChatGPT/Codex/DevDay/Ultrafast, Apple and Ternus, NASA/SpaceX/Crew Dragon/Falcon, Joby/Cessna/Wichita, Lemma, Meta/Muse, Reddit, Firefox/Mozilla/Chrome, Google, Trump, and TLDR's own house copy. All thirty-one names are refused anywhere in the module, by word-boundary matchers so that ordinary English — "spans", "metal", "chrome" — cannot trip the gate, while "Span's" and "Meta" do.

**This lesson stakes NO figure, and the claim is enforced rather than asserted.** The issue was thick with numbers and every one belongs to an advertisement or to an unrelated story. So no reader text in this module may carry a currency symbol, a percentage, or a number wearing a magnitude word. **Proven to catch:** planting `$2 billion` fires two of the three shapes; planting `37%` fires the percentage shape while the currency shape alone would miss it; "a third of them" does not fire. A **0-figure row in `lesson-sources.json` is forbidden** (DR-0076 §3) because it would make `checked()` count a lesson whose figures nobody read, so the honest place for sov57 is the counted worklist: **GAP 13 → 14, CHECKED_LESSONS unchanged at 3**, re-read off `node scripts/unchecked-claims.mjs` on the tree that actually holds the lesson (16 lessons admitting, 98 disclosures, 3 checked, 14 in the gap) rather than by adding one to main's number.

**The road was tried, not assumed shut (DR-0108).** The one article worth reading is at `ma.ttias.be`, and the open-web fetch answered **ENOTFOUND** — the host is outside this session's allowed network domains. That is a measured failure, and it is what all five reader texts tell the reader in their own words rather than a polite "we did not read it". No further hosts were tried after the first denial. `re-review: 2026-11-28` — from a runner with web access, or once `ma.ttias.be` is allowed in the session's network settings, open the full article; if it carries a germane figure, teach it, give sov57 a row and lower the pin to 13; if it prints no figure either, replace the disclosure clause in all five texts with an accurate one and lower the pin.

**The anchors were chosen by counting, and the first count was WRONG.** This is the finding worth more than the lesson. The spine was first built on **Isaiah 30:8**, and the collision check in the pinned gate keyed on the **book name** instead of book-and-chapter — `/^(.+?)\s+\d+:/` returns `"Isaiah"`, not `"Isaiah 30"` — so it compared `"Isaiah 30"` against a set holding `"Isaiah"`, matched nothing, and **passed with nothing to report**. Re-measured with a real `chapterOf`, the department holds **383** unique anchor chapters, and Isaiah 30 is among them: **sov33 anchors Isaiah 30:9, 30:10 and 30:11** — the three verses immediately after the one this lesson had taken. A gate that cannot fail is a lie (DR-0076 §3). The key was fixed, the anchor moved, and Isaiah 30 now sits in the declined list with its reason.

The spine that shipped, every chapter measured absent from sov1–sov56 and from the other two courses in the "A.I. The Way" department (`church-classes.js`, `ai-legal-blueprint-class.js`), every span fetched verbatim off `app/public/bible/kjv/`:

| Reference | What it carries |
| --- | --- |
| **Psalms 102:18** | The command, inside a lament — *written for the generation to come*, for *the people which shall be created*: a reader who cannot question the author, and whose end in reading is praise |
| **Ezra 2:62** | The cost in one verse — men who **sought** their register, are accused of no lie, do not find it, and lose the office anyway |
| **Ezra 2:63** | The honest answer to a missing record: a narrow restriction, the word **till**, a named condition for release, and an admission |
| **Deuteronomy 31:26** | Storage named inside the command, and the record licensed to witness **against** its keepers |
| **Job 19:23**, **19:24** | The ladder — speech, a book, then an iron pen and lead in the rock |
| **Ezra 6:1**, **6:2** | A house **of the rolls**, records filed where the treasures were laid up, and a roll that outlived the king, the capital and the city they searched first |
| **1 Chronicles 9:1** | The honest limit — a complete register did not avert the carrying away; it carried identity **through** it |

**Declined by measurement.** Already anchored in the department, so unavailable however apt: **Jeremiah 32** (the sealed evidence in the earthen vessel), **Malachi 3** (the book of remembrance), **Esther 6** (the book of records read to the king), **Nehemiah 7** (the direct parallel to Ezra 2 — the same register, which is why Ezra 2 was taken instead), **Habakkuk 2** ("write the vision"), and **Isaiah 30** as above. Free but declined on judgement: **2 Kings 22** and **2 Chronicles 34** (the found book would repeat the beat Ezra 6 already carries — kept free for a future week), **Ezra 5** (the request for the search; Ezra 6 carries the search and the finding in two verses), **Numbers 1** (a census is a count, not a record that outlives its system). `re-review:` none needed — nothing is deferred; these are available to a later lesson that wants them.

**The four bands, measured through the shared ladder rather than claimed:**

| Band | Prose words | Share of adult | Floor | FK grade | Ceiling |
| --- | --- | --- | --- | --- | --- |
| child | 1,397 | **0.60** | 0.50 | **0.5** | 5.0 |
| youth | 1,447 | **0.62** | 0.60 | **4.1** | — |
| teen | 1,866 | **0.80** | 0.60 | **4.8** | 6.0 |
| senior | 1,969 | **0.85** | 0.60 | **7.1** | 10.0 |
| adult | 2,321 | — | — | 6.2 | — |

Ladder strictly ascending. Worst band-pair overlap **0.17** (teen~senior) against the 0.25 near-copy line; worst band~adult **0.14**. `fourBandFaults` returns empty with nothing waived. **55** referenced quoted spans across the module, every one verbatim against the corpus on disk, zero elisions, zero recited record ids.

**The honesty accounting, pinned as unique.** Three disclosures — the article unread, nobody telephoned, the fetch failure measured — are carried on the lesson **and all four bands**, fifteen pins in all, and **each was asserted to occur in exactly one reader text**. Two prior records (DR-1275's bare `367,000`, DR-1278's bare `Mitch Berk`) passed with the disclosure deleted because the pinned string also occurred elsewhere. **Proven to catch:** deleting the teen disclosure leaves no carrier and no sibling covers for it; the same for the senior telephone disclosure.

**Both stories are parables, in the third person.** A lesson built from a newsletter has nobody's life in it, so `kind: 'testimony'` — which renders as a true story told with a named person's consent — would be a lie on the page (DR-0811). A check forbids it and asserts no `source` is borrowed.

## Relationship to sov51 / DR-1246 — the comparison, measured

**The principle, cited for what it says rather than for a paraphrase of it.** `DR-0610` §3 reads: *"Before building an in-app row, the reader searches the lesson catalogs for a lesson already made from the same words (the same spoken sentences in its grounds). If one exists, it builds nothing new: it writes the comparison (what each door carried, and whether any content, verse or provenance was lost) to Darrell, and tags the row `lesson-captured` and `parallel-compared`."* Two things follow honestly. Its **scope** is the two in-app lesson doors running in parallel, not two lessons from one emailed newsletter, so it is the right principle to reason from but not a rule this case sits inside. Its **remedy** is *the comparison*, not folding. And folding is not available to this record in any case: `scripts/one-teaching-one-lesson-guard.mjs:13-16` states why in its own header — *"It does NOT fail on the recorded one: folding two lessons built from his own spoken teaching is an editorial call about Yahweh's Word on a COLG-facing surface, and that is his, not a gate's."* So what is owed here is the measurement and the comparison. The call is Darrell's.

**sov51 did NOT declare this item a leave-out, and the record must not imply it did.** DR-1246 names nine of the digest's fourteen items as left out; **this item is not among them**. It is one of the **five that serve** sov51's through-line, and DR-1246 calls it *"the programming item, which draws the line out loud and is the digest's own statement of the seam."* sov51's own prose calls it *"the sentence this lesson turns on."* Any account of sov57 that implies the item was untouched is wrong.

**What each lesson carried, measured on the shipped modules:**

| | **sov51** (DR-1246, 2026-09-30) | **sov57** (this record, 2026-10-29) |
| --- | --- | --- |
| Reads the digest as | ONE lesson across five serving items | ONE item, the only one carrying a thesis |
| Teaches | The **office** that does not transfer — whether a duty transfers at all, and who answers once work is handed over | The **asymmetry** the same sentence reports — what can be rebuilt against what cannot — and the four practices that follow |
| Uses this item as | Its statement of the seam: *"let agents iterate over the code and leave the data to humans"* — the digest drawing the line about what may be handed over | Its whole subject: *"none of that speed applies to the data; lose the data people gave you and you begin again"* |
| Half of the sentence taken | The **delegation** half (handing the code over) | The **irreplaceability** half (what cannot be handed back) |
| Anchor verses | **23** | **9** |
| **Shared anchor verses** | **0** | |
| **Shared anchor chapters** | **0** | |
| Spine | 2 Chronicles 26 (Uzziah), 1 Samuel 13 (Gilgal), Numbers 18 / 16, Zechariah 11, Galatians 6, John 10 (the hireling) | Psalms 102, Ezra 2, Deuteronomy 31, Job 19, Ezra 6, 1 Chronicles 9 |
| Title's opening three words | "the office that" | "the code can" |

**Whether anything is repeated.** Measured across sov51's entire module (87,822 characters, every string including bands, quiz, benefits and facilitator notes): `record` **0**, `register` **0**, `rebuild` **0**, `irreplaceable` **0**, `archive` **0**. sov51 **states** the asymmetry as the reported premise of its seam; it nowhere **teaches** it, and it tells a reader nothing about what to do with records. The practice sov57 exists to give — name the irreplaceable in writing, keep it where its survival does not depend on what produced it, keep it legible to a stranger, hold rather than invent when it is missing — appears nowhere in sov51.

**Whether anything is lost.** Nothing. sov51 keeps its whole subject; sov57 re-teaches none of its ground and, following sov51's own convention of naming the weeks it does not re-teach, **sov57 names sov51 in all five reader texts** — the lesson and every band — so a reader who wants the who-answers question is sent there instead of being served it again. The reader-facing text names it as *"week fifty-one, the office that does not transfer"*; the record id stays out of reader prose, which `recitedRecords` enforces and which caught a first draft that printed it.

**The verdict this record asserts, and its limit.** On the measurement above these are **complementary**: one source sentence, two halves, two disjoint spines, no shared verse, and no overlap in what is taught. That is what the measurement supports and it is as far as this record goes. It does **not** assert that two lessons from one forward is the right editorial shape for a COLG-facing surface — that judgement is Darrell's, and this comparison exists so he can make it in a line rather than an investigation.

## The gate gap this exposed — an open finding

**Nothing in `verify:gates` asked the one instrument that knew.** The two checks involved and why each was silent:

- `scripts/one-teaching-one-lesson-guard.mjs` keys on **same course + the same opening three words of the title + ≥ `MIN_SHARED_VERSES` shared verses**. sov51 and sov57 share a course and nothing else it inspects — 0 shared verses, 0 shared chapters, "the office that" against "the code can" — so it passed, **correctly on its own terms**. It has no notion of a source thread.
- `scripts/lesson-row-shipped-sweep.mjs` **does** know, and reports this thread SHIPPED. But it is called with row ids by the intake, and nothing ever ran it against the thread a **new decision record names**. The instrument existed; it was never asked.

**Closed, cheaply, and proven to catch:** `scripts/one-thread-one-record-guard.mjs` (new) reads the thread id each record names in its own front matter and fails when two records name the same thread unless the pair is recorded. It is wired into `verify:gates` after `one-teaching-one-lesson-guard`. **Proven twice:** removing this pair from `KNOWN_SHARED_THREADS` makes it report *"thread 1a0f23b12bf2ca45 is named by DR-1246 and DR-1285"* and exit 1 — it would have caught sov57 before a word was written; and a baseline entry that no longer collides is refused as stale, so the list cannot rot.

**It deliberately does not decide anything.** A recorded pair passes with its comparison cited, for the same reason `one-teaching-one-lesson-guard` does not fail on its own recorded pair: the editorial call is Darrell's. All the gate asserts is that nobody built twice from one source **without noticing**.

**Six collisions already existed, and they are debt rather than a clean bill.** Measured 2026-10-29 across the whole ledger: `1a0a5a12db9c6a62` (DR-0412/0413/0416), `1a0a5a4e540b4fde` (DR-0412/0413/0414/0415), `1a11668e8023cd3e` (DR-0793/0863), `1a11be8ea0e58748` (DR-0834/0864), `1a135f165fe391e3` (DR-1005/1051), `a30e4942e161b7833c6cef051b8ab6fd` (DR-0711/0739). **Not one has been investigated.** A record may legitimately name several threads, so some are probably not duplicate lessons at all — but saying which would mean reading six pairs of records, and asserting they are fine without reading them is the hollowing-out DR-0076 §3 forbids. They sit in `UNEXAMINED_BASELINE` as a shrink-only list. `re-review: 2026-11-28` — read the six, move each into `KNOWN_SHARED_THREADS` with a comparison or out of the ledger as a genuine duplicate for Darrell to fold, and lower the list as each clears.

## Impact

The course can now separate what it is defending. A reader finishes the week able to say which of the two things in front of them is cheap to lose and which is not, and able to act on the difference: name the irreplaceable in writing, keep it where its survival does not depend on what produced it, keep it legible to a stranger, and hold rather than guess when it is missing.

The fourth of those is the one the Word supplies and the industry does not. Ezra 2:63 is a governance primitive — a bounded hold with a named condition for release — and it is the right answer to a gap that a confident invention is the wrong answer to.

The lesson also says where **this** house is thin rather than describing only other people: our records sit on hardware we own inside a history that keeps every revision, which is the side of the ark, but **the written list of what is irreplaceable does not exist here as a single page**. That gap is named in the reader's hearing, and it is the lesson's own `inApp` instruction.

The durable output is the fixed `chapterOf` key. Every future lesson in this course that claims its anchors were chosen by counting now has a check that can actually fail.

## Decision

Ship **sov57** as the fifty-seventh Sovereign A.I. week, built on the one item in the issue that carried a teaching, with its provenance and its limits stated on the lesson and on all four bands; anchor it on Psalms 102:18, Ezra 2:62, Ezra 2:63, Deuteronomy 31:26, Job 19:23, Job 19:24, Ezra 6:1, Ezra 6:2 and 1 Chronicles 9:1, chosen by measurement; stake no figure and gate that claim; raise the honesty gap pin to 14 with the reason and the date above; fix the book-name collision key that was letting a clash through, and record Isaiah 30 as declined.

State the asymmetry **plainly** rather than hedging it into something nobody could disagree with (DR-0100), and name the one genuinely open thing **narrowly** — how long today's records stay *readable* as distinct from *stored* — without letting that doubt spread over the practice, which is not in doubt.

## Verification

- `app/src/__tests__/sovereign-ai-sov57-verses.test.js` — **63 tests, all passing.** The spine pinned by literal span and checked against the corpus on disk; every quoted span in every string of the module swept for verbatim text with the sweep asserting its own count (≥50); the anchor checked both ways (nothing quoted that is not anchored, nothing anchored that is not in the adult lesson); the chapter-collision check on a real book-and-chapter key; `fourBandFaults` empty; shares, FK ladder, overlaps, title-in-narrative, talk-together in all three directions on all five places, headings contiguous 1–12, plain-meaning cues, no doubled word; Yahweh never inside a quotation and no generic God/GOD/LORD in our authored voice; the adversary never capitalised; Jesus confessed as the Lamb and Eternal Son in every place.
- **Proven-to-catch, in the same file:** a quotation drifted by one word; a verbatim span hung on the wrong reference; Yahweh substituted into a quotation; `$2 billion` planted; `37%` planted where a currency check alone would miss it; an advertiser name reaching the teaching while ordinary English does not; the teen disclosure deleted; the senior telephone disclosure deleted; a band shortened to a summary; a band copied from its sibling; a band stripped of its title opening; a parable relabelled a testimony; an anchor chapter colliding with another week.
- `app/src/__tests__/the-third-pile-is-a-worklist.test.js` — GAP 14 / CHECKED 3, re-read off `scripts/unchecked-claims.mjs` on the tree that holds the lesson.
- `app/src/lib/course-band-coverage-baseline.json` — regenerated by `scripts/course-band-baseline-write.mjs`, **total 443, allFour 269**, adultOnly 0, adultRegister 0. Not hand-merged.
- `app/src/lib/lesson-dates.json` — `sov57 → ["2026-10-29", "750932e2"]`, a real day and a real commit, not `working-tree`.
- `npm run lint` and `npm run verify:gates` both read without a pipe.
- The full Vitest suite is **delegated to CI** on the PR head, where `ci.yml` runs lint plus the whole suite in four `--shard=i/4` legs and the lane cannot merge a red PR. The full suite was **not** run locally and this record does not claim it was.

## What this does NOT claim

- **The article behind the thesis was never read.** What was read is a four-sentence summary written by somebody else. `ma.ttias.be` does not resolve from this session, and no claim about the article's reasoning, examples or figures beyond those four sentences appears anywhere in the lesson.
- **No other article in the issue was read** — not the DevDay recap, the Apple reorganisation, the Dragon piece, the test flight, the liability essay, the Meta analysis, nor any quick link. The lesson describes those items only as what the issue's own paragraphs say they are.
- **Nobody was contacted.** The writer, the newsletter and every company named in the issue were not telephoned, emailed or otherwise asked to confirm a word.
- **No figure from the issue is repeated**, and no figure is read back off any publisher's page, which is exactly why this lesson is in the gap and not in `lesson-sources.json`.
- **The named uncertainty is narrow:** how long a stored record stays *readable* is genuinely open and is said to be. The asymmetry itself — that rebuilding working parts has grown cheap while recovering records has not — is stated as established, not hedged.
