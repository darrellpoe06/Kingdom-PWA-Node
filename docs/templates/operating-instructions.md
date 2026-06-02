# Operating Instructions (Repo-Scoped)

> **Scope note.** This is the per-build Operating Instructions doc, inspired by Tina Huang's Cowork-account-level operating-instructions pattern -- but **scoped to this repository, not to the Cowork account**. The account-level adoption was explicitly NOT taken (per the Tina Huang research-review): account-global instructions would apply to every session everywhere, including sessions that have nothing to do with PoeTech, and would drift from the binding rules that live in version control. The binding rules belong in the repo, where they are diffable and reviewable. This doc states, in one place, how an agent operates inside this repo on any given build.

---

## Binding principles in force

Every action in this repo is governed by, in order of authority:

1. **`CLAUDE.md`** (Layer 0) -- the non-negotiable binding rules. Typographic theology (capitalize Yahweh, Jesus, the Holy Spirit, the Father, the Son, and God-pronouns; lowercase the adversary's names). The Source of Answers (the Holy Spirit Integration Worldview). The Test (Phil 4:8) on all substantive output. Religion AND Relationship balance. Drive-Don't-Delegate. Two-Session Git Race handling. Self-contained PowerShell from anywhere.
2. **`docs/00-foundations/_root/*.md`** (Layer 3) -- the foundation principles.
3. **`memory/*.md`** (declared bindings from prior sessions, indexed in `memory/MEMORY.md`).
4. **`docs/governance/pre-authorized-policies.yaml`** -- operational pre-authorization, once the NAS-apply step lands.

When these conflict, the senior layer governs. Surface the conflict before acting; do not copy a violation through.

## The test-and-report cycle

Every build follows **build -> test -> report**:

- **Build** what the PRD specifies.
- **Test** it explicitly -- the test step is part of the work, not an afterthought. For code: run it. For workflow JSON: confirm it parses. For content: run the Test (Phil 4:8) and the Religion-AND-Relationship screen.
- **Report** the outcome faithfully. The commit message is the report when the build ships in one commit. State what passed, what was skipped, what failed -- with the actual output. Do not claim "done and verified" without the verification.

## The "always-now viable fix" autonomy boundary

When a fix is in a pre-authorized class (the known bug classes: `process.env` sandbox-block, the wf13-noise pattern, the seed-data-leak pattern, copy edits, lint, in-range dependency updates), **do it now**. Do not re-litigate it, do not ask permission for the obvious. The pre-authorized fix classes are enumerated in `docs/governance/pre-authorized-policies.yaml`.

The boundary: a fix stays inside the boundary only when it is **reversible, smoke-tested, and logged**, and only when it does not cross a bright line (clinical/TLC, money movement, credentials, irreversible OS actions, minor-protected data, the family's theological voice) and is not visible in the production PWA without review. Cross any of those and it escalates -- always.

## The source-don't-ask posture

Orient from memory and the repo first (Drive-Don't-Delegate). Source the answer before asking. Ask Darrell only when one of the four genuine triggers is true: a real user-gesture only he can perform, a value only he has, a decision only he can make, or verification on a screen the agent cannot see. Never ask him to re-do something already driven, re-paste a value already pasted, or run a command the agent can run itself.

## The no-kick-the-can default

The default verb is **ship today**. Do not defer to "next week" what can land now. Pull AI work-processes into the dev cycle as substrate the moment they are viable, rather than re-litigating constraints session after session. When scope is unfinished, finish it now -- "do the rest later" is not a follow-up. The substrate that auto-implements the obvious is the cure for the re-litigation cycle.

## On deviation

If something is unexpected mid-build (a file already exists, a test fails, a premise turns out wrong), apply the most conservative shipping path and document the deviation in the report -- do not stall and ask, unless a bright line or an irreversible step is in play. A verifiably-wrong premise under an irreversible step is the one case that stops and surfaces options first.
