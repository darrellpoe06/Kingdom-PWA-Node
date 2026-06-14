# Legal Module Spec — A Law Firm on PoeTech (First Concrete Ring-3 Tenant)

**Date:** 2026-06-09 (Tue)
**Author:** Claude (module spec on Darrell's commission — recording decisions already discussed and agreed in chat)
**Status:** PLAN / spec doc. **No code, no purchases, no money movement, no autonomous execution.** Target module architecture only.
**Decision records:** DR-0022 (Legal Module = first Ring-3 tenant + dogfood), DR-0023 (HIGHEST confidentiality tier + sovereign-is-the-selling-point), DR-0024 (LLM behind heavy guardrails, lawyer owns all output), DR-0025 (reusable role-module template) — see `docs/decisions/INDEX.md`.
**Parent strategy:** `2026-06-09-poetech-market-strategy-workforce-three-ring.md` (this is the **first concrete Ring-3 / business vertical**).
**Lawyer-facing companion:** `2026-06-09-trevor-real-estate-lawyer-review-package.md`.
**Builds on (verified in-repo patterns, not from scratch):** the `external_users` / `interactions` / `external_invite_tokens` portal pattern, the `events` calendar table, the `rentals` / `maintenance_requests` request-lifecycle shape, `report_runs` / `report_snapshots`, the Cage (`infra/ai-orchestrator/`), and the identity layer. Isolation-tier model mirrors the **TLC ISO-1** PHI firewall.
**Reads through:** `DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `MODULAR-EXTENSIBILITY.md` / `MULTI-INSTANCE-STRATEGY.md` (one codebase, many instances), `QUALITY-GATEKEEPER.md`, and `CLAUDE.md` Layer 0.

---

## TL;DR (read this first)

1. **The first concrete Ring-3 (business) tenant is a law firm running its entire practice on PoeTech** (§1). It also serves **PoeTech's own legal needs** — we **dogfood** the module on ourselves.
2. **Confidentiality tier = HIGHEST** (§2). **Attorney-client privilege** is treated like TLC's HIPAA tier: top-isolation, **strict per-client + per-matter segregation**, and **conflict-of-interest checks**. This is the most sensitive non-clinical tier on the platform.
3. **Sovereign-IS-the-selling-point** (§3). Self-hosted; **client data never leaves the firm's control.** This is a confidentiality pitch **no cloud SaaS can match** — and it is the reason a privilege-bound firm would choose PoeTech.
4. **Practice features map onto existing modules** (§4) — intake, scheduling (calendar), matter/case management, secure documents + messaging, time-tracking + billing (payments rail), identity/SSO. We **extend**, we don't rebuild.
5. **LLM assist sits behind HEAVY guardrails** (§5): research, drafting, intake triage, doc organization — but **the lawyer owns ALL advice and output.** No unauthorized practice of law; the **LLM never advises a client directly**; **mandatory human review** (hallucination is dangerous in legal); **no client data crosses matters or clients.**
6. **It ships as a reusable SKOS "law firm" role-module template** (§6) — the next firm onboards in **days**, per the one-codebase-many-instances model.

---

## 1. What this is

A **law firm** is the **first concrete tenant of Ring 3** (the business ring in `2026-06-09-poetech-market-strategy-workforce-three-ring.md`). The firm runs its **entire practice on PoeTech** — intake, scheduling, matters, documents, messaging, billing, identity — on a sovereign, self-hosted instance.

It does double duty:

- **It is a paying Ring-3 business tenant** (proving the business model on a real, high-value vertical).
- **It serves PoeTech's own legal needs** — so we **dogfood** the module. We use what we sell; the firm that runs on PoeTech is also the firm PoeTech relies on. Eating our own cooking surfaces the rough edges before a third-party firm ever sees them.

This is recorded as **DR-0022**.

---

## 2. Confidentiality tier — HIGHEST

Legal work is bound by **attorney-client privilege**. On the PoeTech isolation model, this is treated as the **highest confidentiality tier**, directly analogous to **TLC's HIPAA / ISO-1 PHI firewall** — the most protected tier on the platform.

Concretely:

- **Top-isolation.** The Legal instance is walled at the strongest tier; its data does not commingle with other tenants' data.
- **Strict per-client segregation.** Each client's data is isolated from every other client's.
- **Strict per-matter segregation.** Within a client, each *matter* (case) is segregated — an attorney or assistant working Matter A does not, by default, see Matter B's privileged material.
- **Conflict-of-interest checks.** The system supports **conflict-of-interest checking** at intake and at assignment — a structural requirement of legal practice, not an add-on. (A new client/matter is screened against existing clients/matters for conflicts before the firm takes it on.)

> **Why this rigor:** a privilege breach is catastrophic — it can waive privilege, sanction the lawyer, and harm the client irreparably. The tier is built to the same seriousness as PHI. This is recorded as **DR-0023**.

The RLS / isolation primitives that wall TLC clinical data (`user_in_instance` scoping, the per-instance isolation tier) are the proven mechanism reused here, with **per-matter** scoping added on top of **per-client** scoping.

---

## 3. Sovereign IS the selling point

For a privilege-bound firm, the strongest possible confidentiality claim is **"your clients' data never leaves your control."** PoeTech is self-hosted on the firm's own sovereign node (NAS + the Tailscale mesh, the same architecture as the church sovereign node). **No cloud SaaS legal-practice product can make that claim** — their model is, by definition, client data on the vendor's infrastructure with contractual (not structural) sovereignty.

This is the pitch:

- **Structural sovereignty, not contractual.** The data is on the firm's box, under the firm's control — not on a vendor's servers governed only by a privacy policy.
- **The confidentiality story is the differentiator.** It is precisely the thing a SaaS competitor cannot offer, and precisely the thing a privilege-bound lawyer cares most about.
- **Consistent with the platform spine** (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`): sovereign, exportable, no advertising model, no engagement optimization. The structural difference *is* the moat.

Sovereignty being the selling point is recorded as part of **DR-0023**.

---

## 4. Practice features mapped to existing modules

We build on what already exists in the repo. Each practice need maps to a proven PoeTech pattern:

| Practice need | Maps to existing PoeTech pattern |
|---|---|
| **Client intake** | The `external_users` + `external_invite_tokens` + `interactions` portal pattern (the proven registration / intake engine). A prospective client is an `external_user`; intake triage runs at this seam. |
| **Consultation scheduling** | The **calendar module** (the `events` table — `event_date`, `event_time`, `recurrence_rule`, `lifecycle`). Consultations are calendar entries scoped to the matter. |
| **Matter / case management** | A matter is the unit of work — modeled on the request-lifecycle shape proven by `rentals` / `maintenance_requests` (status lifecycle, assignment, links), extended with per-matter isolation and conflict metadata. |
| **Secure documents + messaging** | The `interactions` bidirectional message/status/file log (already supports files + visibility scoping) + the in-app messaging layer, both **walled at the HIGHEST tier**. |
| **Time tracking + billing** | The **payments rail** (the same established-platform integration from the workforce strategy, §3.2 there) for invoicing and collection; `report_runs` / `report_snapshots` for billing rollups. **No money rail is built in-house.** |
| **Identity / SSO** | The platform identity layer — staff/attorneys on the firm's sovereign domain; clients via the consumer-OIDC + multi-anchor model, federated into the sovereign store. |

The principle (`MODULAR-EXTENSIBILITY.md`): **extend the proven substrate, don't rebuild.** The Legal Module is a configuration + a small set of legal-specific extensions (matters, conflicts, privilege tier) on top of modules that already exist.

---

## 5. LLM assist — behind HEAVY guardrails

The LLMs assist the practice, but **the lawyer owns all advice and all output.** This is the bright line, and it is non-negotiable.

**What the LLM may do (assistive, internal):**

- **Legal research** (surfacing authorities for the lawyer to evaluate)
- **Drafting** (first drafts for the lawyer to review, correct, and own)
- **Intake triage** (routing and summarizing prospective-client inquiries for the lawyer)
- **Document organization** (sorting, tagging, summarizing the matter's documents)

**The binding guardrails:**

1. **The lawyer owns ALL advice and output.** Nothing the LLM produces is advice until a licensed attorney has reviewed, corrected, and adopted it.
2. **No unauthorized practice of law (UPL).** The LLM is a tool the lawyer uses; it is never itself "practicing."
3. **The LLM never advises a client directly.** All LLM output flows *to the lawyer*, never straight to the client. There is no client-facing "ask the AI for legal advice" surface.
4. **Mandatory human review.** Every LLM output that touches a matter is reviewed by the attorney before use. **Hallucination is especially dangerous in legal** (fabricated citations, wrong holdings) — the human review is the safeguard, and it is mandatory, not optional.
5. **No client data crosses matters or clients.** The LLM's context for a given task is strictly scoped to the one matter/client; it cannot pull from, or leak into, another client's or matter's data. The per-matter / per-client segregation (§2) is enforced at the LLM boundary too.

These guardrails are enforced behind the **Cage** (`infra/ai-orchestrator/`) — allowlisted actions, audit ledger, human-escalation — and the **Quality Gatekeeper** posture (`QUALITY-GATEKEEPER.md`) applies to every generated draft. Recorded as **DR-0024**.

---

## 6. Reusable "law firm" role-module template

The Legal Module is built once as a **SKOS role-module template**, so that **the next law firm onboards in days, not months** — per the one-codebase-many-instances model (`MODULAR-EXTENSIBILITY.md`, `MULTI-INSTANCE-STRATEGY.md`).

- **Config-driven.** Firm-specific values (practice areas, attorney roster, matter types, billing rates, conflict lists) are configuration, not code.
- **The legal-specific extensions are reusable.** Matters, conflict-of-interest checks, the privilege tier, and the LLM guardrails are written once and instantiated per firm.
- **The same shape as the church and business templates.** A law firm is one more entity instance at its own isolation tier — the same multi-instance pattern that the church node, Poe Properties, and other Ring-3 verticals follow.

Recorded as **DR-0025**.

---

## 7. Decision record + rationale

Per `feedback-decisions-with-rationale`. Full DRs in `docs/decisions/INDEX.md`.

| # | Decision | Rationale |
|---|---|---|
| **DR-0022** | The **first concrete Ring-3 tenant is a law firm on PoeTech**, which also **serves PoeTech's own legal needs (dogfood).** | A high-value vertical proves the business model; using the module on ourselves surfaces rough edges before a third-party firm sees them. |
| **DR-0023** | **Confidentiality = HIGHEST tier** (privilege treated like the TLC HIPAA tier: per-client + per-matter segregation + conflict checks); **sovereignty is the selling point** (data never leaves the firm's control — a claim no cloud SaaS can match). | Privilege breach is catastrophic; the tier must match PHI seriousness. Structural sovereignty is precisely the differentiator SaaS competitors cannot offer a privilege-bound firm. |
| **DR-0024** | **LLM assist behind heavy guardrails:** lawyer owns all output; no UPL; LLM never advises clients directly; mandatory human review; no client data crosses matters/clients. | Hallucination is dangerous in legal; the human-review safeguard and strict scoping prevent both malpractice exposure and privilege leakage. |
| **DR-0025** | Build a **reusable SKOS "law firm" role-module template** so the next firm onboards in days. | Consistent with the one-codebase-many-instances model; the legal-specific extensions are written once and instantiated per firm. |

---

## 8. Guardrails on this document

- **This is a PLAN / spec.** No code, no purchases, no money movement flow from it.
- **The HIGHEST-tier isolation is a hard requirement, not aspirational** — no Legal instance ships without per-client + per-matter segregation and the LLM-boundary scoping verified.
- **The Test (`MIND-OF-CHRIST.md`) was run against this output** before delivery: true, honorable, just, aligned with serve-not-extract.
