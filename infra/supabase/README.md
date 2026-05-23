# Supabase self-hosted on Synology DS1621xs — Setup

This folder is what gets deployed to `/volume1/supabase` on Your Synology. Container Manager runs the `docker-compose.yml` here as a Project. The result: a complete Supabase backend reachable at:

- **API gateway:** `https://192-168-1-26.poetech.direct.quickconnect.to/supabase-api/` (Web Station alias → `localhost:8000`)
- **Studio admin UI:** `https://192-168-1-26.poetech.direct.quickconnect.to/supabase-studio/` (Web Station alias → `localhost:3000`)

## What's in this folder

- `docker-compose.yml` — the seven services (db, auth, rest, realtime, studio, meta, kong)
- `.env` — generated secrets (gitignored, never commit)
- `.secrets-summary.txt` — non-secret metadata about what was generated
- `volumes/kong/kong.yml` — Kong API gateway routing rules
- `volumes/db/data/` — Postgres data (gitignored, this is where the actual database lives)
- `volumes/db/init/` — optional SQL run on first Postgres boot (empty for now)

## Deploy steps

These are the steps to get Supabase running on Your Synology. Two halves: copy the files, then start the project.

### Step 1: Copy this folder to the Synology

In Windows File Explorer:
1. Open `C:\Users\dpoe\Kingdom-PWA-Node\infra\supabase\`
2. Select all files (Ctrl+A) **including the hidden `.env` file** — turn on "Hidden items" in File Explorer's View tab if You don't see it
3. Copy (Ctrl+C)
4. In a new Explorer window, open `\\PoeTech\supabase\`
5. Paste (Ctrl+V)

If `\\PoeTech\supabase\` doesn't exist yet, I'll create the shared folder via DSM first.

### Step 2: Start the Project in Container Manager

1. Open Synology DSM → Container Manager
2. Click "Project" in the left sidebar
3. Click "Create"
4. Project name: `supabase`
5. Path: `/volume1/supabase`
6. Source: "Use existing docker-compose.yml" (auto-detected)
7. Click "Next" → review the services list → "Done"
8. Wait. First-time pull is ~3-4 GB across the seven images; takes 5-10 minutes on the DS1621xs's network.

### Step 3: Verify

In Container Manager → Container tab, every service should show "Running":
- supabase-db
- supabase-auth
- supabase-rest
- supabase-realtime
- supabase-studio
- supabase-meta
- supabase-kong

If any shows "Exited", click into it and check the logs. Most common first-run issue: the `db` container takes 30-60 seconds to be healthy on a cold start, and the other services fail their first connection. They retry automatically — give it 2 minutes before You worry.

### Step 4: Add Web Station portals (so the API and Studio are reachable from outside)

In DSM Web Station → Web Portal → Create:

1. **Studio portal:**
   - Service: "Create new web service" → Static website is fine, doc root `/volume1/supabase/volumes/kong` (placeholder, not actually served) → name it `supabase-studio`
   - Actually simpler: use the reverse proxy approach. DSM Control Panel → Login Portal → Advanced → Reverse Proxy → Create:
     - Source: `https://192-168-1-26.poetech.direct.quickconnect.to/supabase-studio` (or pick a name-based subdomain if You set up DDNS)
     - Destination: `http://localhost:3000`

2. **API portal (Kong gateway):**
   - Reverse Proxy → Create:
     - Source: `https://192-168-1-26.poetech.direct.quickconnect.to/supabase-api`
     - Destination: `http://localhost:8000`

These take the QuickConnect Let's Encrypt cert automatically since we set it as the default.

### Step 5: First login to Studio

Open `https://192-168-1-26.poetech.direct.quickconnect.to/supabase-studio/` in Chrome. Studio asks for the dashboard username/password from .env. Get them from `.secrets-summary.txt` and `.env` in this folder.

### Step 6: Create the schema

In Studio → SQL Editor, paste the schema from `docs/00-foundations/_future/SUPABASE-SCHEMA-LAYER-2.md` (translated to SQL — I'll generate a single `schema.sql` file when we get there). Run it. Tables appear in the Table Editor.

### Step 7: Wire the React app

Replace `app/src/shims/storage.js` to use the Supabase client instead of localStorage. The PoeTech app now reads and writes to the same Postgres database from every device, scoped by the signed-in user's tenant membership.

## Security notes

- `.env` is gitignored. It contains JWT_SECRET, DB_PASSWORD, ANON_KEY, SERVICE_ROLE_KEY, and the Studio dashboard password. Never commit it. Never paste it into chat. If You think it's been exposed, regenerate everything by deleting `.env` and re-running the generation step.
- `SERVICE_ROLE_KEY` bypasses Row Level Security. It should only be used server-side (in scripts or trusted backend processes). The React app uses `ANON_KEY` only.
- Postgres port 54322 is bound to `127.0.0.1` in `docker-compose.yml` — it's only reachable from the Synology itself, not from the LAN or QuickConnect.

## Where to look when something breaks

| Symptom | Where to look |
|---|---|
| `kong` container exits immediately | `volumes/kong/kong.yml` has a syntax error or references a missing service |
| `auth` keeps restarting | Database isn't ready yet, or `POSTGRES_PASSWORD` mismatch between .env and what was set on first run |
| Studio shows "Failed to fetch" | `meta` service isn't running, or `SUPABASE_PUBLIC_URL` in .env doesn't match Your Web Station alias |
| `rest` returns 401 on everything | `ANON_KEY` regenerated but containers not restarted (run `docker compose restart` after .env changes) |

## Future: SMTP for real magic-link emails

Right now `GOTRUE_MAILER_AUTOCONFIRM=true` in .env, which means signup is instant — no email confirmation. Good for testing with the family before vacation. For production:

1. Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in .env (Gmail App Password, SendGrid, Postmark, etc.)
2. Set `GOTRUE_MAILER_AUTOCONFIRM=false`
3. Restart the auth container

Then real magic-link emails go out to family members on signup.
