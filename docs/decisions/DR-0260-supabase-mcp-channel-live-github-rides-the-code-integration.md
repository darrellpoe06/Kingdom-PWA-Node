---
id: DR-0260
title: The Supabase MCP channel is live (read-first; writes stay in the migration lane) — GitHub rides the Code integration, not the connector marketplace
status: accepted
date: 2026-08-01
tier: B
declared_by: Darrell (2026-08-01 phone screenshots: "cant connect to GitHub..." + Supabase authorized)
supersedes: none
builds_on: [DR-0108 (review our ways — access paths), DR-0249 (insights from data all the time; the remote-hands channel), DR-0076 (verification doctrine), DR-0217/REV-0217 (DB changes ride the migration lane + matrix), DR-0259 (every review lands as documentation)]
principles: [VERIFICATION-DOCTRINE, MACHINERY-OVER-MEMORY, DATA-AS-EMPOWERMENT]
---

## Context

Darrell, 2026-08-01, four phone screenshots: he authorized the **Supabase
connector** on claude.ai (org PoeTech — it shows Connected, and the Supabase
MCP tools went live in the working session the same minute), and searched
**"GitHub" in Browse connectors and found nothing** — "cant connect to
GitHub..."

## The facts (verified, DR-0100 tier 1)

1. **GitHub is deliberately absent from the claude.ai connector marketplace**
   (researched via the guide agent; tracked upstream and closed "not
   planned"). GitHub access for our work rides the **Claude Code
   integration** (the Claude GitHub App + the sessions' GitHub tools) — and
   it is ALREADY live and working: this same day two PRs (#1153, #1154) were
   pushed, opened, auto-merged, and deploy-verified through it. Nothing in
   the delivery lane is broken; there is nothing to fix. Repo work from the
   phone happens by opening a **claude.ai/code** session (GitHub arrives
   automatically there), not by hunting a chat connector.
2. **The Supabase MCP channel is a NEW WAY** (DR-0108: access paths are
   reviewed and recorded). Scope granted: read+write on Database / Edge
   Functions / Environment / Projects; read on Secrets / Organizations /
   Analytics / Storage — org PoeTech, project PoeTech-Family-OS
   (mjjlevhdufpaplypnqrv, us-east-2, Postgres 17).

## Decision — the rails for the new channel

1. **Read-first standing use.** Advisors, logs, live queries for the DR-0249
   insight duty, and evidence for reviews — the channel turns former
   "dashboard sitting" items into channel-drivable checks.
2. **Writes stay in the migration lane.** Schema/DDL changes continue to ship
   as repo migrations through CI and the isolation matrix (REV-0217) — the
   MCP write scope is NOT a license for ad-hoc production DDL from chat. An
   ad-hoc write would bypass every gate the Ways built; the lane IS the
   protection (DR-0076).
3. **No automation may depend on this channel.** Interactively-authenticated
   connectors are absent in headless/cron runs — Routines and NAS loops keep
   their own credentials (DR-0249's remote-hands channel).

## First fruit — the live advisors baseline (measured 2026-08-01)

`get_advisors(security)` on the real project: **0 ERROR · 175 WARN · 5
INFO.** By class: security-definer functions executable by `anon` (71) and by
`authenticated` (85) — many are the forced-safe capture RPCs by design, but
the set has never been triaged as a set; `function_search_path_mutable` (15);
`auth_leaked_password_protection` disabled (1); `rls_policy_always_true` (3
WARN); RLS-enabled-no-policy (5 INFO). **Work queue:** triage the
security-definer roster against the intended forced-safe list, pin
search_path on the 15, decide leaked-password protection, and read the 3
always-true policies — **re-review: 2026-08-07** with the DR-0258 carried
items (the Supabase auth redirect allow-list for `/lovecorner/app/` rides the
same sitting, now channel-checkable).
