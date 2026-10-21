# DR-1185: Prudence engineering — a jobs ledger that says what ran, docs and links that move with the system, and workflows built to be reused

**Date:** 2026-10-21 (notes dated 10.20.26 9:21 PM and 10.21.26 by Darrell)
**Status:** accepted
**Tier:** A for the record; the jobs ledger it opens is Tier A (read-only reporting over real run records; nothing fires, nothing moves)
**Type:** way
**Area:**
- this record (the notes, captured verbatim-for-meaning, DR-0331)
- `app/src/components/OpsBoard.jsx` (the surface the jobs ledger joins; tracked build, dated below)
- `infra/nas-loops/registry.json`, `.github/workflows/*.yml` (`schedule:` — 41 cron workflows), the Cowork scheduled tasks (the three populations of clocked jobs)
- `docs/decisions/DR-1182` and its six rewritten tests (the worked example of "docs and links move with the system")

**Amends:** nothing. Grounds: DR-0076 (measure, don't claim), DR-0108 (review our Ways), DR-0219 (SHOULD → ARE → GAPS → CLOSE), DR-0236 (nothing waits), DR-0247 / DR-0248 (the deterministic loop fleet, armed by record), DR-0611 (spoken input lands the same session), project memory `project_app_to_nas_transport_and_sovereign_python` (the backend direction is sovereign Python).
**Declared by:** Darrell, 2026-10-20 and 2026-10-21, as a stream of short notes sent into the session while the Learn work was running.

## Context

**His notes, in his order, rendered for meaning.**

1. *10.20.26.* Qualitative and quantitative engineering skills and development, so that strategies, tactics and tasks are transferred into the systems we build; those workflows then train our businesses and users, really families and businesses. Comprehensive evaluation and engineering that produces perpetual data and development for our stakeholders.
2. *10.20.26 · 9:21 PM.* **Prudence engineering.** Yahweh's Perspectives Algorithms, designed for learning content and development.
3. *10.21.26.* Documentation and the system links need to be aligned, so that whenever anything changes location, or whatever we change, all the necessary tasks associated with the system change with it.
4. Data quality controllers and reporting systems: are they fundamentally sound? (asked, with force)
5. Cyclical calendars for stored procedures and the like.
6. Reminders.
7. Actual job names.
8. Number of jobs; last ran; never ran; the sequence of things; logs.
9. Python, or the best language, for tasks that do not break: solid solutions that are reusable.
10. Least likely to undermine, with sustainable development, growth and impact that is flexible, efficient and profitable.

**What they are.** Notes 1, 2, 9 and 10 are a Way: engineering that moves knowledge into the system (DR-0108's standing question), in a language chosen so the task does not break and can be reused, judged by the fruit (sustainable, flexible, efficient, profitable, least likely to undermine). Note 3 is a rule the repository already carries in practice and now carries by name. Notes 4 through 8 are one specification: a **jobs ledger**, the reporting half of "data quality controllers and reporting systems".

**The name.** *Prudence engineering* is his word for it and is kept as his word. The Word grounds it without a debate, quoted from the repository's own KJV corpus: **KJV — Proverbs 14:15:** *"The simple believeth every word: but the prudent man looketh well to his going."* and **KJV — Proverbs 22:3:** *"A prudent man foreseeth the evil, and hideth himself: but the simple pass on, and are punished."* A job that ran and nobody can see ran, or never ran and nobody knows, is the simple passing on. The ledger is the prudent man looking well to his going.

## What was measured

**SHOULD.** Every clocked thing the house runs is visible in the app by its actual name, with its cycle on a calendar, when it last ran, whether it has never run, the order things run in, a way to its logs, and a reminder when a cycle is missed (DR-0076 §1: no claim without evidence; DR-0125: a thing has its own witness).

**ARE, traced 2026-10-21.**

| population | where it is recorded | what the app shows today |
|---|---|---|
| GitHub scheduled workflows | `.github/workflows/*.yml` with `schedule:` — **41 files, 40 `cron:` lines** | the OpsBoard reads the repo API live for the merge lane, site health, harvest, the tower and the fleet census; it shows **no list of the scheduled workflows by name**, no last-run per workflow, no never-ran |
| NAS deterministic loops | `infra/nas-loops/registry.json` (armed by `ARMED-BY-RECORD`, DR-0247; clocked by DSM or crontab, DR-0272), `state/`, `events/` | the fleet census strip shows a census date and the tower strip shows one last run; **no per-loop last ran / never ran**, no sequence, no log link |
| Cowork scheduled tasks | the account's scheduled tasks (not in the repo) | nothing in the app |
| the OpsBoard's own vocabulary | `OpsBoard.jsx:152` `t.lastRun`, `:211` `census stale (last ran …)` | "last ran" exists for two strips only |

**GAPS.** No single ledger. Job names are known only to whoever reads the workflow files or the registry. "Never ran" is not a state any surface can show. There is no cyclical calendar view and no reminder when a cycle is missed. Logs are one click away on GitHub for the workflows and on the NAS for the loops, but not from the app.

**CLOSE.** A tracked build, started with the half that has real data reachable from the app today (the GitHub workflows, through the same public API the OpsBoard already reads: `GET /actions/workflows` for the names and their `schedule` triggers, `GET /actions/workflows/{id}/runs?per_page=1` for last run and conclusion, a run count of zero for never-ran, `html_url` for the logs). The NAS half rides the loop registry plus the `state/` records the tower lane already publishes. `re-review: 2026-10-28`.

## Decision

1. **The jobs ledger is a surface on the OpsBoard** named "Jobs", reading real run records and never a typed list: for every clocked job, its actual name, its cycle (the cron, rendered as the next three fire times on a calendar), last ran (time and verdict), **never ran** as its own state, the sequence (runs in time order, newest first), a link to its logs, and a reminder line when a cycle has been missed (a scheduled job whose last run is older than its cycle). Unknown is drawn as unknown, never green (DR-0125).
2. **Docs and links move with the system.** When anything changes location (a block leaves a tab, a route is renamed, a file moves), every task associated with it moves in the same change: the tests that pinned it, the decision record that grounded it, the INDEX row, the registry entry, the session note. DR-1182 is the worked example: six tests rewritten, two records amended, the registry checked, in one change. A change that moves a thing and leaves its pins behind is not done (DR-0219 CLOSE).
3. **Tasks are written in the language that does not break and can be reused.** New routine jobs are plain Python on the NAS (the standing direction), with explicit timeouts and failure paths, each one registered in the loop registry so the ledger can see it the day it is born (HOLD-THE-HAND: new workflows join at birth).
4. **The Way is judged by its fruit:** sustainable, flexible, efficient, profitable, least likely to undermine. A job that cannot report itself fails that test before it fails any other.

## Impact

A steward opens the app and reads what ran last night, by name, and what did not. Darrell's question "are the data quality controllers and reporting systems fundamentally sound?" gets an answer from a surface instead of a sentence. A family member or a business using the workflows inherits the same discipline: the system reports itself.

## Verification

- This record's grounds are the notes above; nothing in it is inferred beyond them.
- The jobs ledger's own gate, when it lands: every row from a real API read or a real registry entry; a workflow with zero runs rendered as "never ran"; a job whose last run is older than its cycle rendered as a missed cycle; a failed read rendered as unknown with the reason. Proven to catch with a fixture of one workflow with no runs and one with a stale run.
- `re-review: 2026-10-28` — the Jobs surface is on the OpsBoard reading the 41 workflows live; the NAS half is next.
