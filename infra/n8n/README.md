# Stack B install — n8n + ntfy + Ollama

Self-hosted workflow orchestrator + push notifications + local LLM on the DS1621xs. Per the Stack B pick in `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md` ratified 2026-05-25.

## Binding operating principle — MAX FORWARD MOTION (parallel by default)

Per Darrell's standing rule (memory: `feedback_max-forward-motion.md`, reaffirmed 2026-05-25 in this install thread): **every install step, every workflow build, every smoke test runs in parallel with whatever else can be done at the same time — never sequentially gated unless one truly depends on another.**

Applied to n8n specifically:
- **Install:** Pull n8n + ntfy + Ollama containers concurrently, not one at a time. `docker compose up -d` pulls all three in parallel.
- **First-run setup:** While Ollama is pulling its first model (~5 min for a 3B Q4), set up the n8n owner account, register Pushover credentials, subscribe phones to ntfy topics. None of those wait on Ollama.
- **Workflow build:** When building multiple n8n workflows in a single session, scaffold them in parallel (open multiple editor tabs), then test each. Don't gate workflow #2 on workflow #1 being fully verified unless they share state.
- **Smoke tests:** Hit `:5678`, `:8081`, `:11434` from three terminal windows simultaneously, not one after the other.
- **Workflow design:** When n8n itself orchestrates a multi-step LLM flow (e.g., audit + main response + drift test + scripture lookup), branch the independent steps in parallel inside the workflow — use n8n's Split In Batches or parallel branch pattern, not serial. The dependent steps re-join with a Merge node.

This principle is binding for every future n8n-related work in this repo. If you (Dispatch, Cowork, Claude Code, or Darrell himself reviewing a PR) find a workflow doing in serial what could be in parallel, that's a fix worth making.

## What this gets you

- **n8n** (https://n8n.io) on port 5678 — visual workflow editor + 400+ nodes. Workflows export as JSON to `docs/00-foundations/n8n-workflows/` (git-tracked).
- **ntfy** (https://ntfy.sh) on port 8081 — self-hosted push notifications. Family installs the ntfy app and subscribes to topics.
- **Ollama** (https://ollama.com) on port 11434 — local LLM. One small model resident: `qwen2.5:3b-instruct-q4_K_M`.

Total RAM at idle: ~5-7 GB. Under load: ~10-12 GB. Plenty of headroom in 32 GB.

## First-time setup (vacation week, Darrell-only)

### 1. Generate the n8n encryption key

In PowerShell:

```
-join ((48..57 + 97..102) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

Copy the 64-char hex string. Store it in your password manager — losing it loses every n8n credential.

### 2. Get the Synology's Tailscale IP

If Tailscale is already installed on the DS1621xs, SSH in and run:

```
tailscale ip -4
```

If Tailscale isn't installed yet, install it from Package Center → search "Tailscale" → install → log in with your account. Then run the command above.

### 3. Create the `docker` shared folder if it doesn't exist

DSM Control Panel → Shared Folder → Create → name `docker` → default permissions.

### 4. Deploy the compose project

**Option A: Container Manager UI (recommended for first-time).**

1. DSM → Container Manager → Project → Create
2. Project name: `n8n-stack`
3. Path: `/volume1/docker/n8n-stack`
4. Source: Upload `docker-compose.yml` from this folder
5. Add environment variables (Container Manager has a UI for this — paste from your filled-in `.env`):
   - `N8N_ENCRYPTION_KEY` (from step 1)
   - `N8N_HOST` (Tailscale IP or hostname from step 2)
   - `WEBHOOK_URL` = `http://<tailscale-ip>:5678/`
   - `NTFY_BASE_URL` = `http://<tailscale-ip>:8081`
6. Click Next → Build. Container Manager pulls images and starts the stack.

**Option B: SSH.**

```
ssh admin@<synology-tailscale-ip>
sudo mkdir -p /volume1/docker/n8n-stack
cd /volume1/docker/n8n-stack
# Copy docker-compose.yml + .env from your laptop via scp:
#   scp infra/n8n/docker-compose.yml admin@<synology>:/volume1/docker/n8n-stack/
#   scp infra/n8n/.env admin@<synology>:/volume1/docker/n8n-stack/
sudo docker compose up -d
sudo docker compose ps     # all three should say "running"
sudo docker compose logs --tail 20 n8n
```

### 5. Verify all three services

From any device on Tailscale (your laptop or phone):

```
http://<synology-tailscale-ip>:5678/    # n8n owner-account setup page
http://<synology-tailscale-ip>:8081/    # ntfy welcome page
http://<synology-tailscale-ip>:11434/   # responds: "Ollama is running"
```

### 6. Complete n8n owner-account setup

Open `http://<synology-tailscale-ip>:5678/` in your browser. n8n's first-run wizard asks for:
- Email (use `darrellpoe06@gmail.com`)
- First name + last name
- A password (store in your password manager)

After signup you're in the editor.

### 7. Pull the first Ollama model

SSH in and pull the model — small enough to finish in a few minutes:

```
ssh admin@<synology-tailscale-ip>
sudo docker exec -it ollama ollama pull qwen2.5:3b-instruct-q4_K_M
```

Verify it's loaded:

```
sudo docker exec -it ollama ollama list
```

Smoke test from your laptop:

```
curl http://<synology-tailscale-ip>:11434/api/generate -d '{
  "model": "qwen2.5:3b-instruct-q4_K_M",
  "prompt": "Say hello to the Poe family in one sentence.",
  "stream": false
}'
```

### 8. Get Pushover going (separate from this stack — runs on your phone)

1. On your phone: install **Pushover** (App Store / Play Store).
2. Buy the $5 license (one-time, per platform).
3. In the app, copy your **user key**.
4. On https://pushover.net log in → Create an Application/API Token → name it `PoeTech` → copy the **API token**.
5. In n8n, Settings → Credentials → New → Pushover → paste both keys.

You'll use the Pushover credential in workflows that target Darrell's phone specifically. ntfy handles family-channel topics.

### 9. Subscribe to ntfy topics on your phone

1. Install the **ntfy** app (App Store / Play Store).
2. Open it → Add subscription → paste `http://<synology-tailscale-ip>:8081` as the server.
3. Add topic: `darrell` (your private topic). Future topics: `family-ops`, `christina`, `colg-leadership`.

Your phone has to be on Tailscale to reach the Synology — when not on Tailscale the app shows a connection error; that's expected and not harmful.

## Workflows folder

Once n8n is up, export each workflow as JSON and save to `docs/00-foundations/n8n-workflows/`. The file is git-tracked so a future Dispatch session (or you on a new device) can re-import.

Per the eval doc, week-1 workflows for Darrell-only:

1. **Daily summary digest** — Postgres query against yesterday's `feedback`/`audit_log`/`incidents` → format markdown → Pushover to Darrell at 7 AM.
2. **Workflow failure alert** — any n8n workflow that errors → Pushover.
3. **Backblaze B2 backup status** — poll the B2 API after each scheduled Hyper Backup run → Pushover on success/failure.
4. **Optional: Counseling smoke** — if the Phase 1 gateway lands before vacation, each Counseling submission routes through n8n calling Anthropic via the system-prompt-enforced flow.

## Post-vacation: switch n8n from SQLite to Supabase Postgres

Once MVP-1 has stabilized and the schema is settled, repoint n8n at the existing Supabase Postgres so workflow state lives in the same backed-up database. Add these env vars to the n8n service:

```
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=<supabase-postgres-host>
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=postgres
DB_POSTGRESDB_USER=<n8n-dedicated-user>
DB_POSTGRESDB_PASSWORD=<n8n-dedicated-password>
DB_POSTGRESDB_SCHEMA=n8n
```

Create the `n8n` schema in Supabase first (`CREATE SCHEMA n8n; GRANT ALL ON SCHEMA n8n TO <user>;`). Then `docker compose down && docker compose up -d` and n8n migrates its tables into the new schema on first boot. Your existing SQLite workflows are NOT auto-migrated — export them first, then re-import after the switch.

## Troubleshooting

**n8n boots but the editor is blank:** check `docker logs n8n` — usually a missing `N8N_ENCRYPTION_KEY` or a permission issue on `/volume1/docker/n8n-stack/n8n`. Fix permissions: `sudo chown -R 1000:1000 /volume1/docker/n8n-stack/n8n`.

**ntfy welcome page loads but topic subscriptions don't arrive:** ntfy defaults to `auth_default_access=deny-all` in our compose. Create a topic + grant access via `docker exec -it ntfy ntfy user add darrell` and `ntfy access darrell darrell read-write`. Or set `NTFY_AUTH_DEFAULT_ACCESS=read-write` if you trust the Tailscale boundary fully (acceptable for Darrell-only week 1).

**Ollama responds but model pulls fail:** check disk space on `/volume1/docker/` — small models are 2-5 GB each. `df -h /volume1`.

**Can't reach the Synology Tailscale IP from your phone:** open the Tailscale app on the phone, confirm you're connected, confirm the DS1621xs shows up in the device list as "active." If it shows "offline," log into DSM and restart Tailscale from Package Center.

## Sources

- Eval: `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md`
- n8n docs: https://docs.n8n.io
- ntfy docs: https://docs.ntfy.sh
- Ollama docs: https://github.com/ollama/ollama/blob/main/docs/api.md
