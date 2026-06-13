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

### OPEN-4 · Apply the governance point to the NAS
- **Unblocks:** the bot-teams + pre-authorized auto-execution (the whole `pre-authorized-policies.yaml` becomes *live* policy instead of declared substrate), and the NAS-resident ntfy escalation queue that replaces this markdown.
- **Needs:** the local agent runs a sync-and-reload (repo `docs/governance/` → `/volume1/PoeTech/governance/` + OPA reload). I'll provide the PowerShell block.
- **Track:** local agent. **Tier C.**
- `DECISION:` _____

### OPEN-5 · Credentials I need (bright-line — only you)
- **`ANTHROPIC_API_KEY`** → turns on the read-only Synthesizer (DR-0055).
- **Gemini API key** → the vendor side of the head-to-head (DR-0063) + the `fresh_knowledge` route.
- **Gmail reconnect** → the banking-on-autopilot lane has an expired Gmail credential silently failing; one reconnect heals it.
- `DECISION:` _____ (which, if any, to provision now)

### OPEN-6 · n8n Code-node HTTP sweep (local-agent track)
- **Unblocks:** fixes wf30 ntfy (and any sibling) silently broken by `fetch`/`require('http')` in the Code-node sandbox; the working pattern is `this.helpers.httpRequest` (P17).
- **Track:** local agent (needs the NAS to apply/test). Low-risk, but can't be done from the cloud.
- `DECISION:` _____

---

## BUILD BACKLOG — what I'll work down on my own

Darrell (2026-06-13): *"What would you like in the build backlog is whatever makes sense, we'll adjust from there."* So this is my proposed order — all **in-app**, on **real data** (DR-0065 / DR-0061), each buildable without blocking on you. I work top-down and ship green (DR-0064); you reorder or strike anything here, same as the OPEN items. Bright-line or fork items still stop and surface (they're up in OPEN).

1. **Personal project assignment** (= OPEN-2) — assign a project to a family member so it lands in *their* "Mine" list, not just the creator's. Default model: shared-but-filtered (my OPEN-2 rec). Small migration + an assignee picker on the project card. *Highest value: completes the per-user story already live.*
2. **Project "next step / what's blocking" field** — each project card shows its next action and any blocker, so the list answers what·when·why·how at a glance (ANXIETY-CLARITY). In-app, real data on the project record.
3. **Reorder works with filters on** — today hand-reorder is gated to an unfiltered list (so ranks map 1:1). Make it do relative moves within a filtered view without scrambling hidden rows. Polish on the live reprioritize feature.
4. **Decisions tab → Build board tie-in** — surface the open-decision count on the Build-transparency board so the governance queue is visible alongside the build, one glance.
5. **"Recently shipped" continuity strip (in-app)** — a real, build-stamped list of what landed recently (from the build markers already injected at deploy), so the user sees live momentum, not a static roadmap. Reality-traced to real deploy data.

*Adjust freely — strike, reorder, or add. I'll start at the top and report each as it ships.*

---

## DECIDED — history

_(Decided items move here with the date and outcome, so the queue stays short and the record stays.)_

- _none yet_
