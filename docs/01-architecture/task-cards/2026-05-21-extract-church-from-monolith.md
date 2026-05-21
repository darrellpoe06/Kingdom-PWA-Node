# Task card — Extract `Church` from monolith to `app/src/components/Church.jsx`

**Date:** 2026-05-21 · **Issued by:** Cowork · **Status:** open · **Pipeline:** First task card through the Claude Code dev pipeline (per `INFRASTRUCTURE-PIPELINE.md` + `AGENT-WORKFLOW.md`)

---

**Foundation rules that apply:**

- `/CLAUDE.md` — typographic theology bindings (Yahweh / Jesus / Holy Spirit capitalized; the adversary lowercase). Read first.
- `/docs/01-architecture/AGENT-WORKFLOW.md` — the task-card discipline, monolith editing rules, lint + build gates. Read carefully — especially the "Tool boundaries on the monolith" section (lines 134-167) and "Lint & build gates" section (lines 171-184).
- `/docs/00-foundations/_root/MODULAR-EXTENSIBILITY.md` — file structure / extraction rule binding this change.
- `/docs/00-foundations/_root/EXCELLENCE-STANDARD.md` — the quality bar.

---

**What to do:**

Extract the `Church` component (currently defined inside `app/src/poe-financial-mvp-v28.jsx`) into its own file at `app/src/components/Church.jsx`. Pure refactor — no behavior change, no styling change, no new functionality. The Church tab must render and behave identically before and after this commit.

This follows the same extraction pattern used in prior rounds (e.g., commit `3699ab8 refactor(devops+markets): move 5 DevOps presentational siblings...`, commit `a993c62 refactor(monolith): extract Practice + InquiryRow`).

---

**Files involved:**

- `app/src/poe-financial-mvp-v28.jsx` — remove the `Church` function definition (currently around line 3317 — exact range to be confirmed by Claude Code). Add `import Church from './components/Church.jsx';` near the top with the other component imports.
- `app/src/components/Church.jsx` — new file. Contains the extracted `Church` component as a default export.

---

**Method — bash-only PowerShell splice for monolith mid-file edit:**

Per `AGENT-WORKFLOW.md` lines 143-160 (binding), the removal of the `Church` function from the monolith is a **deep mid-file edit** that must be done via PowerShell splice, NOT via Edit/Write tools. Read those lines and use the splice pattern exactly as documented (UTF8 no BOM, descending line numbers if multi-region).

The new `Church.jsx` file can be created with the Write tool — it's a brand new file, no truncation risk.

---

**Find the exact line range first:**

Before editing anything, run:

```bash
cd app
grep -n "^function Church\b\|^export function Church\b" src/poe-financial-mvp-v28.jsx
```

This gives the start line. Then find the end by scanning forward to the next top-level `function`/`export function`/`const ... =` at column 0 — that line minus 1 is the end. Report the range before splicing.

---

**What `Church.jsx` should contain:**

1. The same imports the `Church` function depends on. Check what `Church` references from outside its own body:
   - React hooks (`useState`, etc.) — import from `'react'`
   - `SectionTitle`, `MetricCell`, or any other shared primitives — import from `'./shared.jsx'`
   - Any utility functions (e.g., `fmt`, `eventDateTime`, `relativeWhen`) — if they're not yet exported, surface that as a deviation and either:
     - (a) export them from the monolith and import here (preferred — minimal monolith change), OR
     - (b) duplicate the small ones inline if cleaner — note as a deviation
2. The `Church` function itself, unchanged in behavior, exported as default.
3. No new logic. No new copy. No restyling.

---

**Success criteria:**

- `npm run lint` exits 0 (the config sets `--max-warnings 0`)
- `npm run build` completes without errors
- The Church tab renders identically — same prayer requests panel, same event-add affordance, same any-existing-behavior
- Monolith line count decreases by approximately the size of the `Church` function
- `git diff --stat` shows changes only to: `app/src/poe-financial-mvp-v28.jsx` (removals + import addition) and `app/src/components/Church.jsx` (new file)
- No other files touched

---

**Verification commands (binding gates per AGENT-WORKFLOW.md lines 171-184):**

1. `cd app && npm run lint` — must exit 0
2. `cd app && npm run build` — must complete without errors
3. `git diff --stat` — confirm scope is exactly the two files above
4. Manually start `npm run dev` and click the **Church** tab. Confirm:
   - Prayer requests panel renders with existing data
   - Add-prayer-request flow still works
   - Mark-sent / delete still works
   - Event-add (if exposed in Church) still works
   - No console errors

---

**Out of scope (do NOT touch in this card):**

- Do NOT add a Counseling sub-tab to Church. That is the next task card and depends on this extraction landing first.
- Do NOT extract any other component (Practice, Markets, etc. are already extracted; everything else stays where it is for this card).
- Do NOT restyle Church.
- Do NOT update copy.
- Do NOT touch any documentation file.
- Do NOT touch any other component file.
- Do NOT change the order of items in the nav.

If during the work Claude Code identifies a missing helper export or a name collision that requires changing more than the two files above, **stop and surface the conflict** — do not silently expand scope. Per `AGENT-WORKFLOW.md` lines 124-131, executor stays in-scope; founder approves any expansion.

---

**When done, report back:**

1. The exact line range removed from the monolith (e.g., "lines 3317–3575")
2. `git diff --stat` (full output)
3. `npm run lint` output, last 5 lines
4. `npm run build` output, last 5 lines
5. Any deviations from the spec above, with one-line reason
6. Confirmation that the Church tab still renders correctly in dev (one sentence: "Yes, identical" or "No, here's what's different")

---

**Why this is the first card through the new pipeline:**

Smallest leverage, lowest risk. Pure refactor demonstrates the Cowork → task card → Claude Code → founder review → commit loop without any product-behavior risk. If anything goes wrong, the diff is small and easily reverted. Sets up the next task card (Phase 1 of `MODE-ROUTING.md` — add Counseling sub-tab inside Church) to use Edit/Write safely on the new small `Church.jsx` file instead of touching the monolith again.

Once this lands cleanly, the pattern is proven and we can flow at the cadence the founder set in `MVP-1-TIMELINE.md` (5-hour days, 7–10 commits per day).
