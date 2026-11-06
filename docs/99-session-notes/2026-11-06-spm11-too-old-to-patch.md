# 2026-11-06 — spm11: too old to patch (DR-1358)

The narrative behind **DR-1358**, per DR-1339: the record is the decision, this is the working.

## The source, stated exactly

Gmail thread `1a164aa1e4aed308`, forwarded **2026-10-22 17:30** with one word above the header: **Lesson**. What it carries is a notice from **University of Illinois Technology Services** to its `cpanel-announce` list, sent **2026-10-21 12:27**, subject *Annoucement regarding PHP2Shell vulnerability and cPanel* (the misspelling is theirs; it is not quoted into the lesson). The full body was supplied in the build brief, so no Gmail tool was called in this session.

**Attribution, written down before a word of the lesson was:** Darrell forwarded this. He did not write it. Nobody here operates that cPanel estate. A teaching artifact that implied either would be a false claim about a real party, so the lesson reports the advisory in our own voice throughout, and `software-pm-spm11-verses.test.js` holds it — the lesson may not contain his name, may not say *our cPanel / our servers / our estate*, and may not say we were hit.

What the advisory actually states, which is all the lesson asserts:

- A critical PHP vulnerability was announced the previous day; they were awaiting cPanel updates, and applying them would cause downtime.
- Interim changes: `session.upload_progress` disabled, the PHP memory limit disabled, other mitigations under evaluation.
- **Every PHP below 8.3 removed**, ahead of a planned *slower, more controlled removal*, because older versions of PHP will not be patched for this critical vulnerability.
- Sites on PHP 7.x would now throw fatal errors: error dumps, a white screen, partial rendering.
- **No way back.** The only path forward is to update the applications.
- `error_log` lives in the install root **and** in `wp-admin`, and the two hold different contexts — visitors' errors in one, logged-in users' in the other.
- A public package: upgrade it. Code written for you: someone must update it manually.

## The teaching, and why these verses

The lesson is one sentence: **the version you did not keep current cannot be patched on the day the patch arrives.** Everything else is consequence.

**Proverbs 22:3** — *A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished.* The weight is on the tense. The verse is addressed to a reader for whom the evil is still future and the hiding is still available. On the day of the advisory, foresight is no longer an option anyone has; it was only ever available on an ordinary day when nothing was wrong. That is why the lesson's exercise is a calendar of end-of-support dates rather than an incident drill.

**Proverbs 6:10-11** — *Yet a little sleep, a little slumber, a little folding of the hands to sleep: So shall thy poverty come as one that travelleth, and thy want as an armed man.* Read the grammar. The sleeper is the subject of nothing; the poverty and the want are the ones doing the moving, and they arrive *travelling* and *armed* — under their own power, at an hour they pick. That is the exact shape of a support window: the deferral is passive, and the consequence is not. *A little* is the planned slower, more controlled removal.

**Jeremiah 6:14** — *They have healed also the hurt of the daughter of my people slightly, saying, Peace, peace; when there is no peace.* The Word explains the Word here: the sin named is not the slight healing, it is the announcement laid over it. Two mitigations that reduce risk are a real mercy; a status page that calls them a fix is the lie. And the advisory itself is the model to copy, because it said in its own sentence that risk remained until the updates could be applied. Ezekiel 13:10-11 is the same picture in mortar and was considered for the anchor; Jeremiah carries it in fewer words, so Ezekiel is left out rather than stacked.

**Deuteronomy 19:15** — *at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established.* The two `error_log` files are two witnesses holding different testimony. One log is not the whole witness, and a white screen with no error in the file you happened to open is not an absence of errors. Proverbs 18:17 (*his neighbour cometh and searcheth him*) says the same thing about a single account and was considered; the two-witness rule is the one that maps onto two files.

**Galatians 6:5** with **Proverbs 24:30-31** — *For every man shall bear his own burden*, and the field of the slothful grown over with thorns, *and the stone wall thereof was broken down*. The advisory's last paragraph is unsentimental: for code written for your site, someone will have to update it. Ownership of custom code includes ownership of its currency, and the field nobody tends is nobody else's problem on the day the weather turns.

**Philippians 3:13** and **2 Samuel 12:23** — *forgetting those things which are behind, and reaching forth unto those things which are before*, and David's *I shall go to him, but he shall not return to me.* The second is the grief of the irreversible without a word of self-pity in it, which is the register the lesson needs: there is no road back, and the only road is forward.

**Verses deliberately NOT used.** Hebrews 12:27 and Matthew 25:9 — *the removing of those things that are made*, and the oil no one can lend you — are the obvious fit and they are already **sov67**'s spine (DR-1332). Reusing them would have made two lessons out of one reading. Nothing was dropped merely for appearing elsewhere (DR-1317); these were dropped because another lesson is *built on* them.

**Not spm8.** spm8 is *technical debt — named, dated, and never left silent*: the borrower writes the why and sets the re-review date. spm11 is the other half, and it is the harder half: a deferral whose date was never yours. No amount of naming the PHP 7 upgrade would have moved 2026-10-21. The two are held apart by a check on ids, not by a reader's memory.

## What was measured

Four-band ladder, under the ladder this course actually answers to (`four-band-group-c.test.js` relaxes the share floors and the teen/senior ceilings for it, because the course has no adult `lesson` field and therefore no denominator):

| band | FK grade | prose words | names its lesson |
|---|---|---|---|
| child | 2.24 | 315 | yes |
| youth | 5.73 | 380 | yes |
| teen | 7.69 | 369 | yes |
| senior | 11.96 | 757 | yes |

Ladder rises, child under its 5.0 ceiling, worst band-pair overlap **0.195** (youth~teen) against the 0.25 near-copy line. Band baseline regenerated by `scripts/course-band-baseline-write.mjs` on the tree that holds the lesson: **total 460, allFour 286, adultOnly 0, adultRegister 0**; the `software-project-management` row reads `{lessons: 11, allFour: 11}`.

Quotations: **14 reference-tagged spans across the four bands, 0 faults**; every double-quoted span in every field resolved against `app/public/bible/kjv` at test time; no elision (DR-0459); no straight apostrophe inside His words (DR-0456). `course-quotation-integrity` totals unchanged — this lesson adds no elided span and no recited record.

## Five findings the gates produced, every one fixed in the lesson

**1. A DR id in a reader band is debt, and the senior band had three.** `course-quotation-integrity.mjs` keeps `READER_FIELDS = ['lesson', 'bigIdea', 'inApp']` plus the four bands, and refuses a new `DR-nnnn` in any of them: *a reader has no idea what DR-0107 is, and a lesson showing its own bookkeeping has stopped speaking to the person in front of it.* The first draft cited DR-0076, DR-0107 and DR-0125 inside the senior band. The citations moved to a benefit line and a quiz explanation — both outside that scope — and the band now tells the same two failures in reader language, as *this house's own written record rather than an illustration*. The teaching is better for it; the brief's requirement to cite them as records is met where a record id belongs.

**2. The course header named a test file that has never existed.** The header has said since the course was written that every quoted span *is held by `software-project-management-course.test.js`*. There is no such file and `git log` shows there never was; the real cover is `project-management-courses.test.js` (teen and senior), `four-band-group-c.test.js` (all four bands), `every-catalog-quotes-the-verse.test.js` (this catalog pinned at exactly zero faults) and now `software-pm-spm11-verses.test.js`. The spans were genuinely covered the whole time — the name was wrong, not the coverage — which is precisely the kind of claim DR-0219 asks to be traced rather than trusted. The header now names the four gates, with the correction dated in place.

**3. A decision record must answer five questions, and this one answered three.** `decision-chain.test.js` requires every record from DR-0588 on to carry Context, what was measured, impact, Decision and Verification, under any of the names its mapper accepts. The first version of DR-1358 carried three. The two missing are not decoration: *what was measured* is where the Hebrews 12:27 / Matthew 25:9 collision with sov67 is recorded, and *impact* is where the honest limit lives. Caught by CI shard 3/4, after I had called the tree green.

**4. A new lesson must send the reader to someone, in EVERY band — and the first draft did it in none of the four.** `talk-together.js` (DR-0795) requires three directions — parents to children, children to parents, friend to friend — in each band a reader might open, because a reader reads ONE band. spm11 carried none. Four closings were authored, one per band in that band’s own register, each ending in the aim and the Deuteronomy 6:7 rhythm, each quoting Proverbs 27:17 verbatim. Then the measurement bit back: the shared phrasing pushed teen~senior overlap to **0.230** against the 0.25 near-copy line, so the senior closing was reworded rather than the line loosened, and the worst pair settled at 0.195. The grades and word counts moved too, which is why every figure in this note differs from the first commit’s. Caught by CI shard 1/4.

**5. The library ratchet, and the +1 that is honest.** `the-library-is-filled-perpetually.test.js` lets readings, whole, allVersions and exams only RISE and `waiting` only FALL. Measured against origin/main immediately before the merge: main `{731, 3257, 357, 457, 716, 374}` to merged `{732, 3261, 357, 457, 717, 375}`. spm11 adds +1 lesson, +4 readings and +1 exam, and `lessons - waiting` rises 318 to 357 — which is the rule that actually forbids adding to the wait, and it holds. The one wrong-way count is `waiting`, and it is structural rather than a shortfall: this course carries no adult `lesson` and no facilitator fields, so **all eleven** of its lessons wait for a version none of them was designed to have. Giving spm11 alone an adult reading would have cleared the count and made it the only lesson in its course shaped that way — a worse artifact than an honest +1. Re-frozen with the reason, the delta, and the real fix named: a course-wide pass on all eleven, `re-review: 2026-12-06`. Caught by CI shard 4/4.

**What the last three have in common, and it is this lesson’s own subject.** Each was a rule that already existed, that this lesson owed, and that nothing I ran locally asked about. I ran the course’s own suite, the catalog-wide quotation gates, every affected ratchet I had found by reading, and the whole `verify:gates` chain — and reported the tree green. That is precisely the posture spm11 teaches against: **a status assembled from the checks you happened to run is a mitigation reported as a fix.** The gates were the brake and they held (DR-0076 §2); the defect was in my report, not in the build. The structural close is that findings 3, 4 and 5 are now asserted inside `software-pm-spm11-verses.test.js`, so the next lesson in this course meets them on a laptop instead of on a runner.

## Honest limits

- The PHP2Shell CVE, the vendor patch timeline and the state of that estate are **reported, not verified**. No primary source was fetched in this session. No teaching rests on any of them: the lesson's claims are what the advisory says and what DR-0107 and DR-0125 recorded here.
- The advisory's subject line misspells *Announcement*. It is not quoted, so nothing propagates.
- `re-review: 2026-12-06` — read the lesson on the live build as a reader meets it (DR-0104), and check whether the end-of-support calendar the exercise asks for should become a real surface in the app rather than a sheet of paper (DR-0065).
