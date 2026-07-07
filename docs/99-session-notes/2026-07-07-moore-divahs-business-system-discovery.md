# Moore Divahs — Business System Discovery (living spec)

**Date:** 2026-07-07
**Owner:** Shay (Darrell's sister) — fashion designer / sewing instructor
**Business:** Moore Divahs
**Primary inbound email:** mooredivahs1@yahoo.com
**Status:** DISCOVERY — captured live from Shay + Darrell. This doc is the single
source of truth for the build; it is appended to as more is spoken. Nothing
spoken is dropped (spoken input = build input).

> This is a Layer 4 working artifact. It feeds the build of the Moore Divahs
> surfaces inside the PoeTech PWA. Architecture decisions below are provisional
> until they land as code + tests + (where structural) a Decision Record.

---

## 1. The business in one line

Moore Divahs is a two-line business: (A) **custom-made apparel + accessories**
(custom clothing, scrub caps, custom shoes, group/bulk apparel like team
T-shirts) and (B) **sewing instruction** (group classes + one-on-one classes).
Shay brings the machines and materials to classes; students just show up.

## 2. Service line A — Custom Orders

**The flow, in Shay's words:**

1. **First contact** — comes in through **all socials** (Instagram, Facebook,
   TikTok) + **email** (mooredivahs1@yahoo.com). The customer opens by saying
   **what they want to order.**
2. **Design** — worked out **in the DMs.** Customers send **inspiration
   pictures.** Sizing: **out-of-town customers tell Shay their size**; **local
   customers come in person for measurements.** How it's cut depends on **the
   fabric.**
3. **Quote** — priced **per item**, depends on what it is. **Materials are
   included in the price.**
4. **Payment** — **paid in full, up front.** Methods: **Square, Venmo, Apple
   Pay.** (The app never processes payment — money is the owner's hand. See §7.)
5. **Production** — **3-week turnaround** quoted to everyone. Clock starts at
   payment.
6. **Delivery** — **both**: **ship** for out-of-town, **local pickup** for
   nearby.
7. **Follow-up** — customers come back. Shay likes to check in ("how'd you like
   it?") and **ask for photos** (social proof / testimonials) if they don't mind.

**Order stages (provisional pipeline):**
`inquiry -> designing -> quoted -> paid -> in-production -> ready -> delivered -> follow-up`
(+ terminal `declined` / `cancelled`). "paid" and beyond = won.

### 2a. The bulk / group apparel order form (worst current pain)

Shay's **worst intake experience**: a customer sent a **20-25 page Google Doc**
for a group T-shirt order; she had to dig through pages to find each name, size,
and color. The far better format is a **structured line-item form**:

- Line item = **quantity x garment cut (adult / youth / kids) x size x color**
- Plus the **roster of names** to print per line (e.g. "6 adult medium blue +
  [names]", "6 youth red + [kid names]").

**Requirement:** a bulk-apparel order form that captures qty / cut / size /
color / per-name roster as structured data — never free-form prose she has to
parse. This directly kills the Google-Doc headache and feeds a clean production
pick-list.

## 3. Service line B — Sewing Classes

Each class is a **different project each time.** Shay **brings the sewing
machines + all materials** — students just show up and create (a real selling
point; say it on the sign-up).

| | **Group class** | **One-on-one class** |
|---|---|---|
| **Price** | **$45** per class | **$75** for a **2.5-hour** session |
| **Seats** | **Hard cap 10** (so she can control the classroom) | 1 |
| **Booking window** | Dates set **~1 month ahead**; customers book a seat in that window | Must be scheduled **>= 2 weeks out** from date of need |
| **Payment** | **In advance to HOLD the seat** (seat not held until paid) | In advance |
| **Location** | **Varies** — different locations; **Shay travels** depending on distance | Same |
| **Pay methods** | Square / Venmo / Apple Pay | Same |

**Group classes are the highest-volume / best seller** — "who doesn't want to
bring a friend, a mother bringing a son, or her daughters." Prioritize the group
path in UX and in marketing recommendations.

**Requirement:** a Classes board = a calendar of scheduled sessions. Each shows
date, format, this-session's project, **seats left (real: X of 10, from paid
bookings only)**, price, location, and register-to-hold. Seat is only held on
recorded payment.

## 4. Marketing / acquisition channels

- Instagram, Facebook, TikTok (DMs), email.
- **"What's Going On QC"** — local Quad Cities / Champaign-Urbana community
  events posting (a real inbound channel).
- **Partner businesses** — other businesses **support + share** her work
  (cross-promotion / referral). Track partner-sourced leads.

These become the **source attribution** list on the CRM (so we learn which
channel drives the most revenue — see §6).

## 5. Inventory + cost

Shay already holds **inventory at home**. She needs to:
- Track **what she has on hand**,
- Track **what she spends** on materials, and
- Track **inventory consumed / lost** per order.

This feeds a **cost analysis**: material cost + processor fees + (eventually)
time -> **profit per order / per class / per product line.** Ties to the
existing `commerce.js` unit-economics screen. Inventory is a cost input to the
KPI/profitability engine (§6).

## 6. Historical account + KPIs (the north star of the data)

Darrell: keep a **historical account of how the business flows** so we can track
**KPIs**, learn **what is most profitable**, and **market the best-monetary
things.** Critically: **Shay picks what she wants her data to look like based on
how much money she wants to gain** — i.e. **set a revenue goal, and the system
shows the mix of work (which items, which class type, which channel) that gets
her there.**

- Every order, class booking, and change is a **real historical record** (no
  painted numbers — DR-0076).
- KPIs: revenue by product line, revenue by channel, group-vs-1:1 class revenue,
  repeat-customer rate, average order value, margin per line (with inventory
  cost), change-order frequency.
- **Goal-driven planning:** Shay enters a revenue target; system recommends the
  highest-return focus (e.g. "group classes + team-shirt orders get you there
  fastest"). This is data-as-empowerment, not extraction — her data, her goal,
  her choices (foundation: DATA-AS-EMPOWERMENT, QUALITY-OF-LIFE).
- Language guard: we help her **optimize toward** outcomes with real data; we do
  not "guarantee" outcomes (truthful-claims guardrail).

## 7. Payment posture (binding, inherited)

The app **does not process payments or move money** (checkout-seam / commerce
binding rule). Shay collects via **Square / Venmo / Apple Pay** (her hand). The
system: records what was quoted, records paid/unpaid status + method + date,
computes change-order fees and cost/margin, and holds class seats on recorded
payment. It never handles card details or moves money.

## 8. Change-order deterrent (design question — opportunities + constraints)

**Darrell's intent:** once an order is placed (+ paid) and a timeline is given,
it is **locked**. A change requires a **change order** that costs **a lot** (he
floated 50%-100% of the order) — a deliberate **price deterrent** so changes
essentially don't happen; and if one does, the fee must make it **worth Shay's
while** ("makes Shay excited to change the order"), not just an uncompensated
inconvenience.

### Opportunities
- **Protects real sunk cost** — fabric is bought per-order and cut; a change can
  waste materials + force re-work. The fee moves that cost to the person who
  caused it, not Shay.
- **A clean "lock" moment** kills negotiation-by-DM and sets expectations up
  front (pairs with the whole "stop digging through inboxes" goal).
- **Stage-based ladder makes it FAIR + defensible** (see below) instead of
  arbitrary — the fee tracks actual loss at the moment of the change.
- **Turns a disruption into a payday** — if the fee genuinely compensates
  re-work + rush + materials, a change becomes worth doing.
- **Data** — every change-order request is logged -> KPI on how often changes
  happen, by customer / item -> tells us whether to tighten the intake form.

### Constraints (must design around)
- **Attribution / whose fault** — a change caused by **Shay's error** (cut
  wrong) must NOT charge the customer. A change order needs a **reason**:
  `customer-requested` (fee applies) vs `shop-error` / `supplier-issue` (no
  customer fee). Only customer-requested changes carry the deterrent.
- **Goodwill / relationship** — a flat 100% fee on a repeat customer or a
  trivial fix (name spelling before anything is cut, $0 real cost) burns the
  relationship. Religion AND relationship: the fee must be **proportional to
  real disruption**, with grace for no-cost pre-production fixes.
- **Up-front consent** — the deterrent only works, and only stays fair, if the
  customer **agreed to the change/cancel policy at checkout** (an accepted
  acknowledgment). Otherwise it reads as bait-and-switch. This also protects
  Shay.
- **No payment processing by us** — the app **computes + presents** the
  change-order fee and records that a change happened; **Shay collects** it her
  way. The system never moves the money.
- **"Locked" needs a crisp, staged trigger** (below) — "placed" alone is too
  blunt because materials aren't bought/cut for a few days.
- **Cancel vs change are siblings** — since she takes **full payment up front**,
  the **cancellation/refund** policy is the mirror of the change policy and
  should be defined together.

### Recommended shape (stage-based change-fee ladder)
| Order stage at time of change | Real loss | Change fee (recommended default; Shay sets exact %) |
|---|---|---|
| **Placed, materials not yet bought** | ~none | **Free** (grace window) or small admin fee |
| **Materials bought, not cut** | materials | **Materials cost + admin fee** |
| **Cut / in-production** | materials + labor | **High — 50-100% of order** (Shay's call) |
| **Ready / delivered** | complete | **No change — it's a NEW order** |

Every change order records: reason (attribution), stage at change, computed fee,
Shay's final fee, and whether the customer accepted. Feeds §6 KPIs.

*(Open for Darrell/Shay: confirm the default percentages and the grace window.)*

## 9. Architecture direction (provisional — verify before/while building)

- **Lead acquisition MUST ride the ONE-CRM backbone** (DR-0081 / ONE-CRM,
  enforced by `crm-single-engine-guard.mjs`). Moore Divahs becomes a **new
  BUSINESS + PIPELINE(s)** in `app/src/lib/crm-engine.js`, capturing through the
  `crm_capture_lead` RPC — **not** a second CRM / new leads table. Source list
  gains: instagram, facebook, tiktok, email, whats-going-on-qc, partner-business.
- **Order fulfillment / production, classes, inventory** are **separate domains**
  (not acquisition CRM) and get their own instance-scoped, RLS-safe tables +
  sync adapters + surfaces, modeled on the `board_tasks` / CRM three-file pattern
  (pure model lib + sync adapter + component). These do not trip the CRM guard
  (they are not leads/pipeline/funnel tables) — but confirm naming.
- **Tenancy:** Moore Divahs is its own **instance** (Shay signs in, sees only her
  data; RLS via `user_role_in_instance`). Every new table declares `instance_id`
  + RLS or the tenancy guard fails the build.
- **Payments:** owner's hand (§7) — reuse `commerce.js` for unit economics; no
  new payment processing.
- **Register surfaces** in `app/src/surfaces.js` (lazy load + named export) +
  wire tab/render/gate in `poe-financial-mvp-v28.jsx`.
- **Tests:** model + sync round-trip + render for each surface, in
  `app/src/__tests__/`.

**Provisional build order:**
1. Order Board (custom orders pipeline + 3-week clock + paid/production/delivery
   stages) — the biggest daily headache first.
2. Bulk-apparel structured order form (kills the Google-Doc pain) feeding it.
3. Classes board + seat-holding sign-ups (group cap 10 / one-on-one).
4. Inventory + cost inputs.
5. Change-order engine (stage-based ladder + attribution + consent).
6. KPI / historical account + revenue-goal planner (rides real records from 1-5).
7. The single public intake link feeding orders + class sign-ups (CRM capture).

## 10. Open items to confirm
- Change-order default percentages + grace window (§8).
- Exact social handles (IG / FB / TikTok) for the intake link + follow-ups.
- Business name confirmed as "Moore Divahs"; email confirmed mooredivahs1@yahoo.com.
- Whether Moore Divahs is a standalone instance vs a sub-area of the family
  instance (recommend standalone instance for Shay).
