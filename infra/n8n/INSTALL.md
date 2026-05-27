# Stack B install runbook · n8n + ntfy + Ollama on DS1621xs

> **Operator-driven, paste-ready.** Pairs with `README.md` (reference) and `deploy-n8n-stack-to-synology.ps1` (one-shot script). Use this file when driving the install live — every step is in execution order, every command is copyable, every decision is already locked.

## Locked decisions (don't re-litigate)

Per `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md`, ratified 2026-05-25:

- **Stack:** B — n8n + ntfy + Ollama (3 containers, minimal surface)
- **Access:** Tailscale only (Cloudflare Tunnel deferred as family-share fallback)
- **Notifications:** Pushover (Darrell) via dual path — Direct API (Path A, when app token lands) + Email-to-push gateway (Path B, works the moment SMTP is wired). 30-day free trial active; $5 lifetime license due by 2026-06-25.
- **Family notifications:** ntfy (self-hosted, topic-based)
- **RAM ceiling (revised 2026-05-26):** **62 GB physical** confirmed on Darrell's unit via `free -h`. Synology's official DS1621xs spec is 32 GB max but his unit is populated past that and runs stable. Headroom unlocks the quad-model architecture below.
- **Storage on /volume1:** `docker/` 200 GB · `ollama-models/` 200 GB · `app-uploads/` 2 TB · `backups/` 5 TB · `family-shared/` 1 TB · ~4.5 TB reserved
- **Backup:** Restic to `/volume1/backups/restic-n8n` + monthly USB rotate ($0/mo perpetual)
- **Workflow JSONs:** `docs/00-foundations/n8n-workflows/` (git-tracked)
- **n8n backend storage:** isolated SQLite for vacation week (recommended). Post-vacation switch to Supabase Postgres documented in `README.md §Post-vacation`.
- **Ollama models (quad-model architecture, expanded 2026-05-26 after 62 GB finding):**
  - **Primary** — `qwen2.5:3b-instruct-q4_K_M` (~2 GB, fast/general, 10–15 tok/sec CPU)
  - **Secondary** — `deepseek-r1:8b-llama-distill-q4_K_M` (~5 GB, reasoning, 3–5 tok/sec CPU)
  - **Tertiary** — `qwen2.5:14b-instruct-q4_K_M` (~9 GB, Counseling four-section depth, 2–3 tok/sec CPU)
  - **Embedding** — `nomic-embed-text` (~280 MB, RAG over Scripture + family docs, near-instant)
  - All four loaded simultaneously (`OLLAMA_MAX_LOADED_MODELS=4`, container cap 24 GB; total resident ~16 GB). Workflows pick via `$env.OLLAMA_PRIMARY_MODEL` / `_SECONDARY` / `_TERTIARY` / `_EMBEDDING` — never hardcode.
- **Family scope:** family-on-Day-1 (Christina + kids onboard immediately on vacation)
- **Cost target:** $0/mo perpetual outside Anthropic API
- **POE binding:** non-punitive disposition vocabulary in every workflow that touches the schema (`pending` / `approved` / `deferred-next-cycle` — never `rejected`)

## Inputs needed before starting

Have these in hand or capture them during the steps:

1. **Synology Tailscale IP or MagicDNS hostname** — `ssh admin@<dsm-ip>` then `tailscale ip -4`. If Tailscale isn't installed yet, see step 2 below.
2. **Currently installed RAM** — confirmed 62 GB physical on this unit (2026-05-26). Quad-model architecture assumes this. If a future install runs on a fresh DS1621xs at stock 32 GB or less, drop to dual-model (Primary + Secondary) — see "If you have less than 32 GB" callout in Step 5.
3. **Pushover credentials** — partially staged at `infra/n8n/.pushover-creds.local` (gitignored). User key + email gateway are populated. App token is TODO; Path B (email-to-push) works without it. See Step 6 for the dual-path setup.
4. **SMTP source for Path B email-to-push** — n8n's Email Send node needs SMTP credentials. Options (any one of these unblocks Path B):
   - **Resend** (planned) — when Darrell's SMTP signup lands, paste API key into n8n's Resend credential.
   - **Gmail SMTP** (fastest tonight) — generate an app password at https://myaccount.google.com/apppasswords, paste into n8n's SMTP credential. Host `smtp.gmail.com`, port 587, STARTTLS.
   - **Synology's Mail Server package** — overkill for this, skip.
5. **DSM admin login** — for Container Manager + Tailscale package install.

Phase 2 of the install brief surfaces these as questions to Darrell — do not start until they're answered.

## Step 0 · One-time DSM prep (Darrell only)

These four require Synology admin login and cannot be automated by Claude:

1. DSM → Package Center → install **Container Manager** (DSM 7.2+) if not present.
2. DSM → Package Center → search **Tailscale** → install → log in with Darrell's Tailscale account.
3. DSM → Control Panel → Shared Folder → create folder named `docker` (default permissions).
4. DSM → Control Panel → Terminal & SNMP → enable SSH service (port 22, admin group).

Verify the four are done before continuing.

## Step 1 · Verify RAM and storage layout

```
ssh admin@<synology-tailscale-ip>
free -h                           # Confirm 62 GB total (Darrell's unit is populated past Synology's 32 GB spec)
df -h /volume1                    # Confirm >5 TB free
ls -la /volume1/                  # Confirm the docker shared folder exists
```

Create the per-purpose directories on `/volume1` if they don't exist:

```
sudo mkdir -p /volume1/backups /volume1/family-shared /volume1/app-uploads
sudo chown -R admin:users /volume1/backups /volume1/family-shared /volume1/app-uploads
```

(`/volume1/docker` is created by Container Manager; the n8n stack subfolder gets created in Step 3.)

## Step 2 · Deploy the stack

**Option A — Run the PowerShell one-shot from Darrell's laptop (recommended):**

```
cd C:\Users\dpoe\Kingdom-PWA-Node
.\deploy-n8n-stack-to-synology.ps1 -SynologyHost <tailscale-ip> -SshUser dpoe
```

The script: tests SSH, verifies Docker, creates `/volume1/docker/n8n-stack/`, copies `infra/n8n/docker-compose.yml`, generates a random `N8N_ENCRYPTION_KEY` and writes `.env`, runs `docker compose up -d --pull always`, then probes `:5678` `:8081` `:11434` until all three respond.

**Save the encryption key the script prints to your password manager — losing it loses every credential stored in n8n.**

**Option B — Container Manager UI (driven by Claude via Chrome MCP):**

1. DSM → Container Manager → Project → Create
2. Project name: `n8n-stack`
3. Path: `/volume1/docker/n8n-stack`
4. Source: Upload `infra/n8n/docker-compose.yml` from this repo.
5. Environment variables (paste from a filled-in `.env`):
   - `N8N_ENCRYPTION_KEY` — generate: `openssl rand -hex 32`
   - `N8N_HOST` — Tailscale IP or MagicDNS hostname
   - `WEBHOOK_URL` — `http://<tailscale-ip>:5678/`
   - `NTFY_BASE_URL` — `http://<tailscale-ip>:8081`
6. Next → Build. Container Manager pulls images and starts the stack.

## Step 3 · Smoke test all three services

From any Tailscale-connected device:

```
http://<tailscale-ip>:5678/         # n8n owner-account setup page
http://<tailscale-ip>:8081/         # ntfy welcome page
http://<tailscale-ip>:11434/        # responds: "Ollama is running"
```

Run all three from separate browser tabs in parallel (per the max-forward-motion principle in `README.md`).

## Step 4 · Complete n8n owner-account setup

Open `http://<tailscale-ip>:5678/` in browser. n8n's wizard:

- Email: `darrellpoe06@gmail.com`
- First name / last name
- Password (store in password manager)

After signup you're in the editor.

## Step 5 · Pull both Ollama models (in parallel with steps 6–8)

Two models in parallel — both local, both $0/mo perpetual. Pull them concurrently in two SSH terminals so neither waits on the other (max-forward-motion principle):

**Terminal 1 — Primary (fast/general):**

```
ssh admin@<tailscale-ip>
sudo docker exec -i ollama ollama pull qwen2.5:3b-instruct-q4_K_M
```

~5 minutes (~2 GB on disk).

**Terminal 2 — Secondary (reasoning-focused):**

```
ssh admin@<tailscale-ip>
sudo docker exec -i ollama ollama pull deepseek-r1:8b-llama-distill-q4_K_M
```

~10 minutes (~5 GB on disk).

While both pull, proceed with steps 6–8.

### When to use which model

This is the binding guidance for any future workflow that calls Ollama. Pick the model that fits the question, not the model you remember:

- **Primary (Qwen 2.5 3B)** — invitation: *"Help me understand this quickly."* Use for: notification copy generation, summarizing a `report_runs` row into one sentence, classifying a `change_request` by domain, deciding which ntfy topic a message belongs on, drafting Scripture-companion sentences (short, accurate, fast). Latency-sensitive paths.

- **Secondary (DeepSeek-R1-Distill-Llama 8B)** — invitation: *"Help me reason through this carefully."* Use for: chain-of-thought analysis of a `change_request` against POE priorities, trade-off weighing across multiple projects, multi-step reasoning over Scripture-grounded prompts where the Worldview asks for depth, drafting a `change_request` summary that names what's at stake on both sides. Depth-sensitive paths. The model emits visible reasoning between `<think>` tags — workflows that want only the final answer should strip those tags before delivery to the user.

Both stay resident (no cold-load penalty between calls). Switch by changing the `model` field in the HTTP Request node body — read it from env, never hardcode:

```
{
  "model": "{{ $env.OLLAMA_PRIMARY_MODEL }}",
  "prompt": "...",
  "stream": false
}
```

### Smoke test both

**Primary:**

```
curl http://<tailscale-ip>:11434/api/generate -d '{
  "model": "qwen2.5:3b-instruct-q4_K_M",
  "prompt": "Say hello to the Poe family in one sentence.",
  "stream": false
}'
```

**Secondary** (note: DeepSeek-R1 emits chain-of-thought in `<think>` tags; the smoke prompt should expect that):

```
curl http://<tailscale-ip>:11434/api/generate -d '{
  "model": "deepseek-r1:8b-llama-distill-q4_K_M",
  "prompt": "A family wants to decide whether to defer one project to next cycle. Walk through how you would weigh the trade-off. Two short paragraphs.",
  "stream": false
}'
```

Verify both are resident:

```
sudo docker exec -i ollama ollama ps
```

Expected output: two rows, both showing `qwen2.5:3b...` and `deepseek-r1:8b...` with their VRAM/RAM footprints.

## Step 6 · Register Pushover credentials in n8n (dual-path)

Pushover delivery uses two paths. Workflows pick at runtime via an If node on `$env.PUSHOVER_APP_TOKEN` — if the app token is present, go Path A; otherwise go Path B. This means Path B works the moment SMTP lands; Path A turns on the moment Darrell creates the app token.

Open `infra/n8n/.pushover-creds.local` from the repo (gitignored convenience file with Darrell's staged values, confirmed from his Pushover Settings screenshot 2026-05-26).

### Path A · Direct API (richer; needs app token)

POST to `api.pushover.net` with user key + app token. Supports priorities, sounds, attachments, custom URLs, target-device routing.

**Values in `.pushover-creds.local`:**

- `PUSHOVER_USER_KEY` = `upan72gdukpvmo49uet2jfyjgrrf3v` (confirmed — Pushover label: *"Pushover User Key — Supply this to any Pushover-enabled software"*)
- `PUSHOVER_APP_TOKEN` = **TODO**. Create at https://pushover.net/apps/build:
  1. Log in with `darrellpoe06@gmail.com`
  2. Click "Create a new application/API token"
  3. Name: `PoeTech`
  4. Description: `n8n on DS1621xs`
  5. URL: `https://kingdom-pwa-node.vercel.app/` (optional)
  6. Submit → copy the 30-char API token
  7. Paste into `.pushover-creds.local` as `PUSHOVER_APP_TOKEN=...` (overwrite the TODO line)
- `PUSHOVER_DEVICE_NAME` = `PoeTech` (Darrell's configured target device)

**Wire in n8n:** Settings → Credentials → New credential → search **Pushover** → paste:

- **User Key** → from `.pushover-creds.local`
- **API Token / Key** → the new token from step 6 above

Save. The credential ID auto-fills into the workflows that reference `pushoverApi`.

### Path B · Email-to-push gateway (works NOW, no app token needed)

Pushover's email-to-push converts inbound emails into push notifications. Any SMTP source that sends to `ikzf7xijr4@pomail.net` triggers a push to Darrell's PoeTech device. Subject becomes the title, body becomes the message. Less rich than Path A (no priorities/URLs/sounds) but ZERO additional Pushover config needed.

**Value in `.pushover-creds.local`:**

- `PUSHOVER_EMAIL_GATEWAY` = `ikzf7xijr4@pomail.net` (confirmed — Pushover label: *"Pushover E-Mail Address — E-mails to this address will create Pushover notifications"*)

**Wire SMTP in n8n** (one-time, pick ONE source):

- **Gmail (fastest tonight)** — Settings → Credentials → New → **SMTP**:
  - User: `darrellpoe06@gmail.com`
  - Password: app password from https://myaccount.google.com/apppasswords (create one named "n8n PoeTech")
  - Host: `smtp.gmail.com`
  - Port: `587`
  - SSL/TLS: `STARTTLS`
- **Resend** (when SMTP signup lands) — paste API key into Settings → Credentials → New → **Resend**.

Once either SMTP credential exists, the workflows' Email Send node auto-resolves and Path B is live.

### How the dual-path If node works (every Pushover-emitting workflow)

```
Format notification (Code) → If: $env.PUSHOVER_APP_TOKEN is set?
                              ├─ true  → Pushover (HTTP API)  [Path A]
                              └─ false → Email Send → pomail.net  [Path B]
```

Both branches converge to the same Respond/Continue node. Switching between paths = one `.env` edit + `docker compose up -d`; zero workflow JSON edits.

### Rotate after install (not urgent, do once verified)

The user key (`upan72gdukpvmo49uet2jfyjgrrf3v`) and email gateway were passed through chat logs during the install handoff. After Step 10 (end-to-end test) passes and notifications are flowing, rotate both:

1. **User key:** Log in to https://pushover.net → Account → "Reset User Key" → confirm → copy → update `.pushover-creds.local` → n8n → Settings → Credentials → Pushover → paste → Save.
2. **Email gateway:** Account → "Reset E-Mail Address" → copy new pomail-style address → update `.pushover-creds.local` → re-wire any workflow's Email Send `to:` field (or pull from `$env.PUSHOVER_EMAIL_GATEWAY` so a `.env` edit covers it).

No workflow JSON edits needed if both values are read from `$env`. Rotating the user key does NOT affect the app token; rotating the email address does NOT affect either of the other two.

### Pushover license deadline

Account created 2026-05-26 — 30-day free trial. The $5 lifetime license must be purchased by **2026-06-25** or pushes cap out. The seeded `change_request` "Pushover license $5 one-time" has had its `priority_score` bumped to reflect this deadline; workflow 04 (POE morning standup) will surface it as the deadline approaches.

## Step 7 · Register Supabase Postgres credentials in n8n

For workflows 02, 04, 05 (which query/insert against the live Supabase database):

n8n editor → Settings → Credentials → New → **Postgres** → paste:

- Host: `db.mjjlevhdufpaplypnqrv.supabase.co` (project `mjjlevhdufpaplypnqrv`, us-east-2)
- Database: `postgres`
- User: `postgres` (or a dedicated `n8n_runner` role — preferred; see below)
- Password: from Supabase Dashboard → Project Settings → Database → Connection string
- Port: `5432` (direct) or `6543` (pgBouncer pooler — recommended for n8n)
- SSL: `require`

**Recommended hardening (post-install):** create a dedicated Postgres role with row-level grants instead of using `postgres`:

```sql
CREATE ROLE n8n_runner WITH LOGIN PASSWORD '<strong-password>';
GRANT USAGE ON SCHEMA public TO n8n_runner;
GRANT SELECT ON public.report_runs, public.cycle_items, public.change_requests, public.projects TO n8n_runner;
GRANT INSERT ON public.cycle_items TO n8n_runner;
```

Run that in Supabase SQL editor once and switch the n8n credential to `n8n_runner`.

## Step 8 · Import the 5 workflows (in order)

n8n editor → Workflows → Import from File. For each JSON file in `docs/00-foundations/n8n-workflows/`:

1. `01-supabase-cycle-item-webhook.json` — webhook trigger, no schedule
2. `02-daily-reports-cron.json` — 6 AM America/Chicago
3. `03-github-event-to-phone.json` — webhook trigger
4. `04-poe-morning-standup.json` — 7 AM America/Chicago
5. `05-end-of-day-reflection.json` — 9 PM America/Chicago

After import, re-bind credentials on every node that has a red error chip:

- Pushover HTTP nodes → pick the credential from Step 6
- Postgres nodes → pick the credential from Step 7

Then toggle each workflow to **Active**. Do NOT activate until credentials bind cleanly.

## Step 9 · Wire the Supabase webhook into workflow 01

Supabase Dashboard (`https://supabase.com/dashboard/project/mjjlevhdufpaplypnqrv`):

1. Database → Webhooks → Create a new hook
2. Name: `cycle-item-insert-to-n8n`
3. Table: `cycle_items`
4. Events: `Insert`
5. Type: HTTP Request
6. Method: `POST`
7. URL: `http://<tailscale-ip>:5678/webhook/supabase-cycle-item`
8. HTTP Headers: leave defaults
9. Confirm.

**Note:** Supabase's webhook runner must reach the Synology over the public internet. Since the stack is Tailscale-only, this means either (a) Supabase calls into a Cloudflare Tunnel proxy (deferred), or (b) we run the test trigger from a Tailscale-connected device using `curl`. For vacation week, use (b) — the locked design defers Cloudflare Tunnel. If/when Supabase needs to reach n8n in production, install `cloudflared` on the Synology and re-point the webhook URL.

## Step 10 · End-to-end test

From a Tailscale-connected device:

```
curl -X POST http://<tailscale-ip>:5678/webhook/supabase-cycle-item \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "cycle_items",
    "schema": "public",
    "record": {
      "id": "test-001",
      "title": "Install smoke test",
      "assigned_to": "darrell",
      "priority_score": 0.9,
      "user_priority_override": null,
      "cycle_id": "vacation-prep-2026-05-25"
    },
    "old_record": null
  }'
```

Expected: Pushover notification on Darrell's phone within 5 seconds.

## Step 11 · Subscribe phones to ntfy topics

On every family phone (Christina, Darrell, kids):

1. Install **ntfy** (App Store / Play Store).
2. Open it → Settings → Default server → `http://<tailscale-ip>:8081`.
3. Add subscription:
   - Darrell: topic `darrell`
   - Family: topic `family-ops`
   - Christina: topic `christina`

Phone must be on Tailscale to receive — Tailscale app + ntfy app both run; ntfy shows a connection error when off Tailscale (harmless, expected).

For ntfy auth (since `NTFY_AUTH_DEFAULT_ACCESS=deny-all`):

```
ssh admin@<tailscale-ip>
sudo docker exec -it ntfy ntfy user add darrell
sudo docker exec -it ntfy ntfy access darrell darrell read-write
sudo docker exec -it ntfy ntfy access darrell family-ops read-write
# Repeat for christina, kids...
```

Or relax to `NTFY_AUTH_DEFAULT_ACCESS=read-write` in `.env` (acceptable inside the Tailscale boundary).

## Step 12 · Install Restic backup

```
ssh admin@<tailscale-ip>
sudo mkdir -p /volume1/docker/n8n-stack/backup
# Copy infra/n8n/backup/restic-cron.sh from the repo:
sudo cp /tmp/restic-cron.sh /volume1/docker/n8n-stack/restic-cron.sh
sudo chmod +x /volume1/docker/n8n-stack/restic-cron.sh
# Run once manually to init the repo + generate the password:
sudo /volume1/docker/n8n-stack/restic-cron.sh
# *** WRITE DOWN the password it prints. ***
```

Schedule it: DSM → Control Panel → Task Scheduler → Create → Scheduled Task → User-defined script:

- Name: `restic-n8n-daily`
- User: `root`
- Schedule: Daily at 03:00
- Command: `/volume1/docker/n8n-stack/restic-cron.sh`

Monthly USB rotate (manual, 2 minutes) — see header comments in `restic-cron.sh`.

## Step 13 · Update the seeded project to "shipped"

The install IS its own status report. In the live app at `https://kingdom-pwa-node.vercel.app/`:

1. Open project: **Synology n8n rollout**
2. Mark relevant `cycle_items` as `approved`/`completed` (per the actual install state)
3. Drop one `change_request` for any friction encountered (POE-bound: non-punitive language)
4. Disposition = `approved` for the project itself once Step 10 passes.

This is the dogfood — the system tracks its own deployment.

## Gotchas discovered during the 2026-05-26 rollout

These bit us during install. Documenting so the next deploy (or a fresh re-install) skips the same hour-of-debugging.

**1. `N8N_BLOCK_ENV_ACCESS_IN_NODE` defaults to `true`.** n8n blocks `$env.*` access from node expressions by default. Workflows referencing `{{ $env.PUSHOVER_APP_TOKEN }}` etc. will error with `ExpressionError: access to env vars denied` before any routing happens. Fix is in `docker-compose.yml`: `- N8N_BLOCK_ENV_ACCESS_IN_NODE=false`. Acceptable security tradeoff for single-user self-hosted; revisit if multi-user editing ever lands.

**2. n8n 2.21 has a draft/published workflow model.** Setting `active=1` on `workflow_entity` via SQL is **not** sufficient — workflows also need a row in `workflow_published_version` pointing to a snapshot in `workflow_history`, plus a `webhook_entity` row per webhook node. The UI's Publish button handles this; programmatic activation needs `infra/n8n/scripts/publish-and-activate.py`. Symptom: 404 `webhook not registered` despite n8n showing the workflow as Active.

**3. Vue Flow viewport renders imported workflows at negative screen coords.** When workflows are imported via the file-upload path (not manually built in the editor), Vue Flow places nodes at e.g. `translate(-2112px, -304px)`. The "Zoom to Fit" / `F` key / keyboard `1` doesn't bring them into view via Chrome MCP automation. Fix: edit the imported JSON files locally to use small positive coordinates, OR drive the binding via SQLite scripts (the path we ended up using). For manual UI work just press F at the keyboard physically — works fine outside automation.

**4. n8n Community edition can't create scoped API keys.** The Settings → API Keys UI shows a scope dropdown with "No data" and the Save button stays greyed. Granular scopes are a Pro/Enterprise feature. Bypass: direct SQLite manipulation via the scripts in `infra/n8n/scripts/`, OR use the legacy `n8n` CLI inside the container (but the CLI tries to bind port 5678 so n8n must be stopped first).

**5. Synology's `sudo` strips `PATH`; docker isn't on the secure_path.** `sudo docker` returns `sudo: docker: command not found`. Always use the absolute path: `/var/packages/ContainerManager/target/usr/bin/docker`. This applies to `docker exec`, `docker compose`, all of it.

**6. PowerShell quoting × bash quoting × SSH × sudo bash -c "..."**. The combination is fragile. The reliable pattern is **PS outer double quotes + bash inner single quotes** with no nested `\"` or `||` operators inside (PS5 mis-parses `||`). For multi-line SQL or scripts, pipe via PS here-string `@'...'@ | ssh ...`. For commit messages, use `git commit -F messagefile` to bypass all quoting.

**7. Sudo's `secure_path` doesn't carry through `sudo bash -c "..."` consistently on Synology.** Sometimes the inner commands run as `dpoe` not root. If docker calls fail with "permission denied on socket" inside a sudo bash -c, split into discrete ssh calls each prefixed with `sudo /var/packages/.../docker`.

**8. Pushover Community-edition email-to-push works without app token but is sender-filtered.** Use `darrellpoe06@gmail.com` as the `fromEmail` on Email Send nodes — matches the Pushover account's registered email and matches the Gmail SMTP authenticated user. Placeholder addresses like `n8n@poetech.local` may be silently dropped by Pushover's gateway even when Gmail accepts the SMTP transaction.

**9. ntfy in-container hostname.** Inside the n8n container, ntfy is reachable at `http://ntfy:80/<topic>` (Docker DNS). From outside (your laptop), use `http://192.168.1.26:8081/<topic>`. Don't mix them up.

## Troubleshooting

See `README.md §Troubleshooting` — comprehensive list of n8n boot issues, ntfy auth, Ollama disk space, Tailscale connectivity.

## Reference

- Reference (deep): `infra/n8n/README.md`
- One-shot script: `deploy-n8n-stack-to-synology.ps1`
- Eval: `docs/00-foundations/PARALLEL-FRAMEWORKS-EVAL.md`
- Workflows: `docs/00-foundations/n8n-workflows/`
- Backup: `infra/n8n/backup/restic-cron.sh`
