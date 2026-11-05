# Living Lesson L280 — Whose Answer Comes in the Night (2026-11-05)

**Module id:** `ll280-whose-answer-comes-in-the-night`
**Course:** Living Lessons (devotional)
**Decision record:** `docs/decisions/DR-1324-do-not-interpretations-belong-to-god-ll280.md`
**Source:** Gmail thread `1a163ce6aaf1fed5` — a morning news digest of 2026-10-22, forwarded 13:30:28 UTC from `dpoe@illinois.edu` to `darrellpoe06@gmail.com`, with his own word **`Lessons`** typed above the forwarded `From:` header. Read in full in one `PLAIN_TEXT` fetch.
**Who taught it:** nobody. A forwarded newsletter is not a recording (DR-0719), so no teacher is identified, and the lesson and its gate both say so.

## Why this lesson and not the news

Both of the digest's lead items were **refused**, and the refusals are the substance of DR-1324.

- The **possible military action between named nations** is politics, rests on one unnamed source, and teaching it would hand a reader a side to join — refused on **DR-0098** before any landing question. A report of a plan is not the plan.
- The **merger of two very large companies** was already measured as built ground the same day by **sov66** (DR-1322): it lands on sov50, sov51, sov55, sov56 and sov31, and as the enrichment on ll276.

Eleven further items were refused on a named landing: the lobby ending its candidate money and the hundred-million donation both land on **ll274**; the licence-plate contract on **sov46 / sov49 / sov56**; the wrongful-conviction exhibition on **ll223 / ll274 / ll182**; the physician who stayed on the reservation on **ll33 / ll209 / ll197** (the closest call in the set, recorded as a close call); the sponsored podcast on **sov14 / sov15 / sov10**; the first-in-humans research finding as genuinely open under **DR-0100's second tier**; the status change of a monument as the inverse of **ll178**.

**What was genuinely unbuilt was the advertisement at the very top of the page** — *unlock the wisdom of your dreams, and discover how to remember them and guide them toward solving your challenges tonight*. Darrell's standing instruction is to ignore the advertisements **unless they bear on the lessons**, and this one sells a spiritual practice rather than an object. Measured across the whole repository, thirty-three of the passages this lesson stands on — Genesis 40:8, Genesis 41:15-16, Daniel 2:19/22/23/27/28/30, Job 33:14-18, Job 4:12-16, Job 42:7, Numbers 12:6, Jeremiah 23:25-27, Jeremiah 23:32, Jeremiah 29:8, Ecclesiastes 5:7, Deuteronomy 13:3, 1 Kings 3:5, Matthew 1:20, Psalms 16:7, Psalms 119:148 — appear **nowhere else** in `app/src` or `docs/decisions`.

## Where it lands, and why that is not ll217 or ll20

**ll217** lands on the plain prohibition on every other source. **ll20** lands on heaven not being entered by technique. This lesson **concedes the channel before it refuses the technique**: the Word says plainly that Yahweh speaks in the night, so dreams are not simply another forbidden source, and the teaching is therefore **ownership, direction and discrimination** rather than prohibition. Fifteen movements, ending awake — ask Him for Wisdom with His Word open — and on the one Answer nobody had to dream for.

The sharpest movement is a control case Scripture supplies itself: **Job 33:15 and Job 4:13 describe the same hour in nearly the same words**, one speaker's word was true, and Yahweh told the other *"ye have not spoken of me the thing that is right"* (Job 42:7). The experiences cannot be told apart; only what was said about Yahweh separates them. And **Deuteronomy 13:1-3 refuses a dreamer whose sign came to pass**, so accuracy is not a credential.

Per **DR-1317** no reading was dropped for appearing elsewhere: Jeremiah 23:28 and Ecclesiastes 5:3 are carried by sov36, sov41, sov53 and sov54 in another course for different landings, and both are kept here in full.

## Evidence

- 62 cases green in `app/src/__tests__/living-lessons-ll280-whose-answer-comes-in-the-night.test.js`.
- 317 referenced quoted spans across all 126 strings of the module, every one verbatim against `app/public/bible/kjv`, over 64 distinct references; the sweep asserts its own count and is proven to catch an altered word and a wrongly capitalised mid-verse span.
- **Nine band gaps were found by the lesson's own gate and fixed in the lesson, not in the matchers** — the child band lacked the recording rule, the concession and the unlock clause; the youth band lacked Luke 2:52, the unlock clause and the counterfeit clause; the teen band's concession sentence did not match.
- Band shares 0.73 / 0.91 / 0.97 / 1.19 against floors 0.5 / 0.6 / 0.6 / 0.6; reading grades 0.9 → 7.7 → 8.4 → 9.4, not inverted; differentiation worst pair 0.17 against 0.5.
- DR-0795 proven per band: stripping the child friend line alone names `child` only, while the pooled check still reads green.
- **Library ratchet run before the push (DR-1266):** `censusLesson(ll280).whole === true`, `missingComponents: []`, `missingVersions: []`; the baseline was not re-frozen.
- **133 test files referencing the pinned verses were all run: 6,343 tests green**, including sov66's gate, the holders of the two shared verses, ll274, ll275, ll278, ll279, both talk-together ratchets and the catalog quotation gate.
- Guards clean: `one-teaching-one-lesson-guard` (44 courses, 723 lessons, 0 pairs), `one-thread-one-record-guard`, `derive-lesson-dates --check` (887 of 887 dated).
- Not one figure and not one modern name from the digest reaches a reader, both proven to catch.

## Left open

- **Thread `1a163ce6aaf1fed5` still needs tagging.** `label_thread` needs approval in the coordinating session.
- The deploy is not proved here (DR-0107); that belongs to the coordinator.
- No complete local full-suite run was obtainable — the two-slot vitest gate at `/tmp/kingdom-vitest-slots` prevents it from a worktree; CI's four shards are the authoritative run.
- Every refusal above names the lesson it would land on. If a landing is re-read and found to differ, the refusal is a finding and the item comes back. `re-review: 2026-12-05`.
