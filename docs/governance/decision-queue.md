# Governance Decision Queue

**What this is.** The live, repo-side queue of decisions waiting on Darrell's governance. It is the running companion to [`pre-authorized-policies.yaml`](pre-authorized-policies.yaml): that file is the *standing rules* (what executes without asking, what's a bright line, what escalates); **this file is the actual list of escalations currently waiting on you.**

**Why it exists.** Darrell asked (2026-06-13): *"What do you need from me to continue to work until you're offline and for the n8n NAS to continue to work, without my inputs and a queue of needs when I get to my inbox for governance decision-making?"* The escalation machinery in the policy file routes to NAS-resident ntfy queues — but that NAS-apply step isn't live yet (see the governance `README.md`). Until it is, **this markdown is your inbox.** It's reviewable from GitHub on your phone, every session appends to it, and future sessions inherit it.

**How you use it — batch governance, not one ping at a time:**
1. Open this file. Each OPEN item names what it unblocks, the decision, the options, my recommendation, and who governs it.
2. Write your call inline on the item: `DECIDED: <option> — <any note>`. One word is enough.
3. The next session (me or another) executes the whole batch of decided items, ships them, and moves them to DECIDED HISTORY at the bottom.

**Authority.** Junior to the bright lines in `pre-authorized-policies.yaml` and `CLAUDE.md`; those are never auto-promoted regardless of what gets decided here.

---

## What keeps running while you're away (honest)

**Runs without you — already:**
- Event-driven n8n workflows that fire on a real event (a maintenance request, an inquiry, a form submit). These already serve; they need no clock and no input from you.
- The daily digests (wf31 morning, wf32 ship summary) — operational.
- Vercel production deploys on every merge to `main`.
- My repo/app work inside the standing authorizations below — build, test, migrate (auto-applies on merge), PR, and **merge green** (DR-0064).

**Does NOT run without you — by design (CLAUDE.md, post-2026-06-06-runaway):**
- Any new autonomous, timer-driven, or self-triggering compute — the orchestrator brain, bot-teams, the autonomous builder, cron loops. These never self-activate unattended, never while you travel, and require all three brakes (budget / concurrency lock / kill-switch) **plus a human watching** to turn on.
- Anything on the NAS itself. **This cloud session cannot reach your LAN** (egress allowlist blocks the Tailscale Funnel), so all NAS work — applying the governance point, activating workflows, the Code-node HTTP sweep — runs through the **local agent** at home, not me.

So "the NAS keeps working without your inputs" is true for the event-driven layer that's already live, and deliberately *not* true for new autonomous compute. That line is the lesson from the runaway, held on purpose.

---

## What I need from you to keep working

1. **A prioritized backlog** — when you're not here to hand me the next thing, point me at a domain or drop build priorities so I work ahead instead of stalling. (You can now reprioritize *projects* in-app; this is for app-*build* priorities.)
2. **Decisions on the OPEN items below** — each one unblocks real work.
3. **Credentials (bright-line `credential_vault` — only you can):** see OPEN-5.
4. **The NAS-apply** (local-agent track) — see OPEN-4. I'll always hand you a self-contained PowerShell block for these.

---

## Standing authorizations (what I do WITHOUT asking)

Derived from DR-0064, `RELEASE-TIERS.md`, and the Tier-1 fix classes in the policy file:

- **Tier A** — bug fixes, copy/typo, docs, decision records, tests, memory updates → build + merge green.
- **Tier B** — additive features that are reality-traced, tested, and a direct continuation of approved intent → build + merge green (the Vercel preview is the soak); I report the outcome.
- **Always:** reality-trace before any surface; surface premise conflicts before acting; never paint static data as real.

**Never without you (bright lines + Tier C):** money movement, credentials, TLC/PHI, minor data, the family's theological voice, irreversible OS actions, new workflow activation, and anything Tier C or that ships active autonomous compute.

---

## OPEN — waiting on your call

### OPEN-1 · Activate the local-AI / orchestrator brain (the "AI pushes back on order")
- **Unblocks:** the local-model authoring + head-to-head-vs-vendor + decision-history loop (DR-0056 / DR-0062 / DR-0063) — i.e. the AI half of project prioritization, and the 90/10 you want.
- **Needs:** (a) the local GPU runner stood up at home (your infra values, DR-0053); (b) a Gemini API key for the vendor side; (c) your greenlight for **v0 = advisory only** (proposes, spends nothing unattended, you approve).
- **Track:** local agent (I can't reach the NAS). **Tier C** — ships inactive, turned on only attended.
- **My recommendation:** approve v0-advisory once the runner is up; it's the safest rung and proves the loop with zero unattended spend.
- `DECISION:` _____

### OPEN-2 · Personal project assignment (assign a project to Christina → her own list)
- **Unblocks:** true per-person assignment (today's per-user split is by who *created* a project; this adds "assigned to you").
- **The fork:** is a personal project **private** (only the assignee sees it, DB-enforced) or **shared-but-filtered** (the whole family can see it; each person just gets their own "Mine" view)?
- **My recommendation:** shared-but-filtered — it matches your words ("the whole family's projects can be in the same place"), and truly-private can be a later opt-in. Small migration, Tier B.
- `DECISION:` _____

### OPEN-3 · Wire the `cycle_items` AI-ranking engine
- **Unblocks:** the real home for the local model's *proposed* order (vs. your hand-set `priority_rank`, already live).
- **The fork:** wire the skeleton now (it sits empty until the local brain produces rankings) or wait and wire it *with* the producer?
- **My recommendation:** wait — an empty engine is low value and reads as painted. Wire it alongside OPEN-1 so it's never empty.
- `DECISION:` _____

### OPEN-7 · Append-only table retention (review finding A7) — destructive, needs your call
- **Unblocks:** bounded growth on the append-only tables (`transactions`, `feedback`, `audit_log`, `interactions`, `user_telemetry`; `confessions`/`disclaimers` even declare `expires_at` with nothing enforcing it). Today they grow forever and the full-refetch reads them all.
- **Why it's escalated, not auto-done:** retention = **deleting the family's data on a schedule**. That collides with DATA-AS-EMPOWERMENT (the family owns their data; deletion must be consented + verifiable) and QUALITY-OF-LIFE. The agent will not auto-delete records. The indexes (A6, [PR #115](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/115)) already make the reads fast, so this is growth-hygiene, not a performance crisis.
- **The fork:** (a) **enforce only the declared `expires_at`** (confessions/disclaimers already opted into expiry — honor it, delete nothing that didn't opt in); or (b) **add retention windows** to the telemetry/audit/feedback tables (e.g. keep N months, archive older); or (c) **archive-not-delete** (move old rows to a cold table, never destroy).
- **My recommendation:** (a) now (it's honoring an existing consent), defer (b)/(c) until you set windows. Implemented as a pg_cron sweep via the migration lane once you pick — Tier B for (a), Tier C for any real deletion of non-expiring data.
- `DECISION:` _____

### OPEN-5 · Credentials I need (bright-line — only you)
- **`ANTHROPIC_API_KEY`** → turns on the read-only Synthesizer (DR-0055).
- **Gemini API key** → the vendor side of the head-to-head (DR-0063) + the `fresh_knowledge` route.
- **Gmail reconnect** → the banking-on-autopilot lane has an expired Gmail credential silently failing; one reconnect heals it.
- `DECISION:` _____ (which, if any, to provision now)

---

## BUILD BACKLOG — what I'll work down on my own

Darrell (2026-06-13): *"What would you like in the build backlog is whatever makes sense, we'll adjust from there."* — all **in-app**, on **real data** (DR-0065 / DR-0061), ship green (DR-0064).

**Cleared 2026-06-13 (local agent) — all five shipped to main.** #1 assignment (PR #82), #2 next-step/blocker (PR #89), #3 reorder-with-filters (PR #91), #4 decisions-count on the Build board (PR #92), #5 recently-shipped strip (PR #93). Details in DECIDED HISTORY below.

**Cleared 2026-06-14 (local agent) — rigorous-review app backlog, all via the release lane.** A2 ([PR #112](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/112)), A3 ([PR #113](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/113)), A4+A5 ([PR #114](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/114)), A6 ([PR #115](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/115)), A1 ([PR #116](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/116)), plus engagement schema into the migration lane ([PR #117](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/117)). Every fix has a regression test; migrations 0007/0008/0009/0010 applied (db-migrate logs verified). Details in `docs/99-session-notes/2026-06-13-rigorous-review-findings.md` §5. A7 (retention) escalated to OPEN-7 above (destructive — needs your call). The n8n workflow layer (W1–W7, incl. wf27 auto-wake) stays held per R8/R13 + three-brakes.

*Awaiting your next priorities — drop a domain or items here and I'll work down the new list top-first.*

---

## LANE COORDINATION (informational — not awaiting a decision)

For sibling lanes so the capstone doesn't collide. No call needed from you.

- **2026-06-17 · Command, Control & Serve Center (C2S) seat landed as a composing shell — `feat/command-serve-center`.** The unifying capstone: ONE top-level steward seat (nav id `center`, family/Governor-gated, no-leak) that COMPOSES the real on-main surfaces under four faculties — **See** (OpsBoard · QualityProof · KpiLegend), **Command** (WakeOrchestrator · ConflictLoop), **Control** (links to the live Projects/Build), **Serve** (servant-king framing + role scope). New files only: `CommandServeCenter.jsx`, `lib/command-serve-center.js`, its test; **4 surgical monolith lines** (import + VALID + gated nav tuple + render). **Did NOT touch `BuildBoard.jsx` or any projects-mgmt file** — collision-free by construction. Braked: the seat is the READ/DECIDE/HAND-OFF loop only; autonomous execution stays behind the Cage (WakeOrchestrator engine, inert). Gates green: build · lint · 1052 tests (incl. proven-to-catch no-fake-green + brake assertions) · feedback-area guard · contrast guard. No-leak path live-verified (non-steward sees only the locked seat; zero orchestrator/ops leak).
  - **Sequenced follow-ups (NOT done now, to avoid colliding with active lanes):** (a) the **CONTROL cockpit** (priorities + discussions, `feat/projects-management-discussions` lane) composes INTO the seat when it lands — the seat links to live Projects until then; (b) **de-dup**: the Governor-internal block in `BuildBoard.jsx` (OpsBoard/QualityProof/ConflictLoop/WakeOrchestrator) is duplicated in the seat for one cycle — fold it out of BuildBoard once the projects-mgmt + drive-to-completion lanes settle, so it lives in the seat only.
  - **Heads-up for whoever owns it:** PR #212 (`feat/wake-orchestrator-cockpit`) is a stale duplicate — its content already merged as #213 (`c50b895`). Safe to close.

- **2026-06-17 · Dark-mode contrast bug fixed + the blind spot that hid it closed — `fix/dark-mode-text-contrast` (PR #257).** Reported bug: BLACK/dark text on the DARK (midnight) background in cockpit surfaces — unreadable. Root cause: `CommandServeCenter.jsx` and `BuildBoard.jsx` set accent text via **inline** `style={{ color: '#…' }}`, which bypasses the per-`[data-theme]` remap, so midnight flips the surface dark while the inline text stays dark; the blue accent `#2A5A8E` also had **no midnight remap** at all (2.84:1 on black). The AA contrast guard never caught it because it only checked body-text tokens, never accents, and never inline colors. **Fix (Tier A, ships fast):** (1) converted every inline accent color in the two files to themeable `text-/bg-/border-[#…]` classes; (2) added the missing midnight remaps (`#2A5A8E`→`#7FB3F0`, `#5A5751` fill/border); (3) **extended `contrast-guard.mjs`** to check accents PER-THEME including midnight (proven-to-catch: it now flags a missing blue remap at 2.84:1) and added an **inline-color scanner** (guarded cockpit files hard-fail on any inline color; other component files WARN). 15/15 guard tests green; verified AA in BOTH light and midnight.
  - **CONCERN (deferred, dated — DR-0075 perpetual-improvement):** the brand rust `#B85838` as text on the light **cream base** bg is ~4.2–4.4:1 (sub-AA) in every light theme + the default; it passes on the white **card** (4.68:1). `#B85838` is a shared brand token used app-wide, so darkening it is a cross-cutting visual change out of scope for the dark-mode fix. The guard surfaces this as an explicit, allowlisted WARNING (`CONTRAST_ALLOWLIST`) rather than failing the build. **`re-review: 2026-08-01`** — decide then: darken the rust token, or only ever place rust text on the white card.
  - **Follow-up (tracked, not silent):** the inline-color scanner currently WARNS (does not fail) on `Imported.jsx` (2) and `TeachMode.jsx` (12), which still carry literal-hex inline colors; dynamic inline colors (ternary/function) in `Projects.jsx`/`Discussions.jsx` are not statically caught. Promote each to the guarded set as its owning lane settles. **`re-review: 2026-07-15`.**

- **2026-06-17 · Dark-mode contrast — consolidated fix + the Tailwind-class blind spot closed — `fix/dark-mode-contrast` (PR #TBD).** PR #257 fixed INLINE colors in two cockpit files, but Darrell kept catching illegible text by eye — meaning the guard still had blind spots. Found the real systemic class: components set color via **Tailwind hex classes** (`text-[#7A1F1F]`, `bg-[#F2F4EC]`), and midnight only remapped a handful of them. Body text flips light under midnight, so every NON-remapped token broke in one of two directions — **dark-on-dark** (15 dark TEXT tokens with no remap: `#7A1F1F` error text 32×, `#991B1B` 12×, greens/ambers/blue/purple) and **light-on-light** (13 near-white BG tint bands with no remap: the Eternal Algorithms **OUTCOME band** `#F2F4EC`, `#FCFBF8` pairing cell, warning/success tints). The guard never saw any of it because it checked only the 6 palette text tokens against 3 fixed surfaces — never the actual class usage. **Fix (Tier A):** (1) added midnight remaps for **all 28** used semantic tokens — every TEXT token → BRIGHT (≥9.7:1 on the `#141414` card), every tint BG → DARK (light text ≥13:1, secondary `#888888` ≥4.68:1), measured not claimed; (2) **extended `contrast-guard.mjs`** with a midnight **token-coverage** check that scans the live monolith + every component for used `bg-[#…]`/`text-[#…]` classes and FAILS the build if any renders dark-on-dark or light-on-light in midnight — both directions, the exact blind spot. Proven-to-catch: tests inject a non-remapped dark text token AND a near-white bg and confirm each is flagged; accent ACTION backgrounds (`#5A6E3D`/`#B85838`/`#2A5A8E`, bright-on-purpose with flipped text) are allowlisted so they don't false-positive. 22/22 guard tests + 1215/1215 suite green. The fix is theme-system-consistent (registers each color in the existing `[data-theme]` remap table — no component layout touched, global text-size respected). The `#B85838` rust-on-cream sub-AA warning (re-review 2026-08-01) and the inline-scanner promotion follow-up (re-review 2026-07-15) from PR #257 are unchanged and still tracked above.

- **2026-06-17 · Books → Imported 502 fixed: routed DIRECT to the Funnel — `fix/imported-direct-funnel` (PR #265).** Root cause (diagnosed + verified a prior session): the app called n8n through the Vercel rewrite `/n8n/* → https://poetech.tail5a2f35.ts.net` (Tailscale Funnel), and **Vercel's edge router cannot complete the TLS handshake to *.ts.net Funnel targets** (`ROUTER_EXTERNAL_TARGET_HANDSHAKE_ERROR` → HTTP 502) — it 502'd before ever reaching n8n. Verified working paths: external client → public Funnel +bearer → 200 with real data (2020 bank / 1878 gmail); the Funnel emits correct CORS for poetech.us (OPTIONS preflight 204, GET `Access-Control-Allow-Origin`). **Fix (Tier A):** `app/src/lib/n8n-base.js` default `N8N_BASE` changed from the relative `/n8n` to the absolute Funnel `https://poetech.tail5a2f35.ts.net` (the `VITE_N8N_WEBHOOK_BASE` env override is preserved). The browser now calls the Funnel directly; only the Vercel rewrite hop was broken. Re-verified the exact target the app will use: `GET https://poetech.tail5a2f35.ts.net/webhook/imported-transactions?limit=3` +bearer → **200**. Build green; 1215/1215 tests green.
  - **CONCERN (a) — get-off-Vercel data point (DR-0075):** Imported is now routed direct to the Funnel because the Vercel rewrite can't reach *.ts.net. **Watch multi-device load in case the Funnel throttles** under family-wide concurrent browser fetches (the original 2026-06-01 symptom was Funnel cross-origin throttling — this trades the Vercel-handshake break for that risk; CORS now verified clean, but concurrency is not yet load-tested). **Revert path documented in the file header**: restore the `/n8n` default (and the `vercel.json` rewrite). Another concrete data point for the standing "get off Vercel → Cloudflare Pages" cutover (the `/n8n` proxy moves to a Pages Function, which CAN reach the Funnel). `re-review: 2026-07-15` (or sooner if a throttle symptom appears).
  - **CONCERN (b) — separate NON-502 bug to LOG, not fixed here:** Books → reconcile shows **verified: 0 / unexplained: 1923** — the cross-verify is not matching any rows. Distinct from the 502 (the data now loads; the matcher just isn't pairing it). Logged for a dedicated session; **do not fix in this PR.**
  - **Scope note — premise conflict surfaced + resolved (feedback-surface-premise-conflicts):** the task asked to point "every consumer of the n8n base" at the Funnel, but `lib/class-tutor.js` shares `N8N_BASE` AND carries a binding Charter sovereignty gate (`class-tutor.test.js`, DR-0076) that REQUIRES a same-origin RELATIVE path and FORBIDS an absolute Funnel/vendor URL in the client bundle. Routing the tutor to the Funnel would have broken that gate. Resolution: the finance/imported/wake surfaces move to the Funnel (the fix); **class-tutor pins its own `/n8n` base** so its sovereignty gate stays green and its behavior is unchanged (no regression). The tutor's NAS reachability via the broken `/n8n` rewrite is a pre-existing, separate open item — it needs a real sovereign subdomain (post-vacation Caddy/Let's-Encrypt) or a Charter decision, not a Funnel-URL leak. Not fixed here.

- **2026-06-17 · Real Estate "11 Doors" header + portfolio rollup were STATIC → now DERIVED — `feat/realestate-dynamic-doors-rollup` (PR #TBD).** Reported by Darrell: the Real Estate header read a hardcoded literal **"11 Doors · Steward Real Estate LLC"** while the rollup below (MORTGAGE DEBT / MONTHLY P&I / MONTHLY RENT / RENT GAP) showed $0 — a painted surface, not a live view of the property records (DR-0061/DR-0076). **What was static:** the door count `11`, the entity name, the `.slice(0, 11)` balance-list cap, and the "all 11 doors pay off" feasibility line; the four rollup cells read a parent `totals` object that did not track the rendered rentals (could show $0). **Fix (Tier A/B, additive):** new pure helper `app/src/lib/rental-portfolio.js` (`derivePortfolio`) is the single source of truth — door count = **sum of `units` across the rental portfolio** (non-personal, entity-owned; `units` defaults to 1, a fourplex = 4), entity label resolved from the owning entity (neutral "Real Estate Portfolio" when mixed/none), and the rollup **sums only figures actually present**, flagging properties that need a mortgage/rent figure rather than zeroing the whole portfolio. Added an **editable Doors/units field** to the property form (default 1). Properties + Income-Producing counts were already derived (`.length`); the Income-Producing sub-header now also shows the door total when it differs from the property count. **Verified:** measured `derivePortfolio` against the verbatim seed → reproduces **"11 Doors · Steward Real Estate LLC"** with a real rollup ($921k debt / $5,819 P&I / $11,700 rent / $850 gap / 93% collected). Proven-to-catch test `rental-portfolio.test.js` asserts numbers that MOVE with the data (a regression to a static literal fails the gate). Lint + 1220/1220 tests green.
  - **CONCERN (none deferred):** every targeted literal is now derived; no rough edge parked. The seed models each door as its own row, so for the sample door count == property count (11) — honest given the data; the new `units` field makes multi-door-per-property real and editable going forward.

- **2026-06-25 · Chef's Corner recipe page was black-on-black in dark mode → fixed with shared theme tokens + a NEW inline-style guard — `fix/dark-mode-contrast` (PR #TBD).** Reported live by Darrell (screenshot): the recipe detail page — title, ingredients, step numbers + text, section headers, Storage/Reheating — rendered dark-gray-on-black under the default **midnight** theme, near-invisible; only the Text-size control and the cream Chef's-Note box were legible. **Root cause:** `ChefCorner.jsx` (shipped 2026-06-24, PRs #376–#378) set EVERY color via **inline** `style={{ color: '#1A1815' }}` through local hex consts (`INK`/`MUTE`/`ACCENT`/`CREAM`). Inline styles WIN over the per-`[data-theme]` remap — so midnight flipped the cards dark (`bg-white`→`#141414` via class) while the inline text stayed near-black. The cream boxes survived only because their bg was ALSO inline (light-on-light). The existing per-theme `contrast-guard` never caught it because it verifies the theme TOKEN CLASSES and is structurally blind to inline hex. **Fix (Tier A, auto-merge on green):** (1) converted the whole component to the shared, theme-remapped Tailwind classes (`text-[#1A1815]` → `#E5E5E5` on midnight, `#5A5751`→`#888888`, `#B85838`→`#FB923C`, `bg-white`→`#141414`, etc.) — no one-off colors, no inline color; (2) added a NEW **`scripts/inline-style-color-guard.mjs`** that flags theme-bypassing inline color props (hex literal OR color const) and **fails the build** for a CLEAN_FILES allowlist (`ChefCorner.jsx` is the first member) — proven-to-catch (8 tests incl. catches hex, catches the INK/MUTE const pattern, ignores comments + `transparent`/`currentColor`); wired into the required `app — lint + vitest` check. **Verified LIVE on the running app in midnight** (not claimed): all three recipes readable — title 14.6:1, ingredient/step text 14.6:1, accents (CHEF MARIO, step numbers) 8.1:1, tags 5.9:1 — every node ≥ AA; zero console errors.
  - **CONCERN / SWEEP (deferred, dated — DR-0075 perpetual-improvement):** the new scanner's app-wide report finds the **same theme-bypassing inline-color pattern in 22 other component files (319 occurrences)** — biggest: `Library.jsx` (64), `CreationWorkspace.jsx` (63), `Bookstore.jsx` (49), `Presenter.jsx` (38), then `poe-financial-mvp-v28.jsx` (14), `HarvestLedger`/`Imported`/`NdiProgramOutput` (11 each), `BooksTransactions` (10), `AudienceWindow` (9), `Forecast`/`Pulpit` (8), `Rentals` (7), and a long tail. Not every occurrence is illegible (a colored badge bg can be fine), but the high-count surfaces almost certainly carry the same dark-on-dark TEXT bug as Chef's Corner. **Not converted in this PR** to keep the urgent reported fix small, verified, and fast (each surface needs its own live legibility check — Verification Doctrine). **Plan:** convert each file to shared tokens and add it to `CLEAN_FILES` so the gate locks it; run `node scripts/inline-style-color-guard.mjs --report` for the live worklist. **`re-review: 2026-07-09`** (or sooner — these are user-facing). The scanner makes the whole sweep visible and each conversion verifiable; the recurring nature of this bug class (see the 2026-06-17 entries) is exactly why the structural gate, not another one-off, is the durable fix.

---

## DECIDED — history

_(Decided items move here with the date and outcome, so the queue stays short and the record stays.)_

- **2026-06-13 · OPEN-6 — n8n Code-node HTTP sweep — DONE (local agent).** 9 workflows converted `fetch`/`require('http')` → `this.helpers.httpRequest` ([PR #87](https://github.com/darrellpoe06/Kingdom-PWA-Node/pull/87), merged to main; CI green). Deployed to live NAS n8n 2.21.7; wf08/20/29/30/32 active, **wf27 set INACTIVE** (autonomous processor — three-brakes held; turn on later attended), wf31/34/37 inactive. Live-proven: wf30's ntfy push now fires (was silently swallowed by `catch`). wf18/wf99 `process.env` reads (same class, no fetch/require) spun off as a separate follow-up.
- **2026-06-13 · OPEN-4 — governance sync to NAS — files staged (local agent).** `docs/governance/` (README, decision-queue, pre-authorized-policies, 4 OPA rego policies) synced to `/volume1/PoeTech/governance/`. **"reload OPA" is N/A — no OPA runs on the NAS** (no container/process/binary), so policy is staged but NOT live. Standing up OPA is a separate step that folds into OPEN-1 / the Cage runner.
- **2026-06-13 · BUILD BACKLOG #2–#5 — SHIPPED (local agent).** #2 project next-step/blocker field (PR #89), #3 reorder works with filters on — `swapById` preserves filter-hidden rows (PR #91), #4 open-decision count chip on the Build board → Decisions tab, governor-gated (PR #92), #5 recently-shipped continuity strip, build-stamped to the live deploy (PR #93). All in-app on real data, each with unit tests; lint + vitest green; merged through the protected lane. (#1 personal assignment was already shipped, PR #82.) Freshness-review loop captured as **[DR-0072]** (proposed) for when you greenlight it.
