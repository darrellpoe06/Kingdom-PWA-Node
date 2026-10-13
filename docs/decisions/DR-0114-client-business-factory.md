# DR-0114 — The client-business factory: Moore Divahs' one-night build becomes the standing onboarding model for all clients

- **Status:** accepted
- **Tier:** B (an operating-model foundation + a build program; each client's front door remains Tier C with that client)
- **Scope:** onboarding every client business onto PoeTech; the business registry machinery; the six-step lifecycle
- **Date:** 2026-07-07
- **Principles:** COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, GOVERN-EXECUTE-ADVISE, VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DECISION-RECORDS

## Directive

Darrell, 2026-07-07, the morning after the Moore Divahs build (discovery → deployed business system in one night, PRs #645–#653): *"I want to run this like I will need to moving forward with all clients — how will that work and we need that asap."*

## Decision

Adopt `docs/00-foundations/_root/CLIENT-BUSINESS-FACTORY.md` (Layer 3) as the standing client-onboarding operating model:

1. **The six-step lifecycle is the process for every client:** discovery-in-their-words → build board at kickoff (DR-0113) → their own tenant → their pipeline as ONE-CRM config (DR-0081) → their branded door (policies at point of order; public faces only; forced-safe RPCs) → their steward board + honest KPIs. Every step through the delivery lane with proofs (DR-0103/0107/0104).
2. **Build the BUSINESS REGISTRY machinery next:** brand/tabs/pipeline/policies/door-slug as a data record rendered by one generic BusinessDoor (`?biz=<slug>`); Moore Divahs converts to the first registry row (`?moore=1` remains an alias). A new client's door becomes a registry row, not a new component — the no-fork rule extended from the CRM to the whole storefront layer.
3. **The governor's hand is never automated:** commercial terms/build pricing, brand assets, DNS, access grants, and the per-client Tier C front-door sign-off.

## Consequences

- Client #2's clock: discovery (an hour) → registry row + pipeline config (minutes) → domain tables only if the business genuinely differs (0059 recipe) → door live same day behind the lane → Tier C review with the client before a domain points.
- The `board-client-factory` build board ships with this DR (Projects → ▦ Boards) carrying the machinery items with honest statuses.
- Every client door cross-carries the family of businesses + PoeTech pricing — the union-attribution data (source per door) measures the network effect from day one.
