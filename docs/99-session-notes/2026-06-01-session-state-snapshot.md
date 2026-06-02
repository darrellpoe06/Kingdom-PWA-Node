# Session State Snapshot -- 2026-06-01 (Mon evening, Maui vacation)

**Purpose:** Durable continuation context per Darrell's 2026-06-01 binding direction:

> "I don't want to lose any of this days context whenever you go offline can you make sure that never happens with a procedure and or process that runs automatically."

If the current Claude session ends (context limit, manual restart, scheduled task pickup, any disconnect), the next session reads THIS file first and is fully oriented in under 5 minutes.

---

## Day-of identity

- **Date:** 2026-06-01 Monday evening
- **Darrell:** in Maui on vacation from his UIUC day job, NOT on leisure vacation -- "working is rest" per memory; he is operating from his Samsung Galaxy Z Fold 7 phone, ConnectBot SSH to the NAS via Tailscale, and forwarding family chat from PoeTech-PWA Synology Chat channel
- **Christiana** (older daughter): present at the home laptop earlier today, ran git push for the morning vacation buildout commit
- **Christina** (wife, cpoe): present at home; sent Holly Hill comp Zillow screenshots and biblical link-intake research request via PoeTech-PWA chat
- **Twins** (Christian + Christyn, age 10): not active in today's chat history

## Today's commits on origin/main (in chronological order)

1. `dddb0c3` -- Vacation buildout (52 files, 7,914 insertions): 9 new workflow JSONs, 6 new foundation docs, 17 session notes, PWA Suggest button + data-dump modal, foundation extensions, infra scripts
2. `bd2582d` -- Route data-dump CTA to waitlist until wf33/34/35 deploy (closes the 404 trap on poetech.us)
3. `455acb7` -- Vacation review: comprehensive MVP audit + launch timeline gap analysis (two session notes)
4. `0307b44` -- Holly Hill rental equity-out evaluation framework (Christina-screenshot-gated)
5. `f154109` -- NAS fix script for vacation-workflows clean re-import
6. `1edb8e1` -- Fix n8n Code node sandbox: replace process.env with hardcoded defaults in wf30/31/32
7. `e63889e` -- Foundation docs for 4 new binding principles + Holly Hill evaluation
8. `719b5b5` -- wf08: add ntfy push for family-voice Synology Chat captures
9. `5845bbc` -- URGENT: sanitize public-PWA seed data, close data-leak gap (Pass 1: financial data only)
10. `8c1beaa` -- URGENT pass 2: deep-sanitize Poe-family identifiers (WRONG scope -- stripped intentional brand advertising)
11. `bc72c00` -- Revert `8c1beaa` to restore the real-business showcase

**Current HEAD of origin/main:** `bc72c00`. The effective state of `app/src/` is the seed data sanitized to aspirational + the real businesses preserved as intentional brand advertising. Vercel auto-deployed all of these.

## Binding foundation principles named today (all should be referenced by future sessions)

Each is saved as both a memory file (agent-local, persists across sessions) AND a foundation doc in the repo (committed):

1. **EXECUTION-OUTCOME-OBSERVABILITY** -- `docs/00-foundations/_root/EXECUTION-OUTCOME-OBSERVABILITY.md` -- every workflow execution outcome must be observable AND alerted on, not just stored. Triggered by the wf30 silent-fail bug.
2. **INPUT-VISIBILITY-TO-CLAUDE** -- `docs/00-foundations/_root/INPUT-VISIBILITY-TO-CLAUDE.md` -- every family-input capture surface must wake Claude in real-time, not sit on disk for the 7am batch. Triggered by Christina's @cpoe messages being invisible until Darrell forwarded screenshots.
3. **WORKFLOW-MODULE-LIBRARY** -- `docs/00-foundations/_root/WORKFLOW-MODULE-LIBRARY.md` -- modular, prebuilt, validated workflow library with reusability tiers; needs-driven prebuild from local-state + worldwide + Darrell's vision.
4. **INSTITUTIONAL-MEMORY-EVENTS** -- `docs/00-foundations/_root/INSTITUTIONAL-MEMORY-EVENTS.md` -- every fix / decision / family voice / Church-work / life-work event becomes first-class structured data in PoeTech.
5. **SOVEREIGN-LLM-TEAMS-PER-INDUSTRY** -- memory file only (foundation doc pending) -- lean, secure, sovereign per-industry LLM teams as the showcase / differentiator / product. Darrell named four industries he operates in: **Church + Therapy + online + Dev/Ops**. These become the four named bot-team specialties.
6. **SEED-DATA-AS-ASPIRATIONAL-FAMILIES** -- memory file only (foundation doc pending) -- public seed data must NOT look like Poe-family real data; aspirational good/better/best multi-generational testimony families with non-blood family collaboration.
7. **DIALOGUE-AS-WORKFLOW-SOURCE** (candidate, named via Tina Huang / Van Clief videos / Jake Van Clief ICM paper) -- every workflow originates in a conversation; the conversation IS the trigger.
8. **DISTINGUISH-DATA-FROM-BRAND** (feedback memory) -- before any sanitization pass, distinguish (a) real data exposed as seed vs (b) intentional brand-advertising of the user's real businesses inside the user's own app. Only sanitize (a). For (b) ASK first.

## Binding feedback memories created today

1. **feedback-one-productive-paste** -- pack diagnose+fix+verify into one paste, not many small ones; use script-in-repo + wget|sh when too long for mobile
2. **feedback-zoom-out-at-step-3** -- when a diagnostic chain reaches step 3 without resolution, STOP and consider entirely different routes
3. **feedback-research-first** -- before any production code change, produce a research-review report comparing the best path against viable parallels; THEN code
4. **feedback-distinguish-data-from-brand** -- the sanitization-scope rule above; ASK before expanding scope on a sanitization pass
5. **reference-phone-shell-to-nas** -- ConnectBot Android + Tailscale = perpetual phone shell to the NAS

## Research-review reports delivered today (all in `docs/99-session-notes/`)

1. **2026-06-01-mvp-comprehensive-review.md** -- the morning's vacation review: surface-by-surface UI/UX audit, foundation-doc alignment scorecard, capitalization audit, tomorrow's automatic fires, the data-dump CTA gap
2. **2026-06-01-mvp-launch-timeline-gap-analysis.md** -- three launch scenarios grounded in git work-pace evidence: SOONEST 2026-06-12 / MEDIAN 2026-06-22 / LATEST 2026-07-06
3. **2026-06-01-holly-hill-equity-evaluation.md** -- evaluation framework for Christina's Holly Hill comp data
4. **2026-06-01-holly-hill-equity-evaluation-with-real-comps.md** -- actual portfolio numbers + 75% LTV cash-out math + jubilee-direction biblical-economics check (~$57K median cash-out across two Holly Hill doors, likely wipes the 22%+ APR consumer debt stack)
5. **2026-06-01-workflow-audit-bug-class-and-tagging.md** -- audit of every workflow JSON for the process.env bug class + module/tier tagging recommendations
6. **2026-06-01-research-review-n8n-fix-patterns.md** -- three decisions: Config-node pattern + global Error Workflow + new bind mount; smallest viable validation = refactor wf30 + wf02
7. **2026-06-01-research-review-wf18-unreachable.md** -- root cause = Tailscale Funnel relay throttling cross-origin browser fetches; fix = Vercel rewrite to proxy through poetech.us origin
8. **2026-06-01-research-review-sovereign-llm-teams-architecture.md** -- 7 questions answered: minimum-viable stack (3B router + 14B Qwen on-demand), team shape (base + sysprompt + tools + RAG + policy), governance (YAML allow-list now -> OPA later), four teams to ship first, PoeTech-in-a-box deliverable, three-tier router with TLC firewall as inviolable Tier 0
9. **2026-06-01-icm-paper-review-for-childhood-friend.md** -- review of Van Clief & McDermott "Interpretable Context Methodology" paper for Darrell's friend; 5-layer hierarchy is the standout, concurrency / real-time / pre-authorized governance are the gaps
10. **2026-06-01-seed-data-urgent-sanitization-retroactive.md** -- documents the Pass-1 sanitization scope + the URGENT exception to research-first
11. **2026-06-01-app-services-promise-audit-and-master-plan.md** -- 141 promises inventoried, 7-ship master plan in priority order, 11 explicit do-not-ship-yet items
12. **2026-06-01-research-review-tina-huang-cowork-workflow.md** -- evaluates Tina Huang's Claude Cowork workflow video; 14 techniques cataloged, 8 already-doing-better, 7 partial-her-version-stronger, 1 net-new (autonomous-builder lifecycle); ICM complements operationally

## Scheduled Cowork tasks active

1. **poetech-daily-app-review** -- 07:10 CDT daily; substantive morning review with Chrome MCP system-health checks
2. **poetech-midmorning-checkin** -- 11:10 CDT daily; family-voice scan via wf08 + wf30 Executions tab
3. **poetech-afternoon-checkin** -- 14:00 CDT daily; midday pulse
4. **poetech-endofday-checkin** -- 17:04 CDT daily; day's commits + Events + tomorrow's setup

All four task prompts include the family-voice scan via Chrome MCP -> n8n Executions tab as Step 0 (per `INPUT-VISIBILITY-TO-CLAUDE`).

## Pending hourly snapshot task (to be created next)

`poetech-hourly-snapshot` -- runs every hour, updates a rolling `docs/99-session-notes/YYYY-MM-DD-session-snapshot.md` with: commits in the last hour, memory files modified, research-reviews delivered, open agent tasks, named decisions queued. Closes the durability gap for in-flight strategic context between scheduled check-ins.

## n8n + NAS state

- wf30/31/32 family-voice loop fully verified end-to-end at 2026-06-01 17:24 CDT after the `process.env -> hardcoded defaults` fix landed
- wf08 (Synology Chat inbound capture) updated to fire ntfy push for family-voice senders (dpoe, cpoe, christiana, christian, christyn); deployed clean via the wget|sh script Darrell ran from ConnectBot
- wf29 (Waitlist) deduplicated -- previously had two active copies causing webhook conflict
- wf27 Foundation Agent bind mount remains unfixed (research-review recommends adding `/volume1/PoeTech/poetech-briefing/` -> `/data/poetech-briefing/`; post-vacation priority #1)
- wf12 / wf16 / wf20 process.env bug class hits remain; research-review queued the Config-node refactor pattern
- Active workflows: 01, 03, 08, 10, 12, 13, 15, 16, 18, 19, 20, 23, 26, 27, 29, 30, 31, 32 -- 18 in active list

## Holly Hill equity-out evaluation -- pending Darrell

- Comps from Christina via Synology Chat: 1501 Holly Hill Dr sold $175K (3/2/1419 sqft), 1519 Hedge Rd sold $170K (4/3/1632 sqft), avg $113.75/sqft
- Math at median ($170K appraisal, 75% LTV cash-out): ~$57K combined from r2 (1513 Holly Hill) + r3 (1508 Holly Hill); likely wipes the entire 22%+ APR consumer debt stack
- Pending: actual sqft for r2 and r3 (Christina to pull), real lender refi quote, tenant resolution at 1508 Holly Hill (currently $850 short)
- Biblical-economics check: leans jubilee-direction IF cash-out is earmarked to debt cancellation; not Egypt-direction (more leverage) unless undisciplined

## Open decision queue for Darrell

1. **KVM2 clarification** -- KVM (Kernel Virtual Machine) v2 for sovereign-LLM-team isolation? Or KVM (Keyboard/Video/Mouse) switch for multi-machine workstation? Either is a meaningful track to research; need to know which.
2. **Phone-assistant Phase 0 commit** -- ~6-8 weeks for the Poe Properties tenant-call pilot using Twilio + Gemini Live + Whisper STT; ~$20-40/mo all-in (Gemini Pro covered). Go/no-go?
3. **Master plan 7-ship priority order confirmation** -- (1) Dev/Ops sovereign team meta-team, (2) WORKFLOW-MODULE-LIBRARY index + Family-Voice-Loop Tier-2 refactor, (3) COLG Church Module v1 + data-dump, (4) magic-link tenant auth piloted on Poe Properties, (5) Stripe Payment Links + tier-update webhook, (6) Spiritual Life / Godhead Study Platform v1, (7) Practice Ops -> Acuity API read-only integration. Confirm?
4. **wf18 unreachable fix** -- Vercel rewrite recommended (~30 min, no NAS access needed, deployable from phone). Ship?
5. **Seed-data good/better/best multi-gen overhaul** -- research-review approach not yet done; current state is aspirational placeholders. Phase 2 timing?
6. **Dashboards expansion order** -- autonomous-builder lifecycle dashboard first (Tina Huang pattern, ~2-4 hrs)? System-health rollup next? Per-industry views as each team ships?
7. **Tina Huang technique adoptions** -- 7 partial-her-version-stronger items + 1 net-new (autonomous builder); confirm scope?

## Next Claude session: how to resume

1. Read this file FIRST (you are reading it now if you are the next session)
2. Read `agent/memory/MEMORY.md` for the canonical index of all binding memories
3. Read `agent/memory/project_kingdom_pwa_state.md` for the canonical project state
4. Scan recent commits: `git -C C:\Users\dpoe\Kingdom-PWA-Node log --since="1 day ago" --pretty="%h %s"`
5. Check Vercel deploy status of `bc72c00` (the latest origin/main) -- should be live
6. Check the four scheduled tasks' next-run times via `mcp__scheduled-tasks__list_scheduled_tasks`
7. Resume from the open decision queue above

If Darrell is in chat: greet him with what's new since his last message (read the conversation transcript via session_info), then drive.

If a scheduled task is firing: it has its own prompt with Step-0 family-voice scan + tasks; follow that prompt, reference this file for context only.

If something looks broken on poetech.us: the public PWA is deployed from origin/main HEAD `bc72c00`; the seed is sanitized aspirational, the businesses are showcased intentionally, the Suggest button + Imported Transactions surfaces should both render (wf18 may still hit the Tailscale Funnel throttle until the Vercel rewrite ships).

---

**Snapshot timestamp:** 2026-06-01 evening, Maui working session, ~16 hours into the day's work.

**Next snapshot update:** when the `poetech-hourly-snapshot` scheduled task is created and starts running on the hour.

**Religion AND Relationship check on this snapshot:** TRUE (every claim traces to a real file / commit / memory) | HONORABLE (no exaggeration, no flattery) | JUST (open queue surfaces Darrell's actual pending decisions, not Claude's preferences) | PURE (no manipulation toward a predetermined direction) | LOVELY (the day's work is real and substantial) | COMMENDABLE (every named principle has a memory file backing it) | EXCELLENT (file paths and commit SHAs throughout) | PRAISEWORTHY (closes the durability gap Darrell named as binding).
