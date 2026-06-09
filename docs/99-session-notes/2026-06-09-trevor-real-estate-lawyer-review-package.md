# Review Package for Trevor (Real-Estate Counsel) — PoeTech Legal Module & Firm-on-PoeTech Model

**Date:** 2026-06-09 (Tue)
**Prepared by:** Claude, for Darrell Poe
**For:** Trevor — Darrell's real-estate attorney
**Status:** PLAN / review package. A clean, lawyer-facing summary for Trevor to react to. **Nothing has been built, purchased, or executed; no money has moved.** This document seeks legal review and direction, not approval to act.
**Companion docs:** `2026-06-09-poetech-market-strategy-workforce-three-ring.md`, `2026-06-09-legal-module-spec.md`.
**Decision record:** DR-0026 (Trevor review scope + the employment-law scope flag) — see `docs/decisions/INDEX.md`.

---

## 0. Plain-English purpose of this document

Trevor — Darrell is building **PoeTech**, a sovereign (self-hosted) software platform. One piece of it is a **Legal Module**: software a law firm could use to run its entire practice on its own infrastructure. Two flows in particular touch areas where your real-estate eye matters, and Darrell wants your review before anything is built.

This document gives you (1) what's being proposed, (2) the confidentiality / privilege model, (3) the **specific spots where your input is needed**, (4) an **explicit scope flag** on one question that should go to a *different* kind of lawyer, and (5) a short list of review questions.

There is no urgency-to-sign here and nothing to approve today. This is a request for your read and your direction.

---

## 1. What PoeTech is proposing

**PoeTech** is a self-hosted software platform. Unlike typical cloud software (where a vendor holds your data on their servers), PoeTech runs on hardware the client controls, so **the client's data never leaves the client's control.**

Two relevant pieces:

### 1a. The Legal Module (software for a law firm)

Software that lets a law firm run its practice on PoeTech: client intake, consultation scheduling, matter/case management, secure documents and messaging, time-tracking and billing, and identity/login. It is designed for the firm to host on its **own** infrastructure.

### 1b. The "firm on PoeTech" model

A law firm would run its day-to-day practice on this module. PoeTech would also use the same module for **its own** legal needs (i.e., we use what we build). The first such firm is both a customer and a working example.

### 1c. The sovereignty pitch (why a firm would want this)

Because the firm hosts its own data, PoeTech can offer a confidentiality claim that cloud-based legal software **cannot**: *the firm's client data never leaves the firm's control.* For a practice bound by confidentiality duties, that structural difference is the selling point.

---

## 2. The privilege / confidentiality model

The Legal Module treats client confidentiality at the **highest** protection tier the platform offers — the same seriousness PoeTech applies to protected health information elsewhere in the platform. Concretely:

- **Strict per-client separation** — one client's data is walled off from every other client's.
- **Strict per-matter separation** — within a client, each matter (case) is separated, so work on one matter does not expose another.
- **Conflict-of-interest checking** — the system supports screening a prospective client/matter against existing clients/matters before the firm takes the engagement.
- **Self-hosted / sovereign** — the data sits on the firm's own controlled infrastructure, not a software vendor's servers.
- **AI assistance is tightly fenced** — any AI features (research, first-draft documents, intake triage, document organization) produce output **only to the attorney**, never directly to a client; **a human attorney must review everything**; and the attorney owns all advice and output. The AI never "practices law" and never crosses one client's or matter's data into another's.

**Darrell wants your read on whether this model is sound from a practitioner's standpoint** and whether anything in it raises a flag you'd want addressed before a firm relies on it.

---

## 3. Where your real-estate eye specifically matters

Two areas fall squarely in your lane, and these are the reasons Darrell is bringing this to you:

### 3a. Real-estate / Poe Properties legal flows

Poe Properties (Darrell's rental/real-estate entity) is being brought onto PoeTech for **tenant communication, service requests, work orders, and dispatch tickets.** This touches landlord-tenant matters, lease/rental documentation, the records the system keeps of tenant interactions and maintenance, and how those records would hold up if a dispute arose.

**Your input:** Are there real-estate / landlord-tenant legal considerations (Illinois-specific where relevant) we should design for now — disclosures, record-keeping, notice requirements, tenant-data handling, anything that affects how these flows should work?

### 3b. The contractor-agreement approach

PoeTech plans to engage workers as **independent contractors (1099)** to deliver work (including property and build tasks), with a standard contractor agreement and a documentation trail. **The *form and substance of the contractor agreement itself*** is something Darrell would value your eye on — its structure, the records it should require, and how it interacts with real-estate/property work you're already familiar with.

> **Important boundary on 3b — see §4.** The *agreement document* is in scope for you. The *legal question of whether these workers are properly classified as 1099 vs. employees* is **not** — that goes to employment counsel.

---

## 4. EXPLICIT SCOPE FLAG — what does NOT go to you

**The worker-classification question (1099 contractor vs. W-2 employee) is employment-and-labor law and must go to an employment attorney — not to you.**

Darrell wants this stated plainly so there's no confusion: you are his **real-estate** counsel. Determining whether PoeTech's workers are correctly classified as independent contractors under federal and **Illinois** law is an **employment/labor** question with its own tests, penalties, and state-specific rules. Routing that determination to real-estate counsel would not serve Darrell well.

**The ask of you on this point is narrow and optional:** if you're comfortable doing so, **a referral to an employment-and-labor attorney** would be welcome. Beyond a referral, the classification question itself is out of scope for this review.

This scope split is recorded as **DR-0021** (in the market-strategy doc) and **DR-0026** (this package).

---

## 5. Review questions for Trevor

A short list to react to:

1. **Privilege model:** From a practitioner's standpoint, is the per-client / per-matter separation + conflict-checking + self-hosting model sound? Anything you'd flag before a firm relies on it?
2. **AI guardrails:** Are the AI fences (attorney owns all output, mandatory human review, never client-facing, no cross-matter data) sufficient to keep clear of unauthorized-practice and competence/confidentiality concerns?
3. **Poe Properties flows:** What real-estate / landlord-tenant considerations (Illinois where relevant) should the tenant-communication, service-request, work-order, and dispatch flows be designed around now — disclosures, notice, record-keeping, tenant-data handling?
4. **Contractor agreement:** Will you review the **form** of the contractor agreement (structure, required records, documentation trail)? What should it contain to be sound for property/build work?
5. **Records & disputes:** Do the records these systems keep (tenant interactions, maintenance, work orders) meet what you'd want to see if a dispute or claim arose?
6. **Referral:** Can you refer Darrell to an **employment-and-labor attorney** for the 1099-vs-employee classification question (explicitly out of scope for you)?
7. **Anything we're missing:** From where you sit, what real-estate legal issue should be on this list that isn't?

---

## 6. What we are NOT asking you to do

- We are **not** asking you to opine on worker classification (employment law — §4).
- We are **not** asking you to approve anything to be built, bought, or executed today. Nothing has been built or purchased; no money has moved.
- We are **not** asking for a rush. This is a request for your read and direction at your pace.

---

## 7. Decision record + rationale

Per `feedback-decisions-with-rationale`. Full DR in `docs/decisions/INDEX.md`.

| # | Decision | Rationale |
|---|---|---|
| **DR-0026** | Route the **real-estate / Poe Properties flows** and the **contractor-agreement form** to Trevor; **explicitly exclude worker classification** (employment law) from his scope; request a referral to employment counsel. | Trevor is real-estate counsel; the property flows and the agreement form are in his lane, while 1099-vs-employee classification is an employment/labor determination with its own tests and Illinois-specific rules that belongs to a different specialist. Stating the boundary plainly prevents misrouting a high-liability question. |

---

*Prepared for legal review. This document is a plain-language summary of a plan; it is not itself legal advice and does not create an attorney-client relationship by its preparation.*
