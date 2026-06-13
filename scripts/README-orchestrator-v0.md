# orchestrator-v0 — taste the perpetual fix (DR-0056 v0, advisory)

The smallest real version of the escalation ladder, with you in the loop. Local
(Ollama on the church 4070) tries every task; if it falls short, the tool
recommends the right vendor (Claude for code/writing, Gemini for
long-context/multimodal/research) and calls it **only when you approve**.
Advisory + manual = zero autonomous spend, no scheduler, no Cage yet.

## One-time setup

**You may already have the local model running.** Per the 2026-05-26 stack
rollout, Ollama + `qwen2.5:14b` are installed and active on the **home NAS**
(`192.168.1.26:11434`, running on the Xeon CPU — slower than a GPU, but it
works). Fastest taste = point v0 at that, **no install needed**:

```
$env:OLLAMA_URL="http://192.168.1.26:11434"   # the existing NAS Ollama
```
Verify it's still up: `ollama list` on the NAS (the 2026-06-06 cleanup unpinned
the keep-alive model but left the Ollama container; re-pull qwen2.5:14b if the
list is empty).

**For speed later**, move the local tier to a GPU box — the church 4070 (idle
most of the day) runs a 14B model far faster than the NAS CPU. If/when Ollama is
installed there, just point `OLLAMA_URL` at it instead. (Our records do NOT show
Ollama deployed on the church OBS box yet — confirm with `ollama list` on it;
the active, recorded install is the NAS.)

Then:
1. **Gemini key** — make one at https://aistudio.google.com/apikey. Your
   Anthropic key already exists.
2. Set the env on the machine you'll run from (must reach the chosen Ollama):
   ```
   $env:OLLAMA_URL="http://192.168.1.26:11434"   # or the church 4070 once set up
   $env:ANTHROPIC_API_KEY="..."
   $env:GEMINI_API_KEY="..."
   ```

## Run it

```
node scripts/orchestrator-v0.mjs "refactor this messy function ..." --type=code
node scripts/orchestrator-v0.mjs "summarize this long transcript ..." --type=longcontext
node scripts/orchestrator-v0.mjs "a private family note ..." --private
```

- Local answers first and **self-scores** 0-10.
- Cleared the bar (>= `ORCH_THRESHOLD`, default 7)? Accepted — free, private, done.
- Fell short? It **recommends** a vendor; add `--escalate` to approve the call.
- `--private` = local-only, **never** escalates (the sovereignty gate).
- `ORCH_DRY_RUN=1` prints the routing plan without calling anything.

Work types: `code` `refactor` `agentic` `writing` -> Claude · `longcontext`
`multimodal` `research` -> Gemini. Override the map in the script (it's config).

## What this is NOT (yet)

No autonomy, no schedule, no budget brakes — those are v0.5 / v1 (Tier C). The
v0 judge is a simple self-rating; the v1 judge is an independent rubric. This is
here so you can FEEL the ladder on real tasks before any of that is wired.
