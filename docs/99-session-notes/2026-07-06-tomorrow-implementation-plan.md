# IMPLEMENT TOMORROW — prioritized plan (2026-07-06)

**Made during a read-only discovery pass while Darrell was in a staff meeting.** No code changed, nothing deployed, nothing run. Every claim below was verified against the actual repo files on `C:\Users\dpoe\Kingdom-PWA-Node` (branch `fix/the-word-points-sequential`, even with `origin/main` through #514).

**Verification legend (DR-0076, no fake-green):**
- **CONFIRMED** — read the file/line; it says what's written here.
- **COULD-NOT-VERIFY** — can't confirm from *this* machine (needs the tower, the NAS, a live mailbox, or the running cloud DB). Flagged, never painted.

---

## TOP 3 FOR TOMORROW (in order)

1. **Make the church tower build + verify this repo** — `git`, Node 24, `cd app && npm install`, create `app/.env.local` (5 VITE_ keys), `npm run build`, `npm test`. This turns "cloned repo" into "real second node." ~45–90 min. *(Section 1)*
2. **Climb the YouTube-harvest % off 22%** — run `youtube-captions.py` → `load-transcripts.py` → `harvest-from-transcripts.mjs` on the tower (it has Python + GPU for the no-caption fallback). The extractors are DONE and honest; the only missing step is *fetching the captions at scale*. ~1–2 hr first run. *(Section 2A)*
3. **Run the BG prep-email importer for real** — `import-prep.mjs` + `prep-outline.js` + `sermon_prep` (0067) all shipped (#513/#514). It has never been run against Christina's live mailbox. Seed the `content_sources` row / IMAP app-password and do one real import. ~30–60 min. *(Section 2D)*

Everything else is either already solid (SW lifecycle, monolith guard, reactions) or blocked on a value only Darrell/BG can supply (the tower's Tailscale IP).

---

## 1. Church tower as a real second build/infra node

### CURRENT STATE — CONFIRMED
- **This repo builds with plain Node tooling.** Root has **no** `package.json`; the app lives in [`app/`](../../app/) (`cd app && npm install && npm run build`, Vite 5 → `app/dist`). This machine runs **Node v24.15.0 / npm 11.12.1**. The tower is also Windows, so the build is identical — no NAS/Linux-only step in the build path. *(CONFIRMED: `app/package.json`, `README.md`.)*
- **Build needs 5 env vars**, read from `app/.env.local` (Vite exposes `VITE_`-prefixed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_YOUTUBE_API_KEY`, `VITE_SYNOLOGY_CHAT_BOT_URL`, `VITE_VERIFIED_LEDGER_URL`. `app/.env.local` is **gitignored and NOT on the tower** (`.env.local.example` is 0 bytes). Without it the Supabase client warns and data calls fail; the static build still produces. *(CONFIRMED: `grep import.meta.env`, `app/src/lib/supabase*.js:32`, `ls app/.env*`.)*
- **The tower is already named in the infra as the intended second node.** The mesh registry `church-cuda` node and the build-loop's "local-LLM judgment lane" both point at it. Registry has it as `SME-CONFIRM / online:false` — **its Tailscale IP is a blank Darrell/BG must fill.** The build-loop README names it `livestream-main-pc` / `100.72.5.90`, running Claude Code + `qwen2.5-coder:14b`, as the runner for **DIRTY (conflicting) PRs** the NAS loop refuses to touch. *(CONFIRMED: `infra/ai-orchestrator/mesh/nodes.json`, `infra/nas-build-loop/README.md` "Known follow-ups".)*
- **Deploy is NOT the tower's job.** `deploy-to-synology.ps1` uses `scp` bound to **dpoe's** SSH key → `192.168.1.26`; it won't (and shouldn't) run as user `creed`. Production deploy is **Vercel auto-deploy on push to `main`** (`app/vercel.json`: `deploymentEnabled { "*": false, "main": true }`). The tower's value is **build / test / verify / GPU work / local-LLM lane**, not deploying. *(CONFIRMED: `deploy-to-synology.ps1`, `app/vercel.json`.)*

### Two-site mesh, as actually declared (CONFIRMED `nodes.json`)
| Node | Site | Role | Status in registry |
|---|---|---|---|
| `home-ds1621xs` (192.168.1.26) | home | serve + storage + registry + CPU + build-loop heartbeat | `online:true`, verified |
| `church-cuda` (2× RTX 4070) | church | **whisper / voice-clone / 14B LLM / DIRTY-PR lane** | `online:false`, **IP = SME-CONFIRM** |
| `church-rs` (tlcrackstation) | church | media corpus (~100 TB) + LAN-probe runner host | `online:false`, firewalled |

Router is deterministic (no LLM in dispatch); private jobs (voice, whisper, registry-write) **never** fall back to a cloud vendor. Registry ships **inert** — editing it arms nothing.

### WHAT TO DO TOMORROW (on the tower, `C:\Users\creed\Kingdom-PWA-Node`)
1. **Prove the build** — `cd app; npm install; npm run build`. Fix any Windows/node-version surprises (expected: none). ~30 min incl. install.
2. **Create `app/.env.local`** with the 5 keys (Supabase cloud `mjjlevhdufpaplypnqrv` per memory; copy the values from this machine's `app/.env.local`). Re-build; confirm no Supabase warning. ~10 min.
3. **Run the test suite** — `npm test` (vitest) — so the tower is a *verification* node, not just a build box. ~10 min.
4. **Give the tower its mesh identity** — fill `church-cuda.tailscale` in `nodes.json` with the tower's real tailnet IP (this is the SME-CONFIRM blank; it unblocks whisper + voice + 14B routing). ~5 min once the IP is known. **Leave routing INERT** — don't arm.
5. **(Stretch) stand up the local-LLM DIRTY-PR lane** — the braked runner the build-loop README calls "the next build." Design its own three brakes; **ship inert, arm only attended** (CLAUDE.md autonomous-automation rule). Do NOT arm today.

**Est. effort:** steps 1–4 = ~60–90 min. Step 5 = a separate half-day, its own PR.

### COULD-NOT-VERIFY (do on the tower tomorrow)
- Whether `git`, Node, and npm are installed for user `creed` (only `dpoe`'s toolchain is visible here).
- The tower's actual Tailscale IP (registry says SME-CONFIRM; README guesses `100.72.5.90` — reconcile the two tomorrow).

---

## 2. Status sweep of the other open threads

### A. YouTube harvest extractors — CONFIRMED real, honest, and *unblocked in code*; only the fetch step is unrun
- The extractors are **pure and shipped**: `app/src/lib/video-harvest.js` (coverage math + registry) and `transcript-harvest.js` (the caption parsers). Status is **derived, never painted** — a type is `partial`/`complete` only with a recorded run or real downstream rows; an untouched type reads `none` (an honest gap). *(CONFIRMED: `video-harvest.js:1-30, 83-88`.)*
- **The "fake-green banner" concern does not apply here.** `partial` is a *designed, evidenced* status (heuristic extraction, deepenable by a later pass), not a painted-done. Searched the harvest libs and components — no fake-green; the codebase's `fake-green` mentions are all *guards against* it. *(CONFIRMED: `grep fake-green`.)*
- **The real gap:** `transcript-harvest.js` only *parses* a transcript string — it does not *fetch*. The fetch lives in `infra/nas-sme-pipeline/youtube-captions.py` → `transcripts.json` → `scripts/harvest-from-transcripts.mjs` (emits idempotent SQL) / `load-transcripts.py`. The % "stalled ~22%" because **captions were never fetched at scale** (was gated on a Whisper-GPU run that never happened; YouTube auto-captions are the unblock). *(CONFIRMED: `youtube-captions.py` header, `harvest-from-transcripts.mjs` header.)*
- **Single next step:** on the tower, `pip install youtube-transcript-api`, run `youtube-captions.py` (bounded by `--max`, resumable, idempotent, manual-run only), then `harvest-from-transcripts.mjs` to emit the SQL, apply via Studio/`db-migrate`. Watch `scripts/out/harvest-progress.jsonl` climb past 22%. The GPU Whisper fallback (for no-caption videos) is exactly why the **tower** is the right host.

### B. Monolith freeze / cutover guard — CONFIRMED green, passing, healthy headroom
- Guard is real: `scripts/monolith-budget-guard.mjs` + `scripts/monolith-budget.json`. Budget = **8489** lines, frozen 2026-06-29, "may only go DOWN." Current `app/src/poe-financial-mvp-v28.jsx` = **8434 lines** → **55 under budget**, guard passes. `--generate` refuses to *raise* the number; raising requires a hand-edit with a stated PR reason. *(CONFIRMED: `monolith-budget.json`, `wc -l` on the monolith.)*
- **Single next step:** nothing urgent. Keep extracting surfaces into their own files (Stage 2 cutover) so the number keeps dropping. No action required tomorrow.

### C. PWA service-worker update lifecycle — CONFIRMED implemented, tested, and locked
- Fully built, not a loose end: `app/src/main.jsx:153-174` registers `/sw.js` and wires `lib/sw-update.js` (14.5 KB / 318 lines) for **zero-click auto-update** — skip-waiting the new worker, reload exactly once on a real controller swap, never on first install, with an `UpdatePrompt` banner. Locked by `app/src/__tests__/sw-update.test.js`. The built `sw.js` stamps `SW_VERSION` from the deploy's git SHA so every deploy busts the cache (forward-fix from the 2026-06-03 stale-SW LESSONS-LEARNED entry). Presenter/projector/form windows opt out so an update reload never interrupts a live class. *(CONFIRMED: `main.jsx`, `app/dist/sw.js` header, `sw-update.js`, test file exists.)*
- **Single next step:** none needed. If anything, tomorrow just *observe* one real update cycle on the tower's build to confirm the banner in the wild — optional.

### D. BG-email → Word / Scripture sourcing — CONFIRMED shipped in code; never run live
- The producer chain is real and merged: `scripts/sermon-import/import-prep.mjs` (IMAP-reads BG's emailed `.docx` prep) + pure parser `app/src/lib/prep-outline.js` → upserts `sermon_prep` (migration 0067), which The Word reads as the **authoritative** seed over the rough transcript parse; also fills `choir_sermons.scripture_ref`. Deterministic, no LLM/GPU, honest (`needs_review=true`, raw_text kept). Merged as #513, sequential-numbering fix #514. *(CONFIRMED: `import-prep.mjs` header, git log #513/#514.)*
- **The gap:** it has **not been run against Christina's live mailbox** (`mrspoe06`). Source is config-driven via `content_sources` (platform `gmail-teacher`); a bundled default covers colg if the row isn't seeded. **COULD-NOT-VERIFY** whether the IMAP app-password / `content_sources` row is in place — that's a live-DB + mailbox check.
- **Single next step:** seed/confirm the `content_sources` row + IMAP app-password, run `import-prep.mjs` once, eyeball one `sermon_prep` draft in The Word.

### E. Reactions social-media key — CONFIRMED shipped as the in-app engagement primitive
- Real and merged (#512): `app/src/lib/reactions.js` (pure registry + ranking) + `reactions-sync.js` (Supabase) + `ReactionBar/ReactionIcon/ReactionKey.jsx`. **In-app reactions are the PRIMARY engagement + ranking signal**; YouTube public stats are a secondary *display*, never the source. The palette is the green-lit "Images of the Godhead" (Son/Spirit/Father groupings), each KJV-anchored (public domain, fetched verbatim), plus plain like/love/thumbs. Carries a `receptionSignal` into the qualitative feedback lane. *(CONFIRMED: `reactions.js:1-40`, component files, git log #512.)*
- **Note on "social-media key":** the "social-media style" is the *interaction model* (tap one, tap-again removes, switch replaces) — it is **in-app only**. There is **no outbound social-media posting/sharing key** here; external social stats are read-only display. If the intent is *publishing* to external social, that's net-new work, not a loose end in this primitive.
- **Single next step:** none required for the primitive itself. If external social *publishing* is wanted, scope it as a new feature (out of scope for a single day).

---

## Priority summary (ruthless, one day)

| # | Do | Why it's #-ranked | Effort | Blocker |
|---|---|---|---|---|
| 1 | Tower builds + tests this repo (`.env.local` + `npm install/build/test`) | Turns the clone into a real node; unblocks 2 & 5 | 60–90 min | tower toolchain (verify) |
| 2 | Run caption fetch → harvest climb off 22% | Highest user-visible payoff; extractors already done | 1–2 hr | needs tower Python/GPU |
| 3 | Run BG prep-email importer live | Feature shipped but never exercised | 30–60 min | IMAP pw / DB row |
| 4 | Fill tower IP in `nodes.json` (keep inert) | Unblocks whisper/voice/14B routing | 5 min | tower Tailscale IP |
| — | Monolith guard, SW lifecycle, reactions primitive | Already green/shipped — **no action** | 0 | — |
| 5 (stretch) | Stand up local-LLM DIRTY-PR lane, **inert** | The build-loop's named "next build" | half-day | its own PR + attended arming |

**Standing constraints honored:** three-brakes for anything autonomous (ships inert, arm only attended, never while traveling); no fake-green; verify against real files/live system before trusting.
