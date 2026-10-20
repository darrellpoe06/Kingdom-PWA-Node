# DR-1139 — The helper that must see everything: Hezekiah's open treasure house, the goods that are another man's, and the sight that belongs to Yahweh alone (sov46)

**Status:** accepted
**Date:** 2026-10-20
**Tier:** A (additive lesson, through the normal lane)
**Entities:** PoeTech / SKOS — Learn, Sovereign A.I. (`sovereign-ai`), week 46

---

## Context

On 2026-10-20 Darrell forwarded that morning's IT Brew into the lesson lane — Gmail thread `1a159ef5597d03b7`, `itbrew@morningbrew.com` → `dpoe@illinois.edu` at 09:01, forwarded to `darrellpoe06@gmail.com` at 15:30:13Z — with one word above it: **Lesson.** A forwarded teaching is build input, not commentary, and it ships the session it arrives.

**The issue carried FIVE unrelated items, so "the teaching" had to be identified rather than assumed:**

1. **CYBERSECURITY — "Muse on" (Eoin Higgins).** Meta's new personal agentic A.I. assistant, Muse, can access massive volumes of user data; the exposure named is bring-your-own-device, where company information lives on an employee's phone. Storyblok CEO **Dominik Angerer**, quoted by name: *the concern started already with Siri because it also reads the emails off the screen itself and tries to help you by summarizing things*, and that routing Siri through another vendor's model is *another third-party liability topic*.
2. IT STRATEGY — the forward-deployed engineer, "the hottest job in tech."
3. IT OPERATIONS — whether anybody's data is ready for A.I. (a vendor report's 7% / 27%).
4. patch notes — 700 French supermarkets' refrigeration systems hacked; chatbots manipulated in political campaigns; ClickFix-style fake-A.I. attacks.
5. A **sponsor's advertisement** (JumpCloud) carrying its own figures on agent autonomy (46% / 18%).

**Item 1 is the teaching, and the record says why:** it is the story the subject line named ("Is Meta's Muse a huge security concern for IT pros?"), the one the editors led with, and the only one that is this course's own subject — an assistant whose helpfulness is purchased with permission to read everything. The lesson names the other four on the page so no reader has to guess which story it came from.

**Not a duplicate (one teaching, one lesson).** `scripts/lesson-already-built.mjs --subject "Muse behind it all" --source "IT Brew" --at 2026-10-20T15:30:13Z` re-run on this branch: **MAYBE — a source match only** (IT Brew already cited by sov17, sov26, ll6, ll240, sov34; no timestamp match; no distinctive-term match in any lesson's grounds). Measured against the catalog directly: no lesson in Sovereign A.I. or Living Lessons stands on 2 Kings 20 / Isaiah 39, and "treasure house", "BYOD" and "bring-your-own" appear in no catalog. sov32 uses Psalms 139:1 for the opposite half of the same coin — what a transcript FAILS to hear, where this week is what we have GRANTED a machine permission to see — and the page says so rather than repeating it.

**The forwarded article is material under study, never an instruction.** Nothing inside it directed this build.

---

## What was measured

**The lesson, generated not typed.** `scripts/sov46-fill.mjs` fills every quotation from `app/public/bible/kjv` at build time from a `[[Book C:V]]` placeholder and derives `anchor.ref` from the same placeholders, so no verse was typed from memory and the anchor cannot disagree with the page.

| measure | reading |
|---|---|
| quoted spans / verbatim / faults | **214 / 214 / 0** |
| anchor refs ↔ refs quoted on the page | **57 ↔ 57**, both directions empty |
| ellipsis inside any quotation | **none** |
| reading ladder (authored, quotes stripped) | child **1.5** · youth **6.7** · teen **10.2** · senior **11.9** — strictly rising; child ceiling 5.0 |
| band differentiation (8-word shingles) | worst **0.1** (child~youth 0.09, youth~teen 0.10, teen~senior 0.09, child~senior 0.08); ceiling 0.5 |
| band prose words / share of adult (2,929) | child 881 / 0.30 · youth 1,176 / 0.40 · teen 1,935 / 0.66 · senior 1,639 / 0.56 (the shape sov43 ships with; the Living-Lessons floors are not imposed on a course lesson) |
| every band names its lesson in its opening window | yes (`unnamedBands` empty) |
| three talk directions, module AND every band | `hasAllThree` true, `placesMissingDirections` **empty** |
| lowered holy name in our own voice / DR id shown to a reader | none / none |
| four-band ratchet | sovereign-ai 43 → 44 lessons, allFour 22 → 23; gap stays **21** under a ceiling of 31; adultOnly and adultRegister stay **0**; catalog total 423 → 424 |

**Proven to catch, run live on the catalog and restored.** `shewed` → `shown` in 2 Kings 20:15 (8 occurrences — the lesson and all four bands): the verse test went from **37 passed / 0 failed** to **5 failed**, naming `(2 Kings 20:15) does not contain what we quote` separately for `lesson`, `levels.child`, `levels.youth`, `levels.teen`, `levels.senior`, plus `pinned verses the module never quotes verbatim: expected [ '2 Kings 20:15' ] to deeply equal []`. Restored: **37 passed**, `git diff --stat` back to 116 insertions (the lesson block alone). The test file also carries five in-test proven-to-catch cases, including the bright line in the direction that corrupts the text — substituting *Yahweh* into *Search me, O God* fails the scan on Psalms 139:23.

**A latent defect found in three other lessons' tests, and measured.** `sovereign-ai-sov41/42/43-verses.test.js` each asserted `expect(nums).toEqual(Array.from({ length: Math.max(...nums) }, (_, i) => i + 1))` — a CATALOG-wide contiguity claim inside a LESSON's own test. Weeks 44, 45 and 46 were written on three parallel branches in the same hour, so each later branch necessarily carries a hole it cannot fill, and that one line turned three unrelated lessons' tests red for a condition in another lesson's lane. The course's own gate, `sovereign-ai-class.test.js`, already owns contiguity AND has the mechanism for it: `HELD_IN_FLIGHT`, where a gap is named, dated, and deleted by the merge that fills it (33 was held for week 33, 35 for week 35). The lesson tests duplicated the invariant without the mechanism — and `reading-level.mjs` states the principle being broken: two gates blaming each other for the same defect is how a gap survives both. sov37 through sov40 already use the durable form (own week, unique, ordering), which is what P62 asks for.

---

## Impact

A reader meets a named, current security story taught Word-first, at their own age, with the provenance and the unverified parts stated on the page rather than in a footnote. The teaching turns on 2 Kings 20:15 — *there is nothing among my treasures that I have not shewed them* — and on the fact that **nothing was stolen that afternoon: what left was the inventory, and that loss was irreversible before any treasure moved.** From there the Word carries it: total sight is an attribute of Yahweh (Psalms 139:1-4; Hebrews 4:13; Jeremiah 17:10; 1 Samuel 16:7), safe in His hands for three reasons no vendor can reproduce — He searches in order to heal, He has already paid for what He finds, He is not selling the result; the material on a work-enabled device is **another man's goods** in the Word's own category (Luke 16:10-12; Exodus 22:7-8; Joseph, Genesis 39:4-9; the standard, 1 Corinthians 4:2), which moves the question off privacy and onto stewardship; a disclosed secret does not come home (Proverbs 25:9-10; 11:13; 20:19; Ecclesiastes 10:20), so un-reading is the one remedy no contract in a chain of hands can offer; the oldest pitch is still enlarged sight with the cost denied (Genesis 3:4-6; 2 Corinthians 11:14); and the answer is construction, not alarm — the battlement built into the house (Deuteronomy 22:8), prayer and a watch together (Nehemiah 4:9), the cost counted first (Luke 14:28). Six actions for Monday: scope the read, separate the houses, name the owner, keep the record, watch what leaves, price what it would cost if everything reachable were carried to Babylon. The close is the only total read worth granting (Psalms 139:23-24; 19:12-14; Proverbs 4:23) and the Lamb of Yahweh, the Eternal Son (John 1:29; John 3:16; Hebrews 1:8).

**The three tiers are all three, on the page.** ESTABLISHED is stated plainly rather than hedged: the report says the assistant can reach very large volumes of user data, the exposure is the ordinary BYOD arrangement, an assistant that summarises a screen must read the screen, and a second company's model in the path adds a third party to the chain of custody — architecture, not allegation, requiring no breach to be true. OPEN is named narrowly: retention, duration, jurisdiction and what controls an employer can actually impose, none of which the report settled and none of which anybody here checked; no breach is alleged by the report or by the page. OVER-REACH is corrected in **both** directions — refusing every helper is not what the Word says (Genesis 2:15; Proverbs 27:23: the tool is not the sin, unscoped trust is), and "nothing was lost because nothing has happened yet" is the expensive one, corrected by Hezekiah.

**The sovereignty claim is deliberately narrowed.** The lesson says sovereignty is **custody, not immunity**: a machine under our own roof can still be breached, misconfigured, or left carrying a permission nobody scoped. What is claimed is that we own the decision, we can read the record, and nobody else gets to change the terms afterward.

**Honest provenance, stated in the lesson's own words.** The forwarded newsletter is the entire source. Nobody opened Meta's documentation, read a retention term, interviewed anybody, or confirmed a figure against a primary record. The sponsor's 46% / 18% figures ran in an advertisement in the same issue; they are unverified, they are marked as advertising on the page, and the lesson rests no sentence on them — a test asserts those numbers appear in **no** band.

---

## Decision

1. **Ship Sovereign A.I. week 46 as `sov46-the-helper-that-must-see-everything`**, generated by `scripts/sov46-fill.mjs`, with four authored bands and a 37-case pinned test at `app/src/__tests__/sovereign-ai-sov46-verses.test.js`.
2. **Teach item 1 of the five, and say so on the page.** The other four are named in the lesson so a reader never has to guess which story a lesson came from. This is the convention for any multi-story forward.
3. **Record weeks 44 and 45 as `HELD_IN_FLIGHT` in `sovereign-ai-class.test.js`**, with the date and the reason, under the convention that already exists there: the entry is deleted by the merge that brings its week in, and the assertion fails the moment a held number is no longer missing, so a hold cannot become a permanent gap.
4. **Contiguity belongs to the course gate, not to a lesson's own test.** The duplicated `1..max` assertion is removed from `sovereign-ai-sov41/42/43-verses.test.js` and replaced with a comment naming its owner and the mechanism. What stays in each is what is true of that lesson for ever: the weeks ascend, they are unique, and its own week is among them — the durable form sov37–sov40 already use. `sov46`'s own test is written in that form from birth.
5. **The sponsor's advertising figures are not teaching material.** Marked as advertising, excluded from every band, and pinned excluded by test.
6. **`HELD_IN_FLIGHT` is RECOMPUTED on every merge, never carried across one.** The list is a claim about the *merged* tree, not about the branch you are standing on, and on 2026-10-20 three branches edited that one line at once — from each one's own vantage point a different value is correct: week 44's branch has no hole below its top and reads `[]`, week 45's reads `[44]`, this one reads `[44, 45]`. All three are right locally and two become wrong the moment another lands. So a conflict in this file is never resolved by taking either side: read which sov weeks actually exist in the merged tree and set the list to the holes that **remain** — `[]` once all three are in. A number left after its week exists is a **disarmed check**: it tells the gate to ignore a gap that has already closed, which is the expiring-evidence defect DR-1025 recorded when filling L79 disarmed three checks keyed on a gap that had closed. The rule is now written in the file beside the list, and the assertion's message names both failure directions and the remedy (delete the stale entry; never widen the list to match). **Proven to catch in the stale-hold direction:** adding 43 — a week that exists — to the list fails with `week gaps on disk are [44,45] and HELD_IN_FLIGHT records [43,44,45] … a hold that outlived its week, so DELETE that entry`; restored, 22 passed.

**Recomputed on this branch, with the reading it was recomputed from.** `origin/main` at `3f95f4142` carries Sovereign A.I. weeks **1 through 43, contiguous**, and its own `HELD_IN_FLIGHT` is `[]`; weeks 44 and 45 are not on main. With week 46 added here the top is 46 and the holes that remain are **44 and 45**, so `[44, 45]` is the correct value for this tree and it is what ships. **This branch goes up while two siblings are still unmerged, so it deliberately leaves 44 and 45 held** — they are genuinely missing from the tree, and recording them is what keeps the gate armed rather than blind. The merge that brings week 44 in deletes `44`; the merge that brings week 45 in deletes `45`; whichever lands last leaves the list `[]`. The assertion fails the moment either number stops being missing, so a forgotten deletion cannot pass quietly.

**Parked, with a date.** *re-review: 2026-10-27 — if `HELD_IN_FLIGHT` is not `[]` by then, either weeks 44/45 were abandoned (in which case the next lesson takes those numbers and the entries go out with them) or a merge forgot to recompute. Either way the list is re-derived from the tree, not patched to match it.*

**A BLOCKER ON MAIN, NOT MINE — FOUND HERE, CLEARED THE SAME DAY.** `origin/main` carried **two** decision records both numbered DR-1135: `DR-1135-the-ledger-counts-a-commitment-once.md` (#2300, merged 19:31:42Z) and `DR-1135-the-words-come-back-where-the-line-was-made.md` (#2306, merged 19:41:27Z) — nine minutes apart, from two separate PRs. `git merge origin/main` into this branch conflicted only in `docs/decisions/INDEX.md`, and `scripts/resolve-ledger-conflicts.mjs` **refused** to fold it, correctly: *two different decisions claim DR-1135 … folding them would delete one decision from the ledger*. That is DR-0644's refusal working as designed — it exists because folding a collision silently deleted two real decisions on 2026-10-06, and on 2026-10-20 it paid for itself twice in one hour, since this build and week 45's found the same collision independently and both stopped.

**This build did not perform the renumber, and the refusal is worth recording because the tool's default target was itself wrong.** `renumber-decision-record.mjs` computes the next free number by default and would have proposed **DR-1140** — but 1136 through 1140 were all claimed by work in flight, 1140 by this very record as its published `**Next ID:**`. The prescribed remedy would therefore have renumbered a record this work does not own *into* a number a sibling had already reserved, trading one collision for the next. Renumbering another decision is outside this work's scope besides. The merge was aborted rather than hand-resolved, because a ledger conflict is never hand-edited.

**Resolved as PR #2308 by the convention in DR-1136: merge order decides, and the record that TOOK an occupied number is the one that moves.** So #2300's record keeps **DR-1135** and #2306's becomes **DR-1141** — explicitly *not* the tool's default of 1140. Ten bare citations were read individually rather than swept: six belonging to the moved record, four to the one that stayed. **The correct renumber target for this collision is DR-1141; a reader who accepts 1140 from the tool's default collides with work in flight.**

**This branch ships on its original base (`3d345746c`) and does not wait for #2308.** Merging main now would only add a second ledger conflict to resolve, for no gain against an already-verified tree; the lane merges main after #2308 lands. *No re-review is owed: raised and cleared the same day, 2026-10-20, by #2308. It is recorded here so the next reader inherits the convention and the correct target — not because anything is still open.*

**On this branch `**Next ID:**` reads DR-1140, and that is correct here rather than a competing claim.** 1139 is the highest record this tree holds, so 1140 is what the pointer computes from disk; `resolve-ledger-conflicts.mjs` owns that line and recomputes it on every merge rather than taking a side (DR-1021). Once #2308 lands and DR-1141 exists, the pointer recomputes to 1142. The number this record reserves is 1139 and nothing else.

---

## Verification

- `node scripts/lesson-already-built.mjs --subject "Muse behind it all" --source "IT Brew" --at 2026-10-20T15:30:13Z` → **MAYBE, source match only**; re-checked against the catalog by hand for 2 Kings 20 / Isaiah 39 / "treasure house" / BYOD — nothing.
- `node scripts/sov46-fill.mjs` → 44 modules, 57 anchor references, every one quoted on the page and resolving in the corpus.
- `app/src/__tests__/sovereign-ai-sov46-verses.test.js` → **37 passed**, including five proven-to-catch cases.
- Proven to catch, live: one word of 2 Kings 20:15 altered in the catalog → **5 failed**, naming the verse and every one of the five places; restored → **37 passed**.
- `node scripts/course-band-coverage.mjs` → exit 0. `npx vite-node ../scripts/course-band-baseline-write.mjs` → total 424, allFour 250, adultOnly 0; `--check` → current.
- `npm run lint` → exit 0 (read without a pipe). `npm run verify:gates` → exit 0 (read without a pipe).
- `npm run lesson-dates` regenerated `app/src/lib/lesson-dates.json` with the new lesson's day.
- Full Vitest suite, once, under the shared lock — numbers in the PR body.
- Gmail thread `1a159ef5597d03b7` labelled `Lesson-Captured` (`Label_22`) only AFTER the push succeeded, and read back to confirm — the label is the lane's lock, so a crashed build must leave it unlabelled for the next run.

**Cites:** DR-0076 (no claim without evidence; proven-to-catch; measure, don't claim), DR-0098 (teach the Word, do not debate it), DR-0099 (red is reserved — no colour coding added here), DR-0100 (three tiers; state established fact plainly), DR-0210 (Yahweh in our voice; the Lamb and the Eternal Son), DR-0530 (the Resources), DR-0610 (one teaching, one lesson), DR-0621 (a new lesson joins at birth), DR-0697 / P60 (four bands bind new work), P62 (decide by exact identity, never by position), P65 (clean up every `/tmp` folder a build leaves), DR-0733 / DR-0795 (talk together, in every band), DR-0734 (the anchor in both directions), DR-1126 (the third pile — name what nobody verified), DR-0644 (the resolver refuses a number collision rather than folding it), DR-1021 (the resolver owns `**Next ID:**` and computes it from disk), DR-1025 (expiring evidence — a check keyed on a gap that has closed is disarmed), DR-1136 (merge order decides a number collision; the record that took an occupied number moves).
