# 2026-11-05 — L278: Say What You Get (the halo, not the profit)

**Module id:** `ll278-say-what-you-get`
**Course:** Living Lessons
**Decision record:** `DR-1319`
**Source:** Gmail thread `1a1594cdb35eb4e4`, one message, 161,654 bytes, forwarded 2026-10-20 12:31:04 UTC from dpoe@illinois.edu to darrellpoe06@gmail.com, subject `Fw: Dimon’s Private Pentagon` — a The Daily Upside of 2026-10-20. Darrell's own word above the forwarded `From:` header: **`Lessons`**.
**Who taught:** nobody. The source is a forwarded newsletter, not a recording, so no teacher is identified and every reader text says so rather than implying one (DR-0719).

## What the session did

Built one Word-first lesson from one thread, as `ll278`, with all four age bands plus the adult lesson, and shipped it through the lane as one PR with this record.

## The ground, and why

The subject line names the digest's lead item: a bank's programme to finance and take equity in industries it calls critical to the country's security. The one sentence worth a lesson is the chief executive's own — **not philanthropy, one hundred percent commercial**. He refused the halo.

**Three of the four candidate items were refused by where their teaching would LAND, never by the verses they would use (DR-1317):**

- the promise/performance reading of the two gift-shaped announcements in the opening paragraph is **sov65 (DR-1314)**, built the same day;
- the chip/market item read as a seller's clock is **sov59**;
- the steel item read as a just weight or a renamed problem is **ll98, ll111, ll134, ll144, ll97, ll236, ll178**.

**What was unbuilt is the halo:** not the promise and not the profit, but whether a man says out loud what *he* gets. The spine is **Ruth 4:1-11 read as a closing rather than a romance** — the gate, the ten witnesses seated before a term was spoken, the rival handed the information that could beat him, the honest no with its real reason on it (Ruth 4:6), and then **Moreover** (Ruth 4:10), where Boaz names his own gain in public and the town blesses it. Beside it, **Proverbs 11:26** puts the blessing on the head of him that *selleth*, and **Matthew 6:1-4** aims at the audience rather than the alms, so the two make one rule with two sides: **gain spoken, giving quiet**.

## DR-1317 applied, both ways

Read in full off `origin/claude/a-verse-is-never-spent` (it is not on `main`) before any ground was chosen, and it changed the build twice:

- **1 Samuel 13:19-22 was KEPT** although it is `ll215`'s ground (ll215 lands on counting the cost and who gives the safety; here it grounds the real need under a mining item);
- **Ruth 4:7 and 4:9 were KEPT** although `prop5` carries them (prop5 lands on records making hope legible to the next generation).

**Not one verse was dropped for being used elsewhere.** And **no cross-reference note appears in any reader text** — a reader may open exactly one lesson, so the neighbour comparisons live in DR-1319 and nowhere a reader meets them. A check refuses any reader text that points at another lesson, and is proven to catch a planted one.

## Measured

- **41 anchor references**, every one resolving and quoted in the adult lesson; **161 referenced quoted spans** module-wide, **0 verbatim faults**, **0 bare quoted spans**.
- Bands, authored prose: adult 2,461; child 1,376 (**0.55**), youth 1,628 (**0.66**), teen 2,008 (**0.82**), senior 2,387 (**0.97**). Ladder **1.3 < 3.6 < 5.0 < 5.2**, not inverted, child under the 5.0 new-lesson ceiling. Worst band-pair overlap **0.177** against the 0.25 near-copy line. `fourBandFaults` → `[]`.
- `censusLesson` → **`whole: true`, `missingComponents: []`, `missingVersions: []`** — run before the push, not after CI went red. Baseline NOT re-frozen.
- `placesMissingDirections` → `[]`; `hasAllThreeEverywhere` → `true`.
- **56 cases** in `app/src/__tests__/living-lessons-ll278-say-what-you-get.test.js`, **proven to catch seven ways**, including the DR-0795 proof: stripping the child band's friend line alone names `child` and only `child` while the pooled `hasAllThree` still reads green.
- No reader text states a dollar figure, a percentage or a source magnitude. No company, bank, person, party or branded particular appears in any string of the module.

## Faults the gates produced, not review

Ten on the first test run, every one real: three unresolved references from a `(Matthew 6:3, Matthew 6:4)` form the house grammar cannot parse; a ladder assertion reading `.grade` where `measureLesson` exposes `.authored` (it was passing vacuously); two British `favour`s in the senior band's own voice; the child band carrying the confession in two sentences instead of the asserted clause; four disclosure checks written over five bands that belong over three, because the child and youth bands carry no particulars by design; and a false positive matching `mine` inside Ruth 4:6's quotation. Separately, the corpus sweep caught **five straight apostrophes** where the KJV carries U+2019 — the DR-1273 fault class — and corrected **Proverbs 11:26**, whose real clause is *"but blessing shall be upon the head of him that selleth it"*, not what memory would have written.

## Left open

- **The thread is not tagged.** `Label_22` is not on `1a1594cdb35eb4e4`; that needs approval in the coordinating session. `re-review: 2026-11-06`.
- **The deploy is not claimed here** — the coordinator proves it (DR-0107).
- **No complete local full-suite run was obtainable** (two-slot vitest gate). CI's four shards are the authoritative run.
