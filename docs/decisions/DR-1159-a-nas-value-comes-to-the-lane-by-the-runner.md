# DR-1159: A value the NAS holds comes to the lane by the runner, never by a hand — the mandatory Way

**Date:** 2026-10-21
**Status:** accepted
**Tier:** A for the workflow (dispatch-only, idempotent, no clock; it writes one repository secret from the NAS's own file); the Way itself amends DR-0108 §4
**Type:** orchestration (a Way)

**Area:** `.github/workflows/announce-bearer-sync.yml` (new), `CLAUDE.md` ("Review Our Ways"), `docs/decisions/PRINCIPLES.md` (`RUNNER-REACHES-THE-NAS`), `docs/00-foundations/_root/THE-WAY-A-SERVICE-COMES-HOME.md` ("A secret comes home the same Way"), `docs/reviews/REVIEWS.md` (REV-0258).

**Principles:** WAYS-REVIEW (DR-0108), GOVERN-EXECUTE-ADVISE (clicks become API calls; browsers are for humans deciding), VERIFICATION-DOCTRINE (DR-0076: proof, not a claim; DR-0970: the bell is checked to have rung), DR-0085 (the NAS-held GitHub token), DR-0778 (a key never leaves the device it belongs to; here, a value never crosses a human's clipboard), DR-1067 / DR-1119 (the sovereign keys fetched from the NAS itself over the tailnet).
**Declared by:** Darrell, 2026-10-21, on being handed a PowerShell block to paste the announce bearer and a Cloudflare token by hand: *"One move and why can't you use cli... or ssh?!!!!!"* and *"Make that mandatory... add to the Ways and documentation."*

---

## Context

The phone alarm had been dead since 2026-10-20T22:20Z: every site-health ring was refused, *"the announce relay refused the token (HTTP 401) — the bearer is wrong, expired or revoked"* (#2057, four notes). The relay reads its bearer from `/volume1/PoeTech/secrets/announce-token.txt` on the NAS; the repository secret `VITE_N8N_BEARER` had drifted from it. The agent's answer was a paste block for Darrell: SSH from his desktop to read the file, `gh secret set` to write it. Two screens, one human clipboard, his time.

DR-0108 already said the stated "must be by hand" is a premise to challenge, and recorded ConnectBot as the team's second road. It did not say which road is FIRST. This record does.

## What was measured

- Three workflows already reach the NAS from a GitHub runner with secrets the repository holds: `deploy-cloudflare-pages.yml` and `push-sender-credentials.yml` read the sovereign keys out of `/volume1/docker/supabase/.env`; `cf-roads-worker.yml` reads the anon key the same way (`tailscale/github-action` with `TS_AUTHKEY`, then `ssh -i` with `NAS_SSH_KEY` to `dpoe@poetech.tail5a2f35.ts.net`). The road existed; the bearer simply had never been given it.
- The NAS holds a GitHub token with `repo` + `workflow` scope at `/volume1/PoeTech/secrets/github-token.txt` (DR-0085; the build loop and the lesson builder push with it). A runner that has read it can write a repository secret with `gh secret set`. Whether this token's scope admits the write is learned by the first run, which fails loud and says what scope is missing if not.
- The sandbox the agent works in has no route to the NAS or to poetech.us (`site-health.yml` header; DR-0669 §4). The runner does. "I cannot reach it" was true of the agent and false of the team, which is the DR-0108 failure exactly.

## Decision

1. **The order of roads, mandatory.** When a value the NAS holds (a token, a key, a file) must reach the repository, Cloudflare, or any lane the agent drives, the agent uses, in this order and stops at the first that works: **(1) a runner over the tailnet** (`TS_AUTHKEY` + `NAS_SSH_KEY`, the same two every NAS read uses), the value masked the moment it is read and leaving the runner only as a request header or a secret body; **(2) ConnectBot**, Darrell's SSH from his phone, with a self-contained paste that does the whole move on the NAS side; **(3) a hand**, a value typed from one screen into another, only when the value is one only Darrell can mint (his Cloudflare dashboard, his card, his signature), and then with the reason stated.
2. **A hand step is a finding.** Handing Darrell a paste for a value the NAS already holds is recorded as a Ways finding (REV), not as a delivery.
3. **The bell's bearer rides this Way now.** `announce-bearer-sync.yml` (dispatch-only; concurrency one; no clock) joins the tailnet, reads `announce-token.txt` and `github-token.txt` from the NAS, masks both, installs `VITE_N8N_BEARER` with the NAS's own token, reads the secret back by name and date, and rings the family's phones once at the lowest priority through `scripts/ops-announce.mjs`; a refusal fails the run. Nothing is printed.
4. **What still needs his hand, named.** The Roads Worker's Cloudflare token (Workers Scripts:Edit + Workers Routes:Edit for poetech.us) is minted only in his dashboard; it reaches the repository by the same `gh secret set` in a phone browser or by a ConnectBot paste, never by the agent asking him to type it twice. Recorded as road (3) with its reason.

## Impact

**Layer 0 cost (DR-0245).** The DR-0108 section of `CLAUDE.md` is rewritten tighter with the order of roads folded in as one sentence and a pointer; the byte ceiling in `scripts/claude-md-budget.json` moves 57575 to 57891 for it, the same move DR-0621 made for the last binding Way. Lower on the next fold.

Every secret the lane has ever needed from the NAS becomes one dispatch. The three existing NAS-reading workflows are unchanged and are the pattern. The agent's own reach stops being the team's ceiling in writing, not only in memory.

`re-review: 2026-11-04` — whether the three NAS-reading workflows and this one should share one reusable "read from the NAS" step, and whether the secret should be renamed off its legacy `N8N` word (DR-0075 item on the `/n8n` name).

## Verification

- The workflow parses (9 steps); `workflow-list-order-guard` OK; the suites that scan every workflow stay green.
- The first dispatch is the proof: the run's summary states the secret's read-back date and that the bell rang; the next `site-health.yml` run leaves no "phone alarm did not ring" note on #2057.
