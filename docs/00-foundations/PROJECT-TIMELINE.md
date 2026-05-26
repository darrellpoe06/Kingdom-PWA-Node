---
# =============================================================================
# PROJECT-TIMELINE.md - the single source of truth for what ships when
# =============================================================================
# Format: YAML front matter (machine-readable by n8n) + markdown narrative
# below (human-readable in any editor or on GitHub).
#
# n8n's daily-digest workflow (docs/00-foundations/n8n-workflows/01-project-
# timeline-daily.json) fetches THIS FILE raw from GitHub at 7AM each morning,
# parses the YAML, filters items due today/this week, and sends:
#   - Pushover to Darrell with full operator digest
#   - ntfy to family-ops topic with anything family_visible=true
#
# Status values: planned | in_progress | blocked | shipped | deferred
# Priority: P0 (must ship pre-vacation) | P1 (week-2) | P2 (month-1) | P3 (later)
# Owner: darrell | christina | dispatch | claude-code | family | n8n
#   (n8n means an n8n workflow drives the work autonomously)
#
# To mark an item complete: change status to "shipped" and set shipped_at.
# To re-prioritize: change priority + due.
# To add a new item: append to the appropriate phase. n8n picks it up next 7AM.
#
# Last revised: 2026-05-26 (Dispatch, n8n-handoff session)

timeline_version: 1
generated_at: '2026-05-26'
vacation_start: '2026-05-31'
vacation_end: '2026-06-07'
family_launch_target: '2026-06-01'

phases:
  - id: phase-this-week
    label: This week - pre-vacation (2026-05-26 to 2026-05-31)
    description: Anything that must be true on the laptop and phone for Darrell to use it on vacation.

  - id: phase-week-2
    label: Week 2 - post-return (2026-06-08 to 2026-06-14)
    description: Family added. Christina onboarded. Second-priority workflows.

  - id: phase-month-1
    label: Month 1 - post-vacation hardening (June)
    description: Quality bar, testing, observability, gateway extraction.

  - id: phase-quarter-1
    label: Quarter 1 - sovereignty + scale (Q3 2026)
    description: Headscale migration, second Ollama model, marketing pipeline.

  - id: phase-q4-q1-27
    label: Q4 2026 / Q1 2027 - GPU + Phase 3 local primary
    description: Hardware decision, GPU build, vendor-independence achieved.

items:

  # =========================================================================
  # PHASE: this-week (P0 - vacation gate)
  # =========================================================================

  - id: t-001
    phase: phase-this-week
    priority: P0
    status: shipped
    shipped_at: '2026-05-25'
    title: v2.1-infra schema rename (tenant -> instance) + paired sync libs
    owner: dispatch
    due: '2026-05-25'
    family_visible: false
    notes: Landed in commit a7910db (schema) + cab34f0 (sync libs).

  - id: t-002
    phase: phase-this-week
    priority: P0
    status: shipped
    shipped_at: '2026-05-25'
    title: Inquiries cross-device sync for Christina TLC pipeline
    owner: dispatch
    due: '2026-05-25'
    family_visible: true
    audience: christina
    notes: Lets Christina enter inquiries on laptop and see them on phone. Commit 10181b3. Pre-intake non-PHI only per LEGAL-PRIVACY-BOUNDARY.md.

  - id: t-003
    phase: phase-this-week
    priority: P0
    status: shipped
    shipped_at: '2026-05-25'
    title: n8n + ntfy + Ollama installed on DS1621xs
    owner: darrell
    due: '2026-05-26'
    family_visible: false
    depends_on: []
    notes: All three containers running in /volume1/docker/n8n-stack. SSH key auth, passwordless sudo, docker symlinks all permanent.

  - id: t-004
    phase: phase-this-week
    priority: P0
    status: in_progress
    title: n8n owner-account setup + first import
    owner: darrell
    due: '2026-05-26'
    family_visible: false
    depends_on: [t-003, t-013]
    notes: After secure-cookie fix lands, open http://192.168.1.26:5678/ and create owner account with darrellpoe06@gmail.com. Import the four week-1 workflow JSONs.

  - id: t-005
    phase: phase-this-week
    priority: P0
    status: planned
    title: Pull qwen2.5:3b-instruct-q4_K_M model into Ollama
    owner: darrell
    due: '2026-05-26'
    family_visible: false
    depends_on: [t-003]
    runbook: ssh dpoe@192.168.1.26 "sudo /var/packages/ContainerManager/target/usr/bin/docker exec -i ollama ollama pull qwen2.5:3b-instruct-q4_K_M"
    notes: ~2GB pull, ~3 min on home wifi. Background while doing other tracks.

  - id: t-006
    phase: phase-this-week
    priority: P0
    status: planned
    title: Pushover license + user/app keys
    owner: darrell
    due: '2026-05-27'
    family_visible: false
    depends_on: []
    notes: Install Pushover app on phone, $5 one-time license per platform. Copy user key from app + create PoeTech app token at https://pushover.net. Both go in n8n credentials.

  - id: t-007
    phase: phase-this-week
    priority: P0
    status: planned
    title: ntfy app + topic subscribe on Darrell phone
    owner: darrell
    due: '2026-05-27'
    family_visible: false
    depends_on: [t-003]
    notes: Install ntfy app, server URL http://192.168.1.26:8081, subscribe topic 'darrell'. Free; Tailscale required to reach the server when off-LAN.

  - id: t-008
    phase: phase-this-week
    priority: P0
    status: planned
    title: First n8n workflow active and tested (Pushover smoke test)
    owner: darrell
    due: '2026-05-27'
    family_visible: false
    depends_on: [t-004, t-006]
    notes: Import 04-pushover-smoke-test.json, bind Pushover credential, fire it from n8n UI, confirm phone buzzes. This proves the whole chain works.

  - id: t-009
    phase: phase-this-week
    priority: P0
    status: planned
    title: Daily project digest workflow active (cron 7AM)
    owner: darrell
    due: '2026-05-28'
    family_visible: false
    depends_on: [t-008]
    notes: Import 01-project-timeline-daily.json, activate. First fire 2026-05-29 at 7AM. Sends Pushover digest of what's due that day.

  - id: t-010
    phase: phase-this-week
    priority: P0
    status: planned
    title: Backblaze B2 backup configured
    owner: darrell
    due: '2026-05-29'
    family_visible: false
    notes: Sign up for B2, create bucket, install Hyper Backup in DSM, schedule weekly Sunday 2AM backup of /volume1/docker/. ~$6/mo at 1TB.

  - id: t-011
    phase: phase-this-week
    priority: P0
    status: planned
    title: Backup status alert workflow active
    owner: darrell
    due: '2026-05-29'
    family_visible: false
    depends_on: [t-008, t-010]
    notes: Import 03-b2-backup-status.json. Polls B2 API Monday 6AM, alerts Pushover on success/failure of Sunday's backup.

  - id: t-012
    phase: phase-this-week
    priority: P0
    status: planned
    title: Workflow failure alert workflow active
    owner: darrell
    due: '2026-05-28'
    family_visible: false
    depends_on: [t-008]
    notes: Import 02-workflow-failure-alert.json. Wires to n8n's error trigger. Any other workflow that errors -> Pushover.

  - id: t-013
    phase: phase-this-week
    priority: P0
    status: shipped
    shipped_at: '2026-05-26'
    title: n8n secure-cookie disabled (Tailscale handles TLS)
    owner: dispatch
    due: '2026-05-26'
    family_visible: false
    notes: N8N_SECURE_COOKIE=false in docker-compose.yml. Reasonable since Tailscale encrypts the transport.

  - id: t-014
    phase: phase-this-week
    priority: P0
    status: planned
    title: Tailscale install + sign-in on Darrell's vacation hardware (laptop + phone)
    owner: darrell
    due: '2026-05-30'
    family_visible: false
    notes: From outside the house, verify https://192-168-1-26.poetech.direct.quickconnect.to/poetech-app/ loads AND http://192.168.1.26:5678/ loads via Tailscale.

  - id: t-015
    phase: phase-this-week
    priority: P0
    status: planned
    title: Vacation departure smoke test
    owner: darrell
    due: '2026-05-30'
    family_visible: false
    depends_on: [t-009, t-014]
    notes: From outside the house, confirm app loads, daily digest fires from the hotel, can add a feedback note that syncs back to the laptop next time it opens.

  - id: t-016
    phase: phase-this-week
    priority: P1
    status: planned
    title: Christina sign-in + VerifyBalances walkthrough on her laptop
    owner: christina
    due: '2026-05-30'
    family_visible: true
    audience: christina
    depends_on: [t-002]
    notes: Walks through entities/accounts/debts/rentals confirmation. After completion, sync activates and Christina's inquiries seed Supabase.

  - id: t-017
    phase: phase-this-week
    priority: P1
    status: planned
    title: Christina install PWA on her phone + sign in same Gmail
    owner: christina
    due: '2026-05-30'
    family_visible: true
    audience: christina
    depends_on: [t-016]
    notes: Verifies cross-device sync works for her. Add a test inquiry on phone, watch it appear on laptop.

  # =========================================================================
  # PHASE: week-2 (P1 - family enrollment + second workflows)
  # =========================================================================

  - id: t-101
    phase: phase-week-2
    priority: P1
    status: planned
    title: Family Tailscale enrollment (Christina + kids' devices)
    owner: darrell
    due: '2026-06-09'
    family_visible: true
    audience: family
    notes: Each device gets the Tailscale client + signs into the Personal plan. Family >3 users may need Personal Plus ($5/user/mo) or workaround via shared family-devices account.

  - id: t-102
    phase: phase-week-2
    priority: P1
    status: planned
    title: ntfy topics created for each family member + subscriptions
    owner: darrell
    due: '2026-06-10'
    family_visible: true
    audience: family
    notes: Topics christina, twins-alex, twins-bryce, christiana, family-ops, colg-leadership. Each person installs ntfy and subscribes to their own.

  - id: t-103
    phase: phase-week-2
    priority: P1
    status: planned
    title: Week-2 workflow - renter maintenance request received
    owner: darrell
    due: '2026-06-11'
    family_visible: true
    audience: family
    depends_on: [t-101, t-102]
    notes: Supabase trigger on maintenance_requests insert -> n8n -> Pushover to Darrell + ntfy to family-ops + suggest assignee per IDENTITY-ROLES-AUDIT.md.

  - id: t-104
    phase: phase-week-2
    priority: P1
    status: planned
    title: Week-2 workflow - new donor giving recorded
    owner: darrell
    due: '2026-06-12'
    family_visible: false
    depends_on: [t-103]
    notes: Trigger on donor_giving insert (when church schema lands) -> ntfy colg-leadership + queue tax-statement update.

  - id: t-105
    phase: phase-week-2
    priority: P1
    status: planned
    title: Week-2 workflow - TLC inquiry intake routing
    owner: christina
    due: '2026-06-13'
    family_visible: true
    audience: christina
    depends_on: [t-002, t-101]
    notes: Trigger on inquiries insert -> ntfy christina + suggest clinician per acuity + preferred_provider.

  - id: t-106
    phase: phase-week-2
    priority: P1
    status: planned
    title: PWA zero-click auto-update shipped (commit + deploy)
    owner: darrell
    due: '2026-06-09'
    family_visible: true
    notes: app/src/main.jsx already edited 2026-05-25; needs commit + deploy. Eliminates 'tap to update' for family.

  # =========================================================================
  # PHASE: month-1 (P2 - hardening, gateway, observability)
  # =========================================================================

  - id: t-201
    phase: phase-month-1
    priority: P2
    status: planned
    title: Thin Node LLM gateway extraction (Phase 1 of AI workup)
    owner: dispatch
    due: '2026-06-21'
    family_visible: false
    notes: Move system-prompt enforcement + drift tests + scripture-version lookup out of n8n into a dedicated Node service. Better testability, better latency. Per _future/AI-INFRASTRUCTURE-SYNOLOGY.md Phase 1.

  - id: t-202
    phase: phase-month-1
    priority: P2
    status: planned
    title: Counseling PIN-encryption boundary decision (open Q5 from AI workup)
    owner: darrell
    due: '2026-06-15'
    family_visible: false
    notes: Decide whether the Synology gateway sees plaintext journal content, or whether AES-GCM extends through the API call. Must be settled before Phase 1 gateway ships.

  - id: t-203
    phase: phase-month-1
    priority: P2
    status: planned
    title: In-app Dev/Ops dashboard build
    owner: dispatch
    due: '2026-06-25'
    family_visible: true
    audience: family
    notes: Latency, model availability, queue depth, last backup, sync health. Mobile-readable. Pair with Uptime Kuma install.

  - id: t-204
    phase: phase-month-1
    priority: P2
    status: planned
    title: Uptime Kuma installed alongside n8n
    owner: darrell
    due: '2026-06-20'
    family_visible: false
    notes: Single container, up/down checks for app + n8n + ntfy + Ollama + Supabase. Pushover on transitions.

  - id: t-205
    phase: phase-month-1
    priority: P2
    status: planned
    title: Pass 3 xlsx reconciliation against Poe_Family_Financial_Control_System_v1.xlsx
    owner: dispatch
    due: '2026-06-30'
    family_visible: false
    notes: Drive ID 1NrIu796vnSRoKtGYsbs7C2HVyOsAUMAo. Compare app outputs against the family's real spreadsheet numbers. Discrepancies are real bugs.

  - id: t-206
    phase: phase-month-1
    priority: P2
    status: planned
    title: Pass 4 - show-your-work tooltips on every consequential number
    owner: dispatch
    due: '2026-06-30'
    family_visible: true
    notes: Every projection gets a (?) disclosure showing formula + inputs + assumptions.

  - id: t-207
    phase: phase-month-1
    priority: P2
    status: planned
    title: Switch n8n backend from SQLite to Supabase Postgres
    owner: darrell
    due: '2026-06-28'
    family_visible: false
    depends_on: [t-201]
    notes: Per eval doc 'Post-vacation' section. Reduces backup surface to one DB. Requires CREATE SCHEMA n8n in Supabase first.

  # =========================================================================
  # PHASE: quarter-1 (P2 - sovereignty + scale)
  # =========================================================================

  - id: t-301
    phase: phase-quarter-1
    priority: P2
    status: planned
    title: Headscale migration evaluation (retire Tailscale vendor dep)
    owner: darrell
    due: '2026-08-15'
    family_visible: false
    notes: Trigger - family-user count drives Tailscale Personal Plus past $30/mo, OR sovereignty arc reaches the point where vendor deps should retire. Half-day install on DS1621xs.

  - id: t-302
    phase: phase-quarter-1
    priority: P2
    status: planned
    title: Marketing pipeline for Christina TLC
    owner: dispatch
    due: '2026-09-15'
    family_visible: true
    audience: christina
    notes: Per _future/MARKETING-PIPELINE-NOTES.md. n8n workflows that schedule social posts, draft outreach to referrers, follow up on inquiries. Owner-operator pattern; no autonomous sends without approval.

  - id: t-303
    phase: phase-quarter-1
    priority: P3
    status: planned
    title: Second Ollama model loaded (specialization router Phase 2)
    owner: dispatch
    due: '2026-09-30'
    family_visible: false
    depends_on: [t-301]
    notes: Audit/classifier on model A, main response on model B. Specialization router routes per task. Per AI workup Phase 2.

  # =========================================================================
  # PHASE: Q4 2026 / Q1 2027 - GPU + Phase 3
  # =========================================================================

  - id: t-401
    phase: phase-q4-q1-27
    priority: P2
    status: planned
    title: Dual RTX 3090 GPU box decision + purchase
    owner: darrell
    due: '2027-03-31'
    family_visible: false
    notes: Per _future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md Option 2. ~$2000 one-time. Unlocks Phase 3 local-primary with conversational latency.

  - id: t-402
    phase: phase-q4-q1-27
    priority: P2
    status: planned
    title: Phase 3 - local open-weights model serves primary Counseling response
    owner: dispatch
    due: '2027-04-30'
    family_visible: false
    depends_on: [t-401]
    notes: Llama-3.1-8B or Qwen2.5-7B. Anthropic becomes optional opt-in fallback. Vendor-independence achieved (the binding principle).

  - id: t-403
    phase: phase-q4-q1-27
    priority: P3
    status: planned
    title: Phase 4 specialization router across parallel models
    owner: dispatch
    due: '2027-06-30'
    family_visible: false
    depends_on: [t-402]
    notes: Router-based specialization (Interpretation #2 from AI workup). Two GPUs = two simultaneous specialist models.

---

# Project Timeline - Narrative

This document is the single source of truth for what ships when. The YAML above is consumed by `docs/00-foundations/n8n-workflows/01-project-timeline-daily.json` at 7AM each morning; the prose below is for humans reading on GitHub or in their editor.

## The "begin and not stop until done" loop

The n8n daily-digest workflow reads this file each morning, identifies what's `in_progress` or due in the next 48 hours, and sends:

- **Pushover to Darrell** — full operator digest of everything due, blocked, or in flight
- **ntfy to family-ops topic** — anything marked `family_visible: true`
- **ntfy to per-person topics** — items with an explicit `audience: christina | family | colg-leadership` get pushed to that person's topic

This means the workflow nags us until items move to `shipped`. When everything in `phase-this-week` is shipped, the digest goes quiet for that phase. The system runs continuously without intervention.

## Phases at a glance

**This week (pre-vacation, P0 — 2026-05-26 to 2026-05-31):**
Schema rename ✓. Inquiries sync ✓. n8n installed ✓. Owner setup + Pushover/ntfy phone wiring + 4 workflows + Backblaze B2 + Tailscale on vacation hardware + Christina sign-in. This is the gate for vacation being usable.

**Week 2 (post-return, P1 — 2026-06-08 to 2026-06-14):**
Family Tailscale enrollment. ntfy per-person topics. Three more workflows (renter maintenance, donor giving, TLC inquiry routing). PWA auto-update commit.

**Month 1 (June, P2):**
Phase 1 LLM gateway extraction. Counseling PIN-encryption decision. In-app Dev/Ops dashboard. Uptime Kuma. Pass 3 xlsx reconciliation. Pass 4 show-your-work tooltips. Switch n8n backend from SQLite to Supabase Postgres.

**Quarter 1 (Q3 2026):**
Headscale migration if Tailscale cost climbs. Marketing pipeline for TLC. Second Ollama model (specialization router).

**Q4 2026 / Q1 2027:**
GPU box decision + purchase. Phase 3 local-primary (vendor-independence achieved). Phase 4 parallel-model specialization router.

## How to update this file

1. **Mark an item shipped:** change `status: planned` (or `in_progress`) to `status: shipped`, add `shipped_at: 'YYYY-MM-DD'`.
2. **Re-prioritize:** change `priority` and `due`.
3. **Add a new item:** append to the appropriate phase. Give it a fresh `id` (next number in sequence). n8n picks it up at the next 7AM run.
4. **Defer:** change status to `deferred`. It stops appearing in the daily digest until you change it back.

Commit any update. n8n fetches this file fresh from GitHub each morning.

## Audience routing

Items can carry an `audience` field that tells n8n which ntfy topic to push:

- `audience: darrell` — Darrell only (also gets Pushover)
- `audience: christina` — TLC clinical decisions, Practice tab work
- `audience: family` — family-ops topic
- `audience: colg-leadership` — church operations
- `audience: dispatch` — internal note that Dispatch is the owner; usually no notification

If no `audience` is set but `family_visible: true`, defaults to `family-ops`. If neither is set, it's operator-only (Pushover to Darrell).

---

*This timeline is binding for what we ship. The schema doc, the eval doc, and the AI workup are the inputs to it; this is the output — what actually happens, when, and who knows.*
