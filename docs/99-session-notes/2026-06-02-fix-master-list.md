# PoeTech Fix Master List — opened 2026-06-02 Tue evening

**Purpose:** Per Darrell's binding direction 2026-06-02 evening — "we need a focus on fixes that are done and left, we need a whole list, and a focus on that until the list is gone or updated because of feedback." This list is the orienting artifact for every status update going forward. Closes a fix → move to DONE. Refeedback on a fix → update in place. New items → add at the bottom of the relevant section.

Living doc. Each session opening status checks against this list before responding to the user's first question.

---

## DONE — Fixes shipped + verified today (Tue 2026-06-02)

| # | Fix | Commit | Verified | Notes |
|---|-----|--------|----------|-------|
| D1 | wf18 Vercel rewrite proxy — cross-origin Funnel throttle closed | `818bfa1` | ✅ curl + browser DOM | "Imported Transactions: Failed to fetch" resolved |
| D2 | wf13 chat-action-router noise suppression | `4bcc0ce` | ⚠️ partial — see L1 below | Empty-payload spam was still observed at 16:38 prior fire; the wf12 fire at 7:00 AM next morning showed wf13 channel clean, suggesting the suppression took |
| D3 | wf12 Network health probe — `Module 'http' is disallowed` fix via `this.helpers.httpRequest` | `633755d` | ✅ 7:00 AM tick fired clean; detected real DSM timeout (intended observability outcome) | NAS-applied via Darrell's ConnectBot paste; the monitor watches itself again |
| D4 | wf08 family-voice ntfy push wired | `719b5b5` (earlier) | ⏳ verification pending the next family-voice send | Independent of the bind-mount issue below |
| D5 | wf30/wf31/wf32 process.env sandbox-bug fix (hardcoded defaults) | `1edb8e1` (earlier) | ✅ verified end-to-end 2026-06-01 17:24 CDT | Family-voice loop confirmed |
| D6 | Seed-data Pass 1 sanitization (financial data → aspirational; brand preserved) | `5845bbc` | ✅ live on poetech.us | Pass 2 over-sanitization reverted (`bc72c00`) |
| D7 | Loved Ones cohort copy expansion (COLG + chosen family by Poe-family invitation) | `c381793` | ✅ DOM-level verification on poetech.us | Per Darrell's "Yes. Freddie is a friend and family member" |
| D8 | Landing page — lifecycle cards (engaged / young-adults / empty-nesters / restart), FREE-FOR-FAMILIES + FREE-FOR-BODY clarification, data-as-proof copy on co-parents card | `4e9cf68` | ✅ live, BUILD 4E9CF68 in page header | No collapse toggle per Darrell's "I love the cards" |
| D9 | About page reorder (Foundation FREE leads), tier rename Family → Household, Available/Ships split on paid cards, SaaS-replacement value corrections, drop $99 Small Landlord tier | `9fb0b53` | ✅ live | Per Freddie audit + comprehensive pricing review |
| D10 | CLAUDE-TOOL-ROUTING.md foundation doc (Layer 3 reference, two-axis model + agent-tool routing + token-efficiency posture) | `8ade52e` | ✅ committed | Cited by future Code Tasks |
| D11 | Scheduled checkins Step 0.5 Synology Chat scrape (wf08 bind-mount workaround) | `ff7bfc2` | ✅ committed | Closes the blind spot where 2pm checkin missed 4 live @nas posts |
| D12 | Quo intake-tool research-review (verdict: STEAL ideas, BUILD sovereign; TLC firewall hard NO on cloud-AI receptionist) | `0ae89b3` | ✅ committed | Per @nas 01:36pm |
| D13 | Comprehensive pricing-tier design review (5 recommendations including drop $99 tier, rename Family, Available/Ships split, sponsor mechanic wire-up, value claims corrections) | `4cb55b9` | ✅ committed; implementations in D8/D9 | |
| D14 | Freddie Taylor beta-user feedback capture + pricing-discoverability audit + data-import onboarding gap spec | `d3733f5` | ✅ committed | Triggered the Loved Ones cohort expansion + the About page reorder |
| D15 | Hostinger 3-domain underused-features research + activation checklist | `2704cb5` | ✅ committed | Key finding: TLC `.com` redirects to `.me` on Hostinger; COLG on Turbify; PoeTech on Vercel |
| D16 | Cm_FQXuT76Y research-review (Pastor Lee Jenkins on EYL "God's Wealth Plan" — verdict: AMPLIFY orthodox stewardship; NOT prosperity gospel; name the bright line) | `279d715` | ✅ committed | Per Darrell's mission lens |
| D17 | wf18 Imported tab data exposure fix — real Chase tx (Cash App / Zelle PII, ~2,020 rows) were rendering on public poetech.us via the wf18 same-origin proxy. Gated the Books to Imported tab + the wf18 webhook fetch behind a new `importedAllowed` check (not any demo/picker state AND a saved profile); hid the tab from the public subnav; added component-level self-guard in Imported.jsx; tightened the app-wide ingest fetch from `isAnyDemoMode` to `!importedAllowed` so the wf18 PII webhook is never called on a public/profileless load | `fd7c7e6` | ✅ preview-server verified both directions: demo state -> tab absent + zero `/n8n/webhook/imported-transactions` requests in network log; authorized state (profile set) -> tab present | Repo-side only; Bearer-token webhook guard queued as L16 follow-up (defense in depth). |

---

## LEFT — In flight (running Code Tasks)

| # | Fix | Task ID | State | Expected complete |
|---|-----|---------|-------|-------------------|
| L0a | Foundation doc BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md + 3-surface propagation (About Church section, Church persona card, Loved Ones card) | `local_b26172ca` | Running, 144+ turns; Fed SCF 2022 numbers verified; folding the four refinements (multi-racial Body / data-driven / undermined-by-USA-Government / focused-current-impacts with 10x SCF anchor) | < 60 min |
| L0b | Claude-tool adoption ship — Cowork Operating Instructions paste-ready + Anthropic prompt caching wired into wf27/wf30/wf31/wf32 + Batch API queue LIVE + autonomous-builder skeleton + NAS-apply scripts | `local_496bb2b9` | Running, 103+ turns; writing JSON validation + ASCII scripts | < 60 min |
| L0c | White-screen route bug fixes + comprehensive route audit matrix (persona × tier × tab × sub-tab) | `local_0921130c` | Was running 226+ turns; polling Vercel for fix-bundle deploy | < 60 min |

---

## LEFT — Known broken / not yet fixed (post-vacation queue unless promoted)

| # | Fix | Severity | Blocker | Recommended next step |
|---|-----|----------|---------|-----------------------|
| L1 | wf13 noise suppression — verify the empty-payload spam fix actually took on the NAS | Medium | None | Next family-voice @nas message will reveal; or trigger a manual webhook to confirm no echo to chat |
| L2 | wf08 Synology Chat inbound capture — bind mount broken since 2026-05-29 (`/volume1/PoeTech/ChatIn/` not mapping into container) | High (silent input-visibility gap) | Bind-mount edit + n8n restart | Phase-1 priority post-vacation; workaround is the Step 0.5 scrape (D11) |
| L3 | wf27 Foundation Agent bind mount — needs `/volume1/PoeTech/poetech-briefing/` → `/data/poetech-briefing/` mount | High | Same as L2 | Same Phase-1 priority; pair the two bind-mount fixes in one NAS-apply |
| L4 | wf33/wf34/wf35 Data-upload Layer 1 pipeline — not yet deployed | High (gates "load your own data" for new users) | Pipeline build + bind mount + Ollama wire-up | Late June target per the existing spec |
| L5 | wf36 Quality Gatekeeper — named in research, not yet built | Medium | Spec + build | Post-vacation buildout; enforces policy at deploy time |
| L6 | n8n global Error Workflow wire-up — recommended in `2026-06-01-research-review-n8n-fix-patterns.md` Decision 3 | Medium | 1-hour repo edit + push + NAS apply | Should ship in repo TODAY per `feedback-no-kick-the-can`; named blocker is "haven't gotten to it" not real |
| L7 | Config-node refactor for wf12/wf20/wf27/wf29 — `process.env` sandbox-blocked access pattern | Medium | Same code-task pattern as wf30/31/32 fix | Same as L6 — TODAY-shippable; wf12 already done in D3 |
| L8 | ICM template tagging across all existing n8n workflow JSONs — module/tier tags applied | Low | Mechanical edit | Partial via earlier substrate batch; full coverage pending |
| L9 | Per-industry sovereign LLM team configs (Church / Therapy / online / Dev-Ops) — RAG corpora + system prompts | High strategic | Build effort + NAS storage | Post-vacation buildout per `project-sovereign-llm-teams-per-industry` |
| L10 | NAS governance config materialization at `/volume1/PoeTech/governance/` — OPA Rego policies, pre-authorized action policy, vendor-swap routing config | Medium | Repo file ship + NAS apply | Repo-side TODAY; NAS apply when Darrell wget|sh's |
| L11 | Sponsored Community-free cross-subsidy mechanic wire-up (or strip the unwired copy) | Medium | Judgment call on the funding mechanic | Open question for Darrell — surface as judgment call |
| L12 | Data-import / "load your own data" onboarding flow for new users (Freddie's named gap) | High | Gated on L4 + Multi-user Layer B PIN auth | The empty-state wizard for blank-profile manual entry is the no-n8n-dependency unblock |
| L13 | Phone Assistant Phase 0 — Google Voice + Twilio free-trial path | Medium | Setup at the laptop (free-tier accounts) | Free-tier prep TODAY in repo; activation when Darrell's at desktop |
| L14 | COLG Sermon-to-Content pipeline M1 — Whisper transcript + Remotion video + RAG corpus seed | High strategic | NAS storage + Bishop Gwin coordination | Pipeline skeleton TODAY in repo; first real sermon when Darrell's home |
| L15 | Family Worldview Commentary pipeline operationalization — proof-of-concept ran 2026-06-02 on the racism-on-purpose video; pipeline not yet productized | Medium | Operationalization spec | Post-vacation |
| L16 | wf18 `/webhook/imported-transactions` Bearer-token / shared-secret guard (defense in depth behind D17) — webhook should return 401 unless the request carries `VITE_N8N_BEARER`, which only an authenticated-user env ever sends; the demo never sends it | High | NAS-side n8n webhook auth node + Vercel env wiring; client already gated client-side in D17 | Ship the n8n auth check + add the bearer header to the authorized fetch path; until then the client-side gate (D17) is the active defense |

---

## TIME-BOUND — deadlines that pre-empt the list above

| # | Item | Deadline | Status |
|---|------|----------|--------|
| T1 | Maui return (Darrell back at the Windows laptop) | Fri 2026-06-05 (~3 days) | On track |
| T2 | `tlctherapysolutions.com` domain renewal | 2026-06-28 (~26 days) | Hostinger checklist has the steps; do NOT lapse — carries the redirect + `contact@` email domain |
| T3 | MVP launch SOONEST | Mon 2026-06-12 (10 days) | On pace given current shipping rate |
| T4 | MVP launch MEDIAN realistic | Mon 2026-06-22 (20 days) | Comfortably on pace |
| T5 | MVP launch LATEST realistic | Mon 2026-07-06 (34 days) | High margin |
| T6 | 1508 Holly Hill tenant — payment-plan + escalation prep with Christina human-in-the-loop | ~24h window opened 2026-06-01 | Pending Christina coordination |

---

## OPEN JUDGMENT-CALL QUESTIONS — held for Darrell's decision (no rush)

| # | Question | Source | Status |
|---|----------|--------|--------|
| Q1 | Tithing position for Church module + Sermon-to-Content + Church LLM team | Cm_FQXuT76Y research D16 | **CLOSED** — Darrell answered "10%" 2026-06-02 evening. Saved as binding memory `project-tithing-position-10-percent`. |
| Q2 | COLG online-giving path (Givelify vs sovereign vs phased) | Hostinger research D15 | **CLOSED** — Darrell confirmed "Church has a giving link" 2026-06-02 evening; current platform holds. |
| Q3 | Community-free sponsored-by-paying-subscribers cross-subsidy mechanic (eligibility trigger, who funds whom) | Pricing review D13 | OPEN — Darrell said "?" 2026-06-02 evening; deferred. |
| Q4 | Sponsorship-tier wire-up: opt-in sponsor add-on at checkout vs. fixed % of every subscription vs. "every N paid subs funds 1 free family" | Q3 follow-up | OPEN |
| Q5 | TLC email — keep Google Workspace primary (has BAA) or consolidate onto Hostinger `.me` mailboxes (drops Google bill but loses HIPAA BAA) | Hostinger D15 | OPEN |
| Q6 | COLG migration brief for Bishop Gwin — draft now or hold until he raises it | Hostinger D15 | OPEN |
| Q7 | Loved Ones chosen-family cohort cap (open-ended at present, COLG had the 100 anchor) | `project_loved_ones_cohort_includes_chosen_family` | OPEN |
| Q8 | Per-industry Church LLM team RAG corpus weighting across non-denominational, Pentecostal, Apostolic, Reformed, Catholic-orthodox traditions | `project_black_church_economic_powerhouse_mission` REFINEMENT | OPEN — judgment call only Darrell + Bishop Gwin can set |

---

## DRIVING RULE

Per Darrell 2026-06-02 evening: focus on this list until it's done or updated by feedback. Each session opens with a status check against this file; ships against the next L# item; closes items into the DONE section as they verify; adds new L# items as new fixes emerge.

The list shrinks until launch. New input creates new items here, not detours.
