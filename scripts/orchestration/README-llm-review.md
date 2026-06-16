# Local-LLM code review (sovereign, tiered, ADVISORY)

> "Have the local LLMs review the app for bugs or fixes." — Darrell, 2026-06-16.

A **second pair of eyes on the changed code**: qwen2.5 on the NAS reads a
branch's **diff** and flags likely bugs / regressions / security concerns —
`file:line` + a one-line concern + a suggested fix. It is **advisory**: it
**flags**, it never edits, commits, or pushes code, and it **does not replace
the test suite**.

## The tiering (sovereign-first — the Charter §3)

| Tier | What | Where | When |
|---|---|---|---|
| **1 — deterministic** | `npm run lint` + the full **vitest** suite | GitHub CI (`ci.yml`) | every PR / push — **the merge gate**. Unchanged. |
| **2 — local (default)** | **qwen2.5** on the NAS reviews the diff **file-by-file** | NAS / any box with node + git | every time you run the script |
| **3 — vendor (escalation)** | a vendor LLM reviews the combined diff, **bounded + labeled** | Anthropic API over HTTPS | **only** when the diff is too large/deep **and** explicitly armed |

Scoping to the **diff** (not the whole tree) is what makes Tier 2 feasible on the
CPU-only NAS. Tier 3 is **off by default** (sovereign-first): it fires only on an
**unmet need** — a diff bigger than the local model handles well, or `--deep` —
**and** only when armed with `--allow-vendor` + `ANTHROPIC_API_KEY`, bounded by
the Charter budget. If escalation is *recommended* but not armed, the report says
so honestly (`escalation_recommended`) rather than silently pretending the big
diff got a deep review.

## Invoke it

```bash
# Review the current branch against origin/main (Tier 2, local qwen2.5):
scripts/orchestration/llm-review.sh

# Review a specific range:
scripts/orchestration/llm-review.sh --base origin/main --head feat/my-branch

# On the NAS, Ollama is local:
OLLAMA_BASE=http://localhost:11434 scripts/orchestration/llm-review.sh

# Write the report where the app's wf-llm-review serves it from:
scripts/orchestration/llm-review.sh --out /data/poetech-briefing/_llm_review.json

# Escalate a large/deep review to a vendor (PAID, bounded — opt-in):
ANTHROPIC_API_KEY=sk-... scripts/orchestration/llm-review.sh --allow-vendor --deep

# Optional pre-merge gate: exit non-zero if a 'bug'-severity finding exists:
scripts/orchestration/llm-review.sh --fail-on-bug

# Help:
scripts/orchestration/llm-review.sh --help
```

`llm-review.sh` is a thin POSIX wrapper around the engine
`llm-review.mjs` (node ESM — clean `fetch` to Ollama + JSON handling, with
unit-tested pure helpers). You can also run the engine directly:
`node scripts/orchestration/llm-review.mjs [options]`.

## Where to run it (optional pre-merge step)

It is a **read-only, advisory** step the orchestrator or a dev runs **before**
promoting a branch — alongside, never instead of, `npm run verify`:

```bash
cd app && npm run verify            # Tier 1 — the real gate (lint + vitest)
cd .. && scripts/orchestration/llm-review.sh   # Tier 2 — advisory second look
```

By default the script **always exits 0** (advisory). Pass `--fail-on-bug` to
opt into a soft gate: it then exits non-zero **only** when the local model flags
a `bug`-severity concern — a signal the dev/orchestrator chooses to honor, not a
hard CI block.

It is **non-interactive** and never shells out to a prompt-blocking CLI
(`gh`/`vercel`), so it is safe in an unattended lane (pairs with
`no-interactive-cli-guard.mjs`).

## The report (and the in-app surface)

The script writes a JSON report (default `scripts/orchestration/.llm-review.json`,
gitignored; `--out` to redirect) and prints concise markdown.

The app surfaces it **advisory** on the **Build board**: the `wf-llm-review`
workflow (sovereign, ships **inactive**) serves the latest report at
`GET /n8n/webhook/llm-review`, and `LlmReview.jsx` renders it next to
`LlmHealth`. Until a review has run and the workflow is activated, the card shows
an honest "no review connected yet" with how to light it up — never a painted
"all clear". The report-parsing (`app/src/lib/llm-review.js`) is pure and
unit-tested (`app/src/__tests__/llm-review.test.js`), so the surface's data
handling never ships unverified (DR-0076).

## What it is NOT

- **Not the test suite.** Lint + vitest in CI is the merge gate; this is a
  heuristic second look that can be confidently wrong (the class teaches exactly
  this — test and verify what any AI tells you).
- **Not a code change.** It never edits, commits, or pushes. Output is a report.
- **Not always-on.** It runs on demand. It is not timer-driven automation, so
  the three-brakes rule does not apply — but the vendor tier carries its own
  brakes anyway (opt-in arming, bounded input/output, the Charter budget).
