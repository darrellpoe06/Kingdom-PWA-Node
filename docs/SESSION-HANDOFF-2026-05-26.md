# Session Handoff — 2026-05-26 (Synology n8n Stack B rollout)

> Cowork session handoff after a multi-phase Synology n8n install. The pipeline is **structurally live** as of this writing. Notification-to-phone verification still requires Darrell's eyes on his phone — see "Open verifications" below.

## TL;DR

n8n + ntfy + Ollama are running on the DS1621xs at `192.168.1.26` (LAN only — Tailscale install deferred). Five POE-bound workflows are imported with the SMTP credential bound; two are published and active (`01 Supabase cycle_item webhook`, `03 GitHub event webhook`). Three notification paths were fired at end-of-session — at least one should have produced a phone push.

## What's LIVE (deployed + verified at infrastructure level)

- **3 containers** running on Synology Container Manager (uptime 5–11 hours at session end):
  - `n8n` on port 5678 (HTTP 200, signed-in editor accessible)
  - `ntfy` on port 8081 (HTTP 200, accepts publishes to `darrell` topic — message ID `NNFCkITFIpXi` confirmed at end of session)
  - `ollama` on port 11434 (HTTP 200)
- **Ollama models loaded** (3 of 4 quad-model architecture confirmed live):
  - `qwen2.5:3b-instruct-q4_K_M` (~1.9 GB) — primary, fast/general
  - `qwen2.5:14b-instruct-q4_K_M` (~9 GB) — tertiary, Counseling four-section depth
  - `nomic-embed-text` (~274 MB) — embeddings for RAG
  - `deepseek-r1:8b-llama-distill-q4_K_M` — secondary, reasoning. Pull was re-triggered detached at end of session; check with `ollama list`.
- **6 workflows imported** in n8n (5 mine + 1 parallel session's "04 - Pushover Smoke Test"):
  - `01 · Supabase cycle_item insert → Pushover (dual-path) + ntfy` — **PUBLISHED + ACTIVE** (webhook `POST /webhook/supabase-cycle-item`)
  - `02 · Daily reports cron (6 AM)` — draft, inactive (needs Postgres credential)
  - `03 · GitHub event (commit/PR) → Pushover (dual-path)` — **PUBLISHED + ACTIVE** (webhook `POST /webhook/github-events`)
  - `04 · POE morning standup (7 AM)` — draft, inactive (needs Postgres credential)
  - `05 · End-of-day reflection (9 PM)` — draft, inactive (needs Postgres credential)
  - `04 - Pushover Smoke Test (manual)` — parallel session's; ran once at end of session (Pushover branch errored as expected for missing app token, ntfy branch succeeded)
- **SMTP credential** `6KL4rQH7O5dSqBHf` (Gmail + app password) bound to Path B Email Send node on all 5 production workflows.
- **Env vars in n8n container** (verified via `docker exec n8n env`):
  - `PUSHOVER_USER_KEY=upan72gdukpvmo49uet2jfyjgrrf3v`
  - `PUSHOVER_EMAIL_GATEWAY=ikzf7xijr4@pomail.net`
  - `PUSHOVER_DEVICE_NAME=PoeTech`
  - `PUSHOVER_APP_TOKEN=` (empty — forces Path B via the If node)
  - `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` (added at end of session after `ExpressionError: access to env vars denied` was the proximate cause of failure)
  - `OLLAMA_BASE_URL`, `OLLAMA_PRIMARY_MODEL`, `OLLAMA_SECONDARY_MODEL`, `OLLAMA_TERTIARY_MODEL`, `OLLAMA_EMBEDDING_MODEL` all populated.
- **End-to-end execution success:** execution #3 against workflow 03 returned `status=success` after the env-access fix. Email Send node ran without exception.

## What's WIRED but UNTESTED end-to-end

- **Push notification on Darrell's phone.** Three paths were fired at end of session:
  1. Smoke test workflow's `ntfy darrell topic` branch — green check in n8n UI.
  2. Direct ntfy publish from Chrome MCP (HTTP 200, message ID `NNFCkITFIpXi`).
  3. Workflow 03 webhook fire (HTTP 200, `{"ok":true}`).
  Whether any of them buzzed Darrell's phone needs Darrell's confirmation. Most likely successful: paths 1 and 2 (ntfy) **if** the ntfy app on his phone is subscribed to topic `darrell` against server `http://192.168.1.26:8081`. Path 3 (Gmail SMTP → pomail → Pushover) depends on Pushover not silently dropping due to fromEmail mismatch — **fromEmail fix is staged in repo but NOT YET applied to live SQLite** (see "Next actions").
- **Restic backup script** (`infra/n8n/backup/restic-cron.sh`) exists in repo but **not installed on Synology** yet. Step 12 of INSTALL.md covers it; needs an SSH session to install + register the DSM Task Scheduler entry.

## What's PENDING (waiting on Darrell input or upstream)

- **Pushover application token** (for Path A — Direct API with richer features). Create at `https://pushover.net/apps/build`, paste into `infra/n8n/.pushover-creds.local` as `PUSHOVER_APP_TOKEN=...`, then append to `/volume1/docker/n8n-stack/.env` on Synology and bounce n8n. Workflows automatically switch from Path B (email) to Path A (Direct API) via the If node once `$env.PUSHOVER_APP_TOKEN` is non-empty.
- **Pushover $5 lifetime license** — 30-day trial started 2026-05-26, deadline **2026-06-25**. Workflow 04 (POE morning standup) will surface this `change_request` daily once activated.
- **Supabase Postgres credential** — needed to activate workflows 02 (daily reports), 04 (POE standup), 05 (end-of-day reflection). All three query the live Supabase project `mjjlevhdufpaplypnqrv`. Recommended: create dedicated `n8n_runner` Postgres role per INSTALL.md Step 7 instead of using the master `postgres` user.
- **Tailscale install on the Synology** — currently using LAN IP only. For off-LAN access (Darrell's phone away from home, Christina from her laptop on the road), Tailscale needs to be installed via DSM Package Center, signed into Darrell's Tailscale account, and the `N8N_HOST` env var on Synology updated to use the Tailscale IP or MagicDNS hostname.
- **Cloudflare Tunnel** (deferred fallback) — if Supabase's webhook runner needs to reach n8n from outside the LAN/Tailscale boundary. Currently Supabase webhook for `cycle_items.insert` cannot reach n8n. For Vacation Prep cycle this is fine (manual test triggers via curl); production use post-vacation will need this.
- **deepseek-r1:8b pull verification** — the model was re-triggered detached at end of session. Verify with `sudo /var/packages/ContainerManager/target/usr/bin/docker exec ollama ollama list`. Expect ~5 GB download; should complete within ~10 min on the Synology's connection.

## Next actions for Darrell when back at desk

1. **Check phone for push notifications.** If any of the three fired at session-end arrived, the pipeline is officially LIVE.
2. **If no push:** apply the fromEmail fix to live SQLite. Single command:

   ```
   cd C:\Users\dpoe\Kingdom-PWA-Node
   scp -O infra\n8n\scripts\fix-from-email.py dpoe@192.168.1.26:/tmp/fix-from-email.py
   ssh dpoe@192.168.1.26 "sudo bash -c 'cd /volume1/docker/n8n-stack ; /var/packages/ContainerManager/target/usr/bin/docker compose stop n8n ; sleep 2 ; python3 /tmp/fix-from-email.py ; /var/packages/ContainerManager/target/usr/bin/docker compose up -d n8n'"
   ```

   Then re-fire workflow 03 via the same fetch path Chrome MCP used (the JS one-liner in the chat history).

3. **Verify ntfy subscription on phone.** If push didn't arrive via ntfy paths (which need no extra config beyond `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` already set): install ntfy app on phone, add subscription to server `http://192.168.1.26:8081`, topic `darrell`. Then re-fire smoke test.
4. **Create Pushover application token** when convenient — unlocks Path A's richer features (priorities, sounds, attachments, custom URLs, target device routing).

## File inventory (repo state at session end)

- `infra/n8n/docker-compose.yml` — Stack B services + Pushover env pass-through + Ollama quad-model + `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`.
- `infra/n8n/.env.example` — quad-model Ollama + Pushover dual-path env vars (templates only, real values in gitignored `.local` files).
- `infra/n8n/INSTALL.md` — 13-step runbook + new "Gotchas discovered during 2026-05-26 rollout" section (9 items, hard-won).
- `infra/n8n/README.md` — comprehensive reference.
- `infra/n8n/.pushover-creds.local` — gitignored, holds Pushover user key + email gateway + device name (rotate after install).
- `infra/n8n/.smtp-creds.local` — gitignored, holds Gmail SMTP user + app password (rotate after install).
- `infra/n8n/backup/restic-cron.sh` — daily Restic backup script (not yet installed on Synology).
- `infra/n8n/scripts/bind-creds.py` — idempotent SMTP credential binder for all 5 production workflows.
- `infra/n8n/scripts/publish-and-activate.py` — promotes drafts to published + sets active=1 + registers webhook routes.
- `infra/n8n/scripts/fix-from-email.py` — patches `fromEmail` field on all Path B Email Send nodes.
- `docs/00-foundations/n8n-workflows/01-05` — 5 production workflow JSONs with dual-path + POE binding + `fromEmail=darrellpoe06@gmail.com`.
- `docs/00-foundations/n8n-workflows/README.md` — index with dual-path table + DeepSeek `<think>` tag note + numbering-collision flag.
- `docs/00-foundations/n8n-workflows/01-project-timeline-daily.json`, `02-workflow-failure-alert.json`, `03-b2-backup-status.json`, `04-pushover-smoke-test.json` — **parallel session's** workflows (different naming convention, numeric prefix collision with mine). Both sets coexist; Darrell to decide whether to renumber.
- `docs/00-foundations/SEED-PROJECTS-2026-05-25.md` — Pushover license priority bumped to 9.7 with 2026-06-25 deadline; Synology RAM upgrade resolved (62 GB confirmed); Darrell notification_channels row staged with real user key + email gateway.
- `commit-n8n-rollout-2026-05-26.ps1` through `-phase-1e.ps1` — incremental commit scripts (PowerShell) that landed all the above in git.

## Git state at session end

- Branch: `main`, pushed to `origin/main` on GitHub
- Most recent n8n-related commits: Phase 1 → 1b → 1c → 1d (compose env passthrough) → 1e (this handoff + fromEmail + scripts)
- Working tree should be clean after the Phase 1e commit script runs

## POE binding upheld throughout

Every workflow uses non-punitive disposition vocabulary (`pending` / `approved` / `deferred-next-cycle` — never `rejected`). Notification copy is invitations not commands: "Ready for your prayer" / "Waiting on your word" / "Your call, not the system's math". `priority_score` is system math, `user_priority_override` is Darrell's last word and always wins. All 5 workflows tagged `poe-binding` in n8n.

---

*Generated by Cowork session 2026-05-26 evening, after fully driving Phase 1 → 3 of the SYNOLOGY-N8N-ROLLOUT plan.*
