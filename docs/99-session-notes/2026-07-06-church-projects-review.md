# CHURCH PROJECTS — comprehensive review + report (2026-07-06)

**Read-only discovery pass** (no code changed, nothing deployed, nothing heavy run). Absorbs and supersedes the earlier `2026-07-06-tomorrow-implementation-plan.md`.

**Verification legend (DR-0076, no fake-green):**
- **CONFIRMED** — verified against a repo file (path cited) or an independent live check.
- **COULD-NOT-VERIFY** — not confirmable from this machine (needs the live deploy, the NAS, a mailbox, or a repo/Actions variable). Flagged, never painted.

**Two evidence sources:** (a) repo files on `C:\Users\dpoe` (branch even with `origin/main` #514); (b) a **live-check fact sheet from the other (cloud) session, 2026-07-06** — `curl -sI` against `poetech.us`, `/poetech-app/`, `/sw.js`, `/n8n/healthz`. Live-state claims are attributed to (b); file-existence claims independently re-confirmed here.

---

## 0. INFRASTRUCTURE REALITY — corrected, and it changes the docs

Darrell's instinct was right, and my first read of this was wrong. Grounded truth:

| Thing | Reality (CONFIRMED) | The doc that's now WRONG |
|---|---|---|
| **Serving `poetech.us`** | **Cloudflare Pages.** Live headers show `cf-ray` / `cf-cache-status: DYNAMIC`, **zero `x-vercel-*`** (was present in the runbook's 2026-07-01 check). Origin cut off Vercel. *(live check b)* | `deploy-cloudflare-pages.yml` header still says "NO CUTOVER YET / Vercel is live" — **stale**. `app/vercel.json` still in repo but **inert** (not in the live path). |
| **DNS** | `poetech.us` proxied on Cloudflare (cf-ray every response). *(b)* | — |
| **Backend** | Cloud Supabase `mjjlevhdufpaplypnqrv.supabase.co`, **unchanged**. *(CONFIRMED `app/.env.local:15`, `supabase.js`)* | — |
| **`/n8n/*` proxy** | Moved to a **Cloudflare Pages Function** `app/functions/n8n/[[path]].js` → Tailscale Funnel (replaces the Vercel rewrite). *(CONFIRMED file exists)* | — |
| **n8n itself** | **Wired, not retired — but DOWN right now.** All 7 webhooks still fetched in source; `/n8n/healthz` returns **HTTP 530 (origin unreachable)** → the NAS Funnel/n8n is unreachable, so every n8n webhook is **effectively dead this moment**. *(b + CONFIRMED call sites)* | Infra docs treat n8n as healthy current orchestrator — true in intent, false in live status today. |
| **`/nas-photos/*` proxy** | **GAP — no Cloudflare route exists.** No `app/functions/nas-photos`, not in `_redirects`/`_headers` — only the now-inert `vercel.json` rewrite. **The property-photo bridge has no path on Cloudflare.** *(CONFIRMED absent)* | `nas-property-photos/README` still describes the `poetech.us → Vercel /nas-photos rewrite` chain — **stale**. |
| **Sovereign NAS-Caddy serving** | **Does NOT exist in repo.** `infra/nas-caddy/` and `deploy-pwa.sh` are absent. | `infra/seed-data/2026-06-29-sovereign-mesh-two-nas.json` calls `infra/nas-caddy/deploy-pwa.sh` "the EXISTING" script — **fake-green; the file isn't there.** |

**Net:** "we don't need Vercel anymore" = **CONFIRMED correct** (Cloudflare serves live). "we don't use n8n anymore" = **half true** — n8n is not removed/replaced in code; it's just **currently unreachable** (Funnel down). The load-bearing unfinished work is two things: **(1) restore the `/nas-photos` proxy on Cloudflare, (2) get the NAS Funnel back up so `/n8n/*` stops 530-ing.**

**COULD-NOT-VERIFY:** the value of the `CF_PAGES_ENABLED` Actions variable (not readable from repo); live evidence says serving already cut over regardless.

---

## 1. Church AV + on-site infrastructure

### 1A. NovaStar LED wall — CONFIRMED spec, install in progress
- **Grid math is real and unit-tested (no drift):** `app/src/lib/video-wall-spec.js` — Mirackle **P1.99mm** cabinets, **640×480 mm**, **8×6 = 48 cabinets**, NovaStar **VX1000** (6.5 Mpx load, 650k px/Gigabit port, 10 ports). *(CONFIRMED, vendor-cited in-file.)*
- **⚠ Resolution number to reconcile:** the task framed the wall as **2560×1440**, but the on-site runbook's confirmed chain (2026-06-30) measured native **~2710×1508 (~4.1 Mpx, ~85k px/cabinet)**, with 2560×1440 noted only as the *module-map estimate*. **NovaLCT gives the exact count on site** — treat 2560×1440 as estimate, not fact. *(CONFIRMED `2026-06-29-...runbook.md`.)*
- **Signal chain CONFIRMED (2026-06-30):** 8 LED data lines, one per column (~510k px/line, 8 of 10 ports, 2 spare), direct shielded Cat6, no switch; video in = program HDMI → KEQINX 1×8 HDMI-over-Cat6 → receiver → VX1000 HDMI. Tool cache (NovaLCT V5.9.1 / V-Can) staged on NAS `\\192.168.1.26\PoeTech\tool-cache\novastar\`.
- **NEXT STEP:** on site — power + one HDMI source for "first light" (expect scrambled = win), then **map once in NovaLCT** (8 cols × 6 rows, port→column in cable order, load vendor `.rcfgx`), set brightness. **Unblock:** get the receiving-card `.rcfgx` from LED Nation. **Effort:** ~2–4 hr on site once cabinets are powered.
- **COULD-NOT-VERIFY (needs the room):** cabinets powered, TRUE1 amp rating, exact circuit count, receiving cards pre-loaded.

### 1B. Church CUDA tower as second build/infra node — CONFIRMED buildable, not yet a node
- Repo builds with plain tooling: app in `app/` (`npm install && npm run build`, Vite 5). This machine runs Node 24 / npm 11; tower is Windows too → identical build. Build needs 5 `VITE_` keys in `app/.env.local` (**gitignored, NOT on the tower**). *(CONFIRMED `app/package.json`, `.env.local`.)*
- **Deploy is not the tower's job** — production is the Cloudflare Pages pipeline on push to `main` (`deploy-cloudflare-pages.yml`). The tower's value = build / test / GPU / local-LLM lane. *(CONFIRMED.)*
- **NEXT STEP (tower):** `cd app; npm install; npm run build`; create `.env.local` (Supabase `mjjlevhdufpaplypnqrv`); `npm test`. **Effort:** ~60–90 min.
- **COULD-NOT-VERIFY:** whether git/Node/npm are installed for user `creed`.

### 1C. Two-site mesh + GPU (2× RTX 4070) — CONFIRMED declared, NOT online
- `infra/ai-orchestrator/mesh/nodes.json`: `home-ds1621xs` online/verified; **`church-cuda` (2× RTX 4070) `online:false`, Tailscale IP = `SME-CONFIRM`**; `church-rs` (media corpus) firewalled. Router deterministic; private jobs never fall back to cloud. Ships **inert**. *(CONFIRMED.)*
- The build-loop README names the tower `livestream-main-pc` / `100.72.5.90` (Claude Code + `qwen2.5-coder:14b`) as the intended **DIRTY-PR local-LLM lane** runner.
- **NEXT STEP:** fill `church-cuda.tailscale` with the tower's real tailnet IP (reconcile the README's `100.72.5.90` guess vs the `SME-CONFIRM` blank). Keep routing inert. **Effort:** 5 min once the IP is known. **Blocker:** the IP is a value only Darrell/BG has.

---

## 2. Church content pipeline

### 2A. YouTube full-harvest — CONFIRMED real + honest; the fetch step is unrun
- Extractors are pure + shipped: `app/src/lib/video-harvest.js` (coverage math) + `transcript-harvest.js` (caption parsers). Status is **derived, never painted** — `partial`/`complete` only with a recorded run or real rows; untouched = `none` (honest gap). **No fake-green here** — `partial` is a *designed, evidenced* status; the codebase's `fake-green` hits are all guards against it. *(CONFIRMED `video-harvest.js:1-30, 83-88`.)*
- **The gap:** the libs only *parse* a transcript string. The **fetch** is `infra/nas-sme-pipeline/youtube-captions.py` → `transcripts.json` → `scripts/harvest-from-transcripts.mjs` (idempotent SQL). The % "stalled ~22%" because **captions were never fetched at scale**. *(CONFIRMED headers.)*
- **NEXT STEP (tower):** `pip install youtube-transcript-api`; run `youtube-captions.py` (bounded/resumable) → `harvest-from-transcripts.mjs`; apply SQL; watch `scripts/out/harvest-progress.jsonl` climb past 22%. GPU Whisper fallback (no-caption videos) is why the **tower** is the right host. **Effort:** 1–2 hr first run.

### 2B. Sermon library / BG teaching points (Pulpit) — CONFIRMED surface exists
- `app/src/components/Pulpit.jsx` is the sermon/teaching surface; `sermon_prep` (0067) feeds BG's numbered points. *(CONFIRMED file exists; see 3B for the sourcing status.)*
- **NEXT STEP:** tied to 3B (run the prep importer) + 2A (transcript-derived points). **Effort:** rolls up into those.

### 2C. Choir songbook — CONFIRMED real, member onboarding pending
- `Choir.jsx` (weekly music + schedule + thread, `choir-sync.js`, RLS-gated: members SEE, owner/admin EDIT) and `ChoirSongbook.jsx` (derived cross-ref over `choir_songs` — search by theme/scripture, suggestions with WHY, one-tap add, last-used, hearts; logic unit-tested in `lib/choir-songbook.js`). Christina (director) sees it now. *(CONFIRMED headers.)*
- **The gap:** non-director members see the "ask to be added" state until real user ids are linked into the roster. **NEXT STEP:** roster onboarding (link ≥1 non-director member) — tied to the community/instance model. **Effort:** ~1–2 hr + a real member to test.
- **Feeds from harvest:** `choir_songs` is exactly what worship-song harvest (2A adjacent) populates — so climbing the harvest % also fills the songbook.

### 2D. Church-live rolling stream + order-of-service — MOSTLY COULD-NOT-VERIFY
- **No dedicated "church-live rolling stream" component exists.** Livestream shows up as an *identity field* on `ConferenceModule.jsx` + device references (`DeviceInventory.jsx`), not as a rolling-stream surface. *(CONFIRMED absent as a standalone surface.)*
- **No `order-of-service` component/lib** — only `lib/lesson-flow.js` (the 5-stage lesson arc). The "order of service master → per-sector branches" is a **memory/roadmap item, not a built surface.** *(CONFIRMED absent.)*
- **NEXT STEP:** decide whether either is actually wanted as an in-app surface before building; if yes, each is its own module (new-surface = new-file). **Effort:** unscoped — needs a decision, not code, first.

### 2E. Reactions (engagement key) — CONFIRMED shipped, in-app only
- `reactions.js` + `reactions-sync.js` + `ReactionBar/Icon/Key.jsx` (#512). In-app reactions are the **primary** engagement/ranking signal; YouTube public stats are secondary display. "Images of the Godhead" palette, KJV-anchored. **No outbound social-media posting exists** — "social-media style" is the interaction model only. *(CONFIRMED `reactions.js:1-40`.)* **NEXT STEP:** none for the primitive; external publishing would be net-new.

---

## 3. Church App surfaces

### 3A. Church Tab (COLG / Love Corner default) — CONFIRMED identity fallback
- Signed-out, church surfaces fall back to **the COLG identity constant** (`ConferenceModule.jsx:8,63`); giving points at `thechurchofthelivinggod.com`. So the default church face is COLG / The Love Corner. *(CONFIRMED.)* **NEXT STEP:** none required; verify the constant matches BG's preferred public identity.

### 3B. The Word / Scripture — BG-email sourcing — CONFIRMED in code, NEVER run live
- Chain shipped + merged (#513, numbering fix #514): `scripts/sermon-import/import-prep.mjs` (IMAP-reads BG's emailed `.docx`) + pure `prep-outline.js` → `sermon_prep` (0067), read by The Word as the **authoritative** seed over the transcript; also fills `choir_sermons.scripture_ref`. Deterministic, honest (`needs_review=true`, raw_text kept). *(CONFIRMED header + git log.)*
- **The gap:** **never run against Christina's live mailbox** (`mrspoe06`). Config-driven via `content_sources` (platform `gmail-teacher`); colg default bundled. **COULD-NOT-VERIFY** whether the IMAP app-password / `content_sources` row is seeded.
- **NEXT STEP:** seed/confirm the row + app-password, run `import-prep.mjs` once, eyeball one `sermon_prep` draft. **Effort:** 30–60 min.

### 3C. Giving / Give floater — CONFIRMED shipped, needs the church's URL
- `ChurchGiving.jsx` — bottom-right "Give" floater (mirrors the Feedback pill), Church-tab only. **Links OUT to the church's own secure giving page** (`resolveGiveDestination`, `lib/giving.js`); **never invents a payment URL, no payment data in-app**; shows a clear "needs the church's giving URL" state if unconfigured. *(CONFIRMED header.)*
- **NEXT STEP:** confirm the real COLG giving URL is configured (not the placeholder). **Effort:** 5 min once BG supplies the link. **Blocker:** the URL is BG's to give.

### 3D. Conference / Event Center — CONFIRMED shipped, real registration
- `ConferenceModule.jsx` = front door: identity + **single open no-login registration** (`ConferenceRegisterForm` → `conference_public_registrations`, 0027) — **replaced the old device-only RSVP that falsely showed "✓ Received"** and never reached organizers. `EventCenterModule.jsx` adds real multi-attendee rooms/sessions/capacity/breakouts (instance-scoped, realtime). *(CONFIRMED headers.)*
- **NEXT STEP:** with the Assembly deadline (July), do a real end-to-end registration test on mobile signed-out; confirm organizers see it. **Effort:** ~30 min.

---

## TOP 5 TO DO NEXT (ruthless, in order)

1. **Restore the two live-infra breaks.** (a) Add the missing **`/nas-photos` Cloudflare Pages Function** (mirror `functions/n8n/[[path]].js`) so the photo bridge has a route; (b) get the **NAS Funnel back up** so `/n8n/*` stops returning 530 and the 7 webhooks come alive. *Highest priority — these are the load-bearing things actually down right now.* Effort: (a) ~1 hr, (b) NAS-side, unknown until you look.
2. **Fix the provably-wrong docs** (no code risk, protects trust): mark `vercel.json` inert, correct `deploy-cloudflare-pages.yml`'s "NO CUTOVER YET" comment, fix `nas-property-photos/README` (Vercel→Cloudflare), and delete the fake-green `nas-caddy/deploy-pwa.sh` "EXISTING" claim in the mesh seed-data. Effort: ~45 min.
3. **Make the church tower a real node** — build + test this repo on it (`.env.local` + `npm install/build/test`), then fill its Tailscale IP into `nodes.json` (inert). Effort: ~60–90 min.
4. **Climb the harvest % off 22%** — run the caption fetch → harvest chain on the tower (Python + GPU fallback). Fills the sermon library AND the choir songbook. Effort: 1–2 hr.
5. **Run the BG prep-email importer live** — seed `content_sources` + IMAP app-password, one real import into `sermon_prep`. Effort: 30–60 min.

**On the LED wall:** it's on-site work gated on cabinets being powered + the `.rcfgx` from LED Nation — do it when physically in the room (first light → map in NovaLCT), not from a keyboard. Reconcile the 2560×1440 vs ~2710×1508 number on site.

## WHAT TO IMPLEMENT TOMORROW
If tomorrow is a keyboard day: **#2 (fix docs)** and **#3 (tower as node)** are fully doable and unblock everything else. **#1a (nas-photos function)** is a clean ~1 hr win. **#1b, #4, #5** need the NAS reachable / the tower's Python+GPU / a live mailbox — sequence them after #1b restores the Funnel. If tomorrow is an on-site day at COLG: the **LED wall first light + NovaLCT map** is the highest-value physical task.

**Standing constraints honored:** three-brakes for anything autonomous (ships inert, arm only attended); no fake-green; every claim tagged CONFIRMED / COULD-NOT-VERIFY against real files or live checks.
