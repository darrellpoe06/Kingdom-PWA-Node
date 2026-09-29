---
id: DR-0671
title: The towers learn the process until their lessons match Claude's; Claude writes the algorithmic fixes
date: 2026-09-29
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [poetech]
grounds: [SOVEREIGN-FIRST, DETERMINISTIC-FIRST, VERIFICATION-DOCTRINE, THREE-BRAKES, HOLD-THE-HAND, PERPETUAL-IMPROVEMENT, EARN-AUTONOMY, APP-IS-PRIMARY, WORD-FIRST, DECISION-RECORDS]
source: Darrell, 2026-09-29, in the session that built the NAS lesson builder (DR-0669), the Your lessons Compare view (DR-0668) and OpenClaw on the towers (DR-0670)
---

## Context

In his words:

> "The final goal is to not need any no local model... we need to make more workflows that produce the same outcome from claude based on the process being used... claude needs to create the specific algorithmic fixes for our workflows to work on the towers etc..."

Earlier the same day:

> "I want to be able to use any LLM? To see the difference between lessons after they receive the same prompts... and have both versions of the same lessons to validate against to see..."

> "I'm not trying to cut any quality..."

And, adding the cross-reference:

> "gemini... chat... etc... so we can even cross reference them..."

The end state. Lessons, and later other workflows, are written on our own towers by local models plus deterministic code, at the SAME quality Claude writes them today. Claude's role becomes the teacher of the process. It studies where the tower's output falls short of its own and writes the specific algorithmic fix: deterministic code, retrieval, scaffolds, checklists, prompt structure. It keeps doing that until the tower's output matches. Quality is not cut to get there.

## Impact

Today every lesson is written by Claude, a vendor model, and a tower version has no measured standard to meet. With this loop, every tower version is measured against Claude's by code; each shortfall becomes named, fixable work that Claude turns into deterministic code in our own repository; and the tower becomes the writer only once the data shows it matches. The towers gain the process, the house keeps its quality, and the dependence on a vendor model shrinks as the fixes land. Reversible: the stop-paths below halt it, and a held writer never becomes primary.

## Decision

Build the **parity loop**: measure, name the gap, fix, promote. It lives in `infra/nas-lesson-parity` as a sovereign Python service on the NAS and reads `public.lesson_versions`, which the NAS lesson builder writes (DR-0669). The builder sends one identical prompt to every writer and runs the same gates on every version.

1. **Measure (deterministic, no model judges a score).** `parity_core.compare(reference, tower)` returns a score with seven sections. Each section returns the evidence it was computed from.

   | Section | Weight | What is measured |
   | --- | --- | --- |
   | gates | 0.20 | Stored gate results side by side, plus our own verse gate: each quoted span with a reference is checked verbatim against `app/public/bible/kjv`. |
   | coverage | 0.25 | Each verse the reference cites, present or missing. Each reference movement (its ALL-CAPS points, the house convention) is covered when its theme words or half its verses appear in a tower movement. |
   | structure | 0.15 | Required fields, and counts (benefits, talking points, movements, quiz). |
   | bands | 0.15 | All four bands present and at the house floor (`FULL_FLOOR`). |
   | quiz | 0.10 | Count; errors (malformed, answer index, a verse the lesson never cites, a misquote); grounding held relative to the reference. |
   | reading | 0.10 | Flesch-Kincaid per band against the new-lesson child ceiling, band order, and within 1.5 grades of the reference. |
   | length | 0.05 | Words per band, from 0.75 to 1.33 times the reference. |

   The reading level, band fullness and verse gate are the house's JavaScript gates ported to Python. `app/src/__tests__/tower-parity-pins.test.js` runs both on 33 real lessons and requires identical numbers, so the towers are scored by the same standard as every published lesson.

2. **Name the gaps.** Each shortfall becomes a fixable class, with its evidence and the kind of fix that closes it: `gate-failure`, `misquoted-verse`, `missing-verse-retrieval`, `missing-movement`, `weak-structure`, `missing-band`, `short-band`, `reading-level`, `band-order-inverted`, `quiz-count`, `quiz-errors`, `quiz-ungrounded`, `length-short`, `length-long`. A test plants each defect and requires its class to fire.

3. **Claude writes the fix.** A gap class is recurring when it appears in 3 of a tower writer's last 10 teachings. For each recurring class, the fix step runs one headless Claude Code call on the NAS. It uses **the same Claude Code CLI the lesson builder writes with** (DR-0669): the local Claude entry in the builder's `lesson-writers.json`, or the builder's default when that file is absent. The builder's own code resolves the binary, the signed-in user it runs as, the model and the label. So Darrell has no new step, and no model identifier is in the repo. `PARITY_FIX_CMD` exists only as an optional override.
   - The call works in a fresh worktree of main made from the builder's own clone. It is given the class, the measured evidence and the stored example. It may read, edit and run `python3`, and nothing else: no git and no network tools.
   - It writes ONE deterministic fix in `fixes/<name>.py` behind the interface `GAP_CLASS`, `STAGE` (pre or post), `apply(ctx)`, and adds a test that re-measures the stored example before and after.
   - **The loop, not the model, decides whether it ships.** It re-runs the parity tests in that worktree and requires an enabled fix that declares the class. Only then does it commit and push with the builder's token, and the lane opens the PR. A fix whose tests fail is recorded as failed and never pushed.
   Each fix is then carried to its outcome by the measure pass (hold the hand, DR-0621):
   - `pushed` becomes `merged` when its module is enabled on main;
   - `merged` becomes `closed-verified` only when the class shows in fewer of the writer's next 10 teachings than before;
   - otherwise it becomes `failed` ("the gap persists"), which frees the class for a new fix;
   - a PR never merged within 14 days is released the same way.

   The first fix ships with this record as the worked example: `fixes/verse_retrieval.py`, a deterministic topic-to-verse retrieval (explicit references, then their cross-references from `app/public/bible/xref`, then TF-IDF over the KJV). Measured on the stored example (L180):
   - The tower that cited only the anchor covers 1 of the reference's 7 verses.
   - From the teaching's words alone, the retrieval puts 3 of the 7 into the prompt.
   - When the teaching names three verses, it puts 6 of the 7 into the prompt.

4. **Promote.** A tower writer becomes the PRIMARY writer when its version scores at least **0.95** and holds every hard floor on **14 teachings in a row**. The measure pass records this in `lesson_parity_promotion` without anyone starting it. Agreed work starts itself; the Governor's **Hold** (in the app, `set_lesson_parity_hold`) is the brake, and a held writer stays `ready`. A single miss resets the streak and returns a primary writer to `reference-only`. Claude stays the reference in every case.

5. **Cross-reference, added by Darrell's word.** For each teaching, `parity_core.crossref` compares every version with every other, not only with Claude's. Its agreement matrix covers verses, movement themes, structure, gate agreement, quiz answers and quiz verses. The consensus sorts verses and themes by how many writers carry them: all, most, some, or one. A version that fails the verse gate (our check, or a stored `verse`/`kjv` gate) is excluded; the gates stay absolute. Something only one writer brought is a **candidate insight, never an error**. Claude remains the reference for promotion. The loop also records `reference_vs_consensus` per teaching (Claude's verse set against the consensus), so that a later record can decide, from measurement, whether consensus should become the reference.

6. **Tables** (migration 0242). `lesson_parity`, `lesson_crossref`, `lesson_parity_fixes` and `lesson_parity_promotion` can be read only through `is_lesson_governor()` (his two sign-in doors, 0237). No write policy exists for anyone; the NAS writes with the service role. `lesson_versions` is the builder's own table (its migration 0240); 0242 never creates or alters it. A test pins that every column the loop reads is a column the builder creates. Comparisons are made within one `build_id`, the builder's single fan-out of one identical prompt to every writer. A version with an `error` or no body is not measured.

7. **In the app.** Projects → Decisions has a **Tower parity** panel (`TowerParity.jsx`) beside the member-lesson queue. It shows, per tower writer: the latest parity, the last 12 lessons as a table, the streak against N, the status, and Hold. It also lists open gap classes, the fixes Claude has written with their PRs, and, per lesson, the pair matrix, the consensus, the candidate insights and the excluded versions. It reads the tables; it does not edit the DR-0668 Compare view's files.

8. **Generalize, then stop.** `workflows.py` documents the interface another workflow supplies to join the loop (a versions table of the same shape, compare, crossref, gap classes, a fixes package, threshold and N). Only lessons are built.

## What was measured

Why 0.95 and 14: measured choices, conservative on purpose.

No tower version exists yet to measure, so the threshold was set from the house corpus itself. The runs below are in `parity_core.py --calibrate`, pinned in vitest:

- **Every four-band house lesson against itself** (127 lessons): 1.0, zero gaps, zero broken floors. So the reference never fails its own standard.
- **A different house lesson as the candidate** (126 pairs): median 0.757, maximum 0.865. Even a good lesson on the wrong teaching scores about 0.75 on shape alone, so the threshold must sit clearly above 0.865. It sits at 0.95, and none of the 126 would count.
- **One planted defect per lesson** (127 lessons each):
  - dropping a band: 0.938;
  - halving the quiz: median 0.915;
  - breaking one quiz answer: median 0.983;
  - cutting the youth band to a third: median 0.957;
  - doubling every band: 0.987;
  - writing the child band at an adult grade: median 0.917.

  Three of these still scored above 0.95. **Short bands** counted on 112 of 127 lessons, **doubled bands** on 127, and an **adult-grade child band** on 25. Because quality is not to be cut, each was made a **hard floor**: every band within 0.75 to 1.33 times the reference, and the child band at or under its ceiling with the bands in order. After that change, **no single defect counts on any lesson**.
- **Hard floors** (every one must hold): the verse gate is clean; no gate the reference passes is lost; all bands are present; the quiz is sound and complete; at least 80% of the reference's verses are covered; the bands are within length; the child band is readable.
- **N = 14.** If a writer's true rate of reaching parity were only 0.8, the chance of 14 in a row is 0.8^14 = 4.4%. A streak of 14 therefore shows a rate above 0.8 with 95% confidence. At the in-app lane's hourly clock and a few lessons a day, 14 teachings is days to weeks of real lessons, not hours.

Both numbers are environment parameters (`PARITY_THRESHOLD`, `PARITY_N`), and changing them is a new record. **re-review: 2026-10-27.** Read the first month of real tower versions:
- the score distribution of versions a person judges equal to Claude's;
- how often the floors fire;
- `reference_vs_consensus`, to decide whether consensus should become the reference.

Loosen only on that measurement.

## The brakes (proven to catch, `test_lesson_parity.py`, gates merge in ci.yml)

This is the AI class. It spawns a vendor model on a clock, so it carries the full set. There is no count cap on lessons (Darrell, DR-0667). The measure pass has a time budget only, and whatever it does not reach, the next pass reaches.

- **Budget.** Each fix step has a wall-clock limit (`PARITY_FIX_MAX_SECONDS`, 1800) and a turn limit (`PARITY_FIX_MAX_TURNS`, 40), and makes one fix per run.
  - The writer is killed at the wall-clock ceiling. This is tested with a real `sleep` process.
  - The turn limit is passed to the writer and checked on its report.
  - `install.sh` also wraps the step in `timeout`.
- **Lock.** Each stage has a single-instance lockfile (`measure.lock`, `fix.lock`) taken with `O_EXCL`. A second fire skips. A stale lock is broken.
- **Kill.** These are the lane's own stop-paths:
  - delete `infra/nas-loops/ARMED-BY-RECORD`;
  - set `lesson-parity` in `services.json` to `enabled:false` (stops everything);
  - set `fix_enabled:false` (stops only the Claude step).

  Because this step calls a vendor, it also pauses itself after 3 failures in a row. The pause decays after 24 hours (the DR-0248 shape), so it can never stop the lane permanently and silently.
- **Placement.** The loop rides the already-armed services-sync clock (the lesson-voice pattern). The fix step runs detached, in its own session with every stream redirected, so it can never hold up or be killed by the 600 s services-sync cycle.

## What only Darrell can supply

Nothing new. The fix step runs on the Claude Code CLI the builder already uses, and pushes with the builder's token. When no local Claude writer is available (the builder is not installed, or its Claude entry is SSH-only), the fix step stores each ready prompt as `awaiting-writer` with the reason, and the panel shows it. It runs once a writer is available.

## Verification

- `python3 -m unittest test_lesson_parity -v`: 48 proofs, covering determinism, every gap class, crossref and consensus, promotion and the hold, the measure pass (no count cap, time budget, idempotent), every brake, each fix carried to its outcome, and the first fix before and after.
- `app/src/__tests__/tower-parity-pins.test.js`: the Python port gives the same numbers as the JS gates on 33 lessons, a planted misquote fails both, the corpus calibration holds, the `lesson_versions` shape is pinned, and no model identifier appears in the service.
- `app/src/__tests__/tower-parity.test.jsx`: the panel over a fake database that answers like 0242.
- `infra/supabase/tests/0242-lesson-parity-smoke.sql` (RLS matrix leg `lesson-parity`) passed on a local Postgres 16. It failed as it should when a member read policy or a write grant was planted.
- The flow graph gains `lesson-parity` and `tower-parity`. `db:lesson_versions` is the builder's resource; this change reads it.

## Order of landing

This record depends on the lesson builder (#1837, DR-0669). The builder owns `lesson_versions`, and the fix step runs through its `lesson_writer` and `Git`. #1841 (Your lessons, DR-0668) holds 0241. The parity tests read the builder's migration and writer code, so the follow-up lands after #1837, or together with it.

**The first cut was applied, so its file stays.** The first cut merged as #1845 with its tables in `0240-a-tower-writer-is-measured-...`. db-migrate applied it to the hosted and sovereign databases on 2026-09-29 at 06:24 UTC (run 36530830350).
- Applied history is frozen: the ledger allows only one file per ordinal (0225). That file therefore stays byte for byte, and ordinal 0240 is taken in the ledger.
- **The builder's migration must take 0243 or later.** If it kept 0240, its ledger row would be rejected. It would also sort before the repair below.

**The repair is 0242.**
- The first cut created `lesson_versions` "if not exists" in the documented shape. 0242 removes that early copy, but only when the table lacks `build_id` and holds no rows. A table with rows is left for a person to look at.
- The builder's migration then creates its own table, in its real shape.
- 0242 also brings `lesson_parity` and `lesson_crossref` to the `build_id` shape.
- The parity loop never writes `lesson_versions`.

Proven on a local Postgres 16:
- the first cut, then 0242, then the builder's migration, then 0242 again: the builder's shape, `lesson_crossref` keyed by `build_id`, and the parity smoke passing;
- a `lesson_versions` that holds a row is left untouched.

## Links

DR-0669 (the NAS lesson builder), DR-0668 (Your lessons, Compare), DR-0670 (OpenClaw on the towers), DR-0667 (no count cap), DR-0247 and DR-0248 (started by record; the stop-paths), DR-0621 (hold the hand of the process), DR-0076 (verification doctrine), DR-0635 (`is_lesson_governor`).
