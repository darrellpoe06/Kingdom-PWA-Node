---
id: DR-0009
title: First-party data + sovereign identity layer; we do not sell data
date: 2026-06-09
status: accepted
supersedes: []
superseded-by: null
tier: C
entities: [church, tlc, poetech]
grounds: [NO-DATA-SALE, SOVEREIGN-IDENTITY, TLC-FIREWALL, ALIGNED-FUNDING, DATA-DRIVEN-LIVING]
source: 2026-06-08 church-LLM research-review (item I)
---

## Context
Darrell: "email and user logins that let us pull the most useful data for our business purposes — we do NOT want to sell data, we DO need it to make better decisions continuously." The loops are only as good as the signals feeding them.

## Decision
Stand up a **sovereign email + user-login/SSO layer** — self-hosted IDP (Authentik / Keycloak / Zitadel options), token isolation + permission gates, **no external proprietary identity dependency in the core**. **BINDING PRINCIPLE: we do not sell data.** First-party data is captured **with consent**, used **INTERNALLY only** for continuous decision-making and opportunity-spotting; never sold, no engagement-extraction, no ad model, no dark UX; deletion immediate + verifiable. Per-entity: **TLC email/logins are PHI-adjacent → ISO-1, ZERO PHI in any analytics or decision dataset, ever** (a portal's PHI is walled off from all decisioning); Church (member engagement signals, internal); PoeTech (product signals, adoption/funnel).

## Rationale
Because the email/login signals are precisely what let the LLMs "make better decisions continuously" ([DR-0004], [DR-0008]) — and the structural refusal to sell is the moat, funded instead by products + aligned-brand sponsorship.

## Consequences
Primary input to [DR-0004] and [DR-0008]; lives in the sovereign loop ([DR-0005]); the TLC firewall holds in the data layer too.

## Links
[DR-0003], [DR-0004], [DR-0005], [DR-0008], research-review §7.
