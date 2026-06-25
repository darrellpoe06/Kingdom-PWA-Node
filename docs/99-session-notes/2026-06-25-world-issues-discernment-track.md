# World Issues / Discernment track — build note (2026-06-25)

A reusable **per-issue discernment lesson pattern** in the Learn space: it takes a
charged real-world claim and teaches stakeholders **how to think it through**
(media literacy + biblical discernment) rather than telling them what to conclude.
Word-first, evenhanded, grace-centered, age-aware. Rides the **shared Learn
engine** (no fork) — self-paced, like Living Lessons.

## What shipped

- `app/src/lib/discernment-track.js` — the reusable **engine**: the issue schema,
  `normalizeIssue`, `buildDiscernmentModule` (projects a structured issue into the
  standard Learn module shape so it renders through ChurchLearn unchanged), the
  self-paced helpers, and the **machine-checked safeguards** (`auditIssue` +
  per-stage linters).
- `app/src/lib/world-issues-class.js` — the **course** ("Thinking It Through:
  World Issues & Discernment") + the first worked example (Elon Musk creator
  critique). Self-paced; wired into ChurchLearn via `extraCourses`.
- `app/src/components/DiscernmentStages.jsx` — the dedicated **five-stage
  renderer** (shown when a module carries a structured `issue`; inert otherwise).
- Tests: `discernment-track.test.js` (engine + proven-to-catch),
  `world-issues-class.test.js` (the published Musk issue passes the gate),
  `discernment-stages-render.test.jsx` (real surface mounts, safeguards visible).

## The five stages (the transferable pattern, identical for any issue)

1. **THE CLAIM** — every claim stated as made, **labeled** (allegation / claim /
   opinion / call-to-action) and **attributed** to its source. Never a verdict.
2. **VERIFIABLE vs INTERPRETATION** — documented fact (checkable against primary
   sources, each with an **as-of date**) kept apart from inference/opinion.
3. **PERSPECTIVES** — every side **steelmanned** (>= 2).
4. **THE BELIEVER'S LENS** — 4D (deep source -> plain -> benefits) + truth-AND-
   grace + **no condemnation of any person** + Scripture on justice + biblical
   stewardship / economic-empowerment, without demonizing anyone.
5. **REFLECTION + SKILL** — discussion prompts + the transferable discernment
   skill (check sources, righteous engagement over outrage, peace in a divisive
   world).

## Safeguards (enforced as machine checks; proven-to-catch in tests)

- Every claim **labeled + attributed**; none asserted as a verdict.
- Every documented fact carries **>= 1 source with an as-of date**.
- **>= 2 steelmanned perspectives** (evenhanded).
- **No platform-published one-sided persuasion against a named real public
  figure**: a call-to-action (e.g. a boycott) is carried ONLY as the creator's
  labeled position; the lesson's own voice issues no directive to boycott/condemn
  the person; a **grace-note** is required.
- **Age-appropriate** child rendering, screened (kids use the app).

A deliberately-broken issue fails the matching linter (anti-theater, DR-0076).
The safeguard was tuned during the build so it catches an *adopted* directive
("you should boycott") while permitting *neutral discussion* of a boycott in a
prompt — a discernment lesson must be able to discuss the thing it examines.

## The Musk worked example — fact vs interpretation

Handled as **one creator's argument** (DAT BOY WILL), sourced and labeled — not
repeated as truth. Anchors re-verified by live web search on 2026-06-25.

**Documented (with sources + as-of dates, all in `world-issues-class.js`):**
- xAI's South Memphis "Colossus" air permit — 15 gas turbines, Shelby County
  Health Dept., **July 2, 2025**; NAACP/SELC appeal. (Action News 5, 2025-07-02;
  SELC, 2025-07-16.)
- The Owen **Diaz** racial-harassment **jury finding** vs Tesla (2021; reduced;
  settled 2024) — a court FINDING, distinct from the unadjudicated CRD (2022) and
  EEOC (2023) **allegations**. (Fortune 2023-04-03; TechTimes 2024-03-15; CRD
  2022-02-10; EEOC 2023-09-28.)
- **Grok** outputs — May 2025 "white genocide" replies, July 2025 antisemitic
  "MechaHitler"; xAI's stated cause is the company's claim. (TechCrunch
  2025-05-15; CNN 2025-07-12.)
- **AI regulation by type**: Musk **supported** SB 1047 (AI *safety*, Aug 2024)
  while xAI **opposed** an AI *anti-discrimination* law (free-speech framing).
  (TechCrunch 2024-08-26; X 2024-08-26.)
- **BEE / Starlink** — documented that Musk criticized BEE; the sharper "142
  racist laws" framing is **disputed** by SA fact-checkers. (IOL 2026-04-14;
  News24 2025-05-22.)
- **Tesla Takedown** — a real, largely peaceful 2025 protest movement, distinct
  from separate criminal vandalism. (NPR 2025-03-29; NPR 2025-03-20.)

**Modeled AS interpretation (not stated as fact):** "Musk is a racist" (a
conclusion about a heart); "opposing a bias law = endorsing discrimination";
"Grok amplifies race science" as a blanket property; "BEE has failed"; "the
turbines are an illegal power plant" (a contested legal characterization in
active litigation).

**The boycott** is carried only as the creator's labeled **call-to-action**,
alongside other responses (protest / build alternatives / pray / do nothing). The
lesson itself issues no verdict on Elon Musk and no boycott directive.

## Review

Per **validate-by-using-app** (no human-review gate on a non-technical person;
only an unmet *safety gate* holds): the safeguards are met and machine-checked, so
this ships gates-green. Bishop / family review happens **by using it in-app**.

## Verification

Lint clean; `vite build` green; full vitest suite green (incl. the new engine,
course, and render tests); contrast / tab-overflow / module-boundary guards green.
