# CLIENT-BUSINESS-FACTORY — the repeatable client-onboarding operating model

**Declared by Darrell 2026-07-07:** *"I want to run this like I will need to
moving forward with all clients — how will that work, and we need that asap."*
The Moore Divahs build (discovery → deployed business system in one night,
PRs #645–#653) is the PROTOTYPE. This document makes it the FACTORY: the
standing process every client business rides, and the machinery that makes
client #2 a day's work instead of a night's.

Recorded as DR-0114. Layer 3 foundation. Pairs with: DR-0113 (board at
kickoff), DR-0081/ONE-CRM (pipeline as config, never a fork), DR-0103 (the
delivery lane), DR-0104 (review the live push), COMMUNITY-FIRST-MISSION and
DATA-AS-EMPOWERMENT (who this serves and how).

---

## The seven-step client lifecycle (each step has a proven artifact)

1. **DISCOVERY — the client talks, we capture.** A 30–60 minute conversation
   OR — the standing lane (DR-0117) — **their imported voice notes / an
   LLM-guided conversation**, transcribed on the NAS rails and extracted per
   `infra/nas-sme-pipeline/client-discovery-json-prompt.md` into reviewable
   requirements (every item carries the client's own `source_quote`;
   `status='extracted'` until a steward confirms — nothing unreviewed is
   built). Darrell does not need to be in the room. Capture their flow into a
   dated session note (Layer 4): services, pricing, policies, channels, worst
   pain point. Their existing materials (flyers, forms) are SOURCE — their
   words are senior (Moore proof: the flyer became MOORE_POLICIES verbatim).
2. **QUOTE + THE DEPOSIT GATE (DR-0117).** Small no-overhead segment:
   **$2,000 minimum, 90 days same as cash** — $500 deposit to start, $500 at
   MVP delivery, the balance over the rest of the 90 days (no interest, ever),
   or paid in full up front. **No deposit recorded → no build starts**
   (`client-engagements.js` `canStartBuild()` — structural, not a habit).
   Larger/complex builds quote UP from the minimum; the number is always
   Darrell's. After the build is paid: **$150/mo perpetual support through the
   Feedback portal**; beyond-portal asks re-enter the front door as a new
   engagement at the minimum. Payments are recorded, never processed — money
   moves by the owner's hand (Moore §7). Data is exportable regardless of
   payment state — never a collection lever.
3. **BOARD AT KICKOFF (DR-0113).** The client's build board lands in
   Projects → ▦ Boards in the same session as the spec — honest statuses,
   least-human ownership, flipped as increments ship. The governor watches
   every client build from inside the app.
4. **THEIR TENANT.** A dedicated instance; every table row instance-walled by
   RLS (the tenancy guard enforces it structurally). Their data is theirs:
   exportable, never sold, never cross-read (DATA-AS-EMPOWERMENT).
5. **THEIR PIPELINE ON THE ONE CRM (DR-0081).** A BUSINESSES + PIPELINES
   config entry — never a second CRM. Their sources join SOURCES; every
   capture from their door carries source attribution, so cross-referral
   inside the family of businesses ("the union data") is visible from day one.
6. **THEIR BRANDED DOOR.** Their name FIRST; their policies rendered at the
   point of order (the up-front consent everything else rests on); classes /
   services with honest availability; client sign-in with their-own-history
   (the 0087 read-own lane pattern); the family-of-businesses tabs + PoeTech
   pricing behind them; installable under their name (per-business manifest).
   Public faces only — anon interactions ride forced-safe RPCs, never tables.
7. **THEIR STEWARD BOARD + KPIs.** The operating surface: pipeline, real
   revenue/margin/repeat numbers, the revenue-goal planner ("what do you want
   to make?" → ranked lanes from THEIR real history). Optimize-toward
   language, never guarantees (DR-0100 posture).

Every step ships through the standing lane: tests + gates → auto-merge on
green → deploy PROVEN (DR-0107) → migrations verified in the ledger → the
live user-view review (DR-0104).

## The machinery (what makes it ASAP for client #2+)

- **The BUSINESS REGISTRY (to build — the next increment).** Brand, tab
  allow-list, pipeline key, policies, and door slug as a DATA record; ONE
  generic BusinessDoor renders any registered business at `?biz=<slug>`
  (Moore Divahs converts to the first registry row; `?moore=1` stays as an
  alias). A new client's door = a registry row, not a new component.
- **Domain tables only where the business genuinely differs.** Moore needed
  custom_orders/class tables; a service business may ride existing rails.
  New tables follow the 0059 recipe verbatim (instance_id, GRANT
  authenticated, no anon, four policies, realtime) — the guards enforce it.
- **The customer-history lane** (0087 pattern): read-your-own via uid or
  verified sign-in email — reusable per business.
- **Playbook clock:** discovery (hour) → registry row + pipeline config
  (minutes) → domain tables if needed (an increment) → door live behind the
  lane (same day) → Tier C review with the client before their domain points.

## What is ALWAYS the governor's hand (never automated)
- Commercial terms: contracts and real money stay Darrell's hand. The SMALL
  no-overhead segment's standing terms are DECLARED (DR-0117: $2,000 min,
  90 days same as cash, $150/mo Feedback-portal support) and the price-out
  renders them; larger/complex builds still quote UP from the minimum by
  Darrell's word. Collection is always the owner's hand — never automated.
- The client's brand assets (icon, handles) and DNS.
- Access grants (allowlist / steward seats) and the Tier C front-door
  sign-off with the client (RELEASE-TIERS).

## The mission frame
This is COMMUNITY-FIRST made commercial: businesses the mainstream industry
overlooks get a sovereign system with their name on the door, their data in
their hands, and a family of businesses behind them — serve-not-extract
pricing, no lock-in, and every client door cross-strengthens the others.
We all win. And we create.
