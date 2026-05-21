# Agent Workflow — Cowork (strategist) + Claude Code (executor) + You (arbiter)

> **Decision (2026-05-18, founder + Cowork):** Move execution of file modifications to Claude Code running locally on the founder's machine. Cowork (Claude inside the Cowork app) stays focused on strategy, foundations, design specs, and review. Founder remains the arbiter.

This doc is binding for all future development. It exists because the cross-environment file-write bridge in the Cowork → mounted-folder pipeline truncates intermittently; running the executor locally bypasses that class of problem entirely while letting each role do what it's best at.

---

## Why this split exists

1. **Truncation is a tooling problem, not a thinking problem.** Cowork's Edit/Write tools occasionally drop file tails. Bash + sed inside Cowork doesn't. Claude Code locally has neither limitation. Stop fighting the bridge.
2. **Context preservation across sessions.** Claude Code keeps repo state + foundation docs as long-running context. Cowork conversations have a finite budget — every session that burns 30% on truncation restores is 30% less thinking we got out of it.
3. **Specialization improves output.** Strategy work benefits from chat back-and-forth + foundation-doc discipline. Execution work benefits from local tools + fast iteration + diff review. Mixing them was always a workaround.
4. **Founder remains the arbiter.** Both agents serve the founder's intent. The founder reviews each diff before merge and can always reject either agent's output.

---

## Role split

| Layer | Owner | Output |
|---|---|---|
| Vision, priorities, foundation documents | Founder + Cowork (collaborative) | Foundation `.md` files under `/docs/00-foundations/_root/`; this `AGENT-WORKFLOW.md` |
| Task specification (the "what" + "why" + "where") | Cowork | Task cards (markdown blocks, copy-pasteable into Claude Code) |
| File edits, refactors, new component creation, build verification | Claude Code (local) | Diffs against the working tree; build output; test results |
| Approve / reject / ship | Founder | Git commits + pushes |
| Post-merge review, foundation-doc updates from learning | Cowork | Refined docs; updated task backlog |
| Final say in any disagreement between the agents | Founder | Whichever direction the founder chooses |

---

## Task card format

Cowork produces a card. The founder pastes it into Claude Code. The format is strict so Claude Code knows exactly what to do without back-and-forth.

```markdown
## Task card — {short title}

**Foundation rules that apply:**
- [link to relevant foundation doc]
- [link to second relevant doc]

**What to do:**
{1-3 sentence description of the change}

**Files involved:**
- `app/src/components/X.jsx` — {what changes}
- `app/src/poe-financial-mvp-v28.jsx` — {what changes, line range if known}

**Success criteria:**
- {observable result #1}
- {observable result #2}
- Build passes: `cd app && npx vite build`
- No regressions in {specific surfaces to verify visually}

**Verification commands:**
1. `cd app && npx vite build` — must complete without errors
2. `npx serve preview-rXX` then open http://localhost:PORT — visually confirm {surfaces}
3. `git diff --stat` — confirm expected file scope

**Out of scope (do NOT touch):**
- {anything that would creep beyond the task}

**When done, report:**
- Final `git diff --stat`
- Build output (last 5 lines)
- Any deviations from the spec + why
```

The format is verbose by design. The verbosity prevents Claude Code from drifting, and gives the founder a clean record of what was supposed to happen vs. what did.

---

## Foundation doc precedence

Both agents must respect the existing foundation documents in `/docs/00-foundations/_root/`. The CLAUDE.md at the repo root references them and is auto-loaded by Claude Code. Required reading order on every task:

1. `THE-WAY.md` — the meta-frame.
2. `FOUNDERS-CONFESSION.md` — the WHY.
3. `MIND-OF-CHRIST.md` — the discipline.
4. `EXCELLENCE-STANDARD.md` — the quality bar.
5. `SITUATIONAL-PEACE.md` — the design test.
6. `IN-PLACE-FIRST.md` — UX rule.
7. `EDITABLE-EVERYWHERE.md` — edit affordance rule.
8. `IDENTITY-ROLES-AUDIT.md` — who can do what + audit trail.
9. `CONNECTED-CONTEXT.md` — data linking.
10. `LIFECYCLE-AND-HANDOFF.md` — state history.
11. `MODULAR-EXTENSIBILITY.md` — file structure / extraction rule.
12. `ECOSYSTEM-PARTICIPANTS.md` — external user portals.
13. `LEGAL-PRIVACY-BOUNDARY.md` — Legal module strict isolation.
14. `MULTI-INSTANCE-STRATEGY.md` — multi-customer phases.
15. `SCRIPTURE-REFERENCE-STANDARD.md` — citation rubric for faith content.

If any task contradicts a foundation rule, the foundation wins. If a task seems to require breaking a foundation, the agent must stop and surface the conflict to the founder before proceeding.

---

## Verification protocol

Every task ends with the executor (Claude Code) reporting three things back:

1. **`git diff --stat`** — what files changed, lines added/removed
2. **Build status** — `npx vite build` output, last 5 lines
3. **Manifest of deviations** — any judgment call made during execution, with one-line reason

The founder reviews these. If clean, commits and pushes. If anything looks off, kicks back to Cowork (for spec issues) or back to Claude Code (for execution issues).

---

## When Cowork stays hands-off

Cowork does NOT modify files (except trivially) once this workflow is in place. Specifically:

- Cowork can read any file for review.
- Cowork can write new foundation docs (`/docs/00-foundations/_root/`) and architecture docs (`/docs/01-architecture/`).
- Cowork can produce task cards as chat output.
- Cowork does NOT use Edit or Write on JSX, source files, or large docs.
- Cowork may use bash for trivial fixes (≤ 5 lines) when no executor handoff is needed.

This discipline preserves Cowork's context budget for thinking work and eliminates the truncation problem permanently.

---

## When Claude Code stays hands-off

Claude Code does NOT make strategic decisions or write foundation documents. Specifically:

- Claude Code executes task cards as given.
- Claude Code surfaces conflicts with foundation docs but does not unilaterally override them.
- Claude Code does not invent new modules, name new patterns, or change tier pricing without an explicit task card asking for it.
- If a task is ambiguous, Claude Code asks the founder before guessing.

---

## Tool boundaries on the monolith

`app/src/poe-financial-mvp-v28.jsx` is a 4,000+-line JSX file and historically the chronic truncation victim. The same boundaries apply to any future JSX file over 2,000 lines.

**Edit / Write tool — permitted scope:**

- Small top-of-file edits **only when**: under 10 lines changed AND located within the first ~50 lines (imports, top-level constants). The harness has shown these land reliably.
- Single-line edits anywhere in the file (e.g., flipping a flag, adding one prop, changing a literal).

**Bash-only via PowerShell splice — required for:**

- Deep mid-file edits (anything below line ~50).
- Multi-region edits (changes touching more than one disjoint range).
- Any edit larger than ~50 lines.

Use this pattern (the same one that has held since r40):

```powershell
$path = "C:\…\poe-financial-mvp-v28.jsx"
$lines = [System.IO.File]::ReadAllLines($path)
$before = $lines[0..($start-1)]
$after  = $lines[($end+1)..($lines.Length-1)]
$new = @($before) + @($replacement) + @($after)
[System.IO.File]::WriteAllLines($path, $new, [System.Text.UTF8Encoding]::new($false))
```

Always with `UTF8Encoding($false)` (no BOM) so Vite + git stay quiet, and always with descending line numbers when running multiple splices in sequence so earlier indices remain valid.

**After every Edit/Write touching the monolith:**

1. Run `npm run lint`.
2. If lint suddenly shows many new `no-undef` errors, or the file shrank far more than the change intended, truncation happened. **Revert** (`git checkout app/src/poe-financial-mvp-v28.jsx`) and redo via splice.

Reason for the binding: prior truncation incidents on multi-region or deep mid-file Edit/Write silently dropped the file tail and shipped white-screen-causing breakage to the founder. The splice path bypasses that class of failure entirely.

---

## Lint & build gates (binding from r41 onwards)

Before any commit touching `app/src/components/` (or the monolith above), the agent MUST run:

1. `cd app && npm run lint` — must exit 0 (the config sets `--max-warnings 0`).
2. `cd app && npm run build` — must complete without errors.

Both must be green. If either fails, fix the cause before committing — do not commit a known-broken state and do not relax the gates to make a commit pass.

`no-undef` errors are extraction-leaks: a symbol referenced in an extracted component whose definition was left behind in the monolith (or vice versa). Fix the same way as r39-r41: move the definition if no other consumer exists, duplicate the definition if the monolith still uses it, or thread it as a prop if it closes over state.

`no-unused-vars` warnings on top-level functions/components/constants in the monolith are usually preparatory scaffolding for pending UI work. Default to converting them to named exports (`export function …`) rather than deleting — ESLint sees the export as a use, and the pending consumers can import directly. Delete only when the symbol is a literal duplicate of one that already lives in an extracted module.

---

## Cost & setup

- **Claude Code install:** `npm install -g @anthropic-ai/claude-code` then `claude` in the repo root.
- **Subscription:** Uses the founder's existing Claude subscription. No separate API key spend.
- **Local environment:** Same machine that runs the PWA dev server. Same file access. No bridge.
- **Per-task cost:** None. Within the existing Claude allowance.

Rule held: no new paid dependency.

---

## Failure modes + mitigations

1. **Claude Code drifts from the task card.** Mitigation: task cards are strict; founder reviews diff before commit; rejection sends task back through Cowork for re-spec.
2. **Cowork and Claude Code disagree on approach.** Mitigation: founder decides. Both agents document their reasoning so the founder can choose with full info.
3. **Foundation doc itself is wrong.** Mitigation: founder updates the foundation doc first; both agents re-read on next task.
4. **Claude Code can't reach a remote service (e.g., a connector test).** Mitigation: founder runs the relevant test; Claude Code only writes the code.
5. **Workflow overhead exceeds benefit on small tasks.** Mitigation: Cowork can use bash for ≤5-line trivial fixes without invoking Claude Code. Anything larger goes through the task card flow.

---

## Migration plan

1. Founder installs Claude Code: `npm install -g @anthropic-ai/claude-code`.
2. Founder runs `claude` in `C:\Users\dpoe\Kingdom-PWA-Node` to verify it reads the repo + the CLAUDE.md.
3. Cowork produces the first task card (white-screen bug — see `/docs/01-architecture/task-cards/2026-05-18-white-screen-non-free-tier.md`).
4. Founder pastes into Claude Code, lets it execute, reviews the diff.
5. If the cycle works, all subsequent file-modification work flows through this pipeline.
6. Cowork retroactively documents any new patterns that emerge from the new workflow.

---

## Cross-references

- `MODULAR-EXTENSIBILITY.md` — Claude Code must follow the modular file structure rules.
- `EDITABLE-EVERYWHERE.md` — Claude Code must respect inline-edit + audit-log patterns on new features.
- `IDENTITY-ROLES-AUDIT.md` — Claude Code edits attribute to the founder's profile (no anonymous mutations).
- `SITUATIONAL-PEACE.md` — both agents serve the founder's peace; if the workflow itself adds chaos, it's wrong and gets revised.
- `FOUNDERS-CONFESSION.md` — both agents are clay. The founder is steward. Yahweh is the King the work is done unto.

---

**End of document.** Binding from r39 onwards. The workflow is itself revisable; founder + Cowork can refine after the first few cycles. The principle — strategy in chat, execution local, founder arbiter — stays.
