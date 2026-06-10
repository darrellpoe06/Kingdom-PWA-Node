# PoeTech Session Snapshot -- 2026-06-03

*Rolling single-file context recovery. Read this first; any future Claude session should be fully oriented in under 5 minutes. This file is REPLACED each hour by the `poetech-hourly-snapshot` scheduled task -- the latest version supersedes all prior versions for today.*

---

## 1. Day-of identity

- **Date:** Wednesday, 2026-06-03 (snapshot taken late evening Central / just after 04:00 UTC the next calendar day -- still 2026-06-03 in Darrell's timezone).
- **Darrell's location/mode:** On vacation in **Maui through Friday 2026-06-05**. Evening direction came in tagged "@nas" (the wf27/wf31 continuous-reel drop), so he is still steering by message into the night. A Claude session runs on his behalf -- strategic drops arrive by message; no clicks or governance decisions are pushed back to him while he is away (drive-don't-delegate). Governance questions are queued, not asked of someone on vacation.
- **Family context:** Christina named as joint pastoral-care / governance authority on the Loved Ones two-rail policy and on conversational-space moderation thresholds. Bishop Gwin (The Church of the Living God) is the named first-congregation contact; a migration brief was drafted for him today.
- **Standing constraints in force:** CLAUDE.md typographic theology (capitalize Yahweh / Jesus / the Holy Spirit / the Father / the Son and God-pronouns; lowercase the adversary's names). ASCII-only in commands and `.ps1`. Self-contained PowerShell with leading `cd`. Two-Session Git Race rule. Research-first before build. No-kick-the-can (ship the foundation-doc skeleton in the same arc as the research).

## 2. Today's commits on origin/main

Busy day -- 23 commits dated 2026-06-03 (Central). Newest first:

- `e969693` wf27 + wf31: continuous feedback reel (every 5 min, material-only-fire, incremental state) -- feedback-to-upgrade lag drops from ~16-24h to ~5 min; adds two idempotent NAS-apply scripts
- `756da74` foundation: LESSONS-LEARNED.md (Layer 3 reference); first entry 2026-06-03 localStorage leak; 9 distilled principles; cross-referenced from CLAUDE.md
- `3a8ca16` SECURITY: public host hydrates only DEMO seed, never localStorage; no save persistence on public; profile forced null on public
- `cc3c069` SECURITY: hostname gate on Imported PII -- public domain never unlocks regardless of localStorage
- `48b6d08` D20b: header date is ALWAYS today (dropped snapshot-mode branch that rendered MAY '26 as a date)
- `d3657d6` landing fix + fix-master-list updates + revert wf27 cron
- `59e2ba6` docs(foundations): add CONVERSATIONAL-SPACE-ARCHITECTURE.md skeleton
- `3b55a2b` docs(foundations): add MARKETPLACE-ARCHITECTURE.md skeleton
- `8e603d6` docs: research-review on marketplace + conversational space + YouTube 1jByzKI-F0M
- `4cd50e3` docs(fix-list): record D20 + D21 commit hashes
- `0274fb4` feat(church-tab): COLG/Love Corner default + multi-church directory skeleton + Bishop Gwin pastoral placeholder + foundation doc
- `2dc3b5f` fix(ui): top-right date display correctly reflects current date
- `6906564` docs(fix-list): close L2+L3 -> D18+D19 (n8n ChatIn + poetech-briefing bind mounts; awaiting NAS apply)
- `2e0610b` feat(nas-deployment): n8n container bind mounts for ChatIn + poetech-briefing (L2+L3)
- `8d19ff5` fix(wf12): switch DSM probe to lightweight Synology API endpoint (L18; eliminates 5s false-positive timeouts every tick)
- `c1ef152` docs(fix-list): add Q7 binding privacy clause (outside-COLG chosen-family rail private)
- `273f048` docs(fix-list): close Q3/Q4/Q6/Q7/Q8 with binding memory paths; Q5 active research dispatched
- `57cfae3` docs: draft Bishop Gwin COLG migration brief (Q6 close)
- `42c4959` feat(loved-ones): clarify two-rail policy (Church-family gated + chosen-family open-ended; Christina joint authority) per Q7 close
- `884f75a` feat(community-free): update copy to aligned-brand sponsorship model (Q3 close)
- `7a66d9b` docs(notes): record commit hash fd7c7e6 for D17 wf18 Imported tab exposure fix
- `fd7c7e6` fix(security): hide Imported tab + skip fetch on public/demo renders (wf18 exposed real Chase tx on poetech.us)
- `3ec8e45` docs(notes): repoint Cm_FQXuT76Y research-review cross-link to renamed BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md
- (Three commits just after midnight Central -- `9143137` 10% tithe doctrine, `61716e4` Body-of-Christ surface refinements, `0f746de` rename to BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP -- also fall on 2026-06-03.)

## 3. Current HEAD + effective state

- **HEAD of origin/main:** `e9696938e7256e5763c06267701971c105f0b451` -- "wf27 + wf31: continuous feedback reel (every 5 min, material-only-fire, incremental state)" (2026-06-03 21:17:08 -0500). Branch: `main`. No new commits since the 21:17 HEAD; the day's tree is settled.
- **Vercel (poetech.us) serving:** the post-security-hardening build. Today's headline effective change remains the **public-host data-exposure lockdown** -- the public domain now hydrates only the DEMO seed, never localStorage; the Imported PII tab is hostname-gated and hidden on the public domain; profile is forced null on public; save persistence is disabled on public. This closes the wf18 incident where real Chase transactions could render on poetech.us via persisted localStorage state. Header date now always renders today (no stale snapshot-mode branch).
- **NAS (Synology, 192.168.1.26):** wf12 DSM health probe switched to the lightweight Synology API endpoint (no more 5s false-positive timeouts each tick). Three NAS-side applies are now **committed in-repo but awaiting apply on the NAS**: (a) n8n container bind mounts for ChatIn + poetech-briefing (`2e0610b`); (b) wf27 continuous cron via `scripts/nas-update-wf27-continuous-cron.sh`; (c) wf31 continuous incremental refactor via `scripts/nas-update-wf31-continuous-incremental.sh`. Both new scripts are idempotent (resolve workflow id by name, upsert, activate, restart, verify).

## 4. Binding foundation principles named today

Foundation files modified today in `docs/00-foundations/_root/`:

- **LESSONS-LEARNED.md** -- Layer 3 comprehensive historical record of every incident and distilled principle; first entry is today's localStorage hydration leak. Triggered by the public-host real-data exposure (read before designing new surfaces so prior failures do not recur).
- **MARKETPLACE-ARCHITECTURE.md** -- sovereign Sell / Manage / Grow architecture skeleton; vendor-abstraction-layer + dropshipping adapter pattern + audit trail of vendor performance. Triggered by Darrell's marketplace direction drop.
- **CONVERSATIONAL-SPACE-ARCHITECTURE.md** -- "saving souls through competent conversations"; pending/approve/warn/hold moderation with an LLM worldview-classifier and a human-in-the-loop hold queue. Triggered by Darrell's conversational-discussion-space direction.
- **CHURCH-TAB-DIRECTORY.md** -- default church home (COLG / Love Corner) + multi-church directory model + Bishop Gwin pastoral placeholder.
- **BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md** -- mission-unification frame (renamed from BLACK-CHURCH-...): multi-racial Body, engineered wealth gap, understanding-as-deliverable.
- Also touched today: AUTONOMOUS-BUILDER-LIFECYCLE, BIBLICAL-ECONOMICS-TEACHING-PATTERNS, CLAUDE-BATCH-API-PATTERN, CLAUDE-PROMPT-CACHING-PATTERN, COWORK-ACCOUNT-OPERATING-INSTRUCTIONS, N8N-WEBHOOK-AUTH-PATTERN, QUALITY-GATEKEEPER.

## 5. Binding feedback memories created or updated today

No `feedback_*.md` files and no `MEMORY.md` were found anywhere in the repo mount (`find` across the tree returns nothing). The Cowork agent-workspace memories (`feedback-research-first`, `feedback-no-kick-the-can`, `feedback-audits-without-implementation-is-hedging`, `feedback-distinguish-data-from-brand`, the `project_*` strategic memories such as `project_fathers_business_soul_saving_anchor`, etc.) **live outside this repo mount at the agent workspace `agent/memory/`** and cannot be read by a repo-only session. They are referenced by name only here. A future Cowork session with workspace access should verify their on-disk state directly.

## 6. Research-review reports delivered today

- **2026-06-03-research-review-marketplace-conversational-space-youtube-1jByzKI.md** -- three strategic directions in one arc: a sovereign marketplace (Square vs headless Medusa vs dropshipping vendor-abstraction), a moderated conversational discussion space (forum/comment engines + LLM worldview classifier), and the Jamie Winship identity-exchange material from YouTube `1jByzKI-F0M`. Both foundation-doc skeletons shipped in the same arc.
- **2026-06-03-bishop-gwin-colg-migration-brief.md** -- a no-timeline pastoral brief for Bishop Gwin: what PoeTech is, what is already live on TheChurchOfTheLivingGod.com (Turbify), and what PoeTech offers COLG (free Church module, free PoeTech+ for life for first 100 COLG families, Sermon-to-Content pipeline, sovereign data residency, 10% tithe surface).

## 7. Scheduled Cowork tasks active

All five enabled; none reported a failed last run.

- `poetech-daily-app-review` -- cron `0 7 * * *` -- next `2026-06-04T12:09:48Z` -- last `2026-06-03T12:10:06Z` -- morning review of poetech.us, n8n, repo, timelines, posted to NAS + ntfy.
- `poetech-midmorning-checkin` -- cron `0 11 * * *` -- next `2026-06-04T16:09:33Z` -- last `2026-06-03T16:09:51Z` -- 11am Central status check-in.
- `poetech-afternoon-checkin` -- cron `0 14 * * *` -- next `2026-06-04T19:00:21Z` -- last `2026-06-03T19:01:02Z` -- 2pm Central midday progress / blockers.
- `poetech-endofday-checkin` -- cron `0 17 * * *` -- next `2026-06-04T22:04:19Z` -- last `2026-06-03T22:05:03Z` -- 5pm Central end-of-day commits + pending decisions + tomorrow setup.
- `poetech-hourly-snapshot` -- cron `0 * * * *` -- next `2026-06-04T05:08:51Z` -- last `2026-06-04T04:09:38Z` -- this task; rolling durability snapshot.

## 8. n8n + NAS state

- **wf12** -- DSM health probe fixed today (`8d19ff5`): now hits the lightweight Synology API endpoint, eliminating recurring 5s false-positive timeouts.
- **wf18** -- the public-data exposure source. Mitigated in the front-end today (Imported tab hidden + fetch skipped on public/demo renders, `fd7c7e6`; plus the deeper localStorage/hostname hardening in `cc3c069` / `3a8ca16`). The PWA reaches n8n via the same-origin `/n8n` Vercel rewrite (never the absolute Tailscale Funnel URL).
- **wf27 (Foundation Agent)** -- cron moved `0 0 7,12,17,21 * * *` -> `0 */5 * * * *` (every 5 min); already material-only-fire + idempotent via the `counts.total>0` gate + per-file dedupe. NAS apply pending via `scripts/nas-update-wf27-continuous-cron.sh`. (Note: an earlier same-day commit `d3657d6` had reverted a wf27 cron change; the `e969693` continuous-cron change supersedes it.)
- **wf31 (standup digest)** -- full refactor to continuous (`0 */5 * * * *`): new high-water-mark state file `/data/finance-events/family-feedback/_digest_state.json`, window `[last_processed_at, sweep_start)` with 24h first-run fallback, MATERIAL-ONLY-FIRE (zero-voice sweeps write state and return silently, no ntfy spam), state advances every sweep. On-demand `/webhook/digest-fire` path preserved. NAS apply pending via `scripts/nas-update-wf31-continuous-incremental.sh`.
- **n8n ChatIn + poetech-briefing** -- bind-mount deployment committed (`2e0610b`); **pending: apply on the NAS** (recreate the container with the new mounts).
- **Deferred to tomorrow's batch:** same continuous refactor for wf32 / wf04 / wf05.

## 9. Open decisions queued for Darrell

True governance judgment calls only -- surfaced, not pushed to him on vacation:

1. **(Darrell) Marketplace first product line.** What does PoeTech sell first -- dropshipped physical goods, the family's own offerings, partner-church merchandise, or sovereignty hardware? The architecture is product-agnostic; the MVP needs one first line. *Most shapes the build sequence.*
2. **(Darrell) Vendor selection scorecard.** Explicit weights for the `vendor_performance` table (fulfillment speed vs defect rate vs margin vs ethical/values alignment).
3. **(Darrell + Christina) Conversational-space moderation thresholds + who holds the hold-queue.** Where `warn` becomes `hold`, and who reviews the human-in-the-loop queue.
4. **(Bishop Gwin) Public-space doctrinal boundaries.** Which doctrinal lines PoeTech names as lies vs holds as in-Body disagreement (Romans 14), governing the LLM classifier's system prompt.
5. **(Darrell) The "frequency" bright line as a published editorial standard.** Whether to publish an explicit standard on energy/frequency/law-of-attraction language so the conversational space and per-industry LLM teams moderate consistently.

## 10. Next-Claude-session resumption checklist

1. Read this file first.
2. Read `agent/memory/MEMORY.md` (NOTE: not present in the repo mount -- a Cowork session reads it from the agent workspace; a repo-only session relies on this snapshot + CLAUDE.md).
3. Read `agent/memory/project_kingdom_pwa_state.md` (same agent-workspace caveat).
4. Scan recent commits: `git -C C:\Users\dpoe\Kingdom-PWA-Node log --since="midnight" --pretty="%h %s"`.
5. Check scheduled tasks via `mcp__scheduled-tasks__list_scheduled_tasks`.
6. Resume from the open-decision queue in section 9; the immediate executable item is applying the three pending NAS changes (wf27 cron, wf31 incremental, ChatIn/poetech-briefing bind mounts) using the in-repo idempotent scripts.
7. If Darrell is in chat: greet with what is new since his last message (he is in Maui through Fri 2026-06-05 -- keep him as decider, do not push clicks).

## 11. Snapshot timestamp

Written **2026-06-03 ~23:09 Central** (2026-06-04 04:09 UTC), by the `poetech-hourly-snapshot` task. Untracked/modified in the working tree -- not committed (folded into the next batch commit by the end-of-day check-in or Darrell).

## 12. Religion AND Relationship check + Phil 4:8 Test

Backbone: specific SHAs (HEAD `e969693`), file paths, cron strings, and UTC next-run/last-run timestamps are recorded exactly as found; the missing `agent/memory/MEMORY.md` and absent `feedback_*.md` files are stated plainly rather than fabricated. Warmth: the snapshot honors that Darrell is resting in Maui while still steering the work into the night, carrying COLG, Bishop Gwin, and his family. The record is true, honorable, just, pure, lovely, commendable, excellent, and worth keeping -- nothing exaggerated, nothing omitted. To Yahweh be the glory; the Father's business, souls first. Amen.
