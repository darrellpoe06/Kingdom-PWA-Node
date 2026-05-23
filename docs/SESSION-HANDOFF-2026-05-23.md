# Session Handoff — 2026-05-23

> Written at session-budget 90%. Picks up exactly where today's session ends so a fresh session can continue without context loss. Read this first in the next session.

---

## Headline

**Layer 1 shipped.** PoeTech Family OS is live on Darrell's Synology DS1621xs at `https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/`. Family + church can install the PWA from that URL on any device. Cert is valid (verified in Incognito).

**Layer 2 is mid-install.** Supabase Cloud (free tier) is provisioned and Healthy. The schema SQL is staged and pasted into the SQL editor — was waiting on a `Ctrl+Enter` run when the session ran out, blocked by a Grammarly browser-extension popup overlay (not a Supabase problem; just dismiss its X and run).

**Deadline:** June 1, 2026. Family + church testing during Darrell + Christina's vacation.

---

## Critical IDs / URLs (for the next session)

| What | Value |
|---|---|
| **App URL (family install)** | https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/ |
| **DSM admin** | https://192-168-1-26.poetech.direct.quickconnect.to:5001/ (port unchanged) |
| **Synology shared folder for app** | `\\PoeTech\poetech-app` (Web Station alias `/poetech-app/`) |
| **Synology shared folder for Supabase self-hosted (post-vacation)** | `\\PoeTech\supabase` (folder created, docker-compose attempt paused) |
| **Supabase Cloud org** | PoeTech, Free Plan |
| **Supabase Cloud project** | PoeTech-Family-OS |
| **Supabase project URL** | https://mjjlevhdufpaplypnqrv.supabase.co |
| **Supabase project ref** | `mjjlevhdufpaplypnqrv` |
| **Supabase region** | AWS us-east-2 (Ohio) |
| **Supabase auth method** | GitHub OAuth (Darrell signed up with darrellpoe06@gmail.com) |
| **Supabase publishable key** | In `app/.env.local` (gitignored). Starts `sb_publishable_wQvp…` |
| **GitHub repo** | https://github.com/darrellpoe06/Kingdom-PWA-Node |
| **Active git branch** | `docs/skos-foundations` (this is where Darrell's been committing) |
| **Deploy script** | `.\deploy-to-synology.bat` or `.\deploy-to-synology.ps1` from repo root |

---

## What was DONE this session

1. **Diagnosed and explained the 17 orphaned PoeTech Family OS PWA installs** in Darrell's Start menu — each one was a Chrome PWA install from a different `app/preview-rN` build folder. Not cleaned up yet (left as Start-menu archive; harmless).
2. **Built and deployed the React app to Synology Web Station** as an alias portal at `/poetech-app/`. Required vite.config.js `base: '/poetech-app/'`, manifest.webmanifest path fixes, service-worker BASE constant + cache bump.
3. **Resolved "Not secure"** by promoting the Synology QuickConnect Let's Encrypt cert (wildcard SAN `*.poetech.direct.quickconnect.to`) to default. Confirmed secure in Incognito.
4. **Fixed "Welcome, Christina" greeting** to "Welcome to Your PoeTech Family OS." — generic copy until Layer 2 auth lands.
5. **Tried to self-host Supabase on the Synology — paused.** Couldn't verify Docker Hub image tags from sandbox (no outbound). Hand-written docker-compose failed twice. **Pivoted to Supabase Cloud free tier as v0** with explicit post-vacation migration plan back to self-hosted.
6. **Provisioned Supabase Cloud project.** PoeTech-Family-OS, us-east-2, Healthy, GitHub OAuth, 2FA-protected.
7. **Wrote schema SQL** at `infra/supabase/schema-v1.sql` (390 lines, ~18KB). Translates `SUPABASE-SCHEMA-LAYER-2.md` into runnable SQL: tenants, tenant_members, entities, accounts, transactions, debts, projects, feedback, confessions, user_telemetry, user_tenant_settings + RLS policies + helper functions.
8. **Captured the day's major product clarifications from Darrell:**
   - "Multitude of Counselors / Shepherd of Souls" framing for the Counseling sub-tab (Prov 11:14, 1 Pet 2:25) — counselling stays per-device, never synced.
   - Voluntary Confession surface (James 5:16) — distinct from Counseling, opt-in disclosure with audience scoping.
   - Feedback → Project pipeline (feedback promotable to Project with audit trail).
   - Aggregate user analytics (users-per-tab, version adoption) on Projects/admin view.
   - Adoption incentives — parked for later.
   - Family device mix: Darrell + Christina on Samsung Z Fold 7s, Christiana on iPhone (the iOS Safari install was the cert-blocker; now unblocked), twins on Samsung.
   - **June 1 vacation deadline** drives everything.

---

## Where the session STOPPED

Darrell pasted `schema-v1.sql` into the Supabase SQL Editor. First attempt to Run was blocked by a QuillBot (not Grammarly — corrected) browser-extension overlay flagging the SQL as English text. Darrell dismissed the extension and tried Run again.

**Second attempt result:** `Failed to run sql query: ERROR: 42601: syntax error at or near "rollback" LINE 6: rollback; ^`

**Diagnosis:** the `rollback;` is NOT in `schema-v1.sql`. It's injected by Supabase Studio's "Read-only mode" (or "Preview" / "Test query" mode), which wraps user queries in `BEGIN; … ROLLBACK;` to let users dry-run without committing. Some of our DDL statements (functions with `SECURITY DEFINER`, certain `ALTER TABLE` ops) cannot run inside a rolled-back transaction, hence the parser fails.

**Immediate next action in the new session:**

1. Open Supabase SQL Editor at the same URL: `https://supabase.com/dashboard/project/mjjlevhdufpaplypnqrv/sql/new`
2. Re-paste `infra/supabase/schema-v1.sql` (the editor content was lost when Darrell switched sessions).
3. Find the **Run mode dropdown** — usually a small caret next to the Run button, or a toggle in the editor toolbar. Options are typically "Run" / "Run as Read-only" / "Run as Transaction". Switch to plain **Run** (not Read-only / not Transaction with rollback).
4. Ctrl+Enter. Should report "Success. No rows returned."
5. Verify with: `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;` — should show 12 tables: accounts, confessions, debts, entities, feedback, projects, tenant_invites, tenant_members, tenants, transactions, user_telemetry, user_tenant_settings.

**Alternative fix if the Read-only toggle can't be found:** wrap the offending statements in `COMMIT;` blocks or split the schema into two files (one for functions/CREATE statements, one for ALTER+POLICY+INSERT). For now try the toggle first — that's the 30-second fix. If still stuck, the next session generates a split-schema version.

---

## What's NEXT (in priority order to hit June 1)

| # | Step | Owner | Estimate |
|---|---|---|---|
| 1 | Run `schema-v1.sql` in Supabase SQL Editor | Darrell | 1 min |
| 2 | Verify 12 tables exist | Claude | 2 min |
| 3 | Add `@supabase/supabase-js` to app/package.json; run npm install | Both | 5 min |
| 4 | Write `app/src/lib/supabase.js` — Supabase client factory using `app/.env.local` | Claude | 10 min |
| 5 | Add magic-link sign-in flow to the React app (one new "Sign in" page) | Claude | 30 min |
| 6 | Refactor `app/src/shims/storage.js` to read/write the `feedback` table via Supabase when signed in (and fall back to localStorage when not) | Claude | 60 min |
| 7 | Wire the existing Feedback button (bottom-left of the app) to write to Supabase. **This is the v0 sync proof — when family submits feedback from any device, it lands in Darrell's `feedback` table.** | Claude | 30 min |
| 8 | Build + push: `.\deploy-to-synology.bat` | Darrell | 30 sec |
| 9 | First end-to-end smoke test: Darrell signs in on his laptop, Christina signs in on her phone, both submit feedback, both see each other's. | Both | 10 min |
| 10 | Add `/church/` alias portal on Web Station (mirror of `/poetech-app/`) | Claude | 5 min |
| 11 | Create church tenant in Supabase (already seeded by schema), invite first church leader as admin | Claude | 5 min |
| 12 | Smoke test from church-leader side | Both | 10 min |
| 13 | Migrate remaining modules (Books, Debts, Rentals, Projects) one at a time | Claude over multiple sessions | several sessions |

Items 1-9 should fit in the next 1-2 sessions (whatever budget Darrell has left tomorrow/this week). Items 10-12 ship the church alongside the family. Item 13 progresses as time allows; even if only Feedback syncs by June 1, the loop is proven.

---

## Parallel workstream — In-app writing assistant (QuillBot-style)

**Added 2026-05-23 at session-budget-95%, just before handoff.** Darrell saw QuillBot's in-context assistant panel in the Supabase tab and wants the same pattern *inside* our app. Critical framing:

**Not a side feature — it's the operational form of foundations You've already written.** The `MIND-OF-CHRIST.md` "Test tool" (the Philippians 4:8 filter: TRUE? HONORABLE? JUST? PURE? LOVELY? COMMENDABLE? EXCELLENT? PRAISEWORTHY?) is the conceptual spec. The in-app assistant is the UI that makes it operational on every free-text input.

**Surfaces it appears on:**
- Confession composer (helps refine before submission, runs the Test)
- Feedback composer (same)
- Counseling sub-tab (per-device only — never leaves PIN+AES-GCM boundary; assistant calls run locally or via redacted proxy)
- Any free-text field in the app (Notes on transactions, project descriptions, scope text, etc.)

**Capabilities (matches what QuillBot/Grammarly offer):**
- Tone refinement and paraphrase suggestions
- Double-click a word for synonyms / rewrite sentence
- AI cursor (suggestions inline as You type)
- Per-field toggle so user controls when it's active
- **One uniquely SKOS feature:** "Run the Test" button that scores the text against Phil 4:8 and surfaces specific words/phrases that fail each filter

**Why this slots in as parallel, not blocking:**
- v0 wraps the Claude API directly (~one focused session post-Layer-2)
- Doesn't require Supabase auth to work (each user pays for their own assistant via local API key, or family shares Darrell's via Supabase Edge Function)
- Post-vacation, swap Claude API for local LLM on the Synology (Mistral/Llama via Ollama) — same binding open-source + portable + vendor-independent principle as the rest of the stack

**Timeline placement:** ship v0 the session AFTER the Feedback sync is proven (probably May 26-27). Family + church get it as the *first* major delight feature on top of working sync.

**Naming TBD.** Candidates: "The Test Assistant" (anchors directly to Phil 4:8 + MIND-OF-CHRIST.md), "Kingdom Companion", "Mind-of-Christ Helper", "Refinement Companion". Darrell decides when we build.

Captured as Task #32 in the task system.

---

## What's NOT happening (deferred to post-vacation)

- **Self-hosted Supabase on the Synology** (`\\PoeTech\supabase` folder, `infra/supabase/docker-compose.yml`). All the files are staged; the missing piece is verified Docker Hub image tags. Post-vacation Darrell can browse `hub.docker.com/u/supabase` from his laptop, feed Claude the exact published versions, and we redo the self-host. Migration path: `pg_dump` from Supabase Cloud → `pg_restore` to self-hosted Postgres → swap `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `app/.env.local` → redeploy.
- **PR for `docs/foundations-and-framework-2026-05-23` branch** — Darrell to open at his convenience.
- **Spine §5 commit** — Darrell to clear stale `.git/index.lock` and commit the `docs/PROJECT-FRAMEWORK.md` edit from earlier today (small chore, fine to defer).
- **Cleanup of the 17 orphaned PWA installs in Start menu** — cosmetic; cleaning them via `chrome://apps` is a 60-second job whenever Darrell wants.

---

## How to start the next session

Open Cowork mode (or a fresh Claude session) in the same `Kingdom-PWA-Node` folder, then paste this:

> "Read `docs/SESSION-HANDOFF-2026-05-23.md` first. Then read the most-recent `PROJECT-FRAMEWORK.md`. Then continue from step 1 of the 'What's NEXT' table — the SQL is pasted in Supabase, just blocked by Grammarly; tell me how to verify the run and we'll proceed through the list."

That's it. Everything Claude needs is in this doc, the spine, and the repo.

---

*Written 2026-05-23 at session-budget-90%. The work resumes from here without any context loss.*
