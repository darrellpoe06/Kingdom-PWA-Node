# PoeTech App — Grounded Build Status Report

- **Date:** 2026-06-29 (audit run; some lanes timestamped 2026-06-30 UTC)
- **Author:** Claude (advisory; Darrell governs)
- **Method:** GROUNDED ONLY. `git fetch --all` run first (this repo has heavy concurrent merges). Every claim below is tagged **CONFIRMED** (verified against git / CI / config), **IN-FLIGHT** (work observed but not landed), or **NOT-VERIFIED** (could not independently confirm). No fake-green. Governed by DR-0076 (verification doctrine) — claims carry evidence (SHA / PR# / file:line / measured count).
- **Audit base:** `origin/main` HEAD = **`77f81c5`** (fetched fresh). Local working branch is `docs/sovereign-mesh-two-nas @ f7ec175` — NOT main; all numbers below are read from `origin/main`, not the working tree.

---

## 0. TL;DR

The app is **healthy and serving the latest merge** — footer `BUILD 77F81C5 · LATEST` matches `origin/main` HEAD exactly, so there is **no merged≠served gap right now**. Production is **still on Vercel**; the Cloudflare Pages cutover is built + proven but **gated OFF** (not flipped). The big structural event of the session landed: the **monolith is now frozen** by a CI line-budget ratchet (#416) and the modular cutover frame is set (#420) — but **zero lines have been extracted on main yet** (monolith is sitting exactly at its 9,572 ceiling). The first extraction is **in-flight, uncommitted** (PwaPrompts, 9,572 → 9,424 in a lane worktree). A full day of church-infrastructure work merged cleanly. Largest open item needing Darrell: **apply the church-infra program seed SQL to the COLG Supabase instance** (it will not render in-app until applied).

---

## 1. What's Serving

| Item | Value | Status |
|---|---|---|
| **Live build footer** | `BUILD 77F81C5 · LATEST` | **CONFIRMED** matches `origin/main` HEAD `77f81c5` |
| **`origin/main` HEAD** | `77f81c5` — `docs(modular): strategic frame … (#420)` | **CONFIRMED** (`git rev-parse origin/main`) |
| **Merged ≠ served gap** | None | **CONFIRMED** — footer SHA == main HEAD; `· LATEST` = `<FreshnessDot>` comparing running SHA to main ([poe-financial-mvp-v28.jsx:5291](app/src/poe-financial-mvp-v28.jsx#L5291)) |
| **Host (production)** | **Vercel** | **CONFIRMED** — [app/vercel.json](app/vercel.json) `git.deploymentEnabled { "*": false, "main": true }`; latest CI `pages-build-deployment` = success on `77f81c5` |
| **Cloudflare cutover** | Built + proven, **gated OFF (not flipped)** | **CONFIRMED** — `deploy-cloudflare-pages.yml` runs are **`skipped`** on every push (gated by unset `vars.CF_PAGES_ENABLED`); plan: [2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md](docs/99-session-notes/2026-06-16-cutover-plan-vercel-to-cloudflare-pages.md) |
| **CI on HEAD** | Green | **CONFIRMED** — `gh run list --branch main`: `pages-build-deployment` + `Auto-merge` = `success` on `77f81c5` |

**Note (CONFIRMED):** the Cloudflare path is real and waiting — `app/functions/n8n/[[path]].js`, `app/public/_redirects`, and the gated deploy workflow all exist on main. The flip is a Darrell bright-line action (Cloudflare account + API token + DNS). Until then, Vercel serves and the same-origin `/n8n` rewrite goes through Vercel.

---

## 2. Monolith + Modular Cutover

| Metric | Value | Status |
|---|---|---|
| **Monolith line count (`origin/main`)** | **9,572** lines | **CONFIRMED** — `git show origin/main:app/src/poe-financial-mvp-v28.jsx \| wc -l` |
| **Freeze budget** | **9,572**, `frozen: 2026-06-29` | **CONFIRMED** — [scripts/monolith-budget.json](scripts/monolith-budget.json) |
| **Monolith vs budget** | **At the ceiling** (9,572 == 9,572) | **CONFIRMED** — guard PASSES, but 0 headroom; any net-add to the shell now hard-fails CI |
| **Freeze-guard live in CI** | Yes, required | **CONFIRMED** — [.github/workflows/ci.yml:65](.github/workflows/ci.yml#L65) runs `node ../scripts/monolith-budget-guard.mjs`; ratchet refuses to raise via `--generate` |
| **Modules extracted (landed on main)** | **0** | **CONFIRMED** — line count has not fallen below the freeze; no extraction PR merged yet |
| **First extraction** | **IN-FLIGHT, uncommitted** | **IN-FLIGHT** — lane worktree `kpn-wt-extract` (`lane/monolith-extract-19cbaddd`): monolith **9,572 → 9,424 (−148)**, new `components/PwaPrompts.jsx` + `__tests__/pwa-prompts-render.test.jsx` untracked |
| **Strategic frame** | Two coupled levers (compute substrate + app architecture) | **CONFIRMED** merged — PR [#420](https://github.com/anthropics/apps/pull/420) `77f81c5`, merged 2026-06-30T01:07Z |
| **Forcing-function origin** | Shell grew 8,769 (post-#335, 2026-06-25) → 9,572 in 4 days with no brake | **CONFIRMED** — documented in guard header + `baseline_reason` in budget.json |

**Honest read:** the *scaffolding* for the cutover is done and enforced (freeze + ratchet + boundary guard + surface registry), but the *peeling* has not started on main. The freeze just stops the bleeding; the line count only goes down once the in-flight extraction lane lands its first PR. **Do not report the monolith as "shrinking" yet — it is frozen at peak, with the first −148 still uncommitted in a worktree.**

---

## 3. Major Surfaces / Modules

Registry: [app/src/surfaces.js](app/src/surfaces.js) — **35 registered surfaces**. CI runs `npm run build` (Rollup), which **hard-fails on any missing export**, so every registered surface at minimum *resolves and builds*. State below distinguishes "builds + known-working" from "present but stub/pending hardware."

| Surface | Component | State |
|---|---|---|
| **Create** | `CreationWorkspace.jsx` | **CONFIRMED present** on main (registry + builds); compose-a-doc → export image |
| **Voice** | `VoiceStudio.jsx` | **CONFIRMED present**; free System voice working — **cloned timbre PENDING GPU voice service** (honest stand-in, never reported as real clone) |
| **Library** | `Library.jsx` | **CONFIRMED present** (reader any-signed-in; Studio family/governor) |
| **Chef's Corner** | `ChefCorner.jsx` | **CONFIRMED** working (recipes, scaler, metric units, on-device OCR — PRs #376–#378) |
| **Games — Generations** | `Games.jsx` | **CONFIRMED live** (PR #392, `0776071`); shared engine, 8 Yahweh-perspective axes, verbatim-KJV lens |
| **Study** | `Study.jsx` | **CONFIRMED present** (gated `isStudyCircle`); Study Edition + connections |
| **Church (12 sub-tabs)** | Engagement/Choir/Program/Pulpit/Scripture/**VideoWall**/**Devices**/Harvest/Observation/Learn/Conference/Events | **CONFIRMED present**; VideoWall + Devices are this session's adds (see §4) |
| **Practice / TLC** | `Practice.jsx` | **CONFIRMED present** (tier-gated); client-growth workflow + CEU tracker |
| **CRM** | `CRM.jsx` | **CONFIRMED present** (family/governor); federates `practice_leads` (PR #342 merged) |
| **Rentals** | `Rentals.jsx` | **CONFIRMED present**; multi-tenant work IN-FLIGHT (see §5) |
| **Conference** | `ConferenceModule.jsx` + Variance + Event Center | **CONFIRMED present** |
| **Learn (Church)** | `ChurchLearn.jsx` | **CONFIRMED present**; new Data Systems & Infrastructure course (PR #410) |
| **Forecast / Inventory / Access / Relationships / Command&Serve / Markets / Notes / Opportunities** | resp. components | **CONFIRMED present** in registry + build |
| **Books (Transactions / Subscriptions / 1099)** | `BooksTransactions.jsx` etc. | **CONFIRMED present** |

**NOT-VERIFIED at runtime:** this section confirms surfaces *exist and build* (registry + green Rollup gate). It does **not** claim each was click-tested in the live app this session — I did not drive the browser. Build-resolves ≠ behavior-verified for surfaces not exercised by their vitest render tests (233 test files on main).

---

## 4. Today's Landings (Merged to main — CONFIRMED)

All verified present in `git log origin/main`:

| PR | SHA | What landed |
|---|---|---|
| [#411](https://github.com/anthropics/apps/pull/411) | `18b06a2` | In-app Church Infrastructure Program — 7 milestones as role-scoped Projects records |
| [#414](https://github.com/anthropics/apps/pull/414) | `e7e6d7a` | Correct program seed vs true main (link landed docs, real staff course) |
| [#417](https://github.com/anthropics/apps/pull/417) | **`ab9c4df`** | Link the now-landed artifacts for items 1, 3, 4 (#407/#413) |
| [#407](https://github.com/anthropics/apps/pull/407) | `e116b82` | COLG LED video-wall confirmed-spec install + power + data runbook |
| [#418](https://github.com/anthropics/apps/pull/418) | `9392af7` | Precise NovaStar role + LED-output, cabling planes, placement, feed |
| [#412](https://github.com/anthropics/apps/pull/412) | `42a641d` | Correct Learn LED-wall module to confirmed install spec |
| [#413](https://github.com/anthropics/apps/pull/413) | `545b3ca` | Church device inventory asset register + inert idle-GPU scheduler |
| [#409](https://github.com/anthropics/apps/pull/409) | `026d848` | Re-scope church compute to two towers beside NovaStar (specs SME/TBD) |
| [#410](https://github.com/anthropics/apps/pull/410) | `c94cec8` | PoeTech Data Systems & Infrastructure staff/volunteer course |
| [#415](https://github.com/anthropics/apps/pull/415) | `4f4652c` | PROPOSED DR-0082 — live-production switcher (ATEM cuts over SDI, OBS graphics+stream over NDI) |
| [#416](https://github.com/anthropics/apps/pull/416) | `16598de` | **Monolith line-budget freeze ratchet** (the forcing function) |
| [#420](https://github.com/anthropics/apps/pull/420) | `77f81c5` | Modular strategic frame — two coupled levers |
| [#419](https://github.com/anthropics/apps/pull/419) | `7082f84` | On-church-network agent runner — Stage 0 RDP + inert LAN probe |
| [#406](https://github.com/anthropics/apps/pull/406) | `e2fac61` | Sovereign mesh (two-NAS) research-review |
| [#342](https://github.com/anthropics/apps/pull/342) | `1f044cb` | Federate live `practice_leads` onto unified CRM board (no fork) |

Supporting artifacts on main (**CONFIRMED** present): `infra/seed-data/2026-06-29-colg-church-infrastructure-program.{json,sql}`, `infra/supabase/migrations-auto/0056-church-device-inventory.sql`, `app/src/__tests__/church-infra-program-seed.test.js`.

---

## 5. In-Flight Lanes (right now)

| Lane | Evidence | Will land | Status |
|---|---|---|---|
| **Monolith extraction** | worktree `kpn-wt-extract` / `lane/monolith-extract-19cbaddd`; monolith **9,572 → 9,424**, `PwaPrompts.jsx` + render test untracked | First extraction PR: peel PWA-prompt UI out of the shell, re-freeze budget down to ~9,424 | **IN-FLIGHT, uncommitted** — CONFIRMED via worktree diff |
| **Generations multiplayer (game QR)** | branch `feat/generations-multiplayer` @ 2026-06-30, at `77f81c5` (worktree `kpn-wt-gen-mp` currently clean) | Multiplayer / QR-join for the Generations game | **NOT-VERIFIED** — branch exists but no diff observed in its worktree at audit time |
| **Rentals** | `feat/rentals-table-sync` is **484 behind / 0 ahead** of main (stale); `feat/rentals-multi-tenant-doors` also behind | Rentals table sync / multi-tenant doors | **NOT-VERIFIED** — observed branches are stale, not actively ahead; active work (if any) is in a worktree I could not map |

**Honest caveat on lane IDs:** the FleetView lane identifiers in the request (`local_48e51cad`, `local_b6605ae6`, `local_bba7aba4`) are internal session IDs I cannot deterministically map to git branches from here. I mapped the **extraction** lane with hard evidence (uncommitted PwaPrompts diff). For the **game-QR** and **rentals** lanes I could only find branches that are clean or stale — so I am marking them **NOT-VERIFIED** rather than asserting progress I did not see.

---

## 6. Known Open / Needs-Darrell

1. **Apply church-infra program seed SQL to COLG Supabase** — `infra/seed-data/2026-06-29-colg-church-infrastructure-program.sql`. **The 7-milestone program will not render in the live COLG instance until applied** (Studio one-time apply). *(Reality-trace, P15: surface exists; its real data is not in the cloud yet.)* — **OPEN, Darrell's hand.**
2. **Apply migration `0056-church-device-inventory.sql`** (+ 0055 family) to the cloud so Church › Devices register is backed by real rows. — **OPEN.**
3. **Flip the Cloudflare cutover** — create CF Pages project `poetech-app`, set `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` + 6 `VITE_` vars + `CF_PAGES_ENABLED`, then DNS. Kills the Vercel preview-cap risk for good. — **OPEN, Darrell bright-line (credentials + DNS).**
4. **Church compute towers — final build steps** — two towers beside the NovaStar; **6 `[NEEDS SPEC]` values pending** (GPU/CPU/RAM — SME, not assumed). Physical install runbook merged; arming is Darrell's hand. — **OPEN, SME-pending.**
5. **`MEMORY.md` over size limit** — **52.8 KB vs 24.4 KB cap**; only part loaded this session. Index entries are too long — consolidate (move detail into topic files, one-line index). — **OPEN, housekeeping.** *(Consider `/consolidate-memory`.)*
6. **SME-pending specs** broadly — church GPU/CPU/RAM, COLG IPs (reported `unknown`, never fabricated), CEU IL ruleset (`confirmed:false` pending Christina LCSW), Generations framing (Bishop SME).

---

## 7. Honest Risks / Not-Done

- **Monolith at peak, not shrinking yet.** 9,572 lines == budget ceiling. The freeze stops growth but the cutover delivers value only when extraction PRs land. First one is uncommitted. **Risk:** lane stalls → freeze holds the line but the shell stays a 9.5k-line monolith. Drive the extraction lane to a merged PR.
- **Merged ≠ served is clean *today*, but Vercel cap is a standing risk.** The whole Cloudflare cutover exists because the Vercel 100/day preview cap blew before (per-branch preview fan-out across ~7 worktrees). `vercel.json` now disables non-main previews, which mitigates it, but until the flip, a deploy-cap event could still cause merged≠served drift on a busy day.
- **In-app surfaces vs cloud data gap.** Church Infrastructure Program, Devices register, and idle-GPU scheduler are **shipped INERT / un-backed** until the seed SQL + migration 0056 are applied to COLG. Surface exists; real data does not yet (P15 gap = the work).
- **GPU-gated features are build-targets, not claims.** Voice clone timbre, whisper-GPU harvest, idle-GPU dispatch, and ad-lib audio-ML are all clearly gated on hardware the church doesn't have armed yet. They are honest stubs (dispatch stubs, "do-not-arm"), **not** working pipelines — correctly labeled in-code, but **not done**.
- **Surface runtime-verification not performed this session.** §3 confirms build-resolves + registry, not live click-through. 233 vitest files give render-level coverage; full behavioral verification of every tab in the signed-in live app was **not** done in this audit.
- **Autonomous automation stays inert.** Per the three-brakes rule, NAS loop runner / scheduler / mesh ship INERT; nothing self-arms. This is correct, but it means several "capabilities" are plans behind brakes, not running systems.

---

### Verification provenance
`git fetch --all` → `origin/main` = `77f81c5`. Numbers from `git show origin/main:<file>`, `gh run list`, `gh pr view`, and direct worktree `git status`. Where I could not confirm (game-QR / rentals lanes, runtime surface behavior, the live Vercel-served bytes beyond the footer match), I marked **NOT-VERIFIED** rather than assert. No claim in this report rests on memory alone.
