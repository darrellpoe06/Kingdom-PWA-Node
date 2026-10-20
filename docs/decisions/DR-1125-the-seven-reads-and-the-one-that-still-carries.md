# DR-1125: The seven reads — three were already closed, three are closed now, and the one the flag saved is the one that still carries work

**Date:** 2026-10-20
**Status:** accepted
**Tier:** A (four PR comments, three PR closes, branches kept; no code, no surface, no schema, no money)
**Type:** way

**Area:** PRs #284, #286, #311, #432, #1196, #1731, #2059 — the seven DR-0991 flagged `superseded?`.

**Answers the re-review in:** DR-0991, due today — *"NOT decided: what becomes of the other six. Each needs a read of what, if anything, it still carries that `main` lacks. Six reads, and the answer per PR is either 'close it' or 'here is the one thing still missing' — which is real work, not a sweep."*
**Principles:** DR-0991 (a superseded PR is not a drain; the tool flags and stops, a reader decides); DR-0076 §4 (measure, don't claim) and §8 (provenance); DR-0990 (the frozen monolith ceiling); DR-0111 (do the work that is already decided).

## Context

DR-0991 added a fourth question to the backlog triage — *is every file it ADDS
already on `main`?* — and gave the answer a deliberate question mark, because
only a reader can say whether a PR still carries something `main` lacks. Seven
PRs came back `superseded?`: **#284, #286, #311, #432, #1196, #1731, #2059**.
Its own closing words: *"Nothing is damaged: none of the seven is on the merge
path."* And its re-review, dated today, was the reading.

## What was measured

Every claim below is `git` against `origin/main` at `4ef997c44`, never the
PR's own description.

**Three of the seven no longer exist as open work.** #311, #432 and #1731 have
been closed since 2026-10-13 by other hands. Four reads remained, not six.

**The two-dot diff is the wrong instrument here and said so loudly.** `git diff
origin/main refs/pull/284/head` reports **936,093 deletions** across 5,783
files — which measures how far behind the branch is, not what it proposes. The
reading is `origin/main...head` (merge-base to head): #284 proposes 30 files and
6,995 insertions. A superseded-PR review done with the wrong diff would report
every one of these as a catastrophe.

**#2059 — *"the sign-in heal was knocking on a door that was never there."***
It adds `.github/workflows/nas-signin-heal.yml` (+757). `main` holds that file
at 757 lines and the file-scoped diff against `main` is **empty** — identical,
byte for byte. Its only other file, `scripts/system-flow-registry.mjs`, is
**older** than main's: merging would DELETE entries main has gained, among them
the `nas:lesson-builder` / `write_status` write and the entire
`apt2-photos-probe.yml` node.

**#286 — the Concerns board.** All six files it adds are on `main`. Of the 6
lines it adds to `Projects.jsx`, 3 are absent from main — and each is an
*earlier* form of something live: main imports `ConcernsBoard` at line 9 and
renders it at line 374 **with three props this branch does not pass**
(`transactions`, `rentals`, `debts`), and main already carries the
`⚠ Concerns & Solutions` tab. Merging would narrow the board's data. It also
adds ~80 lines to the frozen `poe-financial-mvp-v28.jsx`, which may only shrink
(DR-0990).

**#284 — the Feature/Workflow REGISTER.** All 26 added files are on `main`,
including `FEATURE-WORKFLOW-REGISTER.md` itself, `DR-0079`,
`lib/sovereign-ai-class.js`, `lib/assignments.js` and
`migrations-auto/0040-contractor-type.sql`. Line by line on the modified files:
`ChurchLearn.jsx` **0 of 45** added lines absent from main;
`darrells-study/yahweh-discussions.md` **0 of 17**; the monolith **12 of 112**,
and those twelve are the first wiring of the Sovereign A.I. course
(`SOVEREIGN_AI_HELPER_TAG`, `extraCourses={[infrastructureCourse,
sovereignAiCourse]}`) plus an early `BigPictureDashboard` signature. That course
shipped as a 42-week catalog; `sovereign-ai-class.js` carries 6,402 referenced
Scripture spans on main today. Also a monolith toucher: +112.

**#1196 — and this is the one the question mark was for.** Its only ADDED file
is already on main (`DR-0272`), so the fourth question says `superseded?`. Its
substance is in **modified** files, which that question does not reach:

| file | lines it adds that `main` lacks |
|---|---|
| `infra/church-media-golive/choir_dates_sync.py` | **80 of 89** |
| `infra/church-media-golive/choir_dates_install.sh` | **10 of 11** |
| `docs/reviews/REVIEWS.md` | 1 of 7 |
| `.github/workflows/nas-bootstrap.yml` | 0 of 28 |
| `infra/nas-loops/README.md` | 0 of 28 |

The workflow and README halves landed; the Python did not. It carries two
things, both of them this house's own doctrine: a `last_err` that distinguishes
*"binary not found"* from *"binary ran and yielded nothing"* and surfaces the
tool's own words (its comment cites run `30938520538`, where a swallowed docker
error burned a diagnosis — DR-0076 §8), and **attempt tracking with an honest
terminal state** — a row whose video page yields nothing after `EXHAUST_AFTER`
separate real attempts is evidence-exhausted, never dated by invention and never
retried forever, with the DONE marker documenting which ids remain undateable
and why so the fleet returns to a truthful green while the rows stay honestly
NULL.

## Decision

**#2059, #286 and #284 are closed, each with a preserving comment** carrying the
measurements above and naming what would have been lost by merging. Branches
kept, per `pr-janitor`'s convention and DR-0991's own handling of #789.

**#1196 stays open, and its comment records what it still carries** so the next
reader does not re-derive it. Not merged as-is: the branch is far behind `main`
and the diff would carry that. The shape of the work is named instead — lift the
two changes onto a fresh branch off current `main`, with a test proving the two
failure modes report differently, after which this PR closes as the source it
was.

**The flag is vindicated exactly where it mattered.** Four of the seven were
genuinely superseded and three were already gone; the fourth was not, and
`pr-janitor` would have been wrong to close it. DR-0991 Decision 4 declined to
widen the janitor's emptiness test to "looks superseded" — *"Supersession is read
by a person; emptiness is proven by a command"* — and #1196 is the case that
reasoning was protecting.

## Impact

**What this buys.** DR-0991 described the seven as *"seven live invitations to
walk `main` backwards, each wearing a green check and a plausible title."* Three
of those invitations are withdrawn with the reason attached, and the one that was
never an invitation is documented as real unshipped work instead of being
mistaken for a drain. The backlog's `superseded?` column is answered.

**What this does not do.**

- **It does not lift #1196's work onto `main`.** That is a real change with its
  own verification — two failure modes that must report differently — and it
  belongs in its own record, not in a triage pass. **`re-review: 2026-11-20`** —
  whether the choir-dates error provenance and attempt tracking have landed, or
  #1196 is still the only place they exist.
- **It does not re-run the fourth question across the backlog.** The counts
  DR-0991 measured (17 drain / 17 rebuild / 7 superseded?) are from 2026-10-13
  and three of the seven have closed since, so the other columns have moved too
  and nothing here re-measures them.
- **It does not change `pr-janitor`,** for DR-0991's reason, now with a worked
  example behind it.
- **It takes no action on the three already-closed PRs** (#311, #432, #1731).
  Who closed them and why is not recorded here; I did not read their threads,
  only their state.

## Verification

Every number above is reproducible with one command against `origin/main`:
`git diff --stat origin/main...refs/pull/<n>/head` for what a PR proposes,
`git diff --name-status --diff-filter=A` plus `git cat-file -e origin/main:<f>`
for whether an added file is already there, and a per-line `grep -F` of each
added line against `git show origin/main:<f>` for the modified ones.

The four comments are the artifact; they are posted on the PRs with their
measurements, so the reasoning is where the next reader will be rather than only
in this file.

`npm run lint` exit 0. `npm run verify:gates` exit 0. Full vitest suite green
before pushing (DR-1072's standard — no picked suites).

**What I would have got wrong without measuring.** The two-dot diff's 936,093
deletions reads as a PR that deletes the repository. Had I reported from it,
three closes would have carried a false reason, and the one PR that still holds
work — #1196, which the same instrument also flagged — would have been closed
alongside them on the strength of a number that answered a different question.
