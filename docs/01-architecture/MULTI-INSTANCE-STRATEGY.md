# Multi-Instance Strategy — Family OS as a sellable platform

PoeTech's path from "the Poe family's app" to "a platform any family / small business / church / therapy practice / construction co. / nonprofit can adopt." Three phases. No phase requires the next to start working.

---

## Vision

**One codebase, many instances.** Each customer (family, business, church, etc.) runs their own copy with their own brand, their own data, their own modules enabled. The platform underneath is identical; the experience on top is tailored. Feedback flows back to PoeTech central so every customer's friction shows up in the data that drives the roadmap. Continuous improvement powered by real use, not guesswork.

---

## Phase 1 — Multi-instance shape, local-first (NOW · $0)

**Status:** Ships in the current PWA. No new dependencies, no backend, no cost.

### What ships
- **`data.instance` config object** — `{ brandName, instanceType, accentColor, enabledModules, welcomeMessage, primaryContactEmail }`. Persists with the rest of the local data.
- **Header reads `brandName`** instead of hardcoded "PoeTech · Family OS."
- **Six instance templates** at first-run picker:
  1. **Family** — Big Picture, Books, Debts, Real Estate, Church, Calendar reminders. Default.
  2. **Small Business** — Books, Debts, Projects, Dev/Ops, Scope, 1099 tracking. Hides Real Estate + Practice + Church by default.
  3. **Church / Ministry** — Books (donation tracking), Calendar (services + events), Practice (volunteer / member care, non-PHI), Dev/Ops portfolio. Real Estate optional (for property-owning ministries).
  4. **Therapy Practice** — Books, Practice (inquiry pipeline), Calendar, Scope (MSW contractors), Capacity. Real Estate hidden by default.
  5. **Trades / Construction** — Books, Real Estate (jobs-by-property), Projects, Scope (materials-paid-by policy), Inventory. Practice hidden.
  6. **Nonprofit** — Books (donor / fund tracking), Calendar (events + board cycles), Practice (volunteer / client capture, non-PHI), Scope. Real Estate optional.
- **About → Instance Settings** section lets the user edit their config any time + swap templates.
- **Module enable/disable** — uncheck a module in Instance Settings → its tab hides from the nav. Eliminates noise to relevance.

### Persistent feedback (also Phase 1)
- **Floating feedback button** in the corner of every page (in addition to header). One tap, current view pre-filled.
- **Feedback Log** in About gets a real lifecycle: `new` → `reviewed` → `planned` → `shipped` / `won't-fix` / `parked`. Internal notes (PoeTech side) + reply (visible to submitter). Closes the customer-service-score loop.

### Cost
- **$0.** Pure PWA work. No new dependencies. Sustainability rule held.

### Sequencing
- Ship into the current MVP alongside everything else. Existing Poe family instance gets `instanceType: 'family'` + `brandName: 'PoeTech · Family OS'` so nothing visible changes for the current user; new customers pick a template at first run.

---

## Phase 2 — Backend feedback ingestion (when Voice Ops deploys · $0 additional)

**Status:** Builds on the Voice Ops Cloudflare Worker stack (~$10/mo for Phase 1 Voice Ops; Phase 2 of multi-instance reuses the same Worker, same D1, $0 incremental).

### What ships
- **New D1 table** `feedback_inbox` — same Cloudflare DB as Voice Ops, separate table.
- **Worker endpoint** `POST /feedback` — PWA pushes feedback here (in addition to local save) when the instance is configured against a Worker URL.
- **PWA `feedback_endpoint` config** under About → Instance Settings — opt-in. Customers who don't configure stay 100% local.
- **PoeTech admin instance** (Business tier + special `isAdmin: true` flag) gets a "Customer Feedback Inbox" section in About showing every feedback note received across all instances.
- **Lifecycle sync** — when PoeTech admin moves a feedback row to `shipped` with a reply, the customer's instance polls and shows the reply next time it opens.

### What stays local-first
- All operational data (books, transactions, properties, inquiries) **never leaves the device** unless the customer separately opts into cross-device sync.
- Only feedback (which the customer chose to send) and lifecycle updates (which they chose to receive) move through the Worker.

### Cost
- **$0 incremental.** Cloudflare Workers + D1 free tier covers it; feedback volume is tiny vs. voicemail volume.

---

## Phase 3 — Full multi-tenant SaaS (when paying customers exist · ~$0–25/mo at scale)

**Status:** Requires real paying customers. Don't build until they're knocking.

### What ships
- **Per-instance authentication** — each instance has a unique `instance_id` issued at signup.
- **Row-level data isolation** — each customer's data lives under their `instance_id` namespace; impossible for one customer to see another's data.
- **Cross-device sync** — opt-in cloud sync for PoeTech+ subscribers. PWA's local-first storage stays the working copy; backend is source of truth across devices.
- **Cross-instance anonymized analytics** — PoeTech sees aggregate patterns ("70% of property managers ask for X next"), never individual data.
- **Admin dashboard** — PoeTech can see customer health (last-active, feature usage, churn signals), MRR, support backlog.
- **Subscription / billing** — Stripe integration. Tier changes flow from Stripe webhook → Worker → instance config.

### Cost
- Cloudflare D1: still mostly free until ~50 customers at heavy usage. Scales linearly after.
- Stripe: 2.9% + $0.30 per transaction (industry standard, unavoidable).
- Total ceiling: ~$25/mo at 100 customers, mostly Stripe fees.

### Sequencing
- Don't build until: (a) paying customers exist and (b) Phase 1 + 2 have shipped to a real demo / SME group and the feedback validates the product direction.

---

## Sustainability check (per Poe Family operating rule)

| Phase | New paid dependency | Monthly cost |
|---|---|---|
| Phase 1 | None | $0 |
| Phase 2 | None (reuses Voice Ops Worker) | $0 incremental ($10 for Voice Ops Phase 1 itself) |
| Phase 3 | Stripe (only at scale) | ~$0–25 depending on customers |

No phase adds cost until it adds matched value. Rule held.

---

## HIPAA boundary across phases

- **TLC routes** stay isolated from any Cloudflare/Twilio chain that doesn't have a BAA — confirmed in Voice Ops Phase 1 + carries through here.
- **Any instance with `instanceType: 'therapy-practice'`** auto-flags the user that the Practice tab should NEVER store PHI in this system (Acuity remains system of record).
- **Phase 3 multi-tenant** must use a BAA-covered Cloudflare Enterprise plan for any therapy-practice customer that wants cross-device sync. Until that's negotiated, therapy-practice customers stay local-first only.

---

## Why this order

**Phase 1 first** because: it ships now, free, and lets us hand the platform to SMEs / friends / pilot customers immediately. They run their own instance, give us feedback, we learn what to build.

**Phase 2 next** because: feedback is the most important data flowing back from customers. Lower-volume than voicemails, simpler scope, reuses infrastructure we already need to deploy for Voice Ops.

**Phase 3 last** because: full multi-tenant is real engineering investment + ongoing compliance work. Only worth it once paying customers prove the value. Until then, the local-first per-instance model is functionally identical from the customer's perspective; the only difference is whether PoeTech can centrally see usage data (which they don't need yet — feedback covers it).

---

## What this enables strategically

1. **Sell the platform to the underserved-markets list in About** (adult children caring for aging parents, kinship caregivers, foster families, reentry, single-parent biz owners, Black contractors, farmers, churches, IEP families, gig workers). Each gets a tailored instance type.
2. **Continuous improvement powered by feedback**, not by Darrell's hunches. The customer-service-score loop becomes the roadmap.
3. **Aggregate-but-anonymous patterns** become PoeTech's competitive moat. We see what real families struggle with; competitors don't.
4. **Per-instance branding** lets churches / nonprofits / small businesses present the system as part of their own offering. The PoeTech engine powers it; the customer's name is on it. (See: white-label / OEM patterns.)

This is the architecture that turns the Poe family's stronghold into thousands of strongholds.
