# orchestrator-v0 — taste the perpetual fix (DR-0056 v0, advisory)

The smallest real version of the escalation ladder, with you in the loop. Local
(Ollama on the church 4070) tries every task; if it falls short, the tool
recommends the right vendor (Claude for code/writing, Gemini for
long-context/multimodal/research) and calls it **only when you approve**.
Advisory + manual = zero autonomous spend, no scheduler, no Cage yet.

## One-time setup

1. **Local model on the 4070** (the church box, idle most of the day). On that
   machine:
   ```
   # install Ollama (https://ollama.com), then:
   ollama pull qwen2.5:14b
   ollama serve   # serves on :11434
   ```
2. **Gemini key** — make one at https://aistudio.google.com/apikey. Your
   Anthropic key already exists.
3. On the machine you'll run the tool from (must reach the 4070):
   ```
   set OLLAMA_URL=http://<4070-host>:11434   (PowerShell: $env:OLLAMA_URL="...")
   set ANTHROPIC_API_KEY=...
   set GEMINI_API_KEY=...
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
