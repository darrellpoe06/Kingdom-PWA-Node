# Conflict-Evaluation Learning Loop

**Question it answers (Darrell, 2026-06-17):** *"Do we have orchestration conflict
evaluations for fewer conflicts as we move forward because of the fixes as we
grow?"*

**Answer:** yes — this loop. ITIL continual-service-improvement + events-as-data,
applied to orchestration. Every merge/rebase conflict is recorded as a structured
event; the loop pattern-detects over those events; and it feeds prevention back so
the conflict rate trends **down** as the system grows. Builds on the existing
`scripts/orchestration/` guardrails (conflict-map, promote, migration-order) and
the new-surface=new-module rule + the swimlanes.

## The four stages

### 1. RECORD — the events spine
`docs/orchestration/conflict-events.jsonl` — append-only, one JSON object per line,
**every line traceable to evidence** (a PR, a `git log`, a guard). Schema (binding;
enforced by `validateEvent`):

| field | meaning |
|---|---|
| `ts` | ISO-8601 UTC |
| `file` | primary path or area that collided |
| `files` | all files involved |
| `branches` / `prs` | who contended |
| `lane` | `monolith` \| `mount` \| `migration` \| `logic` \| `module` |
| `cause` | `shared-file` \| `migration` \| `logic` \| `superseded` |
| `resolution` | `rebase` \| `close-superseded` \| `manual` \| `grandfathered` \| `pending` |
| `note` / `evidence` | human context + the proof it is real |

Record a new conflict:
```
node scripts/orchestration/conflict-analytics.mjs --record '{"ts":"...","file":"...","cause":"shared-file","lane":"monolith","branches":["feat/x"],"resolution":"rebase","note":"...","evidence":"..."}'
```

### 2. PATTERN-DETECT — `scripts/orchestration/conflict-analytics.mjs` (pure)
- `hotFiles(events)` — per-file collision frequency, ranked. The chronically-collided
  files rise; the **monolith** (`app/src/poe-financial-mvp-v28.jsx`) is #1.
- `contendedAreas(events)` — lanes that chronically overlap (migration sequence, etc.).
- `conflictRate(events)` — count per day, with a trend direction. **Target: DOWN.**
  One bucket reads as `baseline`, not a fake direction.
- `decompositionPlan(events)` — ranked extraction plan for hot files.

Full report: `node scripts/orchestration/conflict-analytics.mjs`

### 3. FEED PREVENTION BACK
- **(a) auto-flag for decomposition** — `decompositionPlan` ranks what to extract first
  by collision frequency. Monolith first.
- **(b) enforce new-surface=new-module** — `conflict-map.sh` warns when a branch touches
  the monolith; this loop quantifies *why* (the recurring cost) and ranks the fix.
- **(c) pre-spawn warning** — `wouldContend(files)` flags, **before** new work is filed,
  if it would touch a hot/contended file, and offers the disjoint-module path:
  ```
  node scripts/orchestration/conflict-analytics.mjs --check app/src/poe-financial-mvp-v28.jsx
  ```
  Exits non-zero when it would contend.
- **(d) migration allocator** — `nextFreeMigration(existing)` returns the next free
  4-digit number against all branches (the strictly-ordered sequence serializes any
  two branches that add migrations).

### 4. SURFACE — in the app (Operations / Quality board)
`app/src/components/ConflictLoop.jsx`, Governor-gated in the Build board beside the
Ops + Quality/Proof boards. Built at build time from the real spine into
`__CONFLICT_LOOP__` (`vite.config.js` → `scripts/orchestration/conflict-analytics.mjs`).
Shows the conflict-rate trend (target down), the current hot files, and the ranked
decomposition. Nothing painted (DR-0076): an empty spine renders an honest empty
surface.

## First real output — the grounded anchor (the 2026-06-17 5-PR pileup)

The seed dataset is the real pileup that prompted this build, plus two earlier
documented incidents (each verifiable):

- **2026-06-14** — migration numbers `0019` and `0022` each claimed twice by concurrent
  branches (P25; grandfathered).
- **2026-06-17** — `#188 → #190` stacked-PR collision (P24).
- **2026-06-17** — `#206`, `#208`, `#189` all edited the monolith; `#183` + `#189` both
  edited `main.jsx`; `#208` closed superseded.

**Loop output:** the monolith is the **#1 hot file (3 collisions, 3 branches)**, and the
ranked recommendation is:

> **Extract a surface-mount registry.** New surfaces should register (import + render)
> via a data array / lazy registry, so mounting a surface no longer edits the monolith.
> Every recorded monolith collision was mount-wiring (the import block + a render branch)
> — the surfaces themselves (`ChurchVideoWall`, `Pulpit`, `PasswordAuth`) are already
> separate component files.
>
> 1. The import block at the top of the file (the #1 textual collision point).
> 2. The section/tab render switch (the #2 collision point).
> 3. Then peel the largest standalone sections into `components/*.jsx`, mounted via the registry.

## Verification (DR-0076)
- `app/src/__tests__/conflict-analytics.test.js` — engine, **proven-to-catch** (feeds a
  known collision → flags; disjoint → clears). Registered as the `conflict-eval` closed
  loop in `scripts/quality-manifest.mjs`.
- `app/src/__tests__/conflict-loop.test.js` — the in-app shapers, including honest
  degradation on an empty/absent manifest.
- Both run inside `npm run verify` (lint + vitest) and CI.

## How conflicts trend down
As the recommended decompositions land, fewer branches touch the same file, more land
in parallel, and the recorded conflict rate falls. The surface makes that trend visible,
so the system is measurably getting better at not colliding with itself as it grows
(DR-0075 perpetual improvement; the `down` trend is the evidence).
