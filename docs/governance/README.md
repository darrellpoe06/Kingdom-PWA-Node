# Governance Directory

**Purpose.** This directory holds the source-of-truth governance configuration for the PoeTech sovereign AI system: the pre-authorized policy declarations and the Open Policy Agent (OPA) Rego policies that authorize, deny, or escalate every action an AI bot-team takes. It is the repo-side mirror of the **NAS-resident governance point** — the always-on Synology DS1621xs+ that holds the policy while vendor LLMs (and sovereign Ollama models) consult it.

**Why it exists (per `project_nas_as_governance_point`).** The governance authority does not live inside any single agent or any single vendor's cloud. The agent reasons and decides to call a tool; the policy engine — running on hardware the family owns — evaluates that call against these policies and returns Allow / Deny / Escalate. This is what makes the "always-now viable fix" pattern safe: pre-authorized fix classes execute without pinging Darrell each time, and everything outside the pre-authorized set escalates. Darrell governs the policy; the NAS governs operations; the bot-teams do the work. The structural separation is the point — it stops the constraint-and-blind-spot re-litigation cycle without surrendering control.

**The keystone adoption.** Per the consolidated AI-work-processes extract (`docs/99-session-notes/2026-06-02-consolidated-ai-work-processes-repos-skills-extract.md`, Section 1), OPA + NAS-resident Rego is the single highest-leverage adoption in the queue. Every other sovereign-team capability (per-industry LLM teams, the autonomous builder, voice surfaces, the media pipeline, multi-tenant onboarding) depends on a NAS-resident policy point that authorizes actions without re-asking.

## What lives here

| Path | What it is |
| --- | --- |
| `README.md` | This index. |
| `pre-authorized-policies.yaml` | The human-readable policy declaration: bright lines (never auto-promote), pre-authorized fix classes, pre-authorized drafting, escalation patterns, per-team config, routing, the weekly adaptation loop, and observability topics. Drafted per Section 5 of the consolidated extract. |
| `opa/policies/family-finance.rego` | Starter Rego for the Family-Finance bot-team. |
| `opa/policies/church-ops.rego` | Starter Rego for the Church-Ops bot-team (COLG). |
| `opa/policies/dev-ops.rego` | Starter Rego for the Dev-Ops bot-team. |
| `opa/policies/wellness-counseling.rego` | Starter Rego for the Counseling bot-team — strictest TLC firewall. |

These Rego files are **skeletons**. They encode the intent and the structure (allow / deny / escalate decision points per team), not an exhaustive ruleset. They are the substrate that wf27 (Foundation Agent) and wf36 (Quality Gatekeeper) read once the NAS-apply step lands. The `pre-authorized-policies.yaml` file is the senior human-readable declaration; the Rego files operationalize it for the OPA engine.

## How it gets deployed to the NAS

The source of truth is here in the repo (versioned, reviewable, diffable). It materializes on the NAS at `/volume1/PoeTech/governance/`:

```
/volume1/PoeTech/governance/
  pre-authorized-policies.yaml        <- read by wf27, wf36, and every team
  opa/policies/*.rego                 <- loaded by the OPA container
  .git/                               <- git mirror for versioning on the NAS
```

Deployment is a one-direction sync from this repo directory to the NAS path, followed by an OPA policy reload. The apply step is intentionally **not** in this batch — it requires the NAS, which is out of scope for repo-only substrate work. When convenient, Darrell runs a small sync-and-reload script (the agent will provide a self-contained PowerShell block per the binding desktop-paste rule) that:

1. Copies `docs/governance/` from the repo to `/volume1/PoeTech/governance/` on the NAS (`192.168.1.26`, user `dpoe`).
2. Reloads the OPA container so the new Rego policies take effect.
3. Confirms wf27 and wf36 can read `pre-authorized-policies.yaml` from the bind-mounted path.

Until that apply step runs, these files are declared substrate, not live policy. That distinction is intentional and honest: the governance config exists and is reviewable; it is not yet enforcing.

## Authority chain

Policy here is junior to the binding rules above it and senior to operational discretion below it:

1. `CLAUDE.md` (Layer 0 binding rules at the repo level)
2. `docs/00-foundations/_root/*.md` (Layer 3 foundation principles)
3. `memory/*.md` (declared bindings from prior sessions)
4. **This directory** (operational pre-authorization)

The bright lines in `pre-authorized-policies.yaml` — clinical/TLC data, money movement, credential changes, irreversible OS actions, minor-protected data streams, and the family's theological voice — are never auto-promoted regardless of approval history. They are restatements at the policy layer of constraints that already bind at the foundation layer.
