# The month in review — what was built 2026-08-14 → 2026-09-13, and what the instruments were saying the whole time

**Asked by Darrell, 2026-09-14:** *"Then review what was built before today and for the last month!!!!!!?"*

**Method.** Measured, not recalled (DR-0076 §4). The sandbox clone was shallow (history began 2026-09-07); it was deepened with `--shallow-since=2026-08-13` before counting. Every number below names its instrument. This is a **partial** comprehensive review per DR-0239 — the dimensions that ran and the ones that did not are listed at the foot with dates, not left implied.

---

## 1. What was built — the shape of the month, by count

| measure | 2026-08-14 (commit `19a84762`) | 2026-09-13/14 | delta |
|---|---|---|---|
| merges to `main` (first-parent, in window) | — | **306** | ~10/day; busiest 09-10 (25), 08-28 (25), 08-15 (21), 09-13 (20) |
| Living Lessons (`LIVING_LESSONS_META.weeks`) | 77 | **151** | **+74 lessons** in 30 days |
| migrations (`infra/supabase/migrations-auto/`) | 148 | **221** | +73 |
| test files (`app/src/__tests__/`) | 687 | **991** | +304 |
| tests (from the suite's own output) | 8,045 (08-21 sighting) | **14,818** | +6,773 |
| components (`.jsx`) | 207 | 237 | +30 |
| lib modules (`.js`) | 495 | 604 | +109 |
| deterministic gates in `verify:gates` | — | 15 (+ `decision-record-guard` in `ship` as of DR-0402) | |
| decision records dated in window | — | **111** (DR-0300 → DR-0401) | |

**What the 306 merges were, grouped by the merge titles themselves:**

- **The sovereign database cutover** (08-14 → 08-31): DR-0306 the sovereign Supabase stack; DR-0307 the cutover sprint drives itself; DR-0308 the hosted DB is the baseline; DR-0309/0310 the repoint rides the record; DR-0317 the repoint moved the rows not the blobs; the 08-27 "ledger said applied and the database disagreed" incident. This is the month's largest structural change and it is the one still producing surprises (today's Christina data question rode this split).
- **The Word in place** (09-08 → 09-09): DR-0340 a reference opens the Word anywhere; DR-0341 show the Word together, in order; the DR-0340 remainder across LessonFlow / PracticeLearn / the Godhead study. *(The lesson body itself was missed — closed today, DR-0402.)*
- **The TLC Therapy Solutions app** (09-10, one day, 25 merges, 14 records DR-0343 → DR-0356): onboarding packets, the roster, six session scripts, the handbook, Illinois policy on every training, governance seats, the forms engine, signatures, its own instance. The single most concentrated build day of the month.
- **Money and the Books** (09-11 → 09-12): DR-0357 one forms engine; DR-0358 what is owed / what was paid; DR-0359 a mortgage in line items; DR-0360 the day's post; DR-0362 one Cash App statement becomes every giver's record; DR-0363 the sum rule; DR-0364 the plan becomes rows; DR-0365 Poe Properties in its own instance; DR-0371 the office keeps its own book.
- **The business doors report themselves** (09-13): DR-0374 → DR-0378 — the door took orders the database refused; every door gets a way to say "this is broken"; a door that breaks reports itself; a fault is addressed to the office.
- **The lessons** — 74 of them, L78 → L151, including the spoken-teaching lessons (L142 It Is Written Again, L143 Yahweh's will on earth, L144 A False Balance, L145 the bondservant, L149 Cultural Competency, L150 the kenosis, L151 Crying because of all the dying).
- **The reader** (09-13): numbered points on 84 lessons, the speaker's index, the paragraph stepper (DR-0385); the reader sounds like a person (DR-0386); the speaker chooses what is read (DR-0387); a list of references is not a sentence (DR-0391).
- **The lane itself:** DR-0393 the base can move while you verify (push-stranding guard); DR-0402 a product push carries a record.

---

## 2. What it cost — the incidents the month recorded

From `LESSONS-LEARNED.md` (10 entries in the window) and the `incident`-labelled issues (16 total; 5 in window):

| date | what | ledger |
|---|---|---|
| 08-14 | **Four apps locked out ~20 hours** on an egress quota while every instrument read green | LESSONS 08-14; issue #1252 (155 comments) |
| 08-14 (later) | The rules were all written down and the build shipped the thing they forbid | LESSONS |
| 08-19 → today | **Pipeline device dark** — still OPEN | issue #1290 |
| 08-27 | The ledger said applied and the database disagreed; a landlord could not see his own properties | LESSONS |
| 09-03 (×2) | Christina could not sign in, no door worked, the witness said "UP. Fresh."; four `not-reached` lines with a healthy backend | LESSONS; issues #1438, #1444 |
| 09-10 | A redefined shared function dropped what an earlier migration taught it; the capability checklist dead 4 days | LESSONS |
| 09-11 (×2) | "Continue with Google" answered raw JSON in front of the church; a statement import that wrote nothing and said "0 new" | LESSONS |
| 09-12 | A smoke that listed fourteen assertions and had never run past its first | LESSONS |
| 09-13 | Six of nine parts of a presented lesson were blank while the lesson held 14,000 characters | LESSONS |
| 09-13/14 | **Christina's rental doors and tenant data** — proven never deleted; the tenant fields never had cloud columns; the family-OS rentals sync orphaned by 0207 | this session (tasks #11–#14) |
| 09-14 | **harvest-health: the transcript pipeline has stopped advancing** — OPEN, filed today | issue #1572 |
| 09-14 | The lesson surface: three merges (#1578/#1579/#1580) rewrote how a lesson reads, no record; the chip wall; two blocks nobody asked for | DR-0402 |

**Pattern in the incidents, stated plainly (DR-0100):** seven of the twelve are the same shape — *an instrument read green while the thing it watched was broken* (08-14 quota, 09-03 "UP. Fresh.", 09-10 checklist, 09-11 "0 new", 09-12 the smoke, 09-13 blank parts, 09-14 the watcher below). The month's verification doctrine is right; its gates keep being found to be **theatre after the fact** — exactly DR-0076 §3's warning, recurring.

---

## 3. The Ways — did the record keep up with the build?

- **111 decision records for 306 merges.** Many merges are session notes, live-proof notes, deps, and amendments to an existing DR, so 1:1 is not the bar — but the *pattern* is measurable: on 2026-09-13 the INDEX itself recorded a ledger-drift finding ("a run of fast merges in one session with no gate requiring a DR for a Tier-B change") and reconstructed four records after the fact; on 2026-09-14 the same thing happened again (three merges, no record). **A finding written in prose recurred within 24 hours.** That is the proof that the fix had to be machinery: `decision-record-guard.mjs` (DR-0402) now refuses a product push without a record.
- **REV records for Ways reviews (DR-0108):** DR-0323 (09-03) is the one real Ways review in the window — *"The law, the history, and what a real Ways review found in what we just built."* One in thirty days, against a standing "mandatory, documented practice."

---

## 4. The review instruments — running daily, and what they were actually saying

This is the finding of the review.

| instrument | schedule | last run | what it reports |
|---|---|---|---|
| `review-watcher.yml` | daily 11:23 UTC | 2026-09-14 16:58, **success** (run 55) | maintains issue **#1126: "review-watcher: 531 overdue re-review commitments"** — open since **2026-07-30**, updated today, **never reached zero** |
| `daily-review.yml` | daily 12:00 UTC | 2026-09-14 17:07, **success** (run 64) | coverage fruit queue, workflow conformance, tenancy guard, lint+test status, leverage pointer |
| `ari-comprehensive-review.yml` | event-activated, braked | **2026-07-27** — 2 runs total, one failed | the DR-0239 comprehensive-review machinery. **Has not run in 49 days.** |
| `site-health.yml` | scheduled | 1,334 runs, latest success | the outside-in probe; filed #1252, #1438, #1444 correctly |

**Measured independently** (DR-0076 §7): scanning only `docs/decisions/DR-*.md` for the latest `re-review:` date per file, ignoring any file marked CLOSED: **70 decision records are past their own re-review date** — 30 dated July, 36 August, 4 September. The watcher's 531 is the wider count across every dated commitment in every ledger it scans; the two numbers agree in direction and both have been true for weeks.

**What this means, said plainly:** the review watcher is doing its job — it counts, it files, it updates the number daily. The number is 531 and it has been in the hundreds since July 30. Nothing drives from it. The comprehensive-review workflow that DR-0239 names as "enforcement is machinery, not memory" last ran before DR-0239's own re-review date (2026-08-25, itself overdue). *"Everything must get better perpetually; if not, why — and a re-review date"* (DR-0075) has been honoured at the writing end and not at the reading end. The dates were promises; the promise-keeper is a green check that no one reads.

---

## 5. Findings that are work (DR-0239 dimension 6)

Each one is either done, or carries a why + a date. None is left as a sentence.

1. **A product push carries a record — DONE** (`decision-record-guard.mjs`, DR-0402, rides `npm run ship`, proven against the real push).
2. **The 70 overdue DR re-reviews.** Not closable in one turn honestly — each is a real decision needing a real look. Proposal: the watcher's issue #1126 becomes the standing work queue for idle turns under DR-0103 §4 ("pull the next dated re-review forward"), oldest first, five per session, each closed with a one-line finding or a new date with a why. **re-review: 2026-09-21** — the count on #1126 must be measurably lower or this note says why.
3. **`ari-comprehensive-review.yml` dormant 49 days.** Either it runs on a real event (a merge to `main` touching `app/src/components/`) or DR-0239's "enforcement is machinery" is amended to name what actually enforces. **re-review: 2026-09-18.**
4. **Issue #1290 "Pipeline device dark" open since 08-19** and **#1572 "harvest-health stopped advancing"** filed today — both NAS-side, both outside the sandbox's reach. They need the tailnet path (DR-0108: the whole team's reach, not the agent's). **Owner: the next NAS session; re-review: 2026-09-16.**
5. **The instrument-reads-green-while-broken class (7 of 12 incidents).** Each already produced its own gate. The meta-finding — that the *gates themselves* need a proven-to-catch witness at ship time — is what `push-stranding-guard` (DR-0393) and `decision-record-guard` (DR-0402) started. The next one: a gate that fails when a `re-review:` date passes with no CLOSED marker — turning the watcher's count from a report into a brake. **Not built tonight** (it would fail the build on 70 files at once and stall the lane — a brake that cries wolf is ignored in a day, P52). Design: fail only on *new* overdue dates, so the backlog is worked down while no new debt is added. **re-review: 2026-09-21.**
6. **The tenant/lease data (tasks #13, #14)** — the month's cutover left the family-OS rentals sync with a resolver and zero callers (0207/DR-0365). Staged work exists (`lease-write-state.js`); it ships next, after Darrell has seen lesson 151 live. **re-review: 2026-09-16.**

---

## 6. Dimensions of DR-0239 that did NOT run here, with why + date

| dimension | ran? | why not | re-review |
|---|---|---|---|
| SHOULD / ARE (spec conformance) | partial — the lane, the records, the review machinery | not walked per feature across 111 DRs | 2026-09-21, five DRs per idle turn (finding 2) |
| journey walks | **no** | the sandbox has no route to poetech.us; needs a device or the site-health runner | 2026-09-16, with Darrell's live look at L151 |
| surface-says-truth | partial — the watcher and daily-review outputs were read against reality | the app's surfaces not walked live | same |
| form-factor MEASURED | **no** | same reach limit; the CI layout probe covers each push | same |
| delivery-context | **yes** — §3, §4 | | |
| findings-are-work | **yes** — §5 | | |
| gate-class | **yes** — the decision-record guard; the overdue-brake designed, dated | | |
| the Word's accuracy, quoted AND reasoned (DR-0281) | **sampled only** — L151's quotations were fetched verbatim and gated this session; the other 73 lessons of the month carry their own verse gates but were not re-read here | 2026-09-28, in the Godhead-study integrity harness cadence |

**The honest one-line summary:** the month built a great deal — 74 lessons, a sovereign database, a second business's whole app in a day, the Word opening in place, a reader that sounds like a person — and the instruments that were supposed to keep it honest were green every morning while saying, in a number nobody read, that 531 promises had gone past their date. Tonight one of those instruments became a brake. The rest are dated above.
