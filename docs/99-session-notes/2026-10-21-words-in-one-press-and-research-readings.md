# 2026-10-21 — The words go in one press, and research comes back as a reading

**Decision record:** DR-1200

## What was found

- Send the lesson refused a transcript because a 0:02 take sat beside it (the send always sent the recording; a take under 3 seconds is refused).
- The "From the Word" suggestions rendered above Send.
- Your prompts carried "Put" and "Add" box buttons for the same act, and nothing that sent anything.
- The research lane stopped at the raw answer.

## What was built

| piece | where |
|---|---|
| the words go when the recording cannot | `OneVoiceInput.jsx` send |
| suggestions under Send | `OneVoiceInput.jsx` |
| one "To the box"; a Create row (lesson / build / research) | `PromptHistory.jsx`, `CreateFromWords.jsx`, `lib/create-from-words.js` |
| `/read` on the research road (tower alone, fixed shape) | `infra/nas-research/research_forwarder.py` |
| the reading pass (one road call per run, six-hour backoff) | `research-inbox.yml`, `scripts/research-reading-*.{mjs,sql}` |
| the reading drawn under the answer; Create on an answer | `lib/research-items.js`, `ResearchSection.jsx` |

## What was measured

- 24 files, 323 cases green; the forwarder selftest OK (53 checks); `ui-standards-guard` 0 regressions; lint 0; each new gate proven to catch.

## What this does not do yet

- The NAS runs the forwarder deployed there. The research service is in `infra/nas-loops/services.json`, and its installer restarts the forwarder when the code's sha changes (`install.sh`), so `/read` arrives on its own after merge. Until it does, a reading fails with the forwarder's 404 as its why — said on the item, retried after six hours. `re-review: 2026-10-28` (first reading seen on a real item).
- Nobody has seen it rendered; the live pass is the stewards' after deploy (DR-0104).
